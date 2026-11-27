import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Search, Trash2, X, Building2, Undo2, Check, FolderKanban, Clock, AlertCircle, RefreshCw } from "lucide-react";
import apiHttp, { invalidateApiCache } from "../../../api/axios.js";

/* ───────────────────────── Etapas y carriles ─────────────────────────
   El azul es el color del sistema: lo que está "en curso" es lo que más resalta. */
const ESTADOS = [
  { id: "Por iniciar", hex: "#94a3b8", punto: "bg-slate-400" },
  { id: "En curso", hex: "#2563eb", punto: "bg-blue-600" },
  { id: "En revisión", hex: "#f59e0b", punto: "bg-amber-500" },
  { id: "Finalizado", hex: "#10b981", punto: "bg-emerald-500" },
];
const CARRILES = ["#2563eb", "#7c3aed", "#10b981", "#f59e0b", "#e11d48", "#0891b2", "#ea580c"];
const AVATARES = ["bg-blue-600", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500"];

/* ───────────────────────── Conexión con la API ───────────────────────── */
const dePro = (r) => ({
  id: r.id_proyecto, titulo: r.titulo, alumno: r.alumno, entidad: r.entidad,
  idEstudiante: r.id_estudiante, idEmpresa: r.id_empresa, idUsuario: r.id_usuario,
  estado: r.estado, avance: Number(r.avance), limite: r.fecha_limite ? String(r.fecha_limite).slice(0, 10) : "",
});
const aPro = (m) => ({
  titulo: m.titulo, id_estudiante: Number(m.idEstudiante), id_empresa: Number(m.idEmpresa),
  estado: m.estado, avance: m.avance, fecha_limite: m.limite || null,
});
const obtenerErrorApi = (error) =>
  error?.response?.data?.message ||
  Object.values(error?.response?.data?.errors || {})[0]?.[0] ||
  error?.message ||
  "Error al conectar con el servidor";

const api = {
  listar: async () => {
    const { data } = await apiHttp.get("/proyectos");
    return (data.data || []).map(dePro);
  },
  opciones: async () => (await apiHttp.get("/proyectos/opciones")).data,
  crear: async (m) => {
    const { data } = await apiHttp.post("/proyectos", aPro(m));
    invalidateApiCache("/proyectos");
    return dePro(data);
  },
  editar: async (m) => {
    const { data } = await apiHttp.put(`/proyectos/${m.id}`, aPro(m));
    invalidateApiCache("/proyectos");
    return dePro(data);
  },
  mover: async (id, estado, posicion) => {
    const { data } = await apiHttp.patch(`/proyectos/${id}/estado`, { estado, posicion });
    invalidateApiCache("/proyectos");
    return dePro(data);
  },
  borrar: async (id) => {
    await apiHttp.delete(`/proyectos/${id}`);
    invalidateApiCache("/proyectos");
  },
};

/* ───────────────────────── Tema ───────────────────────── */
const tokens = (d) => ({
  borde: d ? "border-gray-800" : "border-slate-200",
  panel: d ? "border-gray-800 bg-slate-900" : "border-slate-200 bg-white",
  suave: d ? "text-slate-400" : "text-slate-500",
  pista: d ? "bg-slate-800" : "bg-slate-100",
  entrada: `mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-600/15 ${
    d ? "border-gray-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
  }`,
  icono: d ? "text-slate-400 hover:bg-white/10 hover:text-slate-100" : "text-slate-400 hover:bg-black/5 hover:text-slate-700",
  botonSec: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50",
  chipOff: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-50",
  chipOn: d ? "border-blue-500 bg-blue-500/10 text-blue-300" : "border-blue-600 bg-blue-50 text-blue-700",
});
const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40";

/* ───────────────────────── Animaciones (se apagan con "reducir movimiento") ───────────────────────── */
const ESTILOS = `
@keyframes pj-pop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes pj-fade{from{opacity:0}to{opacity:1}}
@keyframes pj-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pj-open{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:none}}
@keyframes pj-toast{from{opacity:0;transform:translate(-50%,18px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes pj-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes pj-land{0%{transform:scale(.9)}55%{transform:scale(1.045)}100%{transform:scale(1)}}
@keyframes pj-ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.6);opacity:0}}
@keyframes pj-burst{0%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r)) scale(.5)}}
.pj-pop{animation:pj-pop .26s cubic-bezier(.2,.8,.2,1) backwards}
.pj-fade{animation:pj-fade .2s ease-out backwards}
.pj-rise{animation:pj-rise .45s cubic-bezier(.2,.8,.2,1) backwards}
.pj-open{animation:pj-open .2s ease-out backwards}
.pj-toast{animation:pj-toast .3s cubic-bezier(.2,.8,.2,1) backwards}
.pj-bar{transform-origin:left;animation:pj-bar 4.5s linear forwards}
.pj-land{animation:pj-land .5s cubic-bezier(.2,.8,.2,1)}
.pj-ping{animation:pj-ping 1.8s ease-out infinite}
.pj-burst{animation:pj-burst .95s cubic-bezier(.2,.7,.3,1) forwards}
.pj-sin-barra{scrollbar-width:none}
.pj-sin-barra::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.pj-pop,.pj-fade,.pj-rise,.pj-open,.pj-toast,.pj-bar,.pj-land,.pj-ping,.pj-burst{animation:none!important}}
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
  if (!p.limite) return { texto: "Sin fecha límite", tono: "normal" };
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

const iniciales = (nombre = "") => {
  const p = nombre.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
};
const colorAvatar = (nombre = "") => AVATARES[[...nombre].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATARES.length];

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const resaltar = (texto, q) => {
  if (!q.trim() || !texto) return texto;
  return texto.split(new RegExp(`(${escapar(q.trim())})`, "gi")).map((x, i) =>
    x.toLowerCase() === q.trim().toLowerCase() ? <mark key={i} className="rounded bg-blue-600/25 px-0.5 text-inherit">{x}</mark> : x,
  );
};
const escribiendo = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");

/* Las barras y los anillos arrancan en 0 y crecen al aparecer; los números cuentan hasta su valor */
function useMontado() {
  const [m, setM] = useState(false);
  useEffect(() => { const id = setTimeout(() => setM(true), 60); return () => clearTimeout(id); }, []);
  return m;
}
function useContador(objetivo, dur = 800) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const ini = ref.current;
    const t0 = performance.now();
    let raf;
    const paso = (ahora) => {
      const k = Math.min(1, (ahora - t0) / dur);
      ref.current = ini + (objetivo - ini) * (1 - Math.pow(1 - k, 3));
      setV(ref.current);
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, dur]);
  return Math.round(v);
}
const Num = ({ valor, sufijo = "" }) => <>{useContador(valor)}{sufijo}</>;

/* ───────────────────────── Piezas pequeñas ───────────────────────── */
function Anillo({ pct, color, tam = 36, grosor = 4, pista = "text-slate-100", children }) {
  const m = useMontado();
  const r = (tam - grosor) / 2, C = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} className="-rotate-90" aria-hidden="true">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" strokeWidth={grosor} stroke="currentColor" className={pista} />
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeDasharray={C}
          strokeDashoffset={m ? C - (C * pct) / 100 : C} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[10px] font-bold tabular-nums">{children}</div>
    </div>
  );
}

function Avatar({ nombre, tam = "h-5 w-5 text-[9px]" }) {
  return <span className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${tam} ${colorAvatar(nombre)}`} aria-hidden="true">{iniciales(nombre)}</span>;
}

/* Ráfaga de confeti al terminar un proyecto */
function Confeti() {
  const [ps] = useState(() => Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
    const r = 50 + Math.random() * 50;
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r - 15, rot: Math.random() * 540 - 270, c: ["bg-emerald-400", "bg-blue-500", "bg-amber-400", "bg-rose-400", "bg-violet-400"][i % 5], w: i % 2 ? "h-2 w-1" : "h-1.5 w-1.5" };
  }));
  return (
    <span aria-hidden="true" className="pointer-events-none absolute right-8 top-8 z-10">
      {ps.map((p, i) => <i key={i} className={`pj-burst absolute block rounded-sm ${p.c} ${p.w}`} style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--r": `${p.rot}deg` }} />)}
    </span>
  );
}

/* ───────────────────────── Tarjeta ───────────────────────── */
function Tarjeta({ p, i, d, t, q, modo, carril, arrastrando, celebra, aterrizo, h }) {
  const pl = plazo(p);
  const fin = p.estado === "Finalizado";
  const tarde = pl.tono === "mal";
  const est = ESTADOS.find((e) => e.id === p.estado);

  const alTeclear = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter") h.abrir(p);
    else if (e.key === "ArrowRight") { e.preventDefault(); h.pasar(p, 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); h.pasar(p, -1); }
  };

  return (
    <article
      id={`pj-${p.id}`}
      draggable
      role="button"
      tabIndex={0}
      aria-label={`${p.titulo}. Enter para abrir, flechas izquierda y derecha para cambiar de etapa`}
      onClick={() => h.abrir(p)}
      onKeyDown={alTeclear}
      onDragStart={(e) => h.iniciar(e, p)}
      onDragEnd={h.terminar}
      onDragOver={(e) => h.sobreTarjeta(e, p)}
      onDrop={(e) => h.soltarTarjeta(e, p)}
      style={{ borderLeftColor: carril, animationDelay: aterrizo ? "0ms" : `${Math.min(i, 8) * 45}ms` }}
      className={`${aterrizo ? "pj-land" : "pj-rise"} group relative cursor-grab rounded-xl border border-l-4 p-3.5 outline-none transition-[box-shadow,transform,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-blue-600/40 active:cursor-grabbing ${
        d ? "border-gray-800 bg-slate-900" : "border-slate-200 bg-white"} ${tarde && !fin ? "ring-1 ring-red-500/40" : ""} ${
        arrastrando ? "scale-95 opacity-40" : `hover:-translate-y-0.5 ${d ? "hover:shadow-lg hover:shadow-black/40" : "hover:shadow-lg hover:shadow-blue-900/10"}`}`}
    >
      {celebra && <Confeti />}

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-bold leading-snug">{resaltar(p.titulo, q)}</h3>
        <button type="button" title="Eliminar" aria-label="Eliminar proyecto" onClick={(e) => { e.stopPropagation(); h.eliminar(p); }}
          className={`-mr-1.5 -mt-1 shrink-0 cursor-pointer rounded-full p-1.5 opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100 max-sm:hidden ${foco} ${t.icono} hover:!text-red-500`}>
          <Trash2 size={13} />
        </button>
      </div>

      <p className={`mt-2 flex items-center gap-1.5 text-[11px] ${t.suave}`}>
        {modo === "alumno"
          ? <><Building2 size={12} className="shrink-0" /><span className="truncate">{resaltar(p.entidad || "Sin entidad", q)}</span></>
          : <><Avatar nombre={p.alumno} /><span className="truncate">{resaltar(p.alumno, q)}</span></>}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${tonoClase(pl.tono, d, t)}`}>
          {fin ? <Check size={10} strokeWidth={3} /> : tarde ? (
            <span className="relative flex h-2 w-2"><i className="pj-ping absolute inset-0 rounded-full bg-red-500" /><i className="relative h-2 w-2 rounded-full bg-red-500" /></span>
          ) : <Clock size={10} />}
          <span className="truncate">{pl.texto}</span>
        </span>
        <Anillo pct={p.avance} color={est.hex} pista={d ? "text-slate-800" : "text-slate-100"}>{p.avance}</Anillo>
      </div>
    </article>
  );
}

/* ───────────────────────── Editor ───────────────────────── */
function Editor({ inicial, opciones, d, t, onGuardar, onCerrar, onEliminar }) {
  const [m, setM] = useState(inicial);
  const [error, setError] = useState("");
  const [descartar, setDescartar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const sucio = JSON.stringify(m) !== JSON.stringify(inicial);
  const nuevo = inicial.id == null;

  // Si el alumno o la entidad actual ya no está en la lista, se agrega para que no desaparezca
  const alumnos = opciones.estudiantes.some((a) => a.id === m.idEstudiante) || !m.idEstudiante ? opciones.estudiantes : [...opciones.estudiantes, { id: m.idEstudiante, nombre: inicial.alumno }];
  const entidades = opciones.empresas.some((e) => e.id === m.idEmpresa) || !m.idEmpresa ? opciones.empresas : [...opciones.empresas, { id: m.idEmpresa, nombre: inicial.entidad }];

  const intentarCerrar = () => {
    if (enviando) return;
    if (sucio && !descartar) return setDescartar(true);
    onCerrar();
  };

  const guardar = async () => {
    if (!m.titulo.trim()) return setError("Escribe el título del proyecto.");
    if (!m.idEstudiante) return setError("Elige el alumno.");
    if (!m.idEmpresa) return setError("Elige la entidad donde practica.");
    try {
      setEnviando(true);
      await onGuardar({ ...m, titulo: m.titulo.trim() });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
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

  return (
    <div className="pj-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) intentarCerrar(); }}>
      <div role="dialog" aria-modal="true" aria-label={nuevo ? "Nuevo proyecto" : "Editar proyecto"}
        className={`pj-pop flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl ${d ? "border-gray-700 bg-slate-900 text-gray-200" : "border-slate-200 bg-white text-slate-900"}`}>
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600/10 text-blue-600"><FolderKanban size={18} /></span>
            <h3 className="font-bold">{nuevo ? "Nuevo proyecto" : "Editar proyecto"}</h3>
          </div>
          <button type="button" onClick={intentarCerrar} aria-label="Cerrar" className={`cursor-pointer rounded-full p-2 transition ${foco} ${t.icono}`}><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="pr-titulo" className={`text-[11px] font-semibold ${t.suave}`}>Título del proyecto</label>
            <input id="pr-titulo" autoFocus value={m.titulo} onChange={(e) => cambiar({ titulo: e.target.value })} placeholder="Ej. Sistema web de inventario" className={t.entrada} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pr-alumno" className={`text-[11px] font-semibold ${t.suave}`}>Alumno</label>
              <select id="pr-alumno" value={m.idEstudiante} onChange={(e) => cambiar({ idEstudiante: e.target.value })} className={t.entrada}>
                <option value="">Elige un alumno</option>
                {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pr-entidad" className={`text-[11px] font-semibold ${t.suave}`}>Entidad</label>
              <select id="pr-entidad" value={m.idEmpresa} onChange={(e) => cambiar({ idEmpresa: e.target.value })} className={t.entrada}>
                <option value="">Elige una entidad</option>
                {entidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <span className={`text-[11px] font-semibold ${t.suave}`}>Etapa</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5" role="group" aria-label="Etapa">
              {ESTADOS.map((e) => (
                <button key={e.id} type="button" aria-pressed={m.estado === e.id} onClick={() => elegirEstado(e.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition duration-150 active:scale-95 ${foco} ${m.estado === e.id ? t.chipOn : t.chipOff}`}>
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
            <input id="pr-avance" type="range" min={0} max={100} step={5} value={m.avance} onChange={(e) => cambiar({ avance: Number(e.target.value) })} className="mt-1 w-full cursor-pointer accent-blue-600" />
            <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${t.pista}`}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${m.avance}%`, background: est.hex }} />
            </div>
          </div>

          <div>
            <label htmlFor="pr-limite" className={`text-[11px] font-semibold ${t.suave}`}>Fecha límite</label>
            <div className="flex items-center gap-3">
              <input id="pr-limite" type="date" value={m.limite} onChange={(e) => cambiar({ limite: e.target.value })} className={`${t.entrada} !w-auto`} />
              {m.limite && <span className={`mt-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${tonoClase(pl.tono, d, t)}`}>{pl.texto}</span>}
            </div>
          </div>

          {error && <p role="alert" className="pj-rise text-xs font-medium text-red-500">{error}</p>}
          {descartar && (
            <p role="alert" className={`pj-rise rounded-lg px-3 py-2 text-xs font-medium ${d ? "bg-amber-950/60 text-amber-300" : "bg-amber-100 text-amber-800"}`}>
              Tienes cambios sin guardar. Pulsa Esc otra vez para descartarlos o guarda el proyecto.
            </p>
          )}
        </div>

        <div className={`flex items-center justify-between gap-3 border-t px-6 py-4 ${t.borde}`}>
          {!nuevo ? (
            <button type="button" onClick={onEliminar} className={`flex cursor-pointer items-center gap-1.5 rounded text-xs font-semibold text-red-500 hover:text-red-600 ${foco}`}><Trash2 size={13} /> Eliminar</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={intentarCerrar} className={`cursor-pointer rounded-full px-4 py-2 text-xs font-medium transition-colors ${foco} ${t.suave} hover:text-blue-600`}>Cancelar</button>
            <button type="button" onClick={guardar} disabled={enviando}
              className={`flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-95 disabled:cursor-wait disabled:opacity-60 ${foco}`}>
              {enviando ? "Guardando..." : nuevo ? "Crear proyecto" : "Guardar"}
              {!enviando && <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium sm:inline">Ctrl ↵</kbd>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Tablero por carriles ───────────────────────── */
const MODOS = [{ v: "entidad", t: "Entidad" }, { v: "alumno", t: "Alumno" }, { v: "ninguno", t: "Sin agrupar" }];

export default function Projects({ darkMode }) {
  const d = !!darkMode;
  const t = tokens(d);

  const [proyectos, setProyectos] = useState([]);
  const [opciones, setOpciones] = useState({ estudiantes: [], empresas: [] });
  const [cargando, setCargando] = useState(true);
  const [falloCarga, setFalloCarga] = useState("");
  const [modo, setModo] = useState(() => {
    try { const m = localStorage.getItem("proyectos_grupo"); return MODOS.some((x) => x.v === m) ? m : "entidad"; } catch { return "entidad"; }
  });
  const [busqueda, setBusqueda] = useState("");
  const [soloUrgentes, setSoloUrgentes] = useState(false);
  const [enfoque, setEnfoque] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [arrastre, setArrastre] = useState(null);
  const [sobre, setSobre] = useState(null);
  const [celebra, setCelebra] = useState(null);
  const [aterrizo, setAterrizo] = useState(null);
  const buscador = useRef(null);

  const refrescar = async () => setProyectos(await api.listar());

  const cargarTodo = async () => {
    setCargando(true);
    setFalloCarga("");
    try {
      const [lista, op] = await Promise.all([api.listar(), api.opciones()]);
      setProyectos(lista);
      setOpciones(op);
    } catch (e) {
      setFalloCarga(obtenerErrorApi(e));
    }
    setCargando(false);
  };

  useEffect(() => { cargarTodo(); }, []);
  useEffect(() => { try { localStorage.setItem("proyectos_grupo", modo); } catch { /* ignorar */ } }, [modo]);
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
    proyectos.forEach((p) => { const k = colorKey(p); if (!m.has(k)) m.set(k, CARRILES[m.size % CARRILES.length]); });
    return m;
  }, [proyectos, modo]);
  const carrilDe = (p) => (agrupado ? colores.get(colorKey(p)) : ESTADOS.find((e) => e.id === p.estado).hex) || CARRILES[0];

  /* ---------- Derivados ---------- */
  const esUrgente = (p) => !!p.limite && p.estado !== "Finalizado" && diasHasta(p.limite) <= 7;

  const resumen = useMemo(() => {
    const porEstado = Object.fromEntries(ESTADOS.map((e) => [e.id, proyectos.filter((p) => p.estado === e.id).length]));
    const prom = proyectos.length ? Math.round(proyectos.reduce((s, p) => s + p.avance, 0) / proyectos.length) : 0;
    return { porEstado, prom, urgentes: proyectos.filter(esUrgente).length };
  }, [proyectos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return proyectos.filter((p) => (!soloUrgentes || esUrgente(p)) && (!q || `${p.titulo} ${p.alumno} ${p.entidad}`.toLowerCase().includes(q)));
  }, [proyectos, busqueda, soloUrgentes]);

  const hayFiltro = busqueda.trim() || soloUrgentes;
  const filas = [];
  if (!agrupado) filas.push("");
  else (hayFiltro ? visibles : proyectos).forEach((p) => { const k = clave(p); if (!filas.includes(k)) filas.push(k); });

  const arrastrado = arrastre != null ? proyectos.find((x) => x.id === arrastre) : null;
  const cabeEn = (k) => !!arrastrado && (!agrupado || clave(arrastrado) === k);

  /* ---------- Acciones (todas hablan con el servidor y se pueden deshacer) ---------- */
  const celebrar = (id) => { setCelebra(id); setTimeout(() => setCelebra(null), 1300); };
  const aterrizar = (id) => { setAterrizo(id); setTimeout(() => setAterrizo(null), 650); };
  const avisarError = (e) => setToast({ texto: e.message, error: true });
  const deshacerCon = (fn) => async () => { try { await fn(); } catch (e) { avisarError(e); } };

  const mover = async (id, estado, antesId) => {
    const p = proyectos.find((x) => x.id === id);
    if (!p || antesId === id) return;
    const anterior = proyectos;
    const posAnterior = anterior.filter((x) => x.estado === p.estado && x.idUsuario === p.idUsuario).findIndex((x) => x.id === id);

    const sin = proyectos.filter((x) => x.id !== id);
    let pos = antesId != null ? sin.findIndex((x) => x.id === antesId) : -1;
    if (pos < 0) {
      let ultimo = -1;
      sin.forEach((x, i) => { if (x.estado === estado && clave(x) === clave(p)) ultimo = i; });
      pos = ultimo < 0 ? sin.length : ultimo + 1;
    }
    sin.splice(pos, 0, { ...p, estado, avance: estado === "Finalizado" ? 100 : p.avance });
    const posicion = sin.filter((x) => x.estado === estado && x.idUsuario === p.idUsuario).findIndex((x) => x.id === id);

    setProyectos(sin);
    aterrizar(id);
    try {
      await api.mover(id, estado, posicion);
      if (p.estado !== estado) {
        setToast({ texto: `Movido a ${estado}`, deshacer: deshacerCon(async () => { await api.editar(p); await api.mover(id, p.estado, posAnterior); await refrescar(); }) });
        if (estado === "Finalizado") celebrar(id);
      }
    } catch (e) {
      setProyectos(anterior);
      avisarError(e);
    }
  };

  // Con el teclado: flechas izquierda y derecha cambian la etapa de la tarjeta enfocada
  const pasar = (p, dir) => {
    const i = ESTADOS.findIndex((e) => e.id === p.estado) + dir;
    if (i < 0 || i >= ESTADOS.length) return;
    mover(p.id, ESTADOS[i].id, null);
    requestAnimationFrame(() => setTimeout(() => document.getElementById(`pj-${p.id}`)?.focus(), 30));
  };

  const eliminar = async (p) => {
    const anterior = proyectos;
    setProyectos((prev) => prev.filter((x) => x.id !== p.id));
    try {
      await api.borrar(p.id);
      setToast({ texto: "Proyecto eliminado", deshacer: deshacerCon(async () => { await api.crear(p); await refrescar(); }) });
    } catch (e) {
      setProyectos(anterior);
      avisarError(e);
    }
  };

  const nuevo = (estado, extra = {}) =>
    setModal({ id: null, titulo: "", idEstudiante: "", idEmpresa: "", alumno: "", entidad: "", estado, avance: estado === "Finalizado" ? 100 : 0, limite: iso(14), ...extra });

  // Al agregar desde una celda, el proyecto nace en esa entidad (o con ese alumno) y esa etapa
  const nuevoEnCelda = (k, estado) => {
    const ref = proyectos.find((p) => colorKey(p) === k);
    nuevo(estado, modo === "entidad" ? { idEmpresa: ref?.idEmpresa ?? "", entidad: ref?.entidad ?? "" } : modo === "alumno" ? { idEstudiante: ref?.idEstudiante ?? "", alumno: ref?.alumno ?? "" } : {});
  };

  // Si algo falla, el error vuelve al formulario y no se cierra
  const guardar = async (datos) => {
    if (datos.id != null) {
      const previo = proyectos.find((x) => x.id === datos.id);
      const editado = await api.editar(datos);
      setProyectos((prev) => prev.map((x) => (x.id === editado.id ? editado : x)));
      if (previo && previo.estado !== "Finalizado" && editado.estado === "Finalizado") celebrar(editado.id);
      setToast({ texto: "Cambios guardados", deshacer: deshacerCon(async () => { await api.editar(previo); await refrescar(); }) });
    } else {
      const creado = await api.crear(datos);
      setProyectos((prev) => [...prev, creado]);
      setToast({ texto: "Proyecto creado", deshacer: deshacerCon(async () => { await api.borrar(creado.id); setProyectos((prev) => prev.filter((x) => x.id !== creado.id)); }) });
    }
    setModal(null);
  };

  /* ---------- Arrastrar y soltar (solo dentro del mismo carril) ---------- */
  const limpiar = () => { setArrastre(null); setSobre(null); };
  const h = {
    abrir: (p) => setModal({ ...p }),
    eliminar,
    pasar,
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
  const linea = d ? "border-gray-800" : "border-slate-200";
  const atenuar = (id) => (enfoque && enfoque !== id ? "opacity-35" : "");

  return (
    <div className={`relative space-y-5 pb-20 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-sm ${d ? "text-gray-200" : "text-slate-900"}`}>
      <style>{ESTILOS}</style>

      {/* Encabezado */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25"><FolderKanban size={21} /></span>
          <div>
            <h1 className="text-xl font-extrabold leading-tight tracking-tight">Proyectos</h1>
            <p className={`text-xs ${t.suave}`}>Cada fila es una {modo === "alumno" ? "persona" : "entidad"}. Arrastra un proyecto a otra etapa para actualizarlo.</p>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search size={14} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${t.suave}`} />
            <input ref={buscador} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar proyecto, alumno o entidad" aria-label="Buscar proyectos"
              className={`w-full rounded-full border py-2.5 pl-10 pr-9 text-xs outline-none transition-all focus:shadow-md focus:ring-2 focus:ring-blue-600/20 ${
                d ? "border-gray-800 bg-slate-800 placeholder:text-slate-500 focus:border-blue-500" : "border-transparent bg-slate-100 placeholder:text-slate-500 focus:border-blue-600 focus:bg-white"}`} />
            {busqueda ? (
              <button onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda" className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 ${t.suave} hover:text-blue-600`}><X size={13} /></button>
            ) : (
              <kbd className={`pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border px-1.5 text-[10px] sm:block ${t.borde} ${t.suave}`}>/</kbd>
            )}
          </div>
          <button onClick={() => nuevo("Por iniciar")} className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-md shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 active:scale-95 ${foco}`}>
            <Plus size={16} /> Nuevo proyecto
          </button>
        </div>
      </header>

      {falloCarga && (
        <div role="alert" className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${d ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
          <span className="flex items-center gap-2"><AlertCircle size={16} /> {falloCarga}</span>
          <button onClick={cargarTodo} className="flex cursor-pointer items-center gap-1.5 font-semibold hover:underline"><RefreshCw size={13} /> Reintentar</button>
        </div>
      )}

      {/* Resumen: pulsa una etapa para enfocarla */}
      <section aria-label="Resumen" className={`flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border px-5 py-4 ${t.panel}`}>
        <div className="flex items-center gap-4">
          <Anillo pct={resumen.prom} color="#2563eb" tam={64} grosor={7} pista={d ? "text-slate-800" : "text-slate-100"}>
            <span className="text-sm font-extrabold"><Num valor={resumen.prom} sufijo="%" /></span>
          </Anillo>
          <span className={`text-xs leading-snug ${t.suave}`}>avance promedio<br />de <b className={d ? "text-gray-200" : "text-slate-800"}>{proyectos.length}</b> {proyectos.length === 1 ? "proyecto" : "proyectos"}</span>
        </div>

        <div className="min-w-[14rem] flex-1">
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {proyectos.length === 0 && <span className={`flex-1 rounded-full ${t.pista}`} />}
            {ESTADOS.map((e) => (
              <button key={e.id} type="button" title={`${e.id}: ${resumen.porEstado[e.id]}`} aria-label={`Enfocar ${e.id}`} onClick={() => setEnfoque(enfoque === e.id ? null : e.id)}
                className={`${e.punto} cursor-pointer rounded-full transition-all duration-700 ${atenuar(e.id)}`} style={{ flexGrow: resumen.porEstado[e.id], flexBasis: 0, minWidth: resumen.porEstado[e.id] ? 8 : 0 }} />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {ESTADOS.map((e) => (
              <button key={e.id} type="button" aria-pressed={enfoque === e.id} onClick={() => setEnfoque(enfoque === e.id ? null : e.id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${foco} ${enfoque === e.id ? t.chipOn : `border-transparent ${t.suave} hover:text-blue-600`}`}>
                <i className={`h-2 w-2 rounded-full ${e.punto}`} /> {e.id} <b className={d ? "text-gray-200" : "text-slate-800"}>{resumen.porEstado[e.id]}</b>
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setSoloUrgentes(!soloUrgentes)} aria-pressed={soloUrgentes} disabled={!resumen.urgentes && !soloUrgentes}
          className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition duration-150 active:scale-95 disabled:cursor-default disabled:opacity-50 ${foco} ${soloUrgentes ? t.chipOn : t.chipOff}`}>
          <Clock size={13} className={resumen.urgentes ? "text-amber-500" : ""} />
          {resumen.urgentes ? `${resumen.urgentes} por vencer` : "Nada por vencer"}
        </button>
      </section>

      {/* Agrupar por */}
      <div className="flex items-center gap-3">
        <span className={`text-xs ${t.suave}`}>Agrupar por</span>
        <div role="tablist" className={`relative grid grid-cols-3 rounded-full p-1 ${t.pista}`}>
          <span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full shadow-sm transition-transform duration-300 ease-out ${d ? "bg-slate-950" : "bg-white"}`}
            style={{ transform: `translateX(${MODOS.findIndex((x) => x.v === modo) * 100}%)` }} />
          {MODOS.map((m) => (
            <button key={m.v} role="tab" aria-selected={modo === m.v} onClick={() => setModo(m.v)}
              className={`relative z-10 cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${foco} ${modo === m.v ? (d ? "text-white" : "text-slate-900") : `${t.suave} hover:text-blue-600`}`}>
              {m.t}
            </button>
          ))}
        </div>
      </div>

      {/* Tablero */}
      {cargando ? (
        <div className={`overflow-hidden rounded-2xl border ${linea}`} aria-busy="true" aria-label="Cargando proyectos">
          <div className="grid grid-cols-4">{ESTADOS.map((e) => <div key={e.id} className={`h-12 animate-pulse border-b ${linea} ${t.pista}`} />)}</div>
          <div className="grid grid-cols-4 gap-3 p-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ animationDelay: `${i * 120}ms` }} className={`h-24 animate-pulse rounded-xl ${t.pista}`} />)}
          </div>
        </div>
      ) : proyectos.length === 0 ? (
        <div className="pj-rise px-6 py-16 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600/10 text-blue-600"><FolderKanban size={24} /></span>
          <p className="text-sm font-semibold">Aún no hay proyectos</p>
          <p className={`mx-auto mt-1 max-w-sm text-xs ${t.suave}`}>Crea el primero y arrástralo por las etapas a medida que avance.</p>
          <button onClick={() => nuevo("Por iniciar")} className={`mt-4 cursor-pointer rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 ${foco}`}>Crear proyecto</button>
        </div>
      ) : hayFiltro && visibles.length === 0 ? (
        <div className="pj-rise px-6 py-16 text-center">
          <p className="text-sm font-semibold">Sin resultados</p>
          <p className={`mx-auto mt-1 max-w-sm text-xs ${t.suave}`}>Ningún proyecto coincide con tu búsqueda o filtro.</p>
          <button onClick={() => { setBusqueda(""); setSoloUrgentes(false); }} className={`mt-4 cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition ${foco} ${t.botonSec}`}>Limpiar filtros</button>
        </div>
      ) : (
        <div className={`pj-sin-barra overflow-x-auto rounded-2xl border ${linea} ${d ? "bg-slate-900/40" : "bg-white"}`}>
          <div style={{ minWidth: agrupado ? "63.5rem" : "60rem" }}>
            {/* Cabecera de etapas */}
            <div className="grid" style={tpl}>
              {agrupado && <div className={`border-r ${linea} ${d ? "bg-slate-900" : "bg-slate-50"}`} />}
              {ESTADOS.map((col, ci) => (
                <div key={col.id} style={{ borderTopColor: col.hex }} className={`flex items-center gap-2 border-t-[3px] px-4 py-3 transition-opacity duration-300 ${ci < 3 ? `border-r ${linea}` : ""} ${d ? "bg-slate-900" : "bg-slate-50"} ${atenuar(col.id)}`}>
                  <i className={`h-2.5 w-2.5 rounded-full ${col.punto}`} />
                  <h2 className="text-[13px] font-extrabold">{col.id}</h2>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${d ? "bg-white/10" : "bg-white shadow-sm"} ${t.suave}`}>{visibles.filter((p) => p.estado === col.id).length}</span>
                </div>
              ))}
            </div>

            {/* Carriles */}
            {filas.map((k, ri) => {
              const delFila = visibles.filter((p) => clave(p) === k);
              const hex = agrupado ? colores.get(k) || CARRILES[0] : "#2563eb";
              const permitida = cabeEn(k);
              return (
                <div key={`${modo}|${k}`} className="pj-rise grid" style={{ ...tpl, animationDelay: `${ri * 80}ms` }}>
                  {agrupado && (
                    <div className={`sticky left-0 z-10 flex flex-col items-center gap-2.5 border-r border-t px-1 py-3 ${linea} ${d ? "bg-slate-900" : "bg-white"}`} style={{ boxShadow: `inset 4px 0 0 ${hex}` }}>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white" style={{ background: hex }}>{delFila.length}</span>
                      <span title={k} className="max-h-44 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-extrabold [writing-mode:vertical-rl] rotate-180">{k}</span>
                    </div>
                  )}

                  {ESTADOS.map((col, ci) => {
                    const celda = `${k}|${col.id}`;
                    const items = delFila.filter((p) => p.estado === col.id);
                    const activa = permitida && sobre?.celda === celda;
                    return (
                      <div key={col.id}
                        onDragOver={(e) => { if (!permitida) return; e.preventDefault(); setSobre((s) => (s?.celda === celda && s.antes == null ? s : { celda, antes: null })); }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setSobre(null); }}
                        onDrop={(e) => { if (!permitida) return; e.preventDefault(); mover(arrastre, col.id, null); limpiar(); }}
                        className={`group/celda relative flex flex-col gap-2.5 border-t p-3 transition-all duration-200 ${linea} ${ci < 3 ? "border-r" : ""} ${atenuar(col.id)} ${arrastre != null && !permitida ? "opacity-40" : ""} ${
                          activa ? `ring-2 ring-inset ring-blue-600/70 ${d ? "bg-blue-500/10" : "bg-blue-50/70"}` : ""}`}>
                        {items.map((p, i) => (
                          <div key={p.id}>
                            {activa && sobre.antes === p.id && arrastre !== p.id && <i className="pj-open mb-2.5 block h-1 rounded-full bg-blue-600" />}
                            <Tarjeta p={p} i={i + ri} d={d} t={t} q={busqueda} modo={modo} carril={carrilDe(p)} arrastrando={arrastre === p.id} celebra={celebra === p.id} aterrizo={aterrizo === p.id} h={h} />
                          </div>
                        ))}

                        {permitida ? (
                          <div className={`pj-open grid h-12 place-items-center rounded-xl border-2 border-dashed text-[11px] font-medium transition-colors ${
                            activa && sobre.antes == null ? "border-blue-600 bg-blue-600/10 text-blue-600" : `${d ? "border-gray-700" : "border-slate-300"} ${t.suave}`}`}>
                            Suelta aquí para pasar a {col.id}
                          </div>
                        ) : arrastre == null && (
                          <button type="button" onClick={() => nuevoEnCelda(k, col.id)} aria-label={`Agregar proyecto a ${col.id}${k ? ` en ${k}` : ""}`}
                            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-[11px] font-medium transition sm:opacity-0 sm:group-hover/celda:opacity-100 ${foco} ${items.length ? "" : "min-h-[3.5rem]"} ${
                              d ? "border-gray-700 text-slate-400 hover:border-blue-500 hover:text-blue-400" : "border-slate-300 text-slate-400 hover:border-blue-600 hover:text-blue-600"}`}>
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

      {/* Atajos */}
      {!cargando && proyectos.length > 0 && (
        <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] ${t.suave}`}>
          {[["N", "nuevo proyecto"], ["/", "buscar"], ["← →", "mover la tarjeta enfocada"], ["Esc", "cerrar"]].map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5"><kbd className={`rounded border px-1.5 py-0.5 text-[10px] ${t.borde}`}>{k}</kbd> {v}</span>
          ))}
        </p>
      )}

      {toast && (
        <div key={toast.texto} role="status" className={`pj-toast fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 overflow-hidden rounded-xl border px-4 py-2.5 shadow-2xl ${
          toast.error ? "border-red-500/40 bg-red-600 text-white" : d ? "border-gray-700 bg-slate-800 text-gray-100" : "border-slate-800 bg-slate-900 text-white"}`}>
          <span className="font-medium">{toast.texto}</span>
          {toast.deshacer && (
            <button onClick={() => { toast.deshacer(); setToast(null); }} className="flex cursor-pointer items-center gap-1 font-semibold text-blue-400 hover:text-blue-300"><Undo2 size={13} /> Deshacer</button>
          )}
          <i className={`pj-bar absolute bottom-0 left-0 h-0.5 w-full ${toast.error ? "bg-white/60" : "bg-blue-400"}`} />
        </div>
      )}

      {modal && (
        <Editor key={modal.id ?? "nuevo"} inicial={modal} opciones={opciones} d={d} t={t} onGuardar={guardar} onCerrar={() => setModal(null)}
          onEliminar={() => { const p = proyectos.find((x) => x.id === modal.id); setModal(null); if (p) eliminar(p); }} />
      )}
    </div>
  );
}