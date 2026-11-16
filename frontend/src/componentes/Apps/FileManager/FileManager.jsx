
import { useState, useRef, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  Upload,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
  Download,
  Eye,
  FileSpreadsheet,
  FileImage,
  File,
  FileCode,
  Calendar,
  HardDrive,
  MoreVertical,
  Home,
  Files,
  FileSearch,
  Check,
  AlertCircle,
  Grid2X2,
  List,
  ArrowUpDown,
  Pencil,
  Palette,
  Move,
  Music,
  Video,
  Archive,
  BookOpen,
  Briefcase,
  Star,
  RefreshCw,
  Info,
  Clock,
  FileVideo,
  FileAudio,
  Filter,
  ExternalLink
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { useDropzone } from "react-dropzone";
import { renderAsync } from "docx-preview";
import * as XLSX from "xlsx";

const COLORES = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#e11d48",
  "#64748b",
  "#db2777"
];

const ICONOS_CARPETA = {
  carpeta: Folder,
  trabajo: Briefcase,
  libros: BookOpen,
  archivo: Archive,
  estrella: Star
};

const demo = () => [
  { id: "1", padre: null, tipo: "carpeta", nombre: "Bitácoras", color: "#2563eb", icono: "carpeta", fecha: "2026-11-05" },
  { id: "2", padre: null, tipo: "carpeta", nombre: "Informes", color: "#7c3aed", icono: "libros", fecha: "2026-11-02" },
  { id: "3", padre: null, tipo: "carpeta", nombre: "Constancias", color: "#0891b2", icono: "archivo", fecha: "2026-10-28" },
  { id: "4", padre: null, tipo: "carpeta", nombre: "Convenios", color: "#059669", icono: "trabajo", fecha: "2026-09-15" },
  { id: "5", padre: "1", tipo: "archivo", nombre: "bitacora-semana-8.pdf", tam: 421888, fecha: "2026-11-08" },
  { id: "6", padre: "1", tipo: "archivo", nombre: "bitacora-semana-5.pdf", tam: 398336, fecha: "2026-11-05" },
  { id: "7", padre: "2", tipo: "archivo", nombre: "informe-parcial.pdf", tam: 1258291, fecha: "2026-11-07" },
  { id: "8", padre: "3", tipo: "archivo", nombre: "constancia-vega-ramos.pdf", tam: 215040, fecha: "2026-10-28" },
  { id: "9", padre: "4", tipo: "archivo", nombre: "convenio-tech-solutions.docx", tam: 102400, fecha: "2026-09-15" },
  { id: "10", padre: null, tipo: "archivo", nombre: "plan-de-practicas-2026.xlsx", tam: 86016, fecha: "2026-09-01" }
];

const extension = (nombre = "") =>
  nombre.split(".").pop().toLowerCase();

const tamano = (bytes = 0) => {
  if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
};

const fechaCorta = (fecha) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

const hoyClave = () => new Date().toISOString().slice(0, 10);

const obtenerIconoArchivo = (nombre) => {
  const ext = extension(nombre);

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext))
    return FileImage;

  if (["xlsx", "xls", "csv"].includes(ext))
    return FileSpreadsheet;

  if (["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext))
    return FileVideo;

  if (["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(ext))
    return FileAudio;

  if (["js", "jsx", "html", "css", "json", "xml"].includes(ext))
    return FileCode;

  if (["pdf", "doc", "docx", "txt", "md"].includes(ext))
    return FileText;

  if (["zip", "rar", "7z"].includes(ext))
    return Archive;

  return File;
};

const tipoArchivo = (nombre) => {
  const ext = extension(nombre);

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext))
    return "Imagen";

  if (["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext))
    return "Video";

  if (["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(ext))
    return "Audio";

  if (["pdf"].includes(ext))
    return "PDF";

  if (["doc", "docx"].includes(ext))
    return "Documento Word";

  if (["xlsx", "xls"].includes(ext))
    return "Documento Excel";

  if (["ppt", "pptx"].includes(ext))
    return "Presentación";

  if (["txt", "md", "csv", "json"].includes(ext))
    return "Texto";

  return "Archivo";
};

export default function FileManager() {
  const [items, setItems] = useState(demo);
  const [actual, setActual] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [orden, setOrden] = useState("nombre");
  const [vista, setVista] = useState("lista");

  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");

  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [urlArchivo, setUrlArchivo] = useState(null);

  const [detalles, setDetalles] = useState(null);
  const [menuId, setMenuId] = useState(null);

  const [editando, setEditando] = useState(null);
  const [nombreEdicion, setNombreEdicion] = useState("");

  const [personalizando, setPersonalizando] = useState(null);
  const [moviendo, setMoviendo] = useState(null);
  const [destino, setDestino] = useState("");

  const [hojasExcel, setHojasExcel] = useState([]);
  const [hojaActiva, setHojaActiva] = useState(0);
  const [contenidoTexto, setContenidoTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorVista, setErrorVista] = useState("");

  const [papelera, setPapelera] = useState([]);

  const [docxListo, setDocxListo] = useState(false);

  const inputRef = useRef(null);
  const docxRef = useRef(null);

  const ruta = [];

  for (let id = actual; id;) {
    const carpeta = items.find(
      (i) => i.id === id && i.tipo === "carpeta"
    );

    if (!carpeta) break;

    ruta.unshift(carpeta);
    id = carpeta.padre;
  }

  const buscando = busqueda.trim() !== "";

  const lista = items.filter((item) => {
    const coincideBusqueda = buscando
      ? item.nombre.toLowerCase().includes(busqueda.toLowerCase())
      : item.padre === actual;

    const coincideFiltro =
      filtro === "todos" ||
      (filtro === "carpetas" && item.tipo === "carpeta") ||
      (filtro === "archivos" && item.tipo === "archivo") ||
      (filtro === "pdf" && extension(item.nombre) === "pdf") ||
      (filtro === "imagenes" && tipoArchivo(item.nombre) === "Imagen") ||
      (filtro === "videos" && tipoArchivo(item.nombre) === "Video");

    return coincideBusqueda && coincideFiltro;
  }).sort((a, b) => {
    if (a.tipo !== b.tipo) {
      return a.tipo === "carpeta" ? -1 : 1;
    }

    if (orden === "fecha") {
      return b.fecha.localeCompare(a.fecha);
    }

    if (orden === "tamano") {
      return (b.tam || 0) - (a.tam || 0);
    }

    return a.nombre.localeCompare(b.nombre);
  });

  const cantidadCarpetas = items.filter(
    (i) => i.tipo === "carpeta"
  ).length;

  const cantidadArchivos = items.filter(
    (i) => i.tipo === "archivo"
  ).length;

  const cuantos = (id) =>
    items.filter((i) => i.padre === id).length;

  const nombreCarpeta = (id) =>
    items.find((i) => i.id === id)?.nombre || "Inicio";

  const carpetasDisponibles = items.filter(
    (i) => i.tipo === "carpeta" && i.id !== moviendo?.id
  );

  const subirArchivos = (archivos) => {
    if (!archivos?.length) return;

    const nuevos = archivos.map((archivo) => ({
      id: crypto.randomUUID(),
      padre: actual,
      tipo: "archivo",
      nombre: archivo.name,
      tam: archivo.size,
      fecha: hoyClave(),
      archivo
    }));

    setItems((prev) => [...prev, ...nuevos]);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: subirArchivos,
    noClick: true,
    noKeyboard: true
  });

  const crearCarpeta = () => {
    if (!nombreNuevo.trim()) return;

    const nueva = {
      id: crypto.randomUUID(),
      padre: actual,
      tipo: "carpeta",
      nombre: nombreNuevo.trim(),
      fecha: hoyClave(),
      color: "#2563eb",
      icono: "carpeta"
    };

    setItems((prev) => [...prev, nueva]);
    setNombreNuevo("");
    setCreando(false);
  };

  const cambiarColor = (id, color) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, color } : item
      )
    );
  };

  const cambiarIcono = (id, icono) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, icono } : item
      )
    );
  };

  const iniciarEdicion = (item) => {
    setEditando(item.id);
    setNombreEdicion(item.nombre);
    setMenuId(null);
  };

  const guardarEdicion = () => {
    if (!nombreEdicion.trim()) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === editando
          ? { ...item, nombre: nombreEdicion.trim() }
          : item
      )
    );

    setEditando(null);
    setNombreEdicion("");
  };

  const eliminar = (id) => {
    const quitar = new Set([id]);
    let cambio = true;

    while (cambio) {
      cambio = false;

      items.forEach((item) => {
        if (quitar.has(item.padre) && !quitar.has(item.id)) {
          quitar.add(item.id);
          cambio = true;
        }
      });
    }

    const eliminados = items.filter((item) => quitar.has(item.id));

    setPapelera((prev) => [
      ...prev,
      ...eliminados.map((item) => ({
        ...item,
        padreOriginal: item.padre
      }))
    ]);

    setItems((prev) => prev.filter((item) => !quitar.has(item.id)));

    if (archivoSeleccionado && quitar.has(archivoSeleccionado.id)) {
      setArchivoSeleccionado(null);
    }

    setDetalles(null);
    setPersonalizando(null);
    setMenuId(null);
  };

  const restaurar = (id) => {
    const recuperar = papelera.filter((item) => {
      let padre = item.padreOriginal;
      return item.id === id || padre === id;
    });

    const ids = new Set([id]);
    let cambio = true;

    while (cambio) {
      cambio = false;

      papelera.forEach((item) => {
        if (ids.has(item.padreOriginal) && !ids.has(item.id)) {
          ids.add(item.id);
          cambio = true;
        }
      });
    }

    const elementos = papelera.filter((item) => ids.has(item.id));

    const nuevos = elementos.map((item) => ({
      ...item,
      padre: item.padreOriginal ?? null
    }));

    setItems((prev) => [...prev, ...nuevos]);
    setPapelera((prev) => prev.filter((item) => !ids.has(item.id)));
  };

  const moverElemento = () => {
    if (!moviendo) return;

    if (moviendo.tipo === "carpeta") {
      let padre = destino;
      let esDescendiente = false;

      while (padre) {
        if (padre === moviendo.id) {
          esDescendiente = true;
          break;
        }

        padre = items.find((i) => i.id === padre)?.padre;
      }

      if (esDescendiente) return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === moviendo.id
          ? { ...item, padre: destino || null }
          : item
      )
    );

    setMoviendo(null);
    setDestino("");
  };

  const abrirElemento = (item) => {
    if (item.tipo === "carpeta") {
      setActual(item.id);
      setBusqueda("");
      setFiltro("todos");
      return;
    }

    setArchivoSeleccionado(item);
    setDetalles(null);
    setMenuId(null);
  };

  const descargar = () => {
    if (!urlArchivo || !archivoSeleccionado) return;

    const enlace = document.createElement("a");
    enlace.href = urlArchivo;
    enlace.download = archivoSeleccionado.nombre;
    enlace.click();
  };

  const descargarItem = (item) => {
    if (!item.archivo) return;

    const url = URL.createObjectURL(item.archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = item.nombre;
    enlace.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!archivoSeleccionado?.archivo) {
      setUrlArchivo(null);
      return;
    }

    const url = URL.createObjectURL(archivoSeleccionado.archivo);
    setUrlArchivo(url);

    return () => URL.revokeObjectURL(url);
  }, [archivoSeleccionado]);

  const extActual = archivoSeleccionado
    ? extension(archivoSeleccionado.nombre)
    : "";

  const imagen = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(extActual);
  const pdf = extActual === "pdf";
  const video = ["mp4", "webm", "mov", "m4v", "ogg"].includes(extActual);
  const audio = ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(extActual);
  const excel = ["xlsx", "xls"].includes(extActual);
  const word = extActual === "docx";
  const texto = ["txt", "csv", "json", "md", "xml", "html", "css", "js"].includes(extActual);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      if (!archivoSeleccionado?.archivo) return;

      setCargando(true);
      setErrorVista("");
      setContenidoTexto("");
      setHojasExcel([]);
      setHojaActiva(0);
      setDocxListo(false);

      try {
        const archivo = archivoSeleccionado.archivo;

        if (texto) {
          const contenido = await archivo.text();
          if (activo) setContenidoTexto(contenido);
        }

        if (excel) {
          const buffer = await archivo.arrayBuffer();
          const libro = XLSX.read(buffer, { type: "array" });

          const hojas = libro.SheetNames.map((nombre) => ({
            nombre,
            datos: XLSX.utils.sheet_to_json(
              libro.Sheets[nombre],
              { header: 1, defval: "" }
            )
          }));

          if (activo) setHojasExcel(hojas);
        }
      } catch {
        if (activo) {
          setErrorVista("No se pudo procesar el contenido del documento.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [archivoSeleccionado]);

  useEffect(() => {
    let activo = true;

    const cargarWord = async () => {
      if (!word || !archivoSeleccionado?.archivo || !docxRef.current) return;

      setCargando(true);
      setErrorVista("");

      try {
        docxRef.current.innerHTML = "";

        await renderAsync(
          archivoSeleccionado.archivo,
          docxRef.current,
          docxRef.current,
          {
            className: "docx",
            inWrapper: true,
            breakPages: true,
            ignoreWidth: false,
            ignoreHeight: false
          }
        );

        if (activo) setDocxListo(true);
      } catch {
        if (activo) {
          setErrorVista("No se pudo visualizar este documento Word.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarWord();

    return () => {
      activo = false;
    };
  }, [archivoSeleccionado, word]);

  const renderIconoCarpeta = (item, grande = false) => {
    const Icono = ICONOS_CARPETA[item.icono] || Folder;

    return (
      <Icono
        size={grande ? 28 : 21}
        style={{ color: item.color || "#2563eb" }}
        fill={item.icono === "carpeta" ? item.color || "#2563eb" : "none"}
        fillOpacity={0.13}
        strokeWidth={1.8}
      />
    );
  };

  const renderTarjeta = (item) => {
    const esCarpeta = item.tipo === "carpeta";
    const Icono = esCarpeta ? null : obtenerIconoArchivo(item.nombre);

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.18 }}
        className="group relative rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5"
      >
        <div className="flex items-start justify-between">
          <button
            onClick={() => abrirElemento(item)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                esCarpeta ? "bg-slate-50" : "bg-blue-50"
              }`}
            >
              {esCarpeta
                ? renderIconoCarpeta(item, true)
                : <Icono size={25} className="text-blue-600" />}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-700">
                {item.nombre}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {esCarpeta ? `${cuantos(item.id)} elementos` : tamano(item.tam)}
              </p>
            </div>
          </button>

          <button
            onClick={() => setMenuId(menuId === item.id ? null : item.id)}
            className="rounded-lg p-1.5 text-slate-400 opacity-100 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreVertical size={17} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-400">
            {fechaCorta(item.fecha)}
          </span>

          {esCarpeta ? (
            <button
              onClick={() => setPersonalizando(item)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-blue-600"
            >
              <Palette size={13} />
              Personalizar
            </button>
          ) : (
            <button
              onClick={() => abrirElemento(item)}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              <Eye size={13} />
              Ver
            </button>
          )}
        </div>

        {menuId === item.id && (
          <div className="absolute right-3 top-12 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            <button
              onClick={() => iniciarEdicion(item)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil size={14} /> Renombrar
            </button>

            <button
              onClick={() => {
                setMoviendo(item);
                setDestino(item.padre || "");
                setMenuId(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
            >
              <Move size={14} /> Mover a
            </button>

            {esCarpeta && (
              <button
                onClick={() => {
                  setPersonalizando(item);
                  setMenuId(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              >
                <Palette size={14} /> Personalizar
              </button>
            )}

            {!esCarpeta && (
              <>
                <button
                  onClick={() => {
                    abrirElemento(item);
                    setMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye size={14} /> Visualizar
                </button>

                <button
                  onClick={() => {
                    descargarItem(item);
                    setMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Download size={14} /> Descargar
                </button>
              </>
            )}

            <button
              onClick={() => eliminar(item.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-full space-y-6 font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-slate-800">

      {/* ENCABEZADO */}

      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Files size={20} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Administrador de archivos
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Organiza, administra y visualiza tus documentos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:w-60 sm:flex-none">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar archivos..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <FolderPlus size={16} />
            Nueva carpeta
          </button>

          <button
            onClick={open}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Upload size={16} />
            Subir archivo
          </button>

          <input {...getInputProps()} />
        </div>
      </div>

      {/* ESTADÍSTICAS */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { nombre: "Carpetas", valor: cantidadCarpetas, Icono: Folder, color: "blue" },
          { nombre: "Documentos", valor: cantidadArchivos, Icono: FileText, color: "indigo" },
          { nombre: "En papelera", valor: papelera.length, Icono: Trash2, color: "rose" }
        ].map((dato) => (
          <motion.div
            key={dato.nombre}
            whileHover={{ y: -2 }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              dato.color === "blue"
                ? "bg-blue-50 text-blue-600"
                : dato.color === "indigo"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-rose-50 text-rose-600"
            }`}>
              <dato.Icono size={21} />
            </div>

            <div>
              <p className="text-xs text-slate-500">{dato.nombre}</p>
              <p className="text-xl font-bold text-slate-800">{dato.valor}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* EXPLORADOR */}

      <section
        {...getRootProps()}
        className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50 ring-4 ring-blue-100"
            : "border-slate-200"
        }`}
      >

        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-blue-50/90 backdrop-blur-sm">
            <div className="rounded-2xl border-2 border-dashed border-blue-400 bg-white p-10 text-center shadow-xl">
              <Upload size={38} className="mx-auto text-blue-600" />
              <p className="mt-3 font-bold text-blue-700">
                Suelta tus archivos aquí
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Se agregarán a la carpeta actual
              </p>
            </div>
          </div>
        )}

        {/* RUTA */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              onClick={() => {
                setActual(null);
                setBusqueda("");
                setFiltro("todos");
              }}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-blue-50 hover:text-blue-600 ${
                actual === null ? "font-bold text-blue-700" : "text-slate-500"
              }`}
            >
              <Home size={15} />
              Inicio
            </button>

            {ruta.map((carpeta, index) => (
              <div key={carpeta.id} className="flex items-center gap-2">
                <ChevronRight size={14} className="text-slate-300" />

                <button
                  onClick={() => {
                    setActual(carpeta.id);
                    setBusqueda("");
                  }}
                  className={`rounded-lg px-2 py-1.5 transition hover:bg-blue-50 hover:text-blue-600 ${
                    index === ruta.length - 1
                      ? "font-bold text-slate-800"
                      : "text-slate-500"
                  }`}
                >
                  {carpeta.nombre}
                </button>
              </div>
            ))}
          </div>

          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
            {lista.length} elementos
          </span>
        </div>

        {/* CREAR CARPETA */}

        <AnimatePresence>
          {creando && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50/50 px-5 py-4">
                <Folder size={21} className="text-blue-600" />

                <input
                  autoFocus
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && crearCarpeta()}
                  placeholder="Nombre de la carpeta"
                  className="min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                />

                <button
                  onClick={crearCarpeta}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Crear
                </button>

                <button
                  onClick={() => {
                    setCreando(false);
                    setNombreNuevo("");
                  }}
                  className="rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-white"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FILTROS Y VISTAS */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="text-slate-400" />

            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-blue-400"
            >
              <option value="todos">Todos los archivos</option>
              <option value="carpetas">Carpetas</option>
              <option value="archivos">Documentos</option>
              <option value="pdf">PDF</option>
              <option value="imagenes">Imágenes</option>
              <option value="videos">Videos</option>
            </select>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-2">
              <ArrowUpDown size={14} className="text-slate-400" />

              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="bg-transparent py-2 text-xs text-slate-600 outline-none"
              >
                <option value="nombre">Nombre</option>
                <option value="fecha">Más recientes</option>
                <option value="tamano">Mayor tamaño</option>
              </select>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setVista("lista")}
              title="Vista de lista"
              className={`rounded-md p-1.5 transition ${
                vista === "lista"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <List size={17} />
            </button>

            <button
              onClick={() => setVista("cuadricula")}
              title="Vista de cuadrícula"
              className={`rounded-md p-1.5 transition ${
                vista === "cuadricula"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Grid2X2 size={17} />
            </button>
          </div>
        </div>

        {/* LISTA */}

        {vista === "lista" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3.5">Nombre</th>
                  <th className="px-5 py-3.5">Modificado</th>
                  <th className="px-5 py-3.5">Tamaño</th>
                  <th className="px-5 py-3.5">Tipo</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence mode="popLayout">
                  {lista.map((item) => {
                    const esCarpeta = item.tipo === "carpeta";
                    const Icono = esCarpeta
                      ? null
                      : obtenerIconoArchivo(item.nombre);

                    return (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.18 }}
                        className="group border-b border-slate-100 last:border-0 hover:bg-blue-50/40"
                      >
                        <td className="px-5 py-3">
                          {editando === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={nombreEdicion}
                                onChange={(e) => setNombreEdicion(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && guardarEdicion()}
                                className="w-full rounded-lg border border-blue-300 px-2 py-1 text-sm outline-none"
                              />
                              <button onClick={guardarEdicion} className="text-emerald-600">
                                <Check size={17} />
                              </button>
                              <button onClick={() => setEditando(null)} className="text-slate-400">
                                <X size={17} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => abrirElemento(item)}
                              className="flex items-center gap-3 text-left"
                            >
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                esCarpeta ? "bg-slate-50" : "bg-blue-50"
                              }`}>
                                {esCarpeta
                                  ? renderIconoCarpeta(item)
                                  : <Icono size={19} className="text-blue-600" />}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-700 transition group-hover:text-blue-700">
                                  {item.nombre}
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {buscando && `En ${nombreCarpeta(item.padre)}`}
                                  {!buscando && esCarpeta && `${cuantos(item.id)} elementos`}
                                </p>
                              </div>
                            </button>
                          )}
                        </td>

                        <td className="px-5 py-3 text-xs text-slate-500">
                          {fechaCorta(item.fecha)}
                        </td>

                        <td className="px-5 py-3 text-xs text-slate-500">
                          {esCarpeta ? "—" : tamano(item.tam)}
                        </td>

                        <td className="px-5 py-3 text-xs text-slate-500">
                          {esCarpeta ? "Carpeta" : tipoArchivo(item.nombre)}
                        </td>

                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!esCarpeta && (
                              <button
                                onClick={() => abrirElemento(item)}
                                title="Visualizar"
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-100 hover:text-blue-600"
                              >
                                <Eye size={16} />
                              </button>
                            )}

                            <button
                              onClick={() => setDetalles(item)}
                              title="Detalles"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Info size={16} />
                            </button>

                            <button
                              onClick={() => setMenuId(menuId === item.id ? null : item.id)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <MoreVertical size={17} />
                            </button>
                          </div>

                          {menuId === item.id && (
                            <div className="absolute right-8 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">
                              <button
                                onClick={() => iniciarEdicion(item)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50"
                              >
                                <Pencil size={14} /> Renombrar
                              </button>

                              <button
                                onClick={() => {
                                  setMoviendo(item);
                                  setDestino(item.padre || "");
                                  setMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50"
                              >
                                <Move size={14} /> Mover
                              </button>

                              {esCarpeta && (
                                <button
                                  onClick={() => {
                                    setPersonalizando(item);
                                    setMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-blue-50"
                                >
                                  <Palette size={14} /> Personalizar
                                </button>
                              )}

                              <button
                                onClick={() => eliminar(item.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {lista.map(renderTarjeta)}
            </AnimatePresence>
          </div>
        )}

        {lista.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <FileSearch size={30} />
            </div>

            <p className="mt-4 text-sm font-bold text-slate-700">
              {buscando ? "No se encontraron resultados" : "Esta carpeta está vacía"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Sube documentos o crea una carpeta para comenzar.
            </p>

            <button
              onClick={open}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Upload size={15} />
              Subir documento
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <p className="text-[11px] text-slate-400">
            Administrador de documentos
          </p>
          <p className="text-[11px] text-slate-400">
            {lista.length} elementos mostrados
          </p>
        </div>
      </section>

      {/* PAPELERA */}

      {papelera.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trash2 size={18} className="text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-700">Papelera</p>
                <p className="text-xs text-slate-400">
                  {papelera.length} elementos eliminados
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {papelera.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="truncate text-xs text-slate-600">
                  {item.nombre}
                </span>
                <button
                  onClick={() => restaurar(item.id)}
                  className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VISOR DE DOCUMENTOS */}

      <AnimatePresence>
        {archivoSeleccionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setArchivoSeleccionado(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {(() => {
                      const Icono = obtenerIconoArchivo(archivoSeleccionado.nombre);
                      return <Icono size={20} />;
                    })()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-slate-800">
                      {archivoSeleccionado.nombre}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {tipoArchivo(archivoSeleccionado.nombre)} · {tamano(archivoSeleccionado.tam)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {urlArchivo && (
                    <button
                      onClick={descargar}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Download size={15} />
                      <span className="hidden sm:inline">Descargar</span>
                    </button>
                  )}

                  <button
                    onClick={() => setArchivoSeleccionado(null)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="min-h-[300px] flex-1 overflow-auto bg-slate-100">

                {!archivoSeleccionado.archivo && (
                  <div className="flex min-h-[400px] flex-col items-center justify-center bg-white p-8 text-center">
                    <FileText size={45} className="text-blue-500" />
                    <h3 className="mt-4 font-bold text-slate-800">
                      Archivo de demostración
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                      Este elemento es un ejemplo. Sube el documento original para visualizar su contenido.
                    </p>
                  </div>
                )}

                {archivoSeleccionado.archivo && cargando && (
                  <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                    <p className="text-sm text-slate-500">Procesando documento...</p>
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && errorVista && (
                  <div className="flex min-h-[400px] flex-col items-center justify-center bg-white p-8 text-center">
                    <AlertCircle size={42} className="text-red-400" />
                    <p className="mt-4 font-bold text-slate-700">
                      No se pudo visualizar el documento
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{errorVista}</p>
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista && pdf && urlArchivo && (
                  <iframe
                    src={urlArchivo}
                    title={archivoSeleccionado.nombre}
                    className="h-[76vh] min-h-[450px] w-full bg-white"
                  />
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista && imagen && urlArchivo && (
                  <div className="flex min-h-[450px] items-center justify-center bg-slate-900 p-5">
                    <img
                      src={urlArchivo}
                      alt={archivoSeleccionado.nombre}
                      className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
                    />
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista && video && urlArchivo && (
                  <div className="flex min-h-[450px] items-center justify-center bg-slate-950 p-4 sm:p-8">
                    <video
                      src={urlArchivo}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-[75vh] w-full max-w-5xl rounded-xl bg-black shadow-2xl"
                    >
                      Tu navegador no puede reproducir este video.
                    </video>
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista && audio && urlArchivo && (
                  <div className="flex min-h-[450px] flex-col items-center justify-center bg-white p-8">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                      <Music size={42} />
                    </div>
                    <h3 className="mt-5 max-w-md truncate font-bold text-slate-800">
                      {archivoSeleccionado.nombre}
                    </h3>
                    <audio src={urlArchivo} controls className="mt-6 w-full max-w-lg" />
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista && word && (
                  <div className="min-h-[450px] overflow-auto bg-slate-200 p-4 sm:p-8">
                    <div
                      ref={docxRef}
                      className="mx-auto min-h-[500px] max-w-[900px] bg-white p-6 shadow-md sm:p-10"
                    />
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista && excel && (
                  <div className="min-h-[450px] bg-white p-4 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Libro de Excel
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {hojasExcel.length} hojas disponibles
                        </p>
                      </div>

                      <select
                        value={hojaActiva}
                        onChange={(e) => setHojaActiva(Number(e.target.value))}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                      >
                        {hojasExcel.map((hoja, index) => (
                          <option key={hoja.nombre} value={index}>
                            {hoja.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {hojasExcel[hojaActiva] && (
                      <div className="overflow-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-max border-collapse text-left text-xs">
                          <tbody>
                            {hojasExcel[hojaActiva].datos.map((fila, index) => (
                              <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50">
                                {fila.map((celda, columna) => {
                                  const Celda = index === 0 ? "th" : "td";

                                  return (
                                    <Celda
                                      key={columna}
                                      className={`border-r border-slate-100 px-4 py-3 last:border-0 ${
                                        index === 0
                                          ? "bg-blue-50 font-bold text-blue-800"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {String(celda)}
                                    </Celda>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista && texto && (
                  <div className="min-h-[450px] bg-white p-5 sm:p-8">
                    <div className="mb-5 border-b border-slate-100 pb-3">
                      <p className="text-sm font-bold text-slate-800">
                        Contenido del documento
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Archivo de texto
                      </p>
                    </div>

                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-7 text-slate-700">
                      {contenidoTexto || "El documento está vacío."}
                    </pre>
                  </div>
                )}

                {archivoSeleccionado.archivo && !cargando && !errorVista &&
                  !pdf && !imagen && !video && !audio && !word && !excel && !texto && (
                    <div className="flex min-h-[450px] flex-col items-center justify-center bg-white p-8 text-center">
                      <Archive size={42} className="text-blue-500" />
                      <h3 className="mt-4 font-bold text-slate-800">
                        Vista previa no disponible
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-slate-500">
                        Este formato necesita una aplicación compatible para visualizar su contenido.
                      </p>
                      <button
                        onClick={descargar}
                        className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Download size={16} />
                        Descargar archivo
                      </button>
                    </div>
                  )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Check size={14} className="text-emerald-500" />
                  Vista previa del documento
                </div>

                <button
                  onClick={() => setArchivoSeleccionado(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERSONALIZAR CARPETA */}

      <AnimatePresence>
        {personalizando && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPersonalizando(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">
                  Personalizar carpeta
                </h3>
                <button
                  onClick={() => setPersonalizando(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white">
                  {renderIconoCarpeta(personalizando, true)}
                </div>
                <div>
                  <p className="font-bold text-slate-700">
                    {personalizando.nombre}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {cuantos(personalizando.id)} elementos
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-xs font-semibold text-slate-600">
                  Color de carpeta
                </label>

                <div className="mt-3 flex flex-wrap gap-3">
                  {COLORES.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        cambiarColor(personalizando.id, color);
                        setPersonalizando((prev) => ({ ...prev, color }));
                      }}
                      style={{ backgroundColor: color }}
                      className={`h-9 w-9 rounded-full transition hover:scale-110 ${
                        personalizando.color === color
                          ? "ring-2 ring-offset-2 ring-slate-500"
                          : ""
                      }`}
                    />
                  ))}

                  <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                    <Palette size={17} />
                    <input
                      type="color"
                      value={personalizando.color || "#2563eb"}
                      onChange={(e) => {
                        cambiarColor(personalizando.id, e.target.value);
                        setPersonalizando((prev) => ({
                          ...prev,
                          color: e.target.value
                        }));
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-xs font-semibold text-slate-600">
                  Icono de carpeta
                </label>

                <div className="mt-3 grid grid-cols-5 gap-2">
                  {Object.entries(ICONOS_CARPETA).map(([nombre, Icono]) => (
                    <button
                      key={nombre}
                      onClick={() => {
                        cambiarIcono(personalizando.id, nombre);
                        setPersonalizando((prev) => ({ ...prev, icono: nombre }));
                      }}
                      className={`flex h-12 items-center justify-center rounded-xl border transition hover:bg-blue-50 ${
                        personalizando.icono === nombre
                          ? "border-blue-400 bg-blue-50 text-blue-600"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      <Icono size={21} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setPersonalizando(null)}
                className="mt-7 w-full rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Guardar cambios
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOVER ELEMENTO */}

      <AnimatePresence>
        {moviendo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoviendo(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Mover elemento</h3>
                <button onClick={() => setMoviendo(null)}>
                  <X size={19} className="text-slate-400" />
                </button>
              </div>

              <p className="mt-2 truncate text-xs text-slate-500">
                Selecciona la carpeta de destino para {moviendo.nombre}
              </p>

              <label className="mt-5 block text-xs font-semibold text-slate-600">
                Ubicación de destino
              </label>

              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Inicio</option>
                {carpetasDisponibles.map((carpeta) => (
                  <option key={carpeta.id} value={carpeta.id}>
                    {carpeta.nombre}
                  </option>
                ))}
              </select>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setMoviendo(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={moverElemento}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Mover aquí
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETALLES */}

      <AnimatePresence>
        {detalles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetalles(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Detalles del elemento</h3>
                <button onClick={() => setDetalles(null)}>
                  <X size={19} className="text-slate-400" />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  {detalles.tipo === "carpeta"
                    ? renderIconoCarpeta(detalles)
                    : (() => {
                        const Icono = obtenerIconoArchivo(detalles.nombre);
                        return <Icono size={23} />;
                      })()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {detalles.nombre}
                  </p>
                  <p className="text-xs text-slate-400">
                    {detalles.tipo === "carpeta" ? "Carpeta" : tipoArchivo(detalles.nombre)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  ["Nombre", detalles.nombre],
                  ["Tipo", detalles.tipo === "carpeta" ? "Carpeta" : tipoArchivo(detalles.nombre)],
                  ["Tamaño", detalles.tipo === "carpeta" ? `${cuantos(detalles.id)} elementos` : tamano(detalles.tam)],
                  ["Modificado", fechaCorta(detalles.fecha)],
                  ["Ubicación", nombreCarpeta(detalles.padre)]
                ].map(([titulo, valor]) => (
                  <div key={titulo} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-xs text-slate-400">{titulo}</span>
                    <span className="max-w-[65%] truncate text-right text-xs font-semibold text-slate-700">
                      {valor}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setDetalles(null)}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
