import { Fragment, Component, useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  FileText,
  ExternalLink,
  Filter,
  ArrowLeft,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { tema, foco, Cabecera, iniciales } from "../Docente/componentes/DocenteComun.jsx";
import ExpedienteAlumno from "../Estudiantes/ExpedienteAlumno.jsx";
import api from "../../../api/axios.js";

const CACHE_MEMORIA = {
  clave: "",
  alumnos: [],
  modulos: [],
};

class ExpedienteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || "Error al cargar ExpedienteAlumno" };
  }

  componentDidCatch(error) {
    console.error("Error al renderizar ExpedienteAlumno:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.errorMsg);
    }
    return this.props.children;
  }
}

const DOCS = [
  "Copia de DNI",
  "Ficha de datos",
  "Carta de presentación",
  "Convenio firmado",
  "Plan de prácticas",
  "Informe final",
];

const OPCIONES = [
  { v: "pendiente", t: "Pendiente", on: "bg-slate-500 text-white" },
  { v: "conforme", t: "Conforme", on: "bg-emerald-600 text-white" },
  { v: "observado", t: "Observado", on: "bg-red-600 text-white" },
];

const FILTROS = ["Todos", "Sin completar", "Con observaciones", "Completos"];

const colorResultado = {
  Completo: "text-emerald-600",
  "En revisión": "text-blue-600",
  "Con observaciones": "text-red-600",
  "Sin revisar": "text-slate-500",
};

const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.alumnos)) return payload.alumnos;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const obtenerTokenActual = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  sessionStorage.getItem("access_token") ||
  sessionStorage.getItem("token") ||
  "";

const obtenerClaveSesion = () => {
  const token = obtenerTokenActual();
  let userId = "";
  try {
    const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const u = parsed?.user || parsed?.usuario || parsed;
      userId = String(u?.id ?? u?.id_usuario ?? u?.correo ?? u?.email ?? "");
    }
  } catch {
    /* ignorar */
  }
  return `${userId}::${token.slice(-16)}`;
};

const obtenerIdModulo = (m) => m?.id_modulo ?? m?.id;
const nombreModuloDe = (m) =>
  m?.nombre ?? m?.nombre_modulo ?? m?.modulo ?? m?.titulo ?? m?.descripcion ?? "";

const claveAlumno = (a, idx = 0) =>
  String(a?.id_estudiante ?? a?.id ?? a?.dni ?? `alu-${idx}`);

const normalizarDocumentoEstado = (val) => {
  const s = String(val || "pendiente").toLowerCase();
  if (s === "conforme" || s === "aprobado" || s === "validado" || s === "ok") {
    return "conforme";
  }
  if (s === "observado" || s === "rechazado" || s === "obs") {
    return "observado";
  }
  return "pendiente";
};

const normalizarAlumno = (item = {}, idx = 0) => {
  const est = item.estudiante || item.alumno || item;
  const nombres = est.nombres || item.nombres || "";
  const apellidos = est.apellidos || item.apellidos || "";
  const nombreCompleto = apellidos
    ? `${apellidos}, ${nombres}`.trim()
    : (nombres || est.nombre || est.name || `Alumno ${idx + 1}`).trim();

  const idAlumno = est.id_estudiante ?? est.id ?? item.id_estudiante ?? item.id ?? null;
  const idModulo = item.id_modulo ?? item.modulo_id ?? est.id_modulo ?? null;
  const nombreModulo =
    item.modulo_nombre ||
    item.nombre_modulo ||
    item.modulo ||
    est.modulo_nombre ||
    "Módulo EFSRT";
  const periodo = item.periodo_academico ? ` (${item.periodo_academico})` : "";

  return {
    ...est,
    ...item,
    id: idAlumno ?? idx + 1,
    id_estudiante: idAlumno,
    id_modulo: idModulo,
    modulo_nombre: nombreModulo,
    periodo_academico: item.periodo_academico || est.periodo_academico || "2026-II",
    nombres,
    apellidos,
    dni: String(est.dni || item.dni || ""),
    nombre: nombreCompleto,
    entidad: `${nombreModulo}${periodo}`,
    programa_estudios:
      est.programa_estudios || item.programa_estudios || "Diseño y Programación Web",
    semestre: est.semestre || item.semestre || "",
    correo: est.correo || est.email || item.correo || "",
    estado_bd: item.estado || est.estado || "En progreso",
  };
};

const leerCachePersistencia = (clave) => {
  if (
    CACHE_MEMORIA.clave === clave &&
    (CACHE_MEMORIA.alumnos.length > 0 || CACHE_MEMORIA.modulos.length > 0)
  ) {
    return { alumnos: CACHE_MEMORIA.alumnos, modulos: CACHE_MEMORIA.modulos };
  }
  try {
    const raw =
      sessionStorage.getItem(`rev_expedientes_cache_${clave}`) ||
      localStorage.getItem(`rev_expedientes_cache_${clave}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.alumnos)) {
      const normalizados = parsed.alumnos.map(normalizarAlumno);
      CACHE_MEMORIA.clave = clave;
      CACHE_MEMORIA.alumnos = normalizados;
      CACHE_MEMORIA.modulos = Array.isArray(parsed.modulos) ? parsed.modulos : [];
      return { alumnos: CACHE_MEMORIA.alumnos, modulos: CACHE_MEMORIA.modulos };
    }
  } catch {
    /* ignorar */
  }
  return null;
};

const guardarCachePersistencia = (clave, alumnos, modulos) => {
  CACHE_MEMORIA.clave = clave;
  CACHE_MEMORIA.alumnos = alumnos;
  CACHE_MEMORIA.modulos = modulos;
  try {
    const payload = JSON.stringify({ alumnos, modulos, ts: Date.now() });
    sessionStorage.setItem(`rev_expedientes_cache_${clave}`, payload);
    localStorage.setItem(`rev_expedientes_cache_${clave}`, payload);
  } catch {
    /* ignorar */
  }
};

const leerRevisionesLocal = (clave) => {
  try {
    const raw =
      sessionStorage.getItem(`rev_docs_${clave}`) ||
      localStorage.getItem(`rev_docs_${clave}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const guardarRevisionesLocal = (clave, revObj) => {
  try {
    const payload = JSON.stringify(revObj);
    sessionStorage.setItem(`rev_docs_${clave}`, payload);
    localStorage.setItem(`rev_docs_${clave}`, payload);
  } catch {
    /* ignorar */
  }
};

export default function RevisionExpedientes({
  darkMode,
  setVista,
  onSeleccionarAlumno,
  onAbrirExpediente,
}) {
  const d = !!darkMode;
  const t = tema(d);

  const claveSesion = useMemo(() => obtenerClaveSesion(), []);
  const cacheInicial = useMemo(() => leerCachePersistencia(claveSesion), [claveSesion]);

  const [alumnos, setAlumnos] = useState(() => cacheInicial?.alumnos ?? []);
  const [modulos, setModulos] = useState(() => cacheInicial?.modulos ?? []);
  const [moduloSeleccionado, setModuloSeleccionado] = useState("todos");
  const [cargando, setCargando] = useState(() => !(cacheInicial?.alumnos?.length > 0));
  const [errorBD, setErrorBD] = useState("");
  const [rev, setRev] = useState(() => leerRevisionesLocal(claveSesion));
  const [expedienteActivo, setExpedienteActivo] = useState(null);

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [abierto, setAbierto] = useState(null);
  const [vistaActual, setVistaActual] = useState("ambas");

  const cargarDatos = useCallback(async ({ forzarSpinner = false } = {}) => {
    const claveActual = obtenerClaveSesion();
    const cached = leerCachePersistencia(claveActual);

    if (cached && !forzarSpinner) {
      setAlumnos(cached.alumnos);
      setModulos(cached.modulos);
      setCargando(false);
    } else if (forzarSpinner || !cached?.alumnos?.length) {
      setCargando(true);
    }

    setErrorBD("");

    try {
      const token = obtenerTokenActual();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [resAlumnos, resModulos] = await Promise.all([
        api.get("/mis-alumnos", { headers }),
        api.get("/modulos-profesionales", { headers }).catch(() => ({ data: [] })),
      ]);

      const listaAlumnos = extraerLista(resAlumnos.data).map(normalizarAlumno);
      const listaModulos = extraerLista(resModulos.data);

      setAlumnos(listaAlumnos);
      setModulos(listaModulos);
      guardarCachePersistencia(claveActual, listaAlumnos, listaModulos);
    } catch (err) {
      console.error("Error al cargar alumnos asignados:", err);
      const respaldo = leerCachePersistencia(claveActual);
      if (respaldo?.alumnos?.length) {
        setAlumnos(respaldo.alumnos);
        setModulos(respaldo.modulos);
      } else {
        setErrorBD("No se pudieron cargar tus alumnos asignados.");
        setAlumnos([]);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    setRev(leerRevisionesLocal(claveSesion));
    const cached = leerCachePersistencia(claveSesion);
    if (cached?.alumnos?.length) {
      setAlumnos(cached.alumnos);
      setModulos(cached.modulos);
      setCargando(false);
      cargarDatos({ forzarSpinner: false });
    } else {
      cargarDatos({ forzarSpinner: true });
    }
  }, [claveSesion, cargarDatos]);

  const valor = (a, idx, doc) => rev[claveAlumno(a, idx)]?.[doc] || "pendiente";

  const poner = (a, idx, doc, v) => {
    const k = claveAlumno(a, idx);
    setRev((p) => {
      const siguiente = {
        ...p,
        [k]: {
          ...p[k],
          [doc]: normalizarDocumentoEstado(v),
        },
      };
      guardarRevisionesLocal(claveSesion, siguiente);
      return siguiente;
    });
  };

  const resumen = (a, idx) => {
    const c = DOCS.filter((x) => valor(a, idx, x) === "conforme").length;
    const o = DOCS.filter((x) => valor(a, idx, x) === "observado").length;

    return {
      c,
      o,
      estado:
        c === DOCS.length
          ? "Completo"
          : o
            ? "Con observaciones"
            : c
              ? "En revisión"
              : "Sin revisar",
    };
  };

  const abrirExpediente = (a, idx, r) => {
    const k = claveAlumno(a, idx);
    const payload = {
      ...a,
      estado_expediente: r?.estado || "Sin revisar",
      documentos_conformes: r?.c ?? 0,
      documentos_observados: r?.o ?? 0,
      documentos: rev[k] || {},
    };

    try {
      localStorage.setItem(
        "expediente_alumno_seleccionado",
        JSON.stringify(payload)
      );
    } catch {
      // Ignorar error de localStorage
    }

    onSeleccionarAlumno?.(payload);
    onAbrirExpediente?.(payload);
    setVista?.("ExpedienteAlumno");
    setExpedienteActivo(payload);
  };

  const filas = useMemo(
    () =>
      alumnos.map((a, idx) => ({
        a,
        idx,
        k: claveAlumno(a, idx),
        r: resumen(a, idx),
      })),
    [alumnos, rev]
  );

  const pendientes = filas.filter((f) => f.r.estado !== "Completo").length;
  const completosCount = filas.filter((f) => f.r.estado === "Completo").length;
  const observadosCount = filas.filter((f) => f.r.o > 0).length;

  const visibles = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return filas.filter(({ a, r }) => {
      const okEstado =
        filtro === "Todos" ||
        (filtro === "Completos"
          ? r.estado === "Completo"
          : filtro === "Con observaciones"
            ? r.o > 0
            : r.estado !== "Completo");

      const idModAlumno = a.id_modulo ?? a.modulo_id;
      const okModulo =
        moduloSeleccionado === "todos" ||
        !idModAlumno ||
        String(idModAlumno) === String(moduloSeleccionado);

      const okTexto =
        !texto ||
        `${a.nombre} ${a.dni} ${a.entidad} ${a.programa_estudios} ${a.correo}`
          .toLowerCase()
          .includes(texto);

      return okEstado && okModulo && okTexto;
    });
  }, [filas, filtro, moduloSeleccionado, q]);

  if (expedienteActivo) {
    return (
      <div className={`space-y-5 text-sm ${t.texto}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold">
              Expediente de {expedienteActivo.nombre}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setExpedienteActivo(null)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${t.boton}`}
          >
            <ArrowLeft size={14} />
            Volver a revisión
          </button>
        </div>

        <ExpedienteErrorBoundary
          fallback={(errMsg) => (
            <div className={`${t.tarjeta} space-y-4 p-6`}>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                No se pudo cargar el componente externo <code>ExpedienteAlumno.jsx</code> ({errMsg}). Mostrando ficha directa del alumno:
              </div>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className={`rounded-xl border p-3 ${t.borde}`}>
                  <span className={t.suave}>Alumno:</span>{" "}
                  <strong>{expedienteActivo.nombre}</strong>
                </div>
                <div className={`rounded-xl border p-3 ${t.borde}`}>
                  <span className={t.suave}>DNI:</span>{" "}
                  <strong>{expedienteActivo.dni || "S/N"}</strong>
                </div>
                <div className={`rounded-xl border p-3 ${t.borde}`}>
                  <span className={t.suave}>Módulo EFSRT:</span>{" "}
                  <strong>{expedienteActivo.entidad || "—"}</strong>
                </div>
                <div className={`rounded-xl border p-3 ${t.borde}`}>
                  <span className={t.suave}>Programa:</span>{" "}
                  <strong>{expedienteActivo.programa_estudios}</strong>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {DOCS.map((doc) => {
                  const estDoc = expedienteActivo.documentos?.[doc] || "pendiente";
                  return (
                    <div
                      key={doc}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${t.borde}`}
                    >
                      <span>{doc}</span>
                      <span className="inline-flex items-center gap-1 font-semibold capitalize">
                        {estDoc === "conforme" ? (
                          <CheckCircle2 size={13} className="text-emerald-600" />
                        ) : estDoc === "observado" ? (
                          <AlertCircle size={13} className="text-red-600" />
                        ) : (
                          <Clock size={13} className="text-slate-400" />
                        )}
                        {estDoc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        >
          <ExpedienteAlumno
            estudiante={expedienteActivo}
            darkMode={darkMode}
            onVolver={() => setExpedienteActivo(null)}
          />
        </ExpedienteErrorBoundary>
      </div>
    );
  }

  const mostrarTarjetas = vistaActual === "ambas" || vistaActual === "tarjetas";
  const mostrarTabla = vistaActual === "ambas" || vistaActual === "tabla";

  return (
    <div className={`space-y-5 text-sm ${t.texto}`}>
      <Cabecera
        t={t}
        titulo="Revisión de Expedientes"
        subtitulo="Alumnos asignados al docente y verificación de documentación EFSRT."
        pill={`Por completar: ${pendientes}`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`${t.tarjeta} p-4`}>
          <p className={`text-xs ${t.suave}`}>Alumnos asignados</p>
          <p className="mt-1 text-2xl font-bold">{filas.length}</p>
        </div>
        <div className={`${t.tarjeta} p-4`}>
          <p className={`text-xs ${t.suave}`}>Expedientes completos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{completosCount}</p>
        </div>
        <div className={`${t.tarjeta} p-4`}>
          <p className={`text-xs ${t.suave}`}>Con observaciones</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{observadosCount}</p>
        </div>
      </div>

      {mostrarTarjetas && visibles.length > 0 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map(({ a, idx, k, r }) => (
            <div
              key={`card-${k}`}
              onClick={() => abrirExpediente(a, idx, r)}
              className={`${t.tarjeta} group cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      d ? "bg-slate-700 text-slate-200" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {iniciales(a.nombre)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold group-hover:text-blue-600 transition-colors">
                      {a.nombre}
                    </p>
                    <p className={`text-xs ${t.suave}`}>
                      {a.dni ? `DNI ${a.dni}` : `ID #${a.id_estudiante ?? a.id}`}
                    </p>
                  </div>
                </div>

                <span className={`shrink-0 text-xs font-semibold ${colorResultado[r.estado]}`}>
                  {r.estado}
                </span>
              </div>

              <p className={`mt-3 truncate text-xs ${t.suave}`}>
                <BookOpen size={12} className="mr-1 inline" />
                Módulo EFSRT: <strong className="font-medium">{a.entidad || "—"}</strong>
              </p>

              <div className="mt-3">
                <div className={`h-1.5 rounded-full ${d ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div
                    className="h-1.5 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(r.c / DOCS.length) * 100}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className={t.suave}>
                    {r.c} de {DOCS.length} conformes
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirExpediente(a, idx, r);
                    }}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 font-semibold text-blue-600 hover:underline"
                  >
                    <FileText size={13} />
                    Abrir expediente
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className={`${t.tarjeta} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search
              size={15}
              className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${t.suave}`}
            />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por DNI, nombres o apellidos…"
              className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/15 ${t.entrada}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className={t.suave} />
              <select
                value={moduloSeleccionado}
                onChange={(e) => setModuloSeleccionado(e.target.value)}
                aria-label="Filtrar por módulo profesional"
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium outline-none ${t.entrada}`}
              >
                <option value="todos">Todos los módulos</option>
                {modulos.map((mod) => {
                  const idMod = obtenerIdModulo(mod);
                  return (
                    <option key={String(idMod)} value={String(idMod)}>
                      {nombreModuloDe(mod) || `Módulo #${idMod}`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTROS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  aria-pressed={filtro === f}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${foco} ${
                    filtro === f ? t.chipOn : t.boton
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 border-l pl-2 border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setVistaActual("ambas")}
                title="Tarjetas y tabla"
                className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  vistaActual === "ambas" ? t.chipOn : t.boton
                }`}
              >
                Ambas
              </button>
              <button
                type="button"
                onClick={() => setVistaActual("tarjetas")}
                title="Solo tarjetas"
                className={`cursor-pointer rounded-lg border p-1.5 ${
                  vistaActual === "tarjetas" ? t.chipOn : t.boton
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setVistaActual("tabla")}
                title="Solo tabla"
                className={`cursor-pointer rounded-lg border p-1.5 ${
                  vistaActual === "tabla" ? t.chipOn : t.boton
                }`}
              >
                <TableIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {mostrarTabla && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr
                  className={`border-b text-left text-[11px] font-bold uppercase tracking-wider ${t.borde} ${t.th}`}
                >
                  <th className="w-8 py-3" />
                  <th className="py-3">Alumno</th>
                  <th className="py-3">Módulo EFSRT</th>
                  <th className="py-3">Documentos</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3 text-right">Expediente</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map(({ a, idx, k, r }) => (
                  <Fragment key={k}>
                    <tr
                      onClick={() => abrirExpediente(a, idx, r)}
                      className={`cursor-pointer border-b transition-colors ${t.fila}`}
                    >
                      <td
                        className="py-3.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAbierto(abierto === k ? null : k);
                        }}
                      >
                        <ChevronRight
                          size={15}
                          className={`transition-transform duration-200 ${t.suave} ${
                            abierto === k ? "rotate-90" : ""
                          }`}
                        />
                      </td>

                      <td className="py-3.5">
                        <span className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold ${
                              d
                                ? "bg-slate-700 text-slate-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {iniciales(a.nombre)}
                          </span>

                          <span className="leading-tight">
                            <span className="block font-semibold">{a.nombre}</span>
                            <span className={`text-xs ${t.suave}`}>
                              {a.dni ? `DNI ${a.dni}` : `ID #${a.id_estudiante ?? a.id}`}
                            </span>
                          </span>
                        </span>
                      </td>

                      <td className={`py-3.5 ${t.suave}`}>{a.entidad || "—"}</td>

                      <td className="w-48 py-3.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            d ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          <div
                            className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
                            style={{
                              width: `${(r.c / DOCS.length) * 100}%`,
                            }}
                          />
                        </div>

                        <span className={`mt-1 block text-xs ${t.suave}`}>
                          {r.c} de {DOCS.length} conformes
                        </span>
                      </td>

                      <td
                        className={`py-3.5 text-xs font-semibold ${colorResultado[r.estado]}`}
                      >
                        {r.estado}
                      </td>

                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirExpediente(a, idx, r);
                          }}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold text-blue-600 ${t.boton}`}
                        >
                          Abrir expediente
                        </button>
                      </td>
                    </tr>

                    {abierto === k && (
                      <tr
                        className={`border-b ${t.borde} ${
                          d ? "bg-slate-800/30" : "bg-slate-50/70"
                        }`}
                      >
                        <td colSpan={6} className="px-6 py-4">
                          <ul className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
                            {DOCS.map((doc) => (
                              <li
                                key={doc}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="text-[13px]">{doc}</span>

                                <span
                                  className={`flex overflow-hidden rounded-lg border text-[11px] font-medium ${t.borde}`}
                                >
                                  {OPCIONES.map((o) => (
                                    <button
                                      key={o.v}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        poner(a, idx, doc, o.v);
                                      }}
                                      aria-pressed={valor(a, idx, doc) === o.v}
                                      className={`cursor-pointer px-2.5 py-1 transition-colors ${
                                        valor(a, idx, doc) === o.v
                                          ? o.on
                                          : `${t.suave} hover:bg-black/5`
                                      }`}
                                    >
                                      {o.t}
                                    </button>
                                  ))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cargando && (
          <p className={`py-10 text-center text-sm ${t.suave}`}>
            Cargando alumnos asignados...
          </p>
        )}

        {!cargando && errorBD && (
          <p className="py-10 text-center text-sm text-rose-500">{errorBD}</p>
        )}

        {!cargando && !errorBD && visibles.length === 0 && (
          <p className={`py-10 text-center text-sm ${t.suave}`}>
            {alumnos.length
              ? "Ningún expediente coincide con el filtro."
              : "No se encontraron alumnos asignados para este filtro."}
          </p>
        )}
      </section>
    </div>
  );
}