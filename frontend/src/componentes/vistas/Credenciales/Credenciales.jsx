import { useState, useEffect, useRef } from "react";
import perfilDefault from "../../../assets/perfil.jpg"; // ← ajustado: el archivo ahora está una carpeta más adentro
import api from "../../../api/axios.js";
import { resolverUrlFotoUsuario as resolverUrlFoto } from "../../../utils/fotoUsuario.js";
import {
  Save, BadgeCheck, GraduationCap, Mail, Camera, Contact, User, Lock, ShieldCheck,
  Bell, History, Pencil, UserCog, AtSign, MailCheck, Phone, Briefcase, ChevronDown, Image as ImageIcon,
} from "lucide-react";

// ── NUEVO: pestañas ──
import SeguridadAcceso from "./componentes/SeguridadAcceso";
import RolesPermiso from "./componentes/RolesPermiso";
import Notificaciones from "./componentes/Notificaciones";
import HistorialActividad from "./componentes/HistorialActividad";

const TABS = [
  { id: "info", label: "Información Personal", icon: User },
  { id: "seg", label: "Seguridad y Acceso", icon: Lock },
  { id: "roles", label: "Roles y Permisos", icon: ShieldCheck },
  { id: "notif", label: "Notificaciones y Alertas", icon: Bell, badge: 4 },
  { id: "hist", label: "Historial de Actividad", icon: History },
];

const SEDES = ["Campus Central - Av. Los Libertadores", "Sede Norte", "Sede Sur"];

const CAMPOS = [
  { k: "nombres", label: "Nombres", icon: User },
  { k: "apellidos", label: "Apellidos", icon: Contact },
  { k: "dni", label: "DNI / Documento de Identidad", icon: Lock },
  { k: "cargo", label: "Cargo Oficial", icon: Briefcase },
  { k: "correo", label: "Correo Electrónico Institucional", icon: AtSign },
  { k: "correoPersonal", label: "Correo Personal de Respaldo", icon: MailCheck },
  { k: "telefono", label: "Teléfono / Móvil Institucional", icon: Phone },
  { k: "sede", label: "Sede de Operaciones", icon: ChevronDown, select: true },
];

const tarjeta = "bg-white border border-[#e5e9f0]";
const campo =
  "h-10 w-full truncate rounded-[9px] border border-[#e4e8ef] bg-white pl-3 pr-9 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 read-only:cursor-default";

function Fila({ l, v, link }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 px-3 py-2 text-xs">
      <span className={link ? "text-blue-500" : "text-slate-500"}>{l}</span>
      <b className="font-semibold text-slate-900">{v}</b>
    </div>
  );
}

const desempaquetarUsuario = (fuente) => {
  if (!fuente || typeof fuente !== "object") return {};
  return fuente.user || fuente.data || fuente;
};

const esRutaFotoPersistente = (valor) => {
  if (!valor || typeof valor !== "string") return false;
  const limpio = valor.trim();
  if (!limpio || limpio.startsWith("blob:") || limpio.startsWith("data:")) {
    return false;
  }
  return (
    limpio.startsWith("/storage/") ||
    limpio.startsWith("storage/") ||
    limpio.startsWith("http://") ||
    limpio.startsWith("https://")
  );
};

const notificarUsuarioActualizado = (usuarioObj) => {
  try {
    const actual = JSON.parse(localStorage.getItem("user") || "{}");
    const base = desempaquetarUsuario(actual);
    const { contrasena_hash, password, ...limpio } = usuarioObj || {};
    const fusionado = { ...base, ...limpio };
    localStorage.setItem("user", JSON.stringify(fusionado));
    window.dispatchEvent(new Event("usuario_actualizado"));
    window.dispatchEvent(new Event("user-updated"));
  } catch (err) {
    console.warn("No se pudo sincronizar el usuario en localStorage:", err);
  }
};

const obtenerCargoPorRol = (idRol, fallback = "Coordinador EFSRT") => {
  const numRol = Number(idRol);
  if (numRol === 1) return "Administrador General";
  if (numRol === 2) return "Docente Evaluador";
  return fallback;
};

export default function Perfil({ foto = perfilDefault, usuario, onGuardar }) {
  const storageData = JSON.parse(localStorage.getItem("user") || "{}");
  const userActive = desempaquetarUsuario(usuario || storageData);
  const inputFotoRef = useRef(null);

  const [idUsuarioActual, setIdUsuarioActual] = useState(
    userActive?.id_usuario ?? userActive?.id ?? null
  );

  const [datos, setDatos] = useState({
    nombres: userActive?.nombres || userActive?.nombre || userActive?.name || "Usuario",
    apellidos: userActive?.apellidos || "",
    dni: userActive?.dni || "47892154",
    cargo: obtenerCargoPorRol(userActive?.id_rol ?? userActive?.rol_id),
    correo: userActive?.correo || userActive?.email || "correo@iestpacd.edu.pe",
    correoPersonal: userActive?.correoPersonal || userActive?.correo_personal || "alexisfelix.dev@gmail.com",
    telefono: userActive?.telefono || "+51 976 137 483",
    sede: userActive?.sede || SEDES[0],
  });

  const [fotoPerfil, setFotoPerfil] = useState(
    userActive?.foto_perfil || userActive?.foto || foto || perfilDefault
  );
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [tab, setTab] = useState("info");
  const [editando, setEditando] = useState(false);
  const [sinFoto, setSinFoto] = useState(false);
  const [estado, setEstado] = useState("");

  useEffect(() => {
    api.get("/perfil")
      .then(({ data: payload }) => {
        const rawUser = desempaquetarUsuario(payload);
        if (!rawUser || Object.keys(rawUser).length === 0) return;
        const { contrasena_hash, ...u } = rawUser;

        if (u.id_usuario ?? u.id) {
          setIdUsuarioActual(u.id_usuario ?? u.id);
        }

        notificarUsuarioActualizado(u);

        if (u.foto_perfil || u.foto) {
          setFotoPerfil(u.foto_perfil || u.foto);
          setSinFoto(false);
        }

        setDatos((d) => ({
          ...d,
          nombres: u.nombres ?? u.nombre ?? u.name ?? d.nombres,
          apellidos: u.apellidos ?? d.apellidos,
          dni: u.dni ?? d.dni,
          correo: u.correo ?? u.email ?? d.correo,
          correoPersonal: u.correoPersonal ?? u.correo_personal ?? d.correoPersonal,
          telefono: u.telefono ?? d.telefono,
          sede: u.sede ?? d.sede,
          cargo: obtenerCargoPorRol(u.id_rol ?? u.rol_id, d.cargo),
        }));
      })
      .catch((error) => console.warn("No se pudo cargar el perfil:", error));
  }, []);

  const cambiar = (k) => (e) => setDatos({ ...datos, [k]: e.target.value });

  const seleccionarFoto = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!tiposPermitidos.includes(archivo.type)) {
      setEstado("Selecciona una imagen JPG, PNG o WEBP.");
      setTimeout(() => setEstado(""), 4000);
      e.target.value = "";
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setEstado("La imagen no debe superar los 2 MB.");
      setTimeout(() => setEstado(""), 4000);
      e.target.value = "";
      return;
    }

    const previewLocal = URL.createObjectURL(archivo);
    const fotoAnterior = fotoPerfil;
    setFotoPerfil(previewLocal);
    setSinFoto(false);
    setSubiendoFoto(true);
    setEstado("Subiendo foto...");

    try {
      const formData = new FormData();
      formData.append("foto", archivo);

      const endpointFoto = idUsuarioActual
        ? `/usuarios/${idUsuarioActual}/foto`
        : "/perfil/foto";
      const { data } = await api.post(endpointFoto, formData, {
        headers: { Accept: "application/json", "Content-Type": "multipart/form-data" },
      });

      const rutaGuardada = data.foto_perfil || data.data?.foto_perfil;
      if (!rutaGuardada) {
        throw new Error("El servidor no devolvió la ruta de la foto guardada.");
      }
      URL.revokeObjectURL(previewLocal);
      setFotoPerfil(rutaGuardada);
      setSinFoto(false);

      notificarUsuarioActualizado({
        id_usuario: idUsuarioActual,
        foto_perfil: rutaGuardada,
        foto: rutaGuardada,
      });

      setEstado("Foto de perfil actualizada");
    } catch (err) {
      URL.revokeObjectURL(previewLocal);
      setFotoPerfil(fotoAnterior);
      setEstado(
        Object.values(err?.response?.data?.errors || {}).flat()[0] ||
          err?.response?.data?.message ||
          err.message ||
          "No se pudo guardar la foto en el servidor."
      );
    } finally {
      setSubiendoFoto(false);
      e.target.value = "";
      setTimeout(() => setEstado(""), 4000);
    }
  };

  const guardar = async () => {
    setEstado("Guardando...");
    try {
      const cuerpo = {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        dni: datos.dni,
        correo: datos.correo,
        correoPersonal: datos.correoPersonal,
        telefono: datos.telefono,
        sede: datos.sede,
        ...(esRutaFotoPersistente(fotoPerfil) ? { foto_perfil: fotoPerfil } : {}),
      };

      const { data } = await api.put("/perfil", cuerpo);

      const usuarioNuevo = desempaquetarUsuario(data);
      const fotoFinal =
        (esRutaFotoPersistente(usuarioNuevo.foto_perfil) && usuarioNuevo.foto_perfil) ||
        (esRutaFotoPersistente(fotoPerfil) && fotoPerfil) ||
        userActive?.foto_perfil ||
        "";

      if (fotoFinal) {
        setFotoPerfil(fotoFinal);
        setSinFoto(false);
      }

      notificarUsuarioActualizado({
        ...usuarioNuevo,
        nombres: usuarioNuevo.nombres ?? datos.nombres,
        apellidos: usuarioNuevo.apellidos ?? datos.apellidos,
        correo: usuarioNuevo.correo ?? datos.correo,
        telefono: usuarioNuevo.telefono ?? datos.telefono,
        ...(fotoFinal ? { foto_perfil: fotoFinal, foto: fotoFinal } : {}),
      });

      onGuardar?.({ ...datos, ...(fotoFinal ? { foto_perfil: fotoFinal } : {}) });
      setEditando(false);
      setEstado("Cambios guardados");
    } catch (err) {
      setEstado(err.message);
    }
    setTimeout(() => setEstado(""), 4000);
  };

  const inicialesAvatar = `${datos.nombres.charAt(0)}${datos.apellidos ? datos.apellidos.charAt(0) : ""}`.toUpperCase();
  const srcAvatar = !sinFoto ? resolverUrlFoto(fotoPerfil) || perfilDefault : "";

  return (
    <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-[#f8f9fc] px-3 pb-5 pt-2 font-['Plus_Jakarta_Sans',Inter,system-ui,sans-serif] text-xs text-slate-800 sm:px-[14px] sm:pt-[6px]">
      <input
        ref={inputFotoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={seleccionarFoto}
        className="hidden"
      />

      {/* barra superior */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-[16px]">
      <div className="flex items-center gap-2 text-xs text-slate-500">
          Mi Perfil Institucional <b className="font-bold text-slate-800">ACTIVO</b>
        </div>
        {estado && <span className="ml-auto mr-[10px] text-[7.5px] text-slate-600">{estado}</span>}
        <button type="button" onClick={guardar} className="flex min-h-9 items-center gap-2 rounded-lg border border-[#e5e9f0] bg-white px-3 text-xs font-semibold shadow-sm">
          <Save size={14} /> Guardar Cambios
        </button>
      </div>

      {/* cabecera */}
      <section className={`${tarjeta} rounded-[14px] overflow-hidden`}>
        <div className="relative h-[66px] bg-gradient-to-r from-[#f1f5f9] via-[#e9eef9] to-[#f5f7fc]">
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            className="absolute right-3 top-2 flex min-h-8 items-center gap-1 rounded-md bg-white/80 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
          >
            <ImageIcon size={13} /> Cambiar Portada
          </button>
        </div>

        <div className="flex flex-wrap items-start gap-y-2 px-3 sm:px-[18px]">
          <div
            onClick={() => inputFotoRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputFotoRef.current?.click();
              }
            }}
            title="Haz clic para cambiar tu foto de perfil"
            role="button"
            tabIndex={0}
            className="relative shrink-0 w-[56px] h-[56px] -mt-[23px] rounded-[10px] border-2 border-white bg-slate-300 shadow-md cursor-pointer group"
          >
            {sinFoto || !srcAvatar ? (
              <span className="flex w-full h-full items-center justify-center rounded-[8px] text-[14px] font-bold text-slate-600">{inicialesAvatar}</span>
            ) : (
              <img src={srcAvatar} alt="Foto de perfil" onError={() => setSinFoto(true)} className="w-full h-full object-cover rounded-[8px]" />
            )}
            {subiendoFoto && (
              <span className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-slate-900/50 text-[7px] font-semibold text-white">
                ...
              </span>
            )}
            <i className="absolute -right-[3px] -bottom-[3px] w-[10px] h-[10px] rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div className="min-w-0 flex-1 pl-3 pt-2 sm:ml-[15px] sm:pl-0">
            <div className="flex flex-wrap items-center gap-x-[14px] gap-y-1">
              <span className="text-sm font-semibold text-slate-800">{datos.nombres} {datos.apellidos}</span>
              <span className="flex items-center gap-1 text-xs text-slate-700"><BadgeCheck size={14} /> {datos.cargo}</span>
              <span className="text-xs text-slate-700">ID: #{idUsuarioActual ? `ADM-2026-${idUsuarioActual}` : "ADM-2026-001"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-[14px] gap-y-1">
              <span className="flex min-w-0 items-center gap-1 text-xs text-slate-700"><GraduationCap size={14} /> IESTP "Andrés Avelino Cáceres Dorregaray"</span>
              <span className="flex min-w-0 items-center gap-1 text-xs text-slate-700"><Mail size={14} /> {datos.correo}</span>
            </div>
          </div>

          <div className="ml-auto mt-2 flex flex-wrap gap-3 sm:mt-[17px] sm:gap-5">
            <button
              type="button"
              disabled={subiendoFoto}
              onClick={() => inputFotoRef.current?.click()}
              className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-60"
            >
              <Camera size={14} /> {subiendoFoto ? "Subiendo..." : "Actualizar Foto"}
            </button>
            <button type="button" className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-700"><Contact size={14} /> Credencial Digital</button>
          </div>
        </div>

        <nav className="mt-3 flex max-w-full gap-2 overflow-x-auto px-3 sm:gap-4 sm:px-4">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-xs ${
                tab === id ? "text-slate-900 font-semibold border-blue-600" : "text-slate-600 border-transparent"
              }`}
            >
              <Icon size={9} /> {label} {badge && <em className="not-italic font-semibold">{badge}</em>}
            </button>
          ))}
        </nav>
      </section>

      {/* cuerpo */}
      <div className="mt-[14px]">
        {tab === "info" ? (
          <div className="flex min-w-0 flex-col items-stretch gap-3 lg:flex-row lg:items-start lg:gap-[15px]">
            <aside className={`${tarjeta} w-full rounded-xl pb-3 lg:w-[260px] lg:shrink-0`}>
              <div className="flex items-center gap-2 px-4 pb-3 pt-4">
                <Contact size={16} />
                <div className="leading-snug">
                  <p className="text-xs text-slate-700">Rol Institucional</p>
                  <span className="text-sm font-semibold text-slate-900">{datos.cargo}</span>
                </div>
                <strong className="ml-auto text-xs font-bold text-slate-900">Activo</strong>
              </div>
              <Fila l="Rol Principal" v={datos.cargo} />
              <Fila l="Nivel" v="Sistema EFSRT" link />
              <Fila l="Área Académica" v="Diseño y Programación Web" />
              <Fila l="Fecha de Afiliación" v="2026" />
              <div className="mx-3 mt-2 flex min-h-10 items-center gap-2 border-t border-[#eef1f6] pt-2 text-xs font-semibold">
                <ShieldCheck size={15} /> Estado de Verificación <b className="ml-auto font-bold text-green-600">Auditado</b>
              </div>
            </aside>

            <section className={`${tarjeta} min-w-0 flex-1 rounded-xl px-4 pb-5 pt-3 sm:px-5`}>
              <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserCog size={20} />
                  <div className="max-w-xs">
                    <strong className="block text-sm font-semibold text-slate-900">Información Personal y Académica</strong>
                    <p className="mt-1 text-xs leading-snug text-slate-500">Actualiza los datos del expediente docente y directivo oficial</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditando(!editando)}
                    className={`flex min-h-9 items-center gap-1.5 text-left text-xs ${editando ? "text-blue-600" : "text-slate-500"}`}
                  >
                    <Pencil size={14} /> <span>Editar Datos</span>
                  </button>
                  <div className="text-xs font-bold text-slate-900">
                    SISTEMA<span className="block text-blue-600">Conectado</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {CAMPOS.map(({ k, label, icon: Icon, select }) => (
                  <div key={k}>
                    <label htmlFor={`pf-${k}`} className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
                    <div className="relative">
                      {select ? (
                        <select id={`pf-${k}`} value={datos[k]} onChange={cambiar(k)} disabled={!editando} className={campo}>
                          {SEDES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      ) : (
                        <input id={`pf-${k}`} value={datos[k]} onChange={cambiar(k)} readOnly={!editando} className={campo} />
                      )}
                      <Icon size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
            {tab === "seg" && <SeguridadAcceso />}
            {tab === "roles" && <RolesPermiso usuario={{ rol: datos.cargo, nivel: "Sistema EFSRT" }} />}
            {tab === "notif" && <Notificaciones />}
            {tab === "hist" && <HistorialActividad />}
          </div>
        )}
      </div>
    </div>
  );
}