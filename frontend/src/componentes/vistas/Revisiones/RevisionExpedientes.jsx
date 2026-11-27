import { Fragment, Component, useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  FileText,
  ExternalLink,
  ArrowLeft,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Layers,
  X,
} from "lucide-react";
import { tema, foco, Cabecera } from "../Docente/componentes/DocenteComun.jsx";
import ExpedienteAlumno from "../Estudiantes/ExpedienteAlumno.jsx";
import api from "../../../api/axios.js";
import AvatarEstudiante from "../../AvatarEstudiante.jsx";
import {
  normalizarNombreModulo,
  publicarModuloSistema,
  useModuloSistema,
} from "../../../utils/moduloSistema.js";

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

/* ───────────────────────── Documentos ─────────────────────────
   Los del alumno se revisan UNA sola vez (aunque curse varios módulos);
   los del módulo se revisan por cada módulo. */
const DOCS_ALUMNO = ["Copia de DNI", "Ficha de datos"];
const DOCS_MODULO = ["Carta de presentación", "Convenio firmado", "Plan de prácticas", "Informe final"];
const DOCS = [...DOCS_ALUMNO, ...DOCS_MODULO];

// La evaluación no es progresiva: al final se registra una nota por módulo (escala vigesimal)
const NOTA_MAX = 20;
const NOTA_MINIMA = 13;
const REQUIERE_EXPEDIENTE_COMPLETO = true;

const OPCIONES = [
  { v: "pendiente", t: "Pendiente", on: "bg-slate-500 text-white" },
  { v: "conforme", t: "Conforme", on: "bg-emerald-600 text-white" },
  { v: "observado", t: "Observado", on: "bg-red-600 text-white" },
];

const FILTROS = ["Todos", "Sin completar", "Con observaciones", "Completos", "Sin nota"];

const colorResultado = {
  Completo: "text-emerald-600",
  "En revisión": "text-blue-600",
  "Con observaciones": "text-red-600",
  "Sin revisar": "text-slate-500",
};

const puntoEstado = {
  Completo: "bg-emerald-500",
  "En revisión": "bg-blue-600",
  "Con observaciones": "bg-red-500",
  "Sin revisar": "bg-slate-400",
};

const PALETA_MODULO = ["bg-cyan-500", "bg-blue-600", "bg-violet-500", "bg-amber-500", "bg-rose-500"];

/* ───────────────────────── Animaciones ───────────────────────── */
const ESTILOS = `
@keyframes rx-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
@keyframes rx-pop { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:none; } }
@keyframes rx-swap { from { opacity:0; transform:translateX(8px); } to { opacity:1; transform:none; } }
.rx-up { animation: rx-up .45s cubic-bezier(.22,1,.36,1) both; }
.rx-pop { animation: rx-pop .25s cubic-bezier(.22,1,.36,1) both; }
.rx-swap { animation: rx-swap .28s cubic-bezier(.22,1,.36,1) both; }
@media (prefers-reduced-motion: reduce) { .rx-up, .rx-pop, .rx-swap { animation: none !important; } }
`;

/* ───────────────────────── Utilidades de datos ───────────────────────── */
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
  normalizarNombreModulo(
    m?.nombre ?? m?.nombre_modulo ?? m?.modulo ?? m?.titulo ?? m?.descripcion ?? ""
  );

const claveAlumno = (a, idx = 0) =>
  String(a?.id_estudiante ?? a?.id ?? a?.dni ?? `alu-${idx}`);

const cortoModulo = (n) =>
  normalizarNombreModulo(n) || "Nombre de módulo no disponible";
const subModulo = (n) => {
  const p = String(n || "").split(/\s+[–—-]\s+/);
  return p.length > 1 ? p.slice(1).join(" – ") : "";
};

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
  const nombreModulo = normalizarNombreModulo(
    item.modulo_nombre ||
      item.nombre_modulo ||
      item.modulo ||
      est.modulo_nombre ||
      "Nombre de módulo no disponible"
  );
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

/* Une las filas del mismo alumno: la API puede devolver una fila por cada módulo que cursa.
   Resultado: un alumno = una sola entrada, con su lista de módulos. */
const modulosDeItem = (it) => {
  if (Array.isArray(it.modulos) && it.modulos.length > 0) {
    return it.modulos.map((m) =>
      typeof m === "string"
        ? { id: null, nombre: m, periodo: it.periodo_academico }
        : { id: obtenerIdModulo(m) ?? null, nombre: nombreModuloDe(m) || "Nombre de módulo no disponible", periodo: m.periodo_academico || it.periodo_academico }
    );
  }
  return [{ id: it.id_modulo ?? null, nombre: it.modulo_nombre, periodo: it.periodo_academico }];
};

const agruparPorAlumno = (items, catalogoApi) => {
  const nombrePorId = new Map(
    catalogoApi.map((m) => [String(obtenerIdModulo(m)), nombreModuloDe(m)]).filter(([, n]) => n)
  );
  const mapa = new Map();

  items.forEach((it, idx) => {
    const k = claveAlumno(it, idx);
    if (!mapa.has(k)) mapa.set(k, { k, base: it, nombre: it.nombre, dni: it.dni, correo: it.correo, modulos: [] });
    const est = mapa.get(k);

    modulosDeItem(it).forEach((m) => {
      const nombre =
        (m.id != null && nombrePorId.get(String(m.id))) ||
        normalizarNombreModulo(m.nombre) ||
        "Nombre de módulo no disponible";
      const mk = String(m.id ?? nombre);
      if (!est.modulos.some((x) => x.mk === mk)) {
        est.modulos.push({ mk, id_modulo: m.id, nombre, periodo: m.periodo || "" });
      }
    });
  });

  const orden = (a, b) => {
    const na = Number(a.id_modulo);
    const nb = Number(b.id_modulo);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.nombre.localeCompare(b.nombre, "es");
  };
  mapa.forEach((est) => est.modulos.sort(orden));
  return [...mapa.values()];
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

const leerNotasLocal = (clave) => {
  try {
    const raw =
      sessionStorage.getItem(`rev_notas_${clave}`) ||
      localStorage.getItem(`rev_notas_${clave}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const guardarNotasLocal = (clave, notasObj) => {
  try {
    const payload = JSON.stringify(notasObj);
    sessionStorage.setItem(`rev_notas_${clave}`, payload);
    localStorage.setItem(`rev_notas_${clave}`, payload);
  } catch {
    /* ignorar */
  }
};

/* ───────────────────────── Piezas pequeñas ───────────────────────── */
const useContador = (objetivo, duracion = 700) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setV(objetivo);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - t0) / duracion);
      setV(Math.round(objetivo * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, duracion]);
  return v;
};

const Cifra = ({ valor }) => <>{useContador(valor)}</>;

const EstadoChip = ({ estado }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${colorResultado[estado]}`}>
    <i className={`h-1.5 w-1.5 rounded-full ${puntoEstado[estado]}`} />
    {estado}
  </span>
);

/* Sello de la nota final: el anillo se dibuja hasta la nota */
function AnilloNota({ nota, tam = 44, d }) {
  const [p, setP] = useState(0);
  const aprobado = nota != null && nota >= NOTA_MINIMA;

  useEffect(() => {
    const id = requestAnimationFrame(() => setP(nota == null ? 0 : (nota / NOTA_MAX) * 100));
    return () => cancelAnimationFrame(id);
  }, [nota]);

  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }} title={nota == null ? "Sin nota" : `Nota final: ${nota}`}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3.5" className={d ? "stroke-slate-700" : "stroke-slate-200"} strokeDasharray={nota == null ? "2 3" : undefined} />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={aprobado ? "stroke-emerald-500" : "stroke-red-500"}
          strokeDasharray={`${p} ${100 - p}`}
          style={{ transition: "stroke-dasharray .9s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <span className={`absolute inset-0 grid place-items-center font-extrabold tabular-nums ${tam > 48 ? "text-lg" : "text-[13px]"} ${nota == null ? "text-slate-400" : ""}`}>
        {nota == null ? "—" : nota}
      </span>
    </div>
  );
}

function NotaEditor({ nota, habilitada, onGuardar, t }) {
  const [txt, setTxt] = useState(nota == null ? "" : String(nota));
  const [err, setErr] = useState("");

  useEffect(() => {
    setTxt(nota == null ? "" : String(nota));
    setErr("");
  }, [nota]);

  const guardar = () => {
    const n = Number(txt);
    if (txt.trim() === "" || !Number.isFinite(n) || n < 0 || n > NOTA_MAX) {
      setErr(`Ingresa una nota entre 0 y ${NOTA_MAX}.`);
      return;
    }
    setErr("");
    onGuardar(Math.round(n));
  };

  if (!habilitada) {
    return (
      <p className={`flex items-center gap-2 text-xs ${t.suave}`}>
        <Lock size={13} /> Se habilita cuando el expediente esté completo.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          max={NOTA_MAX}
          step={1}
          inputMode="numeric"
          value={txt}
          aria-label="Nota final"
          placeholder={`0–${NOTA_MAX}`}
          onChange={(e) => { setTxt(e.target.value); setErr(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") guardar(); }}
          className={`w-24 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/15 ${t.entrada}`}
        />
        <button
          type="button"
          onClick={guardar}
          className={`cursor-pointer rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95 ${foco}`}
        >
          {nota == null ? "Registrar nota" : "Actualizar nota"}
        </button>
        {nota != null && (
          <button
            type="button"
            onClick={() => onGuardar(null)}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-600/10 ${foco}`}
          >
            <X size={13} /> Quitar
          </button>
        )}
      </div>
      {err && <p role="alert" className="rx-pop mt-1.5 text-xs text-red-500">{err}</p>}
    </div>
  );
}

/* Revisión de documentos + nota final de UN módulo de UN alumno */
function PanelRevision({ est, item, d, t, h }) {
  const { mod, r, nota } = item;
  const compartido = est.modulos.length > 1;
  const puedeNota = !REQUIERE_EXPEDIENTE_COMPLETO || r.estado === "Completo" || nota != null;

  const lista = (docs) => (
    <ul className="space-y-2.5">
      {docs.map((doc) => (
        <li key={doc} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <span className="text-[13px]">{doc}</span>
          <span className={`flex overflow-hidden rounded-lg border text-[11px] font-medium ${t.borde}`}>
            {OPCIONES.map((o) => {
              const activo = h.valorDoc(est, mod, doc) === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); h.poner(est, mod, doc, o.v); }}
                  aria-pressed={activo}
                  className={`cursor-pointer px-2.5 py-1 transition-colors ${activo ? o.on : `${t.suave} hover:bg-black/5`}`}
                >
                  {o.t}
                </button>
              );
            })}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-5 p-4">
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-xs font-bold">Documentos del alumno</p>
          {compartido && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${t.borde} ${t.suave}`} title="Se revisan una sola vez para todos sus módulos">
              Compartidos entre módulos
            </span>
          )}
        </div>
        {lista(DOCS_ALUMNO)}
      </div>

      <div className={`border-t pt-4 ${t.borde}`}>
        <p className="mb-2.5 flex items-center gap-2 text-xs font-bold">
          <i className={`h-2 w-2 rounded-full ${h.colorDe(mod.mk)}`} />
          Documentos de {cortoModulo(mod.nombre)}
        </p>
        {lista(DOCS_MODULO)}
      </div>

      <div className={`flex flex-wrap items-center gap-4 border-t pt-4 ${t.borde}`}>
        <AnilloNota nota={nota} tam={56} d={d} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold">Nota final del módulo</p>
          {nota != null && (
            <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${nota >= NOTA_MINIMA ? "text-emerald-600" : "text-red-600"}`}>
              <i className={`h-1.5 w-1.5 rounded-full ${nota >= NOTA_MINIMA ? "bg-emerald-500" : "bg-red-500"}`} />
              {nota >= NOTA_MINIMA ? "Aprobado" : "Desaprobado"} · mínima {NOTA_MINIMA}
            </p>
          )}
          <div className={nota == null ? "mt-1.5" : ""}>
            <NotaEditor nota={nota} habilitada={puedeNota} onGuardar={(n) => h.guardarNota(est, mod, n)} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Una tarjeta por alumno; si cursa varios módulos, se cambia de módulo dentro de la misma tarjeta */
function TarjetaAlumno({ reg, i, modoTodos, d, t, h }) {
  const [mk, setMk] = useState(reg.items[0].mod.mk);
  const [abierto, setAbierto] = useState(false);
  const item = reg.items.find((x) => x.mod.mk === mk) || reg.items[0];
  const varios = reg.items.length > 1 && modoTodos;

  const notas = reg.est.modulos.length > 1 ? reg.todos.map((x) => x.nota) : [];
  const promedio = notas.length > 1 && notas.every((n) => n != null)
    ? Math.round(notas.reduce((s, n) => s + n, 0) / notas.length)
    : null;

  return (
    <div
      style={{ animationDelay: `${Math.min(i, 9) * 50}ms` }}
      className={`rx-up ${t.tarjeta} group p-4 transition-all hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => h.abrir(reg.est, item.mod)}
          className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-lg text-left ${foco}`}
        >
          <AvatarEstudiante
            estudiante={reg.est.base}
            className="h-10 w-10 rounded-full text-xs font-bold"
            fallbackClassName={d ? "bg-slate-700 text-slate-200" : "bg-blue-50 text-blue-700"}
          />
          <span className="min-w-0">
            <span className="block truncate font-semibold transition-colors group-hover:text-blue-600">{reg.est.nombre}</span>
            <span className={`block text-xs ${t.suave}`}>
              {reg.est.dni ? `DNI ${reg.est.dni}` : `ID #${reg.est.base.id_estudiante ?? reg.est.base.id}`}
            </span>
          </span>
        </button>

        {reg.est.modulos.length > 1 && (
          <span className="flex shrink-0 flex-col items-end gap-1">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${t.borde} ${t.suave}`}>
              <Layers size={11} /> {reg.est.modulos.length} módulos
            </span>
            {promedio != null && (
              <span className={`rx-pop text-[11px] font-bold ${promedio >= NOTA_MINIMA ? "text-emerald-600" : "text-red-600"}`}>
                Promedio {promedio}
              </span>
            )}
          </span>
        )}
      </div>

      <div className={`mt-4 overflow-hidden rounded-xl border ${t.borde}`}>
        {varios && (
          <div role="tablist" aria-label="Módulos del alumno" className={`flex flex-wrap gap-1.5 border-b p-2 ${t.borde}`}>
            {reg.items.map((x) => (
              <button
                key={x.mod.mk}
                type="button"
                role="tab"
                aria-selected={x.mod.mk === item.mod.mk}
                onClick={() => setMk(x.mod.mk)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${foco} ${
                  x.mod.mk === item.mod.mk ? t.chipOn : t.boton
                }`}
              >
                <i className={`h-2 w-2 rounded-full ${h.colorDe(x.mod.mk)}`} />
                {cortoModulo(x.mod.nombre)}
              </button>
            ))}
          </div>
        )}

        <div key={item.mod.mk} className={`flex items-center gap-3 p-3 ${varios ? "rx-swap" : ""}`}>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <i className={`h-2 w-2 shrink-0 rounded-full ${h.colorDe(item.mod.mk)}`} />
              <span className="truncate">{item.mod.nombre}</span>
            </p>
            <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 text-xs ${t.suave}`}>
              <EstadoChip estado={item.r.estado} />
              {item.mod.periodo && <span>· {item.mod.periodo}</span>}
            </p>
          </div>
          <AnilloNota nota={item.nota} d={d} />
        </div>

        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
          className={`flex w-full cursor-pointer items-center justify-between border-t px-3 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-black/5 ${t.borde} ${foco}`}
        >
          {abierto ? "Ocultar revisión" : "Revisar documentos y nota"}
          <ChevronDown size={14} className={`transition-transform duration-300 ${abierto ? "rotate-180" : ""}`} />
        </button>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className={`overflow-hidden ${abierto ? "visible" : "invisible"}`}>
            <div className={`border-t ${t.borde}`}>
              <PanelRevision est={reg.est} item={item} d={d} t={t} h={h} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => h.abrir(reg.est, item.mod)}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-500/10 ${t.borde} ${foco}`}
        >
          <FileText size={13} />
          Ver expediente completo
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Pantalla principal ───────────────────────── */
export default function RevisionExpedientes({
  darkMode,
  setVista,
  onSeleccionarAlumno,
  onAbrirExpediente,
  onGuardarNota,
}) {
  const d = !!darkMode;
  const t = tema(d);
  const moduloSistema = useModuloSistema();

  const claveSesion = useMemo(() => obtenerClaveSesion(), []);
  const cacheInicial = useMemo(() => leerCachePersistencia(claveSesion), [claveSesion]);

  const [alumnos, setAlumnos] = useState(() => cacheInicial?.alumnos ?? []);
  const [modulos, setModulos] = useState(() => cacheInicial?.modulos ?? []);
  const [moduloSeleccionado, setModuloSeleccionado] = useState("todos");
  const [cargando, setCargando] = useState(() => !(cacheInicial?.alumnos?.length > 0));
  const [errorBD, setErrorBD] = useState("");
  const [rev, setRev] = useState(() => leerRevisionesLocal(claveSesion));
  const [notas, setNotas] = useState(() => leerNotasLocal(claveSesion));
  const [expedienteActivo, setExpedienteActivo] = useState(null);

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [vistaActual, setVistaActual] = useState("tarjetas");
  const [celdaAbierta, setCeldaAbierta] = useState(null);

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
    setNotas(leerNotasLocal(claveSesion));
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

  /* ---------- Un alumno = una entrada, con sus módulos ---------- */
  const estudiantes = useMemo(() => agruparPorAlumno(alumnos, modulos), [alumnos, modulos]);

  const catalogo = useMemo(() => {
    const mapa = new Map();
    estudiantes.forEach((e) => e.modulos.forEach((m) => { if (!mapa.has(m.mk)) mapa.set(m.mk, m); }));
    return [...mapa.values()].sort((a, b) => {
      const na = Number(a.id_modulo);
      const nb = Number(b.id_modulo);
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [estudiantes]);

  const colorDe = useCallback(
    (mk) => PALETA_MODULO[Math.max(0, catalogo.findIndex((m) => m.mk === mk)) % PALETA_MODULO.length],
    [catalogo]
  );

  const tabs = useMemo(
    () => [
      { id: "todos", label: "Todos", sub: "alumnos asignados", count: estudiantes.length, dot: null },
      ...catalogo.map((m) => ({
        id: m.mk,
        label: cortoModulo(m.nombre),
        sub: subModulo(m.nombre) || "profesional",
        count: estudiantes.filter((e) => e.modulos.some((x) => x.mk === m.mk)).length,
        dot: colorDe(m.mk),
      })),
    ],
    [estudiantes, catalogo, colorDe]
  );
  const moduloSistemaId = moduloSistema?.id_modulo;
  const moduloSel = moduloSistema?.all
    ? "todos"
    : moduloSistemaId
    ? String(moduloSistemaId)
    : tabs.some((x) => x.id === moduloSeleccionado)
      ? moduloSeleccionado
      : "todos";
  const idxTab = Math.max(0, tabs.findIndex((x) => x.id === moduloSel));

  /* ---------- Revisión de documentos y notas ---------- */
  const kAM = (est, mod) => `${est.k}::${mod.mk}`;

  const valorDoc = (est, mod, doc) =>
    DOCS_ALUMNO.includes(doc)
      ? rev[est.k]?.[doc] || "pendiente"
      : rev[kAM(est, mod)]?.[doc] ?? rev[est.k]?.[doc] ?? "pendiente";

  const poner = (est, mod, doc, v) => {
    const bucket = DOCS_ALUMNO.includes(doc) ? est.k : kAM(est, mod);
    setRev((p) => {
      const siguiente = {
        ...p,
        [bucket]: { ...p[bucket], [doc]: normalizarDocumentoEstado(v) },
      };
      guardarRevisionesLocal(claveSesion, siguiente);
      return siguiente;
    });
  };

  const resumen = (est, mod) => {
    const c = DOCS.filter((x) => valorDoc(est, mod, x) === "conforme").length;
    const o = DOCS.filter((x) => valorDoc(est, mod, x) === "observado").length;
    return {
      c,
      o,
      estado: c === DOCS.length ? "Completo" : o ? "Con observaciones" : c ? "En revisión" : "Sin revisar",
    };
  };

  const guardarNota = (est, mod, n) => {
    const key = kAM(est, mod);
    setNotas((p) => {
      const s = { ...p };
      if (n == null) delete s[key];
      else s[key] = n;
      guardarNotasLocal(claveSesion, s);
      return s;
    });
    onGuardarNota?.({ alumno: est.base, modulo: mod, nota: n });
  };

  const registros = useMemo(
    () =>
      estudiantes.map((est) => {
        const todos = est.modulos.map((mod) => ({ mod, r: resumen(est, mod), nota: notas[kAM(est, mod)] ?? null }));
        return { est, todos, items: todos };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estudiantes, rev, notas]
  );

  const enAlcance = useMemo(
    () =>
      registros
        .map((reg) => ({
          ...reg,
          items: moduloSel === "todos" ? reg.todos : reg.todos.filter((x) => x.mod.mk === moduloSel),
        }))
        .filter((reg) => reg.items.length > 0),
    [registros, moduloSel]
  );

  const pendientes = registros.flatMap((r) => r.todos).filter((x) => x.r.estado !== "Completo").length;

  const coincideEstado = (x) =>
    filtro === "Todos" ||
    (filtro === "Completos"
      ? x.r.estado === "Completo"
      : filtro === "Con observaciones"
        ? x.r.o > 0
        : filtro === "Sin nota"
          ? x.nota == null
          : x.r.estado !== "Completo");

  const visibles = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return enAlcance.filter((reg) => {
      const okTexto =
        !texto ||
        `${reg.est.nombre} ${reg.est.dni} ${reg.est.correo} ${reg.items.map((x) => x.mod.nombre).join(" ")}`
          .toLowerCase()
          .includes(texto);
      return okTexto && reg.items.some(coincideEstado);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enAlcance, q, filtro]);

  const itemsAlcance = enAlcance.flatMap((r) => r.items);
  const totalExp = itemsAlcance.length;
  const completos = itemsAlcance.filter((x) => x.r.estado === "Completo").length;
  const observados = itemsAlcance.filter((x) => x.r.o > 0).length;
  const conNota = itemsAlcance.filter((x) => x.nota != null).length;

  const abrirExpediente = (est, mod) => {
    const item = registros.find((r) => r.est.k === est.k)?.todos.find((x) => x.mod.mk === mod.mk);
    const payload = {
      ...est.base,
      id_modulo: mod.id_modulo,
      modulo_nombre: mod.nombre,
      entidad: `${mod.nombre}${mod.periodo ? ` (${mod.periodo})` : ""}`,
      estado_expediente: item?.r.estado || "Sin revisar",
      documentos_conformes: item?.r.c ?? 0,
      documentos_observados: item?.r.o ?? 0,
      nota_final: item?.nota ?? null,
      documentos: Object.fromEntries(DOCS.map((doc) => [doc, valorDoc(est, mod, doc)])),
    };

    try {
      localStorage.setItem("expediente_alumno_seleccionado", JSON.stringify(payload));
    } catch {
      // Ignorar error de localStorage
    }

    onSeleccionarAlumno?.(payload);
    if (onAbrirExpediente) {
      onAbrirExpediente(payload);
      return;
    }
    setVista?.("Expediente Alumno");
    setExpedienteActivo(payload);
  };

  const h = { abrir: abrirExpediente, valorDoc, poner, guardarNota, colorDe };

  /* ---------- Vista del expediente ---------- */
  if (expedienteActivo) {
    return (
      <div className={`space-y-5 text-sm ${t.texto}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold">
              Expediente de {expedienteActivo.nombre}
            </h2>
            {expedienteActivo.modulo_nombre && (
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${t.borde} ${t.suave}`}>
                {expedienteActivo.modulo_nombre}
              </span>
            )}
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
                  <span className={t.suave}>Nota final:</span>{" "}
                  <strong>{expedienteActivo.nota_final ?? "Sin nota"}</strong>
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

  const columnasMatriz = moduloSel === "todos" ? catalogo : catalogo.filter((m) => m.mk === moduloSel);

  return (
    <div className={`space-y-5 text-sm ${t.texto}`}>
      <style>{ESTILOS}</style>

      <Cabecera
        t={t}
        titulo="Revisión de Expedientes"
        subtitulo="Alumnos asignados al docente y verificación de documentación EFSRT."
        pill={`Por completar: ${pendientes}`}
      />

      {/* División por módulo profesional */}
      {tabs.length > 1 && (
        <div className={`${t.tarjeta} overflow-x-auto`}>
          <div
            role="tablist"
            aria-label="Módulo profesional"
            className="relative grid"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(9rem, 1fr))` }}
          >
            {tabs.map((tb) => {
              const activa = tb.id === moduloSel;
              return (
                <button
                  key={tb.id}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => {
                    setModuloSeleccionado(tb.id);
                    setCeldaAbierta(null);
                    if (tb.id === "todos") {
                      publicarModuloSistema(null);
                      return;
                    }
                    const seleccionado = catalogo.find(
                      (modulo) => modulo.mk === tb.id
                    );
                    if (seleccionado?.id_modulo) {
                      publicarModuloSistema({
                        id_modulo: seleccionado.id_modulo,
                        nombre_modulo: seleccionado.nombre,
                      });
                    }
                  }}
                  className={`flex cursor-pointer flex-col items-start gap-1 px-5 pb-4 pt-3.5 text-left transition-colors ${foco}`}
                >
                  <span className="text-2xl font-extrabold leading-none tabular-nums">{tb.count}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${activa ? "text-blue-600" : t.suave}`}>
                    {tb.dot && <i className={`h-2 w-2 rounded-full ${tb.dot}`} />}
                    {tb.label}
                  </span>
                  <span className={`max-w-full truncate text-[11px] ${t.suave}`}>{tb.sub}</span>
                </button>
              );
            })}
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-transform duration-300 ease-out"
              style={{ width: `${100 / tabs.length}%`, transform: `translateX(${idxTab * 100}%)` }}
            />
          </div>
        </div>
      )}

      {/* Resumen del alcance elegido */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`${t.tarjeta} flex items-center gap-3 p-4`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <p className={`text-xs ${t.suave}`}>Expedientes completos</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              <Cifra valor={completos} />
              <span className={`ml-1 text-xs font-medium ${t.suave}`}>de {totalExp}</span>
            </p>
          </div>
        </div>
        <div className={`${t.tarjeta} flex items-center gap-3 p-4`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600">
            <AlertCircle size={20} />
          </span>
          <div>
            <p className={`text-xs ${t.suave}`}>Con observaciones</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              <Cifra valor={observados} />
              <span className={`ml-1 text-xs font-medium ${t.suave}`}>por corregir</span>
            </p>
          </div>
        </div>
        <div className={`${t.tarjeta} flex items-center gap-3 p-4`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
            <FileText size={20} />
          </span>
          <div>
            <p className={`text-xs ${t.suave}`}>Notas registradas</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              <Cifra valor={conNota} />
              <span className={`ml-1 text-xs font-medium ${t.suave}`}>de {totalExp}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
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

            <div className={`flex items-center gap-1 border-l pl-2 ${t.borde}`}>
              <button
                type="button"
                onClick={() => setVistaActual("tarjetas")}
                title="Tarjetas: un alumno por tarjeta"
                aria-pressed={vistaActual === "tarjetas"}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  vistaActual === "tarjetas" ? t.chipOn : t.boton
                }`}
              >
                <LayoutGrid size={14} /> Tarjetas
              </button>
              <button
                type="button"
                onClick={() => setVistaActual("matriz")}
                title="Matriz: alumnos por módulo"
                aria-pressed={vistaActual === "matriz"}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  vistaActual === "matriz" ? t.chipOn : t.boton
                }`}
              >
                <TableIcon size={14} /> Matriz
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas: un alumno, una tarjeta */}
        {vistaActual === "tarjetas" && visibles.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((reg, i) => (
              <TarjetaAlumno
                key={`${reg.est.k}-${moduloSel}`}
                reg={reg}
                i={i}
                modoTodos={moduloSel === "todos"}
                d={d}
                t={t}
                h={h}
              />
            ))}
          </div>
        )}

        {/* Matriz: filas = alumnos, columnas = módulos (sin repetir datos del alumno) */}
        {vistaActual === "matriz" && visibles.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full" style={{ minWidth: `${420 + columnasMatriz.length * 190}px` }}>
              <thead>
                <tr className={`border-b text-left text-[11px] font-bold uppercase tracking-wider ${t.borde} ${t.th}`}>
                  <th className="py-3">Alumno</th>
                  {columnasMatriz.map((m) => (
                    <th key={m.mk} className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <i className={`h-2 w-2 rounded-full ${colorDe(m.mk)}`} />
                        {cortoModulo(m.nombre)}
                      </span>
                    </th>
                  ))}
                  <th className="py-3 text-right">Expediente</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((reg) => (
                  <Fragment key={reg.est.k}>
                    <tr className={`border-b transition-colors ${t.borde} ${t.fila}`}>
                      <td className="py-3.5">
                        <span className="flex items-center gap-3">
                          <AvatarEstudiante
                            estudiante={reg.est.base}
                            className="h-8 w-8 rounded-full text-[11px] font-bold"
                            fallbackClassName={d ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}
                          />
                          <span className="leading-tight">
                            <span className="block font-semibold">{reg.est.nombre}</span>
                            <span className={`text-xs ${t.suave}`}>
                              {reg.est.dni ? `DNI ${reg.est.dni}` : `ID #${reg.est.base.id_estudiante ?? reg.est.base.id}`}
                            </span>
                          </span>
                        </span>
                      </td>

                      {columnasMatriz.map((m) => {
                        const x = reg.items.find((it) => it.mod.mk === m.mk);
                        if (!x) {
                          return <td key={m.mk} className={`py-3.5 pr-3 text-xs ${t.suave}`}>—</td>;
                        }
                        const abierta = celdaAbierta?.k === reg.est.k && celdaAbierta?.mk === m.mk;
                        return (
                          <td key={m.mk} className="py-3.5 pr-3">
                            <button
                              type="button"
                              aria-expanded={abierta}
                              onClick={() => setCeldaAbierta(abierta ? null : { k: reg.est.k, mk: m.mk })}
                              className={`flex w-full max-w-[200px] cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors hover:border-blue-500 ${foco} ${
                                abierta ? "border-blue-500" : t.borde
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <EstadoChip estado={x.r.estado} />
                              </span>
                              <span className={`shrink-0 text-sm font-extrabold tabular-nums ${x.nota == null ? "text-slate-400" : x.nota >= NOTA_MINIMA ? "text-emerald-600" : "text-red-600"}`}>
                                {x.nota ?? "—"}
                              </span>
                              <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${t.suave} ${abierta ? "rotate-180" : ""}`} />
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => abrirExpediente(reg.est, (reg.items.find((it) => celdaAbierta?.k === reg.est.k && it.mod.mk === celdaAbierta?.mk) || reg.items[0]).mod)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold text-blue-600 ${t.boton}`}
                        >
                          Abrir expediente
                        </button>
                      </td>
                    </tr>

                    {celdaAbierta?.k === reg.est.k && reg.items.some((it) => it.mod.mk === celdaAbierta.mk) && (
                      <tr className={`border-b ${t.borde}`}>
                        <td colSpan={columnasMatriz.length + 2} className="p-0">
                          <div className={`rx-pop m-3 overflow-hidden rounded-xl border ${t.borde}`}>
                            <div className={`flex items-center gap-2 border-b px-4 py-2.5 text-xs font-bold ${t.borde}`}>
                              <i className={`h-2 w-2 rounded-full ${colorDe(celdaAbierta.mk)}`} />
                              {reg.est.nombre} · {reg.items.find((it) => it.mod.mk === celdaAbierta.mk).mod.nombre}
                            </div>
                            <PanelRevision
                              est={reg.est}
                              item={reg.items.find((it) => it.mod.mk === celdaAbierta.mk)}
                              d={d}
                              t={t}
                              h={h}
                            />
                          </div>
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