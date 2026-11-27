<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\AsignacionRecibida;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class DocenteController extends Controller
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

    /**
     * Lista de docentes para la pantalla "Plantel docente".
     */
    public function index()
    {
        $tieneFoto = $this->existeColumna('usuarios', 'foto_perfil');

        $columnas = [
            'u.id_usuario', 'u.nombres', 'u.apellidos', 'u.dni', 'u.correo',
            'd.departamento', 'd.capacidad'
        ];
        if ($tieneFoto) {
            $columnas[] = 'u.foto_perfil';
        }

        $docentes = DB::table('usuarios as u')
            ->leftJoin('docentes as d', 'd.id_usuario', '=', 'u.id_usuario')
            ->where('u.id_rol', 2)
            ->select($columnas)
            ->orderBy('u.nombres')
            ->get();

        $alumnosPorDocente = DB::table('asignacion_asesores')
            ->select('id_docente', DB::raw('COUNT(*) as total'))
            ->groupBy('id_docente')
            ->pluck('total', 'id_docente');

        $modulosPorDocente = $this->modulosPorDocente();

        return response()->json($docentes->map(function ($d) use ($alumnosPorDocente, $modulosPorDocente, $tieneFoto) {
            $alumnos   = (int) ($alumnosPorDocente[$d->id_usuario] ?? 0);
            $capacidad = (int) ($d->capacidad ?? 12);
            $modulos   = $modulosPorDocente[$d->id_usuario] ?? [];

            return [
                'id_usuario'   => $d->id_usuario,
                'nombres'      => $d->nombres,
                'apellidos'    => $d->apellidos,
                'correo'       => $d->correo,
                'foto_perfil'  => $tieneFoto ? ($d->foto_perfil ?? null) : null,
                'departamento' => $d->departamento,
                'alumnos'      => $alumnos,
                'capacidad'    => $capacidad,
                'estado'       => $alumnos >= $capacidad ? 'Cupo Completo'
                                     : ($alumnos > 0 ? 'En Sesión' : 'Disponible'),
                'modulos'      => $modulos,
                'modulo'       => $modulos ? implode(', ', $modulos) : null,
            ];
        })->values());
    }

    /**
     * Ficha de un docente con sus alumnos asignados y datos completos.
     */
    public function show($id)
    {
        $tieneFoto = $this->existeColumna('usuarios', 'foto_perfil');

        $columnas = [
            'u.id_usuario', 'u.nombres', 'u.apellidos', 'u.dni', 'u.correo',
            'd.codigo', 'd.departamento', 'd.grado', 'd.especialidad',
            'd.condicion', 'd.telefono', 'd.capacidad', 'd.sede', 'd.biografia'
        ];
        if ($tieneFoto) {
            $columnas[] = 'u.foto_perfil';
        }

        $docente = DB::table('usuarios as u')
            ->leftJoin('docentes as d', 'd.id_usuario', '=', 'u.id_usuario')
            ->where('u.id_usuario', $id)
            ->select($columnas)
            ->first();

        if (!$docente) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        // Obtenemos los alumnos asignados mapeando todas las columnas de la tabla 'estudiantes'
        $alumnos = DB::table('asignacion_asesores as a')
            ->join('estudiantes as e', 'e.id_estudiante', '=', 'a.id_estudiante')
            ->where('a.id_docente', $id)
            ->select('e.*')
            ->get()
            ->map(fn ($e) => [
                'id_estudiante'     => $e->id_estudiante ?? $e->id ?? null,
                'nombres'           => $e->nombres ?? '',
                'apellidos'         => $e->apellidos ?? '',
                'foto_url'          => $e->foto_url ?? null,
                'nombre'            => trim(($e->nombres ?? '') . ' ' . ($e->apellidos ?? '')),
                'dni'               => $e->dni ?? null,
                'carrera'           => $e->programa_estudios ?? 'Diseño y Programación Web',
                'ciclo'             => $e->semestre ?? 'VI Semestre',
                'proyecto'          => $e->proyecto_titulo ?? $e->proyecto ?? 'Sistema Web EFSRT',
                'entidad'           => $e->entidad_nombre ?? $e->entidad ?? 'Empresa Local',
                'hrs'               => $e->horas_acumuladas ?? $e->hrs ?? 160,
                'estado'            => $e->estado ?? 'Al día',
                'correo'            => $e->correo ?? $e->email ?? 'No registrado',
                'telefono'          => $e->telefono ?? 'No registrado',
                'direccion'         => $e->direccion ?? 'No registrada',
                'programa_estudios' => $e->programa_estudios ?? 'Diseño y Programación Web',
                'semestre'          => $e->semestre ?? 'VI Semestre',
            ]);

        $otros = DB::table('usuarios')
            ->where('id_rol', 2)
            ->where('id_usuario', '!=', $id)
            ->take(6)
            ->pluck('nombres');

        return response()->json([
            'docente' => [
                'nombre'       => trim(($docente->nombres ?? '') . ' ' . ($docente->apellidos ?? '')),
                'foto_perfil'  => $tieneFoto ? ($docente->foto_perfil ?? null) : null,
                'cargo'        => 'Docente Asesor EFSRT',
                'departamento' => $docente->departamento,
                'grado'        => $docente->grado,
                'especialidad' => $docente->especialidad,
                'condicion'    => $docente->condicion,
                'dni'          => $docente->dni,
                'codigo'       => $docente->codigo ?? 'DOC-2026-' . str_pad($docente->id_usuario, 3, '0', STR_PAD_LEFT),
                'correo'       => $docente->correo,
                'telefono'     => $docente->telefono,
                'capacidad'    => $docente->capacidad ?? 12,
                'sede'         => $docente->sede,
                'biografia'    => $docente->biografia,
            ],
            'alumnos'       => $alumnos,
            'actividad'     => [],
            'otrosDocentes' => $otros,
        ]);
    }

    /**
     * Lista los IDs de estudiantes actualmente asignados a un docente (opcionalmente filtrado por módulo).
     */
    public function estudiantesAsignados(Request $request, $id)
    {
        $query = DB::table('asignacion_asesores as a')
            ->join('estudiantes as e', 'e.id_estudiante', '=', 'a.id_estudiante')
            ->where('a.id_docente', $id);

        if ($request->filled('id_modulo') && $this->existeColumna('asignacion_asesores', 'id_modulo')) {
            $query->where('a.id_modulo', (int) $request->id_modulo);
        }

        if ($request->filled('periodo_academico') && $this->existeColumna('asignacion_asesores', 'periodo_academico')) {
            $periodo = trim((string) $request->periodo_academico);
            if (preg_match('/^\d{4}$/', $periodo)) {
                $query->where('a.periodo_academico', 'like', $periodo . '%');
            } else {
                $query->where('a.periodo_academico', $periodo);
            }
        }

        $columnas = ['e.*'];
        foreach (['id_asignacion', 'id_docente', 'id_modulo', 'periodo_academico'] as $columna) {
            if ($this->existeColumna('asignacion_asesores', $columna)) {
                $columnas[] = "a.$columna";
            }
        }

        $tieneExpedientes = $this->existeTabla('expediente_efsrt');
        $tieneEmpresaExpediente = $tieneExpedientes
            && $this->existeColumna('expediente_efsrt', 'id_empresa');
        $tieneEmpresaAsignacion = $this->existeColumna('asignacion_asesores', 'id_empresa');

        if ($tieneExpedientes) {
            $query->leftJoin('expediente_efsrt as exp', function ($join) {
                $join->on('exp.id_estudiante', '=', 'a.id_estudiante')
                    ->on('exp.id_modulo', '=', 'a.id_modulo');
            });

            foreach (['id_expediente', 'fecha_inicio', 'estado_efsrt', 'horas_acumuladas'] as $columna) {
                if ($this->existeColumna('expediente_efsrt', $columna)) {
                    $columnas[] = "exp.$columna";
                }
            }
            if ($this->existeColumna('expediente_efsrt', 'id_representante_empresa')) {
                $columnas[] = 'exp.id_representante_empresa';
            }
        }

        if ($this->existeTabla('empresas_convenio') && ($tieneEmpresaExpediente || $tieneEmpresaAsignacion)) {
            $empresaId = $tieneEmpresaExpediente && $tieneEmpresaAsignacion
                ? 'COALESCE(exp.id_empresa, a.id_empresa)'
                : ($tieneEmpresaExpediente ? 'exp.id_empresa' : 'a.id_empresa');

            $query->leftJoin('empresas_convenio as emp', function ($join) use ($empresaId) {
                $join->on('emp.id_empresa', '=', DB::raw($empresaId));
            });
            $columnas[] = DB::raw("$empresaId as id_empresa");
            foreach ([
                'razon_social' => 'empresa_razon_social',
                'ruc' => 'ruc',
                'estado_convenio' => 'estado_convenio',
                'telefono' => 'telefono',
                'correo_electronico' => 'correo_electronico',
                'direccion' => 'direccion',
                'supervisor_empresa_nombre' => 'supervisor_empresa_nombre',
                'supervisor_empresa_cargo' => 'supervisor_empresa_cargo',
            ] as $columna => $alias) {
                if ($this->existeColumna('empresas_convenio', $columna)) {
                    $columnas[] = $columna === $alias
                        ? "emp.$columna"
                        : "emp.$columna as $alias";
                }
            }
        }

        if (
            $tieneExpedientes
            && $this->existeColumna('expediente_efsrt', 'id_representante_empresa')
            && $this->existeTabla('empresa_representantes')
        ) {
            $query->leftJoin(
                'empresa_representantes as rep',
                'rep.id_representante_empresa',
                '=',
                'exp.id_representante_empresa'
            );
            foreach (['nombre', 'cargo', 'telefono', 'correo'] as $columna) {
                if ($this->existeColumna('empresa_representantes', $columna)) {
                    $columnas[] = "rep.$columna as representante_empresa_$columna";
                }
            }
        }

        if ($this->existeColumna('expediente_efsrt', 'id_expediente')) {
            $query->orderByDesc('exp.id_expediente');
        }
        if ($this->existeColumna('asignacion_asesores', 'id_asignacion')) {
            $query->orderByDesc('a.id_asignacion');
        }
        $query->orderBy('e.apellidos')->orderBy('e.nombres');

        $alumnos = $query->select($columnas)
            ->get()
            ->unique(fn ($alumno) => implode('|', [
                (string) ($alumno->id_estudiante ?? ''),
                (string) ($alumno->id_modulo ?? ''),
                (string) ($alumno->periodo_academico ?? ''),
            ]))
            ->values();

        return response()->json([
            'data' => $alumnos,
        ]);
    }

    /**
     * Guarda o actualiza en lote los estudiantes asignados a un docente para un módulo y periodo.
     */
    public function asignarEstudiantes(Request $request, $id)
    {
        $validated = $request->validate([
            'estudiantes'       => 'present|array',
            'estudiantes.*'     => 'integer',
            'id_modulo'         => 'required|integer',
            'periodo_academico' => 'nullable|string|max:20',
            'id_empresa'        => 'nullable|integer|exists:empresas_convenio,id_empresa',
            'asignaciones'      => 'sometimes|array',
            'asignaciones.*.id_estudiante' => 'required_with:asignaciones|integer|distinct',
            'asignaciones.*.id_empresa'    => 'nullable|integer|exists:empresas_convenio,id_empresa',
            'asignaciones.*.id_representante_empresa' => 'nullable|integer|exists:empresa_representantes,id_representante_empresa',
            'asignaciones.*.fecha_inicio' => 'nullable|date',
        ], [
            'id_modulo.required' => 'Debes seleccionar un módulo profesional.',
        ]);

        $docenteExiste = DB::table('usuarios')
            ->where('id_usuario', $id)
            ->where('id_rol', 2)
            ->exists();

        if (!$docenteExiste) {
            return response()->json([
                'message' => 'El docente seleccionado no existe.',
            ], 404);
        }

        $idsEstudiantes = array_values(array_unique(array_map('intval', $request->estudiantes)));
        $idModulo       = (int) $request->input('id_modulo');
        $periodo        = trim((string) ($request->input('periodo_academico') ?: '2026-II'));
        $tienePeriodo   = $this->existeColumna('asignacion_asesores', 'periodo_academico');
        $tieneCreatedAt = $this->existeColumna('asignacion_asesores', 'created_at');
        $tieneUpdatedAt = $this->existeColumna('asignacion_asesores', 'updated_at');
        $empresasPorEstudiante = collect($validated['asignaciones'] ?? [])
            ->mapWithKeys(fn ($asignacion) => [
                (string) $asignacion['id_estudiante'] => $asignacion['id_empresa'] ?? null,
            ]);
        $representantesPorEstudiante = collect($validated['asignaciones'] ?? [])
            ->mapWithKeys(fn ($asignacion) => [
                (string) $asignacion['id_estudiante'] => $asignacion['id_representante_empresa'] ?? null,
            ]);
        $fechasInicioPorEstudiante = collect($validated['asignaciones'] ?? [])
            ->mapWithKeys(fn ($asignacion) => [
                (string) $asignacion['id_estudiante'] => $asignacion['fecha_inicio'] ?? null,
            ]);
        $empresaPredeterminada = $validated['id_empresa'] ?? null;
        $tieneEmpresaAsignacion = $this->existeColumna('asignacion_asesores', 'id_empresa');
        $tieneTablaExpediente = $this->existeTabla('expediente_efsrt');
        $tieneEmpresaExpediente = $tieneTablaExpediente
            && $this->existeColumna('expediente_efsrt', 'id_empresa')
            && $this->existeColumna('expediente_efsrt', 'id_estudiante')
            && $this->existeColumna('expediente_efsrt', 'id_modulo');
        $tieneRepresentanteExpediente = $tieneTablaExpediente
            && $this->existeColumna('expediente_efsrt', 'id_representante_empresa');

        $hayEmpresasAsignadas = $idsEstudiantes && collect($idsEstudiantes)->contains(
            fn ($idEstudiante) => $empresasPorEstudiante->get((string) $idEstudiante, $empresaPredeterminada) !== null
        );
        $hayRepresentantesAsignados = $idsEstudiantes && collect($idsEstudiantes)->contains(
            fn ($idEstudiante) => $representantesPorEstudiante->get((string) $idEstudiante) !== null
        );
        if ($hayEmpresasAsignadas && !$tieneEmpresaAsignacion && !$tieneEmpresaExpediente) {
            throw ValidationException::withMessages([
                'asignaciones' => 'La base de datos no permite guardar la empresa vinculada al expediente.',
            ]);
        }
        if ($hayRepresentantesAsignados && !$tieneRepresentanteExpediente) {
            throw ValidationException::withMessages([
                'asignaciones' => 'La base de datos no permite guardar el representante del expediente.',
            ]);
        }
        if ($hayRepresentantesAsignados && !$tieneEmpresaExpediente) {
            throw ValidationException::withMessages([
                'asignaciones' => 'El expediente debe permitir guardar la empresa para asignar un representante.',
            ]);
        }
        foreach ($validated['asignaciones'] ?? [] as $asignacion) {
            $idRepresentante = $asignacion['id_representante_empresa'] ?? null;
            if ($idRepresentante === null) {
                continue;
            }

            $idEmpresa = $asignacion['id_empresa'] ?? $empresaPredeterminada;
            $contactoPerteneceAEmpresa = $idEmpresa !== null
                && DB::table('empresa_representantes')
                    ->where('id_representante_empresa', $idRepresentante)
                    ->where('id_empresa', $idEmpresa)
                    ->exists();
            if (!$contactoPerteneceAEmpresa) {
                throw ValidationException::withMessages([
                    'asignaciones' => 'El representante seleccionado debe pertenecer a la empresa asignada al estudiante.',
                ]);
            }
        }

        $asignacionesPrevias = DB::table('asignacion_asesores')
            ->where('id_docente', $id)
            ->where('id_modulo', $idModulo);
        if ($tienePeriodo) {
            $asignacionesPrevias->where('periodo_academico', $periodo);
        }
        $idsPrevios = $asignacionesPrevias->pluck('id_estudiante')
            ->map(fn ($idEstudiante) => (int) $idEstudiante)
            ->all();

        DB::transaction(function () use (
            $id,
            $idsEstudiantes,
            $idModulo,
            $periodo,
            $tienePeriodo,
            $tieneCreatedAt,
            $tieneUpdatedAt,
            $tieneEmpresaAsignacion,
            $tieneEmpresaExpediente,
            $tieneTablaExpediente,
            $empresasPorEstudiante,
            $fechasInicioPorEstudiante,
            $empresaPredeterminada,
            $validated
        ) {
            // 1. Elimina asignaciones actuales de este docente en el módulo (y periodo si aplica)
            $borrarDocente = DB::table('asignacion_asesores')
                ->where('id_docente', $id)
                ->where('id_modulo', $idModulo);

            if ($tienePeriodo) {
                $borrarDocente->where('periodo_academico', $periodo);
            }
            $borrarDocente->delete();

            // 2. Evita violar la restricción única uq_estudiante_modulo_periodo
            if (!empty($idsEstudiantes)) {
                $borrarConflictos = DB::table('asignacion_asesores')
                    ->whereIn('id_estudiante', $idsEstudiantes)
                    ->where('id_modulo', $idModulo);

                if ($tienePeriodo) {
                    $borrarConflictos->where('periodo_academico', $periodo);
                }
                $borrarConflictos->delete();

                $ahora = now();
                $filas = array_map(function ($idEstudiante) use (
                    $id,
                    $idModulo,
                    $periodo,
                    $tienePeriodo,
                    $tieneCreatedAt,
                    $tieneUpdatedAt,
                    $ahora,
                    $tieneEmpresaAsignacion,
                    $empresasPorEstudiante,
                    $empresaPredeterminada
                ) {
                    $empresaId = $empresasPorEstudiante->get(
                        (string) $idEstudiante,
                        $empresaPredeterminada
                    );
                    $fila = [
                        'id_docente'    => (int) $id,
                        'id_estudiante' => $idEstudiante,
                        'id_modulo'     => $idModulo,
                    ];

                    if ($tieneEmpresaAsignacion) {
                        $fila['id_empresa'] = $empresaId;
                    }
                    if ($tienePeriodo) {
                        $fila['periodo_academico'] = $periodo;
                    }
                    if ($tieneCreatedAt) {
                        $fila['created_at'] = $ahora;
                    }
                    if ($tieneUpdatedAt) {
                        $fila['updated_at'] = $ahora;
                    }

                    return $fila;
                }, $idsEstudiantes);

                DB::table('asignacion_asesores')->insert($filas);
            }

            if ($tieneEmpresaExpediente && $tieneTablaExpediente) {
                foreach ($idsEstudiantes as $idEstudiante) {
                    $empresaId = $empresasPorEstudiante->get(
                        (string) $idEstudiante,
                        $empresaPredeterminada
                    );
                    $criterios = [
                        'id_estudiante' => $idEstudiante,
                        'id_modulo' => $idModulo,
                    ];
                    if ($this->existeColumna('expediente_efsrt', 'periodo_academico')) {
                        $criterios['periodo_academico'] = $periodo;
                    }

                    $expediente = DB::table('expediente_efsrt')
                        ->where($criterios)
                        ->orderByDesc(
                            $this->existeColumna('expediente_efsrt', 'id_expediente')
                                ? 'id_expediente'
                                : 'id_modulo'
                        )
                        ->first();

                    if (!$expediente && $empresaId === null) {
                        continue;
                    }

                    $datosExpediente = ['id_empresa' => $empresaId];
                    if ($tieneRepresentanteExpediente) {
                        $datosExpediente['id_representante_empresa'] =
                            $representantesPorEstudiante->get((string) $idEstudiante);
                    }
                    $fechaInicio = $fechasInicioPorEstudiante->get((string) $idEstudiante);
                    if ($fechaInicio && $this->existeColumna('expediente_efsrt', 'fecha_inicio')) {
                        $datosExpediente['fecha_inicio'] = $fechaInicio;
                    }
                    if ($this->existeColumna('expediente_efsrt', 'id_docente_asesor')) {
                        $datosExpediente['id_docente_asesor'] = (int) $id;
                    }
                    if ($this->existeColumna('expediente_efsrt', 'periodo_academico')) {
                        $datosExpediente['periodo_academico'] = $periodo;
                    }
                    if ($this->existeColumna('expediente_efsrt', 'updated_at')) {
                        $datosExpediente['updated_at'] = $ahora;
                    }

                    if ($expediente) {
                        $idExpediente = $expediente->id_expediente ?? $expediente->id ?? null;
                        $columnaId = $this->existeColumna('expediente_efsrt', 'id_expediente')
                            ? 'id_expediente'
                            : ($this->existeColumna('expediente_efsrt', 'id') ? 'id' : null);

                        $actualizacion = DB::table('expediente_efsrt')->where($criterios);
                        if ($columnaId && $idExpediente !== null) {
                            $actualizacion->where($columnaId, $idExpediente);
                        }
                        $actualizacion->update($datosExpediente);
                        continue;
                    }

                    $nuevoExpediente = $criterios + $datosExpediente;
                    if ($this->existeColumna('expediente_efsrt', 'estado_efsrt')) {
                        $nuevoExpediente['estado_efsrt'] = 'No efectuó';
                    }
                    if ($this->existeColumna('expediente_efsrt', 'horas_acumuladas')) {
                        $nuevoExpediente['horas_acumuladas'] = 0;
                    }
                    if ($this->existeColumna('expediente_efsrt', 'horas_requeridas')) {
                        $nuevoExpediente['horas_requeridas'] = 160;
                    }
                    if ($this->existeColumna('expediente_efsrt', 'portafolio_fisico_revisado')) {
                        $nuevoExpediente['portafolio_fisico_revisado'] = false;
                    }
                    if ($this->existeColumna('expediente_efsrt', 'created_at')) {
                        $nuevoExpediente['created_at'] = $ahora;
                    }
                    DB::table('expediente_efsrt')->insert($nuevoExpediente);
                }
            }
        });

        $idsNuevos = array_values(array_diff($idsEstudiantes, $idsPrevios));
        if ($idsNuevos) {
            $docente = User::find((int) $id);
            $preferencias = $docente?->preferencias_notificaciones ?? [];
            if ($docente && ($preferencias['asignaciones'] ?? true)) {
                $docente->notify(new AsignacionRecibida(count($idsNuevos), $idModulo));
            }
        }

        return response()->json([
            'message' => 'Estudiantes asignados correctamente.',
            'total'   => count($idsEstudiantes),
        ]);
    }

    /**
     * Módulos en los que trabaja cada docente.
     */
    private function modulosPorDocente(): array
    {
        $tabla = 'modulos_profesionales';
        $colId = collect(['id_modulo', 'id'])->first(fn ($c) => $this->existeColumna($tabla, $c));
        $colNombre = collect(['nombre', 'nombre_modulo', 'titulo', 'descripcion'])
            ->first(fn ($c) => $this->existeColumna($tabla, $c));

        if (!$colId || !$colNombre) {
            return [];
        }

        if ($this->existeColumna('asignacion_asesores', 'id_modulo')) {
            $filas = DB::table('asignacion_asesores as a')
                ->join("$tabla as m", "m.$colId", '=', 'a.id_modulo')
                ->select('a.id_docente', "m.$colNombre as modulo")
                ->distinct()->get();
        } elseif ($this->existeColumna('expediente_efsrt', 'id_modulo')
               && $this->existeColumna('expediente_efsrt', 'id_estudiante')) {
            $filas = DB::table('asignacion_asesores as a')
                ->join('expediente_efsrt as e', 'e.id_estudiante', '=', 'a.id_estudiante')
                ->join("$tabla as m", "m.$colId", '=', 'e.id_modulo')
                ->select('a.id_docente', "m.$colNombre as modulo")
                ->distinct()->get();
        } else {
            return [];
        }

        $resultado = [];
        foreach ($filas as $f) {
            $resultado[$f->id_docente][] = $f->modulo;
        }
        return $resultado;
    }
}