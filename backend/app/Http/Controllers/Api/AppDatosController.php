<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppDato;
use Illuminate\Http\Request;

class AppDatosController extends Controller
{
    private const APLICACIONES = ['notas', 'contactos', 'archivos'];

    private function validarAplicacion(string $aplicacion): void
    {
        abort_unless(in_array($aplicacion, self::APLICACIONES, true), 404);
    }

    private function datosIniciales(string $aplicacion): array
    {
        return $aplicacion === 'archivos'
            ? ['items' => [], 'papelera' => []]
            : [];
    }

    public function show(Request $request, string $aplicacion)
    {
        $this->validarAplicacion($aplicacion);

        $registro = AppDato::where('id_usuario', $request->user()->getKey())
            ->where('aplicacion', $aplicacion)
            ->first();

        return response()->json([
            'success' => true,
            'data' => $registro?->datos ?? $this->datosIniciales($aplicacion),
        ]);
    }

    public function update(Request $request, string $aplicacion)
    {
        $this->validarAplicacion($aplicacion);
        $validado = $request->validate([
            'datos' => ['required', 'array'],
        ]);

        $registro = AppDato::updateOrCreate(
            [
                'id_usuario' => $request->user()->getKey(),
                'aplicacion' => $aplicacion,
            ],
            ['datos' => $validado['datos']]
        );

        return response()->json([
            'success' => true,
            'data' => $registro->datos,
        ]);
    }
}
