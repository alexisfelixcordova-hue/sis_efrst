<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardResumenTest extends TestCase
{
    private bool $schemaPreparado = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('La extensión pdo_sqlite no está instalada.');
        }

        Schema::dropIfExists('expediente_efsrt');
        Schema::dropIfExists('estudiantes');

        Schema::create('estudiantes', function (Blueprint $table) {
            $table->bigIncrements('id_estudiante');
        });

        Schema::create('expediente_efsrt', function (Blueprint $table) {
            $table->bigIncrements('id_expediente');
            $table->unsignedBigInteger('id_estudiante')->nullable();
            $table->string('estado_efsrt')->nullable();
            $table->unsignedInteger('horas_acumuladas')->default(0);
        });

        $this->schemaPreparado = true;
    }

    protected function tearDown(): void
    {
        if ($this->schemaPreparado) {
            Schema::dropIfExists('expediente_efsrt');
            Schema::dropIfExists('estudiantes');
        }

        parent::tearDown();
    }

    public function test_dashboard_counts_validated_hours_from_efsrt_columns(): void
    {
        DB::table('estudiantes')->insert([
            ['id_estudiante' => 1],
            ['id_estudiante' => 2],
            ['id_estudiante' => 3],
        ]);

        DB::table('expediente_efsrt')->insert([
            ['id_estudiante' => 1, 'estado_efsrt' => 'Verificado', 'horas_acumuladas' => 120],
            ['id_estudiante' => 2, 'estado_efsrt' => 'CALIFICADO', 'horas_acumuladas' => 80],
            ['id_estudiante' => 3, 'estado_efsrt' => 'Observado', 'horas_acumuladas' => 40],
            ['id_estudiante' => 3, 'estado_efsrt' => 'En revisión', 'horas_acumuladas' => 30],
        ]);

        $usuario = new User();
        $usuario->setAttribute('id_usuario', 1);
        $usuario->setAttribute('id_rol', 1);
        Sanctum::actingAs($usuario);

        $this->getJson('/api/dashboard/resumen')
            ->assertOk()
            ->assertJsonPath('revisionesEfsrt', 4)
            ->assertJsonPath('horasValidadas', 200)
            ->assertJsonPath('metaInstitucional', 50);
    }

    public function test_dashboard_summary_is_limited_to_administrators(): void
    {
        $usuario = new User();
        $usuario->setAttribute('id_usuario', 2);
        $usuario->setAttribute('id_rol', 2);
        Sanctum::actingAs($usuario);

        $this->getJson('/api/dashboard/resumen')->assertForbidden();
    }
}
