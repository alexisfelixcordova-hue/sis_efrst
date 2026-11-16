<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AsistenteController;
use App\Http\Controllers\Api\AsignacionAsesorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConstanciaEmitidaController;
use App\Http\Controllers\Api\EmpresaController;
use App\Http\Controllers\Api\EstudianteController;
use App\Http\Controllers\Api\EvidenciaEfsrtController;
use App\Http\Controllers\Api\ExpedienteController;
use App\Http\Controllers\Api\ModuloController;
use App\Http\Controllers\Api\DocenteController;
use App\Http\Controllers\Api\BusquedaGlobalController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {

    // Autenticación y perfil
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/perfil', [AuthController::class, 'perfil']);
    Route::put('/perfil', [AuthController::class, 'update']);
    Route::put('/perfil/password', [AuthController::class, 'cambiarPassword']);

    // ==========================================
    // USUARIOS (CRUD Completo y Registro Personalizado)
    // ==========================================
    Route::post('/usuarios', [AuthController::class, 'register']); // Mantiene tu registro con validaciones de contraseña y foto
    Route::apiResource('usuarios', AuthController::class)->except(['store']); // Habilita index, show, update y destroy automáticamente

    // ==========================================
    // BUSCADOR GLOBAL Y NOTIFICACIONES
    // ==========================================
    Route::get('/buscar-global', [BusquedaGlobalController::class, 'buscar']);

    Route::get('/notificaciones/preferencias', function (\Illuminate\Http\Request $request) {
        return response()->json($request->user()->preferencias_notificaciones ?? [], 200);
    });

    Route::post('/notificaciones/preferencias', function (\Illuminate\Http\Request $request) {
        $usuario = $request->user();
        $usuario->preferencias_notificaciones = $request->input('preferencias');
        $usuario->save();

        return response()->json(['message' => 'Preferencias actualizadas correctamente'], 200);
    });

    // Expedientes
    Route::get('/expedientes', [ExpedienteController::class, 'index']);
    Route::put('/expedientes/{id}/validar', [ExpedienteController::class, 'validarExpediente']);

    // ==========================================
    // EMPRESAS Y CONVENIOS
    // ==========================================
    Route::get('/empresas/ruc/{ruc}', [EmpresaController::class, 'consultarRuc']);
    Route::get('/empresas/{id}/expedientes', [EmpresaController::class, 'expedientes']);
    Route::apiResource('empresas', EmpresaController::class);

    // Estudiantes
    Route::apiResource('estudiantes', EstudianteController::class);

    // Docentes
    Route::get('/docentes', [DocenteController::class, 'index']);
    Route::get('/docentes/{id}', [DocenteController::class, 'show']);

    // Módulos profesionales
    Route::apiResource('modulos-profesionales', ModuloController::class);

    // Asignaciones de asesores
    Route::apiResource('asignaciones-asesores', AsignacionAsesorController::class);

    // Evidencias
    Route::apiResource('evidencias', EvidenciaEfsrtController::class);

    // Constancias EFSRT
    Route::get('/constancias-efsrt', [ConstanciaEmitidaController::class, 'index']);
    Route::post('/constancias/generar', [ConstanciaEmitidaController::class, 'generar']);
    Route::apiResource('constancias', ConstanciaEmitidaController::class)->except(['store', 'update']);

    // Asistente virtual (Gemini)
    Route::post('/asistente', [AsistenteController::class, 'chat']);
});