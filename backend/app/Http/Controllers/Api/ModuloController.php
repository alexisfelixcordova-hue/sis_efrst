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

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('nombre_modulo', 'ILIKE', "%{$search}%");
        }

        $modulos = $query->orderBy('id_modulo', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $modulos
        ], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'numero_modulo' => 'required|integer',
            'nombre_modulo' => 'required|string|max:150',
            'horas_requeridas' => 'required|integer',
        ]);

        $modulo = Modulo::create($request->all());

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
        $modulo = Modulo::find($id);

        if (!$modulo) {
            return response()->json([
                'success' => false,
                'message' => 'Módulo profesional no encontrado'
            ], 404);
        }

        $request->validate([
            'numero_modulo' => 'sometimes|integer',
            'nombre_modulo' => 'sometimes|string|max:150',
            'horas_requeridas' => 'sometimes|integer',
        ]);

        $modulo->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Módulo profesional actualizado correctamente',
            'data' => $modulo
        ], 200);
    }

    public function destroy($id)
    {
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