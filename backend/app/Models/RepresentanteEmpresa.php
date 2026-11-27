<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepresentanteEmpresa extends Model
{
    protected $table = 'empresa_representantes';
    protected $primaryKey = 'id_representante_empresa';

    protected $fillable = [
        'id_empresa',
        'nombre',
        'cargo',
        'telefono',
        'correo',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }
}
