import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  UserRound,
  GraduationCap,
  Building2,
  ClipboardCheck,
  FileText,
  ChartNoAxesCombined,
  Plus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Trash2,
  Save,
  Award,
  MessageSquare,
  BookOpen,
  Target,
  X,
  ChevronRight,
  RefreshCw,
  Paperclip,
  Eye,
  LockKeyhole,
  Send,
  Image as ImageIcon,
  CheckSquare,
  Square,
  UserCheck,
  FolderCheck,
  ShieldCheck,
} from "lucide-react";

import api, { clearApiCache } from "../../../api/axios";
import {
  LS_REVISION_ESTUDIANTES,
  CACHE_REVISION_MEM,
  AvatarRevision,
  EstadoEtiquetaRevision,
  inputRevisionClass,
  obtenerClaveSesionRevision,
  leerStorageRevision,
  guardarStorageRevision,
  obtenerHeadersRevision,
  extraerListaRevision,
} from "./ListarEstudiantesRevision";

const LS_EVIDENCIAS = "docente_evidencias_asignadas_v1";
const ROMANOS = ["I", "II", "III"];

const CRITERIOS = [
  {
    id: "cumplimiento",
    nombre: "Cumplimiento de actividades",
    descripcion:
      "Realiza las actividades y tareas asignadas durante sus prácticas.",
    peso: 20,
  },
  {
    id: "calidad",
    nombre: "Calidad del trabajo",
    descripcion:
      "Desarrolla sus actividades con precisión y cumple los estándares establecidos.",
    peso: 25,
  },
  {
    id: "conocimientos",
    nombre: "Aplicación de conocimientos",
    descripcion:
      "Aplica los conocimientos técnicos adquiridos durante su formación.",
    peso: 20,
  },
  {
    id: "responsabilidad",
    nombre: "Responsabilidad y autonomía",
    descripcion:
      "Demuestra compromiso, puntualidad y capacidad para trabajar de forma autónoma.",
    peso: 20,
  },
  {
    id: "comunicacion",
    nombre: "Comunicación y trabajo en equipo",
    descripcion:
      "Se comunica adecuadamente y colabora con el equipo de trabajo.",
    peso: 15,
  },
];

const NIVELES = [
  {
    valor: 1,
    nombre: "En inicio",
    descripcion: "Necesita acompañamiento constante.",
  },
  {
    valor: 2,
    nombre: "En proceso",
    descripcion: "Cumple parcialmente las actividades.",
  },
  {
    valor: 3,
    nombre: "Logrado",
    descripcion: "Cumple satisfactoriamente lo esperado.",
  },
  {
    valor: 4,
    nombre: "Destacado",
    descripcion: "Supera las expectativas establecidas.",
  },
];

const esImagen = (nombre = "", mime = "") => {
  if (String(mime).startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(String(nombre));
};

const normalizarEstadoEv = (val) => {
  const s = String(val || "").toLowerCase();
  if (s.includes("aprob") || s.includes("conform") || s === "validado")
    return "Aprobado";
  if (s.includes("observ") || s.includes("rechaz")) return "Observado";
  if (s.includes("revis")) return "En revisión";
  return "Pendiente";
};

const fechaActual = () => {
  const fecha = new Date();
  const local = new Date(
    fecha.getTime() - fecha.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
};

const calcularNota = (evaluacion) =>
  CRITERIOS.reduce((total, criterio) => {
    const nivel = Number(evaluacion[criterio.id] || 0);
    return total + (nivel / 4) * criterio.peso * 0.2;
  }, 0);

const formatoNota = (nota) => Number(nota || 0).toFixed(2);

function Campo({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export default function DetalleRevisionEstudiante({
  estudiante,
  setEstudiantes,
  onVolver,
  onGuardadoExitoso,
  setVista,
  darkMode = false,
}) {
  const claveSesion = useMemo(() => obtenerClaveSesionRevision(), []);
  const keyEstudiantes = `${LS_REVISION_ESTUDIANTES}_${claveSesion}`;
  const keyEvidencias = `${LS_EVIDENCIAS}_${claveSesion}`;

  const modulosEstudiante = useMemo(() => {
    if (Array.isArray(estudiante?.modulos) && estudiante.modulos.length > 0) {
      return estudiante.modulos;
    }
    return [1, 2, 3].map((num) => ({
      id_modulo: num,
      numero_modulo: num,
      id_expediente: estudiante?.idExpediente ?? null,
      nombre_modulo: `Módulo ${ROMANOS[num - 1]}`,
      docente_asignado: estudiante?.docenteAsignado || "Docente asignado",
      id_docente_asesor: null,
      empresa: estudiante?.empresa || "Empresa no registrada",
      horas_acumuladas: Number(estudiante?.horasAcumuladas ?? 0),
      horas_requeridas: Number(estudiante?.horasRequeridas ?? 160),
      estado_portafolio: estudiante?.estadoPortafolio || "Pendiente de revisión",
      verificado_docente: false,
      listo_para_constancia: false,
      nota: estudiante?.nota ?? null,
      comentario: estudiante?.comentario || "",
      adjuntado: Boolean(estudiante?.adjuntado),
    }));
  }, [estudiante]);

  const [numeroModuloActivo, setNumeroModuloActivo] = useState(
    () => Number(estudiante?.numeroModuloInicial || 1)
  );
  const [seccion, setSeccion] = useState("evaluacion");
  const [cargandoEvBD, setCargandoEvBD] = useState(false);

  const moduloActivo = useMemo(
    () =>
      modulosEstudiante.find(
        (m) => Number(m.numero_modulo) === Number(numeroModuloActivo)
      ) || modulosEstudiante[0],
    [modulosEstudiante, numeroModuloActivo]
  );

  const claveModulo = `${estudiante.estudianteId}-m${moduloActivo.numero_modulo}`;

  const [evaluaciones, setEvaluaciones] = useState({});
  const [evidencias, setEvidencias] = useState(() =>
    leerStorageRevision(keyEvidencias, {})
  );
  const [modalEvidencia, setModalEvidencia] = useState(false);
  const [nuevaEvidencia, setNuevaEvidencia] = useState({
    titulo: "",
    descripcion: "",
    fechaLimite: "",
  });

  const [observaciones, setObservaciones] = useState({});
  const [logros, setLogros] = useState({});
  const [mejoras, setMejoras] = useState({});
  const [verificadoPorModulo, setVerificadoPorModulo] = useState({});
  const [portafolioPorModulo, setPortafolioPorModulo] = useState({});
  const [horasPorModulo, setHorasPorModulo] = useState({});
  const [empresaPorModulo, setEmpresaPorModulo] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [filtroEvidencia, setFiltroEvidencia] = useState("Todas");

  const surface = darkMode
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-200 bg-white text-slate-800";
  const muted = darkMode ? "text-slate-400" : "text-slate-500";
  const fondo = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-[#f6f8fc] text-slate-800";

  const mostrarAviso = (tipo, mensaje) => {
    setAviso({ tipo, mensaje });
    window.setTimeout(() => setAviso(null), 4500);
  };

  useEffect(() => {
    setNumeroModuloActivo(Number(estudiante?.numeroModuloInicial || 1));
    setSeccion("evaluacion");
    setAviso(null);
  }, [estudiante?.id, estudiante?.numeroModuloInicial]);

  useEffect(() => {
    if (!moduloActivo) return;
    setVerificadoPorModulo((prev) =>
      prev[claveModulo] !== undefined
        ? prev
        : { ...prev, [claveModulo]: Boolean(moduloActivo.verificado_docente) }
    );
    setPortafolioPorModulo((prev) =>
      prev[claveModulo] !== undefined
        ? prev
        : {
            ...prev,
            [claveModulo]:
              moduloActivo.estado_portafolio || "Pendiente de revisión",
          }
    );
    setHorasPorModulo((prev) =>
      prev[claveModulo] !== undefined
        ? prev
        : { ...prev, [claveModulo]: Number(moduloActivo.horas_acumuladas ?? 0) }
    );
    setEmpresaPorModulo((prev) =>
      prev[claveModulo] !== undefined
        ? prev
        : {
            ...prev,
            [claveModulo]: moduloActivo.empresa || "Empresa no registrada",
          }
    );
  }, [claveModulo, moduloActivo]);

  useEffect(() => {
    guardarStorageRevision(keyEvidencias, evidencias);
  }, [evidencias, keyEvidencias]);

  const cargarEvidenciasDeModulo = useCallback(async () => {
    if (!estudiante || !moduloActivo) return;
    setCargandoEvBD(true);
    try {
      const params = {
        id_estudiante: estudiante.estudianteId,
        id_modulo: moduloActivo.id_modulo,
        numero_modulo: moduloActivo.numero_modulo,
        ...(moduloActivo.id_expediente
          ? { id_expediente: moduloActivo.id_expediente }
          : {}),
        ...(estudiante.dni && estudiante.dni !== "Sin DNI"
          ? { dni: estudiante.dni }
          : {}),
      };

      const endpoints = [
        "/evidencias-efsrt",
        `/expediente-efsrt/${estudiante.estudianteId}/evidencias`,
        `/alumnos/${estudiante.estudianteId}/evidencias-efsrt`,
      ];

      let registrosBD = [];
      for (const ep of endpoints) {
        try {
          const res = await api.get(ep, {
            params,
            headers: obtenerHeadersRevision(),
          });
          const lista = extraerListaRevision(res?.data);
          if (lista.length > 0 || Array.isArray(res?.data?.data)) {
            registrosBD = lista.filter((r) => {
              const rNum = Number(r?.numero_modulo ?? r?.modulo_numero ?? 0);
              const rMod = r?.id_modulo ?? r?.modulo_id ?? null;
              if (!rNum && !rMod) return true;
              return (
                rNum === Number(moduloActivo.numero_modulo) ||
                (rMod && String(rMod) === String(moduloActivo.id_modulo))
              );
            });
            break;
          }
        } catch {
          /* probar siguiente endpoint */
        }
      }

      const desdeEvalModulo = leerStorageRevision(
        `expediente_evaluaciones_${estudiante.estudianteId}_m${moduloActivo.numero_modulo}`,
        null
      );
      const listaEval = desdeEvalModulo
        ? Object.values(desdeEvalModulo).map((item, idx) => ({
            id:
              item.id_evidencia ||
              `eval-${estudiante.estudianteId}-m${moduloActivo.numero_modulo}-${idx}`,
            titulo: item.tipo || item.titulo || `Evidencia ${idx + 1}`,
            descripcion: item.comentario || item.observacion || "",
            estado: normalizarEstadoEv(item.estado),
            archivo: item.archivosBD?.[0]?.url || "",
            archivos: item.archivosBD || [],
            fechaCreacion: item.fecha || fechaActual(),
            seleccionada: true,
            desdeBD: true,
          }))
        : [];

      const combinadas = [...registrosBD, ...listaEval];

      if (combinadas.length > 0) {
        const normalizadas = combinadas.map((row, idx) => {
          const titulo =
            row.titulo ||
            row.tipo_evidencia ||
            row.tipo ||
            row.nombre_evidencia ||
            `Evidencia ${idx + 1}`;
          const archs = Array.isArray(row.archivos)
            ? row.archivos.map((f, i) =>
                typeof f === "string"
                  ? {
                      id: `f-${row.id ?? idx}-${i}`,
                      name: f.split("/").pop() || `archivo_${i + 1}`,
                      url: f,
                      esFoto: esImagen(f),
                      seleccionada: true,
                    }
                  : {
                      id: f.id ?? `f-${row.id ?? idx}-${i}`,
                      name:
                        f.nombre_archivo ||
                        f.name ||
                        f.nombre ||
                        `archivo_${i + 1}`,
                      url: f.url || f.ruta || f.path || "",
                      esFoto: esImagen(
                        f.nombre_archivo || f.name || f.url || "",
                        f.mime_type || f.type
                      ),
                      seleccionada: f.seleccionada !== false,
                    }
              )
            : [];

          return {
            id: String(
              row.id_evidencia ??
                row.id ??
                `bd-${estudiante.estudianteId}-m${moduloActivo.numero_modulo}-${idx}`
            ),
            titulo,
            descripcion:
              row.descripcion ?? row.comentario ?? row.observacion ?? "",
            fechaLimite: row.fecha_limite || row.fechaLimite || "",
            estado: normalizarEstadoEv(row.estado_revision ?? row.estado),
            archivo: row.archivo || row.url || row.ruta || archs[0]?.url || "",
            archivos: archs,
            fechaCreacion: String(
              row.fecha_creacion || row.created_at || row.fecha || fechaActual()
            ).slice(0, 10),
            seleccionada: row.seleccionada !== false,
            desdeBD: true,
          };
        });

        setEvidencias((prev) => {
          const prevLista = prev[claveModulo] || [];
          const manuales = prevLista.filter((x) => !x.desdeBD);
          const unificados = [
            ...normalizadas.map((nItem) => {
              const previa = prevLista.find(
                (p) => p.id === nItem.id || p.titulo === nItem.titulo
              );
              return previa
                ? {
                    ...nItem,
                    seleccionada: previa.seleccionada !== false,
                    estado: previa.estado || nItem.estado,
                  }
                : nItem;
            }),
            ...manuales,
          ];
          const next = {
            ...prev,
            [claveModulo]: unificados,
          };
          guardarStorageRevision(keyEvidencias, next);
          return next;
        });
      }
    } finally {
      setCargandoEvBD(false);
    }
  }, [estudiante, moduloActivo, claveModulo, keyEvidencias]);

  useEffect(() => {
    cargarEvidenciasDeModulo();
  }, [cargarEvidenciasDeModulo]);

  const moduloYaCalificado = Boolean(moduloActivo?.adjuntado);
  const evaluacionActual = evaluaciones[claveModulo] || {};
  const notaCalculada = calcularNota(evaluacionActual);
  const criteriosCompletados = CRITERIOS.filter(
    (criterio) => Number(evaluacionActual[criterio.id]) > 0
  ).length;

  const tareasActuales = evidencias[claveModulo] || [];
  const evidenciasElegidas = tareasActuales.filter(
    (e) => e.seleccionada !== false
  );
  const tareasAprobadas = tareasActuales.filter(
    (e) => e.estado === "Aprobado"
  ).length;
  const tareasPendientes = tareasActuales.filter(
    (e) => e.estado === "Pendiente"
  ).length;
  const avanceEvidencias = tareasActuales.length
    ? Math.round((tareasAprobadas / tareasActuales.length) * 100)
    : 0;

  const empresaActual =
    empresaPorModulo[claveModulo] ??
    moduloActivo?.empresa ??
    "Empresa no registrada";
  const horasAcumuladasActuales = Number(
    horasPorModulo[claveModulo] ?? moduloActivo?.horas_acumuladas ?? 0
  );
  const horasRequeridasActuales = Number(
    moduloActivo?.horas_requeridas ?? 160
  );
  const estadoPortafolioActual =
    portafolioPorModulo[claveModulo] ??
    moduloActivo?.estado_portafolio ??
    "Pendiente de revisión";
  const verificadoDocenteActual = Boolean(
    verificadoPorModulo[claveModulo] ?? moduloActivo?.verificado_docente ?? false
  );

  const portafolioConforme = ["conforme", "aprobado", "validado"].some((k) =>
    String(estadoPortafolioActual).toLowerCase().includes(k)
  );
  const horasConformes =
    horasAcumuladasActuales > 0 &&
    horasAcumuladasActuales >= horasRequeridasActuales;
  const notaAprobatoria = notaCalculada >= 13;
  const tieneEvidencias = evidenciasElegidas.length > 0;

  const listoParaConstancia =
    verificadoDocenteActual &&
    notaAprobatoria &&
    tieneEvidencias &&
    portafolioConforme;

  const actualizarNivel = (criterioId, nivel) => {
    if (moduloYaCalificado) return;
    setEvaluaciones((prev) => ({
      ...prev,
      [claveModulo]: {
        ...(prev[claveModulo] || {}),
        [criterioId]: nivel,
      },
    }));
  };

  const setsetterSafe = (setter, valor) => {
    setter((prev) => ({
      ...prev,
      [claveModulo]: valor,
    }));
  };

  const crearEvidencia = (event) => {
    event.preventDefault();
    if (!nuevaEvidencia.titulo.trim()) {
      mostrarAviso("error", "Escribe el nombre de la evidencia.");
      return;
    }

    const registro = {
      id: `evidencia-m${moduloActivo.numero_modulo}-${Date.now()}`,
      titulo: nuevaEvidencia.titulo.trim(),
      descripcion: nuevaEvidencia.descripcion.trim(),
      fechaLimite: nuevaEvidencia.fechaLimite,
      estado: "Pendiente",
      archivo: "",
      archivos: [],
      fechaCreacion: fechaActual(),
      seleccionada: true,
      desdeBD: false,
      id_modulo: moduloActivo.id_modulo,
      numero_modulo: moduloActivo.numero_modulo,
    };

    setEvidencias((prev) => ({
      ...prev,
      [claveModulo]: [...(prev[claveModulo] || []), registro],
    }));

    setNuevaEvidencia({
      titulo: "",
      descripcion: "",
      fechaLimite: "",
    });
    setModalEvidencia(false);
    mostrarAviso(
      "ok",
      `Evidencia creada y vinculada al ${moduloActivo.nombre_modulo}.`
    );
  };

  const alternarSeleccionEvidencia = (id) => {
    setEvidencias((prev) => ({
      ...prev,
      [claveModulo]: (prev[claveModulo] || []).map((e) =>
        e.id === id ? { ...e, seleccionada: !(e.seleccionada !== false) } : e
      ),
    }));
  };

  const adjuntarArchivosAEvidencia = (evId, fileList) => {
    if (!fileList?.length) return;
    const nuevos = Array.from(fileList).map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      name: f.name,
      url: URL.createObjectURL(f),
      esFoto: esImagen(f.name, f.type),
      seleccionada: true,
    }));

    setEvidencias((prev) => ({
      ...prev,
      [claveModulo]: (prev[claveModulo] || []).map((e) =>
        e.id === evId
          ? {
              ...e,
              archivo: e.archivo || nuevos[0]?.url || "",
              archivos: [...(e.archivos || []), ...nuevos],
            }
          : e
      ),
    }));
  };

  const cambiarEstadoEvidencia = (id, estado) => {
    setEvidencias((prev) => ({
      ...prev,
      [claveModulo]: (prev[claveModulo] || []).map((e) =>
        e.id === id ? { ...e, estado } : e
      ),
    }));
  };

  const eliminarEvidencia = (id) => {
    setEvidencias((prev) => ({
      ...prev,
      [claveModulo]: (prev[claveModulo] || []).filter((e) => e.id !== id),
    }));
    mostrarAviso("ok", "Evidencia eliminada.");
  };

  const guardarCalificacion = async () => {
    if (!estudiante || !moduloActivo) return;

    if (moduloYaCalificado) {
      mostrarAviso(
        "error",
        `La evaluación del ${moduloActivo.nombre_modulo} ya fue adjuntada al expediente.`
      );
      return;
    }

    if (criteriosCompletados !== CRITERIOS.length) {
      mostrarAviso(
        "error",
        "Completa todos los criterios de evaluación antes de guardar."
      );
      return;
    }

    try {
      setGuardando(true);

      const detalle = CRITERIOS.map((criterio) => ({
        criterio: criterio.nombre,
        peso: criterio.peso,
        nivel: Number(evaluacionActual[criterio.id]),
        nivel_nombre:
          NIVELES.find(
            (nivel) => nivel.valor === Number(evaluacionActual[criterio.id])
          )?.nombre || "",
      }));

      const notaFinal = Number(notaCalculada.toFixed(2));
      const obsFinal = observaciones[claveModulo] || "";
      const estadoExpedienteModulo = listoParaConstancia
        ? "Verificado"
        : verificadoDocenteActual && !notaAprobatoria
          ? "Observado"
          : notaAprobatoria
            ? "En revisión"
            : "Observado";
      const estadoConstanciaModulo = listoParaConstancia
        ? "Listo para generar"
        : "Incompleto";

      const payload = {
        estudiante_id: estudiante.estudianteId,
        id_estudiante: estudiante.estudianteId,
        id_modulo: moduloActivo.id_modulo,
        numero_modulo: moduloActivo.numero_modulo,
        id_expediente: moduloActivo.id_expediente ?? estudiante.idExpediente,
        id_docente_asesor: moduloActivo.id_docente_asesor ?? null,
        empresa_nombre: empresaActual,
        horas_acumuladas: horasAcumuladasActuales,
        horas_requeridas: horasRequeridasActuales,
        estado_portafolio: estadoPortafolioActual,
        verificado_docente: verificadoDocenteActual,
        listo_para_constancia: listoParaConstancia,
        estado_constancia: estadoConstanciaModulo,
        estado_efsrt: estadoExpedienteModulo,
        nota: notaFinal,
        calificacion: notaFinal,
        comentario: obsFinal,
        observaciones: obsFinal,
        logros: logros[claveModulo] || "",
        aspectos_mejora: mejoras[claveModulo] || "",
        detalle_evaluacion: detalle,
        evidencias: tareasActuales.map((e) => ({
          id: e.id,
          titulo: e.titulo,
          descripcion: e.descripcion || "",
          archivo: e.archivo || e.archivos?.[0]?.url || "",
          estado: e.estado,
          seleccionada: e.seleccionada !== false,
          id_modulo: moduloActivo.id_modulo,
          numero_modulo: moduloActivo.numero_modulo,
        })),
        evidencias_seleccionadas: evidenciasElegidas.map((e) => e.id),
        avance: avanceEvidencias,
        adjuntar_expediente: true,
        cerrar_constancia: listoParaConstancia,
      };

      const rutasCandidatas = [
        "/efsrt/calificaciones",
        "/calificaciones-efsrt",
        "/calificaciones",
        "/evaluaciones-efsrt",
      ];

      let guardadoEnServidor = false;
      for (const ruta of rutasCandidatas) {
        try {
          await api.post(ruta, payload, {
            headers: obtenerHeadersRevision(),
          });
          guardadoEnServidor = true;
          break;
        } catch (err) {
          const status = err?.response?.status;
          if (status && status !== 404 && status !== 405) {
            throw err;
          }
        }
      }

      const registroModulo = {
        ...payload,
        nombre_modulo: moduloActivo.nombre_modulo,
        docente_asignado: moduloActivo.docente_asignado,
        docente_responsable: moduloActivo.docente_asignado,
        estado_revision: notaFinal >= 13 ? "Aprobado" : "Observado",
        fecha: fechaActual(),
        guardadoEnServidor,
      };

      guardarStorageRevision(
        `expediente_calificacion_${estudiante.estudianteId}_m${moduloActivo.numero_modulo}`,
        registroModulo
      );
      if (moduloActivo.id_modulo) {
        guardarStorageRevision(
          `expediente_calificacion_${estudiante.estudianteId}_${moduloActivo.id_modulo}`,
          registroModulo
        );
        guardarStorageRevision(
          `expediente_efsrt_${estudiante.estudianteId}_${moduloActivo.id_modulo}`,
          registroModulo
        );
      }

      setEstudiantes((prev) => {
        const base = Array.isArray(prev) ? prev : [];
        const actualizados = base.map((e) => {
          if (e.id !== estudiante.id) return e;
          const modulosAct = (e.modulos || modulosEstudiante).map((m) =>
            Number(m.numero_modulo) === Number(moduloActivo.numero_modulo)
              ? {
                  ...m,
                  nota: notaFinal,
                  comentario: obsFinal,
                  empresa: empresaActual,
                  horas_acumuladas: horasAcumuladasActuales,
                  estado_portafolio: estadoPortafolioActual,
                  verificado_docente: verificadoDocenteActual,
                  listo_para_constancia: listoParaConstancia,
                  adjuntado: true,
                }
              : m
          );
          const todosCalificados = modulosAct.every((m) => m.adjuntado);
          return {
            ...e,
            modulos: modulosAct,
            empresa: empresaActual,
            horasAcumuladas: horasAcumuladasActuales,
            estadoPortafolio: estadoPortafolioActual,
            nota: notaFinal,
            adjuntado: todosCalificados || e.adjuntado,
            comentario: obsFinal || e.comentario,
          };
        });

        CACHE_REVISION_MEM.estudiantes = actualizados;
        guardarStorageRevision(keyEstudiantes, actualizados);
        return actualizados;
      });

      clearApiCache();
      window.dispatchEvent(new Event("expediente:actualizado"));
      window.dispatchEvent(new Event("revision:actualizada"));

      const mensajeOk = listoParaConstancia
        ? `Evaluación y verificación de ${estudiante.nombre} (${moduloActivo.nombre_modulo}) registradas. Expediente listo para constancia.`
        : `Evaluación de ${estudiante.nombre} (${moduloActivo.nombre_modulo} · ${formatoNota(notaFinal)}/20) registrada en el expediente (${estadoConstanciaModulo}).`;

      mostrarAviso("ok", mensajeOk);
      if (onGuardadoExitoso) {
        onGuardadoExitoso(mensajeOk);
      }
    } catch (error) {
      console.error("Error al guardar evaluación:", error);
      const mensaje =
        error?.response?.data?.message ||
        "No se pudo guardar la evaluación en el servidor.";
      mostrarAviso("error", mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const secciones = [
    {
      id: "evaluacion",
      nombre: "Evaluación",
      descripcion: "Rúbrica y verificación",
      icono: ClipboardCheck,
    },
    {
      id: "evidencias",
      nombre: "Evidencias",
      descripcion: `${evidenciasElegidas.length}/${tareasActuales.length} elegidas`,
      icono: FileText,
    },
    {
      id: "resultados",
      nombre: "Resultados",
      descripcion: listoParaConstancia
        ? "Listo para constancia"
        : "Resumen y estado final",
      icono: ChartNoAxesCombined,
    },
  ];

  return (
    <div className={`min-h-full w-full ${fondo} p-3 sm:p-5`}>
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Volver a estudiantes a revisión
          </button>

          {setVista && (
            <button
              type="button"
              onClick={() => setVista("Dashboard")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Dashboard
            </button>
          )}
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

        <section className={`rounded-2xl border p-4 shadow-sm ${surface}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold">
                Módulos EFSRT del estudiante y docente asignado
              </h2>
              <p className={`text-xs ${muted}`}>
                Cada módulo es distinto al expediente: revisa empresa, horas, portafolio, evidencias y verifica antes de pasar a constancia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {modulosEstudiante.map((mod) => {
              const esActivo =
                Number(mod.numero_modulo) === Number(moduloActivo.numero_modulo);
              return (
                <button
                  key={mod.numero_modulo}
                  type="button"
                  onClick={() => {
                    setNumeroModuloActivo(mod.numero_modulo);
                    setSeccion("evaluacion");
                    setAviso(null);
                  }}
                  className={`rounded-xl border p-3 text-left transition ${
                    esActivo
                      ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/15"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-blue-700">
                      {mod.nombre_modulo}
                    </span>
                    <EstadoEtiquetaRevision
                      estado={mod.adjuntado ? "Completado" : "Pendiente"}
                    />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-700">
                    <UserCheck size={13} className="shrink-0 text-emerald-600" />
                    Docente: {mod.docente_asignado}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                    <Building2 size={12} className="shrink-0 text-indigo-600" />
                    {mod.empresa}
                  </p>
                  {mod.nota !== null && mod.nota !== undefined && (
                    <p className="mt-1 text-[11px] font-bold text-emerald-700">
                      Nota registrada: {formatoNota(mod.nota)} / 20
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section
          className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}
        >
          <div className="bg-gradient-to-r from-[#173c83] to-[#2866c7] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <AvatarRevision estudiante={estudiante} grande />

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                    Revisión · {moduloActivo.nombre_modulo}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold">
                    {estudiante.expediente}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                      listoParaConstancia
                        ? "bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-200/40"
                        : "bg-amber-400/20 text-amber-100 ring-1 ring-amber-200/30"
                    }`}
                  >
                    {listoParaConstancia
                      ? "Listo para constancia"
                      : "Pendiente para constancia"}
                  </span>
                </div>

                <h1 className="text-xl font-extrabold sm:text-2xl">
                  {estudiante.nombre}
                </h1>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-100">
                  <span className="flex items-center gap-1.5">
                    <UserRound size={14} />
                    DNI: {estudiante.dni}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={14} />
                    {estudiante.carrera}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} />
                    {moduloActivo.nombre_modulo}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UserCheck size={14} />
                    Docente: {moduloActivo.docente_asignado}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 sm:min-w-36">
                <p className="text-xs text-blue-100">Nota calculada</p>
                <p className="mt-1 text-4xl font-extrabold">
                  {formatoNota(notaCalculada)}
                </p>
                <p className="mt-1 text-xs text-blue-100">De 20 puntos</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Building2 size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] ${muted}`}>Centro de prácticas</p>
                <input
                  type="text"
                  disabled={moduloYaCalificado}
                  value={empresaActual}
                  onChange={(e) =>
                    setsetterSafe(setEmpresaPorModulo, e.target.value)
                  }
                  className="mt-0.5 w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold outline-none focus:border-blue-300 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Clock3 size={19} />
              </div>
              <div>
                <p className={`text-[11px] ${muted}`}>Horas acumuladas</p>
                <div className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    disabled={moduloYaCalificado}
                    value={horasAcumuladasActuales}
                    onChange={(e) =>
                      setsetterSafe(
                        setHorasPorModulo,
                        Math.max(0, Number(e.target.value || 0))
                      )
                    }
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 outline-none"
                  />
                  <span className={`text-xs ${muted}`}>
                    / {horasRequeridasActuales} h
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <FolderCheck size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] ${muted}`}>Portafolio / Evidencias</p>
                <select
                  disabled={moduloYaCalificado}
                  value={estadoPortafolioActual}
                  onChange={(e) =>
                    setsetterSafe(setPortafolioPorModulo, e.target.value)
                  }
                  className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="Pendiente de revisión">
                    Pendiente de revisión
                  </option>
                  <option value="En revisión">En revisión</option>
                  <option value="Conforme">Conforme</option>
                  <option value="Observado">Observado</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <ShieldCheck size={19} />
              </div>
              <div>
                <p className={`text-[11px] ${muted}`}>Constancia (Admin)</p>
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    listoParaConstancia
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {listoParaConstancia ? "Listo para generar" : "Incompleto"}
                </span>
              </div>
            </div>
          </div>

          <nav className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3 sm:p-4">
            {secciones.map((item) => {
              const Icono = item.icono;
              const activa = seccion === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSeccion(item.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    activa
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`rounded-xl p-2 ${
                      activa
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icono size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{item.nombre}</p>
                    <p className="mt-0.5 text-[11px] opacity-75">
                      {item.descripcion}
                    </p>
                  </div>

                  {activa && <CheckCircle2 size={17} />}
                </button>
              );
            })}
          </nav>
        </section>

        {seccion === "evaluacion" && (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_320px]">
            <section
              className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${surface}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                      <ClipboardCheck size={19} />
                    </div>
                    <h2 className="font-bold">
                      Rúbrica de evaluación · {moduloActivo.nombre_modulo}
                    </h2>
                  </div>
                  <p className={`mt-2 text-xs ${muted}`}>
                    Docente asignado: <strong>{moduloActivo.docente_asignado}</strong> · Empresa: <strong>{empresaActual}</strong> · {evidenciasElegidas.length} evidencias elegidas.
                  </p>
                </div>

                {moduloYaCalificado && (
                  <EstadoEtiquetaRevision estado="Completado" />
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-blue-800">
                      Verificación del docente para constancia
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Confirma si has verificado la rúbrica, evidencias, portafolio y horas del módulo para habilitar la constancia al administrador.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={moduloYaCalificado}
                    onClick={() =>
                      setsetterSafe(
                        setVerificadoPorModulo,
                        !verificadoDocenteActual
                      )
                    }
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                      verificadoDocenteActual
                        ? "border-emerald-300 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {verificadoDocenteActual ? (
                      <CheckSquare size={15} />
                    ) : (
                      <Square size={15} />
                    )}
                    {verificadoDocenteActual
                      ? "Verificado por docente"
                      : "Marcar como verificado"}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {CRITERIOS.map((criterio, index) => {
                  const nivelSeleccionado = Number(
                    evaluacionActual[criterio.id] || 0
                  );

                  return (
                    <div
                      key={criterio.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-600">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">
                              {criterio.nombre}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              {criterio.descripcion}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          {criterio.peso}% del total
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {NIVELES.map((nivel) => {
                          const activo = nivelSeleccionado === nivel.valor;

                          return (
                            <button
                              key={nivel.valor}
                              type="button"
                              disabled={moduloYaCalificado}
                              onClick={() =>
                                actualizarNivel(criterio.id, nivel.valor)
                              }
                              className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${
                                activo
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-bold ${
                                    activo ? "text-blue-700" : "text-slate-700"
                                  }`}
                                >
                                  {nivel.nombre}
                                </span>

                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    activo
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {nivel.valor}
                                </span>
                              </div>

                              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                                {nivel.descripcion}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo label="Logros destacados">
                  <textarea
                    rows={3}
                    disabled={moduloYaCalificado}
                    value={logros[claveModulo] || ""}
                    onChange={(e) =>
                      setsetterSafe(setLogros, e.target.value)
                    }
                    placeholder="Describe los principales logros del estudiante..."
                    className={inputRevisionClass}
                  />
                </Campo>

                <Campo label="Aspectos por mejorar">
                  <textarea
                    rows={3}
                    disabled={moduloYaCalificado}
                    value={mejoras[claveModulo] || ""}
                    onChange={(e) =>
                      setsetterSafe(setMejoras, e.target.value)
                    }
                    placeholder="Indica los aspectos que debe fortalecer..."
                    className={inputRevisionClass}
                  />
                </Campo>
              </div>

              <div className="mt-4">
                <Campo label="Observaciones generales del docente">
                  <textarea
                    rows={4}
                    disabled={moduloYaCalificado}
                    value={observaciones[claveModulo] || ""}
                    onChange={(e) =>
                      setsetterSafe(setObservaciones, e.target.value)
                    }
                    placeholder="Escribe aquí tus observaciones sobre el desempeño del estudiante..."
                    className={inputRevisionClass}
                  />
                </Campo>
              </div>
            </section>

            <aside className="space-y-4">
              <div
                className={`rounded-2xl border p-5 shadow-sm ${surface}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Resumen de evaluación</h3>
                  <Target className="text-blue-600" size={20} />
                </div>

                <div className="mt-5 text-center">
                  <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-[9px] border-blue-100 bg-blue-50">
                    <span className="text-4xl font-extrabold text-blue-700">
                      {formatoNota(notaCalculada)}
                    </span>
                    <span className="mt-1 text-xs font-semibold text-blue-600">
                      / 20 puntos
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-bold">
                    {notaAprobatoria
                      ? "Desempeño aprobatorio"
                      : "En proceso de evaluación"}
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {moduloActivo.nombre_modulo} · Nota calculada
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className={muted}>Criterios completados</span>
                    <strong>
                      {criteriosCompletados}/{CRITERIOS.length}
                    </strong>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${
                          (criteriosCompletados / CRITERIOS.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className={muted}>Verificación docente</span>
                    <strong
                      className={
                        verificadoDocenteActual
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {verificadoDocenteActual ? "Verificado" : "Pendiente"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={muted}>Portafolio</span>
                    <strong>{estadoPortafolioActual}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={muted}>Horas</span>
                    <strong>
                      {horasAcumuladasActuales} / {horasRequeridasActuales} h
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={muted}>Constancia (Admin)</span>
                    <strong
                      className={
                        listoParaConstancia
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {listoParaConstancia ? "Listo" : "Incompleto"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${surface}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-600" />
                  <h3 className="text-sm font-bold">Checklist de constancia</h3>
                </div>
                <ul className={`mt-2.5 space-y-1.5 text-xs ${muted}`}>
                  <li>
                    {notaAprobatoria ? "✓" : "•"} Nota aprobatoria (≥ 13)
                  </li>
                  <li>
                    {tieneEvidencias ? "✓" : "•"} Evidencia elegida (
                    {evidenciasElegidas.length})
                  </li>
                  <li>
                    {portafolioConforme ? "✓" : "•"} Portafolio conforme
                  </li>
                  <li>
                    {verificadoDocenteActual ? "✓" : "•"} Verificado por docente
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSeccion("evidencias")}
                className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                Revisar evidencias ({evidenciasElegidas.length})
                <ChevronRight size={18} />
              </button>
            </aside>
          </div>
        )}

        {seccion === "evidencias" && (
          <section
            className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${surface}`}
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
                    <FileText size={19} />
                  </div>
                  <h2 className="font-bold">
                    Evidencias · {moduloActivo.nombre_modulo}
                  </h2>
                </div>
                <p className={`mt-2 text-xs ${muted}`}>
                  Marca las evidencias/fotos/archivos que deseas adjuntar y calificar para {estudiante.nombre}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cargarEvidenciasDeModulo}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw
                    size={15}
                    className={cargandoEvBD ? "animate-spin" : ""}
                  />
                  Recargar
                </button>

                <button
                  type="button"
                  disabled={moduloYaCalificado}
                  onClick={() => setModalEvidencia(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus size={17} />
                  Nueva evidencia
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  titulo: "Elegidas para calificar",
                  cantidad: evidenciasElegidas.length,
                  icono: CheckSquare,
                  fondo: "bg-blue-50 text-blue-600",
                },
                {
                  titulo: "Pendientes",
                  cantidad: tareasPendientes,
                  icono: Clock3,
                  fondo: "bg-amber-50 text-amber-600",
                },
                {
                  titulo: "Aprobadas",
                  cantidad: tareasAprobadas,
                  icono: CheckCircle2,
                  fondo: "bg-emerald-50 text-emerald-600",
                },
              ].map((item) => {
                const Icono = item.icono;

                return (
                  <div
                    key={item.titulo}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div className={`rounded-xl p-3 ${item.fondo}`}>
                      <Icono size={20} />
                    </div>
                    <div>
                      <p className={`text-xs ${muted}`}>{item.titulo}</p>
                      <p className="mt-1 text-2xl font-extrabold">
                        {item.cantidad}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold">
                Evidencias registradas ({tareasActuales.length})
              </h3>

              <select
                value={filtroEvidencia}
                onChange={(e) => setFiltroEvidencia(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
              >
                <option>Todas</option>
                <option>Pendiente</option>
                <option>En revisión</option>
                <option>Aprobado</option>
                <option>Observado</option>
              </select>
            </div>

            {tareasActuales.filter(
              (e) =>
                filtroEvidencia === "Todas" || e.estado === filtroEvidencia
            ).length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 py-14 text-center">
                <FileText className="mx-auto text-slate-300" size={38} />
                <h3 className="mt-3 text-sm font-bold">
                  No hay evidencias para este módulo
                </h3>
                <p className={`mt-1 text-xs ${muted}`}>
                  Crea o adjunta evidencias para {moduloActivo.nombre_modulo}.
                </p>
                <button
                  type="button"
                  onClick={() => setModalEvidencia(true)}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Crear evidencia
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {tareasActuales
                  .filter(
                    (e) =>
                      filtroEvidencia === "Todas" || e.estado === filtroEvidencia
                  )
                  .map((evidencia, index) => {
                    const elegida = evidencia.seleccionada !== false;
                    return (
                      <article
                        key={evidencia.id}
                        className={`rounded-2xl border p-4 transition ${
                          elegida
                            ? "border-blue-300 bg-blue-50/30"
                            : "border-slate-200 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="flex min-w-0 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                alternarSeleccionEvidencia(evidencia.id)
                              }
                              title={
                                elegida
                                  ? "Elegida para revisar/calificar"
                                  : "Marcar evidencia"
                              }
                              className="mt-1 shrink-0 text-blue-600"
                            >
                              {elegida ? (
                                <CheckSquare size={20} />
                              ) : (
                                <Square size={20} className="text-slate-400" />
                              )}
                            </button>

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                              <FileText size={19} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold">
                                  {evidencia.titulo}
                                </h4>
                                <EstadoEtiquetaRevision
                                  estado={evidencia.estado}
                                />
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                    elegida
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {elegida
                                    ? "Elegida para revisión"
                                    : "No elegida"}
                                </span>
                              </div>

                              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                {evidencia.descripcion ||
                                  "Sin descripción adicional."}
                              </p>

                              {Array.isArray(evidencia.archivos) &&
                                evidencia.archivos.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap gap-2">
                                    {evidencia.archivos.map((f, fIdx) => (
                                      <span
                                        key={f.id || `${f.name}-${fIdx}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                                      >
                                        {f.esFoto ? (
                                          <ImageIcon
                                            size={12}
                                            className="text-blue-600"
                                          />
                                        ) : (
                                          <Paperclip
                                            size={12}
                                            className="text-slate-500"
                                          />
                                        )}
                                        <span className="max-w-[180px] truncate">
                                          {f.name}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <CalendarDays size={13} />
                                  Fecha límite:{" "}
                                  {evidencia.fechaLimite || "No establecida"}
                                </span>
                                <span>Evidencia {index + 1}</span>
                              </div>
                            </div>
                          </div>

                          {!moduloYaCalificado && (
                            <button
                              type="button"
                              onClick={() => eliminarEvidencia(evidencia.id)}
                              className="flex items-center gap-1 self-end text-xs font-semibold text-rose-500 hover:text-rose-700 sm:self-auto"
                            >
                              <Trash2 size={15} />
                              Eliminar
                            </button>
                          )}
                        </div>

                        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                              <Paperclip size={13} />
                              Adjuntar fotos/archivos
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif"
                                onChange={(e) => {
                                  adjuntarArchivosAEvidencia(
                                    evidencia.id,
                                    e.target.files
                                  );
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                            </label>
                            {evidencia.archivo && (
                              <a
                                href={evidencia.archivo}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                              >
                                <Eye size={13} />
                                Ver archivo
                              </a>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              disabled={moduloYaCalificado}
                              value={evidencia.estado}
                              onChange={(e) =>
                                cambiarEstadoEvidencia(
                                  evidencia.id,
                                  e.target.value
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 disabled:bg-slate-100"
                            >
                              <option>Pendiente</option>
                              <option>En revisión</option>
                              <option>Aprobado</option>
                              <option>Observado</option>
                            </select>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {seccion === "resultados" && (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_340px]">
            <section
              className={`rounded-2xl border p-5 shadow-sm ${surface}`}
            >
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <ChartNoAxesCombined size={20} />
                </div>
                <div>
                  <h2 className="font-bold">
                    Resumen de resultados · {moduloActivo.nombre_modulo}
                  </h2>
                  <p className={`mt-0.5 text-xs ${muted}`}>
                    Docente asignado: {moduloActivo.docente_asignado} · Empresa: {empresaActual}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-600">
                    Calificación final calculada
                  </p>
                  <p className="mt-2 text-4xl font-extrabold text-blue-800">
                    {formatoNota(notaCalculada)}
                    <span className="ml-1 text-base font-semibold">/20</span>
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-600">
                    Evidencias aprobadas
                  </p>
                  <p className="mt-2 text-4xl font-extrabold text-emerald-800">
                    {avanceEvidencias}%
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {evidenciasElegidas.length} elegidas · {tareasAprobadas} de{" "}
                    {tareasActuales.length} aprobadas
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-bold">Desglose de criterios</h3>

                <div className="mt-3 space-y-4">
                  {CRITERIOS.map((criterio) => {
                    const nivel = Number(evaluacionActual[criterio.id] || 0);
                    const puntos = (nivel / 4) * criterio.peso * 0.2;

                    return (
                      <div key={criterio.id}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold">
                            {criterio.nombre}
                          </span>
                          <span className="text-xs font-bold text-blue-600">
                            {nivel ? puntos.toFixed(2) : "—"} pts
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: `${(nivel / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div
                className={`rounded-2xl border p-5 shadow-sm ${surface}`}
              >
                <div className="flex items-center gap-2">
                  <Award className="text-amber-500" size={20} />
                  <h3 className="text-sm font-bold">Estado de constancia</h3>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
                  <p
                    className={`text-lg font-extrabold ${
                      listoParaConstancia
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {listoParaConstancia
                      ? "Listo para constancia"
                      : "Aún no listo para constancia"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Requiere nota ≥ 13, evidencia, portafolio conforme y verificación docente.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <CheckCircle2 size={15} />
                      Rúbrica completa
                    </span>
                    <strong>
                      {criteriosCompletados === CRITERIOS.length ? "Sí" : "No"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <UserCheck size={15} />
                      Verificado por docente
                    </span>
                    <strong>{verificadoDocenteActual ? "Sí" : "No"}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <FolderCheck size={15} />
                      Portafolio conforme
                    </span>
                    <strong>{portafolioConforme ? "Sí" : "No"}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <LockKeyhole size={15} />
                      Expediente ({moduloActivo.nombre_modulo})
                    </span>
                    <strong>
                      {moduloYaCalificado ? "Adjuntado" : "Pendiente"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 ${surface}`}>
                <h3 className="text-sm font-bold">Siguiente paso</h3>
                <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
                  Al registrar en el expediente, el módulo quedará guardado con su calificación y estado de constancia para el administrador.
                </p>

                <button
                  type="button"
                  onClick={() => setSeccion("evaluacion")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  Revisar evaluación
                  <ChevronRight size={15} />
                </button>
              </div>
            </aside>
          </div>
        )}

        <div
          className={`sticky bottom-2 z-20 flex flex-col justify-between gap-3 rounded-2xl border p-3 shadow-lg sm:flex-row sm:items-center sm:px-5 ${surface}`}
        >
          <div className="flex items-center gap-2">
            {moduloYaCalificado ? (
              <LockKeyhole size={18} className="text-emerald-600" />
            ) : (
              <Save size={18} className="text-blue-600" />
            )}

            <div>
              <p className="text-xs font-bold">
                {moduloYaCalificado
                  ? `Evaluación registrada · ${moduloActivo.nombre_modulo}`
                  : `¿Terminaste la evaluación del ${moduloActivo.nombre_modulo}?`}
              </p>
              <p className={`mt-0.5 text-[11px] ${muted}`}>
                {moduloYaCalificado
                  ? "Esta evaluación ya fue adjuntada al expediente de este módulo."
                  : `${evidenciasElegidas.length} evidencias elegidas · ${
                      listoParaConstancia
                        ? "Listo para constancia"
                        : "Revisa requisitos de constancia"
                    }`}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setSeccion("resultados")}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Ver resultados
            </button>

            <button
              type="button"
              onClick={guardarCalificacion}
              disabled={
                guardando ||
                moduloYaCalificado ||
                criteriosCompletados !== CRITERIOS.length
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {guardando ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Send size={16} />
              )}
              {guardando
                ? "Guardando..."
                : moduloYaCalificado
                  ? "Evaluación registrada"
                  : "Registrar en expediente"}
            </button>
          </div>
        </div>
      </div>

      {modalEvidencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#173c83] p-5 text-white">
              <div>
                <h2 className="font-bold">
                  Asignar nueva evidencia · {moduloActivo.nombre_modulo}
                </h2>
                <p className="mt-1 text-xs text-blue-100">
                  Actividad para {estudiante.nombre}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalEvidencia(false)}
                className="rounded-lg p-2 transition hover:bg-white/15"
                aria-label="Cerrar"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={crearEvidencia} className="space-y-4 p-5">
              <Campo label="Nombre de la evidencia *">
                <input
                  autoFocus
                  value={nuevaEvidencia.titulo}
                  onChange={(e) =>
                    setNuevaEvidencia((prev) => ({
                      ...prev,
                      titulo: e.target.value,
                    }))
                  }
                  placeholder="Ej. Informe de actividades del módulo"
                  className={inputRevisionClass}
                  required
                />
              </Campo>

              <Campo label="Descripción e indicaciones">
                <textarea
                  rows={4}
                  value={nuevaEvidencia.descripcion}
                  onChange={(e) =>
                    setNuevaEvidencia((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Describe qué debe presentar el estudiante..."
                  className={inputRevisionClass}
                />
              </Campo>

              <Campo label="Fecha límite de entrega">
                <input
                  type="date"
                  min={fechaActual()}
                  value={nuevaEvidencia.fechaLimite}
                  onChange={(e) =>
                    setNuevaEvidencia((prev) => ({
                      ...prev,
                      fechaLimite: e.target.value,
                    }))
                  }
                  className={inputRevisionClass}
                />
              </Campo>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalEvidencia(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Crear y asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}