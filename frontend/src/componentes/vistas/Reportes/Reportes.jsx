import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
const PROGRAMA = "Diseño y Programación Web";

// Un solo programa de estudios: el reporte se divide por módulo formativo
const MODULOS_BASE = [
  { clave: "soporte", nombre: "Módulo I – Soporte", color: "#06b6d4", share: 0.3 },
  { clave: "desarrollo", nombre: "Módulo II – Desarrollo", color: "#2563eb", share: 0.45 },
  { clave: "redes", nombre: "Módulo III – Redes", color: "#8b5cf6", share: 0.25 },
];

// Respaldo mientras el endpoint /api/reportes/estadisticas se termina de poblar
const monthlyFallback = (y) => {
  const base = [12, 15, 20, 25, 30, 28, 18, 22, 35, 40, 38, 30];
  return base.map((v) => Math.max(0, v + (y - 2024) * 5));
};

const sum = (a) => a.reduce((s, b) => s + b, 0);
const fmt = (n) => Math.round(n).toLocaleString("es-PE");
const pctDe = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);
const signo = (n) => (n >= 0 ? `+${n}%` : `${n}%`);

// Escala "bonita": 4 divisiones con pasos redondos (5, 10, 20, 50…)
const escala = (max) => {
  const pasos = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  const paso = pasos.find((s) => s * 4 >= max * 1.05) || Math.ceil(max / 4);
  return { paso, techo: paso * 4 };
};

/* ---------- Geometría del gráfico ---------- */
const W = 900;
const H = 300;
const PL = 44;
const PR = 16;
const PT = 16;
const PB = 30;
const PW = W - PL - PR;
const PH = H - PT - PB;

/* ---------- Animaciones ---------- */
const estilosAnimaciones = `
@keyframes rp-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
@keyframes rp-fade { from { opacity:0; } to { opacity:1; } }
@keyframes rp-pop { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:none; } }
@keyframes rp-grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes rp-grow-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes rp-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes rp-tip { from { opacity:0; transform: translate(var(--tx), calc(var(--ty) + 6px)); } to { opacity:1; transform: translate(var(--tx), var(--ty)); } }
.rp-up { animation: rp-up .5s cubic-bezier(.22,1,.36,1) both; }
.rp-fade { animation: rp-fade .6s ease-out both; }
.rp-pop { animation: rp-pop .3s cubic-bezier(.22,1,.36,1) both; }
.rp-grow-y { transform-box: fill-box; transform-origin: bottom; animation: rp-grow-y .7s cubic-bezier(.22,1,.36,1) both; }
.rp-grow-x { transform-origin: left; animation: rp-grow-x .7s cubic-bezier(.22,1,.36,1) both; }
.rp-draw { stroke-dasharray: 1; animation: rp-draw 1.1s cubic-bezier(.22,1,.36,1) both; }
.rp-tip { transform: translate(var(--tx), var(--ty)); animation: rp-tip .15s ease-out both; }
.rp-lift { transition: box-shadow .25s ease, transform .25s cubic-bezier(.22,1,.36,1); }
.rp-lift:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -18px rgba(15,23,42,.28); }
@media (prefers-reduced-motion: reduce) {
  .rp-up, .rp-fade, .rp-pop, .rp-grow-y, .rp-grow-x, .rp-draw, .rp-tip { animation: none !important; }
  .rp-draw { stroke-dasharray: none; }
  .rp-lift:hover { transform: none; }
}
`;

const fv = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

/* ---------- Iconos ---------- */
const Icon = ({ children, className = "w-4 h-4", stroke = 2 }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);
const IconDownload = () => (<Icon><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></Icon>);
const IconUsers = () => (<Icon className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>);
const IconBars = () => (<Icon className="w-5 h-5"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>);
const IconBuilding = () => (<Icon className="w-5 h-5"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" /></Icon>);
const IconTrendUp = () => (<Icon className="w-3.5 h-3.5"><path d="m3 17 6-6 4 4 8-8M15 7h6v6" /></Icon>);
const IconTrendDown = () => (<Icon className="w-3.5 h-3.5"><path d="m3 7 6 6 4-4 8 8M15 17h6v-6" /></Icon>);
const IconSort = ({ dir }) => (
  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M6 1.5 9 5H3z" opacity={dir === "asc" ? 1 : 0.3} />
    <path d="M6 10.5 3 7h6z" opacity={dir === "desc" ? 1 : 0.3} />
  </svg>
);

/* ---------- Utilidades ---------- */
const useContador = (objetivo, duracion = 800) => {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValor(objetivo);
      return undefined;
    }
    let raf;
    const inicio = performance.now();
    const paso = (t) => {
      const p = Math.min((t - inicio) / duracion, 1);
      setValor(objetivo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, duracion]);
  return valor;
};

const Num = ({ v, sufijo = "" }) => {
  const a = useContador(v);
  return <>{fmt(a)}{sufijo}</>;
};

/* Control segmentado con indicador que se desliza */
const Seg = ({ opts, v, set, etiqueta }) => {
  const i = Math.max(0, opts.findIndex(([val]) => val === v));
  return (
    <div role="group" aria-label={etiqueta} className="relative grid rounded-lg border border-slate-200 bg-white p-0.5" style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}>
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 rounded-md bg-blue-600 transition-transform duration-300 ease-out"
        style={{ width: `calc((100% - 0.25rem) / ${opts.length})`, transform: `translateX(${i * 100}%)` }}
      />
      {opts.map(([val, label]) => (
        <button
          key={String(val)}
          onClick={() => set(val)}
          aria-pressed={v === val}
          className={`relative z-10 cursor-pointer whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${fv} ${v === val ? "text-white" : "text-slate-600 hover:text-slate-900"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

const Interruptor = ({ activo, onChange, disabled, children }) => (
  <button
    role="switch"
    aria-checked={activo}
    disabled={disabled}
    onClick={() => onChange(!activo)}
    className={`flex cursor-pointer items-center gap-2.5 rounded-lg py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${fv} ${activo ? "text-slate-900" : "text-slate-600"}`}
  >
    <span className={`relative h-5 w-9 rounded-full border transition-colors duration-200 ${activo ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"}`}>
      <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all duration-200 ${activo ? "left-[18px] bg-white" : "left-0.5 bg-slate-400"}`} />
    </span>
    {children}
  </button>
);

const Tarjeta = ({ className = "", style, children }) => (
  <div style={style} className={`rp-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</div>
);

const Titulo = ({ t, s, derecha }) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="space-y-1">
      <h3 className="text-[15px] font-bold text-slate-900">{t}</h3>
      {s && <p className="text-[12px] text-slate-500">{s}</p>}
    </div>
    {derecha}
  </div>
);

const Variacion = ({ d, sufijo }) => (
  <span className={`inline-flex items-center gap-1 text-[12px] font-bold ${d >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
    {d >= 0 ? <IconTrendUp /> : <IconTrendDown />}
    {signo(d)}{sufijo && <span className="font-medium text-slate-400"> {sufijo}</span>}
  </span>
);

/* Indicador (KPI) con icono en círculo blanco */
const Kpi = ({ icono, etiqueta, children, detalle, delay, extra }) => (
  <Tarjeta style={{ animationDelay: `${delay}s` }} className="rp-lift flex items-center gap-4 p-5">
    <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-slate-200 text-blue-600">{icono}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[12px] font-medium text-slate-500">{etiqueta}</p>
      <p className="text-[28px] font-extrabold leading-tight tracking-tight tabular-nums text-slate-900">{children}</p>
      <div className="text-[11px] text-slate-400">{detalle}</div>
    </div>
    {extra}
  </Tarjeta>
);

export default function Reportes() {
  const [y, setY] = useState(2026);
  const [per, setPer] = useState("Mensual");
  const [tipo, setTipo] = useState("linea");
  const [comparar, setComparar] = useState(false);
  const [hv, setHv] = useState(null);
  const [mo, setMo] = useState(null);
  const [orden, setOrden] = useState({ col: "i", dir: "asc" });

  // Estado conectado a la base de datos (PostgreSQL / Laravel)
  const [cargando, setCargando] = useState(true);
  const [fuenteReal, setFuenteReal] = useState(false);
  const [datosApi, setDatosApi] = useState(null);

  useEffect(() => {
    let cancelado = false;

    const cargarReportes = async () => {
      setCargando(true);
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      try {
        const { data } = await axios.get(`${API}/reportes/estadisticas`, {
          params: { anio: y },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!cancelado) {
          setDatosApi(data);
          setFuenteReal(true);
        }
      } catch {
        if (!cancelado) {
          setDatosApi(null);
          setFuenteReal(false);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarReportes();
    return () => {
      cancelado = true;
    };
  }, [y]);

  /* ---------- Datos ---------- */
  const mensual = useMemo(() => {
    if (Array.isArray(datosApi?.mensual) && datosApi.mensual.length === 12) return datosApi.mensual.map((v) => Number(v) || 0);
    return monthlyFallback(y);
  }, [datosApi, y]);

  const mensualPrev = useMemo(() => {
    if (Array.isArray(datosApi?.mensual_anterior) && datosApi.mensual_anterior.length === 12) return datosApi.mensual_anterior.map((v) => Number(v) || 0);
    return monthlyFallback(y - 1);
  }, [datosApi, y]);

  const historicoAnual = useMemo(() => {
    if (Array.isArray(datosApi?.anual) && datosApi.anual.length > 0) {
      return { labels: datosApi.anual.map((item) => String(item.anio)), vals: datosApi.anual.map((item) => Number(item.total) || 0) };
    }
    const anios = [2023, 2024, 2025, 2026];
    return { labels: anios.map(String), vals: anios.map((a) => sum(monthlyFallback(a))) };
  }, [datosApi]);

  const { vals, labels } = useMemo(() => {
    if (per === "Mensual") return { vals: mensual, labels: MESES };
    if (per === "Trimestral") return { vals: [0, 3, 6, 9].map((i) => sum(mensual.slice(i, i + 3))), labels: ["T1", "T2", "T3", "T4"] };
    return historicoAnual;
  }, [mensual, historicoAnual, per]);

  const valsPrev = useMemo(() => {
    if (per === "Mensual") return mensualPrev;
    if (per === "Trimestral") return [0, 3, 6, 9].map((i) => sum(mensualPrev.slice(i, i + 3)));
    return null;
  }, [mensualPrev, per]);

  const verPrev = comparar && valsPrev !== null;

  useEffect(() => {
    setHv(null);
  }, [y, per, tipo]);

  const tot = datosApi?.total_practicas !== undefined ? Number(datosApi.total_practicas) : sum(mensual);
  const totPrev = datosApi?.total_anterior !== undefined ? Number(datosApi.total_anterior) : sum(mensualPrev);
  const d = pctDe(tot, totPrev);

  const n = vals.length;
  const maxVal = Math.max(...vals, 1);
  const minVal = Math.min(...vals);
  const promedio = Math.round(sum(vals) / n);
  const idxPico = vals.indexOf(maxVal);
  const idxMin = vals.indexOf(minVal);
  const totalVals = sum(vals);
  const empresas = datosApi?.empresas_convenio !== undefined ? Number(datosApi.empresas_convenio) : 40 + (y - 2023) * 14;
  const tasa = datosApi?.tasa_aprobacion !== undefined ? Number(datosApi.tasa_aprobacion) : Math.min(100, 88 + (y - 2024) * 3);
  const ring = useContador(1, 1000);

  const { paso, techo } = useMemo(() => escala(Math.max(maxVal, ...(verPrev ? valsPrev : [0]))), [maxVal, verPrev, valsPrev]);

  /* ---------- Estudiantes por módulo ---------- */
  const modulosLista = useMemo(() => {
    if (Array.isArray(datosApi?.modulos) && datosApi.modulos.length > 0) {
      const totalMod = sum(datosApi.modulos.map((m) => Number(m.total) || 0)) || 1;
      return datosApi.modulos.map((m, idx) => {
        const txt = String(m.modulo || m.nombre || "");
        const base = MODULOS_BASE.find((b) => txt.toLowerCase().includes(b.clave)) || MODULOS_BASE[idx % MODULOS_BASE.length];
        const total = Number(m.total) || 0;
        return { nombre: txt || base.nombre, total, share: total / totalMod, color: base.color };
      });
    }
    let acumulado = 0;
    return MODULOS_BASE.map((b, idx) => {
      const total = idx === MODULOS_BASE.length - 1 ? Math.max(0, tot - acumulado) : Math.round(tot * b.share);
      acumulado += total;
      return { nombre: b.nombre, total, share: b.share, color: b.color };
    });
  }, [datosApi, tot]);

  const lider = useMemo(() => [...modulosLista].sort((a, b) => b.total - a.total)[0], [modulosLista]);
  const totalMod = sum(modulosLista.map((m) => m.total));

  /* ---------- Gráfico ---------- */
  const px = (i) => PL + ((i + 0.5) / n) * PW;
  const py = (v) => PT + (1 - v / techo) * PH;
  const base = PT + PH;

  const trazo = (serie) =>
    serie
      .map((v, i) => {
        const x = px(i);
        const yy = py(v);
        if (i === 0) return `M${x},${yy}`;
        const cx = (px(i - 1) + x) / 2;
        return `C${cx},${py(serie[i - 1])} ${cx},${yy} ${x},${yy}`;
      })
      .join(" ");

  const curva = trazo(vals);
  const area = `${curva} L${px(n - 1)},${base} L${px(0)},${base} Z`;
  const curvaPrev = verPrev ? trazo(valsPrev) : "";

  const onMover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    setHv(Math.min(n - 1, Math.max(0, Math.floor(((vx - PL) / PW) * n))));
  };

  const claveAnim = `${per}-${y}-${tipo}-${fuenteReal ? "bd" : "demo"}`;

  /* ---------- Tabla ---------- */
  const filas = useMemo(() => {
    const arr = vals.map((v, i) => ({
      i,
      l: labels[i],
      v,
      share: totalVals ? v / totalVals : 0,
      diff: i > 0 ? pctDe(v, vals[i - 1]) : null,
    }));
    const k = orden.col;
    const dir = orden.dir === "asc" ? 1 : -1;
    return arr.sort((a, b) => {
      const va = k === "d" ? (a.diff ?? -Infinity) : k === "v" ? a.v : a.i;
      const vb = k === "d" ? (b.diff ?? -Infinity) : k === "v" ? b.v : b.i;
      return (va - vb) * dir;
    });
  }, [vals, labels, totalVals, orden]);

  const ordenar = (col) => setOrden((o) => (o.col === col ? { col, dir: o.dir === "asc" ? "desc" : "asc" } : { col, dir: col === "i" ? "asc" : "desc" }));

  /* ---------- Top 3 ---------- */
  const top3 = vals
    .map((v, i) => ({ v, l: labels[i], i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);
  const podio = [
    { ...(top3[1] || { v: 0, l: "-" }), rank: 2, h: "h-24", color: "bg-slate-300 text-slate-700" },
    { ...(top3[0] || { v: 0, l: "-" }), rank: 1, h: "h-36", color: "bg-blue-600 text-white" },
    { ...(top3[2] || { v: 0, l: "-" }), rank: 3, h: "h-16", color: "bg-slate-200 text-slate-600" },
  ];

  /* ---------- Lectura rápida ---------- */
  const lecturas = [
    { t: "Mayor actividad", v: `${labels[idxPico]} · ${maxVal} estudiantes` },
    { t: "Menor actividad", v: `${labels[idxMin]} · ${minVal} estudiantes` },
    { t: `Variación frente a ${y - 1}`, v: signo(d), tono: d >= 0 ? "text-emerald-600" : "text-rose-600" },
    { t: "Módulo con más estudiantes", v: lider ? `${lider.nombre} · ${Math.round(lider.share * 100)}%` : "—" },
  ];

  /* ---------- Exportar ---------- */
  const exportarCSV = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filasCsv = [
      ["Periodo", "Estudiantes", "Participación %", "Variación %"],
      ...vals.map((v, i) => [labels[i], v, totalVals ? Math.round((v / totalVals) * 100) : 0, i > 0 ? pctDe(v, vals[i - 1]) : ""]),
      [],
      ["Módulo", "Estudiantes", "Participación %"],
      ...modulosLista.map((m) => [m.nombre, m.total, Math.round(m.share * 100)]),
    ];
    const csv = "\uFEFF" + filasCsv.map((f) => f.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_efsrt_${per.toLowerCase()}_${y}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Tooltip ---------- */
  const tip = hv !== null ? { x: px(hv), y: py(vals[hv]) } : null;
  const tipX = tip ? (tip.x / W) * 100 : 0;
  const tipY = tip ? (tip.y / H) * 100 : 0;
  const tipTx = tipX < 14 ? "0%" : tipX > 86 ? "-100%" : "-50%";
  const tipAbajo = tipY < 28;

  /* ---------- Donut de módulos ---------- */
  let acum = 0;
  const segmentos = modulosLista.map((m) => {
    const ini = acum;
    acum += m.share * 100;
    return { ...m, ini, len: m.share * 100 };
  });
  const moSel = mo !== null ? modulosLista[mo] : null;

  return (
    <div className="w-full space-y-6 px-4 py-6 text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}>
      <style>{estilosAnimaciones}</style>

      {/* ================= ENCABEZADO ================= */}
      <header className="rp-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
            Gestión académica <span aria-hidden="true">/</span> <span className="font-semibold text-slate-600">Reportes</span>
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">Reportes y estadísticas EFSRT</h1>
          <p className="mt-1 max-w-2xl text-[12px] text-slate-500">
            Estudiantes en prácticas del programa <b className="text-slate-700">{PROGRAMA}</b>, por periodo y por módulo formativo.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600">
          <i className={`h-2 w-2 rounded-full ${cargando ? "animate-pulse bg-slate-400" : fuenteReal ? "bg-emerald-500" : "bg-amber-500"}`} />
          {cargando ? "Sincronizando datos…" : fuenteReal ? "Conectado a PostgreSQL" : "Vista previa local"}
        </span>
      </header>

      {/* ================= CONTROLES (módulos) ================= */}
      <Tarjeta style={{ animationDelay: ".05s" }} className="flex flex-wrap items-stretch divide-slate-200 sm:divide-x">
        {[
          ["Año", <Seg key="a" etiqueta="Año" opts={[2024, 2025, 2026].map((a) => [a, String(a)])} v={y} set={setY} />],
          ["Periodo", <Seg key="p" etiqueta="Periodo" opts={["Mensual", "Trimestral", "Anual"].map((p) => [p, p])} v={per} set={setPer} />],
          ["Gráfico", <Seg key="g" etiqueta="Tipo de gráfico" opts={[["linea", "Línea"], ["barras", "Barras"]]} v={tipo} set={setTipo} />],
          ["Comparar", <Interruptor key="c" activo={verPrev} disabled={valsPrev === null} onChange={setComparar}>con {y - 1}</Interruptor>],
        ].map(([et, ctl]) => (
          <div key={et} className="px-5 py-4">
            <p className="mb-2 text-[11px] font-semibold text-slate-400">{et}</p>
            <div className="flex h-9 items-center">{ctl}</div>
          </div>
        ))}
        <div className="ml-auto flex items-center px-5 py-4">
          <button
            onClick={exportarCSV}
            className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95 ${fv}`}
          >
            <IconDownload /> Exportar CSV
          </button>
        </div>
      </Tarjeta>

      {/* ================= KPIs ================= */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi delay={0.1} icono={<IconUsers />} etiqueta={`Estudiantes en prácticas ${y}`} detalle={<Variacion d={d} sufijo={`vs ${y - 1}`} />}>
          <Num v={tot} />
        </Kpi>
        <Kpi delay={0.15} icono={<IconBars />} etiqueta={`Promedio por ${per === "Mensual" ? "mes" : per === "Trimestral" ? "trimestre" : "año"}`} detalle="Estudiantes por periodo">
          <Num v={promedio} />
        </Kpi>
        <Kpi delay={0.2} icono={<IconBuilding />} etiqueta="Empresas con convenio" detalle="Formadoras activas">
          <Num v={empresas} />
        </Kpi>
        <Kpi
          delay={0.25}
          icono={<span className="text-[11px] font-extrabold">%</span>}
          etiqueta="Tasa de aprobación"
          detalle="Estudiantes aprobados"
          extra={
            <svg viewBox="0 0 36 36" className="h-12 w-12 shrink-0 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${tasa * ring} ${100 - tasa * ring}`} />
            </svg>
          }
        >
          {tasa}%
        </Kpi>
      </div>

      {/* ================= GRÁFICO + MÓDULOS ================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Tarjeta style={{ animationDelay: ".3s" }} className="space-y-4 p-6 xl:col-span-8">
          <Titulo
            t={`Flujo de estudiantes (${per.toLowerCase()})`}
            s={`${per === "Anual" ? "Comparativo histórico" : `Año ${y}`}. Pasa el cursor para ver el detalle de cada periodo.`}
            derecha={
              <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-600">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Estudiantes</span>
                {verPrev && <span className="flex items-center gap-1.5"><i className="h-0 w-4 border-t-2 border-dashed border-slate-400" /> {y - 1}</span>}
                <span className="flex items-center gap-1.5"><i className="h-0 w-4 border-t border-dashed border-slate-400" /> Promedio</span>
              </div>
            }
          />

          <div className="relative cursor-crosshair select-none" onPointerMove={onMover} onPointerLeave={() => setHv(null)} style={{ touchAction: "pan-y" }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Gráfico de estudiantes por periodo, ${per.toLowerCase()}`}>
              {/* Rejilla */}
              {[0, 1, 2, 3, 4].map((g) => {
                const yy = py(g * paso);
                return (
                  <g key={g}>
                    <line x1={PL} x2={W - PR} y1={yy} y2={yy} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={g === 0 ? "0" : "3 4"} />
                    <text x={PL - 10} y={yy + 3.5} textAnchor="end" fontSize="11" fontWeight="600" fill="#94a3b8">{g * paso}</text>
                  </g>
                );
              })}

              {/* Etiquetas del eje X */}
              {labels.map((l, i) => (
                <text key={l} x={px(i)} y={H - 8} textAnchor="middle" fontSize="11.5" fontWeight="600" fill={hv === i ? "#1d4ed8" : "#94a3b8"} style={{ transition: "fill .15s" }}>{l}</text>
              ))}

              {/* Promedio */}
              <line x1={PL} x2={W - PR} y1={py(promedio)} y2={py(promedio)} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="5 5" />

              {tipo === "linea" ? (
                <g key={claveAnim}>
                  {verPrev && <path d={curvaPrev} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" className="rp-fade" />}
                  <path d={area} fill="#2563eb" fillOpacity="0.07" className="rp-fade" style={{ animationDelay: ".5s" }} />
                  <path d={curva} pathLength="1" fill="none" stroke="#2563eb" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="rp-draw" />
                  {hv !== null && <line x1={px(hv)} x2={px(hv)} y1={PT} y2={base} stroke="#cbd5e1" strokeWidth="1" />}
                  {vals.map((v, i) => (
                    <circle
                      key={i}
                      cx={px(i)}
                      cy={py(v)}
                      r={hv === i ? 6 : n > 6 ? 3.5 : 4.5}
                      fill="#fff"
                      stroke="#2563eb"
                      strokeWidth="2.25"
                      className="rp-fade"
                      style={{ animationDelay: `${0.5 + i * 0.04}s`, transition: "r .15s" }}
                    />
                  ))}
                  {/* Marca del pico */}
                  {hv !== idxPico && (
                    <g className="rp-fade" style={{ animationDelay: "1s" }}>
                      <rect x={px(idxPico) - 17} y={py(maxVal) - 29} width="34" height="18" rx="5" fill="#0f172a" />
                      <text x={px(idxPico)} y={py(maxVal) - 16.5} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#fff">Pico</text>
                    </g>
                  )}
                </g>
              ) : (
                <g key={claveAnim}>
                  {hv !== null && <rect x={px(hv) - PW / n / 2} y={PT} width={PW / n} height={PH} rx="8" fill="#f1f5f9" />}
                  {vals.map((v, i) => {
                    const bw = Math.min(46, (PW / n) * 0.56);
                    return (
                      <g key={i}>
                        <rect
                          x={px(i) - bw / 2}
                          y={py(v)}
                          width={bw}
                          height={Math.max(0, base - py(v))}
                          rx="5"
                          fill={i === idxPico && hv === null ? "#1d4ed8" : "#2563eb"}
                          opacity={hv === null || hv === i ? 1 : 0.35}
                          className="rp-grow-y"
                          style={{ animationDelay: `${i * 35}ms`, transition: "opacity .15s" }}
                        />
                        {verPrev && <line x1={px(i) - bw / 2 - 4} x2={px(i) + bw / 2 + 4} y1={py(valsPrev[i])} y2={py(valsPrev[i])} stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" className="rp-fade" style={{ animationDelay: ".6s" }} />}
                        {(n <= 6 || hv === i) && (
                          <text x={px(i)} y={py(v) - 7} textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#334155" className="rp-fade" style={{ animationDelay: ".5s" }}>{v}</text>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Tooltip */}
            {hv !== null && (
              <div
                key={hv}
                className="rp-tip pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-white shadow-lg"
                style={{
                  left: `${tipX}%`,
                  top: `${tipY}%`,
                  "--tx": tipTx,
                  "--ty": tipAbajo ? "14px" : "calc(-100% - 14px)",
                }}
              >
                <p className="text-[11px] font-semibold text-slate-400">{labels[hv]}</p>
                <p className="text-[14px] font-extrabold">{vals[hv]} estudiantes</p>
                <p className="text-[11px] text-slate-300">
                  {Math.round((vals[hv] / (totalVals || 1)) * 100)}% del total
                  {hv > 0 ? ` · ${vals[hv] >= vals[hv - 1] ? "▲" : "▼"} ${Math.abs(pctDe(vals[hv], vals[hv - 1]))}% vs anterior` : ""}
                </p>
                {verPrev && (
                  <p className="mt-0.5 border-t border-white/15 pt-1 text-[11px] text-slate-300">
                    {y - 1}: <b className="text-white">{valsPrev[hv]}</b> ({signo(pctDe(vals[hv], valsPrev[hv]))})
                  </p>
                )}
              </div>
            )}
          </div>
        </Tarjeta>

        {/* Estudiantes por módulo */}
        <Tarjeta style={{ animationDelay: ".35s" }} className="flex flex-col gap-5 p-6 xl:col-span-4">
          <Titulo t="Estudiantes por módulo" s={`Programa ${PROGRAMA}`} />

          <div className="mx-auto grid place-items-center">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" role="img" aria-label="Distribución de estudiantes por módulo">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                {segmentos.map((s, i) => (
                  <circle
                    key={s.nombre}
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke={s.color}
                    strokeWidth={mo === i ? 5.5 : 4.5}
                    strokeDasharray={`${Math.max(0, s.len * ring - 0.8)} ${100 - Math.max(0, s.len * ring - 0.8)}`}
                    strokeDashoffset={-s.ini * ring}
                    opacity={mo === null || mo === i ? 1 : 0.3}
                    style={{ transition: "opacity .2s, stroke-width .2s", cursor: "default" }}
                    onMouseEnter={() => setMo(i)}
                    onMouseLeave={() => setMo(null)}
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div key={mo} className="rp-pop px-5">
                  <p className="text-[26px] font-extrabold leading-none tabular-nums">{moSel ? moSel.total : <Num v={totalMod} />}</p>
                  <p className="mt-1 text-[11px] leading-tight text-slate-500">
                    {moSel ? `${Math.round(moSel.share * 100)}% · ${moSel.nombre.replace(/^Módulo\s+/, "")}` : "estudiantes"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {modulosLista.map((m, i) => (
              <div
                key={m.nombre}
                onMouseEnter={() => setMo(i)}
                onMouseLeave={() => setMo(null)}
                className={`cursor-default rounded-lg px-3 py-2.5 transition-opacity duration-200 hover:bg-slate-50 ${mo === null || mo === i ? "opacity-100" : "opacity-45"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                    <span className="truncate text-[13px] font-semibold text-slate-700">{m.nombre}</span>
                  </span>
                  <span className="text-[13px] font-extrabold tabular-nums text-slate-900">
                    <Num v={m.total} /> <span className="text-[11px] font-semibold text-slate-400">{Math.round(m.share * 100)}%</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div key={`${y}-${m.total}`} className="rp-grow-x h-full rounded-full" style={{ width: `${m.share * 100}%`, background: m.color, animationDelay: `${i * 90}ms` }} />
                </div>
              </div>
            ))}
          </div>
        </Tarjeta>
      </div>

      {/* ================= DETALLE + TOP 3 ================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Tarjeta style={{ animationDelay: ".4s" }} className="xl:col-span-8">
          <div className="p-6 pb-4">
            <Titulo t="Detalle del periodo" s={`Desglose ${per.toLowerCase()}. Ordena con los encabezados; al pasar el cursor se resalta en el gráfico.`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 text-[12px] font-semibold text-slate-500">
                  {[["i", "Periodo", "px-6 text-left"], ["v", "Estudiantes", "px-4 text-right"], [null, "Participación", "px-4 text-left"], ["d", "Variación", "px-6 text-right"]].map(([k, t, cls]) => (
                    <th key={t} className={`py-3 ${cls}`} aria-sort={k && orden.col === k ? (orden.dir === "asc" ? "ascending" : "descending") : undefined}>
                      {k ? (
                        <button onClick={() => ordenar(k)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md transition-colors hover:text-slate-900 ${fv} ${orden.col === k ? "text-slate-900" : ""}`}>
                          {t} <IconSort dir={orden.col === k ? orden.dir : null} />
                        </button>
                      ) : t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((f) => (
                  <tr key={f.l} onMouseEnter={() => setHv(f.i)} onMouseLeave={() => setHv(null)} className={`transition-colors ${hv === f.i ? "bg-slate-50" : ""}`}>
                    <td className="px-6 py-3 font-bold text-slate-800">{f.l}</td>
                    <td className="px-4 py-3 text-right font-extrabold tabular-nums text-slate-900">{f.v}</td>
                    <td className="min-w-[180px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div key={claveAnim} className="rp-grow-x h-full rounded-full bg-blue-600" style={{ width: `${(f.v / maxVal) * 100}%`, animationDelay: `${f.i * 30}ms` }} />
                        </div>
                        <span className="w-9 text-right text-[12px] font-semibold tabular-nums text-slate-500">{Math.round(f.share * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold tabular-nums">
                      {f.diff === null ? <span className="text-slate-300">—</span> : <span className={f.diff >= 0 ? "text-emerald-600" : "text-rose-600"}>{signo(f.diff)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 text-[13px]">
                  <td className="px-6 py-3 font-bold text-slate-500">Total</td>
                  <td className="px-4 py-3 text-right font-extrabold tabular-nums text-slate-900">{fmt(totalVals)}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">Promedio {promedio} por periodo</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Tarjeta>

        <div className="space-y-6 xl:col-span-4">
          <Tarjeta style={{ animationDelay: ".45s" }} className="p-6">
            <Titulo t="Los 3 periodos con más estudiantes" s={`Ranking ${per.toLowerCase()}`} />
            <div key={claveAnim} className="grid grid-cols-3 items-end gap-3 pt-8">
              {podio.map((item, i) => (
                <div key={item.rank} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-[13px] font-bold text-slate-700">{item.l}</span>
                  <span className="text-[11px] font-semibold tabular-nums text-slate-400">{item.v} estud.</span>
                  <div className={`rp-grow-y flex w-full items-center justify-center rounded-t-xl text-lg font-black ${item.h} ${item.color}`} style={{ animationDelay: `${i * 90}ms` }}>
                    {item.rank}
                  </div>
                </div>
              ))}
            </div>
          </Tarjeta>

          <Tarjeta style={{ animationDelay: ".5s" }} className="p-6">
            <Titulo t="Lectura rápida" s="Lo más relevante del periodo, en una mirada." />
            <dl className="mt-4 divide-y divide-slate-100">
              {lecturas.map((l) => (
                <div key={l.t} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-[12px] text-slate-500">{l.t}</dt>
                  <dd className={`text-right text-[13px] font-bold tabular-nums ${l.tono || "text-slate-900"}`}>{l.v}</dd>
                </div>
              ))}
            </dl>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}