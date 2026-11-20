import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
const COL = ["#2563eb", "#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"];

// Respaldo mientras el endpoint /api/reportes/estadisticas se termina de poblar
const monthlyFallback = (y) => {
  const base = [12, 15, 20, 25, 30, 28, 18, 22, 35, 40, 38, 30];
  return base.map((v) => Math.max(0, v + (y - 2024) * 5));
};

const sum = (a) => a.reduce((s, b) => s + b, 0);
const fmt = (n) => Math.round(n).toLocaleString("es-PE");

/* ---------- Animaciones: solo crecimiento de barras (sin barridos) ---------- */
const estilosAnimaciones = `
@keyframes rp-grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes rp-grow-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.rp-grow-y { transform-origin: bottom; animation: rp-grow-y .6s cubic-bezier(.22,1,.36,1) both; }
.rp-grow-x { transform-origin: left; animation: rp-grow-x .6s cubic-bezier(.22,1,.36,1) both; }
@media (prefers-reduced-motion: reduce) {
    .rp-grow-y, .rp-grow-x { animation: none !important; }
}
`;

/* ---------- Iconos ---------- */
const Icon = ({ children, className = "w-4 h-4", stroke = 2 }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    {children}
  </svg>
);
const IconDownload = () => (<Icon><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></Icon>);
const IconClock = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>);
const IconBuilding = () => (<Icon className="w-5 h-5"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" /></Icon>);
const IconTrendUp = () => (<Icon className="w-3.5 h-3.5"><path d="m3 17 6-6 4 4 8-8M15 7h6v6" /></Icon>);
const IconTrendDown = () => (<Icon className="w-3.5 h-3.5"><path d="m3 7 6 6 4-4 8 8M15 17h6v-6" /></Icon>);
const IconCrown = () => (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></svg>);

/* ---------- Utilidades ---------- */
const useContador = (objetivo, duracion = 700) => {
  const [valor, setValor] = useState(0);
  useEffect(() => {
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

const Seg = ({ opts, v, set, etiqueta }) => (
  <div role="group" aria-label={etiqueta} className="inline-flex rounded-lg border border-slate-200 p-0.5">
    {opts.map((o) => (
      <button
        key={o}
        onClick={() => set(o)}
        aria-pressed={v === o}
        className={
          "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " +
          (v === o ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100")
        }
      >
        {o}
      </button>
    ))}
  </div>
);

const Tarjeta = ({ className = "", children }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>{children}</div>
);

const Titulo = ({ t, s, derecha }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-1">
      <h3 className="text-base font-bold text-slate-900">{t}</h3>
      {s && <p className="text-sm text-slate-500">{s}</p>}
    </div>
    {derecha}
  </div>
);

export default function Reportes() {
  const [y, setY] = useState(2026);
  const [per, setPer] = useState("Mensual");
  const [hv, setHv] = useState(null);
  const [pg, setPg] = useState(null);

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

  const mensual = useMemo(() => {
    if (Array.isArray(datosApi?.mensual) && datosApi.mensual.length === 12) {
      return datosApi.mensual.map((v) => Number(v) || 0);
    }
    return monthlyFallback(y);
  }, [datosApi, y]);

  const mensualPrev = useMemo(() => {
    if (Array.isArray(datosApi?.mensual_anterior) && datosApi.mensual_anterior.length === 12) {
      return datosApi.mensual_anterior.map((v) => Number(v) || 0);
    }
    return monthlyFallback(y - 1);
  }, [datosApi, y]);

  const historicoAnual = useMemo(() => {
    if (Array.isArray(datosApi?.anual) && datosApi.anual.length > 0) {
      return {
        labels: datosApi.anual.map((item) => String(item.anio)),
        vals: datosApi.anual.map((item) => Number(item.total) || 0),
      };
    }
    const anios = [2023, 2024, 2025, 2026];
    return {
      labels: anios.map(String),
      vals: anios.map((a) => sum(monthlyFallback(a))),
    };
  }, [datosApi]);

  const { vals, labels } = useMemo(() => {
    if (per === "Mensual") return { vals: mensual, labels: MESES };
    if (per === "Trimestral") {
      return {
        vals: [0, 3, 6, 9].map((i) => sum(mensual.slice(i, i + 3))),
        labels: ["T1", "T2", "T3", "T4"],
      };
    }
    return historicoAnual;
  }, [mensual, historicoAnual, per]);

  useEffect(() => {
    setHv(null);
  }, [y, per]);

  const tot = datosApi?.total_practicas !== undefined ? Number(datosApi.total_practicas) : sum(mensual);
  const totPrev = datosApi?.total_anterior !== undefined ? Number(datosApi.total_anterior) : sum(mensualPrev);
  const d = totPrev ? Math.round(((tot - totPrev) / totPrev) * 100) : tot > 0 ? 100 : 0;

  /* ---------- KPIs ---------- */
  const n = vals.length;
  const maxVal = Math.max(...vals, 1);
  const minVal = Math.min(...vals);
  const techo = Math.ceil((maxVal * 1.12) / 10) * 10 || 10;
  const promedio = Math.round(sum(vals) / n);
  const idxPico = vals.indexOf(maxVal);
  const idxMin = vals.indexOf(minVal);
  const horas = datosApi?.horas_formativas !== undefined ? Number(datosApi.horas_formativas) : tot * 160;
  const empresas = datosApi?.empresas_convenio !== undefined ? Number(datosApi.empresas_convenio) : 40 + (y - 2023) * 14;
  const tasa = datosApi?.tasa_aprobacion !== undefined ? Number(datosApi.tasa_aprobacion) : Math.min(100, 88 + (y - 2024) * 3);
  const ring = useContador(1, 900);

  const programasLista = useMemo(() => {
    if (Array.isArray(datosApi?.programas) && datosApi.programas.length > 0) {
      const totalProg = sum(datosApi.programas.map((p) => Number(p.total) || 0)) || 1;
      return datosApi.programas.map((p, idx) => ({
        nombre: p.programa || "Diseño y Programación Web",
        total: Number(p.total) || 0,
        share: (Number(p.total) || 0) / totalProg,
        color: COL[idx % COL.length],
      }));
    }
    const defaults = [
      { nombre: "Diseño y Programación Web", share: 0.45 },
      { nombre: "Arquitectura de Plataformas", share: 0.30 },
      { nombre: "Redes y Conectividad", share: 0.25 },
    ];
    return defaults.map((p, idx) => ({
      nombre: p.nombre,
      total: Math.round(tot * p.share),
      share: p.share,
      color: COL[idx % COL.length],
    }));
  }, [datosApi, tot]);

  // Curva suave
  const pts = vals.map((v, i) => ({ x: ((i + 0.5) / n) * 100, y: 100 - (v / techo) * 100 }));
  const curva = pts
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const q = pts[i - 1];
      const cx = (q.x + p.x) / 2;
      return `C${cx},${q.y} ${cx},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");

  const onMoveGrafico = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    setHv(Math.min(n - 1, Math.max(0, Math.floor(f * n))));
  };

  // Mapa de calor mensual
  const minM = Math.min(...mensual);
  const maxM = Math.max(...mensual);
  const idxPicoM = mensual.indexOf(maxM);

  // Podio Top 3
  const top3 = vals
    .map((v, i) => ({ v, l: labels[i], i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);
  const podio = [
    { ...(top3[1] || { v: 0, l: "-" }), rank: 2, h: "h-24", color: "bg-sky-500" },
    { ...(top3[0] || { v: 0, l: "-" }), rank: 1, h: "h-36", color: "bg-blue-600" },
    { ...(top3[2] || { v: 0, l: "-" }), rank: 3, h: "h-16", color: "bg-emerald-500" },
  ];

  const resumen = [
    { t: "Pico", v: `${labels[idxPico]} · ${maxVal} prácticas` },
    { t: "Menor actividad", v: `${labels[idxMin]} · ${minVal} prácticas` },
    { t: "Promedio", v: `${promedio} por periodo` },
    { t: `Variación vs ${y - 1}`, v: `${d >= 0 ? "+" : ""}${d}%` },
  ];

  const exportarCSV = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filas = [
      ["Periodo", "Prácticas registradas", "Horas formativas", "Variación %"],
      ...vals.map((v, i) => {
        const prev = i > 0 ? vals[i - 1] : null;
        const diff = prev !== null ? Math.round(((v - prev) / (prev || 1)) * 100) : "";
        return [labels[i], v, v * 160, diff];
      }),
    ];
    const csv = "\uFEFF" + filas.map((f) => f.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_efsrt_${per.toLowerCase()}_${y}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const claveAnim = `${per}-${y}-${fuenteReal ? "bd" : "demo"}`;

  return (
    <div className="w-full p-5 md:p-6 space-y-6">
      <style>{estilosAnimaciones}</style>

      {/* ================= ENCABEZADO ================= */}
      <section className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">Año fiscal {y}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${fuenteReal ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {cargando ? "Sincronizando datos…" : fuenteReal ? "Conectado a PostgreSQL" : "Vista previa local"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Reportes y estadísticas EFSRT</h1>
            <p className="text-sm text-slate-500 max-w-xl">Rendimiento de las prácticas pre-profesionales y de los convenios con empresas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Seg etiqueta="Año" opts={[2024, 2025, 2026]} v={y} set={setY} />
            <Seg etiqueta="Periodo" opts={["Mensual", "Trimestral", "Anual"]} v={per} set={setPer} />
            <button
              onClick={exportarCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <IconDownload /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mt-8 items-stretch">
          <div className="xl:col-span-2 flex flex-col justify-between gap-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600">Prácticas registradas en {y}</p>
              <div className="flex flex-wrap items-end gap-4">
                <p className="text-6xl md:text-7xl font-black tracking-tight tabular-nums leading-none text-slate-900">
                  <Num v={tot} />
                </p>
                <span className={`mb-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${d >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {d >= 0 ? <IconTrendUp /> : <IconTrendDown />}
                  {d >= 0 ? "+" : ""}{d}% vs {y - 1}
                </span>
              </div>
              <p className="text-sm text-slate-500">Estudiantes en prácticas durante el año fiscal.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><IconClock /></span>
                <p className="text-xl font-extrabold text-slate-900 tabular-nums leading-none"><Num v={horas} /></p>
                <p className="text-xs text-slate-500 leading-tight">Horas formativas</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><IconBuilding /></span>
                <p className="text-xl font-extrabold text-slate-900 tabular-nums leading-none"><Num v={empresas} /></p>
                <p className="text-xs text-slate-500 leading-tight">Empresas con convenio</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${tasa * ring} ${100 - tasa * ring}`} />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900 tabular-nums leading-none">{tasa}%</p>
                  <p className="text-xs text-slate-500 leading-tight mt-1">Aprobación</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico interactivo */}
          <div className="xl:col-span-3 rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">Flujo de prácticas ({per.toLowerCase()})</p>
                <p className="text-xs text-slate-500">{per === "Anual" ? "Comparativo histórico" : `Año fiscal ${y}`}. Pasa el cursor para ver el detalle.</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-blue-600" /> Prácticas</span>
                <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-amber-500" /> Promedio</span>
              </div>
            </div>

            <div className="relative h-60 cursor-crosshair select-none" onMouseMove={onMoveGrafico} onMouseLeave={() => setHv(null)}>
              {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                <div key={g} className="absolute inset-x-0 border-t border-slate-100" style={{ top: `${(1 - g) * 100}%` }}>
                  <span className="absolute -top-2 left-0 text-[10px] font-semibold text-slate-400 tabular-nums bg-white pr-1">{Math.round(techo * g)}</span>
                </div>
              ))}
              <div className="absolute inset-x-0 border-t border-dashed border-amber-500/80" style={{ top: `${100 - (promedio / techo) * 100}%` }} />

              <div key={claveAnim} className="absolute inset-0">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <path d={curva} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>

              {hv !== null && <div className="absolute top-0 bottom-0 w-px bg-slate-300 pointer-events-none" style={{ left: `${pts[hv].x}%` }} />}

              {pts.map((p, i) => (
                <span key={`${claveAnim}-${i}`} className="absolute pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  <span className={`block rounded-full bg-white ring-2 transition-all duration-150 ${hv === i ? "w-4 h-4 -ml-2 -mt-2 ring-blue-600" : i === idxPico ? "w-3 h-3 -ml-1.5 -mt-1.5 ring-amber-500" : "w-3 h-3 -ml-1.5 -mt-1.5 ring-blue-500"}`} />
                </span>
              ))}

              {hv !== null && (
                <div
                  className="absolute z-10 pointer-events-none rounded-lg bg-slate-900 text-white px-3 py-2 whitespace-nowrap"
                  style={{
                    left: `${pts[hv].x}%`,
                    top: `${Math.max(pts[hv].y, 22)}%`,
                    transform: `translate(${pts[hv].x < 14 ? "0%" : pts[hv].x > 86 ? "-100%" : "-50%"}, calc(-100% - 14px))`,
                  }}
                >
                  <p className="text-xs font-semibold text-slate-400">{labels[hv]}</p>
                  <p className="text-sm font-extrabold">{vals[hv]} prácticas</p>
                  <p className="text-xs text-slate-300">
                    {fmt(vals[hv] * 160)} hrs
                    {hv > 0 ? ` · ${vals[hv] >= vals[hv - 1] ? "▲" : "▼"} ${Math.abs(Math.round(((vals[hv] - vals[hv - 1]) / (vals[hv - 1] || 1)) * 100))}%` : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="flex">
              {labels.map((l, i) => (
                <span key={l} className={`flex-1 text-center text-xs font-semibold transition-colors ${hv === i ? "text-blue-700" : "text-slate-400"}`}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= RESUMEN (estático) ================= */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {resumen.map((r) => (
          <div key={r.t} className="rounded-xl bg-white border border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">{r.t}</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">{r.v}</p>
          </div>
        ))}
      </div>

      {/* ================= BENTO ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Mapa de calor */}
        <Tarjeta className="xl:col-span-7 p-6 space-y-6">
          <Titulo
            t="Mapa de calor del año"
            s={`Prácticas por mes en ${y}. Más oscuro, más prácticas.`}
          />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((q) => (
              <div key={q} className="grid grid-cols-[56px_1fr] items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">T{q + 1}</p>
                  <p className="text-[11px] text-slate-400 tabular-nums">{sum(mensual.slice(q * 3, q * 3 + 3))} práct.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((c) => {
                    const m = q * 3 + c;
                    const t = maxM === minM ? 1 : (mensual[m] - minM) / (maxM - minM);
                    const activo = per === "Mensual" && hv === m;
                    return (
                      <div
                        key={m}
                        onMouseEnter={() => per === "Mensual" && setHv(m)}
                        onMouseLeave={() => per === "Mensual" && setHv(null)}
                        className={`relative h-[68px] rounded-xl flex flex-col items-center justify-center cursor-default transition-shadow duration-150 ${activo ? "ring-2 ring-blue-300" : ""} ${m === idxPicoM ? "ring-2 ring-amber-400" : ""}`}
                        style={{
                          background: `rgba(37,99,235,${0.1 + t * 0.9})`,
                          color: t > 0.45 ? "#fff" : "#1e3a8a",
                        }}
                        title={`${MESES[m]}: ${mensual[m]} prácticas`}
                      >
                        <span className="text-xs font-semibold opacity-80">{MESES[m]}</span>
                        <span className="text-lg font-extrabold tabular-nums leading-tight">{mensual[m]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">El borde ámbar marca el mes con más prácticas.</p>
        </Tarjeta>

        {/* Programas */}
        <Tarjeta className="xl:col-span-5 p-6 space-y-6">
          <Titulo t={`Por programa de estudios, ${y}`} s="Participación de cada carrera técnica" />
          <div className="flex h-6 gap-1">
            {programasLista.map((p, i) => (
              <div
                key={p.nombre}
                onMouseEnter={() => setPg(i)}
                onMouseLeave={() => setPg(null)}
                className="rp-grow-x rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-opacity duration-200 cursor-default"
                style={{
                  width: `${Math.max(p.share * 100, 8)}%`,
                  background: p.color,
                  opacity: pg === null || pg === i ? 1 : 0.35,
                  animationDelay: `${i * 100}ms`,
                }}
              >
                {Math.round(p.share * 100)}%
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {programasLista.map((p, i) => (
              <div
                key={p.nombre}
                onMouseEnter={() => setPg(i)}
                onMouseLeave={() => setPg(null)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-default ${pg === i ? "bg-slate-50" : ""}`}
                style={{ opacity: pg === null || pg === i ? 1 : 0.5 }}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-sm font-semibold text-slate-700 truncate">{p.nombre}</span>
                </span>
                <span className="text-sm font-extrabold tabular-nums" style={{ color: p.color }}>
                  <Num v={p.total} /> <span className="text-xs font-semibold text-slate-400">estudiantes</span>
                </span>
              </div>
            ))}
          </div>
        </Tarjeta>

        {/* Detalle analítico */}
        <Tarjeta className="xl:col-span-7">
          <div className="p-6 pb-4">
            <Titulo t="Detalle del periodo" s={`Desglose ${per.toLowerCase()}. Al pasar el cursor se resalta en el gráfico.`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="px-6 py-3">Periodo</th>
                  <th className="px-4 py-3 text-right">Prácticas</th>
                  <th className="px-4 py-3 text-right">Horas</th>
                  <th className="px-6 py-3 text-right">Variación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vals.map((v, i) => {
                  const prev = i > 0 ? vals[i - 1] : null;
                  const diff = prev !== null ? Math.round(((v - prev) / (prev || 1)) * 100) : 0;
                  return (
                    <tr
                      key={labels[i]}
                      onMouseEnter={() => setHv(i)}
                      onMouseLeave={() => setHv(null)}
                      className={`transition-colors ${hv === i ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-6 py-3 font-bold text-slate-800">{labels[i]}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900 tabular-nums">{v}</td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{fmt(v * 160)} hrs</td>
                      <td className="px-6 py-3 text-right font-semibold tabular-nums">
                        {i === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className={diff >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {diff >= 0 ? `+${diff}%` : `${diff}%`}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        {/* Podio Top 3 */}
        <Tarjeta className="xl:col-span-5 p-6 flex flex-col justify-between gap-6">
          <Titulo t="Los 3 periodos con más prácticas" s={`Ranking ${per.toLowerCase()}`} />
          <div className="grid grid-cols-3 items-end gap-3 pt-6">
            {podio.map((item) => (
              <div key={item.rank} className="flex flex-col items-center text-center gap-2">
                {item.rank === 1 && (
                  <span className="text-amber-500">
                    <IconCrown />
                  </span>
                )}
                <span className="text-sm font-bold text-slate-700">{item.l}</span>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">{item.v} práct.</span>
                <div className={`rp-grow-y w-full ${item.h} rounded-t-xl ${item.color} text-white flex items-center justify-center font-black text-lg`}>
                  #{item.rank}
                </div>
              </div>
            ))}
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}