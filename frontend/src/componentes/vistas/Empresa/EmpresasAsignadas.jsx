import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Building2,
  Users,
  Clock,
  TrendingUp,
  MapPin,
  BriefcaseBusiness,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  tema,
  Cabecera,
  iniciales,
  puntoEstado,
  HORAS_TOTALES,
} from "../Docente/componentes/DocenteComun";
import api from "../../../api/axios.js";

const STORAGE_KEY = "empresas_asignadas_demo";

const datosIniciales = [
  {
    id_estudiante: 1,
    dni: "72845163",
    nombre: "Carlos Mendoza Flores",
    entidad: "WORLDNIC S.A.C.",
    estado: "En proceso",
    hrs: 320,
    cargo: "Desarrollador Web",
  },
  {
    id_estudiante: 2,
    dni: "74125896",
    nombre: "María Fernanda Torres",
    entidad: "WORLDNIC S.A.C.",
    estado: "En proceso",
    hrs: 410,
    cargo: "Diseñadora UI/UX",
  },
  {
    id_estudiante: 3,
    dni: "71963254",
    nombre: "José Antonio Rojas",
    entidad: "Tech Solutions Perú",
    estado: "Completado",
    hrs: 500,
    cargo: "Soporte Técnico",
  },
  {
    id_estudiante: 4,
    dni: "73698521",
    nombre: "Andrea Lucía Vargas",
    entidad: "Tech Solutions Perú",
    estado: "En proceso",
    hrs: 275,
    cargo: "Desarrolladora Frontend",
  },
  {
    id_estudiante: 5,
    dni: "75214869",
    nombre: "Luis Alberto Castillo",
    entidad: "Innovatec Digital",
    estado: "Pendiente",
    hrs: 120,
    cargo: "Analista de Sistemas",
  },
  {
    id_estudiante: 6,
    dni: "76852314",
    nombre: "Valeria Sánchez Ruiz",
    entidad: "Innovatec Digital",
    estado: "En proceso",
    hrs: 350,
    cargo: "Diseñadora Web",
  },
  {
    id_estudiante: 7,
    dni: "72589631",
    nombre: "Diego Ramírez Peña",
    entidad: "Grupo Empresarial Andino",
    estado: "En proceso",
    hrs: 200,
    cargo: "Asistente de Sistemas",
  },
  {
    id_estudiante: 8,
    dni: "74852136",
    nombre: "Camila Herrera Díaz",
    entidad: "Grupo Empresarial Andino",
    estado: "Completado",
    hrs: 500,
    cargo: "Desarrolladora Java",
  },
];

const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.alumnos)) return payload.alumnos;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizarEstadoPractica = (estadoRaw) => {
  const s = String(estadoRaw || "").toLowerCase().trim();
  if (
    s.includes("valid") ||
    s.includes("complet") ||
    s.includes("aprob") ||
    s.includes("finaliz")
  ) {
    return "Completado";
  }
  if (
    s.includes("no efectu") ||
    s.includes("pend") ||
    s.includes("sin ")
  ) {
    return "Pendiente";
  }
  return "En proceso";
};

const normalizarAlumnoEmpresa = (item = {}, idx = 0) => {
  const est = item.estudiante || item.alumno || item;
  const emp = item.empresa_convenio || item.empresa || item;

  const nombres = est.nombres || item.nombres || "";
  const apellidos = est.apellidos || item.apellidos || "";
  const nombreCompleto =
    est.nombre ||
    item.nombre ||
    est.name ||
    [nombres, apellidos].filter(Boolean).join(" ").trim() ||
    `Alumno ${idx + 1}`;

  const entidad =
    emp.razon_social ||
    item.empresa_razon_social ||
    item.razon_social ||
    item.empresa_entidad ||
    est.empresa_entidad ||
    item.empresa_nombre ||
    item.entidad_nombre ||
    item.entidad ||
    est.entidad ||
    (item.id_empresa ? `Empresa #${item.id_empresa}` : "Sin entidad registrada");

  const hrs = Number(
    item.horas_acumuladas ??
      est.horas_acumuladas ??
      item.hrs ??
      est.hrs ??
      item.horas ??
      est.horas ??
      0
  );

  const cargo =
    item.cargo ||
    est.cargo ||
    emp.supervisor_empresa_cargo ||
    item.supervisor_empresa_cargo ||
    item.puesto ||
    est.puesto ||
    item.modulo_nombre ||
    item.nombre_modulo ||
    "Practicante EFSRT";

  const estadoRaw =
    item.estado_efsrt ??
    est.estado_efsrt ??
    item.estado ??
    est.estado ??
    item.estado_modulo;

  return {
    ...est,
    ...item,
    id: est.id_estudiante ?? est.id ?? item.id_estudiante ?? item.id ?? idx + 1,
    id_estudiante:
      est.id_estudiante ?? est.id ?? item.id_estudiante ?? item.id ?? idx + 1,
    id_empresa: emp.id_empresa ?? item.id_empresa ?? null,
    ruc: emp.ruc ?? item.ruc ?? "",
    estado_convenio: emp.estado_convenio ?? item.estado_convenio ?? "",
    dni: String(est.dni || item.dni || `SIN-DNI-${idx + 1}`),
    nombre: nombreCompleto,
    entidad: String(entidad).trim() || "Sin entidad registrada",
    estado: normalizarEstadoPractica(estadoRaw),
    estado_efsrt: estadoRaw || "",
    hrs: Number.isNaN(hrs) ? 0 : hrs,
    cargo,
  };
};

function obtenerRespaldoLocal() {
  try {
    const guardados = localStorage.getItem(STORAGE_KEY);
    if (guardados) {
      const parsed = JSON.parse(guardados);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return datosIniciales;
  } catch {
    return datosIniciales;
  }
}

export default function EmpresasAsignadas({
  darkMode,
  setVista,
  onSeleccionarAlumno,
  onAbrirExpediente,
}) {
  const d = !!darkMode;
  const t = tema(d);

  const [alumnos, setAlumnos] = useState(obtenerRespaldoLocal);
  const [q, setQ] = useState("");
  const [cargando, setCargando] = useState(true);
  const [origenDatos, setOrigenDatos] = useState("local"); // "api" | "local"
  const [avisoApi, setAvisoApi] = useState("");

  const cargarAlumnosAsignados = async () => {
    setCargando(true);
    setAvisoApi("");

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await api.get("/mis-alumnos", { headers });
      const listaApi = extraerLista(res.data).map(normalizarAlumnoEmpresa);

      if (listaApi.length > 0) {
        setAlumnos(listaApi);
        setOrigenDatos("api");
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(listaApi));
        } catch {
          // Ignorar error de almacenamiento
        }
      } else {
        setAlumnos(obtenerRespaldoLocal());
        setOrigenDatos("local");
        setAvisoApi(
          "El endpoint /mis-alumnos no devolvió alumnos asignados aún; mostrando datos locales de respaldo."
        );
      }
    } catch (err) {
      console.error("Error al consultar /mis-alumnos en EmpresasAsignadas:", err);
      setAlumnos(obtenerRespaldoLocal());
      setOrigenDatos("local");
      setAvisoApi(
        "No se pudo conectar con /mis-alumnos; mostrando datos locales de respaldo."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlumnosAsignados();
  }, []);

  const mapa = useMemo(() => {
    const m = new Map();
    alumnos.forEach((alumno) => {
      const nombre = (alumno.entidad || "").trim() || "Sin entidad registrada";
      if (!m.has(nombre)) {
        m.set(nombre, []);
      }
      m.get(nombre).push(alumno);
    });
    return m;
  }, [alumnos]);

  const empresas = useMemo(() => {
    const filtroTexto = q.trim().toLowerCase();
    return [...mapa.entries()]
      .map(([nombre, lista]) => {
        const horas = lista.reduce(
          (total, alumno) => total + Number(alumno.hrs || 0),
          0
        );
        const totalMeta = HORAS_TOTALES || 160;
        const promedio = lista.length
          ? Math.min(100, Math.round((horas / lista.length / totalMeta) * 100))
          : 0;

        const ruc = lista.find((a) => a.ruc)?.ruc || "";
        const estadoConvenio =
          lista.find((a) => a.estado_convenio)?.estado_convenio || "";

        return {
          nombre,
          ruc,
          estadoConvenio,
          lista,
          promedio,
          horas,
        };
      })
      .filter((empresa) => {
        if (!filtroTexto) return true;
        const coincideEmpresa =
          empresa.nombre.toLowerCase().includes(filtroTexto) ||
          empresa.ruc.toLowerCase().includes(filtroTexto);
        const coincideAlumno = empresa.lista.some((al) =>
          `${al.nombre} ${al.dni} ${al.cargo}`.toLowerCase().includes(filtroTexto)
        );
        return coincideEmpresa || coincideAlumno;
      })
      .sort((a, b) => b.lista.length - a.lista.length);
  }, [mapa, q]);

  const totalPracticantes = alumnos.length;
  const totalHoras = alumnos.reduce(
    (total, alumno) => total + Number(alumno.hrs || 0),
    0
  );
  const completados = alumnos.filter(
    (alumno) => alumno.estado === "Completado"
  ).length;
  const porcentaje = totalPracticantes
    ? Math.round((completados / totalPracticantes) * 100)
    : 0;

  const abrirExpedienteAlumno = (alumno) => {
    try {
      localStorage.setItem(
        "expediente_alumno_seleccionado",
        JSON.stringify(alumno)
      );
    } catch {
      // Ignorar error de almacenamiento
    }
    onSeleccionarAlumno?.(alumno);
    onAbrirExpediente?.(alumno);
    setVista?.("ExpedienteAlumno");
  };

  const tarjeta = d
    ? "bg-[#172337] border border-slate-700/70"
    : "bg-white border border-slate-200";

  const textoSecundario = d ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`space-y-6 text-sm ${t.texto}`}>
      <Cabecera
        t={t}
        titulo="Empresas Asignadas"
        subtitulo="Consulta las entidades y módulos donde tus alumnos asignados realizan sus prácticas EFSRT."
        pill={`Total Empresas: ${mapa.size}`}
      />

      {avisoApi && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <span>{avisoApi}</span>
          <button
            type="button"
            onClick={cargarAlumnosAsignados}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold underline"
          >
            <RefreshCw size={12} />
            Reintentar conexión
          </button>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Empresas registradas</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <Building2 size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{mapa.size}</p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Entidades colaboradoras vinculadas
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Practicantes</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <Users size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{totalPracticantes}</p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Alumnos asignados al docente
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Horas acumuladas</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Clock size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">
            {totalHoras.toLocaleString("es-PE")}
          </p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Horas de prácticas registradas
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Prácticas completadas</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{porcentaje}%</p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            {completados} de {totalPracticantes} practicantes
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold">Directorio de empresas</h2>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Entidades y alumnos asignados agrupados automáticamente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search
              size={17}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textoSecundario}`}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar empresa, RUC o practicante..."
              className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${t.entrada}`}
            />
          </div>
          <button
            type="button"
            onClick={cargarAlumnosAsignados}
            title="Actualizar desde alumnos asignados"
            className={`grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl border transition ${
              t.boton || tarjeta
            }`}
          >
            <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Empresas */}
      {cargando ? (
        <div className={`${tarjeta} rounded-2xl px-6 py-14 text-center`}>
          <p className={`text-sm ${textoSecundario}`}>
            Cargando empresas desde tus alumnos asignados...
          </p>
        </div>
      ) : empresas.length === 0 ? (
        <div className={`${tarjeta} rounded-2xl px-6 py-16 text-center`}>
          <Building2 size={38} className={`mx-auto mb-3 ${textoSecundario}`} />
          <h3 className="font-semibold">No se encontraron empresas</h3>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Intenta con otro nombre de empresa, RUC o practicante.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {empresas.map((empresa) => (
            <article
              key={empresa.nombre}
              className={`${tarjeta} rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
            >
              {/* Cabecera de empresa */}
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                    d
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Building2 size={23} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-[15px]">
                    {empresa.nombre}
                  </h3>

                  <div
                    className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${textoSecundario}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {empresa.ruc ? `RUC ${empresa.ruc}` : "Entidad colaboradora"}
                    </span>
                    {empresa.estadoConvenio && (
                      <span>· {empresa.estadoConvenio}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Información */}
              <div
                className={`mt-5 grid grid-cols-2 gap-3 border-y py-4 ${t.borde}`}
              >
                <div>
                  <div
                    className={`flex items-center gap-1.5 text-xs ${textoSecundario}`}
                  >
                    <Users size={14} />
                    Practicantes
                  </div>
                  <p className="mt-1 text-xl font-bold">{empresa.lista.length}</p>
                </div>

                <div>
                  <div
                    className={`flex items-center gap-1.5 text-xs ${textoSecundario}`}
                  >
                    <Clock size={14} />
                    Horas acumuladas
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {empresa.horas.toLocaleString("es-PE")}
                  </p>
                </div>
              </div>

              {/* Progreso */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-xs ${textoSecundario}`}>
                    Avance promedio
                  </span>
                  <span className="text-xs font-bold text-blue-500">
                    {empresa.promedio}%
                  </span>
                </div>

                <div
                  className={`h-2 overflow-hidden rounded-full ${
                    d ? "bg-slate-700" : "bg-slate-100"
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, empresa.promedio)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Practicantes */}
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold">Practicantes asignados</h4>
                  <span className={`text-[11px] ${textoSecundario}`}>
                    {empresa.lista.length} registrados
                  </span>
                </div>

                <ul className="space-y-3">
                  {empresa.lista.map((alumno, idx) => (
                    <li
                      key={`${alumno.id_estudiante ?? alumno.dni}-${idx}`}
                      onClick={() => abrirExpedienteAlumno(alumno)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-blue-500/5"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          d
                            ? "bg-slate-700 text-slate-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {iniciales(alumno.nombre)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">
                          {alumno.nombre}
                        </p>
                        <p className={`truncate text-[11px] ${textoSecundario}`}>
                          {alumno.cargo} · {alumno.hrs} h
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          title={alumno.estado_efsrt || alumno.estado}
                          className={`h-2 w-2 rounded-full ${puntoEstado(
                            alumno.estado
                          )}`}
                        />
                        <span className={`text-[10px] ${textoSecundario}`}>
                          {alumno.estado_efsrt || alumno.estado}
                        </span>
                        <ExternalLink size={12} className="text-blue-500" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pie */}
              <div
                className={`mt-5 flex items-center justify-between border-t pt-3 ${t.borde}`}
              >
                <span
                  className={`flex items-center gap-1.5 text-[11px] ${textoSecundario}`}
                >
                  <BriefcaseBusiness size={13} />
                  Prácticas profesionales
                </span>
                <span className="text-[11px] font-semibold text-blue-500">
                  {empresa.lista.length} alumnos
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className={`text-center text-[11px] ${textoSecundario}`}>
        {origenDatos === "api"
          ? "Sincronizado con tus alumnos asignados (/mis-alumnos)."
          : "Datos locales de respaldo (se sincronizan al obtener alumnos asignados)."}
      </p>
    </div>
  );
}