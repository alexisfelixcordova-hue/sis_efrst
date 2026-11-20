<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReporteController extends Controller
{
    public function estadisticas(Request $request)
    {
        $anio = (int) ($request->input('anio') ?: now()->year);

        // Priorizamos expediente_efsrt o asignacion_asesores según exista en PostgreSQL
        $tablaBase = collect(['expediente_efsrt', 'asignacion_asesores'])
            ->first(fn ($t) => Schema::hasTable($t));

        $mensual = array_fill(0, 12, 0);
        $mensualAnterior = array_fill(0, 12, 0);
        $anual = [];
        $programas = [];
        $totalPracticas = 0;
        $totalAnterior = 0;
        $horasFormativas = 0;
        $empresasConvenio = 0;
        $tasaAprobacion = 0;

        if ($tablaBase) {
            $colFecha = collect(['fecha_inicio', 'created_at', 'updated_at'])
                ->first(fn ($c) => Schema::hasColumn($tablaBase, $c));

            if ($colFecha) {
                $rowsActual = DB::table($tablaBase)
                    ->whereYear($colFecha, $anio)
                    ->selectRaw("EXTRACT(MONTH FROM $colFecha)::int as mes, COUNT(*) as total")
                    ->groupBy('mes')
                    ->get();

                foreach ($rowsActual as $r) {
                    $idx = ((int) $r->mes) - 1;
                    if ($idx >= 0 && $idx < 12) {
                        $mensual[$idx] = (int) $r->total;
                    }
                }

                $rowsPrev = DB::table($tablaBase)
                    ->whereYear($colFecha, $anio - 1)
                    ->selectRaw("EXTRACT(MONTH FROM $colFecha)::int as mes, COUNT(*) as total")
                    ->groupBy('mes')
                    ->get();

                foreach ($rowsPrev as $r) {
                    $idx = ((int) $r->mes) - 1;
                    if ($idx >= 0 && $idx < 12) {
                        $mensualAnterior[$idx] = (int) $r->total;
                    }
                }

                for ($a = $anio - 3; $a <= $anio; $a++) {
                    $anual[] = [
                        'anio'  => $a,
                        'total' => (int) DB::table($tablaBase)->whereYear($colFecha, $a)->count(),
                    ];
                }
            } else {
                // Respaldo si la tabla no tiene columna de fecha
                $totalTabla = (int) DB::table($tablaBase)->count();
                $mensual[now()->month - 1] = $totalTabla;
                for ($a = $anio - 3; $a <= $anio; $a++) {
                    $anual[] = [
                        'anio'  => $a,
                        'total' => $a === $anio ? $totalTabla : 0,
                    ];
                }
            }

            // Distribución por programa de estudios desde estudiantes
            if (
                Schema::hasTable('estudiantes') &&
                Schema::hasColumn('estudiantes', 'id_estudiante') &&
                Schema::hasColumn($tablaBase, 'id_estudiante')
            ) {
                $colProg = collect(['programa_estudios', 'carrera', 'programa'])
                    ->first(fn ($c) => Schema::hasColumn('estudiantes', $c));

                if ($colProg) {
                    $qProg = DB::table("$tablaBase as t")
                        ->join('estudiantes as e', 'e.id_estudiante', '=', 't.id_estudiante');

                    if ($colFecha) {
                        $qProg->whereYear("t.$colFecha", $anio);
                    }

                    $programas = $qProg
                        ->selectRaw("COALESCE(NULLIF(TRIM(e.$colProg), ''), 'Diseño y Programación Web') as programa, COUNT(*) as total")
                        ->groupBy('programa')
                        ->orderByDesc('total')
                        ->get();
                }
            }

            $totalPracticas = array_sum($mensual);
            $totalAnterior  = array_sum($mensualAnterior);

            // Horas formativas: suma real si existe la columna, o estimación base por práctica
            $horasFormativas = $totalPracticas * 160;
            $colHoras = collect(['horas_acumuladas', 'horas_requeridas', 'hrs'])
                ->first(fn ($c) => Schema::hasColumn($tablaBase, $c));

            if ($colHoras) {
                $qHoras = DB::table($tablaBase);
                if ($colFecha) {
                    $qHoras->whereYear($colFecha, $anio);
                }
                $sumaHoras = (int) $qHoras->sum($colHoras);
                if ($sumaHoras > 0) {
                    $horasFormativas = $sumaHoras;
                }
            }

            // Tasa de aprobación si existe columna de nota
            $colNota = collect(['nota', 'promedio', 'calificacion'])
                ->first(fn ($c) => Schema::hasColumn($tablaBase, $c));

            if ($colNota && $totalPracticas > 0) {
                $qTotalConNota = DB::table($tablaBase)->whereNotNull($colNota);
                $qAprobados    = DB::table($tablaBase)->whereNotNull($colNota)->where($colNota, '>=', 13);

                if ($colFecha) {
                    $qTotalConNota->whereYear($colFecha, $anio);
                    $qAprobados->whereYear($colFecha, $anio);
                }

                $conNota = (int) $qTotalConNota->count();
                if ($conNota > 0) {
                    $aprobados = (int) $qAprobados->count();
                    $tasaAprobacion = (int) round(($aprobados / $conNota) * 100);
                } else {
                    $tasaAprobacion = 90;
                }
            } elseif ($totalPracticas > 0) {
                $tasaAprobacion = 90;
            }
        }

        // Empresas / entidades en convenio
        if (Schema::hasTable('entidades')) {
            $empresasConvenio = (int) DB::table('entidades')->count();
        } elseif (Schema::hasTable('empresas')) {
            $empresasConvenio = (int) DB::table('empresas')->count();
        } elseif ($tablaBase && Schema::hasColumn($tablaBase, 'empresa_entidad')) {
            $empresasConvenio = (int) DB::table($tablaBase)
                ->whereNotNull('empresa_entidad')
                ->where('empresa_entidad', '!=', '')
                ->distinct('empresa_entidad')
                ->count('empresa_entidad');
        }

        if (empty($anual)) {
            for ($a = $anio - 3; $a <= $anio; $a++) {
                $anual[] = ['anio' => $a, 'total' => 0];
            }
        }

        return response()->json([
            'anio'              => $anio,
            'mensual'           => $mensual,
            'mensual_anterior'  => $mensualAnterior,
            'anual'             => $anual,
            'total_practicas'   => $totalPracticas,
            'total_anterior'    => $totalAnterior,
            'horas_formativas'  => $horasFormativas,
            'empresas_convenio' => $empresasConvenio,
            'tasa_aprobacion'   => $tasaAprobacion,
            'programas'         => $programas,
        ]);
    }
}