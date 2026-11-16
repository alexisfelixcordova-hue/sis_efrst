import { useState } from "react";
import { Search, Paperclip, Download } from "lucide-react";

/* ---------- Datos de ejemplo (luego vendrán de tu API) ---------- */
const datosIniciales = [
  { id: 1, alumno: "Alexander Vega Ramos", dni: "72918234", tipo: "Bitácora", titulo: "Semana 8 · Módulo de inventario", entidad: "Tech Solutions Perú", enviada: "08 Nov 2026", horas: 24, estado: "Pendiente",
    resumen: "Se implementó el módulo de entradas y salidas de almacén. Se realizaron pruebas con datos reales y se corrigieron errores de validación en el registro de productos.",
    archivo: { nombre: "bitacora-semana-8.pdf", peso: "412 KB" }, comentario: "", historial: [{ texto: "Enviada por el alumno", fecha: "08 Nov 2026" }] },
  { id: 2, alumno: "Mariana Huamán Solís", dni: "71819201", tipo: "Informe", titulo: "Informe parcial de prácticas", entidad: "Instituto Worldnic", enviada: "07 Nov 2026", horas: 120, estado: "Pendiente",
    resumen: "Informe con el avance del 50 % del plan de prácticas: análisis de requerimientos y diseño de la base de datos de matrícula.",
    archivo: { nombre: "informe-parcial.pdf", peso: "1.2 MB" }, comentario: "", historial: [{ texto: "Enviado por el alumno", fecha: "07 Nov 2026" }] },
  { id: 3, alumno: "Valeria Castillo Ríos", dni: "73948812", tipo: "Bitácora", titulo: "Semana 5 · Facturación electrónica", entidad: "Grupo Innova", enviada: "05 Nov 2026", horas: 18, estado: "Observada",
    resumen: "Integración inicial con el servicio de comprobantes electrónicos. Pendiente la documentación de las pruebas.",
    archivo: { nombre: "bitacora-semana-5.pdf", peso: "389 KB" }, comentario: "Faltan las evidencias de las pruebas y la firma del supervisor de la entidad.",
    historial: [{ texto: "Enviada por el alumno", fecha: "05 Nov 2026" }, { texto: "Observada por el docente", fecha: "06 Nov 2026" }] },
  { id: 4, alumno: "Carlos Eduardo Mendoza", dni: "70393837", tipo: "Bitácora", titulo: "Semana 10 · App de asistencia", entidad: "DataCorp SAC", enviada: "04 Nov 2026", horas: 30, estado: "Aprobada",
    resumen: "Se terminó el registro biométrico y se desplegó la versión de prueba en el entorno de la entidad.",
    archivo: { nombre: "bitacora-semana-10.pdf", peso: "520 KB" }, comentario: "",
    historial: [{ texto: "Enviada por el alumno", fecha: "04 Nov 2026" }, { texto: "Aprobada por el docente", fecha: "05 Nov 2026" }] },
  { id: 5, alumno: "Gianfranco Paredes Ruiz", dni: "76591290", tipo: "Plan", titulo: "Plan de auditoría de redes", entidad: "CyberNet SRL", enviada: "30 Oct 2026", horas: 0, estado: "Aprobada",
    resumen: "Plan de trabajo para la auditoría de la red interna y del perímetro de la entidad.",
    archivo: { nombre: "plan-auditoria.pdf", peso: "860 KB" }, comentario: "",
    historial: [{ texto: "Enviado por el alumno", fecha: "30 Oct 2026" }, { texto: "Aprobado por el docente", fecha: "31 Oct 2026" }] },
];

const estadoColor = {
  Pendiente: "text-amber-600",
  Observada: "text-red-600",
  Aprobada: "text-emerald-600",
};

const filtros = ["Todas", "Pendiente", "Observada", "Aprobada"];
const tipos = ["Todos los tipos", "Bitácora", "Informe", "Plan"];

const tarjeta = "rounded-2xl border border-slate-200 bg-white";
const iniciales = (n) => n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export default function Revisiones() {
  const [revisiones, setRevisiones] = useState(datosIniciales);
  const [filtro, setFiltro] = useState("Todas");
  const [tipo, setTipo] = useState("Todos los tipos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  const visibles = revisiones.filter(
    (r) =>
      (filtro === "Todas" || r.estado === filtro) &&
      (tipo === "Todos los tipos" || r.tipo === tipo) &&
      `${r.alumno} ${r.titulo}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Si no hay una elegida (o ya no está en la lista filtrada), se muestra la primera
  const sel = visibles.find((r) => r.id === seleccionada) ?? visibles[0];

  const contar = (estado) => revisiones.filter((r) => r.estado === estado).length;
  const resumen = [
    [contar("Pendiente"), "Pendientes de revisar"],
    [contar("Observada"), "Con observaciones"],
    [contar("Aprobada"), "Aprobadas"],
    [revisiones.length, "Total recibidas"],
  ];

  const elegir = (id) => {
    setSeleccionada(id);
    setComentario("");
    setError("");
  };

  // TODO: aquí llamarías a tu API (PUT /api/revisiones/{id}) y luego actualizas la lista
  const resolver = (estado) => {
    if (estado === "Observada" && !comentario.trim()) {
      setError("Escribe qué debe corregir el alumno.");
      return;
    }
    setRevisiones((prev) =>
      prev.map((r) =>
        r.id === sel.id
          ? {
              ...r,
              estado,
              comentario: estado === "Observada" ? comentario.trim() : "",
              historial: [...r.historial, { texto: `${estado === "Aprobada" ? "Aprobada" : "Observada"} por el docente`, fecha: "Hoy" }],
            }
          : r
      )
    );
    setComentario("");
    setError("");
  };

  const reabrir = () =>
    setRevisiones((prev) =>
      prev.map((r) =>
        r.id === sel.id ? { ...r, estado: "Pendiente", historial: [...r.historial, { texto: "Reabierta para revisión", fecha: "Hoy" }] } : r
      )
    );

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-sm text-slate-900">
      {/* Título */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Revisiones</h1>
        <p className="mt-0.5 text-slate-500">Bitácoras, informes y planes enviados por los alumnos para tu revisión.</p>
      </div>

      {/* Resumen */}
      <section className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        {resumen.map(([valor, etiqueta]) => (
          <div key={etiqueta} className="bg-white px-5 py-4">
            <p className="text-2xl font-semibold leading-tight">{valor}</p>
            <p className="text-xs text-slate-500">{etiqueta}</p>
          </div>
        ))}
      </section>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {filtros.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filtro === f ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f === "Pendiente" ? "Pendientes" : f === "Observada" ? "Observadas" : f === "Aprobada" ? "Aprobadas" : f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
          >
            {tipos.map((t) => <option key={t}>{t}</option>)}
          </select>
          <div className="flex w-[220px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-400 focus-within:border-blue-500">
            <Search size={14} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar alumno o título"
              className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
        {/* Lista */}
        <section className={`${tarjeta} overflow-hidden`}>
          {visibles.length === 0 && <p className="px-5 py-10 text-center text-slate-500">No hay revisiones con esos filtros.</p>}
          <ul className="divide-y divide-slate-100">
            {visibles.map((r) => {
              const activa = r.id === sel?.id;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => elegir(r.id)}
                    className={`flex w-full gap-3 border-l-2 px-4 py-3.5 text-left transition-colors ${
                      activa ? "border-l-blue-600 bg-blue-50/50" : "border-l-transparent hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                      {iniciales(r.alumno)}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{r.alumno}</span>
                        <span className="shrink-0 text-[11px] text-slate-400">{r.enviada}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-slate-600">{r.tipo} · {r.titulo}</span>
                      <span className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${estadoColor[r.estado]}`}>
                        <i className="h-1.5 w-1.5 rounded-full bg-current" /> {r.estado}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Detalle */}
        {sel && (
          <section className={`${tarjeta} min-w-0`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{sel.tipo}</p>
                <h2 className="text-base font-semibold">{sel.titulo}</h2>
                <p className="text-slate-500">{sel.alumno} · DNI {sel.dni}</p>
              </div>
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${estadoColor[sel.estado]}`}>
                <i className="h-2 w-2 rounded-full bg-current" /> {sel.estado}
              </span>
            </div>

            <div className="space-y-6 px-6 py-5">
              <dl className="grid gap-4 sm:grid-cols-3">
                {[["Entidad", sel.entidad], ["Fecha de envío", sel.enviada], ["Horas reportadas", sel.horas ? `${sel.horas} h` : "—"]].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className="mt-1 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumen de actividades</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{sel.resumen}</p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <Paperclip size={16} className="shrink-0 text-slate-400" />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-medium">{sel.archivo.nombre}</span>
                    <span className="text-xs text-slate-500">{sel.archivo.peso}</span>
                  </span>
                </span>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  <Download size={14} /> Descargar
                </button>
              </div>

              {/* Revisión */}
              {sel.estado === "Pendiente" ? (
                <div>
                  <label htmlFor="comentario" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Comentario para el alumno
                  </label>
                  <textarea
                    id="comentario"
                    rows={3}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Obligatorio si vas a observar la entrega"
                    className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-blue-500"
                  />
                  {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={() => resolver("Observada")} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
                      Observar
                    </button>
                    <button onClick={() => resolver("Aprobada")} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                      Aprobar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{sel.estado === "Aprobada" ? "Esta entrega fue aprobada." : "Esta entrega tiene observaciones."}</p>
                    <button onClick={reabrir} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Reabrir</button>
                  </div>
                  {sel.comentario && <p className="mt-1.5 text-slate-600">“{sel.comentario}”</p>}
                </div>
              )}

              {/* Historial */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</h3>
                <ul className="mt-3 space-y-3 border-l border-slate-200 pl-4">
                  {sel.historial.map((h, i) => (
                    <li key={i} className="relative">
                      <i className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300" />
                      <p>{h.texto}</p>
                      <p className="text-xs text-slate-500">{h.fecha}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}