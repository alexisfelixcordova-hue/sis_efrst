import { useState, useEffect, useCallback } from "react";

import Navbar from "./componentes/Layout/Navbar.jsx";
import Sidebar from "./componentes/Layout/Sidebar.jsx";

import Dashboard from "./componentes/vistas/Dashboard.jsx";
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

const API = "http://localhost:8000/api";

const obtenerToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("access_token");

const limpiarAlmacenamientoSesion = () => {
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

function App() {
  const [vista, setVista] = useState("Dashboard");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [origenExpediente, setOrigenExpediente] = useState("Estudiantes");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [constanciaSeleccionada, setConstanciaSeleccionada] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [autenticado, setAutenticado] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [usuarioBD, setUsuarioBD] = useState(null);

  const consultarPerfilBD = async (tokenOverride = null) => {
    const token = tokenOverride || obtenerToken();
    if (!token) return null;

    const res = await fetch(`${API}/perfil`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !data.data) {
      return null;
    }

    setUsuarioBD(data.data);
    localStorage.setItem("user", JSON.stringify(data.data));
    notificarCambioUsuario();
    return data.data;
  };

  useEffect(() => {
    const verificarSesionBD = async () => {
      const token = obtenerToken();

      if (!token) {
        setAutenticado(false);
        setUsuarioBD(null);
        setCargandoSesion(false);
        return;
      }

      try {
        const perfil = await consultarPerfilBD(token);
        if (perfil) {
          setAutenticado(true);
        } else {
          limpiarAlmacenamientoSesion();
          setUsuarioBD(null);
          notificarCambioUsuario();
          setAutenticado(false);
        }
      } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        limpiarAlmacenamientoSesion();
        setUsuarioBD(null);
        notificarCambioUsuario();
        setAutenticado(false);
      } finally {
        setCargandoSesion(false);
      }
    };

    verificarSesionBD();
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

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
  };

  const abrirFichaDocente = (docente) => {
    setDocenteSeleccionado(docente);
    setVista("Ficha Docente");
  };

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

  useEffect(() => {
    const alAbrirExpedienteAlumno = (e) => {
      if (e?.detail) {
        abrirFichaEstudiante(e.detail, "Constancias");
      }
    };

    window.addEventListener("expediente-alumno:abrir", alAbrirExpedienteAlumno);
    return () => window.removeEventListener("expediente-alumno:abrir", alAbrirExpedienteAlumno);
  }, [abrirFichaEstudiante]);

  const abrirVistaConstancia = (estudiante) => {
    setConstanciaSeleccionada(estudiante);
    setVista("Vista Constancia PDF");
  };

  const cerrarSesion = () => {
    const token = obtenerToken();

    if (token) {
      fetch(`${API}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }).catch(() => {});
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
      case "Dashboard":
        return (
          <Dashboard
            setVista={setVista}
            setEstudiante={setEstudianteSeleccionado}
            usuario={usuarioBD}
            darkMode={darkMode}
          />
        );

      case "Empresas":
        return <Empresas />;

      case "Perfil":
        return (
          <Credenciales
            estudiante={estudianteSeleccionado}
            usuario={usuarioBD}
          />
        );

      case "Revisiones":
      case "Revisión de Expedientes":
        return <RevisionExpedientes darkMode={darkMode} />;

      case "Reportes":
        return <Reportes darkMode={darkMode} />;

      case "Estudiantes":
        return (
          <Estudiantes
            onVerEstudiante={(est) => abrirFichaEstudiante(est, "Estudiantes")}
            onNuevoEstudiante={() => console.log("Nuevo estudiante")}
          />
        );

      case "Mis Alumnos":
      case "MisAlumnos":
        return <MisAlumnos darkMode={darkMode} />;

      case "Evaluación de Evidencias":
        return <EvaluacionEvidencias darkMode={darkMode} />;

      case "Calificar Estudiante":
      case "CalificarEstudiante":
        return (
          <CalificarEstudiante
            setVista={setVista}
            estudianteInicial={estudianteSeleccionado}
            usuario={usuarioBD}
            darkMode={darkMode}
          />
        );

      case "Empresas Asignadas":
        return <EmpresasAsignadas darkMode={darkMode} />;

      case "Asesores":
        return (
          <PlantelDocente
            onVerFicha={abrirFichaDocente}
            darkMode={darkMode}
          />
        );

      case "Ficha Docente":
        return (
          <FichaDocente
            docente={docenteSeleccionado}
            onVolver={() => setVista("Asesores")}
            darkMode={darkMode}
          />
        );

      case "Ficha Estudiante":
        return (
          <Estudiantes
            estudianteSeleccionado={estudianteSeleccionado}
            onVerEstudiante={(est) => abrirFichaEstudiante(est, "Estudiantes")}
          />
        );

      case "Constancias":
        return (
          <Constancias
            estudiante={constanciaSeleccionada}
            onSeleccionarEstudiante={(est) => abrirFichaEstudiante(est, "Constancias")}
            onVerConstancia={abrirVistaConstancia}
          />
        );

      case "Vista Constancia PDF":
        return (
          <VistaConstanciaPDF
            estudiante={constanciaSeleccionada}
            onVolver={() => setVista("Constancias")}
          />
        );

      case "Expediente Alumno":
        return (
          <ExpedienteAlumno
            key={estudianteSeleccionado?._refresco || estudianteSeleccionado?.id_estudiante || "exp"}
            estudiante={estudianteSeleccionado}
            onVolver={() => setVista(origenExpediente || "Estudiantes")}
            darkMode={darkMode}
          />
        );

      case "Usuarios":
      case "Lista de Usuarios":
      case "ListaUsuario":
        return (
          <ListaUsuario
            onIrCrear={() => setVista("AgregarUsuario")}
          />
        );

      case "AgregarUsuario":
      case "Crear Usuario":
        return (
          <AgregarUsuario
            onVolver={() => setVista("Usuarios")}
          />
        );

      case "Notas":
        return <Notas darkMode={darkMode} />;

      case "Calendario":
        return <Calendario darkMode={darkMode} />;

      case "Projects":
      case "Proyectos":
        return <Projects darkMode={darkMode} />;

      case "File Manager":
      case "Archivos":
        return <FileManager darkMode={darkMode} />;

      case "Contacts":
      case "Contactos":
        return <Contacts darkMode={darkMode} />;

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
            Sincronizando con WORLDNIC...
          </p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <Login
        onLogin={async (datos) => {
          const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              correo: datos.correo ?? datos.email ?? datos.usuario,
              password: datos.password ?? datos.contrasena,
            }),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data.success) {
            throw new Error(data.message || "Credenciales incorrectas");
          }

          if (data.access_token) {
            if (datos.recordar !== false) {
              localStorage.setItem("token", data.access_token);
              localStorage.setItem("access_token", data.access_token);
            } else {
              sessionStorage.setItem("token", data.access_token);
              sessionStorage.setItem("access_token", data.access_token);
            }
          }

          return data;
        }}
        onExito={async (dataLogin) => {
          const token = dataLogin?.access_token || obtenerToken();
          const perfilBD = await consultarPerfilBD(token);

          if (!perfilBD && dataLogin?.user) {
            setUsuarioBD(dataLogin.user);
            localStorage.setItem("user", JSON.stringify(dataLogin.user));
            notificarCambioUsuario();
          }

          setAutenticado(true);
        }}
      />
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        darkMode
          ? "bg-[#0f172a] text-white"
          : "bg-[#f5f8fc] text-[#172b4d]"
      }`}
    >
      <Sidebar
        vistaActual={vista}
        onCambiarVista={cambiarVista}
        darkMode={darkMode}
        onCerrarSesion={cerrarSesion}
        usuario={usuarioBD}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          usuario={usuarioBD}
          onIrPerfil={() => cambiarVista("Perfil")}
          onIrAjustes={() => cambiarVista("Perfil")}
          onCerrarSesion={cerrarSesion}
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          {renderizarVista()}
        </main>
      </div>

      <Asistente />
    </div>
  );
}

export default App;