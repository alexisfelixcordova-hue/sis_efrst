import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
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
  Award,
  Target,
  X,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Paperclip,
  Eye,
  LockKeyhole,
  Image as ImageIcon,
  UserCheck,
  FolderCheck,
  Check,
  Info,
  MoreVertical,
  Users,
} from "lucide-react";
import {
  publicarModuloSistema,
  useModuloSistema,
} from "../../../utils/moduloSistema";

import api, { invalidateApiCache } from "../../../api/axios";
import {
  LS_REVISION_ESTUDIANTES,
  CACHE_REVISION_MEM,
  AvatarRevision,
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

const canonTexto = (txt = "") =>
  String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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

/* ───────────────────────── Estilo "Classroom" ─────────────────────────
   Verde de acento, grises suaves, tarjetas con borde fino y campos rellenos.
   Para cambiar el acento, edita los valores #188038 / #137333 / #e6f4ea. */
const ESTILOS_RV = `
@keyframes rvUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rvPop { 0% { opacity: 0; transform: scale(.4) rotate(-14deg); } 60% { transform: scale(1.12) rotate(4deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
@keyframes rvMenu { from { opacity: 0; transform: translateY(-6px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes rvToast { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rvBurst { 0% { opacity: 1; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.4); } }
@keyframes rvFade { from { opacity: 0; } to { opacity: 1; } }
.rv-up { opacity: 0; animation: rvUp .4s cubic-bezier(.22,1,.36,1) forwards; }
.rv-pop { animation: rvPop .5s cubic-bezier(.22,1,.36,1) both; }
.rv-menu { animation: rvMenu .15s ease-out both; }
.rv-toast { animation: rvToast .3s ease both; }
.rv-fade { animation: rvFade .2s ease-out both; }
.rv-burst { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; border-radius: 9999px; animation: rvBurst 1.2s ease-out forwards; }
@media (prefers-reduced-motion: reduce) {
  .rv-up, .rv-pop, .rv-menu, .rv-toast, .rv-fade, .rv-burst { animation: none !important; opacity: 1 !important; }
}
`;

const CORTOS = ["Cumplimiento", "Calidad", "Conocimientos", "Autonomía", "Equipo"];

function useMontado(ms = 80) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return m;
}

function AnilloNota({ nota, aprobado, size = 140 }) {
  const montado = useMontado();
  const r = 50;
  const C = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, Number(nota) / 20));
  const rad = (((13 / 20) * 360 - 90) * Math.PI) / 180;
  const x1 = 60 + Math.cos(rad) * (r - 7);
  const y1 = 60 + Math.sin(rad) * (r - 7);
  const x2 = 60 + Math.cos(rad) * (r + 7);
  const y2 = 60 + Math.sin(rad) * (r + 7);
  const color = aprobado ? "#188038" : Number(nota) > 0 ? "#1a73e8" : "#dadce0";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="opacity-10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          transform="rotate(-90 60 60)"
          strokeDasharray={C}
          strokeDashoffset={montado ? C - pct * C : C}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1), stroke .4s" }}
        />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f29900" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-medium tabular-nums leading-none">{formatoNota(nota)}</span>
        <span className="mt-1 text-[10px] opacity-60">de 20 · mín. 13</span>
      </div>
    </div>
  );
}

function RadarCriterios({ valores }) {
  const montado = useMontado(150);
  const n = valores.length;
  const c = 110;
  const R = 74;
  const pt = (i, v) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v];
  };
  const poly = (v) => valores.map((_, i) => pt(i, v).join(",")).join(" ");
  const datos = valores.map((v, i) => pt(i, v / 4).join(",")).join(" ");
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[260px]">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={poly(k)} fill="none" stroke="currentColor" strokeWidth="1" className="opacity-15" />
      ))}
      {valores.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="currentColor" className="opacity-10" />;
      })}
      <g
        style={{
          transformOrigin: `${c}px ${c}px`,
          transform: montado ? "scale(1)" : "scale(.05)",
          opacity: montado ? 1 : 0,
          transition: "transform 1s cubic-bezier(.22,1,.36,1), opacity .6s",
        }}
      >
        <polygon points={datos} fill="rgba(24,128,56,.16)" stroke="#188038" strokeWidth="2" strokeLinejoin="round" />
        {valores.map((v, i) => {
          const [x, y] = pt(i, v / 4);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#188038" />;
        })}
      </g>
      {valores.map((_, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="currentColor" className="opacity-60" fontWeight="600">
            {CORTOS[i]}
          </text>
        );
      })}
    </svg>
  );
}

/* Campo relleno con etiqueta flotante (como los de Classroom) */
function CampoRelleno({ etiqueta, children, k }) {
  return (
    <label className={`block rounded-t-md border-b-2 px-4 pb-2 pt-2 transition-colors focus-within:border-[#188038] ${k.relleno} ${k.lineaCampo}`}>
      <span className={`block text-xs ${k.suave}`}>{etiqueta}</span>
      {children}
    </label>
  );
}

/* Menú de tres puntos (Editar / Eliminar / …) */
function Kebab({ id, abierto, setAbierto, items, k, etiqueta = "Más opciones" }) {
  return (
    <div className="relative" data-kebab>
      <button
        type="button"
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto === id}
        onClick={(e) => { e.stopPropagation(); setAbierto(abierto === id ? null : id); }}
        className={`grid h-9 w-9 place-items-center rounded-full transition ${k.hover} ${abierto === id ? k.relleno : ""}`}
      >
        <MoreVertical size={18} />
      </button>
      {abierto === id && (
        <div role="menu" className={`rv-menu absolute right-0 z-40 mt-1 w-56 rounded-md border py-2 shadow-lg ${k.tarjeta}`}>
          {items.map((it, i) =>
            it === "---" ? (
              <div key={`sep-${i}`} className={`my-2 border-t ${k.borde}`} />
            ) : (
              <button
                key={it.t}
                type="button"
                role="menuitem"
                disabled={it.off}
                onClick={(e) => { e.stopPropagation(); setAbierto(null); it.fn(); }}
                className={`block w-full px-4 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${k.hover} ${it.peligro ? "text-[#d93025]" : ""}`}
              >
                {it.t}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

const colorEstadoEv = (estado, oscuro) => {
  const c = {
    Aprobado: oscuro ? "text-[#81c995]" : "text-[#188038]",
    Observado: oscuro ? "text-[#f28b82]" : "text-[#d93025]",
    "En revisión": oscuro ? "text-[#8ab4f8]" : "text-[#1a73e8]",
    Pendiente: oscuro ? "text-[#9aa0a6]" : "text-[#5f6368]",
  };
  return c[estado] || c.Pendiente;
};

export default function DetalleRevisionEstudiante({
  estudiante,
  setEstudiantes,
  onVolver,
  onGuardadoExitoso,
  darkMode = false,
}) {
  const claveSesion = useMemo(() => obtenerClaveSesionRevision(), []);
  const keyEstudiantes = `${LS_REVISION_ESTUDIANTES}_${claveSesion}`;
  const keyEvidencias = `${LS_EVIDENCIAS}_${claveSesion}`;
  const moduloSistema = useModuloSistema();

  const modulosEstudiante = useMemo(() => {
    if (Array.isArray(estudiante?.modulos) && estudiante.modulos.length > 0) {
      return estudiante.modulos;
    }
    const idModulo = estudiante?.id_modulo ?? estudiante?.moduloId ?? null;
    const numeroModulo = Number(
      estudiante?.numeroModuloInicial ?? estudiante?.numero_modulo ?? idModulo
    );
    const nombreModulo =
      estudiante?.nombre_modulo || estudiante?.modulo_nombre || estudiante?.modulo;
    if (idModulo === null || !nombreModulo) return [];
    return [{
      id_modulo: idModulo,
      numero_modulo: Number.isFinite(numeroModulo) ? numeroModulo : idModulo,
      id_expediente: estudiante?.idExpediente ?? null,
      nombre_modulo: nombreModulo,
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
    }];
  }, [estudiante]);

  const [numeroModuloActivo, setNumeroModuloActivo] = useState(
    () =>
      Number(
        estudiante?.numeroModuloInicial ||
          moduloSistema?.numero_modulo ||
          estudiante?.modulos?.[0]?.numero_modulo ||
          1
      )
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

  useEffect(() => {
    if (!moduloSistema?.id_modulo) return;
    const asignado = modulosEstudiante.find(
      (modulo) =>
        String(modulo.id_modulo) === String(moduloSistema.id_modulo)
    );
    if (asignado) {
      setNumeroModuloActivo(Number(asignado.numero_modulo));
      setAviso(null);
    }
  }, [moduloSistema, modulosEstudiante]);

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
  const [evAbierta, setEvAbierta] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const mostrarAviso = (tipo, mensaje) => {
    setAviso({ tipo, mensaje });
    window.setTimeout(() => setAviso(null), 4500);
  };

  // Cierra los menús de tres puntos al hacer clic fuera
  useEffect(() => {
    const fuera = (e) => {
      if (!e.target.closest("[data-kebab]")) setMenuAbierto(null);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

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

      const storeEvalGlobal = leerStorageRevision(`ev_efsrt_evals_${claveSesion}`, {});
      const dniEst = String(estudiante.dni || "").trim();
      const idEstStr = String(estudiante.estudianteId ?? "");
      const modCanonAct = canonTexto(moduloActivo.nombre_modulo);
      const romanoMod = ROMANOS[Number(moduloActivo.numero_modulo) - 1]?.toLowerCase() || "";

      const listaDesdeEvaluacionEvidencias = Object.entries(storeEvalGlobal || {})
        .filter(([claveStr, val]) => {
          const mismaPersona =
            String(val?.id_estudiante ?? "") === idEstStr ||
            (dniEst && dniEst !== "Sin DNI" && String(val?.dni || "").trim() === dniEst) ||
            claveStr.startsWith(`id:${idEstStr}|`) ||
            (dniEst && dniEst !== "Sin DNI" && claveStr.startsWith(`dni:${dniEst}|`));
          if (!mismaPersona) return false;

          const modValCanon = canonTexto(val?.modulo_key || val?.modulo_nombre || "");
          if (!modValCanon || modValCanon === "general") return true;
          if (modCanonAct && (modCanonAct.includes(modValCanon) || modValCanon.includes(modCanonAct))) {
            return true;
          }
          if (romanoMod && new RegExp(`\\b${romanoMod}\\b`, "i").test(modValCanon)) {
            return true;
          }
          return false;
        })
        .map(([claveStr, val], idx) => {
          const archs = Array.isArray(val?.archivosBD)
            ? val.archivosBD.map((a, i) => ({
                id: a.id || `ev-conn-${idx}-${i}`,
                name: a.name || `evidencia_${i + 1}`,
                url: a.url || "",
                esFoto: Boolean(a.esFoto || esImagen(a.name || a.url || "")),
                seleccionada: a.seleccionada !== false,
              }))
            : [];
          return {
            id: String(val?.id_evidencia || `ev-conn-${claveStr}-${idx}`),
            titulo: val?.tipo || `Evidencia ${idx + 1}`,
            descripcion:
              val?.comentario ||
              (val?.calificacion !== "" && val?.calificacion !== undefined
                ? `Calificación: ${val.calificacion}/20`
                : "Registrada en Evaluación y Evidencias EFSRT"),
            fechaLimite: "",
            estado: normalizarEstadoEv(val?.estado),
            archivo: archs[0]?.url || "",
            archivos: archs,
            fechaCreacion: val?.fecha || fechaActual(),
            seleccionada: true,
            desdeBD: true,
          };
        });

      const combinadas = [
        ...registrosBD,
        ...listaEval,
        ...listaDesdeEvaluacionEvidencias,
      ];

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
  }, [estudiante, moduloActivo, claveModulo, keyEvidencias, claveSesion]);

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

  const conectarEvidenciasAlHacerClick = async (destinoSeccion = "evidencias") => {
    await cargarEvidenciasDeModulo();
    setEvidencias((prev) => {
      const lista = prev[claveModulo] || [];
      if (lista.length === 0) return prev;
      const tieneAlguna = lista.some((e) => e.seleccionada !== false);
      if (tieneAlguna) return prev;
      return {
        ...prev,
        [claveModulo]: lista.map((e) => ({ ...e, seleccionada: true })),
      };
    });
    if (destinoSeccion) {
      setSeccion(destinoSeccion);
    }
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

      invalidateApiCache("/expedientes");
      invalidateApiCache("/efsrt");
      invalidateApiCache("/evidencias-efsrt");
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

  const pasos = [
    {
      id: "nota",
      titulo: "Nota aprobatoria",
      detalle: `${formatoNota(notaCalculada)} · mín. 13`,
      ok: notaAprobatoria,
      ir: "evaluacion",
      icono: Target,
    },
    {
      id: "evid",
      titulo: "Evidencia elegida",
      detalle: `${evidenciasElegidas.length} elegidas`,
      ok: tieneEvidencias,
      ir: "evidencias",
      conectar: true,
      icono: FileText,
    },
    {
      id: "port",
      titulo: "Portafolio conforme",
      detalle: estadoPortafolioActual,
      ok: portafolioConforme,
      ir: null,
      icono: FolderCheck,
    },
    {
      id: "verif",
      titulo: "Verificado por docente",
      detalle: verificadoDocenteActual ? "Confirmado" : "Pendiente",
      ok: verificadoDocenteActual,
      ir: "evaluacion",
      icono: UserCheck,
    },
  ];
  const okCount = pasos.filter((p) => p.ok).length;
  const pctHoras = Math.min(
    100,
    Math.round(
      (horasAcumuladasActuales / Math.max(1, horasRequeridasActuales)) * 100
    )
  );
  const valoresRadar = CRITERIOS.map((c) => Number(evaluacionActual[c.id] || 0));
  const evidenciasVisibles = tareasActuales.filter(
    (e) => filtroEvidencia === "Todas" || e.estado === filtroEvidencia
  );
  const contarEstadoEv = (estado) =>
    estado === "Todas"
      ? tareasActuales.length
      : tareasActuales.filter((e) => e.estado === estado).length;

  const [celebrar, setCelebrar] = useState(false);
  const listoPrevio = useRef(listoParaConstancia);
  useEffect(() => {
    if (!listoPrevio.current && listoParaConstancia) {
      setCelebrar(true);
      const t = setTimeout(() => setCelebrar(false), 1800);
      listoPrevio.current = true;
      return () => clearTimeout(t);
    }
    listoPrevio.current = listoParaConstancia;
  }, [listoParaConstancia, claveModulo]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || modalEvidencia) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < secciones.length) {
        const targetSec = secciones[i].id;
        if (targetSec === "evidencias") {
          conectarEvidenciasAlHacerClick("evidencias");
        } else {
          setSeccion(targetSec);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalEvidencia, claveModulo]);

  const diasPara = (fecha) => {
    if (!fecha) return null;
    const d = new Date(`${fecha}T23:59:59`);
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  };

  /* ───────────────────────── Apoyos de la vista ───────────────────────── */
  const marcarTodas = (campo, valor) =>
    setEvidencias((prev) => ({
      ...prev,
      [claveModulo]: (prev[claveModulo] || []).map((e) => ({ ...e, [campo]: valor })),
    }));

  // Niveles ya evaluados de cada módulo (el activo en vivo; los demás, lo guardado en el expediente)
  const nivelesPorModulo = useMemo(() => {
    const mapa = {};
    modulosEstudiante.forEach((m) => {
      const num = Number(m.numero_modulo);
      const esActivo = num === Number(moduloActivo.numero_modulo);
      const vivo = evaluaciones[claveModulo] || {};
      let niveles = {};
      if (esActivo && Object.keys(vivo).length > 0) {
        niveles = vivo;
      } else {
        const guardado = leerStorageRevision(
          `expediente_calificacion_${estudiante.estudianteId}_m${num}`,
          null
        );
        if (Array.isArray(guardado?.detalle_evaluacion)) {
          CRITERIOS.forEach((c) => {
            const f = guardado.detalle_evaluacion.find((x) => x.criterio === c.nombre);
            if (f) niveles[c.id] = Number(f.nivel);
          });
        }
      }
      mapa[num] = niveles;
    });
    return mapa;
  }, [modulosEstudiante, moduloActivo, evaluaciones, claveModulo, estudiante.estudianteId, moduloYaCalificado]);

  const notaDeModulo = (m) => {
    const esActivo = Number(m.numero_modulo) === Number(moduloActivo.numero_modulo);
    if (esActivo && criteriosCompletados > 0) return notaCalculada;
    return m.nota !== null && m.nota !== undefined ? Number(m.nota) : null;
  };

  const elegirModulo = (num) => {
    setNumeroModuloActivo(Number(num));
    setAviso(null);
    const elegido = modulosEstudiante.find(
      (modulo) => Number(modulo.numero_modulo) === Number(num)
    );
    if (elegido) publicarModuloSistema(elegido);
  };

  /* ───────────────────────── Tokens de color ───────────────────────── */
  const k = darkMode
    ? {
        pagina: "bg-[#202124] text-[#e8eaed]",
        tarjeta: "bg-[#292a2d] border-[#3c4043]",
        borde: "border-[#3c4043]",
        suave: "text-[#9aa0a6]",
        relleno: "bg-[#303134]",
        hover: "hover:bg-[#35363a]",
        lineaCampo: "border-[#5f6368]",
        acento: "text-[#81c995]",
        acentoBg: "bg-[#81c995] text-[#202124]",
        barra: "bg-[#81c995]",
        seleccion: "border-[#81c995] bg-[#1e3a29] ring-1 ring-[#81c995]",
        inp: "text-[#e8eaed] placeholder:text-[#9aa0a6]",
      }
    : {
        pagina: "bg-white text-[#202124]",
        tarjeta: "bg-white border-[#dadce0]",
        borde: "border-[#dadce0]",
        suave: "text-[#5f6368]",
        relleno: "bg-[#f1f3f4]",
        hover: "hover:bg-[#f1f3f4]",
        lineaCampo: "border-[#80868b]",
        acento: "text-[#188038]",
        acentoBg: "bg-[#188038] text-white",
        barra: "bg-[#188038]",
        seleccion: "border-[#188038] bg-[#e6f4ea] ring-1 ring-[#188038]",
        inp: "text-[#202124] placeholder:text-[#80868b]",
      };

  const inpBase = `w-full bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70 ${k.inp}`;
  const puedeGuardar =
    !guardando && !moduloYaCalificado && criteriosCompletados === CRITERIOS.length;
  const faltanCriterios = CRITERIOS.length - criteriosCompletados;

  const tituloBoton = guardando
    ? "Guardando…"
    : moduloYaCalificado
      ? "Evaluación registrada"
      : "Registrar en expediente";

  const accionesMasivas = [
    { t: "Elegir todas las evidencias", fn: () => marcarTodas("seleccionada", true), off: tareasActuales.length === 0 },
    { t: "Quitar la selección", fn: () => marcarTodas("seleccionada", false), off: tareasActuales.length === 0 },
    "---",
    { t: "Aprobar todas", fn: () => marcarTodas("estado", "Aprobado"), off: tareasActuales.length === 0 || moduloYaCalificado },
    { t: "Marcar todas como pendientes", fn: () => marcarTodas("estado", "Pendiente"), off: tareasActuales.length === 0 || moduloYaCalificado },
    "---",
    { t: "Recargar desde el servidor", fn: cargarEvidenciasDeModulo },
  ];

  /* ───────────────────────── Vista ───────────────────────── */
  return (
    <div
      className={`min-h-full w-full ${k.pagina}`}
      style={{ fontFamily: "'Google Sans','Product Sans',Roboto,'Plus Jakarta Sans',system-ui,sans-serif" }}
    >
      <style>{ESTILOS_RV}</style>

      {/* Aviso (estilo snackbar de Classroom) */}
      {aviso && (
        <div
          role="status"
          className="rv-toast fixed bottom-5 left-5 z-[60] flex max-w-md items-center gap-3 rounded bg-[#323232] px-4 py-3 text-sm text-white shadow-xl"
        >
          {aviso.tipo === "ok" ? (
            <CheckCircle2 size={18} className="shrink-0 text-[#81c995]" />
          ) : (
            <CircleAlert size={18} className="shrink-0 text-[#f28b82]" />
          )}
          <span className="leading-snug">{aviso.mensaje}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setAviso(null)} className="ml-2 shrink-0 text-[#9aa0a6] hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barra superior + pestañas */}
      <header className={`sticky top-0 z-30 border-b ${k.borde} ${k.pagina}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver"
            title="Volver"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${k.hover}`}
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0 leading-tight">
            <p className="max-w-[320px] truncate text-[15px] font-medium">{estudiante.nombre}</p>
            <p className={`max-w-[320px] truncate text-xs ${k.suave}`}>
              {moduloActivo.nombre_modulo} · {estudiante.expediente}
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="relative">
              {celebrar &&
                Array.from({ length: 16 }).map((_, i) => {
                  const ang = (i / 16) * Math.PI * 2;
                  return (
                    <span
                      key={i}
                      className="rv-burst"
                      style={{
                        background: ["#188038", "#1a73e8", "#f29900", "#a142f4"][i % 4],
                        "--dx": `${Math.cos(ang) * 46}px`,
                        "--dy": `${Math.sin(ang) * 46}px`,
                      }}
                    />
                  );
                })}
              {listoParaConstancia ? (
                <span key="listo" className="rv-pop inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1.5 text-xs font-medium text-[#137333]">
                  Listo para constancia
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${k.relleno} ${k.suave}`}>
                  {pasos.length - okCount} requisitos pendientes
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={guardarCalificacion}
              disabled={!puedeGuardar}
              title={
                moduloYaCalificado
                  ? "Esta evaluación ya fue adjuntada al expediente"
                  : faltanCriterios > 0
                    ? `Faltan ${faltanCriterios} criterio(s) por evaluar`
                    : "Registrar la evaluación en el expediente"
              }
              className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition ${
                puedeGuardar
                  ? "bg-[#188038] text-white hover:bg-[#137333] hover:shadow-md"
                  : `${k.relleno} ${k.suave} cursor-not-allowed`
              }`}
            >
              {guardando && <RefreshCw className="animate-spin" size={16} />}
              {tituloBoton}
            </button>
          </div>
        </div>

        <div role="tablist" aria-label="Secciones" className="flex gap-1 overflow-x-auto px-2 sm:px-4">
          {secciones.map((item) => {
            const activa = seccion === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() =>
                  item.id === "evidencias"
                    ? conectarEvidenciasAlHacerClick("evidencias")
                    : setSeccion(item.id)
                }
                className={`relative flex shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                  activa ? k.acento : `${k.suave} hover:text-current`
                }`}
              >
                {item.nombre}
                {item.id === "evidencias" && (
                  <span className={`rounded-full px-1.5 text-[11px] ${k.relleno}`}>
                    {evidenciasElegidas.length}/{tareasActuales.length}
                  </span>
                )}
                <span
                  className={`absolute inset-x-3 bottom-0 h-[3px] origin-center rounded-t-full transition-transform duration-200 ${k.barra} ${
                    activa ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-14 sm:px-6">
        {/* Filtro de módulo (igual que el "Classwork filter") */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
          <label className={`relative block w-full max-w-xs rounded-t-md border-b ${k.relleno} ${k.borde}`}>
            <span className={`absolute left-4 top-2 text-xs ${k.suave}`}>Módulo</span>
            <select
              value={moduloActivo.numero_modulo}
              onChange={(e) => elegirModulo(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent px-4 pb-2 pt-6 text-base outline-none"
            >
              {modulosEstudiante.map((m) => (
                <option key={m.numero_modulo} value={m.numero_modulo} className="text-[#202124]">
                  {m.nombre_modulo}
                  {m.adjuntado ? "  ✓" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${k.suave}`} />
          </label>

          <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-sm ${k.suave}`}>
            <span>DNI {estudiante.dni}</span>
            <span>{estudiante.carrera}</span>
            <span>Asesor: {moduloActivo.docente_asignado}</span>
          </div>
        </div>

        {/* ════════════ EVALUACIÓN ════════════ */}
        {seccion === "evaluacion" && (
          <div key="ev" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              {/* Datos de la evaluación */}
              <section className={`rv-up rounded-lg border p-5 ${k.tarjeta}`}>
                <div className="space-y-3">
                  <CampoRelleno etiqueta="Título" k={k}>
                    <input
                      readOnly
                      value={`Evaluación EFSRT · ${moduloActivo.nombre_modulo}`}
                      className={`${inpBase} text-base`}
                    />
                  </CampoRelleno>

                  <CampoRelleno etiqueta="Observaciones generales del docente (opcional)" k={k}>
                    <textarea
                      rows={3}
                      disabled={moduloYaCalificado}
                      value={observaciones[claveModulo] || ""}
                      onChange={(e) => setsetterSafe(setObservaciones, e.target.value)}
                      placeholder="Escribe aquí tus observaciones sobre el desempeño del estudiante…"
                      className={`${inpBase} resize-none`}
                    />
                  </CampoRelleno>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CampoRelleno etiqueta="Logros destacados" k={k}>
                      <textarea
                        rows={2}
                        disabled={moduloYaCalificado}
                        value={logros[claveModulo] || ""}
                        onChange={(e) => setsetterSafe(setLogros, e.target.value)}
                        placeholder="Principales logros del estudiante…"
                        className={`${inpBase} resize-none`}
                      />
                    </CampoRelleno>
                    <CampoRelleno etiqueta="Aspectos por mejorar" k={k}>
                      <textarea
                        rows={2}
                        disabled={moduloYaCalificado}
                        value={mejoras[claveModulo] || ""}
                        onChange={(e) => setsetterSafe(setMejoras, e.target.value)}
                        placeholder="Aspectos que debe fortalecer…"
                        className={`${inpBase} resize-none`}
                      />
                    </CampoRelleno>
                  </div>
                </div>

                {/* Evidencias adjuntas (como los archivos adjuntos de una tarea) */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Evidencias adjuntas al expediente</p>
                    <button
                      type="button"
                      onClick={() => conectarEvidenciasAlHacerClick("evidencias")}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${k.hover} ${k.acento}`}
                    >
                      Administrar
                    </button>
                  </div>

                  {evidenciasElegidas.length === 0 ? (
                    <div className={`rounded-md border border-dashed p-5 text-center text-sm ${k.borde} ${k.suave}`}>
                      Aún no hay evidencias elegidas para este módulo.
                      <button
                        type="button"
                        onClick={() => conectarEvidenciasAlHacerClick("evidencias")}
                        className={`ml-1 font-medium underline-offset-2 hover:underline ${k.acento}`}
                      >
                        Elegir evidencias
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {evidenciasElegidas.map((ev) => {
                        const tieneFoto = (ev.archivos || []).some((a) => a.esFoto);
                        return (
                          <li key={ev.id} className={`flex items-center gap-3 rounded-md border p-2.5 transition ${k.borde} ${k.hover}`}>
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
                              {tieneFoto ? <ImageIcon size={18} /> : <FileText size={18} />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{ev.titulo}</p>
                              <p className={`truncate text-xs ${k.suave}`}>
                                <span className={colorEstadoEv(ev.estado, darkMode)}>{ev.estado}</span> • {(ev.archivos || []).length} archivo(s)
                              </p>
                            </div>
                            <span title={ev.descripcion || "Sin descripción"} className={`shrink-0 ${k.suave}`}><Info size={16} /></span>
                            <button
                              type="button"
                              aria-label="Quitar del expediente (no elimina la evidencia)"
                              title="Quitar del expediente (no elimina la evidencia)"
                              onClick={() => alternarSeleccionEvidencia(ev.id)}
                              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${k.hover}`}
                            >
                              <X size={16} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              {/* Rúbrica */}
              <section className={`rv-up rounded-lg border p-5 ${k.tarjeta}`} style={{ animationDelay: "60ms" }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-medium">Rúbrica EFSRT</h2>
                    <p className={`text-sm ${k.suave}`}>Haz clic en el nivel logrado por cada criterio. La nota se calcula sola.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${k.relleno} ${k.suave}`}>
                    {criteriosCompletados} de {CRITERIOS.length} evaluados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[780px]">
                    <div className="grid grid-cols-[210px_repeat(4,minmax(0,1fr))] gap-2 pb-2">
                      <span />
                      {NIVELES.map((n) => (
                        <span key={n.valor} className={`px-1 text-center text-xs font-medium ${k.suave}`}>{n.nombre}</span>
                      ))}
                    </div>

                    {CRITERIOS.map((c) => {
                      const sel = Number(evaluacionActual[c.id] || 0);
                      return (
                        <div key={c.id} className={`grid grid-cols-[210px_repeat(4,minmax(0,1fr))] gap-2 border-t py-3 ${k.borde}`}>
                          <div className="pr-2">
                            <p className="text-sm font-medium leading-snug">{c.nombre}</p>
                            <p className={`mt-1 text-xs leading-relaxed ${k.suave}`}>{c.descripcion}</p>
                            <p className="mt-1.5 text-xs">
                              {sel ? (
                                <span className={k.acento}>Evaluado</span>
                              ) : (
                                <span className="text-[#d93025]">Sin evaluar</span>
                              )}
                              <span className={k.suave}> · {c.peso}% · hasta {(c.peso * 0.2).toFixed(2)} pts</span>
                            </p>
                          </div>

                          {NIVELES.map((n) => {
                            const activo = sel === n.valor;
                            const pts = (n.valor / 4) * c.peso * 0.2;
                            return (
                              <button
                                key={n.valor}
                                type="button"
                                disabled={moduloYaCalificado}
                                aria-pressed={activo}
                                onClick={() => actualizarNivel(c.id, n.valor)}
                                className={`flex min-h-[88px] flex-col rounded-md border p-2.5 text-left transition disabled:cursor-not-allowed ${
                                  activo ? k.seleccion : `${k.borde} ${k.hover}`
                                }`}
                              >
                                <span className="flex items-center justify-between text-sm font-medium">
                                  {pts.toFixed(2)} pts
                                  {activo && <Check size={16} />}
                                </span>
                                <span className={`mt-1 text-[11px] leading-snug ${activo ? "" : k.suave}`}>{n.descripcion}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={`mt-2 flex items-center justify-between border-t pt-3 ${k.borde}`}>
                  <span className={`text-sm ${k.suave}`}>
                    {notaAprobatoria ? "Desempeño aprobatorio" : criteriosCompletados === CRITERIOS.length ? "Por debajo del mínimo (13)" : "En proceso de evaluación"}
                  </span>
                  <span className={`text-lg font-medium tabular-nums ${notaAprobatoria ? k.acento : ""}`}>
                    {formatoNota(notaCalculada)} <span className={`text-sm ${k.suave}`}>/ 20</span>
                  </span>
                </div>
              </section>
            </div>

            {/* Panel de ajustes (como la columna derecha de crear tarea) */}
            <aside className={`rv-up space-y-4 rounded-lg border p-5 lg:sticky lg:top-36 ${k.tarjeta}`} style={{ animationDelay: "90ms" }}>
              <div>
                <p className="mb-1.5 text-sm font-medium">Para</p>
                <div className={`flex items-center gap-2.5 rounded-md border px-3 py-2 ${k.borde}`}>
                  <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full"><AvatarRevision estudiante={estudiante} /></span>
                  <span className="min-w-0 text-sm">
                    <span className="block truncate">{estudiante.nombre}</span>
                    <span className={`block truncate text-xs ${k.suave}`}>{moduloActivo.nombre_modulo}</span>
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Puntos</p>
                <div className={`flex items-center justify-between rounded-md border px-3 py-2.5 ${k.borde}`}>
                  <span className={`text-base font-medium tabular-nums ${notaAprobatoria ? k.acento : ""}`}>{formatoNota(notaCalculada)}</span>
                  <span className={`text-xs ${k.suave}`}>de 20 · mínimo 13</span>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Centro de prácticas</p>
                <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${k.borde}`}>
                  <Building2 size={16} className={k.suave} />
                  <input
                    type="text"
                    disabled={moduloYaCalificado}
                    value={empresaActual}
                    onChange={(e) => setsetterSafe(setEmpresaPorModulo, e.target.value)}
                    className={inpBase}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Portafolio</p>
                <div className="relative">
                  <select
                    disabled={moduloYaCalificado}
                    value={estadoPortafolioActual}
                    onChange={(e) => setsetterSafe(setPortafolioPorModulo, e.target.value)}
                    className={`w-full cursor-pointer appearance-none rounded-md border bg-transparent px-3 py-2.5 pr-9 text-sm outline-none focus:border-[#188038] disabled:cursor-not-allowed disabled:opacity-70 ${k.borde}`}
                  >
                    <option value="Pendiente de revisión" className="text-[#202124]">Pendiente de revisión</option>
                    <option value="En revisión" className="text-[#202124]">En revisión</option>
                    <option value="Conforme" className="text-[#202124]">Conforme</option>
                    <option value="Observado" className="text-[#202124]">Observado</option>
                  </select>
                  <ChevronDown size={16} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${k.suave}`} />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Horas registradas</p>
                <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${k.borde}`}>
                  <Clock3 size={16} className={k.suave} />
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    disabled={moduloYaCalificado}
                    value={horasAcumuladasActuales}
                    onChange={(e) => setsetterSafe(setHorasPorModulo, Math.max(0, Number(e.target.value || 0)))}
                    className={`${inpBase} w-20`}
                  />
                  <span className={`text-xs ${k.suave}`}>/ {horasRequeridasActuales} h ({pctHoras}%)</span>
                </div>
              </div>

              <div className={`border-t pt-4 ${k.borde}`}>
                <label className={`flex cursor-pointer items-start gap-3 ${moduloYaCalificado ? "cursor-not-allowed opacity-70" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={moduloYaCalificado}
                    checked={verificadoDocenteActual}
                    onChange={() => setsetterSafe(setVerificadoPorModulo, !verificadoDocenteActual)}
                    className="mt-0.5 h-4 w-4 accent-[#188038]"
                  />
                  <span className="text-sm">
                    Verificado por el docente
                    <span className={`mt-0.5 block text-xs leading-relaxed ${k.suave}`}>
                      Confirma que revisaste rúbrica, evidencias y portafolio.
                    </span>
                  </span>
                </label>
              </div>

              {/* Requisitos para la constancia */}
              <div className={`border-t pt-4 ${k.borde}`}>
                <p className="mb-2 flex items-center justify-between text-sm font-medium">
                  Requisitos para la constancia
                  <span className={`text-xs font-normal ${k.suave}`}>{okCount}/{pasos.length}</span>
                </p>
                <ul className="space-y-1">
                  {pasos.map((p) => {
                    const Ico = p.icono;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (p.conectar) conectarEvidenciasAlHacerClick(p.ir || "evidencias");
                            else if (p.ir) setSeccion(p.ir);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition ${p.ir ? k.hover : "cursor-default"}`}
                        >
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${p.ok ? "bg-[#188038] text-white" : `${k.relleno} ${k.suave}`}`}>
                            {p.ok ? <Check size={14} /> : <Ico size={13} />}
                          </span>
                          <span className="min-w-0 text-sm">
                            <span className="block truncate">{p.titulo}</span>
                            <span className={`block truncate text-[11px] ${p.ok ? k.acento : k.suave}`}>{p.detalle}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        )}

        {/* ════════════ EVIDENCIAS ════════════ */}
        {seccion === "evidencias" && (
          <section key="evd" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={moduloYaCalificado}
                onClick={() => setModalEvidencia(true)}
                className={`inline-flex h-12 items-center gap-3 rounded-full border px-6 text-sm font-medium shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${k.tarjeta}`}
              >
                <Plus size={22} className="text-[#1a73e8]" />
                Nueva evidencia
              </button>

              <div className={`flex items-center gap-3 text-sm ${k.suave}`}>
                <span>
                  <strong className="font-medium text-current">{tareasAprobadas}</strong> de {tareasActuales.length} aprobadas ·{" "}
                  <strong className="font-medium text-current">{evidenciasElegidas.length}</strong> elegidas · {tareasPendientes} pendientes
                </span>
                <button
                  type="button"
                  onClick={cargarEvidenciasDeModulo}
                  aria-label="Recargar evidencias"
                  title="Recargar evidencias"
                  className={`grid h-9 w-9 place-items-center rounded-full transition ${k.hover}`}
                >
                  <RefreshCw size={17} className={cargandoEvBD ? "animate-spin" : ""} />
                </button>
                <Kebab id="masivo" abierto={menuAbierto} setAbierto={setMenuAbierto} items={accionesMasivas} k={k} etiqueta="Acciones para todas las evidencias" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Todas", "Pendiente", "En revisión", "Aprobado", "Observado"].map((f) => {
                const activo = filtroEvidencia === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltroEvidencia(f)}
                    aria-pressed={activo}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                      activo ? `${k.seleccion} font-medium` : `${k.borde} ${k.hover}`
                    }`}
                  >
                    {f}
                    <span className={`text-xs ${activo ? "" : k.suave}`}>{contarEstadoEv(f)}</span>
                  </button>
                );
              })}
            </div>

            {evidenciasVisibles.length === 0 ? (
              <div className={`rounded-lg border border-dashed py-16 text-center ${k.borde}`}>
                <FileText className={`mx-auto ${k.suave}`} size={40} />
                <h3 className="mt-3 text-base font-medium">
                  {tareasActuales.length === 0 ? "No hay evidencias para este módulo" : "Ninguna evidencia con este estado"}
                </h3>
                <p className={`mt-1 text-sm ${k.suave}`}>
                  {tareasActuales.length === 0
                    ? `Crea o adjunta evidencias para ${moduloActivo.nombre_modulo}.`
                    : "Prueba con otro filtro."}
                </p>
                {tareasActuales.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setModalEvidencia(true)}
                    className="mt-5 rounded-full bg-[#188038] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#137333]"
                  >
                    Crear evidencia
                  </button>
                )}
              </div>
            ) : (
              <ul className={`divide-y overflow-visible rounded-lg border ${k.tarjeta} ${darkMode ? "divide-[#3c4043]" : "divide-[#dadce0]"}`}>
                {evidenciasVisibles.map((evidencia, index) => {
                  const elegida = evidencia.seleccionada !== false;
                  const dias = diasPara(evidencia.fechaLimite);
                  const abierta = evAbierta === evidencia.id;
                  const tieneFoto = (evidencia.archivos || []).some((a) => a.esFoto);
                  const textoVence =
                    dias === null
                      ? "Sin fecha límite"
                      : dias < 0
                        ? `Venció hace ${Math.abs(dias)} d`
                        : dias === 0
                          ? "Vence hoy"
                          : `Vence en ${dias} d`;
                  return (
                    <li key={evidencia.id} className="rv-up" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={abierta}
                        onClick={() => setEvAbierta(abierta ? null : evidencia.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setEvAbierta(abierta ? null : evidencia.id);
                          }
                        }}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition ${k.hover}`}
                      >
                        <input
                          type="checkbox"
                          checked={elegida}
                          onChange={() => alternarSeleccionEvidencia(evidencia.id)}
                          onClick={(e) => e.stopPropagation()}
                          title={elegida ? "Elegida para adjuntar al expediente" : "Elegir para adjuntar al expediente"}
                          aria-label={`Elegir ${evidencia.titulo}`}
                          className="h-4 w-4 shrink-0 accent-[#188038]"
                        />
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${elegida ? "bg-[#1a73e8]" : "bg-[#80868b]"}`}>
                          {tieneFoto ? <ImageIcon size={18} /> : <FileText size={18} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px]">{evidencia.titulo}</p>
                          <p className={`truncate text-xs ${k.suave}`}>
                            Publicada {evidencia.fechaCreacion} · <span className={dias !== null && dias < 0 ? "text-[#d93025]" : ""}>{textoVence}</span>
                          </p>
                        </div>
                        <span className={`hidden shrink-0 text-sm font-medium sm:block ${colorEstadoEv(evidencia.estado, darkMode)}`}>
                          {evidencia.estado}
                        </span>
                        <Kebab
                          id={`ev-${evidencia.id}`}
                          abierto={menuAbierto}
                          setAbierto={setMenuAbierto}
                          k={k}
                          items={[
                            { t: abierta ? "Ocultar detalle" : "Ver detalle", fn: () => setEvAbierta(abierta ? null : evidencia.id) },
                            { t: "Abrir archivo", fn: () => window.open(evidencia.archivo, "_blank", "noopener"), off: !evidencia.archivo },
                            "---",
                            { t: "Marcar como aprobada", fn: () => cambiarEstadoEvidencia(evidencia.id, "Aprobado"), off: moduloYaCalificado },
                            { t: "Marcar como observada", fn: () => cambiarEstadoEvidencia(evidencia.id, "Observado"), off: moduloYaCalificado },
                            "---",
                            { t: "Eliminar", fn: () => eliminarEvidencia(evidencia.id), off: moduloYaCalificado, peligro: true },
                          ]}
                        />
                      </div>

                      {abierta && (
                        <div className={`rv-fade space-y-4 border-t px-4 pb-5 pl-[4.5rem] pt-4 ${k.borde}`}>
                          <p className={`text-sm leading-relaxed ${k.suave}`}>
                            {evidencia.descripcion || "Sin descripción adicional."}
                          </p>

                          {Array.isArray(evidencia.archivos) && evidencia.archivos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {evidencia.archivos.map((f, fIdx) =>
                                f.esFoto && f.url ? (
                                  <a
                                    key={f.id || `${f.name}-${fIdx}`}
                                    href={f.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={f.name}
                                    className={`block h-14 w-14 overflow-hidden rounded-md border transition hover:scale-105 ${k.borde}`}
                                  >
                                    <img src={f.url} alt={f.name} loading="lazy" className="h-full w-full object-cover" />
                                  </a>
                                ) : (
                                  <span
                                    key={f.id || `${f.name}-${fIdx}`}
                                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${k.borde}`}
                                  >
                                    <Paperclip size={13} className={k.suave} />
                                    <span className="max-w-[160px] truncate">{f.name}</span>
                                  </span>
                                )
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3">
                            <div className={`inline-flex overflow-hidden rounded-full border ${k.borde}`} role="group" aria-label="Estado de la evidencia">
                              {["Pendiente", "En revisión", "Aprobado", "Observado"].map((est) => (
                                <button
                                  key={est}
                                  type="button"
                                  disabled={moduloYaCalificado}
                                  aria-pressed={evidencia.estado === est}
                                  onClick={() => cambiarEstadoEvidencia(evidencia.id, est)}
                                  className={`border-r px-3.5 py-1.5 text-xs font-medium transition last:border-r-0 disabled:cursor-not-allowed ${k.borde} ${
                                    evidencia.estado === est ? k.seleccion : k.hover
                                  }`}
                                >
                                  {est}
                                </button>
                              ))}
                            </div>

                            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${k.hover} ${k.acento}`}>
                              <Paperclip size={15} />
                              Adjuntar archivos
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif"
                                onChange={(e) => {
                                  adjuntarArchivosAEvidencia(evidencia.id, e.target.files);
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
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${k.hover} ${k.acento}`}
                              >
                                <Eye size={15} />
                                Ver
                              </a>
                            )}

                            {!moduloYaCalificado && (
                              <button
                                type="button"
                                onClick={() => eliminarEvidencia(evidencia.id)}
                                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#d93025] transition hover:bg-[#fce8e6]/60"
                              >
                                <Trash2 size={15} />
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ════════════ RESULTADOS (libro de calificaciones) ════════════ */}
        {seccion === "resultados" && (
          <div key="res" className="space-y-6">
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-base font-medium">Libro de calificaciones</h2>
                  <p className={`text-sm ${k.suave}`}>Haz clic en un módulo para revisarlo. Los datos de otros módulos salen de lo ya registrado en el expediente.</p>
                </div>
              </div>

              <div className={`overflow-x-auto rounded-lg border ${k.tarjeta}`}>
                <div className="min-w-[1000px]">
                  {/* Encabezados de criterio */}
                  <div className={`grid grid-cols-[240px_130px_repeat(5,minmax(130px,1fr))] border-b ${k.borde}`}>
                    <div className={`flex items-end p-4 text-sm font-medium ${k.suave}`}>Módulo</div>
                    <div className={`flex items-end border-l p-4 text-sm font-medium ${k.borde} ${k.suave}`}>Calificación</div>
                    {CRITERIOS.map((c) => (
                      <div key={c.id} className={`border-l p-3 ${k.borde}`}>
                        <p className={`text-[11px] ${k.suave}`}>Peso {c.peso}%</p>
                        <p className={`mt-0.5 line-clamp-2 text-sm font-medium leading-snug ${k.acento}`}>{c.nombre}</p>
                        <p className={`mt-1 border-t pt-1 text-[11px] ${k.borde} ${k.suave}`}>sobre {(c.peso * 0.2).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Fila "Máximo posible" (el "Class Average" de Classroom) */}
                  <div className={`grid grid-cols-[240px_130px_repeat(5,minmax(130px,1fr))] border-b ${k.borde} ${k.relleno}`}>
                    <div className={`flex items-center gap-3 p-4 text-sm font-medium ${k.acento}`}>
                      <Users size={20} /> Máximo posible
                    </div>
                    <div className={`flex items-center border-l p-4 text-sm ${k.borde} ${k.suave}`}>20 · mín. 13</div>
                    {CRITERIOS.map((c) => (
                      <div key={c.id} className={`flex items-center border-l p-4 text-sm ${k.borde} ${k.suave}`}>{(c.peso * 0.2).toFixed(2)}</div>
                    ))}
                  </div>

                  {/* Un renglón por módulo */}
                  {modulosEstudiante.map((m) => {
                    const num = Number(m.numero_modulo);
                    const esActivo = num === Number(moduloActivo.numero_modulo);
                    const niveles = nivelesPorModulo[num] || {};
                    const nota = notaDeModulo(m);
                    return (
                      <div
                        key={num}
                        role="button"
                        tabIndex={0}
                        onClick={() => { elegirModulo(num); setSeccion("evaluacion"); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { elegirModulo(num); setSeccion("evaluacion"); } }}
                        className={`relative grid cursor-pointer grid-cols-[240px_130px_repeat(5,minmax(130px,1fr))] border-b transition last:border-b-0 ${k.borde} ${k.hover}`}
                      >
                        {esActivo && <span className={`absolute inset-y-0 left-0 w-1 ${k.barra}`} />}
                        <div className="flex items-center gap-3 p-4">
                          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-medium ${m.adjuntado ? "bg-[#188038] text-white" : "bg-[#e8f0fe] text-[#1a73e8]"}`}>
                            {m.adjuntado ? <Check size={18} /> : ROMANOS[num - 1] || num}
                          </span>
                          <span className="min-w-0 text-sm">
                            <span className="block truncate">{m.nombre_modulo}</span>
                            <span className={`block truncate text-xs ${k.suave}`}>{esActivo ? "Revisando ahora" : m.docente_asignado}</span>
                          </span>
                        </div>

                        <div className={`flex items-center border-l p-4 text-sm ${k.borde}`}>
                          {nota === null ? (
                            <span className={k.suave}>Sin nota</span>
                          ) : (
                            <span>
                              {formatoNota(nota)} <span className={`text-xs ${k.suave}`}>({Math.round((nota / 20) * 100)}%)</span>
                            </span>
                          )}
                        </div>

                        {CRITERIOS.map((c) => {
                          const nivel = Number(niveles[c.id] || 0);
                          const pts = (nivel / 4) * c.peso * 0.2;
                          return (
                            <div key={c.id} className={`flex flex-col justify-center border-l p-4 text-sm ${k.borde}`}>
                              {nivel === 0 ? (
                                <span className="text-[#d93025]">Sin evaluar</span>
                              ) : (
                                <>
                                  <span className={nivel >= 3 ? k.acento : ""}>{NIVELES[nivel - 1].nombre}</span>
                                  <span className={`text-xs ${k.suave}`}>{pts.toFixed(2)} pts</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className={`rv-up rounded-lg border p-5 ${k.tarjeta}`}>
                <h2 className="text-base font-medium">Perfil de desempeño</h2>
                <p className={`text-sm ${k.suave}`}>
                  {moduloActivo.nombre_modulo} · Asesor: {moduloActivo.docente_asignado} · {empresaActual}
                </p>

                <div className="mt-4 grid grid-cols-1 items-center gap-6 md:grid-cols-[260px_1fr]">
                  <RadarCriterios valores={valoresRadar} />
                  <div className="flex items-center justify-center gap-6">
                    <AnilloNota nota={notaCalculada} aprobado={notaAprobatoria} size={150} />
                  </div>
                </div>

                {(logros[claveModulo] || mejoras[claveModulo] || observaciones[claveModulo]) && (
                  <div className={`mt-5 grid grid-cols-1 gap-3 border-t pt-4 md:grid-cols-3 ${k.borde}`}>
                    {[
                      { t: "Logros", v: logros[claveModulo] },
                      { t: "Por mejorar", v: mejoras[claveModulo] },
                      { t: "Observaciones", v: observaciones[claveModulo] },
                    ].map(
                      (b) =>
                        b.v && (
                          <div key={b.t}>
                            <p className={`text-xs font-medium ${k.acento}`}>{b.t}</p>
                            <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${k.suave}`}>{b.v}</p>
                          </div>
                        )
                    )}
                  </div>
                )}
              </section>

              <aside className={`rv-up rounded-lg border p-5 ${k.tarjeta}`} style={{ animationDelay: "60ms" }}>
                <div className="flex items-center gap-2">
                  <Award className="text-[#f29900]" size={19} />
                  <h3 className="text-base font-medium">Estado de constancia</h3>
                </div>

                <div className={`mt-4 rounded-md p-4 text-center ${listoParaConstancia ? "bg-[#e6f4ea] text-[#137333]" : `${k.relleno}`}`}>
                  <p className="text-base font-medium">{listoParaConstancia ? "Listo para constancia" : "Aún no listo"}</p>
                  <p className={`mt-1 text-xs ${listoParaConstancia ? "" : k.suave}`}>
                    Requiere nota ≥ 13, evidencia, portafolio conforme y verificación docente.
                  </p>
                </div>

                <ul className="mt-4 space-y-2.5">
                  {[
                    { l: "Rúbrica completa", ok: criteriosCompletados === CRITERIOS.length, i: CheckCircle2 },
                    ...pasos.map((p) => ({ l: p.titulo, ok: p.ok, i: p.icono })),
                    { l: `Expediente (${moduloActivo.nombre_modulo})`, ok: moduloYaCalificado, i: LockKeyhole, t: moduloYaCalificado ? "Adjuntado" : "Pendiente" },
                  ].map((r) => {
                    const Ic = r.i;
                    return (
                      <li key={r.l} className="flex items-center justify-between text-sm">
                        <span className={`flex items-center gap-2 ${k.suave}`}>
                          <Ic size={15} />
                          {r.l}
                        </span>
                        <span className={r.ok ? `font-medium ${k.acento}` : k.suave}>{r.t || (r.ok ? "Sí" : "No")}</span>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  onClick={() => setSeccion("evaluacion")}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${k.borde} ${k.hover} ${k.acento}`}
                >
                  Revisar evaluación
                  <ChevronRight size={16} />
                </button>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* Nueva evidencia */}
      {modalEvidencia && (
        <div className="rv-fade fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nueva-evidencia-titulo"
            className={`rv-up my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg shadow-2xl ${k.pagina}`}
          >
            <div className={`flex items-center gap-3 border-b px-4 py-3 ${k.borde}`}>
              <button
                type="button"
                onClick={() => setModalEvidencia(false)}
                className={`grid h-10 w-10 place-items-center rounded-full transition ${k.hover}`}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
              <div className="min-w-0">
                <h2 id="nueva-evidencia-titulo" className="truncate text-lg font-normal">Nueva evidencia</h2>
                <p className={`truncate text-xs ${k.suave}`}>{moduloActivo.nombre_modulo} · {estudiante.nombre}</p>
              </div>
            </div>

            <form onSubmit={crearEvidencia} className="space-y-4 p-5">
              <CampoRelleno etiqueta="Título *" k={k}>
                <input
                  autoFocus
                  value={nuevaEvidencia.titulo}
                  onChange={(e) => setNuevaEvidencia((prev) => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej. Informe de actividades del módulo"
                  className={`${inpBase} text-base`}
                  required
                />
              </CampoRelleno>

              <CampoRelleno etiqueta="Instrucciones (opcional)" k={k}>
                <textarea
                  rows={4}
                  value={nuevaEvidencia.descripcion}
                  onChange={(e) => setNuevaEvidencia((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describe qué debe presentar el estudiante…"
                  className={`${inpBase} resize-none`}
                />
              </CampoRelleno>

              <CampoRelleno etiqueta="Fecha límite de entrega" k={k}>
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className={k.suave} />
                  <input
                    type="date"
                    min={fechaActual()}
                    value={nuevaEvidencia.fechaLimite}
                    onChange={(e) => setNuevaEvidencia((prev) => ({ ...prev, fechaLimite: e.target.value }))}
                    className={inpBase}
                  />
                </div>
              </CampoRelleno>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEvidencia(false)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${k.hover} ${k.acento}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[#188038] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#137333] hover:shadow-md"
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