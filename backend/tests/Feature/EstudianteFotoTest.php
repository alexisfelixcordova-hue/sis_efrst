<?php

namespace Tests\Feature;

use App\Models\Estudiante;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EstudianteFotoTest extends TestCase
{
    private bool $schemaPreparado = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('La extensión pdo_sqlite no está instalada.');
        }

        Schema::dropIfExists('estudiantes');
        Schema::create('estudiantes', function (Blueprint $table) {
            $table->id('id_estudiante');
            $table->string('dni', 8)->unique();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('correo')->nullable();
            $table->string('telefono')->nullable();
            $table->string('programa_estudios')->nullable();
            $table->string('semestre')->nullable();
            $table->string('estado')->nullable();
            $table->string('direccion')->nullable();
            $table->string('foto_url')->nullable();
            $table->timestamps();
        });
        Storage::fake('public');
        $this->schemaPreparado = true;
    }

    protected function tearDown(): void
    {
        if ($this->schemaPreparado) {
            Schema::dropIfExists('estudiantes');
            Storage::disk('public')->deleteDirectory('estudiantes');
        }

        parent::tearDown();
    }

    public function test_student_photo_can_be_uploaded_replaced_and_removed(): void
    {
        $usuario = new User();
        $usuario->setAttribute('id_usuario', 29);
        Sanctum::actingAs($usuario);

        $creado = $this->post('/api/estudiantes', [
            'dni' => '98765432',
            'nombres' => 'Ana',
            'apellidos' => 'Prueba',
            'foto' => UploadedFile::fake()->image('alumna.png'),
        ])->assertCreated();

        $estudianteId = $creado->json('data.id_estudiante');
        $fotoInicial = $creado->json('data.foto_url');
        $rutaInicial = substr($fotoInicial, strlen('/storage/'));
        Storage::disk('public')->assertExists($rutaInicial);

        $actualizado = $this->post('/api/estudiantes/'.$estudianteId, [
            '_method' => 'PUT',
            'foto' => UploadedFile::fake()->image('alumna-actualizada.png'),
        ])->assertOk();

        $fotoActualizada = $actualizado->json('data.foto_url');
        $rutaActualizada = substr($fotoActualizada, strlen('/storage/'));
        Storage::disk('public')->assertMissing($rutaInicial);
        Storage::disk('public')->assertExists($rutaActualizada);

        $this->post('/api/estudiantes/'.$estudianteId, [
            '_method' => 'PUT',
            'eliminar_foto' => '1',
        ])->assertOk()->assertJsonPath('data.foto_url', null);

        Storage::disk('public')->assertMissing($rutaActualizada);
        $this->assertNull(Estudiante::find($estudianteId)->foto_url);
    }
}
