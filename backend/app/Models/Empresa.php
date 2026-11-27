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
        'ruc',
        'razon_social',
        'supervisor_empresa_nombre',
        'supervisor_empresa_cargo',
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

    // Relación directa con expedientes
    public function expedientes()
    {
        return $this->hasMany(ExpedienteEfsrt::class, 'id_empresa', 'id_empresa');
    }

    public function representantes()
    {
        return $this->hasMany(RepresentanteEmpresa::class, 'id_empresa', 'id_empresa')
            ->orderBy('nombre');
    }

    // Estudiantes practicantes a través de los expedientes de la empresa
    public function estudiantes()
    {
        return $this->hasManyThrough(
            Estudiante::class,
            ExpedienteEfsrt::class,
            'id_empresa',     // Foreign key en expediente_efsrt
            'id_estudiante',  // Foreign key en estudiantes
            'id_empresa',     // Local key en empresas_convenio
            'id_estudiante'   // Local key en expediente_efsrt
        );
    }
}
