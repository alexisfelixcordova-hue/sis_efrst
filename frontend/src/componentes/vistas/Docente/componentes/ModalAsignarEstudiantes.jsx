import React, { useState, useEffect, useMemo } from "react";
import {
  X, Search, Users, GraduationCap, UserCheck, Loader2, AlertCircle,
  Plus, Minus, ChevronsRight, ChevronsLeft, Inbox, ArrowRightLeft,
} from "lucide-react";
import api from "../../../../api/axios";

const LOTE = 40; // filas visibles por vez: sirve para pocos o muchos estudiantes
const k = (id) => String(id); // compara ids sin importar si vienen como número o texto

const obtenerIdDocente = (d) => d?.id_docente ?? d?.id ?? d?.id_usuario;
const obtenerIdEstudiante = (e) => e?.id_estudiante ?? e?.id ?? e?.id_usuario;
const obtenerIdModulo = (m) => m?.id_modulo ?? m?.id;
const nombreModuloDe = (m) => m?.nombre ?? m?.nombre_modulo ?? m?.titulo ?? m?.descripcion ?? "";

const nombreDe = (p) =>
  `${p?.nombres || p?.nombre || ""} ${p?.apellidos || ""}`.trim();
const dniDe = (e) => e.dni || e.numero_documento || "Sin DNI";
const programaDe = (e) => e.programa_estudios || e.especialidad || e.programa || "";
const semestreDe = (e) => e.semestre || "";
const correoDe = (e) => e.correo || e.email || "";

const iniciales = (texto = "") =>
  texto.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

const coincide = (est, q) =>
  !q ||
  [nombreDe(est), dniDe(est), correoDe(est), programaDe(est), semestreDe(est)]
    .join(" ")
    .toLowerCase()
    .includes(q);

export default function ModalAsignarEstudiantes({
  abierto,
  onCerrar,
  docentes = [],
  docenteInicial = null,
  estudiantes = [],
  modulos = [],
  periodoDefecto = "2026-II",
  darkMode = false,
  onGuardadoExitoso,
}) {
  const [docenteSeleccionadoId, setDocenteSeleccionadoId] = useState("");
  const [moduloId, setModuloId] = useState("");
  const [periodoAcademico, setPeriodoAcademico] = useState(periodoDefecto);
  const [listaModulos, setListaModulos] = useState([]);

  const [busquedaDisp, setBusquedaDisp] = useState("");
  const [busquedaAsig, setBusquedaAsig] = useState("");
  const [programa, setPrograma] = useState("Todos");
  const [semestre, setSemestre] = useState("Todos");
  const [seleccionados, setSeleccionados] = useState([]);
  const [idsIniciales, setIdsIniciales] = useState([]); // lo que ya estaba guardado
  const [objetosAsignados, setObjetosAsignados] = useState([]);
  const [limiteDisp, setLimiteDisp] = useState(LOTE);
  const [limiteAsig, setLimiteAsig] = useState(LOTE);
  const [vista, setVista] = useState("disponibles"); // pestañas en pantallas pequeñas
  const [cargandoAsignados, setCargandoAsignados] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const docenteActual = useMemo(
    () =>
      docentes.find((d) => k(obtenerIdDocente(d)) === k(docenteSeleccionadoId)) ||
      docenteInicial ||
      null,
    [docentes, docenteSeleccionadoId, docenteInicial]
  );

  // Carga módulos si no vienen por prop
  useEffect(() => {
    if (!abierto) return;
    if (Array.isArray(modulos) && modulos.length > 0) {
      setListaModulos(modulos);
      return;
    }

    let activo = true;
    const cargarModulos = async () => {
      try {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const res = await api.get("/modulos-profesionales", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = res.data?.data || res.data || [];
        if (activo && Array.isArray(data)) {
          setListaModulos(data);
        }
      } catch {
        if (activo) setListaModulos([]);
      }
    };

    cargarModulos();
    return () => {
      activo = false;
    };
  }, [abierto, modulos]);

  // Al abrir: docente inicial, módulo por defecto, periodo y filtros limpios
  useEffect(() => {
    if (!abierto) return;
    const inicial = docenteInicial || docentes[0] || null;
    const idInicial = inicial ? obtenerIdDocente(inicial) : "";
    setDocenteSeleccionadoId(idInicial ? k(idInicial) : "");
    setPeriodoAcademico(periodoDefecto || "2026-II");
    setBusquedaDisp("");
    setBusquedaAsig("");
    setPrograma("Todos");
    setSemestre("Todos");
    setVista("disponibles");
    setError("");
  }, [abierto, docenteInicial, docentes, periodoDefecto]);

  useEffect(() => {
    if (!moduloId && listaModulos.length > 0) {
      const primerId = obtenerIdModulo(listaModulos[0]);
      if (primerId != null) setModuloId(k(primerId));
    }
  }, [listaModulos, moduloId]);

  // Carga los estudiantes ya asignados al docente seleccionado
  useEffect(() => {
    if (!abierto || !docenteSeleccionadoId) {
      setSeleccionados([]);
      setIdsIniciales([]);
      setObjetosAsignados([]);
      return;
    }

    let activo = true;
    const cargarAsignados = async () => {
      setCargandoAsignados(true);
      try {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const params = moduloId ? { id_modulo: moduloId } : {};
        const res = await api.get(`/docentes/${docenteSeleccionadoId}/estudiantes`, {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = res.data?.data || res.data || [];
        if (activo && Array.isArray(data)) {
          const ids = data.map((item) =>
            typeof item === "object" ? obtenerIdEstudiante(item) : item
          );
          setSeleccionados(ids);
          setIdsIniciales(ids);
          setObjetosAsignados(data.filter((item) => typeof item === "object"));
        }
      } catch {
        if (activo) {
          setSeleccionados([]);
          setIdsIniciales([]);
          setObjetosAsignados([]);
        }
      } finally {
        if (activo) setCargandoAsignados(false);
      }
    };

    cargarAsignados();
    return () => {
      activo = false;
    };
  }, [abierto, docenteSeleccionadoId, moduloId]);

  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionarEsc = (e) => {
      if (e.key === "Escape" && !guardando) onCerrar?.();
    };
    document.addEventListener("keydown", alPresionarEsc);
    return () => document.removeEventListener("keydown", alPresionarEsc);
  }, [abierto, guardando, onCerrar]);

  // Reinicia "mostrar más" al cambiar filtros
  useEffect(() => setLimiteDisp(LOTE), [busquedaDisp, programa, semestre]);
  useEffect(() => setLimiteAsig(LOTE), [busquedaAsig]);

  const mapa = useMemo(() => {
    const m = new Map();
    objetosAsignados.forEach((e) => m.set(k(obtenerIdEstudiante(e)), e));
    estudiantes.forEach((e) => m.set(k(obtenerIdEstudiante(e)), e));
    return m;
  }, [estudiantes, objetosAsignados]);

  const programas = useMemo(
    () => ["Todos", ...Array.from(new Set(estudiantes.map(programaDe).filter(Boolean))).sort()],
    [estudiantes]
  );
  const semestres = useMemo(
    () => ["Todos", ...Array.from(new Set(estudiantes.map(semestreDe).filter(Boolean))).sort()],
    [estudiantes]
  );

  const setSel = useMemo(() => new Set(seleccionados.map(k)), [seleccionados]);
  const setIni = useMemo(() => new Set(idsIniciales.map(k)), [idsIniciales]);

  const disponibles = useMemo(() => {
    const q = busquedaDisp.trim().toLowerCase();
    return estudiantes.filter(
      (est) =>
        !setSel.has(k(obtenerIdEstudiante(est))) &&
        coincide(est, q) &&
        (programa === "Todos" || programaDe(est) === programa) &&
        (semestre === "Todos" || semestreDe(est) === semestre)
    );
  }, [estudiantes, setSel, busquedaDisp, programa, semestre]);

  const totalDisponibles = estudiantes.filter((e) => !setSel.has(k(obtenerIdEstudiante(e)))).length;

  const asignados = useMemo(() => {
    const q = busquedaAsig.trim().toLowerCase();
    return seleccionados
      .map((id) => mapa.get(k(id)) || { id, nombres: `Estudiante #${id}` })
      .filter((est) => coincide(est, q));
  }, [seleccionados, mapa, busquedaAsig]);

  const agregados = seleccionados.filter((id) => !setIni.has(k(id))).length;
  const quitados = idsIniciales.filter((id) => !setSel.has(k(id))).length;
  const hayCambios = agregados + quitados > 0;

  const capacidad = Number(docenteActual?.capacidad) || 12;
  const porcentaje = Math.min(100, Math.round((seleccionados.length / capacidad) * 100));
  const excede = seleccionados.length > capacidad;
  const colorCupo = excede ? "bg-rose-500" : porcentaje >= 90 ? "bg-amber-500" : "bg-[#0284c7]";

  const bloqueado = cargandoAsignados || guardando;

  const agregar = (id) => {
    setError("");
    setSeleccionados((prev) => (prev.some((x) => k(x) === k(id)) ? prev : [...prev, id]));
  };
  const quitar = (id) => {
    setError("");
    setSeleccionados((prev) => prev.filter((x) => k(x) !== k(id)));
  };
  const agregarVisibles = () => {
    setError("");
    setSeleccionados((prev) => {
      const ya = new Set(prev.map(k));
      const nuevos = disponibles.map(obtenerIdEstudiante).filter((id) => !ya.has(k(id)));
      return [...prev, ...nuevos];
    });
  };
  const quitarVisibles = () => {
    setError("");
    const ids = new Set(asignados.map((e) => k(obtenerIdEstudiante(e))));
    setSeleccionados((prev) => prev.filter((id) => !ids.has(k(id))));
  };

  const guardarAsignacion = async () => {
    if (!docenteSeleccionadoId) {
      setError("Selecciona un docente asesor antes de guardar.");
      return;
    }
    if (!periodoAcademico.trim()) {
      setError("Indica el periodo académico (por ejemplo, 2026-II).");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await api.post(
        `/docentes/${docenteSeleccionadoId}/asignar-estudiantes`,
        {
          id_docente: Number(docenteSeleccionadoId),
          id_modulo: moduloId ? Number(moduloId) : null,
          periodo_academico: periodoAcademico.trim(),
          estudiantes: seleccionados.map(Number),
        },
        { headers }
      );

      await onGuardadoExitoso?.();
      onCerrar?.();
    } catch (err) {
      setError(
        err?.response?.data?.message || "No se pudo guardar la asignación de estudiantes."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  const nombreDocente = nombreDe(docenteActual) || "Docente asesor";

  const t = darkMode
    ? {
        card: "bg-[#0b1b3a] border-[#1e335c] text-slate-100",
        borde: "border-[#1e335c]",
        panel: "bg-[#0d2147]/60",
        suave: "bg-[#0f172a]",
        texto2: "text-slate-400",
        hover: "hover:bg-[#13264c]",
        campo: "bg-[#0f172a] border-[#1e335c] text-slate-100",
        boton: "bg-[#0f172a] border-[#1e335c] text-slate-200 hover:bg-[#13264c]",
        cerrar: "text-slate-400 hover:bg-[#13264c] hover:text-white",
        avatar: "bg-[#13264c] text-slate-300",
        divide: "divide-[#1e335c]",
        barra: "bg-[#1e335c]",
      }
    : {
        card: "bg-white border-slate-200 text-slate-800",
        borde: "border-slate-200",
        panel: "bg-slate-50/70",
        suave: "bg-slate-50",
        texto2: "text-slate-500",
        hover: "hover:bg-slate-50",
        campo: "bg-white border-slate-300 text-slate-700",
        boton: "bg-white border-slate-300 text-slate-700 hover:bg-slate-50",
        cerrar: "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
        avatar: "bg-slate-100 text-slate-600",
        divide: "divide-slate-200",
        barra: "bg-slate-200",
      };

  const campoBusqueda = (valor, cambiar, placeholder) => (
    <div
      className={`flex flex-1 items-center rounded-lg border px-3 py-2 transition focus-within:border-[#0284c7] focus-within:ring-2 focus-within:ring-[#0284c7]/25 ${t.campo}`}
    >
      <Search className={`mr-2.5 h-4 w-4 shrink-0 ${t.texto2}`} />
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

  const fila = (est, tipo) => {
    const id = obtenerIdEstudiante(est);
    const nombre = nombreDe(est) || "Estudiante";
    const detalle = [programaDe(est), semestreDe(est) && `Sem. ${semestreDe(est)}`]
      .filter(Boolean)
      .join(" · ");
    const estabaAsignado = setIni.has(k(id));

    return (
      <li
        key={k(id)}
        className={`flex items-center gap-3.5 border-b px-5 py-3 transition-colors last:border-b-0 ${t.borde} ${t.hover}`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.avatar}`}
        >
          {iniciales(nombre)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{nombre}</p>
            {tipo === "agregar" && estabaAsignado && (
              <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-500 ring-1 ring-inset ring-rose-500/20">
                Se quitará
              </span>
            )}
            {tipo === "quitar" && !estabaAsignado && (
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                Nuevo
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
          onClick={() => (tipo === "agregar" ? agregar(id) : quitar(id))}
          aria-label={`${tipo === "agregar" ? "Agregar" : "Quitar"} ${nombre}`}
          title={tipo === "agregar" ? "Agregar al docente" : "Quitar del docente"}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-40 ${
            tipo === "agregar"
              ? "border-[#0284c7]/40 text-[#0284c7] hover:bg-[#0284c7] hover:text-white"
              : "border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white"
          }`}
        >
          {tipo === "agregar" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </button>
      </li>
    );
  };

  const vacio = (Icono, titulo, texto) => (
    <div className={`flex h-full min-h-[220px] flex-col items-center justify-center px-8 py-12 text-center ${t.texto2}`}>
      <div className={`mb-4 rounded-2xl p-4 ${t.suave}`}>
        <Icono className="h-7 w-7" />
      </div>
      <p className="text-sm font-semibold text-current">{titulo}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed">{texto}</p>
    </div>
  );

  const botonMas = (restantes, alClick) =>
    restantes > 0 && (
      <div className="p-4 text-center">
        <button
          type="button"
          onClick={alClick}
          className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${t.boton}`}
        >
          Mostrar {Math.min(restantes, LOTE)} más ({restantes} restantes)
        </button>
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) onCerrar?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-asignar"
        className={`flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl sm:h-[88vh] ${t.card}`}
      >
        {/* Encabezado */}
        <header className={`relative flex flex-col gap-4 border-b py-5 pl-6 pr-16 lg:flex-row lg:items-center lg:justify-between lg:pr-6 ${t.borde}`}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0284c7] text-lg font-bold text-white shadow-sm">
              {iniciales(nombreDocente)}
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <p id="titulo-asignar" className={`flex items-center gap-1.5 text-xs font-medium ${t.texto2}`}>
                  <UserCheck className="h-3.5 w-3.5" />
                  Docente asesor
                </p>
                <select
                  value={docenteSeleccionadoId}
                  onChange={(e) => setDocenteSeleccionadoId(e.target.value)}
                  disabled={guardando}
                  aria-label="Docente asesor"
                  className={`mt-1 w-full cursor-pointer truncate rounded-lg border px-3 py-1.5 text-sm font-bold outline-none transition focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/25 ${t.campo}`}
                >
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
                <label className={`block text-xs font-medium ${t.texto2}`}>
                  Módulo profesional
                </label>
                <select
                  value={moduloId}
                  onChange={(e) => setModuloId(e.target.value)}
                  disabled={guardando}
                  aria-label="Módulo profesional"
                  className={`mt-1 w-full cursor-pointer truncate rounded-lg border px-3 py-1.5 text-sm font-semibold outline-none transition focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/25 ${t.campo}`}
                >
                  <option value="">Sin módulo específico</option>
                  {listaModulos.map((mod) => {
                    const idMod = obtenerIdModulo(mod);
                    return (
                      <option key={k(idMod)} value={k(idMod)}>
                        {nombreModuloDe(mod) || `Módulo #${idMod}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium ${t.texto2}`}>
                  Periodo académico
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={periodoAcademico}
                  onChange={(e) => setPeriodoAcademico(e.target.value)}
                  disabled={guardando}
                  placeholder="Ej. 2026-II"
                  className={`mt-1 w-full rounded-lg border px-3 py-1.5 text-sm font-semibold outline-none transition focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/25 ${t.campo}`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Medidor de cupo */}
            <div className="min-w-[170px] flex-1 lg:flex-none">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className={t.texto2}>Cupo del docente</span>
                <span className={`font-bold ${excede ? "text-rose-500" : ""}`}>
                  {seleccionados.length} / {capacidad}
                </span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${t.barra}`}>
                <div
                  className={`h-full rounded-full transition-all ${colorCupo}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              {excede && (
                <p className="mt-1 text-[11px] font-medium text-rose-500">
                  Supera la capacidad recomendada
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              aria-label="Cerrar"
              className={`absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 lg:static ${t.cerrar}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Pestañas (pantallas angostas) */}
        <div className={`grid grid-cols-2 border-b text-sm font-semibold lg:hidden ${t.borde}`}>
          {[
            ["disponibles", `Disponibles (${totalDisponibles})`],
            ["asignados", `Asignados (${seleccionados.length})`],
          ].map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setVista(clave)}
              className={`py-3 transition ${
                vista === clave ? "border-b-2 border-[#0284c7] text-[#0284c7]" : t.texto2
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        {/* Cuerpo */}
        <div className={`grid min-h-0 flex-1 lg:grid-cols-2 lg:divide-x ${t.divide}`}>
          {/* Panel izquierdo: disponibles */}
          <section className={`min-h-0 flex-col ${vista === "disponibles" ? "flex" : "hidden"} lg:flex`}>
            <div className={`space-y-3 border-b p-5 ${t.borde}`}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Users className="h-4 w-4 text-[#0284c7]" />
                  Estudiantes disponibles
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${t.suave} ${t.texto2}`}>
                    {totalDisponibles}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={agregarVisibles}
                  disabled={disponibles.length === 0 || bloqueado}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284c7] hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Agregar todos ({disponibles.length})
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {campoBusqueda(busquedaDisp, setBusquedaDisp, "Buscar por nombre, DNI o correo")}
                {programas.length > 2 && (
                  <select
                    value={programa}
                    onChange={(e) => setPrograma(e.target.value)}
                    aria-label="Filtrar por programa"
                    className={`rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0284c7] ${t.campo}`}
                  >
                    {programas.map((p) => (
                      <option key={p} value={p}>
                        {p === "Todos" ? "Todos los programas" : p}
                      </option>
                    ))}
                  </select>
                )}
                {semestres.length > 2 && (
                  <select
                    value={semestre}
                    onChange={(e) => setSemestre(e.target.value)}
                    aria-label="Filtrar por semestre"
                    className={`rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0284c7] ${t.campo}`}
                  >
                    {semestres.map((s) => (
                      <option key={s} value={s}>
                        {s === "Todos" ? "Todos los semestres" : `Semestre ${s}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className={`min-h-0 flex-1 overflow-y-auto ${t.panel}`}>
              {estudiantes.length === 0
                ? vacio(GraduationCap, "No hay estudiantes registrados", "Registra estudiantes para poder asignarlos a este docente.")
                : totalDisponibles === 0
                ? vacio(UserCheck, "Todos los estudiantes están asignados", "No queda ningún estudiante disponible para este docente.")
                : disponibles.length === 0
                ? vacio(Search, "Sin resultados", "Prueba con otro nombre, DNI, programa o semestre.")
                : (
                  <>
                    <ul>{disponibles.slice(0, limiteDisp).map((est) => fila(est, "agregar"))}</ul>
                    {botonMas(disponibles.length - limiteDisp, () => setLimiteDisp((l) => l + LOTE))}
                  </>
                )}
            </div>
          </section>

          {/* Panel derecho: asignados */}
          <section className={`min-h-0 flex-col ${vista === "asignados" ? "flex" : "hidden"} lg:flex`}>
            <div className={`space-y-3 border-b p-5 ${t.borde}`}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                  Asignados a este docente
                  <span className="rounded-full bg-[#0284c7]/10 px-2 py-0.5 text-[11px] font-bold text-[#0284c7]">
                    {seleccionados.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={quitarVisibles}
                  disabled={asignados.length === 0 || bloqueado}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                  Quitar todos ({asignados.length})
                </button>
              </div>

              {campoBusqueda(busquedaAsig, setBusquedaAsig, "Buscar entre los asignados")}
            </div>

            <div className={`min-h-0 flex-1 overflow-y-auto ${t.panel}`}>
              {cargandoAsignados
                ? (
                  <div className={`flex h-full min-h-[220px] items-center justify-center gap-2 text-sm ${t.texto2}`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando asignaciones actuales...
                  </div>
                )
                : seleccionados.length === 0
                ? vacio(Inbox, "Aún no hay estudiantes asignados", "Agrégalos desde la lista de disponibles con el botón + o con \"Agregar todos\".")
                : asignados.length === 0
                ? vacio(Search, "Sin resultados", "Ningún asignado coincide con la búsqueda.")
                : (
                  <>
                    <ul>{asignados.slice(0, limiteAsig).map((est) => fila(est, "quitar"))}</ul>
                    {botonMas(asignados.length - limiteAsig, () => setLimiteAsig((l) => l + LOTE))}
                  </>
                )}
            </div>
          </section>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-6 my-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-500"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pie */}
        <footer className={`flex items-center justify-between gap-3 border-t px-6 py-4 ${t.borde} ${t.suave}`}>
          <p className={`hidden items-center gap-2 text-xs sm:flex ${t.texto2}`}>
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {hayCambios ? (
              <>
                <span className="font-semibold text-emerald-500">+{agregados} por agregar</span>
                <span>·</span>
                <span className="font-semibold text-rose-500">−{quitados} por quitar</span>
              </>
            ) : (
              "Sin cambios pendientes"
            )}
          </p>

          <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${t.boton}`}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={guardarAsignacion}
              disabled={bloqueado}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0284c7] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0369a1] disabled:opacity-60"
            >
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {guardando ? "Guardando..." : `Guardar asignación (${seleccionados.length})`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}