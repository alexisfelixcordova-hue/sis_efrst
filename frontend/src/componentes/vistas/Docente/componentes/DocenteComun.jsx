
import { useState, useEffect } from "react";

export const API = "http://localhost:8000/api"; // mismo valor que en App.jsx
export const HORAS_TOTALES = 480;

/* Colores compartidos (claro y oscuro) */
export const tema = (d) => ({
  texto: d ? "text-gray-200" : "text-slate-900",
  suave: d ? "text-slate-400" : "text-slate-500",
  tarjeta: d ? "rounded-2xl border border-gray-800 bg-slate-900" : "rounded-2xl border border-slate-200 bg-white shadow-sm",
  borde: d ? "border-gray-800" : "border-slate-200",
  fila: d ? "border-gray-800 hover:bg-slate-800/50" : "border-slate-100 hover:bg-slate-50",
  th: d ? "text-slate-500" : "text-slate-400",
  pill: d ? "bg-slate-800 text-gray-200" : "bg-slate-100 text-slate-800",
  entrada: d
    ? "border-gray-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600",
  boton: d ? "border-gray-700 text-gray-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50",
  chipOn: d ? "border-blue-500 bg-blue-500/10 text-blue-300" : "border-blue-600 bg-blue-50 text-blue-700",
});

export const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40";

export const iniciales = (n = "") => {
  const p = n.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
};

export const colorEstado = (e) =>
  ({ "Al día": "text-emerald-600", Completado: "text-blue-600", "Revisión pendiente": "text-amber-600", Observado: "text-red-600" }[e] || "text-slate-500");

export const puntoEstado = (e) =>
  ({ "Al día": "bg-emerald-500", Completado: "bg-blue-600", "Revisión pendiente": "bg-amber-500", Observado: "bg-red-500" }[e] || "bg-slate-400");

/* Alumnos del docente que inició sesión (GET /api/docentes/{id}) */
export function useMisAlumnos() {
  const usuario = JSON.parse(localStorage.getItem("user") || "{}");
  const id = usuario.id_usuario ?? usuario.id;
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API}/docentes/${id}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Error ${res.status} al cargar tus alumnos`);
      setAlumnos((data.alumnos ?? []).map((a) => ({ ...a, hrs: Number(a.hrs) || 0 })));
    } catch (e) {
      setError(e.message);
    }
    setCargando(false);
  };

  useEffect(() => {
    if (id) cargar();
    else { setError("No se encontró tu usuario. Vuelve a iniciar sesión."); setCargando(false); }
  }, [id]);

  return { alumnos, cargando, error, recargar: cargar };
}

/* Encabezado igual al de "Mis Alumnos Asignados" */
export function Cabecera({ titulo, subtitulo, pill, t }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
        <p className={`text-sm ${t.suave}`}>{subtitulo}</p>
      </div>
      {pill && <span className={`rounded-xl px-4 py-2 text-sm font-semibold ${t.pill}`}>{pill}</span>}
    </div>
  );
}

/* Estados de carga y de error */
export function EstadoCarga({ cargando, error, onReintentar, t }) {
  if (cargando) return <div className={`${t.tarjeta} px-6 py-16 text-center text-sm ${t.suave}`}>Cargando información…</div>;
  if (error) {
    return (
      <div className={`${t.tarjeta} px-6 py-14 text-center`}>
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button onClick={onReintentar} className={`mt-3 cursor-pointer rounded-lg border px-4 py-2 text-xs font-medium ${t.boton}`}>Reintentar</button>
      </div>
    );
  }
  return null;
}