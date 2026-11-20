import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const DOMINIO = 'worldnic.edu.pe';

/* ---------- Iconos ---------- */
const Icon = ({ children, className = 'w-4 h-4', stroke = 2 }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        {children}
    </svg>
);
const IconBack = () => (<Icon className="w-3.5 h-3.5"><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>);
const IconSave = () => (<Icon className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></Icon>);
const IconUser = ({ className = 'w-5 h-5' }) => (<Icon className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></Icon>);
const IconShield = () => (<Icon className="w-4 h-4"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /></Icon>);
const IconCap = () => (<Icon className="w-4 h-4"><path d="M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5" /></Icon>);
const IconCheck = ({ className = 'w-3.5 h-3.5' }) => (<Icon className={className} stroke={2.5}><path d="m5 12 5 5 9-10" /></Icon>);
const IconCheckCircle = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>);
const IconAlert = () => (<Icon className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></Icon>);
const IconClose = () => (<Icon><path d="M6 6l12 12M18 6 6 18" /></Icon>);
const IconUpload = () => (<Icon className="w-3.5 h-3.5"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></Icon>);
const IconEye = () => (<Icon><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>);
const IconEyeOff = () => (<Icon><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icon>);
const IconChevron = ({ abierto }) => (
    <Icon className={`w-4 h-4 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></Icon>
);

/* ---------- Datos ---------- */
const roles = [
    { id: '2', t: 'Docente', s: 'Asesor de prácticas EFSRT', Ico: IconCap, color: '#2563eb' },
    { id: '1', t: 'Administrador', s: 'Acceso total al sistema', Ico: IconShield, color: '#0f172a' },
];

const permisos = {
    '1': ['Usuarios y roles', 'Empresas de convenio', 'Reportes y estadísticas', 'Constancias y titulación'],
    '2': ['Seguimiento de estudiantes', 'Validación de horas EFSRT', 'Revisión de informes', 'Registro en Plantel Docente'],
};

const claseInput =
    'w-full h-9 px-3 text-xs text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-colors';

/* ---------- Utilidades ---------- */
const sinTildes = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

const fuerza = (p) => {
    let n = 0;
    if (p.length >= 8) n++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) n++;
    if (/\d/.test(p)) n++;
    if (/[^A-Za-z0-9]/.test(p)) n++;
    return p.length === 0 ? 0 : Math.max(1, n);
};
const etiquetaFuerza = ['Sin definir', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];
const colorFuerza = ['', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

const hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    h ^= h >>> 15;
    h = Math.imul(h, 2246822519);
    h ^= h >>> 13;
    return h >>> 0;
};

/* ---------- Animaciones (solo entradas y respuestas a acciones) ---------- */
const estilos = `
@keyframes au-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes au-pop { 0% { opacity: 0; transform: scale(.6); } 70% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes au-drop { from { opacity: 0; transform: translateY(-6px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes au-toast { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
@keyframes au-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes au-ring { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,.45); } 100% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } }
@keyframes au-item { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.au-in { animation: au-in .5s cubic-bezier(.22,1,.36,1) both; }
.au-pop { animation: au-pop .35s cubic-bezier(.22,1,.36,1) both; }
.au-drop { transform-origin: top; animation: au-drop .18s ease-out both; }
.au-toast { animation: au-toast .35s cubic-bezier(.22,1,.36,1) both; }
.au-bar { transform-origin: left; animation: au-bar 4s linear forwards; }
.au-ring { animation: au-ring 1.1s ease-out 2; }
.au-item { animation: au-item .3s ease-out both; }
.au-cell { transform-box: fill-box; transform-origin: center; animation: au-pop .3s cubic-bezier(.22,1,.36,1) both; }
@media (prefers-reduced-motion: reduce) {
  .au-in, .au-pop, .au-drop, .au-toast, .au-bar, .au-ring, .au-item, .au-cell { animation: none !important; }
}
`;

// Cuenta suavemente hasta el nuevo valor
const useNumero = (objetivo, duracion = 400) => {
    const [v, setV] = useState(objetivo);
    const previo = useRef(objetivo);
    useEffect(() => {
        const desde = previo.current;
        const t0 = performance.now();
        let raf;
        const paso = (t) => {
            const p = Math.min((t - t0) / duracion, 1);
            setV(Math.round(desde + (objetivo - desde) * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(paso);
            else previo.current = objetivo;
        };
        raf = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(raf);
    }, [objetivo, duracion]);
    return v;
};

/* ---------- Componentes base ---------- */
const Tarjeta = ({ titulo, sub, derecha, retardo = 0, className = '', children }) => (
    <section className={`au-in bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`} style={{ animationDelay: `${retardo}ms` }}>
        <header className="flex items-start justify-between gap-3 px-5 pt-4">
            <div>
                <h2 className="text-[13px] font-bold text-slate-900">{titulo}</h2>
                {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
            </div>
            {derecha}
        </header>
        <div className="p-5 pt-4">{children}</div>
    </section>
);

const Campo = ({ id, label, requerido, ayuda, className = '', children }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label htmlFor={id} className="block text-[11px] font-semibold text-slate-600">
            {label} {requerido && <span className="text-rose-500" aria-hidden="true">*</span>}
        </label>
        {children}
        {ayuda && <p className="text-[10px] text-slate-400">{ayuda}</p>}
    </div>
);

// Avatar único: foto, o un patrón simétrico generado con los datos de la persona
const Avatar = ({ fotoUrl, semilla, color, className = 'w-9 h-9' }) => {
    const celdas = [];
    if (!fotoUrl && semilla) {
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 3; x++) {
                if (hash(`${semilla}:${y}:${x}`) % 2 === 0) {
                    celdas.push([x, y]);
                    if (x < 2) celdas.push([4 - x, y]);
                }
            }
        }
    }
    return (
        <span className={`${className} shrink-0 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400`}>
            {fotoUrl ? (
                <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : semilla ? (
                <svg viewBox="-0.5 -0.5 6 6" className="w-full h-full p-[18%]" aria-hidden="true">
                    {celdas.map(([x, y]) => (
                        <rect key={`${semilla}-${x}-${y}`} className="au-cell" x={x + 0.04} y={y + 0.04} width="0.92" height="0.92" rx="0.2" fill={color} />
                    ))}
                </svg>
            ) : (
                <IconUser />
            )}
        </span>
    );
};

/* ---------- Selector de rol (listbox accesible) ---------- */
const SelectorRol = ({ valor, onChange }) => {
    const [abierto, setAbierto] = useState(false);
    const [hi, setHi] = useState(0);
    const ref = useRef(null);
    const actual = roles.find((r) => r.id === valor) || roles[0];

    useEffect(() => {
        const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
    }, []);

    const abrir = () => {
        setHi(Math.max(0, roles.findIndex((r) => r.id === valor)));
        setAbierto(true);
    };
    const elegir = (r) => {
        onChange(r.id);
        setAbierto(false);
    };
    const onKey = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!abierto) return abrir();
            setHi((h) => (e.key === 'ArrowDown' ? (h + 1) % roles.length : (h - 1 + roles.length) % roles.length));
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abierto ? elegir(roles[hi]) : abrir();
        } else if (e.key === 'Escape') {
            setAbierto(false);
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                id="au-rol"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={abierto}
                aria-controls="au-rol-lista"
                onClick={() => (abierto ? setAbierto(false) : abrir())}
                onKeyDown={onKey}
                className="w-full flex items-center gap-2.5 h-11 pl-2 pr-3 text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
            >
                <span key={actual.id} className="au-pop w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-white" style={{ background: actual.color }}>
                    <actual.Ico />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-900 leading-tight">{actual.t}</span>
                    <span className="block text-[10px] text-slate-500 truncate">{actual.s}</span>
                </span>
                <span className="text-slate-400"><IconChevron abierto={abierto} /></span>
            </button>

            {abierto && (
                <ul
                    id="au-rol-lista"
                    role="listbox"
                    aria-labelledby="au-rol"
                    className="au-drop absolute z-30 left-0 right-0 mt-1 p-1 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/10"
                >
                    {roles.map((r, i) => {
                        const sel = r.id === valor;
                        return (
                            <li
                                key={r.id}
                                role="option"
                                aria-selected={sel}
                                onMouseEnter={() => setHi(i)}
                                onClick={() => elegir(r)}
                                className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer ${hi === i ? 'bg-slate-100' : ''}`}
                            >
                                <span className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-white" style={{ background: r.color }}>
                                    <r.Ico />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-xs font-bold text-slate-900 leading-tight">{r.t}</span>
                                    <span className="block text-[10px] text-slate-500">{r.s}</span>
                                </span>
                                {sel && <span className="text-blue-600"><IconCheck /></span>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default function AgregarUsuario({ onVolver }) {
    const [formData, setFormData] = useState({
        dni: '',
        name: '',
        apellidos: '',
        correo: '',
        password: '',
        rol_id: '2',
        telefono: ''
    });
    const [alerta, setAlerta] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [registrado, setRegistrado] = useState(false);
    const [verPass, setVerPass] = useState(false);
    const [foto, setFoto] = useState(null);
    const [fotoUrl, setFotoUrl] = useState('');
    const inputFoto = useRef(null);
    const tokenSesion = localStorage.getItem('token');

    useEffect(() => () => { if (fotoUrl) URL.revokeObjectURL(fotoUrl); }, [fotoUrl]);

    useEffect(() => {
        if (!alerta) return;
        const t = setTimeout(() => setAlerta(null), 4000);
        return () => clearTimeout(t);
    }, [alerta]);

    const mostrarAlerta = (mensaje, tipo) => setAlerta({ id: Date.now(), mensaje, tipo });
    const set = (campo) => (e) => setFormData({ ...formData, [campo]: e.target.value });

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

    const generarPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        const buf = new Uint32Array(12);
        crypto.getRandomValues(buf);
        const pass = Array.from(buf, (n) => chars[n % chars.length]).join('');
        setFormData((f) => ({ ...f, password: pass }));
        setVerPass(true);
    };

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
                headers: { 'Authorization': `Bearer ${tokenSesion}`, 'Accept': 'application/json' }
            });
            setRegistrado(true);
            mostrarAlerta('El usuario se registró correctamente.', 'success');
            setTimeout(() => onVolver(), 1800);
        } catch (error) {
            mostrarAlerta(error.response?.data?.message || 'No se pudo registrar el usuario.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const rol = roles.find((r) => r.id === formData.rol_id);
    const nombreVista = `${formData.name} ${formData.apellidos}`.trim();
    const semilla = (formData.dni + formData.name + formData.apellidos).trim();
    const f = fuerza(formData.password);

    const obligatorios = [formData.dni, formData.name, formData.apellidos, formData.correo, formData.password];
    const completos = obligatorios.filter((v) => v.trim() !== '').length;
    const pct = Math.round((completos / obligatorios.length) * 100);
    const pctAnim = useNumero(pct);

    const sugerencia =
        formData.name && formData.apellidos
            ? `${sinTildes(formData.name.split(' ')[0])}.${sinTildes(formData.apellidos.split(' ')[0])}@${DOMINIO}`
            : '';

    const esExito = alerta?.tipo === 'success';

    return (
        <div className="w-full p-5 md:p-6 space-y-5">
            <style>{estilos}</style>
            {/* Notificación */}
            {alerta && (
                <div
                    key={alerta.id}
                    role={esExito ? 'status' : 'alert'}
                    className={`au-toast relative overflow-hidden fixed top-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] flex items-start gap-3 bg-white rounded-xl border border-slate-200 border-l-4 ${esExito ? 'border-l-emerald-500' : 'border-l-rose-500'} shadow-lg shadow-slate-900/10 px-4 py-3`}
                >
                    <span className={`mt-0.5 shrink-0 ${esExito ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {esExito ? <IconCheckCircle /> : <IconAlert />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900">{esExito ? 'Usuario registrado' : 'No se pudo completar la acción'}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{alerta.mensaje}</p>
                    </div>
                    <button type="button" onClick={() => setAlerta(null)} aria-label="Cerrar notificación" className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <IconClose />
                    </button>
                    <span className={`au-bar absolute bottom-0 left-0 h-0.5 w-full ${esExito ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </div>
            )}

            {/* Cabecera */}
            <div className="au-in flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">Crear Usuario</h1>
                    <p className="text-[11px] text-slate-500">Alta de cuentas y asignación de roles institucionales.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onVolver}
                        className="group inline-flex items-center gap-1.5 h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold rounded-lg shadow-sm transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                        <span className="transition-transform duration-200 group-hover:-translate-x-0.5"><IconBack /></span> Volver a la lista
                    </button>
                    <button
                        type="submit"
                        form="form-usuario"
                        disabled={cargando || registrado}
                        className="group inline-flex items-center gap-1.5 h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shadow-sm transition active:scale-95 hover:-translate-y-px hover:shadow-md disabled:hover:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                        {cargando ? (
                            <>
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                                Registrando…
                            </>
                        ) : (
                            registrado ? (
                                <><span className="au-pop"><IconCheck /></span> Registrado</>
                            ) : (
                                <><span className="transition-transform duration-200 group-hover:rotate-90"><IconSave /></span> Guardar usuario</>
                            )
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ================= FORMULARIO ================= */}
                <form id="form-usuario" onSubmit={handleSubmit} className="lg:col-span-8 min-w-0 space-y-5">
                    <input ref={inputFoto} type="file" accept="image/*" onChange={elegirFoto} className="hidden" />

                    <Tarjeta retardo={80} titulo="Datos personales" sub="Identificación de la persona dentro de la institución.">
                        <div className="flex items-center gap-4 pb-5 mb-5 border-b border-slate-100">
                            <Avatar fotoUrl={fotoUrl} semilla={semilla} color={rol.color} className="w-16 h-16" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => inputFoto.current?.click()}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                                    >
                                        <IconUpload /> {fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                                    </button>
                                    {fotoUrl && (
                                        <button type="button" onClick={quitarFoto} className="h-8 px-2.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                            Quitar
                                        </button>
                                    )}
                                </div>
                                <p className="mt-1.5 text-[10px] text-slate-400">Opcional · JPG o PNG hasta 2 MB. Sin foto se genera un avatar con sus datos.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Campo id="au-nombres" label="Nombres" requerido>
                                <input id="au-nombres" type="text" value={formData.name} onChange={set('name')} placeholder="Juan Carlos" className={claseInput} required />
                            </Campo>
                            <Campo id="au-apellidos" label="Apellidos" requerido>
                                <input id="au-apellidos" type="text" value={formData.apellidos} onChange={set('apellidos')} placeholder="Pérez Gómez" className={claseInput} required />
                            </Campo>
                            <Campo id="au-dni" label="DNI" requerido>
                                <input id="au-dni" type="text" inputMode="numeric" maxLength="15" value={formData.dni} onChange={set('dni')} placeholder="45678996" className={`${claseInput} tabular-nums`} required />
                            </Campo>
                            <Campo id="au-tel" label="Teléfono">
                                <input id="au-tel" type="tel" value={formData.telefono} onChange={set('telefono')} placeholder="987654321" className={`${claseInput} tabular-nums`} />
                            </Campo>
                        </div>
                    </Tarjeta>

                    <Tarjeta retardo={160} titulo="Rol y acceso" sub="Define qué módulos podrá usar y con qué datos iniciará sesión.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Campo id="au-rol" label="Rol en el sistema" requerido>
                                <SelectorRol valor={formData.rol_id} onChange={(id) => setFormData({ ...formData, rol_id: id })} />
                            </Campo>
                            <Campo id="au-correo" label="Correo institucional" requerido>
                                <input id="au-correo" type="email" value={formData.correo} onChange={set('correo')} placeholder={`usuario@${DOMINIO}`} className={`${claseInput} h-11`} required />
                                {sugerencia && formData.correo !== sugerencia && (
                                    <button
                                        key={sugerencia}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, correo: sugerencia })}
                                        className="au-pop inline-flex items-center max-w-full h-6 px-2.5 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                                    >
                                        <span className="truncate">Usar {sugerencia}</span>
                                    </button>
                                )}
                            </Campo>
                            <Campo id="au-pass" label="Contraseña" requerido className="sm:col-span-2">
                                <div className="relative">
                                    <input
                                        id="au-pass"
                                        type={verPass ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={set('password')}
                                        minLength={6}
                                        placeholder="Mínimo 6 caracteres"
                                        autoComplete="new-password"
                                        className={`${claseInput} pr-10 ${verPass ? 'font-mono' : ''}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVerPass((v) => !v)}
                                        aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {verPass ? <IconEyeOff /> : <IconEye />}
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="flex flex-1 items-center gap-1" aria-hidden="true">
                                        {[1, 2, 3, 4].map((n) => (
                                            <span key={n} className={`flex-1 rounded-full transition-all duration-300 ${f >= n ? `${colorFuerza[f]} h-1.5` : 'bg-slate-100 h-1'}`} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500 w-16 text-right">{etiquetaFuerza[f]}</span>
                                    <button type="button" onClick={generarPassword} className="text-[10px] font-semibold text-blue-600 hover:underline">
                                        Generar segura
                                    </button>
                                </div>
                            </Campo>
                        </div>
                    </Tarjeta>
                </form>

                {/* ================= VISTA PREVIA ================= */}
                <aside className="lg:col-span-4 min-w-0 space-y-5 lg:sticky lg:top-5">
                    <Tarjeta retardo={240} titulo="Vista previa" sub="Así aparecerá en Docentes y Asesores.">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${registrado ? 'au-ring border-emerald-300' : 'border-slate-200'}`}>
                            <Avatar fotoUrl={fotoUrl} semilla={semilla} color={rol.color} className="w-10 h-10" />
                            <div className="min-w-0 flex-1">
                                {nombreVista ? (
                                    <p className="text-xs font-bold text-slate-900 truncate">{nombreVista}</p>
                                ) : (
                                    <span className="block h-3 w-28 rounded bg-slate-100" />
                                )}
                                <p className="mt-0.5 text-[10px] text-slate-500 truncate">{rol.t === 'Docente' ? 'Asesor de prácticas' : 'Administrador'}</p>
                            </div>
                            <span key={String(registrado)} className={`au-pop shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${registrado ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {registrado ? 'Activo' : 'Nuevo'}
                            </span>
                        </div>

                        <dl className="mt-4 space-y-2.5 text-[11px]">
                            {[
                                ['Correo', formData.correo],
                                ['DNI', formData.dni],
                                ['Teléfono', formData.telefono],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between gap-3">
                                    <dt className="text-slate-500">{k}</dt>
                                    <dd className={`min-w-0 truncate font-semibold ${v ? 'text-slate-900' : 'text-slate-300'}`}>{v || 'Sin registrar'}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                            <p className="text-[11px] font-bold text-slate-900">Permisos de {rol.t.toLowerCase()}</p>
                            <ul className="space-y-1.5">
                                {permisos[formData.rol_id].map((p, i) => (
                                    <li key={`${formData.rol_id}-${p}`} className="au-item flex items-center gap-2 text-[11px] text-slate-600" style={{ animationDelay: `${i * 60}ms` }}>
                                        <span className="shrink-0" style={{ color: rol.color }}><IconCheck /></span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">Datos obligatorios</span>
                                <span className="font-bold text-slate-900 tabular-nums">{pctAnim}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                                <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    </Tarjeta>
                </aside>
            </div>
        </div>
    );
}