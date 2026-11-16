<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpedienteEfsrt;
use Illuminate\Http\Request;

class ExpedienteController extends Controller
{
    /**
     * Buscador global para el Administrador y Docentes
     * Permite buscar por DNI, Nombres o filtrar por estado y módulo.
     */
    public function index(Request $request)
    {
        $query = ExpedienteEfsrt::query();

        // Filtro por Buscador Global (DNI o Apellidos del estudiante)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('estudiante', function ($q) use ($search) {
                $q->where('dni', 'ILIKE', "%{$search}%")
                  ->orWhere('apellidos', 'ILIKE', "%{$search}%")
                  ->orWhere('nombres', 'ILIKE', "%{$search}%");
            });
        }

        // Filtro por estado del trámite EFSRT ('Por verificar', 'Validado', etc.)
        if ($request->has('estado') && !empty($request->estado)) {
            $query->where('estado_efsrt', $request->estado);
        }

        // Filtro por módulo profesional (1, 2 o 3)
        if ($request->has('id_modulo') && !empty($request->id_modulo)) {
            $query->where('id_modulo', $request->id_modulo);
        }

        $expedientes = $query->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $expedientes
        ], 200);
    }

    /**
     * Actualiza el estado del expediente y valida el portafolio físico (Candado del Docente)
     */
    public function validarExpediente(Request $request, $id)
    {
        $expediente = ExpedienteEfsrt::find($id);

        if (!$expediente) {
            return response()->json(['success' => false, 'message' => 'Expediente no encontrado'], 404);
        }

        $expediente->update([
            'horas_acumuladas' => $request->horas_acumuladas,
            'estado_efsrt' => $request->estado_efsrt, // 'Validado' o 'Por verificar'
            'portafolio_fisico_revisado' => $request->portafolio_fisico_revisado, // true / false
            'observaciones' => $request->observaciones,
            'fecha_validacion' => $request->estado_efsrt === 'Validado' ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expediente actualizado correctamente',
            'data' => $expediente
        ], 200);
    }
}
