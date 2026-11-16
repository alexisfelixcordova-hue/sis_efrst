import { useState, useEffect } from "react";
import { Plus, Search, Mail, Phone, Building2, Trash2, X, Copy, Check } from "lucide-react";

const TIPOS = {
  Docente: "bg-blue-600",
  Alumno: "bg-emerald-500",
  Entidad: "bg-amber-500",
};

const demo = () => [
  { id: 1, nombre: "Carmen Rosa Valdivia", tipo: "Docente", organizacion: "IESTP Cáceres Dorregaray", cargo: "Docente asesora EFSRT", correo: "carmen.valdivia@worldnic.edu.pe", telefono: "+51 984 512 340" },
  { id: 2, nombre: "Luis Quispe Mamani", tipo: "Docente", organizacion: "IESTP Cáceres Dorregaray", cargo: "Coordinador de prácticas", correo: "luis.quispe@iestpacd.edu.pe", telefono: "+51 976 137 483" },
  { id: 3, nombre: "Alexander Vega Ramos", tipo: "Alumno", organizacion: "Diseño y Programación Web", cargo: "Ciclo V", correo: "alexander.vega@gmail.com", telefono: "+51 912 345 678" },
  { id: 4, nombre: "Mariana Huamán Solís", tipo: "Alumno", organizacion: "Diseño y Programación Web", cargo: "Ciclo V", correo: "mariana.huaman@gmail.com", telefono: "+51 923 456 789" },
  { id: 5, nombre: "Rosa Cano Torres", tipo: "Entidad", organizacion: "Tech Solutions Perú", cargo: "Supervisora de prácticas", correo: "rcano@techsolutions.pe", telefono: "+51 064 201 500" },
  { id: 6, nombre: "Pedro León Ríos", tipo: "Entidad", organizacion: "DataCorp SAC", cargo: "Jefe de TI", correo: "pleon@datacorp.pe", telefono: "+51 064 233 910" },
];

const cargar = () => {
  try {
    const g = JSON.parse(localStorage.getItem("contactos_app"));
    if (Array.isArray(g)) return g;
  } catch { /* sin datos */ }
  return demo();
};

const iniciales = (n) => n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const entrada = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500";

export default function Contacts() {
  const [contactos, setContactos] = useState(cargar);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [seleccionado, setSeleccionado] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Se guarda en este navegador. Para compartir el directorio hará falta tu API.
  useEffect(() => {
    try { localStorage.setItem("contactos_app", JSON.stringify(contactos)); } catch { /* ignorar */ }
  }, [contactos]);

  const visibles = contactos
    .filter((c) => (filtro === "Todos" || c.tipo === filtro) && `${c.nombre} ${c.organizacion} ${c.correo}`.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const sel = visibles.find((c) => c.id === seleccionado) ?? visibles[0];

  const guardar = () => {
    if (!modal.nombre.trim()) return setError("El nombre es obligatorio.");
    if (modal.correo && !/^\S+@\S+\.\S+$/.test(modal.correo)) return setError("El correo no es válido.");
    const nuevo = { ...modal, nombre: modal.nombre.trim(), id: Date.now() };
    setContactos((prev) => [...prev, nuevo]);
    setSeleccionado(nuevo.id);
    setModal(null);
  };

  const eliminar = () => {
    setContactos((prev) => prev.filter((c) => c.id !== sel.id));
    setSeleccionado(null);
    setConfirmando(false);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(sel.correo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch { /* sin permiso */ }
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-sm text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contactos</h1>
          <p className="mt-0.5 text-slate-500">Directorio de docentes, alumnos y entidades de prácticas.</p>
        </div>
        <button onClick={() => { setError(""); setModal({ nombre: "", tipo: "Docente", organizacion: "", cargo: "", correo: "", telefono: "" }); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          <Plus size={16} /> Nuevo contacto
        </button>
      </div>

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
          </div>

          {visibles.length === 0 && <p className="px-5 py-10 text-center text-slate-500">No hay contactos que coincidan.</p>}
          <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
            {visibles.map((c) => (
              <li key={c.id}>
                <button onClick={() => { setSeleccionado(c.id); setConfirmando(false); }} className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${c.id === sel?.id ? "border-l-blue-600 bg-blue-50/50" : "border-l-transparent hover:bg-slate-50"}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">{iniciales(c.nombre)}</span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-semibold">{c.nombre}</span>
                    <span className="block truncate text-xs text-slate-500">{c.cargo || c.organizacion}</span>
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
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">{iniciales(sel.nombre)}</span>
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
              </dl>

              <div className="flex justify-end border-t border-slate-100 px-6 py-3 text-xs">
                {confirmando ? (
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
              <button onClick={guardar} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}