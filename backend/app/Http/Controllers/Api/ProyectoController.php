<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proyecto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProyectoController extends Controller
{
    private const ROL_ADMIN = 1; // roles.id_rol de "Administrador"

    /* ---------- Ayudas ---------- */

    private function esAdmin(Request $request): bool
    {
        return (int) $request->user()->id_rol === self::ROL_ADMIN;
    }

    // Lee de la vista v_proyectos (ya trae entidad, alumno, vencido y por_vencer)
    private function vista(Request $request)
    {
        $consulta = DB::table('v_proyectos');

        if (! $this->esAdmin($request)) {
            $consulta->where('id_usuario', $request->user()->getKey());
        }

        return $consulta;
    }

    private function fila(int $id)
    {
        return DB::table('v_proyectos')->where('id_proyecto', $id)->first();
    }

    private function autorizar(Request $request, Proyecto $proyecto): void
    {
        abort_unless(
            $this->esAdmin($request) || (int) $proyecto->id_usuario === (int) $request->user()->getKey(),
            403,
            'No tienes acceso a este proyecto.'
        );
    }

    private function reglas(Request $request, ?Proyecto $proyecto = null): array
    {
        $obligatorio = $proyecto ? 'sometimes' : 'required';
        $idEstudiante = $request->input('id_estudiante', $proyecto?->id_estudiante);

        $reglaEstudiante = [$obligatorio, 'integer', Rule::exists('estudiantes', 'id_estudiante')];
        if (! $this->esAdmin($request)) {
            // Un docente solo puede crear proyectos para alumnos que tiene asignados
            $reglaEstudiante[] = Rule::exists('asignacion_asesores', 'id_estudiante')
                ->where('id_docente', $request->user()->getKey());
        }

        $reglas = [
            'id_empresa'    => [$obligatorio, 'integer', Rule::exists('empresas_convenio', 'id_empresa')],
            'id_estudiante' => $reglaEstudiante,
            'id_modulo'     => ['nullable', 'integer', Rule::exists('modulos_profesionales', 'id_modulo')],
            // Un alumno no puede tener dos proyectos con el mismo título
            'titulo'        => [
                $obligatorio, 'string', 'max:150',
                Rule::unique('proyectos', 'titulo')
                    ->where('id_estudiante', $idEstudiante)
                    ->ignore($proyecto?->id_proyecto, 'id_proyecto'),
            ],
            'descripcion'   => ['nullable', 'string'],
            'estado'        => ['sometimes', Rule::in(Proyecto::ESTADOS)],
            'avance'        => ['sometimes', 'integer', 'between:0,100'],
            'fecha_limite'  => ['nullable', 'date'],
        ];

        if ($this->esAdmin($request)) {
            $reglas['id_usuario'] = ['sometimes', 'integer', Rule::exists('usuarios', 'id_usuario')];
        }

        return $reglas;
    }

    private function mensajes(): array
    {
        return [
            'id_estudiante.exists' => 'El alumno no existe o no está asignado a tu cargo.',
            'id_empresa.exists'    => 'La entidad elegida no existe.',
            'titulo.unique'        => 'Este alumno ya tiene un proyecto con ese título.',
            'estado.in'            => 'El estado debe ser: ' . implode(', ', Proyecto::ESTADOS) . '.',
            'avance.between'       => 'El avance debe estar entre 0 y 100.',
        ];
    }

    /* ---------- Endpoints ---------- */

    // GET /api/proyectos?buscar=texto
    public function index(Request $request): JsonResponse
    {
        $base = $this->vista($request);

        // Cabecera del tablero: avance promedio, conteo por columna y "por vencer"
        $resumen = (clone $base)->selectRaw("
            COUNT(*) AS total,
            COALESCE(ROUND(AVG(avance)), 0) AS avance_promedio,
            COUNT(*) FILTER (WHERE estado = 'Por iniciar') AS por_iniciar,
            COUNT(*) FILTER (WHERE estado = 'En curso')    AS en_curso,
            COUNT(*) FILTER (WHERE estado = 'En revisión') AS en_revision,
            COUNT(*) FILTER (WHERE estado = 'Finalizado')  AS finalizado,
            COUNT(*) FILTER (WHERE por_vencer)             AS por_vencer
        ")->first();

        $buscar = trim((string) $request->query('buscar', ''));

        $proyectos = $base
            ->when($buscar !== '', function ($q) use ($buscar) {
                $patron = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $buscar) . '%';
                $q->where(fn ($w) => $w
                    ->where('titulo', 'ilike', $patron)
                    ->orWhere('alumno', 'ilike', $patron)
                    ->orWhere('entidad', 'ilike', $patron));
            })
            ->orderBy('orden')
            ->orderBy('id_proyecto')
            ->get();

        return response()->json([
            'data'    => $proyectos,
            'resumen' => array_map('intval', (array) $resumen),
        ]);
    }

    // GET /api/proyectos/opciones -> alumnos y entidades para el formulario
    public function opciones(Request $request): JsonResponse
    {
        $alumnos = DB::table('estudiantes')
            ->when(! $this->esAdmin($request), fn ($q) => $q->whereIn(
                'id_estudiante',
                DB::table('asignacion_asesores')
                    ->where('id_docente', $request->user()->getKey())
                    ->select('id_estudiante')
            ))
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->selectRaw("id_estudiante AS id, nombres || ' ' || apellidos AS nombre")
            ->get();

        $entidades = DB::table('empresas_convenio')
            ->where('estado_convenio', 'Activo')
            ->orderBy('razon_social')
            ->selectRaw('id_empresa AS id, razon_social AS nombre')
            ->get();

        return response()->json(['estudiantes' => $alumnos, 'empresas' => $entidades]);
    }

    // POST /api/proyectos
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate($this->reglas($request), $this->mensajes());

        $datos['id_usuario'] = ($this->esAdmin($request) && isset($datos['id_usuario']))
            ? $datos['id_usuario']
            : $request->user()->getKey();
        $datos['estado'] = $datos['estado'] ?? 'Por iniciar';
        $datos['orden']  = (int) Proyecto::where('estado', $datos['estado'])
            ->where('id_usuario', $datos['id_usuario'])
            ->max('orden') + 1;

        $proyecto = Proyecto::create($datos);

        return response()->json($this->fila($proyecto->id_proyecto), 201);
    }

    // GET /api/proyectos/{proyecto}
    public function show(Request $request, Proyecto $proyecto): JsonResponse
    {
        $this->autorizar($request, $proyecto);

        return response()->json($this->fila($proyecto->id_proyecto));
    }

    // PUT|PATCH /api/proyectos/{proyecto}
    public function update(Request $request, Proyecto $proyecto): JsonResponse
    {
        $this->autorizar($request, $proyecto);

        $datos = $request->validate($this->reglas($request, $proyecto), $this->mensajes());
        $proyecto->update($datos);

        return response()->json($this->fila($proyecto->id_proyecto));
    }

    // PATCH /api/proyectos/{proyecto}/estado  -> al arrastrar una tarjeta a otra etapa
    public function moverEstado(Request $request, Proyecto $proyecto): JsonResponse
    {
        $this->autorizar($request, $proyecto);

        $datos = $request->validate([
            'estado'   => ['required', Rule::in(Proyecto::ESTADOS)],
            'posicion' => ['nullable', 'integer', 'min:0'],   // lugar dentro de la columna
        ], $this->mensajes());

        DB::transaction(function () use ($proyecto, $datos) {
            $destino = Proyecto::where('estado', $datos['estado'])
                ->where('id_usuario', $proyecto->id_usuario)
                ->where('id_proyecto', '<>', $proyecto->id_proyecto)
                ->orderBy('orden')
                ->orderBy('id_proyecto')
                ->pluck('id_proyecto')
                ->all();

            $posicion = min($datos['posicion'] ?? count($destino), count($destino));
            array_splice($destino, $posicion, 0, [$proyecto->id_proyecto]);

            $proyecto->update(
                ['estado' => $datos['estado']] + ($datos['estado'] === 'Finalizado' ? ['avance' => 100] : [])
            );

            foreach ($destino as $indice => $id) {
                Proyecto::whereKey($id)->update(['orden' => $indice]);
            }
        });

        return response()->json($this->fila($proyecto->id_proyecto));
    }

    // DELETE /api/proyectos/{proyecto}
    public function destroy(Request $request, Proyecto $proyecto)
    {
        $this->autorizar($request, $proyecto);
        $proyecto->delete();

        return response()->noContent();
    }
}