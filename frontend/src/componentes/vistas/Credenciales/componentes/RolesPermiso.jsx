import { useState } from "react";
import { ShieldCheck, Check, X } from "lucide-react";

// Reemplaza por los permisos reales que ya recibes de tu API
const modulos = [
  { id: "estudiantes", nombre: "Estudiantes", ver: true, editar: true, eliminar: false },
  { id: "docentes", nombre: "Docentes", ver: true, editar: true, eliminar: true },
  { id: "constancias", nombre: "Constancias", ver: true, editar: true, eliminar: false },
  { id: "revisiones", nombre: "Revisiones", ver: true, editar: false, eliminar: false },
  { id: "credenciales", nombre: "Credenciales", ver: true, editar: true, eliminar: false },
];

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

export default function RolesPermiso({ usuario = {} }) {
  const [permisos] = useState(modulos);

  return (
    <div className="flex items-start gap-5">
      <aside className="w-[305px] shrink-0 rounded-3xl border border-gray-200 bg-white p-5 text-xs">
        <div className="flex items-center gap-4">
          <ShieldCheck size={18} strokeWidth={1.8} />
          <div className="leading-snug">
            <p className="text-gray-600">Rol asignado</p>
            <p className="font-semibold">{usuario.rol ?? "—"}</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <div className="flex justify-between"><span className="text-gray-500">Nivel</span><span className="font-medium">{usuario.nivel ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Módulos con acceso</span><span className="font-medium">{permisos.filter((m) => m.ver).length}</span></div>
        </div>
      </aside>

      <section className="flex-1 rounded-3xl border border-gray-200 bg-white px-6 py-6">
        <p className="text-xs font-medium">Permisos por módulo</p>
        <p className="text-[10.5px] text-gray-500">Accesos asignados a tu rol institucional</p>

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
                  <td className="py-3 font-medium">{m.nombre}</td>
                  <td><Permiso activo={m.ver} /></td>
                  <td><Permiso activo={m.editar} /></td>
                  <td><Permiso activo={m.eliminar} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}