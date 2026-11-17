<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';
    
    // Forzar que la clave primaria sea tratada correctamente por Eloquent y Sanctum

    protected $fillable = [
        'dni',
        'nombres',
        'apellidos',
        'correo',
        'contrasena_hash',
        'estado_cuenta',
        'id_rol'
    ];

    protected $hidden = [
        'contrasena_hash',
    ];

    // Indicarle a Laravel el nombre real de la llave primaria
    public function getKeyName()
    {
        return 'id_usuario';
    }

    // Indicarle a Laravel que la contraseña está en la columna 'contrasena_hash'
    public function getAuthPassword()
    {
        return $this->contrasena_hash;
    }

    // Relación con la tabla roles
    public function rol()
    {
        return $this->belongsTo(Role::class, 'id_rol', 'id_rol');
    }
}