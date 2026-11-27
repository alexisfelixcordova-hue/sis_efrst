import { useEffect, useState } from "react";

const CLAVE_MODULO_SISTEMA = "modulo_sistema_activo";
const EVENTO_MODULO_SISTEMA = "modulo_sistema_cambiado";

export const normalizarNombreModulo = (nombre = "") =>
  String(nombre)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bpalicaciones\b/gi, "Aplicaciones")
    .replace(/\bmoviles\b/gi, "Móviles")
    .replace(/\bintegracion\b/gi, "Integración");

export const claveCanonicaModulo = (nombre = "") =>
  normalizarNombreModulo(nombre)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const leerModuloSistema = () => {
  try {
    const modulo = JSON.parse(localStorage.getItem(CLAVE_MODULO_SISTEMA) || "null");
    return modulo && typeof modulo === "object" ? modulo : null;
  } catch {
    return null;
  }
};

export const publicarModuloSistema = (modulo) => {
  const valor =
    modulo && typeof modulo === "object"
      ? {
          id_modulo: modulo.id_modulo ?? modulo.id,
          numero_modulo: modulo.numero_modulo ?? modulo.numero,
          nombre_modulo: normalizarNombreModulo(
            modulo.nombre_modulo ?? modulo.nombre ?? modulo.modulo_nombre ?? ""
          ),
        }
      : { id_modulo: null, numero_modulo: null, nombre_modulo: "", all: true };

  try {
    localStorage.setItem(CLAVE_MODULO_SISTEMA, JSON.stringify(valor));
  } catch (error) {
    console.error("No se pudo guardar el módulo activo:", error);
  }

  window.dispatchEvent(
    new CustomEvent(EVENTO_MODULO_SISTEMA, { detail: valor })
  );
};

export const useModuloSistema = () => {
  const [modulo, setModulo] = useState(leerModuloSistema);

  useEffect(() => {
    const sincronizar = (event) => {
      setModulo(event?.detail ?? leerModuloSistema());
    };
    window.addEventListener(EVENTO_MODULO_SISTEMA, sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO_MODULO_SISTEMA, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  return modulo;
};
