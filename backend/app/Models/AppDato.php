<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppDato extends Model
{
    protected $table = 'app_datos';
    protected $primaryKey = 'id_dato';

    protected $fillable = [
        'id_usuario',
        'aplicacion',
        'datos',
    ];

    protected function casts(): array
    {
        return [
            'datos' => 'array',
        ];
    }
}
