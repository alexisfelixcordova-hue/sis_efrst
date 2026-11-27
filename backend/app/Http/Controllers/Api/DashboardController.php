<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    private function tablaExpedientes(): ?string
    {
        if (Schema::hasTable('expediente_efsrt')) {
            return 'expediente_efsrt';
        }
        if (Schema::hasTable('expedientes')) {
            return 'expedientes';
        }
        return null;
    }

    private function contarDocentes(): int
    {
        if (Schema::hasTable('docentes')) {
            $cnt = DB::table('docentes')->count();
            if ($cnt > 0) {
                return $cnt;
            }
        }

        if (Schema::hasTable('users')) {
            $q = DB::table('users');
            if (Schema::hasColumn('users', 'id_rol')) {
                return $q->where('id_rol', 2)->count();
            }
            if (Schema::hasColumn('users', 'rol')) {
                return $q->whereRaw('LOWER(rol) = ?', ['docente'])->count();
            }
            return $q->count();
        }

        return 0;
    }

    private function queryListaDocentes(string $buscar = '')
    {
        if (Schema::hasTable('docentes')) {
            $q = DB::table('docentes');
            if ($buscar !== '') {
                $q->where(function ($sub) use ($buscar) {
                    foreach (['nombres', 'apellidos', 'nombre', 'name', 'especialidad', 'correo', 'email'] as $col) {
                        if (Schema::hasColumn('docentes', $col)) {
                            $sub->orWhere($col, 'ilike', "%{$buscar}%");
                        }
                    }
                });
            }
            return ['origen' => 'docentes', 'query' => $q];
        }

        $q = DB::table('users');
        if (Schema::hasColumn('users', 'id_rol')) {
            $q->where('id_rol', 2);
        } elseif (Schema::hasColumn('users', 'rol')) {
            $q->whereRaw('LOWER(rol) = ?', ['docente']);
        }

        if ($buscar !== '') {
            $q->where(function ($sub) use ($buscar) {
                foreach (['name', 'nombres', 'apellidos', 'especialidad', 'email'] as $col) {
                    if (Schema::hasColumn('users', $col)) {
                        $sub->orWhere($col, 'ilike', "%{$buscar}%");
                    }
                }
            });
        }

        return ['origen' => 'users', 'query' => $q];
    }

    public function resumen(Request $request)
    {
        if ((int) ($request->user()?->id_rol ?? 0) !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Las estadísticas institucionales son exclusivas del Administrador.',
            ], 403);
        }

        $periodo = $request->query('periodo', 'Sem');
        $tablaExp = $this->tablaExpedientes();

        $totalAlumnos = Schema::hasTable('estudiantes') ? DB::table('estudiantes')->count() : 0;
        $totalDocentes = $this->contarDocentes();

        $totalRevisiones = 0;
        $revisionesValidadas = 0;
        $horasValidadas = 0;
        $observados = 0;
        $colEstado = null;
        $colHoras = null;
        $colFecha = null;
        $estadosValidados = ['CALIFICADO', 'APROBADO', 'CERRADO', 'COMPLETADO', 'VALIDADO', 'VERIFICADO'];

        if ($tablaExp) {
            $totalRevisiones = DB::table($tablaExp)->count();
            $colEstado = collect(['estado_efsrt', 'estado_revision', 'estado'])
                ->first(fn ($col) => Schema::hasColumn($tablaExp, $col));
            $colHoras = collect(['horas_acumuladas', 'horas', 'hrs'])
                ->first(fn ($col) => Schema::hasColumn($tablaExp, $col));
            $colFecha = collect(['fecha_validacion', 'created_at', 'fecha_inicio', 'updated_at'])
                ->first(fn ($col) => Schema::hasColumn($tablaExp, $col));

            if ($colEstado) {
                $estadoNormalizado = DB::raw("UPPER(TRIM(COALESCE($colEstado, '')))");
                $revisionesValidadas = (int) DB::table($tablaExp)
                    ->whereIn($estadoNormalizado, $estadosValidados)
                    ->count();
                $observados = (int) DB::table($tablaExp)
                    ->where($estadoNormalizado, 'OBSERVADO')
                    ->count();
            }

            if ($colHoras) {
                $queryHoras = DB::table($tablaExp);
                if ($colEstado) {
                    $queryHoras->whereIn(
                        DB::raw("UPPER(TRIM(COALESCE($colEstado, '')))"),
                        $estadosValidados
                    );
                }
                $horasValidadas = (int) $queryHoras->sum($colHoras);
            }
        }

        $sparkBars = [];
        for ($i = 6; $i >= 0; $i--) {
            $fecha = now()->subDays($i)->toDateString();
            $cnt = (Schema::hasTable('estudiantes') && Schema::hasColumn('estudiantes', 'created_at'))
                ? DB::table('estudiantes')->whereDate('created_at', $fecha)->count()
                : 0;
            $sparkBars[] = ['v' => max($cnt, $totalAlumnos > 0 ? 1 : 0)];
        }

        $sparkLine = [];
        for ($i = 6; $i >= 0; $i--) {
            $fecha = now()->subDays($i)->toDateString();
            $cnt = ($tablaExp && $colFecha)
                ? DB::table($tablaExp)->whereDate($colFecha, $fecha)->count()
                : 0;
            $sparkLine[] = ['v' => max($cnt, $totalRevisiones > 0 ? 1 : 0)];
        }

        $diasMap = [
            1 => 'Lun', 2 => 'Mar', 3 => 'Mié', 4 => 'Jue',
            5 => 'Vie', 6 => 'Sáb', 7 => 'Dom',
        ];
        $semanal = [];
        foreach ($diasMap as $isoDia => $etiquetaDia) {
            $ok = 0;
            $obs = 0;
            if ($tablaExp && $colFecha && $colEstado) {
                $estadoNormalizado = DB::raw("UPPER(TRIM(COALESCE($colEstado, '')))");
                $ok = (int) DB::table($tablaExp)
                    ->whereRaw("EXTRACT(ISODOW FROM $colFecha) = ?", [$isoDia])
                    ->whereIn($estadoNormalizado, $estadosValidados)
                    ->count();
                $obs = (int) DB::table($tablaExp)
                    ->whereRaw("EXTRACT(ISODOW FROM $colFecha) = ?", [$isoDia])
                    ->where($estadoNormalizado, 'OBSERVADO')
                    ->count();
            }
            if ($ok === 0 && $obs === 0 && $totalRevisiones > 0) {
                $ok = (int) ceil(($totalRevisiones - $observados) / 7);
                $obs = (int) ceil($observados / 7);
            }
            $semanal[] = [
                'd' => $etiquetaDia,
                'ok' => $ok,
                'obs' => -$obs,
            ];
        }

        $modulosBase = ['Mód I', 'Mód II', 'Mód III', 'Mód IV', 'Mód V', 'Mód VI'];
        $modulos = [];
        foreach ($modulosBase as $idx => $etiquetaMod) {
            $nombreFull = 'Módulo ' . ($idx + 1);
            $horasMod = 0;
            $proyMod = 0;

            if ($tablaExp && Schema::hasColumn($tablaExp, 'modulo')) {
                if (Schema::hasColumn($tablaExp, 'horas')) {
                    $horasMod = (int) DB::table($tablaExp)
                        ->where('modulo', 'ilike', "%{$nombreFull}%")
                        ->sum('horas');
                }
                $proyMod = (int) DB::table($tablaExp)
                    ->where('modulo', 'ilike', "%{$nombreFull}%")
                    ->count();
            }

            if ($horasMod === 0 && $proyMod === 0 && ($horasValidadas > 0 || $totalRevisiones > 0)) {
                $factor = $periodo === 'Mes' ? 1.2 : ($periodo === 'Año' ? 1.5 : ($periodo === 'All' ? 2 : 1));
                $horasMod = (int) round(($horasValidadas / 6) * $factor);
                $proyMod = (int) max(1, round(($totalRevisiones / 6) * $factor));
            }

            $modulos[] = [
                'm' => $etiquetaMod,
                'horas' => $horasMod,
                'proy' => $proyMod,
            ];
        }

        $meta = $totalRevisiones > 0
            ? min(100, (int) round(($revisionesValidadas / $totalRevisiones) * 100))
            : 0;

        return response()->json([
            'alumnosRegistrados' => $totalAlumnos,
            'varAlumnos' => $totalAlumnos > 0 ? '+100%' : '0%',
            'revisionesEfsrt' => $totalRevisiones,
            'varRevisiones' => $totalRevisiones > 0 ? '+100%' : '0%',
            'horasValidadas' => $horasValidadas,
            'varHoras' => $horasValidadas > 0 ? '+100%' : '0%',
            'metaInstitucional' => $meta,
            'docentesAsesores' => $totalDocentes,
            'totalDocentesAsignados' => $totalDocentes,
            'revisionesSemanalesTotal' => $totalRevisiones,
            'varSemanal' => $totalRevisiones > 0 ? '+100%' : '0%',
            'horasModuloTotal' => number_format($horasValidadas) . ' hrs',
            'varModulo' => $horasValidadas > 0 ? '+100%' : '0%',
            'sparkBars' => $sparkBars,
            'sparkLine' => $sparkLine,
            'semanal' => $semanal,
            'modulos' => $modulos,
            'totalesModulos' => [
                [number_format($horasValidadas), 'Total de horas'],
                [$totalRevisiones, 'EFSRT'],
                [$totalAlumnos, 'Alumnos'],
                [$observados, 'Con Retraso'],
            ],
        ]);
    }

    public function docentes(Request $request)
    {
        $buscar = (string) $request->query('buscar', '');
        $limite = max(1, (int) $request->query('limite', 4));

        ['origen' => $origen, 'query' => $query] = $this->queryListaDocentes($buscar);
        $total = (clone $query)->count();

        $items = $query->limit($limite)->get()->map(function ($d, $idx) use ($origen) {
            $nombre = $d->name
                ?? $d->nombre
                ?? trim(($d->nombres ?? '') . ' ' . ($d->apellidos ?? ''))
                ?: ('Docente ' . ($idx + 1));
            $id = $d->id_docente ?? $d->id ?? $d->id_usuario ?? ($origen . '-' . ($idx + 1));

            return [
                'id' => $id,
                'name' => $nombre,
                'role' => $d->especialidad ?? $d->cargo ?? 'Asesor EFSRT',
                'status' => ($d->activo ?? true) ? 'Activo' : 'En Revisión',
                'img' => $d->foto_url ?? $d->foto ?? '',
            ];
        });

        return response()->json(['items' => $items, 'total' => $total]);
    }

    public function expedientes(Request $request)
    {
        $tablaExp = $this->tablaExpedientes();
        if (!$tablaExp) {
            return response()->json(['items' => [], 'total' => 0]);
        }

        $buscar = (string) $request->query('buscar', '');
        $estado = (string) $request->query('estado', '');
        $orden = $request->query('orden', 'desc') === 'asc' ? 'asc' : 'desc';
        $pagina = max(1, (int) $request->query('pagina', 1));
        $porPagina = max(1, (int) $request->query('porPagina', 5));

        $query = DB::table($tablaExp)
            ->when($estado !== '' && Schema::hasColumn($tablaExp, 'estado'), fn ($q) => $q->where('estado', $estado))
            ->when($buscar !== '', function ($q) use ($buscar, $tablaExp) {
                $q->where(function ($sub) use ($buscar, $tablaExp) {
                    foreach (['codigo', 'numero_expediente', 'estudiante_nombre', 'observaciones'] as $col) {
                        if (Schema::hasColumn($tablaExp, $col)) {
                            $sub->orWhere($col, 'ilike', "%{$buscar}%");
                        }
                    }
                });
            });

        $total = (clone $query)->count();
        $colOrden = Schema::hasColumn($tablaExp, 'created_at')
            ? 'created_at'
            : (Schema::hasColumn($tablaExp, 'id_expediente') ? 'id_expediente' : 'id');

        $items = $query->orderBy($colOrden, $orden)
            ->offset(($pagina - 1) * $porPagina)
            ->limit($porPagina)
            ->get()
            ->map(function ($e, $idx) {
                $fechaRaw = $e->created_at ?? $e->fecha_inicio ?? null;
                $horas = $e->horas ?? $e->horas_acumuladas ?? 0;
                return [
                    'id' => $e->codigo ?? $e->numero_expediente ?? $e->id_expediente ?? $e->id ?? ('EXP-' . ($idx + 1)),
                    'fecha' => $fechaRaw ? date('d M Y', strtotime($fechaRaw)) : '-',
                    'est' => $e->estudiante_nombre ?? $e->estudiante ?? 'Estudiante',
                    'hrs' => $horas . ' hrs',
                    'estado' => $e->estado ?? 'En Progreso',
                ];
            });

        return response()->json(['items' => $items, 'total' => $total]);
    }

    public function alumnosRecientes(Request $request)
    {
        if (!Schema::hasTable('estudiantes')) {
            return response()->json(['items' => []]);
        }

        $limite = max(1, (int) $request->query('limite', 5));
        $tag = (string) $request->query('tag', '');
        $orden = $request->query('orden', 'asc') === 'desc' ? 'desc' : 'asc';
        $colOrden = Schema::hasColumn('estudiantes', 'nombres')
            ? 'nombres'
            : (Schema::hasColumn('estudiantes', 'id_estudiante') ? 'id_estudiante' : 'id');

        $items = DB::table('estudiantes')
            ->orderBy($colOrden, $orden)
            ->limit($limite)
            ->get()
            ->map(function ($a, $idx) use ($tag) {
                $nombre = trim(($a->nombres ?? '') . ' ' . ($a->apellidos ?? '')) ?: ('Alumno ' . ($idx + 1));
                $id = $a->id_estudiante ?? $a->id ?? ('alu-' . ($idx + 1));
                return [
                    'id' => $id,
                    'name' => $nombre,
                    'tag' => $tag ?: 'ALUMNO',
                    'color' => 'text-[#16a34a]',
                    'img' => $a->foto_url ?? $a->foto ?? '',
                ];
            });

        return response()->json(['items' => $items]);
    }

    public function crearConstancia(Request $request)
    {
        $tablaExp = $this->tablaExpedientes();
        if (!$tablaExp) {
            return response()->json(['message' => 'Tabla de expedientes no encontrada'], 404);
        }

        $data = $request->validate([
            'estudiante' => 'required|string|max:150',
            'horas' => 'required|integer|min:1',
            'modulo' => 'required|string|max:50',
        ]);

        $insert = [
            'codigo' => (string) random_int(1200000000, 1299999999),
            'estudiante_nombre' => $data['estudiante'],
            'horas' => $data['horas'],
            'modulo' => $data['modulo'],
            'estado' => 'Aprobado',
        ];
        if (Schema::hasColumn($tablaExp, 'created_at')) {
            $insert['created_at'] = now();
        }
        if (Schema::hasColumn($tablaExp, 'updated_at')) {
            $insert['updated_at'] = now();
        }

        $id = DB::table($tablaExp)->insertGetId($insert);

        return response()->json(['message' => 'Constancia emitida', 'id' => $id], 201);
    }

    public function asignarDocente(Request $request)
    {
        $data = $request->validate([
            'docente' => 'required|string|max:150',
            'modulo' => 'required|string|max:100',
        ]);

        ['origen' => $origen, 'query' => $query] = $this->queryListaDocentes($data['docente']);
        $update = ['especialidad' => $data['modulo']];
        if (Schema::hasColumn($origen, 'updated_at')) {
            $update['updated_at'] = now();
        }

        $query->update($update);

        return response()->json(['message' => 'Asesor asignado correctamente']);
    }

    public function exportar(Request $request)
    {
        $tablaExp = $this->tablaExpedientes();
        $estado = $request->query('estado', '');

        $rows = $tablaExp
            ? DB::table($tablaExp)
                ->when($estado !== '' && Schema::hasColumn($tablaExp, 'estado'), fn ($q) => $q->where('estado', $estado))
                ->orderByDesc(Schema::hasColumn($tablaExp, 'created_at') ? 'created_at' : 'id_estudiante')
                ->get()
            : collect();

        $csv = "ID Expediente,Fecha,Estudiante,Horas EFSRT,Estado\n";
        foreach ($rows as $r) {
            $codigo = $r->codigo ?? $r->id_expediente ?? $r->id ?? '';
            $fecha = $r->created_at ?? '';
            $est = $r->estudiante_nombre ?? '';
            $hrs = $r->horas ?? 0;
            $estEstado = $r->estado ?? '';
            $csv .= "{$codigo},{$fecha},\"{$est}\",{$hrs} hrs,{$estEstado}\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="reporte-efsrt.csv"',
        ]);
    }
}