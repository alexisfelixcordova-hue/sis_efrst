<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppDato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ArchivoAplicacionController extends Controller
{
    public function store(Request $request)
    {
        $validado = $request->validate([
            'archivo' => ['required', 'file', 'max:51200'],
            'padre' => ['nullable', 'string', 'max:64'],
        ]);

        $idUsuario = (int) $request->user()->getKey();
        $registro = AppDato::firstOrCreate(
            ['id_usuario' => $idUsuario, 'aplicacion' => 'archivos'],
            ['datos' => ['items' => [], 'papelera' => []]]
        );
        $datos = $registro->datos ?? ['items' => [], 'papelera' => []];
        $items = $datos['items'] ?? [];
        $padre = $validado['padre'] ?? null;

        if ($padre !== null) {
            $carpeta = collect($items)->first(
                fn ($item) => (string) ($item['id'] ?? '') === $padre
                    && ($item['tipo'] ?? null) === 'carpeta'
            );
            if (! $carpeta) {
                throw ValidationException::withMessages([
                    'padre' => 'La carpeta elegida no existe.',
                ]);
            }
        }

        $archivo = $validado['archivo'];
        $idArchivo = (string) Str::uuid();
        $ruta = $archivo->storeAs("apps/{$idUsuario}", $idArchivo, 'local');
        $nombre = basename($archivo->getClientOriginalName());
        $item = [
            'id' => $idArchivo,
            'padre' => $padre,
            'tipo' => 'archivo',
            'nombre' => $nombre,
            'tam' => $archivo->getSize(),
            'fecha' => now()->toDateString(),
            'mime_type' => $archivo->getMimeType(),
            'ruta_almacenamiento' => $ruta,
        ];

        $datos['items'] = [...$items, $item];
        $datos['papelera'] ??= [];
        $registro->update(['datos' => $datos]);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function download(Request $request, string $id)
    {
        $idUsuario = (int) $request->user()->getKey();
        $registro = AppDato::where('id_usuario', $idUsuario)
            ->where('aplicacion', 'archivos')
            ->firstOrFail();
        $datos = $registro->datos ?? [];
        $item = collect([
            ...($datos['items'] ?? []),
            ...($datos['papelera'] ?? []),
        ])->first(fn ($archivo) => (string) ($archivo['id'] ?? '') === $id);

        abort_unless($item && ($item['tipo'] ?? null) === 'archivo', 404);

        $ruta = (string) ($item['ruta_almacenamiento'] ?? '');
        abort_unless(
            str_starts_with($ruta, "apps/{$idUsuario}/")
                && Storage::disk('local')->exists($ruta),
            404
        );

        return Storage::disk('local')->download(
            $ruta,
            basename((string) $item['nombre']),
            ['Content-Type' => $item['mime_type'] ?? 'application/octet-stream']
        );
    }
}
