<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Modulo;
use Illuminate\Http\Request;

class ModuloController extends Controller
{
    public function index(Request $request)
    {
        $query = Modulo::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('nombre_modulo', 'ILIKE', "%{$search}%");
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 10)));
        $modulos = $query->orderBy('id_modulo', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $modulos
        ], 200);
    }

    public function store(Request $request)
    {
        abort_unless((int) ($request->user()?->id_rol ?? 0) === 1, 403, 'Se requiere rol de Administrador.');

        $datos = $request->validate([
            'numero_modulo' => 'required|integer|min:1',
            'nombre_modulo' => 'required|string|max:150',
            'horas_requeridas' => 'required|integer|min:1',
        ]);

        $modulo = Modulo::create($datos);

        return response()->json([
            'success' => true,
            'message' => 'Módulo profesional creado correctamente',
            'data' => $modulo
        ], 201);
    }

    public function show($id)
    {
        $modulo = Modulo::find($id);

        if (!$modulo) {
            return response()->json([
                'success' => false,
                'message' => 'Módulo profesional no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $modulo
        ], 200);
    }

    public function update(Request $request, $id)
    {
        abort_unless((int) ($request->user()?->id_rol ?? 0) === 1, 403, 'Se requiere rol de Administrador.');

        $modulo = Modulo::find($id);

        if (!$modulo) {
            return response()->json([
                'success' => false,
                'message' => 'Módulo profesional no encontrado'
            ], 404);
        }

        $datos = $request->validate([
            'numero_modulo' => 'sometimes|integer|min:1',
            'nombre_modulo' => 'sometimes|string|max:150',
            'horas_requeridas' => 'sometimes|integer|min:1',
        ]);

        $modulo->update($datos);

        return response()->json([
            'success' => true,
            'message' => 'Módulo profesional actualizado correctamente',
            'data' => $modulo
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        abort_unless((int) ($request->user()?->id_rol ?? 0) === 1, 403, 'Se requiere rol de Administrador.');

        $modulo = Modulo::find($id);

        if (!$modulo) {
            return response()->json([
                'success' => false,
                'message' => 'Módulo profesional no encontrado'
            ], 404);
        }

        $modulo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Módulo profesional eliminado correctamente'
        ], 200);
    }
}