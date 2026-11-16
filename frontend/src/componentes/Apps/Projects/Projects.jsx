import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Search, Trash2, X, Building2, Undo2, Check, FolderKanban, Clock } from "lucide-react";

/* ───────────────────────── Etapas ─────────────────────────
   Cada etapa tiene su color: punto, barra de avance y fondo de la columna. */
const ESTADOS = [
  { id: "Por iniciar", punto: "bg-slate-400",   fondo: "bg-slate-100/80 border-slate-200",     fondoD: "bg-slate-900/60 border-gray-800" },
  { id: "En curso",    punto: "bg-sky-500",     fondo: "bg-sky-50/80 border-sky-100",          fondoD: "bg-sky-950/20 border-sky-900/40" },
  { id: "En revisión", punto: "bg-amber-500",   fondo: "bg-amber-50/80 border-amber-100",      fondoD: "bg-amber-950/15 border-amber-900/40" },
  { id: "Finalizado",  punto: "bg-emerald-500", fondo: "bg-emerald-50/80 border-emerald-100",  fondoD: "bg-emerald-950/15 border-emerald-900/40" },
];

/* Cada carril (entidad o alumno) tiene su color, como en un tablero de carriles */
const COLORES = [
  { card: "bg-amber-50 border-amber-200 border-l-amber-400",     cardD: "bg-amber-950/25 border-amber-900/50 border-l-amber-500",     barra: "bg-amber-400",   et: "bg-amber-100 text-amber-900",     etD: "bg-amber-950/50 text-amber-200" },
  { card: "bg-teal-50 border-teal-200 border-l-teal-500",        cardD: "bg-teal-950/25 border-teal-900/50 border-l-teal-500",        barra: "bg-teal-500",    et: "bg-teal-100 text-teal-900",       etD: "bg-teal-950/50 text-teal-200" },
  { card: "bg-rose-50 border-rose-200 border-l-rose-400",        cardD: "bg-rose-950/25 border-rose-900/50 border-l-rose-500",        barra: "bg-rose-400",    et: "bg-rose-100 text-rose-900",       etD: "bg-rose-950/50 text-rose-200" },
  { card: "bg-sky-50 border-sky-200 border-l-sky-500",           cardD: "bg-sky-950/25 border-sky-900/50 border-l-sky-500",           barra: "bg-sky-500",     et: "bg-sky-100 text-sky-900",         etD: "bg-sky-950/50 text-sky-200" },
  { card: "bg-violet-50 border-violet-200 border-l-violet-500",  cardD: "bg-violet-950/25 border-violet-900/50 border-l-violet-500",  barra: "bg-violet-500",  et: "bg-violet-100 text-violet-900",   etD: "bg-violet-950/50 text-violet-200" },
  { card: "bg-emerald-50 border-emerald-200 border-l-emerald-500", cardD: "bg-emerald-950/25 border-emerald-900/50 border-l-emerald-500", barra: "bg-emerald-500", et: "bg-emerald-100 text-emerald-900", etD: "bg-emerald-950/50 text-emerald-200" },
  { card: "bg-orange-50 border-orange-200 border-l-orange-400",  cardD: "bg-orange-950/25 border-orange-900/50 border-l-orange-500",  barra: "bg-orange-400",  et: "bg-orange-100 text-orange-900",   etD: "bg-orange-950/50 text-orange-200" },
];

const LINEAS = { "Por iniciar": "border-b-slate-400", "En curso": "border-b-sky-500", "En revisión": "border-b-amber-500", "Finalizado": "border-b-emerald-500" };

const AVATARES = ["bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500"];

/* ───────────────────────── Tema ───────────────────────── */
const tokens = (d) => ({
  borde: d ? "border-gray-800" : "border-slate-200",
  panel: d ? "border-gray-800 bg-slate-900" : "border-slate-200 bg-white",
  tarjeta: d ? "border-gray-800 bg-slate-900" : "border-slate-200 bg-white",
  suave: d ? "text-slate-400" : "text-slate-500",
  pista: d ? "bg-slate-800" : "bg-slate-100",
  entrada: `mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-sky-500/15 ${
    d ? "border-gray-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white"
  }`,
  icono: d ? "text-slate-400 hover:bg-white/10 hover:text-slate-100" : "text-slate-400 hover:bg-black/5 hover:text-slate-700",
  botonSec: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50",
  chipOff: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-white",
  chipOn: d ? "border-sky-500 bg-sky-950/40 text-sky-300" : "border-sky-500 bg-sky-50 text-sky-700",
});

const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40";

/* ───────────────────────── Animaciones ─────────────────────────
   Se apagan solas si el sistema pide "reducir movimiento". */
const ESTILOS = `
@keyframes nt-pop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes nt-fade{from{opacity:0}to{opacity:1}}
@keyframes nt-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes nt-open{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:none}}
@keyframes nt-toast{from{opacity:0;transform:translate(-50%,18px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes nt-check{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes nt-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes nt-grow{from{width:0}}
@keyframes nt-land{0%{transform:scale(.9)}55%{transform:scale(1.045)}100%{transform:scale(1)}}
@keyframes nt-burst{0%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r)) scale(.5)}}
.nt-pop{animation:nt-pop .26s cubic-bezier(.2,.8,.2,1) backwards}
.nt-fade{animation:nt-fade .2s ease-out backwards}
.nt-rise{animation:nt-rise .45s cubic-bezier(.2,.8,.2,1) backwards}
.nt-open{animation:nt-open .2s ease-out backwards}
.nt-toast{animation:nt-toast .3s cubic-bezier(.2,.8,.2,1) backwards}
.nt-check{animation:nt-check .35s ease-out}
.nt-bar{transform-origin:left;animation:nt-bar 4.5s linear forwards}
.nt-grow{animation:nt-grow .8s cubic-bezier(.2,.8,.2,1) backwards}
.nt-burst{animation:nt-burst .95s cubic-bezier(.2,.7,.3,1) forwards}
.nt-land{animation:nt-land .5s cubic-bezier(.2,.8,.2,1)}
.nt-sin-barra{scrollbar-width:none}
.nt-sin-barra::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.nt-pop,.nt-fade,.nt-rise,.nt-open,.nt-toast,.nt-check,.nt-bar,.nt-grow,.nt-burst,.nt-land{animation:none!important}}
`;

/* ───────────────────────── Fechas y utilidades ───────────────────────── */
const pad = (n) => String(n).padStart(2, "0");
const iso = (dias = 0) => {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
};
const diasHasta = (lim) => Math.round((new Date(`${lim}T00:00:00`) - new Date(`${iso(0)}T00:00:00`)) / 86400000);
const fechaCorta = (lim) => new Date(`${lim}T00:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" });

/* Texto y tono del plazo: lo urgente se nota, lo tranquilo no molesta */
const plazo = (p) => {
  const n = diasHasta(p.limite);
  if (p.estado === "Finalizado") return { texto: `Cerró el ${fechaCorta(p.limite)}`, tono: "ok" };
  if (n < 0) return { texto: `Venció hace ${-n} ${-n === 1 ? "día" : "días"}`, tono: "mal" };
  if (n === 0) return { texto: "Vence hoy", tono: "aviso" };
  if (n === 1) return { texto: "Vence mañana", tono: "aviso" };
  if (n <= 7) return { texto: `Vence en ${n} días`, tono: "aviso" };
  return { texto: `Límite ${fechaCorta(p.limite)}`, tono: "normal" };
};

const tonoClase = (tono, d, t) => ({
  mal: d ? "bg-red-950/50 text-red-300" : "bg-red-50 text-red-700",
  aviso: d ? "bg-amber-950/50 text-amber-300" : "bg-amber-50 text-amber-700",
  ok: d ? "bg-emerald-950/50 text-emerald-300" : "bg-emerald-50 text-emerald-700",
  normal: `${t.pista} ${t.suave}`,
}[tono]);

const iniciales = (nombre) => {
  const p = nombre.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
};
const colorAvatar = (nombre) => AVATARES[[...nombre].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATARES.length];

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const resaltar = (texto, q) => {
  if (!q.trim() || !texto) return texto;
  return texto.split(new RegExp(`(${escapar(q.trim())})`, "gi")).map((x, i) =>
    x.toLowerCase() === q.trim().toLowerCase() ? <mark key={i} className="rounded bg-sky-500/25 px-0.5 text-inherit">{x}</mark> : x,
  );
};
const escribiendo = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");

/* ───────────────────────── Datos ─────────────────────────
   Las fechas de ejemplo se calculan desde hoy, así el tablero siempre se ve vivo. */
const demo = () => [
  { id: 1, titulo: "Sistema Web de Inventario", alumno: "Alexander Vega", entidad: "Tech Solutions Perú", estado: "En curso", avance: 79, limite: iso(25) },
  { id: 2, titulo: "Plataforma de Matrícula Online", alumno: "Mariana Huamán", entidad: "Instituto Worldnic", estado: "En revisión", avance: 50, limite: iso(5) },
  { id: 3, titulo: "App Móvil de Asistencia", alumno: "Carlos Mendoza", entidad: "DataCorp SAC", estado: "En curso", avance: 85, limite: iso(20) },
  { id: 4, titulo: "Módulo de Facturación", alumno: "Valeria Castillo", entidad: "Grupo Innova", estado: "En curso", avance: 33, limite: iso(-2) },
  { id: 5, titulo: "Auditoría de Redes", alumno: "Gianfranco Paredes", entidad: "CyberNet SRL", estado: "Finalizado", avance: 100, limite: iso(-15) },
  { id: 6, titulo: "Portal de Egresados", alumno: "Lucía Ramos", entidad: "Instituto Worldnic", estado: "Por iniciar", avance: 0, limite: iso(60) },
];

const cargar = () => {
  try {
    const g = JSON.parse(localStorage.getItem("proyectos_app"));
    if (Array.isArray(g)) return g;
  } catch { /* sin datos */ }
  return demo();
};

/* ───────────────────────── Piezas pequeñas ───────────────────────── */
function Avatar({ nombre, tam = "h-6 w-6 text-[10px]" }) {
  return <span className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${tam} ${colorAvatar(nombre)}`} aria-hidden="true">{iniciales(nombre)}</span>;
}

/* Ráfaga de confeti al terminar un proyecto */
function Confeti() {
  const [ps] = useState(() => Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
    const r = 50 + Math.random() * 50;
    return {
      dx: Math.cos(a) * r, dy: Math.sin(a) * r - 15, rot: Math.random() * 540 - 270,
      c: ["bg-emerald-400", "bg-sky-400", "bg-amber-400", "bg-rose-400", "bg-violet-400"][i % 5],
      w: i % 2 ? "h-2 w-1" : "h-1.5 w-1.5",
    };
  }));
  return (
    <span aria-hidden="true" className="pointer-events-none absolute right-8 top-8 z-10">
      {ps.map((p, i) => (
        <i key={i} className={`nt-burst absolute block rounded-sm ${p.c} ${p.w}`} style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--r": `${p.rot}deg` }} />
      ))}
    </span>
  );
}

/* ───────────────────────── Tarjeta ───────────────────────── */
function Tarjeta({ p, i, d, t, q, modo, color, arrastrando, celebra, aterrizo, h }) {
  const pl = plazo(p);
  const fin = p.estado === "Finalizado";

  return (
    <article
      draggable
      role="button"
      tabIndex={0}
      aria-label={`Abrir proyecto ${p.titulo}`}
      onClick={() => h.abrir(p)}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) h.abrir(p); }}
      onDragStart={(e) => h.iniciar(e, p)}
      onDragEnd={h.terminar}
      onDragOver={(e) => h.sobreTarjeta(e, p)}
      onDrop={(e) => h.soltarTarjeta(e, p)}
      style={{ animationDelay: aterrizo ? "0ms" : `${Math.min(i, 8) * 45}ms` }}
      className={`${aterrizo ? "nt-land" : "nt-rise"} group relative cursor-grab rounded-lg border border-l-4 p-3 outline-none transition-[box-shadow,transform,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-sky-500/40 active:cursor-grabbing ${d ? color.cardD : color.card} ${
        arrastrando ? "scale-95 opacity-40" : `hover:-translate-y-0.5 ${d ? "hover:shadow-lg hover:shadow-black/40" : "hover:shadow-lg hover:shadow-slate-300/70"}`
      }`}
    >
      {celebra && <Confeti />}

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-bold leading-snug">{resaltar(p.titulo, q)}</h3>
        <button
          type="button"
          title="Eliminar"
          aria-label="Eliminar proyecto"
          onClick={(e) => { e.stopPropagation(); h.eliminar(p); }}
          className={`-mr-1.5 -mt-1 shrink-0 cursor-pointer rounded-full p-1.5 opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100 max-sm:hidden ${foco} ${t.icono} hover:!text-red-500`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${t.suave}`}>
        {modo === "alumno"
          ? <><Building2 size={12} className="shrink-0" /><span className="truncate">{resaltar(p.entidad || "Sin entidad", q)}</span></>
          : <><Avatar nombre={p.alumno} tam="h-5 w-5 text-[9px]" /><span className="truncate">{resaltar(p.alumno, q)}</span></>}
      </p>

      <div className={`mt-2.5 h-1 overflow-hidden rounded-full ${d ? "bg-white/10" : "bg-black/10"}`}>
        <div className={`nt-grow h-full rounded-full transition-all duration-700 ${fin ? "bg-emerald-500" : color.barra}`} style={{ width: `${p.avance}%` }} />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tonoClase(pl.tono, d, t)}`}>
          {fin ? <Check size={10} strokeWidth={3} className="nt-check" /> : <Clock size={10} />} {pl.texto}
        </span>
        <span className={`text-[11px] font-bold tabular-nums ${fin ? "text-emerald-500" : t.suave}`}>{p.avance}%</span>
      </div>
    </article>
  );
}

/* ───────────────────────── Editor ───────────────────────── */
function Editor({ inicial, d, t, onGuardar, onCerrar, onEliminar }) {
  const [m, setM] = useState(inicial);
  const [error, setError] = useState("");
  const [descartar, setDescartar] = useState(false);

  const sucio = JSON.stringify(m) !== JSON.stringify(inicial);
  const nuevo = inicial.id == null;

  const intentarCerrar = () => {
    if (sucio && !descartar) return setDescartar(true);
    onCerrar();
  };

  const guardar = () => {
    if (!m.titulo.trim() || !m.alumno.trim()) return setError("El título y el alumno son obligatorios.");
    onGuardar({ ...m, titulo: m.titulo.trim(), alumno: m.alumno.trim(), entidad: m.entidad.trim() });
  };

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") { e.preventDefault(); intentarCerrar(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); guardar(); }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  const cambiar = (c) => { setM({ ...m, ...c }); setError(""); };
  const elegirEstado = (id) => cambiar({ estado: id, avance: id === "Finalizado" ? 100 : m.avance });
  const est = ESTADOS.find((e) => e.id === m.estado);
  const pl = plazo(m);

  const campo = (k, etiqueta, extra = {}) => (
    <div>
      <label htmlFor={`pr-${k}`} className={`text-[11px] font-semibold ${t.suave}`}>{etiqueta}</label>
      <input id={`pr-${k}`} value={m[k]} onChange={(e) => cambiar({ [k]: e.target.value })} className={t.entrada} {...extra} />
    </div>
  );

  return (
    <div className="nt-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) intentarCerrar(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={nuevo ? "Nuevo proyecto" : "Editar proyecto"}
        className={`nt-pop flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl ${d ? "border-gray-700 bg-slate-900 text-gray-200" : "border-slate-200 bg-white text-slate-900"}`}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-500"><FolderKanban size={18} /></span>
            <h3 className="font-bold">{nuevo ? "Nuevo proyecto" : "Editar proyecto"}</h3>
          </div>
          <button type="button" onClick={intentarCerrar} aria-label="Cerrar" className={`cursor-pointer rounded-full p-2 transition ${foco} ${t.icono}`}><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {campo("titulo", "Título del proyecto", { autoFocus: true, placeholder: "Ej. Sistema web de inventario" })}
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("alumno", "Alumno", { placeholder: "Nombre completo" })}
            {campo("entidad", "Entidad (opcional)", { placeholder: "Dónde practica" })}
          </div>

          <div>
            <span className={`text-[11px] font-semibold ${t.suave}`}>Etapa</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5" role="group" aria-label="Etapa">
              {ESTADOS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={m.estado === e.id}
                  onClick={() => elegirEstado(e.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition duration-150 active:scale-95 ${foco} ${m.estado === e.id ? t.chipOn : t.chipOff}`}
                >
                  <i className={`h-2 w-2 rounded-full ${e.punto}`} /> {e.id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="pr-avance" className={`text-[11px] font-semibold ${t.suave}`}>Avance</label>
              <span className="text-lg font-extrabold tabular-nums">{m.avance}%</span>
            </div>
            <input id="pr-avance" type="range" min={0} max={100} step={5} value={m.avance} onChange={(e) => cambiar({ avance: Number(e.target.value) })} className="mt-1 w-full cursor-pointer accent-sky-500" />
            <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${t.pista}`}>
              <div className={`h-full rounded-full transition-all duration-300 ${est.punto}`} style={{ width: `${m.avance}%` }} />
            </div>
          </div>

          <div>
            <label htmlFor="pr-limite" className={`text-[11px] font-semibold ${t.suave}`}>Fecha límite</label>
            <div className="flex items-center gap-3">
              <input id="pr-limite" type="date" value={m.limite} onChange={(e) => cambiar({ limite: e.target.value })} className={`${t.entrada} !w-auto`} />
              {m.limite && <span className={`mt-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${tonoClase(pl.tono, d, t)}`}>{pl.texto}</span>}
            </div>
          </div>

          {error && <p role="alert" className="nt-rise text-xs font-medium text-red-500">{error}</p>}
          {descartar && (
            <p role="alert" className={`nt-rise rounded-lg px-3 py-2 text-xs font-medium ${d ? "bg-amber-950/60 text-amber-300" : "bg-amber-100 text-amber-800"}`}>
              Tienes cambios sin guardar. Pulsa Esc otra vez para descartarlos o guarda el proyecto.
            </p>
          )}
        </div>

        <div className={`flex items-center justify-between gap-3 border-t px-6 py-4 ${t.borde}`}>
          {!nuevo ? (
            <button type="button" onClick={onEliminar} className={`flex cursor-pointer items-center gap-1.5 rounded text-xs font-semibold text-red-500 hover:text-red-600 ${foco}`}><Trash2 size={13} /> Eliminar</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={intentarCerrar} className={`cursor-pointer rounded-full px-4 py-2 text-xs font-medium transition-colors ${foco} ${t.suave} hover:text-sky-500`}>Cancelar</button>
            <button type="button" onClick={guardar} className={`flex cursor-pointer items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600 active:scale-95 ${foco}`}>
              {nuevo ? "Crear proyecto" : "Guardar"}
              <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium sm:inline">Ctrl ↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Tablero por carriles ───────────────────────── */
const MODOS = [
  { v: "entidad", t: "Entidad" },
  { v: "alumno", t: "Alumno" },
  { v: "ninguno", t: "Sin agrupar" },
];

export default function Projects({ darkMode }) {
  const d = !!darkMode;
  const t = tokens(d);

  const [proyectos, setProyectos] = useState(cargar);
  const [modo, setModo] = useState(() => {
    try { const m = localStorage.getItem("proyectos_grupo"); return MODOS.some((x) => x.v === m) ? m : "entidad"; } catch { return "entidad"; }
  });
  const [busqueda, setBusqueda] = useState("");
  const [soloUrgentes, setSoloUrgentes] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [arrastre, setArrastre] = useState(null);
  const [sobre, setSobre] = useState(null);
  const [celebra, setCelebra] = useState(null);
  const [aterrizo, setAterrizo] = useState(null);
  const buscador = useRef(null);

  // Se guarda en este navegador. Para compartir proyectos hará falta tu API.
  useEffect(() => {
    try { localStorage.setItem("proyectos_app", JSON.stringify(proyectos)); } catch { /* ignorar */ }
  }, [proyectos]);

  useEffect(() => {
    try { localStorage.setItem("proyectos_grupo", modo); } catch { /* ignorar */ }
  }, [modo]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const alTeclear = (e) => {
      if (modal || escribiendo() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); buscador.current?.focus(); }
      else if (e.key.toLowerCase() === "n") { e.preventDefault(); nuevo("Por iniciar"); }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  /* ---------- Carriles ---------- */
  const agrupado = modo !== "ninguno";
  const colorKey = (p) => (modo === "alumno" ? p.alumno : (p.entidad || "").trim() || "Sin entidad");
  const clave = (p) => (agrupado ? colorKey(p) : "");

  // Cada entidad (o alumno) conserva siempre el mismo color
  const colores = useMemo(() => {
    const m = new Map();
    proyectos.forEach((p) => { const k = colorKey(p); if (!m.has(k)) m.set(k, COLORES[m.size % COLORES.length]); });
    return m;
  }, [proyectos, modo]);
  const colorDe = (p) => colores.get(colorKey(p)) || COLORES[0];

  /* ---------- Derivados ---------- */
  const esUrgente = (p) => p.estado !== "Finalizado" && diasHasta(p.limite) <= 7;

  const resumen = useMemo(() => {
    const porEstado = Object.fromEntries(ESTADOS.map((e) => [e.id, proyectos.filter((p) => p.estado === e.id).length]));
    const prom = proyectos.length ? Math.round(proyectos.reduce((s, p) => s + p.avance, 0) / proyectos.length) : 0;
    return { porEstado, prom, urgentes: proyectos.filter(esUrgente).length };
  }, [proyectos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return proyectos.filter((p) => {
      if (soloUrgentes && !esUrgente(p)) return false;
      return !q || `${p.titulo} ${p.alumno} ${p.entidad}`.toLowerCase().includes(q);
    });
  }, [proyectos, busqueda, soloUrgentes]);

  const hayFiltro = busqueda.trim() || soloUrgentes;

  const filas = [];
  if (!agrupado) filas.push("");
  else (hayFiltro ? visibles : proyectos).forEach((p) => { const k = clave(p); if (!filas.includes(k)) filas.push(k); });

  const arrastrado = arrastre != null ? proyectos.find((x) => x.id === arrastre) : null;
  const cabeEn = (k) => !!arrastrado && (!agrupado || clave(arrastrado) === k);

  /* ---------- Acciones ---------- */
  const celebrar = (id) => { setCelebra(id); setTimeout(() => setCelebra(null), 1300); };
  const aterrizar = (id) => { setAterrizo(id); setTimeout(() => setAterrizo(null), 650); };

  const mover = (id, estado, antesId) => {
    const p = proyectos.find((x) => x.id === id);
    if (!p || antesId === id) return;
    const sin = proyectos.filter((x) => x.id !== id);
    let pos = antesId != null ? sin.findIndex((x) => x.id === antesId) : -1;
    if (pos < 0) {
      let ultimo = -1;
      sin.forEach((x, i) => { if (x.estado === estado && clave(x) === clave(p)) ultimo = i; });
      pos = ultimo < 0 ? sin.length : ultimo + 1;
    }
    sin.splice(pos, 0, { ...p, estado, avance: estado === "Finalizado" ? 100 : p.avance });
    const anterior = proyectos;
    setProyectos(sin);
    aterrizar(id);
    if (p.estado !== estado) {
      setToast({ texto: `Movido a ${estado}`, deshacer: () => setProyectos(anterior) });
      if (estado === "Finalizado") celebrar(id);
    }
  };

  const eliminar = (p) => {
    const anterior = proyectos;
    setProyectos((prev) => prev.filter((x) => x.id !== p.id));
    setToast({ texto: "Proyecto eliminado", deshacer: () => setProyectos(anterior) });
  };

  const nuevo = (estado, extra = {}) =>
    setModal({ id: null, titulo: "", alumno: "", entidad: "", estado, avance: estado === "Finalizado" ? 100 : 0, limite: iso(14), ...extra });

  // Al agregar desde una celda, el proyecto nace en esa entidad (o con ese alumno) y esa etapa
  const nuevoEnCelda = (k, estado) => nuevo(estado, modo === "entidad" ? { entidad: k === "Sin entidad" ? "" : k } : modo === "alumno" ? { alumno: k } : {});

  const guardar = (datos) => {
    const anterior = proyectos;
    if (datos.id != null) {
      const previo = proyectos.find((x) => x.id === datos.id);
      setProyectos((prev) => prev.map((x) => (x.id === datos.id ? datos : x)));
      if (previo && previo.estado !== "Finalizado" && datos.estado === "Finalizado") celebrar(datos.id);
      setToast({ texto: "Cambios guardados", deshacer: () => setProyectos(anterior) });
    } else {
      setProyectos((prev) => [...prev, { ...datos, id: Date.now() }]);
      setToast({ texto: "Proyecto creado", deshacer: () => setProyectos(anterior) });
    }
    setModal(null);
  };

  /* ---------- Arrastrar y soltar (solo dentro del mismo carril) ---------- */
  const limpiar = () => { setArrastre(null); setSobre(null); };
  const h = {
    abrir: (p) => setModal({ ...p }),
    eliminar,
    iniciar: (e, p) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(p.id)); setArrastre(p.id); },
    terminar: limpiar,
    sobreTarjeta: (e, p) => {
      if (!cabeEn(clave(p))) return;
      e.preventDefault(); e.stopPropagation();
      const celda = `${clave(p)}|${p.estado}`;
      setSobre((s) => (s?.celda === celda && s.antes === p.id ? s : { celda, antes: p.id }));
    },
    soltarTarjeta: (e, p) => {
      if (!cabeEn(clave(p))) return;
      e.preventDefault(); e.stopPropagation();
      mover(arrastre, p.estado, p.id);
      limpiar();
    },
  };

  const tpl = { gridTemplateColumns: agrupado ? "3.5rem repeat(4, minmax(15rem, 1fr))" : "repeat(4, minmax(15rem, 1fr))" };
  const linea = d ? "border-gray-800" : "border-sky-200/70";

  return (
    <div className={`relative space-y-5 pb-20 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-sm ${d ? "text-gray-200" : "text-slate-900"}`}>
      <style>{ESTILOS}</style>

      {/* Encabezado */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-500"><FolderKanban size={20} /></span>
          <div>
            <h1 className="text-xl font-extrabold leading-tight tracking-tight">Proyectos</h1>
            <p className={`text-xs ${t.suave}`}>Cada fila es una {modo === "alumno" ? "persona" : "entidad"}. Arrastra un proyecto a otra etapa para actualizarlo.</p>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search size={14} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${t.suave}`} />
            <input
              ref={buscador}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar proyecto, alumno o entidad"
              aria-label="Buscar proyectos"
              className={`w-full rounded-full border py-2.5 pl-10 pr-9 text-xs outline-none transition-all focus:shadow-md focus:ring-2 focus:ring-sky-500/20 ${
                d ? "border-gray-800 bg-slate-800 placeholder:text-slate-500 focus:border-sky-500" : "border-transparent bg-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:bg-white"
              }`}
            />
            {busqueda ? (
              <button onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda" className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 ${t.suave} hover:text-sky-500`}><X size={13} /></button>
            ) : (
              <kbd className={`pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border px-1.5 text-[10px] sm:block ${t.borde} ${t.suave}`}>/</kbd>
            )}
          </div>
          <button onClick={() => nuevo("Por iniciar")} className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 font-semibold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600 active:scale-95 ${foco}`}>
            <Plus size={16} /> Nuevo proyecto
          </button>
        </div>
      </header>

      {/* Resumen */}
      <section aria-label="Resumen" className={`flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border px-5 py-4 ${t.panel}`}>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tabular-nums tracking-tight">{resumen.prom}%</span>
          <span className={`text-xs ${t.suave}`}>avance promedio<br />de {proyectos.length} {proyectos.length === 1 ? "proyecto" : "proyectos"}</span>
        </div>

        <div className="min-w-[14rem] flex-1">
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Proyectos por etapa">
            {ESTADOS.map((e) => (
              <span key={e.id} className={`${e.punto} rounded-full transition-all duration-700`} style={{ flexGrow: resumen.porEstado[e.id], flexBasis: 0, minWidth: resumen.porEstado[e.id] ? 6 : 0 }} />
            ))}
            {proyectos.length === 0 && <span className={`flex-1 rounded-full ${t.pista}`} />}
          </div>
          <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] ${t.suave}`}>
            {ESTADOS.map((e) => (
              <span key={e.id} className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${e.punto}`} /> {e.id} <b className={d ? "text-gray-200" : "text-slate-800"}>{resumen.porEstado[e.id]}</b></span>
            ))}
          </div>
        </div>

        <button
          onClick={() => setSoloUrgentes(!soloUrgentes)}
          aria-pressed={soloUrgentes}
          disabled={!resumen.urgentes && !soloUrgentes}
          className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition duration-150 active:scale-95 disabled:cursor-default disabled:opacity-50 ${foco} ${soloUrgentes ? t.chipOn : t.chipOff}`}
        >
          <Clock size={13} className={resumen.urgentes ? "text-amber-500" : ""} />
          {resumen.urgentes ? `${resumen.urgentes} por vencer` : "Nada por vencer"}
        </button>
      </section>

      {/* Agrupar por */}
      <div className="flex items-center gap-3">
        <span className={`text-xs ${t.suave}`}>Agrupar por</span>
        <div role="tablist" className={`relative grid grid-cols-3 rounded-full p-1 ${t.pista}`}>
          <span
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full shadow-sm transition-transform duration-300 ease-out ${d ? "bg-slate-950" : "bg-white"}`}
            style={{ transform: `translateX(${MODOS.findIndex((x) => x.v === modo) * 100}%)` }}
          />
          {MODOS.map((m) => (
            <button
              key={m.v}
              role="tab"
              aria-selected={modo === m.v}
              onClick={() => setModo(m.v)}
              className={`relative z-10 cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${foco} ${modo === m.v ? (d ? "text-white" : "text-slate-900") : `${t.suave} hover:text-sky-500`}`}
            >
              {m.t}
            </button>
          ))}
        </div>
      </div>

      {/* Tablero */}
      {proyectos.length === 0 ? (
        <div className="nt-rise px-6 py-16 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/10 text-sky-500"><FolderKanban size={24} /></span>
          <p className="text-sm font-semibold">Aún no hay proyectos</p>
          <p className={`mx-auto mt-1 max-w-sm text-xs ${t.suave}`}>Crea el primero y arrástralo por las etapas a medida que avance.</p>
          <button onClick={() => nuevo("Por iniciar")} className={`mt-4 cursor-pointer rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-white transition hover:bg-sky-600 ${foco}`}>Crear proyecto</button>
        </div>
      ) : hayFiltro && visibles.length === 0 ? (
        <div className="nt-rise px-6 py-16 text-center">
          <p className="text-sm font-semibold">Sin resultados</p>
          <p className={`mx-auto mt-1 max-w-sm text-xs ${t.suave}`}>Ningún proyecto coincide con tu búsqueda o filtro.</p>
          <button onClick={() => { setBusqueda(""); setSoloUrgentes(false); }} className={`mt-4 cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition ${foco} ${t.botonSec}`}>Limpiar filtros</button>
        </div>
      ) : (
        <div className={`nt-sin-barra overflow-x-auto rounded-2xl border ${linea} ${d ? "bg-slate-900/40" : "bg-white"}`}>
          <div style={{ minWidth: agrupado ? "63.5rem" : "60rem" }}>
            {/* Cabecera de etapas */}
            <div className="grid" style={tpl}>
              {agrupado && <div className={`border-r ${linea} ${d ? "bg-slate-900" : "bg-sky-50/80"}`} />}
              {ESTADOS.map((col, ci) => (
                <div key={col.id} className={`flex items-center gap-2 border-b-2 px-4 py-3 ${LINEAS[col.id]} ${ci < 3 ? `border-r ${linea}` : ""} ${d ? "bg-slate-900" : "bg-sky-50/80"}`}>
                  <i className={`h-2.5 w-2.5 rounded-full ${col.punto}`} />
                  <h2 className="text-[13px] font-extrabold">{col.id}</h2>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${d ? "bg-white/10" : "bg-white"} ${t.suave}`}>{visibles.filter((p) => p.estado === col.id).length}</span>
                </div>
              ))}
            </div>

            {/* Carriles */}
            {filas.map((k, ri) => {
              const delFila = visibles.filter((p) => clave(p) === k);
              const c = delFila[0] ? colorDe(delFila[0]) : COLORES[0];
              const permitida = cabeEn(k);
              return (
                <div key={`${modo}|${k}`} className="nt-rise grid" style={{ ...tpl, animationDelay: `${ri * 80}ms` }}>
                  {agrupado && (
                    <div className={`sticky left-0 z-10 flex flex-col items-center gap-2.5 border-r border-t px-1 py-3 ${linea} ${d ? c.etD : c.et}`}>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${d ? "bg-white/10" : "bg-white/70"}`}>{delFila.length}</span>
                      <span title={k} className="max-h-44 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-extrabold [writing-mode:vertical-rl] rotate-180">{k}</span>
                    </div>
                  )}

                  {ESTADOS.map((col, ci) => {
                    const celda = `${k}|${col.id}`;
                    const items = delFila.filter((p) => p.estado === col.id);
                    const activa = permitida && sobre?.celda === celda;
                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => {
                          if (!permitida) return;
                          e.preventDefault();
                          setSobre((s) => (s?.celda === celda && s.antes == null ? s : { celda, antes: null }));
                        }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setSobre(null); }}
                        onDrop={(e) => { if (!permitida) return; e.preventDefault(); mover(arrastre, col.id, null); limpiar(); }}
                        className={`group/celda relative flex flex-col gap-2.5 border-t p-3 transition-all duration-200 ${linea} ${ci < 3 ? "border-r" : ""} ${
                          arrastre != null && !permitida ? "opacity-40" : ""
                        } ${activa ? `ring-2 ring-inset ring-sky-500/70 ${d ? "bg-sky-500/10" : "bg-sky-50"}` : ""}`}
                      >
                        {items.map((p, i) => (
                          <div key={p.id}>
                            {activa && sobre.antes === p.id && arrastre !== p.id && <i className="nt-open mb-2.5 block h-1 rounded-full bg-sky-500" />}
                            <Tarjeta p={p} i={i + ri} d={d} t={t} q={busqueda} modo={modo} color={colorDe(p)} arrastrando={arrastre === p.id} celebra={celebra === p.id} aterrizo={aterrizo === p.id} h={h} />
                          </div>
                        ))}

                        {permitida ? (
                          <div className={`nt-open grid h-12 place-items-center rounded-lg border-2 border-dashed text-[11px] transition-colors ${
                            activa && sobre.antes == null ? "border-sky-500 bg-sky-500/10 text-sky-600" : `${d ? "border-gray-700" : "border-slate-300"} ${t.suave}`
                          }`}>
                            Suelta aquí
                          </div>
                        ) : arrastre == null && (
                          <button
                            type="button"
                            onClick={() => nuevoEnCelda(k, col.id)}
                            aria-label={`Agregar proyecto a ${col.id}${k ? ` en ${k}` : ""}`}
                            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-[11px] font-medium opacity-100 transition sm:opacity-0 sm:group-hover/celda:opacity-100 ${foco} ${
                              items.length ? "" : "min-h-[3.5rem]"
                            } ${d ? "border-gray-700 text-slate-400 hover:border-sky-500 hover:text-sky-400" : "border-slate-300 text-slate-400 hover:border-sky-500 hover:text-sky-600"}`}
                          >
                            <Plus size={13} /> Agregar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && (
        <div key={toast.texto} role="status" className={`nt-toast fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 overflow-hidden rounded-xl border px-4 py-2.5 shadow-2xl ${d ? "border-gray-700 bg-slate-800 text-gray-100" : "border-slate-800 bg-slate-900 text-white"}`}>
          <span className="font-medium">{toast.texto}</span>
          {toast.deshacer && (
            <button onClick={() => { toast.deshacer(); setToast(null); }} className="flex cursor-pointer items-center gap-1 font-semibold text-sky-400 hover:text-sky-300">
              <Undo2 size={13} /> Deshacer
            </button>
          )}
          <i className="nt-bar absolute bottom-0 left-0 h-0.5 w-full bg-sky-400" />
        </div>
      )}

      {modal && (
        <Editor
          key={modal.id ?? "nuevo"}
          inicial={modal}
          d={d}
          t={t}
          onGuardar={guardar}
          onCerrar={() => setModal(null)}
          onEliminar={() => { const p = proyectos.find((x) => x.id === modal.id); setModal(null); if (p) eliminar(p); }}
        />
      )}
    </div>
  );
}