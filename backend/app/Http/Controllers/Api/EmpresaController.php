<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\RepresentanteEmpresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EmpresaController extends Controller
{
    // Lista empresas con sus contactos, representante principal y estudiantes
    public function index()
    {
        try {
            $relaciones = ['estudiantes'];

            if (Schema::hasTable('empresa_representantes')) {
                $relaciones[] = 'representantes';
                if (Schema::hasColumn('empresas_convenio', 'id_representante_empresa')) {
                    $relaciones[] = 'representantePrincipal';
                }
            }

            $empresas = Empresa::query()
                ->with($relaciones)
                ->orderByDesc('id_empresa')
                ->get();

            return response()->json($empresas, 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => $e->getMessage(),
                'archivo' => $e->getFile(),
                'linea'   => $e->getLine(),
            ], 500);
        }
    }

    // Registra una empresa y vincula su representante inicial si viene en la petición
    public function store(Request $request)
    {
        $datos = $request->validate([
            'ruc'                        => 'required|string|size:11|regex:/^[0-9]{11}$/|unique:empresas_convenio,ruc',
            'razon_social'               => 'required|string|max:150',
            'id_representante_empresa'   => 'nullable|integer|exists:empresa_representantes,id_representante_empresa',
            'supervisor_empresa_nombre'  => 'nullable|string|max:150',
            'supervisor_empresa_cargo'   => 'nullable|string|max:100',
            'telefono'                   => 'nullable|string|max:50',
            'correo_electronico'         => 'nullable|email|max:255',
            'direccion'                  => 'nullable|string|max:500',
            'estado'                     => 'nullable|string|max:30',
            'condicion'                  => 'nullable|string|max:30',
            'tipo_contribuyente'         => 'nullable|string|max:100',
            'departamento'               => 'nullable|string|max:100',
            'provincia'                  => 'nullable|string|max:100',
            'distrito'                   => 'nullable|string|max:100',
            'ubigeo'                     => 'nullable|string|max:6',
        ]);

        $empresa = DB::transaction(function () use ($datos) {
            $datosEmpresa = collect($datos)
                ->except(['supervisor_empresa_nombre', 'supervisor_empresa_cargo'])
                ->toArray();

            $empresa = Empresa::create($datosEmpresa);

            if (!empty($datos['supervisor_empresa_nombre'])) {
                $representante = $empresa->representantes()->create([
                    'nombre'   => $datos['supervisor_empresa_nombre'],
                    'cargo'    => $datos['supervisor_empresa_cargo'] ?? null,
                    'telefono' => $datos['telefono'] ?? null,
                    'correo'   => $datos['correo_electronico'] ?? null,
                ]);

                if (Schema::hasColumn('empresas_convenio', 'id_representante_empresa')) {
                    $empresa->update([
                        'id_representante_empresa' => $representante->id_representante_empresa,
                    ]);
                }
            }

            return $empresa->load(['representantes', 'representantePrincipal']);
        });

        return response()->json([
            'message' => 'Empresa de convenio registrada exitosamente',
            'data'    => $empresa,
        ], 201);
    }

    // Elimina una empresa por su ID
    public function destroy($id)
    {
        $empresa = Empresa::where('id_empresa', $id)->first();

        if (!$empresa) {
            return response()->json(['error' => 'Empresa no encontrada'], 404);
        }

        $empresa->delete();

        return response()->json([
            'message' => 'Empresa de convenio eliminada correctamente',
        ], 200);
    }

    // Agrega un representante/contacto a la empresa
    public function storeRepresentante(Request $request, $id)
    {
        $empresa = Empresa::where('id_empresa', $id)->firstOrFail();

        $datos = $request->validate([
            'nombre'   => 'required|string|max:150',
            'cargo'    => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
            'correo'   => 'nullable|email|max:150',
        ]);

        $representante = $empresa->representantes()->create($datos);

        if (
            Schema::hasColumn('empresas_convenio', 'id_representante_empresa')
            && empty($empresa->id_representante_empresa)
        ) {
            $empresa->update([
                'id_representante_empresa' => $representante->id_representante_empresa,
            ]);
        }

        return response()->json([
            'message' => 'Contacto agregado a la empresa.',
            'data'    => $representante,
        ], 201);
    }

    // Actualiza un representante de la empresa
    public function updateRepresentante(Request $request, $id, $idRepresentante)
    {
        $representante = RepresentanteEmpresa::query()
            ->where('id_empresa', $id)
            ->where('id_representante_empresa', $idRepresentante)
            ->firstOrFail();

        $datos = $request->validate([
            'nombre'   => 'required|string|max:150',
            'cargo'    => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
            'correo'   => 'nullable|email|max:150',
        ]);

        $representante->update($datos);

        return response()->json([
            'message' => 'Contacto actualizado.',
            'data'    => $representante->fresh(),
        ]);
    }

    // Elimina un representante si no está asignado a un expediente
    public function destroyRepresentante($id, $idRepresentante)
    {
        $representante = RepresentanteEmpresa::query()
            ->where('id_empresa', $id)
            ->where('id_representante_empresa', $idRepresentante)
            ->firstOrFail();

        if (
            Schema::hasTable('expediente_efsrt')
            && Schema::hasColumn('expediente_efsrt', 'id_representante_empresa')
            && DB::table('expediente_efsrt')
                ->where('id_representante_empresa', $representante->id_representante_empresa)
                ->exists()
        ) {
            return response()->json([
                'message' => 'No se puede eliminar un contacto asignado a un expediente.',
            ], 422);
        }

        if (Schema::hasColumn('empresas_convenio', 'id_representante_empresa')) {
            Empresa::where('id_empresa', $id)
                ->where('id_representante_empresa', $representante->id_representante_empresa)
                ->update(['id_representante_empresa' => null]);
        }

        $representante->delete();

        return response()->json(['message' => 'Contacto eliminado.']);
    }

    // Consulta datos completos de RUC en Decolecta (/v1/sunat/ruc/full)
    public function consultarRuc($ruc)
    {
        $ruc = preg_replace('/\D/', '', trim($ruc));

        if (strlen($ruc) !== 11) {
            return response()->json(['error' => 'El RUC debe tener exactamente 11 dígitos.'], 400);
        }

        $token = $_ENV['DECOLECTA_API_TOKEN']
            ?? $_SERVER['DECOLECTA_API_TOKEN']
            ?? env('DECOLECTA_API_TOKEN')
            ?? $_ENV['SUNAT_API_TOKEN']
            ?? $_SERVER['SUNAT_API_TOKEN']
            ?? env('SUNAT_API_TOKEN');

        if (!$token) {
            return response()->json([
                'error' => 'No se encontró DECOLECTA_API_TOKEN ni SUNAT_API_TOKEN en .env.',
            ], 500);
        }

        $url = 'https://api.decolecta.com/v1/sunat/ruc/full?numero=' . urlencode($ruc);

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                'Authorization: Bearer ' . $token,
            ],
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);

        if ($curlError) {
            return response()->json(['error' => 'Error de conexión con el servicio externo: ' . $curlError], 500);
        }

        $data = json_decode($response, true);

        if ($httpCode !== 200) {
            return response()->json([
                'error'    => 'No se pudo obtener información de la SUNAT (Código HTTP: ' . $httpCode . ')',
                'detalles' => $data ?? $response,
            ], $httpCode ?: 502);
        }

        if (!is_array($data)) {
            return response()->json(['error' => 'Respuesta no procesable del servicio externo.'], 500);
        }

        return response()->json($data, 200);
    }
}