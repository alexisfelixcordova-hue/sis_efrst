<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConstanciaEmitida;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ConstanciaEmitidaController extends Controller
{
    /**
     * Listar todos los estudiantes y cruzar su estado real con expedientes y constancias_emitidas
     */
    public function index(Request $request)
    {
        $query = DB::table('estudiantes as e')
            ->leftJoin('expediente_efsrt as exp', function ($join) {
                $join->on('e.id_estudiante', '=', 'exp.id_estudiante');
            })
            ->leftJoin('constancias_emitidas as c', function ($join) {
                $join->on('e.id_estudiante', '=', 'c.id_estudiante')
                    ->when(
                        Schema::hasColumn('constancias_emitidas', 'id_modulo') &&
                        Schema::hasColumn('expediente_efsrt', 'id_modulo'),
                        function ($q) {
                            $q->on('c.id_modulo', '=', 'exp.id_modulo');
                        }
                    );
            });

        $select = [
            'e.id_estudiante',
            'e.dni',
            'e.nombres',
            'e.apellidos',
            'exp.id_expediente',
            'c.id_constancia',
            'c.codigo_documento',
            'c.fecha_emision',
        ];

        $select[] = Schema::hasColumn('estudiantes', 'programa_estudios')
            ? 'e.programa_estudios'
            : DB::raw("'Diseño y Programación Web' as programa_estudios");

        $select[] = Schema::hasColumn('expediente_efsrt', 'id_modulo')
            ? 'exp.id_modulo'
            : DB::raw('1 as id_modulo');

        $select[] = Schema::hasColumn('expediente_efsrt', 'horas_acumuladas')
            ? 'exp.horas_acumuladas'
            : DB::raw('0 as horas_acumuladas');

        $select[] = Schema::hasColumn('expediente_efsrt', 'horas_requeridas')
            ? 'exp.horas_requeridas'
            : DB::raw('160 as horas_requeridas');

        $select[] = Schema::hasColumn('expediente_efsrt', 'estado')
            ? 'exp.estado as estado_expediente'
            : DB::raw('null as estado_expediente');

        $select[] = Schema::hasColumn('expediente_efsrt', 'nota')
            ? 'exp.nota'
            : DB::raw('null as nota');

        $select[] = Schema::hasColumn('expediente_efsrt', 'verificado_docente')
            ? 'exp.verificado_docente'
            : DB::raw('0 as verificado_docente');

        $select[] = Schema::hasColumn('expediente_efsrt', 'portafolio_fisico_revisado')
            ? 'exp.portafolio_fisico_revisado'
            : DB::raw('0 as portafolio_fisico_revisado');

        if (Schema::hasColumn('expediente_efsrt', 'id_empresa') && Schema::hasTable('empresas_convenio')) {
            $query->leftJoin('empresas_convenio as emp', 'exp.id_empresa', '=', 'emp.id_empresa');
            $select[] = DB::raw("COALESCE(emp.razon_social, emp.nombre_comercial, 'Empresa formadora asignada') as empresa_nombre");
        } else {
            $select[] = DB::raw("'Empresa formadora asignada' as empresa_nombre");
        }

        if (Schema::hasColumn('expediente_efsrt', 'id_docente_asesor') && Schema::hasTable('usuarios')) {
            $query->leftJoin('usuarios as doc', 'exp.id_docente_asesor', '=', 'doc.id_usuario');
            $select[] = DB::raw("COALESCE(doc.nombre, doc.nombres, 'Docente asesor EFSRT') as asesor_nombre");
        } else {
            $select[] = DB::raw("'Docente asesor EFSRT' as asesor_nombre");
        }

        if (Schema::hasColumn('expediente_efsrt', 'id_modulo') && Schema::hasTable('modulos_profesionales')) {
            $query->leftJoin('modulos_profesionales as mp', 'exp.id_modulo', '=', 'mp.id_modulo');
            $select[] = DB::raw("COALESCE(mp.nombre_modulo, e.programa_estudios, 'Módulo EFSRT') as modulo_nombre");
        } else {
            $select[] = DB::raw("COALESCE(e.programa_estudios, 'Módulo EFSRT') as modulo_nombre");
        }

        $filas = $query->select($select)->get();

        $expedientes = $filas->map(function ($row) {
            $emitida = !is_null($row->id_constancia) || !empty($row->codigo_documento);
            $horas = (int) ($row->horas_acumuladas ?? 0);
            $metaHoras = (int) ($row->horas_requeridas ?? 160);
            if ($metaHoras <= 0) {
                $metaHoras = 160;
            }

            $idModulo = (int) ($row->id_modulo ?? 1);
            if (!in_array($idModulo, [1, 2, 3], true)) {
                $idModulo = 1;
            }

            $moduloKey = match ($idModulo) {
                1 => 'modulo1',
                2 => 'modulo2',
                3 => 'modulo3',
                default => 'modulo1',
            };

            $notaNum = is_numeric($row->nota) ? (float) $row->nota : null;
            $cumpleRequisitos = $horas >= $metaHoras
                || (!empty($row->verificado_docente) && !is_null($notaNum) && $notaNum >= 13)
                || in_array(strtolower((string) ($row->estado_expediente ?? '')), [
                    'apto',
                    'apto para constancia',
                    'listo',
                    'listo para constancia',
                    'validado',
                    'aprobado',
                ], true);

            if ($emitida) {
                $estado = 'Constancia Emitida';
            } elseif ($cumpleRequisitos) {
                $estado = 'Apto para Constancia';
            } else {
                $estado = 'Horas Incompletas';
            }

            $codigoExp = $row->codigo_documento
                ?? ($row->id_expediente
                    ? '#EXP-M' . $idModulo . '-' . str_pad((string) $row->id_expediente, 4, '0', STR_PAD_LEFT)
                    : '#EXP-M' . $idModulo . '-' . str_pad((string) $row->id_estudiante, 4, '0', STR_PAD_LEFT));

            $iniciales = strtoupper(
                mb_substr($row->nombres ?? 'E', 0, 1) . mb_substr($row->apellidos ?? 'S', 0, 1)
            );

            return [
                'id_estudiante'     => $row->id_estudiante,
                'id_expediente'     => $row->id_expediente,
                'id_modulo'         => $idModulo,
                'id_constancia'     => $row->id_constancia,
                'emitida'           => $emitida,
                'nombre'            => trim(($row->nombres ?? '') . ' ' . ($row->apellidos ?? '')),
                'dni'               => $row->dni ?? '',
                'programa_estudios' => $row->programa_estudios ?? 'Diseño y Programación Web',
                'exp'               => $codigoExp,
                'codigo_expediente' => $codigoExp,
                'codigo_documento'  => $row->codigo_documento,
                'fecha_emision'     => $row->fecha_emision,
                'ini'               => $iniciales,
                'hrs'               => $horas,
                'horas_acumuladas'  => $horas,
                'horas_requeridas'  => $metaHoras,
                'nota'              => $notaNum,
                'estado'            => $estado,
                'modulo'            => $row->modulo_nombre ?? 'Módulo EFSRT',
                'moduloKey'         => $moduloKey,
                'empresa'           => $row->empresa_nombre ?? 'Empresa formadora asignada',
                'asesor'            => $row->asesor_nombre ?? 'Docente asesor EFSRT',
            ];
        });

        return response()->json($expedientes->values(), 200);
    }

    /**
     * Generar constancia institucional evitando duplicados por estudiante y módulo
     */
    public function generar(Request $request)
    {
        $request->validate([
            'id_estudiante' => 'required|integer|exists:estudiantes,id_estudiante',
            'id_modulo'     => 'required|integer',
            'tipo_emision'  => 'nullable|string|in:Original,Duplicado',
        ]);

        $queryExistente = ConstanciaEmitida::where('id_estudiante', $request->id_estudiante);
        if (Schema::hasColumn('constancias_emitidas', 'id_modulo')) {
            $queryExistente->where('id_modulo', $request->id_modulo);
        }

        $existente = $queryExistente->first();

        if ($existente) {
            return response()->json([
                'success'        => false,
                'already_issued' => true,
                'message'        => 'Ya se emitió la constancia para este estudiante en el módulo seleccionado.',
                'constancia'     => $existente,
                'data'           => $existente,
            ], 409);
        }

        $adminId = $request->user()->id_usuario ?? $request->user()->id ?? 1;
        $codigoDocumento = 'CONST-EFSRT-2026-' . strtoupper(Str::random(4));
        $rutaPdf = 'storage/constancias/constancia_' . $codigoDocumento . '.pdf';

        $payload = [
            'id_estudiante'    => $request->id_estudiante,
            'codigo_documento' => $codigoDocumento,
            'tipo_emision'     => $request->input('tipo_emision', 'Original'),
            'fecha_emision'    => now(),
            'ruta_archivo_pdf' => $rutaPdf,
            'created_at'       => now(),
        ];

        if (Schema::hasColumn('constancias_emitidas', 'id_modulo')) {
            $payload['id_modulo'] = $request->id_modulo;
        }

        if (Schema::hasColumn('constancias_emitidas', 'id_administrador')) {
            $payload['id_administrador'] = $adminId;
        }

        $constancia = ConstanciaEmitida::create($payload);

        return response()->json([
            'success'    => true,
            'message'    => 'Constancia generada correctamente',
            'constancia' => $constancia,
            'data'       => $constancia,
        ], 201);
    }
}