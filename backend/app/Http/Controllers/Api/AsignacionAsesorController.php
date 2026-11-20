<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsignacionAsesor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AsignacionAsesorController extends Controller
{
    /**
     * Método auxiliar para restringir el acceso únicamente a administradores (id_rol === 1).
     */
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

    /**
     * Alumnos asignados al docente autenticado, filtrables por módulo y búsqueda.
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

        $idDocente = $usuario->id_usuario ?? $usuario->id;

        $query = DB::table('asignacion_asesores as a')
            ->join('estudiantes as e', 'e.id_estudiante', '=', 'a.id_estudiante')
            ->where('a.id_docente', $idDocente);

        $tablaModulos = 'modulos_profesionales';
        $colModId = Schema::hasTable($tablaModulos)
            ? collect(['id_modulo', 'id'])->first(fn ($c) => Schema::hasColumn($tablaModulos, $c))
            : null;
        $colModNombre = Schema::hasTable($tablaModulos)
            ? collect(['nombre', 'nombre_modulo', 'titulo', 'descripcion'])->first(fn ($c) => Schema::hasColumn($tablaModulos, $c))
            : null;

        $tieneIdModulo = Schema::hasColumn('asignacion_asesores', 'id_modulo');
        $tienePeriodo  = Schema::hasColumn('asignacion_asesores', 'periodo_academico');

        if ($colModId && $colModNombre && $tieneIdModulo) {
            $columnas = [
                'e.*',
                'a.id_modulo',
            ];

            if ($tienePeriodo) {
                $columnas[] = 'a.periodo_academico';
            }

            $columnas[] = DB::raw("COALESCE(m.$colModNombre, 'Módulo EFSRT') as modulo_nombre");

            $query->leftJoin("$tablaModulos as m", "m.$colModId", '=', 'a.id_modulo')
                ->select($columnas);
        } else {
            $columnas = ['e.*'];

            if ($tieneIdModulo) {
                $columnas[] = 'a.id_modulo';
            }
            if ($tienePeriodo) {
                $columnas[] = 'a.periodo_academico';
            }

            $columnas[] = DB::raw("'Módulo EFSRT' as modulo_nombre");

            $query->select($columnas);
        }

        if ($request->filled('id_modulo') && $request->id_modulo !== 'todos' && $tieneIdModulo) {
            $query->where('a.id_modulo', (int) $request->id_modulo);
        }

        if ($request->filled('search')) {
            $term = '%' . trim($request->search) . '%';
            $query->where(function ($sub) use ($term) {
                $sub->where('e.dni', 'ILIKE', $term)
                    ->orWhere('e.nombres', 'ILIKE', $term)
                    ->orWhere('e.apellidos', 'ILIKE', $term);

                if (Schema::hasColumn('estudiantes', 'correo')) {
                    $sub->orWhere('e.correo', 'ILIKE', $term);
                }
            });
        }

        $alumnos = $query->orderBy('e.apellidos')->orderBy('e.nombres')->get();

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

        $asignacion = AsignacionAsesor::create($validated);
        $asignacion->load(['estudiante', 'modulo', 'docente']);

        return response()->json([
            'success' => true,
            'message' => 'Asignación de asesor creada correctamente',
            'data'    => $asignacion
        ], 201);
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