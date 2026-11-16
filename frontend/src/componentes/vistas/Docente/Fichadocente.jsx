import { useState, useEffect } from "react";
import {
  MapPin, Mail, Phone, Search, UserPlus, ArrowLeft, GraduationCap, UserRound, Users,
  Activity, Building2, BarChart3, LayoutGrid, Table2, FolderOpen,
  Briefcase, BookOpen, Award, IdCard, Layers, Hash, Clock,
} from "lucide-react";

const API = "http://localhost:8000/api"; // mismo valor que en App.jsx

/* Ejemplo (aún no vienen de la API) */
const especialidades = ["Sistemas distribuidos", "Ingeniería de software", "Bases de datos", "Arquitectura de software", "Investigación aplicada"];

const horario = [
  ["Lunes a miércoles", "08:00 – 13:00"],
  ["Jueves", "14:00 – 18:00"],
  ["Viernes", "08:00 – 11:00"],
];

const CAPACIDAD = 12;
const HORAS_TOTALES = 480;

const estados = {
  "Al día": { texto: "text-emerald-600", fondo: "bg-emerald-50", hex: "#10b981" },
  "Revisión pendiente": { texto: "text-amber-600", fondo: "bg-amber-50", hex: "#f59e0b" },
  Observado: { texto: "text-red-500", fondo: "bg-red-50", hex: "#ef4444" },
  Completado: { texto: "text-blue-600", fondo: "bg-blue-50", hex: "#2563eb" },
};

const estadoDe = (e) => estados[e] ?? { texto: "text-gray-500", fondo: "bg-gray-100", hex: "#94a3b8" };

const filtros = [
  { id: "todos", label: "Todos" },
  { id: "progreso", label: "En progreso", lista: ["Al día", "Observado"] },
  { id: "pendientes", label: "Pendientes", lista: ["Revisión pendiente"] },
  { id: "completados", label: "Completados", lista: ["Completado"] },
];

const menu = [
  { id: "acerca", label: "Acerca de", icon: UserRound },
  { id: "alumnos", label: "Alumnos", icon: Users },
  { id: "analitica", label: "Analítica", icon: BarChart3 },
  { id: "actividad", label: "Actividad", icon: Activity },
];

const tarjeta = "rounded-2xl border border-gray-200 bg-white";
const iniciales = (n) => n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const porcentaje = (hrs) => Math.round((hrs / HORAS_TOTALES) * 100);

/* Hace que lo animado arranque en 0 y crezca al montarse */
function useMontado() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), 40);
    return () => clearTimeout(t);
  }, []);
  return m;
}

function Anillo({ pct, color }) {
  const m = useMontado();
  const r = 22, C = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - (m ? pct : 0) / 100)}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{pct}%</span>
    </div>
  );
}

function Barra({ pct, color = "#2563eb" }) {
  const m = useMontado();
  return (
    <div className="h-2 rounded-full bg-gray-100">
      <div className="h-2 rounded-full" style={{ width: `${m ? pct : 0}%`, background: color, transition: "width 1s ease" }} />
    </div>
  );
}

function Dona({ segmentos }) {
  const m = useMontado();
  const r = 40, C = 2 * Math.PI * r;
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  let acumulado = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segmentos.map((s) => {
        const largo = (s.valor / total) * C;
        const desplazamiento = -acumulado;
        acumulado += largo;
        return (
          <circle
            key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${m ? largo : 0} ${C}`} strokeDashoffset={desplazamiento}
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        );
      })}
    </svg>
  );
}

/* ---------- Vista ---------- */
export default function FichaDocente({ docente, onVolver }) {
  const idDocente = docente?.id_usuario ?? docente?.id;
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState("alumnos");
  const [filtro, setFiltro] = useState("todos");
  const [vista, setVista] = useState("tarjetas");
  const [busqueda, setBusqueda] = useState("");

  const cargarFicha = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API}/docentes/${idDocente}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Error ${res.status} al cargar la ficha`);
      setFicha(data);
    } catch (e) {
      setError(e.message);
    }
    setCargando(false);
  };

  // Solo depende del id (un número), así que no se repite en cada render
  useEffect(() => {
    if (idDocente) cargarFicha();
    else {
      setError("No hay un docente seleccionado");
      setCargando(false);
    }
  }, [idDocente]);

  const doc = ficha?.docente ?? {};
  const alumnos = (ficha?.alumnos ?? []).map((a) => ({ ...a, hrs: Number(a.hrs) || 0 }));
  const otrosDocentes = ficha?.otrosDocentes ?? [];
  const actividad = ficha?.actividad ?? [];

  const actual = filtros.find((f) => f.id === filtro);
  const visibles = alumnos.filter(
    (a) =>
      (!actual.lista || actual.lista.includes(a.estado)) &&
      `${a.nombre} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Analítica
  const horasTotales = alumnos.reduce((s, a) => s + a.hrs, 0);
  const promedio = alumnos.length ? Math.round(alumnos.reduce((s, a) => s + porcentaje(a.hrs), 0) / alumnos.length) : 0;
  const enRiesgo = alumnos.filter((a) => a.estado === "Observado" || porcentaje(a.hrs) < 40).length;
  const completados = alumnos.filter((a) => a.estado === "Completado").length;
  const segmentos = [...new Set(alumnos.map((a) => a.estado))].map((e) => ({
    label: e,
    color: estadoDe(e).hex,
    valor: alumnos.filter((a) => a.estado === e).length,
  }));

  const datos = [
    [Briefcase, "Cargo", doc.cargo || "—"],
    [Layers, "Departamento", doc.departamento || "—"],
    [Award, "Grado académico", doc.grado || "—"],
    [BookOpen, "Especialidad", doc.especialidad || "—"],
    [IdCard, "DNI", doc.dni || "—"],
    [Hash, "Código docente", doc.codigo || "—"],
  ];

  if (cargando) return <p className="p-6 text-xs text-gray-500">Cargando ficha del docente...</p>;

  if (error) {
    return (
      <div className="space-y-3 p-6 text-xs">
        <p className="text-red-600">{error}</p>
        <div className="flex gap-2">
          {idDocente && <button onClick={cargarFicha} className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white">Reintentar</button>}
          {onVolver && <button onClick={onVolver} className="rounded-lg border border-gray-200 px-3 py-1.5">Volver</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-xs text-gray-900">
      <style>{`@keyframes subir{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>

      {onVolver && (
        <button onClick={onVolver} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={13} /> Plantel docente
        </button>
      )}

      {/* Cabecera */}
      <section className={`${tarjeta} flex flex-wrap items-center gap-5 p-5`}>
        <img src={doc.avatar || "https://i.pravatar.cc/160?img=47"} alt="Docente" className="h-20 w-20 rounded-xl object-cover" />
        <div className="min-w-[240px] flex-1">
          <h1 className="text-lg font-bold leading-tight">{doc.nombre}</h1>
          <p className="text-gray-500">{doc.cargo}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-gray-700">
            <GraduationCap size={14} className="text-blue-600" />
            IESTP "Andrés Avelino Cáceres Dorregaray" · Campus Central
          </p>
        </div>
        <div className="flex items-center gap-8 text-center">
          {[[alumnos.length, "Alumnos"], [CAPACIDAD - alumnos.length, "Cupos libres"], [`${promedio}%`, "Avance promedio"]].map(([v, l]) => (
            <div key={l}>
              <p className="text-xl font-bold text-blue-600">{v}</p>
              <p className="text-[11px] text-gray-500">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[170px_1fr_250px]">
        {/* Menú */}
        <nav className={`${tarjeta} p-2`}>
          {menu.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSeccion(id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                seccion === id ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>

        {/* Centro */}
        <main className={`${tarjeta} min-w-0 p-5`}>
          {seccion === "acerca" && (
            <div className="space-y-6">
              <div style={{ animation: "subir .4s ease both" }}>
                <h2 className="text-sm font-bold">Acerca de</h2>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Docente asesora de prácticas pre-profesionales (EFSRT) con experiencia en la formación y el
                  acompañamiento de estudiantes de computación. Coordina proyectos con entidades colaboradoras y
                  supervisa el avance de horas y bitácoras de sus alumnos.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {datos.map(([Icon, k, v], i) => (
                  <div
                    key={k}
                    style={{ animation: `subir .4s ease ${(i + 1) * 60}ms both` }}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="text-[11px] text-gray-500">{k}</p>
                      <p className="mt-0.5 font-semibold">{v}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">Áreas de especialización</h3>
                <div className="flex flex-wrap gap-2">
                  {especialidades.map((e) => (
                    <span key={e} className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">{e}</span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Contacto</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center gap-2.5"><MapPin size={14} className="text-gray-400" /> Campus Central – Sede Lima</li>
                    <li className="flex items-center gap-2.5"><Mail size={14} className="text-gray-400" /> {doc.correo || "—"}</li>
                    <li className="flex items-center gap-2.5"><Phone size={14} className="text-gray-400" /> {doc.telefono || "—"}</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Horario de atención</h3>
                  <ul className="space-y-3">
                    {horario.map(([dia, hora]) => (
                      <li key={dia} className="flex items-center justify-between gap-3 text-gray-700">
                        <span className="flex items-center gap-2.5"><Clock size={14} className="text-gray-400" /> {dia}</span>
                        <span className="font-semibold">{hora}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {seccion === "alumnos" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">Alumnos en prácticas</h2>
                  <p className="text-[11px] text-gray-500">{alumnos.length} alumnos a cargo</p>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 font-semibold text-white transition-colors hover:bg-blue-700">
                  <UserPlus size={13} /> Asignar alumno
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1">
                  {filtros.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFiltro(f.id)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                        filtro === f.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex w-[180px] items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-400 focus-within:border-blue-500">
                    <Search size={13} />
                    <input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar alumno"
                      className="w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex rounded-lg border border-gray-200 p-0.5">
                    {[["tarjetas", LayoutGrid], ["tabla", Table2]].map(([id, Icon]) => (
                      <button
                        key={id}
                        onClick={() => setVista(id)}
                        title={id === "tarjetas" ? "Tarjetas" : "Tabla"}
                        className={`rounded-md p-1.5 ${vista === id ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-800"}`}
                      >
                        <Icon size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {visibles.length === 0 && (
                <p className="py-10 text-center text-gray-500">
                  {alumnos.length === 0 ? "Este docente aún no tiene alumnos asignados." : "No se encontraron alumnos."}
                </p>
              )}

              {/* Tarjetas */}
              {vista === "tarjetas" && (
                <div key={filtro + busqueda} className="mt-4 grid gap-3 sm:grid-cols-2">
                  {visibles.map((a, i) => {
                    const pct = porcentaje(a.hrs);
                    const e = estadoDe(a.estado);
                    return (
                      <article
                        key={a.dni}
                        style={{ animation: `subir .4s ease ${i * 60}ms both` }}
                        className="group rounded-2xl border border-gray-200 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                              {iniciales(a.nombre)}
                            </span>
                            <div className="leading-tight">
                              <p className="font-semibold">{a.nombre}</p>
                              <p className="text-[11px] text-gray-500">DNI {a.dni}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium leading-snug">{a.proyecto}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                              <Building2 size={11} /> {a.entidad}
                            </p>
                          </div>
                          <Anillo pct={pct} color={e.hex} />
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${e.fondo} ${e.texto}`}>{a.estado}</span>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span>{a.hrs} / {HORAS_TOTALES} h</span>
                            <button title="Ver expediente" className="text-gray-400 transition-colors hover:text-blue-600">
                              <FolderOpen size={15} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Tabla */}
              {vista === "tabla" && visibles.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="text-left text-[11px] text-gray-500">
                        <th className="py-2 font-medium">Alumno</th>
                        <th className="py-2 font-medium">Entidad</th>
                        <th className="w-[130px] py-2 font-medium">Horas</th>
                        <th className="py-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((a) => (
                        <tr key={a.dni} className="border-t border-gray-100 transition-colors hover:bg-gray-50">
                          <td className="py-2.5">
                            <p className="font-semibold">{a.nombre}</p>
                            <p className="text-[11px] text-gray-500">DNI {a.dni}</p>
                          </td>
                          <td className="py-2.5 text-gray-600">{a.entidad}</td>
                          <td className="py-2.5 pr-4">
                            <Barra pct={porcentaje(a.hrs)} color={estadoDe(a.estado).hex} />
                            <p className="mt-1 text-[11px] text-gray-500">{a.hrs} / {HORAS_TOTALES} h</p>
                          </td>
                          <td className={`py-2.5 font-medium ${estadoDe(a.estado).texto}`}>{a.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {seccion === "analitica" && (
            <>
              <h2 className="text-sm font-bold">Analítica de prácticas</h2>
              <p className="text-[11px] text-gray-500">Resumen del avance de tus alumnos</p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  [horasTotales, "Horas acumuladas"],
                  [`${promedio}%`, "Avance promedio"],
                  [enRiesgo, "Alumnos en riesgo"],
                  [completados, "Completados"],
                ].map(([v, l], i) => (
                  <div key={l} style={{ animation: `subir .4s ease ${i * 70}ms both` }} className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xl font-bold">{v}</p>
                    <p className="text-[11px] text-gray-500">{l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold">Alumnos por estado</p>
                  <div className="mt-3 flex items-center gap-4">
                    <Dona segmentos={segmentos} />
                    <ul className="space-y-1.5">
                      {segmentos.map((s) => (
                        <li key={s.label} className="flex items-center gap-2 text-gray-600">
                          <i className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                          {s.label} <b className="text-gray-900">{s.valor}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold">Horas por alumno</p>
                  <ul className="mt-3 space-y-3">
                    {alumnos.map((a) => (
                      <li key={a.dni}>
                        <div className="mb-1 flex justify-between text-[11px] text-gray-600">
                          <span>{a.nombre.split(" ")[0]} {a.nombre.split(" ")[1]?.[0]}.</span>
                          <span>{a.hrs} h</span>
                        </div>
                        <Barra pct={porcentaje(a.hrs)} color={estadoDe(a.estado).hex} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {seccion === "actividad" && (
            <>
              <h2 className="text-sm font-bold">Actividad reciente</h2>
              <ul className="mt-3 divide-y divide-gray-100">
                {actividad.map((e) => (
                  <li key={e.texto} className="flex items-center justify-between gap-4 py-3">
                    <span>{e.texto}</span>
                    <span className="shrink-0 text-[11px] text-gray-500">{e.cuando}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </main>

        {/* Derecha */}
        <aside className="space-y-4">
          <section className={`${tarjeta} p-4`}>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Entidades</h3>
            <div className="grid grid-cols-3 gap-3">
              {[...new Set(alumnos.map((a) => a.entidad).filter(Boolean))].map((ent) => (
                <div key={ent} className="text-center" title={ent}>
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                    <Building2 size={18} />
                  </span>
                  <p className="mt-1 truncate text-[10px] text-gray-500">{ent}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${tarjeta} p-4`}>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Otros asesores</h3>
            <div className="grid grid-cols-3 gap-3">
              {otrosDocentes.map((n) => (
                <div key={n} className="text-center" title={n}>
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                    {iniciales(n)}
                  </span>
                  <p className="mt-1 truncate text-[10px] text-gray-500">{n}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}