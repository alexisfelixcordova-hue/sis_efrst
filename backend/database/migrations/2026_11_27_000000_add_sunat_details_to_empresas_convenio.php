<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const COLUMNAS = [
        'estado' => 30,
        'condicion' => 30,
        'tipo_contribuyente' => 100,
        'departamento' => 100,
        'provincia' => 100,
        'distrito' => 100,
        'ubigeo' => 6,
        'telefono' => 50,
        'correo_electronico' => 255,
        'direccion' => 500,
    ];

    public function up(): void
    {
        if (! Schema::hasTable('empresas_convenio')) {
            return;
        }

        $faltantes = array_filter(
            self::COLUMNAS,
            fn ($longitud, $columna) => ! Schema::hasColumn('empresas_convenio', $columna),
            ARRAY_FILTER_USE_BOTH
        );

        if ($faltantes === []) {
            return;
        }

        Schema::table('empresas_convenio', function (Blueprint $table) use ($faltantes) {
            foreach ($faltantes as $columna => $longitud) {
                $table->string($columna, $longitud)->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('empresas_convenio')) {
            return;
        }

        $existentes = array_keys(array_filter(
            self::COLUMNAS,
            fn ($longitud, $columna) => Schema::hasColumn('empresas_convenio', $columna),
            ARRAY_FILTER_USE_BOTH
        ));

        if ($existentes !== []) {
            Schema::table('empresas_convenio', function (Blueprint $table) use ($existentes) {
                $table->dropColumn($existentes);
            });
        }
    }
};
