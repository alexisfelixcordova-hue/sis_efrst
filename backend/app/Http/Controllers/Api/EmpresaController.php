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
            $empresas = Empresa::with('estudiantes')->orderBy('id_empresa', 'desc')->get();
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
        $request->validate([
            'ruc' => 'required|string|size:11|unique:empresas_convenio,ruc',
            'razon_social' => 'required|string|max:255',
            'supervisor_empresa_nombre' => 'nullable|string|max:255',
            'supervisor_empresa_cargo' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
            'correo_electronico' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:500',
        ]);

        $empresa = Empresa::create($request->all());

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
        $token = 'sk_21694.PFZ3EPG494f3cEQfQB8iCSMvMUKKayHw';

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