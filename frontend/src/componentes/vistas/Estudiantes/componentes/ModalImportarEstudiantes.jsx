import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import api from "../../../../api/axios";

// Columnas que se aceptan en el archivo (se ignoran tildes, mayúsculas y espacios)
const ALIAS = {
  dni: ["dni", "documento", "nrodocumento", "numerodocumento"],
  nombres: ["nombres", "nombre"],
  apellidos: ["apellidos", "apellido"],
  programa_estudios: [
    "programaestudios",
    "programadeestudios",
    "programa",
    "carrera",
  ],
  semestre: ["semestre", "ciclo"],
  correo: ["correo", "email", "correoelectronico"],
  telefono: ["telefono", "celular", "cel"],
  direccion: ["direccion", "domicilio"],
  estado: ["estado"],
};

// Longitudes máximas según la tabla public.estudiantes
const LIMITES = {
  dni: 15,
  nombres: 100,
  apellidos: 100,
  programa_estudios: 100,
  semestre: 20,
  correo: 100,
  telefono: 20,
  direccion: 150,
  estado: 50,
};

const ETIQUETAS = {
  dni: "DNI",
  nombres: "Nombres",
  apellidos: "Apellidos",
  programa_estudios: "Programa",
  semestre: "Semestre",
  correo: "Correo",
  telefono: "Teléfono",
  direccion: "Dirección",
  estado: "Estado",
};

const REQUERIDOS = ["dni", "nombres", "apellidos", "semestre"];

const normalizarClave = (texto) =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const convertirFila = (filaCruda) => {
  const mapa = {};
  Object.entries(filaCruda).forEach(([k, v]) => {
    mapa[normalizarClave(k)] = String(v ?? "").trim();
  });

  const fila = {};
  Object.entries(ALIAS).forEach(([campo, alias]) => {
    const clave = alias.find((a) => mapa[a] !== undefined);
    fila[campo] = clave ? mapa[clave] : "";
  });
  return fila;
};

export default function ModalImportarEstudiantes({
  isOpen,
  onClose,
  onImportadoExitoso,
  dnisExistentes = [],
  darkMode = false,
}) {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);
  const [errorArchivo, setErrorArchivo] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resumen, setResumen] = useState(null);

  const tema = darkMode
    ? {
        modal: "bg-[#1e293b] border-slate-700 text-slate-100",
        secundario: "text-slate-400",
        zona: "border-slate-600 hover:border-blue-500 hover:bg-slate-800/60",
        zonaActiva: "border-blue-500 bg-slate-800/60",
        encabezado: "bg-slate-800/70 text-slate-300",
        fila: "border-slate-700",
        boton: "border-slate-600 text-slate-200 hover:bg-slate-800",
      }
    : {
        modal: "bg-white border-slate-200 text-slate-800",
        secundario: "text-slate-500",
        zona: "border-slate-300 hover:border-blue-500 hover:bg-blue-50/50",
        zonaActiva: "border-blue-500 bg-blue-50/50",
        encabezado: "bg-slate-50 text-slate-500",
        fila: "border-slate-100",
        boton: "border-slate-200 text-slate-600 hover:bg-slate-50",
      };

  // Valida cada fila según el esquema de la tabla estudiantes
  const filasValidadas = useMemo(() => {
    const dnisSistema = new Set(dnisExistentes.map((d) => String(d).trim()));
    const dnisArchivo = new Set();

    return filas.map((fila, i) => {
      const errores = [];

      REQUERIDOS.forEach((campo) => {
        if (!fila[campo]) errores.push(`Falta ${ETIQUETAS[campo].toLowerCase()}`);
      });

      Object.entries(LIMITES).forEach(([campo, max]) => {
        if (fila[campo] && fila[campo].length > max) {
          errores.push(`${ETIQUETAS[campo]} supera ${max} caracteres`);
        }
      });

      if (fila.dni && !/^[A-Za-z0-9]+$/.test(fila.dni)) {
        errores.push("DNI solo admite letras y números");
      }

      if (fila.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fila.correo)) {
        errores.push("Correo no válido");
      }

      if (fila.dni) {
        if (dnisSistema.has(fila.dni)) errores.push("DNI ya registrado");
        else if (dnisArchivo.has(fila.dni)) errores.push("DNI repetido en el archivo");
        dnisArchivo.add(fila.dni);
      }

      return {
        ...fila,
        numero: i + 2, // fila real en Excel (la 1 es el encabezado)
        errores,
      };
    });
  }, [filas, dnisExistentes]);

  const validas = filasValidadas.filter((f) => f.errores.length === 0);
  const invalidas = filasValidadas.length - validas.length;

  const reiniciar = () => {
    setArchivo(null);
    setFilas([]);
    setErrorArchivo("");
    setProgreso(0);
    setResumen(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const cerrar = () => {
    if (importando) return;
    reiniciar();
    onClose();
  };

  const leerArchivo = async (file) => {
    if (!file) return;
    reiniciar();

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setErrorArchivo("Formato no permitido. Usa un archivo .xlsx, .xls o .csv.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const libro = XLSX.read(buffer, { type: "array" });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const datos = XLSX.utils.sheet_to_json(hoja, { defval: "", raw: false });

      if (datos.length === 0) {
        setErrorArchivo("El archivo no contiene filas con datos.");
        return;
      }

      setArchivo(file);
      setFilas(datos.map(convertirFila));
    } catch (err) {
      console.error("Error al leer archivo:", err);
      setErrorArchivo("No se pudo leer el archivo. Revisa que no esté dañado.");
    }
  };

  const descargarPlantilla = () => {
    const encabezados = [
      "DNI",
      "Nombres",
      "Apellidos",
      "Programa de estudios",
      "Semestre",
      "Correo",
      "Teléfono",
      "Dirección",
      "Estado",
    ];
    const ejemplo = [
      "12345678",
      "Juan Carlos",
      "Pérez Gómez",
      "Enfermería Técnica",
      "I",
      "juan@correo.com",
      "987654321",
      "Av. Principal 123",
      "Al día",
    ];
    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ejemplo]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Estudiantes");
    XLSX.writeFile(libro, "plantilla_estudiantes.xlsx");
  };

  const importar = async () => {
    if (validas.length === 0) return;
    setImportando(true);
    setProgreso(0);

    let correctos = 0;
    const fallidos = [];

    for (let i = 0; i < validas.length; i++) {
      const { numero, errores, ...completo } = validas[i];
      // Los campos opcionales vacíos se omiten para que apliquen los DEFAULT de la BD
      const datos = Object.fromEntries(
        Object.entries(completo).filter(([, v]) => v !== "")
      );
      try {
        // Mismo endpoint de creación que usa el registro individual
        await api.post("/estudiantes", datos);
        correctos++;
      } catch (err) {
        console.error(`Error en fila ${numero}:`, err);
        fallidos.push(numero);
      }
      setProgreso(i + 1);
    }

    setImportando(false);
    setResumen({ correctos, fallidos });
    if (correctos > 0) onImportadoExitoso?.(correctos);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div
        className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-xl ${tema.modal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-importar"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 border-b border-inherit p-5">
          <div>
            <h2 id="titulo-importar" className="text-lg font-bold">
              Importar estudiantes
            </h2>
            <p className={`mt-1 text-sm ${tema.secundario}`}>
              Sube un archivo Excel o CSV para registrar varios estudiantes a la vez.
            </p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            disabled={importando}
            className={`rounded-lg p-2 transition disabled:opacity-40 ${tema.boton} border`}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {resumen ? (
            <div className="space-y-3 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-lg font-bold">
                {resumen.correctos} estudiante(s) importado(s)
              </p>
              {resumen.fallidos.length > 0 && (
                <p className="text-sm text-rose-500">
                  No se pudieron guardar las filas: {resumen.fallidos.join(", ")}.
                </p>
              )}
            </div>
          ) : (
            <>
              {!archivo ? (
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrando(true);
                  }}
                  onDragLeave={() => setArrastrando(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastrando(false);
                    leerArchivo(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                    arrastrando ? tema.zonaActiva : tema.zona
                  }`}
                >
                  <div className="rounded-full bg-blue-50 p-4 text-blue-600">
                    <Upload size={26} />
                  </div>
                  <p className="mt-3 font-semibold">
                    Arrastra tu archivo aquí o haz clic para elegirlo
                  </p>
                  <p className={`mt-1 text-sm ${tema.secundario}`}>
                    Formatos: .xlsx, .xls, .csv
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => leerArchivo(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-inherit p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{archivo.name}</p>
                      <p className={`text-xs ${tema.secundario}`}>
                        {filasValidadas.length} fila(s) · {validas.length} lista(s) ·{" "}
                        {invalidas} con errores
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reiniciar}
                    disabled={importando}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-40 ${tema.boton}`}
                  >
                    Cambiar archivo
                  </button>
                </div>
              )}

              {errorArchivo && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
                  <AlertCircle size={17} className="shrink-0 text-rose-500" />
                  {errorArchivo}
                </div>
              )}

              {/* Vista previa */}
              {filasValidadas.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-inherit">
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className={`sticky top-0 ${tema.encabezado}`}>
                        <tr>
                          <th className="px-4 py-3 font-semibold">Fila</th>
                          <th className="px-4 py-3 font-semibold">DNI</th>
                          <th className="px-4 py-3 font-semibold">Estudiante</th>
                          <th className="px-4 py-3 font-semibold">Programa / Semestre</th>
                          <th className="px-4 py-3 font-semibold">Dirección</th>
                          <th className="px-4 py-3 font-semibold">Validación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasValidadas.map((f) => (
                          <tr key={f.numero} className={`border-t ${tema.fila}`}>
                            <td className={`px-4 py-2.5 ${tema.secundario}`}>
                              {f.numero}
                            </td>
                            <td className="px-4 py-2.5">{f.dni}</td>
                            <td className="px-4 py-2.5">
                              {f.nombres} {f.apellidos}
                            </td>
                            <td className="px-4 py-2.5">
                              {f.programa_estudios || "Por defecto"}
                              <span className={`block text-xs ${tema.secundario}`}>
                                {f.semestre || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {f.direccion || (
                                <span className={`text-xs ${tema.secundario}`}>
                                  No registrada
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              {f.errores.length === 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                  <CheckCircle2 size={14} /> Lista
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-rose-500">
                                  {f.errores.join(", ")}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importando && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${(progreso / validas.length) * 100}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-xs ${tema.secundario}`}>
                    Importando {progreso} de {validas.length}...
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie */}
        <div className="flex flex-col-reverse gap-3 border-t border-inherit p-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={descargarPlantilla}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <Download size={16} />
            Descargar plantilla
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={cerrar}
              disabled={importando}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${tema.boton}`}
            >
              {resumen ? "Cerrar" : "Cancelar"}
            </button>
            {!resumen && (
              <button
                type="button"
                onClick={importar}
                disabled={importando || validas.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importando && <Loader2 size={16} className="animate-spin" />}
                Importar {validas.length > 0 ? `${validas.length} estudiante(s)` : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}