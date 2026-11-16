<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Estudiante extends Model
{
    use HasFactory;

    protected $table = 'estudiantes';
    protected $primaryKey = 'id_estudiante';

    protected $fillable = [
        'dni',
        'nombres',
        'correo',
        'apellidos',
        'programa_estudios',
        'semestre'
    ];

    public function expedientes()
    {
        return $this->hasMany(ExpedienteEfsrt::class, 'id_estudiante', 'id_estudiante');
    }
}