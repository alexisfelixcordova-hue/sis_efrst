<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppDatosTest extends TestCase
{
    private bool $schemaPreparado = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('La extensión pdo_sqlite no está instalada.');
        }

        Schema::dropIfExists('app_datos');
        Schema::create('app_datos', function (Blueprint $table) {
            $table->id('id_dato');
            $table->unsignedBigInteger('id_usuario');
            $table->string('aplicacion', 32);
            $table->json('datos');
            $table->timestamps();
            $table->unique(['id_usuario', 'aplicacion']);
        });
        $this->schemaPreparado = true;
    }

    protected function tearDown(): void
    {
        if ($this->schemaPreparado) {
            Schema::dropIfExists('app_datos');
        }
        parent::tearDown();
    }

    public function test_app_data_is_saved_and_isolated_by_user(): void
    {
        $usuario = new User();
        $usuario->setAttribute('id_usuario', 17);
        Sanctum::actingAs($usuario);

        $this->putJson('/api/apps/notas', [
            'datos' => [['id' => 'nota-1', 'titulo' => 'Seguimiento']],
        ])->assertOk();

        $this->getJson('/api/apps/notas')
            ->assertOk()
            ->assertJsonPath('data.0.titulo', 'Seguimiento');

        $otroUsuario = new User();
        $otroUsuario->setAttribute('id_usuario', 18);
        Sanctum::actingAs($otroUsuario);

        $this->getJson('/api/apps/notas')
            ->assertOk()
            ->assertExactJson(['success' => true, 'data' => []]);
    }

    public function test_uploaded_file_is_private_and_downloadable_only_by_owner(): void
    {
        Storage::fake('local');
        $usuario = new User();
        $usuario->setAttribute('id_usuario', 23);
        Sanctum::actingAs($usuario);

        $response = $this->post('/api/apps/archivos/subir', [
            'archivo' => UploadedFile::fake()->create('informe.pdf', 24, 'application/pdf'),
        ])->assertCreated();

        $archivo = $response->json('data');
        Storage::disk('local')->assertExists($archivo['ruta_almacenamiento']);
        $this->get('/api/apps/archivos/'.$archivo['id'].'/descargar')->assertOk();

        $otroUsuario = new User();
        $otroUsuario->setAttribute('id_usuario', 24);
        Sanctum::actingAs($otroUsuario);

        $this->get('/api/apps/archivos/'.$archivo['id'].'/descargar')->assertNotFound();
    }
}
