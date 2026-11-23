<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ExpedienteController extends Controller
{
    public function registrarCalificacion(Request $request, $id = null)
    {
        if (!Schema::hasTable('expediente_efsrt')) {
            return response()->json([
                'success' => false,
                'message' => 'No existe la tabla expediente_efsrt.'
            ], 404);
        }

        $validated = $request->validate([
            'id_expediente' => 'nullable|integer',
            'id_estudiante' => 'nullable|integer',
            'id_modulo'     => 'nullable|integer',
            'nota'          => 'nullable|numeric|min:0|max:20',
            'calificacion'  => 'nullable|numeric|min:0|max:20',
            'observacion'   => 'nullable|string|max:1000',
            'estado_efsrt'  => 'nullable|string|max:50',
            'evidencia'     => 'nullable',
        ]);

        $idExpediente = $id ?? ($validated['id_expediente'] ?? null);
        $idEstudiante = $validated['id_estudiante'] ?? null;
        $idModulo     = $validated['id_modulo'] ?? null;

        $notaValor = $validated['nota'] ?? $validated['calificacion'] ?? null;

        $pkCol = collect(['id_expediente', 'id'])
            ->first(fn ($c) => Schema::hasColumn('expediente_efsrt', $c));

        $query = DB::table('expediente_efsrt');

        if ($idExpediente && $pkCol) {
            $query->where($pkCol, (int) $idExpediente);
        } else {
            if (!$idEstudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debe indicar el expediente o el estudiante.'
                ], 422);
            }
            $query->where('id_estudiante', (int) $idEstudiante);

            if ($idModulo && Schema::hasColumn('expediente_efsrt', 'id_modulo')) {
                $query->where('id_modulo', (int) $idModulo);
            }
        }

        $expediente = $query->first();

        if (!$expediente) {
            return response()->json([
                'success' => false,
                'message' => 'Expediente del módulo no encontrado.'
            ], 404);
        }

        $datosActualizar = [];

        if (!is_null($notaValor)) {
            if (Schema::hasColumn('expediente_efsrt', 'nota')) {
                $datosActualizar['nota'] = $notaValor;
            } elseif (Schema::hasColumn('expediente_efsrt', 'calificacion')) {
                $datosActualizar['calificacion'] = $notaValor;
            }
        }

        if (!empty($validated['observacion']) && Schema::hasColumn('expediente_efsrt', 'observacion')) {
            $datosActualizar['observacion'] = $validated['observacion'];
        }

        if (!empty($validated['estado_efsrt']) && Schema::hasColumn('expediente_efsrt', 'estado_efsrt')) {
            $datosActualizar['estado_efsrt'] = $validated['estado_efsrt'];
        }

        // Manejo de evidencia (archivo o texto/URL)
        if ($request->hasFile('evidencia')) {
            $rutaArchivo = $request->file('evidencia')->store('evidencias_efsrt', 'public');
            $colEvidencia = collect(['evidencia', 'archivo_evidencia', 'evidencia_url', 'ruta_evidencia'])
                ->first(fn ($c) => Schema::hasColumn('expediente_efsrt', $c));

            if ($colEvidencia) {
                $datosActualizar[$colEvidencia] = Storage::url($rutaArchivo);
            }
        } elseif ($request->filled('evidencia')) {
            $colEvidencia = collect(['evidencia', 'archivo_evidencia', 'evidencia_url', 'ruta_evidencia'])
                ->first(fn ($c) => Schema::hasColumn('expediente_efsrt', $c));

            if ($colEvidencia) {
                $datosActualizar[$colEvidencia] = $request->input('evidencia');
            }
        }

        if (Schema::hasColumn('expediente_efsrt', 'updated_at')) {
            $datosActualizar['updated_at'] = now();
        }

        if (!empty($datosActualizar)) {
            $actualizador = DB::table('expediente_efsrt');
            if ($idExpediente && $pkCol) {
                $actualizador->where($pkCol, (int) $idExpediente);
            } else {
                $actualizador->where('id_estudiante', (int) $idEstudiante);
                if ($idModulo && Schema::hasColumn('expediente_efsrt', 'id_modulo')) {
                    $actualizador->where('id_modulo', (int) $idModulo);
                }
            }
            $actualizador->update($datosActualizar);
        }

        $expedienteActualizado = $query->first();

        return response()->json([
            'success' => true,
            'message' => 'Nota y evidencia registradas correctamente en el expediente del módulo.',
            'data'    => $expedienteActualizado,
        ], 200);
    }
}