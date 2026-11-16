import { useState, useRef } from "react";
import { Folder, FileText, Search, Upload, FolderPlus, Trash2, ChevronRight } from "lucide-react";

const demo = () => [
  { id: 1, padre: null, tipo: "carpeta", nombre: "Bitácoras", fecha: "2026-11-05" },
  { id: 2, padre: null, tipo: "carpeta", nombre: "Informes", fecha: "2026-11-02" },
  { id: 3, padre: null, tipo: "carpeta", nombre: "Constancias", fecha: "2026-10-28" },
  { id: 4, padre: null, tipo: "carpeta", nombre: "Convenios", fecha: "2026-09-15" },
  { id: 5, padre: 1, tipo: "archivo", nombre: "bitacora-semana-8.pdf", tam: 421888, fecha: "2026-11-08" },
  { id: 6, padre: 1, tipo: "archivo", nombre: "bitacora-semana-5.pdf", tam: 398336, fecha: "2026-11-05" },
  { id: 7, padre: 2, tipo: "archivo", nombre: "informe-parcial.pdf", tam: 1258291, fecha: "2026-11-07" },
  { id: 8, padre: 3, tipo: "archivo", nombre: "constancia-vega-ramos.pdf", tam: 215040, fecha: "2026-10-28" },
  { id: 9, padre: 4, tipo: "archivo", nombre: "convenio-tech-solutions.docx", tam: 102400, fecha: "2026-09-15" },
  { id: 10, padre: null, tipo: "archivo", nombre: "plan-de-practicas-2026.xlsx", tam: 86016, fecha: "2026-09-01" },
];

const tamano = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fechaCorta = (k) => new Date(`${k}T00:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
const hoyClave = () => new Date().toISOString().slice(0, 10);

export default function FileManager() {
  const [items, setItems] = useState(demo);
  const [actual, setActual] = useState(null); // id de la carpeta abierta (null = inicio)
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const inputArchivos = useRef(null);

  // Ruta de carpetas hasta la actual, para las migas de pan
  const ruta = [];
  for (let id = actual; id; ) {
    const c = items.find((i) => i.id === id);
    if (!c) break;
    ruta.unshift(c);
    id = c.padre;
  }

  const buscando = busqueda.trim() !== "";
  const lista = (buscando
    ? items.filter((i) => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : items.filter((i) => i.padre === actual)
  ).sort((a, b) => (a.tipo === b.tipo ? a.nombre.localeCompare(b.nombre) : a.tipo === "carpeta" ? -1 : 1));

  const cuantos = (id) => items.filter((i) => i.padre === id).length;
  const nombreCarpeta = (id) => items.find((i) => i.id === id)?.nombre ?? "Inicio";

  const crearCarpeta = () => {
    if (!nombreNuevo.trim()) return;
    setItems((prev) => [...prev, { id: Date.now(), padre: actual, tipo: "carpeta", nombre: nombreNuevo.trim(), fecha: hoyClave() }]);
    setNombreNuevo("");
    setCreando(false);
  };

  // Aquí solo se registra el nombre y el tamaño. Subir el archivo de verdad requiere tu API.
  const subir = (e) => {
    const nuevos = [...e.target.files].map((f, i) => ({ id: Date.now() + i, padre: actual, tipo: "archivo", nombre: f.name, tam: f.size, fecha: hoyClave() }));
    setItems((prev) => [...prev, ...nuevos]);
    e.target.value = "";
  };

  const eliminar = (id) => {
    const quitar = new Set([id]);
    let crecio = true;
    while (crecio) {
      crecio = false;
      items.forEach((i) => { if (quitar.has(i.padre) && !quitar.has(i.id)) { quitar.add(i.id); crecio = true; } });
    }
    setItems((prev) => prev.filter((i) => !quitar.has(i.id)));
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-sm text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Archivos</h1>
          <p className="mt-0.5 text-slate-500">Documentos de las prácticas organizados por carpetas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex w-[220px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-400 focus-within:border-blue-500">
            <Search size={14} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar archivos" className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400" />
          </div>
          <button onClick={() => setCreando(true)} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
            <FolderPlus size={16} /> Nueva carpeta
          </button>
          <button onClick={() => inputArchivos.current.click()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <Upload size={16} /> Subir archivo
          </button>
          <input ref={inputArchivos} type="file" multiple hidden onChange={subir} />
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        {/* Migas de pan */}
        <nav className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-5 py-3 text-sm">
          <button onClick={() => { setActual(null); setBusqueda(""); }} className={`rounded px-1.5 py-0.5 ${actual === null ? "font-semibold" : "text-slate-500 hover:text-blue-600"}`}>Inicio</button>
          {ruta.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-300" />
              <button onClick={() => { setActual(c.id); setBusqueda(""); }} className={`rounded px-1.5 py-0.5 ${i === ruta.length - 1 ? "font-semibold" : "text-slate-500 hover:text-blue-600"}`}>{c.nombre}</button>
            </span>
          ))}
          {buscando && <span className="ml-2 text-xs text-slate-500">· Resultados de la búsqueda en todo el sistema</span>}
        </nav>

        {creando && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Folder size={18} className="text-blue-600" />
            <input autoFocus value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && crearCarpeta()} placeholder="Nombre de la carpeta" className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
            <button onClick={crearCarpeta} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Crear</button>
            <button onClick={() => { setCreando(false); setNombreNuevo(""); }} className="px-2 text-xs font-medium text-slate-500">Cancelar</button>
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="px-5 py-2.5 font-medium">Nombre</th>
              <th className="hidden py-2.5 font-medium sm:table-cell">Modificado</th>
              <th className="hidden py-2.5 font-medium sm:table-cell">Tamaño</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {lista.map((i) => (
              <tr key={i.id} className="group border-t border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <button
                    onClick={() => i.tipo === "carpeta" && (setActual(i.id), setBusqueda(""))}
                    className={`flex items-center gap-3 text-left ${i.tipo === "carpeta" ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {i.tipo === "carpeta" ? <Folder size={18} className="shrink-0 text-blue-600" /> : <FileText size={18} className="shrink-0 text-slate-400" />}
                    <span className="leading-tight">
                      <span className="block font-medium">{i.nombre}</span>
                      {buscando && <span className="block text-xs text-slate-500">en {nombreCarpeta(i.padre)}</span>}
                    </span>
                  </button>
                </td>
                <td className="hidden py-3 text-slate-500 sm:table-cell">{fechaCorta(i.fecha)}</td>
                <td className="hidden py-3 text-slate-500 sm:table-cell">{i.tipo === "carpeta" ? `${cuantos(i.id)} elementos` : tamano(i.tam)}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => eliminar(i.id)} title="Eliminar" className="text-slate-300 opacity-0 hover:text-red-600 group-hover:opacity-100"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500">{buscando ? "No se encontraron archivos." : "Esta carpeta está vacía."}</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}