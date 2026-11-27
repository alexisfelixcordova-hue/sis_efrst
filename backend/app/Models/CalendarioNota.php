<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarioNota extends Model
{
    protected $table = 'calendario_notas';
    protected $primaryKey = 'id_usuario';
    public $incrementing = false;

    protected $fillable = [
        'id_usuario',
        'contenido',
    ];
}