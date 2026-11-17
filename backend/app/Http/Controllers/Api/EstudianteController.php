<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // <-- Importación correcta arriba del todo

class EstudianteController extends Controller
{
    /**
     * Listar todos los estudiantes (sin paginación estricta para listados generales 
     * o con soporte opcional si se requiere) para que React los lea fluidamente.
     */
    public function index(Request $request)
    {
        $query = Estudiante::query();

        // Filtrado por búsqueda (dni, nombres o apellidos)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('dni', 'ILIKE', "%{$search}%")
                  ->orWhere('nombres', 'ILIKE', "%{$search}%")
                  ->orWhere('apellidos', 'ILIKE', "%{$search}%");
            });
        }

        // Si el frontend envía ?all=true, devolvemos todos los registros juntos. 
        // De lo contrario, mantenemos la paginación estándar de 10 en 10.
        if ($request->has('all') && $request->all == 'true') {
            $estudiantes = $query->orderBy('id_estudiante', 'desc')->get();
        } else {
            $estudiantes = $query->orderBy('id_estudiante', 'desc')->paginate(10);
        }

        return response()->json([
            'success' => true,
            'data' => $estudiantes
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
        ]);

        $estudiante = Estudiante::create($validated);

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
        ]);

        $estudiante->update($validated);

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

        $estudiante->delete();

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
        // Limpiamos el DNI para asegurar que solo sean números y tenga 8 dígitos
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
}