import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios.js';

const BASE_URL = 'http://localhost:8000';
const POR_PAGINA = 6;

/* ---------- Animaciones (keyframes propios) ---------- */
const estilosAnimaciones = `
@keyframes lu-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lu-row-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes lu-alert-in { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes lu-pulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes lu-progress { from { width: 100%; } to { width: 0%; } }
@keyframes lu-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes lu-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes lu-modal { from { opacity: 0; transform: translateY(16px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes lu-spin { to { transform: rotate(360deg); } }
.lu-fade-up { animation: lu-fade-up .5s cubic-bezier(.22,1,.36,1) both; }
.lu-row-in { animation: lu-row-in .4s cubic-bezier(.22,1,.36,1) both; }
.lu-alert-in { animation: lu-alert-in .35s cubic-bezier(.22,1,.36,1) both; }
.lu-skeleton { background: #f1f5f9; animation: lu-pulse 1.4s ease-in-out infinite; }
.lu-progress { animation: lu-progress 4s linear forwards; }
.lu-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: lu-draw 1.2s ease-out .3s forwards; }
.lu-fade { animation: lu-fade .2s ease-out both; }
.lu-modal { animation: lu-modal .3s cubic-bezier(.22,1,.36,1) both; }
.lu-spin { animation: lu-spin .8s linear infinite; }
@media (prefers-reduced-motion: reduce) {
    .lu-fade-up, .lu-row-in, .lu-alert-in, .lu-skeleton, .lu-progress, .lu-fade, .lu-modal, .lu-spin { animation: none !important; }
    .lu-draw { animation: none !important; stroke-dashoffset: 0; }
}
`;

const foco = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';
const superficie = 'bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

/* ---------- Iconos (SVG inline) ---------- */
const Icon = ({ children, className = 'w-4 h-4', stroke = 2 }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        {children}
    </svg>
);
const IconSearch = () => (<Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>);
const IconPlus = () => (<Icon stroke={2.5}><path d="M12 5v14M5 12h14" /></Icon>);
const IconTrash = () => (<Icon><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Icon>);
const IconEdit = () => (<Icon><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></Icon>);
const IconLock = () => (<Icon><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>);
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
    <svg className={`w-3 h-3 transition-all duration-200 ${activo ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'} ${activo && dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 15 6-6 6 6" />
    </svg>
);

/* ---------- Helpers ---------- */
const iniciales = (u) =>
    `${(u.nombres || '?').trim().charAt(0)}${(u.apellidos || '').trim().charAt(0)}`.toUpperCase();
const dominioDe = (correo) => {
    const partes = (correo || '').split('@');
    return partes.length > 1 ? partes[1].trim().toLowerCase() : 'sin dominio';
};
const resolverUrlFoto = (u) => {
    const raw = u?.foto_perfil || u?.foto || u?.avatar || '';
    if (!raw || typeof raw !== 'string' || !raw.trim()) return '';
    const limpio = raw.trim();
    if (
        limpio.startsWith('http://') ||
        limpio.startsWith('https://') ||
        limpio.startsWith('data:') ||
        limpio.startsWith('blob:')
    ) {
        return limpio;
    }
    const rutaLimpia = limpio.startsWith('/') ? limpio : `/${limpio}`;
    return `${BASE_URL}${rutaLimpia}`;
};

// Usuario que tiene la sesión iniciada (el login lo guarda en localStorage como "user")
const leerUsuarioActual = () => {
    try {
        const raw = JSON.parse(localStorage.getItem('user') || 'null');
        if (!raw || typeof raw !== 'object') return {};
        return raw.user || raw.data || raw;
    } catch {
        return {};
    }
};

const AvatarUsuario = ({ usuario, className = 'w-10 h-10 text-xs' }) => {
    const [errorImagen, setErrorImagen] = useState(false);
    const urlFoto = resolverUrlFoto(usuario);

    useEffect(() => {
        setErrorImagen(false);
    }, [urlFoto]);

    if (urlFoto && !errorImagen) {
        return (
            <img
                src={urlFoto}
                alt={`${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'Usuario'}
                onError={() => setErrorImagen(true)}
                className={`${className} shrink-0 rounded-full object-cover border border-slate-200 transition-transform duration-200 group-hover/fila:scale-110`}
            />
        );
    }

    return (
        <div className={`${className} shrink-0 rounded-full flex items-center justify-center font-bold border border-slate-200 bg-white text-slate-700 transition-transform duration-200 group-hover/fila:scale-110`}>
            {iniciales(usuario)}
        </div>
    );
};

/* Chip de rol: blanco con punto de color */
const RolChip = ({ admin, corto = false }) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
        <span className={`w-1.5 h-1.5 rounded-full ${admin ? 'bg-violet-500' : 'bg-blue-600'}`} />
        {admin ? (corto ? 'Admin' : 'Administrador') : 'Docente'}
    </span>
);

/* Marca de la cuenta con la que se inició sesión */
const EtiquetaTu = () => (
    <span className="inline-flex items-center rounded-md border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold leading-none text-blue-600">
        Tú
    </span>
);

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
const Sparkline = ({ datos, className = 'text-blue-600' }) => {
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
        <svg viewBox={`0 0 ${W} ${H}`} className={`w-[84px] h-[34px] ${className}`} fill="none" aria-hidden="true">
            <path d={`${linea} L${W},${H} L0,${H} Z`} fill="currentColor" opacity="0.07" />
            <path d={linea} pathLength="1" className="lu-draw" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const reducirSerie = (serie, max = 14) => {
    if (serie.length <= max) return serie;
    const paso = (serie.length - 1) / (max - 1);
    return Array.from({ length: max }, (_, i) => serie[Math.round(i * paso)]);
};

/* Tarjeta de estadística: superficie blanca, icono en círculo y punto de color */
const TarjetaResumen = ({ titulo, valor, sufijo = '', badge, punto, icono, acento, spark, sparkColor, pie, retraso }) => {
    const animado = useContador(valor);
    return (
        <div
            className={`lu-fade-up group ${superficie} p-5 rounded-2xl hover:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-300`}
            style={{ animationDelay: `${retraso}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${acento}`}>
                        {icono}
                    </div>
                    <p className="text-xs font-medium text-slate-500 leading-tight">{titulo}</p>
                </div>
                {badge && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 whitespace-nowrap">
                        <i className={`w-1.5 h-1.5 rounded-full ${punto}`} />
                        {badge}
                    </span>
                )}
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                    {Math.round(animado)}<span className="text-xl text-slate-400 font-bold">{sufijo}</span>
                </p>
                {spark && <Sparkline datos={spark} className={sparkColor} />}
            </div>
            {pie && <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">{pie}</div>}
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
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" role="img" aria-label="Distribución de roles">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="butt"
                        strokeDasharray={`${pa} ${100 - pa}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="butt"
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
                    { label: 'Docentes', n: docentes, dot: 'bg-blue-600' },
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
    const [usuarioActual, setUsuarioActual] = useState(leerUsuarioActual);
    const [confirmando, setConfirmando] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    useEffect(() => {
        cargarUsuarios();
    }, []);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtroRol]);

    // Mantiene al día quién tiene la sesión iniciada
    useEffect(() => {
        const sincronizar = () => setUsuarioActual(leerUsuarioActual());
        window.addEventListener('storage', sincronizar);
        window.addEventListener('usuario_actualizado', sincronizar);
        window.addEventListener('user-updated', sincronizar);
        return () => {
            window.removeEventListener('storage', sincronizar);
            window.removeEventListener('usuario_actualizado', sincronizar);
            window.removeEventListener('user-updated', sincronizar);
        };
    }, []);

    // Esc cierra la confirmación
    useEffect(() => {
        if (!confirmando) return undefined;
        const alTeclear = (e) => { if (e.key === 'Escape' && !eliminando) setConfirmando(null); };
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
    }, [confirmando, eliminando]);

    // ¿Esta fila es la cuenta con la que se inició sesión? (por ID y, como respaldo, por correo)
    const esUsuarioActual = (u) => {
        const miId = usuarioActual.id_usuario ?? usuarioActual.id ?? usuarioActual.user_id;
        if (miId !== undefined && miId !== null && String(miId) === String(u.id_usuario)) return true;
        const miCorreo = String(usuarioActual.correo || usuarioActual.email || '').trim().toLowerCase();
        return miCorreo !== '' && miCorreo === String(u.correo || '').trim().toLowerCase();
    };

    const cargarUsuarios = async () => {
        try {
            const res = await api.get('/usuarios');
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

    const pedirEliminar = (u) => {
        if (esUsuarioActual(u)) {
            mostrarAlerta('No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.', 'error');
            return;
        }
        setConfirmando(u);
    };

    const confirmarEliminar = async () => {
        const u = confirmando;
        if (!u) return;
        // Segunda barrera por si la sesión cambió con el diálogo abierto
        if (esUsuarioActual(u)) {
            setConfirmando(null);
            mostrarAlerta('No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.', 'error');
            return;
        }
        setEliminando(true);
        try {
            await api.delete(`/usuarios/${u.id_usuario}`);
            mostrarAlerta('Usuario eliminado con éxito.', 'success');
            cargarUsuarios();
        } catch (error) {
            mostrarAlerta(error?.response?.data?.message || 'No se pudo eliminar el usuario.', 'error');
        } finally {
            setEliminando(false);
            setConfirmando(null);
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
        success: { icono: 'bg-emerald-500', barra: 'bg-emerald-500', Ico: IconCheck },
        error: { icono: 'bg-rose-500', barra: 'bg-rose-500', Ico: IconAlert },
        info: { icono: 'bg-blue-600', barra: 'bg-blue-600', Ico: IconInfo },
    };
    const ea = estilosAlerta[alerta.tipo] || estilosAlerta.info;

    const columnas = [
        { campo: 'nombres', label: 'Usuario' },
        { campo: 'correo', label: 'Correo Electrónico' },
        { campo: 'rol', label: 'Rol Asignado' },
    ];

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-6 p-3 sm:p-5 md:p-6">
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
                        className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-700 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${foco}`}
                    >
                        <IconDownload />
                        Exportar
                    </button>
                    <button
                        onClick={onIrCrear}
                        className={`group inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 ${foco}`}
                    >
                        <span className="transition-transform duration-300 group-hover:rotate-90"><IconPlus /></span>
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Alerta */}
            {alerta.mensaje && (
                <div className="lu-alert-in relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-800 shadow-sm" role="status">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white [&>svg]:h-4 [&>svg]:w-4 ${ea.icono}`}><ea.Ico /></span>
                    <span className="flex-1">{alerta.mensaje}</span>
                    <button
                        onClick={() => setAlerta({ mensaje: '', tipo: '' })}
                        className="text-slate-400 hover:text-slate-900 transition-colors text-lg leading-none px-1"
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
                    icono={<IconUsers />} acento="text-blue-600"
                    badge="Total" punto="bg-blue-600"
                    spark={stats.serieTotal} sparkColor="text-blue-600"
                    pie="Cuentas con acceso al portal" retraso={60}
                />
                <TarjetaResumen
                    titulo="Administradores" valor={totalAdmins}
                    icono={<IconShield />} acento="text-violet-600"
                    badge={`${pct(totalAdmins)}%`} punto="bg-violet-500"
                    spark={stats.serieAdmin} sparkColor="text-violet-500"
                    pie="Acceso total al sistema" retraso={120}
                />
                <TarjetaResumen
                    titulo="Docentes Asesores" valor={totalDocentes}
                    icono={<IconCap />} acento="text-cyan-600"
                    badge={`${pct(totalDocentes)}%`} punto="bg-cyan-500"
                    spark={stats.serieDoc} sparkColor="text-cyan-500"
                    pie="Plantel docente de prácticas" retraso={180}
                />
                <TarjetaResumen
                    titulo="Dominio de correo principal" valor={pctDominioTop} sufijo="%"
                    icono={<IconMail />} acento="text-emerald-600"
                    badge="Correos" punto="bg-emerald-500"
                    pie={
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pctDominioTop}%` }} />
                            </div>
                            <p className="truncate">@{dominioTop ? dominioTop[0] : '—'}</p>
                        </div>
                    }
                    retraso={240}
                />
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 items-start">
                {/* Tabla */}
                <div className={`lu-fade-up 2xl:col-span-2 ${superficie} rounded-2xl overflow-hidden`} style={{ animationDelay: '300ms' }}>
                    <div className="px-6 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200">
                        <div className="space-y-1">
                            <h2 className="text-base font-bold text-slate-900">Lista de Usuarios</h2>
                            <p className="text-xs text-slate-500">Gestiona y controla los accesos al sistema.</p>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            {/* Filtro por rol */}
                            <div className="flex flex-wrap gap-1.5 self-start" role="group" aria-label="Filtrar por rol">
                                {tabs.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setFiltroRol(t.id)}
                                        aria-pressed={filtroRol === t.id}
                                        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 active:scale-95 ${foco} ${
                                            filtroRol === t.id
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                        }`}
                                    >
                                        {t.label}
                                        <span className={`tabular-nums text-[10px] ${filtroRol === t.id ? 'text-white/80' : 'text-slate-400'}`}>
                                            {t.cant}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Búsqueda */}
                            <div className="relative group">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
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
                                <tr className="text-[11px] uppercase font-semibold tracking-wider text-slate-500 border-b border-slate-200">
                                    {columnas.map((c) => (
                                        <th key={c.campo} className="py-3.5 px-6 text-left">
                                            <button
                                                onClick={() => cambiarOrden(c.campo)}
                                                className={`group inline-flex items-center gap-1.5 uppercase tracking-wider font-semibold hover:text-slate-900 transition-colors rounded ${foco}`}
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
                                            <td className="py-4 px-6"><div className="lu-skeleton h-6 w-28 rounded-full" /></td>
                                            <td className="py-4 px-6"><div className="lu-skeleton h-8 w-24 rounded-lg ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : usuariosPagina.length > 0 ? (
                                    usuariosPagina.map((u, i) => {
                                        const soyYo = esUsuarioActual(u);
                                        return (
                                            <tr
                                                key={u.id_usuario}
                                                className="lu-row-in group/fila hover:bg-slate-50 transition-colors duration-200"
                                                style={{ animationDelay: `${i * 45}ms` }}
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3.5">
                                                        <AvatarUsuario usuario={u} className="w-10 h-10 text-xs" />
                                                        <div className="space-y-0.5">
                                                            <p className="flex items-center gap-2 font-semibold text-slate-900 leading-tight">
                                                                {u.nombres} {u.apellidos}
                                                                {soyYo && <EtiquetaTu />}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400">ID #{u.id_usuario}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 text-[13px]">{u.correo}</td>
                                                <td className="py-4 px-6"><RolChip admin={u.id_rol === 1} /></td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover/fila:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={() => editarUsuario(u)}
                                                            title="Editar usuario"
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-white border border-slate-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white active:scale-95 text-xs font-semibold rounded-lg transition-all duration-200 ${foco}`}
                                                        >
                                                            <IconEdit />
                                                            Editar
                                                        </button>
                                                        {soyYo ? (
                                                            <span title="No puedes eliminar tu propia cuenta" className="inline-flex">
                                                                <button
                                                                    disabled
                                                                    aria-label="No puedes eliminar tu propia cuenta"
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-400 bg-white border border-dashed border-slate-300 text-xs font-semibold rounded-lg cursor-not-allowed"
                                                                >
                                                                    <IconLock />
                                                                    Eliminar
                                                                </button>
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => pedirEliminar(u)}
                                                                title="Eliminar usuario"
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-white border border-slate-200 hover:bg-rose-600 hover:border-rose-600 hover:text-white active:scale-95 text-xs font-semibold rounded-lg transition-all duration-200 ${foco}`}
                                                            >
                                                                <IconTrash />
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-16">
                                            <div className="lu-fade-up flex flex-col items-center text-center space-y-1">
                                                <div className="w-14 h-14 rounded-full border border-slate-200 text-blue-600 flex items-center justify-center mb-3">
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
                    <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <span>
                            Mostrando{' '}
                            <strong className="text-slate-800">
                                {usuariosFiltrados.length === 0 ? 0 : inicio + 1}–{Math.min(inicio + POR_PAGINA, usuariosFiltrados.length)}
                            </strong>{' '}
                            de <strong className="text-slate-800">{usuariosFiltrados.length}</strong> usuarios
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPagina(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all ${foco}`}
                                aria-label="Página anterior"
                            >
                                <IconChevronL />
                            </button>
                            {[...Array(totalPaginas)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPagina(i + 1)}
                                    aria-current={paginaActual === i + 1 ? 'page' : undefined}
                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${foco} ${
                                        paginaActual === i + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
                                disabled={paginaActual === totalPaginas}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all ${foco}`}
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
                    <div className={`lu-fade-up ${superficie} rounded-2xl p-6 space-y-5 hover:shadow-md transition-shadow duration-300`} style={{ animationDelay: '380ms' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Distribución de Roles</h3>
                            <p className="text-xs text-slate-500">Proporción de accesos por tipo de usuario.</p>
                        </div>
                        <DonaRoles admins={totalAdmins} docentes={totalDocentes} />
                    </div>

                    {/* Dominios de correo */}
                    <div className={`lu-fade-up ${superficie} rounded-2xl p-6 space-y-5 hover:shadow-md transition-shadow duration-300`} style={{ animationDelay: '440ms' }}>
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
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${['bg-blue-600', 'bg-violet-500', 'bg-cyan-500', 'bg-slate-400'][i]}`}
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
                    <div className={`lu-fade-up ${superficie} rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow duration-300`} style={{ animationDelay: '500ms' }}>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">Últimos Registrados</h3>
                            <p className="text-xs text-slate-500">Cuentas más recientes del sistema.</p>
                        </div>
                        <ul className="space-y-1">
                            {stats.recientes.map((u) => (
                                <li key={u.id_usuario} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                                    <AvatarUsuario usuario={u} className="w-9 h-9 text-[11px]" />
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 leading-tight">
                                            <span className="truncate">{u.nombres} {u.apellidos}</span>
                                            {esUsuarioActual(u) && <EtiquetaTu />}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.correo}</p>
                                    </div>
                                    <RolChip admin={u.id_rol === 1} corto />
                                </li>
                            ))}
                            {stats.recientes.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Aún no hay usuarios.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Confirmación de eliminación */}
            {confirmando && (
                <div
                    className="lu-fade fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => { if (e.target === e.currentTarget && !eliminando) setConfirmando(null); }}
                >
                    <div role="dialog" aria-modal="true" aria-label="Eliminar usuario" className="lu-modal w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start gap-3.5 border-b border-slate-100 px-6 py-5">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-rose-600 shadow-sm"><IconTrash /></span>
                            <div>
                                <h3 className="text-[16px] font-extrabold text-slate-900">Eliminar usuario</h3>
                                <p className="mt-0.5 text-[12px] text-slate-500">Esta acción no se puede deshacer.</p>
                            </div>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
                                <AvatarUsuario usuario={confirmando} className="w-11 h-11 text-xs" />
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-bold text-slate-900">{confirmando.nombres} {confirmando.apellidos}</p>
                                    <p className="truncate text-[11px] text-slate-500">{confirmando.correo}</p>
                                </div>
                                <span className="ml-auto"><RolChip admin={confirmando.id_rol === 1} corto /></span>
                            </div>
                            <p className="text-[12px] text-slate-500">Perderá el acceso al portal EFSRT de inmediato.</p>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                    onClick={() => setConfirmando(null)}
                                    disabled={eliminando}
                                    className={`h-11 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition disabled:opacity-50 ${foco}`}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarEliminar}
                                    disabled={eliminando}
                                    className={`h-11 rounded-lg bg-rose-600 text-[12px] font-bold text-white hover:bg-rose-700 active:scale-95 transition disabled:opacity-70 flex items-center justify-center gap-2 ${foco}`}
                                >
                                    {eliminando ? (
                                        <>
                                            <svg className="lu-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.55" /></svg>
                                            Eliminando…
                                        </>
                                    ) : (
                                        <>
                                            <IconTrash /> Sí, eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}