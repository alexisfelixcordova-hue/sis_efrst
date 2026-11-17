import React from "react";
import {
  LayoutDashboard,
  User,
  FileText,
  GraduationCap,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ClipboardCheck,
  Building2,
  BarChart3,
  Award,
  ExternalLink,
  UserPlus,
  UserCheck,
  Sparkles,
  FolderKanban,
  StickyNote,
  Folder,
  Contact,
  Calendar,
  FileCheck2,
} from "lucide-react";

// Recibimos 'usuario' directamente como prop desde la BD (vía App.jsx)
function Sidebar({ darkMode, vistaActual, onCambiarVista, onCerrarSesion, usuario }) {
  
  // Normalizamos el id_rol que viene directamente de la base de datos
  const idRol = Number(usuario?.id_rol || 0);

  // Validación estricta basada en la BD (1 = Administrador, 2 = Docente)
  const esAdmin = idRol === 1;
  const esDocente = idRol === 2;

  // ==========================================
  // MENÚ PRINCIPAL DEL ADMINISTRADOR (id_rol === 1)
  // ==========================================
  const menuAdminPrincipal = [
    { nombre: "Dashboard", icono: LayoutDashboard },
    { nombre: "Perfil", icono: User },
    { nombre: "Constancias", icono: FileText },
    { nombre: "Empresas", icono: Building2 },
    { nombre: "Estudiantes", icono: GraduationCap },
    { nombre: "Asesores", icono: Users },
    { nombre: "Reportes", icono: BarChart3 },
  ];

  // ==========================================
  // MENÚ PRINCIPAL DEL DOCENTE (id_rol === 2)
  // Nota: 'nombre' se ajusta a "Mis Alumnos" para conectar con App.jsx y la vista creada
  // ==========================================
  const menuDocentePrincipal = [
    { nombre: "Dashboard", icono: LayoutDashboard },
    { nombre: "Perfil", icono: User },
    { nombre: "Mis Alumnos", icono: GraduationCap },
    { nombre: "Revisión de Expedientes", icono: FileCheck2 },
    { nombre: "Evaluación de Evidencias", icono: ClipboardCheck },
    { nombre: "Empresas Asignadas", icono: Building2 },
    { nombre: "Reportes", icono: BarChart3 },
  ];

  // Selección estricta del menú según la BD
  const menuPrincipal = esAdmin ? menuAdminPrincipal : menuDocentePrincipal;

  // SECCIÓN: GESTIÓN DE USUARIOS (Estrictamente Administrador)
  const menuUsuarios = [
    { nombre: "Crear Usuario", icono: UserPlus, tipo: "vista" },
    { nombre: "Lista de Usuarios", icono: UserCheck, tipo: "vista" },
  ];

  // SECCIÓN: APPS Y UTILIDADES ADICIONALES (Compartido)
  const menuApps = [
    { nombre: "Projects", icono: FolderKanban, tipo: "vista" },
    { nombre: "Notas", icono: StickyNote, tipo: "vista" },
    { nombre: "File Manager", icono: Folder, tipo: "vista" },
    { nombre: "Contacts", icono: Contact, tipo: "vista" },
    { nombre: "Calendario", icono: Calendar, tipo: "vista" },
  ];

  // SECCIÓN: INSTITUCIÓN & ENLACES EXTERNOS
  const menuInstitucion = [
    {
      nombre: "ESTP Andrés Avelino",
      icono: ShieldCheck,
      tipo: "enlaceExterno",
      url: "https://institutocajas.edu.pe/",
    },
    {
      nombre: "Titulación",
      icono: Award,
      tipo: "enlaceExterno",
      url: "https://institutocajas.edu.pe/documentos-de-gestion/",
    },
  ];

  return (
    <aside
      className={`w-64 shrink-0 min-h-screen ${
        darkMode
          ? "bg-[#1e293b] border-gray-700/80 text-gray-300"
          : "bg-white border-gray-200/70 text-gray-600"
      } border-r flex flex-col p-4 select-none transition-all duration-300`}
    >
      {/* BRAND / LOGO */}
      <div className="flex items-center justify-between pb-4 pt-1 px-2 border-b border-gray-200/50 dark:border-gray-700/50 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 transition-transform duration-300 hover:rotate-6">
            <Sparkles className="w-5 h-5 text-sky-500 animate-pulse" />
          </div>
          <span className="font-extrabold tracking-tight text-base truncate">
            <span className={darkMode ? "text-white" : "text-slate-900"}>WORLD</span>
            <span className="text-sky-500">NIC</span>
          </span>
        </div>
      </div>

      {/* MENÚ NAVEGABLE */}
      <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
        {/* MENÚ PRINCIPAL */}
        <ul className="space-y-1">
          {menuPrincipal.map((item) => {
            const Icono = item.icono;
            const isActive = vistaActual === item.nombre;

            return (
              <li key={item.nombre}>
                <button
                  type="button"
                  onClick={() => onCambiarVista(item.nombre)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ease-out outline-none cursor-pointer hover:translate-x-1 ${
                    isActive
                      ? darkMode
                        ? "bg-slate-800 text-white font-semibold shadow-sm"
                        : "bg-slate-100 text-gray-900 font-semibold shadow-sm"
                      : darkMode
                      ? "hover:bg-slate-800/60 text-gray-400 hover:text-gray-200"
                      : "hover:bg-gray-100/80 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icono
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isActive ? (darkMode ? "text-white" : "text-gray-900") : "text-gray-400"
                      }`}
                    />
                    <span className="truncate">{item.nombre}</span>
                  </div>

                  <ChevronRight
                    className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                      isActive ? (darkMode ? "text-white" : "text-gray-900") : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        {/* GESTIÓN DE USUARIOS (SOLO ADMINISTRADOR: id_rol === 1) */}
        {esAdmin && (
          <div className="pt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-1.5 opacity-80">
              USUARIOS & ACCESOS
            </span>

            <ul className="space-y-1">
              {menuUsuarios.map((item) => {
                const Icono = item.icono;
                const isActive = vistaActual === item.nombre;

                return (
                  <li key={item.nombre}>
                    <button
                      type="button"
                      onClick={() => onCambiarVista(item.nombre)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ease-out outline-none cursor-pointer hover:translate-x-1 ${
                        isActive
                          ? darkMode
                            ? "bg-slate-800 text-white font-semibold shadow-sm"
                            : "bg-slate-100 text-gray-900 font-semibold shadow-sm"
                          : darkMode
                          ? "hover:bg-slate-800/60 text-gray-400 hover:text-gray-200"
                          : "hover:bg-gray-100/80 text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icono
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? (darkMode ? "text-white" : "text-gray-900") : "text-gray-400"
                          }`}
                        />
                        <span className="truncate">{item.nombre}</span>
                      </div>

                      <ChevronRight
                        className={`w-3 h-3 shrink-0 ${
                          isActive ? (darkMode ? "text-white" : "text-gray-900") : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* APPS Y UTILIDADES */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-1.5 opacity-80">
            APPS
          </span>

          <ul className="space-y-1">
            {menuApps.map((item) => {
              const Icono = item.icono;
              const isActive = vistaActual === item.nombre;

              return (
                <li key={item.nombre}>
                  <button
                    type="button"
                    onClick={() => onCambiarVista(item.nombre)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ease-out outline-none cursor-pointer hover:translate-x-1 ${
                      isActive
                        ? darkMode
                          ? "bg-slate-800 text-white font-semibold shadow-sm"
                          : "bg-slate-100 text-gray-900 font-semibold shadow-sm"
                        : darkMode
                        ? "hover:bg-slate-800/60 text-gray-400 hover:text-gray-200"
                        : "hover:bg-gray-100/80 text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icono
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? (darkMode ? "text-white" : "text-gray-900") : "text-gray-400"
                        }`}
                      />
                      <span className="truncate">{item.nombre}</span>
                    </div>

                    <ChevronRight
                      className={`w-3 h-3 shrink-0 ${
                        isActive ? (darkMode ? "text-white" : "text-gray-900") : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* INSTITUCIÓN */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-1.5 opacity-80">
            INSTITUCIÓN
          </span>

          <ul className="space-y-1">
            {menuInstitucion.map((item) => {
              const Icono = item.icono;

              return (
                <li key={item.nombre}>
                  <button
                    type="button"
                    onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ease-out outline-none cursor-pointer hover:translate-x-1 ${
                      darkMode
                        ? "hover:bg-slate-800/60 text-gray-400 hover:text-gray-200"
                        : "hover:bg-gray-100/80 text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icono className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{item.nombre}</span>
                    </div>

                    <ExternalLink className="w-3 h-3 text-gray-400 shrink-0 transition-transform duration-200 hover:scale-125" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* CERRAR SESIÓN */}
      <div className={`pt-3 mt-2 border-t ${darkMode ? "border-gray-700/80" : "border-gray-100"}`}>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-1">
          LOGOUT
        </span>

        <button
          type="button"
          onClick={onCerrarSesion}
          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-red-500 transition-all duration-200 outline-none cursor-pointer hover:translate-x-1 ${
            darkMode ? "hover:bg-red-950/30" : "hover:bg-red-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 transition-transform duration-200 hover:-rotate-12" />
            <span>Cerrar sesión</span>
          </div>

          <ChevronRight className="w-3 h-3 text-red-300" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;