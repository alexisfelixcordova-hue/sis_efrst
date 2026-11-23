<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'correo'   => ['required', 'email'],
            'password' => ['required']
        ]);

        // Cargamos la relación del rol para asegurarnos de obtener su nombre
        $user = User::with('rol')->where('correo', $request->correo)->first();

        if (!$user || !Hash::check($request->password, $user->contrasena_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        $token = $user->createToken('efsrt_auth_token')->plainTextToken;

        return response()->json([
            'success'      => true,
            'message'      => 'Bienvenido al sistema EFSRT - IESTP Avelino Cáceres',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => [
                'id_usuario'  => $user->id_usuario,
                'nombres'     => $user->nombres,
                'apellidos'   => $user->apellidos,
                'correo'      => $user->correo,
                'foto_perfil' => $user->foto_perfil,
                'id_rol'      => $user->id_rol,
                'rol'         => $user->rol ? $user->rol->nombre_rol : ($user->id_rol == 1 ? 'Administrador' : 'Docente')
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente'
        ], 200);
    }

    public function perfil(Request $request)
    {
        // Buscamos al usuario autenticado actual y cargamos su relación 'rol' desde la BD
        $usuario = User::with('rol')->find($request->user()->getKey());

        return response()->json([
            'success' => true,
            'data'    => [
                'id_usuario'  => $usuario->id_usuario,
                'dni'         => $usuario->dni,
                'nombres'     => $usuario->nombres,
                'apellidos'   => $usuario->apellidos,
                'correo'      => $usuario->correo,
                'telefono'    => $usuario->telefono,
                'foto_perfil' => $usuario->foto_perfil,
                'id_rol'      => $usuario->id_rol,
                'rol_nombre'  => $usuario->rol ? $usuario->rol->nombre_rol : ($usuario->id_rol == 1 ? 'Administrador' : 'Docente')
            ]
        ], 200);
    }

    public function register(Request $request)
    {
        $request->validate([
            'dni'       => 'required|string|numeric|digits:8|unique:usuarios,dni',
            'name'      => 'required_without:nombres|string|max:100',
            'nombres'   => 'required_without:name|string|max:100',
            'apellidos' => 'required|string|max:100',
            'correo'    => 'required|email|max:150|unique:usuarios,correo',
            'password'  => 'required|min:6',
            'rol_id'    => 'sometimes|integer|exists:roles,id_rol',
            'id_rol'    => 'sometimes|integer|exists:roles,id_rol',
            'telefono'  => 'nullable|string|max:20',
            'foto'      => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048'
        ]);

        // Determinamos el rol a asignar (por defecto 2 = Docente si no se especifica)
        $idRolAsignado = $request->rol_id ?? $request->id_rol ?? 2;

        $fotoPerfil = null;
        if ($request->hasFile('foto')) {
            $archivo = $request->file('foto');
            $nombreArchivo = 'usuario_' . time() . '_' . uniqid() . '.' . $archivo->getClientOriginalExtension();
            $rutaGuardada = $archivo->storeAs('perfiles', $nombreArchivo, 'public');
            $fotoPerfil = '/storage/' . $rutaGuardada;
        }

        $user = User::create([
            'dni'             => $request->dni ?? '00000000',
            'nombres'         => $request->name ?? $request->nombres,
            'apellidos'       => $request->apellidos,
            'correo'          => $request->correo,
            'telefono'        => $request->telefono,
            'foto_perfil'     => $fotoPerfil,
            'contrasena_hash' => Hash::make($request->password),
            'estado_cuenta'   => 'Activo',
            'id_rol'          => $idRolAsignado
        ]);

        // Cargamos la relación del rol directamente desde la base de datos para la respuesta
        $user->load('rol');

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado exitosamente en la base de datos',
            'data'    => [
                'id_usuario'    => $user->id_usuario,
                'dni'           => $user->dni,
                'nombres'       => $user->nombres,
                'apellidos'     => $user->apellidos,
                'correo'        => $user->correo,
                'foto_perfil'   => $user->foto_perfil,
                'id_rol'        => $user->id_rol,
                'rol'           => $user->rol ? $user->rol->nombre_rol : ($user->id_rol == 1 ? 'Administrador' : 'Docente'),
                'estado_cuenta' => $user->estado_cuenta
            ]
        ], 201);
    }

    public function index(Request $request)
    {
        if ($request->has('rol')) {
            $usuarios = User::where('id_rol', $request->rol)->get();
            return response()->json(['success' => true, 'data' => $usuarios], 200);
        }

        return response()->json(['success' => true, 'data' => User::all()], 200);
    }

    public function show($id)
    {
        $usuario = User::findOrFail($id);
        return response()->json(['success' => true, 'data' => $usuario], 200);
    }

    public function update(Request $request, $id = null)
    {
        $idObjetivo = $id ?? $request->user()->getKey();
        $usuario = User::findOrFail($idObjetivo);
        $primaryKey = $usuario->getKey();
        $keyName = $usuario->getKeyName();

        $request->validate([
            'nombres'   => 'sometimes|required|string|max:100',
            'apellidos' => 'sometimes|required|string|max:100',
            'dni'       => 'sometimes|required|string|max:15|unique:usuarios,dni,' . $primaryKey . ',' . $keyName,
            'correo'    => 'sometimes|required|email|max:150|unique:usuarios,correo,' . $primaryKey . ',' . $keyName,
            'telefono'  => 'nullable|string|max:20',
            'rol_id'    => 'sometimes|integer',
            'id_rol'    => 'sometimes|integer',
        ]);

        $usuario->update([
            'nombres'   => $request->name ?? $request->nombres ?? $usuario->nombres,
            'apellidos' => $request->apellidos ?? $usuario->apellidos,
            'dni'       => $request->dni ?? $usuario->dni,
            'correo'    => $request->correo ?? $usuario->correo,
            'telefono'  => $request->telefono ?? $usuario->telefono,
            'id_rol'    => $request->rol_id ?? $request->id_rol ?? $usuario->id_rol,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Usuario actualizado correctamente en la base de datos',
            'data'    => $usuario
        ], 200);
    }

    public function actualizarFoto(Request $request, $id = null)
    {
        $request->validate([
            'foto' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $usuarioAuth = $request->user();
        $idObjetivo = $id ?? $usuarioAuth->getKey();
        $usuario = User::findOrFail($idObjetivo);

        if (!empty($usuario->foto_perfil)) {
            $rutaAnterior = str_replace('/storage/', '', ltrim($usuario->foto_perfil, '/'));
            if (Storage::disk('public')->exists($rutaAnterior)) {
                Storage::disk('public')->delete($rutaAnterior);
            }
        }

        $archivo = $request->file('foto');
        $nombreArchivo = 'usuario_' . $usuario->getKey() . '_' . time() . '.' . $archivo->getClientOriginalExtension();
        $rutaGuardada = $archivo->storeAs('perfiles', $nombreArchivo, 'public');
        $urlPublica = '/storage/' . $rutaGuardada;

        $usuario->update([
            'foto_perfil' => $urlPublica,
        ]);

        return response()->json([
            'success'     => true,
            'message'     => 'Foto de perfil actualizada correctamente',
            'foto_perfil' => $urlPublica,
            'foto_url'    => url($urlPublica),
            'data'        => $usuario
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $usuarioAEliminar = User::findOrFail($id);
        $usuarioLogueado = $request->user();

        if ($usuarioLogueado && $usuarioLogueado->getKey() == $usuarioAEliminar->getKey()) {
            return response()->json([
                'success' => false,
                'message' => 'Acción no permitida: No puedes eliminar tu propia cuenta de usuario activo.'
            ], 422);
        }

        if ($usuarioAEliminar->getKey() == 1) {
            return response()->json([
                'success' => false,
                'message' => 'Acción no permitida: Este usuario administrador principal está protegido.'
            ], 422);
        }

        $usuarioAEliminar->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado correctamente'
        ], 200);
    }

    public function cambiarPassword(Request $request)
    {
        $request->validate([
            'password_actual' => 'required',
            'password_nueva'  => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password_actual, $user->contrasena_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual es incorrecta'
            ], 422);
        }

        $user->update(['contrasena_hash' => Hash::make($request->password_nueva)]);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente'
        ], 200);
    }
}