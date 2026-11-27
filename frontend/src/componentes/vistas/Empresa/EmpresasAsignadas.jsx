import { useState, useEffect, useMemo, useCallback } from "react";
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
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import {
  tema,
  Cabecera,
  puntoEstado,
  HORAS_TOTALES,
} from "../Docente/componentes/DocenteComun";
import AvatarEstudiante from "../../AvatarEstudiante.jsx";
import api, {
  getCachedData,
  invalidateApiCache,
} from "../../../api/axios.js";
import {
  claveCanonicaModulo,
  normalizarNombreModulo,
  useModuloSistema,
} from "../../../utils/moduloSistema.js";

const STORAGE_KEY = "empresas_asignadas_cache_v1";

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
    item.puesto ||
    est.puesto ||
    item.modulo_nombre ||
    item.nombre_modulo ||
    "Practicante EFSRT";
  const moduloNombre =
    normalizarNombreModulo(
      item.modulo_nombre || item.nombre_modulo || est.modulo_nombre || ""
    );

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
    id_modulo: item.id_modulo ?? est.id_modulo ?? null,
    modulo_nombre: moduloNombre,
    periodo_academico: item.periodo_academico ?? est.periodo_academico ?? "",
    ruc: String(emp.ruc ?? item.ruc ?? ""),
    estado_convenio: emp.estado_convenio ?? item.estado_convenio ?? "",
    telefono_empresa: emp.telefono ?? item.telefono ?? "",
    correo_empresa: emp.correo_electronico ?? item.correo_electronico ?? "",
    direccion_empresa: emp.direccion ?? item.direccion ?? "",
    contacto_empresa:
      emp.supervisor_empresa_nombre ??
      item.supervisor_empresa_nombre ??
      "",
    cargo_contacto_empresa:
      emp.supervisor_empresa_cargo ??
      item.supervisor_empresa_cargo ??
      "",
    dni: String(est.dni || item.dni || `SIN-DNI-${idx + 1}`),
    nombre: nombreCompleto,
    entidad: String(entidad).trim() || "Sin entidad registrada",
    estado: normalizarEstadoPractica(estadoRaw),
    estado_efsrt: estadoRaw || "",
    hrs: Number.isNaN(hrs) ? 0 : hrs,
    cargo,
  };
};

const agruparPracticas = (filas) => {
  const porAlumno = new Map();

  filas.forEach((fila) => {
    const clave = String(fila.id_estudiante ?? fila.dni ?? fila.nombre);
    if (!porAlumno.has(clave)) {
      porAlumno.set(clave, {
        ...fila,
        horasTotales: 0,
        estados: [],
        modulos: new Map(),
      });
    }

    const alumno = porAlumno.get(clave);
    alumno.horasTotales += Number(fila.hrs || 0);
    alumno.estados.push(fila.estado);

    const moduloNombre = fila.modulo_nombre || fila.cargo;
    const moduloClave = String(
      fila.id_modulo ?? `${moduloNombre}-${fila.periodo_academico || ""}`
    );
    if (moduloNombre && !alumno.modulos.has(moduloClave)) {
      alumno.modulos.set(moduloClave, moduloNombre);
    }
  });

  return [...porAlumno.values()].map((alumno) => {
    const todosCompletos =
      alumno.estados.length > 0 &&
      alumno.estados.every((estado) => estado === "Completado");
    const todosPendientes =
      alumno.estados.length > 0 &&
      alumno.estados.every((estado) => estado === "Pendiente");

    return {
      ...alumno,
      hrs: alumno.horasTotales,
      estado: todosCompletos
        ? "Completado"
        : todosPendientes
          ? "Pendiente"
          : "En proceso",
      estado_efsrt: todosCompletos
        ? "Completado"
        : todosPendientes
          ? "Pendiente"
          : "En proceso",
      cargo: [...alumno.modulos.values()].join(" · ") || "Practicante EFSRT",
    };
  });
};

const tieneEmpresaAlumno = (alumno) =>
  Boolean(alumno.id_empresa && String(alumno.id_empresa).trim());

function obtenerRespaldoLocal(clave) {
  if (!clave) return [];
  try {
    const guardados = localStorage.getItem(clave);
    if (guardados) {
      const parsed = JSON.parse(guardados);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export default function EmpresasAsignadas({
  darkMode,
  usuario,
  setVista,
  onSeleccionarAlumno,
  onAbrirExpediente,
}) {
  const d = !!darkMode;
  const t = tema(d);
  const moduloSistema = useModuloSistema();
  const idUsuario =
    usuario?.id_usuario ?? usuario?.id_docente ?? usuario?.id ?? null;
  const claveRespaldo = idUsuario ? `${STORAGE_KEY}_${idUsuario}` : null;

  const cacheApiInicial = getCachedData("/mis-alumnos");
  const respaldoInicial = obtenerRespaldoLocal(claveRespaldo);
  const tieneCacheApiInicial = cacheApiInicial !== null;
  const alumnosIniciales = tieneCacheApiInicial
    ? extraerLista(cacheApiInicial).map(normalizarAlumnoEmpresa)
    : respaldoInicial;

  const [alumnos, setAlumnos] = useState(alumnosIniciales);
  const [q, setQ] = useState("");
  const [cargando, setCargando] = useState(
    !tieneCacheApiInicial && respaldoInicial.length === 0
  );
  const [origenDatos, setOrigenDatos] = useState(
    tieneCacheApiInicial ? "api" : respaldoInicial.length ? "local" : "api"
  );
  const [avisoApi, setAvisoApi] = useState("");
  const [actualizando, setActualizando] = useState(false);

  const cargarAlumnosAsignados = useCallback(async () => {
    const datosCacheApi = getCachedData("/mis-alumnos");
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await api.get("/mis-alumnos", { headers });
      const listaApi = extraerLista(res.data).map(normalizarAlumnoEmpresa);

      setAlumnos(listaApi);
      setOrigenDatos("api");
      if (claveRespaldo) {
        try {
          localStorage.setItem(claveRespaldo, JSON.stringify(listaApi));
        } catch {
          // Ignorar error de almacenamiento
        }
      }
    } catch (err) {
      console.error("Error al consultar /mis-alumnos en EmpresasAsignadas:", err);
      const respaldo =
        datosCacheApi !== null
          ? extraerLista(datosCacheApi).map(normalizarAlumnoEmpresa)
          : obtenerRespaldoLocal(claveRespaldo);
      setAlumnos(respaldo);
      setOrigenDatos(respaldo.length ? "local" : "api");
      setAvisoApi(
        respaldo.length
          ? "No se pudo actualizar la información; se muestran los últimos datos guardados."
          : "No se pudo conectar con el servidor. Intenta actualizar nuevamente."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [claveRespaldo]);

  const actualizarAlumnosAsignados = () => {
    invalidateApiCache("/mis-alumnos");
    setAvisoApi("");
    setActualizando(true);
    cargarAlumnosAsignados();
  };

  useEffect(() => {
    cargarAlumnosAsignados();
  }, [cargarAlumnosAsignados]);

  useEffect(() => {
    const alActualizarAsignacion = (event) => {
      if (!event?.detail?.confirmadoServidor) return;
      invalidateApiCache("/mis-alumnos");
      cargarAlumnosAsignados();
    };

    window.addEventListener("expediente:actualizado", alActualizarAsignacion);
    return () =>
      window.removeEventListener(
        "expediente:actualizado",
        alActualizarAsignacion
      );
  }, [cargarAlumnosAsignados]);

  const moduloSistemaId = moduloSistema?.id_modulo;
  const moduloSistemaNombre = claveCanonicaModulo(moduloSistema?.nombre_modulo || "");
  const alumnosModulo = useMemo(
    () =>
      !moduloSistemaId
        ? alumnos
        : alumnos.filter(
            (alumno) =>
              String(alumno.id_modulo) === String(moduloSistemaId) ||
              (moduloSistemaNombre &&
                claveCanonicaModulo(alumno.modulo_nombre || alumno.nombre_modulo) ===
                  moduloSistemaNombre)
          ),
    [alumnos, moduloSistemaId, moduloSistemaNombre]
  );

  const mapa = useMemo(() => {
    const m = new Map();
    alumnosModulo.forEach((alumno) => {
      const nombre = (alumno.entidad || "").trim() || "Sin entidad registrada";
      const clave = alumno.id_empresa
        ? `empresa-${alumno.id_empresa}`
        : `nombre-${nombre.toLocaleLowerCase()}`;
      if (!m.has(clave)) {
        m.set(clave, []);
      }
      m.get(clave).push(alumno);
    });
    return m;
  }, [alumnosModulo]);

  const alumnosUnicos = useMemo(() => agruparPracticas(alumnosModulo), [alumnosModulo]);
  const alumnosSinEmpresa = useMemo(
    () =>
      agruparPracticas(
        alumnosModulo.filter((alumno) => !tieneEmpresaAlumno(alumno))
      ),
    [alumnosModulo]
  );

  const empresas = useMemo(() => {
    const filtroTexto = q.trim().toLowerCase();
    return [...mapa.entries()]
      .map(([clave, lista]) => {
        const primera = lista[0];
        const horas = lista.reduce(
          (total, alumno) => total + Number(alumno.hrs || 0),
          0
        );
        const totalMeta = HORAS_TOTALES || 160;
        const promedio = lista.length
          ? Math.min(
              100,
              Math.round((horas / agruparPracticas(lista).length / totalMeta) * 100)
            )
          : 0;
        const alumnosEmpresa = agruparPracticas(lista);

        const ruc = lista.find((a) => a.ruc)?.ruc || "";
        const estadoConvenio =
          lista.find((a) => a.estado_convenio)?.estado_convenio || "";

        return {
          clave,
          nombre: primera?.entidad || "Sin entidad registrada",
          tieneEmpresa: lista.some(tieneEmpresaAlumno),
          ruc,
          estadoConvenio,
          telefono: lista.find((a) => a.telefono_empresa)?.telefono_empresa || "",
          correo: lista.find((a) => a.correo_empresa)?.correo_empresa || "",
          direccion: lista.find((a) => a.direccion_empresa)?.direccion_empresa || "",
          contacto: lista.find((a) => a.contacto_empresa)?.contacto_empresa || "",
          cargoContacto:
            lista.find((a) => a.cargo_contacto_empresa)?.cargo_contacto_empresa || "",
          lista: alumnosEmpresa,
          promedio,
          horas,
        };
      })
      .filter((empresa) => empresa.tieneEmpresa)
      .filter((empresa) => {
        if (!filtroTexto) return true;
        const coincideEmpresa =
          empresa.nombre.toLowerCase().includes(filtroTexto) ||
          String(empresa.ruc).toLowerCase().includes(filtroTexto);
        const coincideAlumno = empresa.lista.some((al) =>
          `${al.nombre} ${al.dni} ${al.cargo}`.toLowerCase().includes(filtroTexto)
        );
        return coincideEmpresa || coincideAlumno;
      })
      .sort((a, b) => b.lista.length - a.lista.length);
  }, [mapa, q]);

  const totalEmpresas = [...mapa.values()].filter((lista) =>
    lista.some(tieneEmpresaAlumno)
  ).length;
  const totalPracticantes = alumnosUnicos.length;
  const totalHoras = alumnos.reduce(
    (total, alumno) => total + Number(alumno.hrs || 0),
    0
  );
  const completados = alumnosUnicos.filter(
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
    if (onAbrirExpediente) {
      onAbrirExpediente(alumno);
      return;
    }
    setVista?.("Expediente Alumno");
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
        pill={`Total Empresas: ${totalEmpresas}`}
      />

      {avisoApi && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <span>{avisoApi}</span>
          <button
            type="button"
            onClick={actualizarAlumnosAsignados}
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
          <p className="mt-3 text-3xl font-bold">{totalEmpresas}</p>
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
            onClick={actualizarAlumnosAsignados}
            title="Actualizar desde alumnos asignados"
            className={`grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl border transition ${
              t.boton || tarjeta
            }`}
          >
            <RefreshCw
              size={16}
              className={cargando || actualizando ? "animate-spin" : ""}
            />
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
          <h3 className="font-semibold">
            {q ? "No hay resultados para esta búsqueda" : "Aún no tienes empresas asignadas"}
          </h3>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            {q
              ? "Prueba con otro nombre, RUC o practicante."
              : avisoApi || "Cuando se asigne una empresa a tus alumnos, aparecerá aquí."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {empresas.map((empresa) => (
            <article
              key={empresa.clave}
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
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        {empresa.estadoConvenio}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(empresa.direccion ||
                empresa.telefono ||
                empresa.correo ||
                empresa.contacto) && (
                <div
                  className={`mt-4 grid gap-2 rounded-xl p-3 text-xs sm:grid-cols-2 ${
                    d ? "bg-slate-800/70" : "bg-slate-50"
                  }`}
                >
                  {empresa.contacto && (
                    <p className="flex min-w-0 items-start gap-2">
                      <UserRound size={14} className="mt-0.5 shrink-0 text-blue-500" />
                      <span className="min-w-0 break-words">
                        {empresa.contacto}
                        {empresa.cargoContacto && (
                          <span className={`block ${textoSecundario}`}>
                            {empresa.cargoContacto}
                          </span>
                        )}
                      </span>
                    </p>
                  )}
                  {empresa.telefono && (
                    <p className="flex min-w-0 items-start gap-2">
                      <Phone size={14} className="mt-0.5 shrink-0 text-blue-500" />
                      <span className="break-all">{empresa.telefono}</span>
                    </p>
                  )}
                  {empresa.correo && (
                    <p className="flex min-w-0 items-start gap-2">
                      <Mail size={14} className="mt-0.5 shrink-0 text-blue-500" />
                      <span className="break-all">{empresa.correo}</span>
                    </p>
                  )}
                  {empresa.direccion && (
                    <p className="flex min-w-0 items-start gap-2 sm:col-span-2">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-blue-500" />
                      <span className="break-words">{empresa.direccion}</span>
                    </p>
                  )}
                </div>
              )}

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
                    <li key={`${alumno.id_estudiante ?? alumno.dni}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => abrirExpedienteAlumno(alumno)}
                        aria-label={`Ver expediente de ${alumno.nombre}`}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-blue-500/5"
                      >
                        <AvatarEstudiante
                          estudiante={alumno}
                          className="h-9 w-9 rounded-full text-xs font-bold"
                          fallbackClassName={
                            d
                              ? "bg-slate-700 text-slate-200"
                              : "bg-slate-100 text-slate-600"
                          }
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold">
                            {alumno.nombre}
                          </span>
                          <span className={`block truncate text-[11px] ${textoSecundario}`}>
                            {alumno.cargo} · {alumno.hrs} h
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-1.5">
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
                        </span>
                      </button>
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

      {alumnosSinEmpresa.length > 0 && (
        <section className={`${tarjeta} rounded-2xl p-5`}>
          <div className="mb-4">
            <h2 className="font-bold">Alumnos sin empresa vinculada</h2>
            <p className={`mt-1 text-xs ${textoSecundario}`}>
              Estos alumnos tienen asignación docente, pero aún no aparece una empresa en su expediente.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {alumnosSinEmpresa.map((alumno) => (
              <button
                key={alumno.id_estudiante}
                type="button"
                onClick={() => abrirExpedienteAlumno(alumno)}
                className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition hover:border-blue-400 ${
                  d ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-blue-50/50"
                }`}
              >
                <AvatarEstudiante
                  estudiante={alumno}
                  className="h-9 w-9 rounded-full text-xs font-bold"
                  fallbackClassName={
                    d
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-100 text-slate-600"
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{alumno.nombre}</span>
                  <span className={`block truncate text-[11px] ${textoSecundario}`}>
                    {alumno.cargo} · {alumno.hrs} h
                  </span>
                </span>
                <ExternalLink size={14} className="shrink-0 text-blue-500" />
              </button>
            ))}
          </div>
        </section>
      )}

      <p className={`text-center text-[11px] ${textoSecundario}`}>
        {origenDatos === "api"
          ? "Información sincronizada con tus alumnos asignados."
          : "Mostrando la última información guardada en este dispositivo."}
      </p>
    </div>
  );
}