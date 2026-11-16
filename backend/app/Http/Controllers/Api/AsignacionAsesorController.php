<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsignacionAsesor;
use Illuminate\Http\Request;

class AsignacionAsesorController extends Controller
{
    /**
     * Método auxiliar para restringir el acceso únicamente a administradores (id_rol === 1).
     */
    private function verificarAdmin(Request $request)
    {
        $user = $request->user();

        // Validamos que el usuario esté autenticado y tenga id_rol = 1 (Administrador)
        if (!$user || $user->id_rol !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Se requiere rol de Administrador.'
            ], 403);
        }

        return null;
    }

    public function index(Request $request)
    {
        if ($error = $this->verificarAdmin($request)) {
            return $error;
        }

        $query = AsignacionAsesor::with(['estudiante', 'modulo', 'docente']);

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('periodo_academico', 'ILIKE', "%{$search}%");
        }

        $asignaciones = $query->orderBy('id_asignacion', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $asignaciones
        ], 200);
    }

    public function store(Request $request)
    {
        if ($error = $this->verificarAdmin($request)) {
            return $error;
        }

        $request->validate([
            'id_docente' => 'required|integer',
            'id_estudiante' => 'required|integer',
            'id_modulo' => 'required|integer',
            'periodo_academico' => 'required|string|max:20',
        ]);

        $asignacion = AsignacionAsesor::create($request->all());
        $asignacion->load(['estudiante', 'modulo', 'docente']);

        return response()->json([
            'success`' => true,
            'message' => 'Asignación de asesor creada correctamente',
            'data' => $asignacion
        ], 201);
    }

    public function show(Request $request, $id)
    {
        if ($error = $this->verificarAdmin($request)) {
            return $error;
        }

        $asignacion = AsignacionAsesor::with(['estudiante', 'modulo', 'docente'])->find($id);

        if (!$asignacion) {
            return response()->json([
                'success' => false,
                'message' => 'Asignación no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $asignacion
        ], 200);
    }

    public function update(Request $request, $id)
    {
        if ($error = $this->verificarAdmin($request)) {
            return $error;
        }

        $asignacion = AsignacionAsesor::find($id);

        if (!$asignacion) {
            return response()->json([
                'success' => false,
                'message' => 'Asignación no encontrada'
            ], 404);
        }

        $request->validate([
            'id_docente' => 'sometimes|integer',
            'id_estudiante' => 'sometimes|integer',
            'id_modulo' => 'sometimes|integer',
            'periodo_academico' => 'sometimes|string|max:20',
        ]);

        $asignacion->update($request->all());
        $asignacion->load(['estudiante', 'modulo', 'docente']);

        return response()->json([
            'success' => true,
            'message' => 'Asignación actualizada correctamente',
            'data' => $asignacion
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        if ($error = $this->verificarAdmin($request)) {
            return $error;
        }

        $asignacion = AsignacionAsesor::find($id);

        if (!$asignacion) {
            return response()->json([
                'success' => false,
                'message' => 'Asignación no encontrada'
            ], 404);
        }

        $asignacion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asignación eliminada correctamente'
        ], 200);
    }
}