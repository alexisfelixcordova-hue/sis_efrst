import { useState, useEffect } from "react";
import { Pencil, X, Save, Loader2, IdCard, Phone } from "lucide-react";

/* ========== Funciones de ayuda (también las usan ResumenAlumno, CabeceraExpediente y ExpedienteAlumno) ========== */

// Convierte cualquier valor (texto, número u objeto { nombre }) en texto limpio.
const texto = (v) => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return texto(v[0]);
  if (typeof v === "object") {
    return texto(v.nombre ?? v.name ?? v.descripcion ?? v.label ?? "");
  }
  return String(v).trim();
};

const esObjeto = (v) => v && typeof v === "object" && !Array.isArray(v);
const esId = (k) => /(^id[_A-Z])|(_id$)|^id$/i.test(k);

// Devuelve el objeto y sus objetos anidados (hasta 2 niveles; de los arrays toma el primer elemento).
function candidatos(obj) {
  const lista = [obj];
  const hijos = (o) =>
    Object.values(o)
      .map((v) => (Array.isArray(v) ? v[0] : v))
      .filter(esObjeto);
  const nivel1 = hijos(obj);
  lista.push(...nivel1);
  nivel1.forEach((o) => lista.push(...hijos(o)));
  return lista;
}

// Busca un valor: claves exactas y, si no, cualquier clave que cumpla la expresión regular.
export function buscarCampo(obj, claves = [], regex = null) {
  if (!esObjeto(obj)) return "";
  const lista = candidatos(obj);

  for (const o of lista) {
    for (const k of claves) {
      const t = texto(o[k]);
      if (t) return t;
    }
  }
  if (regex) {
    for (const o of lista) {
      for (const [k, v] of Object.entries(o)) {
        if (regex.test(k) && !esId(k)) {
          const t = texto(v);
          if (t) return t;
        }
      }
    }
  }
  return "";
}

export function datosAcademicos(e) {
  return {
    carrera: buscarCampo(
      e,
      [
        "carrera",
        "carrera_profesional",
        "nombre_carrera",
        "carrera_nombre",
        "programa",
        "programa_estudios",
        "programa_de_estudios",
        "escuela",
        "escuela_profesional",
        "especialidad",
      ],
      /carrera|programa|escuela|especialidad/i
    ),
    ciclo: buscarCampo(
      e,
      ["ciclo", "semestre", "periodo_academico", "ciclo_academico", "nombre_ciclo", "nivel"],
      /ciclo|semestre/i
    ),
    seccion: buscarCampo(e, ["seccion", "sección", "nombre_seccion", "grupo", "aula"], /secci/i),
    estado: buscarCampo(e, ["estado", "situacion", "estado_practicas", "estado_academico"]),
  };
}

// "VI Semestre" -> "VI Semestre" | "6" -> "Ciclo 6"
export function formatCiclo(ciclo) {
  if (!ciclo) return "";
  return /ciclo|semestre/i.test(ciclo) ? ciclo : `Ciclo ${ciclo}`;
}

// Docente asesor: puede venir como texto o como objeto.
export function datosDocente(e, docenteProp) {
  const raw =
    docenteProp ??
    e?.docente ??
    e?.asesor ??
    e?.docente_asesor ??
    (e?.docente_nombre ? { nombre: e.docente_nombre, correo: e.docente_correo } : null);
  if (!raw) return null;
  if (typeof raw === "string") return { nombre: raw.trim(), correo: undefined };
  const nombre = raw.nombre || `${raw.nombres ?? ""} ${raw.apellidos ?? ""}`.trim();
  return nombre ? { ...raw, nombre } : null;
}

// Quita null / undefined / "" para que al mezclar objetos un vacío no pise un dato bueno.
export const sinVacios = (o) =>
  Object.fromEntries(
    Object.entries(o || {}).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );

/*
  Props:
    estudiante  -> datos del estudiante
    darkMode    -> modo oscuro
    puedeEditar -> muestra el botón "Editar datos" (ej. solo administradores)
    onGuardar   -> async (cambios) => guarda en el servidor; si falla debe lanzar Error(mensaje)

  `claves` = nombres posibles del campo en tu API (el primero que exista se usa para leer
  y también como nombre al guardar). Si no existe ninguno, se usa el primero de la lista.
*/
const SECCIONES = [
  {
    titulo: "Identificación",
    descripcion: "Datos de identidad del estudiante.",
    icon: IdCard,
    campos: [
      { id: "nombres", etiqueta: "Nombres", claves: ["nombres", "nombre"], requerido: true },
      { id: "apellidos", etiqueta: "Apellidos", claves: ["apellidos", "apellido"], requerido: true },
      {
        id: "codigo",
        etiqueta: "Código del estudiante",
        claves: ["codigo", "codigo_estudiante", "cod_estudiante"],
        soloLectura: true,
      },
      {
        id: "dni",
        etiqueta: "Documento de identidad (DNI)",
        claves: ["dni", "documento", "numero_documento"],
        tipo: "dni",
      },
    ],
  },
  {
    titulo: "Contacto",
    descripcion: "Medios para comunicarse con el estudiante.",
    icon: Phone,
    campos: [
      {
        id: "correo",
        etiqueta: "Correo electrónico",
        claves: ["correo", "email", "correo_electronico"],
        tipo: "email",
      },
      {
        id: "telefono",
        etiqueta: "Teléfono",
        claves: ["telefono", "celular", "telefono_celular"],
        tipo: "tel",
      },
      {
        id: "direccion",
        etiqueta: "Dirección",
        claves: ["direccion", "domicilio"],
        ancho: true,
      },
    ],
  },
];

const TODOS = SECCIONES.flatMap((s) => s.campos);

const valorDe = (estudiante, campo) => buscarCampo(estudiante, campo.claves);
const claveReal = (estudiante, campo) =>
  campo.claves.find((k) => estudiante?.[k] !== undefined && estudiante?.[k] !== null) ??
  campo.claves[0];

function validar(form) {
  const errores = {};
  for (const c of TODOS) {
    const v = (form[c.id] ?? "").trim();
    if (c.requerido && !v) errores[c.id] = "Obligatorio";
    else if (v && c.tipo === "dni" && !/^\d{8}$/.test(v)) errores[c.id] = "Debe tener 8 dígitos";
    else if (v && c.tipo === "email" && !/^\S+@\S+\.\S+$/.test(v)) errores[c.id] = "Correo no válido";
    else if (v && c.tipo === "tel" && !/^\d{9}$/.test(v)) errores[c.id] = "Debe tener 9 dígitos";
  }
  return errores;
}

export default function DatosPersonales({
  estudiante,
  darkMode = false,
  puedeEditar = false,
  onGuardar,
}) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});
  const [form, setForm] = useState({});

  const formDesdeEstudiante = () =>
    Object.fromEntries(TODOS.map((c) => [c.id, valorDe(estudiante, c)]));

  // Si cambia el alumno (y no se está editando), se reinicia el formulario
  useEffect(() => {
    if (!editando) setForm(formDesdeEstudiante());
  }, [estudiante]); // eslint-disable-line react-hooks/exhaustive-deps

  const empezar = () => {
    setForm(formDesdeEstudiante());
    setErrores({});
    setError("");
    setEditando(true);
  };

  const cancelar = () => {
    setEditando(false);
    setErrores({});
    setError("");
  };

  const guardar = async (e) => {
    e.preventDefault();
    const errs = validar(form);
    setErrores(errs);
    if (Object.keys(errs).length) return;

    // Solo se envía lo que realmente cambió
    const cambios = {};
    for (const c of TODOS) {
      if (c.soloLectura) continue;
      const nuevo = (form[c.id] ?? "").trim();
      if (nuevo !== valorDe(estudiante, c)) cambios[claveReal(estudiante, c)] = nuevo;
    }
    if (!Object.keys(cambios).length) return cancelar();

    setGuardando(true);
    setError("");
    try {
      await onGuardar?.(cambios);
      setEditando(false);
    } catch (err) {
      setError(err.message || "No se pudo guardar");
    }
    setGuardando(false);
  };

  // ---------- Estilos ----------
  const dm = darkMode;
  const borde = dm ? "border-slate-700/70" : "border-slate-200";
  const secundario = dm ? "text-slate-400" : "text-slate-500";
  const vacio = dm ? "text-slate-500" : "text-slate-400";
  const icono = dm ? "bg-slate-700/60 text-slate-300" : "bg-slate-100 text-slate-500";
  const botonGris = dm
    ? "border-slate-600 bg-slate-700/70 text-slate-100 hover:bg-slate-700"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
  const input = (conError) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
      conError
        ? "border-red-400 focus:ring-red-200"
        : dm
        ? "border-slate-600 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500/30"
        : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100"
    }`;

  return (
    <section
      className={`overflow-hidden rounded-2xl border shadow-sm ${borde} ${
        dm ? "bg-[#1e293b]" : "bg-white"
      }`}
    >
      {/* Encabezado */}
      <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6 ${borde}`}>
        <div>
          <h2 className="text-base font-semibold">Datos personales</h2>
          <p className={`mt-0.5 text-sm ${secundario}`}>Información general del estudiante.</p>
        </div>

        {puedeEditar && !editando && (
          <button
            type="button"
            onClick={empezar}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${botonGris}`}
          >
            <Pencil size={14} />
            Editar datos
          </button>
        )}
      </div>

      <form onSubmit={guardar} noValidate>
        <div className={`divide-y ${dm ? "divide-slate-700/70" : "divide-slate-100"}`}>
          {SECCIONES.map(({ titulo, descripcion, icon: Icono, campos }) => (
            <div key={titulo} className="px-5 py-5 sm:px-6">
              <div className="mb-4 flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${icono}`}>
                  <Icono size={15} />
                </span>
                <div className="leading-tight">
                  <h3 className="text-sm font-semibold">{titulo}</h3>
                  <p className={`text-xs ${secundario}`}>{descripcion}</p>
                </div>
              </div>

              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {campos.map((c) => {
                  const valor = valorDe(estudiante, c);
                  return (
                    <div key={c.id} className={c.ancho ? "sm:col-span-2" : ""}>
                      <dt className={`text-xs ${secundario}`}>
                        <label htmlFor={`dp-${c.id}`}>{c.etiqueta}</label>
                      </dt>
                      <dd className="mt-1">
                        {editando && !c.soloLectura ? (
                          <>
                            <input
                              id={`dp-${c.id}`}
                              type={c.tipo === "email" ? "email" : "text"}
                              inputMode={c.tipo === "dni" || c.tipo === "tel" ? "numeric" : undefined}
                              maxLength={c.tipo === "dni" ? 8 : c.tipo === "tel" ? 9 : undefined}
                              value={form[c.id] ?? ""}
                              onChange={(e) => setForm({ ...form, [c.id]: e.target.value })}
                              className={input(Boolean(errores[c.id]))}
                            />
                            {errores[c.id] && (
                              <p className="mt-1 text-xs text-red-500">{errores[c.id]}</p>
                            )}
                          </>
                        ) : (
                          <p className="break-words text-sm font-semibold">
                            {valor || (
                              <span className={`font-normal ${vacio}`}>No registrado</span>
                            )}
                          </p>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>

        {/* Barra de acciones al editar */}
        {editando && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 sm:px-6 ${borde} ${
              dm ? "bg-slate-800/50" : "bg-slate-50"
            }`}
          >
            <p className={`text-sm ${error ? "text-red-500" : secundario}`}>
              {error || "El código del estudiante no se puede modificar."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${botonGris}`}
              >
                <X size={15} />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}