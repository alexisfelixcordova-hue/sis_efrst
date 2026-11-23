import React, { useState, useEffect, useMemo, useCallback } from "react";
import ListaEstudiantesRevision from "../Calificar/ListarEstudiantesRevision";
import DetalleRevisionEstudiante from "./DetalleRevisionEstudiante";

const obtenerIdEstudiante = (est) => {
  if (!est || typeof est !== "object") return null;
  return (
    est.id ??
    est.id_estudiante ??
    est.estudiante_id ??
    est.id_expediente ??
    null
  );
};

const normalizarDatosAsignacion = (est) => {
  if (!est || typeof est !== "object") return null;

  const estObj = est.estudiante && typeof est.estudiante === "object" ? est.estudiante : {};
  const expObj = est.expediente && typeof est.expediente === "object" ? est.expediente : {};
  const asigObj = est.asignacion && typeof est.asignacion === "object" ? est.asignacion : {};

  const empresaReal =
    asigObj.empresa ||
    asigObj.empresa_nombre ||
    expObj.empresa ||
    expObj.empresa_nombre ||
    estObj.empresa ||
    est.empresa ||
    est.empresa_nombre ||
    "";

  const ubicacionReal =
    asigObj.ubicacion ||
    asigObj.direccion ||
    expObj.ubicacion ||
    expObj.direccion ||
    estObj.ubicacion ||
    est.ubicacion ||
    "";

  const asesorReal =
    asigObj.asesor ||
    asigObj.docente_asesor ||
    expObj.asesor ||
    expObj.docente_asesor ||
    estObj.asesor ||
    est.asesor ||
    est.docente_asesor ||
    "";

  return {
    ...estObj,
    ...expObj,
    ...asigObj,
    ...est,
    id: obtenerIdEstudiante(est),
    id_estudiante: est.id_estudiante ?? estObj.id_estudiante ?? est.id ?? null,
    id_modulo: est.id_modulo ?? expObj.id_modulo ?? asigObj.id_modulo ?? est.modulo_id ?? null,
    empresa: empresaReal,
    ubicacion: ubicacionReal,
    asesor: asesorReal,
    docente_asesor: asesorReal,
    horas_requeridas:
      est.horas_requeridas ?? expObj.horas_requeridas ?? asigObj.horas_requeridas ?? 160,
  };
};

export function CalificarEstudiante({
  setVista,
  estudianteInicial = null,
  usuario = null,
  darkMode = false,
}) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [seleccionadoId, setSeleccionadoId] = useState(() =>
    obtenerIdEstudiante(estudianteInicial)
  );
  const [estudianteActivoDirecto, setEstudianteActivoDirecto] = useState(() =>
    estudianteInicial ? normalizarDatosAsignacion(estudianteInicial) : null
  );
  const [avisoGlobal, setAvisoGlobal] = useState(null);

  useEffect(() => {
    const idInicial = obtenerIdEstudiante(estudianteInicial);
    if (idInicial !== null) {
      setSeleccionadoId(idInicial);
      setEstudianteActivoDirecto(normalizarDatosAsignacion(estudianteInicial));
      setAvisoGlobal(null);
    }
  }, [estudianteInicial]);

  const setEstudiantesConPreservacion = useCallback((actualizador) => {
    setEstudiantes((prev) => {
      const siguiente =
        typeof actualizador === "function" ? actualizador(prev) : actualizador;
      if (!Array.isArray(siguiente)) return prev;

      return siguiente.map((item) => {
        const idItem = obtenerIdEstudiante(item);
        const anterior = prev.find((p) => String(obtenerIdEstudiante(p)) === String(idItem));
        return normalizarDatosAsignacion({
          ...anterior,
          ...item,
        });
      });
    });
  }, []);

  const seleccionado = useMemo(() => {
    if (seleccionadoId === null || seleccionadoId === undefined) return null;

    const desdeLista = estudiantes.find(
      (e) => String(obtenerIdEstudiante(e)) === String(seleccionadoId)
    );

    const baseInicial =
      estudianteActivoDirecto &&
      String(obtenerIdEstudiante(estudianteActivoDirecto)) === String(seleccionadoId)
        ? estudianteActivoDirecto
        : estudianteInicial &&
          String(obtenerIdEstudiante(estudianteInicial)) === String(seleccionadoId)
        ? normalizarDatosAsignacion(estudianteInicial)
        : null;

    if (desdeLista && baseInicial) {
      return normalizarDatosAsignacion({
        ...baseInicial,
        ...desdeLista,
        empresa: desdeLista.empresa || baseInicial.empresa,
        ubicacion: desdeLista.ubicacion || baseInicial.ubicacion,
        asesor: desdeLista.asesor || baseInicial.asesor,
        docente_asesor: desdeLista.docente_asesor || baseInicial.docente_asesor,
        horas_requeridas:
          desdeLista.horas_requeridas ?? baseInicial.horas_requeridas,
      });
    }

    return desdeLista || baseInicial;
  }, [seleccionadoId, estudiantes, estudianteActivoDirecto, estudianteInicial]);

  if (!seleccionado) {
    return (
      <ListaEstudiantesRevision
        estudiantes={estudiantes}
        setEstudiantes={setEstudiantesConPreservacion}
        onSeleccionarEstudiante={(est) => {
          const normalizado = normalizarDatosAsignacion(est);
          setEstudianteActivoDirecto(normalizado);
          setSeleccionadoId(obtenerIdEstudiante(normalizado));
          setAvisoGlobal(null);
        }}
        setVista={setVista}
        usuario={usuario}
        darkMode={darkMode}
        avisoExterno={avisoGlobal}
      />
    );
  }

  return (
    <DetalleRevisionEstudiante
      estudiante={seleccionado}
      setEstudiantes={setEstudiantesConPreservacion}
      onVolver={() => {
        setSeleccionadoId(null);
        setEstudianteActivoDirecto(null);
      }}
      onGuardadoExitoso={(msg) => {
        setAvisoGlobal({ tipo: "ok", mensaje: msg });
        window.dispatchEvent(new CustomEvent("expediente:actualizado"));
      }}
      setVista={setVista}
      usuario={usuario}
      darkMode={darkMode}
    />
  );
}

export default CalificarEstudiante;