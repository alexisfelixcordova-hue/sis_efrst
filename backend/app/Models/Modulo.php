<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $table = 'modulos_profesionales';
    protected $primaryKey = 'id_modulo';

    const UPDATED_AT = null;

    protected $fillable = [
        'numero_modulo',
        'nombre_modulo',
        'horas_requeridas'
    ];

    public function expedientes()
    {
        return $this->hasMany(ExpedienteEfsrt::class, 'id_modulo', 'id_modulo');
    }
}