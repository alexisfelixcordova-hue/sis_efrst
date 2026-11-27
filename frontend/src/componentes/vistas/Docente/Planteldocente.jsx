import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  UserRoundPlus,
  Eye,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table2,
  X,
  Mail,
  Clock,
  UserX,
} from "lucide-react";
import api, { getCachedData, invalidateApiCache } from "../../../api/axios";
import AsignarEstudiantes from "./componentes/AsignarEstudiante";

const BASE_URL = "http://localhost:8000";

const avatares = [
  "https://i.pravatar.cc/80?img=47",
  "https://i.pravatar.cc/80?img=12",
  "https://i.pravatar.cc/80?img=44",
  "https://i.pravatar.cc/80?img=13",
  "https://i.pravatar.cc/80?img=49",
];

const resolverFotoDocente = (docente, index) => {
  const fallback = avatares[index % avatares.length];
  const raw = docente?.foto_perfil || docente?.foto || docente?.avatar || "";
  if (!raw || typeof raw !== "string" || !raw.trim()) return fallback;
  const limpio = raw.trim();
  if (
    limpio.startsWith("http://") ||
    limpio.startsWith("https://") ||
    limpio.startsWith("data:") ||
    limpio.startsWith("blob:")
  ) {
    return limpio;
  }
  const rutaLimpia = limpio.startsWith("/") ? limpio : `/${limpio}`;
  return `${BASE_URL}${rutaLimpia}`;
};

const AvatarDocente = ({ docente, index, nombreCompleto, tam = "h-10 w-10" }) => {
  const fallback = avatares[index % avatares.length];
  const [src, setSrc] = useState(() => resolverFotoDocente(docente, index));

  useEffect(() => {
    setSrc(resolverFotoDocente(docente, index));
  }, [docente, index]);

  return (
    <img
      src={src}
      alt={nombreCompleto}
      onError={() => setSrc(fallback)}
      className={`${tam} shrink-0 rounded-full object-cover`}
    />
  );
};

const estadoEstilos = {
  "Cupo Completo": "bg-red-50 text-red-700 ring-red-600/10",
  Disponible: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  "En Sesión": "bg-blue-50 text-blue-700 ring-blue-600/10",
};

const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const extraerNombresModulos = (arreglo) => {
  const nombres = arreglo
    .map(
      (m) =>
        m?.nombre ??
        m?.nombre_modulo ??
        m?.modulo ??
        m?.titulo ??
        m?.descripcion
    )
    .filter(Boolean);
  return [...new Set(nombres)];
};

/* ---------- Ayudas de presentación ---------- */
const nombreDe = (d) =>
  d.nombres && d.apellidos ? `${d.nombres} ${d.apellidos}` : d.nombre || "Sin nombre";
const alumnosDe = (d) => Number(d.alumnos) || 0;
const capacidadDe = (d) => Number(d.capacidad) || 12;

const cumpleEstado = (d, e) =>
  e === "todos" ||
  (e === "disponibles" && alumnosDe(d) < capacidadDe(d)) ||
  (e === "sesion" && alumnosDe(d) > 0) ||
  (e === "completo" && alumnosDe(d) >= capacidadDe(d));

const ORDENES = [
  { v: "alumnos", t: "Más alumnos a cargo" },
  { v: "cupo", t: "Más cupos libres" },
  { v: "nombre", t: "Nombre (A-Z)" },
];

const estilosAnim = `
@keyframes pd-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.pd-up{animation:pd-up .4s cubic-bezier(.22,1,.36,1) backwards}
@media (prefers-reduced-motion:reduce){.pd-up{animation:none!important}}
`;

/* Medidor de carga: bloques llenos = alumnos, vacíos = cupos libres */
function Carga({ alumnos, capacidad, oscuro }) {
  const ratio = capacidad ? alumnos / capacidad : 0;
  const color = ratio >= 1 ? "bg-red-500" : ratio >= 0.75 ? "bg-amber-500" : "bg-blue-600";
  const vacio = oscuro ? "bg-slate-700" : "bg-slate-200";

  if (capacidad > 16) {
    return (
      <div className={`h-2 overflow-hidden rounded-full ${vacio}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
    );
  }
  return (
    <div className="flex gap-1" role="img" aria-label={`${alumnos} de ${capacidad} cupos ocupados`}>
      {Array.from({ length: capacidad }, (_, i) => (
        <span key={i} className={`h-2 flex-1 rounded-full ${i < alumnos ? color : vacio}`} />
      ))}
    </div>
  );
}

export default function PlantelDocente({
  onVerFicha,
  onAsignarEstudiantes,
  darkMode = false,
}) {
  const cachedDocentes = getCachedData("/docentes");
  const cachedEstudiantes = getCachedData("/estudiantes");
  const cachedModulos = getCachedData("/modulos-profesionales");

  const initialDocentes = extraerLista(cachedDocentes);
  const initialEstudiantes = extraerLista(cachedEstudiantes);
  const initialModulosData = extraerLista(cachedModulos);
  const initialListaModulos = extraerNombresModulos(initialModulosData);

  const [docentes, setDocentes] = useState(initialDocentes);
  const [estudiantes, setEstudiantes] = useState(initialEstudiantes);
  const [modulosData, setModulosData] = useState(initialModulosData);
  const [listaModulos, setListaModulos] = useState(initialListaModulos);
  const [cargando, setCargando] = useState(initialDocentes.length === 0);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [especialidad, setEspecialidad] = useState("Todas las especialidades");
  const [modulo, setModulo] = useState("Todos los Módulos EFSRT");
  const [estado, setEstado] = useState("todos"); // todos | disponibles | sesion | completo
  const [orden, setOrden] = useState("alumnos");
  const [vista, setVista] = useState("tarjetas");
  const [pagina, setPagina] = useState(1);

  const [vistaAsignarActiva, setVistaAsignarActiva] = useState(false);
  const [docenteParaAsignar, setDocenteParaAsignar] = useState(null);

  const porPagina = vista === "tarjetas" ? 6 : 5;

  const obtenerDocentes = async ({ mostrarCargando = true } = {}) => {
    if (mostrarCargando && docentes.length === 0) {
      setCargando(true);
    }
    setError(null);
    try {
      const response = await api.get("/docentes");
      const lista = extraerLista(response.data);
      setDocentes(lista);
    } catch (err) {
      console.error("Error al cargar asesores:", err);
      if (docentes.length === 0) {
        setError("No se pudieron cargar los asesores desde el servidor.");
        setDocentes([]);
      }
    } finally {
      setCargando(false);
    }
  };

  const obtenerModulos = async () => {
    try {
      const response = await api.get("/modulos-profesionales");
      const arreglo = extraerLista(response.data);
      setModulosData(arreglo);
      setListaModulos(extraerNombresModulos(arreglo));
    } catch (err) {
      console.error("Error al cargar módulos:", err);
    }
  };

  const obtenerEstudiantes = async () => {
    try {
      const response = await api.get("/estudiantes");
      const lista = extraerLista(response.data);
      setEstudiantes(lista);
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
    }
  };

  const actualizarTodo = async ({ forzarRefresco = false } = {}) => {
    if (forzarRefresco) {
      invalidateApiCache("/docentes");
      setCargando(true);
    }
    await Promise.all([
      obtenerDocentes({ mostrarCargando: forzarRefresco || docentes.length === 0 }),
      obtenerModulos(),
      obtenerEstudiantes(),
    ]);
  };

  useEffect(() => {
    const faltaAlgo =
      initialDocentes.length === 0 ||
      initialEstudiantes.length === 0 ||
      initialModulosData.length === 0;

    if (faltaAlgo) {
      actualizarTodo({ forzarRefresco: false });
    } else {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirVistaAsignar = (docente = null) => {
    setDocenteParaAsignar(docente);
    setVistaAsignarActiva(true);
    onAsignarEstudiantes?.(docente);
  };

  const especialidades = useMemo(() => {
    return [
      "Todas las especialidades",
      ...new Set(docentes.map((d) => d.departamento).filter(Boolean)),
    ];
  }, [docentes]);

  const modulos = useMemo(() => {
    return ["Todos los Módulos EFSRT", ...listaModulos];
  }, [listaModulos]);

  const filtrados = useMemo(() => {
    return docentes
      .filter((d) => {
        const texto = `${nombreDe(d)} ${d.correo || ""} ${d.departamento || ""} ${d.modulo || ""}`.toLowerCase();
        return (
          texto.includes(busqueda.trim().toLowerCase()) &&
          (especialidad === "Todas las especialidades" || d.departamento === especialidad) &&
          (modulo === "Todos los Módulos EFSRT" || (d.modulos || []).includes(modulo)) &&
          cumpleEstado(d, estado)
        );
      })
      .sort((a, b) => {
        if (orden === "nombre") return nombreDe(a).localeCompare(nombreDe(b));
        if (orden === "cupo") return capacidadDe(b) - alumnosDe(b) - (capacidadDe(a) - alumnosDe(a));
        return alumnosDe(b) - alumnosDe(a);
      });
  }, [docentes, busqueda, especialidad, modulo, estado, orden]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = filtrados.slice(inicio, inicio + porPagina);

  const cambiarFiltro = (setter, valor) => {
    setter(valor);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEspecialidad("Todas las especialidades");
    setModulo("Todos los Módulos EFSRT");
    setEstado("todos");
    setPagina(1);
  };

  const totalDocentes = docentes.length;
  const totalDisponibles = docentes.filter((d) => cumpleEstado(d, "disponibles")).length;
  const totalEnSesion = docentes.filter((d) => cumpleEstado(d, "sesion")).length;
  const totalCompletos = docentes.filter((d) => cumpleEstado(d, "completo")).length;
  const totalAlumnos = docentes.reduce((suma, d) => suma + alumnosDe(d), 0);

  // Filtros activos, para mostrarlos como etiquetas que se pueden quitar una a una
  const nombreEstado = { disponibles: "Con cupo", sesion: "Asesorando", completo: "Cupo completo" };
  const activos = [
    busqueda.trim() && { k: "b", t: `Búsqueda: "${busqueda.trim()}"`, quitar: () => cambiarFiltro(setBusqueda, "") },
    especialidad !== "Todas las especialidades" && { k: "e", t: especialidad, quitar: () => cambiarFiltro(setEspecialidad, "Todas las especialidades") },
    modulo !== "Todos los Módulos EFSRT" && { k: "m", t: modulo, quitar: () => cambiarFiltro(setModulo, "Todos los Módulos EFSRT") },
    estado !== "todos" && { k: "s", t: nombreEstado[estado], quitar: () => cambiarFiltro(setEstado, "todos") },
  ].filter(Boolean);

  const tema = darkMode
    ? {
        texto: "text-slate-100",
        secundario: "text-slate-400",
        panel: "bg-[#1e293b] border-slate-700",
        campo:
          "bg-[#0f172a] border-slate-700 text-slate-100 placeholder:text-slate-500",
        fila: "border-slate-700 hover:bg-slate-800/70",
        encabezado: "bg-slate-800/70 text-slate-300",
        tarjeta: "bg-[#1e293b] border-slate-700",
        inactivo: "text-slate-300 hover:bg-slate-800",
        chip: "bg-slate-800 text-slate-200",
      }
    : {
        texto: "text-slate-800",
        secundario: "text-slate-500",
        panel: "bg-white border-slate-200",
        campo:
          "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400",
        fila: "border-slate-100 hover:bg-slate-50",
        encabezado: "bg-slate-50 text-slate-500",
        tarjeta: "bg-white border-slate-200",
        inactivo: "text-slate-600 hover:bg-slate-50",
        chip: "bg-slate-100 text-slate-700",
      };

  if (vistaAsignarActiva) {
    return (
      <main className={`min-h-full ${tema.texto}`}>
        <AsignarEstudiantes
          onVolver={() => setVistaAsignarActiva(false)}
          docentes={docentes}
          docenteInicial={docenteParaAsignar}
          estudiantes={estudiantes}
          modulos={modulosData}
          darkMode={darkMode}
          onGuardadoExitoso={() => actualizarTodo({ forzarRefresco: true })}
        />
      </main>
    );
  }

  /* Tarjetas de arriba: las tres primeras son filtros con un clic */
  const filtrosRapidos = [
    { id: "todos", titulo: "Todos los docentes", valor: totalDocentes, nota: "Ver el plantel completo", Icono: Users, color: "bg-blue-50 text-blue-600", aro: "ring-blue-600" },
    { id: "disponibles", titulo: "Con cupo", valor: totalDisponibles, nota: "Pueden recibir alumnos", Icono: UserCheck, color: "bg-emerald-50 text-emerald-600", aro: "ring-emerald-500" },
    { id: "sesion", titulo: "Asesorando", valor: totalEnSesion, nota: "Ya tienen alumnos", Icono: BookOpen, color: "bg-amber-50 text-amber-600", aro: "ring-amber-500" },
  ];

  const botonAsignar = (docente, extra = "") => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        abrirVistaAsignar(docente);
      }}
      title={`Asignar estudiantes a ${nombreDe(docente)}`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 ${extra}`}
    >
      <UserRoundPlus size={14} />
      Asignar
    </button>
  );

  const botonFicha = (docente, extra = "") => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onVerFicha?.(docente);
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 ${extra}`}
    >
      <Eye size={14} />
      Ver ficha
    </button>
  );

  return (
    <main className={`min-h-full space-y-6 ${tema.texto}`}>
      <style>{estilosAnim}</style>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Ruta, título grande y subtítulo (mismo estilo que Reportes y Constancias) */}
        <div>
          <p className={`text-xs ${tema.secundario}`}>
            Gestión académica <span className="mx-1">/</span>{" "}
            <span className={`font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Plantel docente
            </span>
          </p>

          <h1 className={`mt-1.5 text-3xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
            Plantel docente EFSRT
          </h1>

          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Administra y consulta los docentes asesores asignados al EFSRT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => actualizarTodo({ forzarRefresco: true })}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${tema.panel} ${tema.inactivo}`}
          >
            <RefreshCcw size={16} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => abrirVistaAsignar(filtrados[0] || docentes[0] || null)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <UserRoundPlus size={16} />
            Asignar estudiantes
          </button>
        </div>
      </header>

      {/* Resumen: las tarjetas son filtros, un clic y la lista se ajusta */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Filtros rápidos">
        {filtrosRapidos.map(({ id, titulo, valor, nota, Icono, color, aro }) => {
          const activa = estado === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={activa}
              onClick={() => cambiarFiltro(setEstado, id)}
              className={`group rounded-xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${tema.tarjeta} ${activa ? `ring-2 ${aro}` : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2.5 ${color}`}>
                  <Icono size={21} />
                </div>
                <span className={`text-xs font-semibold ${activa ? "text-blue-600" : tema.secundario}`}>
                  {activa ? "Filtro activo" : "Filtrar"}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold tabular-nums">{valor}</p>
              <p className="mt-1 text-sm font-semibold">{titulo}</p>
              <p className={`text-xs ${tema.secundario}`}>{nota}</p>
            </button>
          );
        })}

        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
              <GraduationCap size={21} />
            </div>
            <span className={`text-xs font-semibold ${tema.secundario}`}>Total</span>
          </div>
          <p className="mt-4 text-2xl font-bold tabular-nums">{totalAlumnos}</p>
          <p className="mt-1 text-sm font-semibold">Alumnos a cargo</p>
          <p className={`text-xs ${tema.secundario}`}>
            {totalCompletos > 0 ? `${totalCompletos} docente(s) con cupo completo` : "Ningún docente con cupo completo"}
          </p>
        </div>
      </section>

      {/* Listado */}
      <section className={`overflow-hidden rounded-xl border ${tema.panel}`}>
        <div className="flex flex-col gap-4 border-b border-inherit p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Listado de docentes</h2>
              <p className={`mt-1 text-sm ${tema.secundario}`}>
                {vista === "tarjetas"
                  ? "Haz clic en una tarjeta para abrir la ficha del docente."
                  : "Usa Ver ficha para abrir al docente o Asignar para sumarle estudiantes."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-sm ${tema.secundario}`}>
                <b className={tema.texto}>{filtrados.length}</b> de {totalDocentes} docentes
              </span>
              <div className={`flex rounded-lg border p-0.5 ${tema.panel}`} role="group" aria-label="Tipo de vista">
                {[
                  ["tarjetas", LayoutGrid, "Tarjetas"],
                  ["tabla", Table2, "Tabla"],
                ].map(([id, Icono, nombre]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => cambiarFiltro(setVista, id)}
                    title={nombre}
                    aria-label={nombre}
                    aria-pressed={vista === id}
                    className={`rounded-md p-2 transition ${vista === id ? "bg-blue-600 text-white" : `${tema.secundario} hover:text-blue-600`}`}
                  >
                    <Icono size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${tema.secundario}`} />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => cambiarFiltro(setBusqueda, e.target.value)}
                placeholder="Buscar por docente, correo o especialidad..."
                aria-label="Buscar docentes"
                className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${tema.campo}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={especialidad}
                onChange={(e) => cambiarFiltro(setEspecialidad, e.target.value)}
                aria-label="Filtrar por especialidad"
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {especialidades.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

              <select
                value={modulo}
                onChange={(e) => cambiarFiltro(setModulo, e.target.value)}
                aria-label="Filtrar por módulo"
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {modulos.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={orden}
                onChange={(e) => cambiarFiltro(setOrden, e.target.value)}
                aria-label="Ordenar docentes"
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {ORDENES.map((o) => (
                  <option key={o.v} value={o.v}>Ordenar: {o.t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Etiquetas de filtros activos: siempre se ve qué está filtrando la lista */}
          {activos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={tema.secundario}>Filtrando por:</span>
              {activos.map((f) => (
                <button
                  key={f.k}
                  type="button"
                  onClick={f.quitar}
                  title="Quitar este filtro"
                  className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-2 font-medium transition hover:ring-1 hover:ring-blue-500 ${tema.chip}`}
                >
                  {f.t}
                  <X size={13} />
                </button>
              ))}
              <button
                type="button"
                onClick={limpiarFiltros}
                className="ml-1 font-semibold text-blue-600 hover:text-blue-700"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Contenido: estados de carga, error y vacío primero */}
        {cargando && visibles.length === 0 ? (
          <p className={`px-5 py-14 text-center text-sm ${tema.secundario}`}>
            Cargando plantel docente desde la base de datos...
          </p>
        ) : error ? (
          <p className="px-5 py-14 text-center text-sm text-red-500">{error}</p>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className={`rounded-full p-4 ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>
              <UserX size={26} />
            </div>
            <p className="mt-3 font-semibold">No se encontraron docentes</p>
            <p className={`mt-1 text-sm ${tema.secundario}`}>
              {activos.length > 0
                ? "Ningún docente cumple los filtros activos. Quita alguno para ver más resultados."
                : "Todavía no hay docentes registrados."}
            </p>
            {activos.length > 0 && (
              <button type="button" onClick={limpiarFiltros} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : vista === "tarjetas" ? (
          /* ---------- Vista de tarjetas ---------- */
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((docente, index) => {
              const nombreCompleto = nombreDe(docente);
              const alumnos = alumnosDe(docente);
              const capacidad = capacidadDe(docente);
              const libres = Math.max(0, capacidad - alumnos);
              return (
                <article
                  key={docente.id_usuario || docente.id || index}
                  onClick={() => onVerFicha?.(docente)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) onVerFicha?.(docente); }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Abrir la ficha de ${nombreCompleto}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`pd-up flex cursor-pointer flex-col rounded-xl border p-5 outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500/40 ${tema.tarjeta}`}
                >
                  <div className="flex items-start gap-3">
                    <AvatarDocente docente={docente} index={index} nombreCompleto={nombreCompleto} tam="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight">{nombreCompleto}</p>
                      <p className={`mt-1 flex items-center gap-1.5 truncate text-xs ${tema.secundario}`}>
                        <Mail size={12} className="shrink-0" /> {docente.correo || "Sin correo"}
                      </p>
                    </div>
                  </div>

                  <p className={`mt-3 text-xs ${tema.secundario}`}>
                    <span className={`font-medium ${tema.texto}`}>{docente.departamento || "Sistemas e Informática"}</span>
                    {" · "}
                    {docente.modulo || "Módulo EFSRT"}
                  </p>

                  {/* Carga de alumnos */}
                  <div className="mt-4">
                    <div className="mb-2 flex items-baseline justify-between text-xs">
                      <span className="font-semibold">{alumnos} de {capacidad} alumnos</span>
                      <span className={libres === 0 ? "font-semibold text-red-500" : tema.secundario}>
                        {libres === 0 ? "Sin cupos" : `${libres} ${libres === 1 ? "cupo libre" : "cupos libres"}`}
                      </span>
                    </div>
                    <Carga alumnos={alumnos} capacidad={capacidad} oscuro={darkMode} />
                  </div>

                  <div className={`mt-4 flex items-center justify-between gap-2 border-t pt-3 text-xs ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
                    <span className={`inline-flex items-center gap-1.5 ${tema.secundario}`}>
                      <Clock size={13} /> {docente.horas || 160} hrs · {docente.detalle || "Supervisado"}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${
                        estadoEstilos[docente.estado] || "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                      }`}
                    >
                      {docente.estado || "Disponible"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {botonFicha(docente)}
                    {botonAsignar(docente)}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ---------- Vista de tabla ---------- */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className={tema.encabezado}>
                <tr>
                  <th className="px-5 py-4 font-semibold">Docente / Asesor</th>
                  <th className="px-5 py-4 font-semibold">Departamento / Área</th>
                  <th className="px-5 py-4 font-semibold">Alumnos a cargo</th>
                  <th className="px-5 py-4 font-semibold">Horas validativas</th>
                  <th className="px-5 py-4 font-semibold">Disponibilidad</th>
                  <th className="px-5 py-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((docente, index) => {
                  const nombreCompleto = nombreDe(docente);
                  const alumnos = alumnosDe(docente);
                  const capacidad = capacidadDe(docente);
                  return (
                    <tr key={docente.id_usuario || docente.id || index} className={`border-t transition ${tema.fila}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <AvatarDocente docente={docente} index={index} nombreCompleto={nombreCompleto} />
                          <div>
                            <p className="font-semibold">{nombreCompleto}</p>
                            <p className={`mt-1 text-xs ${tema.secundario}`}>{docente.correo || "Sin correo"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">{docente.departamento || "Sistemas e Informática"}</p>
                        <p className={`mt-1 text-xs ${tema.secundario}`}>{docente.modulo || "Módulo EFSRT"}</p>
                      </td>

                      <td className="w-44 px-5 py-4">
                        <p className="mb-1.5 text-xs font-semibold">{alumnos} de {capacidad}</p>
                        <Carga alumnos={alumnos} capacidad={capacidad} oscuro={darkMode} />
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold">{docente.horas || 160} hrs</p>
                        <p
                          className={`mt-1 text-xs ${
                            docente.detalle === "En validación"
                              ? "text-orange-500"
                              : docente.estado === "En Sesión"
                              ? "text-blue-600"
                              : "text-emerald-500"
                          }`}
                        >
                          {docente.validacion && <span className="block">{docente.validacion}</span>}
                          {docente.detalle || "Supervisado"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            estadoEstilos[docente.estado] || "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                          }`}
                        >
                          {docente.estado || "Disponible"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {botonFicha(docente)}
                          {botonAsignar(docente)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer y Paginación */}
        <footer
          className={`flex flex-col items-start justify-between gap-3 border-t border-inherit px-5 py-4 text-xs sm:flex-row sm:items-center ${tema.secundario}`}
        >
          <p>
            Mostrando {filtrados.length === 0 ? 0 : inicio + 1} -{" "}
            {Math.min(inicio + porPagina, filtrados.length)} de {filtrados.length} docentes
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 font-semibold transition disabled:opacity-40 ${tema.panel} ${tema.inactivo}`}
            >
              <ChevronLeft size={14} />
              Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="contents">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">...</span>}
                  <button
                    type="button"
                    onClick={() => setPagina(p)}
                    className={`min-w-[34px] rounded-lg border px-2 py-2 font-semibold transition ${
                      paginaActual === p ? "border-blue-600 bg-blue-600 text-white" : `${tema.panel} ${tema.inactivo}`
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}

            <button
              type="button"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 font-semibold transition disabled:opacity-40 ${tema.panel} ${tema.inactivo}`}
            >
              Siguiente
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}