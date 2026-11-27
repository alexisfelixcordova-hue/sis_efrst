import { useState, useEffect, useMemo } from "react";
import {
  UserRound,
  FolderOpen,
  CalendarDays,
  Clock3,
  Building2,
  FileText,
  History,
  BookOpen,
  ClipboardList,
  MessageSquareText,
  ChevronRight,
  GraduationCap,
  MapPin,
  BriefcaseBusiness,
  Eye,
  RefreshCw,
  CircleUserRound,
  CalendarClock,
  Layers3,
  FileCheck2,
  Info,
  Award,
  CheckCircle2,
} from "lucide-react";

import CabeceraExpediente from "./componentes/CabeceraExpediente";
import ResumenAlumno from "./componentes/ResumenAlumno";
import DatosPersonales, { sinVacios } from "./componentes/DatosPersonales";
import DocumentosAlumnos from "./componentes/DocumentosAlumnos";
import api from "../../../api/axios.js";
import {
  normalizarNombreModulo,
  publicarModuloSistema,
  useModuloSistema,
} from "../../../utils/moduloSistema.js";

const leerJSON = (key, fallback = null) => {
  try {
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const textoValido = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return "";
  const s = String(val).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
    return "";
  }
  return s;
};

const primerTexto = (...valores) => {
  for (const v of valores) {
    const limpio = textoValido(v);
    if (limpio) return limpio;
  }
  return "";
};

const numeroValido = (...valores) => {
  for (const v of valores) {
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      return n;
    }
  }
  return 0;
};

const leerEvidenciasEstudiante = (idEstudiante) => {
  if (!idEstudiante) return [];
  const lista = [];
  try {
    const claves = [
      ...Object.keys(sessionStorage),
      ...Object.keys(localStorage),
    ].filter(
      (k) =>
        k.startsWith("docente_evidencias_asignadas_v1") ||
        k.startsWith("evidencias_efsrt_")
    );

    for (const k of claves) {
      const data = leerJSON(k, null);
      if (!data) continue;

      if (Array.isArray(data)) {
        data.forEach((ev, idx) => {
          const estEv = ev?.id_estudiante ?? ev?.estudiante_id;
          if (!estEv || String(estEv) === String(idEstudiante)) {
            lista.push({
              id: ev.id_evidencia ?? ev.id ?? `${k}-${idx}`,
              nombre: primerTexto(
                ev.titulo,
                ev.nombre,
                ev.tipo_evidencia,
                ev.tipo,
                `Evidencia ${idx + 1}`
              ),
              descripcion: primerTexto(ev.descripcion, ev.observacion),
              fecha: primerTexto(ev.fechaCreacion, ev.fecha, ev.created_at).slice(
                0,
                10
              ),
              archivo: primerTexto(ev.archivo, ev.url, ev.nombre_archivo),
              archivo_url: primerTexto(ev.archivo, ev.url),
              nota: ev.nota ?? ev.calificacion ?? null,
              estado_revision: primerTexto(
                ev.estado_revision,
                ev.estado,
                ev.revisado ? "Revisado" : ""
              ),
              id_modulo: ev.id_modulo ?? ev.modulo_id ?? null,
              numero_modulo: ev.numero_modulo ?? ev.modulo_numero ?? null,
            });
          }
        });
        continue;
      }

      if (typeof data === "object") {
        for (const [idClave, evs] of Object.entries(data)) {
          if (!Array.isArray(evs)) continue;
          const partesClave = String(idClave).split("-");
          const claveCoincide =
            String(idClave) === String(idEstudiante) ||
            String(idClave).startsWith(`${idEstudiante}-`);

          if (claveCoincide) {
            const modInferido =
              partesClave.length > 1 ? Number(partesClave[1]) : null;

            evs.forEach((ev, idx) => {
              if (ev?.seleccionada === false) return;
              lista.push({
                id: ev.id ?? `ev-${idx}`,
                nombre: primerTexto(
                  ev.titulo,
                  ev.nombre,
                  `Evidencia ${idx + 1}`
                ),
                descripcion: primerTexto(ev.descripcion, ev.observacion),
                fecha: primerTexto(ev.fechaCreacion, ev.fecha).slice(0, 10),
                archivo: primerTexto(ev.archivo, ev.url, ev.nombre_archivo),
                archivo_url: primerTexto(ev.archivo, ev.url),
                nota: ev.nota ?? ev.calificacion ?? null,
                estado_revision: primerTexto(
                  ev.estado_revision,
                  ev.estado,
                  ev.revisado ? "Revisado" : ""
                ),
                id_modulo: ev.id_modulo ?? ev.modulo_id ?? null,
                numero_modulo:
                  ev.numero_modulo ??
                  ev.modulo_numero ??
                  (Number.isFinite(modInferido) && modInferido > 0
                    ? modInferido
                    : null),
              });
            });
          }
        }
      }
    }
  } catch {
    /* ignorar */
  }
  return lista;
};

const leerRevisionPorModulo = (idEstudiante, numModulo, idModulo) => {
  if (!idEstudiante) return null;

  const clavesEspecificas = [
    `expediente_calificacion_${idEstudiante}_m${numModulo}`,
    `expediente_calificacion_${idEstudiante}_${numModulo}`,
    idModulo ? `expediente_calificacion_${idEstudiante}_${idModulo}` : null,
    `revision_efsrt_${idEstudiante}_m${numModulo}`,
    `revision_efsrt_${idEstudiante}_${numModulo}`,
    idModulo ? `revision_efsrt_${idEstudiante}_${idModulo}` : null,
  ].filter(Boolean);

  for (const clave of clavesEspecificas) {
    const dato = leerJSON(clave, null);
    if (dato && typeof dato === "object") {
      return { dato, esGenerica: false };
    }
  }

  const clavesGenericas = [
    `expediente_calificacion_${idEstudiante}`,
    `revision_efsrt_${idEstudiante}`,
  ];

  for (const clave of clavesGenericas) {
    const dato = leerJSON(clave, null);
    if (dato && typeof dato === "object") {
      const modDato = Number(
        dato.numero_modulo ?? dato.modulo_numero ?? dato.id_modulo ?? dato.modulo_id
      );
      if (modDato && (modDato === Number(numModulo) || String(modDato) === String(idModulo))) {
        return { dato, esGenerica: false };
      }
      if (!modDato) {
        return { dato, esGenerica: true };
      }
    }
  }

  return null;
};

const leerAsignacionLocalModulo = (idEstudiante, idModulo, numModulo) => {
  if (!idEstudiante) return null;
  const claves = [
    `expediente_efsrt_${idEstudiante}_${idModulo}`,
    `expediente_efsrt_${idEstudiante}_${numModulo}`,
    `expediente_efsrt_${idEstudiante}_m${numModulo}`,
    `asignacion_efsrt_${idEstudiante}_${idModulo}`,
    `asignacion_efsrt_${idEstudiante}_${numModulo}`,
    `asignacion_efsrt_${idEstudiante}_m${numModulo}`,
  ];
  for (const clave of claves) {
    const dato = leerJSON(clave, null);
    if (dato && typeof dato === "object") {
      return dato;
    }
  }
  return null;
};

const listaDe = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return [];
};

const leerLista = (res) => listaDe(res?.data);

const esVerdadero = (v) =>
  v === true || v === 1 || v === "1" || v === "t" || v === "true";

const ROMANOS = ["I", "II", "III"];

const MODULOS_CATALOGO = [
  {
    id_modulo: 1,
    numero_modulo: 1,
    nombre_modulo: "Módulo I",
    horas_requeridas: 160,
  },
  {
    id_modulo: 2,
    numero_modulo: 2,
    nombre_modulo: "Módulo II",
    horas_requeridas: 160,
  },
  {
    id_modulo: 3,
    numero_modulo: 3,
    nombre_modulo: "Módulo III",
    horas_requeridas: 160,
  },
];

const detectarNumeroModulo = (mod, indice = 0) => {
  const directo = Number(mod?.numero_modulo ?? mod?.numero);
  if ([1, 2, 3].includes(directo)) return directo;

  const texto = String(
    mod?.nombre_modulo || mod?.modulo_nombre || mod?.modulo || ""
  ).toLowerCase();
  if (/\b(3|iii|3°)\b/i.test(texto)) return 3;
  if (/\b(2|ii|2°)\b/i.test(texto)) return 2;
  if (/\b(1|i|1°)\b/i.test(texto)) return 1;

  const idNum = Number(mod?.id_modulo ?? mod?.modulo_id);
  if ([1, 2, 3].includes(idNum)) return idNum;

  return Math.min(3, Math.max(1, indice + 1));
};

const normalizarModulo = (mod, indice = 0) => {
  const numeroModulo = detectarNumeroModulo(mod, indice);
  const idModulo = mod?.id_modulo ?? mod?.modulo_id ?? mod?.id ?? numeroModulo;

  const empObj =
    typeof mod?.empresa === "object" && mod.empresa ? mod.empresa : null;
  const docObj =
    typeof mod?.docente === "object" && mod.docente
      ? mod.docente
      : typeof mod?.asesor === "object" && mod.asesor
        ? mod.asesor
        : null;
  const supObj =
    typeof mod?.supervisor === "object" && mod.supervisor
      ? mod.supervisor
      : typeof mod?.responsable_empresa === "object" &&
          mod.responsable_empresa
        ? mod.responsable_empresa
        : null;
  const revObj =
    typeof mod?.revision === "object" && mod.revision ? mod.revision : null;

  const notaExtraida =
    mod?.nota ??
    mod?.calificacion ??
    mod?.nota_final ??
    mod?.promedio ??
    revObj?.nota ??
    revObj?.calificacion ??
    null;

  const estadoRevisionExtraido = primerTexto(
    mod?.estado_revision,
    revObj?.estado,
    revObj?.estado_revision
  );

  const comentarioRevisionExtraido = primerTexto(
    mod?.comentario_revision,
    mod?.observacion_revision,
    mod?.comentario,
    revObj?.observaciones,
    revObj?.comentario
  );

  return {
    id_expediente:
      mod?.id_expediente ??
      mod?.id ??
      `exp-${idModulo}-${numeroModulo}`,

    id_modulo: idModulo,
    numero_modulo: numeroModulo,

    nombre_modulo: normalizarNombreModulo(
      primerTexto(
        mod?.nombre_modulo,
        mod?.modulo_nombre,
        mod?.modulo,
        `Módulo ${ROMANOS[numeroModulo - 1] || numeroModulo}`
      )
    ),

    periodo_academico: primerTexto(
      mod?.periodo_academico,
      mod?.periodo,
      mod?.semestre,
      mod?.anio
    ),

    estado_efsrt: primerTexto(mod?.estado_efsrt),
    portafolio: esVerdadero(
      mod?.portafolio_fisico_revisado ?? mod?.portafolio_conforme ?? mod?.portafolio
    ),
    fecha_validacion: primerTexto(mod?.fecha_validacion),
    id_empresa: mod?.id_empresa ?? empObj?.id_empresa ?? null,
    id_docente_asesor: mod?.id_docente_asesor ?? null,
    updated_at: primerTexto(mod?.updated_at),

    estado_modulo: primerTexto(
      mod?.estado_efsrt,
      mod?.estado_modulo,
      mod?.estado,
      "No efectuó"
    ),

    empresa_entidad: primerTexto(
      mod?.empresa_entidad,
      mod?.empresa_razon_social,
      mod?.empresa_institucion,
      mod?.empresa_nombre,
      mod?.razon_social,
      mod?.nombre_comercial,
      mod?.entidad_nombre,
      mod?.entidad,
      empObj?.razon_social,
      empObj?.nombre_comercial,
      empObj?.nombre
    ),

    fecha_inicio: primerTexto(
      mod?.fecha_inicio,
      mod?.fecha_inicio_practicas,
      mod?.fecha_inicio_efsrt,
      mod?.inicio
    ),

    fecha_fin: primerTexto(
      mod?.fecha_fin,
      mod?.fecha_fin_practicas,
      mod?.fecha_fin_efsrt,
      mod?.fecha_termino,
      mod?.fin
    ),

    horas_requeridas: Number(
      mod?.horas_requeridas && Number(mod.horas_requeridas) > 0
        ? mod.horas_requeridas
        : 160
    ),

    horas_acumuladas: numeroValido(
      mod?.horas_acumuladas,
      mod?.horas_realizadas,
      mod?.horas_completadas,
      mod?.hrs,
      mod?.horas,
      revObj?.horas_acumuladas,
      revObj?.horas_realizadas,
      revObj?.hrs,
      revObj?.horas,
      0
    ),

    nota:
      notaExtraida !== null && notaExtraida !== undefined && notaExtraida !== ""
        ? notaExtraida
        : null,

    estado_revision: estadoRevisionExtraido,
    comentario_revision: comentarioRevisionExtraido,

    descripcion: primerTexto(
      mod?.descripcion,
      mod?.descripcion_modulo,
      mod?.detalle_modulo,
      mod?.resumen
    ),

    actividades: Array.isArray(mod?.actividades) ? mod.actividades : [],
    historial: Array.isArray(mod?.historial) ? mod.historial : [],
    seguimientos: Array.isArray(mod?.seguimientos) ? mod.seguimientos : [],
    evidencias: Array.isArray(mod?.evidencias) ? mod.evidencias : [],

    observaciones: primerTexto(
      mod?.observaciones,
      mod?.observacion,
      comentarioRevisionExtraido
    ),

    docente: primerTexto(
      mod?.docente_responsable,
      mod?.docente_nombre,
      mod?.nombre_docente,
      mod?.asesor_nombre,
      mod?.docente_asesor_nombre,
      [mod?.docente_nombres, mod?.docente_apellidos].filter(Boolean).join(" "),
      mod?.asesor,
      typeof mod?.docente === "string" ? mod.docente : "",
      docObj
        ? `${docObj.nombres || docObj.nombre || ""} ${docObj.apellidos || ""}`.trim()
        : ""
    ),

    responsable: primerTexto(
      mod?.responsable,
      mod?.supervisor,
      mod?.supervisor_nombre,
      mod?.jefe_inmediato,
      mod?.encargado_empresa,
      typeof mod?.supervisor === "string" ? mod.supervisor : "",
      supObj
        ? `${supObj.nombres || supObj.nombre || ""} ${supObj.apellidos || ""}`.trim()
        : ""
    ),

    lugar: primerTexto(
      mod?.lugar,
      mod?.ubicacion,
      mod?.empresa_direccion,
      mod?.direccion_entidad,
      mod?.direccion_empresa,
      mod?.direccion,
      empObj?.direccion,
      empObj?.ubicacion,
      empObj?.distrito
    ),

    created_at: primerTexto(mod?.created_at),
  };
};

const completarModulos = (lista, catalogoModulos = []) => {
  const baseCatalogo =
    Array.isArray(catalogoModulos) && catalogoModulos.length > 0
      ? catalogoModulos
      : MODULOS_CATALOGO;

  const porNumero = new Map();
  lista.forEach((m, idx) => {
    const num = detectarNumeroModulo(m, idx);
    const existente = porNumero.get(num);
    porNumero.set(num, existente ? { ...existente, ...m } : m);
  });

  const resultado = [];
  for (let num = 1; num <= 3; num += 1) {
    const modCatalogo = baseCatalogo.find(
      (cm) => Number(cm.numero_modulo ?? cm.numero ?? cm.id_modulo) === num
    );
    const modActual = porNumero.get(num);

    if (modActual) {
      resultado.push(
        normalizarModulo(
          {
            ...modCatalogo,
            ...modActual,
            numero_modulo: num,
            id_modulo: modActual.id_modulo ?? modCatalogo?.id_modulo ?? num,
            nombre_modulo: primerTexto(
              modActual.nombre_modulo,
              modCatalogo?.nombre_modulo,
              `Módulo ${ROMANOS[num - 1]}`
            ),
            horas_requeridas:
              modActual.horas_requeridas && Number(modActual.horas_requeridas) > 0
                ? modActual.horas_requeridas
                : modCatalogo?.horas_requeridas || 160,
          },
          num - 1
        )
      );
    } else {
      resultado.push(
        normalizarModulo(
          {
            id_modulo: modCatalogo?.id_modulo ?? num,
            numero_modulo: num,
            nombre_modulo: primerTexto(
              modCatalogo?.nombre_modulo,
              `Módulo ${ROMANOS[num - 1]}`
            ),
            horas_requeridas: modCatalogo?.horas_requeridas || 160,
          },
          num - 1
        )
      );
    }
  }

  return resultado;
};

const fechaFormato = (fecha) => {
  const limpia = textoValido(fecha);
  if (!limpia) return "No registrado";

  const date = new Date(`${limpia}`.slice(0, 10) + "T12:00:00");

  if (Number.isNaN(date.getTime())) {
    return limpia;
  }

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const obtenerNombre = (item) =>
  primerTexto(
    item.nombre,
    item.titulo,
    item.actividad,
    item.descripcion,
    item.nombre_documento,
    "Registro sin título"
  );

const obtenerFecha = (item) =>
  primerTexto(
    item.fecha,
    item.fecha_registro,
    item.created_at,
    item.fecha_inicio
  );

const ESTILOS = `
@keyframes expedienteEntrada {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.exp-entrada {
  animation: expedienteEntrada .4s ease both;
}

.exp-tarjeta {
  transition: border-color .2s ease,
              box-shadow .2s ease,
              transform .2s ease;
}

.exp-tarjeta:hover {
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .exp-entrada,
  .exp-tarjeta {
    animation: none;
    transition: none;
  }
}
`;

const IconoSeccion = ({ icon: Icon, color = "blue" }) => {
  const colores = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        colores[color]
      }`}
    >
      <Icon size={19} />
    </div>
  );
};

const Seccion = ({ titulo, descripcion, icon: Icon, children }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-3">
      <IconoSeccion icon={Icon} />
      <div>
        <h3 className="text-sm font-bold text-slate-800">
          {titulo}
        </h3>
        {descripcion && (
          <p className="text-xs text-slate-500">
            {descripcion}
          </p>
        )}
      </div>
    </div>

    {children}
  </section>
);

const CampoInformacion = ({ etiqueta, valor, icon: Icon }) => (
  <div className="min-w-0 space-y-1">
    <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
      {Icon && <Icon size={13} />}
      {etiqueta}
    </p>

    <p className="break-words text-sm font-semibold text-slate-700">
      {textoValido(valor) || "No registrado"}
    </p>
  </div>
);

const Estado = ({ valor }) => {
  const texto = textoValido(valor) || "Sin información";
  const estado = texto.toLowerCase();

  let estilo = "bg-slate-100 text-slate-600";

  if (
    estado.includes("activo") ||
    estado.includes("proceso")
  ) {
    estilo = "bg-blue-50 text-blue-700";
  }

  if (
    estado.includes("finalizado") ||
    estado.includes("completado") ||
    estado.includes("revisado") ||
    estado.includes("aprobado") ||
    estado.includes("conforme") ||
    estado.includes("validado") ||
    estado.includes("apto") ||
    estado.includes("listo") ||
    estado.includes("emitid")
  ) {
    estilo = "bg-emerald-50 text-emerald-700";
  }

  if (
    estado.includes("observado") ||
    estado.includes("verificar") ||
    estado.includes("pendiente") ||
    estado.includes("incomplet")
  ) {
    estilo = "bg-amber-50 text-amber-700";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${estilo}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {texto}
    </span>
  );
};

export default function ExpedienteAlumno({
  estudiante,
  onVolver,
  darkMode = false,
}) {
  const moduloSistema = useModuloSistema();
  const estudianteRespaldo = useMemo(() => {
    if (estudiante && typeof estudiante === "object") return estudiante;
    return leerJSON("expediente_alumno_actual", null);
  }, [estudiante]);

  const idEstudiante =
    estudianteRespaldo?.id_estudiante ?? estudianteRespaldo?.id;

  const [detalle, setDetalle] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [moduloActivoId, setModuloActivoId] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState("resumen");
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [syncTick, setSyncTick] = useState(0);

  const cargar = async () => {
    if (!idEstudiante) return;

    setCargando(true);
    setAviso("");

    try {
      const [
        resAlumno,
        resModulos,
        resEv,
        resCatalogoMod,
        resEmpresas,
        resDocentes,
      ] = await Promise.all([
        api.get(`/estudiantes/${idEstudiante}`).catch(() => null),
        api.get(`/estudiantes/${idEstudiante}/expediente-modulos`).catch(() => null),
        api.get("/evidencias-efsrt", { params: { id_estudiante: idEstudiante } }).catch(() => null),
        api.get("/modulos-profesionales").catch(() => null),
        api.get("/empresas", { params: { per_page: 500, todos: 1 } }).catch(() => null),
        api.get("/docentes", { params: { per_page: 500, todos: 1 } }).catch(() => null),
      ]);

      let alumnoBackend = null;
      if (resAlumno) {
        const dataAlumno = resAlumno.data;
        alumnoBackend =
          dataAlumno.data ??
          dataAlumno.estudiante ??
          dataAlumno;
        setDetalle(alumnoBackend);
      }

      let catalogoBD = MODULOS_CATALOGO;
      if (resCatalogoMod) {
        const dataCat = resCatalogoMod.data;
        const rawCat = Array.isArray(dataCat)
          ? dataCat
          : Array.isArray(dataCat?.data)
            ? dataCat.data
            : [];
        if (rawCat.length > 0) {
          catalogoBD = rawCat;
        }
      }

      const [empresasBD, docentesBD] = [
        leerLista(resEmpresas),
        leerLista(resDocentes),
      ];
      const empresaPorId = new Map(
        empresasBD.map((e) => [String(e.id_empresa ?? e.id), e])
      );
      const docentePorUsuario = new Map();
      const docentePorOtro = new Map();
      docentesBD.forEach((d) => {
        if (d.id_usuario != null) docentePorUsuario.set(String(d.id_usuario), d);
        [d.id_docente, d.id].forEach((v) => {
          if (v != null && !docentePorOtro.has(String(v)))
            docentePorOtro.set(String(v), d);
        });
      });

      let evidenciasAPI = [];
      if (resEv) {
        const dataEv = resEv.data;
        const rawEv = Array.isArray(dataEv)
          ? dataEv
          : Array.isArray(dataEv?.data)
            ? dataEv.data
            : [];
        evidenciasAPI = rawEv.map((ev, i) => ({
          id: ev.id_evidencia ?? ev.id ?? `ev-api-${i}`,
          nombre: primerTexto(
            ev.titulo,
            ev.tipo_evidencia,
            ev.tipo,
            `Evidencia ${i + 1}`
          ),
          descripcion: primerTexto(ev.descripcion, ev.comentario),
          fecha: primerTexto(ev.fecha_creacion, ev.created_at, ev.fecha).slice(
            0,
            10
          ),
          archivo: primerTexto(ev.archivo, ev.url, ev.nombre_archivo),
          archivo_url: primerTexto(ev.archivo, ev.url),
          nota: ev.nota ?? ev.calificacion ?? null,
          estado_revision: primerTexto(
            ev.estado_revision,
            ev.estado,
            ev.revisado ? "Revisado" : ""
          ),
          id_modulo: ev.id_modulo ?? ev.modulo_id ?? null,
          numero_modulo: ev.numero_modulo ?? ev.modulo_numero ?? null,
        }));
      }

      const evidenciasLocales = leerEvidenciasEstudiante(idEstudiante);
      const todasEvidencias =
        evidenciasAPI.length > 0 ? evidenciasAPI : evidenciasLocales;

      let lista = [];
      if (resModulos) {
        const dataModulos = resModulos.data;
        const registros = Array.isArray(dataModulos)
          ? dataModulos
          : Array.isArray(dataModulos.data)
            ? dataModulos.data
            : [];
        lista = registros.map((r, i) => normalizarModulo(r, i));
      }

      const baseAlumno = {
        ...sinVacios(estudianteRespaldo),
        ...sinVacios(alumnoBackend),
      };

      const expAnidado =
        typeof baseAlumno?.expediente === "object" && baseAlumno.expediente
          ? baseAlumno.expediente
          : {};
      const asigAnidada =
        typeof baseAlumno?.asignacion === "object" && baseAlumno.asignacion
          ? baseAlumno.asignacion
          : {};
      const empAnidada =
        typeof baseAlumno?.empresa === "object" && baseAlumno.empresa
          ? baseAlumno.empresa
          : {};
      const docAnidado =
        typeof baseAlumno?.docente === "object" && baseAlumno.docente
          ? baseAlumno.docente
          : {};

      const numeroModuloAlumno = detectarNumeroModulo(
        {
          numero_modulo:
            baseAlumno?.numero_modulo ??
            expAnidado?.numero_modulo ??
            asigAnidada?.numero_modulo,
          id_modulo:
            baseAlumno?.id_modulo ??
            expAnidado?.id_modulo ??
            asigAnidada?.id_modulo,
          nombre_modulo:
            baseAlumno?.modulo_nombre ||
            baseAlumno?.modulo ||
            expAnidado?.nombre_modulo,
        },
        0
      );

      if (lista.length === 0) {
        lista = [
          normalizarModulo(
            {
              id_modulo:
                baseAlumno?.id_modulo ??
                expAnidado?.id_modulo ??
                numeroModuloAlumno,
              numero_modulo: numeroModuloAlumno,
              nombre_modulo: primerTexto(
                baseAlumno?.modulo_nombre,
                baseAlumno?.modulo,
                expAnidado?.nombre_modulo,
                `Módulo ${ROMANOS[numeroModuloAlumno - 1] || numeroModuloAlumno}`
              ),
              periodo_academico: primerTexto(
                baseAlumno?.periodo_academico,
                expAnidado?.periodo_academico,
                asigAnidada?.periodo_academico
              ),
              entidad_nombre: primerTexto(
                baseAlumno?.empresa_nombre,
                baseAlumno?.entidad,
                empAnidada?.razon_social,
                empAnidada?.nombre
              ),
              horas_acumuladas: numeroValido(
                baseAlumno?.horas_acumuladas,
                expAnidado?.horas_acumuladas,
                asigAnidada?.horas_acumuladas,
                baseAlumno?.hrs,
                0
              ),
              estado: primerTexto(
                baseAlumno?.estado,
                expAnidado?.estado,
                "No efectuó"
              ),
            },
            numeroModuloAlumno - 1
          ),
        ];
      }

      const moduloObjetivoGenerico =
        todasEvidencias.find((ev) => ev.numero_modulo)?.numero_modulo ||
        lista.find((m) => m.horas_acumuladas > 0 || m.evidencias.length > 0)
          ?.numero_modulo ||
        numeroModuloAlumno ||
        1;

      lista = completarModulos(lista, catalogoBD).map((mod) => {
        const numMod = mod.numero_modulo;
        const asigLocal = leerAsignacionLocalModulo(
          idEstudiante,
          mod.id_modulo,
          numMod
        );
        const revInfo = leerRevisionPorModulo(
          idEstudiante,
          numMod,
          mod.id_modulo
        );
        const revGuardada =
          revInfo &&
          (!revInfo.esGenerica || Number(moduloObjetivoGenerico) === Number(numMod))
            ? revInfo.dato
            : null;

        const evsDelModulo =
          mod.evidencias.length > 0
            ? mod.evidencias
            : todasEvidencias.filter((ev) => {
                if (ev.numero_modulo) {
                  return Number(ev.numero_modulo) === Number(numMod);
                }
                if (ev.id_modulo) {
                  return String(ev.id_modulo) === String(mod.id_modulo);
                }
                return Number(moduloObjetivoGenerico) === Number(numMod);
              });

        const horasRevision = numeroValido(
          revGuardada?.horas_acumuladas,
          revGuardada?.horas_realizadas,
          revGuardada?.horas_completadas,
          revGuardada?.hrs,
          revGuardada?.horas,
          null
        );

        const horasAsignacionLocal = numeroValido(
          asigLocal?.horas_acumuladas,
          asigLocal?.horas_realizadas,
          asigLocal?.hrs,
          asigLocal?.horas,
          null
        );

        const horasAlumnoProp =
          Number(numeroModuloAlumno) === Number(numMod)
            ? numeroValido(
                baseAlumno?.horas_acumuladas,
                expAnidado?.horas_acumuladas,
                asigAnidada?.horas_acumuladas,
                baseAlumno?.hrs,
                null
              )
            : null;

        const horasFinales = Math.max(
          numeroValido(mod.horas_acumuladas, 0),
          horasRevision ?? 0,
          horasAsignacionLocal ?? 0,
          horasAlumnoProp ?? 0
        );

        const horasRequeridasFinales = Math.max(
          1,
          numeroValido(
            mod.horas_requeridas,
            asigLocal?.horas_requeridas,
            revGuardada?.horas_requeridas,
            expAnidado?.horas_requeridas,
            160
          )
        );

        const notaFinal =
          mod.nota !== null && mod.nota !== undefined
            ? mod.nota
            : revGuardada?.nota ??
              revGuardada?.calificacion ??
              (Number(numeroModuloAlumno) === Number(numMod)
                ? baseAlumno?.nota ?? baseAlumno?.calificacion ?? null
                : null);

        const estadoRevFinal = primerTexto(
          mod.estado_revision,
          revGuardada?.estado_revision,
          revGuardada?.estado,
          notaFinal !== null ? "Revisado" : ""
        );

        const comentarioRevFinal = primerTexto(
          mod.comentario_revision,
          revGuardada?.comentario,
          revGuardada?.observacion,
          revGuardada?.observaciones
        );

        const empBD = empresaPorId.get(
          String(
            mod.id_empresa ??
              asigLocal?.id_empresa ??
              asigAnidada?.id_empresa ??
              ""
          )
        );
        const docBD =
          docentePorUsuario.get(
            String(
              mod.id_docente_asesor ??
                asigLocal?.id_docente_asesor ??
                asigAnidada?.id_docente_asesor ??
                ""
            )
          ) ??
          docentePorOtro.get(
            String(
              mod.id_docente_asesor ??
                asigLocal?.id_docente_asesor ??
                asigAnidada?.id_docente_asesor ??
                ""
            )
          );

        const empresaFinal = primerTexto(
          mod.empresa_entidad,
          empBD?.razon_social,
          empBD?.nombre_comercial,
          empBD?.nombre,
          asigLocal?.empresa_institucion,
          asigLocal?.empresa_nombre,
          asigLocal?.empresa,
          expAnidado?.empresa_entidad,
          expAnidado?.empresa_nombre,
          asigAnidada?.empresa_nombre,
          asigAnidada?.empresa,
          baseAlumno?.empresa_nombre,
          baseAlumno?.empresa,
          baseAlumno?.entidad,
          empAnidada?.razon_social,
          empAnidada?.nombre
        );

        const docenteFinal = primerTexto(
          mod.docente,
          docBD
            ? `${docBD.nombres || docBD.nombre || ""} ${docBD.apellidos || ""}`.trim()
            : "",
          asigLocal?.docente_responsable,
          asigLocal?.docente_nombre,
          asigLocal?.asesor,
          expAnidado?.docente_responsable,
          expAnidado?.docente_nombre,
          asigAnidada?.docente_responsable,
          asigAnidada?.asesor,
          baseAlumno?.docente_responsable,
          baseAlumno?.docente_nombre,
          baseAlumno?.asesor,
          baseAlumno?.docente,
          docAnidado
            ? `${docAnidado.nombres || docAnidado.nombre || ""} ${docAnidado.apellidos || ""}`.trim()
            : ""
        );

        const supervisorFinal = primerTexto(
          mod.responsable,
          asigLocal?.responsable,
          asigLocal?.supervisor,
          expAnidado?.responsable,
          expAnidado?.supervisor,
          baseAlumno?.responsable,
          baseAlumno?.supervisor,
          baseAlumno?.jefe_inmediato,
          empAnidada?.representante,
          empAnidada?.supervisor
        );

        const fechaInicioFinal = primerTexto(
          mod.fecha_inicio,
          asigLocal?.fecha_inicio,
          expAnidado?.fecha_inicio,
          asigAnidada?.fecha_inicio,
          baseAlumno?.fecha_inicio,
          baseAlumno?.fecha_inicio_practicas
        );

        const fechaFinFinal = primerTexto(
          mod.fecha_fin,
          asigLocal?.fecha_fin,
          expAnidado?.fecha_fin,
          asigAnidada?.fecha_fin,
          baseAlumno?.fecha_fin,
          baseAlumno?.fecha_fin_practicas
        );

        const periodoFinal = primerTexto(
          mod.periodo_academico,
          asigLocal?.periodo_academico,
          expAnidado?.periodo_academico,
          asigAnidada?.periodo_academico,
          baseAlumno?.periodo_academico,
          baseAlumno?.semestre
        );

        const ubicacionFinal = primerTexto(
          mod.lugar,
          empBD?.direccion,
          empBD?.ubicacion,
          asigLocal?.ubicacion,
          asigLocal?.lugar,
          expAnidado?.ubicacion,
          expAnidado?.lugar,
          asigAnidada?.ubicacion,
          baseAlumno?.ubicacion,
          baseAlumno?.lugar,
          baseAlumno?.direccion_empresa,
          empAnidada?.direccion,
          empAnidada?.ubicacion
        );

        const descripcionFinal = primerTexto(
          mod.descripcion,
          asigLocal?.descripcion,
          expAnidado?.descripcion,
          baseAlumno?.descripcion_modulo,
          baseAlumno?.descripcion
        );

        const observacionesFinales = primerTexto(
          mod.observaciones,
          comentarioRevFinal,
          asigLocal?.observaciones,
          expAnidado?.observaciones
        );

        const portafolioFinal = Boolean(
          mod.portafolio ||
            esVerdadero(revGuardada?.portafolio_conforme) ||
            esVerdadero(revGuardada?.portafolio_fisico_revisado) ||
            esVerdadero(asigLocal?.portafolio_conforme) ||
            esVerdadero(asigLocal?.portafolio_fisico_revisado)
        );

        const estadoModuloFinal = primerTexto(
          revGuardada?.estado_efsrt,
          revGuardada?.estado_modulo,
          revGuardada?.estado,
          mod.estado_efsrt,
          asigLocal?.estado_registro,
          asigLocal?.estado,
          expAnidado?.estado,
          mod.estado_modulo
        );

        return {
          ...mod,
          horas_acumuladas: horasFinales,
          horas_requeridas: horasRequeridasFinales,
          portafolio: portafolioFinal,
          periodo_academico: periodoFinal,
          empresa_entidad: empresaFinal,
          docente: docenteFinal,
          responsable: supervisorFinal,
          fecha_inicio: fechaInicioFinal,
          fecha_fin: fechaFinFinal,
          lugar: ubicacionFinal,
          descripcion: descripcionFinal,
          nota: notaFinal,
          estado_revision: estadoRevFinal,
          comentario_revision: comentarioRevFinal,
          observaciones: observacionesFinales,
          estado_modulo: estadoModuloFinal,
          evidencias: evsDelModulo,
        };
      });

      setModulos(lista);

      setModuloActivoId((actual) => {
        if (actual && lista.some((m) => String(m.id_expediente) === String(actual))) {
          return actual;
        }
        const coincidenteSistema = moduloSistema?.id_modulo
          ? lista.find(
              (modulo) =>
                String(modulo.id_modulo) === String(moduloSistema.id_modulo)
            )
          : null;
        if (coincidenteSistema) return coincidenteSistema.id_expediente;
        const coincidenteAlumno = lista.find(
          (m) => Number(m.numero_modulo) === Number(numeroModuloAlumno)
        );
        return coincidenteAlumno?.id_expediente ?? lista[0]?.id_expediente ?? null;
      });
    } catch (error) {
      setAviso(error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setDetalle(null);
    setModulos([]);
    setModuloActivoId(null);
    setSeccionActiva("resumen");

    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEstudiante, syncTick]);

  useEffect(() => {
    const actualizarSync = () => setSyncTick((n) => n + 1);
    window.addEventListener("expediente:actualizado", actualizarSync);
    window.addEventListener("revision:actualizada", actualizarSync);
    window.addEventListener("storage", actualizarSync);
    return () => {
      window.removeEventListener("expediente:actualizado", actualizarSync);
      window.removeEventListener("revision:actualizada", actualizarSync);
      window.removeEventListener("storage", actualizarSync);
    };
  }, []);

  useEffect(() => {
    if (!moduloSistema?.id_modulo) return;
    const coincidente = modulos.find(
      (modulo) =>
        String(modulo.id_modulo) === String(moduloSistema.id_modulo)
    );
    if (coincidente) setModuloActivoId(coincidente.id_expediente);
  }, [moduloSistema?.id_modulo, modulos]);

  const combinado = {
    ...sinVacios(estudianteRespaldo),
    ...sinVacios(detalle),
  };

  const datos = {
    ...combinado,
    direccion: primerTexto(
      combinado.direccion,
      combinado.dir_est,
      combinado.domicilio
    ),
  };

  const nombreCompleto =
    [datos.apellidos, datos.nombres]
      .filter(Boolean)
      .join(", ") ||
    datos.nombre ||
    "Estudiante";

  const moduloActual = useMemo(
    () =>
      modulos.find(
        (m) =>
          String(m.id_expediente) ===
          String(moduloActivoId)
      ) || null,
    [modulos, moduloActivoId]
  );

  const numeroModulo = Math.max(
    1,
    Number(moduloActual?.numero_modulo || 1)
  );

  const romano = ROMANOS[numeroModulo - 1] || String(numeroModulo);

  const horasOk =
    !!moduloActual &&
    moduloActual.horas_acumuladas >= moduloActual.horas_requeridas;
  const portafolioOk = !!moduloActual?.portafolio;
  const validadoOk =
    String(moduloActual?.estado_modulo || "")
      .toLowerCase()
      .includes("validado") ||
    String(moduloActual?.estado_modulo || "")
      .toLowerCase()
      .includes("apto") ||
    String(moduloActual?.estado_modulo || "")
      .toLowerCase()
      .includes("listo") ||
    String(moduloActual?.estado_modulo || "")
      .toLowerCase()
      .includes("emitid");

  const totalHoras = modulos.reduce(
    (total, m) => total + m.horas_acumuladas,
    0
  );

  const totalDocumentos = modulos.reduce(
    (total, m) => total + m.evidencias.length,
    0
  );

  const docenteActivo = moduloActual?.docente || datos.docente_nombre || datos.docente || datos.asesor || null;

  const datosCabecera = {
    ...datos,
    horas_acumuladas: totalHoras,
    docente: docenteActivo,
  };

  const actividades = moduloActual?.actividades || [];
  const evidencias = moduloActual?.evidencias || [];
  const seguimientos = moduloActual?.seguimientos || [];
  const historial = moduloActual?.historial || [];
  const observaciones = moduloActual?.observaciones || "";

  const documentosAlumno = useMemo(() => {
    if (Array.isArray(datos.documentos) && datos.documentos.length > 0) {
      return datos.documentos;
    }
    return evidencias.map((ev) => ({
      id: ev.id,
      nombre: ev.nombre,
      fecha: ev.fecha,
      estado: ev.estado_revision || (ev.nota !== null ? "Aprobado" : "Pendiente"),
    }));
  }, [datos.documentos, evidencias]);

  const eventos = useMemo(() => {
    if (!moduloActual) return [];

    const registros = [
      ...historial.map((item) => ({
        ...item,
        tipo: item.tipo || "Historial",
      })),

      ...actividades.map((item) => ({
        ...item,
        tipo: "Actividad",
      })),

      ...seguimientos.map((item) => ({
        ...item,
        tipo: "Seguimiento",
      })),
    ];

    if (
      moduloActual.nota !== null ||
      moduloActual.estado_revision ||
      moduloActual.comentario_revision
    ) {
      const partesNota = [];
      if (moduloActual.nota !== null) {
        partesNota.push(`Nota / Calificación: ${moduloActual.nota}`);
      }
      if (moduloActual.estado_revision) {
        partesNota.push(`Estado de revisión: ${moduloActual.estado_revision}`);
      }
      if (moduloActual.comentario_revision) {
        partesNota.push(moduloActual.comentario_revision);
      }

      registros.push({
        nombre: `Revisión registrada · ${moduloActual.nombre_modulo}`,
        descripcion: partesNota.join(" · "),
        tipo: "Revisión",
        fecha: "",
      });
    }

    if (observaciones) {
      registros.push({
        nombre: "Observaciones del módulo",
        descripcion: observaciones,
        tipo: "Observación",
        fecha: "",
      });
    }

    return registros.sort((a, b) => {
      const fa = new Date(obtenerFecha(a) || 0).getTime();
      const fb = new Date(obtenerFecha(b) || 0).getTime();

      return fb - fa;
    });
  }, [moduloActual, historial, actividades, seguimientos, observaciones]);

  const eventosFiltrados = eventos.filter((item) => {
    const texto = [
      obtenerNombre(item),
      item.descripcion,
      item.tipo,
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const secciones = [
    {
      id: "resumen",
      nombre: "Información general",
      icon: Info,
    },
    {
      id: "actividades",
      nombre: "Actividades",
      icon: ClipboardList,
    },
    {
      id: "seguimiento",
      nombre: "Seguimiento",
      icon: History,
    },
    {
      id: "documentos",
      nombre: "Documentación",
      icon: FolderOpen,
    },
  ];

  const panel = darkMode
    ? "border-[#1e335c] bg-[#0b1b3a] text-slate-100"
    : "border-slate-200 bg-white text-slate-800";

  const subpanel = darkMode
    ? "border-[#1e335c] bg-[#0f172a]"
    : "border-slate-200 bg-slate-50";

  const textoSecundario = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  if (!estudianteRespaldo) {
    return (
      <div className="p-5 text-sm text-slate-500">
        No hay un estudiante seleccionado.
        <button
          onClick={onVolver}
          className="ml-2 font-semibold text-blue-600"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className={`exp-entrada space-y-6 ${darkMode ? "text-slate-100" : ""}`}>
      <style>{ESTILOS}</style>

      <CabeceraExpediente
        estudiante={datosCabecera}
        docente={docenteActivo}
        onVolver={onVolver}
        darkMode={darkMode}
        puedeAsignar={false}
      />

      {aviso && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>{aviso}</span>

          <button
            onClick={cargar}
            className="flex shrink-0 items-center gap-2 font-semibold"
          >
            <RefreshCw size={15} />
            Reintentar
          </button>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
        <ResumenAlumno
          estudiante={datos}
          docente={docenteActivo}
          darkMode={darkMode}
        />

        <DatosPersonales
          estudiante={datos}
          darkMode={darkMode}
          puedeEditar={false}
        />
      </div>

      <DocumentosAlumnos
        estudiante={{ ...datos, documentos: documentosAlumno }}
        darkMode={darkMode}
      />

      <div className={`overflow-hidden rounded-2xl border ${panel}`}>
        <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FolderOpen size={24} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                Registro institucional
              </p>

              <h2 className="text-xl font-extrabold">
                Expediente Integral
              </h2>

              <p className={`text-xs ${textoSecundario}`}>
                Historial académico, revisión y seguimiento del estudiante
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-lg border px-3 py-2 font-mono text-xs ${subpanel}`}>
              EXP-{String(idEstudiante).padStart(4, "0")}
            </span>

            <span className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              <CircleUserRound size={14} />
              Expediente individual
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-2 border-t md:grid-cols-4 ${darkMode ? "border-[#1e335c]" : "border-slate-200"}`}>
          {[
            {
              icon: UserRound,
              nombre: "Estudiante",
              valor: nombreCompleto,
            },
            {
              icon: GraduationCap,
              nombre: "Carrera",
              valor:
                datos.carrera_nombre ||
                datos.carrera ||
                datos.programa_estudios ||
                "No registrado",
            },
            {
              icon: Building2,
              nombre: "Centro de prácticas",
              valor: moduloActual?.empresa_entidad || "Sin empresa asignada",
            },
            {
              icon: Layers3,
              nombre: "Módulos",
              valor: `${modulos.length} registrados`,
            },
          ].map((item, i) => (
            <div
              key={item.nombre}
              className={`min-w-0 p-4 ${
                i % 2 === 0 ? "" : "border-l border-slate-200"
              } ${i > 1 ? "border-t md:border-t-0" : ""} ${darkMode ? "border-[#1e335c]" : ""}`}
            >
              <p className={`mb-1 flex items-center gap-1.5 text-[10px] ${textoSecundario}`}>
                <item.icon size={13} />
                {item.nombre}
              </p>

              <p className="truncate text-xs font-bold">
                {item.valor}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            titulo: "Módulos EFSRT",
            valor: modulos.length,
            detalle: "Módulos I, II y III",
            icon: Layers3,
            color: "blue",
          },
          {
            titulo: "Horas registradas",
            valor: totalHoras,
            detalle: "Acumulado de los módulos",
            icon: Clock3,
            color: "violet",
          },
          {
            titulo: "Evidencias / Documentos",
            valor: totalDocumentos,
            detalle: "Archivos y revisiones asociadas",
            icon: FileText,
            color: "emerald",
          },
        ].map((item) => (
          <div
            key={item.titulo}
            className={`exp-tarjeta rounded-2xl border p-4 ${panel}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${textoSecundario}`}>
                  {item.titulo}
                </p>

                <p className="mt-1 text-2xl font-extrabold">
                  {item.valor}
                </p>

                <p className={`mt-1 text-[10px] ${textoSecundario}`}>
                  {item.detalle}
                </p>
              </div>

              <IconoSeccion icon={item.icon} color={item.color} />
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold">
            Historial de módulos EFSRT
          </h2>

          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Selecciona un módulo para consultar su empresa, revisión, nota y evidencias.
          </p>
        </div>

        {cargando ? (
          <div className={`flex items-center justify-center gap-3 rounded-xl border p-10 ${panel}`}>
            <RefreshCw className="animate-spin text-blue-600" size={20} />
            <span className="text-sm">Cargando expediente...</span>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {modulos.map((mod, index) => {
              const activo =
                String(mod.id_expediente) ===
                String(moduloActivoId);

              const numMod = mod.numero_modulo || index + 1;
              const metaHoras = mod.horas_requeridas || 160;
              const porcentaje = metaHoras
                ? Math.min(
                    100,
                    Math.round((mod.horas_acumuladas / metaHoras) * 100)
                  )
                : 0;

              return (
                <button
                  type="button"
                  key={mod.id_expediente}
                  onClick={() => {
                    setModuloActivoId(mod.id_expediente);
                    setSeccionActiva("resumen");
                    setBusqueda("");
                    publicarModuloSistema(mod);
                  }}
                  className={`exp-tarjeta rounded-2xl border p-4 text-left ${
                    activo
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10"
                      : panel
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold ${
                      activo
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      {ROMANOS[numMod - 1] || numMod}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {mod.nota !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          <Award size={12} />
                          Nota: {mod.nota}
                        </span>
                      )}
                      <ChevronRight
                        size={18}
                        className={activo ? "text-blue-600" : textoSecundario}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textoSecundario}`}>
                      {metaHoras} horas requeridas
                    </p>

                    <h3 className="mt-1 text-sm font-bold">
                      {mod.nombre_modulo}
                    </h3>

                    <p className={`mt-1 truncate text-xs ${textoSecundario}`}>
                      {mod.empresa_entidad ||
                        mod.periodo_academico ||
                        "Sin empresa / periodo"}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className={textoSecundario}>
                        Horas registradas
                      </span>

                      <span className="font-bold">
                        {mod.horas_acumuladas} / {metaHoras} h
                      </span>
                    </div>

                    <div className={`h-1.5 overflow-hidden rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Estado valor={mod.estado_modulo} />

                      <span className={`text-[10px] ${textoSecundario}`}>
                        {mod.evidencias.length} evidencias
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {moduloActual && (
        <section className={`overflow-hidden rounded-2xl border ${panel}`}>
          <div className={`border-b p-5 md:p-6 ${darkMode ? "border-[#1e335c] bg-[#0f172a]" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">
                  Expediente / Módulo {romano}
                </p>

                <h2 className="mt-1 text-xl font-extrabold">
                  {moduloActual.nombre_modulo}
                </h2>

                <div className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${textoSecundario}`}>
                  <span className="flex items-center gap-1">
                    <Building2 size={13} />
                    {moduloActual.empresa_entidad || "Sin empresa asignada"}
                  </span>

                  <span className="flex items-center gap-1">
                    <FolderOpen size={13} />
                    EXP-{String(idEstudiante).padStart(4, "0")}-M{moduloActual.numero_modulo}
                  </span>

                  {moduloActual.nota !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      <Award size={13} />
                      Calificación: {moduloActual.nota}
                    </span>
                  )}
                </div>
              </div>

              <Estado valor={moduloActual.estado_modulo} />
            </div>
          </div>

          <div className={`flex gap-1 overflow-x-auto border-b p-2 ${darkMode ? "border-[#1e335c]" : "border-slate-200"}`}>
            {secciones.map((seccion) => {
              const Icon = seccion.icon;
              const activo = seccionActiva === seccion.id;

              return (
                <button
                  key={seccion.id}
                  onClick={() => setSeccionActiva(seccion.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                    activo
                      ? "bg-blue-600 text-white"
                      : `${textoSecundario} hover:bg-slate-100`
                  }`}
                >
                  <Icon size={15} />
                  {seccion.nombre}
                </button>
              );
            })}
          </div>

          <div className="p-5 md:p-7">
            {seccionActiva === "resumen" && (
              <div className="exp-entrada space-y-8">
                <Seccion
                  titulo="Información del módulo"
                  descripcion="Datos del módulo profesional y su avance de EFSRT"
                  icon={Info}
                >
                  <div className={`grid gap-5 rounded-xl border p-5 sm:grid-cols-2 lg:grid-cols-3 ${subpanel}`}>
                    <CampoInformacion
                      etiqueta="Nombre del módulo"
                      valor={moduloActual.nombre_modulo}
                      icon={BookOpen}
                    />

                    <CampoInformacion
                      etiqueta="Estado del EFSRT"
                      valor={moduloActual.estado_modulo}
                      icon={FileCheck2}
                    />

                    <CampoInformacion
                      etiqueta="Horas acumuladas / requeridas"
                      valor={`${moduloActual.horas_acumuladas} / ${moduloActual.horas_requeridas} horas`}
                      icon={Clock3}
                    />

                    <CampoInformacion
                      etiqueta="Portafolio físico"
                      valor={
                        portafolioOk ? "Revisado" : "Pendiente de revisión"
                      }
                      icon={ClipboardList}
                    />

                    <CampoInformacion
                      etiqueta="Fecha de validación"
                      valor={
                        moduloActual.fecha_validacion
                          ? fechaFormato(moduloActual.fecha_validacion)
                          : "Aún no validado"
                      }
                      icon={CalendarClock}
                    />

                    <CampoInformacion
                      etiqueta="Registro creado"
                      valor={
                        moduloActual.created_at
                          ? fechaFormato(moduloActual.created_at)
                          : "Sin registro"
                      }
                      icon={CalendarDays}
                    />
                  </div>
                </Seccion>

                {moduloActual.nota !== null && moduloActual.nota !== undefined && (
                  <Seccion
                    titulo="Resultado de la calificación"
                    descripcion="Nota registrada para este módulo y su estado de revisión"
                    icon={Award}
                  >
                    <div className={`grid gap-4 rounded-xl border p-5 sm:grid-cols-[auto_1fr] sm:items-center ${subpanel}`}>
                      <div className="flex items-center gap-3">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-500/10 text-xl font-extrabold text-blue-600">
                          {Number(moduloActual.nota).toLocaleString("es-PE")}
                        </div>
                        <div>
                          <p className="text-sm font-bold">Nota final</p>
                          <p className={`text-xs ${textoSecundario}`}>Escala vigesimal · máximo 20</p>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          Number(moduloActual.nota) >= NOTA_MINIMA
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {Number(moduloActual.nota) >= NOTA_MINIMA ? "Aprobado" : "Requiere seguimiento"}
                          {moduloActual.estado_revision ? ` · ${moduloActual.estado_revision}` : ""}
                        </span>
                        {moduloActual.comentario_revision && (
                          <p className={`mt-2 break-words text-sm ${textoSecundario}`}>
                            {moduloActual.comentario_revision}
                          </p>
                        )}
                      </div>
                    </div>
                  </Seccion>
                )}

                <Seccion
                  titulo="Centro de prácticas"
                  descripcion="Empresa o institución y docente asesor del módulo"
                  icon={Building2}
                >
                  <div className={`grid gap-5 rounded-xl border p-5 sm:grid-cols-2 lg:grid-cols-3 ${subpanel}`}>
                    <CampoInformacion
                      etiqueta="Empresa o institución"
                      valor={moduloActual.empresa_entidad}
                      icon={BriefcaseBusiness}
                    />

                    <CampoInformacion
                      etiqueta="Ubicación"
                      valor={moduloActual.lugar}
                      icon={MapPin}
                    />

                    <CampoInformacion
                      etiqueta="Docente asesor"
                      valor={moduloActual.docente}
                      icon={GraduationCap}
                    />
                  </div>
                </Seccion>

                <Seccion
                  titulo="Ruta de validación"
                  descripcion="Requisitos para que el módulo quede validado"
                  icon={CheckCircle2}
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <PasoValidacion
                      n={1}
                      cumplido={horasOk}
                      titulo="Horas completadas"
                      detalle={`${moduloActual.horas_acumuladas} de ${moduloActual.horas_requeridas} h`}
                      subpanel={subpanel}
                      secundario={textoSecundario}
                    />
                    <PasoValidacion
                      n={2}
                      cumplido={portafolioOk}
                      titulo="Portafolio físico"
                      detalle={portafolioOk ? "Revisado" : "Pendiente de revisión"}
                      subpanel={subpanel}
                      secundario={textoSecundario}
                    />
                    <PasoValidacion
                      n={3}
                      cumplido={validadoOk}
                      titulo="Validación del EFSRT"
                      detalle={
                        validadoOk && moduloActual.fecha_validacion
                          ? fechaFormato(moduloActual.fecha_validacion)
                          : moduloActual.estado_modulo
                      }
                      subpanel={subpanel}
                      secundario={textoSecundario}
                    />
                  </div>
                </Seccion>

                <Seccion
                  titulo="Resumen documental y revisión"
                  descripcion="Evidencias y observaciones de revisión asociadas al módulo"
                  icon={FileText}
                >
                  <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${subpanel}`}>
                    <div className="flex items-center gap-3">
                      <IconoSeccion
                        icon={FolderOpen}
                        color="blue"
                      />

                      <div>
                        <p className="text-sm font-bold">
                          Evidencias y documentación del módulo
                        </p>

                        <p className={`text-xs ${textoSecundario}`}>
                          {moduloActual.comentario_revision ||
                            "Archivos y registros asociados"}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-bold text-blue-600">
                      {evidencias.length} archivos
                    </span>
                  </div>
                </Seccion>
              </div>
            )}

            {seccionActiva === "actividades" && (
              <div className="exp-entrada space-y-5">
                <Seccion
                  titulo="Actividades realizadas"
                  descripcion="Registro de las actividades desarrolladas durante el módulo"
                  icon={ClipboardList}
                >
                  {actividades.length > 0 ? (
                    <div className="space-y-3">
                      {actividades.map((actividad, i) => (
                        <div
                          key={actividad.id ?? i}
                          className={`rounded-xl border p-4 ${subpanel}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <ClipboardList size={17} />
                            </span>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold">
                                {obtenerNombre(actividad)}
                              </h4>

                              <p className={`mt-1 whitespace-pre-wrap text-xs leading-6 ${textoSecundario}`}>
                                {actividad.descripcion || "Sin descripción adicional."}
                              </p>

                              {obtenerFecha(actividad) && (
                                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-blue-600">
                                  <CalendarDays size={13} />
                                  {fechaFormato(obtenerFecha(actividad))}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EstadoVacio
                      icon={ClipboardList}
                      titulo="Sin actividades registradas"
                      descripcion="Todavía no existen actividades asociadas a este módulo."
                    />
                  )}
                </Seccion>
              </div>
            )}

            {seccionActiva === "seguimiento" && (
              <div className="exp-entrada space-y-6">
                <div>
                  <h3 className="text-sm font-bold">
                    Historial del módulo
                  </h3>

                  <p className={`mt-1 text-xs ${textoSecundario}`}>
                    Consulta cronológica de revisiones, actividades y registros disponibles.
                  </p>
                </div>

                <div className="relative space-y-5 pl-5">
                  {eventosFiltrados.length > 0 ? (
                    <>
                      <div className={`absolute bottom-4 left-[7px] top-2 w-px ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />

                      {eventosFiltrados.map((evento, i) => (
                        <div
                          key={evento.id ?? i}
                          className="relative"
                        >
                          <span className="absolute -left-5 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          </span>

                          <div className={`rounded-xl border p-4 ${subpanel}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-bold">
                                {obtenerNombre(evento)}
                              </span>

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                                {evento.tipo}
                              </span>
                            </div>

                            <p className={`mt-2 whitespace-pre-wrap text-xs leading-6 ${textoSecundario}`}>
                              {evento.descripcion ||
                                evento.observacion ||
                                "Sin descripción adicional."}
                            </p>

                            {obtenerFecha(evento) && (
                              <p className={`mt-3 flex items-center gap-1.5 text-[11px] ${textoSecundario}`}>
                                <CalendarDays size={13} />
                                {fechaFormato(obtenerFecha(evento))}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <EstadoVacio
                      icon={History}
                      titulo="Sin historial registrado"
                      descripcion="Aquí aparecerán los acontecimientos, revisiones y registros cronológicos del estudiante cuando existan datos disponibles."
                    />
                  )}
                </div>

                <Seccion
                  titulo="Observaciones del módulo"
                  descripcion="Anotaciones y comentarios de revisión registrados en el expediente"
                  icon={MessageSquareText}
                >
                  <div className={`rounded-xl border p-4 ${subpanel}`}>
                    <p className={`whitespace-pre-wrap text-sm leading-7 ${textoSecundario}`}>
                      {observaciones ||
                        "No existen observaciones registradas para este módulo."}
                    </p>
                  </div>
                </Seccion>
              </div>
            )}

            {seccionActiva === "documentos" && (
              <div className="exp-entrada space-y-5">
                <Seccion
                  titulo="Documentación y evidencias del módulo"
                  descripcion="Archivos, evidencias y calificaciones asociadas al expediente"
                  icon={FolderOpen}
                >
                  {evidencias.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {evidencias.map((doc, i) => (
                        <div
                          key={doc.id ?? i}
                          className={`flex items-center gap-3 rounded-xl border p-4 ${subpanel}`}
                        >
                          <IconoSeccion
                            icon={FileText}
                            color="blue"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-bold">
                                {obtenerNombre(doc)}
                              </p>
                              {doc.nota !== null && doc.nota !== undefined && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                  Nota: {doc.nota}
                                </span>
                              )}
                            </div>

                            <p className={`mt-1 truncate text-[11px] ${textoSecundario}`}>
                              {doc.archivo ||
                                doc.nombre_archivo ||
                                doc.descripcion ||
                                "Archivo no adjuntado"}
                            </p>

                            {doc.fecha && (
                              <p className="mt-1 text-[10px] text-blue-600">
                                {fechaFormato(doc.fecha)}
                              </p>
                            )}
                          </div>

                          {doc.archivo_url && (
                            <a
                              href={doc.archivo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                              title="Visualizar documento"
                            >
                              <Eye size={17} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EstadoVacio
                      icon={FileText}
                      titulo="Sin documentos asociados"
                      descripcion="No se encontraron evidencias o archivos registrados para este módulo."
                    />
                  )}
                </Seccion>
              </div>
            )}
          </div>
        </section>
      )}

      <div className={`flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center ${darkMode ? "border-[#1e335c]" : "border-slate-200"}`}>
        <div>
          <p className="text-xs font-bold">
            Expediente Integral del Estudiante
          </p>

          <p className={`mt-1 text-[10px] ${textoSecundario}`}>
            Registro institucional de información académica EFSRT
          </p>
        </div>

        <button
          onClick={cargar}
          disabled={cargando}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold transition hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={cargando ? "animate-spin" : ""}
          />
          Actualizar expediente
        </button>
      </div>
    </div>
  );
}

function PasoValidacion({ n, cumplido, titulo, detalle, subpanel, secundario }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${subpanel}`}>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          cumplido
            ? "bg-emerald-500 text-white"
            : "border-2 border-slate-300 text-slate-400"
        }`}
      >
        {cumplido ? <CheckCircle2 size={17} /> : n}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{titulo}</p>
        <p className={`truncate text-xs ${secundario}`}>{detalle}</p>
      </div>
    </div>
  );
}

function EstadoVacio({ icon: Icon, titulo, descripcion }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon size={23} />
      </div>

      <h4 className="mt-4 text-sm font-bold text-slate-700">
        {titulo}
      </h4>

      <p className="mt-1 max-w-sm text-xs leading-6 text-slate-400">
        {descripcion}
      </p>
    </div>
  );
}