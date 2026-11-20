<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Tabla real en PostgreSQL y su clave primaria
    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'dni',
        'nombres',
        'apellidos',
        'correo',
        'contrasena_hash',
        'estado_cuenta',
        'id_rol',
    ];

    // Ocultar hash en respuestas JSON
    protected $hidden = [
        'contrasena_hash',
    ];

    // Convertir automáticamente a hash seguro al asignar contraseña
    protected function casts(): array
    {
        return [
            'contrasena_hash' => 'hashed',
        ];
    }

    // Indicar a Laravel el nombre de la columna de contraseña
    public function getAuthPasswordName()
    {
        return 'contrasena_hash';
    }

    // Indicar a Laravel el valor de la contraseña
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