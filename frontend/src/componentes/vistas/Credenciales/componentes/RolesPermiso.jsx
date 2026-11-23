import { useMemo } from "react";
import { ShieldCheck, Check, X } from "lucide-react";

const MODULOS = [
  { id: "estudiantes", nombre: "Estudiantes" },
  { id: "docentes", nombre: "Docentes" },
  { id: "usuarios", nombre: "Usuarios" },
  { id: "expedientes", nombre: "Expedientes" },
  { id: "constancias", nombre: "Constancias" },
  { id: "revisiones", nombre: "Revisiones" },
  { id: "credenciales", nombre: "Credenciales" },
  { id: "calificaciones", nombre: "Calificaciones" },
];

const crearPermisos = (permisosPorModulo) =>
  MODULOS.map((modulo) => ({
    ...modulo,
    ver: false,
    editar: false,
    eliminar: false,
    emitir: false,
    calificar: false,
    ...permisosPorModulo[modulo.id],
  }));

const PERMISOS_POR_ROL = {
  1: {
    nombreRol: "Administrador",
    nivel: "Nivel 1 · Gestión total",
    modulos: crearPermisos({
      estudiantes: { ver: true, editar: true, eliminar: true },
      docentes: { ver: true, editar: true, eliminar: true },
      usuarios: { ver: true, editar: true, eliminar: true },
      expedientes: { ver: true, editar: true, eliminar: true },
      constancias: { ver: true, editar: true, eliminar: true, emitir: true },
      revisiones: { ver: true, editar: true, eliminar: true },
      credenciales: { ver: true, editar: true, eliminar: true },
      calificaciones: { ver: false, editar: false, eliminar: false, calificar: false },
    }),
  },

  2: {
    nombreRol: "Docente",
    nivel: "Nivel 2 · Docencia y evaluación",
    modulos: crearPermisos({
      estudiantes: { ver: true },
      docentes: { ver: true },
      usuarios: { ver: false, editar: false, eliminar: false },
      expedientes: { ver: true, editar: true },
      constancias: { ver: true },
      revisiones: { ver: true },
      credenciales: { ver: true },
      calificaciones: { ver: true, editar: true, calificar: true },
    }),
  },
};

const POR_DEFECTO = {
  nombreRol: "Invitado / Sin rol",
  nivel: "Nivel 0 · Sin acceso",
  modulos: crearPermisos({}),
};

function resolverIdRol(usuarioProp = {}, usuarioStorage = {}) {
  const fuente =
    usuarioProp && Object.keys(usuarioProp).length > 0
      ? usuarioProp
      : usuarioStorage;

  if (!fuente) return null;

  const valorId = fuente.id_rol ?? fuente.idRol ?? fuente.rol_id;

  if (valorId !== undefined && valorId !== null && valorId !== "") {
    const id = Number(valorId);
    if (!Number.isNaN(id)) return id;
  }

  const textoRol = String(
    fuente.rol ?? fuente.nombre_rol ?? fuente.nombreRol ?? ""
  ).toLowerCase();

  if (textoRol.includes("admin")) return 1;
  if (textoRol.includes("docent")) return 2;

  return null;
}

function Permiso({ activo }) {
  return activo ? (
    <span
      className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      aria-label="Permitido"
      title="Permitido"
    >
      <Check size={13} strokeWidth={2.5} />
    </span>
  ) : (
    <span
      className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400"
      aria-label="No permitido"
      title="No permitido"
    >
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

  const permisos = useMemo(() => {
    if (Array.isArray(permisosApi) && permisosApi.length > 0) {
      return permisosApi;
    }

    return configRol.modulos;
  }, [permisosApi, configRol]);

  const rolEtiqueta =
    usuario?.rol ??
    usuario?.nombre_rol ??
    usuarioStorage?.rol ??
    usuarioStorage?.nombre_rol ??
    configRol.nombreRol;

  const nivelEtiqueta = usuario?.nivel ?? configRol.nivel;
  const modulosConAcceso = permisos.filter((modulo) =>
    Boolean(modulo.ver)
  ).length;

  return (
    <div className="flex flex-col items-start gap-5 md:flex-row">
      <aside className="w-full shrink-0 rounded-3xl border border-gray-200 bg-white p-5 text-xs md:w-[305px]">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck size={18} strokeWidth={1.8} />
          </div>

          <div className="leading-snug">
            <p className="text-gray-500">Rol asignado</p>
            <p className="text-sm font-semibold text-gray-900">
              {rolEtiqueta}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Nivel</span>
            <span className="text-right font-medium text-gray-800">
              {nivelEtiqueta}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Módulos con acceso</span>
            <span className="font-semibold text-blue-600">
              {modulosConAcceso}
            </span>
          </div>
        </div>
      </aside>

      <section className="w-full flex-1 rounded-3xl border border-gray-200 bg-white px-6 py-6">
        <p className="text-xs font-semibold text-gray-900">
          Permisos por módulo
        </p>

        <p className="text-[11px] text-gray-500">
          Permisos asignados para el rol de {configRol.nombreRol.toLowerCase()}.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] text-gray-600">
                <th className="pb-3 font-semibold">Módulo</th>
                <th className="pb-3 text-center font-semibold">Ver</th>
                <th className="pb-3 text-center font-semibold">Editar</th>
                <th className="pb-3 text-center font-semibold">Eliminar</th>
                <th className="pb-3 text-center font-semibold">Emitir</th>
                <th className="pb-3 text-center font-semibold">Calificar</th>
              </tr>
            </thead>

            <tbody>
              {permisos.map((modulo) => (
                <tr
                  key={modulo.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-3 font-medium text-gray-800">
                    {modulo.nombre}
                  </td>
                  <td>
                    <Permiso activo={Boolean(modulo.ver)} />
                  </td>
                  <td>
                    <Permiso activo={Boolean(modulo.editar)} />
                  </td>
                  <td>
                    <Permiso activo={Boolean(modulo.eliminar)} />
                  </td>
                  <td>
                    <Permiso activo={Boolean(modulo.emitir)} />
                  </td>
                  <td>
                    <Permiso activo={Boolean(modulo.calificar)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}