import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  UserRoundPlus,
  SlidersHorizontal,
  Filter,
  Eye,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api, { getCachedData, clearApiCache } from "../../../api/axios";
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

const AvatarDocente = ({ docente, index, nombreCompleto }) => {
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
      className="h-10 w-10 rounded-full object-cover"
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
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [vistaAsignarActiva, setVistaAsignarActiva] = useState(false);
  const [docenteParaAsignar, setDocenteParaAsignar] = useState(null);

  const porPagina = 5;

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
      clearApiCache();
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
        const nombreCompleto = `${d.nombres || d.nombre || ""} ${
          d.apellidos || ""
        }`;
        const texto = `${nombreCompleto} ${d.correo || ""} ${
          d.departamento || ""
        } ${d.modulo || ""}`.toLowerCase();

        return (
          texto.includes(busqueda.trim().toLowerCase()) &&
          (especialidad === "Todas las especialidades" ||
            d.departamento === especialidad) &&
          (modulo === "Todos los Módulos EFSRT" ||
            (d.modulos || []).includes(modulo)) &&
          (!soloDisponibles || d.estado !== "Cupo Completo")
        );
      })
      .sort((a, b) => (b.alumnos || 0) - (a.alumnos || 0));
  }, [docentes, busqueda, especialidad, modulo, soloDisponibles]);

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
    setSoloDisponibles(false);
    setPagina(1);
  };

  const capacidadDe = (d) => Number(d.capacidad) || 12;
  const totalDocentes = docentes.length;
  const totalDisponibles = docentes.filter(
    (d) => (d.alumnos || 0) < capacidadDe(d)
  ).length;
  const totalEnSesion = docentes.filter((d) => (d.alumnos || 0) > 0).length;
  const totalAlumnos = docentes.reduce((suma, d) => suma + (d.alumnos || 0), 0);

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

  return (
    <main className={`min-h-full space-y-6 ${tema.texto}`}>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        {/* Ruta, título grande y subtítulo (mismo estilo que Reportes, Constancias y Empresas) */}
        <div className="font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
          <p
            className={`text-xs leading-4 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Gestión académica <span className="mx-1">/</span>{" "}
            <span
              className={`font-medium ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Plantel docente
            </span>
          </p>

          <h1
            className={`mt-2 text-[30px] font-extrabold leading-9 tracking-[-0.025em] ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Plantel docente EFSRT
          </h1>

          <p className={`mt-1 text-[13px] leading-5 ${tema.secundario}`}>
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
            onClick={() =>
              abrirVistaAsignar(filtrados[0] || docentes[0] || null)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <UserRoundPlus size={16} />
            Asignar estudiantes
          </button>
        </div>
      </header>

      {/* Tarjetas de Estadísticas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Users size={21} />
            </div>
            <span className="text-xs font-medium text-blue-600">Registrados</span>
          </div>
          <p className="mt-4 text-2xl font-bold">{totalDocentes}</p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>Total de docentes</p>
        </div>

        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <UserCheck size={21} />
            </div>
            <span className="text-xs font-medium text-emerald-600">
              Disponibles
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{totalDisponibles}</p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Con cupo para asesorar
          </p>
        </div>

        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <BookOpen size={21} />
            </div>
            <span className="text-xs font-medium text-amber-600">
              En sesión
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{totalEnSesion}</p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Asesorando actualmente
          </p>
        </div>

        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
              <GraduationCap size={21} />
            </div>
            <span className="text-xs font-medium text-violet-600">Alumnos</span>
          </div>
          <p className="mt-4 text-2xl font-bold">{totalAlumnos}</p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Estudiantes a cargo
          </p>
        </div>
      </section>

      {/* Panel de Tabla y Filtros */}
      <section className={`overflow-hidden rounded-xl border ${tema.panel}`}>
        <div className="flex flex-col gap-4 border-b border-inherit p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Listado de docentes</h2>
              <p className={`mt-1 text-sm ${tema.secundario}`}>
                Busca docentes y accede a su ficha. Ordenado por mayor carga de
                alumnos.
              </p>
            </div>
            <span className={`text-sm ${tema.secundario}`}>
              {filtrados.length} resultado(s)
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${tema.secundario}`}
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => cambiarFiltro(setBusqueda, e.target.value)}
                placeholder="Buscar por docente, correo o especialidad..."
                className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${tema.campo}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter size={17} className={tema.secundario} />
              <select
                value={especialidad}
                onChange={(e) => cambiarFiltro(setEspecialidad, e.target.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {especialidades.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>

              <select
                value={modulo}
                onChange={(e) => cambiarFiltro(setModulo, e.target.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {modulos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${tema.panel} ${tema.inactivo}`}
              >
                <SlidersHorizontal size={16} />
                Filtros
              </button>
            </div>
          </div>

          {filtrosAbiertos && (
            <div className="flex flex-wrap items-center gap-3 border-t border-inherit pt-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={soloDisponibles}
                  onChange={(e) =>
                    cambiarFiltro(setSoloDisponibles, e.target.checked)
                  }
                  className="accent-blue-600"
                />
                Mostrar solamente docentes disponibles
              </label>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="ml-auto text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className={tema.encabezado}>
              <tr>
                <th className="px-5 py-4 font-semibold">Docente / Asesor</th>
                <th className="px-5 py-4 font-semibold">Departamento / Área</th>
                <th className="px-5 py-4 font-semibold">Alumnos a cargo</th>
                <th className="px-5 py-4 font-semibold">Horas validativas</th>
                <th className="px-5 py-4 font-semibold">Disponibilidad</th>
                <th className="px-5 py-4 text-right font-semibold">Acción</th>
              </tr>
            </thead>

            <tbody>
              {cargando && visibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className={`text-sm ${tema.secundario}`}>
                      Cargando plantel docente desde la base de datos...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : visibles.length > 0 ? (
                visibles.map((docente, index) => {
                  const nombreCompleto =
                    docente.nombres && docente.apellidos
                      ? `${docente.nombres} ${docente.apellidos}`
                      : docente.nombre || "Sin nombre";

                  return (
                    <tr
                      key={docente.id_usuario || docente.id || index}
                      className={`border-t transition ${tema.fila}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <AvatarDocente
                            docente={docente}
                            index={index}
                            nombreCompleto={nombreCompleto}
                          />
                          <div>
                            <p className="font-semibold">{nombreCompleto}</p>
                            <p className={`mt-1 text-xs ${tema.secundario}`}>
                              {docente.correo || "Sin correo"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {docente.departamento || "Sistemas e Informática"}
                        </p>
                        <p className={`mt-1 text-xs ${tema.secundario}`}>
                          {docente.modulo || "Módulo EFSRT"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold">{docente.alumnos || 0}</p>
                        <p className={`mt-1 text-xs ${tema.secundario}`}>
                          estudiantes
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {docente.horas || 160} hrs
                        </p>
                        <p
                          className={`mt-1 text-xs ${
                            docente.detalle === "En validación"
                              ? "text-orange-500"
                              : docente.estado === "En Sesión"
                              ? "text-blue-600"
                              : "text-emerald-500"
                          }`}
                        >
                          {docente.validacion && (
                            <span className="block">{docente.validacion}</span>
                          )}
                          {docente.detalle || "Supervisado"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            estadoEstilos[docente.estado] ||
                            "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                          }`}
                        >
                          {docente.estado || "Disponible"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onVerFicha?.(docente)}
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Eye size={15} />
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                        <Search size={25} />
                      </div>
                      <p className="mt-3 font-semibold">
                        No se encontraron docentes
                      </p>
                      <p className={`mt-1 text-sm ${tema.secundario}`}>
                        Prueba con otro nombre, especialidad o módulo.
                      </p>
                      <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer y Paginación */}
        <footer
          className={`flex flex-col items-start justify-between gap-3 border-t border-inherit px-5 py-4 text-xs sm:flex-row sm:items-center ${tema.secundario}`}
        >
          <p>
            Mostrando {filtrados.length === 0 ? 0 : inicio + 1} -{" "}
            {Math.min(inicio + porPagina, filtrados.length)} de{" "}
            {filtrados.length} docentes
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
              .filter(
                (p) =>
                  p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1
              )
              .map((p, i, arr) => (
                <span key={p} className="contents">
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-1">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPagina(p)}
                    className={`min-w-[34px] rounded-lg border px-2 py-2 font-semibold transition ${
                      paginaActual === p
                        ? "border-blue-600 bg-blue-600 text-white"
                        : `${tema.panel} ${tema.inactivo}`
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