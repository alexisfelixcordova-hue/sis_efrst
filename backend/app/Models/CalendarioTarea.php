<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarioTarea extends Model
{
    protected $table = 'calendario_tareas';
    protected $primaryKey = 'id_tarea';
    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'texto',
        'hecha',
        'orden',
        'created_at',
    ];

    protected $casts = [
        'hecha' => 'boolean',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (CalendarioTarea $tarea) {
            if (! $tarea->created_at) {
                $tarea->created_at = now();
            }
        });
    }
}