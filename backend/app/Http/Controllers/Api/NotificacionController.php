<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    private const PREFERENCIAS_POR_DEFECTO = [
        'login' => true,
        'clave' => true,
        'constancias' => true,
        'revisiones' => false,
        'sistema' => false,
        'asignaciones' => true,
    ];

    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(40)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'categoria' => $notification->data['categoria'] ?? 'sistema',
                'titulo' => $notification->data['titulo'] ?? 'Notificación',
                'detalle' => $notification->data['detalle']
                    ?? $notification->created_at?->diffForHumans(),
                'vista' => $notification->data['vista'] ?? null,
                'leida' => $notification->read_at !== null,
                'created_at' => $notification->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => $notifications,
            'unread_count' => $notifications->where('leida', false)->count(),
        ]);
    }

    public function marcarLeida(Request $request, string $notification)
    {
        $registro = $request->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        $registro->markAsRead();

        return response()->json(['success' => true]);
    }

    public function marcarTodasLeidas(Request $request)
    {
        $request->user()
            ->unreadNotifications()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function preferencias(Request $request)
    {
        return response()->json(array_merge(
            self::PREFERENCIAS_POR_DEFECTO,
            $request->user()->preferencias_notificaciones ?? []
        ));
    }

    public function actualizarPreferencias(Request $request)
    {
        $validacion = $request->validate([
            'preferencias' => 'required|array:login,clave,constancias,revisiones,sistema,asignaciones',
            'preferencias.login' => 'sometimes|boolean',
            'preferencias.clave' => 'sometimes|boolean',
            'preferencias.constancias' => 'sometimes|boolean',
            'preferencias.revisiones' => 'sometimes|boolean',
            'preferencias.sistema' => 'sometimes|boolean',
            'preferencias.asignaciones' => 'sometimes|boolean',
        ]);

        $preferencias = array_merge(
            self::PREFERENCIAS_POR_DEFECTO,
            $validacion['preferencias']
        );
        $usuario = $request->user();
        $usuario->preferencias_notificaciones = $preferencias;
        $usuario->save();

        return response()->json($preferencias);
    }
}
