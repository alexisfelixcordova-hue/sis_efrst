import { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, ArrowRight, ChevronRight, Check, AlertCircle, X } from "lucide-react";
import fotoLogin from "../../assets/portada.jpeg";
import LogoDiseño from "../../assets/LogoDiseño.png";
import LogoInstituto from "../../assets/LogoInstituto.png";
import api from "../../api/axios"; // Ajusta la ruta según tu carpeta de Axios

const DURACION_TOAST = 5000; // ms

const estilosToast = `
@keyframes lg-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes lg-toast-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
.lg-toast-in { animation: lg-toast-in .35s cubic-bezier(.22,1,.36,1) both; }
.lg-toast-bar { transform-origin: left; animation: lg-toast-bar ${DURACION_TOAST}ms linear forwards; }
@media (prefers-reduced-motion: reduce) { .lg-toast-in, .lg-toast-bar { animation: none !important; } }
`;

export default function Login({ foto = fotoLogin, onLogin, onExito }) {
  const [abierto, setAbierto] = useState(false);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [cargando, setCargando] = useState(false);
  // Toast: { id, mensaje } — el id reinicia la animación si el error se repite
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), DURACION_TOAST);
    return () => clearTimeout(t);
  }, [toast]);

  const enviar = async (e) => {
    e.preventDefault();
    setToast(null);
    setCargando(true);

    try {
      let dataLogin = null;

      if (onLogin) {
        dataLogin = await onLogin({ correo, password, recordar });
      } else {
        const response = await api.post("/login", {
          correo: correo,
          password: password,
        });
        dataLogin = response.data;
        const token = dataLogin?.access_token;

        if (token) {
          if (recordar) {
            localStorage.setItem("token", token);
            localStorage.setItem("access_token", token);
          } else {
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("access_token", token);
          }
        }
      }

      if (onExito) {
        await onExito(dataLogin);
      }
    } catch (err) {
      setToast({
        id: Date.now(),
        mensaje:
          err?.response?.data?.message ||
          err?.message ||
          "Correo o contraseña incorrectos.",
      });
    } finally {
      setCargando(false);
    }
  };

  const input =
    "w-full h-[28px] rounded-[7px] border border-[#e3e8f0] bg-white pl-[25px] pr-[8px] text-[7.3px] text-[#0f172a] outline-none shadow-[0_1px_1px_rgba(15,23,42,0.03)] placeholder:text-[#a0aec0] focus:border-[#2563eb] focus:ring-[2px] focus:ring-[#2563eb]/15";

  return (
    <div className="[--z:2] [zoom:var(--z)] relative h-[calc(100dvh/var(--z))] w-[calc(100vw/var(--z))] overflow-hidden bg-white font-['Plus_Jakarta_Sans',Inter,system-ui,sans-serif] text-[#0f172a]">
      <style>{estilosToast}</style>

      {toast && (
        <div
          key={toast.id}
          role="alert"
          aria-live="assertive"
          className="lg-toast-in absolute right-[10px] top-[10px] z-50 w-[150px] overflow-hidden rounded-[7px] border border-[#fecaca] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
        >
          <div className="flex items-start gap-[6px] border-l-[3px] border-l-[#dc2626] px-[8px] py-[7px]">
            <AlertCircle size={10} className="mt-[1px] shrink-0 text-[#dc2626]" />
            <div className="min-w-0 flex-1">
              <p className="text-[6.6px] font-bold leading-tight text-[#0f172a]">
                No se pudo iniciar sesión
              </p>
              <p className="mt-[2px] text-[6px] leading-snug text-[#64748b]">{toast.mensaje}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Cerrar mensaje"
              className="shrink-0 rounded-[3px] p-[1px] text-[#94a3b8] hover:bg-slate-100 hover:text-[#475569]"
            >
              <X size={7} />
            </button>
          </div>
          <div className="h-[1.5px] w-full bg-[#fee2e2]">
            <div className="lg-toast-bar h-full w-full bg-[#dc2626]" />
          </div>
        </div>
      )}

      <div
        onClick={() => !abierto && setAbierto(true)}
        role={abierto ? undefined : "button"}
        tabIndex={abierto ? -1 : 0}
        onKeyDown={(e) => !abierto && (e.key === "Enter" || e.key === " ") && setAbierto(true)}
        className={`absolute left-0 top-0 z-10 h-full overflow-hidden bg-[#1e293b] transition-all duration-[850ms] ease-[cubic-bezier(.7,0,.2,1)] ${
          abierto ? "w-[50.7%] rounded-r-[14px]" : "w-full cursor-pointer"
        }`}
      >
        <img
          src={foto}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />

        <div
          className={`absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-[#0b1b3a]/90 via-[#0b1b3a]/40 to-transparent pb-[100px] text-center text-white transition-opacity ${
            abierto
              ? "pointer-events-none opacity-0 duration-300"
              : "opacity-100 delay-300 duration-700"
          }`}
        >
          <img
            src={LogoDiseño}
            alt="Logo WORLDNIC"
            className="h-[70px] w-[70px] rounded-[7px] object-contain p-[3px]"
          />
          <p className="mt-[8px] text-[6px] font-bold uppercase tracking-[0.25em] text-white/70">
            Portal EFSRT
          </p>
          <h1 className="mt-[6px] max-w-[330px] text-[17px] font-bold leading-[1.2]">
            Experiencias Formativas en Situaciones Reales de Trabajo
          </h1>
          <p className="mt-[6px] text-[7.5px] text-white/75">
            Sistema de control y seguimiento institucional ·
          </p>
          <span className="mt-[16px] inline-flex h-[24px] animate-pulse items-center gap-[5px] rounded-full border border-white/40 bg-white/10 px-[14px] text-[7.5px] font-semibold backdrop-blur">
            Haz clic para continuar <ArrowRight size={9} />
          </span>
        </div>
      </div>

      <section
        className={`absolute right-0 top-0 flex h-full w-[49.3%] flex-col bg-gradient-to-br from-white via-white to-[#eef2ff] pb-[21px] pl-[26px] pr-[26px] pt-[45px] transition-all duration-700 ${
          abierto
            ? "translate-x-0 opacity-100 delay-[550ms]"
            : "pointer-events-none translate-x-[30px] opacity-0"
        }`}
      >
        <div className="mx-auto w-full max-w-[243px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[7px]">
              <img
                src={LogoInstituto}
                alt="Logo WORLDNIC"
                className="h-[55px] w-[55px] rounded-[7px] object-contain"
              />
              <div className="leading-none">
                <p className="text-[10px] font-extrabold tracking-tight">WORLDNIC</p>
                <p className="mt-[3px] text-[5.2px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
                  Portal EFSRT
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="flex h-[16px] items-center gap-[2px] rounded-full border border-[#e3e8f0] bg-white px-[7px] text-[6px] font-semibold text-[#334155] shadow-sm hover:bg-slate-50"
            >
              Ver foto <ChevronRight size={7} />
            </button>
          </div>

          <h2 className="mt-[20px] text-[15px] font-bold leading-[1.15] tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="mt-[5px] whitespace-nowrap text-[6.2px] text-[#64748b]">
            Acceso al Sistema de Control de Experiencias Formativas
          </p>

          <form onSubmit={enviar} className="mt-[17px]">
            <label htmlFor="lg-correo" className="block text-[6.3px] font-bold text-[#1e293b]">
              Correo institucional
            </label>
            <div className="relative mt-[4px]">
              <User size={8} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="lg-correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@worldnic.edu.pe"
                autoComplete="username"
                className={input}
              />
            </div>

            <label htmlFor="lg-pass" className="mt-[7px] block text-[6.3px] font-bold text-[#1e293b]">
              Contraseña
            </label>
            <div className="relative mt-[4px]">
              <Lock size={8} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="lg-pass"
                type={ver ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`${input} pr-[24px]`}
              />
              <button
                type="button"
                onClick={() => setVer(!ver)}
                aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"
              >
                {ver ? <EyeOff size={8} /> : <Eye size={8} />}
              </button>
            </div>

            <div className="mt-[12px] flex items-center justify-between text-[6.2px]">
              <button
                type="button"
                role="checkbox"
                aria-checked={recordar}
                onClick={() => setRecordar(!recordar)}
                className="flex items-center gap-[5px] text-[#334155]"
              >
                <span
                  className={`grid h-[7px] w-[7px] place-items-center rounded-[2px] border ${
                    recordar ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5e1] bg-white"
                  }`}
                >
                  {recordar && <Check size={5.5} strokeWidth={4} className="text-white" />}
                </span>
                Recordar sesión
              </button>
              <button type="button" className="font-bold text-[#2563eb] hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="mt-[15px] flex h-[27px] w-full items-center justify-center gap-[5px] rounded-[7px] bg-[#2563eb] text-[7.3px] font-bold text-white shadow-[0_4px_10px_rgba(37,99,235,0.3)] transition hover:bg-[#1d4ed8] disabled:opacity-70"
            >
              {cargando ? (
                "Ingresando..."
              ) : (
                <>
                  Ingresar al Sistema <ArrowRight size={8} />
                </>
              )}
            </button>
          </form>
        </div>

        <footer className="mx-auto mt-auto flex w-full max-w-[233px] items-center justify-between border-t border-[#e8ecf3] pt-[9px] text-[5.4px] text-[#94a3b8]">
          <span>Acceso institucional seguro</span>
          <span>© 2026 WORLDNIC</span>
        </footer>
      </section>
    </div>
  );
}