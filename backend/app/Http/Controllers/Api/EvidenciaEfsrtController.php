<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvidenciaEfsrt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EvidenciaEfsrtController extends Controller
{
    /**
     * Listar evidencias (con opción de filtrar por id_expediente)
     */
    public function index(Request $request)
    {
        $query = EvidenciaEfsrt::with('expediente');

        if ($request->has('id_expediente')) {
            $query->where('id_expediente', $request->id_expediente);
        }

        $evidencias = $query->orderBy('id_evidencia', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $evidencias
        ], 200);
    }

    /**
     * Registrar una nueva evidencia (subir archivo a carpeta temporal o guardar URL)
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_expediente' => 'required|integer',
            'tipo_evidencia' => 'required|string|in:Ficha Asistencia,Informe Semanal,Evaluación Empresa,Enlace Repositorio Web',
            'titulo_evidencia' => 'required|string|max:150',
            'archivo' => 'nullable|file|mimes:pdf,doc,docx,png,jpg,jpeg|max:10240',
            'ruta_archivo_o_url' => 'nullable|string|max:255'
        ]);

        $rutaFinal = '';

        if ($request->hasFile('archivo')) {
            // Guarda en storage/app/public/evidencias_temp
            $rutaFinal = $request->file('archivo')->store('evidencias_temp', 'public');
        } elseif ($request->filled('ruta_archivo_o_url')) {
            $rutaFinal = $request->ruta_archivo_o_url;
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Debe adjuntar un archivo o proporcionar una ruta/URL válida.'
            ], 400);
        }

        $evidencia = EvidenciaEfsrt::create([
            'id_expediente' => $request->id_expediente,
            'tipo_evidencia' => $request->tipo_evidencia,
            'titulo_evidencia' => $request->titulo_evidencia,
            'ruta_archivo_o_url' => $rutaFinal,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Evidencia registrada correctamente',
            'data' => $evidencia
        ], 201);
    }

    /**
     * Mostrar una evidencia específica
     */
    public function show($id)
    {
        $evidencia = EvidenciaEfsrt::with('expediente')->find($id);

        if (!$evidencia) {
            return response()->json([
                'success' => false,
                'message' => 'Evidencia no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $evidencia
        ], 200);
    }

    /**
     * Actualizar una evidencia existente
     */
    public function update(Request $request, $id)
    {
        $evidencia = EvidenciaEfsrt::find($id);

        if (!$evidencia) {
            return response()->json([
                'success' => false,
                'message' => 'Evidencia no encontrada'
            ], 404);
        }

        $request->validate([
            'id_expediente' => 'sometimes|integer',
            'tipo_evidencia' => 'sometimes|string|in:Ficha Asistencia,Informe Semanal,Evaluación Empresa,Enlace Repositorio Web',
            'titulo_evidencia' => 'sometimes|string|max:150',
            'archivo' => 'nullable|file|mimes:pdf,doc,docx,png,jpg,jpeg|max:10240',
            'ruta_archivo_o_url' => 'nullable|string|max:255'
        ]);

        $rutaFinal = $evidencia->ruta_archivo_o_url;

        // Si envían un nuevo archivo físico
        if ($request->hasFile('archivo')) {
            // Eliminar el archivo anterior si era físico en storage
            if (Storage::disk('public')->exists($evidencia->ruta_archivo_o_url)) {
                Storage::disk('public')->delete($evidencia->ruta_archivo_o_url);
            }
            $rutaFinal = $request->file('archivo')->store('evidencias_temp', 'public');
        } elseif ($request->filled('ruta_archivo_o_url')) {
            $rutaFinal = $request->ruta_archivo_o_url;
        }

        $evidencia->update([
            'id_expediente' => $request->input('id_expediente', $evidencia->id_expediente),
            'tipo_evidencia' => $request->input('tipo_evidencia', $evidencia->tipo_evidencia),
            'titulo_evidencia' => $request->input('titulo_evidencia', $evidencia->titulo_evidencia),
            'ruta_archivo_o_url' => $rutaFinal,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Evidencia actualizada correctamente',
            'data' => $evidencia
        ], 200);
    }

    /**
     * Eliminar una evidencia
     */
    public function destroy($id)
    {
        $evidencia = EvidenciaEfsrt::find($id);

        if (!$evidencia) {
            return response()->json([
                'success' => false,
                'message' => 'Evidencia no encontrada'
            ], 404);
        }

        // Eliminar archivo físico de storage si existe y no es una URL externa
        if (Storage::disk('public')->exists($evidencia->ruta_archivo_o_url)) {
            Storage::disk('public')->delete($evidencia->ruta_archivo_o_url);
        }

        $evidencia->delete();

        return response()->json([
            'success' => true,
            'message' => 'Evidencia eliminada correctamente'
        ], 200);
    }
}