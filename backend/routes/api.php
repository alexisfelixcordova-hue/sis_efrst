<?php

use Illuminate\Http\Request;
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
use App\Http\Controllers\Api\DashboardController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {

    // Autenticación y perfil
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/perfil', [AuthController::class, 'perfil']);
    Route::get('/auth/me', [AuthController::class, 'perfil']);
    Route::get('/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'data'    => $request->user(),
        ], 200);
    });
    Route::put('/perfil', [AuthController::class, 'update']);
    Route::put('/perfil/password', [AuthController::class, 'cambiarPassword']);
    Route::post('/perfil/foto', [AuthController::class, 'actualizarFoto']);

    // Dashboard EFSRT
    Route::get('/dashboard/resumen', [DashboardController::class, 'resumen']);
    Route::post('/dashboard/asignar-docente', [DashboardController::class, 'asignarDocente']);

    // ==========================================
    // USUARIOS (CRUD Completo y Registro Personalizado)
    // ==========================================
    Route::post('/usuarios', [AuthController::class, 'register']);
    Route::post('/usuarios/{id}/foto', [AuthController::class, 'actualizarFoto']);
    Route::apiResource('usuarios', AuthController::class)->except(['store']);

    // ==========================================
    // BUSCADOR GLOBAL Y NOTIFICACIONES
    // ==========================================
    Route::get('/buscar-global', [BusquedaGlobalController::class, 'buscar']);

    Route::get('/notificaciones/preferencias', function (Request $request) {
        return response()->json($request->user()->preferencias_notificaciones ?? [], 200);
    });

    Route::post('/notificaciones/preferencias', function (Request $request) {
        $usuario = $request->user();
        $usuario->preferencias_notificaciones = $request->input('preferencias');
        $usuario->save();

        return response()->json(['message' => 'Preferencias actualizadas correctamente'], 200);
    });

    // Expedientes y calificación por módulo (expediente_efsrt)
    Route::get('/expedientes', [ExpedienteController::class, 'index']);
    Route::put('/expedientes/{id}/validar', [ExpedienteController::class, 'validarExpediente']);
    Route::post('/efsrt/calificaciones', [ExpedienteController::class, 'registrarCalificacion']);
    Route::post('/calificaciones-efsrt', [ExpedienteController::class, 'registrarCalificacion']);
    Route::post('/calificaciones', [ExpedienteController::class, 'registrarCalificacion']);
    Route::post('/evaluaciones-efsrt', [ExpedienteController::class, 'registrarCalificacion']);

    // ==========================================
    // EMPRESAS Y CONVENIOS (empresas_convenio)
    // ==========================================
    Route::get('/empresas/ruc/{ruc}', [EmpresaController::class, 'consultarRuc']);
    Route::get('/empresas/{id}/expedientes', [EmpresaController::class, 'expedientes']);
    Route::apiResource('empresas', EmpresaController::class);

    // Estudiantes
    Route::get('/estudiantes/dni/{dni}', [EstudianteController::class, 'consultarDni']);
    Route::apiResource('estudiantes', EstudianteController::class);

    // Docentes
    Route::get('/docentes', [DocenteController::class, 'index']);
    Route::get('/docentes/{id}', [DocenteController::class, 'show']);
    Route::get('/docentes/{id}/estudiantes', [DocenteController::class, 'estudiantesAsignados']);
    Route::post('/docentes/{id}/asignar-estudiantes', [DocenteController::class, 'asignarEstudiantes']);

    // Módulos profesionales (modulos_profesionales)
    Route::apiResource('modulos-profesionales', ModuloController::class);

    // Asignaciones de asesores (asignacion_asesores)
    Route::apiResource('asignaciones-asesores', AsignacionAsesorController::class);
    Route::get('/mis-alumnos', [AsignacionAsesorController::class, 'misAlumnos']);

    // Evidencias EFSRT (evidencias_efsrt)
    Route::apiResource('evidencias', EvidenciaEfsrtController::class);
    Route::get('/evidencias-efsrt', [EvidenciaEfsrtController::class, 'index']);
    Route::get('/expediente-efsrt/{id}/evidencias', [EvidenciaEfsrtController::class, 'porExpediente']);
    Route::get('/alumnos/{id}/evidencias-efsrt', [EvidenciaEfsrtController::class, 'porAlumno']);

    // Constancias EFSRT (constancias_emitidas)
    Route::get('/constancias-efsrt', [ConstanciaEmitidaController::class, 'index']);
    Route::post('/constancias/generar', [ConstanciaEmitidaController::class, 'generar']);
    Route::apiResource('constancias', ConstanciaEmitidaController::class)->except(['store', 'update']);

    // Reportes y estadísticas
    Route::get('/reportes/estadisticas', [ReporteController::class, 'estadisticas']);

    // Asistente virtual (Gemini)
    Route::post('/asistente', [AsistenteController::class, 'chat']);
});