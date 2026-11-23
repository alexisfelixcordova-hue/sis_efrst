import { useState, useEffect, useRef } from "react";
import {
  Mail, Phone, MapPin, Search, UserPlus, ArrowLeft, GraduationCap, LayoutGrid, Table2, FolderOpen,
  Users, Clock, CheckCircle2, AlertCircle, Building2, Percent, Armchair,
} from "lucide-react";

const API = "http://localhost:8000/api"; // mismo valor que en App.jsx
const CAPACIDAD = 12;
const HORAS_TOTALES = 480;

const estados = {
  "Al día": { texto: "text-emerald-600", punto: "bg-emerald-500", hex: "#10b981" },
  "Revisión pendiente": { texto: "text-amber-600", punto: "bg-amber-500", hex: "#f59e0b" },
  Observado: { texto: "text-red-600", punto: "bg-red-500", hex: "#ef4444" },
  Completado: { texto: "text-blue-600", punto: "bg-blue-600", hex: "#2563eb" },
};
const estadoDe = (e) => estados[e] ?? { texto: "text-slate-500", punto: "bg-slate-400", hex: "#94a3b8" };

const filtros = [
  { id: "todos", label: "Todos" },
  { id: "progreso", label: "En progreso", lista: ["Al día", "Observado"] },
  { id: "pendientes", label: "Pendientes", lista: ["Revisión pendiente"] },
  { id: "completados", label: "Completados", lista: ["Completado"] },
];
const pestanas = [
  { id: "acerca", label: "Acerca de" },
  { id: "alumnos", label: "Alumnos" },
  { id: "analitica", label: "Analítica" },
  { id: "actividad", label: "Actividad" },
];

const iniciales = (n = "") => n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
const porcentaje = (hrs) => Math.min(100, Math.round((hrs / HORAS_TOTALES) * 100));

const tokens = (d) => ({
  texto: d ? "text-gray-200" : "text-slate-900",
  suave: d ? "text-slate-400" : "text-slate-500",
  tarjeta: d ? "rounded-2xl border border-gray-800 bg-slate-900" : "rounded-2xl border border-slate-200 bg-white",
  borde: d ? "border-gray-800" : "border-slate-200",
  divisor: d ? "divide-gray-800" : "divide-slate-100",
  fila: d ? "hover:bg-slate-800/50" : "hover:bg-blue-50/40",
  pista: d ? "bg-slate-800" : "bg-slate-100",
  entrada: d ? "border-gray-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600",
  boton: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50",
  chipOn: d ? "border-blue-500 bg-blue-500/10 text-blue-300" : "border-blue-600 bg-blue-50 text-blue-700",
  avatar: d ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600",
});

const ESTILOS = `
@keyframes fd-up { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
@keyframes fd-fade { from { opacity:0;} to { opacity:1;} }
@keyframes fd-pop { 0% { opacity:0; transform:scale(.85);} 70% { transform:scale(1.05);} 100% { opacity:1; transform:scale(1);} }
@keyframes fd-float { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-6px);} }
@keyframes fd-spin { to { transform:rotate(360deg);} }
@keyframes fd-sk { 0% { opacity:.5;} 50% { opacity:1;} 100% { opacity:.5;} }
.fd-up { animation: fd-up .5s cubic-bezier(.22,1,.36,1) both; }
.fd-fade { animation: fd-fade .45s ease both; }
.fd-pop { animation: fd-pop .45s cubic-bezier(.22,1,.36,1) both; }
.fd-float { animation: fd-float 7s ease-in-out infinite; }
.fd-spin { animation: fd-spin 60s linear infinite; }
.fd-sk { animation: fd-sk 1.4s ease-in-out infinite; }
.fd-lift { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.fd-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -12px rgba(15,23,42,.25); }
@media (prefers-reduced-motion: reduce) { .fd-up,.fd-fade,.fd-pop,.fd-float,.fd-spin,.fd-sk { animation:none !important; } .fd-lift:hover { transform:none; } }
`;

/* Las barras y la dona arrancan en 0 y crecen al aparecer */
function useMontado() {
  const [m, setM] = useState(false);
  useEffect(() => { const id = setTimeout(() => setM(true), 40); return () => clearTimeout(id); }, []);
  return m;
}

/* Contador animado */
function useContador(objetivo, dur = 900) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const ini = ref.current;
    let raf;
    const t0 = performance.now();
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const val = ini + (objetivo - ini) * e;
      ref.current = val;
      setV(val);
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, dur]);
  return Math.round(v);
}
const Num = ({ valor, sufijo = "" }) => <>{useContador(valor)}{sufijo}</>;

/* Horas en 10 tramos: se lee de un vistazo cuánto falta */
function Tramos({ pct, color, pista }) {
  const m = useMontado();
  const llenos = Math.round(pct / 10);
  return (
    <div className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={`h-2 flex-1 rounded-[3px] ${pista}`}>
          <span
            className="block h-2 rounded-[3px]"
            style={{ background: color, opacity: m && i < llenos ? 1 : 0, transform: m && i < llenos ? "scaleY(1)" : "scaleY(.3)", transition: `opacity .35s ease ${i * 45}ms, transform .35s ease ${i * 45}ms` }}
          />
        </span>
      ))}
    </div>
  );
}

function Barra({ pct, color = "#2563eb", pista }) {
  const m = useMontado();
  return (
    <div className={`h-2 rounded-full ${pista}`}>
      <div className="h-2 rounded-full" style={{ width: `${m ? pct : 0}%`, background: color, transition: "width .8s ease" }} />
    </div>
  );
}

function Anillo({ pct, color = "#2563eb", tam = 44, grosor = 5, pista = "text-slate-100", children }) {
  const m = useMontado();
  const r = (tam - grosor) / 2, C = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} className="-rotate-90">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" strokeWidth={grosor} stroke="currentColor" className={pista} />
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={m ? C - (C * pct) / 100 : C} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[10px] font-bold">{children}</div>
    </div>
  );
}

function Dona({ segmentos, pista, total: totalAlumnos }) {
  const m = useMontado();
  const r = 40, C = 2 * Math.PI * r;
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  let acum = 0;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label="Alumnos por estado">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="14" className={pista} stroke="currentColor" />
        {segmentos.map((s) => {
          const largo = (s.valor / total) * C;
          const off = -acum;
          acum += largo;
          return <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${m ? Math.max(0, largo - 1.5) : 0} ${C}`} strokeDashoffset={off} style={{ transition: "stroke-dasharray .9s ease" }} />;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <span><b className="block text-2xl font-extrabold leading-none tabular-nums">{totalAlumnos}</b><span className="text-[10px] opacity-60">alumnos</span></span>
      </div>
    </div>
  );
}

/* Fila "etiqueta / valor" para las secciones de información */
function Dato({ etiqueta, valor, t }) {
  return (
    <div className="min-w-0">
      <dt className={`text-[11px] ${t.suave}`}>{etiqueta}</dt>
      <dd className="mt-0.5 break-words text-[13px] font-medium">{valor || <span className={`font-normal ${t.suave}`}>No registrado</span>}</dd>
    </div>
  );
}

const Titulo = ({ children, detalle, t }) => (
  <div className="flex items-center gap-2.5">
    <span className="h-4 w-1 rounded-full bg-blue-600" />
    <h2 className="text-sm font-bold">{children}</h2>
    {detalle && <span className={`text-[11px] ${t.suave}`}>{detalle}</span>}
  </div>
);

/* ---------- Vista ---------- */
export default function FichaDocente({ docente, onVolver, darkMode }) {
  const d = !!darkMode;
  const t = tokens(d);

  const idDocente = docente?.id_usuario ?? docente?.id;
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState("alumnos");
  const [filtro, setFiltro] = useState("todos");
  const [vista, setVista] = useState("tabla");
  const [busqueda, setBusqueda] = useState("");

  const cargarFicha = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API}/docentes/${idDocente}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Error ${res.status} al cargar la ficha`);
      setFicha(data);
    } catch (e) {
      setError(e.message);
    }
    setCargando(false);
  };

  // Solo depende del id (un número), así que no se repite en cada render
  useEffect(() => {
    if (idDocente) cargarFicha();
    else { setError("No hay un docente seleccionado"); setCargando(false); }
  }, [idDocente]);

  const doc = ficha?.docente ?? {};
  const alumnos = (ficha?.alumnos ?? []).map((a) => ({ ...a, hrs: Number(a.hrs) || 0 }));
  const otrosDocentes = ficha?.otrosDocentes ?? [];
  const actividad = ficha?.actividad ?? [];
  const entidades = [...new Set(alumnos.map((a) => a.entidad).filter(Boolean))];

  const actual = filtros.find((f) => f.id === filtro);
  const visibles = alumnos.filter((a) => (!actual.lista || actual.lista.includes(a.estado)) && `${a.nombre} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase()));

  // Analítica
  const horasTotales = alumnos.reduce((s, a) => s + a.hrs, 0);
  const promedio = alumnos.length ? Math.round(alumnos.reduce((s, a) => s + porcentaje(a.hrs), 0) / alumnos.length) : 0;
  const enRiesgo = alumnos.filter((a) => a.estado === "Observado" || porcentaje(a.hrs) < 40).length;
  const listaRiesgo = alumnos.filter((a) => a.estado === "Observado" || porcentaje(a.hrs) < 40);
  const completados = alumnos.filter((a) => a.estado === "Completado").length;
  const segmentos = [...new Set(alumnos.map((a) => a.estado))].map((e) => ({ label: e, color: estadoDe(e).hex, valor: alumnos.filter((a) => a.estado === e).length }));
  const tramosAvance = [
    ["0–25%", (p) => p <= 25],
    ["26–50%", (p) => p > 25 && p <= 50],
    ["51–75%", (p) => p > 50 && p <= 75],
    ["76–100%", (p) => p > 75],
  ].map(([label, fn]) => ({ label, n: alumnos.filter((a) => fn(porcentaje(a.hrs))).length }));
  const maxTramo = Math.max(1, ...tramosAvance.map((x) => x.n));

  const cupos = Math.max(0, CAPACIDAD - alumnos.length);
  const idxSeccion = Math.max(0, pestanas.findIndex((p) => p.id === seccion));

  if (cargando) {
    return (
      <div className={`space-y-4 text-xs ${t.texto}`}>
        <style>{ESTILOS}</style>
        <div className={`fd-sk h-48 rounded-2xl ${d ? "bg-slate-800" : "bg-slate-200"}`} />
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className={`fd-sk h-24 rounded-2xl ${d ? "bg-slate-800" : "bg-slate-100"}`} style={{ animationDelay: `${i * 120}ms` }} />)}
        </div>
        <p className={`text-center ${t.suave}`}>Cargando ficha del docente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 p-6 text-xs">
        <p className="text-red-600">{error}</p>
        <div className="flex gap-2">
          {idDocente && <button onClick={cargarFicha} className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white">Reintentar</button>}
          {onVolver && <button onClick={onVolver} className={`rounded-lg border px-3 py-1.5 ${t.boton}`}>Volver</button>}
        </div>
      </div>
    );
  }

  const stats = [
    { l: "Alumnos a cargo", v: alumnos.length, suf: "", ic: Users, color: "#2563eb", nota: `de ${CAPACIDAD} cupos` },
    { l: "Cupos libres", v: cupos, suf: "", ic: Armchair, color: "#0891b2", nota: cupos === 0 ? "Capacidad completa" : "Disponibles" },
    { l: "Avance promedio", v: promedio, suf: "%", ic: Percent, color: "#7c3aed", nota: `${horasTotales} h acumuladas` },
    { l: "En riesgo", v: enRiesgo, suf: "", ic: AlertCircle, color: enRiesgo ? "#ef4444" : "#10b981", nota: enRiesgo ? "Requieren atención" : "Todo en orden" },
  ];

  return (
    <div className={`space-y-5 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-xs ${t.texto}`}>
      <style>{ESTILOS}</style>

      {onVolver && (
        <button onClick={onVolver} className={`group flex cursor-pointer items-center gap-1.5 hover:text-blue-600 ${t.suave}`}>
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" /> Plantel docente
        </button>
      )}

      {/* Portada: bloque azul plano con formas geométricas */}
      <section className="fd-up relative overflow-hidden rounded-3xl bg-blue-600 px-6 pb-16 pt-7 text-white md:px-8">
        <svg className="pointer-events-none absolute -right-16 -top-24 h-[360px] w-[360px] fd-spin text-white" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeOpacity=".18" aria-hidden="true">
          {[90, 70, 50, 30].map((r) => <circle key={r} cx="100" cy="100" r={r} strokeDasharray={r % 20 === 10 ? "3 5" : undefined} />)}
          <line x1="100" y1="5" x2="100" y2="195" /><line x1="5" y1="100" x2="195" y2="100" />
        </svg>
        <span className="fd-float pointer-events-none absolute bottom-8 right-[22%] hidden h-14 w-14 rounded-2xl border-2 border-white/25 md:block" />
        <span className="pointer-events-none absolute -bottom-10 left-[38%] h-28 w-28 rounded-full bg-blue-500/60" />

        <div className="relative flex flex-wrap items-center gap-5">
          <div className="relative">
            <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-3xl bg-blue-900/40" />
            <div className="fd-pop relative grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-white text-3xl font-extrabold text-blue-600">
              {doc.avatar ? <img src={doc.avatar} alt={doc.nombre} className="h-full w-full object-cover" /> : iniciales(doc.nombre)}
            </div>
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Asesor de EFSRT{doc.codigo ? ` · ${doc.codigo}` : ""}
            </span>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">{doc.nombre}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-blue-100">
              {doc.cargo && <span className="font-medium text-white">{doc.cargo}</span>}
              <span className="flex items-center gap-1.5"><GraduationCap size={13} /> IESTP "Andrés Avelino Cáceres Dorregaray"</span>
            </p>
          </div>
        </div>
      </section>

      {/* Tarjetas de resumen que se montan sobre la portada */}
      <div className="relative z-10 -mt-14 grid gap-3 px-3 sm:grid-cols-2 lg:grid-cols-4 md:px-5">
        {stats.map((s, i) => (
          <div key={s.l} style={{ animationDelay: `${0.1 + i * 0.07}s` }} className={`fd-up fd-lift ${t.tarjeta} p-4 shadow-sm`}>
            <div className="flex items-start justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${s.color}1a`, color: s.color }}><s.ic size={17} /></span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
            </div>
            <p className="mt-3 text-3xl font-extrabold leading-none tabular-nums"><Num valor={s.v} sufijo={s.suf} /></p>
            <p className="mt-1.5 text-[12px] font-semibold">{s.l}</p>
            <p className={`text-[11px] ${t.suave}`}>{s.nota}</p>
          </div>
        ))}
      </div>

      {/* Capacidad: 12 asientos, los ocupados en azul */}
      <div className={`fd-up ${t.tarjeta} flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5`} style={{ animationDelay: ".3s" }}>
        <span className="font-semibold">Capacidad de asesoría</span>
        <div className="flex flex-1 gap-1.5" style={{ minWidth: 200 }} aria-label={`${alumnos.length} de ${CAPACIDAD} cupos ocupados`}>
          {Array.from({ length: CAPACIDAD }).map((_, i) => (
            <span key={i} className={`h-3 flex-1 rounded ${i < alumnos.length ? "bg-blue-600" : t.pista}`} style={{ animation: `fd-pop .4s ease ${0.35 + i * 0.04}s both` }} />
          ))}
        </div>
        <span className={t.suave}><b className={t.texto}>{alumnos.length}</b> / {CAPACIDAD}</span>
      </div>

      {/* Pestañas: control segmentado con indicador deslizante */}
      <nav className={`relative grid max-w-xl grid-cols-4 rounded-xl border p-1 ${t.borde} ${d ? "bg-slate-900" : "bg-white"}`} aria-label="Secciones">
        <span className="absolute inset-y-1 left-1 w-[calc(25%-2px)] rounded-lg bg-blue-600 transition-transform duration-300 ease-out" style={{ transform: `translateX(${idxSeccion * 100}%)` }} />
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setSeccion(p.id)}
            aria-current={seccion === p.id ? "page" : undefined}
            className={`relative z-10 cursor-pointer rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${seccion === p.id ? "text-white" : `${t.suave} hover:text-blue-600`}`}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div key={seccion} className="fd-up">
        {/* ACERCA DE */}
        {seccion === "acerca" && (
          <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
            <aside className={t.tarjeta}>
              <div className={`border-b px-5 py-4 ${t.borde}`}><Titulo t={t}>Datos del docente</Titulo></div>
              <dl className={`divide-y px-5 ${t.divisor}`}>
                {[["Cargo", doc.cargo], ["Departamento", doc.departamento], ["Grado académico", doc.grado], ["Especialidad", doc.especialidad], ["DNI", doc.dni], ["Código docente", doc.codigo]].map(([k, v]) => (
                  <div key={k} className="py-3"><Dato etiqueta={k} valor={v} t={t} /></div>
                ))}
              </dl>
            </aside>

            <section className={`${t.tarjeta} divide-y ${t.divisor}`}>
              <div className="p-5">
                <div className="mb-4"><Titulo t={t}>Contacto</Titulo></div>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Dato etiqueta="Correo electrónico" valor={doc.correo && <span className="flex items-center gap-2"><Mail size={13} className="text-blue-600" /> {doc.correo}</span>} t={t} />
                  <Dato etiqueta="Teléfono" valor={doc.telefono && <span className="flex items-center gap-2"><Phone size={13} className="text-blue-600" /> {doc.telefono}</span>} t={t} />
                  {doc.sede && <Dato etiqueta="Sede" valor={<span className="flex items-center gap-2"><MapPin size={13} className="text-blue-600" /> {doc.sede}</span>} t={t} />}
                </dl>
              </div>

              {doc.biografia && (
                <div className="p-5">
                  <div className="mb-3"><Titulo t={t}>Presentación</Titulo></div>
                  <p className={`border-l-2 border-blue-600 pl-4 text-[13px] leading-relaxed ${d ? "text-slate-300" : "text-slate-600"}`}>{doc.biografia}</p>
                </div>
              )}

              {(doc.especialidades ?? []).length > 0 && (
                <div className="p-5">
                  <div className="mb-3"><Titulo t={t}>Áreas de especialización</Titulo></div>
                  <div className="flex flex-wrap gap-2">
                    {doc.especialidades.map((e) => <span key={e} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${d ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"}`}>{e}</span>)}
                  </div>
                </div>
              )}

              {(ficha?.horario ?? []).length > 0 && (
                <div className="p-5">
                  <div className="mb-3"><Titulo t={t}>Horario de atención</Titulo></div>
                  <ul className="space-y-2">
                    {ficha.horario.map(([dia, hora]) => (
                      <li key={dia} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${d ? "bg-slate-800/60" : "bg-slate-50"}`}>
                        <span className="flex items-center gap-2"><Clock size={12} className="text-blue-600" /> {dia}</span>
                        <span className="font-semibold">{hora}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-5">
                <div className="mb-3"><Titulo t={t}>Entidades con las que trabaja</Titulo></div>
                {entidades.length ? (
                  <div className="flex flex-wrap gap-2">
                    {entidades.map((e) => <span key={e} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium ${t.borde}`}><Building2 size={12} className="text-blue-600" /> {e}</span>)}
                  </div>
                ) : <p className={t.suave}>Aún no tiene alumnos asignados en ninguna entidad.</p>}
              </div>

              {otrosDocentes.length > 0 && (
                <div className="p-5">
                  <div className="mb-3"><Titulo t={t}>Otros asesores</Titulo></div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-3">
                    {otrosDocentes.map((n) => (
                      <li key={n} className="flex items-center gap-2.5">
                        <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${t.avatar}`}>{iniciales(n)}</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ALUMNOS */}
        {seccion === "alumnos" && (
          <section className={`${t.tarjeta} overflow-hidden`}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${t.borde}`}>
              <div>
                <Titulo t={t}>Alumnos en prácticas</Titulo>
                <p className={`mt-1 pl-3.5 text-[11px] ${t.suave}`}>{alumnos.length} {alumnos.length === 1 ? "alumno a cargo" : "alumnos a cargo"}</p>
              </div>
              <button className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 font-semibold text-white transition hover:bg-blue-700 active:scale-95">
                <UserPlus size={13} /> Asignar alumno
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex flex-wrap gap-1.5">
                {filtros.map((f) => {
                  const n = f.lista ? alumnos.filter((a) => f.lista.includes(a.estado)).length : alumnos.length;
                  return (
                    <button key={f.id} onClick={() => setFiltro(f.id)} aria-pressed={filtro === f.id} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${filtro === f.id ? t.chipOn : t.boton}`}>
                      {f.label}
                      <span className={`rounded-full px-1.5 text-[10px] font-bold ${filtro === f.id ? "bg-blue-600 text-white" : d ? "bg-slate-700" : "bg-slate-100"}`}>{n}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex w-48 items-center gap-2 rounded-lg border px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-600/15 ${t.entrada}`}>
                  <Search size={13} className={t.suave} />
                  <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno" aria-label="Buscar alumno" className="w-full bg-transparent text-xs outline-none" />
                </div>
                <div className={`flex rounded-lg border p-0.5 ${t.borde}`}>
                  {[["tabla", Table2, "Tabla"], ["tarjetas", LayoutGrid, "Tarjetas"]].map(([id, Icon, nombre]) => (
                    <button key={id} onClick={() => setVista(id)} title={nombre} aria-label={nombre} aria-pressed={vista === id} className={`cursor-pointer rounded-md p-1.5 transition-colors ${vista === id ? "bg-blue-600 text-white" : `${t.suave} hover:text-blue-600`}`}><Icon size={14} /></button>
                  ))}
                </div>
              </div>
            </div>

            {visibles.length === 0 ? (
              <div className={`px-5 py-14 text-center ${t.suave}`}>
                <span className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl ${t.pista}`}><Users size={20} /></span>
                {alumnos.length === 0 ? "Este docente aún no tiene alumnos asignados." : "No se encontraron alumnos."}
              </div>
            ) : vista === "tabla" ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className={`border-y text-left text-[11px] font-semibold uppercase tracking-wider ${t.borde} ${t.suave} ${d ? "bg-slate-800/40" : "bg-slate-50"}`}>
                      <th className="px-5 py-2.5">Alumno</th><th className="py-2.5">Proyecto</th><th className="w-52 py-2.5">Horas</th><th className="py-2.5">Estado</th><th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((a, i) => {
                      const e = estadoDe(a.estado);
                      const p = porcentaje(a.hrs);
                      return (
                        <tr key={a.dni} style={{ animationDelay: `${i * 45}ms` }} className={`fd-fade group border-b transition-colors ${t.borde} ${t.fila}`}>
                          <td className="relative px-5 py-3">
                            <span className="absolute inset-y-2 left-0 w-1 origin-center scale-y-0 rounded-r bg-blue-600 transition-transform group-hover:scale-y-100" />
                            <span className="flex items-center gap-3">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold" style={{ background: `${e.hex}1f`, color: e.hex }}>{iniciales(a.nombre)}</span>
                              <span className="leading-tight"><span className="block font-semibold">{a.nombre}</span><span className={`text-[11px] ${t.suave}`}>DNI {a.dni}</span></span>
                            </span>
                          </td>
                          <td className="py-3 leading-tight"><span className="block font-medium">{a.proyecto || "—"}</span><span className={`text-[11px] ${t.suave}`}>{a.entidad}</span></td>
                          <td className="py-3 pr-6">
                            <Tramos pct={p} color={e.hex} pista={t.pista} />
                            <span className={`mt-1.5 flex justify-between text-[11px] ${t.suave}`}><span>{a.hrs} / {HORAS_TOTALES} h</span><b className={t.texto}>{p}%</b></span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.texto}`} style={{ background: `${e.hex}1a` }}><i className={`h-1.5 w-1.5 rounded-full ${e.punto}`} /> {a.estado}</span>
                          </td>
                          <td className="px-5 py-3 text-right"><button title="Ver expediente" aria-label="Ver expediente" className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition hover:border-blue-600 hover:bg-blue-600 hover:text-white ${t.borde} ${t.suave}`}><FolderOpen size={13} /> Expediente</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibles.map((a, i) => {
                  const e = estadoDe(a.estado);
                  const p = porcentaje(a.hrs);
                  return (
                    <article key={a.dni} style={{ animationDelay: `${i * 60}ms` }} className={`fd-up fd-lift relative overflow-hidden rounded-xl border p-4 pt-5 ${t.borde} ${d ? "bg-slate-900" : "bg-white"}`}>
                      <span className="absolute inset-x-0 top-0 h-1" style={{ background: e.hex }} />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[12px] font-bold" style={{ background: `${e.hex}1f`, color: e.hex }}>{iniciales(a.nombre)}</span>
                          <span className="min-w-0 leading-tight"><span className="block truncate font-semibold">{a.nombre}</span><span className={`text-[11px] ${t.suave}`}>DNI {a.dni}</span></span>
                        </div>
                        <Anillo pct={p} color={e.hex} pista={d ? "text-slate-800" : "text-slate-100"}>{p}%</Anillo>
                      </div>
                      <p className="mt-3 font-medium leading-snug">{a.proyecto || "—"}</p>
                      <p className={`text-[11px] ${t.suave}`}>{a.entidad}</p>
                      <div className={`mt-3 flex items-center justify-between border-t pt-3 text-[11px] ${t.borde}`}>
                        <span className={`flex items-center gap-1.5 font-semibold ${e.texto}`}><i className={`h-1.5 w-1.5 rounded-full ${e.punto}`} /> {a.estado}</span>
                        <span className={t.suave}>{a.hrs} / {HORAS_TOTALES} h</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ANALÍTICA */}
        {seccion === "analitica" && (
          <div className="space-y-4">
            <section className={`grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-4 ${t.borde} ${d ? "bg-gray-800" : "bg-slate-200"}`}>
              {[[horasTotales, "Horas acumuladas", Clock, ""], [promedio, "Avance promedio", Percent, "%"], [enRiesgo, "Alumnos en riesgo", AlertCircle, ""], [completados, "Completados", CheckCircle2, ""]].map(([v, l, Ic, suf]) => (
                <div key={l} className={`flex items-center gap-3 px-5 py-4 ${d ? "bg-slate-900" : "bg-white"}`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${d ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-600"}`}><Ic size={18} /></span>
                  <div><p className="text-2xl font-extrabold leading-none tabular-nums"><Num valor={v} sufijo={suf} /></p><p className={`mt-1 text-[11px] ${t.suave}`}>{l}</p></div>
                </div>
              ))}
            </section>

            {alumnos.length === 0 ? (
              <div className={`${t.tarjeta} px-6 py-12 text-center ${t.suave}`}>No hay datos para mostrar: este docente aún no tiene alumnos asignados.</div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <section className={`${t.tarjeta} p-5`}>
                    <Titulo t={t}>Alumnos por estado</Titulo>
                    <div className="mt-5 flex flex-wrap items-center gap-6">
                      <Dona segmentos={segmentos} pista={d ? "text-slate-800" : "text-slate-100"} total={alumnos.length} />
                      <ul className="flex-1 space-y-2.5" style={{ minWidth: 150 }}>
                        {segmentos.map((s) => (
                          <li key={s.label} className="flex items-center justify-between gap-3">
                            <span className={`flex items-center gap-2 ${t.suave}`}><i className="h-2.5 w-2.5 rounded" style={{ background: s.color }} /> {s.label}</span>
                            <span><b>{s.valor}</b> <span className={`text-[10px] ${t.suave}`}>· {Math.round((s.valor / alumnos.length) * 100)}%</span></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className={`${t.tarjeta} p-5`}>
                    <Titulo t={t} detalle="por tramo de avance">Distribución</Titulo>
                    <div className="mt-5 flex h-36 items-end gap-3">
                      {tramosAvance.map((x, i) => (
                        <div key={x.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                          <b className="tabular-nums">{x.n}</b>
                          <div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-lg bg-blue-600" style={{ height: `${(x.n / maxTramo) * 100}%`, minHeight: x.n ? 6 : 3, opacity: x.n ? 1 : 0.2, animation: `fd-up .6s cubic-bezier(.22,1,.36,1) ${i * 80}ms both` }} /></div>
                          <span className={`text-[10px] ${t.suave}`}>{x.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                  <section className={`${t.tarjeta} p-5 md:col-span-3`}>
                    <Titulo t={t}>Horas por alumno</Titulo>
                    <ul className="mt-4 space-y-3.5">
                      {alumnos.map((a) => (
                        <li key={a.dni}>
                          <div className="mb-1 flex justify-between"><span className="truncate font-medium">{a.nombre}</span><span className={t.suave}>{a.hrs} h · {porcentaje(a.hrs)}%</span></div>
                          <Barra pct={porcentaje(a.hrs)} color={estadoDe(a.estado).hex} pista={t.pista} />
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className={`${t.tarjeta} p-5 md:col-span-2`}>
                    <Titulo t={t}>Requieren atención</Titulo>
                    {listaRiesgo.length === 0 ? (
                      <p className={`mt-6 flex items-center gap-2 ${t.suave}`}><CheckCircle2 size={16} className="text-emerald-500" /> Ningún alumno en riesgo.</p>
                    ) : (
                      <ul className="mt-4 space-y-2.5">
                        {listaRiesgo.map((a) => (
                          <li key={a.dni} className={`flex items-center gap-3 rounded-xl border-l-4 border-red-500 px-3 py-2.5 ${d ? "bg-red-500/10" : "bg-red-50"}`}>
                            <div className="min-w-0 leading-tight"><span className="block truncate font-semibold">{a.nombre}</span><span className={`text-[11px] ${t.suave}`}>{a.estado === "Observado" ? "Observado" : "Avance bajo"} · {porcentaje(a.hrs)}%</span></div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        )}

        {/* ACTIVIDAD */}
        {seccion === "actividad" && (
          <section className={t.tarjeta}>
            <div className={`border-b px-5 py-4 ${t.borde}`}><Titulo t={t}>Actividad reciente</Titulo></div>
            {actividad.length === 0 ? (
              <p className={`px-5 py-12 text-center ${t.suave}`}>Aún no hay actividad registrada.</p>
            ) : (
              <ul className="relative px-5 py-4">
                <span className={`absolute bottom-6 left-[27px] top-6 w-px ${d ? "bg-slate-700" : "bg-slate-200"}`} />
                {actividad.map((e, i) => (
                  <li key={`${e.texto}-${i}`} style={{ animationDelay: `${i * 70}ms` }} className="fd-up relative flex items-start justify-between gap-4 py-3 pl-8">
                    <span className={`absolute left-0 top-[15px] grid h-4 w-4 place-items-center rounded-full border-2 border-blue-600 ${d ? "bg-slate-900" : "bg-white"}`}><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /></span>
                    <span className="leading-snug">{e.texto}</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${t.pista} ${t.suave}`}>{e.cuando}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}