import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Plus, X, Search, Pin, Archive, Trash2, LayoutGrid, List, Copy, RotateCcw, Check,
  ListChecks, FileText, ArchiveRestore, Undo2, StickyNote, LayoutTemplate, Image as ImagenIcono,
} from "lucide-react";
import api, { invalidateApiCache } from "../../../api/axios.js";

/* ───────────────────────── Categorías ─────────────────────────
   Cada categoría tiñe la tarjeta con un color suave. */
const CATS = {
  General:   { punto: "bg-slate-400",   claro: "bg-white border-slate-200",           oscuro: "bg-slate-900 border-gray-800" },
  Bitácora:  { punto: "bg-sky-500",     claro: "bg-sky-50 border-sky-200/70",         oscuro: "bg-sky-950/40 border-sky-900/60" },
  Prácticas: { punto: "bg-emerald-500", claro: "bg-emerald-50 border-emerald-200/70", oscuro: "bg-emerald-950/40 border-emerald-900/60" },
  Ideas:     { punto: "bg-amber-500",   claro: "bg-amber-50 border-amber-200/80",     oscuro: "bg-amber-950/30 border-amber-900/50" },
  Pendiente: { punto: "bg-rose-500",    claro: "bg-rose-50 border-rose-200/70",       oscuro: "bg-rose-950/30 border-rose-900/50" },
};

const VISTAS = [
  { v: "activa", t: "Notas" },
  { v: "archivada", t: "Archivadas" },
  { v: "papelera", t: "Papelera" },
];

/* ───────────────────────── Estilos según tema ───────────────────────── */
const tokens = (d) => ({
  panel: d ? "border-gray-800 bg-slate-900" : "border-slate-200 bg-white",
  borde: d ? "border-gray-800" : "border-slate-200",
  suave: d ? "text-slate-400" : "text-slate-500",
  cuerpo: d ? "text-gray-300" : "text-slate-600",
  pista: d ? "bg-slate-800" : "bg-slate-100",
  icono: d ? "text-slate-400 hover:bg-white/10 hover:text-slate-100" : "text-slate-500 hover:bg-black/5 hover:text-slate-800",
  botonSec: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50",
  chipOff: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-50",
  chipOn: d ? "border-sky-500 bg-sky-950/40 text-sky-300" : "border-sky-500 bg-sky-50 text-sky-700",
});

const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40";

/* ───────────────────────── Animaciones ─────────────────────────
   Se desactivan solas si la persona pidió "reducir movimiento" en su sistema. */
const ESTILOS = `
@keyframes nt-pop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes nt-fade{from{opacity:0}to{opacity:1}}
@keyframes nt-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes nt-open{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:none}}
@keyframes nt-toast{from{opacity:0;transform:translate(-50%,18px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes nt-check{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes nt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes nt-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.nt-pop{animation:nt-pop .26s cubic-bezier(.2,.8,.2,1) backwards}
.nt-fade{animation:nt-fade .2s ease-out backwards}
.nt-rise{animation:nt-rise .45s cubic-bezier(.2,.8,.2,1) backwards}
.nt-open{animation:nt-open .2s ease-out backwards}
.nt-toast{animation:nt-toast .3s cubic-bezier(.2,.8,.2,1) backwards}
.nt-check{animation:nt-check .3s ease-out}
.nt-float{animation:nt-float 3.2s ease-in-out infinite}
.nt-bar{transform-origin:left;animation:nt-bar 4.5s linear forwards}
.nt-sin-barra{scrollbar-width:none}
.nt-sin-barra::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.nt-pop,.nt-fade,.nt-rise,.nt-open,.nt-toast,.nt-check,.nt-float,.nt-bar{animation:none!important}}
`;

/* ───────────────────────── Utilidades ───────────────────────── */
const uid = () => `${Date.now()}${Math.floor(Math.random() * 10000)}`;

const fechaLarga = (iso) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resaltar = (texto, q) => {
  if (!q.trim() || !texto) return texto;
  const partes = texto.split(new RegExp(`(${escapar(q.trim())})`, "gi"));
  return partes.map((p, i) =>
    p.toLowerCase() === q.trim().toLowerCase()
      ? <mark key={i} className="rounded bg-sky-500/25 px-0.5 text-inherit">{p}</mark>
      : p,
  );
};

const escribiendo = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");

/* Reduce la imagen (máx. 900 px) para que quepa en el almacenamiento local */
const comprimir = (archivo) =>
  new Promise((ok, fallo) => {
    const lector = new FileReader();
    lector.onerror = fallo;
    lector.onload = () => {
      const img = new Image();
      img.onerror = fallo;
      img.onload = () => {
        const k = Math.min(1, 900 / Math.max(img.width, img.height));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.width * k);
        lienzo.height = Math.round(img.height * k);
        lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
        ok(lienzo.toDataURL("image/jpeg", 0.78));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });

/* Pegar una imagen con Ctrl+V dentro del compositor o del editor */
const alPegar = (e, fn) => {
  const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/"));
  if (!f) return;
  e.preventDefault();
  comprimir(f).then(fn).catch(() => {});
};

const vacia = (extra = {}) => ({
  id: null, titulo: "", tipo: "texto", contenido: "", items: [], imagen: "",
  categoria: "General", fijada: false, estado: "activa", ...extra,
});

/* ───────────────────────── Piezas pequeñas ───────────────────────── */
function Icono({ t, titulo, onClick, peligro, activo, children }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      onClick={onClick}
      className={`cursor-pointer rounded-full p-2 transition duration-150 active:scale-90 ${foco} ${activo ? "bg-sky-500/15 text-sky-600" : t.icono} ${peligro ? "hover:!text-red-500" : ""}`}
    >
      {children}
    </button>
  );
}

/* Botón que abre el selector de archivos y devuelve la imagen ya reducida */
function BotonImagen({ t, onElegir, onError }) {
  const ref = useRef(null);
  return (
    <>
      <Icono t={t} titulo="Agregar imagen" onClick={() => ref.current?.click()}><ImagenIcono size={17} /></Icono>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try { onElegir(await comprimir(f)); } catch { onError?.(); }
        }}
      />
    </>
  );
}

function Casilla({ marcada, onClick, disabled, d, tam = "h-4 w-4" }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      aria-label="Marcar tarea"
      disabled={disabled}
      onClick={onClick}
      className={`mt-px flex ${tam} shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${foco} disabled:cursor-default ${marcada ? "nt-check" : ""} ${
        marcada ? "border-sky-500 bg-sky-500 text-white" : d ? "border-gray-500 hover:border-sky-500" : "border-slate-400 hover:border-sky-500"
      }`}
    >
      {marcada && <Check size={10} strokeWidth={3.5} />}
    </button>
  );
}

/* Categorías como puntos de color: menos texto, igual de claro */
function Colores({ valor, onCambio, d }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Categoría">
      {Object.keys(CATS).map((k) => (
        <button
          key={k}
          type="button"
          title={k}
          aria-label={k}
          aria-pressed={valor === k}
          onClick={() => onCambio(k)}
          className={`h-5 w-5 cursor-pointer rounded-full ${CATS[k].punto} transition-transform hover:scale-110 ${foco} ${
            valor === k ? `ring-2 ring-offset-2 ring-sky-500 ${d ? "ring-offset-slate-900" : "ring-offset-white"}` : ""
          }`}
        />
      ))}
      <span className="ml-1 text-[11px] opacity-70">{valor}</span>
    </div>
  );
}

/* ───────────────────────── Tarjeta de nota ───────────────────────── */
function NotaCard({ n, d, t, q, compacta, acc, i = 0 }) {
  const c = CATS[n.categoria] || CATS.General;
  const total = n.items.length;
  const hechos = n.items.filter((x) => x.hecho).length;
  const enPapelera = n.estado === "papelera";
  const maxItems = compacta ? 5 : 6;
  const parar = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Abrir nota ${n.titulo || "sin título"}`}
      onClick={() => acc.abrir(n)}
      style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) acc.abrir(n); }}
      className={`nt-rise group relative mb-4 block break-inside-avoid overflow-hidden rounded-2xl border outline-none transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-sky-500/40 ${d ? c.oscuro : c.claro} ${
        enPapelera ? "opacity-70" : `cursor-pointer ${d ? "hover:shadow-lg hover:shadow-black/40" : "hover:shadow-lg hover:shadow-slate-300/60"}`
      }`}
    >
      {n.imagen && <img src={n.imagen} alt="" loading="lazy" className="nt-fade max-h-56 w-full object-cover" />}

      <div className="p-4 pb-3">
        {n.titulo && <h3 className="pr-6 text-[14px] font-bold leading-snug">{resaltar(n.titulo, q)}</h3>}

        {n.tipo === "texto" ? (
          n.contenido && (
            <p className={`whitespace-pre-line text-[12px] leading-relaxed ${t.cuerpo} ${n.titulo ? "mt-1.5" : "pr-6"} ${compacta ? "line-clamp-3" : "line-clamp-6"}`}>
              {resaltar(n.contenido, q)}
            </p>
          )
        ) : (
          <ul className={`space-y-1.5 ${n.titulo ? "mt-2.5" : "pr-6"}`}>
            {n.items.slice(0, maxItems).map((it) => (
              <li key={it.id} className="flex items-start gap-2">
                <Casilla d={d} tam="h-3.5 w-3.5" marcada={it.hecho} disabled={enPapelera} onClick={parar(() => acc.alternarItem(n, it.id))} />
                <span className={`text-[12px] leading-snug ${it.hecho ? `line-through ${t.suave}` : ""}`}>{resaltar(it.texto, q)}</span>
              </li>
            ))}
            {total > maxItems && <li className={`pl-[22px] text-[11px] ${t.suave}`}>y {total - maxItems} más</li>}
          </ul>
        )}

        {/* Pie mínimo: categoría y avance, solo si hay algo útil que decir */}
        {(n.categoria !== "General" || total > 0) && (
          <div className={`mt-3 flex items-center gap-2 text-[11px] ${t.suave}`}>
            {n.categoria !== "General" && (
              <span className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${c.punto}`} />{n.categoria}</span>
            )}
            {total > 0 && (
              <span className="ml-auto flex items-center gap-1.5 tabular-nums">
                <span className="h-1 w-12 overflow-hidden rounded-full bg-black/10">
                  <i className={`block h-full rounded-full transition-all duration-500 ${hechos === total ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${(hechos / total) * 100}%` }} />
                </span>
                {hechos}/{total}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pin siempre en la misma esquina */}
      {n.estado === "activa" && (
        <button
          type="button"
          onClick={parar(() => acc.fijar(n))}
          title={n.fijada ? "Quitar de fijadas" : "Fijar arriba"}
          aria-label={n.fijada ? "Quitar de fijadas" : "Fijar arriba"}
          className={`absolute right-2 top-2 cursor-pointer rounded-full p-1.5 transition-opacity ${foco} ${n.imagen ? "bg-white/90 text-slate-700 shadow" : t.icono} ${
            n.fijada ? "!text-sky-500 opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          }`}
        >
          <Pin size={14} className={n.fijada ? "fill-current" : ""} />
        </button>
      )}

      {/* Acciones: flotan sobre la tarjeta al pasar el cursor, así no mueven nada */}
      <div className={`absolute inset-x-0 bottom-0 flex justify-end gap-0.5 px-2 pb-1.5 pt-6 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
        n.estado === "activa" ? "max-sm:hidden" : "max-sm:opacity-100"
      } bg-gradient-to-t ${d ? "from-slate-900/90" : "from-white/95"} to-transparent`}>
        {enPapelera ? (
          <>
            <Icono t={t} titulo="Restaurar" onClick={parar(() => acc.mover(n, "activa", "Nota restaurada"))}><RotateCcw size={14} /></Icono>
            <Icono t={t} titulo="Eliminar para siempre" peligro onClick={parar(() => acc.eliminarDefinitivo(n))}><X size={14} /></Icono>
          </>
        ) : (
          <>
            <Icono t={t} titulo="Duplicar" onClick={parar(() => acc.duplicar(n))}><Copy size={14} /></Icono>
            {n.estado === "activa" ? (
              <Icono t={t} titulo="Archivar" onClick={parar(() => acc.mover(n, "archivada", "Nota archivada"))}><Archive size={14} /></Icono>
            ) : (
              <Icono t={t} titulo="Desarchivar" onClick={parar(() => acc.mover(n, "activa", "Nota desarchivada"))}><ArchiveRestore size={14} /></Icono>
            )}
            <Icono t={t} titulo="Mover a la papelera" peligro onClick={parar(() => acc.mover(n, "papelera", "Nota movida a la papelera"))}><Trash2 size={14} /></Icono>
          </>
        )}
      </div>
    </article>
  );
}

function Grupo({ titulo, lista, cuadricula, ...resto }) {
  if (!lista.length) return null;
  return (
    <section>
      {titulo && <h2 className={`mb-3 px-1 text-[12px] font-semibold ${resto.t.suave}`}>{titulo}</h2>}
      <div className={cuadricula ? "columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4" : "mx-auto max-w-2xl"}>
        {lista.map((n, i) => <NotaCard key={n.id} n={n} i={i} compacta={!cuadricula} {...resto} />)}
      </div>
    </section>
  );
}

/* ───────────────────────── Compositor rápido ─────────────────────────
   Una barra que se expande al hacer clic. Se guarda al hacer clic fuera. */
function Compositor({ d, t, categoriaInicial, onGuardar, onLista, onPlantillas, avisar }) {
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState("");
  const [cat, setCat] = useState(categoriaInicial);
  const raiz = useRef(null);
  const areaRef = useRef(null);

  useEffect(() => { if (!abierto) setCat(categoriaInicial); }, [categoriaInicial, abierto]);

  const cerrar = (guardar) => {
    if (guardar && (titulo.trim() || texto.trim() || imagen)) {
      onGuardar({ titulo: titulo.trim(), contenido: texto.trim(), categoria: cat, imagen });
    }
    setTitulo(""); setTexto(""); setImagen(""); setAbierto(false);
  };

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (raiz.current && !raiz.current.contains(e.target)) cerrar(true); };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  });

  useEffect(() => { if (abierto) areaRef.current?.focus(); }, [abierto]);

  const teclas = (e) => {
    if (e.key === "Escape") { e.preventDefault(); cerrar(false); }
    else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); cerrar(true); }
  };

  const elegirImagen = (src) => { setImagen(src); setAbierto(true); };

  return (
    <div
      ref={raiz}
      onKeyDown={abierto ? teclas : undefined}
      onPaste={(e) => alPegar(e, elegirImagen)}
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-2xl border transition-shadow ${abierto ? "shadow-xl" : "shadow-sm"} ${t.panel}`}
    >
      {!abierto ? (
        <div className="flex items-center gap-0.5 p-1.5">
          <button type="button" onClick={() => setAbierto(true)} className={`flex-1 cursor-text rounded-xl px-3.5 py-2.5 text-left text-[13px] ${t.suave} ${foco}`}>
            Escribe una nota…
          </button>
          <Icono t={t} titulo="Nueva lista de tareas" onClick={onLista}><ListChecks size={17} /></Icono>
          <BotonImagen t={t} onElegir={elegirImagen} onError={() => avisar("No se pudo cargar la imagen")} />
        </div>
      ) : (
        <div className="nt-open">
          {imagen && (
            <div className="relative">
              <img src={imagen} alt="" className="nt-fade max-h-52 w-full object-cover" />
              <button type="button" onClick={() => setImagen("")} aria-label="Quitar imagen" className="absolute right-2 top-2 cursor-pointer rounded-full bg-black/55 p-1.5 text-white hover:bg-black/75"><X size={14} /></button>
            </div>
          )}
          <div className="p-3">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título"
              aria-label="Título de la nota"
              className="w-full bg-transparent px-1 pb-1 text-sm font-bold outline-none placeholder:text-slate-400"
            />
            <textarea
              ref={areaRef}
              rows={2}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 240)}px`; }}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe una nota…"
              aria-label="Contenido de la nota"
              className="w-full resize-none bg-transparent px-1 text-[13px] leading-relaxed outline-none placeholder:text-slate-400"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Colores valor={cat} onCambio={setCat} d={d} />
                <BotonImagen t={t} onElegir={setImagen} onError={() => avisar("No se pudo cargar la imagen")} />
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => cerrar(false)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium ${foco} ${t.suave} hover:text-sky-500`}>Cerrar</button>
                <button type="button" onClick={() => cerrar(true)} className={`cursor-pointer rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600 ${foco}`}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Editor ───────────────────────── */
function Editor({ inicial, d, t, onGuardar, onCerrar, onEliminar, onArchivar, avisar }) {
  const [m, setM] = useState(inicial);
  const [error, setError] = useState("");
  const [descartar, setDescartar] = useState(false);
  const [enfocar, setEnfocar] = useState(null);
  const raiz = useRef(null);

  const sucio = JSON.stringify(m) !== JSON.stringify(inicial);
  const c = CATS[m.categoria] || CATS.General;

  useEffect(() => {
    if (!enfocar) return;
    raiz.current?.querySelector(`[data-item="${enfocar}"]`)?.focus();
    setEnfocar(null);
  }, [enfocar]);

  const intentarCerrar = () => {
    if (sucio && !descartar) return setDescartar(true);
    onCerrar();
  };

  const guardar = () => {
    const items = m.tipo === "lista" ? m.items.filter((i) => i.texto.trim()) : [];
    const sinContenido = m.tipo === "texto" ? !m.contenido.trim() : items.length === 0;
    if (!m.titulo.trim() && sinContenido && !m.imagen) return setError("Escribe un título, algo de contenido o agrega una imagen.");
    onGuardar({ ...m, titulo: m.titulo.trim(), items });
  };

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") { e.preventDefault(); intentarCerrar(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); guardar(); }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  const cambiarTipo = () => {
    if (m.tipo === "texto") {
      const lineas = m.contenido.split("\n").map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
      const items = lineas.length ? lineas.map((x) => ({ id: uid(), texto: x, hecho: false })) : [{ id: uid(), texto: "", hecho: false }];
      setM({ ...m, tipo: "lista", items, contenido: "" });
    } else {
      setM({ ...m, tipo: "texto", contenido: m.items.filter((i) => i.texto.trim()).map((i) => i.texto).join("\n"), items: [] });
    }
  };

  const editarItem = (id, texto) => setM({ ...m, items: m.items.map((i) => (i.id === id ? { ...i, texto } : i)) });
  const marcarItem = (id) => setM({ ...m, items: m.items.map((i) => (i.id === id ? { ...i, hecho: !i.hecho } : i)) });

  const agregarItem = (despuesDe) => {
    const nuevo = { id: uid(), texto: "", hecho: false };
    const items = [...m.items];
    const pos = despuesDe ? items.findIndex((i) => i.id === despuesDe) + 1 : items.length;
    items.splice(pos, 0, nuevo);
    setM({ ...m, items });
    setEnfocar(nuevo.id);
  };

  const quitarItem = (id) => {
    const idx = m.items.findIndex((i) => i.id === id);
    const items = m.items.filter((i) => i.id !== id);
    setM({ ...m, items });
    if (items.length) setEnfocar(items[Math.max(0, idx - 1)].id);
  };

  return (
    <div
      className="nt-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) intentarCerrar(); }}
    >
      <div
        ref={raiz}
        role="dialog"
        aria-modal="true"
        aria-label={inicial.id ? "Editar nota" : "Nueva nota"}
        onPaste={(e) => alPegar(e, (src) => setM((p) => ({ ...p, imagen: src })))}
        className={`nt-pop flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${d ? `${c.oscuro} text-gray-200` : `${c.claro} text-gray-800`}`}
      >
        {m.imagen && (
          <div className="relative shrink-0">
            <img src={m.imagen} alt="" className="nt-fade max-h-64 w-full object-cover" />
            <button type="button" onClick={() => setM({ ...m, imagen: "" })} aria-label="Quitar imagen" className="absolute right-3 top-3 cursor-pointer rounded-full bg-black/55 p-1.5 text-white hover:bg-black/75"><X size={14} /></button>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-2 pt-4">
          <div className="flex items-start gap-2">
            <input
              autoFocus
              aria-label="Título"
              value={m.titulo}
              onChange={(e) => { setM({ ...m, titulo: e.target.value }); setError(""); }}
              className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-slate-400"
              placeholder="Título"
            />
            <Icono t={t} titulo={m.fijada ? "Quitar de fijadas" : "Fijar arriba"} activo={m.fijada} onClick={() => setM({ ...m, fijada: !m.fijada })}>
              <Pin size={16} className={m.fijada ? "fill-current" : ""} />
            </Icono>
            <Icono t={t} titulo="Cerrar" onClick={intentarCerrar}><X size={16} /></Icono>
          </div>

          {m.tipo === "texto" ? (
            <textarea
              rows={m.imagen ? 5 : 9}
              value={m.contenido}
              onChange={(e) => { setM({ ...m, contenido: e.target.value }); setError(""); }}
              className="w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-slate-400"
              placeholder="Escribe tu nota…"
              aria-label="Contenido"
            />
          ) : (
            <div>
              {m.items.map((it) => (
                <div key={it.id} className="nt-open group/item flex items-center gap-2.5 py-1">
                  <Casilla d={d} marcada={it.hecho} onClick={() => marcarItem(it.id)} />
                  <input
                    data-item={it.id}
                    value={it.texto}
                    onChange={(e) => { editarItem(it.id, e.target.value); setError(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !(e.ctrlKey || e.metaKey)) { e.preventDefault(); if (it.texto.trim()) agregarItem(it.id); }
                      else if (e.key === "Backspace" && !it.texto) { e.preventDefault(); quitarItem(it.id); }
                    }}
                    placeholder="Tarea"
                    aria-label="Tarea"
                    className={`min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400 ${it.hecho ? `line-through ${t.suave}` : ""}`}
                  />
                  <button type="button" onClick={() => quitarItem(it.id)} aria-label="Quitar tarea" className={`cursor-pointer ${t.suave} opacity-0 transition-opacity hover:text-red-500 focus-visible:opacity-100 group-hover/item:opacity-100`}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => agregarItem(null)} className={`mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-sky-600 hover:text-sky-500 ${foco}`}>
                <Plus size={14} /> Agregar tarea
              </button>
            </div>
          )}

          {error && <p role="alert" className="text-xs font-medium text-red-500">{error}</p>}
          {descartar && (
            <p role="alert" className={`nt-rise rounded-lg px-3 py-2 text-xs font-medium ${d ? "bg-amber-950/60 text-amber-300" : "bg-amber-100 text-amber-800"}`}>
              Tienes cambios sin guardar. Pulsa Esc otra vez para descartarlos o guarda la nota.
            </p>
          )}
        </div>

        <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 ${d ? "border-white/10" : "border-black/5"}`}>
          <div className="flex items-center gap-0.5">
            <BotonImagen t={t} onElegir={(src) => setM({ ...m, imagen: src })} onError={() => avisar("No se pudo cargar la imagen")} />
            <Icono t={t} titulo={m.tipo === "texto" ? "Convertir en lista de tareas" : "Convertir en texto"} onClick={cambiarTipo}>
              {m.tipo === "texto" ? <ListChecks size={17} /> : <FileText size={17} />}
            </Icono>
            {inicial.id && (
              <>
                <Icono t={t} titulo="Archivar" onClick={onArchivar}><Archive size={17} /></Icono>
                <Icono t={t} titulo="Mover a la papelera" peligro onClick={onEliminar}><Trash2 size={17} /></Icono>
              </>
            )}
            <span className="ml-2"><Colores valor={m.categoria} onCambio={(k) => setM({ ...m, categoria: k })} d={d} /></span>
          </div>
          <div className="flex items-center gap-3">
            {inicial.id && <span className={`hidden text-[11px] sm:inline ${t.suave}`}>Creada el {fechaLarga(inicial.creada)}</span>}
            <button type="button" onClick={guardar} className={`cursor-pointer rounded-full bg-sky-500 px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-600 ${foco}`}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Plantillas ─────────────────────────
   Cada plantilla crea una nota ya estructurada. Puedes agregar las tuyas aquí. */
const lineas = (...l) => l.join("\n");
const tareas = (...l) => l.map((texto) => ({ id: uid(), texto, hecho: false }));

const PLANTILLAS = [
  {
    id: "bitacora", nombre: "Bitácora diaria", desc: "Lo que hiciste cada día de prácticas.",
    grupo: "Prácticas", categoria: "Bitácora", forma: "tabla",
    banda: "bg-emerald-500 text-white", suave: "bg-emerald-100", relleno: "bg-emerald-500",
    crear: () => ({
      titulo: "Bitácora del día", tipo: "texto", items: [],
      contenido: lineas("Fecha:", "Horas trabajadas:", "", "Actividades realizadas", "- ", "- ", "", "Dificultades", "- ", "", "Aprendizajes", "- ", "", "Para mañana", "- "),
    }),
  },
  {
    id: "reunion", nombre: "Reunión con asesor", desc: "Temas para tratar con tu asesor.",
    grupo: "Reuniones", categoria: "Prácticas", forma: "lista",
    banda: "bg-sky-500 text-white", suave: "bg-sky-100", relleno: "bg-sky-500",
    crear: () => ({
      titulo: "Reunión con asesor", tipo: "lista", contenido: "",
      items: tareas("Presentar avance de horas", "Consultar dudas del informe", "Revisar documentos pendientes", "Acordar fecha de la próxima reunión"),
    }),
  },
  {
    id: "cornell", nombre: "Notas Cornell", desc: "Palabras clave, notas y resumen.",
    grupo: "Estudio", categoria: "General", forma: "cornell",
    banda: "bg-amber-400 text-amber-950", suave: "bg-amber-100", relleno: "bg-amber-400",
    crear: () => ({
      titulo: "Notas Cornell", tipo: "texto", items: [],
      contenido: lineas("Tema:", "Fecha:", "", "Palabras clave y preguntas", "- ", "- ", "", "Notas", "", "", "Resumen", "En una o dos frases:"),
    }),
  },
  {
    id: "informe", nombre: "Informe semanal", desc: "Avances, horas y siguientes pasos.",
    grupo: "Prácticas", categoria: "Prácticas", forma: "tabla",
    banda: "bg-blue-600 text-white", suave: "bg-blue-100", relleno: "bg-blue-600",
    crear: () => ({
      titulo: "Informe de la semana", tipo: "texto", items: [],
      contenido: lineas("Semana del:        al:", "Horas acumuladas:", "", "Avances", "- ", "- ", "", "Problemas encontrados", "- ", "", "Siguiente semana", "- "),
    }),
  },
  {
    id: "documentos", nombre: "Documentos de prácticas", desc: "Todo lo que debes entregar.",
    grupo: "Prácticas", categoria: "Prácticas", forma: "lista",
    banda: "bg-violet-500 text-white", suave: "bg-violet-100", relleno: "bg-violet-500",
    crear: () => ({
      titulo: "Documentos por entregar", tipo: "lista", contenido: "",
      items: tareas("Ficha de datos del estudiante", "Carta de presentación firmada", "Plan de actividades", "Bitácoras completas", "Informe final", "Constancia de la entidad"),
    }),
  },
  {
    id: "pendientes", nombre: "Pendientes de la semana", desc: "Tareas de lunes a viernes.",
    grupo: "Planificación", categoria: "Pendiente", forma: "lista",
    banda: "bg-rose-500 text-white", suave: "bg-rose-100", relleno: "bg-rose-500",
    crear: () => ({
      titulo: "Pendientes de la semana", tipo: "lista", contenido: "",
      items: tareas("Lunes: ", "Martes: ", "Miércoles: ", "Jueves: ", "Viernes: "),
    }),
  },
  {
    id: "ideas", nombre: "Ideas del proyecto", desc: "Problema, idea, beneficio y siguiente paso.",
    grupo: "Planificación", categoria: "Ideas", forma: "texto",
    banda: "bg-orange-400 text-orange-950", suave: "bg-orange-100", relleno: "bg-orange-400",
    crear: () => ({
      titulo: "Idea para el proyecto", tipo: "texto", items: [],
      contenido: lineas("Problema que resuelve", "", "", "Idea", "", "", "Beneficio", "", "", "Siguiente paso", ""),
    }),
  },
  {
    id: "contacto", nombre: "Contacto en la entidad", desc: "Persona y área donde practicas.",
    grupo: "Reuniones", categoria: "General", forma: "tabla",
    banda: "bg-slate-700 text-white", suave: "bg-slate-200", relleno: "bg-slate-600",
    crear: () => ({
      titulo: "Contacto en la entidad", tipo: "texto", items: [],
      contenido: lineas("Nombre:", "Cargo y área:", "Correo:", "Teléfono:", "Horario de atención:", "", "Notas:"),
    }),
  },
];

const GRUPOS_PLANTILLA = ["Todas", "Prácticas", "Reuniones", "Estudio", "Planificación"];

const Linea = ({ w = "w-full", c = "bg-slate-200" }) => <i className={`block h-1 rounded-full ${w} ${c}`} />;

function Miniatura({ p }) {
  const anchos = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-4/5"];
  return (
    <div className="flex h-full flex-col bg-white text-slate-800">
      <div className={`px-3 py-2.5 ${p.banda}`}>
        <p className="text-[11px] font-extrabold leading-tight">{p.nombre}</p>
        <i className="mt-1.5 block h-1 w-2/3 rounded-full bg-current opacity-40" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden p-3">
        {p.forma === "tabla" && [0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-1.5"><span className={`h-3.5 w-1/3 rounded-sm ${p.suave}`} /><span className="h-3.5 flex-1 rounded-sm bg-slate-100" /></div>
        ))}
        {p.forma === "lista" && [0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${i < 2 ? `${p.relleno} border-transparent` : "border-slate-300"}`} />
            <Linea w={anchos[i]} c={i < 2 ? "bg-slate-300" : "bg-slate-200"} />
          </div>
        ))}
        {p.forma === "cornell" && (
          <>
            <span className={`block h-3.5 rounded-sm ${p.suave}`} />
            <div className="flex gap-2">
              <div className="w-1/3 space-y-1.5"><Linea /><Linea w="w-2/3" /><Linea /></div>
              <div className="flex-1 space-y-1.5 border-l border-slate-200 pl-2"><Linea /><Linea w="w-5/6" /><Linea /><Linea w="w-3/4" /></div>
            </div>
            <span className={`block h-3.5 rounded-sm ${p.suave}`} />
          </>
        )}
        {p.forma === "texto" && [0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5"><i className={`block h-1.5 w-1/3 rounded-full ${p.relleno}`} /><Linea /><Linea w="w-4/5" /></div>
        ))}
      </div>
    </div>
  );
}

function Galeria({ d, t, onElegir, onEnBlanco, onCerrar }) {
  const [grupo, setGrupo] = useState("Todas");

  useEffect(() => {
    const alTeclear = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const lista = PLANTILLAS.filter((p) => grupo === "Todas" || p.grupo === grupo);

  return (
    <div
      className="nt-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plantillas de notas"
        className={`nt-pop flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${d ? "border-gray-700 bg-slate-900 text-gray-200" : "border-gray-200 bg-white text-gray-800"}`}
      >
        <div className={`flex items-center justify-between gap-4 border-b px-6 py-4 ${t.borde}`}>
          <div>
            <h2 className="text-sm font-bold">Empieza con una plantilla</h2>
            <p className={`text-[11px] ${t.suave}`}>Podrás editarla antes de guardar.</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className={`cursor-pointer rounded-full p-2 transition-colors ${foco} ${t.icono}`}><X size={16} /></button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-6 pt-4">
          {GRUPOS_PLANTILLA.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={grupo === g}
              onClick={() => setGrupo(g)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${foco} ${grupo === g ? t.chipOn : t.chipOff}`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-3">
            {grupo === "Todas" && (
              <button type="button" onClick={onEnBlanco} className="group text-left outline-none">
                <div className={`grid h-44 place-items-center rounded-xl border-2 border-dashed transition-colors group-hover:border-sky-500 group-focus-visible:border-sky-500 ${d ? "border-gray-700" : "border-slate-300"}`}>
                  <span className="grid justify-items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/10 text-sky-500"><Plus size={18} /></span>
                    <span className={`text-[11px] ${t.suave}`}>Empezar desde cero</span>
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-bold">Nota en blanco</p>
              </button>
            )}
            {lista.map((p) => (
              <button key={p.id} type="button" onClick={() => onElegir(p)} className="group text-left outline-none">
                <div className={`relative h-44 overflow-hidden rounded-xl border bg-white transition-shadow group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-sky-500 ${d ? "border-gray-700" : "border-slate-200"}`}>
                  <Miniatura p={p} />
                  <span className="absolute inset-0 grid place-items-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/35 group-hover:opacity-100 group-focus-visible:bg-slate-900/35 group-focus-visible:opacity-100">
                    <span className="rounded-full bg-sky-500 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-lg">Usar plantilla</span>
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-bold">{p.nombre}</p>
                <p className={`text-[11px] ${t.suave}`}>{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Vista principal ───────────────────────── */
export default function Notas({ darkMode }) {
  const d = !!darkMode;
  const t = tokens(d);

  const [notas, setNotas] = useState([]);
  const [datosCargados, setDatosCargados] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState("");
  const [vista, setVista] = useState("activa");
  const [cat, setCat] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [cuadricula, setCuadricula] = useState(() => {
    try { return localStorage.getItem("notas_vista") !== "lista"; } catch { return true; }
  });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const [galeria, setGaleria] = useState(false);
  const buscador = useRef(null);
  const colaGuardado = useRef(Promise.resolve());

  const cargarNotas = useCallback(async () => {
    setCargando(true);
    setErrorConexion("");
    try {
      const { data } = await api.get("/apps/notas");
      setNotas(Array.isArray(data?.data) ? data.data : []);
      setDatosCargados(true);
    } catch (error) {
      setErrorConexion(
        error?.response?.data?.message || "No se pudieron cargar tus notas."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  /* ---------- Efectos ---------- */
  useEffect(() => {
    void cargarNotas();
  }, [cargarNotas]);

  useEffect(() => {
    if (!datosCargados) return undefined;
    const id = setTimeout(() => {
      colaGuardado.current = colaGuardado.current
        .catch(() => undefined)
        .then(() => api.put("/apps/notas", { datos: notas }))
        .then(() => {
          invalidateApiCache("/apps/notas");
          setErrorConexion("");
        })
        .catch((error) => {
          setErrorConexion(
            error?.response?.data?.message || "No se pudieron guardar tus notas."
          );
        });
    }, 500);
    return () => clearTimeout(id);
  }, [datosCargados, notas]);

  useEffect(() => {
    try { localStorage.setItem("notas_vista", cuadricula ? "grid" : "lista"); } catch { /* ignorar */ }
  }, [cuadricula]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!confirmarVaciar) return undefined;
    const id = setTimeout(() => setConfirmarVaciar(false), 4000);
    return () => clearTimeout(id);
  }, [confirmarVaciar]);

  useEffect(() => {
    const alTeclear = (e) => {
      if (modal || galeria || escribiendo() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); buscador.current?.focus(); }
      else if (e.key.toLowerCase() === "n") { e.preventDefault(); nueva(); }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  /* ---------- Derivados ---------- */
  const conteo = useMemo(() => ({
    archivada: notas.filter((n) => n.estado === "archivada").length,
    papelera: notas.filter((n) => n.estado === "papelera").length,
  }), [notas]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return notas
      .filter((n) => {
        if (n.estado !== vista) return false;
        if (cat !== "Todas" && n.categoria !== cat) return false;
        if (!q) return true;
        const cuerpo = n.tipo === "lista" ? n.items.map((i) => i.texto).join(" ") : n.contenido;
        return `${n.titulo} ${cuerpo}`.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.editada) - new Date(a.editada));
  }, [notas, vista, cat, busqueda]);

  const fijadas = vista === "activa" ? visibles.filter((n) => n.fijada) : [];
  const resto = vista === "activa" ? visibles.filter((n) => !n.fijada) : visibles;

  /* ---------- Acciones ---------- */
  const cambiar = (id, cambios) =>
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, ...cambios } : n)));

  const mover = (n, estado, mensaje) => {
    const anterior = { estado: n.estado, fijada: n.fijada };
    cambiar(n.id, { estado, fijada: estado === "activa" ? n.fijada : false });
    setToast({ texto: mensaje, deshacer: () => cambiar(n.id, anterior) });
  };

  const fijar = (n) => cambiar(n.id, { fijada: !n.fijada });

  const alternarItem = (n, itemId) =>
    cambiar(n.id, { items: n.items.map((i) => (i.id === itemId ? { ...i, hecho: !i.hecho } : i)) });

  const duplicar = (n) => {
    const ts = new Date().toISOString();
    const copia = {
      ...n, id: uid(), titulo: n.titulo ? `${n.titulo} (copia)` : "", fijada: false,
      items: n.items.map((i) => ({ ...i, id: uid() })), creada: ts, editada: ts,
    };
    setNotas((prev) => [copia, ...prev]);
    setToast({ texto: "Nota duplicada", deshacer: () => setNotas((p) => p.filter((x) => x.id !== copia.id)) });
  };

  const eliminarDefinitivo = (n) => {
    setNotas((prev) => prev.filter((x) => x.id !== n.id));
    setToast({ texto: "Nota eliminada para siempre", deshacer: null });
  };

  const vaciarPapelera = () => {
    if (!confirmarVaciar) return setConfirmarVaciar(true);
    setNotas((prev) => prev.filter((n) => n.estado !== "papelera"));
    setConfirmarVaciar(false);
    setToast({ texto: "Papelera vaciada", deshacer: null });
  };

  const categoriaActual = () => (cat !== "Todas" ? cat : "General");
  const nueva = () => setModal(vacia({ categoria: categoriaActual() }));
  const nuevaLista = () =>
    setModal(vacia({ categoria: categoriaActual(), tipo: "lista", items: [{ id: uid(), texto: "", hecho: false }] }));

  const usarPlantilla = (p) => {
    setGaleria(false);
    setModal(vacia({ ...p.crear(), categoria: p.categoria }));
  };
  const enBlanco = () => { setGaleria(false); nueva(); };

  const abrir = (n) => {
    if (n.estado === "papelera") return;
    setModal({ ...n, items: n.items.map((i) => ({ ...i })) });
  };

  const crearRapida = (datos) => {
    const ts = new Date().toISOString();
    const nota = { ...vacia(datos), id: uid(), creada: ts, editada: ts };
    setNotas((prev) => [nota, ...prev]);
    setToast({ texto: "Nota creada", deshacer: () => setNotas((p) => p.filter((x) => x.id !== nota.id)) });
  };

  const guardarNota = (datos) => {
    const ts = new Date().toISOString();
    if (datos.id) {
      setNotas((prev) => prev.map((n) => (n.id === datos.id ? { ...datos, editada: ts } : n)));
    } else {
      setNotas((prev) => [{ ...datos, id: uid(), creada: ts, editada: ts }, ...prev]);
    }
    setVista("activa");
    setModal(null);
    setToast({ texto: "Nota guardada", deshacer: null });
  };

  const desdeEditor = (estado, mensaje) => {
    const n = notas.find((x) => x.id === modal.id);
    setModal(null);
    if (n) mover(n, estado, mensaje);
  };

  const avisar = (texto) => setToast({ texto, deshacer: null });
  const acc = { abrir, fijar, alternarItem, duplicar, mover, eliminarDefinitivo };
  const hayFiltro = busqueda.trim() || cat !== "Todas";
  const limpiarFiltros = () => { setBusqueda(""); setCat("Todas"); };

  const vacio = {
    activa: hayFiltro
      ? { titulo: "Sin resultados", texto: "Ninguna nota coincide con tu búsqueda o filtro." }
      : { titulo: "Aún no tienes notas", texto: "Escribe en la barra de arriba o empieza con una plantilla." },
    archivada: { titulo: "No hay notas archivadas", texto: "Las notas que archives aparecerán aquí." },
    papelera: { titulo: "La papelera está vacía", texto: "Las notas eliminadas se guardan aquí hasta que las borres para siempre." },
  }[vista];

  if (cargando) {
    return (
      <div className={`grid min-h-64 place-items-center rounded-2xl border ${t.panel}`}>
        <p className={t.suave}>Cargando tus notas...</p>
      </div>
    );
  }

  if (!datosCargados) {
    return (
      <div className={`mx-auto max-w-xl rounded-2xl border p-6 text-center ${t.panel}`}>
        <p role="alert" className="font-semibold text-red-600">
          {errorConexion || "No se pudo conectar con tus notas."}
        </p>
        <button
          type="button"
          onClick={() => void cargarNotas()}
          className="mt-4 rounded-full bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`relative min-w-0 max-w-full space-y-5 overflow-x-hidden pb-24 text-xs ${d ? "text-gray-200" : "text-slate-900"}`}>
      <style>{ESTILOS}</style>
      {/* Barra superior: solo lo esencial */}
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-500"><StickyNote size={20} /></span>

        <div className="relative min-w-0 flex-1">
          <Search size={15} className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${t.suave}`} />
          <input
            ref={buscador}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en tus notas"
            aria-label="Buscar notas"
            className={`w-full rounded-full border py-2.5 pl-11 pr-10 text-[13px] outline-none transition-all focus:shadow-md focus:ring-2 focus:ring-sky-500/20 ${
              d ? "border-gray-800 bg-slate-800 placeholder:text-slate-500 focus:border-sky-500" : "border-transparent bg-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:bg-white"
            }`}
          />
          {!busqueda && <kbd className={`pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border px-1.5 text-[10px] sm:block ${t.borde} ${t.suave}`}>/</kbd>}
          {busqueda && (
            <button onClick={() => setBusqueda("")} className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 ${t.suave} hover:text-sky-500`} aria-label="Limpiar búsqueda"><X size={14} /></button>
          )}
        </div>

        <Icono t={t} titulo="Plantillas" onClick={() => setGaleria(true)}><LayoutTemplate size={18} /></Icono>
        <Icono t={t} titulo={cuadricula ? "Cambiar a vista en lista" : "Cambiar a vista en mosaico"} onClick={() => setCuadricula(!cuadricula)}>
          {cuadricula ? <List size={18} /> : <LayoutGrid size={18} />}
        </Icono>
      </header>

      {errorConexion && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700">
          {errorConexion}
        </p>
      )}

      {vista === "activa" && (
        <Compositor d={d} t={t} categoriaInicial={categoriaActual()} onGuardar={crearRapida} onLista={nuevaLista} onPlantillas={() => setGaleria(true)} avisar={avisar} />
      )}

      {/* Una sola fila: vistas a la izquierda, categorías a la derecha */}
      <nav aria-label="Filtros" className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div role="tablist" className={`relative grid shrink-0 grid-cols-3 rounded-full p-1 ${t.pista}`}>
          <span
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full shadow-sm transition-transform duration-300 ease-out ${d ? "bg-slate-950" : "bg-white"}`}
            style={{ transform: `translateX(${VISTAS.findIndex((x) => x.v === vista) * 100}%)` }}
          />
          {VISTAS.map(({ v, t: nombre }) => (
            <button
              key={v}
              role="tab"
              aria-selected={vista === v}
              onClick={() => { setVista(v); setConfirmarVaciar(false); }}
              className={`relative z-10 cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 font-medium transition-colors ${foco} ${
                vista === v ? (d ? "text-white" : "text-slate-900") : `${t.suave} hover:text-sky-500`
              }`}
            >
              {nombre}{v !== "activa" && conteo[v] > 0 && <span className="ml-1.5 opacity-60">{conteo[v]}</span>}
            </button>
          ))}
        </div>

        <div className="nt-sin-barra flex min-w-0 flex-1 basis-full items-center gap-1.5 overflow-x-auto py-1 sm:basis-0">
          {["Todas", ...Object.keys(CATS)].map((nombre) => (
            <button
              key={nombre}
              aria-pressed={cat === nombre}
              onClick={() => setCat(nombre)}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium transition duration-150 active:scale-95 ${foco} ${cat === nombre ? t.chipOn : t.chipOff}`}
            >
              {nombre !== "Todas" && <i className={`h-2 w-2 rounded-full ${CATS[nombre].punto}`} />}
              {nombre}
            </button>
          ))}
          {vista === "papelera" && conteo.papelera > 0 && (
            <button
              onClick={vaciarPapelera}
              className={`nt-open ml-auto shrink-0 cursor-pointer rounded-full border px-3 py-1.5 font-semibold transition-colors ${foco} ${
                confirmarVaciar ? "border-red-500 bg-red-500 text-white" : "border-red-500/40 text-red-500 hover:bg-red-500/10"
              }`}
            >
              {confirmarVaciar ? "Confirmar: vaciar todo" : "Vaciar papelera"}
            </button>
          )}
        </div>
      </nav>

      {/* Notas */}
      {visibles.length === 0 ? (
        <div className="nt-rise px-6 py-16 text-center">
          <span className="nt-float mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/10 text-sky-500"><StickyNote size={24} /></span>
          <p className="text-sm font-semibold">{vacio.titulo}</p>
          <p className={`mx-auto mt-1 max-w-sm ${t.suave}`}>{vacio.texto}</p>
          {hayFiltro && (
            <button onClick={limpiarFiltros} className={`mt-4 cursor-pointer rounded-full border px-4 py-2 font-medium transition-colors ${foco} ${t.botonSec}`}>Limpiar filtros</button>
          )}
          {vista === "activa" && !hayFiltro && (
            <button onClick={() => setGaleria(true)} className={`mt-4 cursor-pointer rounded-full border px-4 py-2 font-medium transition-colors ${foco} ${t.botonSec}`}>Ver plantillas</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {vista === "papelera" && <p className={`text-[11px] ${t.suave}`}>Restaura una nota para poder editarla.</p>}
          <Grupo titulo="Fijadas" lista={fijadas} cuadricula={cuadricula} d={d} t={t} q={busqueda} acc={acc} />
          <Grupo titulo={fijadas.length ? "Otras" : ""} lista={resto} cuadricula={cuadricula} d={d} t={t} q={busqueda} acc={acc} />
        </div>
      )}

      {/* Botón flotante solo en móvil, donde la barra de arriba queda lejos */}
      <button
        onClick={nueva}
        aria-label="Nueva nota"
        className={`nt-pop fixed bottom-6 right-6 z-40 grid h-14 w-14 cursor-pointer place-items-center rounded-2xl bg-sky-500 text-white shadow-xl shadow-sky-500/30 transition-transform active:scale-95 sm:hidden ${foco}`}
      >
        <Plus size={24} />
      </button>

      {toast && (
        <div key={toast.texto} role="status" className={`nt-toast fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 overflow-hidden rounded-xl border px-4 py-2.5 shadow-2xl ${d ? "border-gray-700 bg-slate-800 text-gray-100" : "border-slate-800 bg-slate-900 text-white"}`}>
          <span className="font-medium">{toast.texto}</span>
          {toast.deshacer && (
            <button onClick={() => { toast.deshacer(); setToast(null); }} className="flex cursor-pointer items-center gap-1 font-semibold text-sky-400 hover:text-sky-300">
              <Undo2 size={13} /> Deshacer
            </button>
          )}
          <i className="nt-bar absolute bottom-0 left-0 h-0.5 w-full bg-sky-400" />
        </div>
      )}

      {galeria && <Galeria d={d} t={t} onElegir={usarPlantilla} onEnBlanco={enBlanco} onCerrar={() => setGaleria(false)} />}

      {modal && (
        <Editor
          key={modal.id ?? "nueva"}
          inicial={modal}
          d={d}
          t={t}
          avisar={avisar}
          onGuardar={guardarNota}
          onCerrar={() => setModal(null)}
          onEliminar={() => desdeEditor("papelera", "Nota movida a la papelera")}
          onArchivar={() => desdeEditor("archivada", "Nota archivada")}
        />
      )}
    </div>
  );
}