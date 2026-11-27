<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Throwable;

class EstudianteController extends Controller
{
    private const CACHE_TODOS = 'estudiantes_todos';
    private const CACHE_SEGUNDOS = 30;
    private const MAX_POR_PAGINA = 1000;

    /**
     * Listar estudiantes.
     * - ?todos=1 o ?all=true o ?per_page>=500 -> todos los registros en un arreglo plano.
     * - ?per_page=N                         -> paginación con N por página (máx. 1000).
     * - ?search=texto                       -> filtra por dni, nombres o apellidos.
     */
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $perPageInput = (int) $request->input('per_page', 10);
        $todos = $request->boolean('all')
            || $request->boolean('todos')
            || $perPageInput >= 500;

        // Listado completo sin búsqueda: se cachea como arreglo simple para evitar __PHP_Incomplete_Class_Name
        if ($todos && $search === '') {
            $estudiantes = Cache::remember(
                self::CACHE_TODOS,
                self::CACHE_SEGUNDOS,
                fn () => Estudiante::query()
                    ->orderBy('id_estudiante', 'desc')
                    ->get()
                    ->toArray()
            );

            return response()->json([
                'success' => true,
                'data'    => $estudiantes,
            ], 200);
        }

        $query = Estudiante::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('dni', 'ILIKE', "%{$search}%")
                  ->orWhere('nombres', 'ILIKE', "%{$search}%")
                  ->orWhere('apellidos', 'ILIKE', "%{$search}%");
            });
        }

        $query->orderBy('id_estudiante', 'desc');

        if ($todos) {
            $estudiantes = $query->get()->toArray();
        } else {
            $porPagina = max(1, min($perPageInput, self::MAX_POR_PAGINA));
            $estudiantes = $query->paginate($porPagina);
        }

        return response()->json([
            'success' => true,
            'data'    => $estudiantes,
        ], 200);
    }

    /**
     * Registrar un nuevo estudiante
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'dni' => 'required|string|max:8|unique:estudiantes,dni',
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'correo' => 'nullable|email|max:150|unique:estudiantes,correo',
            'telefono' => 'nullable|string|max:15',
            'programa_estudios' => 'nullable|string|max:255',
            'semestre' => 'nullable|string|max:50',
            'estado' => 'nullable|string|max:50',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if (empty($validated['estado'])) {
            $validated['estado'] = 'En progreso';
        }

        $rutaFoto = null;
        if ($request->hasFile('foto')) {
            $rutaFoto = $request->file('foto')->store('estudiantes', 'public');
            if (!$rutaFoto) {
                throw new \RuntimeException('No se pudo guardar la foto del estudiante.');
            }
            $validated['foto_url'] = '/storage/' . $rutaFoto;
        }

        unset($validated['foto']);
        try {
            $estudiante = Estudiante::create($validated);
        } catch (Throwable $error) {
            if ($rutaFoto) {
                Storage::disk('public')->delete($rutaFoto);
            }
            throw $error;
        }
        Cache::forget(self::CACHE_TODOS);

        return response()->json([
            'success' => true,
            'message' => 'Estudiante registrado correctamente',
            'data' => $estudiante
        ], 201);
    }

    /**
     * Mostrar el detalle de un estudiante específico
     */
    public function show($id)
    {
        $estudiante = Estudiante::find($id);

        if (!$estudiante) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $estudiante
        ], 200);
    }

    /**
     * Actualizar los datos de un estudiante
     */
    public function update(Request $request, $id)
    {
        $estudiante = Estudiante::find($id);

        if (!$estudiante) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        $validated = $request->validate([
            'dni' => 'sometimes|string|max:8|unique:estudiantes,dni,' . $id . ',id_estudiante',
            'nombres' => 'sometimes|string|max:255',
            'apellidos' => 'sometimes|string|max:255',
            'correo' => 'sometimes|email|unique:estudiantes,correo,' . $id . ',id_estudiante',
            'telefono' => 'nullable|string|max:15',
            'programa_estudios' => 'nullable|string|max:255',
            'semestre' => 'nullable|string|max:50',
            'estado' => 'sometimes|string|max:50',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'eliminar_foto' => 'sometimes|boolean',
        ]);

        $fotoAnterior = $estudiante->foto_url;
        $rutaFotoNueva = null;

        if ($request->hasFile('foto')) {
            $rutaFotoNueva = $request->file('foto')->store('estudiantes', 'public');
            if (!$rutaFotoNueva) {
                throw new \RuntimeException('No se pudo guardar la foto del estudiante.');
            }
            $validated['foto_url'] = '/storage/' . $rutaFotoNueva;
        } elseif ($request->boolean('eliminar_foto')) {
            $validated['foto_url'] = null;
        }

        unset($validated['foto'], $validated['eliminar_foto']);

        try {
            $estudiante->update($validated);
        } catch (Throwable $error) {
            if ($rutaFotoNueva) {
                Storage::disk('public')->delete($rutaFotoNueva);
            }
            throw $error;
        }

        if ($fotoAnterior && ($request->boolean('eliminar_foto') || $rutaFotoNueva)) {
            $rutaAnterior = $this->rutaAlmacenada($fotoAnterior);
            if ($rutaAnterior && Storage::disk('public')->exists($rutaAnterior)) {
                Storage::disk('public')->delete($rutaAnterior);
            }
        }

        Cache::forget(self::CACHE_TODOS);

        return response()->json([
            'success' => true,
            'message' => 'Estudiante actualizado correctamente',
            'data' => $estudiante
        ], 200);
    }

    /**
     * Eliminar un estudiante
     */
    public function destroy($id)
    {
        $estudiante = Estudiante::find($id);

        if (!$estudiante) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        $fotoAnterior = $estudiante->foto_url;
        $estudiante->delete();

        $rutaAnterior = $this->rutaAlmacenada($fotoAnterior);
        if ($rutaAnterior && Storage::disk('public')->exists($rutaAnterior)) {
            Storage::disk('public')->delete($rutaAnterior);
        }

        Cache::forget(self::CACHE_TODOS);

        return response()->json([
            'success' => true,
            'message' => 'Estudiante eliminado correctamente'
        ], 200);
    }

    /**
     * Consultar DNI en la API externa (RENIEC / Decolecta)
     */
    public function consultarDni($dni)
    {
        $dni = preg_replace('/\D/', '', trim($dni));

        if (strlen($dni) !== 8) {
            return response()->json(['error' => 'El DNI debe tener exactamente 8 dígitos.'], 400);
        }

        $url = 'https://api.decolecta.com/v1/reniec/dni?numero=' . $dni;
        $token = env('SUNAT_API_TOKEN');

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Authorization: Bearer ' . $token
            ],
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);

        if ($curlError) {
            return response()->json(['error' => 'Error de conexión con el servicio externo: ' . $curlError], 500);
        }

        if ($httpCode !== 200) {
            return response()->json([
                'error' => 'No se pudo obtener información de la RENIEC (Código HTTP: ' . $httpCode . ')',
                'detalles' => json_decode($response, true) ?? $response
            ], $httpCode);
        }

        $data = json_decode($response, true);
        if (!$data) {
            return response()->json(['error' => 'Respuesta no procesable del servicio externo.'], 500);
        }

        return response()->json($data, 200);
    }

    private function rutaAlmacenada(?string $fotoUrl): ?string
    {
        if (!$fotoUrl) {
            return null;
        }

        $ruta = parse_url($fotoUrl, PHP_URL_PATH) ?: $fotoUrl;
        if (!str_starts_with($ruta, '/storage/')) {
            return null;
        }

        return substr($ruta, strlen('/storage/'));
    }
}