import { useState, useEffect, useRef } from "react";
import perfilDefault from "../../../assets/perfil.jpg"; // ← ajustado: el archivo ahora está una carpeta más adentro
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

const API = "http://localhost:8000/api"; // ← mismo valor que en App.jsx
const BASE_URL = "http://localhost:8000";

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
  "w-full h-[27px] pl-[9px] pr-[28px] border border-[#e4e8ef] rounded-[9px] bg-white font-medium text-[8.5px] text-slate-900 outline-none appearance-none truncate focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 read-only:cursor-default";

function Fila({ l, v, link }) {
  return (
    <div className="flex items-center justify-between h-[22px] px-[12px] text-[7px]">
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

const resolverUrlFoto = (fotoValor) => {
  if (!fotoValor || typeof fotoValor !== "string") return "";
  const limpio = fotoValor.trim();
  if (!limpio) return "";
  if (
    limpio.startsWith("http://") ||
    limpio.startsWith("https://") ||
    limpio.startsWith("data:") ||
    limpio.startsWith("blob:")
  ) {
    return limpio;
  }
  const rutaLimpia = limpio.startsWith("/") ? limpio : `/${limpio}`;
  return `${BASE_URL}${rutaLimpia}`;
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

export default function Perfil({ foto = "/images/perfil.jpg", usuario, onGuardar }) {
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
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${API}/perfil`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((payload) => {
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
      .catch((e) => console.warn("No se pudo cargar el perfil:", e));
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
    setFotoPerfil(previewLocal);
    setSinFoto(false);
    setSubiendoFoto(true);
    setEstado("Subiendo foto...");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("foto", archivo);

      const endpointFoto = idUsuarioActual
        ? `${API}/usuarios/${idUsuarioActual}/foto`
        : `${API}/perfil/foto`;

      const res = await fetch(endpointFoto, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errores = data.errors ? Object.values(data.errors).flat().join(" ") : "";
        throw new Error(errores || data.message || "No se pudo guardar la foto en el servidor");
      }

      const rutaGuardada = data.foto_perfil || data.foto_url || data.data?.foto_perfil || previewLocal;
      setFotoPerfil(rutaGuardada);
      setSinFoto(false);

      notificarUsuarioActualizado({
        id_usuario: idUsuarioActual,
        foto_perfil: rutaGuardada,
        foto: rutaGuardada,
      });

      setEstado("Foto de perfil actualizada");
    } catch (err) {
      setEstado(err.message || "Vista previa cargada (revisa el endpoint de foto)");
    } finally {
      setSubiendoFoto(false);
      e.target.value = "";
      setTimeout(() => setEstado(""), 4000);
    }
  };

  const guardar = async () => {
    setEstado("Guardando...");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
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

      const res = await fetch(`${API}/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errores = data.errors ? Object.values(data.errors).flat().join(" ") : "";
        throw new Error(errores || data.message || "No se pudo guardar");
      }

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
    <div className="[zoom:1.5] font-['Plus_Jakarta_Sans',Inter,system-ui,sans-serif] text-[7.5px] text-slate-800 bg-[#f8f9fc] min-h-full px-[14px] pt-[6px] pb-[20px]">
      <input
        ref={inputFotoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={seleccionarFoto}
        className="hidden"
      />

      {/* barra superior */}
      <div className="flex items-center justify-between h-[20px] mb-[16px]">
        <div className="flex items-center gap-[10px] text-[7.5px] text-slate-500">
          Mi Perfil Institucional <b className="font-bold text-slate-800">ACTIVO</b>
        </div>
        {estado && <span className="ml-auto mr-[10px] text-[7.5px] text-slate-600">{estado}</span>}
        <button type="button" onClick={guardar} className="flex items-center gap-[6px] h-[20px] px-[12px] bg-white border border-[#e5e9f0] rounded-[8px] text-[7.5px] font-semibold shadow-sm cursor-pointer">
          <Save size={9} /> Guardar Cambios
        </button>
      </div>

      {/* cabecera */}
      <section className={`${tarjeta} rounded-[14px] overflow-hidden`}>
        <div className="relative h-[66px] bg-gradient-to-r from-[#f1f5f9] via-[#e9eef9] to-[#f5f7fc]">
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            className="absolute top-[8px] right-[12px] flex items-center gap-[4px] px-[7px] py-[3px] rounded-[6px] bg-white/60 text-[7px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <ImageIcon size={8} /> Cambiar Portada
          </button>
        </div>

        <div className="flex items-start px-[18px]">
          <div
            onClick={() => inputFotoRef.current?.click()}
            title="Haz clic para cambiar tu foto de perfil"
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

          <div className="ml-[15px] pt-[8px]">
            <div className="flex items-center gap-[14px] h-[16px]">
              <span className="text-[8px] font-semibold text-slate-800">{datos.nombres} {datos.apellidos}</span>
              <span className="flex items-center gap-[4px] text-[7.2px] text-slate-700"><BadgeCheck size={9} /> {datos.cargo}</span>
              <span className="text-[7.2px] text-slate-700">ID: #{idUsuarioActual ? `ADM-2026-${idUsuarioActual}` : "ADM-2026-001"}</span>
            </div>
            <div className="flex items-center gap-[14px] h-[16px]">
              <span className="flex items-center gap-[4px] text-[7.2px] text-slate-700"><GraduationCap size={9} /> IESTP "Andrés Avelino Cáceres Dorregaray"</span>
              <span className="flex items-center gap-[4px] text-[7.2px] text-slate-700"><Mail size={9} /> {datos.correo}</span>
            </div>
          </div>

          <div className="ml-auto mt-[17px] flex gap-[28px]">
            <button
              type="button"
              disabled={subiendoFoto}
              onClick={() => inputFotoRef.current?.click()}
              className="flex items-center gap-[6px] text-[7.2px] text-slate-700 hover:text-blue-600 cursor-pointer disabled:opacity-60"
            >
              <Camera size={9} /> {subiendoFoto ? "Subiendo..." : "Actualizar Foto"}
            </button>
            <button type="button" className="flex items-center gap-[6px] text-[7.2px] text-slate-700 cursor-pointer"><Contact size={9} /> Credencial Digital</button>
          </div>
        </div>

        <nav className="flex gap-[16px] px-[16px] mt-[12px]">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-[6px] h-[28px] px-[2px] text-[7.5px] border-b-2 cursor-pointer ${
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
          <div className="flex items-start gap-[15px]">
            <aside className={`${tarjeta} shrink-0 w-[203px] rounded-[12px] pb-[10px]`}>
              <div className="flex items-center gap-[8px] pt-[17px] px-[21px] pb-[10px]">
                <Contact size={12} />
                <div className="leading-[10px]">
                  <p className="text-[6.8px] text-slate-700">Rol Institucional</p>
                  <span className="text-[6.8px] font-semibold text-slate-900">{datos.cargo}</span>
                </div>
                <strong className="ml-auto text-[7.5px] font-bold text-slate-900">Activo</strong>
              </div>
              <Fila l="Rol Principal" v={datos.cargo} />
              <Fila l="Nivel" v="Sistema EFSRT" link />
              <Fila l="Área Académica" v="Diseño y Programación Web" />
              <Fila l="Fecha de Afiliación" v="2026" />
              <div className="flex items-center gap-[6px] h-[34px] mx-[12px] mt-[6px] pt-[10px] border-t border-[#eef1f6] text-[7px] font-semibold">
                <ShieldCheck size={11} /> Estado de Verificación <b className="ml-auto font-bold text-green-600">Auditado</b>
              </div>
            </aside>

            <section className={`${tarjeta} flex-1 min-w-0 mt-[0px] rounded-[12px] pt-[6px] px-[16px] pb-[18px]`}>
              <div className="flex items-center justify-between min-h-[44px] pl-[8px]">
                <div className="flex items-center gap-[6px]">
                  <UserCog size={16} />
                  <div className="max-w-[150px]">
                    <strong className="block text-[7.5px] font-semibold text-slate-900">Información Personal y Académica</strong>
                    <p className="mt-[1px] text-[6.8px] leading-[10px] text-slate-500">Actualiza los datos del expediente docente y directivo oficial</p>
                  </div>
                </div>
                <div className="flex items-center gap-[22px]">
                  <button
                    type="button"
                    onClick={() => setEditando(!editando)}
                    className={`flex items-center gap-[6px] w-[54px] text-left text-[6.8px] leading-[10px] cursor-pointer ${editando ? "text-blue-600" : "text-slate-500"}`}
                  >
                    <Pencil size={9} /> <span>Editar Datos</span>
                  </button>
                  <div className="text-[6.8px] leading-[10px] font-bold text-slate-900">
                    SISTEMA<span className="block text-blue-600">Conectado</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-[12px] gap-y-[10px] mt-[21px]">
                {CAMPOS.map(({ k, label, icon: Icon, select }) => (
                  <div key={k}>
                    <label htmlFor={`pf-${k}`} className="block h-[10px] leading-[10px] mb-[5px] text-[6.8px] font-semibold text-slate-700">{label}</label>
                    <div className="relative">
                      {select ? (
                        <select id={`pf-${k}`} value={datos[k]} onChange={cambiar(k)} disabled={!editando} className={campo}>
                          {SEDES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      ) : (
                        <input id={`pf-${k}`} value={datos[k]} onChange={cambiar(k)} readOnly={!editando} className={campo} />
                      )}
                      <Icon size={10} className="absolute right-[8px] top-[9px] pointer-events-none text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="[zoom:0.6667]">
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