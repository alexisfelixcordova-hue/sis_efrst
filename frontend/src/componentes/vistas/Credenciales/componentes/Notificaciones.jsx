import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:8000/api";
const STORAGE_KEY = "preferencias_notificaciones";

const iniciales = [
  { id: "login", titulo: "Inicios de sesión nuevos", texto: "Avisar cuando se acceda desde otro dispositivo", activo: true },
  { id: "clave", titulo: "Cambios de contraseña", texto: "Confirmación por correo al cambiar tu clave", activo: true },
  { id: "constancias", titulo: "Solicitudes de constancias", texto: "Avisar de nuevas solicitudes pendientes", activo: true },
  { id: "revisiones", titulo: "Revisiones pendientes", texto: "Recordatorio de expedientes por revisar", activo: false },
  { id: "sistema", titulo: "Avisos del sistema", texto: "Mantenimiento y novedades de la plataforma", activo: false },
];

function Switch({ activo, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        activo ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
          activo ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function Notificaciones({ darkMode = false }) {
  const [items, setItems] = useState(() => {
    const guardadas = localStorage.getItem(STORAGE_KEY);
    if (guardadas) {
      const mapa = JSON.parse(guardadas);
      return iniciales.map((n) => ({ ...n, activo: mapa[n.id] ?? n.activo }));
    }
    return iniciales;
  });

  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);
  const tokenSesion = localStorage.getItem("token") || localStorage.getItem("access_token");

  // Cargar preferencias reales desde PostgreSQL al montar
  useEffect(() => {
    const cargarPreferencias = async () => {
      if (!tokenSesion) return;
      try {
        const res = await axios.get(`${API_URL}/notificaciones/preferencias`, {
          headers: { Authorization: `Bearer ${tokenSesion}`, Accept: "application/json" },
        });
        if (res.data && typeof res.data === "object") {
          setItems((prev) =>
            prev.map((n) => ({ ...n, activo: res.data[n.id] ?? n.activo }))
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
        }
      } catch {
        // Si aún no hay registro en BD, mantiene las iniciales o las de localStorage
      }
    };
    cargarPreferencias();
  }, [tokenSesion]);

  const alternar = async (id) => {
    const nuevosItems = items.map((n) =>
      n.id === id ? { ...n, activo: !n.activo } : n
    );
    setItems(nuevosItems);

    // Convertir a objeto clave-valor { login: true, clave: false, ... }
    const mapaPreferencias = nuevosItems.reduce((acc, item) => {
      acc[item.id] = item.activo;
      return acc;
    }, {});

    // Guardar en localStorage y notificar al Navbar en tiempo real
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapaPreferencias));
    window.dispatchEvent(
      new CustomEvent("preferencias_notif_cambiadas", { detail: mapaPreferencias })
    );

    // Guardar en la base de datos (Laravel)
    if (!tokenSesion) return;
    setGuardando(true);
    try {
      await axios.post(
        `${API_URL}/notificaciones/preferencias`,
        { preferencias: mapaPreferencias },
        { headers: { Authorization: `Bearer ${tokenSesion}`, Accept: "application/json" } }
      );
      setMensajeGuardado(true);
      setTimeout(() => setMensajeGuardado(false), 2000);
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section
      className={`rounded-3xl border px-6 py-6 transition-colors ${
        darkMode
          ? "border-slate-800 bg-slate-900 text-white"
          : "border-gray-200 bg-white text-slate-800"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-2xl ${darkMode ? "bg-slate-800 text-sky-400" : "bg-blue-50 text-blue-600"}`}>
            <Bell size={20} strokeWidth={1.6} />
          </div>
          <div className="leading-snug">
            <p className="text-xs font-semibold">Notificaciones y Alertas</p>
            <p className={`text-[10.5px] ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
              Elige qué avisos quieres recibir en la barra superior
            </p>
          </div>
        </div>

        {mensajeGuardado && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-500">
            <Check size={12} /> Guardado
          </span>
        )}
      </div>

      <ul className={`mt-6 divide-y ${darkMode ? "divide-slate-800" : "divide-gray-100"}`}>
        {items.map((n) => (
          <li key={n.id} className="flex items-center justify-between gap-6 py-4">
            <div className="text-xs leading-snug">
              <p className="font-semibold">{n.titulo}</p>
              <p className={darkMode ? "text-slate-400" : "text-gray-500"}>{n.texto}</p>
            </div>
            <Switch
              activo={n.activo}
              disabled={guardando}
              onChange={() => alternar(n.id)}
              label={n.titulo}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}