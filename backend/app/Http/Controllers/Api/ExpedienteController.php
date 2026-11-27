<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ExpedienteController extends Controller
{
    public function porEstudiante(Request $request, $id)
    {
        if (!is_numeric($id) || !Schema::hasTable('expediente_efsrt')) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró el expediente solicitado.',
            ], 404);
        }

        $usuario = $request->user();
        if (!$usuario) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        $idRol = (int) ($usuario->id_rol ?? 0);
        if ($idRol !== 1 && ($idRol !== 2 || !$this->docenteTieneAcceso($usuario, (int) $id))) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso al expediente de este estudiante.',
            ], 403);
        }

        if (!Schema::hasColumn('expediente_efsrt', 'id_estudiante')) {
            return response()->json([
                'success' => false,
                'message' => 'La tabla de expedientes no contiene la relación con estudiantes.',
            ], 500);
        }

        $pk = collect(['id_expediente', 'id'])
            ->first(fn ($columna) => Schema::hasColumn('expediente_efsrt', $columna));
        $columnas = [
            $pk ? "exp.$pk as id_expediente" : DB::raw('NULL as id_expediente'),
            'exp.id_estudiante',
        ];

        $camposExpediente = [
            'id_modulo',
            'id_empresa',
            'id_docente_asesor',
            'periodo_academico',
            'estado_efsrt',
            'estado_revision',
            'horas_acumuladas',
            'horas_requeridas',
            'portafolio_fisico_revisado',
            'fecha_validacion',
            'observaciones',
            'observacion',
            'comentario',
            'detalle_evaluacion',
            'created_at',
            'updated_at',
        ];
        foreach ($camposExpediente as $campo) {
            if (Schema::hasColumn('expediente_efsrt', $campo)) {
                $columnas[] = "exp.$campo";
            }
        }

        if (Schema::hasColumn('expediente_efsrt', 'nota')) {
            $columnas[] = 'exp.nota';
        } elseif (Schema::hasColumn('expediente_efsrt', 'calificacion')) {
            $columnas[] = DB::raw('exp.calificacion as nota');
        }

        $query = DB::table('expediente_efsrt as exp')
            ->where('exp.id_estudiante', (int) $id);

        if (
            Schema::hasColumn('expediente_efsrt', 'id_modulo')
            && Schema::hasTable('modulos_profesionales')
        ) {
            $moduloId = collect(['id_modulo', 'id'])
                ->first(fn ($columna) => Schema::hasColumn('modulos_profesionales', $columna));
            $moduloNombre = collect(['nombre_modulo', 'nombre', 'titulo', 'descripcion'])
                ->first(fn ($columna) => Schema::hasColumn('modulos_profesionales', $columna));

            if ($moduloId) {
                $query->leftJoin('modulos_profesionales as mod', "mod.$moduloId", '=', 'exp.id_modulo');
                if ($moduloNombre) {
                    $columnas[] = DB::raw("mod.$moduloNombre as nombre_modulo");
                }
                if (Schema::hasColumn('modulos_profesionales', 'numero_modulo')) {
                    $columnas[] = 'mod.numero_modulo';
                }
                if (
                    Schema::hasColumn('modulos_profesionales', 'horas_requeridas')
                    && !Schema::hasColumn('expediente_efsrt', 'horas_requeridas')
                ) {
                    $columnas[] = 'mod.horas_requeridas';
                }
            }
        }

        if (
            Schema::hasColumn('expediente_efsrt', 'id_empresa')
            && Schema::hasTable('empresas_convenio')
        ) {
            $query->leftJoin('empresas_convenio as emp', 'emp.id_empresa', '=', 'exp.id_empresa');
            $nombresEmpresa = collect(['razon_social', 'nombre_comercial'])
                ->filter(fn ($columna) => Schema::hasColumn('empresas_convenio', $columna))
                ->map(fn ($columna) => "emp.$columna")
                ->all();
            $expresionEmpresa = $nombresEmpresa
                ? 'COALESCE(' . implode(', ', $nombresEmpresa) . ", '')"
                : "''";
            $columnas[] = DB::raw("$expresionEmpresa as empresa_entidad");
            foreach (['ruc', 'telefono', 'correo_electronico', 'direccion', 'supervisor_empresa_nombre'] as $campo) {
                if (Schema::hasColumn('empresas_convenio', $campo)) {
                    $columnas[] = "emp.$campo as empresa_$campo";
                }
            }
        }

        $query->select($columnas);
        if (Schema::hasColumn('expediente_efsrt', 'id_modulo')) {
            $query->orderBy('exp.id_modulo');
        } elseif ($pk) {
            $query->orderBy("exp.$pk");
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    private function docenteTieneAcceso($usuario, int $idEstudiante): bool
    {
        if (
            !Schema::hasTable('asignacion_asesores')
            || !Schema::hasColumn('asignacion_asesores', 'id_docente')
            || !Schema::hasColumn('asignacion_asesores', 'id_estudiante')
        ) {
            return false;
        }

        $idsDocente = collect([
            $usuario->id_docente ?? null,
            $usuario->id_usuario ?? $usuario->id ?? null,
        ])->filter()->map(fn ($id) => (int) $id);

        if (Schema::hasTable('docentes') && Schema::hasColumn('docentes', 'id_usuario')) {
            $columnaId = collect(['id_docente', 'id'])
                ->first(fn ($columna) => Schema::hasColumn('docentes', $columna));
            if ($columnaId) {
                $idsDocente = $idsDocente->merge(
                    DB::table('docentes')
                        ->where('id_usuario', $usuario->id_usuario ?? $usuario->id)
                        ->pluck($columnaId)
                        ->map(fn ($id) => (int) $id)
                );
            }
        } elseif (Schema::hasTable('docentes')) {
            $columnaCorreo = collect(['correo', 'email'])
                ->first(fn ($columna) => Schema::hasColumn('docentes', $columna));
            $columnaId = collect(['id_docente', 'id'])
                ->first(fn ($columna) => Schema::hasColumn('docentes', $columna));

            if ($columnaCorreo && $columnaId && !empty($usuario->correo)) {
                $idsDocente = $idsDocente->merge(
                    DB::table('docentes')
                        ->where($columnaCorreo, $usuario->correo)
                        ->pluck($columnaId)
                        ->map(fn ($id) => (int) $id)
                );
            }
        }

        return DB::table('asignacion_asesores')
            ->where('id_estudiante', $idEstudiante)
            ->whereIn('id_docente', $idsDocente->unique()->values())
            ->exists();
    }

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
            'comentario'    => 'nullable|string|max:1000',
            'observaciones' => 'nullable|string|max:1000',
            'estado_efsrt'  => 'nullable|string|max:50',
            'horas_acumuladas' => 'nullable|numeric|min:0',
            'detalle_evaluacion' => 'nullable|array',
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

        $observacion = $validated['observaciones']
            ?? $validated['observacion']
            ?? $validated['comentario']
            ?? null;
        $columnaObservacion = collect(['observaciones', 'observacion', 'comentario'])
            ->first(fn ($columna) => Schema::hasColumn('expediente_efsrt', $columna));
        if ($observacion !== null && $columnaObservacion) {
            $datosActualizar[$columnaObservacion] = $observacion;
        }

        if (
            isset($validated['detalle_evaluacion'])
            && Schema::hasColumn('expediente_efsrt', 'detalle_evaluacion')
        ) {
            $datosActualizar['detalle_evaluacion'] = json_encode(
                $validated['detalle_evaluacion'],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
        }

        if (
            isset($validated['horas_acumuladas'])
            && Schema::hasColumn('expediente_efsrt', 'horas_acumuladas')
        ) {
            $datosActualizar['horas_acumuladas'] = $validated['horas_acumuladas'];
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