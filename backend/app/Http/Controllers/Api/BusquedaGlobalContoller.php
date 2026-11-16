<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use App\Models\Docente;
use Illuminate\Http\Request;

class BusquedaGlobalController extends Controller
{
    public function buscar(Request $request)
    {
        $query = $request->input('q');

        if (! $query || strlen(trim($query)) < 2) {
            return response()->json([], 200);
        }

        $termino = '%' . trim($query) . '%';

        // Buscar en la tabla estudiantes por nombre, apellido, DNI o correo
        $estudiantes = Estudiante::where('nombres', 'ILIKE', $termino)
            ->orWhere('apellidos', 'ILIKE', $termino)
            ->orWhere('dni', 'ILIKE', $termino)
            ->orWhere('correo', 'ILIKE', $termino)
            ->limit(5)
            ->get()
            ->map(function ($est) {
                $est->tipo = 'estudiante';
                return $est;
            });

        // Buscar en la tabla docentes por nombre, apellido, DNI o correo
        $docentes = Docente::where('nombres', 'ILIKE', $termino)
            ->orWhere('apellidos', 'ILIKE', $termino)
            ->orWhere('dni', 'ILIKE', $termino)
            ->orWhere('correo', 'ILIKE', $termino)
            ->limit(5)
            ->get()
            ->map(function ($doc) {
                $doc->tipo = 'docente';
                return $doc;
            });

        return response()->json($estudiantes->concat($docentes), 200);
    }
}