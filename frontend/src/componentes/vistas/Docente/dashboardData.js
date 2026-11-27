import { normalizarNombreModulo } from "../../../utils/moduloSistema.js";

export const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.alumnos)) return payload.alumnos;
  return [];
};

const nombreDe = (estudiante, fila) =>
  estudiante.nombre ||
  estudiante.name ||
  fila.nombre ||
  fila.name ||
  [estudiante.nombres, estudiante.apellidos].filter(Boolean).join(" ").trim() ||
  "Estudiante";

const estadoDe = (fila) =>
  String(
    fila.estado_efsrt ??
      fila.estado_expediente ??
      fila.estado ??
      fila.estado_modulo ??
      ""
  ).trim();

export const normalizarAsignacion = (fila = {}, indice = 0) => {
  const estudiante = fila.estudiante || fila.alumno || fila;
  const id = estudiante.id_estudiante ?? estudiante.id ?? fila.id_estudiante ?? `fila-${indice}`;
  const modulo =
    fila.modulo_nombre ||
    fila.nombre_modulo ||
    fila.modulo ||
    "Nombre de módulo no disponible";
  const empresa =
    fila.empresa_razon_social ||
    fila.razon_social ||
    fila.empresa_nombre ||
    (fila.id_empresa ? `Empresa #${fila.id_empresa}` : "");
  const notaCruda = fila.nota ?? fila.calificacion ?? fila.promedio;
  const nota = notaCruda === null || notaCruda === undefined || notaCruda === ""
    ? null
    : Number(notaCruda);

  return {
    ...estudiante,
    ...fila,
    id_estudiante: id,
    nombre: nombreDe(estudiante, fila),
    dni: estudiante.dni || fila.dni || "",
    modulo_nombre: normalizarNombreModulo(modulo),
    empresa_nombre: empresa,
    estado_resumen: estadoDe(fila),
    nota_resumen: Number.isFinite(nota) ? nota : null,
    _clave_alumno: String(id),
  };
};

const estadoAgrupado = (estado) => {
  const valor = String(estado || "").toLowerCase();
  if (/observ|correg|rechaz/.test(valor)) return "observado";
  if (/aprob|complet|valid|finaliz/.test(valor)) return "completo";
  return "pendiente";
};

export const resumirAsignaciones = (payload) => {
  const filas = extraerLista(payload).map(normalizarAsignacion);
  const alumnos = new Map();
  const modulos = new Map();
  const empresas = new Map();
  let completos = 0;
  let observados = 0;
  let pendientes = 0;
  const notas = [];

  filas.forEach((fila) => {
    const previo = alumnos.get(fila._clave_alumno);
    if (!previo) {
      alumnos.set(fila._clave_alumno, {
        ...fila,
        modulos: [fila.modulo_nombre],
      });
    } else if (!previo.modulos.includes(fila.modulo_nombre)) {
      previo.modulos.push(fila.modulo_nombre);
    }

    const claveModulo = String(fila.id_modulo ?? fila.modulo_nombre);
    if (!modulos.has(claveModulo)) {
      modulos.set(claveModulo, { nombre: fila.modulo_nombre, alumnos: new Set() });
    }
    modulos.get(claveModulo).alumnos.add(fila._clave_alumno);

    if (fila.empresa_nombre) {
      const claveEmpresa = String(fila.id_empresa ?? fila.empresa_nombre);
      if (!empresas.has(claveEmpresa)) {
        empresas.set(claveEmpresa, { nombre: fila.empresa_nombre, alumnos: new Set() });
      }
      empresas.get(claveEmpresa).alumnos.add(fila._clave_alumno);
    }

    const estado = estadoAgrupado(fila.estado_resumen);
    if (estado === "completo") completos += 1;
    else if (estado === "observado") observados += 1;
    else pendientes += 1;
    if (fila.nota_resumen !== null) notas.push(fila.nota_resumen);
  });

  return {
    filas,
    alumnos: [...alumnos.values()],
    modulos: [...modulos.values()]
      .map((item) => ({ nombre: item.nombre, total: item.alumnos.size }))
      .sort((a, b) => b.total - a.total),
    empresas: [...empresas.values()]
      .map((item) => ({ nombre: item.nombre, total: item.alumnos.size }))
      .sort((a, b) => b.total - a.total),
    total: alumnos.size,
    completos,
    observados,
    pendientes,
    promedioNota: notas.length
      ? Math.round((notas.reduce((suma, nota) => suma + nota, 0) / notas.length) * 10) / 10
      : null,
  };
};

export const resumirProyectos = (payload) => {
  const filas = extraerLista(payload);
  const resumen = payload?.resumen || {};
  const total = Number(resumen.total ?? filas.length) || 0;
  const estados = [
    { nombre: "Por iniciar", total: Number(resumen.por_iniciar) || 0, color: "#94a3b8" },
    { nombre: "En curso", total: Number(resumen.en_curso) || 0, color: "#3b82f6" },
    { nombre: "En revisión", total: Number(resumen.en_revision) || 0, color: "#f59e0b" },
    { nombre: "Finalizado", total: Number(resumen.finalizado) || 0, color: "#10b981" },
  ];

  if (filas.length && !Number.isFinite(Number(resumen.total))) {
    estados.forEach((estado) => {
      estado.total = filas.filter(
        (proyecto) => String(proyecto.estado || "").toLowerCase() === estado.nombre.toLowerCase()
      ).length;
    });
  }

  return {
    filas,
    total,
    avancePromedio: Number(resumen.avance_promedio) || 0,
    estados,
    porVencer: Number(resumen.por_vencer) || 0,
  };
};
