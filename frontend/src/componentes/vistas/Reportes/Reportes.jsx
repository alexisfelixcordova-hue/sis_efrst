import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

// Simulación o importación de datos de soporte (puedes adaptarlo a tu archivo data.js)
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
const PROGS = ["Diseño y Programación Web", "Arquitectura de Plataformas", "Redes y Conectividad"];
const SHARE = [0.45, 0.30, 0.25];
const COL = ["#2563eb", "#0ea5e9", "#10b981"];

// Función auxiliar simulada de montos mensuales (puedes reemplazarla con tu fuente de datos real)
const monthly = (y) => {
    const base = [12, 15, 20, 25, 30, 28, 18, 22, 35, 40, 38, 30];
    return base.map(v => v + (y - 2024) * 5);
};

const sum = a => a.reduce((s, b) => s + b, 0);
const fmt = (n) => Math.round(n).toLocaleString("es-PE");

/* ---------- Animaciones (keyframes propios, no requiere tocar tailwind.config) ---------- */
const estilosAnimaciones = `
@keyframes rp-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rp-row-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
@keyframes rp-grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes rp-grow-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes rp-pop { 0% { opacity: 0; transform: scale(.4); } 70% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
@keyframes rp-reveal { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes rp-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(24px,-18px) scale(1.08); } }
@keyframes rp-float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-28px,20px) scale(1.12); } }
@keyframes rp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes rp-pulse { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,.45); } 100% { box-shadow: 0 0 0 12px rgba(37,99,235,0); } }
@keyframes rp-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes rp-shine { from { transform: translateX(-120%) skewX(-18deg); } to { transform: translateX(320%) skewX(-18deg); } }
.rp-fade-up { animation: rp-fade-up .6s cubic-bezier(.22,1,.36,1) both; }
.rp-row-in { animation: rp-row-in .45s cubic-bezier(.22,1,.36,1) both; }
.rp-grow-y { transform-origin: bottom; animation: rp-grow-y .8s cubic-bezier(.22,1,.36,1) both; }
.rp-grow-x { transform-origin: left; animation: rp-grow-x .9s cubic-bezier(.22,1,.36,1) both; }
.rp-pop { animation: rp-pop .5s cubic-bezier(.22,1,.36,1) both; }
.rp-reveal { animation: rp-reveal 1.3s cubic-bezier(.65,0,.35,1) both; }
.rp-blob-a { animation: rp-float 11s ease-in-out infinite; }
.rp-blob-b { animation: rp-float2 14s ease-in-out infinite; }
.rp-marquee { animation: rp-marquee 38s linear infinite; }
.rp-marquee-wrap:hover .rp-marquee { animation-play-state: paused; }
.rp-pulse { animation: rp-pulse 1.8s ease-out infinite; }
.rp-bob { animation: rp-bob 2.2s ease-in-out infinite; }
.rp-shine::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 30%;
    background: linear-gradient(90deg, transparent, rgba(37,99,235,.07), transparent);
    animation: rp-shine 2.6s ease-out .4s both; pointer-events: none;
}
.rp-spot::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .3s;
    background: radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(37,99,235,.09), transparent 65%);
}
.rp-spot:hover::before { opacity: 1; }
.rp-mask { -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
@media (prefers-reduced-motion: reduce) {
    .rp-fade-up, .rp-row-in, .rp-grow-y, .rp-grow-x, .rp-pop, .rp-reveal, .rp-blob-a, .rp-blob-b, .rp-marquee, .rp-pulse, .rp-bob, .rp-shine::after { animation: none !important; }
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

/* ---------- Utilidades de animación ---------- */
const useContador = (objetivo, duracion = 900) => {
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

/* Segmentador con indicador deslizante */
const Seg = ({ opts, v, set }) => {
    const idx = Math.max(0, opts.indexOf(v));
    return (
        <div className="relative inline-grid bg-slate-100 rounded-xl p-1 ring-1 ring-slate-200/70" style={{ gridTemplateColumns: `repeat(${opts.length}, 1fr)` }}>
            <span
                className="absolute top-1 bottom-1 left-1 rounded-lg bg-blue-600 shadow-md shadow-blue-600/30 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
                style={{ width: `calc((100% - 0.5rem) / ${opts.length})`, transform: `translateX(${idx * 100}%)` }}
            />
            {opts.map(o => (
                <button
                    key={o}
                    onClick={() => set(o)}
                    className={"relative z-10 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 " + (v === o ? "text-white" : "text-slate-500 hover:text-slate-800")}
                >
                    {o}
                </button>
            ))}
        </div>
    );
};

/* Tarjeta con luz que sigue al cursor */
const Tarjeta = ({ className = "", delay = 0, children }) => {
    const onMove = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    return (
        <div
            onMouseMove={onMove}
            className={`rp-fade-up rp-spot relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-shadow duration-300 overflow-hidden ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const Titulo = ({ t, s, derecha }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">{t}</h3>
            {s && <p className="text-xs text-slate-500">{s}</p>}
        </div>
        {derecha}
    </div>
);

export default function Reportes() {
    const [y, setY] = useState(2026);
    const [per, setPer] = useState("Mensual");
    const [hv, setHv] = useState(null); // índice resaltado, compartido entre gráfico, mapa de calor y tabla
    const [pg, setPg] = useState(null); // programa resaltado

    const { vals, labels } = useMemo(() => {
        const m = monthly(y);
        if (per === "Mensual") return { vals: m, labels: MESES };
        if (per === "Trimestral") return { vals: [0, 3, 6, 9].map(i => sum(m.slice(i, i + 3))), labels: ["T1", "T2", "T3", "T4"] };
        return { vals: [2023, 2024, 2025, 2026].map(a => sum(monthly(a))), labels: ["2023", "2024", "2025", "2026"] };
    }, [y, per]);

    useEffect(() => { setHv(null); }, [y, per]);

    const tot = sum(monthly(y));
    const totPrev = sum(monthly(y - 1));
    const d = totPrev ? Math.round(((tot - totPrev) / totPrev) * 100) : 0;

    /* ---------- Derivados solo de presentación ---------- */
    const n = vals.length;
    const maxVal = Math.max(...vals, 1);
    const minVal = Math.min(...vals);
    const techo = Math.ceil((maxVal * 1.12) / 10) * 10 || 10;
    const promedio = Math.round(sum(vals) / n);
    const idxPico = vals.indexOf(maxVal);
    const idxMin = vals.indexOf(minVal);
    const horas = tot * 120;
    const empresas = 40 + (y - 2023) * 14;
    const tasa = 88 + (y - 2024) * 3;
    const ring = useContador(1, 1200);

    // Curva suave (coordenadas 0-100 sobre un SVG sin proporción fija)
    const pts = vals.map((v, i) => ({ x: ((i + 0.5) / n) * 100, y: 100 - (v / techo) * 100 }));
    const curva = pts.map((p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const q = pts[i - 1];
        const cx = (q.x + p.x) / 2;
        return `C${cx},${q.y} ${cx},${p.y} ${p.x},${p.y}`;
    }).join(" ");
    const area = `${curva} L${pts[n - 1].x},100 L${pts[0].x},100 Z`;

    const onMoveGrafico = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const f = (e.clientX - r.left) / r.width;
        setHv(Math.min(n - 1, Math.max(0, Math.floor(f * n))));
    };

    // Mapa de calor (siempre por meses del año seleccionado)
    const mensual = monthly(y);
    const minM = Math.min(...mensual), maxM = Math.max(...mensual);
    const idxPicoM = mensual.indexOf(maxM);

    // Podio
    const top3 = vals.map((v, i) => ({ v, l: labels[i], i })).sort((a, b) => b.v - a.v).slice(0, 3);
    const podio = [
        { ...top3[1], rank: 2, h: "h-24", color: "from-sky-400 to-sky-500" },
        { ...top3[0], rank: 1, h: "h-36", color: "from-blue-500 to-blue-700" },
        { ...top3[2], rank: 3, h: "h-16", color: "from-emerald-400 to-emerald-500" },
    ];

    const cintaItems = [
        `Pico en ${labels[idxPico]}: ${maxVal} prácticas`,
        `Promedio de ${promedio} por periodo`,
        `${d >= 0 ? "+" : ""}${d}% frente a ${y - 1}`,
        `${fmt(horas)} horas formativas acumuladas`,
        `Menor actividad en ${labels[idxMin]}`,
        `Tasa de aprobación ${tasa}%`,
    ];

    const exportarCSV = () => {
        const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const filas = [
            ["Periodo", "Prácticas registradas", "Horas estimadas", "Variación %"],
            ...vals.map((v, i) => {
                const prev = i > 0 ? vals[i - 1] : null;
                const diff = prev !== null ? Math.round(((v - prev) / (prev || 1)) * 100) : "";
                return [labels[i], v, v * 120, diff];
            }),
        ];
        const csv = "﻿" + filas.map(f => f.map(esc).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        const a = document.createElement("a");
        a.href = url; a.download = `reporte_efsrt_${per.toLowerCase()}_${y}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const claveAnim = `${per}-${y}`;

    return (
        <div className="w-full p-5 md:p-6 space-y-6">
            <style>{estilosAnimaciones}</style>

            {/* ================= HERO ================= */}
            <section className="rp-fade-up rp-shine relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/80 border border-slate-100 text-slate-900 p-6 md:p-8 shadow-sm">
                {/* Decoración suave */}
                <div className="rp-blob-a absolute -top-28 -left-20 w-80 h-80 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
                <div className="rp-blob-b absolute -bottom-32 right-0 w-96 h-96 rounded-full bg-sky-300/20 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.22] pointer-events-none" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

                <div className="relative flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                    <div className="space-y-2">
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 ring-1 ring-blue-100 text-[11px] font-semibold text-blue-700">
                            <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" /></span>
                            Año fiscal {y}
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Reportes y Estadísticas (EFSRT)</h1>
                        <p className="text-sm text-slate-500 max-w-xl">Indicadores de rendimiento de prácticas pre-profesionales y convenios institucionales.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Seg opts={[2024, 2025, 2026]} v={y} set={setY} />
                        <Seg opts={["Mensual", "Trimestral", "Anual"]} v={per} set={setPer} />
                        <button
                            onClick={exportarCSV}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <IconDownload /> Exportar
                        </button>
                    </div>
                </div>

                <div className="relative grid grid-cols-1 xl:grid-cols-5 gap-8 mt-8 items-stretch">
                    {/* Cifra principal + resumen */}
                    <div className="xl:col-span-2 flex flex-col justify-between gap-8">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Prácticas EFSRT {y}</p>
                            <div className="flex flex-wrap items-end gap-4">
                                <p className="text-6xl md:text-7xl font-black tracking-tight tabular-nums leading-none bg-gradient-to-br from-slate-900 via-slate-800 to-blue-600 bg-clip-text text-transparent">
                                    <Num v={tot} />
                                </p>
                                <span className={`mb-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${d >= 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                                    {d >= 0 ? <IconTrendUp /> : <IconTrendDown />}
                                    {d >= 0 ? "+" : ""}{d}% vs {y - 1}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500">Estudiantes en prácticas durante el periodo fiscal.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-slate-50/80 ring-1 ring-slate-100 p-4 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2">
                                <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><IconClock /></span>
                                <p className="text-xl font-extrabold text-slate-900 tabular-nums leading-none"><Num v={horas} /></p>
                                <p className="text-[11px] text-slate-500 leading-tight">Horas formativas</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50/80 ring-1 ring-slate-100 p-4 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2">
                                <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><IconBuilding /></span>
                                <p className="text-xl font-extrabold text-slate-900 tabular-nums leading-none"><Num v={empresas} /></p>
                                <p className="text-[11px] text-slate-500 leading-tight">Empresas de convenio</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50/80 ring-1 ring-slate-100 p-4 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3">
                                <div className="relative w-12 h-12 shrink-0">
                                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${tasa * ring} ${100 - tasa * ring}`} />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xl font-extrabold text-slate-900 tabular-nums leading-none">{tasa}%</p>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-1">Aprobación</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico interactivo */}
                    <div className="xl:col-span-3 rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Flujo de prácticas · {per.toLowerCase()}</p>
                                <p className="text-[11px] text-slate-500">{per === "Anual" ? "Comparativo histórico 2023–2026" : `Período fiscal ${y}`} · pasa el cursor para ver el detalle</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-slate-600">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-blue-600" /> Prácticas</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-amber-400" /> Promedio</span>
                            </div>
                        </div>

                        <div
                            className="relative h-60 cursor-crosshair select-none"
                            onMouseMove={onMoveGrafico}
                            onMouseLeave={() => setHv(null)}
                        >
                            {/* Guías */}
                            {[0, 0.25, 0.5, 0.75, 1].map(g => (
                                <div key={g} className="absolute inset-x-0 border-t border-slate-100" style={{ top: `${(1 - g) * 100}%` }}>
                                    <span className="absolute -top-2 left-0 text-[9px] font-semibold text-slate-400 tabular-nums">{Math.round(techo * g)}</span>
                                </div>
                            ))}
                            {/* Promedio */}
                            <div className="absolute inset-x-0 border-t border-dashed border-amber-400/80" style={{ top: `${100 - (promedio / techo) * 100}%` }} />

                            {/* Curva con revelado */}
                            <div key={claveAnim} className="rp-reveal absolute inset-0">
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                    <defs>
                                        <linearGradient id="rp-area" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d={area} fill="url(#rp-area)" />
                                    <path d={curva} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                </svg>
                            </div>

                            {/* Línea vertical */}
                            {hv !== null && (
                                <div className="absolute top-0 bottom-0 w-px bg-slate-300 pointer-events-none" style={{ left: `${pts[hv].x}%` }} />
                            )}

                            {/* Puntos */}
                            {pts.map((p, i) => (
                                <span
                                    key={`${claveAnim}-${i}`}
                                    className="rp-pop absolute pointer-events-none"
                                    style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${600 + i * 60}ms` }}
                                >
                                    <span className={`block -ml-[6px] -mt-[6px] rounded-full bg-white ring-2 shadow-sm transition-all duration-200 ${hv === i ? "w-4 h-4 -ml-2 -mt-2 ring-blue-600" : i === idxPico ? "w-3 h-3 ring-amber-400" : "w-3 h-3 ring-blue-500"}`} />
                                </span>
                            ))}

                            {/* Tooltip */}
                            {hv !== null && (
                                <div
                                    className="absolute z-10 pointer-events-none rounded-xl bg-slate-900 text-white px-3 py-2 shadow-xl shadow-slate-900/20 whitespace-nowrap"
                                    style={{
                                        left: `${pts[hv].x}%`,
                                        top: `${Math.max(pts[hv].y, 22)}%`,
                                        transform: `translate(${pts[hv].x < 14 ? "0%" : pts[hv].x > 86 ? "-100%" : "-50%"}, calc(-100% - 14px))`,
                                    }}
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels[hv]}</p>
                                    <p className="text-sm font-extrabold">{vals[hv]} prácticas</p>
                                    <p className="text-[11px] text-slate-300">{fmt(vals[hv] * 120)} hrs{hv > 0 ? ` · ${vals[hv] >= vals[hv - 1] ? "▲" : "▼"} ${Math.abs(Math.round(((vals[hv] - vals[hv - 1]) / (vals[hv - 1] || 1)) * 100))}%` : ""}</p>
                                </div>
                            )}
                        </div>

                        {/* Etiquetas */}
                        <div className="flex">
                            {labels.map((l, i) => (
                                <span key={l} className={`flex-1 text-center text-[11px] font-semibold transition-colors duration-200 ${hv === i ? "text-blue-700" : "text-slate-400"}`}>{l}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= CINTA DE DATOS ================= */}
            <div className="rp-fade-up rp-marquee-wrap rp-mask overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm py-3" style={{ animationDelay: "120ms" }}>
                <div className="rp-marquee flex w-max gap-10 whitespace-nowrap text-xs font-semibold text-slate-600">
                    {[...cintaItems, ...cintaItems].map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            {/* ================= BENTO ================= */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Mapa de calor */}
                <Tarjeta className="xl:col-span-7 p-6 space-y-6" delay={180}>
                    <Titulo
                        t="Mapa de calor del año"
                        s={`Intensidad de prácticas por mes · ${y}`}
                        derecha={
                            <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                                menos
                                <span className="w-24 h-2 rounded-full" style={{ background: "linear-gradient(90deg, rgba(37,99,235,.12), rgba(37,99,235,1))" }} />
                                más
                            </div>
                        }
                    />
                    <div key={`hm-${y}`} className="space-y-3">
                        {[0, 1, 2, 3].map(q => (
                            <div key={q} className="grid grid-cols-[56px_1fr] items-center gap-3">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-700">T{q + 1}</p>
                                    <p className="text-[10px] text-slate-400 tabular-nums">{sum(mensual.slice(q * 3, q * 3 + 3))} práct.</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[0, 1, 2].map(c => {
                                        const m = q * 3 + c;
                                        const t = maxM === minM ? 1 : (mensual[m] - minM) / (maxM - minM);
                                        const activo = per === "Mensual" && hv === m;
                                        return (
                                            <div
                                                key={m}
                                                onMouseEnter={() => per === "Mensual" && setHv(m)}
                                                onMouseLeave={() => per === "Mensual" && setHv(null)}
                                                className={`rp-pop relative h-[68px] rounded-2xl flex flex-col items-center justify-center cursor-default transition-all duration-200 hover:scale-[1.04] hover:shadow-lg ${activo ? "ring-2 ring-blue-300 scale-[1.04]" : ""} ${m === idxPicoM ? "rp-pulse" : ""}`}
                                                style={{
                                                    background: `rgba(37,99,235,${0.1 + t * 0.9})`,
                                                    color: t > 0.45 ? "#fff" : "#1e3a8a",
                                                    animationDelay: `${m * 45}ms`,
                                                }}
                                                title={`${MESES[m]}: ${mensual[m]} prácticas`}
                                            >
                                                <span className="text-[10px] font-semibold opacity-80">{MESES[m]}</span>
                                                <span className="text-lg font-extrabold tabular-nums leading-tight">{mensual[m]}</span>
                                                {m === idxPicoM && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z" /></svg></span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </Tarjeta>

                {/* Programas */}
                <Tarjeta className="xl:col-span-5 p-6 space-y-6" delay={240}>
                    <Titulo t={`Por programa de estudios, ${y}`} s="Participación porcentual de carreras técnicas" />
                    <div className="space-y-2">
                        <div key={`pg-${y}`} className="flex h-5 gap-1">
                            {PROGS.map((p, i) => (
                                <div
                                    key={p}
                                    onMouseEnter={() => setPg(i)}
                                    onMouseLeave={() => setPg(null)}
                                    className="rp-grow-x rounded-md flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 cursor-default"
                                    style={{ width: `${SHARE[i] * 100}%`, background: COL[i], opacity: pg === null || pg === i ? 1 : 0.3, transform: pg === i ? "scaleY(1.35)" : undefined, animationDelay: `${i * 150}ms` }}
                                >
                                    {Math.round(SHARE[i] * 100)}%
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {PROGS.map((p, i) => (
                            <div
                                key={p}
                                onMouseEnter={() => setPg(i)}
                                onMouseLeave={() => setPg(null)}
                                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-default ${pg === i ? "bg-slate-50 translate-x-1" : ""}`}
                                style={{ opacity: pg === null || pg === i ? 1 : 0.45 }}
                            >
                                <span className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COL[i] }} />
                                    <span className="text-xs font-semibold text-slate-700 truncate">{p}</span>
                                </span>
                                <span className="text-sm font-extrabold tabular-nums" style={{ color: COL[i] }}>
                                    <Num v={Math.round(tot * SHARE[i])} /> <span className="text-[10px] font-semibold text-slate-400">est.</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </Tarjeta>

                {/* Detalle analítico (libro de periodos) */}
                <Tarjeta className="xl:col-span-7 overflow-hidden" delay={300}>
                    <div className="p-6 pb-4">
                        <Titulo
                            t="Detalle analítico del periodo"
                            s={`Desglose ${per.toLowerCase()} · pasa el cursor para enlazarlo con el gráfico`}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[560px]">
                            <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-6 py-2.5 bg-slate-50/80 border-y border-slate-100 text-[11px] uppercase font-semibold tracking-wider text-slate-500">
                                <span>Periodo</span><span>Prácticas</span><span>Horas</span><span>Variación</span>
                            </div>
                            <div key={claveAnim} className="divide-y divide-slate-100">
                                {vals.map((v, i) => {
                                    const prev = i > 0 ? vals[i - 1] : null;
                                    const diff = prev !== null ? Math.round(((v - prev) / (prev || 1)) * 100) : 0;
                                    return (
                                        <div
                                            key={i}
                                            onMouseEnter={() => setHv(i)}
                                            onMouseLeave={() => setHv(null)}
                                            className={`rp-row-in grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 items-center px-6 py-3 transition-colors duration-200 ${hv === i ? "bg-blue-50/70" : ""}`}
                                            style={{ animationDelay: `${i * 35}ms` }}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">{labels[i]}</span>
                                                {i === idxPico && <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">Pico</span>}
                                            </span>
                                            <span className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-slate-700 tabular-nums w-8">{v}</span>
                                                <span className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                    <span className="rp-grow-x block h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600" style={{ width: `${(v / maxVal) * 100}%`, animationDelay: `${i * 35 + 150}ms` }} />
                                                </span>
                                            </span>
                                            <span className="text-sm text-slate-600 tabular-nums">{fmt(v * 120)} hrs</span>
                                            <span>
                                                {prev !== null ? (
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${v >= prev ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-rose-50 text-rose-700 ring-rose-100"}`}>
                                                        {v >= prev ? <IconTrendUp /> : <IconTrendDown />}
                                                        {v >= prev ? "+" : "-"}{Math.abs(diff)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium">— Base</span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
                        <span>{n} periodos · Total <strong className="text-slate-700">{fmt(sum(vals))}</strong> prácticas</span>
                        <span className="tabular-nums">{fmt(sum(vals) * 120)} hrs</span>
                    </div>
                </Tarjeta>

                {/* Podio */}
                <Tarjeta className="xl:col-span-5 p-6 flex flex-col" delay={360}>
                    <Titulo t="Podio de periodos" s={`Los 3 periodos con más prácticas · ${per.toLowerCase()}`} />
                    <div key={`pd-${claveAnim}`} className="flex-1 flex items-end justify-center gap-3 pt-8 min-h-[250px]">
                        {podio.map((p, k) => (
                            <div key={p.rank} className="flex flex-col items-center w-24">
                                {p.rank === 1 && <span className="rp-bob text-amber-400 mb-1"><IconCrown /></span>}
                                <p className="text-[11px] font-bold text-slate-500 mb-1">{p.l}</p>
                                <div
                                    className={`rp-grow-y w-full ${p.h} rounded-t-2xl bg-gradient-to-b ${p.color} flex flex-col items-center justify-start pt-3 text-white shadow-lg`}
                                    style={{ animationDelay: `${300 + k * 150}ms` }}
                                >
                                    <span className="text-xl font-black tabular-nums leading-none">{p.v}</span>
                                    <span className="text-[10px] font-semibold opacity-80 mt-1">#{p.rank}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Promedio</p><p className="text-lg font-extrabold text-slate-900 tabular-nums">{promedio}</p></div>
                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Mejor</p><p className="text-lg font-extrabold text-emerald-600">{labels[idxPico]}</p></div>
                        <div><p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Menor</p><p className="text-lg font-extrabold text-amber-600">{labels[idxMin]}</p></div>
                    </div>
                </Tarjeta>
            </div>
        </div>
    );
}