
import { useState, useEffect } from "react";
import {
  Search,
  Building2,
  Users,
  Clock,
  TrendingUp,
  MapPin,
  BriefcaseBusiness
} from "lucide-react";
import {
  tema,
  Cabecera,
  iniciales,
  puntoEstado,
  HORAS_TOTALES
} from "../Docente/componentes/DocenteComun";

const STORAGE_KEY = "empresas_asignadas_demo";

const datosIniciales = [
  {
    dni: "72845163",
    nombre: "Carlos Mendoza Flores",
    entidad: "WORLDNIC S.A.C.",
    estado: "En proceso",
    hrs: 320,
    cargo: "Desarrollador Web"
  },
  {
    dni: "74125896",
    nombre: "María Fernanda Torres",
    entidad: "WORLDNIC S.A.C.",
    estado: "En proceso",
    hrs: 410,
    cargo: "Diseñadora UI/UX"
  },
  {
    dni: "71963254",
    nombre: "José Antonio Rojas",
    entidad: "Tech Solutions Perú",
    estado: "Completado",
    hrs: 500,
    cargo: "Soporte Técnico"
  },
  {
    dni: "73698521",
    nombre: "Andrea Lucía Vargas",
    entidad: "Tech Solutions Perú",
    estado: "En proceso",
    hrs: 275,
    cargo: "Desarrolladora Frontend"
  },
  {
    dni: "75214869",
    nombre: "Luis Alberto Castillo",
    entidad: "Innovatec Digital",
    estado: "Pendiente",
    hrs: 120,
    cargo: "Analista de Sistemas"
  },
  {
    dni: "76852314",
    nombre: "Valeria Sánchez Ruiz",
    entidad: "Innovatec Digital",
    estado: "En proceso",
    hrs: 350,
    cargo: "Diseñadora Web"
  },
  {
    dni: "72589631",
    nombre: "Diego Ramírez Peña",
    entidad: "Grupo Empresarial Andino",
    estado: "En proceso",
    hrs: 200,
    cargo: "Asistente de Sistemas"
  },
  {
    dni: "74852136",
    nombre: "Camila Herrera Díaz",
    entidad: "Grupo Empresarial Andino",
    estado: "Completado",
    hrs: 500,
    cargo: "Desarrolladora Java"
  }
];

function obtenerDatos() {
  try {
    const guardados = localStorage.getItem(STORAGE_KEY);

    if (guardados) {
      return JSON.parse(guardados);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(datosIniciales));
    return datosIniciales;
  } catch {
    return datosIniciales;
  }
}

export default function EmpresasAsignadas({ darkMode }) {
  const d = !!darkMode;
  const t = tema(d);

  const [alumnos, setAlumnos] = useState(obtenerDatos);
  const [q, setQ] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alumnos));
  }, [alumnos]);

  const mapa = new Map();

  alumnos.forEach((alumno) => {
    const nombre = (alumno.entidad || "").trim() || "Sin entidad registrada";

    if (!mapa.has(nombre)) {
      mapa.set(nombre, []);
    }

    mapa.get(nombre).push(alumno);
  });

  const empresas = [...mapa.entries()]
    .map(([nombre, lista]) => {
      const horas = lista.reduce((total, alumno) => total + alumno.hrs, 0);
      const promedio = lista.length
        ? Math.round(horas / lista.length / HORAS_TOTALES * 100)
        : 0;

      return {
        nombre,
        lista,
        promedio,
        horas
      };
    })
    .filter((empresa) =>
      empresa.nombre.toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => b.lista.length - a.lista.length);

  const totalPracticantes = alumnos.length;

  const totalHoras = alumnos.reduce(
    (total, alumno) => total + alumno.hrs,
    0
  );

  const completados = alumnos.filter(
    (alumno) => alumno.estado === "Completado"
  ).length;

  const porcentaje = totalPracticantes
    ? Math.round((completados / totalPracticantes) * 100)
    : 0;

  const tarjeta = d
    ? "bg-[#172337] border border-slate-700/70"
    : "bg-white border border-slate-200";

  const textoSecundario = d ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`space-y-6 text-sm ${t.texto}`}>

      <Cabecera
        t={t}
        titulo="Empresas Asignadas"
        subtitulo="Consulta las entidades donde tus alumnos realizan sus prácticas profesionales."
        pill={`Total Empresas: ${mapa.size}`}
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Empresas registradas</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <Building2 size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{mapa.size}</p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Entidades colaboradoras
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Practicantes</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <Users size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{totalPracticantes}</p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Alumnos asignados
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Horas acumuladas</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Clock size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">
            {totalHoras.toLocaleString("es-PE")}
          </p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Horas de prácticas registradas
          </p>
        </div>

        <div className={`${tarjeta} rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <span className={textoSecundario}>Prácticas completadas</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{porcentaje}%</p>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            {completados} de {totalPracticantes} practicantes
          </p>
        </div>

      </div>

      {/* Buscador */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

        <div>
          <h2 className="text-base font-bold">Directorio de empresas</h2>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Entidades y practicantes vinculados
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search
            size={17}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textoSecundario}`}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar empresa..."
            className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${t.entrada}`}
          />
        </div>

      </div>

      {/* Empresas */}
      {empresas.length === 0 ? (

        <div className={`${tarjeta} rounded-2xl px-6 py-16 text-center`}>
          <Building2 size={38} className={`mx-auto mb-3 ${textoSecundario}`} />
          <h3 className="font-semibold">No se encontraron empresas</h3>
          <p className={`mt-1 text-xs ${textoSecundario}`}>
            Intenta con otro nombre de empresa.
          </p>
        </div>

      ) : (

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {empresas.map((empresa) => (

            <article
              key={empresa.nombre}
              className={`${tarjeta} rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
            >

              {/* Cabecera de empresa */}
              <div className="flex items-start gap-3">

                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                  d
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                }`}>
                  <Building2 size={23} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-[15px]">
                    {empresa.nombre}
                  </h3>

                  <div className={`mt-1 flex items-center gap-1.5 text-xs ${textoSecundario}`}>
                    <MapPin size={12} />
                    Entidad colaboradora
                  </div>
                </div>

              </div>

              {/* Información */}
              <div className={`mt-5 grid grid-cols-2 gap-3 border-y py-4 ${t.borde}`}>

                <div>
                  <div className={`flex items-center gap-1.5 text-xs ${textoSecundario}`}>
                    <Users size={14} />
                    Practicantes
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {empresa.lista.length}
                  </p>
                </div>

                <div>
                  <div className={`flex items-center gap-1.5 text-xs ${textoSecundario}`}>
                    <Clock size={14} />
                    Horas acumuladas
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {empresa.horas.toLocaleString("es-PE")}
                  </p>
                </div>

              </div>

              {/* Progreso */}
              <div className="mt-4">

                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-xs ${textoSecundario}`}>
                    Avance promedio
                  </span>
                  <span className="text-xs font-bold text-blue-500">
                    {empresa.promedio}%
                  </span>
                </div>

                <div className={`h-2 overflow-hidden rounded-full ${d ? "bg-slate-700" : "bg-slate-100"}`}>
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, empresa.promedio)}%`
                    }}
                  />
                </div>

              </div>

              {/* Practicantes */}
              <div className="mt-5">

                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold">
                    Practicantes asignados
                  </h4>
                  <span className={`text-[11px] ${textoSecundario}`}>
                    {empresa.lista.length} registrados
                  </span>
                </div>

                <ul className="space-y-3">

                  {empresa.lista.map((alumno) => (

                    <li
                      key={alumno.dni}
                      className="flex items-center gap-2.5"
                    >

                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        d
                          ? "bg-slate-700 text-slate-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {iniciales(alumno.nombre)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">
                          {alumno.nombre}
                        </p>
                        <p className={`truncate text-[11px] ${textoSecundario}`}>
                          {alumno.cargo}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          title={alumno.estado}
                          className={`h-2 w-2 rounded-full ${puntoEstado(alumno.estado)}`}
                        />
                        <span className={`text-[10px] ${textoSecundario}`}>
                          {alumno.estado}
                        </span>
                      </div>

                    </li>

                  ))}

                </ul>

              </div>

              {/* Pie */}
              <div className={`mt-5 flex items-center justify-between border-t pt-3 ${t.borde}`}>
                <span className={`flex items-center gap-1.5 text-[11px] ${textoSecundario}`}>
                  <BriefcaseBusiness size={13} />
                  Prácticas profesionales
                </span>
                <span className="text-[11px] font-semibold text-blue-500">
                  {empresa.lista.length} alumnos
                </span>
              </div>

            </article>

          ))}

        </div>

      )}

      <p className={`text-center text-[11px] ${textoSecundario}`}>
        Datos de demostración almacenados localmente en este navegador.
      </p>

    </div>
  );
}
