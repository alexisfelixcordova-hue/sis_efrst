import { useEffect, useRef, useState } from "react";
import {
  CircleHelp,
  LoaderCircle,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import api from "../../../api/axios.js";

const sugerencias = [
  "¿Dónde puedo revisar un expediente?",
  "¿Cómo actualizo mis datos?",
  "¿Qué opciones tengo en el sistema?",
];

export default function Asistente({ usuario, darkMode = false }) {
  const nombre = usuario?.nombres || usuario?.nombre;
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState(() => [
    {
      rol: "model",
      texto: `${nombre ? `Hola, ${nombre}. ` : "Hola. "}¿Qué necesitas hacer en el sistema? Puedo indicarte dónde encontrar las opciones principales.`,
    },
  ]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, cargando, abierto]);

  const enviarPregunta = async (contenido) => {
    const pregunta = contenido.trim();
    if (!pregunta || cargando) return;

    const historial = mensajes.slice(1).slice(-8);
    setMensajes((actuales) => [...actuales, { rol: "user", texto: pregunta }]);
    setTexto("");
    setCargando(true);

    try {
      const { data } = await api.post(
        "/asistente",
        { mensaje: pregunta, historial },
        { timeout: 20000 },
      );

      if (!data?.success || typeof data.respuesta !== "string" || !data.respuesta.trim()) {
        throw new Error(data?.message || "No se pudo generar una respuesta.");
      }

      setMensajes((actuales) => [...actuales, { rol: "model", texto: data.respuesta }]);
    } catch (error) {
      const mensaje =
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo completar la consulta.";
      setMensajes((actuales) => [
        ...actuales,
        { rol: "model", texto: `No se pudo completar la consulta: ${mensaje} Inténtalo nuevamente.` },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const enviar = (e) => {
    e.preventDefault();
    enviarPregunta(texto);
  };

  const alPresionar = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarPregunta(texto);
    }
  };

  const surface = darkMode
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-200 bg-white text-slate-900";
  const subtle = darkMode
    ? "border-slate-700 bg-slate-950 text-slate-200"
    : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end sm:bottom-6 sm:right-6">
      {abierto && (
        <section
          aria-label="Ayuda del sistema EFSRT"
          className={`mb-3 flex h-[min(34rem,calc(100dvh-6.5rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-xl shadow-slate-950/15 ${surface}`}
        >
          <header className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${darkMode ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                <CircleHelp size={19} />
              </span>
              <div className="min-w-0">
                <h2 className={`truncate text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                  Ayuda del sistema
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">EFSRT · Guía de uso</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar ayuda"
              className={`rounded-lg p-2 transition ${darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
            >
              <X size={18} />
            </button>
          </header>

          <div
            aria-live="polite"
            className={`flex-1 space-y-3 overflow-y-auto p-4 ${darkMode ? "bg-slate-950" : "bg-[#f5f8fc]"}`}
          >
            {mensajes.map((mensaje, i) => {
              const esUsuario = mensaje.rol === "user";
              return (
                <div key={`${i}-${mensaje.rol}`} className={`flex ${esUsuario ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-2.5 text-sm leading-5 ${
                      esUsuario
                        ? "rounded-br-sm bg-[#2f6bff] text-white"
                        : darkMode
                          ? "rounded-bl-sm border border-slate-700 bg-slate-900 text-slate-200"
                          : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {mensaje.texto}
                  </div>
                </div>
              );
            })}

            {mensajes.length === 1 && !cargando && (
              <div className="space-y-2 pl-2">
                <p className="text-xs font-semibold text-slate-500">Temas frecuentes</p>
                {sugerencias.map((sugerencia) => (
                  <button
                    key={sugerencia}
                    type="button"
                    onClick={() => enviarPregunta(sugerencia)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-xs leading-5 transition ${
                      darkMode
                        ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500 hover:text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-800"
                    }`}
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            )}

            {cargando && (
              <div className={`inline-flex items-center gap-2 rounded-xl rounded-bl-sm border px-3 py-2.5 text-xs ${subtle}`}>
                <LoaderCircle size={14} className="animate-spin text-blue-500" />
                Buscando respuesta...
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form onSubmit={enviar} className={`flex items-end gap-2 border-t p-3 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <textarea
              rows={1}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={alPresionar}
              maxLength={1000}
              aria-label="Escribe tu pregunta"
              placeholder="Escribe tu pregunta..."
              className={`max-h-28 min-h-11 flex-1 resize-y rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${
                darkMode
                  ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
                  : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <button
              type="submit"
              disabled={cargando || !texto.trim()}
              aria-label="Enviar mensaje"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#2f6bff] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        aria-label={abierto ? "Cerrar ayuda" : "Abrir ayuda del sistema"}
        aria-expanded={abierto}
        className="grid h-12 w-12 place-items-center rounded-full bg-[#2f6bff] text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
      >
        {abierto ? <X size={21} /> : <MessageCircle size={21} />}
      </button>
    </div>
  );
}
