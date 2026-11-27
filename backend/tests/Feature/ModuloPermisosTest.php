<?php

namespace Tests\Feature;

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModuloPermisosTest extends TestCase
{
    public function test_non_admin_cannot_update_a_module(): void
    {
        $usuario = new User();
        $usuario->setAttribute('id_usuario', 42);
        $usuario->setAttribute('id_rol', 2);
        Sanctum::actingAs($usuario);

        $this->putJson('/api/modulos-profesionales/1', [
            'nombre_modulo' => 'Módulo actualizado',
        ])->assertForbidden();
    }
}
