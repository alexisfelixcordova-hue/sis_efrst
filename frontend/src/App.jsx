import { useState, useEffect, useCallback } from "react";

import Navbar from "./componentes/Layout/Navbar.jsx";
import Sidebar from "./componentes/Layout/Sidebar.jsx";

import Dashboard from "./componentes/vistas/Dashboard.jsx";
import DashboardDocente from "./componentes/vistas/Docente/DashboardDocente.jsx";
import Estudiantes from "./componentes/vistas/Estudiantes/Estudiantes.jsx";
import ExpedienteAlumno from "./componentes/vistas/Estudiantes/ExpedienteAlumno.jsx";

import PlantelDocente from "./componentes/vistas/Docente/Planteldocente.jsx";
import FichaDocente from "./componentes/vistas/Docente/Fichadocente.jsx";
import MisAlumnos from "./componentes/vistas/Docente/MisAlumnos.jsx";
import CalificarEstudiante from "./componentes/vistas/Calificar/CalificarEstudiantes.jsx";

import Constancias from "./componentes/vistas/Constancias/Constancias.jsx";
import VistaConstanciaPDF from "./componentes/vistas/Constancias/VistaConstanciaPDF.jsx";
import Credenciales from "./componentes/vistas/Credenciales/Credenciales.jsx";

import Login from "./componentes/Logout/Login.jsx";
import Notfound from "./componentes/Error/404.jsx";

import Asistente from "./componentes/vistas/Asistente/Asistente.jsx";
import Empresas from "./componentes/vistas/Empresa/Empresas.jsx";
import EmpresasAsignadas from "./componentes/vistas/Empresa/EmpresasAsignadas.jsx";
import Reportes from "./componentes/vistas/Reportes/Reportes.jsx";

import AgregarUsuario from "./componentes/Users/AgregarUsuario.jsx";
import ListaUsuario from "./componentes/Users/ListaUsuario.jsx";

import RevisionExpedientes from "./componentes/vistas/Revisiones/RevisionExpedientes.jsx";
import EvaluacionEvidencias from "./componentes/vistas/Evidencias/EvaluacionEvidencias.jsx";

// Apps
import Calendario from "./componentes/Apps/Calendario/Calendario.jsx";
import Notas from "./componentes/Apps/Notas/Notas.jsx";
import Projects from "./componentes/Apps/Projects/Projects.jsx";
import FileManager from "./componentes/Apps/FileManager/FileManager.jsx";
import Contacts from "./componentes/Apps/Contacts/Contacts.jsx";
import api, { clearApiCache, precargarDatosBase } from "./api/axios.js";

const obtenerToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("access_token");

const limpiarAlmacenamientoSesion = () => {
  clearApiCache();
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("access_token");
  sessionStorage.clear();
};

const notificarCambioUsuario = () => {
  window.dispatchEvent(new Event("usuario_actualizado"));
  window.dispatchEvent(new Event("user-updated"));
};

const obtenerModoOscuroInicial = () => {
  try {
    const modo = localStorage.getItem("tema_modo");
    if (modo === "oscuro") return true;
    if (modo === "sistema") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
  } catch {
    return false;
  }
  return false;
};

function App() {
  const [vista, setVista] = useState("Dashboard");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [origenExpediente, setOrigenExpediente] = useState("Estudiantes");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [constanciaSeleccionada, setConstanciaSeleccionada] = useState(null);
  const [darkMode, setDarkMode] = useState(obtenerModoOscuroInicial);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const [autenticado, setAutenticado] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [usuarioBD, setUsuarioBD] = useState(null);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("dark", darkMode);
    raiz.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    if (!menuMovilAbierto) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setMenuMovilAbierto(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [menuMovilAbierto]);

  useEffect(() => {
    const token = obtenerToken();
    if (token) {
      api.post("/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch((error) => {
        console.error("No se pudo cerrar la sesión anterior:", error);
      });
    }

    limpiarAlmacenamientoSesion();
  }, []);

  useEffect(() => {
    const sincronizarDesdeStorage = () => {
      try {
        const rawUser = JSON.parse(localStorage.getItem("user") || "null");
        setUsuarioBD(rawUser && typeof rawUser === "object" ? rawUser : null);
      } catch {
        setUsuarioBD(null);
      }
    };

    window.addEventListener("usuario_actualizado", sincronizarDesdeStorage);
    window.addEventListener("user-updated", sincronizarDesdeStorage);
    return () => {
      window.removeEventListener("usuario_actualizado", sincronizarDesdeStorage);
      window.removeEventListener("user-updated", sincronizarDesdeStorage);
    };
  }, []);

  const cambiarVista = useCallback((nuevaVista) => {
    if (!nuevaVista) return;
    setVista(nuevaVista);
    setMenuMovilAbierto(false);
  }, []);

  const abrirFichaDocente = useCallback((docente) => {
    if (!docente) return;
    setDocenteSeleccionado({
      ...docente,
      _refresco: docente._refresco || Date.now(),
    });
    setVista("Ficha Docente");
  }, []);

  const abrirFichaEstudiante = useCallback((estudiante, origen = null) => {
    if (!estudiante) return;
    if (origen) {
      setOrigenExpediente(origen);
    }
    setEstudianteSeleccionado({
      ...estudiante,
      _refresco: estudiante._refresco || Date.now(),
    });
    setVista("Expediente Alumno");
  }, []);

  const buscarGlobal = useCallback(async (termino) => {
    const { data } = await api.get("/buscar-global", {
      params: { q: termino },
    });
    return Array.isArray(data) ? data : [];
  }, []);

  useEffect(() => {
    const alAbrirExpedienteAlumno = (e) => {
      if (e?.detail) {
        abrirFichaEstudiante(e.detail, "Constancias");
      }
    };

    window.addEventListener("expediente-alumno:abrir", alAbrirExpedienteAlumno);
    return () => window.removeEventListener("expediente-alumno:abrir", alAbrirExpedienteAlumno);
  }, [abrirFichaEstudiante]);

  const abrirVistaConstancia = useCallback((estudiante) => {
    setConstanciaSeleccionada(estudiante);
    setVista("Vista Constancia PDF");
  }, []);

  const cerrarSesion = () => {
    const token = obtenerToken();

    if (token) {
      api.post("/logout").catch((error) => {
        console.error("No se pudo cerrar la sesión en el servidor:", error);
      });
    }

    limpiarAlmacenamientoSesion();

    setEstudianteSeleccionado(null);
    setOrigenExpediente("Estudiantes");
    setDocenteSeleccionado(null);
    setConstanciaSeleccionada(null);
    setVista("Dashboard");
    setUsuarioBD(null);
    setAutenticado(false);
    notificarCambioUsuario();
  };

  const renderizarVista = () => {
    switch (vista) {
      case "Dashboard": {
        const rolId = Number(usuarioBD?.id_rol ?? usuarioBD?.rol_id);
        const rolNombre = String(
          usuarioBD?.rol_nombre ?? usuarioBD?.rol ?? usuarioBD?.role ?? ""
        );
        const esDocente =
          rolId === 2 || (rolId !== 1 && /docente|asesor/i.test(rolNombre));

        if (esDocente) {
          return (
            <DashboardDocente
              usuario={usuarioBD}
              darkMode={darkMode}
              setVista={cambiarVista}
              onVerEstudiante={(estudiante) =>
                abrirFichaEstudiante(estudiante, "Mis Alumnos")
              }
            />
          );
        }

        return (
          <Dashboard
            setVista={cambiarVista}
            setEstudiante={(item) => {
              if (!item) return;
              if (item.role || item.especialidad || item.id_docente || item.docente_id) {
                setDocenteSeleccionado(item);
              }
              setEstudianteSeleccionado(item);
            }}
            usuario={usuarioBD}
            darkMode={darkMode}
          />
        );
      }

      case "Empresas":
        return <Empresas darkMode={darkMode} usuario={usuarioBD} setVista={cambiarVista} />;

      case "Perfil":
        return (
          <Credenciales
            estudiante={estudianteSeleccionado}
            usuario={usuarioBD}
            darkMode={darkMode}
          />
        );

      case "Revisiones":
      case "Revisión de Expedientes":
        return (
          <RevisionExpedientes
            darkMode={darkMode}
            usuario={usuarioBD}
            onAbrirExpediente={(estudiante) =>
              abrirFichaEstudiante(estudiante, "Revisión de Expedientes")
            }
          />
        );

      case "Reportes":
        return <Reportes darkMode={darkMode} usuario={usuarioBD} setVista={cambiarVista} />;

      case "Estudiantes":
        return (
          <Estudiantes
            onVerEstudiante={(est) => abrirFichaEstudiante(est, "Estudiantes")}
            onNuevoEstudiante={() => cambiarVista("AgregarUsuario")}
            darkMode={darkMode}
            usuario={usuarioBD}
          />
        );

      case "Mis Alumnos":
      case "MisAlumnos":
        return (
          <MisAlumnos
            darkMode={darkMode}
            usuario={usuarioBD}
            onVerEstudiante={(est) => abrirFichaEstudiante(est, "Mis Alumnos")}
          />
        );

      case "Evaluación de Evidencias":
        return <EvaluacionEvidencias darkMode={darkMode} usuario={usuarioBD} setVista={cambiarVista} />;

      case "Calificar Estudiante":
      case "CalificarEstudiante":
        return (
          <CalificarEstudiante
            setVista={cambiarVista}
            estudianteInicial={estudianteSeleccionado}
            usuario={usuarioBD}
            darkMode={darkMode}
          />
        );

      case "Empresas Asignadas":
        return (
          <EmpresasAsignadas
            darkMode={darkMode}
            usuario={usuarioBD}
            setVista={cambiarVista}
            onAbrirExpediente={(estudiante) =>
              abrirFichaEstudiante(estudiante, "Empresas Asignadas")
            }
          />
        );

      case "Asesores":
      case "Plantel Docente":
      case "Planteldocente":
        return (
          <PlantelDocente
            onVerFicha={abrirFichaDocente}
            setVista={cambiarVista}
            darkMode={darkMode}
            usuario={usuarioBD}
          />
        );

      case "Ficha Docente":
        return (
          <FichaDocente
            key={docenteSeleccionado?._refresco || docenteSeleccionado?.id_docente || docenteSeleccionado?.id || "doc"}
            docente={docenteSeleccionado}
            setVista={cambiarVista}
            setEstudiante={(est) => abrirFichaEstudiante(est, "Ficha Docente")}
            onVolver={() => cambiarVista("Asesores")}
            darkMode={darkMode}
          />
        );

      case "Ficha Estudiante":
        return (
          <Estudiantes
            estudianteSeleccionado={estudianteSeleccionado}
            onVerEstudiante={(est) => abrirFichaEstudiante(est, "Estudiantes")}
            darkMode={darkMode}
            usuario={usuarioBD}
          />
        );

      case "Constancias":
        return (
          <Constancias
            estudiante={constanciaSeleccionada}
            onSeleccionarEstudiante={(est) => abrirFichaEstudiante(est, "Constancias")}
            onVerConstancia={abrirVistaConstancia}
            darkMode={darkMode}
            usuario={usuarioBD}
          />
        );

      case "Vista Constancia PDF":
        return (
          <VistaConstanciaPDF
            estudiante={constanciaSeleccionada}
            onVolver={() => cambiarVista("Constancias")}
            darkMode={darkMode}
          />
        );

      case "Expediente Alumno":
        return (
          <ExpedienteAlumno
            key={estudianteSeleccionado?._refresco || estudianteSeleccionado?.id_estudiante || estudianteSeleccionado?.id || "exp"}
            estudiante={estudianteSeleccionado}
            onVolver={() => cambiarVista(origenExpediente || "Estudiantes")}
            setVista={cambiarVista}
            darkMode={darkMode}
          />
        );

      case "Usuarios":
      case "Lista de Usuarios":
      case "ListaUsuario":
        return (
          <ListaUsuario
            onIrCrear={() => cambiarVista("AgregarUsuario")}
            darkMode={darkMode}
            usuario={usuarioBD}
          />
        );

      case "AgregarUsuario":
      case "Crear Usuario":
        return (
          <AgregarUsuario
            onVolver={() => cambiarVista("Usuarios")}
            darkMode={darkMode}
            usuario={usuarioBD}
          />
        );

      case "Notas":
        return <Notas darkMode={darkMode} usuario={usuarioBD} />;

      case "Calendario":
        return <Calendario darkMode={darkMode} usuario={usuarioBD} />;

      case "Projects":
      case "Proyectos":
        return <Projects darkMode={darkMode} usuario={usuarioBD} />;

      case "File Manager":
      case "Archivos":
        return <FileManager darkMode={darkMode} usuario={usuarioBD} />;

      case "Contacts":
      case "Contactos":
        return <Contacts darkMode={darkMode} usuario={usuarioBD} />;

      default:
        return <Notfound />;
    }
  };

  if (cargandoSesion) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold tracking-wider">
            Cargando los datos principales...
          </p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <Login
        onLogin={async (datos) => {
          const res = await api.post("/login", {
              correo: datos.correo ?? datos.email ?? datos.usuario,
              password: datos.password ?? datos.contrasena,
          });

          const data = res.data;

          if (!data.success) {
            throw new Error(data.message || "Credenciales incorrectas");
          }

          if (data.access_token) {
            clearApiCache();
            sessionStorage.setItem("token", data.access_token);
            sessionStorage.setItem("access_token", data.access_token);
          }

          return data;
        }}
        onExito={async (dataLogin) => {
          setCargandoSesion(true);
          try {
            const usuario = dataLogin?.user;
            if (!usuario) {
              throw new Error("El servidor no devolvió los datos de la cuenta.");
            }

            setUsuarioBD(usuario);
            localStorage.setItem("user", JSON.stringify(usuario));
            notificarCambioUsuario();
            await precargarDatosBase(usuario);
            setAutenticado(true);
          } finally {
            setCargandoSesion(false);
          }
        }}
      />
    );
  }

  return (
    <div
    className={`app-theme-root flex h-dvh w-full overflow-hidden ${
        darkMode
        ? "app-theme-dark bg-[#0f172a] text-white"
          : "bg-[#f5f8fc] text-[#172b4d]"
      }`}
    >
      <Sidebar
        vistaActual={vista}
        onCambiarVista={cambiarVista}
        darkMode={darkMode}
        onCerrarSesion={cerrarSesion}
        usuario={usuarioBD}
        mobileOpen={menuMovilAbierto}
        onClose={() => setMenuMovilAbierto(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          usuario={usuarioBD}
          buscarGlobal={buscarGlobal}
          onVerExpediente={(estudiante) =>
            abrirFichaEstudiante(estudiante, "Búsqueda global")
          }
          onIrPerfil={() => cambiarVista("Perfil")}
          onCambiarVista={cambiarVista}
          onIrAjustes={() => cambiarVista("Perfil")}
          onCerrarSesion={cerrarSesion}
          onOpenMenu={() => setMenuMovilAbierto(true)}
        />

        <main className="app-main-content min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
          {renderizarVista()}
        </main>
      </div>

      <Asistente usuario={usuarioBD} darkMode={darkMode} />
    </div>
  );
}

export default App;