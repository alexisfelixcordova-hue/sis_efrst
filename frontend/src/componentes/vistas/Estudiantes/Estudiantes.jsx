import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  Eye,
  GraduationCap,
  ArrowUpRight,
  Filter,
  RefreshCcw,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../../../api/axios";
import ModalEstudiante from "./componentes/ModalEstudiante";

const estados = ["Todos", "En progreso", "Pendiente", "Egresado"];

const estiloEstado = {
  "En progreso": "bg-blue-50 text-blue-700 ring-blue-600/10",
  Pendiente: "bg-amber-50 text-amber-700 ring-amber-600/10",
  Egresado: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
};

export default function Estudiantes({ onVerEstudiante, darkMode = false }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoActivo, setEstadoActivo] = useState("Todos");
  const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" });

  // Estados para controlar el componente flotante ModalEstudiante
  const [modalAbierto, setModalAbierto] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  const mostrarAlerta = (mensaje, tipo) => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta({ mensaje: "", tipo: "" }), 4000);
  };

  const obtenerEstudiantes = async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await api.get("/estudiantes?all=true");
      const resultado = response.data.data;

      if (Array.isArray(resultado)) {
        setEstudiantes(resultado);
      } else if (resultado && Array.isArray(resultado.data)) {
        setEstudiantes(resultado.data);
      } else {
        setEstudiantes([]);
      }
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
      setError("No se pudieron cargar los estudiantes desde el servidor.");
      setEstudiantes([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerEstudiantes();
  }, []);

  // Abrir flotante para registro nuevo
  const handleAbrirNuevo = () => {
    setEstudianteSeleccionado(null);
    setModalAbierto(true);
  };

  // Abrir flotante para edición
  const handleAbrirEditar = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setModalAbierto(true);
  };

  // Callback cuando el modal guarda con éxito
  const handleGuardadoExitoso = () => {
    obtenerEstudiantes();
    mostrarAlerta(
      estudianteSeleccionado
        ? "Estudiante actualizado correctamente."
        : "Estudiante registrado exitosamente.",
      "success"
    );
  };

  // Eliminar Estudiante
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este estudiante del sistema?"))
      return;
    try {
      await api.delete(`/estudiantes/${id}`);
      setEstudiantes(estudiantes.filter((e) => e.id_estudiante !== id));
      mostrarAlerta("Estudiante eliminado correctamente.", "success");
    } catch (err) {
      console.error("Error al eliminar:", err);
      mostrarAlerta("No se pudo eliminar el estudiante.", "error");
    }
  };

  const estudiantesFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    return estudiantes.filter((estudiante) => {
      const texto = [
        estudiante.dni,
        estudiante.nombres,
        estudiante.apellidos,
        estudiante.programa_estudios,
        estudiante.semestre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = texto.includes(textoBusqueda);
      const coincideEstado =
        estadoActivo === "Todos" || estudiante.estado === estadoActivo;

      return coincideBusqueda && coincideEstado;
    });
  }, [estudiantes, busqueda, estadoActivo]);

  const contarEstado = (estado) => {
    if (estado === "Todos") {
      return estudiantes.length;
    }
    return estudiantes.filter((estudiante) => estudiante.estado === estado)
      .length;
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoActivo("Todos");
  };

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

  return (
    <main className={`min-h-full space-y-6 ${tema.texto}`}>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Users size={17} />
            <span>Gestión académica</span>
            <ArrowUpRight size={15} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Estudiantes
          </h1>

          <p className={`mt-2 text-sm ${tema.secundario}`}>
            Administra y consulta la información de los estudiantes registrados.
          </p>
        </div>

        {/* Acciones Superiores (Actualizar y Nuevo Estudiante) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={obtenerEstudiantes}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${tema.panel} ${tema.inactivo}`}
          >
            <RefreshCcw size={16} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={handleAbrirNuevo}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
          >
            <Plus size={18} />
            Nuevo Estudiante
          </button>
        </div>
      </header>

      {/* Alerta flotante interna */}
      {alerta.mensaje && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium border shadow-sm ${
            alerta.tipo === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {alerta.tipo === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
          )}
          <span className="flex-1">{alerta.mensaje}</span>
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Users size={21} />
            </div>
            <span className="text-xs font-medium text-blue-600">Registrados</span>
          </div>
          <p className="mt-4 text-2xl font-bold">{contarEstado("Todos")}</p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Total de estudiantes
          </p>
        </div>

        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <GraduationCap size={21} />
            </div>
            <span className="text-xs font-medium text-emerald-600">Activos</span>
          </div>
          <p className="mt-4 text-2xl font-bold">
            {contarEstado("En progreso")}
          </p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            En progreso académico
          </p>
        </div>

        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <BookOpen size={21} />
            </div>
            <span className="text-xs font-medium text-amber-600">
              Pendientes
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{contarEstado("Pendiente")}</p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Requieren seguimiento
          </p>
        </div>

        <div className={`rounded-xl border p-5 ${tema.tarjeta}`}>
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
              <GraduationCap size={21} />
            </div>
            <span className="text-xs font-medium text-violet-600">
              Egresados
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{contarEstado("Egresado")}</p>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Formación concluida
          </p>
        </div>
      </section>

      {/* Panel de Tabla y Filtros */}
      <section className={`overflow-hidden rounded-xl border ${tema.panel}`}>
        <div className="flex flex-col gap-4 border-b border-inherit p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Listado de estudiantes</h2>
              <p className={`mt-1 text-sm ${tema.secundario}`}>
                Busca estudiantes, edítalos, elimínalos o accede a su expediente
                académico.
              </p>
            </div>
            <span className={`text-sm ${tema.secundario}`}>
              {estudiantesFiltrados.length} resultado(s)
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
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por DNI, nombres o apellidos..."
                className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${tema.campo}`}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={17} className={tema.secundario} />
              <select
                value={estadoActivo}
                onChange={(e) => setEstadoActivo(e.target.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${tema.campo}`}
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className={tema.encabezado}>
              <tr>
                <th className="px-5 py-4 font-semibold">Estudiante</th>
                <th className="px-5 py-4 font-semibold">DNI</th>
                <th className="px-5 py-4 font-semibold">Programa y Semestre</th>
                <th className="px-5 py-4 font-semibold">Correo / Teléfono</th>
                <th className="px-5 py-4 font-semibold">Estado</th>
                <th className="px-5 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className={`text-sm ${tema.secundario}`}>
                      Cargando estudiantes desde la base de datos...
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
              ) : estudiantesFiltrados.length > 0 ? (
                estudiantesFiltrados.map((estudiante) => {
                  const idEst = estudiante.id_estudiante;
                  return (
                    <tr
                      key={idEst}
                      className={`border-t transition ${tema.fila}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              estudiante.foto_url ||
                              `https://i.pravatar.cc/80?img=${(idEst % 50) + 1}`
                            }
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold">
                              {estudiante.nombres} {estudiante.apellidos}
                            </p>
                            <p className={`mt-1 text-xs ${tema.secundario}`}>
                              ID: #{idEst}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className={`px-5 py-4 ${tema.secundario}`}>
                        {estudiante.dni}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {estudiante.programa_estudios || "Sin programa"}
                        </p>
                        <p className={`mt-1 text-xs ${tema.secundario}`}>
                          {estudiante.semestre || "Sin semestre"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs">
                          {estudiante.correo || "No registrado"}
                        </p>
                        <p className={`mt-1 text-xs ${tema.secundario}`}>
                          {estudiante.telefono || "Sin teléfono"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            estiloEstado[estudiante.estado] ||
                            "bg-blue-50 text-blue-700 ring-blue-600/10"
                          }`}
                        >
                          {estudiante.estado || "En progreso"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Ver Expediente */}
                          <button
                            type="button"
                            onClick={() => onVerEstudiante?.(estudiante)}
                            title="Ver expediente"
                            className="p-2 rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(estudiante)}
                            title="Editar estudiante"
                            className="p-2 rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleEliminar(idEst)}
                            title="Eliminar estudiante"
                            className="p-2 rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
                        No se encontraron estudiantes
                      </p>
                      <p className={`mt-1 text-sm ${tema.secundario}`}>
                        Prueba con otro nombre, DNI o estado.
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

        <footer
          className={`border-t border-inherit px-5 py-4 text-xs ${tema.secundario}`}
        >
          Mostrando {estudiantesFiltrados.length} de {estudiantes.length}{" "}
          estudiantes
        </footer>
      </section>

      {/* Componente Flotante Externo */}
      <ModalEstudiante
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        estudianteActual={estudianteSeleccionado}
        onGuardadoExitoso={handleGuardadoExitoso}
        darkMode={darkMode}
      />
    </main>
  );
}