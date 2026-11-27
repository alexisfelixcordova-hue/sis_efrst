<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_datos', function (Blueprint $table) {
            $table->id('id_dato');
            $table->unsignedBigInteger('id_usuario');
            $table->string('aplicacion', 32);
            $table->json('datos');
            $table->timestamps();
            $table->unique(['id_usuario', 'aplicacion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_datos');
    }
};
