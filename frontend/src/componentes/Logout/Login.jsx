import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  X,
} from "lucide-react";
import fotoLogin from "../../assets/portada-login.webp";
import LogoInstituto from "../../assets/LogoInstituto-login.webp";
import api from "../../api/axios";

const DURACION_TOAST = 5000;

export default function Login({ foto = fotoLogin, onLogin, onExito }) {
  const [abierto, setAbierto] = useState(false);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), DURACION_TOAST);
    return () => clearTimeout(timer);
  }, [toast]);

  const abrirLogin = () => setAbierto(true);

  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setToast(null);
    setCargando(true);

    try {
      let dataLogin;
      if (onLogin) {
        dataLogin = await onLogin({ correo, password });
      } else {
        const response = await api.post("/login", { correo, password });
        dataLogin = response.data;
        const token = dataLogin?.access_token;

        if (token) {
          sessionStorage.setItem("token", token);
          sessionStorage.setItem("access_token", token);
        }
      }

      if (onExito) await onExito(dataLogin);
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

  const handleCoverKeyDown = (e) => {
    if (!abierto && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      abrirLogin();
    }
  };

  return (
    <main className="relative min-h-[100svh] w-full overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',Inter,system-ui,sans-serif] text-slate-900">
      {toast && (
        <div
          key={toast.id}
          role="alert"
          aria-live="assertive"
          className="fixed right-4 top-4 z-[80] flex w-[min(26rem,calc(100vw-2rem))] items-start gap-3 overflow-hidden rounded-2xl border border-rose-200 bg-white p-4 shadow-2xl shadow-slate-950/20"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <AlertCircle size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">No se pudo iniciar sesión</p>
            <p className="mt-1 break-words text-sm leading-5 text-slate-600">{toast.mensaje}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar mensaje"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div
        onClick={() => !abierto && abrirLogin()}
        onKeyDown={handleCoverKeyDown}
        role={abierto ? undefined : "button"}
        tabIndex={abierto ? -1 : 0}
        aria-label={abierto ? undefined : "Abrir el acceso al sistema"}
        className={`absolute inset-0 z-20 w-full overflow-hidden bg-slate-900 transition-all duration-700 ease-[cubic-bezier(.7,0,.2,1)] ${
          abierto
            ? "-translate-y-full sm:translate-y-0 sm:w-[50.7%]"
            : "translate-y-0 cursor-pointer"
        }`}
      >
        <img
          src={foto}
          alt="Estudiante realizando prácticas en un taller de informática"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/65 via-blue-950/35 to-slate-950/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(56,189,248,0.2),transparent_58%)]" />

        <div
          className={`relative flex h-full w-full flex-col items-center justify-center px-6 py-10 text-center text-white transition-opacity duration-300 sm:px-10 ${
            abierto ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 shadow-lg shadow-slate-950/10 backdrop-blur-md">
            <img src={LogoInstituto} alt="" className="h-10 w-10 object-contain" />
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">Portal EFSRT</p>
              <p className="mt-0.5 text-[11px] text-white/75">IESTP Andrés Avelino Cáceres</p>
            </div>
          </div>

          <div className="mt-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">
              Aprender · Practicar · Crecer
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Experiencias formativas en situaciones reales de trabajo
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
              Un espacio institucional para acompañar, organizar y dar seguimiento a cada etapa
              de la formación profesional.
            </p>
          </div>

          <span className="mt-9 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold shadow-lg backdrop-blur-md transition hover:bg-white/20">
            Ingresar al sistema <ArrowRight size={17} />
          </span>
        </div>
      </div>

      <section
        aria-label="Formulario de inicio de sesión"
        aria-hidden={!abierto}
        inert={!abierto}
        className={`absolute inset-0 z-10 flex min-h-[100svh] w-full flex-col bg-gradient-to-br from-white via-white to-blue-50 transition-all duration-700 sm:left-auto sm:right-0 sm:w-[49.3%] ${
          abierto
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-8 opacity-0"
        }`}
      >
        <div className="flex min-h-[100svh] flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="w-full max-w-lg">
            <header className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={LogoInstituto}
                  alt="Instituto de Educación Superior Tecnológico Público Andrés Avelino Cáceres"
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                    IESTP ANDRÉS AVELINO CÁCERES
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                    Portal institucional EFSRT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
              >
                Ver portada <ArrowRight size={14} className="rotate-180" />
              </button>
            </header>

            <div className="mt-9">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Te damos la bienvenida
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ingresa con tus credenciales institucionales para continuar.
              </p>
            </div>

            <form onSubmit={enviar} className="mt-7 space-y-5">
              <div>
                <label htmlFor="lg-correo" className="mb-2 block text-sm font-semibold text-slate-800">
                  Correo institucional
                </label>
                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="lg-correo"
                    type="email"
                    required
                    autoFocus={abierto}
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@instituto.edu.pe"
                    autoComplete="username"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-[#eaf1ff] pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lg-pass" className="mb-2 block text-sm font-semibold text-slate-800">
                  Contraseña
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="lg-pass"
                    type={ver ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-[#eaf1ff] pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setVer((visible) => !visible)}
                    aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {ver ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-xs text-slate-500">
                  La sesión se cerrará automáticamente al volver a abrir el sistema. ¿Problemas para ingresar? Contacta al administrador.
                </span>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:from-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:cursor-wait disabled:opacity-70"
              >
                {cargando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Validando credenciales...
                  </>
                ) : (
                  <>
                    Ingresar al sistema <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              Tus datos se utilizan únicamente para acceder a las herramientas institucionales.
            </p>
          </div>
        </div>

      </section>
    </main>
  );
}
