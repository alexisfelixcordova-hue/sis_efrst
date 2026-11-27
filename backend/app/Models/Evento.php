<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evento extends Model
{
    protected $table = 'eventos';
    protected $primaryKey = 'id_evento';

    protected $fillable = [
        'id_usuario',
        'titulo',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'tipo',
        'nota',
    ];
}