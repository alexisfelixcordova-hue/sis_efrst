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
} from "lucide-react";

import {
  tema,
  foco,
  Cabecera,
  iniciales,
} from "../Docente/componentes/DocenteComun.jsx";
import api from "../../../api/axios.js";

const TIPOS = [
  "Bitácora semanal",
  "Informe parcial",
  "Informe final",
];

const AYUDA_TIPO = {
  "Bitácora semanal": "Registro semanal de las actividades realizadas.",
  "Informe parcial": "Avance del trabajo a mitad de la práctica.",
  "Informe final": "Cierre de la práctica y resultados obtenidos.",
};

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
    const datos =
      sessionStorage.getItem(clave) ?? localStorage.getItem(clave);
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

const normalizarAlumno = (item = {}, idx = 0) => {
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

  return {
    ...est,
    ...item,
    id: idEst,
    id_estudiante: idEst,
    id_expediente: idExp,
    dni,
    nombre: nombreCompleto,
    entidad:
      item.entidad_nombre ||
      item.entidad ||
      item.empresa?.razon_social ||
      est.entidad_nombre ||
      est.entidad ||
      item.modulo_nombre ||
      "Módulo EFSRT",
    proyecto:
      item.proyecto_titulo ||
      item.proyecto ||
      est.proyecto_titulo ||
      est.proyecto ||
      item.modulo_nombre ||
      item.programa_estudios ||
      "Prácticas EFSRT",
    estado: item.estado || est.estado || "En progreso",
  };
};

const claveAlumno = (a) =>
  String(a?.id_estudiante ?? a?.id ?? a?.dni ?? "");

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

  const [alumnos, setAlumnos] = useState(() => cacheInicialAlumnos ?? []);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(() => !cacheInicialAlumnos);
  const [errorAlumnos, setErrorAlumnos] = useState("");
  const [cargandoEvidenciasBD, setCargandoEvidenciasBD] = useState(false);

  const [evals, setEvals] = useState(() => leerStorage(storageEvalsKey, {}));
  const [archivos, setArchivos] = useState({});

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [selA, setSelA] = useState(null);
  const [tipoIdx, setTipoIdx] = useState(0);
  const [borradores, setBorradores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const headersAuth = useCallback(() => {
    const token = obtenerTokenActual();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const cargarEvidenciasAlumnoBD = useCallback(
    async (alumno) => {
      if (!alumno) return;
      const ref = claveAlumno(alumno);
      if (!ref) return;

      setCargandoEvidenciasBD(true);
      try {
        const params = {
          id_estudiante: alumno.id_estudiante ?? alumno.id,
          ...(alumno.id_expediente ? { id_expediente: alumno.id_expediente } : {}),
          ...(alumno.dni ? { dni: alumno.dni } : {}),
        };

        const endpoints = [
          "/evidencias-efsrt",
          `/expediente-efsrt/${ref}/evidencias`,
          `/alumnos/${ref}/evidencias-efsrt`,
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
                TIPOS.find((tNom) => tipoRaw.includes(tNom.toLowerCase().split(" ")[0])) ||
                TIPOS.find((tNom) => tipoRaw.includes(tNom.toLowerCase())) ||
                TIPOS[0];

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
                          esFoto: esImagen(f.nombre_archivo || f.name || f.url || "", f.mime_type || f.type),
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

              const claveItem = `${ref}|${tipoMatch}`;
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
                id_estudiante: alumno.id_estudiante ?? alumno.id,
                dni: alumno.dni,
                tipo: tipoMatch,
                comentario: row.comentario ?? row.observacion ?? existente?.comentario ?? "",
                estado: estadoRev,
                revisado: Boolean(row.revisado ?? (estadoRev === "Conforme")),
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
        setAlumnos(cached);
        setCargandoAlumnos(false);
      } else if (forzarSpinner || !Array.isArray(cached)) {
        setCargandoAlumnos(true);
      }

      setErrorAlumnos("");

      try {
        const res = await api.get("/mis-alumnos", { headers: headersAuth() });
        const lista = extraerLista(res.data).map(normalizarAlumno);
        CACHE_ALUMNOS_MEM.clave = claveActual;
        CACHE_ALUMNOS_MEM.lista = lista;
        setAlumnos(lista);
        guardarStorage(sKey, lista);
      } catch (err) {
        console.error("Error al cargar alumnos asignados:", err);
        const respaldo = leerStorage(sKey, null);
        if (Array.isArray(respaldo)) {
          setAlumnos(respaldo);
        } else {
          setAlumnos([]);
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

  useEffect(() => {
    if (alumnos.length === 0) return;

    if (estudianteSeleccionado) {
      const norm = normalizarAlumno(estudianteSeleccionado);
      const ref = claveAlumno(norm);
      const coincidente = alumnos.find((a) => claveAlumno(a) === ref);
      if (coincidente) {
        setFiltro("Todos");
        setSelA(claveAlumno(coincidente));
        setTipoIdx(0);
        cargarEvidenciasAlumnoBD(coincidente);
        return;
      }
    }

    if (!selA) {
      const primero = alumnos[0];
      setSelA(claveAlumno(primero));
      setTipoIdx(0);
      cargarEvidenciasAlumnoBD(primero);
    }
  }, [estudianteSeleccionado, alumnos, selA, cargarEvidenciasAlumnoBD]);

  const claveEv = (a, tipo) => `${claveAlumno(a)}|${tipo}`;

  const registrada = (a, tipo) => {
    const reg = evals[claveEv(a, tipo)];
    return Boolean(
      reg &&
        ((reg.archivosBD && reg.archivosBD.length > 0) ||
          (reg.cantidadArchivos && reg.cantidadArchivos > 0) ||
          (reg.nombresArchivos && reg.nombresArchivos.length > 0) ||
          reg.id_evidencia)
    );
  };

  const estadoEv = (a, tipo) => {
    const reg = evals[claveEv(a, tipo)];
    if (!reg) return "Sin registrar";
    return reg.estado || "Por revisar";
  };

  const nRegistradas = (a) => TIPOS.filter((tipo) => registrada(a, tipo)).length;
  const incompletos = alumnos.filter((a) => nRegistradas(a) < TIPOS.length).length;

  const visibles = alumnos.filter((a) => {
    const n = nRegistradas(a);
    const coincideFiltro =
      filtro === "Todos" ||
      (filtro === "Pendientes" && n < TIPOS.length) ||
      (filtro === "Completos" && n === TIPOS.length);

    const coincideBusqueda = `${a.nombre} ${a.dni} ${a.entidad} ${a.proyecto}`
      .toLowerCase()
      .includes(q.toLowerCase());

    return coincideFiltro && coincideBusqueda;
  });

  const alumnoActual = alumnos.find((a) => claveAlumno(a) === selA) || null;
  const tipoActual = TIPOS[tipoIdx];
  const clave = alumnoActual ? claveEv(alumnoActual, tipoActual) : null;
  const guardada = clave ? evals[clave] : null;

  const bor = (clave && borradores[clave]) || {
    comentario: guardada?.comentario || "",
    estado: guardada?.estado || "Por revisar",
  };
  const setBor = (cambio) =>
    clave && setBorradores((prev) => ({ ...prev, [clave]: { ...bor, ...cambio } }));

  const archivosNuevos = clave ? archivos[clave] || [] : [];
  const archivosBDActuales = guardada?.archivosBD || [];

  const archivosSeleccionadosCount = useMemo(() => {
    const bdSel = archivosBDActuales.filter((x) => x.seleccionada !== false).length;
    const newSel = archivosNuevos.filter((x) => x.seleccionada !== false).length;
    return bdSel + newSel;
  }, [archivosBDActuales, archivosNuevos]);

  const totalArchivosEvidencia = archivosBDActuales.length + archivosNuevos.length;

  const sucio = !clave
    ? false
    : guardada
      ? bor.comentario !== (guardada.comentario || "") ||
        bor.estado !== (guardada.estado || "Por revisar") ||
        archivosNuevos.length > 0
      : archivosNuevos.length > 0 || bor.comentario.trim() !== "";

  const elegirAlumno = (a) => {
    setSelA(claveAlumno(a));
    setTipoIdx(0);
    setAviso(null);
    cargarEvidenciasAlumnoBD(a);
  };

  const elegirTipo = (i) => {
    setTipoIdx(i);
    setAviso(null);
  };

  const irAlExpedienteAlumno = (alumno) => {
    if (!alumno) return;
    const ref = claveAlumno(alumno);
    const evalsAlumno = TIPOS.reduce((acc, tipo) => {
      const registro = evals[`${ref}|${tipo}`];
      if (registro) acc[tipo] = registro;
      return acc;
    }, {});

    const payload = {
      ...alumno,
      evaluaciones_evidencias: evalsAlumno,
    };

    try {
      localStorage.setItem(
        "expediente_alumno_seleccionado",
        JSON.stringify(payload)
      );
    } catch {
      /* ignorar error de storage */
    }

    onAbrirExpediente?.(payload);
    setVista?.("Expediente Alumno");
  };

  const agregarArchivos = (nuevos) => {
    if (!clave || nuevos.length === 0) return;

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
        [clave]: [...(prev[clave] || []), ...mapeados],
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
    if (!clave) return;
    if (esDeBD) {
      setEvals((prev) => {
        const reg = prev[clave];
        if (!reg) return prev;
        const nextBD = (reg.archivosBD || []).map((item, idx) =>
          idx === indice ? { ...item, seleccionada: !(item.seleccionada !== false) } : item
        );
        const next = {
          ...prev,
          [clave]: {
            ...reg,
            archivosBD: nextBD,
          },
        };
        guardarStorage(`ev_efsrt_evals_${obtenerClaveSesion()}`, next);
        return next;
      });
    } else {
      setArchivos((prev) => ({
        ...prev,
        [clave]: (prev[clave] || []).map((item, idx) =>
          idx === indice ? { ...item, seleccionada: !(item.seleccionada !== false) } : item
        ),
      }));
    }
  };

  const eliminarArchivoNuevo = (indice) => {
    if (!clave) return;
    setArchivos((prev) => {
      const lista = prev[clave] || [];
      const target = lista[indice];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return {
        ...prev,
        [clave]: lista.filter((_, i) => i !== indice),
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
    if (!alumnoActual || !clave) return;

    if (totalArchivosEvidencia === 0 && !guardada) {
      setAviso({ tipo: "error", texto: "Adjunta al menos una foto o archivo para registrar esta evidencia." });
      return;
    }

    setGuardando(true);
    try {
      const archivosSeleccionados = [
        ...archivosBDActuales.filter((x) => x.seleccionada !== false),
        ...archivosNuevos.filter((x) => x.seleccionada !== false),
      ];

      const formData = new FormData();
      formData.append("id_estudiante", String(alumnoActual.id_estudiante ?? alumnoActual.id));
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
      formData.append(
        "evidencias_seleccionadas",
        JSON.stringify(archivosSeleccionados.map((a) => a.id || a.name))
      );

      archivosNuevos.forEach((item) => {
        if (item.file) {
          formData.append("archivos[]", item.file, item.name);
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
        id_estudiante: alumnoActual.id_estudiante ?? alumnoActual.id ?? null,
        dni: alumnoActual.dni,
        tipo: tipoActual,
        comentario: bor.comentario,
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
        [clave]: nuevaEval,
      };

      setEvals(nextEvals);
      guardarStorage(storageEvalsKey, nextEvals);

      setArchivos((prev) => ({
        ...prev,
        [clave]: [],
      }));

      const ref = claveAlumno(alumnoActual);
      const evalsAlumno = TIPOS.reduce((acc, tipo) => {
        const reg = nextEvals[`${ref}|${tipo}`];
        if (reg) acc[tipo] = reg;
        return acc;
      }, {});

      try {
        localStorage.setItem(
          `expediente_evaluaciones_${ref}`,
          JSON.stringify(evalsAlumno)
        );
        const expedientePrevio = leerStorage("expediente_alumno_seleccionado", null);
        if (
          expedientePrevio &&
          claveAlumno(normalizarAlumno(expedientePrevio)) === ref
        ) {
          localStorage.setItem(
            "expediente_alumno_seleccionado",
            JSON.stringify({
              ...expedientePrevio,
              evaluaciones_evidencias: evalsAlumno,
            })
          );
        }
      } catch {
        /* ignorar error de storage */
      }

      window.dispatchEvent(new Event("expediente:actualizado"));
      setAviso({ tipo: "ok", texto: `${tipoActual} guardada en evidencias_efsrt.` });
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
          titulo="Evidencias de Practicantes"
          subtitulo="Evidencias registradas en evidencias_efsrt vinculadas al expediente del alumno."
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
        {/* Lista de alumnos asignados */}
        <section className={`${t.tarjeta} overflow-hidden rounded-xl`}>
          <div className={`space-y-3 border-b p-4 ${t.borde}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Estudiantes asignados
              </h2>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${sub}`}>
                {alumnos.length}
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
                placeholder="Buscar estudiante o DNI..."
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

          <ul className="max-h-[600px] divide-y divide-slate-200/60 overflow-y-auto dark:divide-slate-700/60">
            {cargandoAlumnos && alumnos.length === 0 ? (
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
              visibles.map((a) => {
                const activo = claveAlumno(a) === selA;
                const n = nRegistradas(a);
                return (
                  <li key={claveAlumno(a)}>
                    <button
                      type="button"
                      onClick={() => elegirAlumno(a)}
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activo
                          ? d
                            ? "bg-blue-500/15"
                            : "bg-blue-50/80"
                          : t.fila
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                          activo ? "bg-blue-600 text-white" : "bg-blue-600/10 text-blue-600"
                        }`}
                      >
                        {iniciales(a.nombre)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{a.nombre}</span>
                        <span className={`mt-0.5 block truncate text-[11px] ${secundario}`}>
                          {a.dni ? `DNI ${a.dni} · ` : ""}{a.entidad}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
                        <span className={n === TIPOS.length ? "text-emerald-600" : secundario}>
                          {n}/{TIPOS.length}
                        </span>
                        <ChevronRight size={14} className={activo ? "text-blue-600" : secundario} />
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {/* Detalle de evidencias del alumno */}
        {alumnoActual ? (
          <section key={claveAlumno(alumnoActual)} className={`${t.tarjeta} rounded-xl p-5 md:p-6`}>
            <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-4 ${t.borde}`}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                  {iniciales(alumnoActual.nombre)}
                </span>
                <div>
                  <h2 className="text-base font-bold">{alumnoActual.nombre}</h2>
                  <p className={`text-xs ${secundario}`}>
                    {alumnoActual.dni ? `DNI ${alumnoActual.dni}` : ""}
                    {alumnoActual.id_expediente ? ` · Expediente #${alumnoActual.id_expediente}` : ""}
                    {cargandoEvidenciasBD ? " · Consultando evidencias_efsrt..." : ""}
                  </p>
                  <p className={`mt-1 flex flex-wrap items-center gap-3 text-xs ${secundario}`}>
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={12} /> {alumnoActual.entidad}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase size={12} /> {alumnoActual.proyecto}
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

            {/* Selector de las 3 evidencias */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold">Tipo de evidencia</span>
                <span className={secundario}>
                  {nRegistradas(alumnoActual)} de {TIPOS.length} registradas
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {TIPOS.map((tipo, i) => {
                  const est = estadoEv(alumnoActual, tipo);
                  const act = i === tipoIdx;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => elegirTipo(i)}
                      aria-pressed={act}
                      className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-left transition ${foco} ${
                        act
                          ? "border-blue-600 bg-blue-600 text-white"
                          : `${t.boton}`
                      }`}
                    >
                      <div className="truncate text-xs font-semibold">{tipo}</div>
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

            {/* Editor de evidencia */}
            <div key={clave} className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold">{tipoActual}</h3>
                  <p className={`text-xs ${secundario}`}>{AYUDA_TIPO[tipoActual]}</p>
                </div>
                <Chip estado={estadoEv(alumnoActual, tipoActual)} />
              </div>

              {/* Adjuntar varias fotos/archivos y elegir cuáles revisar */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Paperclip size={13} className="text-blue-600" />
                    Fotos y archivos de evidencia
                  </span>
                  <span className={secundario}>
                    Elegidas para revisión: <b className="text-blue-600">{archivosSeleccionadosCount}</b> / {totalArchivosEvidencia}
                  </span>
                </div>

                <label
                  onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
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
                          {sel ? <CheckSquare size={16} /> : <Square size={16} className={secundario} />}
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
                          {sel ? <CheckSquare size={16} /> : <Square size={16} className={secundario} />}
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
                            {formatoPeso(archivo.size)} · {sel ? "Elegida para revisión" : "No elegida"}
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

              {/* Estado y observaciones */}
              <div className="space-y-3">
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

                <div>
                  <label htmlFor="ev-com" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
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

              {/* Pie y guardar */}
              <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${t.borde}`}>
                <div className="text-xs">
                  {aviso ? (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        aviso.tipo === "ok" ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {aviso.tipo === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
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
                  {guardando ? "Guardando..." : guardada ? "Actualizar evidencia" : "Guardar evidencia"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className={`${t.tarjeta} flex min-h-[380px] flex-col items-center justify-center rounded-xl p-8 text-center`}>
            <Users size={28} className="mb-3 text-blue-600" />
            <h3 className="text-sm font-bold">Selecciona un estudiante asignado</h3>
            <p className={`mt-1 max-w-xs text-xs ${secundario}`}>
              Elige un alumno de la lista para ver sus evidencias de <code>evidencias_efsrt</code>.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}