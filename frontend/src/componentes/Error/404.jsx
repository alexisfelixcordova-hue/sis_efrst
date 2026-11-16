import { Compass, Home, ArrowLeft, Users, GraduationCap, Award } from "lucide-react";

const ACCESOS = [
  { vista: "Estudiantes", icono: Users },
  { vista: "Plantel Docente", icono: GraduationCap },
  { vista: "Constancias", icono: Award },
];

/**
 * Props opcionales:
 *  - onIrInicio()      botón principal (ej. () => setVista("Dashboard"))
 *  - onVolver()        botón secundario (por defecto: history.back())
 *  - onIrA(vista)      accesos rápidos (ej. cambiarVista)
 */
export default function NotFound({ onIrInicio, onVolver, onIrA }) {
  return (
    <div
      className="flex min-h-[72vh] w-full items-center justify-center px-4 py-3 text-[#111827]"
      style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}
    >
      <section className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#e8ebf1] bg-white px-8 py-12 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {/* Fondo decorativo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: "radial-gradient(#dfe5f2 1px, transparent 1px)", backgroundSize: "18px 18px" }}
        />
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[#2f6bff]/10 blur-3xl" />

        <div className="relative">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#c9d9ff] bg-[#eef3ff] text-[#2f6bff]">
            <Compass size={22} />
          </span>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2f6bff]">Error 404</p>

          <h1 className="mt-1 bg-gradient-to-b from-[#1e3a8a] to-[#2f6bff] bg-clip-text text-[88px] font-extrabold leading-none tracking-tight text-transparent">
            404
          </h1>

          <h2 className="mt-3 text-[20px] font-bold leading-tight">Página no encontrada</h2>
          <p className="mx-auto mt-2 max-w-[400px] text-[13px] leading-relaxed text-[#6b7280]">
            La sección que buscas no existe, fue movida o no tienes acceso a ella. Verifica la dirección o regresa al panel principal.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onIrInicio?.()}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#2f6bff] px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1f57e0]"
            >
              <Home size={15} /> Ir al Dashboard
            </button>
            <button
              onClick={() => (onVolver ? onVolver() : window.history.back())}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#dfe3ec] bg-white px-5 text-[13px] font-semibold text-[#374151] transition hover:bg-gray-50"
            >
              <ArrowLeft size={15} /> Regresar
            </button>
          </div>

          {onIrA && (
            <div className="mt-8 border-t border-[#f0f2f6] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a5]">Accesos rápidos</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {ACCESOS.map(({ vista, icono: Icono }) => (
                  <button
                    key={vista}
                    onClick={() => onIrA(vista)}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-[#e8ebf1] bg-[#f7f8fb] px-3 text-[12px] font-medium text-[#374151] transition hover:border-[#c9d9ff] hover:bg-[#eef3ff] hover:text-[#2f6bff]"
                  >
                    <Icono size={13} /> {vista}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}