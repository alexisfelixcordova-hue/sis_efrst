import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const POR_PAGINA = 5;

/* ---------- Animaciones (keyframes propios) ---------- */
const estilosAnimaciones = `
@keyframes em-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes em-row-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes em-alert-in { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes em-pop { from { opacity: 0; transform: scale(.96) translateY(-6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes em-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes em-progress { from { width: 100%; } to { width: 0%; } }
@keyframes em-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes em-spin { to { transform: rotate(360deg); } }
.em-fade-up { animation: em-fade-up .5s cubic-bezier(.22,1,.36,1) both; }
.em-row-in { animation: em-row-in .4s cubic-bezier(.22,1,.36,1) both; }
.em-alert-in { animation: em-alert-in .35s cubic-bezier(.22,1,.36,1) both; }
.em-pop { animation: em-pop .4s cubic-bezier(.22,1,.36,1) both; }
.em-skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
    background-size: 800px 100%;
    animation: em-shimmer 1.4s linear infinite;
}
.em-progress { animation: em-progress 4s linear forwards; }
.em-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: em-draw 1.2s ease-out .3s forwards; }
.em-spin { animation: em-spin .8s linear infinite; }
@media (prefers-reduced-motion: reduce) {
    .em-fade-up, .em-row-in, .em-alert-in, .em-pop, .em-skeleton, .em-progress, .em-spin { animation: none !important; }
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
const IconCheck = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>);
const IconAlert = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></Icon>);
const IconPin = () => (<Icon className="w-3.5 h-3.5"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></Icon>);
const IconPhone = () => (<Icon className="w-3.5 h-3.5"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Icon>);
const IconShieldCheck = () => (<Icon className="w-4 h-4"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></Icon>);
const IconChevronL = () => (<Icon><path d="m15 18-6-6 6-6" /></Icon>);
const IconChevronR = () => (<Icon><path d="m9 18 6-6-6-6" /></Icon>);
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
    `${(e.nombres || '?').trim().charAt(0)}${(e.apellidos || '').trim().charAt(0)}`.toUpperCase();

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

const TarjetaResumen = ({ titulo, valor, sufijo = '', badge, badgeColor, icono, color, spark, sparkColor, pie, retraso }) => {
    const animado = useContador(valor);
    return (
        <div
            className="em-fade-up group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition-all duration-300"
            style={{ animationDelay: `${retraso}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${color}`}>
                        {icono}
                    </div>
                    <p className="text-xs font-medium text-slate-500 leading-tight">{titulo}</p>
                </div>
                {badge && <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${badgeColor}`}>{badge}</span>}
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                    {Math.round(animado)}<span className="text-xl text-slate-400 font-bold">{sufijo}</span>
                </p>
                {spark && <Sparkline datos={spark} className={sparkColor} />}
            </div>
            {pie && <div className="mt-3 pt-3 border-t border-slate-50 text-[11px] text-slate-500">{pie}</div>}
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
    const [mostrarForm, setMostrarForm] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todas');
    const [orden, setOrden] = useState({ campo: 'razon_social', dir: 'asc' });
    const [pagina, setPagina] = useState(1);

    const tokenSesion = localStorage.getItem('token');

    useEffect(() => {
        cargarEmpresas();
    }, []);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtro]);

    const cargarEmpresas = async () => {
        try {
            const res = await axios.get(`${API_URL}/empresas`, {
                headers: { 'Authorization': `Bearer ${tokenSesion}`, 'Accept': 'application/json' }
            });
            setEmpresas(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (error) {
            mostrarAlerta('Error al cargar la lista de empresas de convenio.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const mostrarAlerta = (mensaje, tipo) => {
        setAlerta({ mensaje, tipo });
        setTimeout(() => setAlerta({ mensaje: '', tipo: '' }), 4000);
    };

    const cambiarCampo = (campo) => (e) => setFormData(prev => ({ ...prev, [campo]: e.target.value }));

    const buscarRucSunat = async () => {
        if (formData.ruc.length !== 11) {
            mostrarAlerta('El RUC debe tener exactamente 11 dígitos.', 'error');
            return;
        }

        setBuscandoRuc(true);
        try {
            const res = await axios.get(`${API_URL}/empresas/ruc/${formData.ruc}`, {
                headers: { 'Authorization': `Bearer ${tokenSesion}`, 'Accept': 'application/json' }
            });
            const data = res.data?.data || res.data;

            if (data) {
                // Dirección tal como la entrega SUNAT (sin repetir distrito / provincia / departamento)
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
                    // Si la API no los devuelve, se conserva lo que ya estaba escrito
                    telefono: data.telefono || prev.telefono,
                    correo_electronico: data.correo_electronico || data.email || prev.correo_electronico,
                    supervisor_empresa_nombre: data.representante_legal || data.representante || prev.supervisor_empresa_nombre,
                }));

                const resumen = data.estado ? ` (${data.estado}${data.condicion ? ' / ' + data.condicion : ''})` : '';
                mostrarAlerta(`¡Datos obtenidos correctamente de SUNAT!${resumen}`, 'success');
            }
        } catch (error) {
            const mensajeError = error.response?.data?.error || 'No se encontró información para el RUC ingresado.';
            mostrarAlerta(mensajeError, 'error');
        } finally {
            setBuscandoRuc(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/empresas`, formData, {
                headers: { 'Authorization': `Bearer ${tokenSesion}`, 'Accept': 'application/json' }
            });
            mostrarAlerta('Empresa de convenio registrada exitosamente.', 'success');
            setFormData(formularioVacio);
            cargarEmpresas();
        } catch (error) {
            mostrarAlerta('Error al registrar la empresa. Verifique los datos.', 'error');
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
        const csv = '\uFEFF' + filas.map(f => f.map(esc).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url; a.download = 'empresas_convenio.csv'; a.click();
        URL.revokeObjectURL(url);
        mostrarAlerta('Lista exportada correctamente.', 'success');
    };

    const tabs = [
        { id: 'todas', label: 'Todas', cant: totalEmpresas },
        { id: 'con', label: 'Con estudiantes', cant: conEstudiantes },
        { id: 'sin', label: 'Sin asignar', cant: sinEstudiantes },
    ];

    const estilosAlerta = {
        success: { caja: 'bg-emerald-50 text-emerald-800 border-emerald-200', icono: 'text-emerald-500', barra: 'bg-emerald-400', Ico: IconCheck },
        error: { caja: 'bg-rose-50 text-rose-800 border-rose-200', icono: 'text-rose-500', barra: 'bg-rose-400', Ico: IconAlert },
    };
    const ea = estilosAlerta[alerta.tipo] || estilosAlerta.error;
    const rucCompleto = formData.ruc.length === 11;

    return (
        <div className="w-full p-5 md:p-6 space-y-6">
            <style>{estilosAnimaciones}</style>

            {/* Cabecera */}
            <div className="em-fade-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Empresas de Convenio (EFSRT)</h1>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-100">
                            Panel Académico
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Gestión de instituciones aliadas y asignación de prácticas pre-profesionales.
                    </p>
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
                        onClick={() => setMostrarForm(v => !v)}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
                    >
                        <span className={`transition-transform duration-300 ${mostrarForm ? 'rotate-45' : 'group-hover:rotate-90'}`}><IconPlus /></span>
                        {mostrarForm ? 'Ocultar formulario' : 'Nueva Empresa'}
                    </button>
                </div>
            </div>

            {/* Alerta */}
            {alerta.mensaje && (
                <div className={`em-alert-in relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium border shadow-sm ${ea.caja}`} role="status">
                    <span className={ea.icono}><ea.Ico /></span>
                    <span className="flex-1">{alerta.mensaje}</span>
                    <button
                        onClick={() => setAlerta({ mensaje: '', tipo: '' })}
                        className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none px-1"
                        aria-label="Cerrar alerta"
                    >
                        ×
                    </button>
                    <span className={`em-progress absolute bottom-0 left-0 h-0.5 ${ea.barra}`} />
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <TarjetaResumen
                    titulo="Empresas Aliadas" valor={totalEmpresas}
                    icono={<IconBuilding />} color="bg-blue-50 text-blue-600"
                    badge="Convenios" badgeColor="bg-blue-50 text-blue-600"
                    spark={series.sT} sparkColor="text-blue-500"
                    pie="Instituciones registradas" retraso={60}
                />
                <TarjetaResumen
                    titulo="Alumnos en Prácticas" valor={totalPracticantes}
                    icono={<IconUsers />} color="bg-violet-50 text-violet-600"
                    badge="Asignados" badgeColor="bg-violet-50 text-violet-600"
                    spark={series.sP} sparkColor="text-violet-500"
                    pie={`Promedio: ${totalEmpresas ? (totalPracticantes / totalEmpresas).toFixed(1) : 0} por empresa`} retraso={120}
                />
                <TarjetaResumen
                    titulo="Cobertura de Asignación" valor={cobertura} sufijo="%"
                    icono={<IconLink />} color="bg-emerald-50 text-emerald-600"
                    badge={`${conEstudiantes} de ${totalEmpresas}`} badgeColor="bg-emerald-50 text-emerald-600"
                    pie={
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${cobertura}%` }} />
                        </div>
                    }
                    retraso={180}
                />
                <TarjetaResumen
                    titulo="Sin Estudiantes" valor={sinEstudiantes}
                    icono={<IconWarn />} color="bg-amber-50 text-amber-600"
                    badge={sinEstudiantes > 0 ? 'Pendiente' : 'Al día'} badgeColor="bg-amber-50 text-amber-600"
                    pie="Requieren asignación de practicantes" retraso={240}
                />
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 items-start">
                <div className="2xl:col-span-2 space-y-6">
                    {/* Formulario de registro */}
                    {mostrarForm && (
                        <div className="em-pop bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                                <div className="space-y-1">
                                    <h2 className="text-base font-bold text-slate-900">Registrar Nueva Empresa Aliada</h2>
                                    <p className="text-xs text-slate-500">Ingresa el RUC para autocompletar los datos desde SUNAT.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMostrarForm(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    aria-label="Cerrar formulario"
                                >
                                    <IconClose />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                                                className={claseInput}
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

                                    <div className="md:col-span-2">
                                        <Campo label="Razón Social" requerido>
                                            <input
                                                type="text"
                                                value={formData.razon_social}
                                                onChange={cambiarCampo('razon_social')}
                                                placeholder="Se completa automáticamente o ingrese manual"
                                                className={claseInput}
                                                required
                                            />
                                        </Campo>
                                    </div>
                                </div>

                                {/* Datos SUNAT: estado, condición y tipo */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <Campo
                                        label="Estado del contribuyente"
                                        extra={formData.estado && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600"><IconShieldCheck /> SUNAT</span>
                                        )}
                                    >
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
                                    <Campo label="Tipo de contribuyente">
                                        <input
                                            type="text"
                                            value={formData.tipo_contribuyente}
                                            onChange={cambiarCampo('tipo_contribuyente')}
                                            placeholder="Ej. SOCIEDAD ANONIMA"
                                            className={claseInput}
                                        />
                                    </Campo>
                                </div>

                                {/* Ubicación */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                                    <Campo label="Departamento">
                                        <input
                                            type="text"
                                            value={formData.departamento}
                                            onChange={cambiarCampo('departamento')}
                                            placeholder="Ej. LIMA"
                                            className={claseInput}
                                        />
                                    </Campo>
                                    <Campo label="Provincia">
                                        <input
                                            type="text"
                                            value={formData.provincia}
                                            onChange={cambiarCampo('provincia')}
                                            placeholder="Ej. LIMA"
                                            className={claseInput}
                                        />
                                    </Campo>
                                    <Campo label="Distrito">
                                        <input
                                            type="text"
                                            value={formData.distrito}
                                            onChange={cambiarCampo('distrito')}
                                            placeholder="Ej. MIRAFLORES"
                                            className={claseInput}
                                        />
                                    </Campo>
                                    <Campo label="Ubigeo">
                                        <input
                                            type="text"
                                            maxLength="6"
                                            value={formData.ubigeo}
                                            onChange={cambiarCampo('ubigeo')}
                                            placeholder="Ej. 150122"
                                            className={`${claseInput} font-mono`}
                                        />
                                    </Campo>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <Campo label="Supervisor / Representante">
                                        <input
                                            type="text"
                                            value={formData.supervisor_empresa_nombre}
                                            onChange={cambiarCampo('supervisor_empresa_nombre')}
                                            placeholder="Nombre del responsable"
                                            className={claseInput}
                                        />
                                    </Campo>
                                    <Campo label="Teléfono">
                                        <input
                                            type="text"
                                            value={formData.telefono}
                                            onChange={cambiarCampo('telefono')}
                                            placeholder="Celular o contacto"
                                            className={claseInput}
                                        />
                                    </Campo>
                                    <Campo label="Correo Electrónico">
                                        <input
                                            type="email"
                                            value={formData.correo_electronico}
                                            onChange={cambiarCampo('correo_electronico')}
                                            placeholder="correo@empresa.com"
                                            className={claseInput}
                                        />
                                    </Campo>
                                </div>

                                <Campo label="Dirección Fiscal">
                                    <input
                                        type="text"
                                        value={formData.direccion}
                                        onChange={cambiarCampo('direccion')}
                                        placeholder="Dirección completa de la empresa"
                                        className={claseInput}
                                    />
                                </Campo>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <p className="text-[11px] text-slate-400"><span className="text-rose-500">*</span> Campos obligatorios</p>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <IconCheck />
                                        Guardar Empresa de Convenio
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tabla de empresas */}
                    <div className="em-fade-up bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ animationDelay: '300ms' }}>
                        <div className="px-6 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100">
                            <div className="space-y-1">
                                <h2 className="text-base font-bold text-slate-900">Empresas Aliadas y Alumnos en Prácticas</h2>
                                <p className="text-xs text-slate-500">Convenios registrados y su vinculación con estudiantes.</p>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start">
                                    {tabs.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setFiltro(t.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                                                filtro === t.id ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
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
                                        className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 text-[11px] uppercase font-semibold tracking-wider text-slate-500 border-b border-slate-100">
                                        <th className="py-3.5 px-6 text-left">
                                            <button onClick={() => cambiarOrden('razon_social')} className="group inline-flex items-center gap-1.5 uppercase tracking-wider font-semibold hover:text-slate-800 transition-colors">
                                                RUC / Empresa <IconSort activo={orden.campo === 'razon_social'} dir={orden.dir} />
                                            </button>
                                        </th>
                                        <th className="py-3.5 px-6 text-left">Representante / Contacto</th>
                                        <th className="py-3.5 px-6 text-left">Ubicación</th>
                                        <th className="py-3.5 px-6 text-left">
                                            <button onClick={() => cambiarOrden('estudiantes')} className="group inline-flex items-center gap-1.5 uppercase tracking-wider font-semibold hover:text-slate-800 transition-colors">
                                                Practicantes <IconSort activo={orden.campo === 'estudiantes'} dir={orden.dir} />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {cargando ? (
                                        [...Array(4)].map((_, i) => (
                                            <tr key={i}>
                                                <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="em-skeleton w-10 h-10 rounded-xl" /><div className="space-y-2"><div className="em-skeleton h-3.5 w-40 rounded" /><div className="em-skeleton h-2.5 w-24 rounded" /></div></div></td>
                                                <td className="py-4 px-6"><div className="space-y-2"><div className="em-skeleton h-3.5 w-32 rounded" /><div className="em-skeleton h-2.5 w-24 rounded" /></div></td>
                                                <td className="py-4 px-6"><div className="em-skeleton h-3.5 w-44 rounded" /></td>
                                                <td className="py-4 px-6"><div className="em-skeleton h-6 w-32 rounded-md" /></td>
                                            </tr>
                                        ))
                                    ) : pagina_.length > 0 ? (
                                        pagina_.map((emp, i) => {
                                            const est = emp.estudiantes || [];
                                            const zona = [emp.distrito, emp.provincia, emp.departamento].filter(Boolean).join(' / ');
                                            return (
                                                <tr
                                                    key={emp.id_empresa}
                                                    className="em-row-in group/fila hover:bg-blue-50/40 transition-colors duration-200"
                                                    style={{ animationDelay: `${i * 45}ms` }}
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm transition-transform duration-200 group-hover/fila:scale-110 ${colorAvatar(emp.id_empresa)}`}>
                                                                {inicialesEmpresa(emp.razon_social)}
                                                            </div>
                                                            <div className="space-y-1 min-w-0">
                                                                <p className="font-semibold text-slate-900 leading-tight">{emp.razon_social}</p>
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold rounded">RUC {emp.ruc}</span>
                                                                    {emp.estado && (
                                                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${emp.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{emp.estado}</span>
                                                                    )}
                                                                    {emp.condicion && (
                                                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${emp.condicion === 'HABIDO' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>{emp.condicion}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-1">
                                                            <p className="text-slate-800 font-medium text-[13px]">{emp.supervisor_empresa_nombre || 'No asignado'}</p>
                                                            <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                <IconPhone />
                                                                <span className="truncate max-w-[180px]">{emp.telefono || emp.correo_electronico || 'Sin contacto'}</span>
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="flex items-start gap-1.5 text-xs text-slate-600 max-w-[240px]">
                                                            <span className="mt-0.5 text-slate-400 shrink-0"><IconPin /></span>
                                                            <span className="min-w-0">
                                                                <span className="line-clamp-2 block" title={emp.direccion}>{emp.direccion || 'Sin dirección'}</span>
                                                                {zona && <span className="block text-[11px] text-slate-400 mt-0.5">{zona}{emp.ubigeo ? ` · ${emp.ubigeo}` : ''}</span>}
                                                            </span>
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {est.length > 0 ? (
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {est.slice(0, 2).map((e, idx) => (
                                                                    <span key={idx} className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 transition-colors hover:bg-blue-100">
                                                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">{inicialesPersona(e)}</span>
                                                                        {e.nombres} {e.apellidos}
                                                                    </span>
                                                                ))}
                                                                {est.length > 2 && (
                                                                    <span
                                                                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full"
                                                                        title={est.slice(2).map(e => `${e.nombres} ${e.apellidos}`).join(', ')}
                                                                    >
                                                                        +{est.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-semibold border border-amber-100">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                Sin estudiantes asignados
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-16">
                                                <div className="em-fade-up flex flex-col items-center text-center space-y-1">
                                                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                                                        <IconBuilding className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-700">No hay empresas para mostrar</p>
                                                    <p className="text-xs text-slate-400">No hay empresas de convenio registradas todavía o la búsqueda no coincide.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
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
                </div>

                {/* Panel lateral informativo */}
                <div className="space-y-6">
                    <div className="em-fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '360ms' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Cobertura de Convenios</h3>
                            <p className="text-xs text-slate-500">Empresas con y sin practicantes asignados.</p>
                        </div>
                        <DonaCobertura con={conEstudiantes} sin={sinEstudiantes} />
                    </div>

                    <div className="em-fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '420ms' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Top Empresas</h3>
                            <p className="text-xs text-slate-500">Mayor número de practicantes asignados.</p>
                        </div>
                        <div className="space-y-4">
                            {series.top.map((t, i) => (
                                <div key={t.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs gap-3">
                                        <span className="font-medium text-slate-600 truncate">{t.nombre}</span>
                                        <span className="font-bold text-slate-800 tabular-nums">{t.n}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${['bg-blue-500', 'bg-violet-500', 'bg-sky-400', 'bg-emerald-400'][i]}`}
                                            style={{ width: `${(t.n / maxTop) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {series.top.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Aún no hay practicantes asignados.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}