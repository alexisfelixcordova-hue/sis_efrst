<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsignacionAsesor extends Model
{
    protected $table = 'asignacion_asesores';
    protected $primaryKey = 'id_asignacion';

    protected $fillable = [
        'id_docente',
        'id_estudiante',
        'id_modulo',
        'periodo_academico'
    ];

    // Relación con la tabla estudiantes
    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }

    // Relación con la tabla modulos
    public function modulo()
    {
        return $this->belongsTo(Modulo::class, 'id_modulo', 'id_modulo');
    }

    // Relación con la tabla users (docentes) corregida a id_usuario
    public function docente()
    {
        return $this->belongsTo(User::class, 'id_docente', 'id_usuario');
    }
}