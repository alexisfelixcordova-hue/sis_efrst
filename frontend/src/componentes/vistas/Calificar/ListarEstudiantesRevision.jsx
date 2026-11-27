import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  UserRound,
  Clock3,
  CheckCircle2,
  CircleAlert,
  ChevronRight,
  RefreshCw,
  BookOpen,
  UserCheck,
  Building2,
} from "lucide-react";

import api, { getCachedData } from "../../../api/axios";
import {
  normalizarNombreModulo,
  useModuloSistema,
} from "../../../utils/moduloSistema";

export const LS_REVISION_ESTUDIANTES = "docente_calificar_estudiantes_v6";

export const CACHE_REVISION_MEM = {
  clave: "",
  estudiantes: null,
};

export const obtenerTokenRevision = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  sessionStorage.getItem("access_token") ||
  sessionStorage.getItem("token") ||
  "";

export const obtenerClaveSesionRevision = () => {
  const token = obtenerTokenRevision();
  let userId = "";
  try {
    const rawUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const u = parsed?.user || parsed?.usuario || parsed;
      userId = String(u?.id ?? u?.id_usuario ?? u?.correo ?? u?.email ?? "");
    }
  } catch {
    /* ignorar */
  }
  return `${userId}::${token.slice(-16)}`;
};

export const leerStorageRevision = (key, fallback = {}) => {
  try {
    const value =
      sessionStorage.getItem(key) ?? localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const guardarStorageRevision = (key, value) => {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
  } catch {
    /* ignorar */
  }
};

export const obtenerHeadersRevision = () => {
  const token = obtenerTokenRevision();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const extraerListaRevision = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of [
    "data",
    "alumnos",
    "estudiantes",
    "items",
    "registros",
    "expedientes",
    "evidencias",
  ]) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  if (payload.data && typeof payload.data === "object") {
    for (const key of [
      "data",
      "alumnos",
      "estudiantes",
      "items",
      "evidencias",
    ]) {
      if (Array.isArray(payload.data[key])) return payload.data[key];
    }
  }

  return [];
};

const formatearNombrePersona = (obj, fallback = "") => {
  if (!obj) return fallback;
  if (typeof obj === "string") return obj.trim() || fallback;
  const full =
    obj.nombre_completo ||
    [obj.nombres || obj.nombre, obj.apellidos].filter(Boolean).join(" ") ||
    obj.name ||
    "";
  return String(full).trim() || fallback;
};

const detectarNumeroMod = (raw, fallbackNum = 1) => {
  const directo = Number(raw?.numero_modulo ?? raw?.numero);
  if ([1, 2, 3].includes(directo)) return directo;
  const texto = String(
    raw?.nombre_modulo || raw?.modulo_nombre || raw?.modulo || ""
  ).toLowerCase();
  if (/\b(3|iii|3°)\b/i.test(texto)) return 3;
  if (/\b(2|ii|2°)\b/i.test(texto)) return 2;
  if (/\b(1|i|1°)\b/i.test(texto)) return 1;
  const idNum = Number(raw?.id_modulo ?? raw?.modulo_id);
  if ([1, 2, 3].includes(idNum)) return idNum;
  return [1, 2, 3].includes(fallbackNum) ? fallbackNum : 1;
};

const leerExpedienteLocalModulo = (idEstudiante, idModulo, numModulo) => {
  const claves = [
    `expediente_calificacion_${idEstudiante}_m${numModulo}`,
    `expediente_calificacion_${idEstudiante}_${idModulo}`,
    `expediente_efsrt_${idEstudiante}_${idModulo}`,
    `expediente_efsrt_${idEstudiante}_m${numModulo}`,
  ];
  for (const clave of claves) {
    const dato = leerStorageRevision(clave, null);
    if (dato && typeof dato === "object") return dato;
  }
  return null;
};

const construirModulosEstudiante = (item, estudiante, idEstudiante) => {
  const fuenteModulos = Array.isArray(item?.modulos)
    ? item.modulos
    : Array.isArray(estudiante?.modulos)
      ? estudiante.modulos
      : Array.isArray(item?.expedientes)
        ? item.expedientes
        : [];

  const mapaPorNum = new Map();

  fuenteModulos.forEach((m, idx) => {
    const num = detectarNumeroMod(m, idx + 1);
    const idModulo = m?.id_modulo ?? m?.modulo_id ?? m?.id ?? null;
    if (idModulo === null || idModulo === undefined || idModulo === "") return;
    const idExpediente = m?.id_expediente ?? m?.expediente_id ?? null;
    const expLocal = leerExpedienteLocalModulo(idEstudiante, idModulo, num);

    const docenteObj =
      m?.docente_asesor || m?.docente || m?.asesor || item?.docente || null;
    const docenteAsignado = formatearNombrePersona(
      docenteObj,
      m?.docente_nombre ||
        m?.docente_responsable ||
        m?.asesor_nombre ||
        expLocal?.docente_responsable ||
        expLocal?.docente_asignado ||
        item?.docente_nombre ||
        "Docente no asignado"
    );
    const idDocenteAsignado =
      m?.id_docente_asesor ??
      expLocal?.id_docente_asesor ??
      expLocal?.id_docente ??
      docenteObj?.id_usuario ??
      docenteObj?.id_docente ??
      docenteObj?.id ??
      null;

    const notaRaw =
      m?.nota !== undefined && m?.nota !== null
        ? Number(m.nota)
        : expLocal?.nota !== undefined && expLocal?.nota !== null
          ? Number(expLocal.nota)
          : null;

    const estadoMod = String(
      m?.estado_efsrt || m?.estado || expLocal?.estado_efsrt || ""
    ).toUpperCase();

    const adjuntadoMod = Boolean(
      m?.adjuntado_expediente ||
        m?.calificado ||
        m?.finalizado ||
        expLocal?.adjuntar_expediente ||
        ["CALIFICADO", "APROBADO", "CERRADO", "COMPLETADO", "VALIDADO", "VERIFICADO"].includes(
          estadoMod
        )
    );

    mapaPorNum.set(num, {
      id_modulo: idModulo,
      numero_modulo: num,
      id_expediente: idExpediente ?? expLocal?.id_expediente ?? null,
      nombre_modulo: normalizarNombreModulo(
        m?.nombre_modulo ||
          m?.modulo_nombre ||
          m?.modulo ||
          expLocal?.nombre_modulo ||
          "Nombre de módulo no disponible"
      ),
      docente_asignado: docenteAsignado,
      id_docente_asesor: idDocenteAsignado,
      empresa:
        m?.empresa?.razon_social ||
        m?.empresa_razon_social ||
        m?.empresa_nombre ||
        expLocal?.empresa_nombre ||
        expLocal?.empresa_institucion ||
        item?.empresa?.razon_social ||
        item?.empresa_razon_social ||
        item?.empresa_nombre ||
        estudiante?.empresa_razon_social ||
        estudiante?.empresa_nombre ||
        "Empresa no registrada",
      horas_acumuladas: Number(
        m?.horas_acumuladas ?? expLocal?.horas_acumuladas ?? item?.horas_acumuladas ?? 0
      ),
      horas_requeridas: Number(
        m?.horas_requeridas ?? expLocal?.horas_requeridas ?? item?.horas_requeridas ?? 160
      ),
      estado_portafolio:
        m?.estado_portafolio ||
        m?.portafolio_estado ||
        expLocal?.estado_portafolio ||
        item?.estado_portafolio ||
        "Pendiente de revisión",
      verificado_docente: Boolean(
        m?.verificado_docente ??
          expLocal?.verificado_docente ??
          ["VERIFICADO", "VALIDADO", "APROBADO"].includes(estadoMod)
      ),
      listo_para_constancia: Boolean(
        m?.listo_para_constancia ?? expLocal?.listo_para_constancia ?? false
      ),
      nota: notaRaw !== null && !Number.isNaN(notaRaw) ? notaRaw : null,
      comentario:
        m?.comentario ||
        m?.observacion ||
        expLocal?.comentario ||
        expLocal?.observacion ||
        "",
      adjuntado: adjuntadoMod,
    });
  });

  const tieneModuloPrincipal = [
    item?.id_modulo,
    item?.modulo_id,
    estudiante?.id_modulo,
  ].some((valor) => valor !== null && valor !== undefined && valor !== "");

  const numPrincipal = detectarNumeroMod(
    {
      numero_modulo: item?.numero_modulo ?? estudiante?.numero_modulo,
      id_modulo: item?.id_modulo ?? estudiante?.id_modulo,
      nombre_modulo:
        item?.modulo_nombre ||
        item?.nombre_modulo ||
        item?.modulo ||
        estudiante?.modulo_nombre,
    },
    1
  );

  if (tieneModuloPrincipal && !mapaPorNum.has(numPrincipal)) {
    const idModPrin = item?.id_modulo ?? item?.modulo_id ?? estudiante?.id_modulo;
    const expLocalPrin = leerExpedienteLocalModulo(
      idEstudiante,
      idModPrin,
      numPrincipal
    );
    const docObj = item?.docente_asesor || item?.docente || item?.asesor || null;
    const notaItem =
      item?.nota !== undefined && item?.nota !== null
        ? Number(item.nota)
        : expLocalPrin?.nota !== undefined && expLocalPrin?.nota !== null
          ? Number(expLocalPrin.nota)
          : null;
    const estadoItem = String(
      item?.estado || estudiante?.estado || expLocalPrin?.estado_efsrt || ""
    ).toUpperCase();

    mapaPorNum.set(numPrincipal, {
      id_modulo: idModPrin,
      numero_modulo: numPrincipal,
      id_expediente:
        item?.id_expediente ??
        item?.expediente_id ??
        estudiante?.id_expediente ??
        expLocalPrin?.id_expediente ??
        null,
      nombre_modulo: normalizarNombreModulo(
        item?.modulo_nombre ||
        item?.nombre_modulo ||
        item?.modulo ||
        estudiante?.modulo_nombre ||
        expLocalPrin?.nombre_modulo ||
        "Nombre de módulo no disponible"
      ),
      docente_asignado: formatearNombrePersona(
        docObj,
        item?.docente_nombre ||
          item?.docente_responsable ||
          item?.asesor_nombre ||
          expLocalPrin?.docente_responsable ||
          expLocalPrin?.docente_asignado ||
          "Docente asignado"
      ),
      id_docente_asesor:
        item?.id_docente_asesor ??
        expLocalPrin?.id_docente_asesor ??
        expLocalPrin?.id_docente ??
        docObj?.id_usuario ??
        docObj?.id_docente ??
        docObj?.id ??
        null,
      empresa:
        item?.empresa?.razon_social ||
        item?.empresa_razon_social ||
        item?.empresa_nombre ||
        expLocalPrin?.empresa_nombre ||
        expLocalPrin?.empresa_institucion ||
        estudiante?.empresa_razon_social ||
        estudiante?.empresa_nombre ||
        estudiante?.empresa ||
        "Empresa no registrada",
      horas_acumuladas: Number(
        item?.horas_acumuladas ??
          expLocalPrin?.horas_acumuladas ??
          estudiante?.horas_acumuladas ??
          0
      ),
      horas_requeridas: Number(
        item?.horas_requeridas ??
          expLocalPrin?.horas_requeridas ??
          estudiante?.horas_requeridas ??
          160
      ),
      estado_portafolio:
        item?.estado_portafolio ||
        expLocalPrin?.estado_portafolio ||
        estudiante?.estado_portafolio ||
        "Pendiente de revisión",
      verificado_docente: Boolean(
        item?.verificado_docente ??
          expLocalPrin?.verificado_docente ??
          ["VERIFICADO", "VALIDADO", "APROBADO"].includes(estadoItem)
      ),
      listo_para_constancia: Boolean(
        item?.listo_para_constancia ?? expLocalPrin?.listo_para_constancia ?? false
      ),
      nota: notaItem !== null && !Number.isNaN(notaItem) ? notaItem : null,
      comentario:
        item?.comentario ||
        item?.observacion ||
        expLocalPrin?.comentario ||
        expLocalPrin?.observacion ||
        "",
      adjuntado: Boolean(
        item?.adjuntado_expediente ||
          item?.calificado ||
          item?.finalizado ||
          expLocalPrin?.adjuntar_expediente ||
          ["CALIFICADO", "APROBADO", "CERRADO", "COMPLETADO", "VERIFICADO"].includes(
            estadoItem
          )
      ),
    });
  }

  return [...mapaPorNum.values()].sort(
    (a, b) => Number(a.numero_modulo) - Number(b.numero_modulo)
  );
};

export const normalizarAlumnoRevision = (item, index) => {
  const estudiante =
    item.estudiante && typeof item.estudiante === "object"
      ? item.estudiante
      : item;

  const idEstudiante =
    estudiante.id_estudiante ??
    estudiante.id ??
    item.id_estudiante ??
    item.id ??
    `alumno-${index + 1}`;

  const modulos = construirModulosEstudiante(item, estudiante, idEstudiante);
  const numInicial = detectarNumeroMod(
    {
      numero_modulo: item?.numero_modulo ?? estudiante?.numero_modulo,
      id_modulo: item?.id_modulo ?? estudiante?.id_modulo,
      nombre_modulo: item?.modulo_nombre || item?.nombre_modulo || item?.modulo,
    },
    1
  );
  const modActivo =
    modulos.find((m) => m.numero_modulo === numInicial) || modulos[0];

  const nombre =
    estudiante.nombre_completo ||
    (estudiante.apellidos
      ? `${estudiante.nombres || ""} ${estudiante.apellidos}`
      : estudiante.nombres) ||
    estudiante.name ||
    estudiante.nombre ||
    `Estudiante ${index + 1}`;

  const fotoCruda =
    estudiante.foto_url ||
    estudiante.fotografia ||
    estudiante.foto ||
    estudiante.imagen ||
    estudiante.avatar ||
    estudiante.foto_perfil ||
    "";
  const foto =
    fotoCruda && !/^(https?:|data:|blob:)/i.test(fotoCruda)
      ? `${String(api.defaults.baseURL || "").replace(/\/api\/?$/, "")}/${String(fotoCruda).replace(/^\/+/, "")}`
      : fotoCruda;

  const notaBase =
    item.nota !== undefined && item.nota !== null
      ? Number(item.nota)
      : modActivo?.nota ?? null;

  const estado = String(item.estado || estudiante.estado || "").toUpperCase();

  return {
    id: `${idEstudiante}`,
    estudianteId: idEstudiante,
    moduloId: modActivo?.id_modulo ?? null,
    numeroModuloInicial: modActivo?.numero_modulo ?? null,
    idExpediente: modActivo?.id_expediente ?? null,
    modulos,
    nombre: String(nombre).trim(),
    dni: String(
      estudiante.dni || estudiante.documento || estudiante.codigo || "Sin DNI"
    ),
    correo: estudiante.email || estudiante.correo || "",
    telefono: estudiante.telefono || "",
    carrera:
      estudiante.carrera_nombre ||
      estudiante.carrera ||
      estudiante.programa_estudios ||
      "Programa de estudios",
    modulo: modActivo?.nombre_modulo || "Sin módulo asignado",
    docenteAsignado: modActivo?.docente_asignado || "Docente no asignado",
    empresa: modActivo?.empresa || "Empresa no registrada",
    horasAcumuladas: modActivo?.horas_acumuladas ?? 0,
    horasRequeridas: modActivo?.horas_requeridas ?? 160,
    estadoPortafolio: modActivo?.estado_portafolio || "Pendiente de revisión",
    foto,
    expediente:
      item.codigo_expediente ||
      item.numero_expediente ||
      item.codigo ||
      `EXP-${String(index + 1).padStart(3, "0")}`,
    nota: notaBase !== null && !Number.isNaN(notaBase) ? notaBase : null,
    comentario: item.comentario || item.observacion || modActivo?.comentario || "",
    adjuntado: Boolean(
      item.adjuntado_expediente ||
        item.calificado ||
        item.finalizado ||
        ["CALIFICADO", "APROBADO", "CERRADO", "COMPLETADO"].includes(estado) ||
        modActivo?.adjuntado
    ),
  };
};

export const agruparAlumnosRevision = (estudiantes = []) => {
  const agrupados = new Map();
  estudiantes.forEach((estudiante) => {
    const clave = String(estudiante.estudianteId ?? estudiante.id);
    const anterior = agrupados.get(clave);
    if (!anterior) {
      agrupados.set(clave, { ...estudiante, modulos: [...estudiante.modulos] });
      return;
    }

    const modulos = [...anterior.modulos];
    estudiante.modulos.forEach((modulo) => {
      if (
        !modulos.some(
          (existente) =>
            String(existente.id_modulo) === String(modulo.id_modulo)
        )
      ) {
        modulos.push(modulo);
      }
    });
    agrupados.set(clave, { ...anterior, ...estudiante, modulos });
  });

  return [...agrupados.values()].map((estudiante) => {
    const modulos = [...estudiante.modulos].sort(
      (a, b) => Number(a.numero_modulo) - Number(b.numero_modulo)
    );
    const moduloInicial = modulos[0];
    return {
      ...estudiante,
      modulos,
      moduloId: moduloInicial?.id_modulo ?? null,
      numeroModuloInicial: moduloInicial?.numero_modulo ?? null,
      idExpediente: moduloInicial?.id_expediente ?? null,
      modulo: moduloInicial?.nombre_modulo || "Sin módulo asignado",
      docenteAsignado: moduloInicial?.docente_asignado || "Docente no asignado",
      empresa: moduloInicial?.empresa || "Empresa no registrada",
      horasAcumuladas: moduloInicial?.horas_acumuladas ?? 0,
      horasRequeridas: moduloInicial?.horas_requeridas ?? 160,
      estadoPortafolio:
        moduloInicial?.estado_portafolio || "Pendiente de revisión",
      nota: moduloInicial?.nota ?? null,
      comentario: moduloInicial?.comentario || "",
      adjuntado: Boolean(moduloInicial?.adjuntado),
    };
  });
};

export const inicialesRevision = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || "")
    .join("");

export function AvatarRevision({ estudiante, grande = false }) {
  const [errorImagen, setErrorImagen] = useState(false);

  useEffect(() => {
    setErrorImagen(false);
  }, [estudiante?.foto]);

  const dimensiones = grande ? "h-24 w-24 text-2xl" : "h-12 w-12 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-100 font-bold text-blue-700 ${dimensiones}`}
    >
      {estudiante?.foto && !errorImagen ? (
        <img
          src={estudiante.foto}
          alt={estudiante.nombre}
          className="h-full w-full object-cover"
          onError={() => setErrorImagen(true)}
        />
      ) : (
        <span>{inicialesRevision(estudiante?.nombre || "ES")}</span>
      )}
    </div>
  );
}

export function EstadoEtiquetaRevision({ estado }) {
  const estilos = {
    Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
    "En revisión": "bg-blue-50 text-blue-700 border-blue-200",
    Aprobado: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Observado: "bg-rose-50 text-rose-700 border-rose-200",
    Completado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        estilos[estado] || estilos.Pendiente
      }`}
    >
      {estado || "Pendiente"}
    </span>
  );
}

export const inputRevisionClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function ListaEstudiantesRevision({
  estudiantes,
  setEstudiantes,
  onSeleccionarEstudiante,
  setVista,
  darkMode = false,
  avisoExterno = null,
}) {
  const claveSesion = useMemo(() => obtenerClaveSesionRevision(), []);
  const moduloSistema = useModuloSistema();

  const [cargando, setCargando] = useState(
    () => !Array.isArray(estudiantes) || estudiantes.length === 0
  );
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [avisoLocal, setAvisoLocal] = useState(null);

  const surface = darkMode
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-200 bg-white text-slate-800";
  const muted = darkMode ? "text-slate-400" : "text-slate-500";
  const fondo = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-[#f6f8fc] text-slate-800";

  const aviso = avisoExterno || avisoLocal;

  const mostrarAviso = (tipo, mensaje) => {
    setAvisoLocal({ tipo, mensaje });
    window.setTimeout(() => setAvisoLocal(null), 4000);
  };

  const estudiantesPorModulo = useMemo(() => {
    const base = Array.isArray(estudiantes) ? estudiantes : [];
    if (!moduloSistema?.id_modulo) return base;

    return base.flatMap((estudiante) => {
      const modulo = estudiante.modulos.find(
        (item) =>
          String(item.id_modulo) === String(moduloSistema.id_modulo)
      );
      if (!modulo) return [];

      return [
        {
          ...estudiante,
          moduloId: modulo.id_modulo,
          numeroModuloInicial: modulo.numero_modulo,
          idExpediente: modulo.id_expediente,
          modulo: modulo.nombre_modulo,
          docenteAsignado: modulo.docente_asignado,
          empresa: modulo.empresa,
          horasAcumuladas: modulo.horas_acumuladas,
          horasRequeridas: modulo.horas_requeridas,
          estadoPortafolio: modulo.estado_portafolio,
          nota: modulo.nota,
          comentario: modulo.comentario,
          adjuntado: Boolean(modulo.adjuntado),
        },
      ];
    });
  }, [estudiantes, moduloSistema]);

  const cargarEstudiantes = useCallback(
    async ({ forzarSpinner = false } = {}) => {
      const claveActual = obtenerClaveSesionRevision();
      const sKey = `${LS_REVISION_ESTUDIANTES}_${claveActual}`;
      const cached =
        CACHE_REVISION_MEM.clave === claveActual &&
        Array.isArray(CACHE_REVISION_MEM.estudiantes)
          ? CACHE_REVISION_MEM.estudiantes
          : leerStorageRevision(sKey, null);

      if (Array.isArray(cached) && !forzarSpinner) {
        setEstudiantes(cached);
        setCargando(false);
      } else if (forzarSpinner || !Array.isArray(cached)) {
        setCargando(true);
      }

      try {
        const respuesta = await api.get("/mis-alumnos", {
          headers: obtenerHeadersRevision(),
        });

        const filas = extraerListaRevision(respuesta?.data);
        const normalizados = filas.map(normalizarAlumnoRevision);
        const validos = normalizados.filter(
          (estudiante) => estudiante.modulos.length > 0
        );
        const lista = agruparAlumnosRevision(validos);

        CACHE_REVISION_MEM.clave = claveActual;
        CACHE_REVISION_MEM.estudiantes = lista;
        setEstudiantes(lista);
        guardarStorageRevision(sKey, lista);
        if (validos.length < normalizados.length) {
          mostrarAviso(
            "error",
            "Hay asignaciones sin módulo asociado. No se pueden calificar hasta corregirlas."
          );
        }
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
        const guardados = leerStorageRevision(sKey, []);
        setEstudiantes(Array.isArray(guardados) ? guardados : []);
        if (!Array.isArray(cached)) {
          mostrarAviso(
            "error",
            "No se pudo actualizar la lista de estudiantes. Se mostrarán los datos guardados."
          );
        }
      } finally {
        setCargando(false);
      }
    },
    [setEstudiantes]
  );

  useEffect(() => {
    const cache = getCachedData("/mis-alumnos", {});
    if (cache) {
      const lista = agruparAlumnosRevision(
        extraerListaRevision(cache)
          .map(normalizarAlumnoRevision)
          .filter((estudiante) => estudiante.modulos.length > 0)
      );
      CACHE_REVISION_MEM.clave = claveSesion;
      CACHE_REVISION_MEM.estudiantes = lista;
      setEstudiantes(lista);
      setCargando(false);
      cargarEstudiantes({ forzarSpinner: false });
    } else {
      cargarEstudiantes({ forzarSpinner: false });
    }
  }, [claveSesion, setEstudiantes, cargarEstudiantes]);

  const estudiantesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return estudiantesPorModulo.filter((estudiante) => {
      const moduloActivo =
        estudiante.modulos.find(
          (modulo) =>
            String(modulo.id_modulo) === String(moduloSistema?.id_modulo)
        ) || estudiante.modulos[0];
      const coincideTexto =
        !texto ||
        estudiante.nombre.toLowerCase().includes(texto) ||
        estudiante.dni.toLowerCase().includes(texto) ||
        (moduloActivo?.nombre_modulo || estudiante.modulo)
          .toLowerCase()
          .includes(texto) ||
        estudiante.empresa.toLowerCase().includes(texto) ||
        estudiante.docenteAsignado.toLowerCase().includes(texto) ||
        estudiante.expediente.toLowerCase().includes(texto);

      const coincideFiltro =
        filtro === "Todos" ||
        (filtro === "Pendientes" && !estudiante.adjuntado) ||
        (filtro === "Calificados" && estudiante.adjuntado);

      const coincideModulo =
        !moduloSistema?.id_modulo ||
        estudiante.modulos.some(
          (modulo) =>
            String(modulo.id_modulo) === String(moduloSistema.id_modulo)
        );

      return coincideTexto && coincideFiltro && coincideModulo;
    });
  }, [estudiantesPorModulo, busqueda, filtro, moduloSistema]);

  return (
    <div className={`min-h-full w-full ${fondo}`}>
      <div className="w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Estudiantes a revisión
            </h1>

            <p className={`mt-1 text-sm ${muted}`}>
              Selecciona un estudiante para revisar sus módulos, centro de prácticas, horas, portafolio y calificarlo en su expediente.
            </p>
            {moduloSistema?.nombre_modulo && (
              <p className="mt-1 text-xs font-semibold text-blue-600">
                Módulo activo: {moduloSistema.nombre_modulo}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cargarEstudiantes({ forzarSpinner: true })}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw
                size={16}
                className={cargando ? "animate-spin" : ""}
              />
              Actualizar
            </button>

            {setVista && (
              <button
                type="button"
                onClick={() => setVista("Dashboard")}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Volver al inicio
              </button>
            )}
          </div>
        </div>

        {aviso && (
          <div
            className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
              aviso.tipo === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {aviso.tipo === "ok" ? (
              <CheckCircle2 size={18} />
            ) : (
              <CircleAlert size={18} />
            )}
            {aviso.mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Estudiantes a revisión",
              valor: estudiantesPorModulo.length,
              icono: UserRound,
              color: "blue",
            },
            {
              label: "Evaluaciones pendientes",
              valor: estudiantesPorModulo.filter((e) => !e.adjuntado).length,
              icono: Clock3,
              color: "amber",
            },
            {
              label: "Evaluaciones registradas",
              valor: estudiantesPorModulo.filter((e) => e.adjuntado).length,
              icono: CheckCircle2,
              color: "emerald",
            },
          ].map((item) => {
            const Icono = item.icono;

            return (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm ${surface}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${muted}`}>{item.label}</p>
                    <p className="mt-2 text-3xl font-extrabold">
                      {item.valor}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl p-3 ${
                      item.color === "blue"
                        ? "bg-blue-50 text-blue-600"
                        : item.color === "amber"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <Icono size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section
          className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}
        >
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-bold">Estudiantes asignados</h2>
                <p className={`mt-1 text-xs ${muted}`}>
                  Haz clic en un estudiante para abrir su revisión por módulo y adjuntar calificación/evidencias al expediente.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar estudiante, DNI, empresa o docente..."
                    className={`${inputRevisionClass} pl-9 sm:w-64`}
                  />
                </div>

                <select
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className={inputRevisionClass}
                >
                  <option>Todos</option>
                  <option>Pendientes</option>
                  <option>Calificados</option>
                </select>
              </div>
            </div>
          </div>

          {cargando && estudiantes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="animate-spin text-blue-600" size={28} />
              <p className={`mt-3 text-sm ${muted}`}>
                Cargando estudiantes...
              </p>
            </div>
          ) : estudiantesFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <UserRound className="mx-auto text-slate-300" size={40} />
              <h3 className="mt-3 font-bold">
                No se encontraron estudiantes
              </h3>
              <p className={`mt-1 text-sm ${muted}`}>
                Comprueba los filtros o actualiza la información.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {estudiantesFiltrados.map((estudiante) => {
                const moduloVisible =
                  estudiante.modulos.find(
                    (modulo) =>
                      String(modulo.id_modulo) ===
                      String(moduloSistema?.id_modulo)
                  ) || estudiante.modulos[0];
                return (
                  <button
                    key={estudiante.id}
                    type="button"
                    onClick={() => onSeleccionarEstudiante(estudiante)}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5"
                  >
                  <div className="flex items-start gap-3">
                    <AvatarRevision estudiante={estudiante} />

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-slate-800">
                        {estudiante.nombre}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        DNI: {estudiante.dni}
                      </p>
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                        <BookOpen size={12} className="shrink-0 text-blue-600" />
                        {moduloVisible?.nombre_modulo || estudiante.modulo}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
                        <Building2 size={12} className="shrink-0 text-indigo-600" />
                        {estudiante.empresa}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400">
                        <UserCheck size={12} className="shrink-0 text-emerald-600" />
                        Docente: {moduloVisible?.docente_asignado || estudiante.docenteAsignado}
                      </p>
                    </div>

                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(estudiante.modulos || []).map((m) => (
                      <span
                        key={m.numero_modulo}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          m.adjuntado
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                        title={`${m.nombre_modulo} · Empresa: ${m.empresa} · Docente: ${m.docente_asignado}`}
                      >
                        <span className="inline-block max-w-[220px] truncate align-bottom">
                          {m.nombre_modulo}
                        </span>
                        : {m.adjuntado ? "Calificado" : "Pendiente"}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">
                      {estudiante.expediente}
                    </span>
                    <EstadoEtiquetaRevision
                      estado={
                        moduloVisible?.adjuntado ? "Completado" : "Pendiente"
                      }
                    />
                  </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}