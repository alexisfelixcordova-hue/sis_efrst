<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AsistenteController extends Controller
{
    /**
     * Qué datos del sistema puede conocer el asistente.
     * Solo CONTEOS (nunca nombres, DNIs, notas ni contraseñas).
     *
     * 'modelo'   => clase del modelo en app/Models (si no existe, se omite sin romper nada)
     * 'etiqueta' => cómo lo llama el asistente
     * 'agrupar'  => columnas por las que se desglosa el conteo, si existen en la tabla
     *               (por ejemplo: cuántos pendientes, cuántos validados)
     */
    private array $fuentes = [
        ['modelo' => \App\Models\Estudiante::class,       'etiqueta' => 'estudiantes',            'agrupar' => ['estado', 'carrera', 'programa_estudios', 'periodo', 'semestre']],
        ['modelo' => \App\Models\Empresa::class,          'etiqueta' => 'empresas',               'agrupar' => ['estado']],
        ['modelo' => \App\Models\Modulo::class,           'etiqueta' => 'módulos profesionales',  'agrupar' => []],
        ['modelo' => \App\Models\Expediente::class,       'etiqueta' => 'expedientes',            'agrupar' => ['estado']],
        ['modelo' => \App\Models\ConstanciaEmitida::class,'etiqueta' => 'constancias emitidas',   'agrupar' => ['estado']],
        ['modelo' => \App\Models\AsignacionAsesor::class, 'etiqueta' => 'asignaciones de asesores','agrupar' => ['estado']],
        ['modelo' => \App\Models\EvidenciaEfsrt::class,   'etiqueta' => 'evidencias EFSRT',       'agrupar' => ['estado']],
    ];

    /**
     * Listas que Laravel responde DIRECTAMENTE desde la base de datos
     * (sin enviar nada a Gemini). Se activan con preguntas como
     * "dime quiénes son los estudiantes" o "lista de empresas".
     *
     * 'palabras' => cómo puede nombrarlo la persona
     * 'columnas' => columnas a mostrar, si existen en la tabla (NO incluye DNI)
     */
    private array $listables = [
        [
            'modelo'   => \App\Models\Estudiante::class,
            'etiqueta' => 'estudiantes',
            'palabras' => ['estudiantes', 'estudiante', 'alumnos', 'alumno'],
            'columnas' => ['nombres', 'apellidos', 'nombre', 'apellido_paterno', 'apellido_materno', 'carrera', 'programa_estudios', 'estado'],
        ],
        [
            'modelo'   => \App\Models\Empresa::class,
            'etiqueta' => 'empresas',
            'palabras' => ['empresas', 'empresa', 'convenios', 'convenio'],
            'columnas' => ['razon_social', 'nombre', 'ruc', 'estado'],
        ],
    ];

    private int $limiteLista = 20;

    public function chat(Request $request)
    {
        // Más tiempo para PHP que el timeout de la llamada a Gemini
        set_time_limit(90);

        $request->validate([
            'mensaje'   => 'required|string|max:1000',
            'historial' => 'array|max:20',
        ]);

        // Preguntas tipo "dime quiénes son": Laravel responde solo, sin enviar datos a Gemini
        $lista = $this->responderLista((string) $request->mensaje);
        if ($lista !== null) {
            return response()->json(['success' => true, 'respuesta' => $lista], 200);
        }

        // Historial de la conversación + la pregunta nueva
        $contenido = [];
        foreach ($request->historial ?? [] as $m) {
            $contenido[] = [
                'role'  => ($m['rol'] ?? '') === 'user' ? 'user' : 'model',
                'parts' => [['text' => (string) ($m['texto'] ?? '')]],
            ];
        }
        $contenido[] = ['role' => 'user', 'parts' => [['text' => $request->mensaje]]];

        $modelo = env('GEMINI_MODEL', 'gemini-flash-lite-latest');

        try {
            $respuesta = Http::withHeaders(['x-goog-api-key' => env('GEMINI_API_KEY')])
                ->timeout(20)
                ->retry(2, 1500, throw: false)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$modelo}:generateContent", [
                    'systemInstruction' => ['parts' => [['text' => $this->instrucciones()]]],
                    'contents' => $contenido,
                ]);
        } catch (\Throwable $e) {
            Log::error('Gemini sin conexión', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'No pude comunicarme con el asistente, intenta en un momento',
            ], 502);
        }

        if ($respuesta->failed()) {
            Log::error('Gemini falló', [
                'status' => $respuesta->status(),
                'body'   => $respuesta->body(),
            ]);

            $mensaje = $respuesta->status() === 503
                ? 'El asistente está con mucha demanda, intenta de nuevo en un momento'
                : 'El asistente no está disponible ahora, intenta en un momento';

            return response()->json([
                'success' => false,
                'message' => $mensaje,
            ], 502);
        }

        return response()->json([
            'success'   => true,
            'respuesta' => $respuesta->json('candidates.0.content.parts.0.text')
                ?? 'No pude generar una respuesta, intenta reformular la pregunta.',
        ], 200);
    }

    /**
     * Si el mensaje pide una LISTA (quiénes, lista, nombres...) de algo configurado en
     * $listables, la arma con la base de datos y la devuelve. Si no, devuelve null
     * y la pregunta sigue a Gemini.
     */
    private function responderLista(string $mensaje): ?string
    {
        $texto = Str::ascii(mb_strtolower($mensaje));

        // "cuántos..." es una pregunta de cantidad, la responde la IA con los conteos
        if (str_contains($texto, 'cuant')) {
            return null;
        }

        $palabrasDeLista = ['quienes', 'quien', 'lista', 'listado', 'nombres', 'nombre', 'muestra', 'muestrame', 'mostrar', 'ver', 'dime', 'cuales', 'cual'];
        if (!$this->contienePalabra($texto, $palabrasDeLista)) {
            return null;
        }

        foreach ($this->listables as $l) {
            if (!$this->contienePalabra($texto, $l['palabras']) || !class_exists($l['modelo'])) {
                continue;
            }

            try {
                $clase = $l['modelo'];
                $tabla = (new $clase)->getTable();

                $columnas = array_values(array_filter(
                    $l['columnas'],
                    fn ($c) => Schema::hasColumn($tabla, $c)
                ));

                if (!$columnas) {
                    return "No pude armar la lista de {$l['etiqueta']}: no encontré las columnas esperadas. "
                         . 'Las columnas de la tabla son: ' . implode(', ', Schema::getColumnListing($tabla)) . '. '
                         . 'Ajusta la lista $listables en AsistenteController.';
                }

                $total = $clase::query()->count();
                if ($total === 0) {
                    return "No hay {$l['etiqueta']} registrados todavía.";
                }

                $filas = $clase::query()->select($columnas)->limit($this->limiteLista)->get();

                $lineas = [];
                foreach ($filas as $i => $fila) {
                    $partes = [];
                    foreach ($columnas as $c) {
                        $v = trim((string) $fila->{$c});
                        if ($v !== '') {
                            $partes[] = $v;
                        }
                    }
                    $lineas[] = ($i + 1) . '. ' . implode(' - ', $partes);
                }

                $cabecera = $total > $this->limiteLista
                    ? "Hay {$total} {$l['etiqueta']}. Te muestro los primeros {$this->limiteLista}:"
                    : "Hay {$total} {$l['etiqueta']}:";

                return $cabecera . "\n" . implode("\n", $lineas);
            } catch (\Throwable $e) {
                Log::warning('Asistente: no se pudo armar la lista', ['error' => $e->getMessage()]);
                return null;
            }
        }

        return null;
    }

    /**
     * Dice si el texto contiene alguna de las palabras, tolerando errores de tipeo
     * (por ejemplo "estudianets" cuenta como "estudiantes").
     */
    private function contienePalabra(string $texto, array $palabras): bool
    {
        $tokens = preg_split('/[^a-z0-9]+/', $texto, -1, PREG_SPLIT_NO_EMPTY);

        foreach ($tokens as $token) {
            foreach ($palabras as $palabra) {
                $largo = strlen($palabra);
                // palabras cortas: exactas; medianas: 1 error; largas: hasta 2 errores
                $tolerancia = $largo <= 4 ? 0 : ($largo <= 7 ? 1 : 2);

                if ($token === $palabra || ($tolerancia > 0 && levenshtein($token, $palabra) <= $tolerancia)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Texto de instrucciones que recibe la IA en cada pregunta.
     * Aquí puedes agregar las reglas del proceso EFSRT (requisitos, plazos, pasos).
     */
    private function instrucciones(): string
    {
        return
            'Eres el asistente virtual del sistema EFSRT del IESTP Andrés Avelino Cáceres Dorregaray. ' .
            'Ayudas a docentes y coordinadores a usar el sistema (estudiantes, empresas, expedientes, constancias, perfil, contraseña). ' .
            'Responde en español, de forma breve y clara. Si no sabes algo, dilo. ' .
            'Nunca pidas contraseñas ni inventes datos. ' .
            'Cuando te pregunten por cantidades, usa SOLO los datos de abajo y no inventes cifras. ' .
            "\n\n" . $this->datosDelSistema() . "\n\n" .
            'Si te preguntan por un dato que no está en esa lista (por ejemplo nombres o datos personales de una persona), ' .
            'explica que solo tienes acceso a cantidades generales y que, para ver listas, pueden pedir por ejemplo "lista de estudiantes" o "lista de empresas".';
    }

    /**
     * Arma un resumen con conteos reales de la base de datos.
     * Cada fuente va protegida: si un modelo o columna no existe, se omite sin romper el chat.
     */
    private function datosDelSistema(): string
    {
        $lineas = [];

        foreach ($this->fuentes as $fuente) {
            $clase = $fuente['modelo'];

            if (!class_exists($clase)) {
                continue;
            }

            try {
                $total = $clase::query()->count();
                $linea = "- {$fuente['etiqueta']}: {$total} en total";

                $tabla = (new $clase)->getTable();
                $desgloses = [];

                foreach ($fuente['agrupar'] as $columna) {
                    if (!Schema::hasColumn($tabla, $columna)) {
                        continue;
                    }

                    $grupos = $clase::query()
                        ->select($columna, DB::raw('count(*) as total'))
                        ->groupBy($columna)
                        ->limit(15)
                        ->get();

                    if ($grupos->isEmpty()) {
                        continue;
                    }

                    $partes = $grupos->map(function ($g) use ($columna) {
                        $valor = ($g->{$columna} === null || $g->{$columna} === '') ? 'sin dato' : $g->{$columna};
                        return "{$valor}: {$g->total}";
                    })->implode(', ');

                    $desgloses[] = "por {$columna} ({$partes})";
                }

                if ($desgloses) {
                    $linea .= '; ' . implode('; ', $desgloses);
                }

                $lineas[] = $linea . '.';
            } catch (\Throwable $e) {
                Log::warning('Asistente: no se pudo leer ' . $clase, ['error' => $e->getMessage()]);
            }
        }

        if (!$lineas) {
            return 'Datos actuales del sistema: no disponibles en este momento.';
        }

        return "Datos actuales del sistema (solo cantidades):\n" . implode("\n", $lineas);
    }
}