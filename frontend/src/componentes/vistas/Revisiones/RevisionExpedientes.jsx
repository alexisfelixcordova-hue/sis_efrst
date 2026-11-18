
import { Fragment, useState, useEffect } from "react";
import { Search, ChevronRight } from "lucide-react";
import { tema, foco, Cabecera, iniciales } from "../Docente/componentes/DocenteComun.jsx";

const DOCS = [
  "Copia de DNI",
  "Ficha de datos",
  "Carta de presentación",
  "Convenio firmado",
  "Plan de prácticas",
  "Informe final",
];

const OPCIONES = [
  { v: "pendiente", t: "Pendiente", on: "bg-slate-500 text-white" },
  { v: "conforme", t: "Conforme", on: "bg-emerald-600 text-white" },
  { v: "observado", t: "Observado", on: "bg-red-600 text-white" },
];

const FILTROS = ["Todos", "Sin completar", "Con observaciones", "Completos"];

const colorResultado = {
  Completo: "text-emerald-600",
  "En revisión": "text-blue-600",
  "Con observaciones": "text-red-600",
  "Sin revisar": "text-slate-500",
};

const ALUMNOS_INICIALES = [
  {
    dni: "74852136",
    nombre: "Carlos Alberto Mendoza Ruiz",
    entidad: "Municipalidad Provincial",
  },
  {
    dni: "72581469",
    nombre: "María Fernanda Torres López",
    entidad: "Corporación Digital SAC",
  },
  {
    dni: "73692518",
    nombre: "José Luis Ramírez Castro",
    entidad: "Instituto Tecnológico",
  },
  {
    dni: "71483629",
    nombre: "Andrea Valeria Flores Díaz",
    entidad: "Gobierno Regional",
  },
  {
    dni: "75921483",
    nombre: "Diego Sebastián Rojas Pérez",
    entidad: "Servicios Informáticos SAC",
  },
  {
    dni: "70258314",
    nombre: "Lucía Isabel Gutiérrez Soto",
    entidad: "Municipalidad Distrital",
  },
];

const leer = (clave, inicial) => {
  try {
    const datos = JSON.parse(localStorage.getItem(clave));
    return datos ?? inicial;
  } catch {
    return inicial;
  }
};

export default function RevisionExpedientes({ darkMode }) {
  const d = !!darkMode;
  const t = tema(d);

  const [alumnos] = useState(() =>
    leer("docente_revision_alumnos_demo", ALUMNOS_INICIALES)
  );

  const [rev, setRev] = useState(() =>
    leer("docente_expedientes", {})
  );

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("docente_expedientes", JSON.stringify(rev));
    } catch {
      // No se pudo guardar la información local.
    }
  }, [rev]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "docente_revision_alumnos_demo",
        JSON.stringify(alumnos)
      );
    } catch {
      // No se pudo guardar la información local.
    }
  }, [alumnos]);

  const valor = (dni, doc) => rev[dni]?.[doc] || "pendiente";

  const poner = (dni, doc, v) => {
    setRev((p) => ({
      ...p,
      [dni]: {
        ...p[dni],
        [doc]: v,
      },
    }));
  };

  const resumen = (a) => {
    const c = DOCS.filter(
      (x) => valor(a.dni, x) === "conforme"
    ).length;

    const o = DOCS.filter(
      (x) => valor(a.dni, x) === "observado"
    ).length;

    return {
      c,
      o,
      estado:
        c === DOCS.length
          ? "Completo"
          : o
            ? "Con observaciones"
            : c
              ? "En revisión"
              : "Sin revisar",
    };
  };

  const filas = alumnos.map((a) => ({
    a,
    r: resumen(a),
  }));

  const pendientes = filas.filter(
    (f) => f.r.estado !== "Completo"
  ).length;

  const visibles = filas.filter(({ a, r }) => {
    const ok =
      filtro === "Todos" ||
      (filtro === "Completos"
        ? r.estado === "Completo"
        : filtro === "Con observaciones"
          ? r.o > 0
          : r.estado !== "Completo");

    return (
      ok &&
      `${a.nombre} ${a.dni} ${a.entidad}`
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  });

  return (
    <div className={`space-y-5 text-sm ${t.texto}`}>
      <Cabecera
        t={t}
        titulo="Revisión de Expedientes"
        subtitulo="Verifica la documentación que presenta cada practicante."
        pill={`Por completar: ${pendientes}`}
      />

      <section className={`${t.tarjeta} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search
              size={15}
              className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${t.suave}`}
            />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por DNI, nombre o entidad…"
              className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/15 ${t.entrada}`}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                aria-pressed={filtro === f}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${foco} ${
                  filtro === f ? t.chipOn : t.boton
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr
                className={`border-b text-left text-[11px] font-bold uppercase tracking-wider ${t.borde} ${t.th}`}
              >
                <th className="w-8 py-3" />
                <th className="py-3">Alumno</th>
                <th className="py-3">Entidad</th>
                <th className="py-3">Documentos</th>
                <th className="py-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              {visibles.map(({ a, r }) => (
                <Fragment key={a.dni}>
                  <tr
                    onClick={() =>
                      setAbierto(
                        abierto === a.dni ? null : a.dni
                      )
                    }
                    className={`cursor-pointer border-b transition-colors ${t.fila}`}
                  >
                    <td className="py-3.5">
                      <ChevronRight
                        size={15}
                        className={`transition-transform duration-200 ${t.suave} ${
                          abierto === a.dni ? "rotate-90" : ""
                        }`}
                      />
                    </td>

                    <td className="py-3.5">
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold ${
                            d
                              ? "bg-slate-700 text-slate-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {iniciales(a.nombre)}
                        </span>

                        <span className="leading-tight">
                          <span className="block font-semibold">
                            {a.nombre}
                          </span>

                          <span className={`text-xs ${t.suave}`}>
                            DNI {a.dni}
                          </span>
                        </span>
                      </span>
                    </td>

                    <td className={`py-3.5 ${t.suave}`}>
                      {a.entidad || "—"}
                    </td>

                    <td className="w-48 py-3.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          d ? "bg-slate-800" : "bg-slate-100"
                        }`}
                      >
                        <div
                          className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
                          style={{
                            width: `${(r.c / DOCS.length) * 100}%`,
                          }}
                        />
                      </div>

                      <span className={`mt-1 block text-xs ${t.suave}`}>
                        {r.c} de {DOCS.length} conformes
                      </span>
                    </td>

                    <td
                      className={`py-3.5 text-xs font-semibold ${colorResultado[r.estado]}`}
                    >
                      {r.estado}
                    </td>
                  </tr>

                  {abierto === a.dni && (
                    <tr
                      className={`border-b ${t.borde} ${
                        d ? "bg-slate-800/30" : "bg-slate-50/70"
                      }`}
                    >
                      <td colSpan={5} className="px-6 py-4">
                        <ul className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
                          {DOCS.map((doc) => (
                            <li
                              key={doc}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-[13px]">
                                {doc}
                              </span>

                              <span
                                className={`flex overflow-hidden rounded-lg border text-[11px] font-medium ${t.borde}`}
                              >
                                {OPCIONES.map((o) => (
                                  <button
                                    key={o.v}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      poner(a.dni, doc, o.v);
                                    }}
                                    aria-pressed={
                                      valor(a.dni, doc) === o.v
                                    }
                                    className={`cursor-pointer px-2.5 py-1 transition-colors ${
                                      valor(a.dni, doc) === o.v
                                        ? o.on
                                        : `${t.suave} hover:bg-black/5`
                                    }`}
                                  >
                                    {o.t}
                                  </button>
                                ))}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {visibles.length === 0 && (
            <p className={`py-10 text-center text-sm ${t.suave}`}>
              {alumnos.length
                ? "Ningún expediente coincide con el filtro."
                : "No se encontraron alumnos registrados."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
