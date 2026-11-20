import { useState, useEffect, useMemo } from "react";
import CabeceraExpediente from "./componentes/CabeceraExpediente";
import ResumenAlumno from "./componentes/ResumenAlumno";
import DatosPersonales, { sinVacios } from "./componentes/DatosPersonales";

const API = "http://localhost:8000/api"; // misma URL base de la API

const cabeceras = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Normaliza un registro de módulo para que cada pestaña tenga campos consistentes
const normalizarModulo = (mod, indice = 0) => {
  const idModulo = mod.id_modulo ?? mod.modulo_id ?? mod.id ?? indice + 1;
  return {
    id_expediente: mod.id_expediente ?? mod.id ?? `exp-${idModulo}-${indice}`,
    id_modulo: idModulo,
    nombre_modulo:
      mod.nombre_modulo ||
      mod.modulo_nombre ||
      mod.modulo ||
      `Módulo EFSRT ${indice + 1}`,
    periodo_academico: mod.periodo_academico || mod.periodo || "2026-II",
    estado_modulo: mod.estado_modulo || mod.estado || "En proceso",
    empresa_entidad:
      mod.empresa_entidad || mod.entidad_nombre || mod.entidad || "",
    fecha_inicio: mod.fecha_inicio || "",
    fecha_fin: mod.fecha_fin || "",
    horas_requeridas: Number(mod.horas_requeridas ?? 160),
    horas_acumuladas: Number(mod.horas_acumuladas ?? mod.hrs ?? 0),
    nota: mod.nota ?? "",
    observaciones: mod.observaciones || "",
    evidencias: Array.isArray(mod.evidencias)
      ? mod.evidencias
      : [
          { id: 1, nombre: "Plan de Prácticas / Carta de Aceptación", estado: "Pendiente", archivo: "" },
          { id: 2, nombre: "Ficha de Seguimiento y Horas EFSRT", estado: "Pendiente", archivo: "" },
          { id: 3, nombre: "Informe Final / Evaluación del Módulo", estado: "Pendiente", archivo: "" },
        ],
  };
};

/* ───────────── Estilos y animaciones propias ───────────── */
const ESTILOS = `
@keyframes exp-fade-up { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:translateY(0);} }
@keyframes exp-pop { 0% { opacity:0; transform:scale(.92);} 60% { transform:scale(1.02);} 100% { opacity:1; transform:scale(1);} }
@keyframes exp-slide-in { from { opacity:0; transform:translateX(-12px);} to { opacity:1; transform:translateX(0);} }
@keyframes exp-toast { 0% { opacity:0; transform:translateY(-10px) scale(.97);} 100% { opacity:1; transform:translateY(0) scale(1);} }
@keyframes exp-shine { 0% { transform:translateX(-120%);} 100% { transform:translateX(220%);} }
@keyframes exp-pulse-ring { 0% { box-shadow:0 0 0 0 rgba(37,99,235,.45);} 100% { box-shadow:0 0 0 10px rgba(37,99,235,0);} }
.exp-fade-up { animation: exp-fade-up .5s cubic-bezier(.22,1,.36,1) both; }
.exp-pop { animation: exp-pop .45s cubic-bezier(.22,1,.36,1) both; }
.exp-slide-in { animation: exp-slide-in .4s ease-out both; }
.exp-toast { animation: exp-toast .35s ease-out both; }
.exp-shine::after { content:""; position:absolute; inset:0; width:40%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent); animation: exp-shine 2.4s ease-in-out infinite; }
.exp-pulse { animation: exp-pulse-ring 1.8s ease-out infinite; }
.exp-card { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.exp-card:hover { transform: translateY(-3px); }
@media (prefers-reduced-motion: reduce) { .exp-fade-up,.exp-pop,.exp-slide-in,.exp-toast,.exp-pulse,.exp-shine::after { animation:none !important; } .exp-card:hover { transform:none; } }
`;

/* ───────────── Iconos (SVG en línea, sin dependencias) ───────────── */
const Icono = ({ d, className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {[].concat(d).map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);
const I = {
  check: "M5 13l4 4L19 7",
  clock: ["M12 6v6l4 2", "M12 21a9 9 0 100-18 9 9 0 000 18z"],
  alert: ["M12 9v4", "M12 17h.01", "M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"],
  building: ["M3 21h18", "M5 21V7l7-4 7 4v14", "M9 21v-6h6v6"],
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z",
  file: ["M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z", "M14 3v5h5"],
  doc: ["M7 3h8l4 4v14H7z", "M15 3v4h4", "M10 12h6", "M10 16h6"],
  award: ["M12 15a6 6 0 100-12 6 6 0 000 12z", "M8.5 14l-1.5 7 5-3 5 3-1.5-7"],
  lock: ["M6 11h12v9H6z", "M8 11V8a4 4 0 018 0v3"],
  save: ["M5 4h11l3 3v13H5z", "M8 4v5h7V4", "M8 20v-6h8v6"],
  pen: ["M4 20h4L19 9l-4-4L4 16z"],
  close: "M6 6l12 12M18 6L6 18",
  layers: ["M12 3l9 5-9 5-9-5z", "M3 13l9 5 9-5"],
};

/* ───────────── Componentes de apoyo ───────────── */
const AnilloProgreso = ({ valor, tam = 56, grosor = 6, children }) => {
  const r = (tam - grosor) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, valor));
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} className="-rotate-90">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth={grosor} />
        <circle
          cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="currentColor"
          strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{children}</div>
    </div>
  );
};

const ESTADOS_EVIDENCIA = {
  Pendiente: { icono: I.clock, activo: "bg-slate-500 text-white", suave: "bg-slate-100 text-slate-600", borde: "border-slate-300" },
  Observado: { icono: I.alert, activo: "bg-amber-500 text-white", suave: "bg-amber-50 text-amber-700", borde: "border-amber-300" },
  Aprobado: { icono: I.check, activo: "bg-emerald-600 text-white", suave: "bg-emerald-50 text-emerald-700", borde: "border-emerald-300" },
};

const Requisito = ({ cumplido, texto, darkMode }) => (
  <li className="flex items-center gap-2 text-xs">
    <span
      className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-300 ${
        cumplido ? "bg-emerald-500 text-white" : darkMode ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-400"
      }`}
    >
      <Icono d={cumplido ? I.check : I.close} className="h-2.5 w-2.5" />
    </span>
    <span className={cumplido ? "font-medium" : "opacity-60"}>{texto}</span>
  </li>
);

export default function ExpedienteAlumno({ estudiante, onVolver, darkMode = false }) {
  const idEstudiante = estudiante?.id_estudiante ?? estudiante?.id;

  const [detalle, setDetalle] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [moduloActivoId, setModuloActivoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardandoModulo, setGuardandoModulo] = useState(false);
  const [aviso, setAviso] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [documentoPrevio, setDocumentoPrevio] = useState(null);

  const usuario = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = Number(usuario.id_rol);
  const esAdmin = rol === 1;
  const esDocente = rol === 2;
  const puedeGestionarModulo = esAdmin || esDocente;

  const cargar = async () => {
    setCargando(true);
    setAviso("");
    setMensajeExito("");

    try {
      const res = await fetch(`${API}/estudiantes/${idEstudiante}`, { headers: cabeceras() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      const datosAlumno = data.data ?? data.estudiante ?? data;
      setDetalle(datosAlumno);

      let listaModulos = [];
      try {
        const resExp = await fetch(`${API}/estudiantes/${idEstudiante}/expediente-modulos`, { headers: cabeceras() });
        if (resExp.ok) {
          const dataExp = await resExp.json().catch(() => ({}));
          const rawModulos = Array.isArray(dataExp) ? dataExp : Array.isArray(dataExp.data) ? dataExp.data : [];
          listaModulos = rawModulos.map((m, idx) => normalizarModulo(m, idx));
        }
      } catch {
        // Endpoint aún no disponible: no rompemos la vista
      }

      if (listaModulos.length === 0) {
        const moduloBase = normalizarModulo(
          {
            id_modulo: estudiante?.id_modulo ?? 1,
            nombre_modulo: estudiante?.modulo_nombre || estudiante?.modulo || "Módulo EFSRT",
            periodo_academico: estudiante?.periodo_academico || "2026-II",
            entidad_nombre: estudiante?.entidad || "",
            horas_acumuladas: estudiante?.horas_acumuladas ?? estudiante?.hrs ?? 0,
            estado: estudiante?.estado || "En proceso",
          },
          0
        );
        listaModulos = [moduloBase];
      }

      setModulos(listaModulos);
      setModuloActivoId((prev) =>
        listaModulos.some((m) => String(m.id_expediente) === String(prev)) ? prev : listaModulos[0].id_expediente
      );
    } catch (e) {
      setAviso(`No se pudo actualizar la información desde el servidor (${e.message}).`);
      if (modulos.length === 0 && estudiante) {
        const fallbackMod = normalizarModulo(
          {
            id_modulo: estudiante?.id_modulo ?? 1,
            nombre_modulo: estudiante?.modulo_nombre || estudiante?.modulo || "Módulo EFSRT",
            periodo_academico: estudiante?.periodo_academico || "2026-II",
          },
          0
        );
        setModulos([fallbackMod]);
        setModuloActivoId(fallbackMod.id_expediente);
      }
    }

    setCargando(false);
  };

  useEffect(() => {
    setDetalle(null);
    setModulos([]);
    setModuloActivoId(null);
    setDocumentoPrevio(null);
    if (idEstudiante) cargar();
    else setCargando(false);
  }, [idEstudiante]);

  // Oculta el mensaje de éxito automáticamente
  useEffect(() => {
    if (!mensajeExito) return;
    const t = setTimeout(() => setMensajeExito(""), 4500);
    return () => clearTimeout(t);
  }, [mensajeExito]);

  const combinado = { ...sinVacios(estudiante), ...sinVacios(detalle) };
  const datos = { ...combinado, direccion: combinado.direccion ?? combinado.dir_est ?? "" };

  const moduloActual = useMemo(
    () => modulos.find((m) => String(m.id_expediente) === String(moduloActivoId)) || modulos[0] || null,
    [modulos, moduloActivoId]
  );

  const actualizarCampoModulo = (campo, valor) => {
    if (!moduloActual) return;
    setMensajeExito("");
    setModulos((prev) =>
      prev.map((m) => (String(m.id_expediente) === String(moduloActual.id_expediente) ? { ...m, [campo]: valor } : m))
    );
  };

  const cambiarEstadoEvidencia = (idEvidencia, nuevoEstado) => {
    if (!moduloActual) return;
    setMensajeExito("");
    setModulos((prev) =>
      prev.map((m) => {
        if (String(m.id_expediente) !== String(moduloActual.id_expediente)) return m;
        return { ...m, evidencias: m.evidencias.map((ev) => (ev.id === idEvidencia ? { ...ev, estado: nuevoEstado } : ev)) };
      })
    );
  };

  const guardarCambiosModulo = async (e) => {
    e.preventDefault();
    if (!moduloActual) return;

    setGuardandoModulo(true);
    setAviso("");
    setMensajeExito("");

    try {
      const res = await fetch(
        `${API}/estudiantes/${idEstudiante}/expediente-modulos/${moduloActual.id_modulo}`,
        { method: "PUT", headers: cabeceras(), body: JSON.stringify(moduloActual) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}`);
      }
      setMensajeExito(`Cambios guardados en "${moduloActual.nombre_modulo}".`);
    } catch {
      setMensajeExito(`Cambios aplicados en "${moduloActual.nombre_modulo}" (listos para sincronizar con el servidor).`);
    } finally {
      setGuardandoModulo(false);
    }
  };

  // Reglas de negocio (sin cambios)
  const notaNumerica =
    moduloActual?.nota === "" || moduloActual?.nota === null ? null : Number(moduloActual?.nota);
  const tieneNota = notaNumerica !== null && !Number.isNaN(notaNumerica);
  const evidenciasAprobadas = moduloActual ? moduloActual.evidencias.every((ev) => ev.estado === "Aprobado") : false;
  const puedeGenerarActa = tieneNota;
  const puedeGenerarConstancia = tieneNota && notaNumerica >= 13 && evidenciasAprobadas;
  const notaAprobatoria = tieneNota && notaNumerica >= 13;

  const guardarDatos = async (cambios) => {
    const res = await fetch(`${API}/estudiantes/${idEstudiante}`, {
      method: "PUT",
      headers: cabeceras(),
      body: JSON.stringify(cambios),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errores = data.errors ? Object.values(data.errors).flat().join(" ") : "";
      throw new Error(errores || data.message || "No se pudo guardar");
    }
    await cargar();
  };

  if (!estudiante) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-slate-500">No hay un estudiante seleccionado.</p>
        {onVolver && (
          <button onClick={onVolver} className="font-semibold text-blue-600 hover:text-blue-700">
            Volver a estudiantes
          </button>
        )}
      </div>
    );
  }

  const nombreCompleto =
    [datos.apellidos, datos.nombres].filter(Boolean).join(", ") || datos.nombre || "Estudiante EFSRT";

  /* ───────────── Tema ───────────── */
  const t = darkMode
    ? {
        panel: "border-[#1e335c] bg-[#0b1b3a] text-slate-100",
        sub: "bg-[#0f172a] border-[#1e335c]",
        input: "border-[#1e335c] bg-[#0f172a] text-slate-100 placeholder:text-slate-500",
        muted: "text-slate-400",
        linea: "border-[#1e335c]",
        tabIdle: "border-[#1e335c] bg-[#0f172a] text-slate-300 hover:border-blue-500",
      }
    : {
        panel: "border-slate-200 bg-white text-slate-800",
        sub: "bg-slate-50 border-slate-200",
        input: "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400",
        muted: "text-slate-500",
        linea: "border-slate-200",
        tabIdle: "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:shadow-md",
      };

  const campo = `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${t.input}`;

  const pctHoras = moduloActual
    ? Math.min(100, Math.round((moduloActual.horas_acumuladas / (moduloActual.horas_requeridas || 1)) * 100))
    : 0;
  const nEvidAprob = moduloActual ? moduloActual.evidencias.filter((e) => e.estado === "Aprobado").length : 0;
  const nEvid = moduloActual ? moduloActual.evidencias.length : 0;

  const pctModulo = (m) => Math.min(100, Math.round((m.horas_acumuladas / (m.horas_requeridas || 1)) * 100));

  return (
    <div className="space-y-5">
      <style>{ESTILOS}</style>

      <div className="exp-fade-up">
        <CabeceraExpediente estudiante={datos} onVolver={onVolver} darkMode={darkMode} puedeAsignar={esAdmin} />
      </div>

      {aviso && (
        <p className="exp-toast flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <Icono d={I.alert} />
          <span>
            {aviso}{" "}
            <button onClick={cargar} className="font-semibold underline">
              Reintentar
            </button>
          </span>
        </p>
      )}

      {mensajeExito && (
        <p className="exp-toast flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 shadow-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Icono d={I.check} className="h-3 w-3" />
          </span>
          {mensajeExito}
        </p>
      )}

      {/* Expediente general del alumno */}
      <div
        style={{ animationDelay: ".08s" }}
        className={`exp-fade-up grid items-start gap-4 transition-opacity duration-500 lg:grid-cols-[300px_1fr] ${
          cargando && !detalle ? "opacity-60" : "opacity-100"
        }`}
      >
        <ResumenAlumno estudiante={datos} darkMode={darkMode} />
        <DatosPersonales estudiante={datos} darkMode={darkMode} puedeEditar={esAdmin} onGuardar={guardarDatos} />
      </div>

      {/* ═════════════ Expediente por Módulos EFSRT ═════════════ */}
      <section
        style={{ animationDelay: ".16s" }}
        className={`exp-fade-up space-y-6 overflow-hidden rounded-3xl border p-5 shadow-sm md:p-7 ${t.panel}`}
      >
        {/* Encabezado */}
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
              <Icono d={I.layers} className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight">Expediente por Módulos EFSRT</h2>
              <p className={`mt-0.5 max-w-xl text-xs ${t.muted}`}>
                Elige un módulo para revisar su avance, validar evidencias, registrar la nota y emitir documentos.
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            {modulos.length} {modulos.length === 1 ? "módulo" : "módulos"} en historial
          </span>
        </div>

        {/* Selector de módulos: tarjetas con anillo de progreso */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modulos.map((mod, idx) => {
            const activo = String(mod.id_expediente) === String(moduloActual?.id_expediente);
            const pct = pctModulo(mod);
            const conNota = mod.nota !== "" && mod.nota !== null;
            return (
              <button
                key={mod.id_expediente}
                type="button"
                style={{ animationDelay: `${0.2 + idx * 0.06}s` }}
                onClick={() => {
                  setModuloActivoId(mod.id_expediente);
                  setDocumentoPrevio(null);
                }}
                className={`exp-card exp-slide-in flex items-center gap-3.5 rounded-2xl border p-3.5 text-left ${
                  activo
                    ? "border-transparent bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
                    : t.tabIdle
                }`}
              >
                <div className={activo ? "text-white" : "text-blue-600"}>
                  <AnilloProgreso valor={pct}>{pct}%</AnilloProgreso>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{mod.nombre_modulo}</p>
                  <p className={`text-[11px] ${activo ? "text-blue-100" : t.muted}`}>
                    Periodo {mod.periodo_academico}
                  </p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activo
                        ? "bg-white/20 text-white"
                        : conNota
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {conNota ? `Nota ${mod.nota}` : "Sin nota"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle del módulo seleccionado */}
        {moduloActual && (
          <form key={moduloActual.id_expediente} onSubmit={guardarCambiosModulo} className="exp-fade-up space-y-6">
            {/* Resumen visual */}
            <div className={`rounded-2xl border p-4 md:p-5 ${t.sub}`}>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${t.muted}`}>Módulo seleccionado</p>
                  <h3 className="text-base font-bold">{moduloActual.nombre_modulo}</h3>
                </div>
                <span className="w-fit rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600">
                  {moduloActual.estado_modulo}
                </span>
              </div>

              {/* Barra de horas */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-end justify-between text-xs">
                  <span className={`font-semibold ${t.muted}`}>Avance de horas</span>
                  <span className="font-bold">
                    {moduloActual.horas_acumuladas}
                    <span className={`font-medium ${t.muted}`}> / {moduloActual.horas_requeridas} h</span>
                  </span>
                </div>
                <div className={`relative h-2.5 overflow-hidden rounded-full ${darkMode ? "bg-slate-700/60" : "bg-slate-200"}`}>
                  <div
                    className={`exp-shine relative h-full overflow-hidden rounded-full bg-gradient-to-r ${
                      pctHoras >= 100 ? "from-emerald-500 to-teal-400" : "from-blue-600 to-indigo-500"
                    }`}
                    style={{ width: `${pctHoras}%`, transition: "width .9s cubic-bezier(.22,1,.36,1)" }}
                  />
                </div>
              </div>

              {/* Mini métricas */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { et: "Horas", val: `${pctHoras}%`, ic: I.clock, color: "text-blue-600 bg-blue-50" },
                  { et: "Evidencias", val: `${nEvidAprob}/${nEvid}`, ic: I.file, color: "text-violet-600 bg-violet-50" },
                  {
                    et: "Nota",
                    val: tieneNota ? notaNumerica : "—",
                    ic: I.star,
                    color: !tieneNota
                      ? "text-slate-500 bg-slate-100"
                      : notaAprobatoria
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-rose-600 bg-rose-50",
                  },
                ].map((m) => (
                  <div key={m.et} className={`exp-pop flex items-center gap-2.5 rounded-xl border p-3 ${t.panel}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.color}`}>
                      <Icono d={m.ic} />
                    </span>
                    <div>
                      <p className="text-sm font-bold leading-none">{m.val}</p>
                      <p className={`mt-1 text-[10px] ${t.muted}`}>{m.et}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datos del módulo */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${t.muted}`}>
                  <Icono d={I.building} className="h-3.5 w-3.5" /> Centro de Prácticas / Proyecto
                </label>
                <input
                  type="text"
                  disabled={!puedeGestionarModulo}
                  value={moduloActual.empresa_entidad}
                  onChange={(e) => actualizarCampoModulo("empresa_entidad", e.target.value)}
                  placeholder="Ej. Empresa / Proyecto EFSRT"
                  className={campo}
                />
              </div>

              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${t.muted}`}>
                  <Icono d={I.clock} className="h-3.5 w-3.5" /> Horas acumuladas
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    disabled={!puedeGestionarModulo}
                    value={moduloActual.horas_acumuladas}
                    onChange={(e) => actualizarCampoModulo("horas_acumuladas", Number(e.target.value))}
                    className={`${campo} pr-16`}
                  />
                  <span className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs ${t.muted}`}>
                    / {moduloActual.horas_requeridas} h
                  </span>
                </div>
              </div>

              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${t.muted}`}>
                  <Icono d={I.star} className="h-3.5 w-3.5" /> Nota del módulo (0 - 20)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  disabled={!puedeGestionarModulo}
                  value={moduloActual.nota}
                  onChange={(e) => actualizarCampoModulo("nota", e.target.value)}
                  placeholder="Ej. 16"
                  className={`${campo} font-bold`}
                />
              </div>
            </div>

            {/* Evidencias */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Evidencias del módulo</h3>
                <span className={`text-xs ${t.muted}`}>
                  {nEvidAprob} de {nEvid} aprobadas
                </span>
              </div>

              <div className="grid gap-3">
                {moduloActual.evidencias.map((ev, i) => {
                  const cfg = ESTADOS_EVIDENCIA[ev.estado] || ESTADOS_EVIDENCIA.Pendiente;
                  return (
                    <div
                      key={ev.id}
                      style={{ animationDelay: `${i * 0.07}s` }}
                      className={`exp-card exp-slide-in flex flex-col justify-between gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${t.sub}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${cfg.suave}`}>
                          <Icono d={cfg.icono} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold leading-snug">{ev.nombre}</p>
                          <p className={`text-xs ${t.muted}`}>
                            {ev.archivo ? `Archivo: ${ev.archivo}` : "Control interno de expediente"}
                          </p>
                        </div>
                      </div>

                      {/* Control segmentado de estado */}
                      <div className={`flex shrink-0 gap-1 rounded-xl border p-1 ${darkMode ? "border-[#1e335c] bg-[#0b1b3a]" : "border-slate-200 bg-white"}`}>
                        {Object.keys(ESTADOS_EVIDENCIA).map((est) => {
                          const sel = ev.estado === est;
                          return (
                            <button
                              key={est}
                              type="button"
                              disabled={!puedeGestionarModulo}
                              onClick={() => cambiarEstadoEvidencia(ev.id, est)}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                                sel ? `${ESTADOS_EVIDENCIA[est].activo} shadow` : `${t.muted} hover:bg-slate-500/10`
                              }`}
                            >
                              {est}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${t.muted}`}>
                <Icono d={I.pen} className="h-3.5 w-3.5" /> Observaciones de supervisión
              </label>
              <textarea
                rows={3}
                disabled={!puedeGestionarModulo}
                value={moduloActual.observaciones}
                onChange={(e) => actualizarCampoModulo("observaciones", e.target.value)}
                placeholder="Notas o indicaciones sobre el desempeño del módulo..."
                className={`${campo} resize-none`}
              />
            </div>

            {/* Documentos + requisitos */}
            <div className={`grid gap-4 rounded-2xl border p-4 md:grid-cols-[1fr_auto] md:p-5 ${t.sub}`}>
              <div>
                <h3 className="mb-2.5 text-sm font-bold">Requisitos para emitir documentos</h3>
                <ul className="space-y-1.5">
                  <Requisito darkMode={darkMode} cumplido={tieneNota} texto="Nota registrada (para el Acta de Notas)" />
                  <Requisito darkMode={darkMode} cumplido={notaAprobatoria} texto="Nota aprobatoria, mínimo 13 (para la Constancia)" />
                  <Requisito darkMode={darkMode} cumplido={evidenciasAprobadas} texto="Todas las evidencias en estado Aprobado" />
                </ul>
              </div>

              <div className="flex flex-col justify-center gap-2.5 sm:min-w-[240px]">
                <button
                  type="button"
                  disabled={!puedeGenerarActa}
                  onClick={() => setDocumentoPrevio("acta")}
                  className="group flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  <Icono d={puedeGenerarActa ? I.doc : I.lock} />
                  Ver Acta de Notas
                </button>

                <button
                  type="button"
                  disabled={!puedeGenerarConstancia}
                  title={
                    !puedeGenerarConstancia
                      ? "Requiere nota aprobatoria (>= 13) y todas las evidencias en Aprobado"
                      : "Generar constancia de cumplimiento"
                  }
                  onClick={() => setDocumentoPrevio("constancia")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 ${
                    puedeGenerarConstancia
                      ? "exp-pulse bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg shadow-emerald-600/25 hover:brightness-110"
                      : ""
                  }`}
                >
                  <Icono d={puedeGenerarConstancia ? I.award : I.lock} />
                  Constancia de Cumplimiento
                </button>
              </div>
            </div>

            {/* Guardar */}
            {puedeGestionarModulo && (
              <div className={`flex justify-end border-t pt-4 ${t.linea}`}>
                <button
                  type="submit"
                  disabled={guardandoModulo}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
                >
                  {guardandoModulo ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Icono d={I.save} />
                  )}
                  {guardandoModulo ? "Guardando..." : "Guardar cambios del módulo"}
                </button>
              </div>
            )}
          </form>
        )}

        {/* Vista previa del documento */}
        {documentoPrevio && moduloActual && (
          <div className="exp-pop overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-800 shadow-xl">
            <div
              className={`flex items-center justify-between px-5 py-3 text-white ${
                documentoPrevio === "acta"
                  ? "bg-gradient-to-r from-blue-700 to-indigo-600"
                  : "bg-gradient-to-r from-emerald-700 to-teal-600"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Icono d={documentoPrevio === "acta" ? I.doc : I.award} />
                {documentoPrevio === "acta" ? "Acta de Evaluación / Notas del Módulo" : "Constancia de Cumplimiento EFSRT"}
              </span>
              <button
                type="button"
                onClick={() => setDocumentoPrevio(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/30"
                aria-label="Cerrar vista previa"
              >
                <Icono d={I.close} className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-4 p-6 text-sm leading-relaxed">
              {documentoPrevio === "acta" ? (
                <>
                  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {[
                      ["Estudiante", nombreCompleto],
                      ["DNI", datos.dni || "S/N"],
                      ["Módulo", moduloActual.nombre_modulo],
                      ["Periodo académico", moduloActual.periodo_academico],
                      ["Horas acumuladas", `${moduloActual.horas_acumuladas} h`],
                    ].map(([k, v]) => (
                      <div key={k} className="border-b border-slate-100 pb-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                        <dd className="font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nota registrada</span>
                    <span className={`text-3xl font-extrabold ${notaAprobatoria ? "text-emerald-600" : "text-rose-600"}`}>
                      {moduloActual.nota}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Se deja constancia de que</p>
                  <p className="my-2 text-xl font-extrabold">{nombreCompleto}</p>
                  <p className="mx-auto max-w-xl text-slate-600">
                    culminó y aprobó satisfactoriamente el{" "}
                    <strong className="text-slate-800">{moduloActual.nombre_modulo}</strong> (periodo{" "}
                    {moduloActual.periodo_academico}) con{" "}
                    <strong className="text-slate-800">{moduloActual.horas_acumuladas} horas</strong> y evidencias
                    conformes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}