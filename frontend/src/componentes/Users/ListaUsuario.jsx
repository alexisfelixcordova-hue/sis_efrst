import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const POR_PAGINA = 6;

/* ---------- Animaciones (keyframes propios) ---------- */
const estilosAnimaciones = `
@keyframes lu-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lu-row-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes lu-alert-in { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes lu-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes lu-progress { from { width: 100%; } to { width: 0%; } }
@keyframes lu-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.lu-fade-up { animation: lu-fade-up .5s cubic-bezier(.22,1,.36,1) both; }
.lu-row-in { animation: lu-row-in .4s cubic-bezier(.22,1,.36,1) both; }
.lu-alert-in { animation: lu-alert-in .35s cubic-bezier(.22,1,.36,1) both; }
.lu-skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
    background-size: 800px 100%;
    animation: lu-shimmer 1.4s linear infinite;
}
.lu-progress { animation: lu-progress 4s linear forwards; }
.lu-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: lu-draw 1.2s ease-out .3s forwards; }
@media (prefers-reduced-motion: reduce) {
    .lu-fade-up, .lu-row-in, .lu-alert-in, .lu-skeleton, .lu-progress { animation: none !important; }
    .lu-draw { animation: none !important; stroke-dashoffset: 0; }
}
`;

/* ---------- Iconos (SVG inline) ---------- */
const Icon = ({ children, className = 'w-4 h-4', stroke = 2 }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {children}
    </svg>
);
const IconSearch = () => (<Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>);
const IconPlus = () => (<Icon stroke={2.5}><path d="M12 5v14M5 12h14" /></Icon>);
const IconTrash = () => (<Icon><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Icon>);
const IconEdit = () => (<Icon><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></Icon>);
const IconDownload = () => (<Icon><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></Icon>);
const IconUsers = ({ className }) => (<Icon className={className || 'w-5 h-5'}><path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75" /></Icon>);
const IconShield = () => (<Icon className="w-5 h-5"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /></Icon>);
const IconCap = () => (<Icon className="w-5 h-5"><path d="M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5" /></Icon>);
const IconMail = () => (<Icon className="w-5 h-5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>);
const IconCheck = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>);
const IconAlert = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></Icon>);
const IconInfo = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></Icon>);
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
const iniciales = (u) =>
    `${(u.nombres || '?').trim().charAt(0)}${(u.apellidos || '').trim().charAt(0)}`.toUpperCase();
const colorAvatar = (id) => coloresAvatar[Number(id) % coloresAvatar.length] || coloresAvatar[0];
const dominioDe = (correo) => {
    const partes = (correo || '').split('@');
    return partes.length > 1 ? partes[1].trim().toLowerCase() : 'sin dominio';
};

/* Contador animado */
const useContador = (objetivo, duracion = 800) => {
    const [valor, setValor] = useState(0);
    useEffect(() => {
        let raf;
        const inicio = performance.now();
        const paso = (t) => {
            const p = Math.min((t - inicio) / duracion, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setValor(objetivo * ease);
            if (p < 1) raf = requestAnimationFrame(paso);
        };
        raf = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(raf);
    }, [objetivo, duracion]);
    return valor;
};

/* Mini gráfico de línea */
const Sparkline = ({ datos, className = 'text-blue-500' }) => {
    const W = 84, H = 34;
    const serie = datos.length > 1 ? datos : [0, datos[0] || 0];
    const min = Math.min(...serie), max = Math.max(...serie);
    const rango = max - min || 1;
    const pts = serie.map((v, i) => [
        (i * W) / (serie.length - 1),
        H - 3 - ((v - min) / rango) * (H - 6),
    ]);
    const linea = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className={`w-[84px] h-[34px] ${className}`} fill="none">
            <path d={`${linea} L${W},${H} L0,${H} Z`} fill="currentColor" opacity="0.08" />
            <path d={linea} pathLength="1" className="lu-draw" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const reducirSerie = (serie, max = 14) => {
    if (serie.length <= max) return serie;
    const paso = (serie.length - 1) / (max - 1);
    return Array.from({ length: max }, (_, i) => serie[Math.round(i * paso)]);
};

/* Tarjeta de estadística */
const TarjetaResumen = ({ titulo, valor, sufijo = '', badge, badgeColor, icono, color, spark, sparkColor, pie, retraso }) => {
    const animado = useContador(valor);
    return (
        <div
            className="lu-fade-up group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition-all duration-300"
            style={{ animationDelay: `${retraso}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${color}`}>
                        {icono}
                    </div>
                    <p className="text-xs font-medium text-slate-500 leading-tight">{titulo}</p>
                </div>
                {badge && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${badgeColor}`}>{badge}</span>
                )}
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

/* Gráfico de dona: distribución de roles */
const DonaRoles = ({ admins, docentes }) => {
    const total = admins + docentes;
    const progreso = useContador(1, 900);
    const pa = total ? (admins / total) * 100 * progreso : 0;
    const pd = total ? (docentes / total) * 100 * progreso : 0;
    return (
        <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="butt"
                        strokeDasharray={`${pa} ${100 - pa}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="butt"
                        strokeDasharray={`${pd} ${100 - pd}`} strokeDashoffset={`-${pa}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{total}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Usuarios</span>
                </div>
            </div>
            <div className="flex-1 space-y-3">
                {[
                    { label: 'Administradores', n: admins, dot: 'bg-violet-500' },
                    { label: 'Docentes', n: docentes, dot: 'bg-sky-500' },
                ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                            <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                            {r.label}
                        </span>
                        <span className="font-bold text-slate-800 tabular-nums">
                            {r.n} <span className="text-slate-400 font-medium">({total ? Math.round((r.n / total) * 100) : 0}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function ListaUsuario({ onIrCrear, onIrEditar }) {
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' });
    const [filtroRol, setFiltroRol] = useState('todos');
    const [cargando, setCargando] = useState(true);
    const [orden, setOrden] = useState({ campo: 'nombres', dir: 'asc' });
    const [pagina, setPagina] = useState(1);
    const tokenSesion = localStorage.getItem('token');

    useEffect(() => {
        cargarUsuarios();
    }, []);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtroRol]);

    const cargarUsuarios = async () => {
        try {
            const res = await axios.get(`${API_URL}/usuarios`, {
                headers: { 'Authorization': `Bearer ${tokenSesion}`, 'Accept': 'application/json' }
            });
            const datosFinales = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setUsuarios(datosFinales);
        } catch (error) {
            mostrarAlerta('Error al cargar la lista de usuarios.', 'error');
            setUsuarios([]);
        } finally {
            setCargando(false);
        }
    };

    const mostrarAlerta = (mensaje, tipo) => {
        setAlerta({ mensaje, tipo });
        setTimeout(() => setAlerta({ mensaje: '', tipo: '' }), 4000);
    };

    const eliminarUsuario = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await axios.delete(`${API_URL}/usuarios/${id}`, {
                headers: { 'Authorization': `Bearer ${tokenSesion}` }
            });
            mostrarAlerta('Usuario eliminado con éxito.', 'success');
            cargarUsuarios();
        } catch (error) {
            mostrarAlerta('No se pudo eliminar el usuario.', 'error');
        }
    };

    const editarUsuario = (u) => {
        if (typeof onIrEditar === 'function') {
            onIrEditar(u);
        } else {
            mostrarAlerta('La edición de usuarios estará disponible próximamente.', 'info');
        }
    };

    const cambiarOrden = (campo) => {
        setOrden((prev) => ({
            campo,
            dir: prev.campo === campo && prev.dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const exportarCSV = () => {
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const filas = [
            ['ID', 'Nombres', 'Apellidos', 'Correo', 'Rol'],
            ...usuariosFiltrados.map(u => [u.id_usuario, u.nombres, u.apellidos, u.correo, u.id_rol === 1 ? 'Administrador' : 'Docente']),
        ];
        const csv = '\uFEFF' + filas.map(f => f.map(esc).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'usuarios.csv';
        a.click();
        URL.revokeObjectURL(url);
        mostrarAlerta('Lista exportada correctamente.', 'success');
    };

    const usuariosFiltrados = useMemo(() => {
        const texto = busqueda.toLowerCase();
        const lista = usuarios.filter(u => {
            const coincideTexto =
                (u.nombres && u.nombres.toLowerCase().includes(texto)) ||
                (u.apellidos && u.apellidos.toLowerCase().includes(texto)) ||
                (u.correo && u.correo.toLowerCase().includes(texto));

            const coincideRol =
                filtroRol === 'todos' ||
                (filtroRol === 'admin' && u.id_rol === 1) ||
                (filtroRol === 'docente' && u.id_rol !== 1);

            return coincideTexto && coincideRol;
        });

        const valorOrden = (u) => {
            if (orden.campo === 'nombres') return `${u.nombres || ''} ${u.apellidos || ''}`.toLowerCase();
            if (orden.campo === 'correo') return (u.correo || '').toLowerCase();
            return u.id_rol === 1 ? 'administrador' : 'docente';
        };
        return [...lista].sort((a, b) => {
            const r = valorOrden(a).localeCompare(valorOrden(b));
            return orden.dir === 'asc' ? r : -r;
        });
    }, [usuarios, busqueda, filtroRol, orden]);

    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * POR_PAGINA;
    const usuariosPagina = usuariosFiltrados.slice(inicio, inicio + POR_PAGINA);

    const totalAdmins = usuarios.filter(u => u.id_rol === 1).length;
    const totalDocentes = usuarios.length - totalAdmins;
    const pct = (n) => (usuarios.length ? Math.round((n / usuarios.length) * 100) : 0);

    const stats = useMemo(() => {
        const porId = [...usuarios].sort((a, b) => Number(a.id_usuario) - Number(b.id_usuario));
        let t = 0, a = 0, d = 0;
        const serieTotal = [], serieAdmin = [], serieDoc = [];
        porId.forEach(u => {
            t += 1;
            if (u.id_rol === 1) a += 1; else d += 1;
            serieTotal.push(t); serieAdmin.push(a); serieDoc.push(d);
        });

        const conteoDominios = {};
        usuarios.forEach(u => {
            const dom = dominioDe(u.correo);
            conteoDominios[dom] = (conteoDominios[dom] || 0) + 1;
        });
        const dominios = Object.entries(conteoDominios).sort((x, y) => y[1] - x[1]);

        return {
            serieTotal: reducirSerie(serieTotal),
            serieAdmin: reducirSerie(serieAdmin),
            serieDoc: reducirSerie(serieDoc),
            dominios,
            recientes: porId.slice(-4).reverse(),
        };
    }, [usuarios]);

    const dominioTop = stats.dominios[0];
    const pctDominioTop = dominioTop ? pct(dominioTop[1]) : 0;

    const tabs = [
        { id: 'todos', label: 'Todos', cant: usuarios.length },
        { id: 'admin', label: 'Administradores', cant: totalAdmins },
        { id: 'docente', label: 'Docentes', cant: totalDocentes },
    ];

    const estilosAlerta = {
        success: { caja: 'bg-emerald-50 text-emerald-800 border-emerald-200', icono: 'text-emerald-500', barra: 'bg-emerald-400', Ico: IconCheck },
        error: { caja: 'bg-rose-50 text-rose-800 border-rose-200', icono: 'text-rose-500', barra: 'bg-rose-400', Ico: IconAlert },
        info: { caja: 'bg-blue-50 text-blue-800 border-blue-200', icono: 'text-blue-500', barra: 'bg-blue-400', Ico: IconInfo },
    };
    const ea = estilosAlerta[alerta.tipo] || estilosAlerta.info;

    const columnas = [
        { campo: 'nombres', label: 'Usuario' },
        { campo: 'correo', label: 'Correo Electrónico' },
        { campo: 'rol', label: 'Rol Asignado' },
    ];

    return (
        <div className="w-full p-5 md:p-6 space-y-6">
            <style>{estilosAnimaciones}</style>

            {/* Cabecera */}
            <div className="lu-fade-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios y Roles</h1>
                    <p className="text-sm text-slate-500">
                        Administra accesos para administradores y plantel docente del portal EFSRT.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportarCSV}
                        disabled={usuariosFiltrados.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconDownload />
                        Exportar
                    </button>
                    <button
                        onClick={onIrCrear}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
                    >
                        <span className="transition-transform duration-300 group-hover:rotate-90"><IconPlus /></span>
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Alerta */}
            {alerta.mensaje && (
                <div className={`lu-alert-in relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium border shadow-sm ${ea.caja}`} role="status">
                    <span className={ea.icono}><ea.Ico /></span>
                    <span className="flex-1">{alerta.mensaje}</span>
                    <button
                        onClick={() => setAlerta({ mensaje: '', tipo: '' })}
                        className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none px-1"
                        aria-label="Cerrar alerta"
                    >
                        ×
                    </button>
                    <span className={`lu-progress absolute bottom-0 left-0 h-0.5 ${ea.barra}`} />
                </div>
            )}

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <TarjetaResumen
                    titulo="Usuarios Registrados" valor={usuarios.length}
                    icono={<IconUsers />} color="bg-blue-50 text-blue-600"
                    badge="Total" badgeColor="bg-blue-50 text-blue-600"
                    spark={stats.serieTotal} sparkColor="text-blue-500"
                    pie="Cuentas con acceso al portal" retraso={60}
                />
                <TarjetaResumen
                    titulo="Administradores" valor={totalAdmins}
                    icono={<IconShield />} color="bg-violet-50 text-violet-600"
                    badge={`${pct(totalAdmins)}%`} badgeColor="bg-violet-50 text-violet-600"
                    spark={stats.serieAdmin} sparkColor="text-violet-500"
                    pie="Acceso total al sistema" retraso={120}
                />
                <TarjetaResumen
                    titulo="Docentes Asesores" valor={totalDocentes}
                    icono={<IconCap />} color="bg-sky-50 text-sky-600"
                    badge={`${pct(totalDocentes)}%`} badgeColor="bg-sky-50 text-sky-600"
                    spark={stats.serieDoc} sparkColor="text-sky-500"
                    pie="Plantel docente de prácticas" retraso={180}
                />
                <TarjetaResumen
                    titulo="Dominio de correo principal" valor={pctDominioTop} sufijo="%"
                    icono={<IconMail />} color="bg-emerald-50 text-emerald-600"
                    badge="Correos" badgeColor="bg-emerald-50 text-emerald-600"
                    pie={
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pctDominioTop}%` }} />
                            </div>
                            <p className="truncate">@{dominioTop ? dominioTop[0] : '—'}</p>
                        </div>
                    }
                    retraso={240}
                />
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 items-start">
                {/* Tabla */}
                <div className="lu-fade-up 2xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ animationDelay: '300ms' }}>
                    <div className="px-6 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100">
                        <div className="space-y-1">
                            <h2 className="text-base font-bold text-slate-900">Lista de Usuarios</h2>
                            <p className="text-xs text-slate-500">Gestiona y controla los accesos al sistema.</p>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            {/* Filtro por rol */}
                            <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start">
                                {tabs.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setFiltroRol(t.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                            filtroRol === t.id
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
                                        }`}
                                    >
                                        {t.label}
                                        <span className={`px-1.5 rounded-md text-[10px] tabular-nums transition-colors ${filtroRol === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {t.cant}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Búsqueda */}
                            <div className="relative group">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <IconSearch />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, apellido o correo..."
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
                                    {columnas.map((c) => (
                                        <th key={c.campo} className="py-3.5 px-6 text-left">
                                            <button
                                                onClick={() => cambiarOrden(c.campo)}
                                                className="group inline-flex items-center gap-1.5 uppercase tracking-wider font-semibold hover:text-slate-800 transition-colors"
                                            >
                                                {c.label}
                                                <IconSort activo={orden.campo === c.campo} dir={orden.dir} />
                                            </button>
                                        </th>
                                    ))}
                                    <th className="py-3.5 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {cargando ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="lu-skeleton w-10 h-10 rounded-full" />
                                                    <div className="space-y-2">
                                                        <div className="lu-skeleton h-3.5 w-36 rounded" />
                                                        <div className="lu-skeleton h-2.5 w-16 rounded" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6"><div className="lu-skeleton h-3.5 w-48 rounded" /></td>
                                            <td className="py-4 px-6"><div className="lu-skeleton h-6 w-28 rounded-md" /></td>
                                            <td className="py-4 px-6"><div className="lu-skeleton h-8 w-24 rounded-lg ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : usuariosPagina.length > 0 ? (
                                    usuariosPagina.map((u, i) => (
                                        <tr
                                            key={u.id_usuario}
                                            className="lu-row-in group/fila hover:bg-blue-50/40 transition-colors duration-200"
                                            style={{ animationDelay: `${i * 45}ms` }}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3.5">
                                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm transition-transform duration-200 group-hover/fila:scale-110 ${colorAvatar(u.id_usuario)}`}>
                                                        {iniciales(u)}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="font-semibold text-slate-900 leading-tight">
                                                            {u.nombres} {u.apellidos}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">ID #{u.id_usuario}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 text-[13px]">{u.correo}</td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                                                        u.id_rol === 1
                                                            ? 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100'
                                                            : 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.id_rol === 1 ? 'bg-violet-500' : 'bg-sky-500'}`} />
                                                    {u.id_rol === 1 ? 'Administrador' : 'Docente'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2 opacity-70 group-hover/fila:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => editarUsuario(u)}
                                                        title="Editar usuario"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white active:scale-95 text-xs font-semibold rounded-lg transition-all duration-200"
                                                    >
                                                        <IconEdit />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarUsuario(u.id_usuario)}
                                                        title="Eliminar usuario"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white active:scale-95 text-xs font-semibold rounded-lg transition-all duration-200"
                                                    >
                                                        <IconTrash />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-16">
                                            <div className="lu-fade-up flex flex-col items-center text-center space-y-1">
                                                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                                                    <IconUsers className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700">No se encontraron usuarios</p>
                                                <p className="text-xs text-slate-400">Prueba con otra búsqueda o crea un nuevo usuario.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pie de tabla con paginación */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <span>
                            Mostrando{' '}
                            <strong className="text-slate-700">
                                {usuariosFiltrados.length === 0 ? 0 : inicio + 1}–{Math.min(inicio + POR_PAGINA, usuariosFiltrados.length)}
                            </strong>{' '}
                            de <strong className="text-slate-700">{usuariosFiltrados.length}</strong> usuarios
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPagina(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                                aria-label="Página anterior"
                            >
                                <IconChevronL />
                            </button>
                            {[...Array(totalPaginas)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPagina(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        paginaActual === i + 1
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 scale-105'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
                                disabled={paginaActual === totalPaginas}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                                aria-label="Página siguiente"
                            >
                                <IconChevronR />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel lateral informativo */}
                <div className="space-y-6">
                    {/* Distribución de roles */}
                    <div className="lu-fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '380ms' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Distribución de Roles</h3>
                            <p className="text-xs text-slate-500">Proporción de accesos por tipo de usuario.</p>
                        </div>
                        <DonaRoles admins={totalAdmins} docentes={totalDocentes} />
                    </div>

                    {/* Dominios de correo */}
                    <div className="lu-fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '440ms' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Dominios de Correo</h3>
                            <p className="text-xs text-slate-500">Procedencia de las cuentas registradas.</p>
                        </div>
                        <div className="space-y-4">
                            {stats.dominios.slice(0, 4).map(([dom, n], i) => (
                                <div key={dom} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-600 truncate pr-3">@{dom}</span>
                                        <span className="font-bold text-slate-800 tabular-nums">{n}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${['bg-blue-500', 'bg-violet-500', 'bg-sky-400', 'bg-emerald-400'][i]}`}
                                            style={{ width: `${pct(n)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {stats.dominios.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Sin datos disponibles.</p>
                            )}
                        </div>
                    </div>

                    {/* Últimos registrados */}
                    <div className="lu-fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '500ms' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Últimos Registrados</h3>
                            <p className="text-xs text-slate-500">Cuentas más recientes del sistema.</p>
                        </div>
                        <ul className="space-y-1">
                            {stats.recientes.map((u) => (
                                <li key={u.id_usuario} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                                    <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${colorAvatar(u.id_usuario)}`}>
                                        {iniciales(u)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{u.nombres} {u.apellidos}</p>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.correo}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${u.id_rol === 1 ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>
                                        {u.id_rol === 1 ? 'Admin' : 'Docente'}
                                    </span>
                                </li>
                            ))}
                            {stats.recientes.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Aún no hay usuarios.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}