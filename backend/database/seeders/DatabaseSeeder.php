<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'dni' => '12345678',
            'nombres' => 'Test',
            'apellidos' => 'User',
            'correo' => 'test@example.com',
            'contrasena_hash' => Hash::make('password'),
            'estado_cuenta' => 'activo',
            'id_rol' => 1,
        ]);
    }
}