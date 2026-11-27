import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import api, { invalidateApiCache } from '../../api/axios.js';
import {
  Search, Bell, Maximize, Minimize, Settings, ChevronRight, User, LogOut, Sun, Moon,
  Check, Shield, GraduationCap, X, Sparkles, Hash, Mail, Lock, Palette, Camera, Eye, EyeOff,
  Loader2, AlertCircle, Monitor, Copy, Award, ClipboardCheck, LogIn, Info, KeyRound, Trash2,
  SlidersHorizontal, ChevronDown, FolderOpen, Clock, BookOpen, ListFilter, Menu as MenuIcon,
} from 'lucide-react';
import imagenPerfil from '../../assets/perfil.jpg';
import AvatarEstudiante from '../AvatarEstudiante.jsx';
import {
  leerModuloSistema,
  normalizarNombreModulo,
  publicarModuloSistema,
} from '../../utils/moduloSistema.js';
import { resolverUrlFotoUsuario as resolverFotoUsuario } from '../../utils/fotoUsuario.js';

const API_URL = 'http://localhost:8000/api';

// Ajusta estas rutas a tu API de Laravel
const ENDPOINT_PERFIL = `${API_URL}/perfil`; // PUT { nombres, apellidos, correo, telefono, foto_perfil }
const ENDPOINT_CLAVE = `${API_URL}/cambiar-password`; // POST { password_actual, password, password_confirmation }

const ICONO_CATEGORIA = {
  asignaciones: GraduationCap,
  constancias: Award,
  revisiones: ClipboardCheck,
  sistema: Info,
  login: LogIn,
  clave: KeyRound,
};

const PREFS_DEFECTO = {
  login: true,
  clave: true,
  constancias: true,
  revisiones: false,
  sistema: false,
  asignaciones: true,
};
const PREFS_INFO = [
  { id: 'login', t: 'Inicios de sesión', d: 'Aviso cuando se detecte un acceso nuevo a tu cuenta.' },
  { id: 'clave', t: 'Cambios de contraseña', d: 'Confirmación cada vez que se modifique tu contraseña.' },
  { id: 'constancias', t: 'Constancias y prácticas', d: 'Nuevas prácticas registradas y constancias emitidas.' },
  { id: 'revisiones', t: 'Revisiones pendientes', d: 'Informes y expedientes que esperan tu revisión.' },
  { id: 'sistema', t: 'Avisos del sistema', d: 'Validaciones, mantenimientos y novedades de la plataforma.' },
  { id: 'asignaciones', t: 'Nuevas asignaciones', d: 'Avisos cuando te asignen alumnos.' },
];

const PROGRAMA = 'Diseño y Programación Web';

// Datos del sistema que la persona puede ajustar (se guardan en este equipo)
const SISTEMA_DEFECTO = { periodo: '2026-I', porPagina: 6, vista: 'tarjetas', moduloId: '' };
const PERIODOS = ['2025-II', '2026-I', '2026-II'];
const cargarSistema = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem('config_sistema') || '{}');
    const moduloActivo = leerModuloSistema();
    return {
      ...SISTEMA_DEFECTO,
      ...guardado,
      moduloId: moduloActivo?.id_modulo ?? '',
    };
  } catch {
    return { ...SISTEMA_DEFECTO };
  }
};

const cargarPrefs = () => {
  try {
    return { ...PREFS_DEFECTO, ...JSON.parse(localStorage.getItem('preferencias_notificaciones') || '{}') };
  } catch {
    return { ...PREFS_DEFECTO };
  }
};

/* ═════════════ Animaciones ═════════════ */
const ESTILOS = `
@keyframes nv-pop { from { opacity:0; transform:translateY(-6px) scale(.97); } to { opacity:1; transform:none; } }
@keyframes nv-fade { from { opacity:0; } to { opacity:1; } }
@keyframes nv-modal { from { opacity:0; transform:translateY(20px) scale(.96); } to { opacity:1; transform:none; } }
@keyframes nv-rise { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
@keyframes nv-toast { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:none; } }
@keyframes nv-spin { to { transform: rotate(360deg); } }
@keyframes nv-shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-5px); } 75% { transform:translateX(5px); } }
@keyframes nv-ping { 0% { transform:scale(1); opacity:.7; } 100% { transform:scale(2.2); opacity:0; } }
.nv-pop { animation: nv-pop .18s cubic-bezier(.22,1,.36,1) both; }
.nv-fade { animation: nv-fade .2s ease-out both; }
.nv-modal { animation: nv-modal .32s cubic-bezier(.22,1,.36,1) both; }
.nv-rise { animation: nv-rise .35s cubic-bezier(.22,1,.36,1) both; }
.nv-toast { animation: nv-toast .3s cubic-bezier(.22,1,.36,1) both; }
.nv-spin { animation: nv-spin .8s linear infinite; }
.nv-shake { animation: nv-shake .35s ease-in-out; }
.nv-ping { animation: nv-ping 1.6s ease-out infinite; }
.nv-font { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
@media (prefers-reduced-motion: reduce) {
  .nv-pop,.nv-fade,.nv-modal,.nv-rise,.nv-toast,.nv-spin,.nv-shake,.nv-ping { animation:none !important; }
}
`;

const foco = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/50';

/* ═════════════ Utilidades de usuario ═════════════ */
const desempaquetarUsuario = (fuente) => {
  if (!fuente || typeof fuente !== 'object') return {};
  return fuente.user || fuente.data || fuente;
};

const leerUsuario = (propUsuario) => {
  if (propUsuario && typeof propUsuario === 'object' && Object.keys(propUsuario).length > 0) {
    return desempaquetarUsuario(propUsuario);
  }
  try {
    const raw = JSON.parse(localStorage.getItem('user') || 'null');
    if (!raw || typeof raw !== 'object') return {};
    return desempaquetarUsuario(raw) || {};
  } catch {
    return {};
  }
};

const obtenerNombreUsuario = (u) => {
  if (!u || typeof u !== 'object') return 'Usuario';
  const base = u.nombres || u.nombre || u.name || u.nombre_completo || u.full_name || u.usuario;

  if (base) {
    const strBase = String(base).trim();
    if (u.apellidos && !strBase.toLowerCase().includes(String(u.apellidos).trim().toLowerCase())) {
      return `${strBase} ${String(u.apellidos).trim()}`.trim();
    }
    return strBase;
  }

  if (u.primer_nombre || u.apellido_paterno) {
    return `${u.primer_nombre || ''} ${u.apellido_paterno || ''}`.trim() || 'Usuario';
  }

  return 'Usuario';
};

const obtenerRolEtiqueta = (u) => {
  if (!u || typeof u !== 'object') return 'Usuario';
  const idRol = Number(u.id_rol ?? u.rol_id ?? u.rol?.id_rol ?? u.rol?.id);
  const rolesPorId = { 1: 'Administrador', 2: 'Docente', 3: 'Estudiante' };
  if (rolesPorId[idRol]) return rolesPorId[idRol];

  return u.rol?.nombre || u.rol?.descripcion || (typeof u.rol === 'string' ? u.rol : '') || 'Usuario';
};

const resolverUrlFotoUsuario = (u) => {
  return resolverFotoUsuario(u) || imagenPerfil;
};

// Datos editables, normalizados (los nombres de campo cambian según el endpoint)
const formDesdeUsuario = (u) => ({
  nombres: String(u.nombres || u.nombre || u.name || '').trim(),
  apellidos: String(u.apellidos || '').trim(),
  correo: String(u.correo || u.email || '').trim(),
  telefono: String(u.telefono || '').trim(),
  foto: typeof u.foto_perfil === 'string' ? u.foto_perfil : '',
});

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const resaltar = (texto, q) => {
  const limpio = (q || '').replace(/^(DNI|Docente|Alumno|Correo):\s*/i, '').trim();
  if (limpio.length < 2 || !texto) return texto;
  return String(texto).split(new RegExp(`(${escapar(limpio)})`, 'gi')).map((p, i) =>
    p.toLowerCase() === limpio.toLowerCase() ? <mark key={i} className="rounded bg-blue-600/25 px-0.5 text-inherit">{p}</mark> : p
  );
};

// Reduce la foto a 256 px cuadrados (recorte centrado) para guardarla ligera
const procesarFoto = (archivo) =>
  new Promise((ok, fallo) => {
    const lector = new FileReader();
    lector.onerror = fallo;
    lector.onload = () => {
      const img = new Image();
      img.onerror = fallo;
      img.onload = () => {
        const lado = Math.min(img.width, img.height);
        const lienzo = document.createElement('canvas');
        lienzo.width = 256;
        lienzo.height = 256;
        lienzo.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
        ok(lienzo.toDataURL('image/jpeg', 0.86));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });

const fuerzaClave = (c) => {
  const reglas = [
    { ok: c.length >= 8, t: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(c) && /[a-z]/.test(c), t: 'Mayúsculas y minúsculas' },
    { ok: /\d/.test(c), t: 'Al menos un número' },
    { ok: /[^A-Za-z0-9]/.test(c), t: 'Un símbolo (!, #, @…)' },
  ];
  return { reglas, puntos: reglas.filter((r) => r.ok).length };
};

/* ═════════════ Piezas pequeñas ═════════════ */
function Interruptor({ activo, onChange, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onChange(!activo)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ${foco} ${activo ? 'border-blue-600 bg-blue-600' : 'border-slate-400/50 bg-transparent'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 ${activo ? 'left-[22px] bg-white' : 'left-0.5 bg-slate-400'}`} />
    </button>
  );
}

function Campo({ etiqueta, error, t, children }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-[11px] font-semibold ${t.suave}`}>{etiqueta}</span>
      {children}
      {error && (
        <span role="alert" className="nv-rise mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </label>
  );
}

/* ───── Búsqueda: tipo, nombre y atributo que coincide ───── */
const tipoDe = (p) => (p?.tipo === 'docente' ? 'docente' : 'alumno');
const nombreDe = (p) => `${p?.nombres || p?.nombre || p?.razon_social || ''} ${p?.apellidos || ''}`.trim();
const claveDe = (p) => `${tipoDe(p)}-${p?.id || p?.id_estudiante || p?.id_docente || p?.dni || nombreDe(p)}`;

// Detecta por qué atributo coincidió la búsqueda (DNI o correo) sin que la persona tenga que elegirlo
const coincidenciaAtributo = (p, q) => {
  const lim = (q || '').replace(/^(DNI|Docente|Alumno|Correo):\s*/i, '').trim().toLowerCase();
  if (lim.length < 2) return null;
  const dni = String(p.dni || p.numero_documento || '');
  if (/^\d{2,}$/.test(lim) && dni.includes(lim)) return { k: 'DNI', v: dni };
  const correo = String(p.correo || p.email || '');
  if (correo.toLowerCase().includes(lim) && !nombreDe(p).toLowerCase().includes(lim)) return { k: 'Correo', v: correo };
  return null;
};

function FilaPersona({ p, q, activa, onHover, onAbrir, onExpediente, t }) {
  const nombre = nombreDe(p);
  const esDocente = tipoDe(p) === 'docente';
  const coincide = coincidenciaAtributo(p, q);
  const subtitulo = p.dni ? `DNI: ${p.dni}` : (p.correo || p.email || p.especialidad || 'Registro académico');
  return (
    <div
      role="option"
      aria-selected={activa}
      data-activo={activa}
      onMouseEnter={onHover}
      onClick={onAbrir}
      className={`group flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 transition-colors last:border-0 ${t.borde} ${activa ? 'bg-blue-600/10' : t.hover}`}
    >
      <AvatarEstudiante
        estudiante={p}
        className="h-9 w-9 rounded-xl text-[11px] font-bold"
        fallbackClassName={esDocente ? "bg-blue-600/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"}
      />
      <span className="min-w-0 flex-1 leading-snug">
        <span className="block truncate text-[12px] font-semibold">{resaltar(nombre, q)}</span>
        <span className={`block truncate text-[10.5px] ${t.suave}`}>
          {coincide ? <><b className="text-blue-600">{coincide.k}:</b> {resaltar(coincide.v, q)}</> : subtitulo}
        </span>
      </span>
      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${esDocente ? 'bg-blue-600/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
        <i className={`h-1.5 w-1.5 rounded-full ${esDocente ? 'bg-blue-600' : 'bg-emerald-500'}`} />
        {esDocente ? 'Docente' : 'Alumno'}
      </span>
      {!esDocente && onExpediente && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onExpediente(); }}
          title="Ver expediente"
          aria-label={`Ver expediente de ${nombre}`}
          className={`grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border text-blue-600 transition hover:bg-blue-600 hover:text-white ${t.borde} ${activa ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${foco} focus-visible:opacity-100`}
        >
          <FolderOpen className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* Apartado desplegable */
function Desplegable({ Icono, titulo, resumen, abierto, onToggle, t, children }) {
  return (
    <div className={`overflow-hidden rounded-xl border ${t.borde}`}>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={onToggle}
        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors ${t.hover} ${foco}`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600/10 text-blue-600"><Icono className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold">{titulo}</span>
          <span className={`block truncate text-[12px] ${t.suave}`}>{abierto ? 'Cambia solo lo que necesites' : resumen}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${t.suave} ${abierto ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className={`overflow-hidden ${abierto ? 'visible' : 'invisible'}`}>
          <div className={`border-t px-4 py-4 ${t.borde}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// Vista previa dibujada de cada tema
function MiniTema({ modo }) {
  const Claro = () => (
    <div className="h-full w-full bg-white">
      <div className="h-3 border-b border-slate-200 bg-slate-50" />
      <div className="space-y-1.5 p-2"><i className="block h-1.5 w-3/4 rounded bg-slate-200" /><i className="block h-1.5 w-1/2 rounded bg-slate-200" /><i className="block h-4 w-full rounded bg-blue-100" /></div>
    </div>
  );
  const Oscuro = () => (
    <div className="h-full w-full bg-[#0b1b3a]">
      <div className="h-3 border-b border-[#1e335c] bg-[#0f172a]" />
      <div className="space-y-1.5 p-2"><i className="block h-1.5 w-3/4 rounded bg-[#1e335c]" /><i className="block h-1.5 w-1/2 rounded bg-[#1e335c]" /><i className="block h-4 w-full rounded bg-blue-600/40" /></div>
    </div>
  );
  return (
    <div className="relative h-20 overflow-hidden rounded-lg border border-slate-300/50">
      {modo === 'luz' && <Claro />}
      {modo === 'oscuro' && <Oscuro />}
      {modo === 'sistema' && (
        <>
          <div className="absolute inset-0"><Claro /></div>
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden"><div className="h-full w-[200%] -translate-x-1/2"><Oscuro /></div></div>
        </>
      )}
    </div>
  );
}

/* ═════════════ Ventana de configuración ═════════════ */
const SECCIONES = [
  { id: 'perfil', t: 'Perfil', d: 'Tus datos personales y académicos', Icono: User },
  { id: 'apariencia', t: 'Apariencia', d: 'Elige cómo se ve la plataforma', Icono: Palette },
  { id: 'notificaciones', t: 'Notificaciones', d: 'Decide qué avisos quieres recibir', Icono: Bell },
  { id: 'sistema', t: 'Sistema', d: 'Solo los datos que puedes modificar', Icono: SlidersHorizontal },
  { id: 'seguridad', t: 'Seguridad', d: 'Contraseña y sesión', Icono: Lock },
];

const OPCIONES_TEMA = [
  { id: 'luz', t: 'Luz', d: 'Fondo claro' },
  { id: 'oscuro', t: 'Oscuro', d: 'Menos brillo' },
  { id: 'sistema', t: 'Sistema', d: 'Igual que tu equipo' },
];

function Configuracion({ d, t, usuario, rolEtiqueta, modoTema, onTema, onGuardado, onCerrar, onCerrarSesion, avisar }) {
  const [seccion, setSeccion] = useState('perfil');
  const idx = SECCIONES.findIndex((s) => s.id === seccion);

  const [base, setBase] = useState(() => ({ form: formDesdeUsuario(usuario), prefs: cargarPrefs(), sistema: cargarSistema() }));
  const [form, setForm] = useState(base.form);
  const [prefs, setPrefs] = useState(base.prefs);
  const [sistema, setSistema] = useState(base.sistema);
  const [abiertos, setAbiertos] = useState({ academico: true, listados: false });
  const [errores, setErrores] = useState({});
  const [guardado, setGuardado] = useState('idle');
  const [descartar, setDescartar] = useState(false);
  const [vibrar, setVibrar] = useState(false);
  const [modulosDisponibles, setModulosDisponibles] = useState([]);
  const [errorModulos, setErrorModulos] = useState('');
  const [moduloEditando, setModuloEditando] = useState(null);
  const [formModulo, setFormModulo] = useState({ numero_modulo: '', nombre_modulo: '', horas_requeridas: '' });
  const [guardandoModulo, setGuardandoModulo] = useState(false);
  const [errorGuardarModulo, setErrorGuardarModulo] = useState('');
  const esAdministrador = Number(usuario?.id_rol ?? usuario?.rol_id) === 1;
  const sacudir = () => { setVibrar(true); setTimeout(() => setVibrar(false), 400); };
  const archivo = useRef(null);

  const sucio = JSON.stringify(form) !== JSON.stringify(base.form) || JSON.stringify(prefs) !== JSON.stringify(base.prefs) || JSON.stringify(sistema) !== JSON.stringify(base.sistema);
  const nombreCompleto = `${form.nombres} ${form.apellidos}`.trim() || 'Usuario';
  const foto = resolverUrlFotoUsuario({ foto_perfil: form.foto });

  useEffect(() => {
    let vigente = true;
    api.get('/modulos-profesionales', { params: { per_page: 100 } })
      .then(({ data }) => {
        const lista = Array.isArray(data?.data?.data)
          ? data.data.data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
        if (!vigente) return;
        setModulosDisponibles(lista);
        const moduloGuardado = lista.find(
          (modulo) => String(modulo.id_modulo) === String(base.sistema.moduloId)
        );
        if (moduloGuardado) {
          publicarModuloSistema(moduloGuardado);
        }
      })
      .catch((error) => {
        console.error('No se pudo cargar el catálogo de módulos:', error);
        if (vigente) setErrorModulos('No se pudo cargar el catálogo de módulos.');
      });
    return () => { vigente = false; };
  }, [base.sistema.moduloId]);

  const intentarCerrar = () => {
    if (sucio && !descartar) { setDescartar(true); sacudir(); return; }
    onCerrar();
  };

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); intentarCerrar(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (sucio) guardar(); }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  });

  const cambiar = (c) => { setForm((f) => ({ ...f, ...c })); setErrores((e) => ({ ...e, ...Object.fromEntries(Object.keys(c).map((k) => [k, undefined])) })); setDescartar(false); };
  const cambiarModuloSistema = (id) => {
    const modulo = modulosDisponibles.find(
      (item) => String(item.id_modulo) === String(id)
    );
    setSistema((actual) => ({ ...actual, moduloId: id }));
    setDescartar(false);
    publicarModuloSistema(modulo || null);
  };

  const editarModulo = (modulo) => {
    setModuloEditando(String(modulo.id_modulo));
    setFormModulo({
      numero_modulo: String(modulo.numero_modulo ?? ''),
      nombre_modulo: modulo.nombre_modulo ?? '',
      horas_requeridas: String(modulo.horas_requeridas ?? ''),
    });
    setErrorGuardarModulo('');
  };

  const guardarModulo = async () => {
    if (!esAdministrador || !moduloEditando || guardandoModulo) return;
    if (
      !Number.isInteger(Number(formModulo.numero_modulo)) ||
      Number(formModulo.numero_modulo) < 1 ||
      !formModulo.nombre_modulo.trim() ||
      !Number.isInteger(Number(formModulo.horas_requeridas)) ||
      Number(formModulo.horas_requeridas) < 1
    ) {
      setErrorGuardarModulo('Completa un número, nombre y cantidad de horas válidos.');
      return;
    }
    setGuardandoModulo(true);
    setErrorGuardarModulo('');
    try {
      const { data } = await api.put(`/modulos-profesionales/${moduloEditando}`, {
        numero_modulo: Number(formModulo.numero_modulo),
        nombre_modulo: formModulo.nombre_modulo.trim(),
        horas_requeridas: Number(formModulo.horas_requeridas),
      });
      const guardado = data?.data;
      if (!guardado) throw new Error('El servidor no devolvió el módulo actualizado.');

      setModulosDisponibles((actuales) =>
        actuales.map((modulo) =>
          String(modulo.id_modulo) === String(guardado.id_modulo) ? guardado : modulo
        )
      );
      if (String(sistema.moduloId) === String(guardado.id_modulo)) {
        publicarModuloSistema(guardado);
      }
      setModuloEditando(null);
      avisar('ok', 'Módulo actualizado correctamente.');
    } catch (error) {
      console.error('No se pudo actualizar el módulo:', error);
      setErrorGuardarModulo(
        error.response?.data?.message || error.message || 'No se pudo actualizar el módulo.'
      );
    } finally {
      setGuardandoModulo(false);
    }
  };

  const elegirFoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { cambiar({ foto: await procesarFoto(f) }); } catch { avisar('error', 'No se pudo cargar la imagen.'); }
  };

  const validar = () => {
    const er = {};
    if (!form.nombres.trim()) er.nombres = 'Escribe tu nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) er.correo = 'Ingresa un correo válido.';
    if (form.telefono && !/^\d{9}$/.test(form.telefono.replace(/\s/g, ''))) er.telefono = 'Debe tener 9 dígitos.';
    setErrores(er);
    return Object.keys(er).length === 0;
  };

  const guardar = async () => {
    if (guardado === 'cargando') return;
    if (!validar()) { setSeccion('perfil'); sacudir(); return; }
    setGuardado('cargando');

    const perfilCambio = JSON.stringify(form) !== JSON.stringify(base.form);
    const preferenciasCambio = JSON.stringify(prefs) !== JSON.stringify(base.prefs);
    let enServidor = true;
    if (perfilCambio) {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      try {
        await axios.put(
          ENDPOINT_PERFIL,
          { nombres: form.nombres, apellidos: form.apellidos, correo: form.correo, telefono: form.telefono, foto_perfil: form.foto },
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
        );
      } catch {
        enServidor = false;
      }
    }

    if (preferenciasCambio) {
      try {
        await api.post('/notificaciones/preferencias', { preferencias: prefs });
      } catch (error) {
        console.error('No se pudieron guardar las preferencias de notificaciones:', error);
        enServidor = false;
      }
    }

    try { localStorage.setItem('preferencias_notificaciones', JSON.stringify(prefs)); } catch { /* ignorar */ }
    window.dispatchEvent(new CustomEvent('preferencias_notif_cambiadas', { detail: prefs }));
    try { localStorage.setItem('config_sistema', JSON.stringify(sistema)); } catch { /* ignorar */ }
    if (modulosDisponibles.length > 0) {
      const moduloSeleccionado = modulosDisponibles.find(
        (modulo) => String(modulo.id_modulo) === String(sistema.moduloId)
      );
      publicarModuloSistema(moduloSeleccionado || null);
    }
    window.dispatchEvent(new CustomEvent('config_sistema_cambiada', { detail: sistema }));
    onGuardado(
      { nombres: form.nombres, apellidos: form.apellidos, correo: form.correo, email: form.correo, telefono: form.telefono, foto_perfil: form.foto },
      perfilCambio || preferenciasCambio ? enServidor : null
    );

    setBase({ form: { ...form }, prefs: { ...prefs }, sistema: { ...sistema } });
    setDescartar(false);
    setGuardado('ok');
    setTimeout(() => setGuardado('idle'), 1800);
  };

  const descartarCambios = () => {
    setForm(base.form);
    setPrefs(base.prefs);
    setSistema(base.sistema);
    setErrores({});
    setDescartar(false);
    if (modulosDisponibles.length > 0) {
      const moduloBase = modulosDisponibles.find(
        (modulo) => String(modulo.id_modulo) === String(base.sistema.moduloId)
      );
      publicarModuloSistema(moduloBase || null);
    }
  };

  /* Contraseña */
  const [clave, setClave] = useState({ actual: '', nueva: '', repetir: '' });
  const [verClave, setVerClave] = useState(false);
  const [errClave, setErrClave] = useState('');
  const [cambiandoClave, setCambiandoClave] = useState(false);
  const { reglas, puntos } = fuerzaClave(clave.nueva);
  const etiquetaFuerza = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][puntos];
  const colorFuerza = ['bg-slate-400', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'][puntos];
  const coinciden = clave.nueva && clave.nueva === clave.repetir;
  const puedeCambiar = clave.actual && puntos >= 3 && coinciden && !cambiandoClave;

  const cambiarClave = async () => {
    setErrClave('');
    setCambiandoClave(true);
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    try {
      await axios.post(
        ENDPOINT_CLAVE,
        { password_actual: clave.actual, password: clave.nueva, password_confirmation: clave.repetir },
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
      );
      setClave({ actual: '', nueva: '', repetir: '' });
      avisar('ok', 'Contraseña actualizada correctamente.');
    } catch (err) {
      setErrClave(err?.response?.data?.message || 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.');
      sacudir();
    } finally {
      setCambiandoClave(false);
    }
  };

  const entrada = (error) =>
    `h-10 w-full rounded-lg border px-3 text-[13px] outline-none transition focus:ring-4 ${t.campo} ${
      error ? 'border-rose-500 focus:ring-rose-500/15' : 'focus:border-blue-600 focus:ring-blue-600/15'
    }`;

  const seccionActual = SECCIONES[idx];
  const activas = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="nv-fade fixed inset-0 z-[80] grid place-items-center bg-black/55 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) intentarCerrar(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configuración"
        className={`nv-font nv-modal h-[min(680px,92vh)] w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl ${t.panel}`}
      >
        <div className={`flex h-full w-full flex-col md:flex-row ${vibrar ? 'nv-shake' : ''}`}>
        {/* Menú lateral */}
        <aside className={`flex shrink-0 flex-col border-b md:w-60 md:border-b-0 md:border-r ${t.borde} ${t.superficie}`}>
          <div className="flex items-center gap-3 px-5 pb-3 pt-5 md:pb-5">
            <img src={foto} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-blue-600/25" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-bold">{nombreCompleto}</p>
            </div>
            <button type="button" onClick={intentarCerrar} aria-label="Cerrar configuración" className={`ml-auto cursor-pointer rounded-lg p-1.5 md:hidden ${t.icono} ${foco}`}><X className="h-4 w-4" /></button>
          </div>

          <nav aria-label="Secciones" className="relative flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
            <span
              aria-hidden="true"
              className="absolute left-3 hidden h-10 w-[calc(100%-1.5rem)] rounded-xl bg-blue-600 shadow-sm shadow-blue-600/25 transition-transform duration-300 ease-out md:block"
              style={{ transform: `translateY(calc(${idx} * 2.75rem))` }}
            />
            {SECCIONES.map(({ id, t: nombre, Icono }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSeccion(id)}
                aria-current={seccion === id ? 'page' : undefined}
                className={`relative z-10 flex h-10 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[13px] font-semibold transition-colors ${foco} ${
                  seccion === id ? 'text-white max-md:bg-blue-600' : `${t.suave} hover:text-blue-600`
                }`}
              >
                <Icono className="h-4 w-4" /> {nombre}
                {id === 'seguridad' && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-transparent md:block" />}
              </button>
            ))}
          </nav>

          <p className={`mt-auto hidden px-5 pb-5 text-[11px] leading-relaxed md:block ${t.suave}`}>
            <kbd className={`rounded border px-1 ${t.borde}`}>Ctrl</kbd> + <kbd className={`rounded border px-1 ${t.borde}`}>S</kbd> guarda ·{' '}
            <kbd className={`rounded border px-1 ${t.borde}`}>Esc</kbd> cierra
          </p>
        </aside>

        {/* Contenido */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className={`flex items-start justify-between gap-4 border-b px-6 py-4 ${t.borde}`}>
            <div>
              <h2 className="flex items-center gap-2.5 text-[16px] font-extrabold"><span className="h-5 w-1 rounded-full bg-blue-600" />{seccionActual.t}</h2>
              <p className={`pl-[14px] text-[12px] ${t.suave}`}>{seccionActual.d}</p>
            </div>
            <button type="button" onClick={intentarCerrar} aria-label="Cerrar configuración" className={`hidden cursor-pointer rounded-lg p-2 transition ${t.icono} ${foco} md:block`}><X className="h-4 w-4" /></button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div key={seccion} className="nv-rise">
              {/* ───── Perfil ───── */}
              {seccion === 'perfil' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-5">
                    <button type="button" onClick={() => archivo.current?.click()} className={`group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-3xl ${foco}`} aria-label="Cambiar foto de perfil">
                      <img src={foto} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Camera className="h-5 w-5" />
                      </span>
                    </button>
                    <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={elegirFoto} />
                    <div>
                      <p className="text-[13px] font-bold">Foto de perfil</p>
                      <p className={`mb-2.5 text-[12px] ${t.suave}`}>JPG o PNG. Se recorta en cuadrado automáticamente.</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => archivo.current?.click()} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${t.borde} ${t.icono} ${foco}`}>Cambiar foto</button>
                        {form.foto && (
                          <button type="button" onClick={() => cambiar({ foto: '' })} className={`nv-pop flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-rose-500 transition hover:bg-rose-500/10 ${foco}`}>
                            <Trash2 className="h-3.5 w-3.5" /> Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo etiqueta="Nombres" error={errores.nombres} t={t}>
                      <input autoFocus value={form.nombres} onChange={(e) => cambiar({ nombres: e.target.value })} className={entrada(errores.nombres)} />
                    </Campo>
                    <Campo etiqueta="Apellidos" t={t}>
                      <input value={form.apellidos} onChange={(e) => cambiar({ apellidos: e.target.value })} className={entrada()} />
                    </Campo>
                    <Campo etiqueta="Correo electrónico" error={errores.correo} t={t}>
                      <input type="email" value={form.correo} onChange={(e) => cambiar({ correo: e.target.value })} className={entrada(errores.correo)} />
                    </Campo>
                    <Campo etiqueta="Teléfono / Celular" error={errores.telefono} t={t}>
                      <input inputMode="numeric" value={form.telefono} onChange={(e) => cambiar({ telefono: e.target.value })} placeholder="9 dígitos" className={entrada(errores.telefono)} />
                    </Campo>
                  </div>


                </div>
              )}

              {/* ───── Apariencia ───── */}
              {seccion === 'apariencia' && (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Tema">
                    {OPCIONES_TEMA.map((o) => {
                      const sel = modoTema === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          role="radio"
                          aria-checked={sel}
                          onClick={() => onTema(o.id)}
                          className={`group cursor-pointer rounded-xl border-2 p-2.5 text-left transition duration-200 hover:-translate-y-0.5 ${foco} ${sel ? 'border-blue-600' : `${t.borde} hover:border-blue-600/50`}`}
                        >
                          <MiniTema modo={o.id} />
                          <div className="mt-2.5 flex items-center justify-between px-1">
                            <div>
                              <p className="text-[13px] font-bold">{o.t}</p>
                              <p className={`text-[11px] ${t.suave}`}>{o.d}</p>
                            </div>
                            <span className={`grid h-5 w-5 place-items-center rounded-full border-2 transition ${sel ? 'border-blue-600 bg-blue-600 text-white' : t.borde}`}>
                              {sel && <Check className="nv-pop h-3 w-3" strokeWidth={3} />}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-[12px] ${t.borde} ${t.suave}`}>
                    <Monitor className="h-4 w-4 shrink-0" />
                    El tema se aplica al instante y se recuerda en este equipo.
                  </p>
                </div>
              )}

              {/* ───── Notificaciones ───── */}
              {seccion === 'notificaciones' && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className={`text-[12px] ${t.suave}`}><b className={d ? 'text-slate-100' : 'text-slate-800'}>{activas}</b> de {PREFS_INFO.length} activas</p>
                    <button
                      type="button"
                      onClick={() => setPrefs(Object.fromEntries(PREFS_INFO.map((p) => [p.id, activas < PREFS_INFO.length])))}
                      className={`cursor-pointer rounded-md px-2 py-1 text-[12px] font-bold text-blue-600 transition hover:bg-blue-600/10 ${foco}`}
                    >
                      {activas < PREFS_INFO.length ? 'Activar todas' : 'Silenciar todas'}
                    </button>
                  </div>
                  <div className={`divide-y rounded-xl border ${t.borde} ${t.linea}`}>
                    {PREFS_INFO.map((p, i) => {
                      const Ico = ICONO_CATEGORIA[p.id] || Bell;
                      return (
                        <div key={p.id} style={{ animationDelay: `${i * 45}ms` }} className="nv-rise flex items-center gap-4 px-4 py-3.5">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${prefs[p.id] ? 'bg-blue-600/10 text-blue-600' : (d ? 'bg-[#13264c] text-slate-500' : 'bg-slate-100 text-slate-400')}`}><Ico className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold">{p.t}</p>
                            <p className={`text-[12px] ${t.suave}`}>{p.d}</p>
                          </div>
                          <Interruptor activo={!!prefs[p.id]} onChange={(v) => { setPrefs((x) => ({ ...x, [p.id]: v })); setDescartar(false); }} etiqueta={p.t} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ───── Sistema (apartados desplegables) ───── */}
              {seccion === 'sistema' && (
                <div className="space-y-4">
                  <Desplegable
                    Icono={BookOpen}
                    titulo="Datos académicos"
                    resumen={`${normalizarNombreModulo(modulosDisponibles.find((modulo) => String(modulo.id_modulo) === String(sistema.moduloId))?.nombre_modulo || 'Todos los módulos')} · Periodo ${sistema.periodo}`}
                    abierto={abiertos.academico}
                    onToggle={() => setAbiertos((a) => ({ ...a, academico: !a.academico }))}
                    t={t}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo etiqueta="Módulo formativo" t={t}>
                        <select value={sistema.moduloId} onChange={(e) => cambiarModuloSistema(e.target.value)} disabled={modulosDisponibles.length === 0} className={`${entrada()} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}>
                          <option value="">Todos los módulos</option>
                          {modulosDisponibles.map((modulo) => (
                            <option key={modulo.id_modulo} value={modulo.id_modulo}>
                              {normalizarNombreModulo(modulo.nombre_modulo)}
                            </option>
                          ))}
                        </select>
                        {errorModulos && <p role="alert" className="mt-1 text-xs text-rose-600">{errorModulos}</p>}
                      </Campo>
                      <Campo etiqueta="Periodo académico" t={t}>
                        <select value={sistema.periodo} onChange={(e) => { setSistema({ ...sistema, periodo: e.target.value }); setDescartar(false); }} className={`${entrada()} cursor-pointer`}>
                          {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Campo>
                    </div>
                  </Desplegable>

                  {esAdministrador && (
                    <section className={`space-y-3 rounded-xl border p-4 ${t.borde}`}>
                      <div>
                        <h3 className="text-sm font-bold">Administrar módulos</h3>
                        <p className={`mt-0.5 text-xs ${t.suave}`}>
                          Edita el nombre, número y horas requeridas sin cambiar los vínculos existentes.
                        </p>
                      </div>
                      {errorModulos && <p role="alert" className="text-xs text-rose-600">{errorModulos}</p>}
                      <ul className={`divide-y rounded-lg border ${t.borde}`}>
                        {modulosDisponibles.map((modulo) => (
                          <li key={modulo.id_modulo} className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold">
                                {modulo.numero_modulo}. {normalizarNombreModulo(modulo.nombre_modulo)}
                              </span>
                              <span className={`text-[11px] ${t.suave}`}>{modulo.horas_requeridas} horas requeridas</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => editarModulo(modulo)}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${t.borde} ${t.suave} hover:text-blue-600`}
                            >
                              Editar
                            </button>
                          </li>
                        ))}
                      </ul>
                      {moduloEditando && (
                        <div className={`space-y-3 rounded-lg border p-3 ${t.borde}`}>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <Campo etiqueta="Número" t={t}>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                value={formModulo.numero_modulo}
                                onChange={(e) => setFormModulo((actual) => ({ ...actual, numero_modulo: e.target.value }))}
                                className={entrada()}
                              />
                            </Campo>
                            <Campo etiqueta="Nombre del módulo" t={t}>
                              <input
                                value={formModulo.nombre_modulo}
                                required
                                onChange={(e) => setFormModulo((actual) => ({ ...actual, nombre_modulo: e.target.value }))}
                                className={entrada()}
                              />
                            </Campo>
                            <Campo etiqueta="Horas requeridas" t={t}>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                value={formModulo.horas_requeridas}
                                onChange={(e) => setFormModulo((actual) => ({ ...actual, horas_requeridas: e.target.value }))}
                                className={entrada()}
                              />
                            </Campo>
                          </div>
                          {errorGuardarModulo && <p role="alert" className="text-xs text-rose-600">{errorGuardarModulo}</p>}
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setModuloEditando(null); setErrorGuardarModulo(''); }}
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${t.borde} ${t.suave}`}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => void guardarModulo()}
                              disabled={guardandoModulo || !formModulo.nombre_modulo.trim()}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {guardandoModulo ? 'Guardando...' : 'Guardar módulo'}
                            </button>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  <Desplegable
                    Icono={ListFilter}
                    titulo="Listados y tablas"
                    resumen={`${sistema.porPagina} registros por página · Vista de ${sistema.vista}`}
                    abierto={abiertos.listados}
                    onToggle={() => setAbiertos((a) => ({ ...a, listados: !a.listados }))}
                    t={t}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo etiqueta="Registros por página" t={t}>
                        <select value={sistema.porPagina} onChange={(e) => { setSistema({ ...sistema, porPagina: Number(e.target.value) }); setDescartar(false); }} className={`${entrada()} cursor-pointer`}>
                          {[6, 12, 24].map((n) => <option key={n} value={n}>{n} registros</option>)}
                        </select>
                      </Campo>
                      <div>
                        <span className={`mb-1.5 block text-[11px] font-semibold ${t.suave}`}>Vista inicial</span>
                        <div className="flex gap-2" role="group" aria-label="Vista inicial">
                          {[['tarjetas', 'Tarjetas'], ['tabla', 'Tabla']].map(([v, n]) => (
                            <button
                              key={v}
                              type="button"
                              aria-pressed={sistema.vista === v}
                              onClick={() => { setSistema({ ...sistema, vista: v }); setDescartar(false); }}
                              className={`h-10 flex-1 cursor-pointer rounded-lg border text-[13px] font-semibold transition duration-150 active:scale-95 ${foco} ${sistema.vista === v ? 'border-blue-600 bg-blue-600 text-white' : `${t.borde} ${t.suave} hover:text-blue-600`}`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Desplegable>

                  <p className={`text-[12px] ${t.suave}`}>Aquí solo aparece lo que puedes modificar. Los datos fijos, como tu rol, los asigna la administración.</p>
                </div>
              )}

              {/* ───── Seguridad ───── */}
              {seccion === 'seguridad' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[13px] font-bold">Cambiar contraseña</p>
                    <Campo etiqueta="Contraseña actual" t={t}>
                      <div className="relative">
                        <input type={verClave ? 'text' : 'password'} autoComplete="current-password" value={clave.actual} onChange={(e) => { setClave({ ...clave, actual: e.target.value }); setErrClave(''); }} className={`${entrada()} pr-10`} />
                        <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 ${t.icono} ${foco}`}>
                          {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Campo>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo etiqueta="Nueva contraseña" t={t}>
                        <input type={verClave ? 'text' : 'password'} autoComplete="new-password" value={clave.nueva} onChange={(e) => { setClave({ ...clave, nueva: e.target.value }); setErrClave(''); }} className={entrada()} />
                      </Campo>
                      <Campo etiqueta="Repetir contraseña" error={clave.repetir && !coinciden ? 'Las contraseñas no coinciden.' : ''} t={t}>
                        <input type={verClave ? 'text' : 'password'} autoComplete="new-password" value={clave.repetir} onChange={(e) => { setClave({ ...clave, repetir: e.target.value }); setErrClave(''); }} className={entrada(clave.repetir && !coinciden)} />
                      </Campo>
                    </div>

                    {clave.nueva && (
                      <div className="nv-rise space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="grid flex-1 grid-cols-4 gap-1.5">
                            {[0, 1, 2, 3].map((i) => <i key={i} className={`h-1.5 rounded-full transition-colors duration-300 ${i < puntos ? colorFuerza : d ? 'bg-[#1e335c]' : 'bg-slate-200'}`} />)}
                          </div>
                          <span className="w-20 text-right text-[12px] font-bold">{etiquetaFuerza}</span>
                        </div>
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {reglas.map((r) => (
                            <li key={r.t} className={`flex items-center gap-2 text-[12px] transition-colors ${r.ok ? 'text-emerald-500' : t.suave}`}>
                              <span className={`grid h-4 w-4 place-items-center rounded-full border transition ${r.ok ? 'border-emerald-500 bg-emerald-500 text-white' : t.borde}`}>{r.ok && <Check className="nv-pop h-2.5 w-2.5" strokeWidth={3.5} />}</span>
                              {r.t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {errClave && <p role="alert" className="nv-rise flex items-start gap-2 rounded-lg border border-rose-500/40 px-3 py-2.5 text-[12px] font-medium text-rose-500"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {errClave}</p>}

                    <button
                      type="button"
                      onClick={cambiarClave}
                      disabled={!puedeCambiar}
                      className={`flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 text-[12px] font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${foco}`}
                    >
                      {cambiandoClave ? <Loader2 className="nv-spin h-4 w-4" /> : <Lock className="h-4 w-4" />} Actualizar contraseña
                    </button>
                  </div>

                  <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${t.borde}`}>
                    <div>
                      <p className="text-[13px] font-bold">Sesión en este equipo</p>
                      <p className={`text-[12px] ${t.suave}`}>Cierra la sesión si estás en un equipo compartido.</p>
                    </div>
                    <button type="button" onClick={onCerrarSesion} className={`flex cursor-pointer items-center gap-2 rounded-lg border border-rose-500/40 px-4 py-2 text-[12px] font-bold text-rose-500 transition hover:bg-rose-500/10 active:scale-95 ${foco}`}>
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Barra de cambios sin guardar */}
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${sucio ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3.5 ${t.borde} ${t.superficie}`}>
                <p className={`flex items-center gap-2 text-[12px] font-semibold ${descartar ? 'text-amber-500' : ''}`}>
                  <span className="relative grid h-2 w-2 place-items-center"><i className="nv-ping absolute h-2 w-2 rounded-full bg-amber-400" /><i className="h-2 w-2 rounded-full bg-amber-400" /></span>
                  {descartar ? 'Pulsa Esc otra vez para descartar los cambios' : 'Tienes cambios sin guardar'}
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={descartarCambios} className={`cursor-pointer rounded-lg px-3.5 py-2 text-[12px] font-semibold transition ${t.icono} ${foco}`}>Descartar</button>
                  <button type="button" onClick={guardar} disabled={guardado === 'cargando'} className={`flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-80 ${foco}`}>
                    {guardado === 'cargando' ? <><Loader2 className="nv-spin h-3.5 w-3.5" /> Guardando…</> : <><Check className="h-3.5 w-3.5" /> Guardar cambios</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {guardado === 'ok' && !sucio && (
            <div role="status" className={`nv-rise flex items-center gap-2 border-t px-6 py-3 text-[12px] font-semibold text-emerald-500 ${t.borde}`}>
              <Check className="h-4 w-4" /> Cambios guardados
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════ Barra de navegación ═════════════ */
function Navbar({
  darkMode, setDarkMode, usuario,
  notificaciones = [], buscarGlobal, onSeleccionarPersona,
  onIrPerfil, onCambiarVista, onCerrarSesion, onVerExpediente, onOpenMenu,
}) {
  const [usuarioActual, setUsuarioActual] = useState(() => leerUsuario(usuario));
  const [cambiosLocales, setCambiosLocales] = useState({});
  const [errorAvatar, setErrorAvatar] = useState(false);

  useEffect(() => {
    setUsuarioActual(leerUsuario(usuario));
    setErrorAvatar(false);
  }, [usuario]);

  useEffect(() => {
    const sincronizarUsuario = () => {
      setUsuarioActual(leerUsuario(usuario));
      setErrorAvatar(false);
    };
    window.addEventListener('storage', sincronizarUsuario);
    window.addEventListener('usuario_actualizado', sincronizarUsuario);
    window.addEventListener('user-updated', sincronizarUsuario);
    return () => {
      window.removeEventListener('storage', sincronizarUsuario);
      window.removeEventListener('usuario_actualizado', sincronizarUsuario);
      window.removeEventListener('user-updated', sincronizarUsuario);
    };
  }, [usuario]);

  const usuarioMostrado = { ...usuarioActual, ...cambiosLocales };
  const nombreUsuario = obtenerNombreUsuario(usuarioMostrado);
  const rolEtiqueta = obtenerRolEtiqueta(usuarioMostrado);
  const avatarUrl = !errorAvatar ? resolverUrlFotoUsuario(usuarioMostrado) : imagenPerfil;

  const [abierto, setAbierto] = useState(null);
  const [notifs, setNotifs] = useState(notificaciones);
  const [notifsUsuario, setNotifsUsuario] = useState(String(usuarioActual?.id_usuario ?? usuarioActual?.id ?? ''));
  const [cargandoNotifs, setCargandoNotifs] = useState(false);
  const [errorNotifs, setErrorNotifs] = useState('');
  const idUsuarioNotifs = usuarioActual?.id_usuario ?? usuarioActual?.id ?? '';
  const solicitudNotificaciones = useRef(0);
  const cargarNotificaciones = useCallback(async () => {
    const solicitud = ++solicitudNotificaciones.current;
    if (!idUsuarioNotifs) {
      setCargandoNotifs(false);
      return;
    }

    const usuarioSolicitante = String(idUsuarioNotifs);
    setCargandoNotifs(true);
    try {
      const { data } = await api.get('/notificaciones');
      if (solicitudNotificaciones.current !== solicitud) return;
      setNotifs(Array.isArray(data?.data) ? data.data : []);
      setNotifsUsuario(usuarioSolicitante);
      setErrorNotifs('');
    } catch (error) {
      if (solicitudNotificaciones.current !== solicitud) return;
      console.error('No se pudieron cargar las notificaciones:', error);
      setNotifs([]);
      setNotifsUsuario(usuarioSolicitante);
      setErrorNotifs(error.response?.data?.message || 'No se pudieron cargar las notificaciones.');
    } finally {
      if (solicitudNotificaciones.current === solicitud) {
        setCargandoNotifs(false);
      }
    }
  }, [idUsuarioNotifs]);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [activo, setActivo] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [recientes, setRecientes] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem('busquedas_recientes') || '[]'); return Array.isArray(r) ? r : []; } catch { return []; }
  });
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [copiado, setCopiado] = useState('');
  const [configAbierta, setConfigAbierta] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [toast, setToast] = useState(null);
  const [preferencias, setPreferencias] = useState(cargarPrefs);
  const buscador = useRef(null);
  const listaRef = useRef(null);

  const d = !!darkMode;

  /* ---------- Tema (luz / oscuro / sistema) ---------- */
  const [modoTema, setModoTema] = useState(() => {
    try { return localStorage.getItem('tema_modo') || (darkMode ? 'oscuro' : 'luz'); } catch { return darkMode ? 'oscuro' : 'luz'; }
  });
  const cambiarTema = (m) => {
    setModoTema(m);
    try { localStorage.setItem('tema_modo', m); } catch { /* ignorar */ }
    window.dispatchEvent(new CustomEvent('tema_modo_cambiado', { detail: m }));
    if (m === 'luz') setDarkMode(false);
    else if (m === 'oscuro') setDarkMode(true);
    else setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  };
  useEffect(() => {
    const sincronizarTema = (event) => {
      if (['luz', 'oscuro', 'sistema'].includes(event.detail)) {
        setModoTema(event.detail);
      }
    };
    window.addEventListener('tema_modo_cambiado', sincronizarTema);
    return () => window.removeEventListener('tema_modo_cambiado', sincronizarTema);
  }, []);
  useEffect(() => {
    if (modoTema !== 'sistema') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const aplicar = () => setDarkMode(mq.matches);
    aplicar();
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, [modoTema, setDarkMode]);

  /* ---------- Avisos ---------- */
  const avisar = (tipo, texto) => setToast({ tipo, texto, id: Date.now() });
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  /* ---------- Preferencias de notificación ---------- */
  useEffect(() => {
    const actualizarPrefs = (e) => setPreferencias(e.detail);
    window.addEventListener('preferencias_notif_cambiadas', actualizarPrefs);
    return () => window.removeEventListener('preferencias_notif_cambiadas', actualizarPrefs);
  }, []);

  useEffect(() => {
    void cargarNotificaciones();
  }, [cargarNotificaciones]);

  useEffect(() => {
    const abrirNotificaciones = () => {
      setAbierto('notif');
      invalidateApiCache('/notificaciones');
      void cargarNotificaciones();
    };
    window.addEventListener('notificaciones:abrir', abrirNotificaciones);
    return () => window.removeEventListener('notificaciones:abrir', abrirNotificaciones);
  }, [cargarNotificaciones]);

  useEffect(() => {
    if (!idUsuarioNotifs) return undefined;
    let vigente = true;
    api.get('/notificaciones/preferencias')
      .then(({ data }) => {
        if (!vigente || !data || typeof data !== 'object') return;
        const preferenciasActualizadas = { ...PREFS_DEFECTO, ...data };
        setPreferencias(preferenciasActualizadas);
        localStorage.setItem('preferencias_notificaciones', JSON.stringify(preferenciasActualizadas));
      })
      .catch((error) => {
        console.error('No se pudieron cargar las preferencias de notificaciones:', error);
      });
    return () => { vigente = false; };
  }, [idUsuarioNotifs]);

  const notifsVisibles = (notifsUsuario === String(idUsuarioNotifs) ? notifs : [])
    .filter((n) => !n.categoria || preferencias[n.categoria] !== false);
  const sinLeer = notifsVisibles.filter((n) => !n.leida).length;
  const alternar = (id) => setAbierto((a) => (a === id ? null : id));
  const abrirNotificaciones = () => {
    const abrir = abierto !== 'notif';
    setAbierto(abrir ? 'notif' : null);
    if (abrir) {
      invalidateApiCache('/notificaciones');
      void cargarNotificaciones();
    }
  };

  /* ---------- Búsqueda: alumnos y docentes a la vez, sin elegir atributo ---------- */
  const sinConsulta = query.trim().length < 2;
  const alumnosRes = resultados.filter((p) => tipoDe(p) === 'alumno' && filtroTipo !== 'docente');
  const docentesRes = resultados.filter((p) => tipoDe(p) === 'docente' && filtroTipo !== 'alumno');
  const recientesFiltrados = recientes.filter((p) => filtroTipo === 'todos' || tipoDe(p) === filtroTipo);
  const lista = sinConsulta ? recientesFiltrados : [...alumnosRes, ...docentesRes];
  const grupos = [
    ['Alumnos', GraduationCap, alumnosRes, 0],
    ['Docentes', Shield, docentesRes, alumnosRes.length],
  ];

  const ps = personaSeleccionada;
  const esAlumnoSel = ps ? tipoDe(ps) === 'alumno' : false;
  const datosExtra = ps
    ? [['Estado', ps.estado], ['Módulo', ps.modulo], ['Semestre', ps.semestre], ['Empresa', ps.empresa], ['Asesor', ps.asesor], ['Expediente', ps.exp || ps.codigo_expediente]].filter(([, v]) => v)
    : [];

  const guardarReciente = (persona) => {
    setRecientes((prev) => {
      const sig = [persona, ...prev.filter((x) => claveDe(x) !== claveDe(persona))].slice(0, 6);
      try { localStorage.setItem('busquedas_recientes', JSON.stringify(sig)); } catch { /* ignorar */ }
      return sig;
    });
  };
  const borrarRecientes = () => {
    setRecientes([]);
    try { localStorage.removeItem('busquedas_recientes'); } catch { /* ignorar */ }
  };

  /* ---------- Cierre de menús, pantalla completa y atajos ---------- */
  useEffect(() => {
    const fuera = (e) => { if (!e.target.closest('[data-menu]')) setAbierto(null); };
    const teclas = (e) => {
      if (e.key === 'Escape') setAbierto(null);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); buscador.current?.focus(); setAbierto('buscar'); }
    };
    const pc = () => setPantallaCompleta(!!document.fullscreenElement);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', teclas);
    document.addEventListener('fullscreenchange', pc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', teclas);
      document.removeEventListener('fullscreenchange', pc);
    };
  }, []);

  /* ---------- Búsqueda global ---------- */
  useEffect(() => {
    const limpio = query.trim();
    if (limpio.length < 2) {
      setResultados([]);
      setErrorBusqueda('');
      return undefined;
    }

    let vigente = true;
    setBuscando(true);
    setErrorBusqueda('');

    const t = setTimeout(async () => {
      try {
        const terminoReal = limpio.replace(/^(DNI|Docente|Alumno|Correo):\s*/i, '').trim();
        if (terminoReal.length < 2) {
          if (vigente) { setResultados([]); setBuscando(false); }
          return;
        }

        if (buscarGlobal) {
          const r = await buscarGlobal(terminoReal);
          if (vigente) { setResultados(r || []); setActivo(0); setAbierto('buscar'); }
        } else {
          const { data } = await api.get('/buscar-global', {
            params: { q: terminoReal },
          });
          if (vigente) {
            setResultados(Array.isArray(data) ? data : []);
            setActivo(0);
            setAbierto('buscar');
          }
        }
      } catch (error) {
        console.error('No se pudo completar la búsqueda global:', error);
        if (vigente) {
          setResultados([]);
          setErrorBusqueda('No se pudo completar la búsqueda. Intenta nuevamente.');
        }
      } finally {
        if (vigente) setBuscando(false);
      }
    }, 280);

    return () => { vigente = false; clearTimeout(t); };
  }, [query, buscarGlobal]);

  useEffect(() => {
    listaRef.current?.querySelector('[data-activo="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activo]);

  const aplicarRecomendacion = (prefijo) => {
    setQuery(`${prefijo.trim()}: `);
    setAbierto('buscar');
    buscador.current?.focus();
  };

  const seleccionarPersona = (persona) => {
    guardarReciente(persona);
    setPersonaSeleccionada(persona);
    onSeleccionarPersona?.(persona);
    setQuery('');
    setResultados([]);
    setAbierto(null);
  };

  // Abre el expediente del alumno (usa onVerExpediente; si no existe, emite el evento "abrir_expediente")
  const abrirExpediente = (persona) => {
    guardarReciente(persona);
    setPersonaSeleccionada(null);
    setQuery('');
    setResultados([]);
    setAbierto(null);
    if (onVerExpediente) onVerExpediente(persona);
    else window.dispatchEvent(new CustomEvent('expediente-alumno:abrir', { detail: persona }));
  };

  const alTeclearBuscador = (e) => {
    if (abierto !== 'buscar' || lista.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((a) => (a + 1) % lista.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((a) => (a - 1 + lista.length) % lista.length); }
    else if (e.key === 'Enter') { e.preventDefault(); if (lista[activo]) seleccionarPersona(lista[activo]); }
  };

  const copiar = async (clave, valor) => {
    try { await navigator.clipboard.writeText(String(valor)); setCopiado(clave); setTimeout(() => setCopiado(''), 1400); } catch { /* ignorar */ }
  };

  /* ---------- Navegación y sesión ---------- */
  const irPerfil = () => { setAbierto(null); onIrPerfil ? onIrPerfil() : (window.location.href = '/perfil'); };
  const abrirConfig = () => { setAbierto(null); setConfigAbierta(true); };

  const cerrarSesion = async () => {
    setAbierto(null);
    setConfigAbierta(false);
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');

    try {
      if (token) {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      }
    } catch {
      // Si el token ya expiró o fue revocado, continuamos con la limpieza local
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUsuarioActual({});
      setCambiosLocales({});
      setErrorAvatar(false);
      window.dispatchEvent(new Event('usuario_actualizado'));
      window.dispatchEvent(new Event('user-updated'));

      if (onCerrarSesion) {
        onCerrarSesion();
      } else {
        window.location.href = '/login';
      }
    }
  };

  // Se llama al guardar desde la ventana de configuración
  const alGuardarConfig = (cambios, enServidor) => {
    setCambiosLocales((c) => ({ ...c, ...cambios }));
    setErrorAvatar(false);
    try {
      const raw = JSON.parse(localStorage.getItem('user') || 'null');
      let nuevo;
      if (raw && typeof raw === 'object' && raw.user) nuevo = { ...raw, user: { ...raw.user, ...cambios } };
      else if (raw && typeof raw === 'object' && raw.data) nuevo = { ...raw, data: { ...raw.data, ...cambios } };
      else nuevo = { ...(raw || {}), ...cambios };
      localStorage.setItem('user', JSON.stringify(nuevo));
    } catch { /* ignorar */ }
    window.dispatchEvent(new Event('usuario_actualizado'));
    window.dispatchEvent(new Event('user-updated'));
    if (enServidor === false) avisar('aviso', 'Se guardó en este equipo, pero no hubo conexión con el servidor.');
    else avisar('ok', 'Configuración guardada.');
  };

  const marcarLeidas = async () => {
    try {
      await api.post('/notificaciones/leer-todas');
      invalidateApiCache('/notificaciones');
      setNotifs((items) => items.map((item) => ({ ...item, leida: true })));
      setErrorNotifs('');
    } catch (error) {
      console.error('No se pudieron marcar todas como leídas:', error);
      setErrorNotifs(error.response?.data?.message || 'No se pudieron actualizar las notificaciones.');
    }
  };

  const leerNotif = async (id) => {
    try {
      await api.patch(`/notificaciones/${encodeURIComponent(id)}/leer`);
      invalidateApiCache('/notificaciones');
      const notificacion = notifs.find((item) => item.id === id);
      setNotifs((items) => items.map((item) => (
        item.id === id ? { ...item, leida: true } : item
      )));
      setErrorNotifs('');
      if (notificacion?.vista) {
        setAbierto(null);
        onCambiarVista?.(notificacion.vista);
      }
    } catch (error) {
      console.error('No se pudo marcar la notificación como leída:', error);
      setErrorNotifs(error.response?.data?.message || 'No se pudo actualizar la notificación.');
    }
  };

  /* ---------- Estilos según tema ---------- */
  const t = d
    ? {
        barra: 'bg-[#0b1b3a] border-[#1e335c] text-white',
        campo: 'bg-[#0f172a] border-[#1e335c] text-slate-100 placeholder:text-slate-500',
        panel: 'bg-[#0b1b3a] border-[#1e335c] text-slate-100',
        borde: 'border-[#1e335c]',
        linea: 'divide-[#16294f]',
        hover: 'hover:bg-[#13264c]',
        suave: 'text-slate-400',
        icono: 'text-slate-300 hover:bg-[#13264c] hover:text-white',
        superficie: 'bg-[#0f172a]',
      }
    : {
        barra: 'bg-white border-slate-200 text-slate-800',
        campo: 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400',
        panel: 'bg-white border-slate-200 text-slate-700',
        borde: 'border-slate-200',
        linea: 'divide-slate-100',
        hover: 'hover:bg-slate-50',
        suave: 'text-slate-500',
        icono: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
        superficie: 'bg-slate-50',
      };

  const panel = `nv-pop absolute top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-xl ${t.panel}`;
  const fila = `flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs outline-none transition-colors ${t.hover} focus-visible:bg-blue-600/10`;
  const botonIcono = `group relative grid h-9 w-9 cursor-pointer place-items-center rounded-xl border transition duration-150 active:scale-95 sm:h-10 sm:w-10 ${t.borde} ${t.icono} ${foco}`;

  const mostrandoAtributos = query.trim().length < 2;

  return (
    <>
      <style>{ESTILOS}</style>

      <header className={`nv-font relative z-40 flex h-auto min-h-[65px] shrink-0 select-none items-center justify-between gap-2 border-b px-3 py-2 shadow-sm transition-colors duration-200 sm:h-[65px] sm:py-0 sm:gap-4 sm:px-5 ${t.barra}`}>
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú de navegación"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border lg:hidden ${t.borde} ${t.icono} ${foco}`}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        {/* Buscador global */}
        <div className="relative min-w-0 w-full max-w-md flex-1" data-menu>
          <div className={`flex w-full items-center rounded-xl border px-3.5 py-2 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/15 ${d ? 'border-[#1e335c] bg-[#0f172a] text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 focus-within:bg-white'}`}>
            <Search className={`mr-2.5 h-4 w-4 shrink-0 ${d ? 'text-blue-400' : 'text-slate-400'}`} />
            <input
              ref={buscador}
              type="text"
              role="combobox"
              aria-expanded={abierto === 'buscar'}
              aria-label="Búsqueda global"
              placeholder="Buscar por nombre, DNI, correo o rol…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setAbierto('buscar'); }}
              onFocus={() => setAbierto('buscar')}
              onKeyDown={alTeclearBuscador}
              className="w-full border-none bg-transparent text-xs text-current outline-none placeholder:text-slate-400 focus:ring-0"
            />
            {query ? (
              <button type="button" onClick={() => { setQuery(''); setResultados([]); buscador.current?.focus(); }} aria-label="Limpiar búsqueda" className={`ml-1 cursor-pointer rounded-md p-1 ${t.icono}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className={`ml-2 hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold sm:block ${t.borde} ${t.suave}`}>Ctrl K</kbd>
            )}
          </div>

          {abierto === 'buscar' && (
            <div ref={listaRef} role="listbox" aria-label="Resultados de búsqueda" className={`${panel} left-0 max-h-[28rem] w-full overflow-y-auto`}>
              {/* Filtro opcional por tipo: no hace falta elegirlo para buscar */}
              <div className={`sticky top-0 z-10 flex items-center gap-1.5 border-b px-3 py-2.5 ${t.borde} ${t.panel}`}>
                {[['todos', 'Todos', null], ['alumno', 'Alumnos', GraduationCap], ['docente', 'Docentes', Shield]].map(([k, l, Ico]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={filtroTipo === k}
                    onClick={() => { setFiltroTipo(k); setActivo(0); buscador.current?.focus(); }}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition duration-150 active:scale-95 ${foco} ${filtroTipo === k ? 'border-blue-600 bg-blue-600 text-white' : `${t.borde} ${t.suave} hover:text-blue-600`}`}
                  >
                    {Ico && <Ico className="h-3 w-3" />} {l}
                  </button>
                ))}
                <span className={`ml-auto hidden text-[10.5px] sm:block ${t.suave}`}>Busca en nombre, DNI y correo</span>
              </div>

              {sinConsulta ? (
                lista.length > 0 ? (
                  <>
                    <div className={`flex items-center justify-between px-4 pb-1 pt-3 text-[11px] font-bold ${t.suave}`}>
                      <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Recientes</span>
                      <button type="button" onClick={borrarRecientes} className={`cursor-pointer rounded px-1.5 py-0.5 font-semibold transition hover:text-blue-600 ${foco}`}>Borrar</button>
                    </div>
                    {lista.map((p, i) => (
                      <FilaPersona
                        key={claveDe(p)}
                        p={p}
                        q=""
                        t={t}
                        activa={i === activo}
                        onHover={() => setActivo(i)}
                        onAbrir={() => seleccionarPersona(p)}
                        onExpediente={() => abrirExpediente(p)}
                      />
                    ))}
                  </>
                ) : (
                  <div className="nv-rise px-6 py-9 text-center">
                    <span className={`mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border text-blue-600 ${t.borde}`}><Search className="h-5 w-5" /></span>
                    <p className="text-[13px] font-bold">Busca alumnos y docentes</p>
                    <p className={`mx-auto mt-1 max-w-xs text-[12px] ${t.suave}`}>Escribe un nombre, un DNI o un correo. No hace falta elegir el tipo de dato.</p>
                  </div>
                )
              ) : buscando ? (
                <p className={`px-4 py-8 text-center text-xs ${t.suave}`}><Loader2 className="nv-spin mx-auto mb-2 h-4 w-4" /> Buscando coincidencias…</p>
              ) : errorBusqueda ? (
                <p role="alert" className="px-4 py-8 text-center text-xs text-rose-500">{errorBusqueda}</p>
              ) : lista.length === 0 ? (
                <p className={`px-4 py-8 text-center text-xs ${t.suave}`}>No se encontraron {filtroTipo === 'alumno' ? 'alumnos' : filtroTipo === 'docente' ? 'docentes' : 'registros'} para "<b>{query}</b>"</p>
              ) : (
                <>
                  {grupos.map(([titulo, Ico, items, desfase]) => items.length > 0 && (
                    <div key={titulo}>
                      <div className={`flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-bold ${t.suave}`}>
                        <Ico className="h-3 w-3" /> {titulo}
                        <span className={`rounded-full border px-1.5 text-[10px] ${t.borde}`}>{items.length}</span>
                      </div>
                      {items.map((p, i) => (
                        <FilaPersona
                          key={claveDe(p)}
                          p={p}
                          q={query}
                          t={t}
                          activa={desfase + i === activo}
                          onHover={() => setActivo(desfase + i)}
                          onAbrir={() => seleccionarPersona(p)}
                          onExpediente={() => abrirExpediente(p)}
                        />
                      ))}
                    </div>
                  ))}
                  <div className={`flex items-center gap-3 border-t px-4 py-2 text-[10.5px] ${t.borde} ${t.suave}`}>
                    <span><kbd className={`rounded border px-1 ${t.borde}`}>↑</kbd> <kbd className={`rounded border px-1 ${t.borde}`}>↓</kbd> navegar</span>
                    <span><kbd className={`rounded border px-1 ${t.borde}`}>Enter</kbd> ver información</span>
                    <span className="ml-auto flex items-center gap-1"><FolderOpen className="h-3 w-3" /> abre el expediente</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controles de la derecha */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
          {/* Tema */}
          <div role="group" aria-label="Tema" className={`relative hidden h-10 grid-cols-2 rounded-xl border p-0.5 sm:grid ${t.borde}`}>
            <span
              aria-hidden="true"
              className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-lg bg-blue-600 transition-transform duration-300 ease-out"
              style={{ transform: d ? 'translateX(100%)' : 'translateX(0)' }}
            />
            {[[false, Sun, 'Luz'], [true, Moon, 'Oscuro']].map(([val, Ico, nombre]) => (
              <button
                key={nombre}
                type="button"
                onClick={() => cambiarTema(val ? 'oscuro' : 'luz')}
                aria-label={`Tema ${nombre.toLowerCase()}`}
                aria-pressed={d === val}
                className={`relative z-10 grid w-9 cursor-pointer place-items-center rounded-lg transition-colors ${foco} ${d === val ? 'text-white' : t.suave}`}
              >
                <Ico className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Notificaciones */}
          <div className="relative" data-menu>
            <button onClick={abrirNotificaciones} className={botonIcono} aria-label={`Notificaciones${sinLeer ? `, ${sinLeer} sin leer` : ''}`} aria-haspopup="menu" aria-expanded={abierto === 'notif'} title="Notificaciones">
              <Bell className={`h-4 w-4 ${d ? 'text-blue-400' : ''}`} />
              {sinLeer > 0 && (
                <span className={`nv-pop absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full border-2 bg-blue-600 px-1 text-[9px] font-bold leading-none text-white ${d ? 'border-[#0b1b3a]' : 'border-white'}`}>
                  {sinLeer}
                </span>
              )}
            </button>

            {abierto === 'notif' && (
              <div className={`${panel} right-0 w-[min(20rem,calc(100vw-1rem))]`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${t.borde}`}>
                  <span className="text-xs font-bold">Notificaciones {sinLeer > 0 && <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] text-white">{sinLeer}</span>}</span>
                  {sinLeer > 0 && (
                    <button onClick={marcarLeidas} className={`flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-600/10 ${foco}`}>
                      <Check className="h-3.5 w-3.5" /> Marcar leídas
                    </button>
                  )}
                </div>
                <div className={`max-h-72 divide-y overflow-y-auto ${t.linea}`}>
                  {errorNotifs && <p role="alert" className="px-4 py-3 text-center text-xs text-rose-500">{errorNotifs}</p>}
                  {cargandoNotifs && notifsVisibles.length === 0 && <p className={`px-4 py-8 text-center text-xs ${t.suave}`}>Cargando notificaciones…</p>}
                  {!cargandoNotifs && !errorNotifs && notifsVisibles.length === 0 && <p className={`px-4 py-8 text-center text-xs ${t.suave}`}>Sin notificaciones activas</p>}
                  {notifsVisibles.map((n, i) => {
                    const Ico = ICONO_CATEGORIA[n.categoria] || Bell;
                    return (
                      <button key={n.id} onClick={() => leerNotif(n.id)} style={{ animationDelay: `${i * 40}ms` }} className={`${fila} nv-rise ${!n.leida ? (d ? 'bg-blue-600/5' : 'bg-blue-50/40') : ''}`}>
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${n.leida ? (d ? 'bg-[#13264c] text-slate-500' : 'bg-slate-100 text-slate-400') : 'bg-blue-600/10 text-blue-600'}`}><Ico className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate ${n.leida ? t.suave : 'font-semibold text-current'}`}>{n.titulo}</span>
                          <span className={`block text-[10.5px] ${t.suave}`}>{n.detalle}</span>
                        </span>
                        {!n.leida && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                      </button>
                    );
                  })}
                </div>
                <button onClick={abrirConfig} className={`flex w-full cursor-pointer items-center justify-center gap-1.5 border-t px-4 py-2.5 text-[11px] font-semibold ${t.borde} ${t.suave} ${t.hover} ${foco}`}>
                  <Settings className="h-3.5 w-3.5" /> Elegir qué avisos recibir
                </button>
              </div>
            )}
          </div>

          {/* Pantalla completa */}
          <button
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
            className={`${botonIcono} hidden sm:grid`}
            title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {pantallaCompleta ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Configuración: abre la ventana flotante */}
          <button onClick={abrirConfig} className={botonIcono} title="Configuración" aria-label="Abrir configuración" aria-haspopup="dialog">
            <Settings className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
          </button>

          {/* Perfil */}
          <span aria-hidden="true" className={`mx-0.5 hidden h-6 w-px sm:block ${d ? 'bg-[#1e335c]' : 'bg-slate-200'}`} />
          <div className="relative" data-menu>
            <button
              type="button"
              onClick={() => alternar('perfil')}
              aria-haspopup="menu"
              aria-expanded={abierto === 'perfil'}
              className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border py-1 pl-1 pr-3 transition duration-200 ${foco} ${t.borde} ${d ? 'hover:bg-[#13264c]' : 'hover:border-blue-300 hover:shadow-md hover:shadow-blue-100'} ${abierto === 'perfil' ? (d ? 'bg-[#13264c]' : 'border-blue-300 shadow-md shadow-blue-100') : ''}`}
            >
              <span className="relative shrink-0">
                <img src={avatarUrl} alt="" onError={() => setErrorAvatar(true)} className="h-8 w-8 rounded-lg object-cover" />
                <span title="Sesión activa" className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-emerald-400 ${d ? 'border-[#0b1b3a]' : 'border-white'}`} />
              </span>
              <span className="hidden min-w-0 text-left leading-tight md:block">
                <span className="block max-w-[120px] truncate text-xs font-semibold">{nombreUsuario}</span>
              </span>
              <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${t.suave} ${abierto === 'perfil' ? 'rotate-90' : ''}`} />
            </button>

            {abierto === 'perfil' && (
              <div role="menu" className={`${panel} right-0 w-[min(16rem,calc(100vw-1rem))]`}>
                <div className={`flex items-center gap-3 border-b px-4 py-3.5 ${t.borde}`}>
                  <img src={avatarUrl} alt="" onError={() => setErrorAvatar(true)} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-xs font-bold">{nombreUsuario}</p>
                    <p className={`truncate text-[10.5px] ${t.suave}`}>{usuarioMostrado?.correo || usuarioMostrado?.email || 'Sesión activa'}</p>
                  </div>
                </div>
                <button role="menuitem" onClick={irPerfil} className={fila}><User className={`h-4 w-4 ${t.suave}`} /> Mi perfil</button>
                <button role="menuitem" onClick={abrirConfig} className={fila}><Settings className={`h-4 w-4 ${t.suave}`} /> Configuración</button>
                <div className={`border-t ${t.borde}`} />
                <button role="menuitem" onClick={cerrarSesion} className={`${fila} text-rose-500 hover:!bg-rose-500/10`}><LogOut className="h-4 w-4" /> Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Ventana flotante de configuración */}
      {configAbierta && (
        <Configuracion
          d={d}
          t={t}
          usuario={usuarioMostrado}
          rolEtiqueta={rolEtiqueta}
          modoTema={modoTema}
          onTema={cambiarTema}
          onGuardado={alGuardarConfig}
          onCerrar={() => setConfigAbierta(false)}
          onCerrarSesion={cerrarSesion}
          avisar={avisar}
        />
      )}

      {/* Ficha de persona seleccionada */}
      {personaSeleccionada && (
        <div className="nv-fade fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setPersonaSeleccionada(null); }}>
          <div role="dialog" aria-modal="true" className={`nv-font nv-modal w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${t.panel}`}>
            <div className={`flex items-center justify-between gap-3 border-b px-6 py-5 ${t.borde}`}>
              <div className="flex min-w-0 items-center gap-3.5">
                <AvatarEstudiante
                  estudiante={personaSeleccionada}
                  className="h-12 w-12 rounded-2xl text-[14px] font-bold"
                  fallbackClassName={esAlumnoSel ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-600/10 text-blue-600"}
                />
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold">{nombreDe(personaSeleccionada) || 'Sin nombre'}</h3>
                  <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${esAlumnoSel ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-600/10 text-blue-600'}`}>
                    <i className={`h-1.5 w-1.5 rounded-full ${esAlumnoSel ? 'bg-emerald-500' : 'bg-blue-600'}`} /> {esAlumnoSel ? 'Alumno' : 'Docente'}
                  </span>
                </div>
              </div>
              <button onClick={() => setPersonaSeleccionada(null)} aria-label="Cerrar" className={`cursor-pointer rounded-lg p-2 transition ${t.icono} ${foco}`}><X className="h-4 w-4" /></button>
            </div>

            {datosExtra.length > 0 && (
              <div className={`grid grid-cols-2 gap-px border-b ${t.borde} ${d ? 'bg-[#1e335c]' : 'bg-slate-200'}`}>
                {datosExtra.map(([k, v], i) => (
                  <div key={k} style={{ animationDelay: `${i * 40}ms` }} className={`nv-rise px-6 py-3 ${t.panel.split(' ')[0]}`}>
                    <p className={`text-[11px] ${t.suave}`}>{k}</p>
                    <p className="truncate text-[13px] font-bold">{String(v)}</p>
                  </div>
                ))}
              </div>
            )}

            <dl className={`divide-y px-6 py-1 text-xs ${t.linea}`}>
              {[
                ['correo', 'Correo electrónico', personaSeleccionada.correo || personaSeleccionada.email, 'No registrado'],
                ['dni', 'Documento / DNI', personaSeleccionada.dni || personaSeleccionada.numero_documento, 'No especificado'],
                ['tel', 'Teléfono / Celular', personaSeleccionada.telefono, 'Sin contacto'],
                ['prog', 'Especialidad / Programa', personaSeleccionada.especialidad || personaSeleccionada.programa || PROGRAMA, ''],
              ].map(([k, etiqueta, valor, vacio]) => (
                <div key={k} className="group flex items-center justify-between gap-4 py-3">
                  <dt className={`font-medium ${t.suave}`}>{etiqueta}</dt>
                  <dd className="flex min-w-0 items-center gap-2 font-semibold">
                    <span className={`truncate ${k === 'dni' ? 'font-mono' : ''} ${!valor ? t.suave : ''}`}>{valor || vacio}</span>
                    {valor && k !== 'prog' && (
                      <button onClick={() => copiar(k, valor)} aria-label={`Copiar ${etiqueta}`} className={`cursor-pointer rounded-md p-1 opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100 ${t.icono}`}>
                        {copiado === k ? <Check className="nv-pop h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className={`flex flex-wrap justify-end gap-2.5 border-t px-6 py-4 ${t.borde}`}>
              <button onClick={() => setPersonaSeleccionada(null)} className={`cursor-pointer rounded-lg border px-4 py-2.5 text-xs font-bold transition active:scale-95 ${t.borde} ${t.icono} ${foco}`}>
                Cerrar
              </button>
              {esAlumnoSel && (
                <button onClick={() => abrirExpediente(personaSeleccionada)} className={`flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 shadow-sm shadow-blue-600/25 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 ${foco}`}>
                  <FolderOpen className="h-4 w-4" /> Ver expediente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aviso */}
      {toast && (
        <div key={toast.id} role="status" className={`nv-font nv-toast fixed bottom-5 right-5 z-[90] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl ${t.panel}`}>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${toast.tipo === 'ok' ? 'bg-emerald-500' : toast.tipo === 'aviso' ? 'bg-amber-500' : 'bg-rose-500'}`}>
            {toast.tipo === 'ok' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </span>
          <span className="flex-1">{toast.texto}</span>
          <button onClick={() => setToast(null)} aria-label="Cerrar aviso" className={`cursor-pointer ${t.suave}`}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </>
  );
}

export default Navbar;