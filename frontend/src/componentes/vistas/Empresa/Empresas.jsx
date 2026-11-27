import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api, { invalidateApiCache } from '../../../api/axios.js';

const POR_PAGINA = 6;
const CACHE_DURACION = 30 * 60 * 1000;
const CACHE_EMPRESAS = 'empresas_convenio_cache_v1';
const CANAL_SYNC_EMPRESAS = 'efsrt_empresas_asignadas_sync_v1';
const KEY_SNAPSHOT_EMPRESAS_REALTIME = 'efsrt_empresas_realtime_snapshot_v1';

const idEmpDe = (emp) => String(emp?.id_empresa ?? emp?.id ?? '');
const idEstDe = (est) =>
    String(
        est?.id_estudiante ??
            est?.estudiante_id ??
            est?.alumno_id ??
            est?.estudiante?.id_estudiante ??
            est?.estudiante?.id ??
            est?.id ??
            ''
    );

const leerCache = (clave) => {
    try {
        const guardado = sessionStorage.getItem(clave);
        if (!guardado) return null;
        const { data, fecha } = JSON.parse(guardado);
        return Date.now() - fecha < CACHE_DURACION ? data : null;
    } catch {
        return null;
    }
};

const guardarCache = (clave, data) => {
    try {
        sessionStorage.setItem(clave, JSON.stringify({ data, fecha: Date.now() }));
    } catch {
        // La aplicación continúa funcionando aunque el almacenamiento esté lleno o deshabilitado.
    }
};

/* ---------- Animaciones (keyframes propios, sin gradientes) ---------- */
const estilosAnimaciones = `
@keyframes em-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes em-row-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes em-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes em-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes em-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes em-progress { from { width: 100%; } to { width: 0%; } }
@keyframes em-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes em-spin { to { transform: rotate(360deg); } }
@keyframes em-pop { 0% { opacity: 0; transform: scale(.6); } 70% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
@keyframes em-pulse-dot { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,.5); } 100% { box-shadow: 0 0 0 7px rgba(245,158,11,0); } }
.em-fade-up { animation: em-fade-up .5s cubic-bezier(.22,1,.36,1) both; }
.em-row-in { animation: em-row-in .4s cubic-bezier(.22,1,.36,1) both; }
.em-toast-in { animation: em-toast-in .35s cubic-bezier(.22,1,.36,1) both; }
.em-fade { animation: em-fade .25s ease both; }
.em-slide { animation: em-slide .35s cubic-bezier(.22,1,.36,1) both; }
.em-progress { animation: em-progress 4s linear forwards; }
.em-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: em-draw 1.2s ease-out .3s forwards; }
.em-spin { animation: em-spin .8s linear infinite; }
.em-pop { animation: em-pop .4s cubic-bezier(.22,1,.36,1) both; }
.em-alerta { animation: em-pulse-dot 1.6s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
    .em-fade-up, .em-row-in, .em-toast-in, .em-fade, .em-slide, .em-progress, .em-spin, .em-pop, .em-alerta { animation: none !important; }
    .em-draw { animation: none !important; stroke-dashoffset: 0; }
}
`;

/* ---------- Iconos SVG ---------- */
const Icon = ({ children, className = 'w-4 h-4', stroke = 2 }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {children}
    </svg>
);
const IconSearch = () => (<Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>);
const IconPlus = () => (<Icon stroke={2.5}><path d="M12 5v14M5 12h14" /></Icon>);
const IconClose = () => (<Icon stroke={2.5}><path d="M18 6 6 18M6 6l12 12" /></Icon>);
const IconDownload = () => (<Icon><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></Icon>);
const IconBuilding = ({ className }) => (<Icon className={className || 'w-5 h-5'}><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" /></Icon>);
const IconUsers = () => (<Icon className="w-5 h-5"><path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75" /></Icon>);
const IconLink = () => (<Icon className="w-5 h-5"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></Icon>);
const IconWarn = () => (<Icon className="w-5 h-5"><path d="M12 3 2 20h20L12 3zM12 10v4M12 17v.01" /></Icon>);
const IconCheck = ({ className = 'w-5 h-5' }) => (<Icon className={className}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>);
const IconTick = ({ className = 'w-3.5 h-3.5' }) => (<Icon className={className} stroke={3}><path d="m5 12 5 5 9-10" /></Icon>);
const IconAlert = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></Icon>);
const IconPin = ({ className = 'w-3.5 h-3.5' }) => (<Icon className={className}><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></Icon>);
const IconPhone = ({ className = 'w-3.5 h-3.5' }) => (<Icon className={className}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Icon>);
const IconMail = ({ className = 'w-3.5 h-3.5' }) => (<Icon className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>);
const IconCopy = () => (<Icon className="w-3.5 h-3.5"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Icon>);
const IconUser = ({ className = 'w-3.5 h-3.5' }) => (<Icon className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>);
const IconShieldCheck = () => (<Icon className="w-4 h-4"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></Icon>);
const IconChevronL = () => (<Icon><path d="m15 18-6-6 6-6" /></Icon>);
const IconChevronR = ({ className }) => (<Icon className={className}><path d="m9 18 6-6-6-6" /></Icon>);
const IconSort = ({ activo, dir }) => (
    <svg className={`w-3 h-3 transition-all duration-200 ${activo ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'} ${activo && dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="m6 15 6-6 6 6" />
    </svg>
);

/* ---------- Helpers ---------- */
const coloresAvatar = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700',
];
const inicialesEmpresa = (nombre) => {
    const palabras = (nombre || '?').trim().split(/\s+/);
    return `${palabras[0]?.charAt(0) || '?'}${palabras[1]?.charAt(0) || ''}`.toUpperCase();
};
const colorAvatar = (id) => coloresAvatar[Number(id) % coloresAvatar.length] || coloresAvatar[0];
const inicialesPersona = (e) =>
    `${(e.nombres || e.nombre || '?').trim().charAt(0)}${(e.apellidos || '').trim().charAt(0)}`.toUpperCase();

const useContador = (objetivo, duracion = 800) => {
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

const useMontado = () => {
    const [m, setM] = useState(false);
    useEffect(() => { const id = setTimeout(() => setM(true), 60); return () => clearTimeout(id); }, []);
    return m;
};

const Sparkline = ({ datos, className = 'text-blue-500' }) => {
    const W = 84, H = 34;
    const serie = datos.length > 1 ? datos : [0, datos[0] || 0];
    const min = Math.min(...serie), max = Math.max(...serie);
    const rango = max - min || 1;
    const pts = serie.map((v, i) => [(i * W) / (serie.length - 1), H - 3 - ((v - min) / rango) * (H - 6)]);
    const linea = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className={`w-[84px] h-[34px] ${className}`} fill="none">
            <path d={`${linea} L${W},${H} L0,${H} Z`} fill="currentColor" opacity="0.08" />
            <path d={linea} pathLength="1" className="em-draw" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};
const reducirSerie = (serie, max = 14) => {
    if (serie.length <= max) return serie;
    const paso = (serie.length - 1) / (max - 1);
    return Array.from({ length: max }, (_, i) => serie[Math.round(i * paso)]);
};

const TarjetaResumen = ({ titulo, valor, sufijo = '', icono, color, spark, sparkColor, pie, retraso }) => {
    const animado = useContador(valor);
    return (
        <div
            className="em-fade-up group relative bg-white p-5 transition-colors duration-200 hover:bg-slate-50/70"
            style={{ animationDelay: `${retraso}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">{titulo}</p>
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums leading-none">
                        {Math.round(animado)}<span className="text-xl text-slate-400 font-bold">{sufijo}</span>
                    </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${color}`}>
                    {icono}
                </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3 text-[11px] text-slate-500">
                <div className="flex-1 min-w-0">{pie}</div>
                {spark && <Sparkline datos={spark} className={sparkColor} />}
            </div>
        </div>
    );
};

const DonaCobertura = ({ con, sin }) => {
    const total = con + sin;
    const progreso = useContador(1, 900);
    const pc = total ? (con / total) * 100 * progreso : 0;
    const ps = total ? (sin / total) * 100 * progreso : 0;
    return (
        <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#2563eb" strokeWidth="4"
                        strokeDasharray={`${pc} ${100 - pc}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#fbbf24" strokeWidth="4"
                        strokeDasharray={`${ps} ${100 - ps}`} strokeDashoffset={`-${pc}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{total ? Math.round((con / total) * 100) : 0}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cobertura</span>
                </div>
            </div>
            <div className="flex-1 space-y-3">
                {[
                    { label: 'Con estudiantes', n: con, dot: 'bg-blue-600' },
                    { label: 'Sin asignar', n: sin, dot: 'bg-amber-400' },
                ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                            <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                            {r.label}
                        </span>
                        <span className="font-bold text-slate-800 tabular-nums">{r.n}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarraTop = ({ pct, color }) => {
    const m = useMontado();
    return (
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: m ? `${pct}%` : '0%', transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
        </div>
    );
};

const claseInput =
    'w-full px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200';
const Campo = ({ label, requerido, extra, children }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {label} {requerido && <span className="text-rose-500">*</span>}
            </label>
            {extra}
        </div>
        {children}
    </div>
);

const Seccion = ({ n, titulo, detalle, hecha, ultima, children }) => (
    <section className="relative pl-12">
        {!ultima && <span className="absolute left-[15px] top-9 bottom-[-28px] w-px bg-slate-200" />}
        <span className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${hecha ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
            {hecha ? <span className="em-pop"><IconTick /></span> : n}
        </span>
        <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 leading-8">{titulo}</h3>
            {detalle && <p className="text-xs text-slate-500 -mt-1">{detalle}</p>}
        </div>
        {children}
    </section>
);

const PanelLateral = ({ titulo, subtitulo, onCerrar, pie, children, cabecera }) => (
    <div className="fixed inset-0 z-50 flex justify-end">
        <div className="em-fade absolute inset-0 bg-slate-900/40" onClick={onCerrar} />
        <aside className="em-slide relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full" role="dialog" aria-label={titulo}>
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
                {cabecera || (
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
                        {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
                    </div>
                )}
                <button
                    type="button"
                    onClick={onCerrar}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label="Cerrar panel"
                >
                    <IconClose />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {pie && <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">{pie}</div>}
        </aside>
    </div>
);

const ChipEstado = ({ valor, bueno, colorBueno }) => {
    if (!valor) return null;
    const ok = valor === bueno;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${ok ? colorBueno : 'bg-rose-50 text-rose-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-current' : 'bg-rose-500'}`} />
            {valor}
        </span>
    );
};

/* ---------- Estado inicial del formulario ---------- */
const formularioVacio = {
    ruc: '',
    razon_social: '',
    estado: '',
    condicion: '',
    tipo_contribuyente: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    supervisor_empresa_nombre: '',
    telefono: '',
    correo_electronico: '',
    direccion: ''
};

export default function Empresas() {
    const [empresas, setEmpresas] = useState([]);
    const [formData, setFormData] = useState(formularioVacio);
    const [buscandoRuc, setBuscandoRuc] = useState(false);
    const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' });

    const [cargando, setCargando] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [selId, setSelId] = useState(null);
    const [copiado, setCopiado] = useState(false);
    const [representanteEditandoId, setRepresentanteEditandoId] = useState(null);
    const [representanteForm, setRepresentanteForm] = useState({
        nombre: '',
        cargo: '',
        telefono: '',
        correo: '',
    });
    const [guardandoRepresentante, setGuardandoRepresentante] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todas');
    const [orden, setOrden] = useState({ campo: 'razon_social', dir: 'asc' });
    const [pagina, setPagina] = useState(1);
    const aplicarAsignacionesEnTiempoReal = useCallback((detalle, refrescarApi = false) => {
        if (!detalle || !Array.isArray(detalle.asignaciones)) return;

        const alcance =
            detalle.alcanceKey ||
            `${String(detalle.id_docente || 'none')}::${String(detalle.id_modulo || '1')}::${String(detalle.anio || '')}`;

        setEmpresas((prevEmpresas) => {
            const base = Array.isArray(prevEmpresas) ? prevEmpresas : [];

            const porEmpresaMap = new Map();
            detalle.asignaciones.forEach((asig) => {
                const empKey = String(asig?.id_empresa ?? '');
                if (!empKey) return;
                if (!porEmpresaMap.has(empKey)) porEmpresaMap.set(empKey, []);
                porEmpresaMap.get(empKey).push({
                    id_estudiante: asig.id_estudiante,
                    nombres: asig.nombres || '',
                    apellidos: asig.apellidos || '',
                    dni: asig.dni || '',
                    programa_estudios: asig.programa_estudios || '',
                    id_docente: asig.id_docente,
                    docente_responsable: asig.docente_responsable || detalle.docente_responsable || '',
                    id_modulo: asig.id_modulo,
                    numero_modulo: asig.numero_modulo,
                    nombre_modulo: asig.nombre_modulo || detalle.nombre_modulo || '',
                    fecha_inicio: asig.fecha_inicio || '',
                    anio: asig.anio || detalle.anio,
                    _alcanceKey: alcance,
                });
            });

            const actualizadas = base.map((emp) => {
                const empKey = idEmpDe(emp);
                const actuales = Array.isArray(emp.estudiantes) ? emp.estudiantes : [];

                // Conserva practicantes de otros alcances (otro docente/módulo/año) y reemplaza los del alcance actual
                const sinAlcanceActual = actuales.filter(
                    (est) => est?._alcanceKey !== alcance
                );
                const nuevosDeEstaEmpresa = porEmpresaMap.get(empKey) || [];

                const combinadosMap = new Map();
                sinAlcanceActual.forEach((est) => {
                    const idK = idEstDe(est);
                    if (idK) combinadosMap.set(idK, est);
                });
                nuevosDeEstaEmpresa.forEach((est) => {
                    const idK = idEstDe(est);
                    if (idK) {
                        combinadosMap.set(idK, {
                            ...(combinadosMap.get(idK) || {}),
                            ...est,
                        });
                    }
                });

                return {
                    ...emp,
                    estudiantes: Array.from(combinadosMap.values()),
                };
            });

            guardarCache(CACHE_EMPRESAS, actualizadas);
            return actualizadas;
        });

        if (refrescarApi) {
            cargarEmpresas(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const guardadas = leerCache(CACHE_EMPRESAS);
        if (Array.isArray(guardadas)) {
            setEmpresas(guardadas);
            setCargando(false);
        }
        cargarEmpresas(Boolean(guardadas));

        try {
            const snapRaw = sessionStorage.getItem(KEY_SNAPSHOT_EMPRESAS_REALTIME);
            if (snapRaw) {
                const snap = JSON.parse(snapRaw);
                if (snap && Array.isArray(snap.asignaciones)) {
                    aplicarAsignacionesEnTiempoReal(snap, false);
                }
            }
        } catch {
            /* ignorar */
        }
    }, [aplicarAsignacionesEnTiempoReal]);

    useEffect(() => {
        const onCustomEvent = (e) => {
            aplicarAsignacionesEnTiempoReal(e?.detail, Boolean(e?.detail?.confirmadoServidor));
        };

        window.addEventListener('empresas:asignacion-tiempo-real', onCustomEvent);
        window.addEventListener('expediente:actualizado', onCustomEvent);

        let bc = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                bc = new BroadcastChannel(CANAL_SYNC_EMPRESAS);
                bc.onmessage = (msg) => {
                    aplicarAsignacionesEnTiempoReal(msg?.data, Boolean(msg?.data?.confirmadoServidor));
                };
            }
        } catch {
            /* ignorar */
        }

        return () => {
            window.removeEventListener('empresas:asignacion-tiempo-real', onCustomEvent);
            window.removeEventListener('expediente:actualizado', onCustomEvent);
            if (bc) bc.close();
        };
    }, [aplicarAsignacionesEnTiempoReal]);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtro]);

    useEffect(() => {
        if (!mostrarForm && selId === null) return;
        const onKey = (e) => {
            if (e.key === 'Escape') { setMostrarForm(false); setSelId(null); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mostrarForm, selId]);

    const cargarEmpresas = async (hayCache = false) => {
        try {
            const res = await api.get('/empresas', {
                timeout: 12000
            });
            const datos = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setEmpresas(datos);
            guardarCache(CACHE_EMPRESAS, datos);
        } catch (error) {
            if (!hayCache) mostrarAlerta('Error al cargar la lista de empresas de convenio.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const mostrarAlerta = (mensaje, tipo) => {
        setAlerta({ mensaje, tipo });
        setTimeout(() => setAlerta({ mensaje: '', tipo: '' }), 4000);
    };

    const cambiarCampo = (campo) => (e) => setFormData(prev => ({ ...prev, [campo]: e.target.value }));

    const aplicarDatosRuc = (data) => {
        if (!data) return;
        const direccion = data.direccion || data.domicilio_fiscal || '';
        setFormData(prev => ({
            ...prev,
            razon_social: data.razon_social || data.nombre || prev.razon_social,
            estado: data.estado || '',
            condicion: data.condicion || '',
            tipo_contribuyente: data.tipo_contribuyente || data.tipo || '',
            departamento: data.departamento || '',
            provincia: data.provincia || '',
            distrito: data.distrito || '',
            ubigeo: data.ubigeo || data.ubigeo_sunat || '',
            direccion: direccion || prev.direccion,
            telefono: data.telefono || prev.telefono,
            correo_electronico: data.correo_electronico || data.email || prev.correo_electronico,
            supervisor_empresa_nombre: data.representante_legal || data.representante || prev.supervisor_empresa_nombre,
        }));
    };

    const buscarRucSunat = async () => {
        const ruc = formData.ruc.trim();
        if (!/^\d{11}$/.test(ruc)) {
            mostrarAlerta('El RUC debe tener exactamente 11 dígitos.', 'error');
            return;
        }

        const claveCache = `empresa_ruc_${ruc}`;
        const datosGuardados = leerCache(claveCache);
        if (datosGuardados) {
            aplicarDatosRuc(datosGuardados);
            mostrarAlerta('Datos cargados desde la consulta guardada.', 'success');
            return;
        }

        setBuscandoRuc(true);
        try {
            const res = await api.get(`/empresas/ruc/${ruc}`, {
                timeout: 12000
            });
            const data = res.data?.data || res.data;
            if (data) {
                guardarCache(claveCache, data);
                aplicarDatosRuc(data);
                const resumen = data.estado ? ` (${data.estado}${data.condicion ? ' / ' + data.condicion : ''})` : '';
                mostrarAlerta(`¡Datos obtenidos correctamente de SUNAT!${resumen}`, 'success');
            }
        } catch (error) {
            const mensajeError = error.response?.data?.error || (error.code === 'ECONNABORTED' ? 'La consulta está tardando demasiado. Inténtalo nuevamente.' : 'No se encontró información para el RUC ingresado.');
            mostrarAlerta(mensajeError, 'error');
        } finally {
            setBuscandoRuc(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/empresas', formData, {
                timeout: 12000
            });
            const creada = res?.data?.data || res?.data || null;
            sessionStorage.removeItem(CACHE_EMPRESAS);
            invalidateApiCache('/empresas');
            mostrarAlerta('Empresa de convenio registrada exitosamente.', 'success');
            setFormData(formularioVacio);
            setMostrarForm(false);
            await cargarEmpresas(false);
            window.dispatchEvent(new CustomEvent('empresas:actualizada', { detail: { empresa: creada } }));
        } catch (error) {
            const errores = error.response?.data?.errors;
            const primerError = errores ? Object.values(errores).flat()[0] : null;
            mostrarAlerta(
                primerError || error.response?.data?.message || 'No se pudo registrar la empresa.',
                'error'
            );
        }
    };

    const lista = Array.isArray(empresas) ? empresas : [];
    const nEst = (emp) => (emp.estudiantes ? emp.estudiantes.length : 0);

    const totalEmpresas = lista.length;
    const totalPracticantes = lista.reduce((acc, emp) => acc + nEst(emp), 0);
    const conEstudiantes = lista.filter(emp => nEst(emp) > 0).length;
    const sinEstudiantes = totalEmpresas - conEstudiantes;
    const cobertura = totalEmpresas ? Math.round((conEstudiantes / totalEmpresas) * 100) : 0;

    const series = useMemo(() => {
        const porId = [...lista].sort((a, b) => Number(a.id_empresa) - Number(b.id_empresa));
        let t = 0, p = 0;
        const sT = [], sP = [];
        porId.forEach(emp => {
            t += 1; p += emp.estudiantes ? emp.estudiantes.length : 0;
            sT.push(t); sP.push(p);
        });
        const top = [...lista]
            .map(emp => ({ id: emp.id_empresa, nombre: emp.razon_social, n: emp.estudiantes ? emp.estudiantes.length : 0 }))
            .filter(x => x.n > 0)
            .sort((a, b) => b.n - a.n)
            .slice(0, 4);
        return { sT: reducirSerie(sT), sP: reducirSerie(sP), top };
    }, [empresas]);
    const maxTop = series.top[0]?.n || 1;
    const pendientes = lista.filter(emp => nEst(emp) === 0).slice(0, 4);

    const cambiarOrden = (campo) =>
        setOrden(prev => ({ campo, dir: prev.campo === campo && prev.dir === 'asc' ? 'desc' : 'asc' }));

    const filtradas = useMemo(() => {
        const texto = busqueda.toLowerCase();
        const res = lista.filter(emp => {
            const coincideTexto =
                (emp.razon_social || '').toLowerCase().includes(texto) ||
                String(emp.ruc || '').includes(texto) ||
                (emp.supervisor_empresa_nombre || '').toLowerCase().includes(texto);
            const n = emp.estudiantes ? emp.estudiantes.length : 0;
            const coincideFiltro =
                filtro === 'todas' || (filtro === 'con' && n > 0) || (filtro === 'sin' && n === 0);
            return coincideTexto && coincideFiltro;
        });
        return res.sort((a, b) => {
            if (orden.campo === 'estudiantes') {
                const r = (a.estudiantes?.length || 0) - (b.estudiantes?.length || 0);
                return orden.dir === 'asc' ? r : -r;
            }
            const r = (a.razon_social || '').toLowerCase().localeCompare((b.razon_social || '').toLowerCase());
            return orden.dir === 'asc' ? r : -r;
        });
    }, [empresas, busqueda, filtro, orden]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * POR_PAGINA;
    const pagina_ = filtradas.slice(inicio, inicio + POR_PAGINA);

    const exportarCSV = () => {
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const filas = [
            ['RUC', 'Razón social', 'Estado', 'Condición', 'Departamento', 'Provincia', 'Distrito', 'Ubigeo', 'Supervisor / Representante', 'Teléfono', 'Correo', 'Dirección', 'Practicantes'],
            ...filtradas.map(e => [e.ruc, e.razon_social, e.estado, e.condicion, e.departamento, e.provincia, e.distrito, e.ubigeo, e.supervisor_empresa_nombre, e.telefono, e.correo_electronico, e.direccion, nEst(e)]),
        ];
        const csv = '\ufeff' + filas.map(f => f.map(esc).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url; a.download = 'empresas_convenio.csv'; a.click();
        URL.revokeObjectURL(url);
        mostrarAlerta('Lista exportada correctamente.', 'success');
    };

    const abrirForm = () => { setSelId(null); setMostrarForm(true); };
    const abrirFicha = (id) => {
        setMostrarForm(false);
        setSelId(id);
        setCopiado(false);
        setRepresentanteEditandoId(null);
        setRepresentanteForm({ nombre: '', cargo: '', telefono: '', correo: '' });
    };
    const copiarRuc = (ruc) => {
        try { navigator.clipboard?.writeText(String(ruc)); } catch (e) { /* sin permiso de portapapeles */ }
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1600);
    };

    const tabs = [
        { id: 'todas', label: 'Todas', cant: totalEmpresas },
        { id: 'con', label: 'Con estudiantes', cant: conEstudiantes },
        { id: 'sin', label: 'Sin asignar', cant: sinEstudiantes },
    ];
    const idxTab = Math.max(0, tabs.findIndex(t => t.id === filtro));

    const estilosAlerta = {
        success: { caja: 'bg-white text-slate-800 border-slate-200', icono: 'text-emerald-500', barra: 'bg-emerald-400', Ico: IconCheck },
        error: { caja: 'bg-white text-slate-800 border-slate-200', icono: 'text-rose-500', barra: 'bg-rose-400', Ico: IconAlert },
    };
    const ea = estilosAlerta[alerta.tipo] || estilosAlerta.error;
    const rucCompleto = formData.ruc.length === 11;
    const selEmp = selId !== null ? lista.find(e => e.id_empresa === selId) : null;

    const actualizarRepresentantesEmpresa = (representantes) => {
        const actualizadas = lista.map((empresa) =>
            empresa.id_empresa === selId ? { ...empresa, representantes } : empresa
        );
        setEmpresas(actualizadas);
        guardarCache(CACHE_EMPRESAS, actualizadas);
        invalidateApiCache('/empresas');
        const empresaActualizada = actualizadas.find((empresa) => empresa.id_empresa === selId);
        window.dispatchEvent(new CustomEvent('empresas:actualizada', {
            detail: { empresa: empresaActualizada },
        }));
    };

    const guardarRepresentante = async (e) => {
        e.preventDefault();
        if (!selEmp) return;
        setGuardandoRepresentante(true);
        try {
            const ruta = `/empresas/${selEmp.id_empresa}/representantes`;
            const respuesta = representanteEditandoId
                ? await api.put(`${ruta}/${representanteEditandoId}`, representanteForm)
                : await api.post(ruta, representanteForm);
            const contacto = respuesta.data?.data;
            const existentes = selEmp.representantes || [];
            const representantes = representanteEditandoId
                ? existentes.map((item) =>
                    String(item.id_representante_empresa) === String(representanteEditandoId)
                        ? contacto
                        : item
                )
                : [...existentes, contacto].sort((a, b) => a.nombre.localeCompare(b.nombre));
            actualizarRepresentantesEmpresa(representantes);
            setRepresentanteForm({ nombre: '', cargo: '', telefono: '', correo: '' });
            setRepresentanteEditandoId(null);
            mostrarAlerta('Contacto de empresa guardado.', 'success');
        } catch (error) {
            const errores = error.response?.data?.errors;
            const primerError = errores ? Object.values(errores).flat()[0] : null;
            mostrarAlerta(
                primerError || error.response?.data?.message || 'No se pudo guardar el contacto.',
                'error'
            );
        } finally {
            setGuardandoRepresentante(false);
        }
    };

    const eliminarRepresentante = async (representante) => {
        if (!selEmp) return;
        if (!window.confirm(`¿Eliminar a ${representante.nombre} de los contactos de esta empresa?`)) return;
        try {
            await api.delete(
                `/empresas/${selEmp.id_empresa}/representantes/${representante.id_representante_empresa}`
            );
            actualizarRepresentantesEmpresa(
                (selEmp.representantes || []).filter(
                    (item) => item.id_representante_empresa !== representante.id_representante_empresa
                )
            );
            mostrarAlerta('Contacto eliminado.', 'success');
        } catch (error) {
            mostrarAlerta(
                error.response?.data?.message || 'No se pudo eliminar el contacto.',
                'error'
            );
        }
    };

    const paso1 = rucCompleto && !!formData.razon_social;
    const paso2 = !!(formData.direccion || formData.distrito || formData.departamento);
    const paso3 = !!(formData.supervisor_empresa_nombre || formData.telefono || formData.correo_electronico);

    return (
        <div className="w-full p-5 md:p-6 space-y-6">
            <style>{estilosAnimaciones}</style>

            {alerta.mensaje && (
                <div className={`em-toast-in fixed top-5 right-5 z-[70] w-[calc(100%-2.5rem)] max-w-sm relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium border shadow-xl ${ea.caja}`} role="status">
                    <span className={ea.icono}><ea.Ico /></span>
                    <span className="flex-1">{alerta.mensaje}</span>
                    <button
                        onClick={() => setAlerta({ mensaje: '', tipo: '' })}
                        className="text-slate-400 hover:text-slate-700 transition-colors text-lg leading-none px-1"
                        aria-label="Cerrar alerta"
                    >
                        ×
                    </button>
                    <span className={`em-progress absolute bottom-0 left-0 h-1 ${ea.barra}`} />
                </div>
            )}

            <div className="em-fade-up flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <p className="text-xs text-slate-400">
                        Gestión académica <span className="mx-1">/</span> <span className="font-medium text-slate-600">Empresas asignadas</span>
                    </p>
                    <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900">Empresas asignadas</h1>
                    <p className="mt-1 text-sm text-slate-500">Empresas con practicantes y docentes encargados sincronizados en tiempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportarCSV}
                        disabled={filtradas.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconDownload />
                        Exportar
                    </button>
                    <button
                        onClick={abrirForm}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
                    >
                        <span className="transition-transform duration-300 group-hover:rotate-90"><IconPlus /></span>
                        Nueva empresa
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm">
                <TarjetaResumen
                    titulo="Empresas aliadas" valor={totalEmpresas}
                    icono={<IconBuilding />} color="bg-blue-50 text-blue-600"
                    spark={series.sT} sparkColor="text-blue-500"
                    pie="Convenios registrados" retraso={60}
                />
                <TarjetaResumen
                    titulo="Alumnos en prácticas" valor={totalPracticantes}
                    icono={<IconUsers />} color="bg-violet-50 text-violet-600"
                    spark={series.sP} sparkColor="text-violet-500"
                    pie={`${totalEmpresas ? (totalPracticantes / totalEmpresas).toFixed(1) : 0} por empresa en promedio`} retraso={120}
                />
                <TarjetaResumen
                    titulo="Cobertura de asignación" valor={cobertura} sufijo="%"
                    icono={<IconLink />} color="bg-emerald-50 text-emerald-600"
                    pie={
                        <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${cobertura}%` }} />
                            </div>
                            <span>{conEstudiantes} de {totalEmpresas} con practicantes</span>
                        </div>
                    }
                    retraso={180}
                />
                <TarjetaResumen
                    titulo="Sin estudiantes" valor={sinEstudiantes}
                    icono={<IconWarn />} color="bg-amber-50 text-amber-600"
                    pie={sinEstudiantes > 0 ? 'Requieren asignación' : 'Todo asignado'} retraso={240}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                <div className="em-fade-up bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ animationDelay: '300ms' }}>
                    <div className="px-6 py-5 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">Empresas asignadas</h2>
                        <p className="text-xs text-slate-500">Haz clic en una fila para ver su ficha completa y practicantes asignados.</p>
                    </div>

                    <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60">
                        <div className="relative inline-grid grid-cols-3 p-1 bg-slate-100 rounded-xl self-start">
                            <span
                                className="absolute top-1 bottom-1 left-1 rounded-lg bg-blue-600 shadow-sm transition-transform duration-300 ease-out"
                                style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(${idxTab * 100}%)` }}
                            />
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setFiltro(t.id)}
                                    className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap ${
                                        filtro === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {t.label}
                                    <span className={`px-1.5 rounded-md text-[10px] tabular-nums transition-colors ${filtro === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{t.cant}</span>
                                </button>
                            ))}
                        </div>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"><IconSearch /></span>
                            <input
                                type="text"
                                placeholder="Buscar empresa, RUC o representante..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full md:w-72 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[820px]">
                            <thead>
                                <tr className="bg-slate-50 text-[11px] uppercase font-semibold tracking-wider text-slate-500 border-b border-slate-200">
                                    <th className="py-3.5 px-6 text-left">
                                        <button onClick={() => cambiarOrden('razon_social')} className="group inline-flex items-center gap-1.5 uppercase tracking-wider font-semibold hover:text-slate-800 transition-colors">
                                            Empresa <IconSort activo={orden.campo === 'razon_social'} dir={orden.dir} />
                                        </button>
                                    </th>
                                    <th className="py-3.5 px-4 text-left">Contacto</th>
                                    <th className="py-3.5 px-4 text-left">Ubicación</th>
                                    <th className="py-3.5 px-4 text-left">
                                        <button onClick={() => cambiarOrden('estudiantes')} className="group inline-flex items-center gap-1.5 uppercase tracking-wider font-semibold hover:text-slate-800 transition-colors">
                                            Practicantes <IconSort activo={orden.campo === 'estudiantes'} dir={orden.dir} />
                                        </button>
                                    </th>
                                    <th className="py-3.5 px-4 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {cargando ? (
                                    [...Array(4)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="bg-slate-200 w-10 h-10 rounded-xl" /><div className="space-y-2"><div className="bg-slate-200 h-3.5 w-40 rounded" /><div className="bg-slate-100 h-2.5 w-24 rounded" /></div></div></td>
                                            <td className="py-4 px-4"><div className="space-y-2"><div className="bg-slate-200 h-3.5 w-32 rounded" /><div className="bg-slate-100 h-2.5 w-24 rounded" /></div></td>
                                            <td className="py-4 px-4"><div className="bg-slate-200 h-3.5 w-36 rounded" /></td>
                                            <td className="py-4 px-4"><div className="bg-slate-200 h-6 w-28 rounded-full" /></td>
                                            <td />
                                        </tr>
                                    ))
                                ) : pagina_.length > 0 ? (
                                    pagina_.map((emp, i) => {
                                        const est = emp.estudiantes || [];
                                        const zona = [emp.distrito, emp.provincia].filter(Boolean).join(', ');
                                        return (
                                            <tr
                                                key={emp.id_empresa}
                                                onClick={() => abrirFicha(emp.id_empresa)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') abrirFicha(emp.id_empresa); }}
                                                tabIndex={0}
                                                className={`em-row-in group/fila cursor-pointer outline-none transition-colors duration-200 hover:bg-slate-50 focus-visible:bg-slate-50 ${selId === emp.id_empresa ? 'bg-slate-50' : ''}`}
                                                style={{ animationDelay: `${i * 45}ms` }}
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold transition-transform duration-200 group-hover/fila:scale-105 ${colorAvatar(emp.id_empresa)}`}>
                                                            {inicialesEmpresa(emp.razon_social)}
                                                        </div>
                                                        <div className="space-y-1 min-w-0">
                                                            <p className="font-semibold text-slate-900 leading-tight line-clamp-1">{emp.razon_social}</p>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold rounded">RUC {emp.ruc}</span>
                                                                <ChipEstado valor={emp.estado} bueno="ACTIVO" colorBueno="bg-emerald-50 text-emerald-700" />
                                                                <ChipEstado valor={emp.condicion} bueno="HABIDO" colorBueno="bg-sky-50 text-sky-700" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="space-y-1">
                                                        <p className="text-slate-800 font-medium text-[13px] line-clamp-1">{emp.supervisor_empresa_nombre || 'No asignado'}</p>
                                                        <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <IconPhone />
                                                            <span className="truncate max-w-[150px]">{emp.telefono || emp.correo_electronico || 'Sin contacto'}</span>
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="flex items-start gap-1.5 text-xs text-slate-600 max-w-[190px]">
                                                        <span className="mt-0.5 text-slate-400 shrink-0"><IconPin /></span>
                                                        <span className="min-w-0">
                                                            <span className="block font-medium">{zona || 'Sin ubicación'}</span>
                                                            {emp.departamento && <span className="block text-[11px] text-slate-400">{emp.departamento}</span>}
                                                        </span>
                                                    </p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {est.length > 0 ? (
                                                        <div className="flex items-center gap-2.5" title={est.map(e => `${e.nombres || e.nombre || ''} ${e.apellidos || ''}`.trim()).join(', ')}>
                                                            <div className="flex -space-x-2">
                                                                {est.slice(0, 3).map((e, idx) => (
                                                                    <span key={idx} className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-white">{inicialesPersona(e)}</span>
                                                                ))}
                                                                {est.length > 3 && <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold ring-2 ring-white">+{est.length - 3}</span>}
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{est.length} {est.length === 1 ? 'practicante' : 'practicantes'}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">
                                                            <span className="em-alerta w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            Sin asignar
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-slate-300 group-hover/fila:text-blue-600 transition-colors">
                                                    <IconChevronR className="w-4 h-4 transition-transform duration-200 group-hover/fila:translate-x-0.5" />
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-16">
                                            <div className="em-fade-up flex flex-col items-center text-center space-y-1">
                                                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                                                    <IconBuilding className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700">No hay empresas para mostrar</p>
                                                <p className="text-xs text-slate-400">No hay empresas de convenio registradas todavía o la búsqueda no coincide.</p>
                                                <button onClick={abrirForm} className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                                                    <IconPlus /> Registrar empresa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <span>
                            Mostrando{' '}
                            <strong className="text-slate-700">{filtradas.length === 0 ? 0 : inicio + 1}–{Math.min(inicio + POR_PAGINA, filtradas.length)}</strong>{' '}
                            de <strong className="text-slate-700">{filtradas.length}</strong> empresas
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPagina(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                                aria-label="Página anterior"
                            ><IconChevronL /></button>
                            {[...Array(totalPaginas)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPagina(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        paginaActual === i + 1 ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 scale-105' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >{i + 1}</button>
                            ))}
                            <button
                                onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
                                disabled={paginaActual === totalPaginas}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                                aria-label="Página siguiente"
                            ><IconChevronR /></button>
                        </div>
                    </div>
                </div>

                <aside className="em-fade-up bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100" style={{ animationDelay: '360ms' }}>
                    <section className="p-6 space-y-5">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900">Cobertura de convenios</h3>
                            <p className="text-xs text-slate-500">Empresas con y sin practicantes.</p>
                        </div>
                        <DonaCobertura con={conEstudiantes} sin={sinEstudiantes} />
                    </section>

                    <section className="p-6 space-y-5">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900">Top empresas</h3>
                            <p className="text-xs text-slate-500">Mayor número de practicantes.</p>
                        </div>
                        <div className="space-y-4">
                            {series.top.map((t, i) => (
                                <div key={t.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs gap-3">
                                        <span className="flex items-center gap-2 font-medium text-slate-600 truncate">
                                            <span className="w-5 h-5 shrink-0 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                            <span className="truncate">{t.nombre}</span>
                                        </span>
                                        <span className="font-bold text-slate-800 tabular-nums">{t.n}</span>
                                    </div>
                                    <BarraTop pct={(t.n / maxTop) * 100} color={['bg-blue-600', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500'][i]} />
                                </div>
                            ))}
                            {series.top.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Aún no hay practicantes asignados.</p>
                            )}
                        </div>
                    </section>

                    <section className="p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900">Pendientes de asignar</h3>
                            <p className="text-xs text-slate-500">Empresas que aún no tienen practicantes.</p>
                        </div>
                        {pendientes.length === 0 ? (
                            <p className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-3 font-medium">
                                <IconCheck className="w-4 h-4" /> Todas las empresas tienen practicantes.
                            </p>
                        ) : (
                            <ul className="-mx-2 space-y-0.5">
                                {pendientes.map((emp) => (
                                    <li key={emp.id_empresa}>
                                        <button
                                            onClick={() => abrirFicha(emp.id_empresa)}
                                            className="group w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold ${colorAvatar(emp.id_empresa)}`}>{inicialesEmpresa(emp.razon_social)}</span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-xs font-semibold text-slate-800 truncate">{emp.razon_social}</span>
                                                <span className="block text-[10px] text-slate-400 font-mono">RUC {emp.ruc}</span>
                                            </span>
                                            <span className="text-slate-300 group-hover:text-blue-600 transition-colors"><IconChevronR className="w-4 h-4" /></span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>

            {selEmp && (
                <PanelLateral
                    onCerrar={() => setSelId(null)}
                    titulo="Ficha de empresa"
                    cabecera={
                        <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-base font-bold ${colorAvatar(selEmp.id_empresa)}`}>{inicialesEmpresa(selEmp.razon_social)}</div>
                            <div className="min-w-0 space-y-1.5">
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">{selEmp.razon_social}</h2>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        onClick={() => copiarRuc(selEmp.ruc)}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-mono font-semibold rounded transition-colors"
                                        title="Copiar RUC"
                                    >
                                        RUC {selEmp.ruc} {copiado ? <span className="text-emerald-600 font-sans">¡Copiado!</span> : <IconCopy />}
                                    </button>
                                    <ChipEstado valor={selEmp.estado} bueno="ACTIVO" colorBueno="bg-emerald-50 text-emerald-700" />
                                    <ChipEstado valor={selEmp.condicion} bueno="HABIDO" colorBueno="bg-sky-50 text-sky-700" />
                                </div>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-7">
                        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                            {[
                                ['Practicantes', nEst(selEmp)],
                                ['Estado', selEmp.estado || '—'],
                                ['Condición', selEmp.condicion || '—'],
                            ].map(([k, v], i) => (
                                <div key={k} className="em-fade-up bg-white p-3.5" style={{ animationDelay: `${i * 60}ms` }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
                                    <p className="mt-1 text-lg font-extrabold text-slate-900 truncate">{v}</p>
                                </div>
                            ))}
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contacto</h3>
                            <div className="divide-y divide-slate-100">
                                {[
                                    [IconUser, 'Representante', selEmp.supervisor_empresa_nombre, null],
                                    [IconPhone, 'Teléfono', selEmp.telefono, selEmp.telefono ? `tel:${selEmp.telefono}` : null],
                                    [IconMail, 'Correo', selEmp.correo_electronico, selEmp.correo_electronico ? `mailto:${selEmp.correo_electronico}` : null],
                                ].map(([Ic, k, v, href]) => (
                                    <div key={k} className="flex items-center gap-3 py-3">
                                        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Ic className="w-4 h-4" /></span>
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-slate-400">{k}</p>
                                            {v ? (href ? <a href={href} className="text-sm font-medium text-blue-700 hover:underline break-all">{v}</a> : <p className="text-sm font-medium text-slate-800">{v}</p>) : <p className="text-sm text-slate-400">No registrado</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4 border-t border-slate-100 pt-6">
                            <div>
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contactos para expedientes</h3>
                                <p className="mt-1 text-xs text-slate-500">Elige uno de estos contactos al asignar la empresa a cada estudiante.</p>
                            </div>
                            <div className="space-y-2">
                                {(selEmp.representantes || []).map((representante) => (
                                    <div key={representante.id_representante_empresa} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">{representante.nombre}</p>
                                            <p className="text-xs text-slate-500">{representante.cargo || 'Sin cargo registrado'}</p>
                                            <p className="mt-1 break-all text-xs text-slate-500">
                                                {[representante.telefono, representante.correo].filter(Boolean).join(' · ') || 'Sin teléfono ni correo'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRepresentanteEditandoId(representante.id_representante_empresa);
                                                    setRepresentanteForm({
                                                        nombre: representante.nombre || '',
                                                        cargo: representante.cargo || '',
                                                        telefono: representante.telefono || '',
                                                        correo: representante.correo || '',
                                                    });
                                                }}
                                                className="text-xs font-semibold text-blue-700 hover:underline"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => eliminarRepresentante(representante)}
                                                className="text-xs font-semibold text-rose-600 hover:underline"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(selEmp.representantes || []).length === 0 && (
                                    <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">Aún no hay contactos registrados para los expedientes.</p>
                                )}
                            </div>
                            <form onSubmit={guardarRepresentante} className="space-y-3 rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold text-slate-700">
                                    {representanteEditandoId ? 'Editar contacto' : 'Agregar contacto'}
                                </p>
                                <input
                                    value={representanteForm.nombre}
                                    onChange={(e) => setRepresentanteForm((prev) => ({ ...prev, nombre: e.target.value }))}
                                    placeholder="Nombre completo"
                                    aria-label="Nombre del contacto"
                                    required
                                    maxLength={150}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                                <input
                                    value={representanteForm.cargo}
                                    onChange={(e) => setRepresentanteForm((prev) => ({ ...prev, cargo: e.target.value }))}
                                    placeholder="Cargo"
                                    aria-label="Cargo del contacto"
                                    maxLength={100}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <input
                                        value={representanteForm.telefono}
                                        onChange={(e) => setRepresentanteForm((prev) => ({ ...prev, telefono: e.target.value }))}
                                        placeholder="Teléfono"
                                        aria-label="Teléfono del contacto"
                                        maxLength={50}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="email"
                                        value={representanteForm.correo}
                                        onChange={(e) => setRepresentanteForm((prev) => ({ ...prev, correo: e.target.value }))}
                                        placeholder="Correo"
                                        aria-label="Correo del contacto"
                                        maxLength={150}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    {representanteEditandoId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRepresentanteEditandoId(null);
                                                setRepresentanteForm({ nombre: '', cargo: '', telefono: '', correo: '' });
                                            }}
                                            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={guardandoRepresentante}
                                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {guardandoRepresentante ? 'Guardando…' : representanteEditandoId ? 'Guardar cambios' : 'Agregar contacto'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="space-y-3 border-t border-slate-100 pt-6">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ubicación</h3>
                            <div className="flex gap-3">
                                <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><IconPin className="w-4 h-4" /></span>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-800">{selEmp.direccion || 'Sin dirección registrada'}</p>
                                    <p className="text-xs text-slate-500">
                                        {[selEmp.distrito, selEmp.provincia, selEmp.departamento].filter(Boolean).join(' / ') || 'Sin zona'}
                                        {selEmp.ubigeo ? ` · Ubigeo ${selEmp.ubigeo}` : ''}
                                    </p>
                                    {selEmp.tipo_contribuyente && <p className="text-xs text-slate-400">{selEmp.tipo_contribuyente}</p>}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3 border-t border-slate-100 pt-6">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Practicantes asignados</h3>
                            {nEst(selEmp) === 0 ? (
                                <p className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3 font-medium">
                                    <span className="em-alerta w-1.5 h-1.5 rounded-full bg-amber-500" /> Esta empresa aún no tiene estudiantes asignados.
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {selEmp.estudiantes.map((e, idx) => (
                                        <li key={idx} className="em-row-in flex items-center justify-between gap-3 py-2.5" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-8 h-8 shrink-0 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">{inicialesPersona(e)}</span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{`${e.nombres || e.nombre || ''} ${e.apellidos || ''}`.trim()}</p>
                                                    {(e.nombre_modulo || e.docente_responsable) && (
                                                        <p className="text-[11px] text-slate-400 truncate">
                                                            {[e.nombre_modulo, e.docente_responsable ? `Asesor: ${e.docente_responsable}` : ''].filter(Boolean).join(' · ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </PanelLateral>
            )}

            {mostrarForm && (
                <PanelLateral
                    onCerrar={() => setMostrarForm(false)}
                    titulo="Registrar empresa aliada"
                    subtitulo="Empieza por el RUC: SUNAT completa los datos por ti."
                    pie={
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] text-slate-400"><span className="text-rose-500">*</span> Campos obligatorios</p>
                            <button
                                type="submit"
                                form="form-empresa"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200"
                            >
                                <IconCheck />
                                Guardar empresa
                            </button>
                        </div>
                    }
                >
                    <form id="form-empresa" onSubmit={handleSubmit} className="space-y-9">
                        <Seccion n="1" titulo="Consulta SUNAT" detalle="Ingresa los 11 dígitos del RUC y pulsa Buscar." hecha={paso1}>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                <Campo
                                    label="RUC" requerido
                                    extra={<span className={`text-[10px] font-bold tabular-nums ${rucCompleto ? 'text-emerald-600' : 'text-slate-400'}`}>{formData.ruc.length}/11</span>}
                                >
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            maxLength="11"
                                            value={formData.ruc}
                                            onChange={cambiarCampo('ruc')}
                                            placeholder="Ej. 20100047218"
                                            className={`${claseInput} font-mono tracking-widest`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={buscarRucSunat}
                                            disabled={buscandoRuc}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {buscandoRuc ? (
                                                <>
                                                    <svg className="em-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                                                    Buscando
                                                </>
                                            ) : (
                                                <><IconSearch /> Buscar</>
                                            )}
                                        </button>
                                    </div>
                                </Campo>
                                <div className="flex gap-1" aria-hidden="true">
                                    {[...Array(11)].map((_, i) => (
                                        <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${i < formData.ruc.length ? (rucCompleto ? 'bg-emerald-500' : 'bg-blue-600') : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                                {formData.estado && (
                                    <div className="em-pop flex flex-wrap items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs">
                                        <span className="inline-flex items-center gap-1.5 font-bold text-blue-600"><IconShieldCheck /> Verificado en SUNAT</span>
                                        <ChipEstado valor={formData.estado} bueno="ACTIVO" colorBueno="bg-emerald-50 text-emerald-700" />
                                        <ChipEstado valor={formData.condicion} bueno="HABIDO" colorBueno="bg-sky-50 text-sky-700" />
                                    </div>
                                )}
                            </div>
                        </Seccion>

                        <Seccion n="2" titulo="Datos de la empresa" detalle="Se completan solos, puedes corregirlos." hecha={!!formData.razon_social && !!formData.estado}>
                            <div className="space-y-4">
                                <Campo label="Razón social" requerido>
                                    <input
                                        type="text"
                                        value={formData.razon_social}
                                        onChange={cambiarCampo('razon_social')}
                                        placeholder="Se completa automáticamente o ingrese manual"
                                        className={claseInput}
                                        required
                                    />
                                </Campo>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Campo label="Estado">
                                        <input
                                            type="text"
                                            value={formData.estado}
                                            onChange={cambiarCampo('estado')}
                                            placeholder="Ej. ACTIVO"
                                            className={`${claseInput} ${formData.estado === 'ACTIVO' ? 'text-emerald-700 font-semibold' : formData.estado ? 'text-rose-700 font-semibold' : ''}`}
                                        />
                                    </Campo>
                                    <Campo label="Condición">
                                        <input
                                            type="text"
                                            value={formData.condicion}
                                            onChange={cambiarCampo('condicion')}
                                            placeholder="Ej. HABIDO"
                                            className={`${claseInput} ${formData.condicion === 'HABIDO' ? 'text-sky-700 font-semibold' : formData.condicion ? 'text-rose-700 font-semibold' : ''}`}
                                        />
                                    </Campo>
                                    <Campo label="Tipo">
                                        <input
                                            type="text"
                                            value={formData.tipo_contribuyente}
                                            onChange={cambiarCampo('tipo_contribuyente')}
                                            placeholder="Ej. S.A.C."
                                            className={claseInput}
                                        />
                                    </Campo>
                                </div>
                            </div>
                        </Seccion>

                        <Seccion n="3" titulo="Ubicación" detalle="Domicilio fiscal registrado en SUNAT." hecha={paso2}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Campo label="Departamento">
                                        <input type="text" value={formData.departamento} onChange={cambiarCampo('departamento')} placeholder="Ej. LIMA" className={claseInput} />
                                    </Campo>
                                    <Campo label="Provincia">
                                        <input type="text" value={formData.provincia} onChange={cambiarCampo('provincia')} placeholder="Ej. LIMA" className={claseInput} />
                                    </Campo>
                                    <Campo label="Distrito">
                                        <input type="text" value={formData.distrito} onChange={cambiarCampo('distrito')} placeholder="Ej. MIRAFLORES" className={claseInput} />
                                    </Campo>
                                    <Campo label="Ubigeo">
                                        <input type="text" maxLength="6" value={formData.ubigeo} onChange={cambiarCampo('ubigeo')} placeholder="Ej. 150122" className={`${claseInput} font-mono`} />
                                    </Campo>
                                </div>
                                <Campo label="Dirección fiscal">
                                    <input type="text" value={formData.direccion} onChange={cambiarCampo('direccion')} placeholder="Dirección completa de la empresa" className={claseInput} />
                                </Campo>
                            </div>
                        </Seccion>

                        <Seccion n="4" titulo="Contacto" detalle="Persona responsable de las prácticas." hecha={paso3} ultima>
                            <div className="space-y-4">
                                <Campo label="Supervisor / Representante">
                                    <input type="text" value={formData.supervisor_empresa_nombre} onChange={cambiarCampo('supervisor_empresa_nombre')} placeholder="Nombre del responsable" className={claseInput} />
                                </Campo>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Campo label="Teléfono">
                                        <input type="text" value={formData.telefono} onChange={cambiarCampo('telefono')} placeholder="Celular o contacto" className={claseInput} />
                                    </Campo>
                                    <Campo label="Correo electrónico">
                                        <input type="email" value={formData.correo_electronico} onChange={cambiarCampo('correo_electronico')} placeholder="correo@empresa.com" className={claseInput} />
                                    </Campo>
                                </div>
                            </div>
                        </Seccion>
                    </form>
                </PanelLateral>
            )}
        </div>
    );
}