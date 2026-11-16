import { FileText, FolderOpen, Clock3 } from "lucide-react";

export default function DocumentosAlumnos({
  estudiante,
  darkMode = false,
}) {
  // Verificamos de forma flexible las posibles propiedades de documentos en el objeto
  const documentos = 
    estudiante?.documentos || 
    estudiante?.archivos || 
    estudiante?.files || 
    [];

  const panel = darkMode
    ? "border-slate-700 bg-[#1e293b]"
    : "border-slate-200 bg-white";

  const secundario = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  return (
    <section
      className={`overflow-hidden rounded-xl border ${panel}`}
    >
      <div
        className={`flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center ${
          darkMode ? "border-slate-700" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2.5 ${
              darkMode
                ? "bg-blue-500/15 text-blue-400"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            <FolderOpen size={21} />
          </div>

          <div>
            <h2 className="font-bold">Documentos del expediente</h2>

            <p className={`mt-1 text-sm ${secundario}`}>
              Documentación asociada al estudiante
            </p>
          </div>
        </div>

        <span className={`text-sm ${secundario}`}>
          {documentos.length} documento(s)
        </span>
      </div>

      {documentos.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {documentos.map((documento, indice) => (
            <div
              key={documento.id || documento.nombre || indice}
              className={`flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center ${
                darkMode
                  ? "divide-slate-700 hover:bg-slate-800/50"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`rounded-lg p-2.5 ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <FileText size={20} />
                </div>

                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">
                    {documento.nombre || documento.titulo || "Documento sin nombre"}
                  </p>

                  <p className={`mt-1 text-xs ${secundario}`}>
                    {documento.fecha || documento.created_at || "Fecha no disponible"}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  documento.estado === "Aprobado"
                    ? "bg-emerald-50 text-emerald-700"
                    : documento.estado === "Observado"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {documento.estado || "Pendiente"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <div
            className={`rounded-full p-4 ${
              darkMode
                ? "bg-slate-800 text-slate-400"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <Clock3 size={25} />
          </div>

          <h3 className="mt-4 font-semibold">
            No hay documentos registrados
          </h3>

          <p className={`mt-2 max-w-md text-sm ${secundario}`}>
            Cuando se registren documentos para este estudiante,
            aparecerán en esta sección.
          </p>
        </div>
      )}
    </section>
  );
}