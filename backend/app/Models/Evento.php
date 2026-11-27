<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    use HasFactory;

    protected $table = 'empresas_convenio';

    protected $primaryKey = 'id_empresa';

    protected $fillable = [
        'id_representante_empresa',
        'ruc',
        'razon_social',
        'estado_convenio',
        'documento_convenio_ruta',
        'telefono',
        'correo_electronico',
        'direccion',
        'estado',
        'condicion',
        'tipo_contribuyente',
        'departamento',
        'provincia',
        'distrito',
        'ubigeo',
    ];

    public function expedientes()
    {
        return $this->hasMany(ExpedienteEfsrt::class, 'id_empresa', 'id_empresa');
    }

    public function representantes()
    {
        return $this->hasMany(RepresentanteEmpresa::class, 'id_empresa', 'id_empresa')
            ->orderBy('nombre');
    }

    public function representantePrincipal()
    {
        return $this->belongsTo(
            RepresentanteEmpresa::class,
            'id_representante_empresa',
            'id_representante_empresa'
        );
    }

    public function estudiantes()
    {
        return $this->hasManyThrough(
            Estudiante::class,
            ExpedienteEfsrt::class,
            'id_empresa',
            'id_estudiante',
            'id_empresa',
            'id_estudiante'
        );
    }
}