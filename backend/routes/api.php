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
use App\Http\Controllers\Api\ReporteController;

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

    // 1. Coloca primero la ruta específica de consulta por RUC
    Route::get('/empresas/ruc/{ruc}', [EmpresaController::class, 'consultarRuc']);

    // 2. Luego las demás rutas personalizadas
    Route::get('/empresas/{id}/expedientes', [EmpresaController::class, 'expedientes']);

    // 3. Finalmente el recurso general al final
    Route::apiResource('empresas', EmpresaController::class);

    // Estudiantes
    Route::get('/estudiantes/dni/{dni}', [EstudianteController::class, 'consultarDni']);
    Route::apiResource('estudiantes', EstudianteController::class);

    // Docentes
    Route::get('/docentes', [DocenteController::class, 'index']);
    Route::get('/docentes/{id}', [DocenteController::class, 'show']);
    Route::get('/docentes/{id}/estudiantes', [DocenteController::class, 'estudiantesAsignados']);
    Route::post('/docentes/{id}/asignar-estudiantes', [DocenteController::class, 'asignarEstudiantes']);

    // Módulos profesionales
    Route::apiResource('modulos-profesionales', ModuloController::class);

    // Asignaciones de asesores
    Route::apiResource('asignaciones-asesores', AsignacionAsesorController::class);
    Route::get('/mis-alumnos', [AsignacionAsesorController::class, 'misAlumnos']);

    // Evidencias
    Route::apiResource('evidencias', EvidenciaEfsrtController::class);

    // Constancias EFSRT
    Route::get('/constancias-efsrt', [ConstanciaEmitidaController::class, 'index']);
    Route::post('/constancias/generar', [ConstanciaEmitidaController::class, 'generar']);
    Route::apiResource('constancias', ConstanciaEmitidaController::class)->except(['store', 'update']);

    // Reportes y estadísticas
    Route::get('/reportes/estadisticas', [ReporteController::class, 'estadisticas']);

    // Asistente virtual (Gemini)
    Route::post('/asistente', [AsistenteController::class, 'chat']);
});