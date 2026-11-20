import { useMemo } from "react";
import { ShieldCheck, Check, X } from "lucide-react";

const PERMISOS_POR_ROL = {
  // Rol 1: Administrador
  1: {
    nombreRol: "Administrador",
    nivel: "Nivel 1 · Gestión Total",
    modulos: [
      { id: "estudiantes", nombre: "Estudiantes", ver: true, editar: true, eliminar: true },
      { id: "docentes", nombre: "Docentes", ver: true, editar: true, eliminar: true },
      { id: "constancias", nombre: "Constancias", ver: true, editar: true, eliminar: false },
      { id: "revisiones", nombre: "Revisiones", ver: true, editar: true, eliminar: false },
      { id: "credenciales", nombre: "Credenciales", ver: true, editar: true, eliminar: false },
    ],
  },
  // Rol 2: Docente
  2: {
    nombreRol: "Docente",
    nivel: "Nivel 2 · Asesoría y Evaluación",
    modulos: [
      { id: "estudiantes", nombre: "Estudiantes", ver: true, editar: false, eliminar: false },
      { id: "docentes", nombre: "Docentes", ver: true, editar: false, eliminar: false },
      { id: "constancias", nombre: "Constancias", ver: true, editar: true, eliminar: false },
      { id: "revisiones", nombre: "Revisiones", ver: true, editar: true, eliminar: false },
      { id: "credenciales", nombre: "Credenciales", ver: true, editar: false, eliminar: false },
    ],
  },
};

const POR_DEFECTO = {
  nombreRol: "Invitado / Sin rol",
  nivel: "Nivel 0 · Solo lectura",
  modulos: [
    { id: "estudiantes", nombre: "Estudiantes", ver: false, editar: false, eliminar: false },
    { id: "docentes", nombre: "Docentes", ver: false, editar: false, eliminar: false },
    { id: "constancias", nombre: "Constancias", ver: false, editar: false, eliminar: false },
    { id: "revisiones", nombre: "Revisiones", ver: false, editar: false, eliminar: false },
    { id: "credenciales", nombre: "Credenciales", ver: false, editar: false, eliminar: false },
  ],
};

function resolverIdRol(usuarioProp, usuarioStorage) {
  const fuente =
    usuarioProp && Object.keys(usuarioProp).length > 0
      ? usuarioProp
      : usuarioStorage;

  if (!fuente) return null;

  if (fuente.id_rol !== undefined && fuente.id_rol !== null && fuente.id_rol !== "") {
    const num = Number(fuente.id_rol);
    if (!Number.isNaN(num)) return num;
  }

  const textoRol = String(fuente.rol || fuente.nombre_rol || "").toLowerCase();
  if (textoRol.includes("admin")) return 1;
  if (textoRol.includes("docent")) return 2;

  return null;
}

function Permiso({ activo }) {
  return activo ? (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
      <Check size={13} strokeWidth={2.5} />
    </span>
  ) : (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      <X size={13} strokeWidth={2.5} />
    </span>
  );
}

export default function RolesPermiso({ usuario = {}, permisosApi = null }) {
  const usuarioStorage = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}") || {};
    } catch {
      return {};
    }
  }, []);

  const idRol = resolverIdRol(usuario, usuarioStorage);
  const configRol = PERMISOS_POR_ROL[idRol] || POR_DEFECTO;

  // Si en algún momento envías un arreglo de permisos desde la API, lo usa; si no, aplica el del rol
  const permisos = useMemo(() => {
    if (Array.isArray(permisosApi) && permisosApi.length > 0) {
      return permisosApi;
    }
    return configRol.modulos;
  }, [permisosApi, configRol]);

  const rolEtiqueta = usuario?.rol ?? usuarioStorage?.rol ?? configRol.nombreRol;
  const nivelEtiqueta = usuario?.nivel ?? configRol.nivel;
  const modulosConAcceso = permisos.filter((m) => Boolean(m.ver)).length;

  return (
    <div className="flex flex-col items-start gap-5 md:flex-row">
      <aside className="w-full shrink-0 rounded-3xl border border-gray-200 bg-white p-5 text-xs md:w-[305px]">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck size={18} strokeWidth={1.8} />
          </div>
          <div className="leading-snug">
            <p className="text-gray-500">Rol asignado</p>
            <p className="text-sm font-semibold text-gray-900">{rolEtiqueta}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Nivel</span>
            <span className="text-right font-medium text-gray-800">{nivelEtiqueta}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Módulos con acceso</span>
            <span className="font-semibold text-blue-600">{modulosConAcceso}</span>
          </div>
        </div>
      </aside>

      <section className="w-full flex-1 rounded-3xl border border-gray-200 bg-white px-6 py-6">
        <p className="text-xs font-semibold text-gray-900">Permisos por módulo</p>
        <p className="text-[11px] text-gray-500">
          Accesos asignados automáticamente para el rol de {configRol.nombreRol.toLowerCase()}
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] text-gray-600">
                <th className="pb-3 font-semibold">Módulo</th>
                <th className="pb-3 text-center font-semibold">Ver</th>
                <th className="pb-3 text-center font-semibold">Editar</th>
                <th className="pb-3 text-center font-semibold">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {permisos.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 font-medium text-gray-800">{m.nombre}</td>
                  <td><Permiso activo={Boolean(m.ver)} /></td>
                  <td><Permiso activo={Boolean(m.editar)} /></td>
                  <td><Permiso activo={Boolean(m.eliminar)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}