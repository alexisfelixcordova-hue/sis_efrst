<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DocenteController extends Controller
{
    /**
     * Lista de docentes para la pantalla "Plantel docente".
     */
    public function index()
    {
        $docentes = DB::table('usuarios as u')
            ->leftJoin('docentes as d', 'd.id_usuario', '=', 'u.id_usuario')
            ->where('u.id_rol', 2)
            ->select(
                'u.id_usuario', 'u.nombres', 'u.apellidos', 'u.dni', 'u.correo',
                'd.departamento', 'd.capacidad'
            )
            ->orderBy('u.nombres')
            ->get();

        $alumnosPorDocente = DB::table('asignacion_asesores')
            ->select('id_docente', DB::raw('COUNT(*) as total'))
            ->groupBy('id_docente')
            ->pluck('total', 'id_docente');

        $modulosPorDocente = $this->modulosPorDocente();

        return response()->json($docentes->map(function ($d) use ($alumnosPorDocente, $modulosPorDocente) {
            $alumnos   = (int) ($alumnosPorDocente[$d->id_usuario] ?? 0);
            $capacidad = (int) ($d->capacidad ?? 12);
            $modulos   = $modulosPorDocente[$d->id_usuario] ?? [];

            return [
                'id_usuario'   => $d->id_usuario,
                'nombres'      => $d->nombres,
                'apellidos'    => $d->apellidos,
                'correo'       => $d->correo,
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
        $docente = DB::table('usuarios as u')
            ->leftJoin('docentes as d', 'd.id_usuario', '=', 'u.id_usuario')
            ->where('u.id_usuario', $id)
            ->select(
                'u.id_usuario', 'u.nombres', 'u.apellidos', 'u.dni', 'u.correo',
                'd.codigo', 'd.departamento', 'd.grado', 'd.especialidad',
                'd.condicion', 'd.telefono', 'd.capacidad', 'd.sede', 'd.biografia'
            )
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
                'id_estudiante'      => $e->id_estudiante ?? $e->id ?? null,
                'nombres'            => $e->nombres ?? '',
                'apellidos'          => $e->apellidos ?? '',
                'nombre'             => trim(($e->nombres ?? '') . ' ' . ($e->apellidos ?? '')),
                'dni'                => $e->dni ?? null,
                // Mapeo directo con las columnas de tu BD (programa_estudios y semestre)
                'carrera'            => $e->programa_estudios ?? 'Diseño y Programación Web',
                'ciclo'              => $e->semestre ?? 'VI Semestre',
                'proyecto'           => $e->proyecto_titulo ?? $e->proyecto ?? 'Sistema Web EFSRT',
                'entidad'            => $e->entidad_nombre ?? $e->entidad ?? 'Empresa Local',
                'hrs'                => $e->horas_acumuladas ?? $e->hrs ?? 160,
                'estado'             => $e->estado ?? 'Al día',
                'correo'             => $e->correo ?? $e->email ?? 'No registrado',
                'telefono'           => $e->telefono ?? 'No registrado',
                'direccion'          => $e->direccion ?? 'No registrada',
                'programa_estudios'  => $e->programa_estudios ?? 'Diseño y Programación Web',
                'semestre'           => $e->semestre ?? 'VI Semestre',
            ]);

        $otros = DB::table('usuarios')
            ->where('id_rol', 2)
            ->where('id_usuario', '!=', $id)
            ->take(6)
            ->pluck('nombres');

        return response()->json([
            'docente' => [
                'nombre'       => trim(($docente->nombres ?? '') . ' ' . ($docente->apellidos ?? '')),
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
     * Módulos en los que trabaja cada docente.
     */
    private function modulosPorDocente(): array
    {
        $tabla = 'modulos_profesionales';
        $colId = collect(['id_modulo', 'id'])->first(fn ($c) => Schema::hasColumn($tabla, $c));
        $colNombre = collect(['nombre', 'nombre_modulo', 'titulo', 'descripcion'])
            ->first(fn ($c) => Schema::hasColumn($tabla, $c));

        if (!$colId || !$colNombre) {
            return [];
        }

        if (Schema::hasColumn('asignacion_asesores', 'id_modulo')) {
            $filas = DB::table('asignacion_asesores as a')
                ->join("$tabla as m", "m.$colId", '=', 'a.id_modulo')
                ->select('a.id_docente', "m.$colNombre as modulo")
                ->distinct()->get();
        } elseif (Schema::hasColumn('expediente_efsrt', 'id_modulo')
               && Schema::hasColumn('expediente_efsrt', 'id_estudiante')) {
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