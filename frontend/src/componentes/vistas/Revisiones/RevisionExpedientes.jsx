import { Component, useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, LayoutGrid, Table as TableIcon, FileText, ArrowLeft, ArrowRight, BookOpen, CheckCircle2,
  AlertCircle, Clock, ListChecks, Inbox, X,
} from "lucide-react";
import { tema, Cabecera, iniciales } from "../Docente/componentes/DocenteComun.jsx";
import ExpedienteAlumno from "../Estudiantes/ExpedienteAlumno.jsx";
import api from "../../../api/axios.js";

/* =====================================================================
   REVISIÓN DE EXPEDIENTES — creativa, animada y fácil de entender
   Idea: los alumnos van primero. Plomo del sistema; azul solo en la acción principal.
   Palabras simples y un botón claro para empezar a revisar.
   Los colores siempre van junto con un icono y una palabra.
   ===================================================================== */

const CACHE_MEMORIA = { clave: "", alumnos: [], modulos: [] };

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
    return this.state.hasError ? this.props.fallback(this.state.errorMsg) : this.props.children;
  }
}

const DOCS = [
  "Copia de DNI", "Ficha de datos", "Carta de presentación",
  "Convenio firmado", "Plan de prácticas", "Informe final",
];

// Los 3 botones de cada papel, con palabras de todos los días
const OPCIONES = [
  { v: "pendiente", t: "Falta", Ico: Clock, on: "bg-slate-600 text-white" },
  { v: "conforme", t: "Está bien", Ico: CheckCircle2, on: "bg-emerald-600 text-white" },
  { v: "observado", t: "Corregir", Ico: AlertCircle, on: "bg-red-600 text-white" },
];

const FILTROS = [
  { v: "Todos", t: "Todos" },
  { v: "Sin completar", t: "Falta trabajo" },
  { v: "Con observaciones", t: "Hay que corregir" },
  { v: "Completos", t: "Terminados" },
];

/* ---------------- Datos (misma lógica de siempre) ---------------- */
const extraerLista = (p) => {
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.data?.data)) return p.data.data;
  if (Array.isArray(p?.alumnos)) return p.alumnos;
  if (Array.isArray(p?.items)) return p.items;
  return [];
};

const obtenerTokenActual = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") ||
  sessionStorage.getItem("access_token") || sessionStorage.getItem("token") || "";

const obtenerClaveSesion = () => {
  const token = obtenerTokenActual();
  let userId = "";
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      const u = parsed?.user || parsed?.usuario || parsed;
      userId = String(u?.id ?? u?.id_usuario ?? u?.correo ?? u?.email ?? "");
    }
  } catch { /* ignorar */ }
  return `${userId}::${token.slice(-16)}`;
};

const obtenerIdModulo = (m) => m?.id_modulo ?? m?.id;
const nombreModuloDe = (m) =>
  m?.nombre ?? m?.nombre_modulo ?? m?.modulo ?? m?.titulo ?? m?.descripcion ?? "";
const claveAlumno = (a, idx = 0) => String(a?.id_estudiante ?? a?.id ?? a?.dni ?? `alu-${idx}`);

const normalizarDocumentoEstado = (val) => {
  const s = String(val || "pendiente").toLowerCase();
  if (["conforme", "aprobado", "validado", "ok"].includes(s)) return "conforme";
  if (["observado", "rechazado", "obs"].includes(s)) return "observado";
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
    item.modulo_nombre || item.nombre_modulo || item.modulo || est.modulo_nombre || "Módulo EFSRT";
  const periodo = item.periodo_academico ? ` (${item.periodo_academico})` : "";
  return {
    ...est, ...item,
    id: idAlumno ?? idx + 1,
    id_estudiante: idAlumno,
    id_modulo: idModulo,
    modulo_nombre: nombreModulo,
    periodo_academico: item.periodo_academico || est.periodo_academico || "2026-II",
    nombres, apellidos,
    dni: String(est.dni || item.dni || ""),
    nombre: nombreCompleto,
    entidad: `${nombreModulo}${periodo}`,
    programa_estudios: est.programa_estudios || item.programa_estudios || "Diseño y Programación Web",
    semestre: est.semestre || item.semestre || "",
    correo: est.correo || est.email || item.correo || "",
    estado_bd: item.estado || est.estado || "En progreso",
  };
};

const leerCachePersistencia = (clave) => {
  if (CACHE_MEMORIA.clave === clave && (CACHE_MEMORIA.alumnos.length || CACHE_MEMORIA.modulos.length)) {
    return { alumnos: CACHE_MEMORIA.alumnos, modulos: CACHE_MEMORIA.modulos };
  }
  try {
    const raw =
      sessionStorage.getItem(`rev_expedientes_cache_${clave}`) ||
      localStorage.getItem(`rev_expedientes_cache_${clave}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.alumnos)) {
      CACHE_MEMORIA.clave = clave;
      CACHE_MEMORIA.alumnos = parsed.alumnos.map(normalizarAlumno);
      CACHE_MEMORIA.modulos = Array.isArray(parsed.modulos) ? parsed.modulos : [];
      return { alumnos: CACHE_MEMORIA.alumnos, modulos: CACHE_MEMORIA.modulos };
    }
  } catch { /* ignorar */ }
  return null;
};

const guardarCachePersistencia = (clave, alumnos, modulos) => {
  Object.assign(CACHE_MEMORIA, { clave, alumnos, modulos });
  try {
    const payload = JSON.stringify({ alumnos, modulos, ts: Date.now() });
    sessionStorage.setItem(`rev_expedientes_cache_${clave}`, payload);
    localStorage.setItem(`rev_expedientes_cache_${clave}`, payload);
  } catch { /* ignorar */ }
};

const leerRevisionesLocal = (clave) => {
  try {
    const raw = sessionStorage.getItem(`rev_docs_${clave}`) || localStorage.getItem(`rev_docs_${clave}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const guardarRevisionesLocal = (clave, obj) => {
  try {
    const payload = JSON.stringify(obj);
    sessionStorage.setItem(`rev_docs_${clave}`, payload);
    localStorage.setItem(`rev_docs_${clave}`, payload);
  } catch { /* ignorar */ }
};

/* ---------- Animaciones: suaves y siempre responden a una acción ---------- */
const rxEstilos = `
@keyframes rx-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes rx-pop { from { opacity: .3; transform: scale(.8); } to { opacity: 1; transform: none; } }
@keyframes rx-tick { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes rx-pulse { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,.55); } 100% { box-shadow: 0 0 0 8px rgba(37,99,235,0); } }
@keyframes rx-slide { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes rx-fade { from { opacity: 0; } to { opacity: 1; } }
.rx-in { animation: rx-in .4s cubic-bezier(.22,1,.36,1) both; }
.rx-pop { animation: rx-pop .28s cubic-bezier(.22,1,.36,1) both; }
.rx-tick { display: inline-block; animation: rx-tick .3s ease-out both; }
.rx-pulse { animation: rx-pulse .7s ease-out 1; }
.rx-slide { animation: rx-slide .3s cubic-bezier(.22,1,.36,1) both; }
.rx-fade { animation: rx-fade .2s ease-out both; }
.rx-seg { position: relative; flex: 1; height: .6rem; border-radius: 9999px; transition: background-color .3s ease, height .15s ease; }
.rx-seg:hover { height: .85rem; }
.rx-seg::after {
  content: attr(data-tip); position: absolute; left: 50%; bottom: calc(100% + 8px);
  transform: translate(-50%, 3px); padding: 4px 9px; border-radius: 6px;
  background: #0f172a; color: #fff; font-size: 12px; font-weight: 600; white-space: nowrap;
  pointer-events: none; opacity: 0; transition: opacity .15s ease, transform .15s ease; z-index: 30;
}
.rx-seg:hover::after { opacity: 1; transform: translate(-50%, 0); }
.rx-seg:nth-child(-n+2)::after { left: 0; transform: translate(0, 3px); }
.rx-seg:nth-child(-n+2):hover::after { transform: none; }
.rx-seg:nth-last-child(-n+2)::after { left: auto; right: 0; transform: translate(0, 3px); }
.rx-seg:nth-last-child(-n+2):hover::after { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .rx-in, .rx-pop, .rx-tick, .rx-pulse, .rx-slide, .rx-fade { animation: none !important; }
  .rx-seg, .rx-seg::after { transition: none !important; }
}
`;

const ETIQUETA_DOC = { conforme: "Está bien", observado: "Corregir", pendiente: "Falta" };

// Tablero: el expediente avanza de izquierda a derecha
const COLUMNAS = [
  { e: "Sin revisar", titulo: "Falta empezar", ayuda: "Todavía no revisaste nada" },
  { e: "En revisión", titulo: "Revisando", ayuda: "Ya tienen papeles que están bien" },
  { e: "Con observaciones", titulo: "Hay que corregir", ayuda: "Tienen papeles por corregir" },
  { e: "Completo", titulo: "Terminados", ayuda: "Todo está bien" },
];

// Anillo de foco en plomo (visible con teclado)
const enfoque = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";

/* ---------------- Componente ---------------- */
export default function RevisionExpedientes({ darkMode, setVista, onSeleccionarAlumno, onAbrirExpediente }) {
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
  const [vistaActual, setVistaActual] = useState("tablero");

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
        setErrorBD("No pudimos cargar a tus alumnos.");
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
      const siguiente = { ...p, [k]: { ...p[k], [doc]: normalizarDocumentoEstado(v) } };
      guardarRevisionesLocal(claveSesion, siguiente);
      return siguiente;
    });
  };

  const resumen = (a, idx) => {
    const c = DOCS.filter((x) => valor(a, idx, x) === "conforme").length;
    const o = DOCS.filter((x) => valor(a, idx, x) === "observado").length;
    return {
      c, o,
      estado: c === DOCS.length ? "Completo" : o ? "Con observaciones" : c ? "En revisión" : "Sin revisar",
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
      localStorage.setItem("expediente_alumno_seleccionado", JSON.stringify(payload));
    } catch { /* ignorar */ }
    onSeleccionarAlumno?.(payload);
    onAbrirExpediente?.(payload);
    setVista?.("ExpedienteAlumno");
    setExpedienteActivo(payload);
  };

  const filas = useMemo(
    () => alumnos.map((a, idx) => ({ a, idx, k: claveAlumno(a, idx), r: resumen(a, idx) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alumnos, rev]
  );

  const pasaModulo = (a, idMod) => {
    const idAlu = a.id_modulo ?? a.modulo_id;
    return idMod === "todos" || !idAlu || String(idAlu) === String(idMod);
  };
  const pasaEstado = (r, f) =>
    f === "Todos" ||
    (f === "Completos" ? r.estado === "Completo" : f === "Con observaciones" ? r.o > 0 : r.estado !== "Completo");

  const visibles = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return filas.filter(({ a, r }) => {
      const okTexto =
        !texto ||
        `${a.nombre} ${a.dni} ${a.entidad} ${a.programa_estudios} ${a.correo}`.toLowerCase().includes(texto);
      return pasaEstado(r, filtro) && pasaModulo(a, moduloSeleccionado) && okTexto;
    });
  }, [filas, filtro, moduloSeleccionado, q]);

  // Teclado: Esc cierra, flechas cambian de alumno
  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsar = (e) => {
      if (e.key === "Escape") return setAbierto(null);
      const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!paso) return;
      const i = visibles.findIndex((f) => f.k === abierto);
      const n = visibles[i + paso];
      if (n) setAbierto(n.k);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [abierto, visibles]);

  /* ---------- Vista: expediente completo ---------- */
  if (expedienteActivo) {
    return (
      <div className={`space-y-5 text-base ${t.texto}`}>
        <button
          type="button"
          onClick={() => setExpedienteActivo(null)}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${enfoque} ${t.boton}`}
        >
          <ArrowLeft size={18} /> Volver a la lista de alumnos
        </button>
        <h2 className="text-lg font-bold">Papeles de {expedienteActivo.nombre}</h2>

        <ExpedienteErrorBoundary
          fallback={(errMsg) => (
            <div className={`${t.tarjeta} space-y-3 p-5`}>
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                No se pudo abrir la ficha completa ({errMsg}). Aquí tienes un resumen:
              </p>
              <p><strong>Alumno:</strong> {expedienteActivo.nombre}</p>
              <p><strong>DNI:</strong> {expedienteActivo.dni || "Sin DNI"}</p>
              <p><strong>Curso:</strong> {expedienteActivo.entidad || "—"}</p>
              <ul className="space-y-2">
                {DOCS.map((doc) => {
                  const e = expedienteActivo.documentos?.[doc] || "pendiente";
                  return (
                    <li key={doc} className={`flex justify-between rounded-xl border px-3 py-2 text-sm ${t.borde}`}>
                      <span>{doc}</span>
                      <strong>{e === "conforme" ? "Está bien" : e === "observado" ? "Corregir" : "Falta"}</strong>
                    </li>
                  );
                })}
              </ul>
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

  /* ---------- Solo presentación ---------- */
  const marcarDoc = (a, idx, doc, v) => poner(a, idx, doc, v);

  const pendientes = filas.filter((f) => f.r.estado !== "Completo").length;
  const porCorregir = filas.filter((f) => f.r.o > 0).length;

  // Paleta: plomo del sistema; el azul solo en la acción principal y el color de estado solo para decir cómo está cada expediente.
  const ESTADO = {
    Completo: { txt: "Todo bien", Ico: CheckCircle2, barra: "bg-emerald-500", ico: "text-emerald-500", cls: d ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-800" },
    "En revisión": { txt: "Revisando", Ico: Clock, barra: "bg-amber-500", ico: "text-amber-500", cls: d ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-800" },
    "Con observaciones": { txt: "Hay que corregir", Ico: AlertCircle, barra: "bg-red-500", ico: "text-red-500", cls: d ? "bg-red-500/15 text-red-300" : "bg-red-100 text-red-800" },
    "Sin revisar": { txt: "Falta empezar", Ico: FileText, barra: d ? "bg-zinc-500" : "bg-zinc-400", ico: d ? "text-zinc-400" : "text-zinc-500", cls: d ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700" },
  };
  const principal = "bg-blue-600 text-white hover:bg-blue-700"; // solo para la acción principal

  const cursos = [
    { id: "todos", nombre: "Todos los cursos" },
    ...Array.from(
      filas.reduce((mapa, { a }) => {
        const id = a.id_modulo ?? a.modulo_id;
        if (id === null || id === undefined || id === "") return mapa;
        const key = String(id);
        if (!mapa.has(key)) {
          const m = modulos.find((x) => String(obtenerIdModulo(x)) === key);
          mapa.set(key, { id: key, nombre: nombreModuloDe(m) || a.modulo_nombre || `Curso ${key}` });
        }
        return mapa;
      }, new Map()).values()
    ),
  ].map((c) => {
    const del = filas.filter((f) => pasaModulo(f.a, c.id));
    return { ...c, n: del.length, obs: del.filter((f) => f.r.o > 0).length };
  });
  const cursoActual = cursos.find((c) => c.id === String(moduloSeleccionado)) || cursos[0];
  const conteo = (f) => filas.filter((x) => pasaModulo(x.a, moduloSeleccionado) && pasaEstado(x.r, f)).length;
  const totalCurso = filas.filter((f) => pasaModulo(f.a, moduloSeleccionado)).length;

  const hayFiltros = q.trim() !== "" || filtro !== "Todos" || moduloSeleccionado !== "todos";
  const limpiar = () => { setQ(""); setFiltro("Todos"); setModuloSeleccionado("todos"); };

  const docSiguiente = (a, idx) => {
    const obs = DOCS.find((x) => valor(a, idx, x) === "observado");
    if (obs) return { doc: obs, tipo: "obs" };
    const pen = DOCS.find((x) => valor(a, idx, x) === "pendiente");
    return pen ? { doc: pen, tipo: "pen" } : null;
  };

  const cola = visibles.filter((f) => f.r.estado !== "Completo");
  const empezar = () => {
    const p = cola.find((f) => f.r.o > 0) || cola[0];
    if (p) setAbierto(p.k);
  };

  const etiqueta = (estado) => {
    const e = ESTADO[estado];
    return (
      <span key={estado} className={`rx-pop inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${e.cls}`}>
        <e.Ico size={13} /> {e.txt}
      </span>
    );
  };

  // Etiqueta "sticker": dice qué papel toca ahora
  const pista = (a, idx) => {
    const s = docSiguiente(a, idx);
    if (!s) return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold ${d ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-800"}`}>
        <CheckCircle2 size={14} /> Todos los papeles están bien
      </span>
    );
    const obs = s.tipo === "obs";
    return (
      <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${obs ? (d ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-800") : (d ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700")}`}>
        {obs ? <AlertCircle size={14} className="shrink-0" /> : <Clock size={14} className="shrink-0" />}
        <span className="truncate">{obs ? "Hay que corregir:" : "Lo siguiente:"} <strong>{s.doc}</strong></span>
      </span>
    );
  };

  const bloque = (a, cls = "h-11 w-11 text-sm") => (
    <span className={`grid ${cls} shrink-0 place-items-center rounded-xl font-extrabold ${d ? "bg-zinc-700 text-zinc-100" : "bg-zinc-200 text-zinc-800"}`}>
      {iniciales(a.nombre)}
    </span>
  );

  const botonesAlumno = (a, idx, k, r) => (
    <>
      <button type="button" onClick={(e) => { e.stopPropagation(); setAbierto(k); }}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${enfoque} ${t.chipOn}`}>
        <ListChecks size={15} /> Revisar papeles
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); abrirExpediente(a, idx, r); }}
        className={`group/b inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${enfoque} ${t.boton}`}>
        Ver ficha <ArrowRight size={14} className="transition-transform duration-200 group-hover/b:translate-x-0.5" />
      </button>
    </>
  );

  // Tarjeta de alumno: franja de color = estado; iniciales = quién es
  const tarjetaAlumno = ({ a, idx, k, r }, i) => (
    <div key={`card-${k}`} onClick={() => abrirExpediente(a, idx, r)}
      style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
      className={`${t.tarjeta} rx-in group relative cursor-pointer overflow-hidden p-3.5 pl-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${ESTADO[r.estado].barra}`} />
      <div className="flex items-start gap-3">
        {bloque(a)}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold transition-colors group-hover:text-blue-600">{a.nombre}</p>
          <p className={`truncate text-xs ${t.suave}`}>{a.dni ? `DNI ${a.dni}` : `Código ${a.id_estudiante ?? a.id}`}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {etiqueta(r.estado)}
        {r.o > 0 && <strong className="text-red-500">{r.o} por corregir</strong>}
      </div>
      <div className="mt-2.5 text-xs">{pista(a, idx)}</div>
      <div className={`mt-3 flex flex-wrap gap-2 border-t pt-3 ${t.borde}`}>{botonesAlumno(a, idx, k, r)}</div>
    </div>
  );

  const alumnoPanel = abierto ? filas.find((f) => f.k === abierto) : null;
  const claveResultados = `${moduloSeleccionado}|${filtro}|${vistaActual}`;
  const chipBanda = (on) => (on ? t.chipOn : t.boton);

  return (
    <div className={`space-y-4 text-sm ${t.texto}`}>
      <style>{rxEstilos}</style>

      <Cabecera t={t} titulo="Revisión de Expedientes"
        subtitulo="Mira los papeles de tus alumnos y marca si están bien o si hay que corregirlos."
        pill={`Falta trabajo: ${pendientes}`} />

      {/* ===== SECCIÓN: TUS ALUMNOS (lo primero que se ve) ===== */}
      <section aria-labelledby="rx-titulo" className={`${t.tarjeta} rx-in overflow-hidden p-5`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 id="rx-titulo" className="text-2xl font-extrabold tracking-tight">Tus alumnos</h2>
            <p className={`mt-1 max-w-xl text-sm ${t.suave}`}>
              Toca a un alumno para revisar sus {DOCS.length} papeles. Cada columna es una etapa y el alumno cambia de columna cuando lo revisas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-right leading-tight" aria-live="polite">
              <strong key={visibles.length} className="rx-tick block text-4xl font-extrabold tabular-nums">{visibles.length}</strong>
              <span className={`text-xs ${t.suave}`}>de {totalCurso} alumnos{porCorregir > 0 ? ` · ${porCorregir} por corregir` : ""}</span>
            </p>
            <button type="button" onClick={empezar} disabled={cola.length === 0}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-default disabled:opacity-40 ${enfoque} ${principal}`}>
              <ListChecks size={17} />
              {cola.length ? `Empezar a revisar (${cola.length})` : "Todo está al día"}
            </button>
          </div>
        </div>

        <div className={`mt-5 space-y-3 border-t pt-4 ${t.borde}`}>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Curso">
            <span className={`mr-1 text-xs ${t.suave}`}>Curso</span>
            {cursos.map((m) => {
              const sel = m.id === String(moduloSeleccionado);
              return (
                <button key={m.id} type="button" onClick={() => setModuloSeleccionado(m.id)} aria-pressed={sel}
                  className={`inline-flex max-w-[260px] cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${enfoque} ${chipBanda(sel)}`}>
                  {m.id === "todos" ? <LayoutGrid size={13} /> : <BookOpen size={13} />}
                  <span className="truncate">{m.nombre}</span>
                  <span className={`rounded-full px-1.5 text-[11px] tabular-nums bg-zinc-500/25`}>{m.n}</span>
                  {m.obs > 0 && <span aria-label={`${m.obs} por corregir`} className="h-2 w-2 rounded-full bg-red-500" />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${t.suave}`} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o DNI" aria-label="Buscar alumno"
                className={`w-full rounded-xl border py-2.5 pl-10 pr-9 text-sm outline-none ${t.entrada}`} />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Borrar lo escrito"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 hover:bg-black/5 ${t.suave}`}><X size={14} /></button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
              {FILTROS.map((f) => (
                <button key={f.v} type="button" onClick={() => setFiltro(f.v)} aria-pressed={filtro === f.v}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${enfoque} ${chipBanda(filtro === f.v)}`}>
                  {f.t}
                  <span key={conteo(f.v)} className="rx-tick rounded-full bg-zinc-500/25 px-1.5 text-[11px] tabular-nums">{conteo(f.v)}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1" role="group" aria-label="Tipo de vista">
              {[{ v: "tablero", t: "Tablero", Ico: LayoutGrid }, { v: "lista", t: "Lista", Ico: TableIcon }].map((o) => (
                <button key={o.v} type="button" onClick={() => setVistaActual(o.v)} aria-pressed={vistaActual === o.v}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${enfoque} ${chipBanda(vistaActual === o.v)}`}>
                  <o.Ico size={14} /> {o.t}
                </button>
              ))}
            </div>
          </div>
          {hayFiltros && (
            <button type="button" onClick={limpiar} className={`cursor-pointer text-xs font-bold underline ${t.suave}`}>
              Borrar filtros y ver a todos
            </button>
          )}
        </div>
      </section>

      {cargando && (
        <section aria-busy="true" className="space-y-3">
          <p role="status" className={`flex items-center gap-2 text-sm ${t.suave}`}><Clock size={16} /> Cargando a tus alumnos…</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${t.tarjeta} animate-pulse space-y-3 p-4`}>
                <span className={`block h-11 w-11 rounded-xl ${d ? "bg-zinc-800" : "bg-zinc-200"}`} />
                <span className={`block h-3 w-2/3 rounded ${d ? "bg-zinc-800" : "bg-zinc-200"}`} />
                <span className={`block h-3 w-1/2 rounded ${d ? "bg-zinc-800" : "bg-zinc-200"}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!cargando && errorBD && (
        <section className={`${t.tarjeta} rx-in flex flex-col items-center gap-2 px-6 py-10 text-center`}>
          <AlertCircle size={28} className="text-red-500" />
          <p className="font-bold text-red-500">{errorBD}</p>
          <p className={`text-xs ${t.suave}`}>Revisa tu internet y vuelve a intentar.</p>
          <button type="button" onClick={() => cargarDatos({ forzarSpinner: true })}
            className={`mt-1 cursor-pointer rounded-lg px-4 py-2 text-xs font-bold ${enfoque} ${principal}`}>Intentar otra vez</button>
        </section>
      )}

      {!cargando && !errorBD && visibles.length === 0 && (
        <section className={`${t.tarjeta} rx-in flex flex-col items-center gap-2 px-6 py-12 text-center`}>
          <span className={`grid h-12 w-12 place-items-center rounded-full ${d ? "bg-zinc-800" : "bg-zinc-200"} ${t.suave}`}>
            {hayFiltros ? <Search size={22} /> : <Inbox size={22} />}
          </span>
          <p className="font-bold">{alumnos.length ? "No encontramos alumnos con eso" : "Todavía no tienes alumnos"}</p>
          <p className={`text-xs ${t.suave}`}>{alumnos.length ? "Prueba con otro nombre o borra los filtros." : "Cuando te los asignen, aparecerán aquí."}</p>
          {hayFiltros && <button type="button" onClick={limpiar} className={`mt-2 cursor-pointer rounded-lg px-4 py-2 text-xs font-bold ${enfoque} ${principal}`}>Borrar filtros</button>}
        </section>
      )}

      {!cargando && visibles.length > 0 && (
        <div key={claveResultados}>
          {vistaActual === "tablero" && (
            <section className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNAS.map((col, ci) => {
                const st = ESTADO[col.e];
                const delCol = visibles.filter((f) => f.r.estado === col.e);
                return (
                  <div key={col.e} style={{ animationDelay: `${ci * 70}ms` }}
                    className={`rx-in rounded-2xl p-2.5 ${d ? "bg-zinc-900/70" : "bg-zinc-200/60"}`}>
                    <div className="flex items-center justify-between gap-2 px-1.5 pb-3 pt-1">
                      <div className="min-w-0">
                        <h3 className="inline-flex items-center gap-2 text-sm font-extrabold"><st.Ico size={17} className={st.ico} /> {col.titulo}</h3>
                        <p className={`text-xs ${t.suave}`}>{col.ayuda}</p>
                      </div>
                      <span key={delCol.length} className={`rx-tick grid h-7 min-w-[1.75rem] place-items-center rounded-full px-2 text-xs font-bold tabular-nums ${st.cls}`}>{delCol.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {delCol.length > 0 ? delCol.map((f, i) => tarjetaAlumno(f, i)) : (
                        <p className={`rounded-xl border border-dashed px-3 py-6 text-center text-xs ${d ? "border-zinc-700" : "border-zinc-400"} ${t.suave}`}>Nadie en esta etapa</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {vistaActual === "lista" && (
            <section className={`${t.tarjeta} rx-in overflow-hidden`}>
              <ul>
                {visibles.map(({ a, idx, k, r }, i) => (
                  <li key={k} onClick={() => abrirExpediente(a, idx, r)} style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                    className={`rx-in group relative grid cursor-pointer grid-cols-1 items-center gap-3 border-b py-3 pl-6 pr-4 transition-colors md:grid-cols-12 ${t.borde} ${t.fila}`}>
                    <span className={`absolute inset-y-0 left-0 w-1.5 ${ESTADO[r.estado].barra}`} />
                    <div className="flex min-w-0 items-center gap-3 md:col-span-4">
                      {bloque(a)}
                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-bold">{a.nombre}</p>
                        <p className={`truncate text-xs ${t.suave}`}>{a.dni ? `DNI ${a.dni}` : `Código ${a.id_estudiante ?? a.id}`}</p>
                      </div>
                    </div>
                    <div className="md:col-span-3">{etiqueta(r.estado)}</div>
                    <div className="text-xs md:col-span-2">{pista(a, idx)}</div>
                    <div className="flex flex-wrap items-center gap-2 md:col-span-3 md:justify-end">{botonesAlumno(a, idx, k, r)}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* PANEL LATERAL: marcar papeles sin perder el lugar */}
      {alumnoPanel && (() => {
        const { a, idx, r } = alumnoPanel;
        const pos = visibles.findIndex((f) => f.k === abierto);
        const ir = (delta) => { const n = visibles[pos + delta]; if (n) setAbierto(n.k); };
        const todoBien = () => DOCS.forEach((doc) => marcarDoc(a, idx, doc, "conforme"));
        const sig = docSiguiente(a, idx);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Papeles de ${a.nombre}`}>
            <button type="button" aria-label="Cerrar" onClick={() => setAbierto(null)} className="rx-fade absolute inset-0 cursor-default bg-black/60" />
            <aside className={`rx-slide relative flex h-full w-full max-w-md flex-col shadow-2xl ${t.texto} ${d ? "bg-zinc-900" : "bg-white"}`}>
              <header className={`flex items-start justify-between gap-3 p-4 ${d ? "bg-zinc-800" : "bg-zinc-100"}`}>
                <div className="flex min-w-0 items-center gap-3">
                  {bloque(a, "h-12 w-12 text-base")}
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">{a.nombre}</p>
                    <p className={`truncate text-xs ${t.suave}`}>{a.dni ? `DNI ${a.dni}` : a.entidad}</p>
                    <div className="mt-1.5">{etiqueta(r.estado)}</div>
                  </div>
                </div>
                <button type="button" autoFocus onClick={() => setAbierto(null)}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold ${enfoque} ${t.boton}`}><X size={14} /> Cerrar</button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <p className={`text-xs ${t.suave}`}>Para cada papel, toca <strong>Está bien</strong>, <strong>Corregir</strong> o <strong>Falta</strong>.</p>
                <button type="button" onClick={todoBien} disabled={r.estado === "Completo"}
                  className={`w-full cursor-pointer rounded-xl border-2 border-emerald-600 px-4 py-2.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-600/10 disabled:opacity-40 ${enfoque}`}>
                  Marcar todos como “Está bien”
                </button>
                <ul className="space-y-3">
                  {DOCS.map((doc) => {
                    const v = valor(a, idx, doc);
                    const esSig = sig?.doc === doc;
                    return (
                      <li key={doc} className={`space-y-2 rounded-xl border-2 p-3 transition-colors duration-300 ${esSig ? "border-blue-600" : v === "conforme" ? (d ? "border-emerald-500/40" : "border-emerald-200") : v === "observado" ? (d ? "border-red-500/40" : "border-red-200") : (d ? "border-zinc-800" : "border-zinc-200")}`}>
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <span key={v} className="rx-pop shrink-0">
                            {v === "conforme" ? <CheckCircle2 size={17} className="text-emerald-500" /> : v === "observado" ? <AlertCircle size={17} className="text-red-500" /> : <Clock size={17} className="text-zinc-400" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{doc}</span>
                          {esSig && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white`}>Toca este</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {OPCIONES.map((o) => (
                            <button key={o.v} type="button" onClick={() => marcarDoc(a, idx, doc, o.v)} aria-pressed={v === o.v}
                              className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors duration-200 ${enfoque} ${v === o.v ? `${o.on} border-transparent` : `${d ? "border-zinc-700 hover:bg-zinc-800" : "border-zinc-200 hover:bg-zinc-100"} ${t.suave}`}`}>
                              <o.Ico size={18} /> {o.t}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <footer className={`space-y-3 border-t p-4 ${d ? "border-zinc-800" : "border-zinc-200"}`}>
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={() => ir(-1)} disabled={pos <= 0}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40 ${enfoque} ${t.boton}`}><ArrowLeft size={14} /> Anterior</button>
                  <span className={`text-xs tabular-nums ${t.suave}`} aria-live="polite">Alumno {pos + 1} de {visibles.length}</span>
                  <button type="button" onClick={() => ir(1)} disabled={pos >= visibles.length - 1}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40 ${enfoque} ${t.boton}`}>Siguiente <ArrowRight size={14} /></button>
                </div>
                <button type="button" onClick={() => { setAbierto(null); abrirExpediente(a, idx, r); }}
                  className={`group/b inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${enfoque} ${principal}`}>
                  Ver ficha completa <ArrowRight size={14} className="transition-transform duration-200 group-hover/b:translate-x-0.5" />
                </button>
                <p className={`text-center text-xs ${t.suave}`}>Tip: con las flechas ← → del teclado cambias de alumno.</p>
              </footer>
            </aside>
          </div>
        );
      })()}
    </div>
  );
}