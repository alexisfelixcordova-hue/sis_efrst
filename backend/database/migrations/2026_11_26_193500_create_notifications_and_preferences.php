<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->json('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        if (!Schema::hasColumn('usuarios', 'preferencias_notificaciones')) {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->json('preferencias_notificaciones')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');

        if (Schema::hasColumn('usuarios', 'preferencias_notificaciones')) {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->dropColumn('preferencias_notificaciones');
            });
        }
    }
};
