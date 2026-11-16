import { useState, useEffect } from "react";
import perfil from "../../../assets/perfil.jpg"; // ← ajustado: el archivo ahora está una carpeta más adentro
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

export default function Perfil({ foto = "/images/perfil.jpg", usuario, onGuardar }) {
  const storageData = JSON.parse(localStorage.getItem('user') || '{}');
  const userActive = usuario || storageData.user || storageData;

  const [datos, setDatos] = useState({
    nombres: userActive?.nombres || userActive?.nombre || "Usuario",
    apellidos: userActive?.apellidos || "",
    dni: userActive?.dni || "47892154",
    cargo: userActive?.id_rol === 1 ? "Administrador General" : userActive?.id_rol === 2 ? "Docente Evaluador" : "Coordinador EFSRT",
    correo: userActive?.correo || "correo@iestpacd.edu.pe",
    correoPersonal: userActive?.correoPersonal || "alexisfelix.dev@gmail.com",
    telefono: userActive?.telefono || "+51 976 137 483",
    sede: SEDES[0],
  });

  const [tab, setTab] = useState("info");
  const [editando, setEditando] = useState(false);
  const [sinFoto, setSinFoto] = useState(false);
  const [estado, setEstado] = useState(""); // mensaje de guardado

  // Si hay token, trae el perfil real desde Laravel (GET /perfil) y lo guarda para el Navbar
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/perfil`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ data }) => {
        const { contrasena_hash, ...u } = data;
        localStorage.setItem("user", JSON.stringify(u));
        window.dispatchEvent(new Event("user-updated"));
        setDatos((d) => ({
          ...d,
          nombres: u.nombres ?? d.nombres,
          apellidos: u.apellidos ?? d.apellidos,
          dni: u.dni ?? d.dni,
          correo: u.correo ?? d.correo,
          telefono: u.telefono ?? d.telefono,
          cargo: u.id_rol === 1 ? "Administrador General" : u.id_rol === 2 ? "Docente Evaluador" : d.cargo,
        }));
      })
      .catch((e) => console.warn("No se pudo cargar el perfil:", e));
  }, []);

  const cambiar = (k) => (e) => setDatos({ ...datos, [k]: e.target.value });
  const guardar = async () => {
    setEstado("Guardando...");
    try {
      const res = await fetch(`${API}/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          dni: datos.dni,
          correo: datos.correo,
          telefono: datos.telefono,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errores = data.errors ? Object.values(data.errors).flat().join(" ") : "";
        throw new Error(errores || data.message || "No se pudo guardar");
      }
      // Actualiza el usuario guardado y avisa al Navbar
      const { contrasena_hash, ...usuarioNuevo } = data.data;
      const actual = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...actual, ...usuarioNuevo }));
      window.dispatchEvent(new Event("user-updated"));
      onGuardar?.(datos);
      setEditando(false);
      setEstado("Cambios guardados");
    } catch (err) {
      setEstado(err.message);
    }
    setTimeout(() => setEstado(""), 4000);
  };

  const inicialesAvatar = `${datos.nombres.charAt(0)}${datos.apellidos ? datos.apellidos.charAt(0) : ''}`.toUpperCase();

  return (
    <div className="[zoom:1.5] font-['Plus_Jakarta_Sans',Inter,system-ui,sans-serif] text-[7.5px] text-slate-800 bg-[#f8f9fc] min-h-full px-[14px] pt-[6px] pb-[20px]">
      {/* barra superior */}
      <div className="flex items-center justify-between h-[20px] mb-[16px]">
        <div className="flex items-center gap-[10px] text-[7.5px] text-slate-500">
          Mi Perfil Institucional <b className="font-bold text-slate-800">ACTIVO</b>
        </div>
        {estado && <span className="ml-auto mr-[10px] text-[7.5px] text-slate-600">{estado}</span>}
        <button onClick={guardar} className="flex items-center gap-[6px] h-[20px] px-[12px] bg-white border border-[#e5e9f0] rounded-[8px] text-[7.5px] font-semibold shadow-sm cursor-pointer">
          <Save size={9} /> Guardar Cambios
        </button>
      </div>

      {/* cabecera */}
      <section className={`${tarjeta} rounded-[14px] overflow-hidden`}>
        <div className="relative h-[66px] bg-gradient-to-r from-[#f1f5f9] via-[#e9eef9] to-[#f5f7fc]">
          <button className="absolute top-[8px] right-[12px] flex items-center gap-[4px] px-[7px] py-[3px] rounded-[6px] bg-white/60 text-[7px] font-semibold text-slate-400 cursor-pointer">
            <ImageIcon size={8} /> Cambiar Portada
          </button>
        </div>

        <div className="flex items-start px-[18px]">
          <div className="relative shrink-0 w-[56px] h-[56px] -mt-[23px] rounded-[10px] border-2 border-white bg-slate-300 shadow-md">
            {sinFoto ? (
              <span className="flex w-full h-full items-center justify-center rounded-[8px] text-[14px] font-bold text-slate-600">{inicialesAvatar}</span>
            ) : (
              <img src={perfil} alt="Foto de perfil" onError={() => setSinFoto(true)} className="w-full h-full object-cover rounded-[8px]" />
            )}
            <i className="absolute -right-[3px] -bottom-[3px] w-[10px] h-[10px] rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div className="ml-[15px] pt-[8px]">
            <div className="flex items-center gap-[14px] h-[16px]">
              <span className="text-[8px] font-semibold text-slate-800">{datos.nombres} {datos.apellidos}</span>
              <span className="flex items-center gap-[4px] text-[7.2px] text-slate-700"><BadgeCheck size={9} /> {datos.cargo}</span>
              <span className="text-[7.2px] text-slate-700">ID: #{userActive?.id ? `ADM-2026-${userActive.id}` : 'ADM-2026-001'}</span>
            </div>
            <div className="flex items-center gap-[14px] h-[16px]">
              <span className="flex items-center gap-[4px] text-[7.2px] text-slate-700"><GraduationCap size={9} /> IESTP "Andrés Avelino Cáceres Dorregaray"</span>
              <span className="flex items-center gap-[4px] text-[7.2px] text-slate-700"><Mail size={9} /> {datos.correo}</span>
            </div>
          </div>

          <div className="ml-auto mt-[17px] flex gap-[28px]">
            <button className="flex items-center gap-[6px] text-[7.2px] text-slate-700 cursor-pointer"><Camera size={9} /> Actualizar Foto</button>
            <button className="flex items-center gap-[6px] text-[7.2px] text-slate-700 cursor-pointer"><Contact size={9} /> Credencial Digital</button>
          </div>
        </div>

        <nav className="flex gap-[16px] px-[16px] mt-[12px]">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
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
          // Las pestañas nuevas usan tamaños normales; este zoom compensa el [zoom:1.5] del contenedor.
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