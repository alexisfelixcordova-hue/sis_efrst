<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\AsignacionAsesorController;
use ReflectionMethod;
use Tests\TestCase;

class ResolverIdsDocenteTest extends TestCase
{
    public function test_it_prefers_the_user_id_used_by_assignments(): void
    {
        $controller = new AsignacionAsesorController();
        $resolver = new ReflectionMethod($controller, 'resolverIdsDocente');

        $ids = $resolver->invoke($controller, (object) [
            'id_usuario' => 2,
            'id_docente' => 3,
        ]);

        $this->assertSame([2], $ids);
    }
}
