import { useState } from "react";
import api from "../../../../api/axios.js";
import {
  ShieldCheck, KeyRound, Lock, Eye, EyeOff, CheckCircle2, ShieldHalf, RefreshCcw, Check, Info,
} from "lucide-react";

const caja = "flex h-10 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 focus-within:border-blue-500";
const input = "w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400";

export default function SeguridadAcceso() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [ver, setVer] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  // Requisitos de la contraseña
  const tieneLongitud = nueva.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(nueva);
  const tieneNumero = /[0-9]/.test(nueva);
  const tieneEspecial = /[!@#$%^&*]/.test(nueva);

  const puedeEnviar =
    actual !== "" && tieneLongitud && tieneMayuscula && tieneNumero && tieneEspecial && nueva === confirmar;

  const punto = (ok) => (
    <span className={`mt-1.5 h-[5px] w-[5px] shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-gray-300"}`} />
  );

  const limpiar = () => {
    setActual("");
    setNueva("");
    setConfirmar("");
  };

  const actualizar = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const { data } = await api.put("/perfil/password", {
          password_actual: actual,
          password_nueva: nueva,
          password_nueva_confirmation: confirmar,
      });

      setEsError(false);
      setMensaje(data.message || "Contraseña actualizada correctamente");
      limpiar();
    } catch (error) {
      setEsError(true);
      setMensaje(error?.response?.data?.message || "No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-5 md:flex-row md:items-start">
      {/* Panel izquierdo */}
      <aside className="w-full space-y-5 rounded-3xl border border-gray-200 bg-white p-5 text-xs md:w-[305px] md:shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck size={17} strokeWidth={1.8} className="mt-0.5" />
            <div className="leading-snug">
              <p className="font-semibold">Seguridad Básica</p>
              <p className="text-gray-500">Estado general de la cuenta</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activa
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div className="leading-snug">
            <p className="font-semibold">Estado de la Cuenta</p>
            <p className="max-w-[150px] text-gray-500">Identidad institucional verificada</p>
          </div>
          <span className="mt-2 flex items-center gap-1 font-semibold text-emerald-600">
            <CheckCircle2 size={13} /> Verificada
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div className="leading-snug">
            <p className="font-semibold">Doble Factor (2FA)</p>
            <p className="text-gray-500">Autenticación en dos pasos</p>
          </div>
          <span className="mt-1 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">Activado</span>
        </div>

        <div className="flex items-center justify-between pl-2">
          <div className="flex items-center gap-3 text-gray-700">
            <ShieldHalf size={16} strokeWidth={1.8} />
            <p className="leading-snug">App de<br />autenticación</p>
          </div>
          <button className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-1.5 font-semibold leading-snug hover:bg-gray-100">
            Gestionar<br />2FA
          </button>
        </div>

        <div className="flex items-start justify-between">
          <div className="leading-snug">
            <p className="font-semibold">Último Cambio de Clave</p>
            <p className="text-gray-500">Revisión periódica de acceso</p>
          </div>
          <span className="mt-5 shrink-0 text-gray-500">Hace 45 días</span>
        </div>
      </aside>

      {/* Formulario */}
      <section className="flex-1 rounded-3xl border border-gray-200 bg-white px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <RefreshCcw size={20} strokeWidth={1.6} />
            <div className="leading-snug">
              <p className="text-xs font-medium">Cambio de Contraseña</p>
              <p className="text-[10.5px] text-gray-500">
                Actualiza periódicamente tu clave institucional para mayor seguridad
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold">Recomendado c/90 días</span>
        </div>

        <form onSubmit={actualizar} className="mt-8">
          <label className="text-[11px] font-semibold text-gray-800">Contraseña Actual</label>
          <div className={`mt-2 bg-gray-50 ${caja}`}>
            <KeyRound size={14} className="text-gray-400" />
            <input
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="••••••••••••"
              className={input}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-800">Nueva Contraseña</label>
              <div className={`mt-2 ${caja}`}>
                <Lock size={14} className="text-gray-400" />
                <input
                  type={ver ? "text" : "password"}
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={input}
                />
                <button type="button" onClick={() => setVer(!ver)} className="text-gray-500 hover:text-gray-900">
                  {ver ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-800">Confirmar Nueva Contraseña</label>
              <div className={`mt-2 ${caja}`}>
                <Lock size={14} className="text-gray-400" />
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className={input}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3.5">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <Info size={14} /> Requisitos de la contraseña
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
              <div className="flex gap-2">{punto(tieneLongitud)} Mínimo 8 caracteres de longitud</div>
              <div className="flex gap-2">{punto(tieneMayuscula)} Al menos una letra mayúscula (A-Z)</div>
              <div className="flex gap-2">{punto(tieneNumero)} Al menos un número (0–9)</div>
              <div className="flex gap-2">{punto(tieneEspecial)} Un carácter especial (!@#$%^&amp;*)</div>
            </div>
          </div>

          {mensaje && (
            <p className={`mt-4 rounded-lg px-3 py-2 text-xs ${esError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {mensaje}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={limpiar} className="px-4 py-2 text-xs text-gray-700 hover:text-gray-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeEnviar}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={14} /> Actualizar Contraseña
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}