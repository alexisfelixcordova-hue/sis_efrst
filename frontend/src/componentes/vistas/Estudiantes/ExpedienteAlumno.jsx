import { useState, useEffect } from "react";
import CabeceraExpediente from "./componentes/CabeceraExpediente";
import ResumenAlumno from "./componentes/ResumenAlumno";
import DatosPersonales, { sinVacios } from "./componentes/DatosPersonales";

const API = "http://localhost:8000/api"; // mismo valor que en App.jsx

const cabeceras = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function ExpedienteAlumno({ estudiante, onVolver, darkMode = false }) {
  // `estudiante` es la fila en la que se hizo clic en la lista (datos parciales)
  const idEstudiante = estudiante?.id_estudiante ?? estudiante?.id;

  const [detalle, setDetalle] = useState(null); // datos completos desde Laravel
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");

  // Quien está usando el sistema (guardado al iniciar sesión)
  const usuario = JSON.parse(localStorage.getItem("user") || "{}");
  const esAdmin = usuario.id_rol === 1;

  const cargar = async () => {
    setCargando(true);
    setAviso("");
    try {
      const res = await fetch(`${API}/estudiantes/${idEstudiante}`, { headers: cabeceras() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      setDetalle(data.data ?? data.estudiante ?? data);
    } catch (e) {
      // No bloqueamos la pantalla: seguimos mostrando los datos de la lista
      setAviso(`No se pudo actualizar la información desde el servidor (${e.message}).`);
    }
    setCargando(false);
  };

  // Se vuelve a cargar solo cuando cambia el alumno seleccionado
  useEffect(() => {
    setDetalle(null);
    if (idEstudiante) cargar();
    else setCargando(false);
  }, [idEstudiante]);

  // TEMPORAL: para ver qué campos manda realmente Laravel. Bórralo cuando todo se vea bien.
  useEffect(() => {
    if (detalle) console.log("[Expediente] fila de la lista:", estudiante, "| detalle API:", detalle);
  }, [detalle]);

  // Mostramos de inmediato lo que ya tenemos y lo completamos con lo del servidor.
  // sinVacios evita que un null del servidor borre un dato que ya teníamos de la lista.
  const datos = { ...sinVacios(estudiante), ...sinVacios(detalle) };

  const guardarDatos = async (cambios) => {
    const res = await fetch(`${API}/estudiantes/${idEstudiante}`, {
      method: "PUT",
      headers: cabeceras(),
      body: JSON.stringify(cambios),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errores = data.errors ? Object.values(data.errors).flat().join(" ") : "";
      throw new Error(errores || data.message || "No se pudo guardar");
    }
    await cargar(); // vuelve a leer para ver los datos nuevos
  };

  if (!estudiante) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-slate-500">No hay un estudiante seleccionado.</p>
        {onVolver && (
          <button onClick={onVolver} className="font-semibold text-blue-600 hover:text-blue-700">
            Volver a estudiantes
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CabeceraExpediente
        estudiante={datos}
        onVolver={onVolver}
        darkMode={darkMode}
        puedeAsignar={false /* cámbialo a esAdmin cuando exista la asignación de docente */}
      />

      {aviso && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          {aviso}{" "}
          <button onClick={cargar} className="font-semibold underline">Reintentar</button>
        </p>
      )}

      <div
        className={`grid items-start gap-4 transition-opacity lg:grid-cols-[300px_1fr] ${
          cargando && !detalle ? "opacity-60" : "opacity-100"
        }`}
      >
        <ResumenAlumno estudiante={datos} darkMode={darkMode} />
        <DatosPersonales
          estudiante={datos}
          darkMode={darkMode}
          puedeEditar={esAdmin}
          onGuardar={guardarDatos}
        />
      </div>
    </div>
  );
}