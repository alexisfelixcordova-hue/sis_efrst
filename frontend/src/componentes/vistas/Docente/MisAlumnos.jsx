import React, { useEffect, useState } from 'react';

export default function MisAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Función para obtener los alumnos asignados al docente autenticado
  const obtenerMisAlumnos = async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      // Puedes ajustar el endpoint según la ruta que manejes en tu API para filtrar por docente
      const res = await fetch(`http://localhost:8000/api/estudiantes?search=${busqueda}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setAlumnos(data.data.data || data.data);
      }
    } catch (error) {
      console.error("Error al cargar los alumnos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerMisAlumnos();
  }, [busqueda]);

  return (
    <div className="p-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Alumnos Asignados</h1>
          <p className="text-sm text-slate-500">Supervisa el avance, datos de contacto y estado de tus practicantes.</p>
        </div>
        <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
          Total Alumnos: <span className="font-bold">{alumnos.length}</span>
        </div>
      </div>

      {/* Contenedor principal con buscador y tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-5">
          <input
            type="text"
            placeholder="Buscar por DNI, nombres o apellidos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full md:w-96 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Tabla de alumnos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4">Apellidos y Nombres</th>
                <th className="py-3 px-4">Programa de Estudios</th>
                <th className="py-3 px-4">Semestre</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Cargando alumnos...
                  </td>
                </tr>
              ) : alumnos.length > 0 ? (
                alumnos.map((alumno) => (
                  <tr key={alumno.id_estudiante || alumno.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{alumno.dni}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {alumno.apellidos ? `${alumno.apellidos}, ${alumno.nombres}` : alumno.nombres}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{alumno.programa_estudios || 'Diseño y Programación Web'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{alumno.semestre || 'VI Semestre'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{alumno.correo || 'S/C'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                        {alumno.estado || 'En progreso'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No se encontraron alumnos registrados o asignados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}