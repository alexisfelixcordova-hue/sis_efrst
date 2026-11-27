import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  RefreshCw,
  Users,
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
import {
  resumirAsignaciones,
  resumirProyectos,
} from "../Docente/dashboardData.js";
import { useModuloSistema } from "../../../utils/moduloSistema.js";

const tarjeta = (oscuro) =>
  `rounded-2xl border p-4 shadow-sm sm:p-5 ${
    oscuro ? "border-slate-700/80 bg-[#172337]" : "border-slate-200 bg-white"
  }`;

const suave = (oscuro) => (oscuro ? "text-slate-400" : "text-slate-500");

const formatoCSV = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;

export default function ReportesDocente({ usuario, darkMode }) {
  const oscuro = !!darkMode;
  const moduloSistema = useModuloSistema();
  const cacheAlumnos = getCachedData("/mis-alumnos");
  const cacheProyectos = getCachedData("/proyectos");
  const [resumen, setResumen] = useState(() =>
    cacheAlumnos === null ? null : resumirAsignaciones(cacheAlumnos)
  );
  const [proyectos, setProyectos] = useState(() =>
    cacheProyectos === null ? null : resumirProyectos(cacheProyectos)
  );
  const [cargando, setCargando] = useState(cacheAlumnos === null && cacheProyectos === null);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    Promise.allSettled([api.get("/mis-alumnos"), api.get("/proyectos")]).then((resultados) => {
      if (!vigente) return;
      const errores = [];

      if (resultados[0].status === "fulfilled") {
        setResumen(resumirAsignaciones(resultados[0].value.data));
      } else {
        errores.push("No se pudieron cargar las asignaciones de tu cuenta.");
        console.error("Error al cargar reportes docentes:", resultados[0].reason);
      }

      if (resultados[1].status === "fulfilled") {
        setProyectos(resumirProyectos(resultados[1].value.data));
      } else {
        errores.push("No se pudieron cargar tus proyectos.");
        console.error("Error al cargar proyectos para reportes docentes:", resultados[1].reason);
      }

      setError(errores.join(" "));
      setCargando(false);
    });

    return () => {
      vigente = false;
    };
  }, []);

  const moduloSistemaId = moduloSistema?.id_modulo;
  const resumenVisible = useMemo(() => {
    if (!resumen || !moduloSistemaId) return resumen;
    return resumirAsignaciones(
      resumen.filas.filter(
        (fila) => String(fila.id_modulo) === String(moduloSistemaId)
      )
    );
  }, [resumen, moduloSistemaId]);
  const filas = resumenVisible?.filas || [];
  const modulos = resumenVisible?.modulos || [];
  const estados = useMemo(
    () => [
      { nombre: "Conforme", total: resumenVisible?.completos || 0, color: "#10b981" },
      { nombre: "Observado", total: resumenVisible?.observados || 0, color: "#f43f5e" },
      { nombre: "Pendiente", total: resumenVisible?.pendientes || 0, color: "#f59e0b" },
    ],
    [resumenVisible]
  );
  const conteoProyectos = proyectos?.total || 0;
  const promedioNota = resumenVisible?.promedioNota;

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
          setResumen(resumirAsignaciones(alumnosRes.value.data));
        } else {
          errores.push("alumnos");
          console.error("Error al actualizar reportes de alumnos:", alumnosRes.reason);
        }
        if (proyectosRes.status === "fulfilled") {
          setProyectos(resumirProyectos(proyectosRes.value.data));
        } else {
          errores.push("proyectos");
          console.error("Error al actualizar reportes de proyectos:", proyectosRes.reason);
        }
        if (errores.length) {
          setError(`No se pudieron actualizar ${errores.join(" ni ")}. Conservamos los datos disponibles.`);
        }
      })
      .finally(() => setActualizando(false));
  };

  const exportarCSV = () => {
    const contenido = [
      ["Alumno", "DNI", "Módulo", "Empresa", "Estado", "Nota"],
      ...filas.map((fila) => [
        fila.nombre,
        fila.dni,
        fila.modulo_nombre,
        fila.empresa_nombre || "Sin empresa registrada",
        fila.estado_resumen || "Pendiente",
        fila.nota_resumen ?? "",
      ]),
    ]
      .map((fila) => fila.map(formatoCSV).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", contenido], { type: "text/csv;charset=utf-8;" })
    );
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "reporte-seguimiento-docente.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const fondoGrafico = oscuro ? "#172337" : "#ffffff";
  const bordeGrafico = oscuro ? "#334155" : "#e2e8f0";
  const textoGrafico = oscuro ? "#cbd5e1" : "#475569";

  return (
    <div className={`min-h-full space-y-5 p-3 sm:p-5 ${oscuro ? "text-slate-100" : "text-slate-800"}`}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${oscuro ? "text-blue-300" : "text-blue-600"}`}>
            Reportes personales
          </p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            Mi seguimiento EFSRT
          </h1>
          <p className={`mt-1 text-sm ${suave(oscuro)}`}>
            Métricas de los alumnos, módulos y proyectos vinculados a {usuario?.nombre || usuario?.name || "tu cuenta"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={actualizar}
            disabled={actualizando}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
              oscuro ? "border-slate-700 bg-slate-800 hover:bg-slate-700" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <RefreshCw size={14} className={actualizando ? "animate-spin" : ""} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={exportarCSV}
            disabled={!filas.length}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            Exportar
          </button>
        </div>
      </header>

      {error && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${
            oscuro ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {cargando && !resumen && !proyectos ? (
        <div className={`${tarjeta(oscuro)} grid min-h-56 place-items-center text-center`}>
          <div>
            <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-blue-500" />
            <p className="text-sm font-semibold">Preparando tus reportes…</p>
            <p className={`mt-1 text-xs ${suave(oscuro)}`}>
              Los datos corresponden a tus alumnos y proyectos.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section aria-label="Indicadores del docente" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Alumnos asignados", resumen?.total || 0, Users, "bg-blue-500/10 text-blue-500"],
              ["Expedientes revisados", resumen?.completos || 0, CheckCircle2, "bg-emerald-500/10 text-emerald-500"],
              ["Pendientes / observados", (resumen?.pendientes || 0) + (resumen?.observados || 0), AlertCircle, "bg-amber-500/10 text-amber-500"],
              ["Proyectos propios", conteoProyectos, ClipboardList, "bg-violet-500/10 text-violet-500"],
            ].map(([etiqueta, valor, Icono, tono]) => (
              <article key={etiqueta} className={tarjeta(oscuro)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-xs font-medium ${suave(oscuro)}`}>{etiqueta}</p>
                    <p className="mt-2 text-3xl font-extrabold tabular-nums">{valor}</p>
                  </div>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${tono}`}>
                    <Icono size={19} />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <article className={tarjeta(oscuro)}>
              <h2 className="text-sm font-bold">Alumnos por módulo</h2>
              <p className={`mt-1 text-xs ${suave(oscuro)}`}>
                Estudiantes únicos según tus asignaciones activas.
              </p>
              {modulos.length ? (
                <div className="mt-3 h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modulos} layout="vertical" margin={{ left: 10, right: 12 }}>
                      <CartesianGrid horizontal={false} stroke={bordeGrafico} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: textoGrafico, fontSize: 11 }} />
                      <YAxis dataKey="nombre" type="category" width={125} tick={{ fill: textoGrafico, fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: fondoGrafico,
                          borderColor: bordeGrafico,
                          borderRadius: 12,
                          color: oscuro ? "#e2e8f0" : "#1e293b",
                        }}
                      />
                      <Bar dataKey="total" name="Alumnos" fill="#3b82f6" radius={[0, 7, 7, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`mt-4 grid h-60 place-items-center rounded-xl border border-dashed text-xs ${oscuro ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                  No hay módulos asignados para mostrar.
                </div>
              )}
            </article>

            <article className={tarjeta(oscuro)}>
              <h2 className="text-sm font-bold">Estado de revisión</h2>
              <p className={`mt-1 text-xs ${suave(oscuro)}`}>
                Estado de los registros asociados a tus alumnos.
              </p>
              {filas.length ? (
                <>
                  <div className="mt-2 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={estados} dataKey="total" nameKey="nombre" innerRadius={48} outerRadius={76} paddingAngle={3}>
                          {estados.map((estado) => <Cell key={estado.nombre} fill={estado.color} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: fondoGrafico,
                            borderColor: bordeGrafico,
                            borderRadius: 12,
                            color: oscuro ? "#e2e8f0" : "#1e293b",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    {estados.map((estado) => (
                      <div key={estado.nombre}>
                        <p className="text-xl font-extrabold tabular-nums">{estado.total}</p>
                        <p className={`text-[10px] ${suave(oscuro)}`}>{estado.nombre}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`mt-4 text-xs ${suave(oscuro)}`}>
                    {promedioNota === null
                      ? "Aún no hay calificaciones registradas."
                      : `Promedio de notas registradas: ${promedioNota} / 20`}
                  </p>
                </>
              ) : (
                <div className={`mt-4 grid h-60 place-items-center rounded-xl border border-dashed text-xs ${oscuro ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                  Aún no hay expedientes asociados a tu cuenta.
                </div>
              )}
            </article>
          </section>

          <article className={tarjeta(oscuro)}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">Detalle de tus asignaciones</h2>
                <p className={`mt-1 text-xs ${suave(oscuro)}`}>
                  Cada fila corresponde a un módulo asignado de un alumno.
                </p>
              </div>
              <span className={`text-xs ${suave(oscuro)}`}>{filas.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className={oscuro ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-500"}>
                  <tr>
                    {["Alumno", "Módulo", "Empresa", "Estado", "Nota"].map((titulo) => (
                      <th key={titulo} className="px-3 py-2.5 font-semibold">{titulo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.length ? filas.map((fila, indice) => (
                    <tr key={`${fila._clave_alumno}-${fila.id_modulo ?? indice}`} className={oscuro ? "border-t border-slate-700" : "border-t border-slate-100"}>
                      <td className="px-3 py-3 font-semibold">{fila.nombre}</td>
                      <td className={`px-3 py-3 ${suave(oscuro)}`}>{fila.modulo_nombre}</td>
                      <td className={`px-3 py-3 ${suave(oscuro)}`}>{fila.empresa_nombre || "Sin empresa registrada"}</td>
                      <td className="px-3 py-3">{fila.estado_resumen || "Pendiente"}</td>
                      <td className="px-3 py-3 tabular-nums">{fila.nota_resumen ?? "—"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className={`px-3 py-10 text-center ${suave(oscuro)}`}>
                        No hay asignaciones para reportar en esta cuenta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <p className={`text-center text-[10px] ${suave(oscuro)}`}>
            Reporte limitado a tus alumnos asignados y proyectos propios; no incluye estadísticas institucionales.
          </p>
        </>
      )}
    </div>
  );
}
