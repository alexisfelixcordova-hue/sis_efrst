import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ClipboardCheck,
  CheckCircle2,
  Users,
  FileText,
  MessageSquare,
  Upload,
  Paperclip,
  Building2,
  Briefcase,
  Eye,
  Trash2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Image as ImageIcon,
  CheckSquare,
  Square,
  RefreshCcw,
  Layers,
  Award,
  Sparkles,
} from "lucide-react";

import {
  tema,
  foco,
  Cabecera,
} from "../Docente/componentes/DocenteComun.jsx";
import api from "../../../api/axios.js";
import AvatarEstudiante from "../../AvatarEstudiante.jsx";

const TIPOS = [
  {
    id: "Bitácora semanal",
    corto: "Bitácora",
    ayuda: "Registro semanal de las actividades realizadas en prácticas.",
  },
  {
    id: "Informe parcial",
    corto: "Parcial",
    ayuda: "Avance técnico y entregables a mitad del módulo EFSRT.",
  },
  {
    id: "Informe final",
    corto: "Final",
    ayuda: "Cierre integral del módulo, horas y resultados obtenidos.",
  },
];

const ESTADOS_REVISION = ["Por revisar", "Observada", "Conforme"];

const COLOR_ESTADO = {
  "Sin registrar": "#94a3b8",
  "Por revisar": "#2563eb",
  Observada: "#f59e0b",
  Conforme: "#10b981",
};

const CACHE_ALUMNOS_MEM = {
  clave: "",
  lista: null,
};

const obtenerTokenActual = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  sessionStorage.getItem("access_token") ||
  sessionStorage.getItem("token") ||
  "";

const obtenerClaveSesion = () => {
  const token = obtenerTokenActual();
  let userId = "";
  try {
    const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
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

const leerStorage = (clave, inicial) => {
  try {
    const datos = sessionStorage.getItem(clave) ?? localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : inicial;
  } catch {
    return inicial;
  }
};

const guardarStorage = (clave, valor) => {
  try {
    const serialized = JSON.stringify(valor);
    sessionStorage.setItem(clave, serialized);
    localStorage.setItem(clave, serialized);
  } catch {
    /* ignorar error de storage */
  }
};

const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.alumnos)) return payload.alumnos;
  if (Array.isArray(payload?.estudiantes)) return payload.estudiantes;
  if (Array.isArray(payload?.evidencias)) return payload.evidencias;
  return [];
};

const limpiarModulo = (txt = "") =>
  String(txt || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bpalicaciones\b/gi, "Aplicaciones")
    .replace(/\bmoviles\b/gi, "Móviles")
    .replace(/\bintegracion\b/gi, "Integración");

const canonModulo = (txt = "") =>
  limpiarModulo(txt)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizarRegistro = (item = {}, idx = 0) => {
  const est = item.estudiante || item.alumno || item;
  const nombres = est.nombres || item.nombres || "";
  const apellidos = est.apellidos || item.apellidos || "";
  const nombreCompleto = apellidos
    ? `${apellidos}, ${nombres}`.trim()
    : (nombres || est.nombre || est.name || `Alumno ${idx + 1}`).trim();

  const idEst = est.id_estudiante ?? est.id ?? item.id_estudiante ?? item.id ?? idx + 1;
  const idExp =
    item.id_expediente ??
    item.expediente_id ??
    est.id_expediente ??
    est.expediente_id ??
    null;
  const dni = String(est.dni || item.dni || "").trim();

  const moduloNombre =
    limpiarModulo(
      item.modulo_nombre ||
        item.nombre_modulo ||
        item.modulo?.nombre ||
        item.modulo?.nombre_modulo ||
        item.modulo ||
        "Módulo EFSRT"
    ) || "Módulo EFSRT";

  const idModulo =
    item.id_modulo ?? item.modulo_id ?? item.modulo?.id_modulo ?? item.modulo?.id ?? null;

  return {
    ...est,
    ...item,
    id: idEst,
    id_estudiante: idEst,
    id_expediente: idExp,
    id_modulo: idModulo,
    modulo_nombre: moduloNombre,
    dni,
    nombre: nombreCompleto,
    entidad:
      item.entidad_nombre ||
      item.entidad ||
      item.empresa?.razon_social ||
      est.entidad_nombre ||
      est.entidad ||
      moduloNombre,
    proyecto:
      item.proyecto_titulo ||
      item.proyecto ||
      est.proyecto_titulo ||
      est.proyecto ||
      moduloNombre ||
      item.programa_estudios ||
      "Prácticas EFSRT",
    estado: item.estado || est.estado || "En progreso",
  };
};

const claveAlumno = (a) => {
  const dni = String(a?.dni || "").trim();
  if (dni && dni !== "S/N" && !dni.startsWith("SIN-DNI")) return `dni:${dni}`;
  return `id:${String(a?.id_estudiante ?? a?.id ?? "")}`;
};

const esImagen = (nombre = "", tipoMime = "") => {
  if (String(tipoMime).startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(String(nombre));
};

const normalizarEstadoRevision = (val) => {
  const s = String(val || "").toLowerCase();
  if (s.includes("conform") || s.includes("aprob") || s === "validado") return "Conforme";
  if (s.includes("observ") || s.includes("rechaz")) return "Observada";
  return "Por revisar";
};

const formatoPeso = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function EvaluacionEvidencias({
  darkMode,
  setVista,
  onAbrirExpediente,
  estudianteSeleccionado = null,
}) {
  const d = !!darkMode;
  const t = tema(d);

  const claveSesion = useMemo(() => obtenerClaveSesion(), []);
  const storageAlumnosKey = `ev_efsrt_alumnos_${claveSesion}`;
  const storageEvalsKey = `ev_efsrt_evals_${claveSesion}`;

  const cacheInicialAlumnos = useMemo(() => {
    if (CACHE_ALUMNOS_MEM.clave === claveSesion && Array.isArray(CACHE_ALUMNOS_MEM.lista)) {
      return CACHE_ALUMNOS_MEM.lista;
    }
    return leerStorage(storageAlumnosKey, null);
  }, [claveSesion, storageAlumnosKey]);

  const [registros, setRegistros] = useState(() => cacheInicialAlumnos ?? []);
  const [modulosCatalogo, setModulosCatalogo] = useState([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(() => !cacheInicialAlumnos);
  const [errorAlumnos, setErrorAlumnos] = useState("");
  const [cargandoEvidenciasBD, setCargandoEvidenciasBD] = useState(false);

  const [evals, setEvals] = useState(() => leerStorage(storageEvalsKey, {}));
  const [archivos, setArchivos] = useState({});

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [selAlumnoKey, setSelAlumnoKey] = useState(null);
  const [selModuloKey, setSelModuloKey] = useState("");
  const [tipoIdx, setTipoIdx] = useState(0);
  const [borradores, setBorradores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const headersAuth = useCallback(() => {
    const token = obtenerTokenActual();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const estudiantesUnicos = useMemo(() => {
    const mapa = new Map();

    registros.forEach((item, idx) => {
      const reg = normalizarRegistro(item, idx);
      const aKey = claveAlumno(reg);
      const modKey = canonModulo(reg.modulo_nombre) || `mod-${idx}`;

      const infoModulo = {
        key: modKey,
        id_modulo: reg.id_modulo,
        id_expediente: reg.id_expediente,
        nombre: reg.modulo_nombre,
        entidad: reg.entidad,
        proyecto: reg.proyecto,
        raw: reg,
      };

      if (!mapa.has(aKey)) {
        mapa.set(aKey, {
          ...reg,
          alumnoKey: aKey,
          modulosMap: new Map([[modKey, infoModulo]]),
        });
      } else {
        const actual = mapa.get(aKey);
        if (!actual.modulosMap.has(modKey)) {
          actual.modulosMap.set(modKey, infoModulo);
        }
      }
    });

    return Array.from(mapa.values()).map((est) => {
      const modulosActuales = Array.from(est.modulosMap.values());
      if (modulosActuales.length === 1 && modulosCatalogo.length > 0) {
        modulosCatalogo.forEach((mc, mIdx) => {
          const nom = limpiarModulo(mc.nombre || mc.nombre_modulo || "");
          const mKey = canonModulo(nom);
          if (nom && mKey && !est.modulosMap.has(mKey)) {
            est.modulosMap.set(mKey, {
              key: mKey,
              id_modulo: mc.id_modulo ?? mc.id ?? mIdx + 1,
              id_expediente: est.id_expediente,
              nombre: nom,
              entidad: est.entidad,
              proyecto: nom,
              raw: est,
              esCatalogoExtra: true,
            });
          }
        });
      }
      return {
        ...est,
        modulos: Array.from(est.modulosMap.values()),
      };
    });
  }, [registros, modulosCatalogo]);

  const cargarEvidenciasAlumnoBD = useCallback(
    async (alumno) => {
      if (!alumno) return;
      const aKey = claveAlumno(alumno);
      const refId = alumno.id_estudiante ?? alumno.id;
      if (!refId) return;

      setCargandoEvidenciasBD(true);
      try {
        const params = {
          id_estudiante: refId,
          ...(alumno.id_expediente ? { id_expediente: alumno.id_expediente } : {}),
          ...(alumno.dni ? { dni: alumno.dni } : {}),
        };

        const endpoints = [
          "/evidencias-efsrt",
          `/expediente-efsrt/${refId}/evidencias`,
          `/alumnos/${refId}/evidencias-efsrt`,
        ];

        let filasEv = [];
        for (const ep of endpoints) {
          try {
            const res = await api.get(ep, { params, headers: headersAuth() });
            const lista = extraerLista(res.data);
            if (lista.length > 0 || Array.isArray(res.data?.data)) {
              filasEv = lista;
              break;
            }
          } catch {
            /* probar siguiente endpoint */
          }
        }

        if (filasEv.length > 0) {
          setEvals((prev) => {
            const next = { ...prev };
            for (const row of filasEv) {
              const tipoRaw = String(
                row.tipo_evidencia ?? row.tipo ?? row.categoria ?? row.nombre_evidencia ?? ""
              ).toLowerCase();

              const tipoMatch =
                TIPOS.find((tObj) => tipoRaw.includes(tObj.id.toLowerCase().split(" ")[0])) ||
                TIPOS.find((tObj) => tipoRaw.includes(tObj.id.toLowerCase())) ||
                TIPOS[0];

              const modRowKey =
                canonModulo(row.modulo_nombre || row.nombre_modulo || "") ||
                alumno.modulos?.[0]?.key ||
                "general";

              const estadoRev = normalizarEstadoRevision(
                row.estado_revision ?? row.estado ?? (row.revisado ? "Conforme" : "Por revisar")
              );

              const archivosAdjuntos = Array.isArray(row.archivos)
                ? row.archivos.map((f, idx) =>
                    typeof f === "string"
                      ? {
                          id: `bd-${row.id ?? idx}-${idx}`,
                          name: f.split("/").pop() || `evidencia_${idx + 1}`,
                          url: f,
                          size: 0,
                          esFoto: esImagen(f),
                          seleccionada: row.seleccionada ?? row.revisada ?? true,
                          desdeBD: true,
                        }
                      : {
                          id: f.id ?? `bd-${row.id ?? idx}-${idx}`,
                          name: f.nombre_archivo || f.name || f.nombre || `evidencia_${idx + 1}`,
                          url: f.url || f.ruta || f.path || "",
                          size: Number(f.tamano || f.size || 0),
                          esFoto: esImagen(
                            f.nombre_archivo || f.name || f.url || "",
                            f.mime_type || f.type
                          ),
                          seleccionada: f.seleccionada ?? f.revisada ?? true,
                          desdeBD: true,
                        }
                  )
                : row.archivo || row.url || row.ruta
                  ? [
                      {
                        id: `bd-${row.id ?? 0}`,
                        name:
                          row.nombre_archivo ||
                          String(row.archivo || row.url || row.ruta).split("/").pop() ||
                          "evidencia",
                        url: row.url || row.archivo || row.ruta,
                        size: Number(row.tamano || row.size || 0),
                        esFoto: esImagen(
                          row.nombre_archivo || row.archivo || row.url || "",
                          row.mime_type || ""
                        ),
                        seleccionada: row.seleccionada ?? row.revisada ?? true,
                        desdeBD: true,
                      },
                    ]
                  : [];

              const claveItem = `${aKey}|${modRowKey}|${tipoMatch.id}`;
              const existente = next[claveItem];
              const combinados = [
                ...(existente?.archivosBD || []),
                ...archivosAdjuntos.filter(
                  (aNew) =>
                    !(existente?.archivosBD || []).some(
                      (aOld) => aOld.name === aNew.name && aOld.url === aNew.url
                    )
                ),
              ];

              next[claveItem] = {
                id_evidencia: row.id_evidencia ?? row.id ?? existente?.id_evidencia ?? null,
                id_expediente:
                  row.id_expediente ?? alumno.id_expediente ?? existente?.id_expediente ?? null,
                id_estudiante: refId,
                dni: alumno.dni,
                modulo_key: modRowKey,
                tipo: tipoMatch.id,
                comentario: row.comentario ?? row.observacion ?? existente?.comentario ?? "",
                calificacion:
                  row.calificacion ?? row.nota ?? existente?.calificacion ?? "",
                estado: estadoRev,
                revisado: Boolean(row.revisado ?? estadoRev === "Conforme"),
                fecha:
                  String(row.fecha_actualizacion || row.updated_at || row.fecha || "").slice(0, 10) ||
                  existente?.fecha ||
                  new Date().toLocaleDateString("es-PE"),
                archivosBD: combinados,
                cantidadArchivos: combinados.length,
                nombresArchivos: combinados.map((x) => x.name),
              };
            }
            guardarStorage(`ev_efsrt_evals_${obtenerClaveSesion()}`, next);
            return next;
          });
        }
      } finally {
        setCargandoEvidenciasBD(false);
      }
    },
    [headersAuth]
  );

  const sincronizarAlumnos = useCallback(
    async ({ forzarSpinner = false } = {}) => {
      const claveActual = obtenerClaveSesion();
      const sKey = `ev_efsrt_alumnos_${claveActual}`;
      const cached =
        CACHE_ALUMNOS_MEM.clave === claveActual && Array.isArray(CACHE_ALUMNOS_MEM.lista)
          ? CACHE_ALUMNOS_MEM.lista
          : leerStorage(sKey, null);

      if (Array.isArray(cached) && !forzarSpinner) {
        setRegistros(cached);
        setCargandoAlumnos(false);
      } else if (forzarSpinner || !Array.isArray(cached)) {
        setCargandoAlumnos(true);
      }

      setErrorAlumnos("");

      try {
        const [resAlumnos, resModulos] = await Promise.all([
          api.get("/mis-alumnos", { headers: headersAuth() }),
          api.get("/modulos-profesionales", { params: { per_page: 100 } }).catch(() => ({ data: [] })),
        ]);
        const lista = extraerLista(resAlumnos.data).map(normalizarRegistro);
        const listaMods = extraerLista(resModulos.data);
        CACHE_ALUMNOS_MEM.clave = claveActual;
        CACHE_ALUMNOS_MEM.lista = lista;
        setRegistros(lista);
        setModulosCatalogo(listaMods);
        guardarStorage(sKey, lista);
      } catch (err) {
        console.error("Error al cargar alumnos asignados:", err);
        const respaldo = leerStorage(sKey, null);
        if (Array.isArray(respaldo)) {
          setRegistros(respaldo);
        } else {
          setRegistros([]);
          setErrorAlumnos("No se pudieron cargar tus alumnos asignados.");
        }
      } finally {
        setCargandoAlumnos(false);
      }
    },
    [headersAuth]
  );

  useEffect(() => {
    setEvals(leerStorage(storageEvalsKey, {}));
    sincronizarAlumnos({ forzarSpinner: false });
  }, [claveSesion, storageEvalsKey, sincronizarAlumnos]);

  useEffect(() => {
    guardarStorage(storageEvalsKey, evals);
  }, [evals, storageEvalsKey]);

  const claveEv = (aKey, modKey, tipoId) => `${aKey}|${modKey || "general"}|${tipoId}`;

  const registrada = (aKey, modKey, tipoId) => {
    const reg = evals[claveEv(aKey, modKey, tipoId)];
    return Boolean(
      reg &&
        ((reg.archivosBD && reg.archivosBD.length > 0) ||
          (reg.cantidadArchivos && reg.cantidadArchivos > 0) ||
          (reg.nombresArchivos && reg.nombresArchivos.length > 0) ||
          reg.id_evidencia)
    );
  };

  const estadoEv = (aKey, modKey, tipoId) => {
    const reg = evals[claveEv(aKey, modKey, tipoId)];
    if (!reg) return "Sin registrar";
    return reg.estado || "Por revisar";
  };

  const nRegistradasModulo = (aKey, modKey) =>
    TIPOS.filter((tObj) => registrada(aKey, modKey, tObj.id)).length;

  const nRegistradasAlumno = (est) => {
    const mods = est.modulos?.filter((m) => !m.esCatalogoExtra) || [];
    const objetivoMods = mods.length ? mods : est.modulos?.slice(0, 1) || [];
    return objetivoMods.reduce(
      (acc, m) => acc + nRegistradasModulo(est.alumnoKey, m.key),
      0
    );
  };

  const maxEvidenciasAlumno = (est) => {
    const mods = est.modulos?.filter((m) => !m.esCatalogoExtra) || [];
    const countMods = mods.length ? mods.length : 1;
    return countMods * TIPOS.length;
  };

  const incompletos = estudiantesUnicos.filter(
    (est) => nRegistradasAlumno(est) < maxEvidenciasAlumno(est)
  ).length;

  const visibles = estudiantesUnicos.filter((est) => {
    const n = nRegistradasAlumno(est);
    const totalMax = maxEvidenciasAlumno(est);
    const coincideFiltro =
      filtro === "Todos" ||
      (filtro === "Pendientes" && n < totalMax) ||
      (filtro === "Completos" && n === totalMax);

    const nombresMods = est.modulos.map((m) => m.nombre).join(" ");
    const coincideBusqueda = `${est.nombre} ${est.dni} ${est.entidad} ${nombresMods}`
      .toLowerCase()
      .includes(q.toLowerCase());

    return coincideFiltro && coincideBusqueda;
  });

  useEffect(() => {
    if (estudiantesUnicos.length === 0) return;

    if (estudianteSeleccionado) {
      const norm = normalizarRegistro(estudianteSeleccionado);
      const refKey = claveAlumno(norm);
      const coincidente = estudiantesUnicos.find((est) => est.alumnoKey === refKey);
      if (coincidente) {
        setFiltro("Todos");
        setSelAlumnoKey(coincidente.alumnoKey);
        const modSugerido = canonModulo(norm.modulo_nombre);
        const modExiste = coincidente.modulos.some((m) => m.key === modSugerido);
        setSelModuloKey(modExiste ? modSugerido : coincidente.modulos[0]?.key || "");
        setTipoIdx(0);
        cargarEvidenciasAlumnoBD(coincidente);
        return;
      }
    }

    if (!selAlumnoKey) {
      const primero = estudiantesUnicos[0];
      setSelAlumnoKey(primero.alumnoKey);
      setSelModuloKey(primero.modulos[0]?.key || "");
      setTipoIdx(0);
      cargarEvidenciasAlumnoBD(primero);
    }
  }, [estudianteSeleccionado, estudiantesUnicos, selAlumnoKey, cargarEvidenciasAlumnoBD]);

  const alumnoActual =
    estudiantesUnicos.find((est) => est.alumnoKey === selAlumnoKey) || null;

  const moduloActual = useMemo(() => {
    if (!alumnoActual?.modulos?.length) return null;
    return (
      alumnoActual.modulos.find((m) => m.key === selModuloKey) ||
      alumnoActual.modulos[0]
    );
  }, [alumnoActual, selModuloKey]);

  useEffect(() => {
    if (moduloActual && moduloActual.key !== selModuloKey) {
      setSelModuloKey(moduloActual.key);
    }
  }, [moduloActual, selModuloKey]);

  const tipoActualObj = TIPOS[tipoIdx] || TIPOS[0];
  const tipoActual = tipoActualObj.id;

  const claveActual =
    alumnoActual && moduloActual
      ? claveEv(alumnoActual.alumnoKey, moduloActual.key, tipoActual)
      : null;

  const guardada = claveActual ? evals[claveActual] : null;

  const bor = (claveActual && borradores[claveActual]) || {
    comentario: guardada?.comentario || "",
    estado: guardada?.estado || "Por revisar",
    calificacion: guardada?.calificacion ?? "",
  };

  const setBor = (cambio) =>
    claveActual &&
    setBorradores((prev) => ({
      ...prev,
      [claveActual]: { ...bor, ...cambio },
    }));

  const archivosNuevos = claveActual ? archivos[claveActual] || [] : [];
  const archivosBDActuales = guardada?.archivosBD || [];

  const archivosSeleccionadosCount = useMemo(() => {
    const bdSel = archivosBDActuales.filter((x) => x.seleccionada !== false).length;
    const newSel = archivosNuevos.filter((x) => x.seleccionada !== false).length;
    return bdSel + newSel;
  }, [archivosBDActuales, archivosNuevos]);

  const totalArchivosEvidencia = archivosBDActuales.length + archivosNuevos.length;

  const sucio = !claveActual
    ? false
    : guardada
      ? bor.comentario !== (guardada.comentario || "") ||
        bor.estado !== (guardada.estado || "Por revisar") ||
        String(bor.calificacion ?? "") !== String(guardada.calificacion ?? "") ||
        archivosNuevos.length > 0
      : archivosNuevos.length > 0 ||
        bor.comentario.trim() !== "" ||
        String(bor.calificacion ?? "").trim() !== "";

  const elegirAlumno = (est) => {
    setSelAlumnoKey(est.alumnoKey);
    setSelModuloKey(est.modulos[0]?.key || "");
    setTipoIdx(0);
    setAviso(null);
    cargarEvidenciasAlumnoBD(est);
  };

  const elegirModulo = (modKey) => {
    setSelModuloKey(modKey);
    setTipoIdx(0);
    setAviso(null);
  };

  const elegirTipo = (i) => {
    setTipoIdx(i);
    setAviso(null);
  };

  const irAlExpedienteAlumno = (alumno) => {
    if (!alumno) return;
    const payload = {
      ...alumno,
      modulo_nombre: moduloActual?.nombre || alumno.modulo_nombre,
      id_modulo: moduloActual?.id_modulo ?? alumno.id_modulo,
    };

    try {
      localStorage.setItem("expediente_alumno_seleccionado", JSON.stringify(payload));
    } catch {
      /* ignorar error de storage */
    }

    onAbrirExpediente?.(payload);
    setVista?.("Expediente Alumno");
  };

  const agregarArchivos = (nuevos) => {
    if (!claveActual || nuevos.length === 0) return;

    const permitidos = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const validos = nuevos.filter(
      (archivo) => permitidos.includes(archivo.type) || esImagen(archivo.name, archivo.type)
    );

    if (validos.length !== nuevos.length) {
      setAviso({ tipo: "error", texto: "Algunos archivos tienen un formato no permitido." });
    }

    const MAX_MB = 15;
    const dentroDelLimite = validos.filter(
      (archivo) => archivo.size <= MAX_MB * 1024 * 1024
    );

    if (dentroDelLimite.length !== validos.length) {
      setAviso({ tipo: "error", texto: "Cada foto o archivo debe pesar como máximo 15 MB." });
    }

    if (dentroDelLimite.length > 0) {
      const mapeados = dentroDelLimite.map((file, i) => ({
        id: `local-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        esFoto: esImagen(file.name, file.type),
        previewUrl: esImagen(file.name, file.type) ? URL.createObjectURL(file) : "",
        seleccionada: true,
        desdeBD: false,
      }));

      setArchivos((prev) => ({
        ...prev,
        [claveActual]: [...(prev[claveActual] || []), ...mapeados],
      }));

      if (validos.length === nuevos.length && dentroDelLimite.length === validos.length) {
        setAviso(null);
      }
    }
  };

  const adjuntarArchivos = (e) => {
    agregarArchivos(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const soltarArchivos = (e) => {
    e.preventDefault();
    setArrastrando(false);
    agregarArchivos(Array.from(e.dataTransfer.files || []));
  };

  const alternarSeleccionEvidencia = (esDeBD, indice) => {
    if (!claveActual) return;
    if (esDeBD) {
      setEvals((prev) => {
        const reg = prev[claveActual];
        if (!reg) return prev;
        const nextBD = (reg.archivosBD || []).map((item, idx) =>
          idx === indice ? { ...item, seleccionada: !(item.seleccionada !== false) } : item
        );
        const next = {
          ...prev,
          [claveActual]: { ...reg, archivosBD: nextBD },
        };
        guardarStorage(`ev_efsrt_evals_${obtenerClaveSesion()}`, next);
        return next;
      });
    } else {
      setArchivos((prev) => ({
        ...prev,
        [claveActual]: (prev[claveActual] || []).map((item, idx) =>
          idx === indice ? { ...item, seleccionada: !(item.seleccionada !== false) } : item
        ),
      }));
    }
  };

  const eliminarArchivoNuevo = (indice) => {
    if (!claveActual) return;
    setArchivos((prev) => {
      const lista = prev[claveActual] || [];
      const target = lista[indice];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return {
        ...prev,
        [claveActual]: lista.filter((_, i) => i !== indice),
      };
    });
  };

  const abrirArchivo = (item) => {
    if (item?.file) {
      const url = item.previewUrl || URL.createObjectURL(item.file);
      const ventana = window.open(url, "_blank");
      if (!ventana) {
        if (!item.previewUrl) URL.revokeObjectURL(url);
        setAviso({ tipo: "error", texto: "Permite las ventanas emergentes para visualizar el archivo." });
        return;
      }
      if (!item.previewUrl) setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }
    if (item?.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  const guardar = async () => {
    if (!alumnoActual || !moduloActual || !claveActual) return;

    const notaNum =
      String(bor.calificacion ?? "").trim() !== ""
        ? Number(bor.calificacion)
        : null;

    if (notaNum !== null && (Number.isNaN(notaNum) || notaNum < 0 || notaNum > 20)) {
      setAviso({ tipo: "error", texto: "La calificación debe estar entre 0 y 20." });
      return;
    }

    if (totalArchivosEvidencia === 0 && !guardada && notaNum === null) {
      setAviso({
        tipo: "error",
        texto: "Adjunta al menos una foto/archivo o ingresa una calificación para registrar.",
      });
      return;
    }

    setGuardando(true);
    try {
      const archivosSeleccionados = [
        ...archivosBDActuales.filter((x) => x.seleccionada !== false),
        ...archivosNuevos.filter((x) => x.seleccionada !== false),
      ];

      const idEst = alumnoActual.id_estudiante ?? alumnoActual.id;

      const formData = new FormData();
      formData.append("id_estudiante", String(idEst));
      if (moduloActual.id_modulo) {
        formData.append("id_modulo", String(moduloActual.id_modulo));
      }
      formData.append("modulo_nombre", moduloActual.nombre);
      if (alumnoActual.id_expediente) {
        formData.append("id_expediente", String(alumnoActual.id_expediente));
      }
      if (alumnoActual.dni) {
        formData.append("dni", String(alumnoActual.dni));
      }
      formData.append("tipo_evidencia", tipoActual);
      formData.append("tipo", tipoActual);
      formData.append("estado_revision", bor.estado);
      formData.append("estado", bor.estado);
      formData.append("revisado", bor.estado === "Conforme" ? "1" : "0");
      formData.append("comentario", bor.comentario || "");
      formData.append("observacion", bor.comentario || "");
      if (notaNum !== null) {
        formData.append("calificacion", String(notaNum));
        formData.append("nota", String(notaNum));
      }
      formData.append(
        "evidencias_seleccionadas",
        JSON.stringify(archivosSeleccionados.map((a) => a.id || a.name))
      );

      archivosNuevos.forEach((item) => {
        if (item.file) {
          formData.append("archivos[]", item.file, item.name);
          formData.append("evidencias[]", item.file, item.name);
        }
      });

      let respuestaBD = null;
      try {
        const res = await api.post("/evidencias-efsrt", formData, {
          headers: {
            ...headersAuth(),
            "Content-Type": "multipart/form-data",
          },
        });
        respuestaBD = res?.data?.data || res?.data || null;
      } catch {
        /* mantener registro local sincronizado */
      }

      if (notaNum !== null) {
        await api
          .post(
            "/calificaciones-efsrt",
            {
              id_estudiante: idEst,
              ...(moduloActual.id_modulo ? { id_modulo: moduloActual.id_modulo } : {}),
              tipo_evidencia: tipoActual,
              calificacion: notaNum,
              nota: notaNum,
              estado_revision: bor.estado,
              observacion: bor.comentario || "",
            },
            { headers: headersAuth() }
          )
          .catch(() => null);
      }

      const archivosCombinados = [
        ...archivosBDActuales,
        ...archivosNuevos.map((item) => ({
          id: respuestaBD?.id ?? item.id,
          name: item.name,
          size: item.size,
          esFoto: item.esFoto,
          url: item.previewUrl || respuestaBD?.url || "",
          seleccionada: item.seleccionada !== false,
          desdeBD: true,
        })),
      ];

      const nuevaEval = {
        id_evidencia: respuestaBD?.id_evidencia ?? respuestaBD?.id ?? guardada?.id_evidencia ?? null,
        id_expediente:
          respuestaBD?.id_expediente ?? alumnoActual.id_expediente ?? guardada?.id_expediente ?? null,
        id_estudiante: idEst,
        dni: alumnoActual.dni,
        modulo_key: moduloActual.key,
        tipo: tipoActual,
        comentario: bor.comentario,
        calificacion: notaNum !== null ? notaNum : "",
        estado: bor.estado,
        revisado: bor.estado === "Conforme",
        fecha: new Date().toLocaleDateString("es-PE"),
        archivosBD: archivosCombinados,
        archivosSeleccionados: archivosSeleccionados.map((a) => a.name),
        cantidadArchivos: archivosCombinados.length,
        nombresArchivos: archivosCombinados.map((archivo) => archivo.name),
      };

      const nextEvals = {
        ...evals,
        [claveActual]: nuevaEval,
      };

      setEvals(nextEvals);
      guardarStorage(storageEvalsKey, nextEvals);

      setArchivos((prev) => ({
        ...prev,
        [claveActual]: [],
      }));

      window.dispatchEvent(new Event("expediente:actualizado"));
      setAviso({
        tipo: "ok",
        texto: `${tipoActual} (${moduloActual.nombre}) guardada${
          notaNum !== null ? ` · Nota: ${notaNum}/20` : ""
        }.`,
      });
    } finally {
      setGuardando(false);
    }
  };

  const secundario = d ? "text-slate-400" : "text-slate-500";
  const sub = d ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200";

  const Chip = ({ estado }) => {
    const c = COLOR_ESTADO[estado];
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: `${c}1a`, color: c }}
      >
        <i className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
        {estado}
      </span>
    );
  };

  return (
    <div className={`space-y-5 text-sm ${t.texto}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Cabecera
          t={t}
          titulo="Evaluación y Evidencias EFSRT"
          subtitulo="Cada estudiante aparece una sola vez; selecciona su módulo, adjunta evidencias y califica."
          pill={`Por completar: ${incompletos}`}
        />

        <button
          type="button"
          onClick={() => sincronizarAlumnos({ forzarSpinner: true })}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${t.boton}`}
        >
          <RefreshCcw size={13} className={cargandoAlumnos ? "animate-spin" : ""} />
          Actualizar lista
        </button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
        <section className={`${t.tarjeta} overflow-hidden rounded-xl`}>
          <div className={`space-y-3 border-b p-4 ${t.borde}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Estudiantes asignados
              </h2>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${sub}`}>
                {estudiantesUnicos.length}
              </span>
            </div>

            <div className="relative">
              <Search
                size={14}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${secundario}`}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar estudiante, DNI o módulo..."
                className={`w-full rounded-lg border py-2 pl-8 pr-3 text-xs outline-none ${t.entrada}`}
              />
            </div>

            <div className="flex gap-1.5">
              {["Todos", "Pendientes", "Completos"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  aria-pressed={filtro === f}
                  className={`flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${foco} ${
                    filtro === f ? t.chipOn : t.boton
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <ul className="max-h-[620px] divide-y divide-slate-200/60 overflow-y-auto dark:divide-slate-700/60">
            {cargandoAlumnos && estudiantesUnicos.length === 0 ? (
              <li className={`px-4 py-10 text-center text-xs ${secundario}`}>
                Cargando estudiantes asignados...
              </li>
            ) : errorAlumnos ? (
              <li className="px-4 py-10 text-center text-xs text-rose-500">
                {errorAlumnos}
              </li>
            ) : visibles.length === 0 ? (
              <li className={`px-4 py-10 text-center text-xs ${secundario}`}>
                No hay estudiantes asignados que coincidan.
              </li>
            ) : (
              visibles.map((est) => {
                const activo = est.alumnoKey === selAlumnoKey;
                const n = nRegistradasAlumno(est);
                const maxEv = maxEvidenciasAlumno(est);
                const modsCount = est.modulos.filter((m) => !m.esCatalogoExtra).length || 1;
                return (
                  <li key={est.alumnoKey}>
                    <button
                      type="button"
                      onClick={() => elegirAlumno(est)}
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activo
                          ? d
                            ? "bg-blue-500/15"
                            : "bg-blue-50/80"
                          : t.fila
                      }`}
                    >
                      <AvatarEstudiante
                        estudiante={est}
                        className="h-9 w-9 rounded-lg text-xs font-bold"
                        fallbackClassName={activo ? "bg-blue-600 text-white" : "bg-blue-600/10 text-blue-600"}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{est.nombre}</span>
                        <span className={`mt-0.5 block truncate text-[11px] ${secundario}`}>
                          {est.dni ? `DNI ${est.dni} · ` : ""}
                          {modsCount} {modsCount === 1 ? "módulo" : "módulos"}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
                        <span className={n >= maxEv ? "text-emerald-600" : secundario}>
                          {n}/{maxEv}
                        </span>
                        <ChevronRight
                          size={14}
                          className={activo ? "text-blue-600" : secundario}
                        />
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {alumnoActual && moduloActual ? (
          <section
            key={`${alumnoActual.alumnoKey}-${moduloActual.key}`}
            className={`${t.tarjeta} rounded-xl p-5 md:p-6`}
          >
            <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-4 ${t.borde}`}>
              <div className="flex items-center gap-3">
                <AvatarEstudiante
                  estudiante={alumnoActual}
                  className="h-11 w-11 rounded-xl text-sm font-bold"
                  fallbackClassName="bg-blue-600 text-white"
                />
                <div>
                  <h2 className="text-base font-bold">{alumnoActual.nombre}</h2>
                  <p className={`text-xs ${secundario}`}>
                    {alumnoActual.dni ? `DNI ${alumnoActual.dni}` : ""}
                    {moduloActual.id_expediente ? ` · Expediente #${moduloActual.id_expediente}` : ""}
                    {cargandoEvidenciasBD ? " · Sincronizando evidencias..." : ""}
                  </p>
                  <p className={`mt-1 flex flex-wrap items-center gap-3 text-xs ${secundario}`}>
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={12} /> {moduloActual.entidad}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase size={12} /> {moduloActual.nombre}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => irAlExpedienteAlumno(alumnoActual)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-blue-600 transition ${t.boton}`}
              >
                Ver expediente
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Layers size={13} className="text-blue-600" />
                  Módulo del estudiante
                </span>
                <span className={secundario}>
                  {nRegistradasModulo(alumnoActual.alumnoKey, moduloActual.key)}/{TIPOS.length} evidencias en este módulo
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {alumnoActual.modulos.map((mod) => {
                  const activa = mod.key === moduloActual.key;
                  const doneCount = nRegistradasModulo(alumnoActual.alumnoKey, mod.key);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => elegirModulo(mod.key)}
                      aria-pressed={activa}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${foco} ${
                        activa
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                          : t.boton
                      }`}
                    >
                      <span>{mod.nombre}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          activa
                            ? "bg-white/20 text-white"
                            : d
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {doneCount}/{TIPOS.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Sparkles size={13} className="text-blue-600" />
                  Tipo de evidencia
                </span>
                <span className={secundario}>
                  {nRegistradasModulo(alumnoActual.alumnoKey, moduloActual.key)} de {TIPOS.length} registradas
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {TIPOS.map((tObj, i) => {
                  const est = estadoEv(alumnoActual.alumnoKey, moduloActual.key, tObj.id);
                  const act = i === tipoIdx;
                  return (
                    <button
                      key={tObj.id}
                      type="button"
                      onClick={() => elegirTipo(i)}
                      aria-pressed={act}
                      className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-left transition ${foco} ${
                        act ? "border-blue-600 bg-blue-600 text-white" : t.boton
                      }`}
                    >
                      <div className="truncate text-xs font-semibold">{tObj.id}</div>
                      <div
                        className={`mt-0.5 text-[11px] ${act ? "text-white/85" : ""}`}
                        style={act ? undefined : { color: COLOR_ESTADO[est] }}
                      >
                        {est}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div key={claveActual} className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold">{tipoActual}</h3>
                  <p className={`text-xs ${secundario}`}>{tipoActualObj.ayuda}</p>
                </div>
                <Chip
                  estado={estadoEv(alumnoActual.alumnoKey, moduloActual.key, tipoActual)}
                />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Paperclip size={13} className="text-blue-600" />
                    Fotos y archivos de evidencia
                  </span>
                  <span className={secundario}>
                    Elegidas para revisión:{" "}
                    <b className="text-blue-600">{archivosSeleccionadosCount}</b> /{" "}
                    {totalArchivosEvidencia}
                  </span>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrando(true);
                  }}
                  onDragLeave={() => setArrastrando(false)}
                  onDrop={soltarArchivos}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 transition ${
                    arrastrando
                      ? "border-blue-600 bg-blue-600/10"
                      : d
                        ? "border-slate-600 hover:border-blue-500"
                        : "border-slate-300 hover:border-blue-500 hover:bg-blue-50/40"
                  }`}
                >
                  <Upload size={18} className="shrink-0 text-blue-600" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">
                      Adjuntar varias fotos o archivos
                    </span>
                    <span className={`block text-[11px] ${secundario}`}>
                      Haz clic o arrastra · Múltiples fotos (JPG, PNG, WEBP), PDF, Word o Excel · hasta 15 MB
                    </span>
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={adjuntarArchivos}
                    className="hidden"
                  />
                </label>

                <div className="mt-3 space-y-2">
                  {archivosBDActuales.map((item, index) => {
                    const sel = item.seleccionada !== false;
                    return (
                      <div
                        key={item.id || `${item.name}-${index}`}
                        onClick={() => alternarSeleccionEvidencia(true, index)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-xs transition ${
                          sel ? "border-blue-500/60 bg-blue-500/5" : sub
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alternarSeleccionEvidencia(true, index);
                          }}
                          title={sel ? "Elegida para revisar" : "Elegir para revisar"}
                          className="text-blue-600"
                        >
                          {sel ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} className={secundario} />
                          )}
                        </button>

                        {item.esFoto && item.url ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="h-9 w-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded ${sub}`}>
                            {item.esFoto ? <ImageIcon size={15} /> : <FileText size={15} />}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.name}</p>
                          <p className={`text-[10px] ${secundario}`}>
                            {sel ? "Elegida para revisión" : "No elegida"}
                            {item.size ? ` · ${formatoPeso(item.size)}` : ""}
                          </p>
                        </div>

                        {item.url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirArchivo(item);
                            }}
                            title="Ver archivo"
                            className="cursor-pointer rounded p-1.5 text-blue-600 hover:bg-blue-600/10"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {archivosNuevos.map((archivo, index) => {
                    const sel = archivo.seleccionada !== false;
                    return (
                      <div
                        key={archivo.id || `${archivo.name}-${index}`}
                        onClick={() => alternarSeleccionEvidencia(false, index)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-xs transition ${
                          sel ? "border-blue-500/60 bg-blue-500/5" : sub
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alternarSeleccionEvidencia(false, index);
                          }}
                          title={sel ? "Elegida para revisar" : "Elegir para revisar"}
                          className="text-blue-600"
                        >
                          {sel ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} className={secundario} />
                          )}
                        </button>

                        {archivo.esFoto && archivo.previewUrl ? (
                          <img
                            src={archivo.previewUrl}
                            alt={archivo.name}
                            className="h-9 w-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded ${sub}`}>
                            {archivo.esFoto ? <ImageIcon size={15} /> : <FileText size={15} />}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{archivo.name}</p>
                          <p className={`text-[10px] ${secundario}`}>
                            {formatoPeso(archivo.size)} ·{" "}
                            {sel ? "Elegida para revisión" : "No elegida"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirArchivo(archivo);
                          }}
                          title="Ver archivo"
                          className="cursor-pointer rounded p-1.5 text-blue-600 hover:bg-blue-600/10"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarArchivoNuevo(index);
                          }}
                          title="Quitar archivo"
                          className="cursor-pointer rounded p-1.5 text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}

                  {totalArchivosEvidencia === 0 && (
                    <p className={`py-2 text-center text-xs ${secundario}`}>
                      Sin fotos ni archivos adjuntos para esta evidencia.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">Estado de la revisión</p>
                    <div className="flex flex-wrap gap-2">
                      {ESTADOS_REVISION.map((est) => {
                        const act = bor.estado === est;
                        const c = COLOR_ESTADO[est];
                        return (
                          <button
                            key={est}
                            type="button"
                            onClick={() => setBor({ estado: est })}
                            className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ${foco} ${
                              act ? "text-white" : t.boton
                            }`}
                            style={act ? { background: c, borderColor: c } : undefined}
                          >
                            {est}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-36">
                    <label
                      htmlFor="ev-nota"
                      className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Award size={13} className="text-blue-600" />
                      Calificación (0–20)
                    </label>
                    <input
                      id="ev-nota"
                      type="number"
                      min={0}
                      max={20}
                      step="0.5"
                      value={bor.calificacion}
                      onChange={(e) => setBor({ calificacion: e.target.value })}
                      placeholder="Ej. 16"
                      className={`w-full rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none ${t.entrada}`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ev-com"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <MessageSquare size={13} />
                    Comentarios y observaciones
                  </label>
                  <textarea
                    id="ev-com"
                    rows={3}
                    value={bor.comentario}
                    onChange={(e) => setBor({ comentario: e.target.value })}
                    placeholder="Escribe observaciones sobre las evidencias elegidas..."
                    className={`w-full resize-none rounded-lg border p-3 text-xs outline-none ${t.entrada}`}
                  />
                </div>
              </div>

              <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${t.borde}`}>
                <div className="text-xs">
                  {aviso ? (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        aviso.tipo === "ok" ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {aviso.tipo === "ok" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      {aviso.texto}
                    </span>
                  ) : sucio ? (
                    <span className="font-medium text-amber-600">Cambios sin guardar</span>
                  ) : guardada ? (
                    <span className={secundario}>Último registro: {guardada.fecha}</span>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={guardando}
                  onClick={guardar}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 ${foco}`}
                >
                  <ClipboardCheck size={15} />
                  {guardando
                    ? "Guardando..."
                    : guardada
                      ? "Actualizar y calificar"
                      : "Guardar evidencia"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section
            className={`${t.tarjeta} flex min-h-[380px] flex-col items-center justify-center rounded-xl p-8 text-center`}
          >
            <Users size={28} className="mb-3 text-blue-600" />
            <h3 className="text-sm font-bold">Selecciona un estudiante asignado</h3>
            <p className={`mt-1 max-w-xs text-xs ${secundario}`}>
              Elige un alumno de la lista para ver sus evidencias de{" "}
              <code>evidencias_efsrt</code>.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}