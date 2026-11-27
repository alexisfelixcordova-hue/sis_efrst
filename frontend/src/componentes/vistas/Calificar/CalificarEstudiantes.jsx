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
  const idModulo =
    est.id_modulo ??
    estObj.id_modulo ??
    expObj.id_modulo ??
    asigObj.id_modulo ??
    est.modulo_id ??
    null;
  const nombreModulo =
    est.modulo_nombre ||
    est.nombre_modulo ||
    est.modulo ||
    estObj.modulo_nombre ||
    expObj.nombre_modulo ||
    asigObj.modulo_nombre ||
    "";
  const modulosExistentes =
    est.modulos || estObj.modulos || expObj.modulos || asigObj.modulos;
  const modulos =
    Array.isArray(modulosExistentes) && modulosExistentes.length
      ? modulosExistentes
      : idModulo !== null && nombreModulo
        ? [
            {
              id_modulo: idModulo,
              numero_modulo:
                est.numero_modulo ?? expObj.numero_modulo ?? idModulo,
              nombre_modulo: nombreModulo,
              id_expediente: est.id_expediente ?? expObj.id_expediente ?? null,
              docente_asignado: asesorReal || "Docente no asignado",
              empresa: empresaReal || "Empresa no registrada",
              horas_acumuladas: est.horas_acumuladas ?? 0,
              horas_requeridas: est.horas_requeridas ?? 160,
              nota: est.nota ?? null,
              adjuntado: Boolean(est.adjuntado_expediente || est.calificado),
            },
          ]
        : [];

  return {
    ...estObj,
    ...expObj,
    ...asigObj,
    ...est,
    id: obtenerIdEstudiante(est),
    id_estudiante: est.id_estudiante ?? estObj.id_estudiante ?? est.id ?? null,
    id_modulo: idModulo,
    modulos,
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

  if (!Array.isArray(seleccionado.modulos) || seleccionado.modulos.length === 0) {
    return (
      <div className={`mx-auto max-w-xl rounded-2xl border p-6 text-center ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}>
        <h2 className="text-lg font-semibold">No hay un módulo asignado</h2>
        <p className="mt-2 text-sm text-slate-500">
          Este estudiante no tiene un módulo asociado a tu asignación. No se puede registrar una calificación sin ese vínculo.
        </p>
        <button
          type="button"
          onClick={() => {
            setSeleccionadoId(null);
            setEstudianteActivoDirecto(null);
          }}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Volver a mis alumnos
        </button>
      </div>
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
      usuario={usuario}
      darkMode={darkMode}
    />
  );
}

export default CalificarEstudiante;