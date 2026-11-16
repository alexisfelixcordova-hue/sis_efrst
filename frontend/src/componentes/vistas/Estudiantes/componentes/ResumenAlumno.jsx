import { GraduationCap, CalendarRange, Users, Activity, UserCheck } from "lucide-react";
import { datosAcademicos, datosDocente, formatCiclo } from "./DatosPersonales";

// Color según el estado del alumno (no distingue mayúsculas/minúsculas)
const estados = {
  "al día": "text-emerald-600",
  "revisión pendiente": "text-amber-600",
  observado: "text-red-600",
  completado: "text-blue-600",
};

export default function ResumenAlumno({ estudiante, docente, darkMode = false }) {
  const { carrera, ciclo, seccion, estado } = datosAcademicos(estudiante);
  const asesor = datosDocente(estudiante, docente)?.nombre;

  const dm = darkMode;
  const borde = dm ? "border-slate-700/70" : "border-slate-200";
  const divisor = dm ? "divide-slate-700/70" : "divide-slate-100";
  const secundario = dm ? "text-slate-400" : "text-slate-500";
  const vacio = dm ? "text-slate-500" : "text-slate-400";
  const icono = dm ? "bg-slate-700/60 text-slate-300" : "bg-slate-100 text-slate-500";

  const colorEstado = estados[estado?.toLowerCase()] || (dm ? "text-slate-200" : "text-slate-700");

  const filas = [
    { icon: GraduationCap, etiqueta: "Carrera", valor: carrera },
    { icon: CalendarRange, etiqueta: "Ciclo académico", valor: formatCiclo(ciclo) },
    { icon: Users, etiqueta: "Sección", valor: seccion },
    {
      icon: Activity,
      etiqueta: "Estado",
      valor: estado && (
        <span className={`inline-flex items-center gap-1.5 ${colorEstado}`}>
          <i className="h-1.5 w-1.5 rounded-full bg-current" /> {estado}
        </span>
      ),
    },
    {
      icon: UserCheck,
      etiqueta: "Docente asesor",
      valor: asesor || <span className="text-amber-600">Sin asignar</span>,
    },
  ];

  return (
    <aside
      className={`overflow-hidden rounded-2xl border shadow-sm ${borde} ${
        dm ? "bg-[#1e293b]" : "bg-white"
      }`}
    >
      <div className={`border-b px-5 py-4 ${borde}`}>
        <h2 className="text-base font-semibold">Resumen académico</h2>
      </div>

      <dl className={`divide-y px-5 ${divisor}`}>
        {filas.map(({ icon: Icono, etiqueta, valor }) => (
          <div key={etiqueta} className="flex items-start gap-3 py-3.5">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${icono}`}
            >
              <Icono size={15} />
            </span>
            <div className="min-w-0">
              <dt className={`text-xs ${secundario}`}>{etiqueta}</dt>
              <dd className="mt-0.5 break-words text-sm font-semibold">
                {valor || <span className={`font-normal ${vacio}`}>No registrado</span>}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </aside>
  );
}