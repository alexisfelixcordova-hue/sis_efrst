import { useState, useEffect, useMemo, useRef, useDeferredValue } from "react";
import {
  Search,
  Users,
  Eye,
  GraduationCap,
  Filter,
  RefreshCcw,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  CornerDownLeft,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  MessageCircle,
  AlignJustify,
  Clock,
  Eraser,
  Hash,
  Flag,
  Zap,
} from "lucide-react";
import api, { getCachedData, invalidateApiCache } from "../../../api/axios";
import ModalEstudiante from "./componentes/ModalEstudiante";
import ModalImportarEstudiantes from "./componentes/ModalImportarEstudiantes";

/* ================================================================== */
/*  Constantes y utilidades                                            */
/* ================================================================== */
const estados = ["Todos", "En progreso", "Pendiente", "Egresado"];

const estiloEstado = {
  "En progreso": "bg-blue-50 text-blue-700 ring-blue-600/10",
  Pendiente: "bg-amber-50 text-amber-700 ring-amber-600/10",
  Egresado: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
};

const colorEstado = {
  "En progreso": "#3b82f6",
  Pendiente: "#f59e0b",
  Egresado: "#10b981",
};

const estadoNormalizado = (e) => {
  const raw = String(e?.estado ?? "").trim();
  if (!raw) return "En progreso";
  const low = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (low.includes("egres") || low.includes("complet") || low.includes("titul")) {
    return "Egresado";
  }
  if (low.includes("pend") || low.includes("observ") || low.includes("revis")) {
    return "Pendiente";
  }
  if (low.includes("progreso") || low.includes("activ") || low.includes("curso")) {
    return "En progreso";
  }
  return estados.includes(raw) ? raw : "En progreso";
};

const tieneProgresoReal = (e) => typeof e?.progreso === "number";
const obtenerProgreso = (e) => {
  if (tieneProgresoReal(e)) return Math.min(100, Math.max(0, e.progreso));
  const est = estadoNormalizado(e);
  if (est === "Egresado") return 100;
  if (est === "Pendiente") return 20;
  return 60;
};

const etapasTitulacion = [
  { titulo: "Expediente de ingreso", desc: "Documentos personales y académicos verificados", umbral: 10 },
  { titulo: "Prácticas y módulos", desc: "Experiencia formativa y módulos aprobados", umbral: 35 },
  { titulo: "Modalidad de titulación", desc: "Trabajo de aplicación o examen de suficiencia", umbral: 60 },
  { titulo: "Sustentación o evaluación", desc: "Defensa ante el jurado evaluador", umbral: 85 },
  { titulo: "Acta y entrega de título", desc: "Cierre del trámite y registro final", umbral: 100 },
];

const normalizar = (s = "") =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const nombreCompleto = (e) =>
  `${e?.nombres || e?.nombre || ""} ${e?.apellidos || ""}`.trim();

const idEstudianteDe = (e) =>
  e?.id_estudiante ?? e?.id ?? e?.id_usuario ?? null;

const _cacheTabla = new WeakMap();
const _cachePaleta = new WeakMap();
const _cacheNombre = new WeakMap();

const textoTabla = (e) => {
  let v = _cacheTabla.get(e);
  if (v === undefined) {
    v = normalizar(
      [e.dni, e.nombres, e.nombre, e.apellidos, e.programa_estudios, e.semestre]
        .filter(Boolean)
        .join(" ")
    );
    _cacheTabla.set(e, v);
  }
  return v;
};

const textoPaleta = (e) => {
  let v = _cachePaleta.get(e);
  if (v === undefined) {
    v = normalizar(
      [
        e.dni,
        e.nombres,
        e.nombre,
        e.apellidos,
        e.programa_estudios,
        e.semestre,
        e.correo,
        e.email,
      ]
        .filter(Boolean)
        .join(" ")
    );
    _cachePaleta.set(e, v);
  }
  return v;
};

const nombreNormalizado = (e) => {
  let v = _cacheNombre.get(e);
  if (v === undefined) {
    v = normalizar(nombreCompleto(e));
    _cacheNombre.set(e, v);
  }
  return v;
};

const iniciales = (e) => {
  const nom = e?.nombres || e?.nombre || "?";
  const ape = e?.apellidos || "";
  return `${nom[0] || ""}${ape[0] || ""}`.toUpperCase();
};

const fotoDe = (e) =>
  e?.foto_url
    ? (/^(https?:|data:|blob:)/i.test(e.foto_url)
        ? e.foto_url
        : `${String(api.defaults.baseURL || "").replace(/\/api\/?$/, "")}/${String(e.foto_url).replace(/^\/+/, "")}`)
    : "";

const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const telefonoWhatsApp = (tel = "") => {
  const digitos = String(tel).replace(/\D/g, "");
  if (digitos.length === 9) return `51${digitos}`;
  return digitos;
};

const valorOrden = (e, campo) => {
  switch (campo) {
    case "nombre":
      return nombreNormalizado(e);
    case "dni":
      return String(e.dni || "");
    case "programa":
      return normalizar(e.programa_estudios || "");
    case "avance":
      return obtenerProgreso(e);
    case "estado":
      return estadoNormalizado(e);
    default:
      return "";
  }
};

const extraerEstudiantesDePayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidato = payload.data ?? payload;
  if (Array.isArray(candidato)) return candidato;
  if (candidato && Array.isArray(candidato.data)) return candidato.data;
  if (candidato && Array.isArray(candidato.estudiantes)) return candidato.estudiantes;
  if (candidato && Array.isArray(candidato.alumnos)) return candidato.alumnos;
  if (Array.isArray(payload.estudiantes)) return payload.estudiantes;
  if (Array.isArray(payload.alumnos)) return payload.alumnos;

  return [];
};

const leerCacheEstudiantesInicial = () => {
  const paramsTodos = { all: true, todos: 1, per_page: 1000 };
  const listas = [
    extraerEstudiantesDePayload(getCachedData("/estudiantes", paramsTodos)),
    extraerEstudiantesDePayload(getCachedData("/estudiantes?all=true")),
    extraerEstudiantesDePayload(getCachedData("/estudiantes")),
  ];
  return listas.reduce((mejor, actual) =>
    actual.length > mejor.length ? actual : mejor
  , []);
};

/* ================================================================== */
/*  Estilos y animaciones                                              */
/* ================================================================== */
const estilosAnimaciones = `
@keyframes filaEntrada { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes drawerEntrada { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes fadeEntrada { from { opacity: 0; } to { opacity: 1; } }
@keyframes paletaEntrada { from { opacity: 0; transform: translateY(-16px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes alertaEntrada { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes barraTiempo { from { width: 100%; } to { width: 0%; } }
@keyframes flotar { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes gradienteMueve { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
@keyframes confeti { 0% { transform: translateY(-10px) translateX(0) rotate(0); opacity: 1; } 100% { transform: translateY(150px) translateX(var(--dx)) rotate(var(--rot)); opacity: 0; } }
@keyframes itemEntrada { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulsoNodo { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,.55); } 70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }
@keyframes barraSube { from { opacity: 0; transform: translate(-50%, 30px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes barraBrillo { 0% { transform: translateX(-100%); } 60%, 100% { transform: translateX(100%); } }
@keyframes cargaBarrido { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }

.barra-brillo { position: relative; overflow: hidden; }
.barra-brillo::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
  transform: translateX(-100%);
  animation: barraBrillo 2.6s ease-in-out infinite;
}
.barra-carga { animation: cargaBarrido 1.1s ease-in-out infinite; }
.fila-anim { opacity: 0; animation: filaEntrada .45s ease forwards; }
.skeleton {
  background: linear-gradient(90deg, rgba(148,163,184,.15) 25%, rgba(148,163,184,.3) 37%, rgba(148,163,184,.15) 63%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}
.drawer-anim { animation: drawerEntrada .38s cubic-bezier(.22,1,.36,1); }
.fade-anim { animation: fadeEntrada .25s ease; }
.paleta-anim { animation: paletaEntrada .3s cubic-bezier(.22,1,.36,1); }
.alerta-anim { animation: alertaEntrada .3s ease; }
.barra-tiempo { animation: barraTiempo 4s linear forwards; }
.flotar { animation: flotar 3s ease-in-out infinite; }
.item-anim { opacity: 0; animation: itemEntrada .5s cubic-bezier(.22,1,.36,1) forwards; }
.nodo-pulso { animation: pulsoNodo 1.8s infinite; }
.barra-flotante { animation: barraSube .35s cubic-bezier(.22,1,.36,1); }
.borde-animado {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #10b981, #3b82f6);
  background-size: 300% 100%;
  animation: gradienteMueve 6s linear infinite;
}
.confeti { position: absolute; top: 0; width: 7px; height: 11px; border-radius: 2px; animation: confeti 1.8s ease-out forwards; }
`;

/* ================================================================== */
/*  Hook: contador animado                                             */
/* ================================================================== */
function useContador(objetivo, duracion = 900) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    let raf;
    const inicio = performance.now();
    const paso = (t) => {
      const p = Math.min((t - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - p, 3);
      setValor(Math.round(objetivo * suave));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, duracion]);
  return valor;
}

/* ================================================================== */
/*  Resaltado de coincidencias                                         */
/* ================================================================== */
function Resaltar({ texto, consulta }) {
  const t = String(texto ?? "");
  const tokens = String(consulta || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escaparRegex);
  if (!tokens.length) return <>{t}</>;
  const regex = new RegExp(`(${tokens.join("|")})`, "ig");
  const partes = t.split(regex);
  return (
    <>
      {partes.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-yellow-300/60 px-0.5 text-inherit">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/* ================================================================== */
/*  Avatar con respaldo de iniciales                                   */
/* ================================================================== */
function Avatar({ estudiante, size = 40, className = "" }) {
  const [fotoFallida, setFotoFallida] = useState("");
  const px = { width: size, height: size };
  const foto = fotoDe(estudiante);
  if (!foto || fotoFallida === foto) {
    return (
      <div
        style={{ ...px, fontSize: size * 0.36 }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold text-white ${className}`}
      >
        {iniciales(estudiante)}
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt=""
      style={px}
      loading="lazy"
      decoding="async"
      onError={() => setFotoFallida(foto)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}

/* ================================================================== */
/*  Confeti (para egresados)                                           */
/* ================================================================== */
function Confeti() {
  const piezas = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        l: Math.random() * 100,
        d: Math.random() * 0.7,
        dx: (Math.random() - 0.5) * 120,
        rot: Math.random() * 720 - 360,
        c: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"][i % 6],
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {piezas.map((p, i) => (
        <span
          key={i}
          className="confeti"
          style={{
            left: `${p.l}%`,
            background: p.c,
            animationDelay: `${p.d}s`,
            "--dx": `${p.dx}px`,
            "--rot": `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Tarjeta de estadística                                             */
/* ================================================================== */
function TarjetaEstadistica({
  icono: Icono,
  fondo,
  color,
  etiqueta,
  valor,
  descripcion,
  tema,
  darkMode,
  onClick,
}) {
  const numero = useContador(valor);
  const ref = useRef(null);

  const mover = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--x", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      onMouseMove={mover}
      title="Clic para filtrar la tabla"
      className={`group relative cursor-pointer overflow-hidden rounded-xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none ${tema.tarjeta}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(220px circle at var(--x,50%) var(--y,50%), ${
            darkMode ? "rgba(96,165,250,.18)" : "rgba(59,130,246,.12)"
          }, transparent 70%)`,
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-2.5 transition group-hover:scale-110 ${fondo} ${color}`}>
            <Icono size={21} />
          </div>
          <span className={`text-xs font-medium ${color}`}>{etiqueta}</span>
        </div>
        <p className="mt-4 text-3xl font-bold tabular-nums">{numero}</p>
        <p className={`mt-1 text-sm ${tema.secundario}`}>{descripcion}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Gráfico de dona animado                                            */
/* ================================================================== */
function DonaEstados({ datos, total, tema }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMontado(true), 150);
    return () => clearTimeout(t);
  }, []);

  const r = 40;
  const C = 2 * Math.PI * r;
  let acumulado = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="opacity-10" />
          {total > 0 &&
            datos.map((d) => {
              const largo = (d.valor / total) * C;
              const offset = acumulado;
              acumulado += largo;
              return (
                <circle
                  key={d.nombre}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="10"
                  strokeLinecap="butt"
                  strokeDasharray={`${montado ? largo : 0} ${C}`}
                  strokeDashoffset={-offset}
                  style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1)" }}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{total}</span>
          <span className={`text-[11px] ${tema.secundario}`}>estudiantes</span>
        </div>
      </div>

      <ul className="w-full space-y-3">
        {datos.map((d) => {
          const pct = total ? Math.round((d.valor / total) * 100) : 0;
          return (
            <li key={d.nombre}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.nombre}
                </span>
                <span className={tema.secundario}>
                  {d.valor} · {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-500/15">
                <div
                  className="barra-brillo h-full rounded-full"
                  style={{
                    width: montado ? `${pct}%` : "0%",
                    background: d.color,
                    transition: "width 1.2s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================== */
/*  Anillo de progreso                                                 */
/* ================================================================== */
function AnilloProgreso({ valor, color, tamano = 112 }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMontado(true), 200);
    return () => clearTimeout(t);
  }, []);
  const r = 44;
  const C = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="opacity-10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={montado ? C - (valor / 100) * C : C}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums">{valor}%</span>
        <span className="text-[10px] opacity-60">avance</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Insignia de estado                                                 */
/* ================================================================== */
function InsigniaEstado({ estado }) {
  const estadoValido = estadoNormalizado({ estado });
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        estiloEstado[estadoValido] || "bg-blue-50 text-blue-700 ring-blue-600/10"
      }`}
    >
      {estadoValido}
    </span>
  );
}

/* ================================================================== */
/*  Paleta de comandos (Ctrl + K)                                      */
/* ================================================================== */
function PaletaComandos({
  estudiantes,
  acciones,
  recientes,
  onAbrirAlumno,
  onCerrar,
  tema,
}) {
  const [consulta, setConsulta] = useState("");
  const [indice, setIndice] = useState(0);
  const inputRef = useRef(null);
  const activoRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = useMemo(() => {
    const tokens = normalizar(consulta).split(/\s+/).filter(Boolean);
    const lista = [];

    let grupo = "Alumnos";
    let alumnos;
    if (tokens.length) {
      alumnos = estudiantes
        .filter((e) => {
          const t = textoPaleta(e);
          return tokens.every((k) => t.includes(k));
        })
        .slice(0, 6);
    } else {
      grupo = "Recientes";
      alumnos = recientes
        .map((id) => estudiantes.find((e) => idEstudianteDe(e) === id))
        .filter(Boolean);
    }
    alumnos.forEach((e) =>
      lista.push({
        grupo,
        tipo: "alumno",
        est: e,
        label: nombreCompleto(e),
        sub: `DNI ${e.dni} · ${e.programa_estudios || "Sin programa"}`,
        icono: Clock,
        accion: () => onAbrirAlumno(e),
      })
    );

    acciones
      .filter(
        (a) =>
          !tokens.length ||
          tokens.every((k) => normalizar(`${a.label} ${a.sub}`).includes(k))
      )
      .forEach((a) => lista.push({ ...a, grupo: "Acciones", tipo: "accion" }));

    return lista;
  }, [consulta, estudiantes, acciones, recientes, onAbrirAlumno]);

  useEffect(() => {
    setIndice(0);
  }, [consulta]);

  useEffect(() => {
    activoRef.current?.scrollIntoView({ block: "nearest" });
  }, [indice]);

  const ejecutar = (item) => {
    if (!item) return;
    onCerrar();
    item.accion();
  };

  const teclas = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      ejecutar(items[indice]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]">
      <div
        className="fade-anim absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCerrar}
      />
      <div
        className={`paleta-anim relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${tema.panel} ${tema.texto}`}
      >
        <div className="borde-animado h-0.5 w-full" />

        <div className="flex items-center gap-3 border-b border-slate-400/20 px-5 py-4">
          <Search size={20} className="text-blue-500" />
          <input
            ref={inputRef}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={teclas}
            placeholder="Busca un alumno o ejecuta una acción…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-400/30 px-1.5 py-0.5 text-[10px] opacity-60">
            Esc
          </kbd>
        </div>

        <ul className="max-h-[340px] overflow-y-auto p-2">
          {items.length === 0 ? (
            <li className={`flex flex-col items-center px-3 py-10 text-center text-sm ${tema.secundario}`}>
              <Search size={24} className="flotar mb-2 opacity-50" />
              Sin resultados para “{consulta}”.
            </li>
          ) : (
            items.map((item, i) => {
              const Icono = item.icono;
              const esActivo = i === indice;
              const nuevoGrupo = item.grupo !== items[i - 1]?.grupo;
              return (
                <li key={`${item.tipo}-${item.label}-${i}`}>
                  {nuevoGrupo && (
                    <p className={`px-3 pb-1 pt-2 text-xs font-semibold ${tema.secundario}`}>
                      {item.grupo}
                    </p>
                  )}
                  <button
                    ref={esActivo ? activoRef : null}
                    type="button"
                    onMouseEnter={() => setIndice(i)}
                    onClick={() => ejecutar(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                      esActivo ? "bg-blue-600 text-white" : tema.inactivo
                    }`}
                  >
                    {item.tipo === "alumno" ? (
                      <Avatar estudiante={item.est} size={32} />
                    ) : (
                      <span
                        className={`rounded-lg p-2 ${
                          esActivo ? "bg-white/20" : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Icono size={16} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        <Resaltar texto={item.label} consulta={consulta} />
                      </span>
                      <span
                        className={`block truncate text-xs ${
                          esActivo ? "text-blue-100" : tema.secundario
                        }`}
                      >
                        {item.sub}
                      </span>
                    </span>
                    {item.tipo === "alumno" && (
                      <span className={`text-xs tabular-nums ${esActivo ? "text-blue-100" : tema.secundario}`}>
                        {obtenerProgreso(item.est)}%
                      </span>
                    )}
                    {esActivo && <CornerDownLeft size={15} />}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div
          className={`flex items-center gap-4 border-t border-slate-400/20 px-5 py-2.5 text-xs ${tema.secundario}`}
        >
          <span>↑↓ navegar</span>
          <span>↵ seleccionar</span>
          <span className="ml-auto flex items-center gap-1">
            <Zap size={12} className="text-blue-500" />
            {items.length} resultado(s)
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Panel lateral de vista rápida                                      */
/* ================================================================== */
function PanelRapido({
  estudiante,
  posicion,
  total,
  onCerrar,
  onAnterior,
  onSiguiente,
  onVerExpediente,
  onEditar,
  onEliminar,
  tema,
}) {
  const [tab, setTab] = useState("resumen");
  const [copiado, setCopiado] = useState(null);

  const tabs = [
    { id: "resumen", etiqueta: "Resumen" },
    { id: "tramite", etiqueta: "Trámite" },
    { id: "contacto", etiqueta: "Contacto" },
  ];
  const idxTab = tabs.findIndex((t) => t.id === tab);

  const idEst = idEstudianteDe(estudiante);
  const estadoValido = estadoNormalizado(estudiante);
  const progreso = obtenerProgreso(estudiante);
  const real = tieneProgresoReal(estudiante);
  const color = colorEstado[estadoValido] || colorEstado["En progreso"];
  const idxActual = etapasTitulacion.findIndex((et) => progreso < et.umbral);
  const proximoPaso = idxActual === -1 ? null : etapasTitulacion[idxActual];

  const copiar = async (texto, clave) => {
    try {
      await navigator.clipboard.writeText(String(texto));
      setCopiado(clave);
      setTimeout(() => setCopiado((c) => (c === clave ? null : c)), 1500);
    } catch {
      /* el navegador bloqueó el portapapeles */
    }
  };

  const BotonCopiar = ({ valor, clave }) => (
    <button
      type="button"
      onClick={() => valor && copiar(valor, clave)}
      title="Copiar"
      className={`rounded-lg p-1.5 transition ${tema.inactivo}`}
    >
      {copiado === clave ? (
        <Check size={15} className="text-emerald-500" />
      ) : (
        <Copy size={15} />
      )}
    </button>
  );

  const retraso = (i) => ({ animationDelay: `${i * 80}ms` });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="fade-anim absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCerrar}
      />
      <aside
        className={`drawer-anim relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden border-l shadow-2xl ${tema.panel} ${tema.texto}`}
      >
        {estadoValido === "Egresado" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-48 overflow-hidden">
            <Confeti key={idEst} />
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onAnterior || undefined}
              disabled={!onAnterior}
              title="Alumno anterior (←)"
              className={`rounded-lg border p-1.5 transition disabled:opacity-30 ${tema.panel} ${tema.inactivo}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={onSiguiente || undefined}
              disabled={!onSiguiente}
              title="Alumno siguiente (→)"
              className={`rounded-lg border p-1.5 transition disabled:opacity-30 ${tema.panel} ${tema.inactivo}`}
            >
              <ChevronRight size={18} />
            </button>
            {posicion > 0 && (
              <span className={`ml-2 text-xs font-medium ${tema.secundario}`}>
                {posicion} de {total}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            title="Cerrar (Esc)"
            className={`rounded-lg border p-1.5 transition hover:rotate-90 ${tema.panel} ${tema.inactivo}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div key={idEst} className="item-anim mt-2 flex items-center gap-4">
            <Avatar
              estudiante={estudiante}
              size={80}
              className="ring-2 ring-blue-500/20"
            />
            <div className="min-w-0 pb-1">
              <h3 className="break-words text-xl font-bold leading-tight">
                {nombreCompleto(estudiante)}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <InsigniaEstado estado={estadoValido} />
                <span className={`text-xs ${tema.secundario}`}>ID #{idEst}</span>
              </div>
            </div>
          </div>

          <div className="relative mt-6 flex border-b border-slate-400/20">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`w-1/3 py-2.5 text-sm font-semibold transition ${
                  tab === t.id ? "text-blue-600" : tema.secundario
                }`}
              >
                {t.etiqueta}
              </button>
            ))}
            <span
              className="absolute bottom-0 h-0.5 w-1/3 bg-blue-600 transition-transform duration-300"
              style={{ transform: `translateX(${idxTab * 100}%)` }}
            />
          </div>

          <div key={`${idEst}-${tab}`} className="mt-6">
            {tab === "resumen" && (
              <div className="space-y-5">
                <div className="item-anim flex flex-col items-center" style={retraso(0)}>
                  <AnilloProgreso valor={progreso} color={color} tamano={128} />
                  <p className={`mt-2 text-xs ${tema.secundario}`}>
                    Avance hacia la titulación{!real && " (estimado)"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`item-anim rounded-xl border p-3 ${tema.tarjeta}`} style={retraso(1)}>
                    <Hash size={16} className="text-blue-500" />
                    <p className={`mt-2 text-xs ${tema.secundario}`}>Semestre</p>
                    <p className="text-sm font-semibold">{estudiante.semestre || "Sin semestre"}</p>
                  </div>
                  <div className={`item-anim rounded-xl border p-3 ${tema.tarjeta}`} style={retraso(2)}>
                    <Flag size={16} className="text-blue-500" />
                    <p className={`mt-2 text-xs ${tema.secundario}`}>Estado</p>
                    <p className="text-sm font-semibold">{estadoValido}</p>
                  </div>
                </div>

                <div className={`item-anim flex items-start gap-3 rounded-xl border p-4 ${tema.tarjeta}`} style={retraso(3)}>
                  <GraduationCap size={18} className="mt-0.5 text-blue-500" />
                  <div>
                    <p className={`text-xs ${tema.secundario}`}>Programa de estudios</p>
                    <p className="text-sm font-semibold">{estudiante.programa_estudios || "Sin programa"}</p>
                  </div>
                </div>

                <div
                  className={`item-anim rounded-xl border p-4 ${tema.tarjeta}`}
                  style={retraso(4)}
                >
                  <p className={`text-xs ${tema.secundario}`}>Próximo paso</p>
                  <p className="mt-1 text-sm font-semibold">
                    {proximoPaso ? proximoPaso.titulo : "Trámite de titulación completado"}
                  </p>
                  <p className={`mt-0.5 text-xs ${tema.secundario}`}>
                    {proximoPaso ? proximoPaso.desc : "No quedan etapas pendientes."}
                  </p>
                </div>
              </div>
            )}

            {tab === "tramite" && (
              <div>
                <ol>
                  {etapasTitulacion.map((et, i) => {
                    const completada = progreso >= et.umbral;
                    const actual = i === idxActual;
                    const ultima = i === etapasTitulacion.length - 1;
                    return (
                      <li key={et.titulo} className="item-anim flex gap-4" style={retraso(i)}>
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              completada
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : actual
                                ? "nodo-pulso border-blue-500 bg-blue-500 text-white"
                                : "border-slate-400/40 text-slate-400"
                            }`}
                          >
                            {completada ? <Check size={15} /> : i + 1}
                          </span>
                          {!ultima && (
                            <span
                              className={`my-1 w-0.5 flex-1 ${
                                completada ? "bg-emerald-500" : "bg-slate-400/30"
                              }`}
                              style={{ minHeight: 28 }}
                            />
                          )}
                        </div>
                        <div className="pb-5">
                          <p className={`text-sm font-semibold ${!completada && !actual ? tema.secundario : ""}`}>
                            {et.titulo}
                          </p>
                          <p className={`mt-0.5 text-xs ${tema.secundario}`}>{et.desc}</p>
                          {actual && (
                            <span className="mt-1.5 inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                              En curso
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {!real && (
                  <p className={`mt-2 rounded-lg border border-dashed border-slate-400/40 p-3 text-xs ${tema.secundario}`}>
                    Las etapas se estiman según el estado del alumno. Cuando tu API envíe el
                    campo <code>progreso</code> (0 a 100), se mostrará el avance real.
                  </p>
                )}
              </div>
            )}

            {tab === "contacto" && (
              <div className="space-y-3">
                {[
                  { clave: "dni", icono: Hash, etiqueta: "DNI", valor: estudiante.dni },
                  {
                    clave: "correo",
                    icono: Mail,
                    etiqueta: "Correo",
                    valor: estudiante.correo || estudiante.email,
                  },
                  { clave: "tel", icono: Phone, etiqueta: "Teléfono", valor: estudiante.telefono },
                ].map((f, i) => {
                  const Icono = f.icono;
                  return (
                    <div
                      key={f.clave}
                      className={`item-anim flex items-center gap-3 rounded-xl border p-3 ${tema.tarjeta}`}
                      style={retraso(i)}
                    >
                      <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <Icono size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs ${tema.secundario}`}>{f.etiqueta}</p>
                        <p className="truncate text-sm font-semibold">{f.valor || "No registrado"}</p>
                      </div>
                      <BotonCopiar valor={f.valor} clave={f.clave} />
                    </div>
                  );
                })}

                <div className="item-anim grid grid-cols-3 gap-2 pt-2" style={retraso(3)}>
                  <a
                    href={
                      estudiante.correo || estudiante.email
                        ? `mailto:${estudiante.correo || estudiante.email}`
                        : undefined
                    }
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition hover:-translate-y-0.5 ${tema.panel} ${tema.inactivo} ${
                      !(estudiante.correo || estudiante.email) ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    <Mail size={18} className="text-blue-500" /> Correo
                  </a>
                  <a
                    href={estudiante.telefono ? `tel:${estudiante.telefono}` : undefined}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition hover:-translate-y-0.5 ${tema.panel} ${tema.inactivo} ${
                      !estudiante.telefono ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    <Phone size={18} className="text-blue-500" /> Llamar
                  </a>
                  <a
                    href={
                      estudiante.telefono
                        ? `https://wa.me/${telefonoWhatsApp(estudiante.telefono)}`
                        : undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition hover:-translate-y-0.5 ${tema.panel} ${tema.inactivo} ${
                      !estudiante.telefono ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    <MessageCircle size={18} className="text-emerald-500" /> WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-400/20 p-4">
          <button
            type="button"
            onClick={onVerExpediente}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            <Eye size={16} /> Ver expediente
          </button>
          <button
            type="button"
            onClick={onEditar}
            title="Editar datos"
            className={`rounded-xl border px-3.5 transition active:scale-95 ${tema.panel} ${tema.inactivo}`}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={onEliminar}
            title="Eliminar estudiante"
            className="rounded-xl border border-rose-200 px-3.5 text-rose-600 transition hover:bg-rose-50 active:scale-95"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ================================================================== */
/*  Componente principal                                               */
/* ================================================================== */
export default function Estudiantes({ onVerEstudiante, darkMode = false }) {
  const [estudiantes, setEstudiantes] = useState(() =>
    leerCacheEstudiantesInicial()
  );
  const [cargando, setCargando] = useState(
    () => leerCacheEstudiantesInicial().length === 0
  );
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const busquedaDif = useDeferredValue(busqueda);
  const [estadoActivo, setEstadoActivo] = useState("Todos");
  const [alerta, setAlerta] = useState({ mensaje: "", tipo: "", id: 0 });

  const [orden, setOrden] = useState({ campo: null, dir: "asc" });
  const [compacto, setCompacto] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  const [porPagina, setPorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);

  const [estudianteRapido, setEstudianteRapido] = useState(null);
  const [paletaAbierta, setPaletaAbierta] = useState(false);
  const [recientes, setRecientes] = useState([]);

  const inputBusquedaRef = useRef(null);

  const mostrarAlerta = (mensaje, tipo) => {
    const id = Date.now();
    setAlerta({ mensaje, tipo, id });
    setTimeout(() => {
      setAlerta((a) => (a.id === id ? { mensaje: "", tipo: "", id: 0 } : a));
    }, 4000);
  };

  const obtenerEstudiantes = async ({ forzarRefresco = false } = {}) => {
    if (forzarRefresco) {
      invalidateApiCache("/estudiantes");
      setCargando(true);
    } else if (estudiantes.length === 0) {
      setCargando(true);
    }

    setError(null);

    try {
      const response = await api.get("/estudiantes", {
        params: { all: true, todos: 1, per_page: 1000 },
      });
      const lista = extraerEstudiantesDePayload(response.data);

      if (lista.length > 0 || forzarRefresco) {
        setEstudiantes(lista);
      }
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
      if (estudiantes.length === 0) {
        setError(
          err?.response?.data?.message ||
            "No se pudieron cargar los estudiantes desde el servidor."
        );
        setEstudiantes([]);
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerEstudiantes({ forzarRefresco: false });
    const sincronizar = () => obtenerEstudiantes({ forzarRefresco: true });
    window.addEventListener("expediente:actualizado", sincronizar);
    return () => window.removeEventListener("expediente:actualizado", sincronizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estudiantesFiltrados = useMemo(() => {
    const tokens = normalizar(busquedaDif).split(/\s+/).filter(Boolean);

    return estudiantes.filter((estudiante) => {
      if (
        estadoActivo !== "Todos" &&
        estadoNormalizado(estudiante) !== estadoActivo
      )
        return false;
      if (!tokens.length) return true;
      const texto = textoTabla(estudiante);
      return tokens.every((t) => texto.includes(t));
    });
  }, [estudiantes, busquedaDif, estadoActivo]);

  const estudiantesOrdenados = useMemo(() => {
    if (!orden.campo) return estudiantesFiltrados;
    const f = orden.dir === "asc" ? 1 : -1;
    return [...estudiantesFiltrados].sort((a, b) => {
      const va = valorOrden(a, orden.campo);
      const vb = valorOrden(b, orden.campo);
      if (typeof va === "number") return (va - vb) * f;
      return String(va).localeCompare(String(vb), "es", { numeric: true }) * f;
    });
  }, [estudiantesFiltrados, orden]);

  const alternarOrden = (campo) =>
    setOrden((o) =>
      o.campo !== campo
        ? { campo, dir: "asc" }
        : o.dir === "asc"
        ? { campo, dir: "desc" }
        : { campo: null, dir: "asc" }
    );

  const totalPaginas = Math.max(
    1,
    Math.ceil(estudiantesOrdenados.length / porPagina)
  );

  const estudiantesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * porPagina;
    return estudiantesOrdenados.slice(inicio, inicio + porPagina);
  }, [estudiantesOrdenados, paginaActual, porPagina]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaDif, estadoActivo, porPagina]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [totalPaginas, paginaActual]);

  const numerosPagina = useMemo(() => {
    const paginas = [];
    for (let i = 1; i <= totalPaginas; i++) {
      if (i === 1 || i === totalPaginas || Math.abs(i - paginaActual) <= 1) {
        paginas.push(i);
      } else if (paginas[paginas.length - 1] !== "...") {
        paginas.push("...");
      }
    }
    return paginas;
  }, [totalPaginas, paginaActual]);

  const inicioRango =
    estudiantesOrdenados.length === 0 ? 0 : (paginaActual - 1) * porPagina + 1;
  const finRango = Math.min(
    paginaActual * porPagina,
    estudiantesOrdenados.length
  );

  const listaNav = estudiantesOrdenados;
  const idxNav = estudianteRapido
    ? listaNav.findIndex((e) => idEstudianteDe(e) === idEstudianteDe(estudianteRapido))
    : -1;

  const abrirRapido = (e) => {
    const id = idEstudianteDe(e);
    setEstudianteRapido(e);
    setRecientes((r) => [id, ...r.filter((x) => x !== id)].slice(0, 4));
  };

  const irAnterior = () => idxNav > 0 && abrirRapido(listaNav[idxNav - 1]);
  const irSiguiente = () =>
    idxNav >= 0 && idxNav < listaNav.length - 1 && abrirRapido(listaNav[idxNav + 1]);

  useEffect(() => {
    if (!estudianteRapido) return;
    const idRapido = idEstudianteDe(estudianteRapido);
    const actualizado = estudiantes.find((x) => idEstudianteDe(x) === idRapido);
    if (actualizado && actualizado !== estudianteRapido) {
      setEstudianteRapido(actualizado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudiantes]);

  useEffect(() => {
    const manejar = (e) => {
      const escribiendo = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName
      );

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletaAbierta((p) => !p);
      } else if (e.key === "Escape") {
        if (paletaAbierta) setPaletaAbierta(false);
        else if (estudianteRapido) setEstudianteRapido(null);
      } else if (e.key === "/" && !escribiendo && !paletaAbierta) {
        e.preventDefault();
        inputBusquedaRef.current?.focus();
      } else if (
        estudianteRapido &&
        !paletaAbierta &&
        !escribiendo &&
        !modalAbierto &&
        !modalImportarAbierto
      ) {
        if (e.key === "ArrowRight") irSiguiente();
        if (e.key === "ArrowLeft") irAnterior();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletaAbierta, estudianteRapido, modalAbierto, modalImportarAbierto, listaNav]);

  const handleAbrirNuevo = () => {
    setEstudianteSeleccionado(null);
    setModalAbierto(true);
  };

  const handleAbrirEditar = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setModalAbierto(true);
  };

  const handleGuardadoExitoso = (estudianteGuardado) => {
    if (estudianteGuardado?.id_estudiante) {
      const idActualizado = idEstudianteDe(estudianteGuardado);
      setEstudiantes((actuales) =>
        actuales.map((estudiante) =>
          idEstudianteDe(estudiante) === idActualizado
            ? { ...estudiante, ...estudianteGuardado }
            : estudiante
        )
      );
      setEstudianteSeleccionado(estudianteGuardado);
      setEstudianteRapido((actual) =>
        actual && idEstudianteDe(actual) === idActualizado
          ? { ...actual, ...estudianteGuardado }
          : actual
      );
    }

    obtenerEstudiantes({ forzarRefresco: true });
    mostrarAlerta(
      estudianteSeleccionado
        ? "Estudiante actualizado correctamente."
        : "Estudiante registrado exitosamente.",
      "success"
    );
  };

  const handleImportadoExitoso = (cantidad) => {
    obtenerEstudiantes({ forzarRefresco: true });
    mostrarAlerta(`${cantidad} estudiante(s) importado(s) correctamente.`, "success");
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este estudiante del sistema?"))
      return;
    try {
      await api.delete(`/estudiantes/${id}`);
      invalidateApiCache("/estudiantes");
      setEstudiantes((prev) => prev.filter((e) => idEstudianteDe(e) !== id));
      setSeleccionados((prev) => prev.filter((x) => x !== id));
      setEstudianteRapido(null);
      mostrarAlerta("Estudiante eliminado correctamente.", "success");
    } catch (err) {
      console.error("Error al eliminar:", err);
      mostrarAlerta("No se pudo eliminar el estudiante.", "error");
    }
  };

  const eliminarSeleccionados = async () => {
    const ids = [...seleccionados];
    if (!ids.length) return;
    if (!window.confirm(`¿Eliminar ${ids.length} estudiante(s) seleccionado(s)?`))
      return;

    const resultados = await Promise.allSettled(
      ids.map((id) => api.delete(`/estudiantes/${id}`))
    );
    const eliminados = ids.filter((_, i) => resultados[i].status === "fulfilled");
    const fallidos = ids.length - eliminados.length;

    invalidateApiCache("/estudiantes");
    setEstudiantes((prev) => prev.filter((e) => !eliminados.includes(idEstudianteDe(e))));
    setSeleccionados((prev) => prev.filter((id) => !eliminados.includes(id)));

    if (fallidos === 0) {
      mostrarAlerta(`${eliminados.length} estudiante(s) eliminado(s).`, "success");
    } else {
      mostrarAlerta(
        `Se eliminaron ${eliminados.length}; ${fallidos} no se pudieron eliminar.`,
        "error"
      );
    }
  };

  const exportarCSV = (lista, nombreArchivo) => {
    if (!lista.length) {
      mostrarAlerta("No hay estudiantes para exportar.", "error");
      return;
    }
    const cabecera = [
      "ID", "DNI", "Nombres", "Apellidos", "Programa", "Semestre", "Correo", "Telefono", "Estado",
    ];
    const filas = lista.map((e) =>
      [
        idEstudianteDe(e),
        e.dni,
        e.nombres || e.nombre,
        e.apellidos,
        e.programa_estudios,
        e.semestre,
        e.correo || e.email,
        e.telefono,
        estadoNormalizado(e),
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const contenido = "\uFEFF" + [cabecera.join(","), ...filas].join("\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);
    mostrarAlerta(`${lista.length} estudiante(s) exportado(s) a CSV.`, "success");
  };

  const copiarDni = async (dni) => {
    try {
      await navigator.clipboard.writeText(String(dni));
      mostrarAlerta(`DNI ${dni} copiado.`, "success");
    } catch {
      mostrarAlerta("No se pudo copiar el DNI.", "error");
    }
  };

  const contarEstado = (estado) => {
    if (estado === "Todos") return estudiantes.length;
    return estudiantes.filter((e) => estadoNormalizado(e) === estado).length;
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoActivo("Todos");
    setOrden({ campo: null, dir: "asc" });
  };

  const hayFiltros =
    busqueda.trim() !== "" || estadoActivo !== "Todos" || orden.campo !== null;

  const alternarSeleccion = (id) =>
    setSeleccionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const todosPaginaSeleccionados =
    estudiantesPaginados.length > 0 &&
    estudiantesPaginados.every((e) => seleccionados.includes(idEstudianteDe(e)));

  const alternarTodosPagina = () => {
    const idsPagina = estudiantesPaginados.map(idEstudianteDe).filter(Boolean);
    setSeleccionados((s) =>
      todosPaginaSeleccionados
        ? s.filter((id) => !idsPagina.includes(id))
        : [...new Set([...s, ...idsPagina])]
    );
  };

  const accionesPaleta = [
    { label: "Nuevo estudiante", sub: "Registrar un alumno", icono: Plus, accion: handleAbrirNuevo },
    { label: "Importar estudiantes", sub: "Carga masiva desde archivo", icono: Upload, accion: () => setModalImportarAbierto(true) },
    { label: "Actualizar listado", sub: "Volver a consultar el servidor", icono: RefreshCcw, accion: () => obtenerEstudiantes({ forzarRefresco: true }) },
    { label: "Exportar a CSV", sub: `Descargar los ${estudiantesOrdenados.length} alumnos visibles`, icono: Download, accion: () => exportarCSV(estudiantesOrdenados, "estudiantes.csv") },
    { label: "Ver alumnos en progreso", sub: "Filtrar la tabla por estado", icono: GraduationCap, accion: () => setEstadoActivo("En progreso") },
    { label: "Ver alumnos pendientes", sub: "Filtrar la tabla por estado", icono: BookOpen, accion: () => setEstadoActivo("Pendiente") },
    { label: "Ver egresados", sub: "Filtrar la tabla por estado", icono: Sparkles, accion: () => setEstadoActivo("Egresado") },
    { label: "Ver todos los alumnos", sub: "Quitar el filtro de estado", icono: Users, accion: () => setEstadoActivo("Todos") },
    { label: "Limpiar filtros", sub: "Búsqueda, estado y orden", icono: Eraser, accion: limpiarFiltros },
    { label: compacto ? "Tabla en modo cómodo" : "Tabla en modo compacto", sub: "Cambiar la densidad de las filas", icono: AlignJustify, accion: () => setCompacto((c) => !c) },
  ];

  const datosDona = [
    { nombre: "En progreso", valor: contarEstado("En progreso"), color: colorEstado["En progreso"] },
    { nombre: "Pendiente", valor: contarEstado("Pendiente"), color: colorEstado["Pendiente"] },
    { nombre: "Egresado", valor: contarEstado("Egresado"), color: colorEstado["Egresado"] },
  ];
  const totalDona = datosDona.reduce((acc, d) => acc + d.valor, 0);

  const tema = darkMode
    ? {
        texto: "text-slate-100",
        secundario: "text-slate-400",
        panel: "bg-[#1e293b] border-slate-700",
        campo:
          "bg-[#0f172a] border-slate-700 text-slate-100 placeholder:text-slate-500",
        fila: "border-slate-700 hover:bg-slate-800/70",
        encabezado: "bg-slate-800 text-slate-300",
        tarjeta: "bg-[#1e293b] border-slate-700",
        inactivo: "text-slate-300 hover:bg-slate-800",
      }
    : {
        texto: "text-slate-800",
        secundario: "text-slate-500",
        panel: "bg-white border-slate-200",
        campo:
          "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400",
        fila: "border-slate-100 hover:bg-slate-50",
        encabezado: "bg-slate-50 text-slate-500",
        tarjeta: "bg-white border-slate-200",
        inactivo: "text-slate-600 hover:bg-slate-50",
      };

  const pad = compacto ? "py-2.5" : "py-4";
  const tamanoAvatar = compacto ? 32 : 40;

  const cabecera = (campo, etiqueta) => {
    const activa = orden.campo === campo;
    const Icono = !activa ? ArrowUpDown : orden.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th className="px-5 py-4 font-semibold">
        <button
          type="button"
          onClick={() => alternarOrden(campo)}
          className={`inline-flex items-center gap-1.5 transition hover:text-blue-600 ${
            activa ? "text-blue-600" : ""
          }`}
        >
          {etiqueta}
          <Icono size={13} className={activa ? "" : "opacity-40"} />
        </button>
      </th>
    );
  };

  return (
    <main className={`min-h-full space-y-6 px-10 pb-8 pt-10 ${tema.texto}`}>
      <style>{estilosAnimaciones}</style>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Gestión académica</span>
            <span className="text-slate-300">/</span>
            <span className={darkMode ? "text-slate-300" : "text-slate-600"}>Estudiantes</span>
          </div>

          <h1 className={`text-[30px] font-extrabold leading-[1.15] tracking-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
            Estudiantes
          </h1>

          <p className={`mt-1 text-sm leading-5 ${tema.secundario}`}>
            Administra y consulta la información de los estudiantes registrados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => obtenerEstudiantes({ forzarRefresco: true })}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${tema.panel} ${tema.inactivo}`}
          >
            <RefreshCcw size={16} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => setModalImportarAbierto(true)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${tema.panel} ${tema.inactivo}`}
          >
            <Upload size={16} />
            Importar
          </button>

          <button
            type="button"
            onClick={handleAbrirNuevo}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
          >
            <Plus size={18} />
            Nuevo Estudiante
          </button>
        </div>
      </header>

      {alerta.mensaje && (
        <div
          key={alerta.id}
          className={`alerta-anim relative overflow-hidden rounded-xl border p-4 text-sm font-medium shadow-sm ${
            alerta.tipo === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {alerta.tipo === "success" ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
            )}
            <span className="flex-1">{alerta.mensaje}</span>
          </div>
          <div
            className={`barra-tiempo absolute bottom-0 left-0 h-0.5 ${
              alerta.tipo === "success" ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaEstadistica
          icono={Users}
          fondo="bg-blue-50"
          color="text-blue-600"
          etiqueta="Registrados"
          valor={contarEstado("Todos")}
          descripcion="Total de estudiantes"
          tema={tema}
          darkMode={darkMode}
          onClick={() => setEstadoActivo("Todos")}
        />
        <TarjetaEstadistica
          icono={GraduationCap}
          fondo="bg-emerald-50"
          color="text-emerald-600"
          etiqueta="Activos"
          valor={contarEstado("En progreso")}
          descripcion="En progreso académico"
          tema={tema}
          darkMode={darkMode}
          onClick={() => setEstadoActivo("En progreso")}
        />
        <TarjetaEstadistica
          icono={BookOpen}
          fondo="bg-amber-50"
          color="text-amber-600"
          etiqueta="Pendientes"
          valor={contarEstado("Pendiente")}
          descripcion="Requieren seguimiento"
          tema={tema}
          darkMode={darkMode}
          onClick={() => setEstadoActivo("Pendiente")}
        />
        <TarjetaEstadistica
          icono={Sparkles}
          fondo="bg-violet-50"
          color="text-violet-600"
          etiqueta="Egresados"
          valor={contarEstado("Egresado")}
          descripcion="Formación concluida"
          tema={tema}
          darkMode={darkMode}
          onClick={() => setEstadoActivo("Egresado")}
        />
      </section>

      {!cargando && !error && (
        <section className={`fade-anim rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Distribución por estado</h2>
            <p className={`text-sm ${tema.secundario}`}>
              Así se reparte tu población estudiantil hoy.
            </p>
          </div>
          <DonaEstados datos={datosDona} total={totalDona} tema={tema} />
        </section>
      )}

      <section className={`overflow-hidden rounded-xl border ${tema.panel}`}>
        {cargando && (
          <div className="h-0.5 w-full overflow-hidden bg-blue-500/10">
            <div className="barra-carga h-full w-1/3 bg-blue-500" />
          </div>
        )}
        <div className="flex flex-col gap-4 border-b border-inherit p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Listado de estudiantes</h2>
              <p className={`mt-1 text-sm ${tema.secundario}`}>
                Haz clic en una fila para ver su resumen, ordena con los encabezados o
                presiona <kbd className="rounded border border-slate-400/30 px-1 text-[10px]">/</kbd> para buscar.
              </p>
            </div>
            <span className={`text-sm ${tema.secundario}`}>
              {estudiantesFiltrados.length} resultado(s)
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${tema.secundario}`}
              />
              <input
                ref={inputBusquedaRef}
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por DNI, nombres o apellidos..."
                className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${tema.campo}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter size={17} className={tema.secundario} />
              <select
                value={estadoActivo}
                onChange={(e) => setEstadoActivo(e.target.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setCompacto((c) => !c)}
                title={compacto ? "Filas cómodas" : "Filas compactas"}
                className={`rounded-lg border p-2.5 transition ${tema.panel} ${tema.inactivo} ${
                  compacto ? "border-blue-500 text-blue-600" : ""
                }`}
              >
                <AlignJustify size={17} />
              </button>

              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  <Eraser size={15} /> Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[680px] overflow-y-auto p-3 sm:hidden">
          {cargando ? (
            <div className="space-y-3" aria-label="Cargando estudiantes">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-inherit p-4">
                  <div className="skeleton mb-3 h-4 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-500">{error}</p>
          ) : estudiantesPaginados.length > 0 ? (
            <ul className="space-y-3">
              {estudiantesPaginados.map((estudiante, i) => {
                const idEst = idEstudianteDe(estudiante);
                const marcado = seleccionados.includes(idEst);
                const estadoValido = estadoNormalizado(estudiante);

                return (
                  <li
                    key={idEst ?? i}
                    onClick={() => abrirRapido(estudiante)}
                    className={`rounded-xl border border-inherit p-3 ${tema.fila} ${
                      marcado ? (darkMode ? "bg-blue-500/10" : "bg-blue-50/70") : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => alternarSeleccion(idEst)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Seleccionar a ${nombreCompleto(estudiante)}`}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded accent-blue-600"
                      />
                      <Avatar
                        estudiante={estudiante}
                        size="h-10 w-10"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold">
                          {nombreCompleto(estudiante)}
                        </p>
                        <p className={`mt-1 text-xs ${tema.secundario}`}>
                          DNI: {estudiante.dni || "Sin DNI"}
                        </p>
                        <p className="mt-2 break-words text-sm font-medium">
                          {estudiante.programa_estudios || "Sin programa"}
                        </p>
                        <p className={`text-xs ${tema.secundario}`}>
                          {estudiante.semestre || "Sin semestre"}
                        </p>
                        <p className={`mt-1 break-all text-xs ${tema.secundario}`}>
                          {estudiante.correo || estudiante.email || "No registrado"}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <InsigniaEstado estado={estadoValido} />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onVerEstudiante?.(estudiante);
                              }}
                              aria-label={`Ver expediente de ${nombreCompleto(estudiante)}`}
                              className="rounded-lg border border-blue-200 p-2 text-blue-600"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleAbrirEditar(estudiante);
                              }}
                              aria-label={`Editar ${nombreCompleto(estudiante)}`}
                              className="rounded-lg border border-amber-200 p-2 text-amber-600"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEliminar(idEst);
                              }}
                              aria-label={`Eliminar ${nombreCompleto(estudiante)}`}
                              className="rounded-lg border border-rose-200 p-2 text-rose-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-10 text-center">
              <Search size={24} className="mx-auto text-slate-400" />
              <p className="mt-3 font-semibold">No se encontraron estudiantes</p>
              <p className={`mt-1 text-sm ${tema.secundario}`}>
                Prueba con otro nombre, DNI o estado.
              </p>
            </div>
          )}
        </div>

        <div className="hidden max-h-[680px] overflow-auto sm:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className={`sticky top-0 z-10 ${tema.encabezado}`}>
              <tr>
                <th className="w-10 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={todosPaginaSeleccionados}
                    onChange={alternarTodosPagina}
                    aria-label="Seleccionar todos de esta página"
                    className="h-4 w-4 cursor-pointer rounded accent-blue-600"
                  />
                </th>
                {cabecera("nombre", "Estudiante")}
                {cabecera("dni", "DNI")}
                {cabecera("programa", "Programa y Semestre")}
                <th className="px-5 py-4 font-semibold">Correo / Teléfono</th>
                {cabecera("estado", "Estado")}
                <th className="px-5 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>

            <tbody
              key={`${paginaActual}-${orden.campo}-${orden.dir}-${estadoActivo}-${porPagina}`}
            >
              {cargando ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-inherit">
                    <td className="px-5 py-4">
                      <div className="skeleton h-4 w-4 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="skeleton h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <div className="skeleton h-3 w-36 rounded" />
                          <div className="skeleton h-2.5 w-16 rounded" />
                        </div>
                      </div>
                    </td>
                    {[70, 140, 120, 90].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-3 rounded" style={{ width: w }} />
                      </td>
                    ))}
                    <td className="px-5 py-4" />
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : estudiantesOrdenados.length > 0 ? (
                estudiantesPaginados.map((estudiante, i) => {
                  const idEst = idEstudianteDe(estudiante);
                  const marcado = seleccionados.includes(idEst);
                  const estadoValido = estadoNormalizado(estudiante);
                  return (
                    <tr
                      key={idEst ?? i}
                      onClick={() => abrirRapido(estudiante)}
                      style={{ animationDelay: `${i * 35}ms` }}
                      className={`fila-anim group cursor-pointer border-t transition ${tema.fila} ${
                        marcado ? (darkMode ? "bg-blue-500/10" : "bg-blue-50/70") : ""
                      }`}
                    >
                      <td
                        className={`relative px-5 ${pad}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="absolute left-0 top-0 h-full w-0.5 scale-y-0 bg-blue-500 transition-transform group-hover:scale-y-100" />
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternarSeleccion(idEst)}
                          aria-label={`Seleccionar a ${nombreCompleto(estudiante)}`}
                          className="h-4 w-4 cursor-pointer rounded accent-blue-600"
                        />
                      </td>

                      <td className={`px-5 ${pad}`}>
                        <div className="flex items-center gap-3">
                          <Avatar
                            estudiante={estudiante}
                            size={tamanoAvatar}
                            className="ring-2 ring-transparent transition group-hover:ring-blue-400"
                          />
                          <div>
                            <p className="font-semibold">
                              <Resaltar texto={nombreCompleto(estudiante)} consulta={busqueda} />
                            </p>
                            {!compacto && (
                              <p className={`mt-1 text-xs ${tema.secundario}`}>
                                ID: #{idEst}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className={`px-5 ${pad} ${tema.secundario}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <Resaltar texto={estudiante.dni} consulta={busqueda} />
                          <button
                            type="button"
                            title="Copiar DNI"
                            onClick={(e) => {
                              e.stopPropagation();
                              copiarDni(estudiante.dni);
                            }}
                            className="rounded p-1 opacity-0 transition hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
                          >
                            <Copy size={13} />
                          </button>
                        </span>
                      </td>

                      <td className={`px-5 ${pad}`}>
                        <p className="font-medium">
                          {estudiante.programa_estudios || "Sin programa"}
                        </p>
                        {!compacto && (
                          <p className={`mt-1 text-xs ${tema.secundario}`}>
                            {estudiante.semestre || "Sin semestre"}
                          </p>
                        )}
                      </td>

                      <td className={`px-5 ${pad}`}>
                        <p className="text-xs">
                          {estudiante.correo || estudiante.email || "No registrado"}
                        </p>
                        {!compacto && (
                          <p className={`mt-1 text-xs ${tema.secundario}`}>
                            {estudiante.telefono || "Sin teléfono"}
                          </p>
                        )}
                      </td>

                      <td className={`px-5 ${pad}`}>
                        <InsigniaEstado estado={estadoValido} />
                      </td>

                      <td
                        className={`px-5 text-right ${pad}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onVerEstudiante?.(estudiante)}
                            title="Ver expediente"
                            className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:scale-110 hover:bg-blue-50"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(estudiante)}
                            title="Editar estudiante"
                            className="rounded-lg border border-amber-200 p-2 text-amber-600 transition hover:scale-110 hover:bg-amber-50"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminar(idEst)}
                            title="Eliminar estudiante"
                            className="rounded-lg border border-rose-200 p-2 text-rose-600 transition hover:scale-110 hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flotar rounded-full bg-slate-100 p-4 text-slate-400">
                        <Search size={25} />
                      </div>
                      <p className="mt-3 font-semibold">No se encontraron estudiantes</p>
                      <p className={`mt-1 text-sm ${tema.secundario}`}>
                        Prueba con otro nombre, DNI o estado.
                      </p>
                      <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer
          className={`flex flex-col items-center justify-between gap-4 border-t border-inherit px-5 py-4 text-xs sm:flex-row ${tema.secundario}`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Mostrando {inicioRango}–{finRango} de {estudiantesOrdenados.length}
              {estudiantesOrdenados.length !== estudiantes.length &&
                ` (total: ${estudiantes.length})`}
            </span>

            <div className="flex items-center gap-2">
              <span>Filas:</span>
              <select
                value={porPagina}
                onChange={(e) => setPorPagina(Number(e.target.value))}
                className={`rounded-lg border px-2 py-1 text-xs outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${tema.panel} ${tema.inactivo}`}
            >
              <ChevronLeft size={16} />
            </button>

            {numerosPagina.map((n, i) =>
              n === "..." ? (
                <span key={`puntos-${i}`} className="px-2">
                  ...
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPaginaActual(n)}
                  className={`min-w-[34px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    n === paginaActual
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : `${tema.panel} ${tema.inactivo}`
                  }`}
                >
                  {n}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${tema.panel} ${tema.inactivo}`}
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </footer>
      </section>

      {seleccionados.length > 0 && (
        <div
          className={`barra-flotante fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3 shadow-2xl ${tema.panel} ${tema.texto}`}
        >
          <span className="text-sm font-semibold">
            {seleccionados.length} seleccionado(s)
          </span>
          <span className="h-5 w-px bg-slate-400/30" />
          <button
            type="button"
            onClick={() =>
              exportarCSV(
                estudiantes.filter((e) => seleccionados.includes(idEstudianteDe(e))),
                "estudiantes-seleccionados.csv"
              )
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tema.inactivo}`}
          >
            <Download size={15} /> Exportar
          </button>
          <button
            type="button"
            onClick={eliminarSeleccionados}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={15} /> Eliminar
          </button>
          <button
            type="button"
            onClick={() => setSeleccionados([])}
            title="Quitar selección"
            className={`rounded-lg p-1.5 transition ${tema.inactivo}`}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {estudianteRapido && (
        <PanelRapido
          estudiante={estudianteRapido}
          posicion={idxNav >= 0 ? idxNav + 1 : 0}
          total={listaNav.length}
          onCerrar={() => setEstudianteRapido(null)}
          onAnterior={idxNav > 0 ? irAnterior : null}
          onSiguiente={idxNav >= 0 && idxNav < listaNav.length - 1 ? irSiguiente : null}
          onVerExpediente={() => {
            onVerEstudiante?.(estudianteRapido);
            setEstudianteRapido(null);
          }}
          onEditar={() => {
            handleAbrirEditar(estudianteRapido);
            setEstudianteRapido(null);
          }}
          onEliminar={() => handleEliminar(idEstudianteDe(estudianteRapido))}
          tema={tema}
        />
      )}

      {paletaAbierta && (
        <PaletaComandos
          estudiantes={estudiantes}
          acciones={accionesPaleta}
          recientes={recientes}
          onAbrirAlumno={abrirRapido}
          onCerrar={() => setPaletaAbierta(false)}
          tema={tema}
        />
      )}

      <ModalEstudiante
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        estudianteActual={estudianteSeleccionado}
        onGuardadoExitoso={handleGuardadoExitoso}
        darkMode={darkMode}
      />

      <ModalImportarEstudiantes
        isOpen={modalImportarAbierto}
        onClose={() => setModalImportarAbierto(false)}
        onImportadoExitoso={handleImportadoExitoso}
        dnisExistentes={estudiantes.map((e) => e.dni)}
        darkMode={darkMode}
      />
    </main>
  );
}