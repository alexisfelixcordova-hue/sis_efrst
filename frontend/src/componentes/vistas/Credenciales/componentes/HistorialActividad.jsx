import { History, LogIn, KeyRound, Pencil, FileText } from "lucide-react";

const iconos = { login: LogIn, clave: KeyRound, edicion: Pencil, documento: FileText };

// Reemplaza por el historial real que ya traes de tu API
const registros = [
  { id: 1, tipo: "login", accion: "Inicio de sesión", detalle: "Campus Central · Chrome en Windows", fecha: "Hoy, 08:42" },
  { id: 2, tipo: "edicion", accion: "Actualización de datos personales", detalle: "Se modificó el teléfono institucional", fecha: "Ayer, 16:10" },
  { id: 3, tipo: "documento", accion: "Constancia emitida", detalle: "Constancia de EFSRT #0231", fecha: "05 Nov 2026" },
  { id: 4, tipo: "clave", accion: "Cambio de contraseña", detalle: "Clave actualizada correctamente", fecha: "24 Sep 2026" },
];

export default function HistorialActividad() {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white px-6 py-6">
      <div className="flex items-center gap-4">
        <History size={20} strokeWidth={1.6} />
        <div className="leading-snug">
          <p className="text-xs font-medium">Historial de Actividad</p>
          <p className="text-[10.5px] text-gray-500">Últimos movimientos registrados en tu cuenta</p>
        </div>
      </div>

      {registros.length === 0 ? (
        <p className="py-10 text-center text-xs text-gray-500">Aún no hay actividad registrada.</p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-100">
          {registros.map((r) => {
            const Icon = iconos[r.tipo] ?? History;
            return (
              <li key={r.id} className="flex items-center gap-4 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <div className="flex-1 text-xs leading-snug">
                  <p className="font-semibold">{r.accion}</p>
                  <p className="text-gray-500">{r.detalle}</p>
                </div>
                <span className="shrink-0 text-[11px] text-gray-500">{r.fecha}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}