import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  UserRound,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import api from "../../../../api/axios";

const formularioVacio = {
  dni: "",
  nombres: "",
  apellidos: "",
  programa_estudios: "Diseño y Programación Web",
  semestre: "VI Semestre",
  correo: "",
  telefono: "",
  estado: "En progreso",
};

export default function ModalEstudiante({
  isOpen,
  onClose,
  estudianteActual = null,
  onGuardadoExitoso,
  darkMode = false,
}) {
  const [formData, setFormData] = useState(formularioVacio);

  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [eliminarFoto, setEliminarFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [buscandoDni, setBuscandoDni] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const inputFotoRef = useRef(null);

  // Cargar datos si es edición o limpiar si es nuevo registro
  useEffect(() => {
    setErrorMsg("");
    setOkMsg("");
    if (estudianteActual) {
      setFormData({
        dni: estudianteActual.dni || "",
        nombres: estudianteActual.nombres || "",
        apellidos: estudianteActual.apellidos || "",
        programa_estudios: estudianteActual.programa_estudios || "Diseño y Programación Web",
        semestre: estudianteActual.semestre || "VI Semestre",
        correo: estudianteActual.correo || "",
        telefono: estudianteActual.telefono || "",
        estado: estudianteActual.estado || "En progreso",
      });
      const fotoUrl = estudianteActual.foto_url || "";
      setFotoPreview(
        fotoUrl && !/^(https?:|data:|blob:)/i.test(fotoUrl)
          ? `${String(api.defaults.baseURL || "").replace(/\/api\/?$/, "")}/${String(fotoUrl).replace(/^\/+/, "")}`
          : fotoUrl
      );
      setFoto(null);
      setEliminarFoto(false);
    } else {
      setFormData(formularioVacio);
      setFoto(null);
      setFotoPreview("");
      setEliminarFoto(false);
    }
  }, [estudianteActual, isOpen]);

  useEffect(() => {
    if (!fotoPreview.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(fotoPreview);
  }, [fotoPreview]);

  if (!isOpen) return null;

  const dniCompleto = formData.dni.length === 8;

  // Consulta RENIEC (vía tu backend) y completa nombres y apellidos
  const buscarDniReniec = async () => {
    setErrorMsg("");
    setOkMsg("");

    if (!/^\d{8}$/.test(formData.dni)) {
      setErrorMsg("El DNI debe tener exactamente 8 dígitos numéricos.");
      return;
    }

    setBuscandoDni(true);
    try {
      const res = await api.get(`/estudiantes/dni/${formData.dni}`);
      const data = res.data?.data || res.data;

      if (data) {
        // Acepta tanto los nombres de Decolecta como los de tu backend
        const nombres = data.nombres || data.first_name || "";
        const paterno = data.apellido_paterno || data.first_last_name || "";
        const materno = data.apellido_materno || data.second_last_name || "";
        const apellidos =
          data.apellidos || [paterno, materno].filter(Boolean).join(" ");

        setFormData((prev) => ({
          ...prev,
          nombres: nombres || prev.nombres,
          apellidos: apellidos || prev.apellidos,
        }));

        if (nombres || apellidos) {
          setOkMsg("¡Datos obtenidos correctamente de RENIEC!");
        } else {
          setErrorMsg("RENIEC no devolvió nombres para ese DNI.");
        }
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "No se encontró información para el DNI ingresado."
      );
    } finally {
      setBuscandoDni(false);
    }
  };

  const handleSeleccionarFoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg("La foto debe estar en formato JPG, PNG o WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("La imagen no debe superar los 2 MB.");
      return;
    }
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
    setEliminarFoto(false);
  };

  const handleQuitarFoto = () => {
    setFoto(null);
    setFotoPreview("");
    setEliminarFoto(Boolean(estudianteActual?.foto_url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg("");
    setOkMsg("");

    try {
      // Usamos FormData por si se envía imagen junto con los campos
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value ?? "");
      });
      if (foto) {
        payload.append("foto", foto);
      } else if (eliminarFoto) {
        payload.append("eliminar_foto", "1");
      }

      let estudianteGuardado;
      if (estudianteActual) {
        // Laravel requiere _method = PUT cuando se envía FormData con archivos
        payload.append("_method", "PUT");
        const response = await api.post(`/estudiantes/${estudianteActual.id_estudiante}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        estudianteGuardado = response.data?.data;
      } else {
        const response = await api.post("/estudiantes", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        estudianteGuardado = response.data?.data;
      }

      onGuardadoExitoso?.(estudianteGuardado);
      onClose();
    } catch (err) {
      console.error("Error al guardar estudiante:", err);
      setErrorMsg(
        err.response?.data?.message || "Verifica los campos e intenta nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  const tema = darkMode
    ? {
        modal: "bg-[#1e293b] border-slate-700 text-slate-100",
        cabecera: "bg-slate-800/80 border-slate-700",
        fieldset: "border-slate-700 bg-slate-800/30",
        legend: "text-blue-400 bg-[#1e293b]",
        input: "bg-[#0f172a] border-slate-700 text-slate-100 focus:border-blue-500",
        label: "text-slate-300",
        marcoFoto: "bg-slate-800 border-slate-600",
      }
    : {
        modal: "bg-white border-slate-200 text-slate-800",
        cabecera: "bg-slate-50 border-slate-200",
        fieldset: "border-slate-200 bg-slate-50/40",
        legend: "text-blue-600 bg-white",
        input: "bg-white border-slate-300 text-slate-800 focus:border-blue-500",
        label: "text-slate-600",
        marcoFoto: "bg-slate-100 border-slate-300",
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${tema.modal}`}
      >
        {/* Barra superior estilo ventana */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-b ${tema.cabecera}`}
        >
          <span className="text-sm font-semibold text-blue-600">
            {estudianteActual
              ? `Edición de Estudiante · ID #${estudianteActual.id_estudiante}`
              : "Alta de Registro · Nuevo Estudiante"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto space-y-6">
          {/* Título principal del formulario */}
          <div className="border-b border-inherit pb-3">
            <h2 className="text-xl font-bold tracking-tight">
              {estudianteActual
                ? "1.- Actualizar información Básica del Estudiante"
                : "1.- Registrar información Básica del Estudiante"}
            </h2>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {okMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{okMsg}</span>
            </div>
          )}

          {/* Contenedor principal de 2 columnas (Izquierda Foto / Derecha Bloques) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA: Imagen Estudiante */}
            <div className="md:col-span-3 flex flex-col items-center space-y-3">
              <span className={`text-xs font-semibold ${tema.label}`}>
                Imagen Estudiante
              </span>

              <div
                className={`w-36 h-40 rounded-xl border-2 flex items-center justify-center overflow-hidden shadow-inner ${tema.marcoFoto}`}
              >
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserRound size={64} className="text-slate-400" strokeWidth={1.5} />
                )}
              </div>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                onChange={handleSeleccionarFoto}
                className="hidden"
              />

              {/* Botones Agregar / Eliminar debajo de la foto */}
              <div className="flex items-center gap-2 w-full justify-center">
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <Plus size={14} className="text-emerald-600" />
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={handleQuitarFoto}
                  disabled={!fotoPreview}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 transition"
                >
                  <Trash2 size={14} className="text-rose-500" />
                  Eliminar
                </button>
              </div>
            </div>

            {/* COLUMNA DERECHA: Bloques con borde (Fieldsets) */}
            <div className="md:col-span-9 space-y-5">
              {/* BLOQUE 1: Información Personal */}
              <fieldset className={`rounded-xl border p-4 space-y-3.5 ${tema.fieldset}`}>
                <legend className={`px-2 text-xs font-bold ${tema.legend}`}>
                  Información Personal
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className={`sm:col-span-4 text-xs font-semibold sm:text-right pr-2 ${tema.label}`}>
                    DNI <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-8 space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="15"
                        required
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value.trim() })}
                        onKeyDown={(e) => {
                          // Enter busca en RENIEC en vez de enviar el formulario
                          if (e.key === "Enter") {
                            e.preventDefault();
                            buscarDniReniec();
                          }
                        }}
                        placeholder="Ej. 74589632"
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                      />
                      <button
                        type="button"
                        onClick={buscarDniReniec}
                        disabled={buscandoDni}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
                      >
                        {buscandoDni ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Buscando
                          </>
                        ) : (
                          <>
                            <Search size={14} />
                            Buscar
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold tabular-nums">
                      <span className={dniCompleto ? "text-emerald-600" : "text-slate-400"}>
                        {formData.dni.length}/8
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <ShieldCheck size={12} /> Consulta RENIEC
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className={`sm:col-span-4 text-xs font-semibold sm:text-right pr-2 ${tema.label}`}>
                    Nombres <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      required
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      placeholder="Se completa con el DNI o ingrese manual"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className={`sm:col-span-4 text-xs font-semibold sm:text-right pr-2 ${tema.label}`}>
                    Apellidos <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      placeholder="Se completa con el DNI o ingrese manual"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                    />
                  </div>
                </div>
              </fieldset>

              {/* BLOQUE 2: Datos Académicos y Contacto */}
              <fieldset className={`rounded-xl border p-4 space-y-3.5 ${tema.fieldset}`}>
                <legend className={`px-2 text-xs font-bold ${tema.legend}`}>
                  Datos Académicos y Contacto
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className={`sm:col-span-4 text-xs font-semibold sm:text-right pr-2 ${tema.label}`}>
                    Programa de Estudios <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-8">
                    <select
                      value={formData.programa_estudios}
                      onChange={(e) =>
                        setFormData({ ...formData, programa_estudios: e.target.value })
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                    >
                      <option value="Diseño y Programación Web">Diseño y Programación Web</option>
                      <option value="Arquitectura de Plataformas y Servicios de TI">
                        Arquitectura de Plataformas y Servicios de TI
                      </option>
                      <option value="Contabilidad">Contabilidad</option>
                      <option value="Enfermería Técnica">Enfermería Técnica</option>
                      <option value="Mecatrónica Automotriz">Mecatrónica Automotriz</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className={`sm:col-span-4 text-xs font-semibold sm:text-right pr-2 ${tema.label}`}>
                    Semestre y Estado
                  </label>
                  <div className="sm:col-span-4">
                    <select
                      value={formData.semestre}
                      onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                    >
                      <option value="I Semestre">I Semestre</option>
                      <option value="II Semestre">II Semestre</option>
                      <option value="III Semestre">III Semestre</option>
                      <option value="IV Semestre">IV Semestre</option>
                      <option value="V Semestre">V Semestre</option>
                      <option value="VI Semestre">VI Semestre</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                    >
                      <option value="En progreso">En progreso</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Egresado">Egresado</option>
                    </select>
                  </div>
                </div>
                <p className={`text-xs sm:ml-[33.333%] ${tema.label}`}>
                  Avanza al siguiente semestre solo cuando el estudiante apruebe. Si no aprueba,
                  conserva el semestre actual; el sistema no lo cambia automáticamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className={`sm:col-span-4 text-xs font-semibold sm:text-right pr-2 ${tema.label}`}>
                    Correo Electrónico
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="email"
                      value={formData.correo}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      placeholder="estudiante@iestpaacd.edu.pe"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className={`sm:col-span-4 text-xs font-semibold sm:text-right pr-2 ${tema.label}`}>
                    Teléfono / Celular
                  </label>
                  <div className="sm:col-span-8 flex items-center gap-3">
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="987654321"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${tema.input}`}
                    />
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium shrink-0">
                      <CheckCircle2 size={16} /> Verificado
                    </span>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>

          {/* Botones inferiores alineados a la derecha */}
          <div className="flex items-center justify-end gap-3 border-t border-inherit pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Save size={15} />
              {guardando
                ? "Guardando..."
                : estudianteActual
                ? "Guardar Cambios"
                : "Salvar y Terminar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}