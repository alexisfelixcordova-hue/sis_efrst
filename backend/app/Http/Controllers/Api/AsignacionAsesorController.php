<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsignacionAsesor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AsignacionAsesorController extends Controller
{
    private array $tablasExistentes = [];
    private array $columnasPorTabla = [];

    private function existeTabla(string $tabla): bool
    {
        if (!array_key_exists($tabla, $this->tablasExistentes)) {
            $this->tablasExistentes[$tabla] = Schema::hasTable($tabla);
        }

        return $this->tablasExistentes[$tabla];
    }

    private function existeColumna(string $tabla, string $columna): bool
    {
        if (!$this->existeTabla($tabla)) {
            return false;
        }

        if (!array_key_exists($tabla, $this->columnasPorTabla)) {
            $this->columnasPorTabla[$tabla] = Schema::getColumnListing($tabla);
        }

        return in_array($columna, $this->columnasPorTabla[$tabla], true);
    }

    private function verificarAdmin(Request $request)
    {
        $user = $request->user();

        if (!$user || (int) $user->id_rol !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Se requiere rol de Administrador.'
            ], 403);
        }

        return null;
    }

    private function resolverIdsDocente($usuario): array
    {
        $idUsuario = $usuario->id_usuario ?? $usuario->id ?? null;
        if ($idUsuario) {
            return [(int) $idUsuario];
        }

        if (!empty($usuario->id_docente)) {
            return [(int) $usuario->id_docente];
        }

        if ($this->existeTabla('docentes')) {
            $q = DB::table('docentes');
            $matched = false;

            if (!empty($usuario->correo) && $this->existeColumna('docentes', 'correo')) {
                $q->where('correo', $usuario->correo);
                $matched = true;
            } elseif (!empty($usuario->email) && $this->existeColumna('docentes', 'email')) {
                $q->where('email', $usuario->email);
                $matched = true;
            }

            if ($matched) {
                $idColumna = collect(['id_usuario', 'id_docente', 'id'])
                    ->first(fn ($columna) => $this->existeColumna('docentes', $columna));

                return $idColumna
                    ? $q->pluck($idColumna)->map(fn ($id) => (int) $id)->unique()->values()->all()
                    : [];
            }

            return [];
        }

        return [];
    }

    /**
     * Alumnos asignados al docente (o todos si es admin),
     * filtrables por módulo y búsqueda.
     * Permite que un alumno tenga más de un módulo distinto (ej. 1 o 2 módulos),
     * pero evita duplicados exactos por (id_estudiante, id_modulo, periodo_academico).
     */
    public function misAlumnos(Request $request)
    {
        $usuario = $request->user();
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.'
            ], 401);
        }

        $esAdmin = (int) ($usuario->id_rol ?? 0) === 1;
        $idsDocente = $this->resolverIdsDocente($usuario);

        $query = DB::table('asignacion_asesores as a')
            ->join('estudiantes as e', 'e.id_estudiante', '=', 'a.id_estudiante');

        if ($esAdmin && $request->filled('id_docente')) {
            $query->where('a.id_docente', (int) $request->id_docente);
        } elseif (!$esAdmin && empty($idsDocente)) {
            return response()->json(['success' => true, 'data' => []], 200);
        } elseif (!$esAdmin) {
            $query->whereIn('a.id_docente', $idsDocente);
            if ($request->filled('id_docente')) {
                $query->where('a.id_docente', (int) $request->id_docente);
            }
        }

        $tablaModulos = 'modulos_profesionales';
        $colModId = $this->existeTabla($tablaModulos)
            ? collect(['id_modulo', 'id'])->first(fn ($c) => $this->existeColumna($tablaModulos, $c))
            : null;
        $colModNombre = $this->existeTabla($tablaModulos)
            ? collect(['nombre', 'nombre_modulo', 'titulo', 'descripcion'])->first(fn ($c) => $this->existeColumna($tablaModulos, $c))
            : null;

        $tieneIdModulo = $this->existeColumna('asignacion_asesores', 'id_modulo');
        $tienePeriodo  = $this->existeColumna('asignacion_asesores', 'periodo_academico');
        $tieneIdDoc    = $this->existeColumna('asignacion_asesores', 'id_docente');
        $tienePkAsig   = $this->existeColumna('asignacion_asesores', 'id_asignacion');

        $columnas = ['e.*'];

        if ($tienePkAsig) {
            $columnas[] = 'a.id_asignacion';
        }
        if ($tieneIdDoc) {
            $columnas[] = 'a.id_docente';
        }
        if ($tieneIdModulo) {
            $columnas[] = 'a.id_modulo';
        }
        if ($tienePeriodo) {
            $columnas[] = 'a.periodo_academico';
        }

        if ($this->existeTabla('docentes') && $tieneIdDoc) {
            $docIdCol = collect(['id_usuario', 'id_docente', 'id'])
                ->first(fn ($c) => $this->existeColumna('docentes', $c));
            if ($docIdCol) {
                $query->leftJoin('docentes as d', "d.$docIdCol", '=', 'a.id_docente');
                $partesNombre = [];
                if ($this->existeColumna('docentes', 'nombres')) {
                    $partesNombre[] = 'COALESCE(d.nombres, \'\')';
                }
                if ($this->existeColumna('docentes', 'apellidos')) {
                    $partesNombre[] = 'COALESCE(d.apellidos, \'\')';
                }
                if (!empty($partesNombre)) {
                    $concatExpr = "TRIM(CONCAT_WS(' ', " . implode(', ', $partesNombre) . "))";
                    $columnas[] = DB::raw("NULLIF($concatExpr, '') as docente_nombre");
                } elseif ($this->existeColumna('docentes', 'nombre')) {
                    $columnas[] = DB::raw('d.nombre as docente_nombre');
                }
            }
        }

        if ($colModId && $colModNombre && $tieneIdModulo) {
            $columnas[] = DB::raw("COALESCE(m.$colModNombre, 'Módulo EFSRT') as modulo_nombre");
            $query->leftJoin("$tablaModulos as m", "m.$colModId", '=', 'a.id_modulo');
        } else {
            $columnas[] = DB::raw("'Módulo EFSRT' as modulo_nombre");
        }

        // Expediente separado por id_estudiante + id_modulo
        if ($this->existeTabla('expediente_efsrt')) {
            $query->leftJoin('expediente_efsrt as exp', function ($join) use ($tieneIdModulo) {
                $join->on('exp.id_estudiante', '=', 'a.id_estudiante');
                if ($tieneIdModulo && $this->existeColumna('expediente_efsrt', 'id_modulo')) {
                    $join->on('exp.id_modulo', '=', 'a.id_modulo');
                }
            });

            $expPk = collect(['id_expediente', 'id'])->first(fn ($c) => $this->existeColumna('expediente_efsrt', $c));
            if ($expPk) {
                $columnas[] = "exp.$expPk as id_expediente";
            }
            if ($this->existeColumna('expediente_efsrt', 'horas_acumuladas')) {
                $columnas[] = DB::raw('COALESCE(exp.horas_acumuladas, 0) as horas_acumuladas');
            }
            if ($this->existeColumna('expediente_efsrt', 'fecha_inicio')) {
                $columnas[] = 'exp.fecha_inicio';
            }
            if ($this->existeColumna('expediente_efsrt', 'estado_efsrt')) {
                $columnas[] = 'exp.estado_efsrt';
            }
            if ($this->existeColumna('expediente_efsrt', 'nota')) {
                $columnas[] = 'exp.nota';
            } elseif ($this->existeColumna('expediente_efsrt', 'calificacion')) {
                $columnas[] = DB::raw('exp.calificacion as nota');
            }
        }

        $tieneEmpresaExpediente = $this->existeTabla('expediente_efsrt')
            && $this->existeColumna('expediente_efsrt', 'id_empresa');
        $tieneEmpresaAsignacion = $this->existeColumna('asignacion_asesores', 'id_empresa');
        if (
            $this->existeTabla('empresas_convenio')
            && ($tieneEmpresaExpediente || $tieneEmpresaAsignacion)
        ) {
            $empresaId = $tieneEmpresaExpediente && $tieneEmpresaAsignacion
                ? 'COALESCE(exp.id_empresa, a.id_empresa)'
                : ($tieneEmpresaExpediente ? 'exp.id_empresa' : 'a.id_empresa');
            $query->leftJoin('empresas_convenio as emp', function ($join) use ($empresaId) {
                $join->on('emp.id_empresa', '=', DB::raw($empresaId));
            });
            $columnas[] = DB::raw("$empresaId as id_empresa");
            if ($this->existeColumna('empresas_convenio', 'razon_social')) {
                $columnas[] = DB::raw('emp.razon_social as empresa_razon_social');
            }
            foreach ([
                'ruc',
                'estado_convenio',
                'telefono',
                'correo_electronico',
                'direccion',
                'supervisor_empresa_nombre',
                'supervisor_empresa_cargo',
            ] as $columnaEmpresa) {
                if ($this->existeColumna('empresas_convenio', $columnaEmpresa)) {
                    $columnas[] = "emp.$columnaEmpresa";
                }
            }
        }

        $query->select($columnas);

        if ($request->filled('id_modulo') && $request->id_modulo !== 'todos' && $tieneIdModulo) {
            $query->where('a.id_modulo', (int) $request->id_modulo);
        }

        if ($request->filled('search')) {
            $term = '%' . trim($request->search) . '%';
            $query->where(function ($sub) use ($term) {
                $sub->where('e.dni', 'ILIKE', $term)
                    ->orWhere('e.nombres', 'ILIKE', $term)
                    ->orWhere('e.apellidos', 'ILIKE', $term);

                if ($this->existeColumna('estudiantes', 'correo')) {
                    $sub->orWhere('e.correo', 'ILIKE', $term);
                }
            });
        }

        if ($tienePkAsig) {
            $query->orderByDesc('a.id_asignacion');
        }
        $query->orderBy('e.apellidos')->orderBy('e.nombres');

        // Evita duplicados exactos por (id_estudiante, id_modulo, periodo_academico)
        $alumnos = $query->get()
            ->unique(function ($row) {
                $moduloClave = strtolower(trim((string) ($row->id_modulo ?? $row->modulo_nombre ?? '')));
                $periodoClave = strtolower(trim((string) ($row->periodo_academico ?? '')));
                return implode('|', [
                    (string) ($row->id_estudiante ?? ''),
                    $moduloClave,
                    $periodoClave,
                ]);
            })
            ->values();

        return response()->json([
            'success' => true,
            'data'    => $alumnos,
        ], 200);
    }

    public function index(Request $request)
    {
        if ($error = $this->verificarAdmin($request)) {
            return $error;
        }

        $query = AsignacionAsesor::with(['estudiante', 'modulo', 'docente']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('periodo_academico', 'ILIKE', "%{$search}%");
        }

        if ($request->filled('id_docente')) {
            $query->where('id_docente', $request->id_docente);
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

        $validated = $request->validate([
            'id_docente'        => 'required|integer',
            'id_estudiante'     => 'required|integer',
            'id_modulo'         => 'required|integer',
            'periodo_academico' => 'required|string|max:20',
        ]);

        $periodoLimpio = trim((string) $validated['periodo_academico']);

        $asignacion = DB::transaction(function () use ($validated, $periodoLimpio) {
            $criterios = [
                'id_estudiante'     => (int) $validated['id_estudiante'],
                'id_modulo'         => (int) $validated['id_modulo'],
                'periodo_academico' => $periodoLimpio,
            ];

            $coincidentes = AsignacionAsesor::where($criterios)
                ->orderByDesc('id_asignacion')
                ->get();

            $principal = $coincidentes->first();

            if ($principal) {
                $principal->update([
                    'id_docente'        => (int) $validated['id_docente'],
                    'id_modulo'         => (int) $validated['id_modulo'],
                    'periodo_academico' => $periodoLimpio,
                ]);

                if ($coincidentes->count() > 1) {
                    $idsDuplicados = $coincidentes->slice(1)->pluck('id_asignacion');
                    AsignacionAsesor::whereIn('id_asignacion', $idsDuplicados)->delete();
                }

                return $principal->fresh();
            }

            return AsignacionAsesor::create([
                'id_docente'        => (int) $validated['id_docente'],
                'id_estudiante'     => (int) $validated['id_estudiante'],
                'id_modulo'         => (int) $validated['id_modulo'],
                'periodo_academico' => $periodoLimpio,
            ]);
        });

        $asignacion->load(['estudiante', 'modulo', 'docente']);

        return response()->json([
            'success' => true,
            'message' => 'Asignación de asesor guardada correctamente (sin duplicados por módulo)',
            'data'    => $asignacion
        ], 200);
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
            'data'    => $asignacion
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

        $validated = $request->validate([
            'id_docente'        => 'sometimes|integer',
            'id_estudiante'     => 'sometimes|integer',
            'id_modulo'         => 'sometimes|integer',
            'periodo_academico' => 'sometimes|string|max:20',
        ]);

        if (isset($validated['periodo_academico'])) {
            $validated['periodo_academico'] = trim((string) $validated['periodo_academico']);
        }

        $idEst = (int) ($validated['id_estudiante'] ?? $asignacion->id_estudiante);
        $idMod = (int) ($validated['id_modulo'] ?? $asignacion->id_modulo);
        $periodo = $validated['periodo_academico'] ?? $asignacion->periodo_academico;

        $duplicada = AsignacionAsesor::where('id_estudiante', $idEst)
            ->where('id_modulo', $idMod)
            ->where('periodo_academico', $periodo)
            ->where('id_asignacion', '!=', $asignacion->id_asignacion)
            ->first();

        if ($duplicada) {
            $duplicada->update($validated);
            $asignacion->delete();
            $duplicada->load(['estudiante', 'modulo', 'docente']);

            return response()->json([
                'success' => true,
                'message' => 'Asignación actualizada y consolidada sin duplicados',
                'data'    => $duplicada
            ], 200);
        }

        $asignacion->update($validated);
        $asignacion->load(['estudiante', 'modulo', 'docente']);

        return response()->json([
            'success' => true,
            'message' => 'Asignación actualizada correctamente',
            'data'    => $asignacion
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