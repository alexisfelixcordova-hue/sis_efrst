<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConstanciaEmitida extends Model
{
    use HasFactory;

    protected $table = 'constancias_emitidas';
    protected $primaryKey = 'id_constancia';

    public $timestamps = false;

    protected $fillable = [
        'id_estudiante',
        'id_modulo',
        'id_administrador',
        'codigo_documento',
        'tipo_emision',
        'fecha_emision',
        'ruta_archivo_pdf',
        'created_at',
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }

    public function modulo()
    {
        return $this->belongsTo(ModuloProfesional::class, 'id_modulo', 'id_modulo');
    }

    public function administrador()
    {
        return $this->belongsTo(Usuario::class, 'id_administrador', 'id_usuario');
    }
}