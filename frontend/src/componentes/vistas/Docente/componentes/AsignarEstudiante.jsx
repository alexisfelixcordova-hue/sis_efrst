import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useDeferredValue,
} from "react";
import {
  ArrowLeft,
  Search,
  Users,
  GraduationCap,
  UserCheck,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  ChevronsRight,
  ChevronsLeft,
  Inbox,
  ArrowRightLeft,
  Building2,
  CalendarDays,
  BookOpen,
  Calendar,
  Save,
  CheckCircle2,
  Briefcase,
  FileCheck2,
  X,
} from "lucide-react";
import api, { getCachedData, invalidateApiCache } from "../../../../api/axios";
import AvatarEstudiante from "../../../AvatarEstudiante.jsx";

const k = (id) => String(id);

const obtenerIdDocente = (d) => d?.id_docente ?? d?.id ?? d?.id_usuario;
const obtenerIdEstudiante = (e) =>
  e?.id_estudiante ??
  e?.estudiante_id ??
  e?.alumno_id ??
  e?.estudiante?.id_estudiante ??
  e?.estudiante?.id ??
  e?.alumno?.id_estudiante ??
  e?.alumno?.id ??
  e?.id ??
  e?.id_usuario;
const obtenerIdModulo = (m) => m?.id_modulo ?? m?.id;
const obtenerIdEmpresa = (emp) => emp?.id_empresa ?? emp?.id;

const MODULOS_BASE_EFSRT = [
  { id_modulo: "1", numero_modulo: 1, nombre: "Módulo I", orden: 1 },
  { id_modulo: "2", numero_modulo: 2, nombre: "Módulo II", orden: 2 },
  { id_modulo: "3", numero_modulo: 3, nombre: "Módulo III", orden: 3 },
];

const detectarNumeroModulo = (raw, fallbackNum = 1) => {
  const directo = Number(raw?.numero_modulo ?? raw?.numero ?? raw?.orden);
  if ([1, 2, 3].includes(directo)) return directo;

  const texto = String(
    raw?.nombre ??
      raw?.nombre_modulo ??
      raw?.modulo ??
      raw?.titulo ??
      raw?.descripcion ??
      ""
  ).toLowerCase();

  if (/\b(3|iii|3°)\b/i.test(texto)) return 3;
  if (/\b(2|ii|2°)\b/i.test(texto)) return 2;
  if (/\b(1|i|1°)\b/i.test(texto)) return 1;

  const idNum = Number(raw?.id_modulo ?? raw?.modulo_id ?? raw?.id);
  if ([1, 2, 3].includes(idNum)) return idNum;

  return [1, 2, 3].includes(fallbackNum) ? fallbackNum : 1;
};

const normalizarModulosCon123 = (arreglo = []) => {
  const lista = Array.isArray(arreglo) ? arreglo : [];
  if (lista.length === 0) return MODULOS_BASE_EFSRT;

  const enriquecidos = lista.map((m, idx) => {
    const rawNombre = String(
      m?.nombre ??
        m?.nombre_modulo ??
        m?.modulo ??
        m?.titulo ??
        m?.descripcion ??
        ""
    ).trim();
    const numDetectado = detectarNumeroModulo(m, idx + 1);

    const etiqueta =
      rawNombre ||
      (numDetectado === 1
        ? "Módulo I"
        : numDetectado === 2
        ? "Módulo II"
        : numDetectado === 3
        ? "Módulo III"
        : `Módulo ${numDetectado}`);

    return {
      ...m,
      id_modulo: obtenerIdModulo(m) ?? String(numDetectado),
      numero_modulo: numDetectado,
      nombre: etiqueta,
      _orden: numDetectado,
    };
  });

  [1, 2, 3].forEach((n) => {
    const yaExiste = enriquecidos.some((item) => item._orden === n);
    if (!yaExiste) {
      enriquecidos.push({
        id_modulo: String(n),
        numero_modulo: n,
        nombre: n === 1 ? "Módulo I" : n === 2 ? "Módulo II" : "Módulo III",
        _orden: n,
      });
    }
  });

  return enriquecidos.sort((a, b) => a._orden - b._orden);
};

const nombreModuloDe = (m) =>
  m?.nombre ?? m?.nombre_modulo ?? m?.modulo ?? m?.titulo ?? m?.descripcion ?? "";

const nombreEmpresaDe = (emp) =>
  emp?.razon_social ??
  emp?.nombre_comercial ??
  emp?.nombre ??
  emp?.empresa ??
  "";

const ubicacionEmpresaDe = (emp) =>
  emp?.direccion ??
  emp?.ubicacion ??
  emp?.distrito ??
  emp?.provincia ??
  emp?.region ??
  "";

const basePersonaDe = (p) => p?.estudiante || p?.alumno || p || {};

const nombresDe = (p) => {
  const base = basePersonaDe(p);
  return base?.nombres || base?.nombre || "";
};

const apellidosDe = (p) => {
  const base = basePersonaDe(p);
  return base?.apellidos || "";
};

const nombreDe = (p) => `${nombresDe(p)} ${apellidosDe(p)}`.trim();

const especialidadDocenteDe = (d) =>
  d?.especialidad ||
  d?.programa_estudios ||
  d?.departamento ||
  d?.cargo ||
  "Asesor EFSRT";

const dniDe = (e) => {
  const base = basePersonaDe(e);
  return base.dni || base.numero_documento || "Sin DNI";
};

const programaDe = (e) => {
  const base = basePersonaDe(e);
  return base.programa_estudios || base.programa || base.especialidad || "";
};

const correoDe = (e) => {
  const base = basePersonaDe(e);
  return base.correo || base.email || "";
};

const iniciales = (texto = "") =>
  texto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

const hoyISO = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const coincide = (est, q) =>
  !q ||
  [nombreDe(est), dniDe(est), correoDe(est), programaDe(est)]
    .join(" ")
    .toLowerCase()
    .includes(q);

const extraerLista = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.estudiantes)) return payload.data.estudiantes;
  if (Array.isArray(payload?.data?.asignaciones)) return payload.data.asignaciones;
  if (Array.isArray(payload?.estudiantes)) return payload.estudiantes;
  if (Array.isArray(payload?.asignaciones)) return payload.asignaciones;
  if (Array.isArray(payload?.alumnos)) return payload.alumnos;
  if (Array.isArray(payload?.docentes)) return payload.docentes;
  if (Array.isArray(payload?.empresas)) return payload.empresas;
  if (Array.isArray(payload?.modulos)) return payload.modulos;
  return [];
};

const extraerDocenteDeEstudiante = (est) =>
  est?.id_docente ??
  est?.docente_id ??
  est?.id_docente_asesor ??
  est?.id_asesor ??
  est?.asesor_id ??
  est?.asignacion?.id_docente ??
  est?.asignacion?.docente_id ??
  null;

const extraerModuloDeEstudiante = (est) =>
  est?.id_modulo ??
  est?.modulo_id ??
  est?.modulo ??
  est?.asignacion?.id_modulo ??
  est?.asignacion?.modulo_id ??
  null;

const extraerDocenteDeModulo = (mod) =>
  mod?.id_docente ??
  mod?.docente_id ??
  mod?.id_asesor ??
  mod?.asesor_id ??
  mod?.docente?.id_docente ??
  mod?.docente?.id ??
  null;

const leerRegistroLocalModulo = (idEst, idMod, numMod) => {
  const claves = [
    `expediente_efsrt_${idEst}_${idMod}`,
    `expediente_efsrt_${idEst}_m${numMod}`,
    `expediente_efsrt_${idEst}_${numMod}`,
    `asignacion_efsrt_${idEst}_${idMod}`,
    `asignacion_efsrt_${idEst}_m${numMod}`,
    `asignacion_efsrt_${idEst}_${numMod}`,
  ];
  for (const clave of claves) {
    try {
      const raw =
        sessionStorage.getItem(clave) ?? localStorage.getItem(clave);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignorar */
    }
  }
  return null;
};

const guardarRegistroLocalModulo = (idEst, idMod, numMod, obj) => {
  const serialized = JSON.stringify(obj);
  const claves = [
    `expediente_efsrt_${idEst}_${idMod}`,
    `expediente_efsrt_${idEst}_m${numMod}`,
    `expediente_efsrt_${idEst}_${numMod}`,
    `asignacion_efsrt_${idEst}_${idMod}`,
    `asignacion_efsrt_${idEst}_m${numMod}`,
    `asignacion_efsrt_${idEst}_${numMod}`,
  ];
  claves.forEach((clave) => {
    try {
      sessionStorage.setItem(clave, serialized);
      localStorage.setItem(clave, serialized);
    } catch {
      /* ignorar */
    }
  });
};

const CANAL_SYNC_EMPRESAS = "efsrt_empresas_asignadas_sync_v1";
const KEY_SNAPSHOT_EMPRESAS_REALTIME = "efsrt_empresas_realtime_snapshot_v1";

const emitirEventoTiempoRealEmpresas = (detalle) => {
  const payload = { ...detalle, timestamp: Date.now() };
  try {
    sessionStorage.setItem(
      KEY_SNAPSHOT_EMPRESAS_REALTIME,
      JSON.stringify(payload)
    );
  } catch {
    /* ignorar */
  }
  try {
    window.dispatchEvent(
      new CustomEvent("empresas:asignacion-tiempo-real", { detail: payload })
    );
    window.dispatchEvent(
      new CustomEvent("expediente:actualizado", { detail: payload })
    );
  } catch {
    /* ignorar */
  }
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CANAL_SYNC_EMPRESAS);
      bc.postMessage(payload);
      bc.close();
    }
  } catch {
    /* ignorar */
  }
};

const MEM = { docentes: null, estudiantes: null, modulos: null, empresas: null };
const ASIG_MEM = new Map();
const EN_VUELO = new Map();
const FRESCO_MS = 10000;
const PAGINA_DISP = 50;

const pedir = (clave, fn) => {
  if (EN_VUELO.has(clave)) return EN_VUELO.get(clave);
  const p = fn().finally(() => EN_VUELO.delete(clave));
  EN_VUELO.set(clave, p);
  return p;
};

const cabeceraAuth = () => {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const leerMejorCacheEstudiantes = () => {
  const candidatos = [
    extraerLista(
      getCachedData("/estudiantes", { all: true, todos: 1, per_page: 1000 })
    ),
    extraerLista(getCachedData("/estudiantes?all=true")),
    extraerLista(getCachedData("/estudiantes")),
  ];
  return candidatos.reduce(
    (mejor, actual) => (actual.length > mejor.length ? actual : mejor),
    []
  );
};

const traerAsignadosApi = async (docId, modId, anioV) => {
  const clave = `A::${modId || "all"}::${docId || "none"}::${anioV || "all"}`;
  return pedir(clave, async () => {
    const headers = cabeceraAuth();
    if (docId) {
      const res = await api.get(`/docentes/${docId}/estudiantes`, {
        params: {
          ...(modId ? { id_modulo: modId } : {}),
          ...(anioV ? { periodo_academico: `${anioV}-II` } : {}),
        },
        headers,
      });
      return extraerLista(res.data);
    }

    const resModulo = await api.get(
      `/modulos-profesionales/${modId}/estudiantes`,
      {
        params: {
          ...(anioV ? { anio: anioV, periodo_academico: `${anioV}-II` } : {}),
        },
        headers,
      }
    );
    return extraerLista(resModulo.data);
  });
};

export default function AsignarEstudiantes({
  onVolver,
  docentes: docentesProp = [],
  docenteInicial = null,
  estudiantes: estudiantesProp = [],
  modulos: modulosProp = [],
  empresas: empresasProp = [],
  anioDefecto = String(new Date().getFullYear()),
  darkMode = false,
  onGuardadoExitoso,
}) {
  const inicialDocentes = useMemo(() => {
    const desdeCache = extraerLista(getCachedData("/docentes"));
    if (Array.isArray(docentesProp) && docentesProp.length > 0) {
      return docentesProp.length >= desdeCache.length
        ? docentesProp
        : desdeCache;
    }
    if (MEM.docentes?.length) return MEM.docentes;
    return desdeCache;
  }, [docentesProp]);

  const inicialEstudiantes = useMemo(() => {
    const desdeCache = leerMejorCacheEstudiantes();
    if (Array.isArray(estudiantesProp) && estudiantesProp.length > 0) {
      return estudiantesProp.length >= desdeCache.length
        ? estudiantesProp
        : desdeCache;
    }
    if (MEM.estudiantes?.length) return MEM.estudiantes;
    return desdeCache;
  }, [estudiantesProp]);

  const inicialModulos = useMemo(() => {
    if (Array.isArray(modulosProp) && modulosProp.length > 0)
      return normalizarModulosCon123(modulosProp);
    if (MEM.modulos?.length) return MEM.modulos;
    return normalizarModulosCon123(
      extraerLista(getCachedData("/modulos-profesionales"))
    );
  }, [modulosProp]);

  const inicialEmpresas = useMemo(() => {
    const desdeCache = extraerLista(getCachedData("/empresas"));
    if (Array.isArray(empresasProp) && empresasProp.length > 0) {
      return empresasProp.length >= desdeCache.length
        ? empresasProp
        : desdeCache;
    }
    if (MEM.empresas?.length) return MEM.empresas;
    return desdeCache;
  }, [empresasProp]);

  const [docentes, setDocentes] = useState(inicialDocentes);
  const [busquedaDocente, setBusquedaDocente] = useState("");
  const [listaModulos, setListaModulos] = useState(inicialModulos);

  const [moduloId, setModuloId] = useState(() => {
    const primero = inicialModulos[0];
    return primero ? k(obtenerIdModulo(primero)) : "1";
  });
  const [anio, setAnio] = useState(String(anioDefecto || "2026"));

  const [docentePorModulo, setDocentePorModulo] = useState(() => {
    const mapaInicial = {};
    inicialModulos.forEach((m) => {
      const idM = obtenerIdModulo(m);
      const idD = extraerDocenteDeModulo(m);
      if (idM != null && idD != null) {
        mapaInicial[k(idM)] = k(idD);
      }
    });
    return mapaInicial;
  });

  const [docenteSeleccionadoId, setDocenteSeleccionadoId] = useState(() => {
    const base = docenteInicial || inicialDocentes[0] || null;
    return base ? k(obtenerIdDocente(base)) : "";
  });

  const seleccionManualDocenteRef = useRef(false);
  const inicializoDocentePropRef = useRef(false);

  const [empresaBaseId, setEmpresaBaseId] = useState("");
  const [listaEstudiantes, setListaEstudiantes] = useState(inicialEstudiantes);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(
    () => inicialEstudiantes.length === 0
  );
  const [listaEmpresas, setListaEmpresas] = useState(inicialEmpresas);
  const listaEstRef = useRef(listaEstudiantes);
  listaEstRef.current = listaEstudiantes;
  const hayCambiosRef = useRef(false);

  const [busquedaDisp, setBusquedaDisp] = useState("");
  const [busquedaAsig, setBusquedaAsig] = useState("");
  const busquedaDispDif = useDeferredValue(busquedaDisp);
  const busquedaAsigDif = useDeferredValue(busquedaAsig);
  const [limiteDisp, setLimiteDisp] = useState(PAGINA_DISP);
  const [programaEstudio, setProgramaEstudio] = useState("Todos");

  const [seleccionados, setSeleccionados] = useState([]);
  const [idsIniciales, setIdsIniciales] = useState([]);
  const [objetosAsignados, setObjetosAsignados] = useState([]);

  const [fechasInicio, setFechasInicio] = useState({});
  const [fechasInicioIniciales, setFechasInicioIniciales] = useState({});
  const [empresasPorEstudiante, setEmpresasPorEstudiante] = useState({});
  const [empresasIniciales, setEmpresasIniciales] = useState({});
  const [representantesPorEstudiante, setRepresentantesPorEstudiante] = useState({});
  const [representantesIniciales, setRepresentantesIniciales] = useState({});

  const [vista, setVista] = useState("asignados");
  const [filtroPracticas, setFiltroPracticas] = useState("todos");
  const [cargandoAsignados, setCargandoAsignados] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const cacheAsignacionesRef = useRef(ASIG_MEM);

  const aniosDisponibles = useMemo(() => {
    const actual = Number(anioDefecto) || new Date().getFullYear();
    return [
      String(actual - 1),
      String(actual),
      String(actual + 1),
      String(actual + 2),
    ];
  }, [anioDefecto]);

  useEffect(() => {
    if (Array.isArray(docentesProp) && docentesProp.length > 0) {
      setDocentes((prev) =>
        docentesProp.length >= prev.length ? docentesProp : prev
      );
    }
  }, [docentesProp]);

  useEffect(() => {
    if (Array.isArray(estudiantesProp) && estudiantesProp.length > 0) {
      setListaEstudiantes((prev) =>
        estudiantesProp.length >= prev.length ? estudiantesProp : prev
      );
      setCargandoEstudiantes(false);
    }
  }, [estudiantesProp]);

  useEffect(() => {
    if (Array.isArray(modulosProp) && modulosProp.length > 0) {
      setListaModulos(normalizarModulosCon123(modulosProp));
    }
  }, [modulosProp]);

  useEffect(() => {
    if (Array.isArray(empresasProp) && empresasProp.length > 0) {
      setListaEmpresas((prev) =>
        empresasProp.length >= prev.length ? empresasProp : prev
      );
    }
  }, [empresasProp]);

  useEffect(() => {
    const refrescarEmpresasDesdeEvento = (ev) => {
      const empNueva = ev?.detail?.empresa || ev?.detail;
      if (empNueva && obtenerIdEmpresa(empNueva) != null) {
        const idN = k(obtenerIdEmpresa(empNueva));
        setListaEmpresas((prev) => {
          const existe = prev.some((x) => k(obtenerIdEmpresa(x)) === idN);
          return existe
            ? prev.map((x) =>
                k(obtenerIdEmpresa(x)) === idN ? { ...x, ...empNueva } : x
              )
            : [empNueva, ...prev];
        });
      }
      invalidateApiCache("/empresas");
      api
        .get("/empresas", {
          params: { per_page: 500, todos: 1, all: true },
          headers: cabeceraAuth(),
        })
        .then((res) => {
          const l = extraerLista(res.data);
          if (l.length > 0) {
            MEM.empresas = l;
            setListaEmpresas(l);
          }
        })
        .catch(() => {});
    };

    window.addEventListener("empresas:actualizada", refrescarEmpresasDesdeEvento);
    return () =>
      window.removeEventListener(
        "empresas:actualizada",
        refrescarEmpresasDesdeEvento
      );
  }, []);

  useEffect(() => {
    let activo = true;
    const headers = cabeceraAuth();

    const cargarFaltantes = () => {
      pedir("L::/docentes", () =>
        api.get("/docentes", {
          params: { per_page: 500, todos: 1, all: true },
          headers,
        })
      )
        .then((res) => {
          const d = extraerLista(res.data);
          if (d.length > 0) {
            MEM.docentes = d;
            if (activo) {
              setDocentes((prev) => (d.length >= prev.length ? d : prev));
            }
          }
        })
        .catch(() => {});

      if (listaEstRef.current.length === 0) setCargandoEstudiantes(true);
      pedir("L::/estudiantes?all=true", () =>
        api.get("/estudiantes", {
          params: { per_page: 1000, todos: 1, all: true },
          headers,
        })
      )
        .then((res) => {
          const l = extraerLista(res.data);
          if (l.length > 0) {
            MEM.estudiantes = l;
            if (activo) {
              setListaEstudiantes((prev) => (l.length >= prev.length ? l : prev));
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (activo) setCargandoEstudiantes(false);
        });

      if (!Array.isArray(modulosProp) || modulosProp.length === 0) {
        pedir("L::/modulos-profesionales", () =>
          api.get("/modulos-profesionales", { headers })
        )
          .then((res) => {
            const modsNorm = normalizarModulosCon123(extraerLista(res.data));
            MEM.modulos = modsNorm;
            if (activo) setListaModulos(modsNorm);
          })
          .catch(() => {});
      }

      pedir("L::/empresas", () =>
        api.get("/empresas", {
          params: { per_page: 500, todos: 1, all: true },
          headers,
        })
      )
        .then((res) => {
          const l = extraerLista(res.data);
          if (l.length > 0) {
            MEM.empresas = l;
            if (activo) {
              setListaEmpresas((prev) => (l.length >= prev.length ? l : prev));
            }
          }
        })
        .catch(() => {});
    };

    cargarFaltantes();
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seleccionManualDocenteRef.current) return;

    if (docenteInicial && !inicializoDocentePropRef.current) {
      const idProp = obtenerIdDocente(docenteInicial);
      if (idProp != null) {
        inicializoDocentePropRef.current = true;
        setDocenteSeleccionadoId(k(idProp));
        return;
      }
    }

    if (!docenteSeleccionadoId && docentes.length > 0) {
      setDocenteSeleccionadoId(k(obtenerIdDocente(docentes[0])));
    }
  }, [docenteInicial, docentes, docenteSeleccionadoId]);

  const moduloActual = useMemo(
    () =>
      listaModulos.find((m) => k(obtenerIdModulo(m)) === k(moduloId)) ||
      listaModulos[0] ||
      null,
    [listaModulos, moduloId]
  );

  const numModuloActual = useMemo(
    () => detectarNumeroModulo(moduloActual, 1),
    [moduloActual]
  );

  const manejarCambioModulo = (nuevoModuloId) => {
    setError("");
    setMensajeExito("");
    setModuloId(nuevoModuloId);

    const encargadoDelModulo = docentePorModulo[k(nuevoModuloId)];
    if (encargadoDelModulo) {
      setDocenteSeleccionadoId(k(encargadoDelModulo));
    }
  };

  const manejarCambioDocenteDelModulo = (nuevoDocenteId) => {
    seleccionManualDocenteRef.current = true;
    setError("");
    setMensajeExito("");
    setDocenteSeleccionadoId(nuevoDocenteId ? k(nuevoDocenteId) : "");
  };

  const fechaPorDefectoAnio = `${anio || new Date().getFullYear()}-${hoyISO().slice(5)}`;

  const aplicarSnapshotAsignacion = (snap) => {
    setSeleccionados(snap.ids);
    setIdsIniciales(snap.ids);
    setObjetosAsignados(snap.objetos);
    setFechasInicio(snap.fechas);
    setFechasInicioIniciales(snap.fechas);
    setEmpresasPorEstudiante(snap.empresas);
    setEmpresasIniciales(snap.empresas);
    setRepresentantesPorEstudiante(snap.representantes || {});
    setRepresentantesIniciales(snap.representantes || {});
  };

  const construirSnapshotDesdeLocal = (
    docId = docenteSeleccionadoId,
    modId = moduloId
  ) => {
    const modObj =
      listaModulos.find((m) => k(obtenerIdModulo(m)) === k(modId)) || null;
    const numMod = detectarNumeroModulo(modObj, 1);

    const previosDelDocente = listaEstRef.current.filter((est) => {
      const idDocEst = extraerDocenteDeEstudiante(est);
      if (!docId || idDocEst == null) return false;
      if (k(idDocEst) !== k(docId)) return false;

      const idModEst = extraerModuloDeEstudiante(est);
      return !modId || idModEst == null || k(idModEst) === k(modId);
    });

    const ids = previosDelDocente
      .map((e) => obtenerIdEstudiante(e))
      .filter((id) => id != null)
      .map(k);

    const mapaFechas = {};
    const mapaEmpresas = {};
    const mapaRepresentantes = {};

    ids.forEach((idKey) => {
      const est = previosDelDocente.find(
        (item) => k(obtenerIdEstudiante(item)) === idKey
      );
      const guardada = leerRegistroLocalModulo(idKey, modId || "1", numMod);

      mapaFechas[idKey] =
        est?.fecha_inicio ||
        est?.pivot?.fecha_inicio ||
        guardada?.fecha_inicio ||
        fechaPorDefectoAnio;

      const empId =
        est?.id_empresa ??
        est?.empresa_id ??
        est?.pivot?.id_empresa ??
        guardada?.id_empresa ??
        empresaBaseId ??
        "";
      mapaEmpresas[idKey] = empId ? k(empId) : "";
      const representanteId =
        est?.id_representante_empresa ??
        est?.representante_empresa_id ??
        guardada?.id_representante_empresa ??
        "";
      mapaRepresentantes[idKey] = representanteId ? k(representanteId) : "";
    });

    return {
      ids,
      objetos: previosDelDocente,
      fechas: mapaFechas,
      empresas: mapaEmpresas,
      representantes: mapaRepresentantes,
    };
  };

  const armarSnapshot = (localSnap, listaApi) => {
    const combinadosMap = new Map();
    localSnap.objetos.forEach((est) => {
      const idEst = obtenerIdEstudiante(est);
      if (idEst != null) combinadosMap.set(k(idEst), est);
    });

    listaApi.forEach((item) => {
      const raw = typeof item === "object" && item !== null ? item : { id: item };
      const baseAlumno = raw?.estudiante || raw?.alumno || raw;
      const idEst = obtenerIdEstudiante(raw);
      if (idEst != null) {
        const previo = combinadosMap.get(k(idEst)) || {};
        const tieneEmpresaEnRespuesta =
          typeof raw === "object" &&
          raw !== null &&
          Object.prototype.hasOwnProperty.call(raw, "id_empresa");
          const tieneRepresentanteEnRespuesta =
            typeof raw === "object" &&
            raw !== null &&
            Object.prototype.hasOwnProperty.call(raw, "id_representante_empresa");
        combinadosMap.set(k(idEst), {
          ...previo,
          ...baseAlumno,
          id_estudiante: idEst,
          fecha_inicio:
            raw?.fecha_inicio ??
            raw?.pivot?.fecha_inicio ??
            baseAlumno?.fecha_inicio ??
            previo?.fecha_inicio,
          id_empresa: tieneEmpresaEnRespuesta
            ? raw.id_empresa
            : raw?.empresa_id ??
              raw?.pivot?.id_empresa ??
              baseAlumno?.id_empresa ??
              previo?.id_empresa,
          id_representante_empresa: tieneRepresentanteEnRespuesta
            ? raw.id_representante_empresa
            : raw?.representante_empresa_id ??
              baseAlumno?.id_representante_empresa ??
              previo?.id_representante_empresa,
        });
      }
    });

    const ids = Array.from(combinadosMap.keys());
    const mapaFechas = { ...localSnap.fechas };
    const mapaEmpresas = { ...localSnap.empresas };
    const mapaRepresentantes = { ...localSnap.representantes };

    ids.forEach((idKey) => {
      const item = combinadosMap.get(idKey);
      if (item?.fecha_inicio) {
        mapaFechas[idKey] = item.fecha_inicio;
      } else if (!mapaFechas[idKey]) {
        mapaFechas[idKey] =
          item?.fecha_inicio ||
          item?.pivot?.fecha_inicio ||
          fechaPorDefectoAnio;
      }
      if (Object.prototype.hasOwnProperty.call(item || {}, "id_empresa")) {
        mapaEmpresas[idKey] = item.id_empresa ? k(item.id_empresa) : "";
      } else if (!mapaEmpresas[idKey]) {
        const empId =
          item?.id_empresa ??
          item?.empresa_id ??
          item?.pivot?.id_empresa ??
          empresaBaseId ??
          "";
        mapaEmpresas[idKey] = empId ? k(empId) : "";
      }
      if (item?.id_representante_empresa != null) {
        mapaRepresentantes[idKey] = k(item.id_representante_empresa);
      } else if (Object.prototype.hasOwnProperty.call(item || {}, "id_representante_empresa")) {
        mapaRepresentantes[idKey] = "";
      }
    });

    return {
      ids,
      objetos: Array.from(combinadosMap.values()),
      fechas: mapaFechas,
      empresas: mapaEmpresas,
      representantes: mapaRepresentantes,
      _t: Date.now(),
    };
  };

  useEffect(() => {
    if (!docenteSeleccionadoId && !moduloId) {
      setSeleccionados([]);
      setIdsIniciales([]);
      setObjetosAsignados([]);
      setFechasInicio({});
      setFechasInicioIniciales({});
      setEmpresasPorEstudiante({});
      setEmpresasIniciales({});
      setRepresentantesPorEstudiante({});
      setRepresentantesIniciales({});
      return;
    }

    const claveCache = `${moduloId || "all"}::${k(
      docenteSeleccionadoId || "none"
    )}::${anio || "all"}`;

    const cachedSnap = cacheAsignacionesRef.current.get(claveCache);
    if (cachedSnap && cachedSnap.ids.length > 0) {
      aplicarSnapshotAsignacion(cachedSnap);
      setCargandoAsignados(false);
      if (Date.now() - (cachedSnap._t || 0) < FRESCO_MS) return;
    } else {
      const snapInstantaneo = construirSnapshotDesdeLocal();
      aplicarSnapshotAsignacion(snapInstantaneo);
      setCargandoAsignados(snapInstantaneo.ids.length === 0);
    }

    let activo = true;
    traerAsignadosApi(docenteSeleccionadoId, moduloId, anio)
      .then((listaApi) => {
        if (!activo) return;
        const snapFinal = armarSnapshot(construirSnapshotDesdeLocal(), listaApi);
        cacheAsignacionesRef.current.set(claveCache, snapFinal);
        if (!hayCambiosRef.current) {
          aplicarSnapshotAsignacion(snapFinal);
        }
      })
      .catch(() => {
        if (!activo || cachedSnap) return;
        cacheAsignacionesRef.current.set(claveCache, {
          ...construirSnapshotDesdeLocal(),
          _t: Date.now(),
        });
      })
      .finally(() => {
        if (activo) setCargandoAsignados(false);
      });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docenteSeleccionadoId, moduloId, anio]);

  useEffect(() => {
    if (!docenteSeleccionadoId && !moduloId) return;
    const clave = `${moduloId || "all"}::${k(
      docenteSeleccionadoId || "none"
    )}::${anio || "all"}`;
    if (cacheAsignacionesRef.current.has(clave) || hayCambiosRef.current) return;
    aplicarSnapshotAsignacion(construirSnapshotDesdeLocal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaEstudiantes]);

  const docentesFiltrados = useMemo(() => {
    const q = busquedaDocente.trim().toLowerCase();
    if (!q) return docentes;
    return docentes.filter((d) =>
      [nombreDe(d), especialidadDocenteDe(d), correoDe(d)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [docentes, busquedaDocente]);

  const docenteActual = useMemo(
    () =>
      docentes.find(
        (d) => k(obtenerIdDocente(d)) === k(docenteSeleccionadoId)
      ) || null,
    [docentes, docenteSeleccionadoId]
  );

  const mapa = useMemo(() => {
    const m = new Map();
    listaEstudiantes.forEach((e) => m.set(k(obtenerIdEstudiante(e)), e));
    objetosAsignados.forEach((e) => {
      const idKey = k(obtenerIdEstudiante(e));
      m.set(idKey, { ...(m.get(idKey) || {}), ...e });
    });
    return m;
  }, [listaEstudiantes, objetosAsignados]);

  const mapaEmpresas = useMemo(() => {
    const m = new Map();
    listaEmpresas.forEach((emp) => m.set(k(obtenerIdEmpresa(emp)), emp));
    return m;
  }, [listaEmpresas]);

  const programasEstudio = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(listaEstudiantes.map(programaDe).filter(Boolean))
      ).sort(),
    ],
    [listaEstudiantes]
  );

  const setSel = useMemo(() => new Set(seleccionados.map(k)), [seleccionados]);
  const setIni = useMemo(() => new Set(idsIniciales.map(k)), [idsIniciales]);

  const totalEstudiantesRegistrados = listaEstudiantes.length;

  const indiceBusqueda = useMemo(() => {
    const m = new Map();
    listaEstudiantes.forEach((est) => {
      m.set(
        k(obtenerIdEstudiante(est)),
        [nombreDe(est), dniDe(est), correoDe(est), programaDe(est)]
          .join(" ")
          .toLowerCase()
      );
    });
    return m;
  }, [listaEstudiantes]);

  const estudiantesElegibles = useMemo(
    () =>
      listaEstudiantes.filter((est) => !setSel.has(k(obtenerIdEstudiante(est)))),
    [listaEstudiantes, setSel]
  );

  const totalDisponibles = estudiantesElegibles.length;

  const disponibles = useMemo(() => {
    const q = busquedaDispDif.trim().toLowerCase();
    return estudiantesElegibles.filter((est) => {
      return (
        (!q ||
          (indiceBusqueda.get(k(obtenerIdEstudiante(est))) ?? "").includes(q)) &&
        (programaEstudio === "Todos" || programaDe(est) === programaEstudio)
      );
    });
  }, [estudiantesElegibles, indiceBusqueda, busquedaDispDif, programaEstudio]);

  const asignados = useMemo(() => {
    const q = busquedaAsigDif.trim().toLowerCase();
    return seleccionados
      .map((id) => mapa.get(k(id)) || { id, nombres: `Estudiante #${id}` })
      .filter((est) => coincide(est, q));
  }, [seleccionados, mapa, busquedaAsigDif]);
  const idsAsignadosConEmpresa = useMemo(
    () =>
      new Set(
        asignados
          .filter((est) => {
            const id = k(obtenerIdEstudiante(est));
            const empresaId = Object.prototype.hasOwnProperty.call(
              empresasPorEstudiante,
              id
            )
              ? empresasPorEstudiante[id]
              : est.id_empresa ?? est.empresa_id ?? est.pivot?.id_empresa ?? "";
            return Boolean(empresaId);
          })
          .map((est) => k(obtenerIdEstudiante(est)))
      ),
    [asignados, empresasPorEstudiante]
  );
  const asignadosConEmpresa = useMemo(
    () =>
      asignados.filter((est) =>
        idsAsignadosConEmpresa.has(k(obtenerIdEstudiante(est)))
      ),
    [asignados, idsAsignadosConEmpresa]
  );
  const asignadosSinEmpresa = useMemo(
    () =>
      asignados.filter(
        (est) => !idsAsignadosConEmpresa.has(k(obtenerIdEstudiante(est)))
      ),
    [asignados, idsAsignadosConEmpresa]
  );
  const asignadosVisibles =
    filtroPracticas === "con-empresa"
      ? asignadosConEmpresa
      : filtroPracticas === "sin-empresa"
        ? asignadosSinEmpresa
        : asignados;

  const agregados = seleccionados.filter((id) => !setIni.has(k(id))).length;
  const quitados = idsIniciales.filter((id) => !setSel.has(k(id))).length;
  const detallesModificados = seleccionados.filter(
    (id) =>
      setIni.has(k(id)) &&
      ((fechasInicio[k(id)] || "") !== (fechasInicioIniciales[k(id)] || "") ||
        (empresasPorEstudiante[k(id)] || "") !==
          (empresasIniciales[k(id)] || "") ||
        (representantesPorEstudiante[k(id)] || "") !==
          (representantesIniciales[k(id)] || ""))
  ).length;
  const hayCambios = agregados + quitados + detallesModificados > 0;
  hayCambiosRef.current = hayCambios;

  useEffect(() => {
    setFiltroPracticas("todos");
  }, [docenteSeleccionadoId, moduloId, anio]);

  useEffect(() => {
    setLimiteDisp(PAGINA_DISP);
  }, [busquedaDispDif, programaEstudio]);

  const bloqueado = guardando;

  const construirFilasRealtime = (
    idsLista,
    mapaEmp,
    mapaFech,
    docId = docenteSeleccionadoId,
    modId = moduloId,
    mapaRep = representantesPorEstudiante
  ) => {
    const nombreMod = nombreModuloDe(moduloActual) || `Módulo ${modId || 1}`;
    const nombreDoc = nombreDe(docenteActual) || "Asesor EFSRT";

    return idsLista.map((id) => {
      const key = k(id);
      const estObj = mapa.get(key) || { id_estudiante: id };
      const empIdStr = mapaEmp[key] ?? empresaBaseId ?? "";
      const empObj = empIdStr ? mapaEmpresas.get(k(empIdStr)) : null;
      const representanteId = mapaRep[key] || "";
      const representante = empObj?.representantes?.find(
        (item) => k(item.id_representante_empresa) === k(representanteId)
      );

      return {
        id_estudiante: Number.isNaN(Number(id)) ? id : Number(id),
        nombres: nombresDe(estObj) || nombreDe(estObj) || `Estudiante #${id}`,
        apellidos: apellidosDe(estObj),
        dni: dniDe(estObj),
        programa_estudios: programaDe(estObj),
        id_docente: docId || null,
        docente_responsable: nombreDoc,
        id_modulo: modId || null,
        numero_modulo: numModuloActual,
        nombre_modulo: nombreMod,
        periodo_academico: `${anio}-II`,
        id_empresa: empIdStr
          ? Number.isNaN(Number(empIdStr))
            ? empIdStr
            : Number(empIdStr)
          : null,
        empresa_nombre: empObj ? nombreEmpresaDe(empObj) : "",
        id_representante_empresa: representanteId || null,
        representante_empresa_nombre: representante?.nombre || "",
        fecha_inicio: mapaFech[key] || fechaPorDefectoAnio,
        anio: Number(anio),
      };
    });
  };

  const notificarTiempoReal = (
    idsLista,
    mapaEmp,
    mapaFech,
    confirmadoServidor = false,
    mapaRep = representantesPorEstudiante
  ) => {
    const alcanceKey = `${k(docenteSeleccionadoId || "none")}::${k(
      moduloId || "1"
    )}::${anio}`;
    const filas = construirFilasRealtime(idsLista, mapaEmp, mapaFech, undefined, undefined, mapaRep);

    emitirEventoTiempoRealEmpresas({
      alcanceKey,
      id_docente: docenteSeleccionadoId || null,
      docente_responsable: nombreDe(docenteActual) || "Asesor EFSRT",
      id_modulo: moduloId || null,
      numero_modulo: numModuloActual,
      nombre_modulo: nombreModuloDe(moduloActual) || `Módulo ${moduloId || 1}`,
      anio: Number(anio),
      confirmadoServidor,
      asignaciones: filas,
    });
  };

  const agregar = (id) => {
    const key = k(id);
    if (setSel.has(key)) return;
    setError("");
    setMensajeExito("");

    const fechaAsignada = fechasInicio[key] || fechaPorDefectoAnio;
    const empresaAsignada =
      empresasPorEstudiante[key] !== undefined &&
      empresasPorEstudiante[key] !== ""
        ? k(empresasPorEstudiante[key])
        : empresaBaseId
          ? k(empresaBaseId)
          : "";

    const nextIds = [...seleccionados, key];
    const nextFechas = { ...fechasInicio, [key]: fechaAsignada };
    const nextEmpresas = { ...empresasPorEstudiante, [key]: empresaAsignada };

    setSeleccionados(nextIds);
    setFechasInicio(nextFechas);
    setEmpresasPorEstudiante(nextEmpresas);
    notificarTiempoReal(nextIds, nextEmpresas, nextFechas, false);
  };

  const quitar = (id) => {
    const key = k(id);
    setError("");
    setMensajeExito("");

    const nextIds = seleccionados.filter((x) => k(x) !== key);
    setSeleccionados(nextIds);
    notificarTiempoReal(nextIds, empresasPorEstudiante, fechasInicio, false);
  };

  const cambiarFechaEstudiante = (id, nuevaFecha) => {
    const key = k(id);
    setError("");
    setMensajeExito("");
    const nextFechas = { ...fechasInicio, [key]: nuevaFecha };
    setFechasInicio(nextFechas);
    if (setSel.has(key)) {
      notificarTiempoReal(seleccionados, empresasPorEstudiante, nextFechas, false);
    }
  };

  const cambiarEmpresaEstudiante = (id, nuevaEmpresaId) => {
    const key = k(id);
    setError("");
    setMensajeExito("");
    const nextEmpresas = { ...empresasPorEstudiante, [key]: nuevaEmpresaId };
    const empresaNueva = nuevaEmpresaId ? mapaEmpresas.get(k(nuevaEmpresaId)) : null;
    const representanteActual = representantesPorEstudiante[key];
    const contactoSigueVinculado = empresaNueva?.representantes?.some(
      (item) => k(item.id_representante_empresa) === k(representanteActual)
    );
    const nextRepresentantes = {
      ...representantesPorEstudiante,
      [key]: contactoSigueVinculado ? representanteActual : "",
    };
    setEmpresasPorEstudiante(nextEmpresas);
    setRepresentantesPorEstudiante(nextRepresentantes);
    if (setSel.has(key)) {
      notificarTiempoReal(seleccionados, nextEmpresas, fechasInicio, false, nextRepresentantes);
    }
  };

  const cambiarRepresentanteEstudiante = (id, nuevoRepresentanteId) => {
    const key = k(id);
    setError("");
    setMensajeExito("");
    const nextRepresentantes = {
      ...representantesPorEstudiante,
      [key]: nuevoRepresentanteId,
    };
    setRepresentantesPorEstudiante(nextRepresentantes);
    if (setSel.has(key)) {
      notificarTiempoReal(
        seleccionados,
        empresasPorEstudiante,
        fechasInicio,
        false,
        nextRepresentantes
      );
    }
  };

  const aplicarEmpresaBaseATodos = (empId) => {
    setError("");
    setMensajeExito("");
    setEmpresaBaseId(empId);
    const nextEmpresas = { ...empresasPorEstudiante };
    const nextRepresentantes = { ...representantesPorEstudiante };
    const empresaNueva = empId ? mapaEmpresas.get(k(empId)) : null;
    seleccionados.forEach((id) => {
      const key = k(id);
      nextEmpresas[key] = empId;
      const actual = nextRepresentantes[key];
      const valido = empresaNueva?.representantes?.some(
        (item) => k(item.id_representante_empresa) === k(actual)
      );
      if (!valido) nextRepresentantes[key] = "";
    });
    setEmpresasPorEstudiante(nextEmpresas);
    setRepresentantesPorEstudiante(nextRepresentantes);
    if (seleccionados.length > 0) {
      notificarTiempoReal(
        seleccionados,
        nextEmpresas,
        fechasInicio,
        false,
        nextRepresentantes
      );
    }
  };

  const aplicarFechaBaseATodos = (nuevaFecha) => {
    if (!nuevaFecha) return;
    setError("");
    setMensajeExito("");
    const nextFechas = { ...fechasInicio };
    seleccionados.forEach((id) => {
      nextFechas[k(id)] = nuevaFecha;
    });
    setFechasInicio(nextFechas);
    if (seleccionados.length > 0) {
      notificarTiempoReal(seleccionados, empresasPorEstudiante, nextFechas, false);
    }
  };

  const agregarVisibles = () => {
    if (disponibles.length === 0) return;
    setError("");
    setMensajeExito("");

    const ya = new Set(seleccionados.map(k));
    const nuevosIds = disponibles
      .map((est) => k(obtenerIdEstudiante(est)))
      .filter((idKey) => !ya.has(idKey));
    if (nuevosIds.length === 0) return;

    const nextIds = [...seleccionados, ...nuevosIds];
    const nextFechas = { ...fechasInicio };
    const nextEmpresas = { ...empresasPorEstudiante };
    const nextRepresentantes = { ...representantesPorEstudiante };

    nuevosIds.forEach((idKey) => {
      if (!nextFechas[idKey]) nextFechas[idKey] = fechaPorDefectoAnio;
      if (!nextEmpresas[idKey]) {
        nextEmpresas[idKey] = empresaBaseId ? k(empresaBaseId) : "";
      }
      if (!nextRepresentantes[idKey]) nextRepresentantes[idKey] = "";
    });

    setSeleccionados(nextIds);
    setFechasInicio(nextFechas);
    setEmpresasPorEstudiante(nextEmpresas);
    setRepresentantesPorEstudiante(nextRepresentantes);
    notificarTiempoReal(nextIds, nextEmpresas, nextFechas, false, nextRepresentantes);
  };

  const quitarVisibles = () => {
    if (asignados.length === 0) return;
    setError("");
    setMensajeExito("");
    const idsAQuitar = new Set(asignados.map((e) => k(obtenerIdEstudiante(e))));
    const nextIds = seleccionados.filter((id) => !idsAQuitar.has(k(id)));
    setSeleccionados(nextIds);
    notificarTiempoReal(nextIds, empresasPorEstudiante, fechasInicio, false);
  };

  const guardarAsignacion = async () => {
    if (!moduloId) {
      setError("Selecciona el módulo (Módulo I, II o III) antes de guardar.");
      return;
    }
    if (!docenteSeleccionadoId) {
      setError("Selecciona el docente asesor encargado de este módulo.");
      return;
    }
    if (!anio) {
      setError("Selecciona el año de la asignación.");
      return;
    }

    const sinFecha = seleccionados.find((id) => !fechasInicio[k(id)]);
    if (sinFecha) {
      const estSinFecha = mapa.get(k(sinFecha));
      setError(
        `Define la fecha en que comienza ${
          nombreDe(estSinFecha) || "el estudiante"
        }.`
      );
      return;
    }

    setGuardando(true);
    setError("");
    setMensajeExito("");
    try {
      const headers = cabeceraAuth();
      const nombreMod = nombreModuloDe(moduloActual) || `Módulo ${moduloId}`;
      const nombreDoc = nombreDe(docenteActual) || "Asesor EFSRT";
      const idModNum = Number.isNaN(Number(moduloId))
        ? moduloId
        : Number(moduloId);
      const idDocNum = Number.isNaN(Number(docenteSeleccionadoId))
        ? docenteSeleccionadoId
        : Number(docenteSeleccionadoId);

      const asignacionesDetalladas = seleccionados.map((id) => {
        const key = k(id);
        const empIdStr = empresasPorEstudiante[key] || empresaBaseId || "";
        const empObj = empIdStr ? mapaEmpresas.get(k(empIdStr)) : null;
        const estObj = mapa.get(key) || {};
        const representanteId = representantesPorEstudiante[key] || "";
        const representante = empObj?.representantes?.find(
          (item) => k(item.id_representante_empresa) === k(representanteId)
        );

        return {
          id_estudiante: Number.isNaN(Number(id)) ? id : Number(id),
          nombres: nombresDe(estObj) || nombreDe(estObj) || `Estudiante #${id}`,
          apellidos: apellidosDe(estObj),
          dni: dniDe(estObj),
          id_docente: idDocNum,
          id_docente_asesor: idDocNum,
          docente_responsable: nombreDoc,
          id_modulo: idModNum,
          numero_modulo: numModuloActual,
          nombre_modulo: nombreMod,
          programa_estudios: programaDe(estObj),
          id_empresa: empIdStr
            ? Number.isNaN(Number(empIdStr))
              ? empIdStr
              : Number(empIdStr)
            : null,
          empresa_nombre: empObj ? nombreEmpresaDe(empObj) : "",
          id_representante_empresa: representanteId
            ? Number.isNaN(Number(representanteId))
              ? representanteId
              : Number(representanteId)
            : null,
          representante_empresa_nombre: representante?.nombre || "",
          representante_empresa_cargo: representante?.cargo || "",
          representante_empresa_telefono: representante?.telefono || "",
          representante_empresa_correo: representante?.correo || "",
          ubicacion: empObj ? ubicacionEmpresaDe(empObj) : "",
          fecha_inicio: fechasInicio[key] || fechaPorDefectoAnio,
          periodo_academico: `${anio}-II`,
          anio: Number(anio),
        };
      });

      const payload = {
        id_modulo: idModNum,
        numero_modulo: numModuloActual,
        nombre_modulo: nombreMod,
        id_docente: idDocNum,
        id_docente_asesor: idDocNum,
        id_empresa: empresaBaseId
          ? Number.isNaN(Number(empresaBaseId))
            ? empresaBaseId
            : Number(empresaBaseId)
          : null,
        periodo_academico: `${anio}-II`,
        anio: Number(anio),
        estudiantes: seleccionados.map((id) =>
          Number.isNaN(Number(id)) ? id : Number(id)
        ),
        asignaciones: asignacionesDetalladas,
      };

      await api.post(
        `/docentes/${docenteSeleccionadoId}/asignar-estudiantes`,
        payload,
        { headers }
      );

      setDocentePorModulo((prev) => ({
        ...prev,
        [k(moduloId)]: k(docenteSeleccionadoId),
      }));

      for (const keyCache of Array.from(cacheAsignacionesRef.current.keys())) {
        if (keyCache.includes(`::${k(docenteSeleccionadoId)}::`)) {
          cacheAsignacionesRef.current.delete(keyCache);
        }
      }

      const claveCache = `${moduloId}::${k(docenteSeleccionadoId)}::${anio}`;
      cacheAsignacionesRef.current.set(claveCache, {
        ids: [...seleccionados],
        objetos: seleccionados.map((id) => mapa.get(k(id)) || { id }),
        fechas: { ...fechasInicio },
        empresas: { ...empresasPorEstudiante },
        representantes: { ...representantesPorEstudiante },
        _t: Date.now(),
      });

      asignacionesDetalladas.forEach((item) => {
        const registroExpediente = {
          id_estudiante: item.id_estudiante,
          nombres: item.nombres,
          apellidos: item.apellidos,
          dni: item.dni,
          id_docente: item.id_docente,
          id_docente_asesor: item.id_docente_asesor,
          docente_responsable: item.docente_responsable,
          id_modulo: item.id_modulo,
          numero_modulo: item.numero_modulo,
          nombre_modulo: item.nombre_modulo,
          programa_estudios: item.programa_estudios,
          id_empresa: item.id_empresa,
          id_representante_empresa: item.id_representante_empresa,
          representante_empresa_nombre: item.representante_empresa_nombre,
          representante_empresa_cargo: item.representante_empresa_cargo,
          representante_empresa_telefono: item.representante_empresa_telefono,
          representante_empresa_correo: item.representante_empresa_correo,
          empresa_institucion: item.empresa_nombre,
          empresa_nombre: item.empresa_nombre,
          ubicacion: item.ubicacion,
          fecha_inicio: item.fecha_inicio,
          periodo_academico: item.periodo_academico,
          anio: item.anio,
          estado_registro: "Por verificar",
          actualizado_en: new Date().toISOString(),
        };

        guardarRegistroLocalModulo(
          item.id_estudiante,
          k(item.id_modulo),
          item.numero_modulo,
          registroExpediente
        );
      });

      invalidateApiCache("/asignaciones-asesores");
      invalidateApiCache("/empresas");

      const alcanceKey = `${k(docenteSeleccionadoId)}::${k(moduloId)}::${anio}`;
      emitirEventoTiempoRealEmpresas({
        alcanceKey,
        id_modulo: moduloId,
        numero_modulo: numModuloActual,
        nombre_modulo: nombreMod,
        id_docente: docenteSeleccionadoId,
        docente_responsable: nombreDoc,
        anio: Number(anio),
        confirmadoServidor: true,
        asignaciones: asignacionesDetalladas,
      });

      setIdsIniciales([...seleccionados]);
      setFechasInicioIniciales({ ...fechasInicio });
      setEmpresasIniciales({ ...empresasPorEstudiante });
      setRepresentantesIniciales({ ...representantesPorEstudiante });
      setMensajeExito(
        `Expediente, empresa, representante y asesor guardados para ${nombreMod} (${anio}) · Asesor: ${nombreDoc}.`
      );
      await onGuardadoExitoso?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "No se pudo guardar la asignación del módulo y expediente."
      );
    } finally {
      setGuardando(false);
    }
  };

  const t = darkMode
    ? {
        card: "bg-[#1e293b] border-slate-700 text-slate-100",
        borde: "border-slate-700",
        panel: "bg-[#0f172a]/50",
        suave: "bg-slate-800/70",
        texto2: "text-slate-400",
        hover: "hover:bg-slate-800/80",
        campo:
          "bg-[#0f172a] border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        boton:
          "bg-[#1e293b] border-slate-700 text-slate-200 hover:bg-slate-800",
        avatar: "bg-blue-950 text-blue-300 border border-blue-800/50",
        divide: "divide-slate-700",
      }
    : {
        card: "bg-white border-slate-200 text-slate-800",
        borde: "border-slate-200",
        panel: "bg-[#f8fafc]",
        suave: "bg-[#f8fafc]",
        texto2: "text-slate-500",
        hover: "hover:bg-slate-50",
        campo:
          "bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        boton:
          "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
        avatar: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10",
        divide: "divide-slate-200",
      };

  const campoBusqueda = (valor, cambiar, placeholder) => (
    <div
      className={`flex flex-1 items-center rounded-lg border px-3 py-2 transition ${t.campo}`}
    >
      <Search className={`mr-2 h-4 w-4 shrink-0 ${t.texto2}`} />
      <input
        type="text"
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-sm text-current outline-none placeholder:text-slate-400 focus:ring-0"
      />
      {valor && (
        <button
          type="button"
          onClick={() => cambiar("")}
          aria-label="Limpiar búsqueda"
          className={`ml-1 ${t.texto2} hover:text-current`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const filaDisponible = (est) => {
    const id = obtenerIdEstudiante(est);
    const key = k(id);
    const nombre = nombreDe(est) || "Estudiante";
    const detalle = programaDe(est) || "Programa de estudios";
    const estabaAsignado = setIni.has(key);

    return (
      <li
        key={key}
        className={`flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 ${t.borde} ${t.hover}`}
      >
        <AvatarEstudiante
          estudiante={est}
          className="h-9 w-9 rounded-full text-xs font-bold"
          fallbackClassName={t.avatar}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{nombre}</p>
            {estabaAsignado && (
              <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
                Se quitará
              </span>
            )}
          </div>
          <p className={`truncate text-xs ${t.texto2}`}>
            <span className="font-mono">{dniDe(est)}</span>
            {detalle ? ` · ${detalle}` : ""}
          </p>
        </div>

        <button
          type="button"
          disabled={bloqueado}
          onClick={() => agregar(id)}
          aria-label={`Agregar ${nombre}`}
          title="Asignar al módulo, empresa y expediente"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </li>
    );
  };

  const filaAsignado = (est) => {
    const id = obtenerIdEstudiante(est);
    const key = k(id);
    const nombre = nombreDe(est) || "Estudiante";
    const detalle = programaDe(est) || "Programa de estudios";
    const esNuevo = !setIni.has(key);
    const fechaEst = fechasInicio[key] || fechaPorDefectoAnio;
    const empEst = empresasPorEstudiante[key] ?? "";
    const empContactoId = empEst || empresaBaseId;
    const empresaContacto = empContactoId
      ? mapaEmpresas.get(k(empContactoId))
      : null;
    const contactosEmpresa = empresaContacto?.representantes || [];
    const representanteEst = representantesPorEstudiante[key] ?? "";

    return (
      <li
        key={key}
        className={`flex flex-col gap-2.5 border-b px-4 py-3 transition-colors last:border-b-0 2xl:flex-row 2xl:items-center 2xl:justify-between ${t.borde} ${t.hover}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AvatarEstudiante
            estudiante={est}
            className="h-9 w-9 rounded-full text-xs font-bold"
            fallbackClassName={t.avatar}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{nombre}</p>
              {esNuevo && (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                  Nuevo
                </span>
              )}
            </div>
            <p className={`truncate text-xs ${t.texto2}`}>
              <span className="font-mono">{dniDe(est)}</span>
              {detalle ? ` · ${detalle}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 2xl:shrink-0">
          <label className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
            <select
              value={empEst}
              disabled={bloqueado}
              onChange={(e) => cambiarEmpresaEstudiante(id, e.target.value)}
              aria-label={`Empresa de ${nombre}`}
              className={`max-w-[160px] cursor-pointer truncate rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition ${t.campo}`}
            >
              <option value="">Empresa...</option>
              {listaEmpresas.map((emp) => {
                const idEmp = obtenerIdEmpresa(emp);
                return (
                  <option key={k(idEmp)} value={k(idEmp)}>
                    {nombreEmpresaDe(emp) || `Empresa #${idEmp}`}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5 shrink-0 text-violet-600" />
            <select
              value={representanteEst}
              disabled={bloqueado || contactosEmpresa.length === 0}
              onChange={(e) => cambiarRepresentanteEstudiante(id, e.target.value)}
              aria-label={`Representante de empresa para ${nombre}`}
              className={`max-w-[170px] cursor-pointer truncate rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition ${t.campo}`}
            >
              <option value="">
                {contactosEmpresa.length ? "Contacto..." : "Sin contactos"}
              </option>
              {contactosEmpresa.map((contacto) => (
                <option
                  key={contacto.id_representante_empresa}
                  value={k(contacto.id_representante_empresa)}
                >
                  {contacto.nombre}{contacto.cargo ? ` · ${contacto.cargo}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className={`text-[11px] font-medium ${t.texto2}`}>
              Inicio:
            </span>
            <input
              type="date"
              value={fechaEst}
              disabled={bloqueado}
              onChange={(e) => cambiarFechaEstudiante(id, e.target.value)}
              aria-label={`Fecha de inicio de ${nombre}`}
              className={`rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition ${t.campo}`}
            />
          </label>

          <button
            type="button"
            disabled={bloqueado}
            onClick={() => quitar(id)}
            aria-label={`Quitar ${nombre}`}
            title="Quitar del módulo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  };

  const vacio = (Icono, titulo, texto) => (
    <div
      className={`flex h-full min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center ${t.texto2}`}
    >
      <div className={`mb-3 rounded-xl p-3.5 text-blue-600 ${t.suave}`}>
        <Icono className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-current">{titulo}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed">{texto}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className={`rounded-xl border p-5 ${t.card}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {onVolver && (
              <button
                type="button"
                onClick={onVolver}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${t.boton}`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </button>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold sm:text-lg">
                  Docente Asesor por Módulo · Expediente y Prácticas
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/10">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Total estudiantes: {totalEstudiantesRegistrados}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Tiempo real con Empresas
                </span>
              </div>
              <p className={`mt-0.5 text-xs ${t.texto2}`}>
                {nombreModuloDe(moduloActual) || "Módulo"} · Asesor:{" "}
                <strong className="text-blue-600">
                  {nombreDe(docenteActual) || "Sin asignar"}
                </strong>{" "}
                · Año {anio}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={guardarAsignacion}
            disabled={bloqueado}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:text-sm"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {guardando ? "Guardando..." : `Guardar (${seleccionados.length})`}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${t.texto2}`}
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              Módulo (I / II / III)
            </label>
            <select
              value={moduloId}
              onChange={(e) => manejarCambioModulo(e.target.value)}
              disabled={guardando}
              aria-label="Módulo"
              className={`mt-1.5 w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition ${t.campo}`}
            >
              {listaModulos.map((mod) => {
                const idMod = obtenerIdModulo(mod);
                return (
                  <option key={k(idMod)} value={k(idMod)}>
                    {nombreModuloDe(mod) || `Módulo ${idMod}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${t.texto2}`}
            >
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              Docente asesor del módulo
            </label>
            <select
              value={docenteSeleccionadoId}
              onChange={(e) => manejarCambioDocenteDelModulo(e.target.value)}
              disabled={guardando}
              aria-label="Docente asesor del módulo"
              className={`mt-1.5 w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition ${t.campo}`}
            >
              <option value="">Seleccionar asesor...</option>
              {docentes.map((doc) => {
                const id = obtenerIdDocente(doc);
                return (
                  <option key={k(id)} value={k(id)}>
                    {nombreDe(doc) || `Docente #${id}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${t.texto2}`}
            >
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Año / Periodo
            </label>
            <select
              value={anio}
              onChange={(e) => {
                setError("");
                setMensajeExito("");
                setAnio(e.target.value);
              }}
              disabled={guardando}
              aria-label="Año"
              className={`mt-1.5 w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition ${t.campo}`}
            >
              {aniosDisponibles.map((yr) => (
                <option key={yr} value={yr}>
                  Año {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${t.texto2}`}
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              Empresa de práctica (base)
            </label>
            <select
              value={empresaBaseId}
              onChange={(e) => aplicarEmpresaBaseATodos(e.target.value)}
              disabled={guardando}
              aria-label="Empresa base"
              className={`mt-1.5 w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition ${t.campo}`}
            >
              <option value="">Por estudiante</option>
              {listaEmpresas.map((emp) => {
                const idEmp = obtenerIdEmpresa(emp);
                return (
                  <option key={k(idEmp)} value={k(idEmp)}>
                    {nombreEmpresaDe(emp) || `Empresa #${idEmp}`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mensajeExito && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      <div
        className={`grid overflow-hidden rounded-xl border lg:grid-cols-12 lg:divide-x ${t.card} ${t.divide}`}
      >
        <aside className="flex max-h-[68vh] min-h-[360px] flex-col lg:col-span-3">
          <div className={`space-y-2.5 border-b p-4 ${t.borde} ${t.suave}`}>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Briefcase className="h-4 w-4 text-blue-600" />
              Docentes ({docentes.length})
            </h2>
            <p className={`text-[11px] ${t.texto2}`}>
              Selecciona el asesor encargado de{" "}
              <strong className="text-current">
                {nombreModuloDe(moduloActual) || "este módulo"}
              </strong>
              .
            </p>
            <div
              className={`flex items-center rounded-lg border px-2.5 py-1.5 transition ${t.campo}`}
            >
              <Search className={`mr-2 h-3.5 w-3.5 shrink-0 ${t.texto2}`} />
              <input
                type="text"
                value={busquedaDocente}
                onChange={(e) => setBusquedaDocente(e.target.value)}
                placeholder="Buscar docente..."
                className="w-full border-none bg-transparent text-xs text-current outline-none placeholder:text-slate-400 focus:ring-0"
              />
            </div>
          </div>

          <div className={`min-h-0 flex-1 overflow-y-auto ${t.panel}`}>
            {docentesFiltrados.length === 0 ? (
              vacio(UserCheck, "Sin docentes", "No se encontraron docentes.")
            ) : (
              <ul className={`divide-y ${t.divide}`}>
                {docentesFiltrados.map((doc) => {
                  const idDoc = obtenerIdDocente(doc);
                  const activa = k(idDoc) === k(docenteSeleccionadoId);
                  const nombreDoc = nombreDe(doc) || `Docente #${idDoc}`;
                  return (
                    <li key={k(idDoc)}>
                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() => manejarCambioDocenteDelModulo(k(idDoc))}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                          activa ? "bg-blue-600 text-white" : t.hover
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            activa ? "bg-white/20 text-white" : t.avatar
                          }`}
                        >
                          {iniciales(nombreDoc)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold">
                            {nombreDoc}
                          </p>
                          <p
                            className={`truncate text-[11px] ${
                              activa ? "text-blue-100" : t.texto2
                            }`}
                          >
                            {especialidadDocenteDe(doc)}
                          </p>
                        </div>
                        {activa && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                            Asesor
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <div
          className={`grid grid-cols-2 border-b text-xs font-semibold lg:hidden ${t.borde}`}
        >
          {[
            ["asignados", `En módulo (${seleccionados.length})`],
            [
              "disponibles",
              `Disponibles (${totalDisponibles}/${totalEstudiantesRegistrados})`,
            ],
          ].map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setVista(clave)}
              className={`py-3 transition ${
                vista === clave
                  ? "border-b-2 border-blue-600 bg-blue-50/60 text-blue-600"
                  : t.texto2
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <section
          className={`flex max-h-[68vh] min-h-[360px] flex-col lg:col-span-5 ${
            vista === "asignados" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className={`space-y-2.5 border-b p-4 ${t.borde} ${t.suave}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                {nombreModuloDe(moduloActual) || "Módulo"} ({anio})
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/10">
                  {seleccionados.length}
                </span>
              </h2>

              <div className="flex items-center gap-2.5">
                {seleccionados.length > 0 && (
                  <button
                    type="button"
                    onClick={() => aplicarFechaBaseATodos(fechaPorDefectoAnio)}
                    disabled={bloqueado}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline disabled:opacity-40"
                    title="Aplicar fecha base del año a todos"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Fecha base
                  </button>
                )}
                <button
                  type="button"
                  onClick={quitarVisibles}
                  disabled={asignados.length === 0 || bloqueado}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                  Quitar ({asignados.length})
                </button>
              </div>
            </div>

            {campoBusqueda(
              busquedaAsig,
              setBusquedaAsig,
              "Buscar estudiantes asignados en este módulo"
            )}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar estudiantes por empresa asignada"
            >
              {[
                ["todos", "Todos", asignados.length],
                ["con-empresa", "Con empresa", asignadosConEmpresa.length],
                ["sin-empresa", "Sin empresa", asignadosSinEmpresa.length],
              ].map(([clave, etiqueta, cantidad]) => (
                <button
                  key={clave}
                  type="button"
                  aria-pressed={filtroPracticas === clave}
                  onClick={() => setFiltroPracticas(clave)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    filtroPracticas === clave
                      ? "border-blue-600 bg-blue-600 text-white"
                      : `${t.borde} ${t.texto2} ${t.hover}`
                  }`}
                >
                  {etiqueta} ({cantidad})
                </button>
              ))}
            </div>
          </div>

          <div className={`min-h-0 flex-1 overflow-y-auto ${t.panel}`}>
            {cargandoAsignados && seleccionados.length === 0 ? (
              <div
                className={`flex h-full min-h-[240px] items-center justify-center gap-2 text-xs ${t.texto2}`}
              >
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Cargando estudiantes del docente y módulo...
              </div>
            ) : seleccionados.length === 0 ? (
              vacio(
                Inbox,
                "Sin estudiantes en este módulo",
                "Selecciona estudiantes desde disponibles para asignarles este docente asesor, empresa y fecha de práctica en su expediente."
              )
            ) : asignados.length === 0 ? (
              vacio(
                Search,
                "Sin resultados",
                "Ningún estudiante en este módulo coincide con la búsqueda."
              )
            ) : asignadosVisibles.length === 0 ? (
              vacio(
                Building2,
                filtroPracticas === "con-empresa"
                  ? "Sin estudiantes con empresa"
                  : "Todos tienen empresa",
                filtroPracticas === "con-empresa"
                  ? "Asigna una empresa a un estudiante para marcarlo en práctica."
                  : "No hay estudiantes pendientes de empresa en este módulo."
              )
            ) : (
              <ul>{asignadosVisibles.map(filaAsignado)}</ul>
            )}
          </div>
        </section>

        <section
          className={`flex max-h-[68vh] min-h-[360px] flex-col lg:col-span-4 ${
            vista === "disponibles" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className={`space-y-2.5 border-b p-4 ${t.borde} ${t.suave}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Users className="h-4 w-4 text-blue-600" />
                Disponibles
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/10">
                  {disponibles.length} / {totalEstudiantesRegistrados}
                </span>
              </h2>
              <button
                type="button"
                onClick={agregarVisibles}
                disabled={disponibles.length === 0 || bloqueado}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline"
              >
                Agregar ({disponibles.length})
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {campoBusqueda(
              busquedaDisp,
              setBusquedaDisp,
              "Buscar por nombre, DNI o correo"
            )}

            {programasEstudio.length > 2 && (
              <select
                value={programaEstudio}
                onChange={(e) => setProgramaEstudio(e.target.value)}
                aria-label="Filtrar por programa de estudios"
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition ${t.campo}`}
              >
                {programasEstudio.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog === "Todos" ? "Todos los programas" : prog}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            className={`min-h-0 flex-1 overflow-y-auto ${t.panel}`}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
                setLimiteDisp((l) =>
                  l < disponibles.length ? l + PAGINA_DISP : l
                );
              }
            }}
          >
            {cargandoEstudiantes && listaEstudiantes.length === 0 ? (
              <div
                className={`flex h-full min-h-[240px] items-center justify-center gap-2 text-xs ${t.texto2}`}
              >
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Cargando estudiantes...
              </div>
            ) : listaEstudiantes.length === 0 ? (
              vacio(
                GraduationCap,
                "No hay estudiantes registrados",
                "Registra estudiantes para asignarlos."
              )
            ) : totalDisponibles === 0 ? (
              vacio(
                UserCheck,
                "Sin estudiantes disponibles",
                "Todos los estudiantes ya están asignados a este módulo."
              )
            ) : disponibles.length === 0 ? (
              vacio(
                Search,
                "Sin resultados",
                "Prueba con otro criterio de búsqueda o filtro."
              )
            ) : (
              <>
                <ul>{disponibles.slice(0, limiteDisp).map(filaDisponible)}</ul>
                <p className={`px-4 py-3 text-center text-[11px] ${t.texto2}`}>
                  Mostrando {Math.min(limiteDisp, disponibles.length)} de{" "}
                  {disponibles.length}
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      <footer
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3.5 ${t.card}`}
      >
        <p className={`flex flex-wrap items-center gap-2 text-xs ${t.texto2}`}>
          <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
          <span>
            Total: <strong className="text-current">{totalEstudiantesRegistrados}</strong> ·
            Disponibles: <strong className="text-current">{totalDisponibles}</strong>
          </span>
          {hayCambios && (
            <>
              <span>·</span>
              <span className="font-semibold text-emerald-700">
                +{agregados} nuevos
              </span>
              <span>·</span>
              <span className="font-semibold text-rose-600">
                −{quitados} quitados
              </span>
              {detallesModificados > 0 && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-blue-600">
                    {detallesModificados} con fecha/empresa editada
                  </span>
                </>
              )}
            </>
          )}
        </p>

        <div className="flex items-center gap-2.5">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              disabled={guardando}
              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:opacity-40 ${t.boton}`}
            >
              Volver
            </button>
          )}
          <button
            type="button"
            onClick={guardarAsignacion}
            disabled={bloqueado}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </footer>
    </div>
  );
}