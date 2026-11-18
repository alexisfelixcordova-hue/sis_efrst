
import { useState, useEffect } from "react";
import {
  Search,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  Star,
  MessageSquare,
  GraduationCap,
  Upload,
  Paperclip,
  X,
  Building2,
  Eye,
  Trash2
} from "lucide-react";

import {
  tema,
  foco,
  Cabecera,
  iniciales
} from "../Docente/componentes/DocenteComun.jsx";

const TIPOS = [
  "Bitácora semanal",
  "Informe parcial",
  "Informe final"
];

const CRITERIOS = [
  "Puntualidad en la entrega",
  "Calidad técnica del trabajo",
  "Redacción y formato",
  "Aplicación de conocimientos"
];

const NIVELES = [1, 2, 3, 4, 5];

const STORAGE_ALUMNOS = "evaluacion_evidencias_alumnos_demo";
const STORAGE_EVALUACIONES = "docente_evaluaciones";

const alumnosIniciales = [
  {
    dni: "72845163",
    nombre: "Carlos Mendoza Flores",
    entidad: "WORLDNIC S.A.C.",
    proyecto: "Sistema de gestión empresarial",
    estado: "En proceso"
  },
  {
    dni: "74125896",
    nombre: "María Fernanda Torres",
    entidad: "WORLDNIC S.A.C.",
    proyecto: "Diseño de plataforma web",
    estado: "En proceso"
  },
  {
    dni: "71963254",
    nombre: "José Antonio Rojas",
    entidad: "Tech Solutions Perú",
    proyecto: "Sistema de soporte técnico",
    estado: "Completado"
  },
  {
    dni: "73698521",
    nombre: "Andrea Lucía Vargas",
    entidad: "Tech Solutions Perú",
    proyecto: "Desarrollo de tienda virtual",
    estado: "En proceso"
  },
  {
    dni: "75214869",
    nombre: "Luis Alberto Castillo",
    entidad: "Innovatec Digital",
    proyecto: "Aplicación de gestión de inventario",
    estado: "Pendiente"
  },
  {
    dni: "76852314",
    nombre: "Valeria Sánchez Ruiz",
    entidad: "Innovatec Digital",
    proyecto: "Diseño de interfaz administrativa",
    estado: "En proceso"
  }
];

const leerStorage = (clave, inicial) => {
  try {
    const datos = localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : inicial;
  } catch {
    return inicial;
  }
};

const notaDe = (puntos) => {
  const total = CRITERIOS.reduce(
    (suma, criterio) => suma + (puntos[criterio] || 0),
    0
  );

  return Math.round((total / (CRITERIOS.length * 5)) * 20);
};

const formatoPeso = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function EvaluacionEvidencias({ darkMode }) {
  const d = !!darkMode;
  const t = tema(d);

  const [alumnos] = useState(() =>
    leerStorage(STORAGE_ALUMNOS, alumnosIniciales)
  );

  const [evals, setEvals] = useState(() =>
    leerStorage(STORAGE_EVALUACIONES, {})
  );

  const [archivos, setArchivos] = useState({});

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("Pendientes");
  const [sel, setSel] = useState(null);

  const [borrador, setBorrador] = useState({
    puntos: {},
    comentario: ""
  });

  const [aviso, setAviso] = useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_ALUMNOS,
      JSON.stringify(alumnos)
    );
  }, [alumnos]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_EVALUACIONES,
        JSON.stringify(evals)
      );
    } catch (error) {
      console.error("No se pudieron guardar las evaluaciones:", error);
    }
  }, [evals]);

  const evidencias = alumnos.flatMap((alumno) =>
    TIPOS.map((tipo) => ({
      clave: `${alumno.dni}|${tipo}`,
      a: alumno,
      tipo
    }))
  );

  const hecha = (e) => !!evals[e.clave];

  const pendientes = evidencias.filter((e) => !hecha(e)).length;
  const evaluadas = evidencias.length - pendientes;

  const visibles = evidencias.filter((e) => {
    const coincideFiltro =
      filtro === "Todas" ||
      (filtro === "Pendientes" && !hecha(e)) ||
      (filtro === "Evaluadas" && hecha(e));

    const coincideBusqueda =
      `${e.a.nombre} ${e.a.entidad} ${e.tipo}`
        .toLowerCase()
        .includes(q.toLowerCase());

    return coincideFiltro && coincideBusqueda;
  });

  const actual =
    visibles.find((e) => e.clave === sel) || visibles[0];

  useEffect(() => {
    if (!actual) {
      setBorrador({
        puntos: {},
        comentario: ""
      });
      setSel(null);
      setAviso("");
      return;
    }

    const guardada = evals[actual.clave];

    setSel(actual.clave);

    setBorrador(
      guardada
        ? {
            puntos: { ...guardada.puntos },
            comentario: guardada.comentario || ""
          }
        : {
            puntos: {},
            comentario: ""
          }
    );

    setAviso("");
  }, [actual?.clave]);

  const elegir = (e) => {
    setSel(e.clave);
    setAviso("");

    setBorrador(
      evals[e.clave]
        ? {
            puntos: { ...evals[e.clave].puntos },
            comentario: evals[e.clave].comentario || ""
          }
        : {
            puntos: {},
            comentario: ""
          }
    );
  };

  // Archivos temporales del docente
  const adjuntarArchivos = (e) => {
    const nuevos = Array.from(e.target.files || []);

    if (!actual || nuevos.length === 0) return;

    const permitidos = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png"
    ];

    const validos = nuevos.filter((archivo) =>
      permitidos.includes(archivo.type)
    );

    if (validos.length !== nuevos.length) {
      setAviso("Algunos archivos tienen un formato no permitido.");
    }

    const MAX_MB = 15;
    const dentroDelLimite = validos.filter(
      (archivo) => archivo.size <= MAX_MB * 1024 * 1024
    );

    if (dentroDelLimite.length !== validos.length) {
      setAviso("Cada archivo debe pesar como máximo 15 MB.");
    }

    if (dentroDelLimite.length > 0) {
      setArchivos((prev) => ({
        ...prev,
        [actual.clave]: [
          ...(prev[actual.clave] || []),
          ...dentroDelLimite
        ]
      }));

      setAviso("");
    }

    e.target.value = "";
  };

  const eliminarArchivo = (indice) => {
    if (!actual) return;

    setArchivos((prev) => ({
      ...prev,
      [actual.clave]: (prev[actual.clave] || []).filter(
        (_, i) => i !== indice
      )
    }));
  };

  const abrirArchivo = (archivo) => {
    const url = URL.createObjectURL(archivo);
    const ventana = window.open(url, "_blank");

    if (!ventana) {
      URL.revokeObjectURL(url);
      setAviso("Permite las ventanas emergentes para visualizar el archivo.");
      return;
    }

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const archivosActuales = actual
    ? archivos[actual.clave] || []
    : [];

  const calificar = (criterio, nivel) => {
    setBorrador((prev) => ({
      ...prev,
      puntos: {
        ...prev.puntos,
        [criterio]: nivel
      }
    }));

    setAviso("");
  };

  const completo = CRITERIOS.every(
    (criterio) => borrador.puntos[criterio]
  );

  const nota = notaDe(borrador.puntos);

  const guardar = () => {
    if (!actual) return;

    if (archivosActuales.length === 0) {
      setAviso("Adjunta al menos una evidencia antes de evaluar.");
      return;
    }

    if (!completo) {
      setAviso("Califica los cuatro criterios antes de guardar.");
      return;
    }

    setEvals((prev) => ({
      ...prev,
      [actual.clave]: {
        puntos: borrador.puntos,
        comentario: borrador.comentario,
        nota,
        fecha: new Date().toLocaleDateString("es-PE"),
        cantidadArchivos: archivosActuales.length,
        nombresArchivos: archivosActuales.map((archivo) => archivo.name)
      }
    }));

    setAviso("Evaluación guardada correctamente.");
  };

  const tarjeta = d
    ? "bg-[#172337] border border-slate-700/70"
    : "bg-white border border-slate-200";

  const secundario = d ? "text-slate-400" : "text-slate-500";

  const progreso = evidencias.length
    ? Math.round((evaluadas / evidencias.length) * 100)
    : 0;

  return (
    <div className={`space-y-6 text-sm ${t.texto}`}>

      <Cabecera
        t={t}
        titulo="Evaluación de Evidencias"
        subtitulo="Registra, adjunta y califica las evidencias presentadas por tus practicantes."
        pill={`Por evaluar: ${pendientes}`}
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={secundario}>Total evidencias</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <FileText size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{evidencias.length}</p>
          <p className={`mt-1 text-xs ${secundario}`}>
            Evidencias disponibles
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={secundario}>Pendientes</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Clock size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{pendientes}</p>
          <p className={`mt-1 text-xs ${secundario}`}>
            Por revisar y calificar
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={secundario}>Evaluadas</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{evaluadas}</p>
          <p className={`mt-1 text-xs ${secundario}`}>
            Evaluaciones completadas
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={secundario}>Practicantes</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <Users size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{alumnos.length}</p>
          <p className={`mt-1 text-xs ${secundario}`}>
            Alumnos registrados
          </p>
        </div>

      </div>

      {/* Progreso general */}
      <div className={`${tarjeta} rounded-2xl p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold">Progreso de evaluaciones</h3>
            <p className={`mt-1 text-xs ${secundario}`}>
              Porcentaje de evidencias calificadas
            </p>
          </div>
          <span className="text-xl font-bold text-blue-500">
            {progreso}%
          </span>
        </div>

        <div className={`h-2.5 overflow-hidden rounded-full ${d ? "bg-slate-700" : "bg-slate-100"}`}>
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid items-start gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">

        {/* Bandeja de evidencias */}
        <section className={`${tarjeta} overflow-hidden rounded-2xl`}>

          <div className={`space-y-4 border-b p-4 ${t.borde}`}>

            <div>
              <h2 className="font-bold">Bandeja de evaluaciones</h2>
              <p className={`mt-1 text-xs ${secundario}`}>
                Selecciona un practicante y su evidencia
              </p>
            </div>

            <div className="relative">
              <Search
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${secundario}`}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar alumno o evidencia..."
                className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-600/15 ${t.entrada}`}
              />
            </div>

            <div className="flex gap-1.5">
              {["Pendientes", "Evaluadas", "Todas"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  aria-pressed={filtro === f}
                  className={`flex-1 cursor-pointer rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${foco} ${
                    filtro === f ? t.chipOn : t.boton
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

          </div>

          <ul className="max-h-[600px] overflow-y-auto">

            {visibles.map((e) => (

              <li key={e.clave}>
                <button
                  onClick={() => elegir(e)}
                  className={`flex w-full cursor-pointer items-center gap-3 border-b border-l-2 px-4 py-3.5 text-left transition-colors ${
                    actual?.clave === e.clave
                      ? `border-l-blue-600 ${d ? "bg-blue-500/10" : "bg-blue-50/60"}`
                      : `border-l-transparent ${t.fila}`
                  } ${t.borde}`}
                >

                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    d
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {iniciales(e.a.nombre)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {e.a.nombre}
                    </span>
                    <span className={`mt-1 block truncate text-[11px] ${secundario}`}>
                      {e.tipo}
                    </span>
                  </span>

                  {hecha(e) ? (
                    <span className="text-sm font-bold text-emerald-600">
                      {evals[e.clave].nota}/20
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600">
                      Pendiente
                    </span>
                  )}

                </button>
              </li>

            ))}

            {visibles.length === 0 && (
              <li className={`px-5 py-12 text-center ${secundario}`}>
                <ClipboardCheck size={30} className="mx-auto mb-3 opacity-50" />
                <p className="text-xs font-medium">
                  No se encontraron evidencias.
                </p>
                <p className="mt-1 text-[11px]">
                  Prueba con otro filtro o búsqueda.
                </p>
              </li>
            )}

          </ul>

        </section>

        {/* Panel de evaluación */}
        {actual ? (

          <section className={`${tarjeta} rounded-2xl p-5 sm:p-6`}>

            {/* Información del alumno */}
            <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-5 ${t.borde}`}>

              <div className="flex items-start gap-3">

                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
                  <GraduationCap size={24} />
                </div>

                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${secundario}`}>
                    {actual.tipo}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    {actual.a.nombre}
                  </h2>
                  <p className={`mt-1 text-xs ${secundario}`}>
                    DNI: {actual.a.dni}
                  </p>
                </div>

              </div>

              {hecha(actual) && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={14} />
                  Evaluada
                </span>
              )}

            </div>

            {/* Información adicional */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <div className={`rounded-xl p-3 ${d ? "bg-slate-800/70" : "bg-slate-50"}`}>
                <p className={`flex items-center gap-1.5 text-[11px] ${secundario}`}>
                  <Building2 size={13} />
                  Entidad de prácticas
                </p>
                <p className="mt-1 text-xs font-semibold">
                  {actual.a.entidad}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${d ? "bg-slate-800/70" : "bg-slate-50"}`}>
                <p className={`text-[11px] ${secundario}`}>
                  Proyecto asignado
                </p>
                <p className="mt-1 text-xs font-semibold">
                  {actual.a.proyecto}
                </p>
              </div>

            </div>

            {/* Adjuntar evidencias */}
            <div className={`mt-7 rounded-2xl border p-5 ${
              d
                ? "border-slate-700 bg-slate-800/40"
                : "border-slate-200 bg-slate-50/70"
            }`}>

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>
                  <div className="flex items-center gap-2">
                    <Paperclip size={18} className="text-blue-500" />
                    <h3 className="font-bold">Evidencias adjuntas</h3>
                  </div>

                  <p className={`mt-1 text-xs ${secundario}`}>
                    Documentos recopilados y adjuntados por el docente.
                  </p>
                </div>

                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  archivosActuales.length
                    ? "bg-emerald-500/10 text-emerald-600"
                    : d
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-200 text-slate-600"
                }`}>
                  {archivosActuales.length} archivos
                </span>

              </div>

              {/* Zona de carga */}
              <label className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition hover:border-blue-500 ${
                d
                  ? "border-slate-600 bg-slate-800/50 hover:bg-blue-500/5"
                  : "border-slate-300 bg-white hover:bg-blue-50/50"
              }`}>

                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Upload size={23} />
                </div>

                <p className="mt-3 text-sm font-bold">
                  Adjuntar evidencias
                </p>

                <p className={`mt-1 text-xs ${secundario}`}>
                  Selecciona documentos desde tu computadora
                </p>

                <p className={`mt-2 text-[10px] ${secundario}`}>
                  PDF, Word, Excel e imágenes · Máximo 15 MB por archivo
                </p>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={adjuntarArchivos}
                  className="hidden"
                />

              </label>

              {/* Lista de archivos */}
              <div className="mt-4 space-y-2">

                {archivosActuales.map((archivo, index) => (

                  <div
                    key={`${archivo.name}-${index}`}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      d
                        ? "border-slate-700 bg-slate-800"
                        : "border-slate-200 bg-white"
                    }`}
                  >

                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                      <FileText size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">
                        {archivo.name}
                      </p>

                      <p className={`mt-1 text-[10px] ${secundario}`}>
                        {formatoPeso(archivo.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirArchivo(archivo)}
                      title="Visualizar archivo"
                      className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-blue-500 transition hover:bg-blue-500/10"
                    >
                      <Eye size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarArchivo(index)}
                      title="Eliminar archivo"
                      className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-red-500 transition hover:bg-red-500/10"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                ))}

                {archivosActuales.length === 0 && (
                  <p className={`py-3 text-center text-xs ${secundario}`}>
                    Todavía no se han adjuntado evidencias para esta evaluación.
                  </p>
                )}

              </div>

              <div className={`mt-4 flex items-start gap-2 border-t pt-3 ${t.borde}`}>
                <Clock size={14} className={`mt-0.5 shrink-0 ${secundario}`} />

                <p className={`text-[10px] leading-relaxed ${secundario}`}>
                  Los archivos son temporales y permanecen disponibles mientras
                  esta sesión de la aplicación esté abierta. Al recargar la
                  página se deberán adjuntar nuevamente.
                </p>
              </div>

            </div>

            {/* Rúbrica */}
            <div className="mt-7">

              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold">Rúbrica de evaluación</h3>
                  <p className={`mt-1 text-xs ${secundario}`}>
                    Asigna un nivel de desempeño a cada criterio.
                  </p>
                </div>

                <span className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${d ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  Escala del 1 al 5
                </span>
              </div>

              <div className="space-y-5">

                {CRITERIOS.map((criterio, index) => (

                  <div key={criterio}>

                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold">
                        {index + 1}. {criterio}
                      </span>

                      <span className={`text-[11px] ${secundario}`}>
                        {borrador.puntos[criterio]
                          ? `${borrador.puntos[criterio]}/5`
                          : "Sin calificar"}
                      </span>
                    </div>

                    <div className="flex gap-2">

                      {NIVELES.map((nivel) => (

                        <button
                          key={nivel}
                          onClick={() => calificar(criterio, nivel)}
                          aria-label={`${criterio}: ${nivel} puntos`}
                          aria-pressed={borrador.puntos[criterio] === nivel}
                          className={`grid h-10 flex-1 cursor-pointer place-items-center rounded-lg border text-xs font-bold transition-all ${foco} ${
                            borrador.puntos[criterio] === nivel
                              ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                              : t.boton
                          }`}
                        >
                          {nivel}
                        </button>

                      ))}

                    </div>

                    <div className={`mt-1.5 flex justify-between text-[10px] ${secundario}`}>
                      <span>Deficiente</span>
                      <span>Excelente</span>
                    </div>

                  </div>

                ))}

              </div>

            </div>

            {/* Comentarios */}
            <div className="mt-7">

              <label
                htmlFor="ev-com"
                className="mb-2 flex items-center gap-2 text-xs font-bold"
              >
                <MessageSquare size={15} />
                Comentarios y observaciones
              </label>

              <textarea
                id="ev-com"
                rows={4}
                value={borrador.comentario}
                onChange={(e) =>
                  setBorrador((prev) => ({
                    ...prev,
                    comentario: e.target.value
                  }))
                }
                placeholder="Escribe observaciones, recomendaciones o aspectos que el alumno debe mejorar..."
                className={`w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/15 ${t.entrada}`}
              />

            </div>

            {/* Resultado y guardado */}
            <div className={`mt-6 flex flex-col gap-5 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
              d
                ? "border-slate-700 bg-slate-800/50"
                : "border-slate-200 bg-slate-50"
            }`}>

              <div>
                <p className={`text-xs font-semibold ${secundario}`}>
                  CALIFICACIÓN FINAL
                </p>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-4xl font-extrabold tabular-nums ${
                    !completo
                      ? secundario
                      : nota >= 11
                        ? "text-emerald-600"
                        : "text-red-600"
                  }`}>
                    {completo ? nota : "--"}
                  </span>

                  <span className={`text-sm ${secundario}`}>
                    / 20 puntos
                  </span>
                </div>

                <p className={`mt-1 text-[11px] ${secundario}`}>
                  {completo
                    ? nota >= 11
                      ? "Calificación aprobatoria"
                      : "Calificación desaprobatoria"
                    : "Completa los cuatro criterios"}
                </p>
              </div>

              <div className="flex flex-col gap-2">

                {aviso && (
                  <span
                    role="status"
                    className={`max-w-xs text-xs font-medium ${
                      aviso.startsWith("Evaluación")
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {aviso}
                  </span>
                )}

                <button
                  onClick={guardar}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-700 ${foco}`}
                >
                  <ClipboardCheck size={16} />
                  {hecha(actual)
                    ? "Actualizar evaluación"
                    : "Guardar evaluación"}
                </button>

              </div>

            </div>

            {hecha(actual) && (
              <p className={`mt-3 text-right text-[11px] ${secundario}`}>
                Última evaluación: {evals[actual.clave].fecha}
              </p>
            )}

          </section>

        ) : (

          <section className={`${tarjeta} flex min-h-[400px] flex-col items-center justify-center rounded-2xl p-8 text-center`}>
            <Star size={38} className={`mb-3 ${secundario}`} />
            <h3 className="font-bold">No hay evidencias disponibles</h3>
            <p className={`mt-2 max-w-sm text-xs ${secundario}`}>
              No hay registros que coincidan con los filtros seleccionados.
            </p>
          </section>

        )}

      </div>

      <p className={`text-center text-[11px] ${secundario}`}>
        Datos de demostración almacenados localmente. Los archivos adjuntos son temporales.
      </p>

    </div>
  );
}
