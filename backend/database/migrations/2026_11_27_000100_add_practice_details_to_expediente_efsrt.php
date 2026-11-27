<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('expediente_efsrt')) {
            return;
        }

        $columnaEmpresa = collect(Schema::getColumns('expediente_efsrt'))
            ->firstWhere('name', 'id_empresa');
        $hacerEmpresaOpcional = $columnaEmpresa && !$columnaEmpresa['nullable'];
        $agregarFechaInicio = !Schema::hasColumn('expediente_efsrt', 'fecha_inicio');

        if (!$hacerEmpresaOpcional && !$agregarFechaInicio) {
            return;
        }

        Schema::table('expediente_efsrt', function (Blueprint $table) use ($hacerEmpresaOpcional, $agregarFechaInicio) {
            if ($hacerEmpresaOpcional) {
                $table->unsignedBigInteger('id_empresa')->nullable()->change();
            }
            if ($agregarFechaInicio) {
                $table->date('fecha_inicio')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('expediente_efsrt')) {
            return;
        }

        $columnaEmpresa = collect(Schema::getColumns('expediente_efsrt'))
            ->firstWhere('name', 'id_empresa');

        if ($columnaEmpresa && $columnaEmpresa['nullable']) {
            if (DB::table('expediente_efsrt')->whereNull('id_empresa')->exists()) {
                throw new RuntimeException(
                    'No se puede revertir la migración mientras existan expedientes sin empresa.'
                );
            }

            Schema::table('expediente_efsrt', function (Blueprint $table) {
                $table->unsignedBigInteger('id_empresa')->nullable(false)->change();
            });
        }

        if (Schema::hasColumn('expediente_efsrt', 'fecha_inicio')) {
            Schema::table('expediente_efsrt', function (Blueprint $table) {
                $table->dropColumn('fecha_inicio');
            });
        }
    }
};
