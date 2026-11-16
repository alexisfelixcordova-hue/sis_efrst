import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Check, Trash2 } from "lucide-react";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Mismos colores del dashboard: azul principal, verde, ámbar y violeta
const TIPOS = {
  Reunión: { punto: "bg-blue-600", barra: "border-l-blue-600", claro: "bg-blue-50 text-blue-700", oscuro: "bg-blue-500/15 text-blue-300" },
  Entrega: { punto: "bg-amber-500", barra: "border-l-amber-500", claro: "bg-amber-50 text-amber-700", oscuro: "bg-amber-500/15 text-amber-300" },
  Visita: { punto: "bg-emerald-500", barra: "border-l-emerald-500", claro: "bg-emerald-50 text-emerald-700", oscuro: "bg-emerald-500/15 text-emerald-300" },
  Otro: { punto: "bg-violet-500", barra: "border-l-violet-500", claro: "bg-violet-50 text-violet-700", oscuro: "bg-violet-500/15 text-violet-300" },
};

/* ---------- Fechas ---------- */
const clave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const desdeClave = (k) => { const [a, m, d] = k.split("-").map(Number); return new Date(a, m - 1, d); };
const sumarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const enMinutos = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };

const faltan = (ms) => {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `en ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `en ${h} h ${min % 60} min`;
  const d = Math.floor(h / 24);
  return `en ${d} día${d > 1 ? "s" : ""}`;
};

const duracion = (i, f) => {
  const min = enMinutos(f) - enMinutos(i);
  const h = Math.floor(min / 60), m = min % 60;
  return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`;
};

/* ---------- Datos guardados en este navegador ---------- */
const leer = (llave, porDefecto) => {
  try {
    const g = JSON.parse(localStorage.getItem(llave));
    if (g !== null && g !== undefined) return g;
  } catch { /* sin datos */ }
  return porDefecto;
};

const eventosDemo = () => {
  const hoy = new Date();
  return [
    { id: 1, titulo: "Reunión con asesores", fecha: clave(hoy), inicio: "15:00", fin: "16:00", tipo: "Reunión", nota: "Revisión del avance de prácticas." },
    { id: 2, titulo: "Entrega de bitácoras", fecha: clave(sumarDias(hoy, 2)), inicio: "08:00", fin: "12:00", tipo: "Entrega", nota: "" },
    { id: 3, titulo: "Visita a Tech Solutions Perú", fecha: clave(sumarDias(hoy, 4)), inicio: "10:00", fin: "12:30", tipo: "Visita", nota: "Supervisión de los alumnos en la entidad." },
    { id: 4, titulo: "Revisión de informes parciales", fecha: clave(sumarDias(hoy, 4)), inicio: "15:00", fin: "17:00", tipo: "Otro", nota: "" },
    { id: 5, titulo: "Cierre de plazo de informes", fecha: clave(sumarDias(hoy, 9)), inicio: "23:00", fin: "23:59", tipo: "Entrega", nota: "" },
  ];
};

const tareasDemo = () => [
  { id: 1, texto: "Revisar bitácoras pendientes", hecha: false },
  { id: 2, texto: "Confirmar visita a la entidad", hecha: false },
  { id: 3, texto: "Enviar informe a coordinación", hecha: true },
];

const estilos = `
@keyframes cal-subir{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes cal-fade{from{opacity:0}to{opacity:1}}
@keyframes cal-entra{from{opacity:0;transform:scale(.96) translateY(6px)}to{opacity:1;transform:none}}
@keyframes cal-pulso{0%{box-shadow:0 0 0 0 rgba(37,99,235,.45)}70%{box-shadow:0 0 0 7px rgba(37,99,235,0)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}
@media (prefers-reduced-motion: reduce){.cal *{animation:none!important;transition:none!important}}
`;

export default function Calendario({ darkMode }) {
  const hoyClave = clave(new Date());
  const [ahora, setAhora] = useState(new Date());
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [seleccion, setSeleccion] = useState(hoyClave);
  const [eventos, setEventos] = useState(() => { const g = leer("calendario_eventos", null); return Array.isArray(g) ? g : eventosDemo(); });
  const [tareas, setTareas] = useState(() => { const g = leer("calendario_tareas", null); return Array.isArray(g) ? g : tareasDemo(); });
  const [notas, setNotas] = useState(() => leer("calendario_notas", ""));
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  // Todos los colores salen de aquí para que combine en claro y oscuro
  const t = darkMode
    ? { texto: "text-slate-100", suave: "text-slate-400", tarjeta: "bg-slate-900 border-slate-800", fondo: "bg-slate-900", linea: "border-slate-800", rejilla: "bg-slate-800",
        fuera: "bg-slate-950/60", hover: "hover:bg-slate-800/60", sel: "bg-blue-500/10", cabeza: "bg-slate-800/50", divisor: "divide-slate-800",
        boton: "border-slate-700 text-slate-300 hover:bg-slate-800", entrada: "bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" }
    : { texto: "text-slate-900", suave: "text-slate-500", tarjeta: "bg-white border-slate-200", fondo: "bg-white", linea: "border-slate-200", rejilla: "bg-slate-200",
        fuera: "bg-slate-50", hover: "hover:bg-slate-50", sel: "bg-blue-50", cabeza: "bg-slate-50", divisor: "divide-slate-100",
        boton: "border-slate-300 text-slate-700 hover:bg-slate-50", entrada: "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" };

  const chip = (tipo) => (darkMode ? TIPOS[tipo].oscuro : TIPOS[tipo].claro);
  const entrada = `w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition-all ${t.entrada}`;

  useEffect(() => { const id = setInterval(() => setAhora(new Date()), 30000); return () => clearInterval(id); }, []);
  useEffect(() => { try { localStorage.setItem("calendario_eventos", JSON.stringify(eventos)); } catch { /* ignorar */ } }, [eventos]);
  useEffect(() => { try { localStorage.setItem("calendario_tareas", JSON.stringify(tareas)); } catch { /* ignorar */ } }, [tareas]);
  useEffect(() => { try { localStorage.setItem("calendario_notas", JSON.stringify(notas)); } catch { /* ignorar */ } }, [notas]);
  useEffect(() => {
    if (!modal) return;
    const cerrar = (e) => e.key === "Escape" && setModal(null);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [modal]);

  const delDia = (k) => eventos.filter((e) => e.fecha === k).sort((a, b) => a.inicio.localeCompare(b.inicio));

  // Eventos que vienen (para "Recordatorios" y "Próximo")
  const venideros = eventos
    .map((e) => ({ ...e, ini: new Date(`${e.fecha}T${e.inicio}`) }))
    .filter((e) => e.ini > ahora)
    .sort((a, b) => a.ini - b.ini);
  const proximo = venideros[0];

  const etiquetaFecha = (k) => {
    if (k === hoyClave) return "Hoy";
    if (k === clave(sumarDias(new Date(), 1))) return "Mañana";
    return desdeClave(k).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  };

  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const inicioGrid = sumarDias(primero, -((primero.getDay() + 6) % 7));
  const celdas = Array.from({ length: 42 }, (_, i) => sumarDias(inicioGrid, i));

  const irHoy = () => { const h = new Date(); setMes(new Date(h.getFullYear(), h.getMonth(), 1)); setSeleccion(clave(h)); };
  const elegirDia = (d) => { setSeleccion(clave(d)); if (d.getMonth() !== mes.getMonth()) setMes(new Date(d.getFullYear(), d.getMonth(), 1)); };
  const irAFecha = (k) => { const f = desdeClave(k); setSeleccion(k); setMes(new Date(f.getFullYear(), f.getMonth(), 1)); };

  const abrirNuevo = (fecha) => { setError(""); setModal({ titulo: "", fecha, inicio: "09:00", fin: "10:00", tipo: "Reunión", nota: "" }); };

  const guardar = () => {
    if (!modal.titulo.trim()) return setError("Escribe un título para el evento.");
    if (!modal.fecha) return setError("Elige una fecha.");
    if (modal.fin <= modal.inicio) return setError("La hora de fin debe ser posterior a la de inicio.");
    const datos = { ...modal, titulo: modal.titulo.trim() };
    setEventos((prev) => (modal.id ? prev.map((e) => (e.id === modal.id ? datos : e)) : [...prev, { ...datos, id: Date.now() }]));
    irAFecha(modal.fecha);
    setModal(null);
  };
  const eliminar = () => { setEventos((prev) => prev.filter((e) => e.id !== modal.id)); setModal(null); };

  const agregarTarea = (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    setTareas((prev) => [...prev, { id: Date.now(), texto: nuevaTarea.trim(), hecha: false }]);
    setNuevaTarea("");
  };
  const hechas = tareas.filter((x) => x.hecha).length;

  const agenda = delDia(seleccion);
  const fechaLarga = desdeClave(seleccion).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  return (
    <div className={`cal space-y-4 text-xs transition-colors ${t.texto}`}>
      <style>{estilos}</style>

      {/* Título */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Calendario</h1>
          <p className={`mt-0.5 ${t.suave}`}>Reuniones, entregas y visitas de las prácticas EFSRT.</p>
        </div>
        <button onClick={() => abrirNuevo(seleccion)} className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 active:scale-95">
          <Plus size={16} /> Nuevo evento
        </button>
      </div>

      {/* Calendario + panel lateral estilo agenda */}
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_310px]">
        <section style={{ animation: "cal-subir .4s ease both" }} className={`overflow-hidden rounded-2xl border ${t.tarjeta}`}>
          {/* Año, mes grande y navegación */}
          <div className="relative flex items-center justify-center px-5 pb-3 pt-4">
            <span className={`absolute left-5 top-4 text-sm font-bold ${t.suave}`}>{mes.getFullYear()}</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className={`cursor-pointer rounded-lg p-1.5 transition-colors ${t.suave} ${t.hover}`} aria-label="Mes anterior"><ChevronLeft size={20} /></button>
              <h2 key={clave(mes)} style={{ animation: "cal-fade .3s ease both" }} className="min-w-[190px] text-center text-3xl font-extrabold tracking-tight">{MESES[mes.getMonth()]}</h2>
              <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className={`cursor-pointer rounded-lg p-1.5 transition-colors ${t.suave} ${t.hover}`} aria-label="Mes siguiente"><ChevronRight size={20} /></button>
            </div>
            <button onClick={irHoy} className={`absolute right-5 top-4 cursor-pointer rounded-lg border px-3 py-1.5 font-medium transition-colors ${t.boton}`}>Hoy</button>
          </div>

          {/* Cuadrícula tipo planner: celdas con borde */}
          <div className={`border-y ${t.linea}`}>
            <div className={`grid grid-cols-7 gap-px ${t.rejilla}`}>
              {DIAS.map((d) => (
                <div key={d} className={`${t.cabeza} py-1.5 text-center text-[11px] font-semibold ${t.suave}`}>
                  <span className="hidden sm:inline">{d}</span><span className="sm:hidden">{d.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <div key={clave(mes)} style={{ animation: "cal-fade .35s ease both" }} className={`grid grid-cols-7 gap-px border-t ${t.linea} ${t.rejilla}`}>
              {celdas.map((d, i) => {
                const k = clave(d);
                const delMes = d.getMonth() === mes.getMonth();
                const esHoy = k === hoyClave;
                const lista = delDia(k);
                return (
                  <button
                    key={k}
                    onClick={() => elegirDia(d)}
                    onDoubleClick={() => abrirNuevo(k)}
                    className={`min-h-[104px] cursor-pointer p-1.5 text-left align-top transition-colors ${
                      k === seleccion ? `${t.sel} ring-1 ring-inset ring-blue-600/50` : delMes ? `${t.fondo} ${t.hover}` : `${t.fuera} ${t.hover}`
                    } ${delMes ? "" : "opacity-60"}`}
                  >
                    <span
                      style={esHoy ? { animation: "cal-pulso 2.4s ease-out infinite" } : undefined}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${esHoy ? "bg-blue-600 text-white" : delMes ? "" : t.suave}`}
                    >
                      {d.getDate()}
                    </span>
                    <span className="mt-1 block space-y-0.5">
                      {lista.slice(0, 2).map((e, j) => (
                        <span key={e.id} style={{ animation: `cal-subir .35s ease ${i * 6 + j * 50}ms both` }} className={`block truncate rounded border-l-2 px-1.5 py-0.5 text-[10px] font-medium ${TIPOS[e.tipo].barra} ${chip(e.tipo)}`}>
                          {e.inicio} {e.titulo}
                        </span>
                      ))}
                      {lista.length > 2 && <span className={`block px-1.5 text-[10px] font-medium ${t.suave}`}>+{lista.length - 2} más</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3 text-[11px] ${t.suave}`}>
            {Object.entries(TIPOS).map(([nombre, ti]) => (
              <span key={nombre} className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${ti.punto}`} /> {nombre}</span>
            ))}
            <span className="ml-auto italic">Doble clic en un día para crear un evento</span>
          </div>
        </section>

        {/* Panel lateral: ahora, recordatorios, tareas y notas */}
        <aside className="space-y-4">
          <div style={{ animation: "cal-subir .4s ease .05s both" }} className={`rounded-2xl border p-4 ${t.tarjeta}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-[11px] ${t.suave}`}>Ahora</p>
                <p className="text-2xl font-extrabold leading-tight">{ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <p className={`text-right text-[11px] capitalize ${t.suave}`}>{ahora.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
            {proximo && (
              <div className={`mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 ${t.cabeza}`}>
                <i className={`h-8 w-1 shrink-0 rounded-full ${TIPOS[proximo.tipo].punto}`} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{proximo.titulo}</p>
                  <p className={`text-[11px] ${t.suave}`}>{proximo.inicio} · <span className="font-semibold text-blue-600">{faltan(proximo.ini - ahora)}</span></p>
                </div>
              </div>
            )}
          </div>

          <div style={{ animation: "cal-subir .4s ease .1s both" }} className={`rounded-2xl border ${t.tarjeta}`}>
            <h3 className={`border-b px-4 py-3 text-xs font-bold ${t.linea}`}>Recordatorios</h3>
            {venideros.length === 0 ? (
              <p className={`px-4 py-6 text-center ${t.suave}`}>Sin eventos próximos.</p>
            ) : (
              <ul className={`divide-y ${t.divisor}`}>
                {venideros.slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <button onClick={() => irAFecha(e.fecha)} className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors ${t.hover}`}>
                      <i className={`h-2 w-2 shrink-0 rounded-full ${TIPOS[e.tipo].punto}`} />
                      <span className="min-w-0 flex-1 truncate font-medium">{e.titulo}</span>
                      <span className={`shrink-0 text-[11px] ${t.suave}`}>{etiquetaFecha(e.fecha)} · {e.inicio}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ animation: "cal-subir .4s ease .15s both" }} className={`rounded-2xl border ${t.tarjeta}`}>
            <div className={`flex items-center justify-between border-b px-4 py-3 ${t.linea}`}>
              <h3 className="text-xs font-bold">Tareas</h3>
              <span className={`text-[11px] ${t.suave}`}>{hechas} de {tareas.length}</span>
            </div>
            <div className={`mx-4 mt-3 h-1.5 rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
              <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: tareas.length ? `${(hechas / tareas.length) * 100}%` : "0%" }} />
            </div>
            <ul className="px-2 py-2">
              {tareas.map((x) => (
                <li key={x.id} className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 ${t.hover}`}>
                  <button
                    onClick={() => setTareas((prev) => prev.map((y) => (y.id === x.id ? { ...y, hecha: !y.hecha } : y)))}
                    aria-label="Marcar tarea"
                    className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-all ${x.hecha ? "border-emerald-500 bg-emerald-500 text-white" : darkMode ? "border-slate-600" : "border-slate-300"}`}
                  >
                    {x.hecha && <Check size={11} strokeWidth={3} />}
                  </button>
                  <span className={`flex-1 transition-colors ${x.hecha ? `line-through ${t.suave}` : ""}`}>{x.texto}</span>
                  <button onClick={() => setTareas((prev) => prev.filter((y) => y.id !== x.id))} aria-label="Eliminar tarea" className={`cursor-pointer opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 ${t.suave}`}><Trash2 size={13} /></button>
                </li>
              ))}
            </ul>
            <form onSubmit={agregarTarea} className={`border-t px-4 py-2.5 ${t.linea}`}>
              <input value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Agregar tarea y presionar Enter" className={`w-full bg-transparent text-xs outline-none ${darkMode ? "placeholder:text-slate-500" : "placeholder:text-slate-400"}`} />
            </form>
          </div>

          <div style={{ animation: "cal-subir .4s ease .2s both" }} className={`rounded-2xl border ${t.tarjeta}`}>
            <h3 className={`border-b px-4 py-3 text-xs font-bold ${t.linea}`}>Notas</h3>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escribe tus apuntes aquí..."
              rows={5}
              style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 25px, ${darkMode ? "rgba(148,163,184,.18)" : "rgba(148,163,184,.35)"} 26px)`, lineHeight: "26px" }}
              className="w-full resize-none bg-transparent px-4 pb-2 pt-0 text-xs outline-none"
            />
          </div>
        </aside>
      </div>

      {/* Agenda del día seleccionado */}
      <section style={{ animation: "cal-subir .4s ease .1s both" }} className={`rounded-2xl border ${t.tarjeta}`}>
        <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${t.linea}`}>
          <div>
            <p className={`text-[11px] ${t.suave}`}>Agenda · {agenda.length} evento{agenda.length === 1 ? "" : "s"}</p>
            <h2 className="mt-0.5 text-sm font-bold capitalize">{fechaLarga}</h2>
          </div>
          <button onClick={() => abrirNuevo(seleccion)} className={`cursor-pointer rounded-xl border p-2 transition-all active:scale-90 ${t.boton}`} aria-label="Nuevo evento"><Plus size={16} /></button>
        </div>

        {agenda.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className={t.suave}>No hay eventos este día.</p>
            <button onClick={() => abrirNuevo(seleccion)} className="mt-2 cursor-pointer font-semibold text-blue-600 hover:text-blue-700">Crear uno</button>
          </div>
        ) : (
          <ul key={seleccion} className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {agenda.map((e, i) => {
              const esDeHoy = e.fecha === hoyClave;
              const enCurso = esDeHoy && minutosAhora >= enMinutos(e.inicio) && minutosAhora < enMinutos(e.fin);
              const terminado = esDeHoy && minutosAhora >= enMinutos(e.fin);
              return (
                <li key={e.id} style={{ animation: `cal-subir .35s ease ${i * 60}ms both` }}>
                  <button onClick={() => { setError(""); setModal({ ...e }); }} className={`block h-full w-full cursor-pointer rounded-xl border border-l-[3px] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${t.linea} ${TIPOS[e.tipo].barra} ${t.hover} ${terminado ? "opacity-55" : ""}`}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-bold">{e.inicio} – {e.fin}</span>
                      {enCurso && <span className="flex items-center gap-1 rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-semibold text-blue-600"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" /> En curso</span>}
                      {terminado && <span className={`text-[10px] ${t.suave}`}>Finalizado</span>}
                    </span>
                    <span className="mt-1 block truncate font-semibold">{e.titulo}</span>
                    <span className={`mt-0.5 block text-[11px] ${t.suave}`}>{e.tipo} · {duracion(e.inicio, e.fin)}</span>
                    {e.nota && <span className={`mt-1.5 block text-[11px] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{e.nota}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Formulario */}
      {modal && (
        <div style={{ animation: "cal-fade .2s ease both" }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div style={{ animation: "cal-entra .25s ease both" }} className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${t.tarjeta} ${t.texto}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between border-b px-6 py-4 ${t.linea} ${t.cabeza}`}>
              <h3 className="text-xs font-bold">{modal.id ? "Editar evento" : "Nuevo evento"}</h3>
              <button onClick={() => setModal(null)} className={`cursor-pointer transition-colors hover:text-blue-600 ${t.suave}`} aria-label="Cerrar"><X size={16} /></button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className={`text-[11px] font-semibold ${t.suave}`}>Título</label>
                <input value={modal.titulo} onChange={(e) => setModal({ ...modal, titulo: e.target.value })} className={`mt-1 ${entrada}`} placeholder="Ej. Reunión con asesores" autoFocus />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className={`text-[11px] font-semibold ${t.suave}`}>Fecha</label>
                  <input type="date" value={modal.fecha} onChange={(e) => setModal({ ...modal, fecha: e.target.value })} className={`mt-1 ${entrada}`} />
                </div>
                <div>
                  <label className={`text-[11px] font-semibold ${t.suave}`}>Inicio</label>
                  <input type="time" value={modal.inicio} onChange={(e) => setModal({ ...modal, inicio: e.target.value })} className={`mt-1 ${entrada}`} />
                </div>
                <div>
                  <label className={`text-[11px] font-semibold ${t.suave}`}>Fin</label>
                  <input type="time" value={modal.fin} onChange={(e) => setModal({ ...modal, fin: e.target.value })} className={`mt-1 ${entrada}`} />
                </div>
              </div>
              <div>
                <label className={`text-[11px] font-semibold ${t.suave}`}>Tipo</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.keys(TIPOS).map((tipo) => (
                    <button key={tipo} type="button" onClick={() => setModal({ ...modal, tipo })} className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${modal.tipo === tipo ? `border-transparent ${chip(tipo)} ring-1 ring-current` : t.boton}`}>
                      <i className={`h-2 w-2 rounded-full ${TIPOS[tipo].punto}`} /> {tipo}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`text-[11px] font-semibold ${t.suave}`}>Nota (opcional)</label>
                <textarea rows={2} value={modal.nota} onChange={(e) => setModal({ ...modal, nota: e.target.value })} className={`mt-1 resize-none ${entrada}`} />
              </div>
              {error && <p style={{ animation: "cal-subir .2s ease both" }} className="text-xs font-medium text-red-500">{error}</p>}
            </div>

            <div className={`flex items-center justify-between gap-2 border-t px-6 py-4 ${t.linea} ${t.cabeza}`}>
              {modal.id ? <button onClick={eliminar} className="cursor-pointer text-xs font-semibold text-red-500 hover:text-red-600">Eliminar</button> : <span />}
              <div className="flex gap-2">
                <button onClick={() => setModal(null)} className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${t.boton}`}>Cancelar</button>
                <button onClick={guardar} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-95">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}