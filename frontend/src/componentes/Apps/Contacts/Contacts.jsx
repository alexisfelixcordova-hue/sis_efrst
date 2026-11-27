import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Mail, Phone, Building2, Trash2, X, Copy, Check } from "lucide-react";
import api, { invalidateApiCache } from "../../../api/axios.js";
import AvatarEstudiante from "../../AvatarEstudiante.jsx";

const TIPOS = {
  Docente: "bg-blue-600",
  Alumno: "bg-emerald-500",
  Entidad: "bg-amber-500",
};

const extraerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const obtenerEstudiante = (fila = {}) => fila.estudiante || fila.alumno || fila;
const obtenerIdEstudiante = (fila = {}) => {
  const estudiante = obtenerEstudiante(fila);
  return estudiante.id_estudiante ?? estudiante.id ?? fila.id_estudiante ?? fila.id ?? null;
};

const iniciales = (n) => n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const entrada = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500";

export default function Contacts({ usuario }) {
  const [contactosFuente, setContactosFuente] = useState([]);
  const [contactosManual, setContactosManual] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [filtroAsignacion, setFiltroAsignacion] = useState("todos");
  const [seleccionado, setSeleccionado] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [datosManualCargados, setDatosManualCargados] = useState(false);
  const esAdmin = Number(usuario?.id_rol ?? usuario?.rol_id) === 1;

  const cargarContactos = useCallback(async () => {
    setCargando(true);
    setErrorCarga("");
    const [
      usuariosResult,
      estudiantesResult,
      empresasResult,
      manualesResult,
      asignacionesResult,
    ] =
      await Promise.allSettled([
        api.get("/usuarios"),
        esAdmin
          ? api.get("/estudiantes", { params: { all: true } })
          : api.get("/mis-alumnos"),
        api.get("/empresas"),
        api.get("/apps/contactos"),
        esAdmin ? api.get("/mis-alumnos") : Promise.resolve({ data: [] }),
      ]);

    const fallas = [];
    const usuarios = usuariosResult.status === "fulfilled"
      ? extraerLista(usuariosResult.value.data?.data ?? usuariosResult.value.data)
      : (fallas.push("docentes"), []);
    const estudiantes = estudiantesResult.status === "fulfilled"
      ? extraerLista(estudiantesResult.value.data?.data ?? estudiantesResult.value.data)
      : (fallas.push("estudiantes"), []);
    const empresas = empresasResult.status === "fulfilled"
      ? extraerLista(empresasResult.value.data?.data ?? empresasResult.value.data)
      : (fallas.push("entidades"), []);
    const filasAsignaciones =
      esAdmin && asignacionesResult.status === "fulfilled"
        ? extraerLista(asignacionesResult.value.data?.data ?? asignacionesResult.value.data)
        : [];
    if (esAdmin && asignacionesResult.status === "rejected") {
      fallas.push("asignaciones de estudiantes");
    }

    const docentesPorEstudiante = new Map();
    filasAsignaciones.forEach((fila) => {
      const id = obtenerIdEstudiante(fila);
      if (id === null || id === undefined) return;
      const persona = fila.docente || fila.asesor || {};
      const nombreDocente =
        fila.docente_nombre ||
        persona.nombre_completo ||
        [persona.nombres || persona.nombre, persona.apellidos].filter(Boolean).join(" ");
      const clave = String(id);
      const nombres = docentesPorEstudiante.get(clave) || new Set();
      nombres.add(nombreDocente || `Docente #${fila.id_docente ?? "asignado"}`);
      docentesPorEstudiante.set(clave, nombres);
    });

    const estudiantesUnicos = new Map();
    estudiantes.forEach((fila) => {
      const estudiante = obtenerEstudiante(fila);
      const id = obtenerIdEstudiante(fila);
      if (id === null || id === undefined) return;
      const clave = String(id);
      const asignados = docentesPorEstudiante.get(clave);
      estudiantesUnicos.set(clave, {
        ...estudiante,
        ...fila,
        id_estudiante: id,
        foto_url: estudiante.foto_url || fila.foto_url || "",
        docenteAsignado: asignados ? [...asignados].join(", ") : "",
        asignado: esAdmin
          ? asignacionesResult.status === "fulfilled"
            ? Boolean(asignados)
            : null
          : true,
      });
    });

    setContactosFuente([
      ...usuarios
        .filter((usuario) => Number(usuario.id_rol ?? usuario.rol_id) === 2)
        .map((usuario) => ({
          id: `usuario-${usuario.id_usuario ?? usuario.id}`,
          nombre: [usuario.nombres || usuario.nombre, usuario.apellidos].filter(Boolean).join(" "),
          tipo: "Docente",
          organizacion: usuario.especialidad || "Instituto",
          cargo: usuario.rol_nombre || usuario.rol || "Docente",
          correo: usuario.correo || usuario.email || "",
          telefono: usuario.telefono || "",
          fuenteSistema: true,
        })),
      ...[...estudiantesUnicos.values()].map((estudiante) => ({
        id: `estudiante-${estudiante.id_estudiante ?? estudiante.id}`,
        nombre: [estudiante.nombres || estudiante.nombre, estudiante.apellidos].filter(Boolean).join(" "),
        tipo: "Alumno",
        organizacion: estudiante.programa_estudios || estudiante.carrera || "",
        cargo: estudiante.semestre ? `Ciclo ${estudiante.semestre}` : "Estudiante",
        correo: estudiante.correo || estudiante.email || "",
        telefono: estudiante.telefono || "",
        foto_url: estudiante.foto_url,
        docenteAsignado: estudiante.docenteAsignado,
        asignado: estudiante.asignado,
        fuenteSistema: true,
      })),
      ...empresas.map((empresa) => ({
        id: `empresa-${empresa.id_empresa ?? empresa.id}`,
        nombre: empresa.supervisor_empresa_nombre || empresa.razon_social || "Entidad",
        tipo: "Entidad",
        organizacion: empresa.razon_social || "",
        cargo: empresa.supervisor_empresa_cargo || "Contacto de entidad",
        correo: empresa.correo_electronico || empresa.correo || "",
        telefono: empresa.telefono || "",
        fuenteSistema: true,
      })),
    ].filter((contacto) => contacto.id && contacto.nombre));

    if (manualesResult.status === "fulfilled") {
      const manuales = extraerLista(manualesResult.value.data?.data ?? manualesResult.value.data);
      setContactosManual(manuales);
      setDatosManualCargados(true);
    } else {
      fallas.push("contactos personales");
    }

    setErrorCarga(
      fallas.length
        ? `No se pudieron cargar: ${fallas.join(", ")}.`
        : ""
    );
    setCargando(false);
  }, [esAdmin]);

  useEffect(() => {
    void cargarContactos();
  }, [cargarContactos]);

  const guardarContactosManual = async (siguientes) => {
    setGuardando(true);
    setError("");
    try {
      await api.put("/apps/contactos", { datos: siguientes });
      invalidateApiCache("/apps/contactos");
      setContactosManual(siguientes);
      setDatosManualCargados(true);
      setModal(null);
      setSeleccionado(null);
      setConfirmando(false);
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "No se pudo guardar el contacto.");
    } finally {
      setGuardando(false);
    }
  };

  const contactos = [...contactosFuente, ...contactosManual];
  const visibles = contactos
    .filter((c) =>
      (filtro === "Todos" || c.tipo === filtro) &&
      (
        c.tipo !== "Alumno" ||
        !esAdmin ||
        filtroAsignacion === "todos" ||
        (filtroAsignacion === "asignados" && c.asignado === true) ||
        (filtroAsignacion === "sin-docente" && c.asignado === false)
      ) &&
      `${c.nombre} ${c.organizacion} ${c.correo} ${c.docenteAsignado || ""}`.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const sel = visibles.find((c) => c.id === seleccionado) ?? visibles[0];

  const guardar = () => {
    if (!modal.nombre.trim()) return setError("El nombre es obligatorio.");
    if (modal.correo && !/^\S+@\S+\.\S+$/.test(modal.correo)) return setError("El correo no es válido.");
    const nuevo = {
      ...modal,
      nombre: modal.nombre.trim(),
      id: `manual-${crypto.randomUUID()}`,
      fuenteSistema: false,
    };
    void guardarContactosManual([...contactosManual, nuevo]);
  };

  const eliminar = () => {
    if (!sel || sel.fuenteSistema) return;
    void guardarContactosManual(contactosManual.filter((contacto) => contacto.id !== sel.id));
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(sel.correo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch { /* sin permiso */ }
  };

  if (cargando) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Cargando contactos del sistema...</p>;
  }

  if (!datosManualCargados) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p role="alert" className="font-semibold text-red-600">{errorCarga || "No se pudo conectar con tus contactos."}</p>
        <button type="button" onClick={() => void cargarContactos()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-sm text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contactos</h1>
          <p className="mt-0.5 text-slate-500">
            {esAdmin
              ? "Directorio institucional con alumnos organizados por asignación docente."
              : "Directorio de tus alumnos asignados, docentes y entidades del sistema."}
          </p>
        </div>
        <button onClick={() => { setError(""); setModal({ nombre: "", tipo: "Docente", organizacion: "", cargo: "", correo: "", telefono: "" }); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          <Plus size={16} /> Nuevo contacto
        </button>
      </div>

      {errorCarga && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800">{errorCarga}</p>}

      <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="space-y-3 border-b border-slate-200 p-4">
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-400 focus-within:border-blue-500">
              <Search size={14} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, entidad o correo" className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400" />
            </div>
            <div className="flex gap-1.5">
              {["Todos", ...Object.keys(TIPOS)].map((t) => (
                <button key={t} onClick={() => setFiltro(t)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filtro === t ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{t}</button>
              ))}
            </div>
            {esAdmin && filtro === "Alumno" && (
              <div className="flex flex-wrap gap-1.5" aria-label="Filtrar alumnos por asignación">
                {[
                  ["todos", "Todos"],
                  ["asignados", "Con docente"],
                  ["sin-docente", "Sin docente"],
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltroAsignacion(valor)}
                    aria-pressed={filtroAsignacion === valor}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filtroAsignacion === valor
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {texto}
                  </button>
                ))}
              </div>
            )}
          </div>

          {visibles.length === 0 && <p className="px-5 py-10 text-center text-slate-500">No hay contactos que coincidan.</p>}
          <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
            {visibles.map((c) => (
              <li key={c.id}>
                <button onClick={() => { setSeleccionado(c.id); setConfirmando(false); }} className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${c.id === sel?.id ? "border-l-blue-600 bg-blue-50/50" : "border-l-transparent hover:bg-slate-50"}`}>
                  {c.tipo === "Alumno" ? (
                    <AvatarEstudiante
                      estudiante={c}
                      className="h-9 w-9 rounded-full text-[11px] font-semibold"
                      fallbackClassName="bg-slate-100 text-slate-600"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">{iniciales(c.nombre)}</span>
                  )}
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-semibold">{c.nombre}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {c.tipo === "Alumno" && esAdmin
                        ? `${c.cargo} · ${c.asignado === false ? "Sin docente" : c.docenteAsignado || "Asignación no disponible"}`
                        : c.cargo || c.organizacion}
                    </span>
                  </span>
                  <i className={`h-2 w-2 shrink-0 rounded-full ${TIPOS[c.tipo]}`} title={c.tipo} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">
          {sel ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-4">
                  {sel.tipo === "Alumno" ? (
                    <AvatarEstudiante
                      estudiante={sel}
                      className="h-14 w-14 rounded-full text-lg font-semibold"
                      fallbackClassName="bg-slate-100 text-slate-600"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">{iniciales(sel.nombre)}</span>
                  )}
                  <div className="leading-tight">
                    <h2 className="text-lg font-semibold">{sel.nombre}</h2>
                    <p className="text-slate-500">{sel.cargo || "Sin cargo registrado"}</p>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><i className={`h-2 w-2 rounded-full ${TIPOS[sel.tipo]}`} /> {sel.tipo}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sel.correo && <a href={`mailto:${sel.correo}`} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"><Mail size={15} /> Escribir</a>}
                  {sel.telefono && <a href={`tel:${sel.telefono.replace(/\s/g, "")}`} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"><Phone size={15} /> Llamar</a>}
                </div>
              </div>

              <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Correo electrónico</dt>
                  <dd className="mt-1 flex items-center gap-2 font-medium">
                    {sel.correo ? <>{sel.correo}
                      <button onClick={copiar} title="Copiar" className={copiado ? "text-emerald-600" : "text-slate-400 hover:text-blue-600"}>{copiado ? <Check size={14} /> : <Copy size={14} />}</button></> : <span className="font-normal text-slate-400">No registrado</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Teléfono</dt>
                  <dd className="mt-1 font-medium">{sel.telefono || <span className="font-normal text-slate-400">No registrado</span>}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">{sel.tipo === "Alumno" ? "Programa de estudios" : "Organización"}</dt>
                  <dd className="mt-1 flex items-center gap-2 font-medium"><Building2 size={15} className="text-slate-400" /> {sel.organizacion || <span className="font-normal text-slate-400">No registrada</span>}</dd>
                </div>
                {sel.tipo === "Alumno" && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Asignación docente</dt>
                    <dd className="mt-1 font-medium">
                      {esAdmin
                        ? sel.docenteAsignado || (sel.asignado === false ? "Sin docente asignado" : "No disponible")
                        : "Estudiante asignado a tu cuenta"}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="flex justify-end border-t border-slate-100 px-6 py-3 text-xs">
                {sel.fuenteSistema ? (
                  <span className="text-slate-400">Registro del sistema</span>
                ) : confirmando ? (
                  <span className="flex items-center gap-3">¿Eliminar este contacto?
                    <button onClick={eliminar} className="font-semibold text-red-600">Sí, eliminar</button>
                    <button onClick={() => setConfirmando(false)} className="font-medium text-slate-500">Cancelar</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmando(true)} className="flex items-center gap-1.5 font-medium text-slate-400 hover:text-red-600"><Trash2 size={14} /> Eliminar contacto</button>
                )}
              </div>
            </>
          ) : (
            <p className="px-6 py-20 text-center text-slate-500">Selecciona un contacto o crea uno nuevo.</p>
          )}
        </section>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold">Nuevo contacto</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="text-xs font-medium text-slate-500">Tipo</label>
                <div className="mt-1 flex gap-2">
                  {Object.keys(TIPOS).map((t) => (
                    <button key={t} type="button" onClick={() => setModal({ ...modal, tipo: t })} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${modal.tipo === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                      <i className={`h-2 w-2 rounded-full ${TIPOS[t]}`} /> {t}
                    </button>
                  ))}
                </div>
              </div>
              {[["nombre", "Nombre completo"], ["organizacion", "Organización o programa"], ["cargo", "Cargo"], ["correo", "Correo electrónico"], ["telefono", "Teléfono"]].map(([k, l]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-slate-500">{l}</label>
                  <input value={modal[k]} onChange={(e) => setModal({ ...modal, [k]: e.target.value })} className={entrada} />
                </div>
              ))}
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{guardando ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}