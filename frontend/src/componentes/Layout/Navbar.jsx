import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Bell, Maximize, Settings, ChevronRight, User, LogOut, Sun, Moon,
  Check, Shield, GraduationCap, X, Building2, Sparkles, Hash, Mail
} from 'lucide-react';
import imagenPerfil from '../../assets/perfil.jpg';

const API_URL = 'http://localhost:8000/api';

const NOTIF_DEMO = [
  { id: 1, categoria: 'constancias', titulo: 'Nueva práctica registrada', detalle: 'Hace 5 min', leida: false },
  { id: 2, categoria: 'revisiones', titulo: 'Informe pendiente de revisión', detalle: 'Hace 1 h', leida: false },
  { id: 3, categoria: 'sistema', titulo: 'Alumno validado por MINEDU', detalle: 'Ayer', leida: true },
  { id: 4, categoria: 'login', titulo: 'Nuevo inicio de sesión detectado', detalle: 'Hoy, 08:30 AM', leida: false },
];

const ATRIBUTOS_SUGERIDOS = [
  { prefijo: 'DNI ', etiqueta: 'Buscar por DNI', ejemplo: 'Ej. 74859612', icono: Hash },
  { prefijo: 'Docente ', etiqueta: 'Filtrar Docentes', ejemplo: 'Ej. Ing. Carlos', icono: Shield },
  { prefijo: 'Alumno ', etiqueta: 'Filtrar Estudiantes', ejemplo: 'Ej. María López', icono: GraduationCap },
  { prefijo: 'Correo ', etiqueta: 'Buscar por Correo', ejemplo: 'Ej. @iestp.edu.pe', icono: Mail },
];

function Navbar({
  darkMode, setDarkMode, usuario,
  notificaciones = NOTIF_DEMO, buscarGlobal, onSeleccionarPersona,
  onIrPerfil, onIrAjustes, onCerrarSesion,
}) {
  const usuarioGuardado = usuario || JSON.parse(localStorage.getItem('user') || '{}');
  
  const nombreUsuario = usuarioGuardado?.nombres || usuarioGuardado?.nombre || usuarioGuardado?.name || 'Usuario';
  const avatarUrl = imagenPerfil;

  const [abierto, setAbierto] = useState(null); // 'buscar' | 'notif' | 'ajustes' | 'perfil' | null
  const [notifs, setNotifs] = useState(notificaciones);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

  // Preferencias de notificaciones sincronizadas con Notificaciones.jsx
  const [preferencias, setPreferencias] = useState(() =>
    JSON.parse(
      localStorage.getItem('preferencias_notificaciones') ||
      '{"login":true,"clave":true,"constancias":true,"revisiones":true,"sistema":true}'
    )
  );

  useEffect(() => {
    const actualizarPrefs = (e) => setPreferencias(e.detail);
    window.addEventListener('preferencias_notif_cambiadas', actualizarPrefs);
    return () => window.removeEventListener('preferencias_notif_cambiadas', actualizarPrefs);
  }, []);

  const notifsVisibles = notifs.filter((n) => !n.categoria || preferencias[n.categoria] !== false);
  const sinLeer = notifsVisibles.filter((n) => !n.leida).length;
  const alternar = (id) => setAbierto((a) => (a === id ? null : id));

  // Cerrar menús al hacer clic fuera o presionar Escape
  useEffect(() => {
    const fuera = (e) => { if (!e.target.closest('[data-menu]')) setAbierto(null); };
    const esc = (e) => { if (e.key === 'Escape') setAbierto(null); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  // Búsqueda inteligente en vivo con recomendaciones por atributo
  useEffect(() => {
    const limpio = query.trim();
    if (limpio.length < 2) {
      setResultados([]);
      return undefined;
    }

    let activo = true;
    setBuscando(true);

    const t = setTimeout(async () => {
      try {
        const terminoReal = limpio.replace(/^(DNI|Docente|Alumno|Correo):\s*/i, '').trim();
        if (terminoReal.length < 2) {
          if (activo) { setResultados([]); setBuscando(false); }
          return;
        }

        if (buscarGlobal) {
          const r = await buscarGlobal(terminoReal);
          if (activo) { setResultados(r || []); setAbierto('buscar'); }
        } else {
          const token = localStorage.getItem('token') || localStorage.getItem('access_token');
          const res = await axios.get(`${API_URL}/buscar-global?q=${encodeURIComponent(terminoReal)}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          });
          if (activo) {
            setResultados(Array.isArray(res.data) ? res.data : []);
            setAbierto('buscar');
          }
        }
      } catch {
        if (activo) setResultados([]);
      } finally {
        if (activo) setBuscando(false);
      }
    }, 280);

    return () => { activo = false; clearTimeout(t); };
  }, [query, buscarGlobal]);

  const aplicarRecomendacion = (prefijo) => {
    setQuery(`${prefijo.trim()}: `);
    setAbierto('buscar');
  };

  const seleccionarPersona = (persona) => {
    setPersonaSeleccionada(persona);
    onSeleccionarPersona?.(persona);
    setQuery('');
    setResultados([]);
    setAbierto(null);
  };

  const irPerfil = () => { setAbierto(null); onIrPerfil ? onIrPerfil() : (window.location.href = '/perfil'); };
  const irAjustes = () => { setAbierto(null); onIrAjustes ? onIrAjustes() : (window.location.href = '/configuracion'); };

  const cerrarSesion = () => {
    setAbierto(null);
    if (onCerrarSesion) return onCerrarSesion();
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return undefined;
  };

  const marcarLeidas = () => setNotifs((l) => l.map((n) => ({ ...n, leida: true })));
  const leerNotif = (id) => setNotifs((l) => l.map((n) => (n.id === id ? { ...n, leida: true } : n)));

  const panel = `absolute top-full mt-2 z-50 rounded-xl border shadow-xl overflow-hidden backdrop-blur-md transition-all ${
    darkMode ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-700'
  }`;

  // Estilo de fila limpio similar a notificaciones para los resultados de búsqueda
  const itemResultado = `w-full flex items-center gap-3 px-4 py-3 text-xs text-left outline-none transition-colors border-b ${
    darkMode ? 'border-slate-800 hover:bg-slate-800/80 text-slate-200' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
  }`;

  const separador = darkMode ? 'border-slate-800' : 'border-slate-100';

  return (
    <>
      <header className={`h-[65px] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} border-b px-6 flex items-center justify-between transition-colors duration-200 select-none`}>
        
        {/* Buscador Global con Recomendaciones por Atributo */}
        <div className="w-80 sm:w-96 relative" data-menu>
          <div className={`relative flex items-center w-full rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'} px-3.5 py-2 transition-all focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-500`}>
            <Search className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, correo o rol..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAbierto('buscar');
              }}
              onFocus={() => setAbierto('buscar')}
              className="w-full bg-transparent border-none outline-none text-xs placeholder-slate-400 text-current focus:ring-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResultados([]); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desplegable de Recomendaciones y Resultados */}
          {abierto === 'buscar' && (
            <div className={`${panel} left-0 w-full max-h-80 overflow-y-auto shadow-2xl divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {query.trim().length < 2 ? (
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    Recomendaciones por atributo
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {ATRIBUTOS_SUGERIDOS.map((atr) => {
                      const IconoAtr = atr.icono;
                      return (
                        <button
                          key={atr.prefijo}
                          type="button"
                          onClick={() => aplicarRecomendacion(atr.prefijo)}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-all ${
                            darkMode
                              ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-200'
                              : 'border-slate-100 bg-slate-50/70 hover:bg-sky-50/70 hover:border-sky-200 text-slate-700'
                          }`}
                        >
                          <IconoAtr className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold truncate">{atr.etiqueta}</p>
                            <p className="text-[9.5px] text-slate-400 truncate">{atr.ejemplo}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className={`px-4 py-2.5 flex items-center justify-between text-[10px] font-semibold text-slate-400 bg-slate-50/50 dark:bg-slate-800/50`}>
                    <span>Resultados de búsqueda</span>
                    {resultados.length > 0 && <span>{resultados.length} encontrados</span>}
                  </div>

                  {buscando && (
                    <p className="px-4 py-6 text-xs text-slate-400 text-center">Buscando coincidencias...</p>
                  )}

                  {!buscando && resultados.length === 0 && (
                    <p className="px-4 py-6 text-xs text-slate-400 text-center">
                      No se encontraron registros para "{query}"
                    </p>
                  )}

                  {!buscando && resultados.map((itemRes) => {
                    const subtitulo = itemRes.dni ? `DNI: ${itemRes.dni}` : (itemRes.correo || itemRes.email || itemRes.especialidad || 'Registro académico');
                    return (
                      <button
                        key={`${itemRes.tipo || 'reg'}-${itemRes.id || itemRes.id_estudiante || itemRes.id_docente}`}
                        onClick={() => seleccionarPersona(itemRes)}
                        className={itemResultado}
                      >
                        {/* Indicador de estado / punto verde o icono institucional limpio */}
                        <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-400" />
                        
                        <div className="flex-1 min-w-0 text-left leading-snug">
                          <p className="font-semibold text-current truncate">
                            {itemRes.nombres || itemRes.nombre || itemRes.razon_social} {itemRes.apellidos || ''}
                          </p>
                          <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                            {subtitulo}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0 ${
                          itemRes.tipo === 'docente'
                            ? 'bg-sky-500/10 text-sky-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {itemRes.tipo || 'Alumno'}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Controles de la derecha */}
        <div className="flex items-center gap-3">
          
          {/* Toggle Modo Claro / Oscuro */}
          <div className={`flex items-center p-0.5 rounded-full border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setDarkMode(false)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all outline-none ${!darkMode ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Luz
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all outline-none ${darkMode ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}
            >
              Oscuro
            </button>
          </div>

          {/* Panel de Notificaciones */}
          <div className="relative" data-menu>
            <button
              onClick={() => alternar('notif')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border outline-none transition-all ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-sky-600'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificaciones</span>
              {sinLeer > 0 && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-0.5"></span>}
            </button>

            {abierto === 'notif' && (
              <div className={`${panel} right-0 w-80 shadow-2xl`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${separador}`}>
                  <span className="text-xs font-bold">Notificaciones {sinLeer > 0 && `(${sinLeer})`}</span>
                  {sinLeer > 0 && (
                    <button onClick={marcarLeidas} className="flex items-center gap-1 text-[10px] text-sky-500 hover:underline outline-none font-medium">
                      <Check className="w-3.5 h-3.5" /> Marcar leídas
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/10">
                  {notifsVisibles.length === 0 && (
                    <p className="px-4 py-5 text-xs text-center text-slate-400">Sin notificaciones activas</p>
                  )}
                  {notifsVisibles.map((n) => (
                    <button key={n.id} onClick={() => leerNotif(n.id)} className={itemResultado}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${n.leida ? 'bg-transparent' : 'bg-emerald-400'}`}></span>
                      <span className="flex-1 min-w-0 text-left">
                        <span className={`block truncate ${n.leida ? 'text-slate-400' : 'font-semibold text-current'}`}>{n.titulo}</span>
                        <span className="block text-[10px] text-slate-400">{n.detalle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pantalla Completa */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className={`p-2.5 rounded-xl border outline-none transition-all ${
              darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-500'
            }`}
            title="Pantalla completa"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Menú de Ajustes */}
          <div className="relative" data-menu>
            <button
              onClick={() => alternar('ajustes')}
              className={`p-2.5 rounded-xl border relative outline-none transition-all ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-500'
              }`}
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            </button>

            {abierto === 'ajustes' && (
              <div className={`${panel} right-0 w-52 shadow-2xl`}>
                <button onClick={irAjustes} className={itemResultado}><Settings className="w-4 h-4 text-slate-400" /> Configuración</button>
                <button onClick={() => { setDarkMode(!darkMode); setAbierto(null); }} className={itemResultado}>
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                  {darkMode ? 'Cambiar a modo luz' : 'Cambiar a modo oscuro'}
                </button>
              </div>
            )}
          </div>

          {/* Menú de Usuario / Perfil (Sin sombreado interno, imagen original restaurada) */}
          <div className="relative" data-menu>
            <div
              onClick={() => alternar('perfil')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && alternar('perfil')}
              className={`flex items-center gap-2.5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-900'} text-white pl-1.5 py-1 pr-3.5 rounded-full shadow-sm ml-1 cursor-pointer opacity-95 hover:opacity-100 transition-opacity`}
            >
              <img 
                src={avatarUrl} 
                alt={nombreUsuario} 
                className="w-7 h-7 rounded-full object-cover border border-slate-700" 
              />
              <span className="text-xs font-semibold max-w-[110px] truncate">{nombreUsuario}</span>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${abierto === 'perfil' ? 'rotate-90' : ''}`} />
            </div>

            {abierto === 'perfil' && (
              <div className={`${panel} right-0 w-48 shadow-2xl`}>
                <div className={`px-3.5 py-2.5 border-b ${separador}`}>
                  <p className="text-[10px] text-slate-400 font-medium">Sesión activa</p>
                  <p className="text-xs font-bold truncate">{nombreUsuario}</p>
                </div>
                <button onClick={irPerfil} className={itemResultado}><User className="w-4 h-4 text-slate-400" /> Mi perfil</button>
                <button onClick={irAjustes} className={itemResultado}><Settings className="w-4 h-4 text-slate-400" /> Configuración</button>
                <div className={`border-t ${separador}`}></div>
                <button onClick={cerrarSesion} className={`${itemResultado} text-red-500 hover:bg-red-500/10`}><LogOut className="w-4 h-4" /> Cerrar sesión</button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Modal de Información Detallada */}
      {personaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-lg">
                  {(personaSeleccionada.nombres || personaSeleccionada.nombre || 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {personaSeleccionada.nombres || personaSeleccionada.nombre} {personaSeleccionada.apellidos}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                    {personaSeleccionada.tipo || 'Miembro institucional'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPersonaSeleccionada(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Correo electrónico:</span>
                <span className="font-semibold">{personaSeleccionada.correo || personaSeleccionada.email || 'No registrado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Documento / DNI:</span>
                <span className="font-semibold font-mono">{personaSeleccionada.dni || personaSeleccionada.numero_documento || 'No especificado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Teléfono / Celular:</span>
                <span className="font-semibold">{personaSeleccionada.telefono || 'Sin contacto'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 font-medium">Especialidad / Programa:</span>
                <span className="font-semibold">{personaSeleccionada.especialidad || personaSeleccionada.programa || 'Diseño y Programación Web'}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/20 flex justify-end">
              <button
                onClick={() => setPersonaSeleccionada(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;