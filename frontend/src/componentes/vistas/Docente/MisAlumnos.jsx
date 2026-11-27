import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  BookOpen,
  RefreshCcw,
  Users,
  LayoutGrid,
  Table2,
  Mail,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  Layers,
  AlertCircle,
  UserX,
} from "lucide-react";
import api, { invalidateApiCache } from "../../../api/axios";
import AvatarEstudiante from "../../AvatarEstudiante.jsx";
import {
  normalizarNombreModulo,
  publicarModuloSistema,
  useModuloSistema,
} from "../../../utils/moduloSistema";

const POR_PAGINA = 8;
const CACHE_MEMORIA = {
  clave: "",
  alumnos: [],
  modulos: [],
};

const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.alumnos)) return payload.alumnos;
  if (Array.isArray(payload?.estudiantes)) return payload.estudiantes;
  return [];
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
    const rawUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
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

const leerCachePersistencia = (clave) => {
  if (
    CACHE_MEMORIA.clave === clave &&
    (CACHE_MEMORIA.alumnos.length > 0 || CACHE_MEMORIA.modulos.length > 0)
  ) {
    return { alumnos: CACHE_MEMORIA.alumnos, modulos: CACHE_MEMORIA.modulos };
  }
  try {
    const raw =
      sessionStorage.getItem(`mis_alumnos_cache_${clave}`) ||
      localStorage.getItem(`mis_alumnos_cache_${clave}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.alumnos)) {
      CACHE_MEMORIA.clave = clave;
      CACHE_MEMORIA.alumnos = parsed.alumnos;
      CACHE_MEMORIA.modulos = Array.isArray(parsed.modulos)
        ? parsed.modulos
        : [];
      return { alumnos: CACHE_MEMORIA.alumnos, modulos: CACHE_MEMORIA.modulos };
    }
  } catch {
    /* ignorar */
  }
  return null;
};

const guardarCachePersistencia = (clave, alumnos, modulos) => {
  CACHE_MEMORIA.clave = clave;
  CACHE_MEMORIA.alumnos = alumnos;
  CACHE_MEMORIA.modulos = modulos;
  try {
    const payload = JSON.stringify({ alumnos, modulos, ts: Date.now() });
    sessionStorage.setItem(`mis_alumnos_cache_${clave}`, payload);
    localStorage.setItem(`mis_alumnos_cache_${clave}`, payload);
  } catch {
    /* ignorar */
  }
};

const obtenerIdModulo = (m) => m?.id_modulo ?? m?.id;

const limpiarTextoModulo = (texto = "") => {
  const limpio = String(texto || "").trim().replace(/\s+/g, " ");
  if (!limpio) return "";
  // Corrige variantes comunes como "Integracion de Palicaciones web y moviles"
  const corregido = limpio
    .replace(/\bpalicaciones\b/gi, "Aplicaciones")
    .replace(/\bmoviles\b/gi, "Móviles")
    .replace(/\bintegracion\b/gi, "Integración");
  return corregido.charAt(0).toUpperCase() + corregido.slice(1);
};

const nombreModuloDe = (m) =>
  limpiarTextoModulo(
    m?.nombre ?? m?.nombre_modulo ?? m?.modulo ?? m?.titulo ?? m?.descripcion ?? ""
  );

const claveCanonModulo = (texto = "") =>
  limpiarTextoModulo(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const ESTADOS = {
  "En progreso": "#10b981",
  Completado: "#2563eb",
  Observado: "#ef4444",
  "Revisión pendiente": "#f59e0b",
};
const colorEstado = (e) => ESTADOS[e] ?? "#64748b";
const PALETA_MODULOS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#f59e0b",
  "#10b981",
  "#ef4444",
];

const nombreCompleto = (a) => {
  const nom = a.nombres || a.nombre || "";
  return a.apellidos ? `${a.apellidos}, ${nom}` : nom || "Sin nombre";
};

const moduloDe = (a) =>
  normalizarNombreModulo(
    a.modulo_nombre || a.nombre_modulo || a.modulo || "Nombre de módulo no disponible"
  );

const estadoDe = (a) => {
  const raw = String(a?.estado || a?.estado_efsrt || "").trim();
  if (!raw) return "En progreso";
  const low = raw.toLowerCase();
  if (low.includes("complet") || low.includes("egres")) return "Completado";
  if (low.includes("observ")) return "Observado";
  if (low.includes("pend") || low.includes("revis")) return "Revisión pendiente";
  return raw;
};

const ESTILOS = `
@keyframes ma-up { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
@keyframes ma-row { from { opacity:0; transform:translateX(-8px);} to { opacity:1; transform:translateX(0);} }
.ma-font { font-family:'Plus Jakarta Sans', system-ui, sans-serif; }
.ma-up { animation: ma-up .5s cubic-bezier(.22,1,.36,1) both; }
.ma-row { animation: ma-row .4s cubic-bezier(.22,1,.36,1) both; }
.ma-lift { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.ma-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -14px rgba(15,23,42,.3); }
@media (prefers-reduced-motion: reduce) { .ma-up,.ma-row { animation:none !important; } .ma-lift:hover { transform:none; } }
`;

const useContador = (objetivo, dur = 800) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const paso = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      setV(objetivo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, dur]);
  return Math.round(v);
};
const Num = ({ valor }) => <>{useContador(valor)}</>;

const useMontado = () => {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setM(true), 60);
    return () => clearTimeout(id);
  }, []);
  return m;
};

export default function MisAlumnos({ darkMode = false }) {
  const moduloSistema = useModuloSistema();
  const claveSesion = useMemo(() => obtenerClaveSesion(), []);
  const cacheInicial = useMemo(
    () => leerCachePersistencia(claveSesion),
    [claveSesion]
  );

  const [alumnos, setAlumnos] = useState(() => cacheInicial?.alumnos ?? []);
  const [modulos, setModulos] = useState(() => cacheInicial?.modulos ?? []);
  const [moduloSeleccionado, setModuloSeleccionado] = useState("todos");
  const moduloSeleccionadoActivo = moduloSistema?.all
    ? "todos"
    : moduloSistema?.id_modulo
      ? String(moduloSistema.id_modulo)
      : moduloSeleccionado;
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(
    () => !(cacheInicial?.alumnos?.length > 0)
  );
  const [error, setError] = useState("");
  const [vista, setVista] = useState("tabla");
  const [pagina, setPagina] = useState(1);

  const sincronizarDatos = useCallback(
    async ({ forzarSpinner = false, forzarRed = false } = {}) => {
      const claveActual = obtenerClaveSesion();
      const cached = leerCachePersistencia(claveActual);

      if (forzarRed) {
        invalidateApiCache("/mis-alumnos");
      }

      if (cached && !forzarSpinner) {
        setAlumnos(cached.alumnos);
        setModulos(cached.modulos);
        setCargando(false);
      } else if (forzarSpinner || !cached?.alumnos?.length) {
        setCargando(true);
      }

      setError("");

      try {
        const token = obtenerTokenActual();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = { all: true, per_page: 1000, limit: 1000 };

        const [resAlumnos, resModulos] = await Promise.all([
          api.get("/mis-alumnos", { params, headers }),
          api
            .get("/modulos-profesionales", { params, headers })
            .catch(() => ({ data: [] })),
        ]);

        const listaAlumnos = extraerLista(resAlumnos.data);
        const listaModulos = extraerLista(resModulos.data);

        setAlumnos(listaAlumnos);
        setModulos(listaModulos);
        guardarCachePersistencia(claveActual, listaAlumnos, listaModulos);
      } catch (err) {
        console.error("Error al cargar los alumnos asignados:", err);
        const respaldo = leerCachePersistencia(claveActual);
        if (respaldo?.alumnos?.length) {
          setAlumnos(respaldo.alumnos);
          setModulos(respaldo.modulos);
        } else {
          setError("No se pudieron cargar tus alumnos asignados.");
          setAlumnos([]);
        }
      } finally {
        setCargando(false);
      }
    },
    []
  );

  useEffect(() => {
    const cached = leerCachePersistencia(claveSesion);
    if (cached?.alumnos?.length) {
      setAlumnos(cached.alumnos);
      setModulos(cached.modulos);
      setCargando(false);
      sincronizarDatos({ forzarSpinner: false });
    } else {
      sincronizarDatos({ forzarSpinner: true });
    }

    const alActualizarExpediente = () => {
      sincronizarDatos({ forzarSpinner: false });
    };
    window.addEventListener("expediente:actualizado", alActualizarExpediente);
    return () => {
      window.removeEventListener("expediente:actualizado", alActualizarExpediente);
    };
  }, [claveSesion, sincronizarDatos]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, moduloSeleccionadoActivo, vista]);

  // Filtros de módulos sin duplicados por escritura distinta (ej. "Palicaciones" vs "Aplicaciones")
  const filtros = useMemo(() => {
    const vistos = new Set();
    const items = [{ id: "todos", nombre: "Todos", canon: "todos" }];

    const fuentes = [
      ...modulos.map((m) => ({
        id: String(obtenerIdModulo(m)),
        nombre: nombreModuloDe(m) || `Módulo #${obtenerIdModulo(m)}`,
      })),
      ...alumnos.map((a) => ({
        id: String(a.id_modulo ?? a.modulo_id ?? claveCanonModulo(moduloDe(a))),
        nombre: moduloDe(a),
      })),
    ];

    fuentes.forEach((f) => {
      const canon = claveCanonModulo(f.nombre);
      if (!f.nombre || !canon || vistos.has(canon)) return;
      vistos.add(canon);
      items.push({ id: f.id, nombre: f.nombre, canon });
    });

    return items;
  }, [modulos, alumnos]);

  const filtroActivoObj = useMemo(
    () =>
      filtros.find(
        (f) =>
         f.id === String(moduloSeleccionadoActivo) ||
         f.canon === claveCanonModulo(moduloSeleccionadoActivo)
      ) || filtros[0],
    [filtros, moduloSeleccionadoActivo]
  );
  const cambiarFiltroModulo = (filtro) => {
    setModuloSeleccionado(filtro.id);
    if (filtro.id === "todos") {
      publicarModuloSistema(null);
      return;
    }

    const moduloCatalogo = modulos.find(
      (modulo) => String(obtenerIdModulo(modulo)) === String(filtro.id)
    );
    if (moduloCatalogo) {
      publicarModuloSistema(moduloCatalogo);
      return;
    }

    const asignacion = alumnos.find(
      (alumno) =>
        String(alumno.id_modulo ?? alumno.modulo_id ?? "") ===
        String(filtro.id)
    );
    if (asignacion?.id_modulo || asignacion?.modulo_id) {
      publicarModuloSistema({
        id_modulo: asignacion.id_modulo ?? asignacion.modulo_id,
        numero_modulo: asignacion.numero_modulo,
        nombre_modulo: moduloDe(asignacion),
      });
    }
  };

  // Distribuye claramente:
  // - Si se selecciona un módulo específico, muestra la asignación de ese módulo.
  // - Si está en "Todos", agrupa por alumno para no repetir filas del mismo alumno,
  //   indicando si lleva un segundo módulo distinto.
  const alumnosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrandoPorModulo =
      moduloSeleccionadoActivo !== "todos" &&
      (Boolean(moduloSistema?.id_modulo) || filtroActivoObj?.id !== "todos");

    const coinciden = alumnos.filter((alumno) => {
      const modNombre = moduloDe(alumno);
      const coincideTexto =
        !q ||
        [
          alumno.dni,
          alumno.nombres,
          alumno.nombre,
          alumno.apellidos,
          alumno.correo,
          alumno.email,
          alumno.programa_estudios,
          modNombre,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      if (!coincideTexto) return false;
      if (!filtrandoPorModulo) return true;

      const idModAlumno = String(alumno.id_modulo ?? alumno.modulo_id ?? "");
      return (
        idModAlumno === String(filtroActivoObj.id) ||
        claveCanonModulo(modNombre) === filtroActivoObj.canon
      );
    });

    if (filtrandoPorModulo) {
      return coinciden;
    }

    const agrupadosMap = new Map();
    coinciden.forEach((alumno) => {
      const idEst = String(
        alumno.id_estudiante ?? alumno.id ?? nombreCompleto(alumno)
      );
      const modNombre = moduloDe(alumno);

      if (!agrupadosMap.has(idEst)) {
        agrupadosMap.set(idEst, {
          ...alumno,
          modulo_nombre: modNombre,
          _modulosDistintos: [modNombre],
        });
      } else {
        const actual = agrupadosMap.get(idEst);
        const yaEsta = actual._modulosDistintos.some(
          (m) => claveCanonModulo(m) === claveCanonModulo(modNombre)
        );
        if (!yaEsta) {
          actual._modulosDistintos.push(modNombre);
        }
      }
    });

    return Array.from(agrupadosMap.values());
  }, [
    alumnos,
    busqueda,
    moduloSeleccionadoActivo,
    moduloSistema?.id_modulo,
    filtroActivoObj,
  ]);

  const resumen = useMemo(() => {
    const porModulo = {};
    alumnosFiltrados.forEach((a) => {
      const listaMods =
        Array.isArray(a._modulosDistintos) && a._modulosDistintos.length > 0
          ? a._modulosDistintos
          : [moduloDe(a)];
      listaMods.forEach((m) => {
        porModulo[m] = (porModulo[m] || 0) + 1;
      });
    });
    const grupos = Object.entries(porModulo).map(([nombre, n], i) => ({
      nombre,
      n,
      color: PALETA_MODULOS[i % PALETA_MODULOS.length],
    }));
    const enProgreso = alumnosFiltrados.filter(
      (a) => estadoDe(a) === "En progreso"
    ).length;
    const completados = alumnosFiltrados.filter(
      (a) => estadoDe(a) === "Completado"
    ).length;
    return { grupos, enProgreso, completados };
  }, [alumnosFiltrados]);

  const montado = useMontado();
  const totalPaginas = Math.max(
    1,
    Math.ceil(alumnosFiltrados.length / POR_PAGINA)
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = alumnosFiltrados.slice(inicio, inicio + POR_PAGINA);

  const tema = darkMode
    ? {
        texto: "text-slate-100",
        secundario: "text-slate-400",
        tarjeta: "bg-[#0b1b3a] border-[#1e335c]",
        campo:
          "bg-[#0f172a] border-[#1e335c] text-slate-100 placeholder:text-slate-500",
        encabezado: "border-[#1e335c] text-slate-400 bg-[#0f172a]/60",
        fila: "border-[#1e335c] hover:bg-[#13264c]",
        divisor: "divide-[#1e335c]",
        borde: "border-[#1e335c]",
        pista: "bg-[#13264c]",
        chip: "bg-[#13264c] text-slate-300 hover:text-white",
        pie: "bg-[#0f172a]/60",
      }
    : {
        texto: "text-slate-800",
        secundario: "text-slate-500",
        tarjeta: "bg-white border-slate-200",
        campo:
          "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400",
        encabezado: "border-slate-200 text-slate-500 bg-slate-50",
        fila: "border-slate-100 hover:bg-blue-50/50",
        divisor: "divide-slate-100",
        borde: "border-slate-200",
        pista: "bg-slate-100",
        chip: "bg-slate-100 text-slate-600 hover:bg-slate-200",
        pie: "bg-slate-50",
      };

  const hayFiltros = busqueda.trim() || moduloSeleccionadoActivo !== "todos";

  const Estado = ({ valor }) => {
    const c = colorEstado(valor);
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: `${c}1a`, color: c }}
      >
        <i
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: c }}
        />{" "}
        {valor}
      </span>
    );
  };

  const tarjetas = [
    {
      t: "Alumnos asignados",
      v: alumnosFiltrados.length,
      ic: Users,
      color: "#2563eb",
      nota: hayFiltros ? "Con el filtro actual" : "A tu cargo",
    },
    {
      t: "En progreso",
      v: resumen.enProgreso,
      ic: CheckCircle2,
      color: "#10b981",
      nota: "Realizando sus prácticas",
    },
    {
      t: "Completados",
      v: resumen.completados,
      ic: GraduationCap,
      color: "#7c3aed",
      nota: "Prácticas finalizadas",
    },
  ];

  return (
    <div className={`ma-font w-full space-y-6 p-5 md:p-6 ${tema.texto}`}>
      <style>{ESTILOS}</style>

      <div className="ma-up flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
            Mis Alumnos Asignados
          </h1>
          <p className={`mt-1 text-sm ${tema.secundario}`}>
            Distribución ordenada por módulo EFSRT, contacto y expediente del
            practicante.
          </p>
        </div>

        <button
          type="button"
          onClick={() => sincronizarDatos({ forzarSpinner: true, forzarRed: true })}
          className={`inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 md:self-auto ${tema.tarjeta} ${tema.texto} hover:border-blue-600 hover:text-blue-600`}
        >
          <RefreshCcw size={15} className={cargando ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((s, i) => (
          <div
            key={s.t}
            style={{ animationDelay: `${60 + i * 60}ms` }}
            className={`ma-up ma-lift relative overflow-hidden rounded-2xl border p-5 ${tema.tarjeta}`}
          >
            <span
              className="absolute bottom-5 left-0 top-5 w-1 rounded-r"
              style={{ background: s.color }}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs font-semibold ${tema.secundario}`}>
                  {s.t}
                </p>
                <p className="mt-2 text-3xl font-extrabold leading-none tabular-nums">
                  <Num valor={s.v} />
                </p>
              </div>
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: `${s.color}1a`, color: s.color }}
              >
                <s.ic size={19} />
              </span>
            </div>
            <p className={`mt-4 text-[11px] ${tema.secundario}`}>{s.nota}</p>
          </div>
        ))}

        <div
          style={{ animationDelay: "240ms" }}
          className={`ma-up ma-lift rounded-2xl border p-5 ${tema.tarjeta}`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold ${tema.secundario}`}>
              Por módulo
            </p>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10 text-blue-600">
              <Layers size={19} />
            </span>
          </div>
          {resumen.grupos.length === 0 ? (
            <p className={`mt-3 text-[11px] ${tema.secundario}`}>
              Sin datos todavía.
            </p>
          ) : (
            <>
              <div
                className={`mt-1 flex h-2.5 gap-[3px] overflow-hidden rounded-full ${tema.pista}`}
              >
                {resumen.grupos.map((g) => (
                  <span
                    key={g.nombre}
                    title={`${g.nombre}: ${g.n}`}
                    className="h-full rounded-full"
                    style={{
                      background: g.color,
                      width: montado
                        ? `${Math.min(
                            100,
                            (g.n / Math.max(1, alumnosFiltrados.length)) * 100
                          )}%`
                        : "0%",
                      transition: "width .9s cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-1">
                {resumen.grupos.slice(0, 3).map((g) => (
                  <li
                    key={g.nombre}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span
                      className={`flex min-w-0 items-center gap-1.5 ${tema.secundario}`}
                    >
                      <i
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: g.color }}
                      />{" "}
                      <span className="truncate">{g.nombre}</span>
                    </span>
                    <b className="tabular-nums">{g.n}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div
        style={{ animationDelay: "300ms" }}
        className={`ma-up overflow-hidden rounded-2xl border shadow-sm ${tema.tarjeta}`}
      >
        <div className={`space-y-4 border-b px-5 py-5 md:px-6 ${tema.borde}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-96">
              <Search
                size={16}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${tema.secundario}`}
              />
              <input
                type="text"
                placeholder="Buscar por DNI, nombres o apellidos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 ${tema.campo}`}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${tema.secundario}`}>
                <b className={tema.texto}>{alumnosFiltrados.length}</b>{" "}
                {alumnosFiltrados.length === 1 ? "alumno" : "alumnos"}
              </span>
              <div className={`flex rounded-xl border p-0.5 ${tema.borde}`}>
                {[
                  ["tabla", Table2, "Tabla"],
                  ["tarjetas", LayoutGrid, "Tarjetas"],
                ].map(([id, Icon, nombre]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVista(id)}
                    title={nombre}
                    aria-label={nombre}
                    aria-pressed={vista === id}
                    className={`rounded-lg p-2 transition-colors ${
                      vista === id
                        ? "bg-blue-600 text-white"
                        : `${tema.secundario} hover:text-blue-600`
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 overflow-x-auto pb-0.5"
            role="group"
            aria-label="Filtrar por módulo profesional"
          >
            {filtros.map((f) => {
              const act = moduloSistema?.all
                ? f.id === "todos"
                : moduloSistema?.id_modulo
                  ? String(moduloSistema.id_modulo) === String(f.id)
                  : filtroActivoObj?.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => cambiarFiltroModulo(f)}
                  aria-pressed={act}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    act
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : tema.chip
                  }`}
                >
                  {f.id !== "todos" && <BookOpen size={12} />}
                  {f.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {cargando ? (
          <div className={`divide-y ${tema.divisor}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 px-6 py-4"
              >
                <div className={`h-10 w-10 rounded-xl ${tema.pista}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3.5 w-48 rounded ${tema.pista}`} />
                  <div className={`h-2.5 w-28 rounded ${tema.pista}`} />
                </div>
                <div
                  className={`hidden h-6 w-32 rounded-lg md:block ${tema.pista}`}
                />
                <div
                  className={`hidden h-6 w-20 rounded-full md:block ${tema.pista}`}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="ma-up flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-rose-500/10 text-rose-500">
              <AlertCircle size={24} />
            </span>
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => sincronizarDatos({ forzarSpinner: true, forzarRed: true })}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95"
            >
              <RefreshCcw size={13} /> Reintentar
            </button>
          </div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="ma-up flex flex-col items-center px-6 py-14 text-center">
            <span
              className={`mb-3 grid h-14 w-14 place-items-center rounded-full ${tema.pista} ${tema.secundario}`}
            >
              <UserX size={24} />
            </span>
            <p className="text-sm font-semibold">
              No se encontraron alumnos asignados
            </p>
            <p className={`mt-1 text-xs ${tema.secundario}`}>
              {hayFiltros
                ? "Prueba con otra búsqueda o módulo."
                : "Cuando se te asignen practicantes aparecerán aquí."}
            </p>
            {alumnosFiltrados.length === 0 && alumnos.length > 0 && (
              <p className={`mt-1 text-xs ${tema.secundario}`}>
                Hay {alumnos.length} asignaciones registradas en otros módulos o periodos.
              </p>
            )}
            {hayFiltros && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setModuloSeleccionado("todos");
                  publicarModuloSistema(null);
                }}
                className="mt-3 rounded-lg border border-blue-600 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
              >
                Ver todos los módulos
              </button>
            )}
          </div>
        ) : vista === "tabla" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr
                  className={`border-b text-[11px] font-semibold uppercase tracking-wider ${tema.encabezado}`}
                >
                  <th className="px-6 py-3">Alumno</th>
                  <th className="px-4 py-3">Módulo EFSRT</th>
                  <th className="px-4 py-3">Programa / Expediente</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${tema.divisor}`}>
                {visibles.map((alumno, i) => {
                  const periodo = alumno.periodo_academico
                    ? ` · ${alumno.periodo_academico}`
                    : "";
                  const estTexto = estadoDe(alumno);
                  const c = colorEstado(estTexto);
                  const correo = alumno.correo || alumno.email;
                  const extrasModulo = Array.isArray(alumno._modulosDistintos)
                    ? alumno._modulosDistintos.filter(
                        (m) =>
                          claveCanonModulo(m) !==
                          claveCanonModulo(moduloDe(alumno))
                      )
                    : [];
                  const horasExp =
                    alumno.horas_acumuladas != null
                      ? `${alumno.horas_acumuladas}h`
                      : null;

                  return (
                    <tr
                      key={`${alumno.id_estudiante || alumno.id}-${
                        alumno.id_modulo || i
                      }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className={`ma-row group relative transition-colors ${tema.fila}`}
                    >
                      <td className="relative px-6 py-3.5">
                        <span className="absolute bottom-2.5 left-0 top-2.5 w-1 origin-center scale-y-0 rounded-r bg-blue-600 transition-transform group-hover:scale-y-100" />
                        <div className="flex items-center gap-3.5">
                          <AvatarEstudiante
                            estudiante={alumno}
                            className="h-10 w-10 rounded-xl text-xs font-bold"
                            fallbackStyle={{ background: `${c}1a`, color: c }}
                          />
                          <div className="min-w-0 leading-tight">
                            <p className="truncate font-semibold">
                              {nombreCompleto(alumno)}
                            </p>
                            <span
                              className={`mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${tema.pista} ${tema.secundario}`}
                            >
                              DNI {alumno.dni || "S/N"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
                            <BookOpen size={12} />
                            {moduloDe(alumno)}
                            {periodo}
                          </span>
                          {extrasModulo.length > 0 && (
                            <span
                              title={`También asignado en: ${extrasModulo.join(
                                ", "
                              )}`}
                              className="inline-flex items-center rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600"
                            >
                              +{extrasModulo.length}{" "}
                              {extrasModulo.length === 1 ? "módulo" : "módulos"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 leading-tight">
                        <p className="text-[13px] font-medium">
                          {alumno.programa_estudios ||
                            "Diseño y Programación Web"}
                        </p>
                        <p className={`text-[11px] ${tema.secundario}`}>
                          {alumno.semestre || "VI Semestre"}
                          {horasExp ? ` · Exp: ${horasExp}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        {correo ? (
                          <a
                            href={`mailto:${correo}`}
                            className={`inline-flex max-w-[210px] items-center gap-1.5 truncate text-xs transition-colors hover:text-blue-600 ${tema.secundario}`}
                          >
                            <Mail size={13} className="shrink-0" />{" "}
                            <span className="truncate">{correo}</span>
                          </a>
                        ) : (
                          <span className={`text-xs ${tema.secundario}`}>
                            S/C
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Estado valor={estTexto} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-6 xl:grid-cols-3 2xl:grid-cols-4">
            {visibles.map((alumno, i) => {
              const estTexto = estadoDe(alumno);
              const c = colorEstado(estTexto);
              const correo = alumno.correo || alumno.email;
              const extrasModulo = Array.isArray(alumno._modulosDistintos)
                ? alumno._modulosDistintos.filter(
                    (m) =>
                      claveCanonModulo(m) !==
                      claveCanonModulo(moduloDe(alumno))
                  )
                : [];
              return (
                <article
                  key={`${alumno.id_estudiante || alumno.id}-${
                    alumno.id_modulo || i
                  }`}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className={`ma-up ma-lift relative overflow-hidden rounded-2xl border p-5 pt-6 ${tema.tarjeta}`}
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: c }}
                  />
                  <div className="flex items-center gap-3.5">
                    <AvatarEstudiante
                      estudiante={alumno}
                      className="h-12 w-12 rounded-2xl text-sm font-bold"
                      fallbackStyle={{ background: `${c}1a`, color: c }}
                    />
                    <div className="min-w-0 leading-tight">
                      <p className="truncate font-bold">
                        {nombreCompleto(alumno)}
                      </p>
                      <p
                        className={`mt-0.5 font-mono text-[11px] ${tema.secundario}`}
                      >
                        DNI {alumno.dni || "S/N"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
                      <BookOpen size={12} className="shrink-0" />{" "}
                      <span className="truncate">
                        {moduloDe(alumno)}
                        {alumno.periodo_academico
                          ? ` · ${alumno.periodo_academico}`
                          : ""}
                      </span>
                    </span>
                    {extrasModulo.length > 0 && (
                      <span
                        title={`También asignado en: ${extrasModulo.join(
                          ", "
                        )}`}
                        className="inline-flex items-center rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600"
                      >
                        +{extrasModulo.length}{" "}
                        {extrasModulo.length === 1 ? "módulo" : "módulos"}
                      </span>
                    )}
                  </div>
                  <p className={`mt-3 text-xs ${tema.secundario}`}>
                    {alumno.programa_estudios || "Diseño y Programación Web"} ·{" "}
                    {alumno.semestre || "VI Semestre"}
                  </p>
                  <div
                    className={`mt-4 flex items-center justify-between gap-2 border-t pt-3 ${tema.borde}`}
                  >
                    {correo ? (
                      <a
                        href={`mailto:${correo}`}
                        className={`flex min-w-0 items-center gap-1.5 text-[11px] hover:text-blue-600 ${tema.secundario}`}
                      >
                        <Mail size={12} className="shrink-0" />{" "}
                        <span className="truncate">{correo}</span>
                      </a>
                    ) : (
                      <span className={`text-[11px] ${tema.secundario}`}>
                        S/C
                      </span>
                    )}
                    <Estado valor={estTexto} />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!cargando && !error && alumnosFiltrados.length > 0 && (
          <div
            className={`flex flex-col items-center justify-between gap-3 border-t px-6 py-4 text-xs sm:flex-row ${tema.borde} ${tema.pie} ${tema.secundario}`}
          >
            <span>
              Mostrando{" "}
              <b className={tema.texto}>
                {inicio + 1}–
                {Math.min(inicio + POR_PAGINA, alumnosFiltrados.length)}
              </b>{" "}
              de <b className={tema.texto}>{alumnosFiltrados.length}</b> alumnos
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPagina(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                aria-label="Página anterior"
                className={`grid h-8 w-8 place-items-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${tema.borde} ${tema.tarjeta}`}
              >
                <ChevronLeft size={15} />
              </button>
              {[...Array(totalPaginas)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPagina(i + 1)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                    paginaActual === i + 1
                      ? "scale-105 bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : `border ${tema.borde} ${tema.tarjeta}`
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                aria-label="Página siguiente"
                className={`grid h-8 w-8 place-items-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${tema.borde} ${tema.tarjeta}`}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}