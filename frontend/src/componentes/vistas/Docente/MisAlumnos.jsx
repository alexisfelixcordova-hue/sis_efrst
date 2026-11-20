import React, { useEffect, useState, useMemo } from "react";
import { Search, BookOpen, RefreshCcw, Users, Filter } from "lucide-react";
import api from "../../../api/axios";

const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.alumnos)) return payload.alumnos;
  return [];
};

const obtenerIdModulo = (m) => m?.id_modulo ?? m?.id;
const nombreModuloDe = (m) =>
  m?.nombre ?? m?.nombre_modulo ?? m?.modulo ?? m?.titulo ?? m?.descripcion ?? "";

export default function MisAlumnos({ darkMode = false }) {
  const [alumnos, setAlumnos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const obtenerModulos = async () => {
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await api.get("/modulos-profesionales", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setModulos(extraerLista(res.data));
    } catch (err) {
      console.error("Error al cargar módulos:", err);
      setModulos([]);
    }
  };

  const obtenerMisAlumnos = async () => {
    setCargando(true);
    setError("");
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const params = {};

      if (busqueda.trim()) {
        params.search = busqueda.trim();
      }
      if (moduloSeleccionado !== "todos") {
        params.id_modulo = moduloSeleccionado;
      }

      const res = await api.get("/mis-alumnos", {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setAlumnos(extraerLista(res.data));
    } catch (err) {
      console.error("Error al cargar los alumnos asignados:", err);
      setError("No se pudieron cargar tus alumnos asignados.");
      setAlumnos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerModulos();
  }, []);

  useEffect(() => {
    obtenerMisAlumnos();
  }, [busqueda, moduloSeleccionado]);

  const alumnosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return alumnos.filter((alumno) => {
      const coincideTexto =
        !q ||
        [
          alumno.dni,
          alumno.nombres,
          alumno.apellidos,
          alumno.correo,
          alumno.programa_estudios,
          alumno.modulo_nombre || alumno.modulo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const idModAlumno = alumno.id_modulo ?? alumno.modulo_id;
      const coincideModulo =
        moduloSeleccionado === "todos" ||
        !idModAlumno ||
        String(idModAlumno) === String(moduloSeleccionado);

      return coincideTexto && coincideModulo;
    });
  }, [alumnos, busqueda, moduloSeleccionado]);

  const tema = darkMode
    ? {
        texto: "text-slate-100",
        secundario: "text-slate-400",
        tarjeta: "bg-[#0b1b3a] border-[#1e335c]",
        campo:
          "bg-[#0f172a] border-[#1e335c] text-slate-100 placeholder:text-slate-500",
        encabezado: "border-[#1e335c] text-slate-400",
        fila: "border-[#1e335c] hover:bg-[#13264c]",
        badge: "bg-[#0f172a] text-slate-200 border border-[#1e335c]",
      }
    : {
        texto: "text-slate-800",
        secundario: "text-slate-500",
        tarjeta: "bg-white border-slate-200",
        campo:
          "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400",
        encabezado: "border-slate-100 text-slate-400",
        fila: "border-slate-100 hover:bg-slate-50",
        badge: "bg-slate-100 text-slate-700",
      };

  return (
    <div className={`p-6 space-y-6 ${tema.texto}`}>
      {/* Cabecera de la sección */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mis Alumnos Asignados
          </h1>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Supervisa el avance, módulo asignado, datos de contacto y estado de
            tus practicantes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={obtenerMisAlumnos}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${tema.tarjeta} ${tema.texto}`}
          >
            <RefreshCcw
              size={15}
              className={cargando ? "animate-spin" : ""}
            />
            Actualizar
          </button>

          <div
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium ${tema.badge}`}
          >
            <Users size={16} className="text-[#0284c7]" />
            Total Alumnos:{" "}
            <span className="font-bold">{alumnosFiltrados.length}</span>
          </div>
        </div>
      </div>

      {/* Contenedor principal con buscador, filtro por módulo y tabla */}
      <div className={`rounded-xl border p-6 shadow-sm ${tema.tarjeta}`}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search
              size={17}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${tema.secundario}`}
            />
            <input
              type="text"
              placeholder="Buscar por DNI, nombres o apellidos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20 ${tema.campo}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className={tema.secundario} />
            <select
              value={moduloSeleccionado}
              onChange={(e) => setModuloSeleccionado(e.target.value)}
              aria-label="Filtrar por módulo profesional"
              className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-[#0284c7] ${tema.campo}`}
            >
              <option value="todos">Todos los módulos</option>
              {modulos.map((mod) => {
                const idMod = obtenerIdModulo(mod);
                return (
                  <option key={String(idMod)} value={String(idMod)}>
                    {nombreModuloDe(mod) || `Módulo #${idMod}`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Tabla de alumnos */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr
                className={`border-b text-xs font-semibold uppercase tracking-wider ${tema.encabezado}`}
              >
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4">Apellidos y Nombres</th>
                <th className="py-3 px-4">Módulo EFSRT</th>
                <th className="py-3 px-4">Programa de Estudios</th>
                <th className="py-3 px-4">Semestre</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${tema.fila}`}>
              {cargando ? (
                <tr>
                  <td
                    colSpan="7"
                    className={`py-8 text-center ${tema.secundario}`}
                  >
                    Cargando alumnos asignados...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : alumnosFiltrados.length > 0 ? (
                alumnosFiltrados.map((alumno) => {
                  const nombreModulo =
                    alumno.modulo_nombre ||
                    alumno.nombre_modulo ||
                    alumno.modulo ||
                    "Módulo EFSRT";
                  const periodo = alumno.periodo_academico
                    ? ` (${alumno.periodo_academico})`
                    : "";

                  return (
                    <tr
                      key={`${alumno.id_estudiante || alumno.id}-${
                        alumno.id_modulo || "sin-mod"
                      }`}
                      className={`transition ${tema.fila}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {alumno.dni || "S/N"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {alumno.apellidos
                          ? `${alumno.apellidos}, ${alumno.nombres}`
                          : alumno.nombres}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          <BookOpen size={13} />
                          {nombreModulo}
                          {periodo}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 ${tema.secundario}`}>
                        {alumno.programa_estudios ||
                          "Diseño y Programación Web"}
                      </td>
                      <td className={`py-3.5 px-4 ${tema.secundario}`}>
                        {alumno.semestre || "VI Semestre"}
                      </td>
                      <td className={`py-3.5 px-4 ${tema.secundario}`}>
                        {alumno.correo || alumno.email || "S/C"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          {alumno.estado || "En progreso"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className={`py-8 text-center ${tema.secundario}`}
                  >
                    No se encontraron alumnos asignados para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}