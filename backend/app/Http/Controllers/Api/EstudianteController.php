<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use Illuminate\Http\Request;

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
            'estado' => 'nullable|string|max:50', // Añadido para controlar estados (En progreso, Egresado, etc.)
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
            'estado' => 'sometimes|string|max:50', // Sincronizado para actualizar estados desde el panel
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
}