<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusquedaGlobalController extends Controller
{
    public function buscar(Request $request)
    {
        $query = trim((string) $request->input('q', ''));

        if (strlen($query) < 2) {
            return response()->json([], 200);
        }

        $termino = '%' . $query . '%';

        $estudiantes = Estudiante::query()
            ->where(function ($consulta) use ($termino) {
                $consulta->where('nombres', 'ILIKE', $termino)
                    ->orWhere('apellidos', 'ILIKE', $termino)
                    ->orWhere('dni', 'ILIKE', $termino)
                    ->orWhere('correo', 'ILIKE', $termino);
            })
            ->limit(5)
            ->get()
            ->map(function ($est) {
                $est->tipo = 'estudiante';
                return $est;
            });

        $docentes = DB::table('usuarios')
            ->where('id_rol', 2)
            ->where(function ($consulta) use ($termino) {
                $consulta->where('nombres', 'ILIKE', $termino)
                    ->orWhere('apellidos', 'ILIKE', $termino)
                    ->orWhere('dni', 'ILIKE', $termino)
                    ->orWhere('correo', 'ILIKE', $termino);
            })
            ->limit(5)
            ->select(
                'id_usuario as id',
                'id_usuario',
                'nombres',
                'apellidos',
                'dni',
                'correo',
                'telefono'
            )
            ->get()
            ->map(function ($doc) {
                $doc->tipo = 'docente';
                return $doc;
            });

        return response()->json($estudiantes->concat($docentes), 200);
    }
}