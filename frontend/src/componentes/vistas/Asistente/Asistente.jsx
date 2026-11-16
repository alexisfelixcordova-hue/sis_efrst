import { useState, useRef, useEffect } from "react";

// AJUSTA ESTAS DOS COSAS A TU PROYECTO:
// 1) URL base de tu API Laravel
const API_URL = "http://127.0.0.1:8000/api";
// 2) De dónde sacas el token de Sanctum (cámbialo si lo guardas con otro nombre)
const obtenerToken = () => localStorage.getItem("token");

const SALUDO = {
  rol: "model",
  texto:
    "Hola, soy el asistente del sistema EFSRT. Puedo ayudarte con estudiantes, constancias, tu perfil o tu contraseña. ¿Qué necesitas?",
};

export default function Asistente() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([SALUDO]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando, abierto]);

  const enviar = async () => {
    const pregunta = texto.trim();
    if (!pregunta || cargando) return;

    // Historial sin el saludo inicial, últimos 20 mensajes
    const historial = mensajes.slice(1).slice(-20);

    setMensajes((m) => [...m, { rol: "user", texto: pregunta }]);
    setTexto("");
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/asistente`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${obtenerToken()}`,
        },
        body: JSON.stringify({ mensaje: pregunta, historial }),
      });
      const data = await res.json();
      const respuesta = data.success
        ? data.respuesta
        : data.message || "El asistente no está disponible ahora.";
      setMensajes((m) => [...m, { rol: "model", texto: respuesta }]);
    } catch {
      setMensajes((m) => [
        ...m,
        { rol: "model", texto: "No pude conectarme al servidor. Intenta de nuevo." },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const alPresionar = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {abierto && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <span className="text-sm font-semibold">Asistente EFSRT</span>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
              className="text-lg leading-none hover:opacity-80"
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    m.rol === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}
            {cargando && (
              <div className="text-xs text-gray-500">Escribiendo…</div>
            )}
            <div ref={finRef} />
          </div>

          <div className="flex gap-2 border-t border-gray-200 bg-white p-2">
            <textarea
              rows={1}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={alPresionar}
              maxLength={1000}
              placeholder="Escribe tu pregunta"
              className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={enviar}
              disabled={cargando || !texto.trim()}
              className="rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setAbierto((a) => !a)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg hover:bg-blue-700"
      >
        {abierto ? "×" : "💬"}
      </button>
    </div>
  );
}