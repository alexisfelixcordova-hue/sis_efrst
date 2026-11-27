import api from "../api/axios.js";

const origenApi = String(api.defaults.baseURL || "").replace(/\/api\/?$/, "");

export const resolverUrlFotoUsuario = (usuario) => {
  const valor =
    typeof usuario === "string"
      ? usuario
      : usuario?.foto_perfil || usuario?.foto || usuario?.avatar || "";
  if (typeof valor !== "string" || !valor.trim()) return "";

  const foto = valor.trim();
  if (/^(https?:|data:|blob:)/i.test(foto)) return foto;
  return `${origenApi}/${foto.replace(/^\/+/, "")}`;
};
