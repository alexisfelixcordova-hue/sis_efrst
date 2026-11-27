<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class AsignacionRecibida extends Notification
{
    public function __construct(
        private readonly int $cantidad,
        private readonly int $idModulo
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'categoria' => 'asignaciones',
            'titulo' => $this->cantidad === 1
                ? 'Nuevo alumno asignado'
                : 'Nuevos alumnos asignados',
            'detalle' => sprintf(
                '%d alumno(s) asignado(s) al módulo #%d.',
                $this->cantidad,
                $this->idModulo
            ),
            'vista' => 'Mis Alumnos',
        ];
    }
}
