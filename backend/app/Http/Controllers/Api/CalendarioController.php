<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarioNota;
use App\Models\CalendarioTarea;
use App\Models\Evento;
use Illuminate\Http\Request;

class CalendarioController extends Controller
{
    private function usuarioId(Request $request): int
    {
        $u = $request->user();
        return (int) ($u->id_usuario ?? $u->id);
    }

    public function index(Request $request)
    {
        $idUsuario = $this->usuarioId($request);

        $eventos = Evento::where('id_usuario', $idUsuario)
            ->orderBy('fecha')
            ->orderBy('hora_inicio')
            ->get();

        $tareas = CalendarioTarea::where('id_usuario', $idUsuario)
            ->orderBy('orden')
            ->orderBy('id_tarea')
            ->get();

        $nota = CalendarioNota::where('id_usuario', $idUsuario)->first();

        return response()->json([
            'success' => true,
            'eventos' => $eventos,
            'tareas' => $tareas,
            'notas' => $nota?->contenido ?? '',
        ]);
    }

    public function storeEvento(Request $request)
    {
        $idUsuario = $this->usuarioId($request);

        $data = $request->validate([
            'titulo' => 'required|string|max:255',
            'fecha' => 'required|date',
            'hora_inicio' => 'required|string|max:20',
            'hora_fin' => 'required|string|max:20',
            'tipo' => 'required|string|max:50',
            'nota' => 'nullable|string',
        ]);

        $evento = Evento::create([
            ...$data,
            'id_usuario' => $idUsuario,
        ]);

        return response()->json($evento, 201);
    }

    public function updateEvento(Request $request, $id)
    {
        $idUsuario = $this->usuarioId($request);

        $evento = Evento::where('id_usuario', $idUsuario)
            ->where('id_evento', $id)
            ->firstOrFail();

        $data = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'fecha' => 'sometimes|required|date',
            'hora_inicio' => 'sometimes|required|string|max:20',
            'hora_fin' => 'sometimes|required|string|max:20',
            'tipo' => 'sometimes|required|string|max:50',
            'nota' => 'nullable|string',
        ]);

        $evento->update($data);

        return response()->json($evento);
    }

    public function destroyEvento(Request $request, $id)
    {
        $idUsuario = $this->usuarioId($request);

        $evento = Evento::where('id_usuario', $idUsuario)
            ->where('id_evento', $id)
            ->firstOrFail();

        $evento->delete();

        return response()->json(['success' => true]);
    }

    public function storeTarea(Request $request)
    {
        $idUsuario = $this->usuarioId($request);

        $data = $request->validate([
            'texto' => 'required|string|max:255',
        ]);

        $ultimoOrden = (int) CalendarioTarea::where('id_usuario', $idUsuario)->max('orden');

        $tarea = CalendarioTarea::create([
            'id_usuario' => $idUsuario,
            'texto' => $data['texto'],
            'hecha' => false,
            'orden' => $ultimoOrden + 1,
        ]);

        return response()->json($tarea, 201);
    }

    public function updateTarea(Request $request, $id)
    {
        $idUsuario = $this->usuarioId($request);

        $tarea = CalendarioTarea::where('id_usuario', $idUsuario)
            ->where('id_tarea', $id)
            ->firstOrFail();

        $data = $request->validate([
            'texto' => 'sometimes|required|string|max:255',
            'hecha' => 'sometimes|boolean',
            'orden' => 'sometimes|integer',
        ]);

        $tarea->update($data);

        return response()->json($tarea);
    }

    public function destroyTarea(Request $request, $id)
    {
        $idUsuario = $this->usuarioId($request);

        $tarea = CalendarioTarea::where('id_usuario', $idUsuario)
            ->where('id_tarea', $id)
            ->firstOrFail();

        $tarea->delete();

        return response()->json(['success' => true]);
    }

    public function upsertNotas(Request $request)
    {
        $idUsuario = $this->usuarioId($request);

        $data = $request->validate([
            'contenido' => 'nullable|string',
        ]);

        $nota = CalendarioNota::updateOrCreate(
            ['id_usuario' => $idUsuario],
            ['contenido' => $data['contenido'] ?? '']
        );

        return response()->json([
            'success' => true,
            'notas' => $nota->contenido,
        ]);
    }
}