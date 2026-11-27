<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresa_representantes', function (Blueprint $table) {
            $table->bigIncrements('id_representante_empresa');
            $table->unsignedBigInteger('id_empresa');
            $table->string('nombre', 150);
            $table->string('cargo', 100)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('correo', 150)->nullable();
            $table->timestamps();

            $table->foreign('id_empresa')
                ->references('id_empresa')
                ->on('empresas_convenio')
                ->cascadeOnDelete();
        });

        if (Schema::hasColumn('empresas_convenio', 'supervisor_empresa_nombre')) {
            $columnas = ['id_empresa', 'supervisor_empresa_nombre'];
            if (Schema::hasColumn('empresas_convenio', 'supervisor_empresa_cargo')) {
                $columnas[] = 'supervisor_empresa_cargo';
            }
            $empresas = DB::table('empresas_convenio')
                ->whereNotNull('supervisor_empresa_nombre')
                ->whereRaw("TRIM(supervisor_empresa_nombre) <> ''")
                ->get($columnas);

            foreach ($empresas->chunk(250) as $lote) {
                $fecha = now();
                DB::table('empresa_representantes')->insert(
                    $lote->map(function ($empresa) use ($fecha) {
                        return [
                            'id_empresa' => $empresa->id_empresa,
                            'nombre' => $empresa->supervisor_empresa_nombre,
                            'cargo' => $empresa->supervisor_empresa_cargo ?? null,
                            'created_at' => $fecha,
                            'updated_at' => $fecha,
                        ];
                    })->all()
                );
            }
        }

        if (Schema::hasTable('expediente_efsrt')) {
            Schema::table('expediente_efsrt', function (Blueprint $table) {
                $table->unsignedBigInteger('id_representante_empresa')->nullable();
                $table->foreign('id_representante_empresa')
                    ->references('id_representante_empresa')
                    ->on('empresa_representantes')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('expediente_efsrt') && Schema::hasColumn('expediente_efsrt', 'id_representante_empresa')) {
            Schema::table('expediente_efsrt', function (Blueprint $table) {
                $table->dropForeign(['id_representante_empresa']);
                $table->dropColumn('id_representante_empresa');
            });
        }

        Schema::dropIfExists('empresa_representantes');
    }
};
