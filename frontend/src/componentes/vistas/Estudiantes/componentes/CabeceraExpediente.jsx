import { useState } from "react";
import { ArrowLeft, Copy, Check, UserPlus, UserCheck, Mail, Repeat, GraduationCap } from "lucide-react";
import { datosAcademicos, datosDocente, formatCiclo } from "./DatosPersonales";
import AvatarEstudiante from "../../../AvatarEstudiante.jsx";

const HORAS_TOTALES = 480;

/*
  Cabecera estilo TikTok (centrada). El estudiante NO edita nada: solo se le asigna un docente.
  Props:
    estudiante       -> datos del estudiante (de la API)
    docente          -> opcional, { nombre, correo }. Si no llega, se busca en estudiante.docente / asesor / docente_nombre
    puedeAsignar     -> true para mostrar el botón de asignar/cambiar docente (ej. solo administradores)
    onAsignarDocente -> () => abre tu modal o selector de docente
    tabs, tabActiva, onCambiarTab -> pestañas opcionales
*/
export default function CabeceraExpediente({
  estudiante,
  docente,
  onVolver,
  darkMode = false,
  puedeAsignar = true,
  onAsignarDocente,
  tabs = [],
  tabActiva,
  onCambiarTab,
}) {
  const [copiado, setCopiado] = useState(false);

  // ---------- Datos ----------
  const nombresVal = estudiante?.nombres || estudiante?.nombre || "";
  const apellidosVal = estudiante?.apellidos || estudiante?.apellido || "";
  const nombreCompleto = `${nombresVal} ${apellidosVal}`.trim() || "Estudiante";

  const codigo =
    estudiante?.codigo ||
    estudiante?.dni ||
    estudiante?.id_estudiante ||
    estudiante?.id ||
    "Sin código";

  const iniciales = (t) =>
    t
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  const { carrera, ciclo } = datosAcademicos(estudiante);
  const bio = [carrera, formatCiclo(ciclo)].filter(Boolean).join(" · ");

  const d = datosDocente(estudiante, docente);
  const docenteNombre = d?.nombre || "";
  const asignado = Boolean(docenteNombre);

  const horasRaw = estudiante?.horas_acumuladas ?? estudiante?.hrs ?? estudiante?.horas;
  const horas = horasRaw === undefined ? null : Number(horasRaw) || 0;
  const avance = horas === null ? null : Math.min(100, Math.round((horas / HORAS_TOTALES) * 100));
  const stats = [
    [horas ?? "—", "Horas"],
    [avance === null ? "—" : `${avance}%`, "Avance"],
    [estudiante?.bitacoras ?? "—", "Bitácoras"],
  ];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(codigo));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  // ---------- Estilos ----------
  const dm = darkMode;
  const suave = dm ? "text-slate-400" : "text-slate-500";
  const titulo = dm ? "text-white" : "text-slate-900";
  const borde = dm ? "border-slate-700/70" : "border-slate-200";
  const botonGris = dm
    ? "bg-slate-700/70 text-slate-100 hover:bg-slate-700"
    : "bg-slate-100 text-slate-800 hover:bg-slate-200";

  return (
    <header className="space-y-3">
      <button
        type="button"
        onClick={onVolver}
        className={`group inline-flex items-center gap-2 text-sm font-medium transition ${
          dm ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Volver a estudiantes
      </button>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${borde} ${
          dm ? "bg-[#1e293b]" : "bg-white"
        }`}
      >
        <div className="flex flex-col items-center px-5 pb-2 pt-8 text-center sm:px-8">
          {/* Foto de perfil (solo lectura) */}
          <div className="relative">
            <div
              className={`h-28 w-28 overflow-hidden rounded-full text-3xl font-bold ring-4 ring-offset-4 sm:h-32 sm:w-32 sm:text-4xl ${
                asignado ? "ring-emerald-500/50" : "ring-amber-400/50"
              } ${
                dm
                  ? "ring-offset-[#1e293b]"
                  : "ring-offset-white"
              }`}
            >
              <AvatarEstudiante
                estudiante={estudiante}
                alt={nombreCompleto}
                className="h-full w-full rounded-full text-3xl font-bold sm:text-4xl"
                fallbackClassName={dm ? "bg-slate-700 text-blue-200" : "bg-blue-50 text-blue-700"}
              />
            </div>
            <span
              className={`absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] text-white shadow ${
                dm ? "border-[#1e293b]" : "border-white"
              } ${asignado ? "bg-emerald-500" : "bg-amber-500"}`}
              title={asignado ? "Docente asignado" : "Sin docente"}
            >
              {asignado ? <UserCheck size={15} /> : <UserPlus size={15} />}
            </span>
          </div>

          {/* Nombre, @código y bio */}
          <h1 className={`mt-5 text-2xl font-bold tracking-tight ${titulo}`}>{nombreCompleto}</h1>
          <p className={`mt-0.5 text-sm font-medium ${suave}`}>@{codigo}</p>
          {bio && (
            <p className={`mt-2 inline-flex items-center gap-1.5 text-sm ${dm ? "text-slate-300" : "text-slate-700"}`}>
              <GraduationCap size={15} className={suave} />
              {bio}
            </p>
          )}

          {/* Estadísticas: solo si hay docente asignado */}
          {asignado && (
            <div className="mt-6 flex items-stretch justify-center">
              {stats.map(([valor, etiqueta], i) => (
                <div
                  key={etiqueta}
                  className={`min-w-[5.5rem] px-5 sm:min-w-[7rem] sm:px-8 ${
                    i > 0 ? `border-l ${borde}` : ""
                  }`}
                >
                  <p className={`text-2xl font-bold leading-tight tabular-nums ${titulo}`}>{valor}</p>
                  <p className={`text-xs ${suave}`}>{etiqueta}</p>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {puedeAsignar && (
              <button
                type="button"
                onClick={onAsignarDocente}
                className={`inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition ${
                  asignado ? botonGris : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                }`}
              >
                {asignado ? <Repeat size={15} /> : <UserPlus size={15} />}
                {asignado ? "Cambiar docente" : "Asignar docente"}
              </button>
            )}
            <button
              type="button"
              onClick={copiar}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                copiado ? "bg-emerald-500/10 text-emerald-600" : botonGris
              }`}
            >
              {copiado ? <Check size={15} /> : <Copy size={15} />}
              {copiado ? "Copiado" : "Copiar DNI"}
            </button>
          </div>

          {/* Docente asesor */}
          <div className="mt-6 w-full max-w-md">
            {asignado ? (
              <div
                className={`flex items-center gap-3 rounded-xl border p-3 text-left ${borde} ${
                  dm ? "bg-slate-800/50" : "bg-slate-50"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {iniciales(docenteNombre)}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${suave}`}>
                    Docente asesor
                  </p>
                  <p className={`mt-0.5 truncate font-semibold ${titulo}`}>{docenteNombre}</p>
                  {d?.correo && (
                    <a
                      href={`mailto:${d.correo}`}
                      className={`mt-0.5 flex items-center gap-1.5 truncate text-xs transition hover:text-blue-600 ${suave}`}
                    >
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{d.correo}</span>
                    </a>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    dm ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  Asignado
                </span>
              </div>
            ) : (
              <div
                className={`rounded-xl border border-dashed p-4 text-center ${
                  dm ? "border-slate-600" : "border-slate-300"
                }`}
              >
                <p className="text-sm font-semibold text-amber-600">Sin docente asignado</p>
                <p className={`mt-0.5 text-xs leading-relaxed ${suave}`}>
                  Cuando se asigne un docente asesor, aquí verás su información y el avance de las
                  prácticas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pestañas */}
        {tabs.length > 0 ? (
          <nav
            className={`mt-6 flex justify-center gap-1 overflow-x-auto border-t ${borde}`}
            aria-label="Secciones del expediente"
          >
            {tabs.map((t) => {
              const activa = t.id === tabActiva;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onCambiarTab?.(t.id)}
                  aria-current={activa ? "page" : undefined}
                  className={`-mt-px shrink-0 border-t-2 px-6 py-3.5 text-sm font-semibold transition ${
                    activa
                      ? `border-current ${titulo}`
                      : `border-transparent ${suave} ${dm ? "hover:text-white" : "hover:text-slate-900"}`
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="h-6" />
        )}
      </div>
    </header>
  );
}