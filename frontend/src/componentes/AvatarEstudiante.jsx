import { useState } from "react";
import {
  inicialesEstudiante,
  resolverFotoEstudiante,
} from "../utils/fotoEstudiante.js";

export default function AvatarEstudiante({
  estudiante,
  className = "h-10 w-10 rounded-full",
  fallbackClassName = "",
  fallbackStyle,
  alt,
}) {
  const [fotoFallida, setFotoFallida] = useState("");
  const foto = resolverFotoEstudiante(estudiante);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={fallbackStyle}
    >
      {foto && fotoFallida !== foto ? (
        <img
          src={foto}
          alt={alt || inicialesEstudiante(estudiante)}
          loading="lazy"
          decoding="async"
          onError={() => setFotoFallida(foto)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}
        >
          {inicialesEstudiante(estudiante)}
        </span>
      )}
    </span>
  );
}
