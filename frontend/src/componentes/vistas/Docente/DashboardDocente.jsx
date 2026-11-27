import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api, {
  getCachedData,
  invalidateApiCache,
} from "../../../api/axios.js";
import { resumirAsignaciones, resumirProyectos } from "./dashboardData.js";
import {
  claveCanonicaModulo,
  useModuloSistema,
} from "../../../utils/moduloSistema.js";

const tarjeta = (oscuro) =>
  `rounded-2xl border p-4 shadow-sm sm:p-5 ${
    oscuro ? "border-slate-700/80 bg-[#172337]" : "border-slate-200 bg-white"
  }`;

const textoSuave = (oscuro) => (oscuro ? "text-slate-400" : "text-slate-500");

const formatearNombre = (usuario) =>
  [usuario?.nombres, usuario?.apellidos].filter(Boolean).join(" ") ||
  usuario?.nombre ||
  usuario?.name ||
  usuario?.usuario?.name ||
  "Docente";

function Indicador({ icono: Icono, etiqueta, valor, detalle, tono, oscuro }) {
  return (
    <article className={tarjeta(oscuro)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-medium ${textoSuave(oscuro)}`}>{etiqueta}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">{valor}</p>
          <p className={`mt-1 text-xs ${textoSuave(oscuro)}`}>{detalle}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tono}`}>
          <Icono size={20} />
        </span>
      </div>
    </article>
  );
}

function AccesoRapido({ titulo, detalle, icono: Icono, onClick, oscuro }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
        oscuro
          ? "border-slate-700 bg-slate-800/60 hover:border-blue-500/60"
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
        <Icono size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{titulo}</span>
        <span className={`mt-0.5 block text-xs ${textoSuave(oscuro)}`}>{detalle}</span>
      </span>
      <ArrowRight
        size={16}
        className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
      />
    </button>
  );
}

export default function DashboardDocente({
  usuario,
  darkMode,
  setVista,
  onVerEstudiante,
}) {
  const oscuro = !!darkMode;
  const moduloSistema = useModuloSistema();
  const cachedAlumnos = getCachedData("/mis-alumnos");
  const cachedProyectos = getCachedData("/proyectos");
  const [asignaciones, setAsignaciones] = useState(() =>
    cachedAlumnos === null ? null : resumirAsignaciones(cachedAlumnos)
  );
  const [proyectos, setProyectos] = useState(() =>
    cachedProyectos === null ? null : resumirProyectos(cachedProyectos)
  );
  const [cargando, setCargando] = useState(
    cachedAlumnos === null && cachedProyectos === null
  );
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      const [respuestaAlumnos, respuestaProyectos] = await Promise.allSettled([
        api.get("/mis-alumnos"),
        api.get("/proyectos"),
      ]);
      if (!vigente) return;

      const errores = [];
      if (respuestaAlumnos.status === "fulfilled") {
        setAsignaciones(resumirAsignaciones(respuestaAlumnos.value.data));
      } else {
        errores.push("No se pudieron cargar tus alumnos asignados.");
        console.error("Error al cargar alumnos del dashboard docente:", respuestaAlumnos.reason);
      }
      if (respuestaProyectos.status === "fulfilled") {
        setProyectos(resumirProyectos(respuestaProyectos.value.data));
      } else {
        errores.push("No se pudieron cargar tus proyectos.");
        console.error("Error al cargar proyectos del dashboard docente:", respuestaProyectos.reason);
      }
      setError(errores.join(" "));
      setCargando(false);
      setActualizando(false);
    };

    cargar();
    return () => {
      vigente = false;
    };
  }, []);

  const resumenBase = useMemo(
    () =>
      asignaciones || {
        filas: [],
        alumnos: [],
        modulos: [],
        empresas: [],
        total: 0,
        completos: 0,
        observados: 0,
        pendientes: 0,
        promedioNota: null,
      },
    [asignaciones]
  );
  const moduloSistemaId = moduloSistema?.id_modulo;
  const moduloSistemaNombre = claveCanonicaModulo(moduloSistema?.nombre_modulo || "");
  const resumen = useMemo(() => {
    if (!moduloSistemaId) return resumenBase;
    return resumirAsignaciones(
      resumenBase.filas.filter(
        (fila) =>
          String(fila.id_modulo) === String(moduloSistemaId) ||
          (moduloSistemaNombre &&
            claveCanonicaModulo(fila.modulo_nombre || fila.nombre_modulo) ===
              moduloSistemaNombre)
      )
    );
  }, [resumenBase, moduloSistemaId, moduloSistemaNombre]);
  const resumenProyectos = proyectos || {
    filas: [],
    total: 0,
    avancePromedio: 0,
    estados: [],
    porVencer: 0,
  };

  const datosEstado = useMemo(
    () => [
      { nombre: "Conforme", total: resumen.completos, color: "#10b981" },
      { nombre: "Observado", total: resumen.observados, color: "#f43f5e" },
      { nombre: "Pendiente", total: resumen.pendientes, color: "#f59e0b" },
    ],
    [resumen.completos, resumen.observados, resumen.pendientes]
  );

  const actualizar = () => {
    setActualizando(true);
    setError("");
    invalidateApiCache("/mis-alumnos");
    invalidateApiCache("/proyectos");
    Promise.allSettled([
      api.get("/mis-alumnos"),
      api.get("/proyectos"),
    ])
      .then(([alumnosRes, proyectosRes]) => {
        const errores = [];
        if (alumnosRes.status === "fulfilled") {
          setAsignaciones(resumirAsignaciones(alumnosRes.value.data));
        } else {
          errores.push("alumnos");
          console.error("Error al actualizar los alumnos del dashboard docente:", alumnosRes.reason);
        }
        if (proyectosRes.status === "fulfilled") {
          setProyectos(resumirProyectos(proyectosRes.value.data));
        } else {
          errores.push("proyectos");
          console.error("Error al actualizar proyectos del dashboard docente:", proyectosRes.reason);
        }
        if (errores.length) {
          setError(`No se pudieron actualizar ${errores.join(" ni ")}. Conservamos los datos disponibles.`);
        }
      })
      .finally(() => setActualizando(false));
  };

  return (
    <div className={`min-h-full space-y-5 p-3 sm:p-5 ${oscuro ? "text-slate-100" : "text-slate-800"}`}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            Hola, {formatearNombre(usuario)}
          </h1>
          <p className={`mt-1 text-sm ${textoSuave(oscuro)}`}>
            Seguimiento de tus alumnos, expedientes y proyectos asignados.
          </p>
        </div>
        <button
          type="button"
          onClick={actualizar}
          disabled={actualizando}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
            oscuro
              ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <RefreshCw size={15} className={actualizando ? "animate-spin" : ""} />
          Actualizar datos
        </button>
      </header>

      {error && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${
            oscuro
              ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {cargando && !asignaciones && !proyectos ? (
        <div className={`${tarjeta(oscuro)} grid min-h-56 place-items-center text-center`}>
          <div>
            <RefreshCw className="mx-auto mb-3 animate-spin text-blue-500" size={24} />
            <p className="text-sm font-semibold">Cargando tu información docente…</p>
            <p className={`mt-1 text-xs ${textoSuave(oscuro)}`}>
              Consultando únicamente tus asignaciones y proyectos.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section aria-label="Resumen docente" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador
              icono={GraduationCap}
              etiqueta="Mis alumnos"
              valor={resumen.total}
              detalle="Estudiantes asignados a tu cuenta"
              tono="bg-blue-500/10 text-blue-500"
              oscuro={oscuro}
            />
            <Indicador
              icono={FileCheck2}
              etiqueta="Por revisar"
              valor={resumen.pendientes + resumen.observados}
              detalle={`${resumen.observados} con observaciones`}
              tono="bg-amber-500/10 text-amber-500"
              oscuro={oscuro}
            />
            <Indicador
              icono={Building2}
              etiqueta="Empresas vinculadas"
              valor={resumen.empresas.length}
              detalle="Entidades de tus alumnos"
              tono="bg-violet-500/10 text-violet-500"
              oscuro={oscuro}
            />
            <Indicador
              icono={FolderKanban}
              etiqueta="Mis proyectos"
              valor={resumenProyectos.total}
              detalle={`${resumenProyectos.porVencer} próximos a vencer`}
              tono="bg-emerald-500/10 text-emerald-500"
              oscuro={oscuro}
            />
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <article className={tarjeta(oscuro)}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">Alumnos por módulo</h2>
                  <p className={`mt-1 text-xs ${textoSuave(oscuro)}`}>
                    Conteos basados en las asignaciones de tu cuenta.
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${oscuro ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                  {resumen.filas.length} asignaciones
                </span>
              </div>
              {resumen.modulos.length ? (
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumen.modulos} layout="vertical" margin={{ left: 10, right: 12 }}>
                      <CartesianGrid horizontal={false} stroke={oscuro ? "#334155" : "#e2e8f0"} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: oscuro ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                      <YAxis dataKey="nombre" type="category" width={115} tick={{ fill: oscuro ? "#cbd5e1" : "#475569", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: oscuro ? "#172337" : "#fff",
                          borderColor: oscuro ? "#334155" : "#e2e8f0",
                          borderRadius: 12,
                          color: oscuro ? "#e2e8f0" : "#1e293b",
                        }}
                      />
                      <Bar dataKey="total" name="Alumnos" fill="#3b82f6" radius={[0, 7, 7, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`grid h-52 place-items-center rounded-xl border border-dashed text-center text-xs ${oscuro ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                  Aún no hay módulos vinculados a tus alumnos.
                </div>
              )}
            </article>

            <article className={tarjeta(oscuro)}>
              <h2 className="text-sm font-bold">Estado de expedientes</h2>
              <p className={`mt-1 text-xs ${textoSuave(oscuro)}`}>
                Situación registrada en tus expedientes asignados.
              </p>
              {resumen.filas.length ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosEstado}
                          dataKey="total"
                          nameKey="nombre"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={3}
                        >
                          {datosEstado.map((item) => (
                            <Cell key={item.nombre} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: oscuro ? "#172337" : "#fff",
                            borderColor: oscuro ? "#334155" : "#e2e8f0",
                            borderRadius: 12,
                            color: oscuro ? "#e2e8f0" : "#1e293b",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {datosEstado.map((item) => (
                      <div key={item.nombre} className="text-center">
                        <p className="text-lg font-extrabold tabular-nums">{item.total}</p>
                        <p className={`text-[10px] ${textoSuave(oscuro)}`}>{item.nombre}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={`mt-4 grid h-48 place-items-center rounded-xl border border-dashed text-center text-xs ${oscuro ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                  No hay expedientes para resumir todavía.
                </div>
              )}
            </article>
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <article className={tarjeta(oscuro)}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">Alumnos asignados recientemente</h2>
                  <p className={`mt-1 text-xs ${textoSuave(oscuro)}`}>
                    Abre su expediente para continuar el seguimiento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVista("Mis Alumnos")}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400"
                >
                  Ver todos <ArrowRight size={14} />
                </button>
              </div>
              {resumen.alumnos.length ? (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                  {resumen.alumnos.slice(0, 6).map((alumno) => (
                    <li key={alumno._clave_alumno}>
                      <button
                        type="button"
                        onClick={() => onVerEstudiante(alumno)}
                        className={`flex w-full cursor-pointer items-center gap-3 py-3 text-left ${
                          oscuro ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-500">
                          {alumno.nombre
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((parte) => parte[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold">{alumno.nombre}</span>
                          <span className={`mt-0.5 block truncate text-[10px] ${textoSuave(oscuro)}`}>
                            {alumno.dni ? `DNI ${alumno.dni} · ` : ""}
                            {alumno.modulos.join(", ")}
                          </span>
                        </span>
                        <ArrowRight size={15} className="shrink-0 text-slate-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`grid min-h-36 place-items-center text-center text-xs ${textoSuave(oscuro)}`}>
                  No hay alumnos asignados a esta cuenta.
                </div>
              )}
            </article>

            <div className="space-y-4">
              <article className={tarjeta(oscuro)}>
                <div className="mb-4 flex items-center gap-2">
                  <BookOpenCheck size={18} className="text-blue-500" />
                  <div>
                    <h2 className="text-sm font-bold">Accesos rápidos</h2>
                    <p className={`text-[10px] ${textoSuave(oscuro)}`}>Continúa con tus tareas docentes.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <AccesoRapido
                    titulo="Revisar expedientes"
                    detalle={`${resumen.pendientes + resumen.observados} pendientes o con observaciones`}
                    icono={ClipboardList}
                    onClick={() => setVista("Revisión de Expedientes")}
                    oscuro={oscuro}
                  />
                  <AccesoRapido
                    titulo="Empresas asignadas"
                    detalle={`${resumen.empresas.length} entidades de tus alumnos`}
                    icono={Building2}
                    onClick={() => setVista("Empresas Asignadas")}
                    oscuro={oscuro}
                  />
                  <AccesoRapido
                    titulo="Reportes de mi cuenta"
                    detalle="Métricas de tus alumnos y proyectos"
                    icono={CalendarDays}
                    onClick={() => setVista("Reportes")}
                    oscuro={oscuro}
                  />
                </div>
              </article>

              <article className={tarjeta(oscuro)}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">Proyectos propios</h2>
                    <p className={`mt-1 text-xs ${textoSuave(oscuro)}`}>
                      Avance promedio {resumenProyectos.avancePromedio}%
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FolderKanban size={19} />
                  </span>
                </div>
                {resumenProyectos.estados.length ? (
                  <div className="mt-4 space-y-2">
                    {resumenProyectos.estados.map((estado) => (
                      <div key={estado.nombre} className="flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: estado.color }} />
                        <span className={`flex-1 ${textoSuave(oscuro)}`}>{estado.nombre}</span>
                        <span className="font-bold tabular-nums">{estado.total}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`mt-4 text-xs ${textoSuave(oscuro)}`}>
                    No hay proyectos registrados en tu cuenta.
                  </p>
                )}
              </article>
            </div>
          </section>

          <p className={`flex items-center justify-center gap-1.5 pb-2 text-center text-[10px] ${textoSuave(oscuro)}`}>
            <CheckCircle2 size={12} />
            Datos cargados desde tus asignaciones y proyectos personales.
          </p>
        </>
      )}
    </div>
  );
}
