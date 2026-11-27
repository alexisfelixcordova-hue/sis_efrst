<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('estudiantes') && !Schema::hasColumn('estudiantes', 'foto_url')) {
            Schema::table('estudiantes', function (Blueprint $table) {
                $table->string('foto_url')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('estudiantes') && Schema::hasColumn('estudiantes', 'foto_url')) {
            Schema::table('estudiantes', function (Blueprint $table) {
                $table->dropColumn('foto_url');
            });
        }
    }
};
