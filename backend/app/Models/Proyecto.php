<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyecto extends Model
{
    public const ESTADOS = ['Por iniciar', 'En curso', 'En revisión', 'Finalizado'];

    protected $table = 'proyectos';
    protected $primaryKey = 'id_proyecto';

    protected $fillable = [
        'id_usuario',     // docente dueño del proyecto
        'id_empresa',     // entidad (cada fila del tablero)
        'id_estudiante',
        'id_modulo',
        'titulo',
        'descripcion',
        'estado',
        'avance',
        'fecha_limite',
        'orden',          // posición dentro de la columna
    ];

    protected $casts = [
        'avance'       => 'integer',
        'orden'        => 'integer',
        'fecha_limite' => 'date:Y-m-d',
    ];

    public function scopeDelDocente($query, int $idUsuario)
    {
        return $query->where('id_usuario', $idUsuario);
    }
}