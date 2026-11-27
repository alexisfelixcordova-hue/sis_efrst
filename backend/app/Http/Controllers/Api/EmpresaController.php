<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa; // <-- En singular
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    public function index()
    {
        try {
            $empresas = Empresa::query()
                ->select([
                    'id_empresa',
                    'ruc',
                    'razon_social',
                    'supervisor_empresa_nombre',
                    'supervisor_empresa_cargo',
                    'estado_convenio',
                    'documento_convenio_ruta',
                    'estado',
                    'condicion',
                    'tipo_contribuyente',
                    'departamento',
                    'provincia',
                    'distrito',
                    'ubigeo',
                    'telefono',
                    'correo_electronico',
                    'direccion',
                ])
                ->with(['estudiantes:id_estudiante,nombres,apellidos,dni'])
                ->orderByDesc('id_empresa')
                ->get();
            return response()->json($empresas, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'archivo' => $e->getFile(),
                'linea' => $e->getLine()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'ruc' => 'required|string|size:11|regex:/^[0-9]{11}$/|unique:empresas_convenio,ruc',
            'razon_social' => 'required|string|max:150',
            'supervisor_empresa_nombre' => 'nullable|string|max:150',
            'supervisor_empresa_cargo' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
            'correo_electronico' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:500',
            'estado' => 'nullable|string|max:30',
            'condicion' => 'nullable|string|max:30',
            'tipo_contribuyente' => 'nullable|string|max:100',
            'departamento' => 'nullable|string|max:100',
            'provincia' => 'nullable|string|max:100',
            'distrito' => 'nullable|string|max:100',
            'ubigeo' => 'nullable|string|max:6',
        ]);

        $empresa = Empresa::create($datos);

        return response()->json([
            'message' => 'Empresa de convenio registrada exitosamente',
            'data' => $empresa
        ], 201);
    }

    public function destroy($id)
    {
        $empresa = Empresa::where('id_empresa', $id)->first();

        if (!$empresa) {
            return response()->json(['error' => 'Empresa no encontrada'], 404);
        }

        $empresa->delete();

        return response()->json([
            'message' => 'Empresa de convenio eliminada correctamente'
        ], 200);
    }

    public function consultarRuc($ruc)
{
    $ruc = preg_replace('/\D/', '', trim($ruc));

    if (strlen($ruc) !== 11) {
        return response()->json(['error' => 'El RUC debe tener exactamente 11 dígitos.'], 400);
    }

    $url = 'https://api.decolecta.com/v1/sunat/ruc?numero=' . $ruc;
    
    // Leemos el token de forma segura desde el archivo .env
    $token = env('SUNAT_API_TOKEN');

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . $token
        ],
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($curlError) {
        return response()->json(['error' => 'Error de conexión con el servicio externo: ' . $curlError], 500);
    }

    if ($httpCode !== 200) {
        return response()->json([
            'error' => 'No se pudo obtener información de la SUNAT (Código HTTP: ' . $httpCode . ')',
            'detalles' => json_decode($response, true) ?? $response
        ], $httpCode);
    }

    $data = json_decode($response, true);
    if (!$data) {
        return response()->json(['error' => 'Respuesta no procesable del servicio externo.'], 500);
    }

    return response()->json($data, 200);
}
}