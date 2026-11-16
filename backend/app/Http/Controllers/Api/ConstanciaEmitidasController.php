<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConstanciaEmitida;
use App\Models\Estudiante;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ConstanciaEmitidaController extends Controller
{
    /**
     * Listar todos los estudiantes y cruzar su estado real con constancias_emitidas
     */
    public function index(Request $request)
    {
        // Cruzamos estudiantes con expedientes y constancias para traer la información real asignada
        $estudiantes = DB::table('estudiantes as e')
            ->leftJoin('expediente_efsrt as exp', 'e.id_estudiante', '=', 'exp.id_estudiante')
            ->leftJoin('constancias_emitidas as c', 'e.id_estudiante', '=', 'c.id_estudiante')
            ->select(
                'e.id_estudiante',
                'e.dni',
                'e.nombres',
                'e.apellidos',
                'e.programa_estudios',
                'exp.id_expediente',
                'exp.horas_acumuladas',
                'exp.estado as estado_expediente',
                'c.id_constancia',
                'c.codigo_documento',
                'c.fecha_emision'
            )
            ->get();
        
        $expedientes = $estudiantes->map(function ($row) {
            $emitida = !is_null($row->id_constancia);
            $horas = $row->horas_acumuladas ?? 0; // Si no tiene horas registradas aún, parte de 0

            if ($emitida) {
                $estado = 'Constancia Emitida';
            } elseif ($horas >= 480) {
                $estado = 'Apto para Constancia';
            } else {
                $estado = 'Horas Incompletas';
            }

            return [
                'id_estudiante'    => $row->id_estudiante,
                'id_modulo'        => 2,
                'nombre'           => trim(($row->nombres ?? '') . ' ' . ($row->apellidos ?? '')),
                'dni'              => $row->dni ?? '',
                'exp'              => $row->codigo_documento ?? ($row->id_expediente ? '#EXP-2026-' . str_pad($row->id_expediente, 4, '0', STR_PAD_LEFT) : '#PENDIENTE'),
                'codigo_documento' => $row->codigo_documento,
                'ini'              => strtoupper(substr($row->nombres ?? 'E', 0, 1) . substr($row->apellidos ?? 'S', 0, 1)),
                'hrs'              => $horas,
                'estado'           => $estado,
                'modulo'           => $row->programa_estudios ?? 'Diseño y Programación Web',
                'moduloKey'        => 'desarrollo',
                'empresa'          => 'WORLDNIC Tech',
                'asesor'           => 'Julio César Gutarra Ramos',
                'nota'             => $emitida ? 'Acreditación completada' : ($horas >= 480 ? 'Horas requeridas aprobadas' : 'En proceso de prácticas')
            ];
        });

        return response()->json($expedientes, 200);
    }

    /**
     * Generar constancia institucional
     */
    public function generar(Request $request)
    {
        $request->validate([
            'id_estudiante' => 'required|integer|exists:estudiantes,id_estudiante',
            'id_modulo'     => 'required|integer',
            'tipo_emision'  => 'nullable|string|in:Original,Duplicado'
        ]);

        $existente = ConstanciaEmitida::where('id_estudiante', $request->id_estudiante)
            ->where('id_modulo', $request->id_modulo)
            ->first();

        if ($existente) {
            return response()->json([
                'success' => false,
                'message' => 'El estudiante ya cuenta con una constancia emitida.',
                'data'    => $existente
            ], 400);
        }

        $adminId = $request->user()->id_usuario ?? $request->user()->id ?? 1;
        $codigoDocumento = 'CONST-EFSRT-2026-' . strtoupper(Str::random(4));
        $rutaPdf = 'storage/constancias/constancia_' . $codigoDocumento . '.pdf';

        $constancia = ConstanciaEmitida::create([
            'id_estudiante'    => $request->id_estudiante,
            'id_modulo'        => $request->id_modulo,
            'id_administrador' => $adminId,
            'codigo_documento' => $codigoDocumento,
            'tipo_emision'     => $request->input('tipo_emision', 'Original'),
            'fecha_emision'    => now(),
            'ruta_archivo_pdf' => $rutaPdf,
            'created_at'       => now(),
        ]);

        return response()->json([
            'success'    => true,
            'message'    => 'Constancia generada correctamente',
            'constancia' => $constancia
        ], 201);
    }
}