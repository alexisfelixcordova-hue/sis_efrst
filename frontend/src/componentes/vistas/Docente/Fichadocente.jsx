import { useState, useEffect, useRef } from "react";
import api from "../../../api/axios.js";
import AvatarEstudiante from "../../AvatarEstudiante.jsx";
import {
  Mail, Phone, MapPin, Search, UserPlus, ArrowLeft, GraduationCap, LayoutGrid, Table2, FolderOpen,
  Users, Clock, CheckCircle2, AlertCircle, Building2, Armchair, Layers, Info,
} from "lucide-react";

const BASE_URL = "http://127.0.0.1:8000";
const CAPACIDAD = 12;
const MODULOS = [1, 2, 3];
const ROMANO = { 0: "Sin módulo", 1: "Módulo I", 2: "Módulo II", 3: "Módulo III" };

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

const normalizarUrlFoto = (url) => {
  if (!url || typeof url !== "string") return "";
  const limpia = url.trim();
  if (!limpia) return "";
  if (
    limpia.startsWith("http://") ||
    limpia.startsWith("https://") ||
    limpia.startsWith("data:") ||
    limpia.startsWith("blob:")
  ) {
    return limpia;
  }
  const rutaLimpia = limpia.startsWith("/") ? limpia : `/${limpia}`;
  return `${BASE_URL}${rutaLimpia}`;
};

const obtenerFotoDocente = (doc = {}, previo = {}) => {
  const fuentes = [
    doc,
    doc?.usuario,
    doc?.user,
    previo,
    previo?.raw,
    previo?.usuario,
    previo?.user,
  ];
  for (const obj of fuentes) {
    if (!obj || typeof obj !== "object") continue;
    const candidatos = [
      obj.foto_perfil,
      obj.foto,
      obj.avatar,
      obj.foto_url,
      obj.imagen,
      obj.url_foto,
      obj.img,
      obj.photo,
    ];
    for (const c of candidatos) {
      const url = normalizarUrlFoto(c);
      if (url) return url;
    }
  }
  return "";
};

const extraerNumeroDesdeValor = (val) => {
  if (val == null) return 0;
  if (Array.isArray(val)) {
    const nums = val.map(extraerNumeroDesdeValor).filter((n) => n >= 1 && n <= 3);
    return nums.length ? Math.max(...nums) : 0;
  }
  if (typeof val === "object") {
    return extraerNumeroDesdeValor(
      val.numero_modulo ?? val.modulo ?? val.id_modulo ?? val.nombre ?? val.titulo ?? ""
    );
  }
  const s = String(val).toUpperCase();
  const n = parseInt(s.replace(/\D/g, ""), 10);
  if (n >= 1 && n <= 3) return n;
  const r = s.match(/\b(III|II|I)\b/);
  return r ? { I: 1, II: 2, III: 3 }[r[1]] : 0;
};

/* Un alumno pertenece a un solo módulo (0 = sin dato). */
const numModulo = (a) => {
  const directo = extraerNumeroDesdeValor(a?.numero_modulo ?? a?.modulo ?? a?.id_modulo);
  if (directo > 0) return directo;
  if (Array.isArray(a?.modulos) && a.modulos.length) {
    return extraerNumeroDesdeValor(a.modulos);
  }
  return 0;
};

const claveUnicaAlumno = (a, idx) => {
  const id = a?.id_estudiante ?? a?.id_alumno ?? a?.estudiante_id ?? a?.id;
  if (id != null && String(id).trim() !== "") return `id:${String(id).trim()}`;
  const dni = a?.dni ?? a?.numero_documento;
  if (dni != null && String(dni).trim() !== "") return `dni:${String(dni).trim()}`;
  const nombre = String(a?.nombre || "").trim().toLowerCase();
  return nombre ? `nom:${nombre}` : `idx:${idx}`;
};

const deduplicarAlumnos = (lista = []) => {
  const mapa = new Map();
  lista.forEach((raw, idx) => {
    const mod = numModulo(raw);
    const alumno = { ...raw, mod };
    const clave = claveUnicaAlumno(alumno, idx);
    const existente = mapa.get(clave);
    if (!existente) {
      mapa.set(clave, alumno);
    } else if (alumno.mod > existente.mod) {
      mapa.set(clave, { ...existente, ...alumno, mod: alumno.mod });
    }
  });
  return Array.from(mapa.values());
};

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
@keyframes fd-ping { 0% { transform:scale(1); opacity:.6;} 100% { transform:scale(2.4); opacity:0;} }
@keyframes fd-sk { 0% { opacity:.5;} 50% { opacity:1;} 100% { opacity:.5;} }
@keyframes fd-line { from { transform:scaleY(0);} to { transform:scaleY(1);} }
.fd-up { animation: fd-up .5s cubic-bezier(.22,1,.36,1) both; }
.fd-fade { animation: fd-fade .45s ease both; }
.fd-pop { animation: fd-pop .45s cubic-bezier(.22,1,.36,1) both; }
.fd-ping { animation: fd-ping 2.2s ease-out infinite; }
.fd-sk { animation: fd-sk 1.4s ease-in-out infinite; }
.fd-line { transform-origin: top; animation: fd-line .9s ease both; }
.fd-lift { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.fd-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -12px rgba(15,23,42,.25); }
@media (prefers-reduced-motion: reduce) { .fd-up,.fd-fade,.fd-pop,.fd-ping,.fd-sk,.fd-line { animation:none !important; } .fd-lift:hover { transform:none; } }
`;

function useMontado() {
  const [m, setM] = useState(false);
  useEffect(() => { const id = setTimeout(() => setM(true), 40); return () => clearTimeout(id); }, []);
  return m;
}

function useContador(objetivo, dur = 900) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const ini = ref.current;
    let raf;
    const t0 = performance.now();
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const val = ini + (objetivo - ini) * (1 - Math.pow(1 - k, 3));
      ref.current = val;
      setV(val);
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, dur]);
  return Math.round(v);
}
const Num = ({ valor }) => <>{useContador(valor)}</>;

function BarraEstados({ lista, pista, alto = "h-2" }) {
  const m = useMontado();
  const total = lista.length || 1;
  const nombres = [...new Set(lista.map((a) => a.estado))];
  return (
    <div className={`flex ${alto} gap-px overflow-hidden rounded-full ${pista}`} aria-hidden="true">
      {nombres.map((e, i) => (
        <span key={e} style={{ width: m ? `${(lista.filter((a) => a.estado === e).length / total) * 100}%` : 0, background: estadoDe(e).hex, transition: `width .8s cubic-bezier(.22,1,.36,1) ${i * 90}ms` }} />
      ))}
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

const Etiqueta = ({ estado }) => {
  const e = estadoDe(estado);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.texto}`} style={{ background: `${e.hex}1a` }}>
      <i className={`h-1.5 w-1.5 rounded-full ${e.punto}`} /> {estado}
    </span>
  );
};

export default function FichaDocente({ docente, onVolver, setVista, setEstudiante, darkMode }) {
  const d = !!darkMode;
  const t = tokens(d);

  const idDocente = docente?.id_docente ?? docente?.id_usuario ?? docente?.id;
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorFoto, setErrorFoto] = useState(false);
  const [seccion, setSeccion] = useState("alumnos");
  const [filtro, setFiltro] = useState("todos");
  const [modulo, setModulo] = useState("todos");
  const [vistaAlumnos, setVistaAlumnos] = useState("tabla");
  const [busqueda, setBusqueda] = useState("");

  const irASeccion = (nombreVista) => {
    if (typeof setVista === "function") setVista(nombreVista);
    else if (typeof onVolver === "function") onVolver();
  };

  const abrirExpedienteAlumno = (a) => {
    if (typeof setEstudiante === "function") setEstudiante(a);
    if (typeof setVista === "function") setVista("Expediente Alumno");
  };

  const cargarFicha = async () => {
    setCargando(true);
    setError("");
    setErrorFoto(false);
    try {
      const { data } = await api.get(`/docentes/${idDocente}`);
      setFicha(data);
    } catch (e) {
      setError(e.message);
    }
    setCargando(false);
  };

  useEffect(() => {
    if (idDocente) cargarFicha();
    else { setError("No hay un docente seleccionado"); setCargando(false); }
  }, [idDocente]);

  const doc = ficha?.docente ?? ficha?.data?.docente ?? {};
  const nombreDocente =
    (doc.nombres && doc.apellidos ? `${doc.nombres} ${doc.apellidos}` : doc.nombre) ||
    (docente?.nombres && docente?.apellidos
      ? `${docente.nombres} ${docente.apellidos}`
      : docente?.nombre || docente?.name) ||
    "Docente";

  const fotoUrl = obtenerFotoDocente(doc, docente ?? {});

  useEffect(() => {
    setErrorFoto(false);
  }, [fotoUrl]);

  const alumnos = deduplicarAlumnos(ficha?.alumnos ?? ficha?.data?.alumnos ?? []);
  const otrosDocentes = ficha?.otrosDocentes ?? ficha?.data?.otrosDocentes ?? [];
  const actividad = ficha?.actividad ?? ficha?.data?.actividad ?? [];
  const entidades = [...new Set(alumnos.map((a) => a.entidad).filter(Boolean))];

  const actual = filtros.find((f) => f.id === filtro);
  const visibles = alumnos.filter((a) =>
    (!actual.lista || actual.lista.includes(a.estado)) &&
    (modulo === "todos" || a.mod === modulo) &&
    `${a.nombre} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );
  const grupos = [1, 2, 3, 0].map((m) => ({ m, lista: visibles.filter((a) => a.mod === m) })).filter((g) => g.lista.length);

  const observados = alumnos.filter((a) => a.estado === "Observado");
  const completados = alumnos.filter((a) => a.estado === "Completado").length;
  const pendientes = alumnos.filter((a) => a.estado === "Revisión pendiente").length;
  const segmentos = [...new Set(alumnos.map((a) => a.estado))].map((e) => ({ label: e, color: estadoDe(e).hex, valor: alumnos.filter((a) => a.estado === e).length }));
  const hayModulos = alumnos.some((a) => a.mod > 0);

  const cupos = Math.max(0, CAPACIDAD - alumnos.length);
  const idxSeccion = Math.max(0, pestanas.findIndex((p) => p.id === seccion));

  if (cargando) {
    return (
      <div className={`space-y-4 text-xs ${t.texto}`}>
        <style>{ESTILOS}</style>
        <div className={`fd-sk h-28 rounded-2xl ${d ? "bg-slate-800" : "bg-slate-200"}`} />
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
          {idDocente && <button type="button" onClick={cargarFicha} className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white">Reintentar</button>}
          <button type="button" onClick={() => irASeccion("Asesores")} className={`cursor-pointer rounded-lg border px-3 py-1.5 ${t.boton}`}>Volver</button>
        </div>
      </div>
    );
  }

  const stats = [
    { l: "Alumnos a cargo", v: alumnos.length, ic: Users, color: "#2563eb", nota: `de ${CAPACIDAD} cupos` },
    { l: "Cupos libres", v: cupos, ic: Armchair, color: "#0891b2", nota: cupos === 0 ? "Capacidad completa" : "Disponibles" },
    { l: "Completados", v: completados, ic: CheckCircle2, color: "#10b981", nota: "EFSRT terminado" },
    { l: "Observados", v: observados.length, ic: AlertCircle, color: observados.length ? "#ef4444" : "#10b981", nota: observados.length ? "Requieren atención" : "Todo en orden" },
  ];

  const Tarjeta = ({ a, i }) => {
    const e = estadoDe(a.estado);
    return (
      <article style={{ animationDelay: `${i * 60}ms` }} className={`fd-up fd-lift relative overflow-hidden rounded-xl border p-4 pt-5 ${t.borde} ${d ? "bg-slate-900" : "bg-white"}`}>
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: e.hex }} />
        <div className="flex items-center gap-3">
          <AvatarEstudiante estudiante={a} className="h-10 w-10 rounded-xl text-[12px] font-bold" fallbackStyle={{ background: `${e.hex}1f`, color: e.hex }} />
          <span className="min-w-0 leading-tight"><span className="block truncate font-semibold">{a.nombre}</span><span className={`text-[11px] ${t.suave}`}>DNI {a.dni}</span></span>
        </div>
        <p className="mt-3 font-medium leading-snug">{a.proyecto || "—"}</p>
        <p className={`text-[11px] ${t.suave}`}>{a.entidad}</p>
        <div className={`mt-3 flex items-center justify-between border-t pt-3 ${t.borde}`}>
          <Etiqueta estado={a.estado} />
          <button type="button" onClick={() => abrirExpedienteAlumno(a)} className={`flex cursor-pointer items-center gap-1 text-[11px] font-semibold hover:text-blue-600 ${t.suave}`}><FolderOpen size={13} /> Expediente</button>
        </div>
      </article>
    );
  };

  return (
    <div className={`space-y-5 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-xs ${t.texto}`}>
      <style>{ESTILOS}</style>

      <button type="button" onClick={() => irASeccion("Asesores")} className={`group flex cursor-pointer items-center gap-1.5 hover:text-blue-600 ${t.suave}`}>
        <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" /> Plantel docente
      </button>

      <section className={`fd-up ${t.tarjeta} p-5 md:p-6`}>
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <span className="fd-ping absolute inset-0 rounded-2xl bg-blue-600/30" />
            <div className="fd-pop relative grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-blue-600 text-2xl font-extrabold text-white">
              {fotoUrl && !errorFoto ? (
                <img
                  src={fotoUrl}
                  alt={nombreDocente}
                  className="h-full w-full object-cover"
                  onError={() => setErrorFoto(true)}
                />
              ) : (
                iniciales(nombreDocente)
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mt-2 text-2xl font-extrabold leading-tight">{nombreDocente}</h1>
            <p className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 ${t.suave}`}>
              {doc.cargo && <span className={`font-medium ${t.texto}`}>{doc.cargo}</span>}
              <span className="flex items-center gap-1.5"><GraduationCap size={13} /> IESTP "Andrés Avelino Cáceres Dorregaray"</span>
            </p>
          </div>
          <div className={`flex gap-5 border-l pl-5 ${t.borde}`}>
            {MODULOS.map((m) => (
              <div key={m} className="text-center">
                <p className="text-xl font-extrabold tabular-nums"><Num valor={alumnos.filter((a) => a.mod === m).length} /></p>
                <p className={`text-[11px] ${t.suave}`}>{ROMANO[m]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.l} style={{ animationDelay: `${0.1 + i * 0.07}s` }} className={`fd-up fd-lift ${t.tarjeta} p-4`}>
            <div className="flex items-start justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${s.color}1a`, color: s.color }}><s.ic size={17} /></span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
            </div>
            <p className="mt-3 text-3xl font-extrabold leading-none tabular-nums"><Num valor={s.v} /></p>
            <p className="mt-1.5 text-[12px] font-semibold">{s.l}</p>
            <p className={`text-[11px] ${t.suave}`}>{s.nota}</p>
          </div>
        ))}
      </div>

      <div className={`fd-up ${t.tarjeta} flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5`} style={{ animationDelay: ".3s" }}>
        <span className="font-semibold">Capacidad de asesoría</span>
        <div className="flex flex-1 gap-1.5" style={{ minWidth: 200 }} aria-label={`${alumnos.length} de ${CAPACIDAD} cupos ocupados`}>
          {Array.from({ length: CAPACIDAD }).map((_, i) => (
            <span key={i} className={`h-3 flex-1 rounded ${i < alumnos.length ? "bg-blue-600" : t.pista}`} style={{ animation: `fd-pop .4s ease ${0.35 + i * 0.04}s both` }} />
          ))}
        </div>
        <span className={t.suave}><b className={t.texto}>{alumnos.length}</b> / {CAPACIDAD}</span>
      </div>

      <nav className={`relative grid max-w-xl grid-cols-2 rounded-xl border p-1 sm:grid-cols-4 ${t.borde} ${d ? "bg-slate-900" : "bg-white"}`} aria-label="Secciones">
        <span className="absolute inset-y-1 left-1 w-[calc(25%-2px)] rounded-lg bg-blue-600 transition-transform duration-300 ease-out" style={{ transform: `translateX(${idxSeccion * 100}%)` }} />
        {pestanas.map((p) => (
          <button type="button" key={p.id} onClick={() => setSeccion(p.id)} aria-current={seccion === p.id ? "page" : undefined}
            className={`relative z-10 cursor-pointer rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${seccion === p.id ? "text-white" : `${t.suave} hover:text-blue-600`}`}>
            {p.label}
          </button>
        ))}
      </nav>

      <div key={seccion} className="fd-up">
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

        {seccion === "alumnos" && (
          <section className={`${t.tarjeta} overflow-hidden`}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${t.borde}`}>
              <div>
                <Titulo t={t}>Alumnos en prácticas</Titulo>
                <p className={`mt-1 flex items-center gap-1.5 pl-3.5 text-[11px] ${t.suave}`}><Info size={11} /> Las horas de cada módulo se validan con el portafolio del alumno.</p>
              </div>
              <button type="button" onClick={() => irASeccion("Estudiantes")} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 font-semibold text-white transition hover:bg-blue-700 active:scale-95">
                <UserPlus size={13} /> Asignar alumno
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 px-5 pt-4 md:grid-cols-4">
              {[{ id: "todos", label: "Todos los módulos", lista: alumnos }, ...MODULOS.map((m) => ({ id: m, label: ROMANO[m], lista: alumnos.filter((a) => a.mod === m) }))].map((o, i) => {
                const on = modulo === o.id;
                return (
                  <button type="button" key={o.id} onClick={() => setModulo(o.id)} aria-pressed={on} style={{ animationDelay: `${i * 60}ms` }}
                    className={`fd-up fd-lift cursor-pointer rounded-xl border p-3 text-left ${on ? t.chipOn : `${t.borde} ${d ? "bg-slate-900" : "bg-white"}`}`}>
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold"><Layers size={13} /> {o.label}</span>
                      <b className="text-lg tabular-nums">{o.lista.length}</b>
                    </span>
                    <span className="mt-2.5 block">{o.lista.length ? <BarraEstados lista={o.lista} pista={t.pista} /> : <span className={`block h-2 rounded-full ${t.pista}`} />}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex flex-wrap gap-1.5">
                {filtros.map((f) => {
                  const base = modulo === "todos" ? alumnos : alumnos.filter((a) => a.mod === modulo);
                  const n = f.lista ? base.filter((a) => f.lista.includes(a.estado)).length : base.length;
                  return (
                    <button type="button" key={f.id} onClick={() => setFiltro(f.id)} aria-pressed={filtro === f.id} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${filtro === f.id ? t.chipOn : t.boton}`}>
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
                    <button type="button" key={id} onClick={() => setVistaAlumnos(id)} title={nombre} aria-label={nombre} aria-pressed={vistaAlumnos === id} className={`cursor-pointer rounded-md p-1.5 transition-colors ${vistaAlumnos === id ? "bg-blue-600 text-white" : `${t.suave} hover:text-blue-600`}`}><Icon size={14} /></button>
                  ))}
                </div>
              </div>
            </div>

            {visibles.length === 0 ? (
              <div className={`px-5 py-14 text-center ${t.suave}`}>
                <span className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl ${t.pista}`}><Users size={20} /></span>
                {alumnos.length === 0 ? "Este docente aún no tiene alumnos asignados." : "No hay alumnos con estos filtros."}
              </div>
            ) : vistaAlumnos === "tabla" ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className={`border-y text-left text-[11px] font-semibold ${t.borde} ${t.suave} ${d ? "bg-slate-800/40" : "bg-slate-50"}`}>
                      <th className="px-5 py-2.5">Alumno</th><th className="py-2.5">Proyecto</th><th className="py-2.5">Estado</th><th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  {grupos.map((g) => (
                    <tbody key={g.m}>
                      <tr className={d ? "bg-slate-800/30" : "bg-blue-50/50"}>
                        <td colSpan={4} className="px-5 py-2">
                          <span className="flex items-center gap-2 text-[12px] font-bold"><Layers size={13} className="text-blue-600" /> {ROMANO[g.m]} <span className={`font-medium ${t.suave}`}>· {g.lista.length} {g.lista.length === 1 ? "alumno" : "alumnos"}</span></span>
                        </td>
                      </tr>
                      {g.lista.map((a, i) => {
                        const e = estadoDe(a.estado);
                        return (
                          <tr key={`${g.m}-${a.dni || a.nombre || i}`} style={{ animationDelay: `${i * 45}ms` }} className={`fd-fade group border-b transition-colors ${t.borde} ${t.fila}`}>
                            <td className="relative px-5 py-3">
                              <span className="absolute inset-y-2 left-0 w-1 origin-center scale-y-0 rounded-r bg-blue-600 transition-transform group-hover:scale-y-100" />
                              <span className="flex items-center gap-3">
                                <AvatarEstudiante estudiante={a} className="h-9 w-9 rounded-xl text-[11px] font-bold" fallbackStyle={{ background: `${e.hex}1f`, color: e.hex }} />
                                <span className="leading-tight"><span className="block font-semibold">{a.nombre}</span><span className={`text-[11px] ${t.suave}`}>DNI {a.dni}</span></span>
                              </span>
                            </td>
                            <td className="py-3 leading-tight"><span className="block font-medium">{a.proyecto || "—"}</span><span className={`text-[11px] ${t.suave}`}>{a.entidad}</span></td>
                            <td className="py-3"><Etiqueta estado={a.estado} /></td>
                            <td className="px-5 py-3 text-right"><button type="button" onClick={() => abrirExpedienteAlumno(a)} title="Ver expediente" aria-label="Ver expediente" className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition hover:border-blue-600 hover:bg-blue-600 hover:text-white ${t.borde} ${t.suave}`}><FolderOpen size={13} /> Expediente</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  ))}
                </table>
              </div>
            ) : (
              <div className="space-y-6 px-5 pb-5">
                {grupos.map((g) => (
                  <div key={g.m}>
                    <p className="mb-3 flex items-center gap-2 text-[12px] font-bold"><Layers size={13} className="text-blue-600" /> {ROMANO[g.m]} <span className={`font-medium ${t.suave}`}>· {g.lista.length}</span><span className={`h-px flex-1 ${d ? "bg-slate-800" : "bg-slate-200"}`} /></p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{g.lista.map((a, i) => <Tarjeta key={`${g.m}-${a.dni || a.nombre || i}`} a={a} i={i} />)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {seccion === "analitica" && (
          <div className="space-y-4">
            <section className={`grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-4 ${t.borde} ${d ? "bg-gray-800" : "bg-slate-200"}`}>
              {[[alumnos.length, "Alumnos a cargo", Users], [completados, "Completados", CheckCircle2], [pendientes, "Revisión pendiente", Clock], [observados.length, "Observados", AlertCircle]].map(([v, l, Ic]) => (
                <div key={l} className={`flex items-center gap-3 px-5 py-4 ${d ? "bg-slate-900" : "bg-white"}`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${d ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-600"}`}><Ic size={18} /></span>
                  <div><p className="text-2xl font-extrabold leading-none tabular-nums"><Num valor={v} /></p><p className={`mt-1 text-[11px] ${t.suave}`}>{l}</p></div>
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
                    <Titulo t={t} detalle="estado de cada grupo">Avance por módulo</Titulo>
                    {hayModulos ? (
                      <ul className="mt-5 space-y-5">
                        {MODULOS.map((m, i) => {
                          const lista = alumnos.filter((a) => a.mod === m);
                          return (
                            <li key={m} style={{ animationDelay: `${i * 90}ms` }} className="fd-up">
                              <div className="mb-1.5 flex items-center justify-between"><span className="font-semibold">{ROMANO[m]}</span><span className={t.suave}>{lista.length} {lista.length === 1 ? "alumno" : "alumnos"}</span></div>
                              {lista.length ? <BarraEstados lista={lista} pista={t.pista} alto="h-3" /> : <div className={`h-3 rounded-full ${t.pista}`} />}
                            </li>
                          );
                        })}
                      </ul>
                    ) : <p className={`mt-6 ${t.suave}`}>El servidor aún no envía el módulo de cada alumno.</p>}
                  </section>
                </div>

                <section className={`${t.tarjeta} p-5`}>
                  <Titulo t={t}>Requieren atención</Titulo>
                  {observados.length === 0 ? (
                    <p className={`mt-5 flex items-center gap-2 ${t.suave}`}><CheckCircle2 size={16} className="text-emerald-500" /> Ningún alumno observado.</p>
                  ) : (
                    <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
                      {observados.map((a, i) => (
                        <li key={a.dni || a.nombre || i} style={{ animationDelay: `${i * 70}ms` }} className={`fd-up flex items-center justify-between gap-3 rounded-xl border-l-4 border-red-500 px-3 py-2.5 ${d ? "bg-red-500/10" : "bg-red-50"}`}>
                          <span className="min-w-0 leading-tight"><span className="block truncate font-semibold">{a.nombre}</span><span className={`text-[11px] ${t.suave}`}>{a.entidad || "Sin entidad"}</span></span>
                          <span className={`shrink-0 text-[11px] font-semibold ${t.suave}`}>{ROMANO[a.mod]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {seccion === "actividad" && (
          <section className={t.tarjeta}>
            <div className={`border-b px-5 py-4 ${t.borde}`}><Titulo t={t}>Actividad reciente</Titulo></div>
            {actividad.length === 0 ? (
              <p className={`px-5 py-12 text-center ${t.suave}`}>Aún no hay actividad registrada.</p>
            ) : (
              <ul className="relative px-5 py-4">
                <span className={`fd-line absolute bottom-6 left-[27px] top-6 w-px ${d ? "bg-slate-700" : "bg-slate-200"}`} />
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