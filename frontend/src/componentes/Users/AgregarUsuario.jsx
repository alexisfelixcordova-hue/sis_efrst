import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

/* ---------- Animaciones (keyframes propios) ---------- */
const estilosAnimaciones = `
@keyframes au-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes au-field-in { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes au-alert-in { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes au-progress { from { width: 100%; } to { width: 0%; } }
@keyframes au-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-14px) scale(1.08); } }
@keyframes au-spin { to { transform: rotate(360deg); } }
@keyframes au-pop { 0% { transform: scale(.5); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
@keyframes au-rise { 0% { transform: translateY(0) scale(1); opacity: 0; } 20% { opacity: .9; } 100% { transform: translateY(-110px) scale(.4); opacity: 0; } }
@keyframes au-wave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes au-breath { 0%,100% { transform: translateY(0); } 50% { transform: translateY(1.5px); } }
@keyframes au-blink { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
@keyframes au-shine { from { transform: translateX(-120%) skewX(-18deg); } to { transform: translateX(320%) skewX(-18deg); } }
.au-fade-up { animation: au-fade-up .55s cubic-bezier(.22,1,.36,1) both; }
.au-field-in { animation: au-field-in .35s cubic-bezier(.22,1,.36,1) both; }
.au-alert-in { animation: au-alert-in .35s cubic-bezier(.22,1,.36,1) both; }
.au-progress { animation: au-progress 4s linear forwards; }
.au-blob { animation: au-float 10s ease-in-out infinite; }
.au-spin { animation: au-spin .8s linear infinite; }
.au-pop { animation: au-pop .4s cubic-bezier(.22,1,.36,1) both; }
.au-rise { animation: au-rise 5s ease-in infinite; }
.au-wave { animation: au-wave 7s linear infinite; }
.au-breath { animation: au-breath 3s ease-in-out infinite; }
.au-blink { transform-box: fill-box; transform-origin: center; animation: au-blink 5s infinite; }
.au-tilt { transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform .2s ease-out; will-change: transform; }
.au-glare { background: radial-gradient(260px circle at var(--gx, 50%) var(--gy, 0%), rgba(255,255,255,.35), transparent 60%); mix-blend-mode: soft-light; opacity: 0; transition: opacity .3s; }
.au-tilt:hover .au-glare { opacity: 1; }
.au-btn { position: relative; overflow: hidden; }
.au-btn:not(:disabled):hover::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 30%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
    animation: au-shine .8s ease-out;
}
@media (prefers-reduced-motion: reduce) {
    .au-fade-up, .au-field-in, .au-alert-in, .au-progress, .au-blob, .au-spin, .au-pop, .au-rise, .au-wave, .au-breath, .au-blink { animation: none !important; }
    .au-tilt { transform: none !important; }
    .au-btn:hover::after { animation: none !important; }
}
`;

/* ---------- Iconos (SVG inline) ---------- */
const Icon = ({ children, className = 'w-4 h-4', stroke = 2 }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {children}
    </svg>
);
const IconBack = () => (<Icon><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>);
const IconUser = () => (<Icon><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></Icon>);
const IconMail = () => (<Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>);
const IconLock = () => (<Icon><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>);
const IconPhone = () => (<Icon><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Icon>);
const IconId = () => (<Icon><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M6 9h4M6 13h8" /></Icon>);
const IconEye = () => (<Icon><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>);
const IconEyeOff = () => (<Icon><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icon>);
const IconShield = () => (<Icon className="w-5 h-5"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /></Icon>);
const IconCap = () => (<Icon className="w-5 h-5"><path d="M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5" /></Icon>);
const IconCheck = ({ className = 'w-4 h-4' }) => (<Icon className={className} stroke={2.5}><path d="m5 12 5 5 9-10" /></Icon>);
const IconCheckCircle = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>);
const IconAlert = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></Icon>);
const IconCamera = ({ className = 'w-5 h-5' }) => (<Icon className={className}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" /></Icon>);
const IconTrash = () => (<Icon className="w-3.5 h-3.5"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Icon>);

/* ---------- Helpers de presentación ---------- */
const claseInput =
    'w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200';

const Campo = ({ label, requerido, icono, className = '', children }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {label} {requerido && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                {icono}
            </span>
            {children}
        </div>
    </div>
);

const permisos = {
    '1': ['Gestión de usuarios y roles', 'Empresas de convenio', 'Reportes y estadísticas', 'Constancias y titulación'],
    '2': ['Seguimiento de estudiantes asignados', 'Validación de horas EFSRT', 'Revisión de informes', 'Autoregistro en Plantel Docente'],
};

const AvatarIlustrado = ({ esDocente }) => (
    <svg viewBox="0 0 96 96" className="w-full h-full">
        <defs>
            <linearGradient id="au-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={esDocente ? '#dbeafe' : '#ede9fe'} />
                <stop offset="100%" stopColor={esDocente ? '#bae6fd' : '#c7d2fe'} />
            </linearGradient>
        </defs>
        <rect width="96" height="96" fill="url(#au-bg)" />
        <path className="au-breath" d="M10 100c0-20 16-32 38-32s38 12 38 32z" fill={esDocente ? '#2563eb' : '#6d28d9'} />
        <path d="M40 68l8 10 8-10" fill="#fff" opacity=".9" />
        <rect x="43" y="56" width="10" height="14" rx="4" fill="#f5c9a0" />
        <circle cx="48" cy="42" r="16" fill="#fcd9b6" />
        <path d="M32 40c0-12 8-18 17-18s17 6 15 18c-3-6-8-9-16-9s-13 3-16 9z" fill="#3b2a20" />
        <circle cx="42" cy="44" r="1.8" fill="#3b2a20" className="au-blink" />
        <circle cx="54" cy="44" r="1.8" fill="#3b2a20" className="au-blink" />
        <path d="M43 50q5 4 10 0" stroke="#b45f3c" strokeWidth="2" strokeLinecap="round" fill="none" />
        {esDocente ? (
            <g key="doc" className="au-pop">
                <path d="M22 28L48 16l26 12-26 12z" fill="#0f172a" />
                <path d="M36 35v8c4 3 20 3 24 0v-8" fill="#1e293b" />
                <path d="M72 29v12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <circle cx="72" cy="43" r="2.5" fill="#f59e0b" />
            </g>
        ) : (
            <g key="adm" className="au-pop">
                <path d="M62 72l8-3 8 3v7c0 5-4 8-8 9-4-1-8-4-8-9z" fill="#fbbf24" />
                <path d="m66 79 3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
        )}
    </svg>
);

export default function AgregarUsuario({ onVolver }) {
    const [formData, setFormData] = useState({
        dni: '',
        name: '',
        apellidos: '',
        correo: '', // Usando 'correo' para conectar directo con Laravel
        password: '',
        rol_id: '2',
        telefono: ''
    });
    const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' });
    const [cargando, setCargando] = useState(false);
    const [verPass, setVerPass] = useState(false);
    const [foto, setFoto] = useState(null);
    const [fotoUrl, setFotoUrl] = useState('');
    const inputFoto = useRef(null);
    const tokenSesion = localStorage.getItem('token');

    useEffect(() => () => { if (fotoUrl) URL.revokeObjectURL(fotoUrl); }, [fotoUrl]);

    const mostrarAlerta = (mensaje, tipo) => {
        setAlerta({ mensaje, tipo });
        setTimeout(() => setAlerta({ mensaje: '', tipo: '' }), 4000);
    };

    const elegirFoto = (e) => {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if (!archivo) return;
        if (!archivo.type.startsWith('image/')) return mostrarAlerta('Selecciona un archivo de imagen.', 'error');
        if (archivo.size > 2 * 1024 * 1024) return mostrarAlerta('La foto no debe superar los 2 MB.', 'error');
        setFoto(archivo);
        setFotoUrl(URL.createObjectURL(archivo));
    };
    const quitarFoto = () => { setFoto(null); setFotoUrl(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            let cuerpo = formData;
            if (foto) {
                cuerpo = new FormData();
                Object.entries(formData).forEach(([k, v]) => cuerpo.append(k, v));
                cuerpo.append('foto', foto);
            }
            await axios.post(`${API_URL}/usuarios`, cuerpo, {
                headers: { 
                    'Authorization': `Bearer ${tokenSesion}`, 
                    'Accept': 'application/json' 
                }
            });
            mostrarAlerta('¡Usuario creado y registrado correctamente en el sistema!', 'success');
            setTimeout(() => onVolver(), 1500);
        } catch (error) {
            mostrarAlerta(error.response?.data?.message || 'Error al registrar el usuario.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const esDocente = formData.rol_id === '2';
    const nombreVista = `${formData.name} ${formData.apellidos}`.trim();

    const texto = formData.dni + formData.name + formData.apellidos + formData.correo;
    const semilla = texto.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const barras = Array.from({ length: 34 }, (_, i) => {
        const cod = texto.charCodeAt(i % Math.max(1, texto.length)) || 60;
        return 35 + ((cod * (i + 3) + semilla) % 66);
    });

    const ea = alerta.tipo === 'success'
        ? { caja: 'bg-emerald-50 text-emerald-800 border-emerald-200', icono: 'text-emerald-500', barra: 'bg-emerald-400', Ico: IconCheckCircle }
        : { caja: 'bg-rose-50 text-rose-800 border-rose-200', icono: 'text-rose-500', barra: 'bg-rose-400', Ico: IconAlert };

    const roles = [
        { id: '2', t: 'Docente', s: 'Se autoregistrará en Plantel Docente', Ico: IconCap, on: 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10', chip: 'bg-blue-600 text-white', off: 'bg-sky-50 text-sky-600' },
        { id: '1', t: 'Administrador', s: 'Acceso total al sistema', Ico: IconShield, on: 'border-violet-500 bg-violet-50/60 ring-4 ring-violet-500/10', chip: 'bg-violet-600 text-white', off: 'bg-violet-50 text-violet-600' },
    ];

    return (
        <div className="w-full p-5 md:p-6 space-y-6">
            <style>{estilosAnimaciones}</style>

            {/* Cabecera */}
            <div className="au-fade-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Nuevo Usuario</h1>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-100">Alta de cuenta</span>
                    </div>
                    <p className="text-sm text-slate-500">Asigne credenciales y permisos de acceso institucional.</p>
                </div>
                <button
                    onClick={onVolver}
                    className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200"
                >
                    <span className="transition-transform duration-200 group-hover:-translate-x-1"><IconBack /></span>
                    Volver a la Lista
                </button>
            </div>

            {/* Alerta */}
            {alerta.mensaje && (
                <div className={`au-alert-in relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium border shadow-sm ${ea.caja}`} role="status">
                    <span className={ea.icono}><ea.Ico /></span>
                    <span className="flex-1">{alerta.mensaje}</span>
                    <button
                        type="button"
                        onClick={() => setAlerta({ mensaje: '', tipo: '' })}
                        className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none px-1"
                        aria-label="Cerrar alerta"
                    >
                        ×
                    </button>
                    <span className={`au-progress absolute bottom-0 left-0 h-0.5 ${ea.barra}`} />
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* ================= FORMULARIO ================= */}
                <form
                    onSubmit={handleSubmit}
                    className="au-fade-up xl:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    style={{ animationDelay: '80ms' }}
                >
                    <div className="px-6 pt-5 pb-4 border-b border-slate-100 space-y-0.5">
                        <h2 className="text-base font-bold text-slate-900">Datos de la cuenta</h2>
                        <p className="text-xs text-slate-500">Completa los campos obligatorios para habilitar el registro.</p>
                    </div>

                    <div className="p-6 space-y-7">
                        {/* Selector de rol */}
                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rol del Sistema <span className="text-rose-500">*</span></label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {roles.map(r => {
                                    const activo = formData.rol_id === r.id;
                                    return (
                                        <button
                                            type="button"
                                            key={r.id}
                                            onClick={() => setFormData({ ...formData, rol_id: r.id })}
                                            className={`relative text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${activo ? r.on : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                        >
                                            <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 ${activo ? r.chip : r.off}`}>
                                                <r.Ico />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-bold text-slate-900">{r.t}</span>
                                                <span className="block text-xs text-slate-500 leading-snug">{r.s}</span>
                                            </span>
                                            <span className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${activo ? 'bg-blue-600 text-white scale-100 opacity-100' : 'bg-slate-100 scale-75 opacity-0'}`}>
                                                <IconCheck className="w-3 h-3" />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Datos personales */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full bg-blue-600" /> Datos personales
                            </p>

                            {/* Foto */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40 transition-colors duration-300">
                                <button
                                    type="button"
                                    onClick={() => inputFoto.current?.click()}
                                    className="group relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200 hover:ring-blue-400 transition-all"
                                    aria-label="Elegir foto"
                                >
                                    {fotoUrl ? (
                                        <img key={fotoUrl} src={fotoUrl} alt="Foto del usuario" className="au-pop w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors"><IconCamera className="w-6 h-6" /></span>
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">Foto del usuario</p>
                                    <p className="text-xs text-slate-500">JPG o PNG, máximo 2 MB.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {fotoUrl && (
                                        <button
                                            type="button"
                                            onClick={quitarFoto}
                                            className="au-pop inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg transition-colors"
                                        >
                                            <IconTrash /> Quitar
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => inputFoto.current?.click()}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white active:scale-95 rounded-lg transition-all duration-200"
                                    >
                                        <IconCamera className="w-4 h-4" /> {fotoUrl ? 'Cambiar' : 'Subir foto'}
                                    </button>
                                </div>
                                <input ref={inputFoto} type="file" accept="image/*" onChange={elegirFoto} className="hidden" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Campo label="DNI" requerido icono={<IconId />}>
                                    <input
                                        type="text"
                                        maxLength="15"
                                        value={formData.dni}
                                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                        placeholder="Ej. 45678996"
                                        className={claseInput}
                                        required
                                    />
                                </Campo>

                                <Campo label="Nombres" requerido icono={<IconUser />}>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Juan Carlos"
                                        className={claseInput}
                                        required
                                    />
                                </Campo>

                                <Campo label="Apellidos" requerido icono={<IconUser />}>
                                    <input
                                        type="text"
                                        value={formData.apellidos}
                                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                        placeholder="Ej. Pérez Gómez"
                                        className={claseInput}
                                        required
                                    />
                                </Campo>

                                <Campo label="Teléfono / Celular" icono={<IconPhone />}>
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        placeholder="987654321"
                                        className={claseInput}
                                    />
                                </Campo>
                            </div>
                        </div>

                        {/* Acceso */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full bg-violet-500" /> Credenciales de acceso
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Campo label="Correo Electrónico" requerido icono={<IconMail />}>
                                    <input
                                        type="email"
                                        value={formData.correo}
                                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                                        placeholder="correo@institucion.edu.pe"
                                        className={claseInput}
                                        required
                                    />
                                </Campo>

                                <Campo label="Contraseña" requerido icono={<IconLock />}>
                                    <input
                                        type={verPass ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                        className={`${claseInput} pr-11`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVerPass(v => !v)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                        aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {verPass ? <IconEyeOff /> : <IconEye />}
                                    </button>
                                </Campo>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-[11px] text-slate-400"><span className="text-rose-500">*</span> Campos obligatorios</p>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onVolver}
                                className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={cargando}
                                className="au-btn flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {cargando ? (
                                    <>
                                        <svg className="au-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <IconCheck />
                                        Guardar y Vincular Usuario
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* ================= VISTA PREVIA EN VIVO ================= */}
                <aside className="xl:col-span-4 space-y-6 xl:sticky xl:top-6">
                    <div className="au-fade-up" style={{ animationDelay: '160ms', perspective: '1000px' }}>
                        <div
                            className="au-tilt relative overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-900/5"
                            onMouseMove={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                const px = (e.clientX - r.left) / r.width;
                                const py = (e.clientY - r.top) / r.height;
                                const el = e.currentTarget;
                                el.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
                                el.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
                                el.style.setProperty('--gx', `${px * 100}%`);
                                el.style.setProperty('--gy', `${py * 100}%`);
                            }}
                            onMouseLeave={(e) => {
                                const el = e.currentTarget;
                                el.style.setProperty('--ry', '0deg');
                                el.style.setProperty('--rx', '0deg');
                            }}
                        >
                            <div className="au-glare absolute inset-0 z-20 pointer-events-none" />

                            <div className={`relative h-32 overflow-hidden transition-colors duration-700 ${esDocente ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400' : 'bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500'}`}>
                                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                <div className="au-blob absolute -top-12 -right-8 w-44 h-44 rounded-full bg-white/20 blur-2xl" />
                                <div className="au-blob absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-sky-200/30 blur-2xl" style={{ animationDelay: '-4s' }} />

                                {[12, 28, 46, 63, 80, 92].map((l, i) => (
                                    <span
                                        key={l}
                                        className="au-rise absolute bottom-0 w-1.5 h-1.5 rounded-full bg-white/70"
                                        style={{ left: `${l}%`, animationDelay: `${i * 0.7}s` }}
                                    />
                                ))}

                                <div className="absolute inset-x-0 bottom-0 h-10 overflow-hidden leading-none opacity-30">
                                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="au-wave relative block w-full h-10 fill-white">
                                        <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,30 L1200,120 L0,120 Z" />
                                    </svg>
                                </div>

                                <div className="relative p-6 flex items-center gap-4 text-white">
                                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md p-0.5 shadow-inner overflow-hidden ring-2 ring-white/40">
                                        {fotoUrl ? (
                                            <img src={fotoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                                        ) : (
                                            <AvatarIlustrado esDocente={esDocente} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-extrabold tracking-wider uppercase">
                                                {esDocente ? 'Plantel Docente' : 'Administrador'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-extrabold truncate mt-1 tracking-tight">
                                            {nombreVista || 'Nuevo Usuario'}
                                        </h3>
                                        <p className="text-xs text-white/80 truncate">
                                            {formData.correo || 'correo@institucion.edu.pe'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5 bg-white">
                                <div className="flex items-center justify-between text-xs pb-4 border-b border-slate-100">
                                    <span className="text-slate-400 font-medium">DNI Institucional</span>
                                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                                        {formData.dni || 'Sin registrar'}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Permisos habilitados</p>
                                    <ul className="space-y-2">
                                        {permisos[formData.rol_id].map((p, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                                                <span className="mt-0.5 text-blue-600 shrink-0"><IconCheck className="w-4 h-4" /></span>
                                                <span className="leading-snug">{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                        <span>CÓDIGO DE BARRAS</span>
                                        <span>VER. 2026</span>
                                    </div>
                                    <div className="h-9 flex items-center justify-between bg-slate-50 px-3 rounded-xl border border-slate-100 overflow-hidden">
                                        {barras.map((w, i) => (
                                            <span
                                                key={i}
                                                className="bg-slate-800 rounded-full"
                                                style={{ width: `${w % 3 === 0 ? 2 : 1.5}px`, height: `${w}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}