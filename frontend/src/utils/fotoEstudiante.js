import api from "../api/axios.js";

const objetoPersona = (persona) => persona?.estudiante || persona?.alumno || persona || {};

export const resolverFotoEstudiante = (persona) => {
  const personaInterna = objetoPersona(persona);
  const valor =
    personaInterna.foto_url ||
    personaInterna.foto ||
    personaInterna.foto_perfil ||
    personaInterna.avatar ||
    persona?.foto_url ||
    persona?.foto ||
    persona?.foto_perfil ||
    persona?.avatar ||
    "";
  if (typeof valor !== "string" || !valor.trim()) return "";

  const foto = valor.trim();
  if (/^(https?:|data:|blob:)/i.test(foto)) return foto;

  const origen = String(api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${origen}/${foto.replace(/^\/+/, "")}`;
};

export const inicialesEstudiante = (persona) => {
  const estudiante = objetoPersona(persona);
  const nombres =
    estudiante.nombres ||
    estudiante.nombre ||
    estudiante.nombre_completo ||
    estudiante.nombreCompleto ||
    estudiante.name ||
    "";
  const apellidos = estudiante.apellidos || "";
  const partes = `${nombres} ${apellidos}`.trim().split(/\s+/).filter(Boolean);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase() || "?";
};
