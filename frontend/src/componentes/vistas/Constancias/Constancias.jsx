import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  FiSearch, FiChevronDown, FiGrid, FiList, FiRefreshCw, FiFolder, FiFileText,
  FiCheckCircle, FiChevronLeft, FiChevronRight, FiAward, FiLoader, FiPrinter,
  FiClock, FiBriefcase, FiUser, FiX, FiAlertCircle, FiArrowUp, FiShield, FiCalendar,
} from 'react-icons/fi';

/* ═════════════ Sistema de animación ═════════════ */
const ESTILOS = `
@keyframes cs-up { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:translateY(0);} }
@keyframes cs-pop { 0% { opacity:0; transform:scale(.96);} 100% { opacity:1; transform:scale(1);} }
@keyframes cs-modal { 0% { opacity:0; transform:translateY(18px) scale(.96);} 100% { opacity:1; transform:translateY(0) scale(1);} }
@keyframes cs-fade { from { opacity:0;} to { opacity:1;} }
@keyframes cs-toast { from { opacity:0; transform:translateY(16px) scale(.97);} to { opacity:1; transform:translateY(0) scale(1);} }
@keyframes cs-shine { 0% { transform:translateX(-120%);} 100% { transform:translateX(280%);} }
@keyframes cs-skel { 0%,100% { opacity:.5;} 50% { opacity:1;} }
@keyframes cs-ring { 0% { box-shadow:0 0 0 0 rgba(37,99,235,.40);} 100% { box-shadow:0 0 0 9px rgba(37,99,235,0);} }
@keyframes cs-draw { from { stroke-dashoffset: var(--cs-len);} to { stroke-dashoffset: var(--cs-off);} }
@keyframes cs-spin { to { transform: rotate(360deg);} }
.cs-up { animation: cs-up .5s cubic-bezier(.22,1,.36,1) both; }
.cs-pop { animation: cs-pop .35s cubic-bezier(.22,1,.36,1) both; }
.cs-modal { animation: cs-modal .35s cubic-bezier(.22,1,.36,1) both; }
.cs-fade { animation: cs-fade .25s ease-out both; }
.cs-toast { animation: cs-toast .35s ease-out both; }
.cs-skel { animation: cs-skel 1.4s ease-in-out infinite; }
.cs-pulse { animation: cs-ring 1.9s ease-out infinite; }
.cs-draw { animation: cs-draw 1s cubic-bezier(.22,1,.36,1) both; }
.cs-spin { animation: cs-spin .9s linear infinite; }
.cs-shine { position:relative; overflow:hidden; }
.cs-shine::after { content:""; position:absolute; inset:0; width:35%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent); animation: cs-shine 2.6s ease-in-out infinite; }
.cs-lift { transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease, border-color .25s ease; }
.cs-lift:hover { transform: translateY(-3px); box-shadow: 0 16px 32px -16px rgba(15,23,42,.22); border-color:#cbd5e1; }
.cs-press { transition: transform .15s ease, filter .2s ease, background-color .2s ease, border-color .2s ease, color .2s ease; }
.cs-press:active:not(:disabled) { transform: scale(.97); }
@media (prefers-reduced-motion: reduce) { .cs-up,.cs-pop,.cs-modal,.cs-fade,.cs-toast,.cs-skel,.cs-pulse,.cs-draw,.cs-spin,.cs-shine::after { animation:none !important; } .cs-lift:hover { transform:none; } }
`;

/* ═════════════ Constantes ═════════════ */
const moduloStyle = {
  desarrollo: 'bg-blue-50 text-blue-700 border-blue-200',
  redes: 'bg-violet-50 text-violet-700 border-violet-200',
  soporte: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};
const moduloAcento = {
  desarrollo: 'from-blue-600 to-blue-400',
  redes: 'from-violet-600 to-violet-400',
  soporte: 'from-cyan-600 to-cyan-400',
};
const estadoBadge = {
  'Constancia Emitida': 'bg-blue-50 text-blue-700 border-blue-200',
  'Apto para Constancia': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Horas Incompletas': 'bg-amber-50 text-amber-700 border-amber-200',
};
const estadoPunto = {
  'Constancia Emitida': 'bg-blue-600',
  'Apto para Constancia': 'bg-emerald-500',
  'Horas Incompletas': 'bg-amber-500',
};

const OPC_MODULO = [
  ['todos', 'Todos los Módulos'],
  ['soporte', 'Módulo I – Soporte'],
  ['desarrollo', 'Módulo II – Desarrollo'],
  ['redes', 'Módulo III – Redes'],
];
const OPC_ORDEN = [
  ['nombre', 'Nombre (A-Z)'],
  ['horas_desc', 'Más horas primero'],
  ['horas_asc', 'Menos horas primero'],
];
const TABS = [
  ['todos', 'Todos'],
  ['Apto para Constancia', 'Aptos'],
  ['Constancia Emitida', 'Emitidas'],
  ['Horas Incompletas', 'En proceso'],
];

const HORAS_META = 480;
const POR_PAGINA = 6;

const card = 'bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

/* ═════════════ Lógica auxiliar (reglas sin cambios) ═════════════ */
const calcular = (e) => {
  const horas = e.hrs || HORAS_META;
  const completas = horas >= HORAS_META;
  const emitida = e.estado === 'Constancia Emitida';
  const apto = completas && !emitida;
  const estadoVisual = emitida ? 'Constancia Emitida' : completas ? 'Apto para Constancia' : 'Horas Incompletas';
  const pct = Math.min(100, Math.round((horas / HORAS_META) * 100));
  return { horas, completas, emitida, apto, estadoVisual, pct };
};

/* ───── Fechas ───── */
// Toma la primera fecha disponible del registro (formato ISO AAAA-MM-DD)
const fechaDe = (e) => {
  const bruta = e.fecha_emision || e.fecha_constancia || e.fecha || e.created_at || e.fecha_fin || '';
  const m = String(bruta).match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
};

const formatearFecha = (iso) => {
  if (!iso) return 'Sin fecha';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

const aISO = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const PRESETS_FECHA = [
  ['7d', 'Últimos 7 días'],
  ['30d', 'Últimos 30 días'],
  ['mes', 'Este mes'],
  ['anio', 'Este año'],
];

const rangoPreset = (k) => {
  const hoy = new Date();
  if (k === '7d' || k === '30d') {
    const ini = new Date(hoy);
    ini.setDate(hoy.getDate() - (k === '7d' ? 6 : 29));
    return [aISO(ini), aISO(hoy)];
  }
  if (k === 'mes') return [aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), aISO(hoy)];
  return [aISO(new Date(hoy.getFullYear(), 0, 1)), aISO(hoy)];
};

// Sin filtro activo todo pasa; con filtro, los registros sin fecha quedan fuera
const dentroDeRango = (e, desde, hasta) => {
  if (!desde && !hasta) return true;
  const f = fechaDe(e);
  if (!f) return false;
  let lo = desde;
  let hi = hasta;
  if (lo && hi && lo > hi) [lo, hi] = [hi, lo];
  return (!lo || f >= lo) && (!hi || f <= hi);
};

const iniciales = (e) =>
  e.ini ||
  (e.nombre || 'EF').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

/* ───── Impresión masiva ───── */
// Cambia este nombre por el de tu institución: aparece en el encabezado de cada constancia
const NOMBRE_INSTITUCION = 'Instituto de Educación Superior Tecnológico';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const fechaLarga = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${Number(d)} de ${MESES[Number(m) - 1]} de ${a}`;
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Una constancia por hoja A4, lista para imprimir o guardar como PDF
const generarHtmlConstancias = (lista) => {
  const hoy = aISO(new Date());
  const hojas = lista
    .map((e) => {
      const info = calcular(e);
      return `
      <section class="hoja">
        <div class="marco">
          <p class="inst">${esc(NOMBRE_INSTITUCION)}</p>
          <h1>Constancia de Cumplimiento</h1>
          <p class="sub">Experiencias Formativas en Situaciones Reales de Trabajo (EFSRT)</p>
          <p class="cod">N.º ${esc(e.codigo_documento || e.exp || '—')}</p>
          <p class="pre">Se deja constancia de que</p>
          <p class="nombre">${esc(e.nombre)}</p>
          <p class="dni">identificado(a) con DNI N.º ${esc(e.dni)}</p>
          <p class="cuerpo">
            ha culminado y aprobado satisfactoriamente el módulo de
            <b>${esc(e.modulo || 'Experiencias Formativas')}</b>, acumulando
            <b>${info.horas} horas</b> de experiencia formativa en
            <b>${esc(e.empresa || 'la empresa formadora')}</b>, bajo la asesoría del docente
            <b>${esc(e.asesor || 'asignado')}</b>.
          </p>
          <p class="fecha">Se expide la presente a solicitud del interesado, el ${esc(fechaLarga(fechaDe(e) || hoy))}.</p>
          <div class="firmas">
            <div><span></span>Docente asesor</div>
            <div><span></span>Dirección académica</div>
          </div>
        </div>
      </section>`;
    })
    .join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Constancias EFSRT</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #0f172a; background: #fff; }
    .hoja { width: 210mm; height: 297mm; padding: 14mm; page-break-after: always; }
    .hoja:last-child { page-break-after: auto; }
    .marco { height: 100%; border: 2px solid #1d4ed8; outline: 1px solid #93c5fd; outline-offset: -8px; padding: 22mm 20mm; text-align: center; display: flex; flex-direction: column; }
    .inst { margin: 0; font-size: 13px; letter-spacing: .25em; text-transform: uppercase; color: #1d4ed8; font-weight: bold; }
    h1 { margin: 14mm 0 2mm; font-size: 30px; letter-spacing: .08em; text-transform: uppercase; }
    .sub { margin: 0; font-size: 13px; color: #475569; }
    .cod { margin: 6mm 0 0; font-family: monospace; font-size: 12px; color: #64748b; }
    .pre { margin: 16mm 0 4mm; font-size: 14px; letter-spacing: .2em; text-transform: uppercase; color: #64748b; }
    .nombre { margin: 0; font-size: 28px; font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 4mm; }
    .dni { margin: 4mm 0 10mm; font-size: 14px; color: #475569; }
    .cuerpo { font-size: 16px; line-height: 1.8; text-align: justify; margin: 0 4mm; }
    .fecha { margin-top: 12mm; font-size: 14px; color: #475569; }
    .firmas { margin-top: auto; display: flex; justify-content: space-around; font-size: 12px; color: #334155; }
    .firmas div { width: 62mm; }
    .firmas span { display: block; border-top: 1px solid #0f172a; margin-bottom: 2mm; }
  </style></head><body>${hojas}
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
  </body></html>`;
};

/* ═════════════ Componentes base ═════════════ */
function useContador(objetivo, duracion = 900) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const inicio = ref.current;
    const t0 = performance.now();
    let raf;
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / duracion);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(Math.round(inicio + (objetivo - inicio) * ease));
      if (p < 1) raf = requestAnimationFrame(paso);
      else ref.current = objetivo;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, duracion]);
  return v;
}

const Anillo = ({ pct, size = 52, grosor = 5, color = 'text-blue-600', children }) => {
  const r = (size - grosor) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (c * pct) / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={grosor} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={grosor}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          className={`cs-draw ${color}`} style={{ '--cs-len': c, '--cs-off': off }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-bold text-slate-700">{children}</div>
    </div>
  );
};

const Select = ({ value, onChange, opciones, w, icon: Icon }) => (
  <div className={`relative ${w}`}>
    {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pr-9 text-[12px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${Icon ? 'pl-9' : 'pl-3.5'}`}
    >
      {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
  </div>
);

const Badge = ({ estado }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${estadoBadge[estado] || estadoBadge['Horas Incompletas']}`}>
    <i className={`h-1.5 w-1.5 rounded-full ${estadoPunto[estado] || estadoPunto['Horas Incompletas']} ${estado === 'Apto para Constancia' ? 'animate-pulse' : ''}`} />
    {estado}
  </span>
);

const BarraHoras = ({ pct, completas }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
    <div
      className={`cs-shine h-full rounded-full bg-gradient-to-r ${completas ? 'from-blue-600 to-blue-400' : 'from-amber-500 to-amber-300'}`}
      style={{ width: `${pct}%`, transition: 'width .9s cubic-bezier(.22,1,.36,1)' }}
    />
  </div>
);

const Avatar = ({ e, size = 'h-11 w-11 text-[12px]' }) => (
  <span className={`${size} grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm ${moduloAcento[e.moduloKey] || moduloAcento.desarrollo}`}>
    {iniciales(e)}
  </span>
);

const Kpi = ({ icon: Icon, valor, label, detalle, tono, delay, anillo }) => {
  const n = useContador(valor);
  return (
    <div style={{ animationDelay: `${delay}s` }} className={`${card} cs-up cs-lift flex items-center gap-4 p-4`}>
      {anillo !== undefined ? (
        <Anillo pct={anillo} size={56} color={tono.texto}>{anillo}%</Anillo>
      ) : (
        <span className={`grid h-14 w-14 place-items-center rounded-2xl ${tono.fondo} ${tono.texto}`}><Icon className="h-6 w-6" /></span>
      )}
      <div className="min-w-0">
        <div className="text-[26px] font-extrabold leading-none tracking-tight text-slate-900">{n}</div>
        <div className="mt-1.5 text-[12px] font-semibold text-slate-700">{label}</div>
        <div className="text-[11px] text-slate-400">{detalle}</div>
      </div>
    </div>
  );
};

function BotonAccion({ e, info, procesandoId, onVerConstancia, onPedirEmision, compacto = false }) {
  const { emitida, apto } = info;
  const cargandoEste = procesandoId === e.id_estudiante;
  const tam = compacto ? 'h-8 px-3 text-[11px]' : 'h-10 text-[12px]';
  return (
    <button
      disabled={(!apto && !emitida) || cargandoEste}
      onClick={() => {
        if (emitida) onVerConstancia && onVerConstancia(e);
        else if (apto) onPedirEmision(e);
      }}
      className={`${tam} cs-press flex items-center justify-center gap-2 rounded-xl font-bold ${
        emitida
          ? 'cursor-pointer bg-slate-900 text-white shadow-md shadow-slate-900/15 hover:bg-slate-800'
          : apto
          ? 'cs-pulse cursor-pointer bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700'
          : 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
      }`}
    >
      {cargandoEste ? <FiLoader className="cs-spin h-3.5 w-3.5" />
        : emitida ? <><FiPrinter className="h-3.5 w-3.5" /> Ver Constancia</>
        : apto ? <><FiAward className="h-3.5 w-3.5" /> Emitir Constancia</>
        : <><FiClock className="h-3.5 w-3.5" /> Horas Incompletas</>}
    </button>
  );
}

function Tarjeta({ e, indice, onSeleccionarEstudiante, onVerConstancia, onPedirEmision, procesandoId }) {
  const info = calcular(e);
  const abrir = () => onSeleccionarEstudiante && onSeleccionarEstudiante(e);
  return (
    <article style={{ animationDelay: `${indice * 0.06}s` }} className={`${card} cs-up cs-lift group relative overflow-hidden`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${info.emitida ? 'bg-blue-600' : info.apto ? 'bg-emerald-500' : 'bg-amber-400'}`} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={abrir} className="flex min-w-0 cursor-pointer items-center gap-3.5 text-left">
            <Avatar e={e} size="h-12 w-12 text-[13px]" />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-600">{e.nombre}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>DNI {e.dni}</span><span>•</span>
                <span className="font-mono font-semibold text-slate-500">{e.exp || '#EXP-2026'}</span>
              </div>
            </div>
          </button>
          <Badge estado={info.estadoVisual} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${moduloStyle[e.moduloKey] || moduloStyle.desarrollo}`}>
            {e.modulo || 'Diseño y Programación Web'}
          </span>
          <span className="text-[11px] text-slate-400">{e.nota || (info.completas ? 'Acreditación completada' : 'En proceso')}</span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl bg-slate-50 p-3.5">
          <div className="min-w-0 space-y-2.5 text-[12px]">
            <div className="flex items-center gap-2 text-slate-500">
              <FiBriefcase className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-semibold text-slate-800">{e.empresa || 'WORLDNIC Tech'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <FiUser className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-semibold text-slate-800">{e.asesor || 'Julio César Gutarra Ramos'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <FiCalendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-semibold text-slate-800">{formatearFecha(fechaDe(e))}</span>
            </div>
            <div>
              <div className="mb-1.5 text-[11px] text-slate-400">
                <b className={info.completas ? 'text-blue-600' : 'text-amber-600'}>{info.horas}</b> / {HORAS_META} horas EFSRT
              </div>
              <BarraHoras pct={info.pct} completas={info.completas} />
            </div>
          </div>
          <Anillo pct={info.pct} size={58} color={info.completas ? 'text-blue-600' : 'text-amber-500'}>{info.pct}%</Anillo>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1.35fr] gap-2.5">
          <button
            onClick={abrir}
            className="cs-press flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600"
          >
            <FiFolder className="h-3.5 w-3.5" /> Ver Expediente
          </button>
          <BotonAccion e={e} info={info} procesandoId={procesandoId} onVerConstancia={onVerConstancia} onPedirEmision={onPedirEmision} />
        </div>
      </div>
    </article>
  );
}

function TablaExpedientes({ lista, onSeleccionarEstudiante, onVerConstancia, onPedirEmision, procesandoId }) {
  return (
    <div className={`${card} cs-pop overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {['Alumno', 'Expediente', 'Módulo', 'Empresa', 'Fecha', 'Avance', 'Estado', 'Acciones'].map((c) => (
                <th key={c} className="px-4 py-3.5 text-left text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((e, i) => {
              const info = calcular(e);
              return (
                <tr
                  key={e.exp || e.dni}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  className="cs-up group border-b border-slate-100 text-[12px] transition-colors last:border-0 hover:bg-blue-50/40"
                >
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onSeleccionarEstudiante && onSeleccionarEstudiante(e)} className="flex cursor-pointer items-center gap-3 text-left">
                      <Avatar e={e} size="h-9 w-9 text-[11px]" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-900 transition-colors group-hover:text-blue-600">{e.nombre}</div>
                        <div className="text-[11px] text-slate-400">DNI {e.dni}</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 font-mono text-slate-500">{e.exp}</td>
                  <td className="px-4">
                    <span className={`whitespace-nowrap rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${moduloStyle[e.moduloKey] || moduloStyle.desarrollo}`}>{e.modulo}</span>
                  </td>
                  <td className="px-4 text-slate-500">{e.empresa}</td>
                  <td className="whitespace-nowrap px-4 font-medium text-slate-600">{formatearFecha(fechaDe(e))}</td>
                  <td className="min-w-[150px] px-4">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <b className={info.completas ? 'text-blue-600' : 'text-amber-600'}>{info.horas} h</b>
                      <span className="text-slate-400">{info.pct}%</span>
                    </div>
                    <BarraHoras pct={info.pct} completas={info.completas} />
                  </td>
                  <td className="px-4"><Badge estado={info.estadoVisual} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSeleccionarEstudiante && onSeleccionarEstudiante(e)}
                        className="cs-press inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600"
                      >
                        <FiFolder className="h-3 w-3" /> Expediente
                      </button>
                      {(info.emitida || info.apto) && (
                        <BotonAccion compacto e={e} info={info} procesandoId={procesandoId} onVerConstancia={onVerConstancia} onPedirEmision={onPedirEmision} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Esqueleto = () => (
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{ animationDelay: `${i * 0.12}s` }} className={`${card} cs-skel space-y-4 p-5`}>
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2"><div className="h-3.5 w-2/3 rounded bg-slate-100" /><div className="h-3 w-1/3 rounded bg-slate-50" /></div>
        </div>
        <div className="h-24 rounded-xl bg-slate-50" />
        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
    ))}
  </div>
);

/* ═════════════ Modal de confirmación ═════════════ */
function ModalEmision({ alumno, procesando, onConfirmar, onCancelar }) {
  useEffect(() => {
    const onKey = (ev) => { if (ev.key === 'Escape' && !procesando) onCancelar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [procesando, onCancelar]);

  const info = calcular(alumno);
  return (
    <div className="cs-fade fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => !procesando && onCancelar()}>
      <div role="dialog" aria-modal="true" className="cs-modal w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-blue-700 to-blue-500 px-6 py-6 text-white">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><FiAward className="h-6 w-6" /></span>
          <h3 className="relative mt-3 text-[17px] font-extrabold">Emitir constancia EFSRT</h3>
          <p className="relative text-[12px] text-blue-100">Esta acción registra el documento de forma oficial.</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <Avatar e={alumno} size="h-11 w-11 text-[12px]" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900">{alumno.nombre}</p>
              <p className="text-[11px] text-slate-500">DNI {alumno.dni} · {alumno.modulo}</p>
            </div>
          </div>
          <ul className="space-y-2 text-[12px]">
            <li className="flex items-center gap-2 text-slate-600"><FiCheckCircle className="h-4 w-4 text-emerald-500" /> {info.horas} / {HORAS_META} horas acreditadas</li>
            <li className="flex items-center gap-2 text-slate-600"><FiShield className="h-4 w-4 text-emerald-500" /> Cumple el requisito de horas para emitir</li>
          </ul>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button onClick={onCancelar} disabled={procesando} className="cs-press h-11 cursor-pointer rounded-xl border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={onConfirmar} disabled={procesando} className="cs-press flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 text-[12px] font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-70">
              {procesando ? <><FiLoader className="cs-spin h-4 w-4" /> Emitiendo...</> : <><FiCheckCircle className="h-4 w-4" /> Confirmar emisión</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════ Modal de impresión masiva ═════════════ */
function ModalImpresion({ lista, moduloLabel, rangoLabel, onConfirmar, onCancelar }) {
  useEffect(() => {
    const onKey = (ev) => { if (ev.key === 'Escape') onCancelar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancelar]);

  return (
    <div className="cs-fade fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onCancelar}>
      <div role="dialog" aria-modal="true" className="cs-modal flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
        <div className="relative shrink-0 bg-gradient-to-br from-blue-700 to-blue-500 px-6 py-6 text-white">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><FiPrinter className="h-6 w-6" /></span>
          <h3 className="relative mt-3 text-[17px] font-extrabold">Imprimir constancias en lote</h3>
          <p className="relative text-[12px] text-blue-100">Se generará una hoja A4 por cada constancia emitida.</p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ['Constancias', lista.length],
              ['Módulo', moduloLabel],
              ['Fechas', rangoLabel],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
                <p className="mt-1 text-[12px] font-bold leading-tight text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
              {lista.map((e, i) => (
                <div key={e.exp || e.dni} style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }} className="cs-up flex items-center gap-3 px-3.5 py-2.5">
                  <Avatar e={e} size="h-8 w-8 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-slate-900">{e.nombre}</p>
                    <p className="text-[11px] text-slate-400">DNI {e.dni}</p>
                  </div>
                  <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">{formatearFecha(fechaDe(e))}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[11px] text-amber-800">
            <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Se abrirá una ventana nueva con el diálogo de impresión. Si tu navegador la bloquea, permite las ventanas emergentes para este sitio.
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 p-5">
          <button onClick={onCancelar} className="cs-press h-11 cursor-pointer rounded-xl border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="cs-press flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 text-[12px] font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
            <FiPrinter className="h-4 w-4" /> Imprimir {lista.length}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════ Datos de respaldo ═════════════ */
const RESPALDO = [
  {
    id_estudiante: 1, id_modulo: 2, fecha_emision: '2026-10-15', nombre: 'Carlos Alberto Pérez Gómez', dni: '72345678', exp: '#EXP-2026-0841',
    ini: 'CP', estado: 'Constancia Emitida', modulo: 'Diseño y Programación Web', moduloKey: 'desarrollo',
    nota: 'Acreditación completada', empresa: 'TechLab Soluciones S.A.C.', asesor: 'Julio César Gutarra Ramos', hrs: 480,
  },
  {
    id_estudiante: 2, id_modulo: 2, fecha_emision: '2026-11-12', nombre: 'Alexis Yeshua Félix Córdova', dni: '61061388', exp: '#EXP-2026-0839',
    ini: 'AF', estado: 'Constancia Emitida', modulo: 'Diseño y Programación Web', moduloKey: 'desarrollo',
    nota: 'Acreditación completada', empresa: 'WORLDNIC Tech', asesor: 'Julio César Gutarra Ramos', hrs: 480,
  },
];

/* ═════════════ Pantalla principal ═════════════ */
export default function Constancias({ onSeleccionarEstudiante, onVerConstancia }) {
  const [vista, setVista] = useState('tarjetas');
  const [busqueda, setBusqueda] = useState('');
  const [modulo, setModulo] = useState('todos');
  const [estado, setEstado] = useState('todos');
  const [orden, setOrden] = useState('nombre');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const [expedientes, setExpedientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [confirmandoImpresion, setConfirmandoImpresion] = useState(false);
  const [toast, setToast] = useState(null);

  const mostrarToast = (tipo, texto) => setToast({ tipo, texto, id: Date.now() });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const cargar = useCallback(() => {
    let activo = true;
    setCargando(true);
    fetch('/api/constancias-efsrt', {
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar con la API');
        return res.json();
      })
      .then((data) => {
        if (!activo) return;
        const lista = Array.isArray(data) ? data : (data.expedientes || data.data || []);
        setExpedientes(lista.length > 0 ? lista : RESPALDO);
        setCargando(false);
      })
      .catch(() => {
        if (!activo) return;
        setExpedientes(RESPALDO);
        setCargando(false);
      });
    return () => { activo = false; };
  }, []);

  useEffect(() => cargar(), [cargar]);

  const handleEmitirConstancia = async (estudiante) => {
    setProcesandoId(estudiante.id_estudiante);
    try {
      const response = await fetch('/api/constancias/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id_estudiante: estudiante.id_estudiante, id_modulo: estudiante.id_modulo || 2, tipo_emision: 'Original' }),
      });
      const resData = await response.json();
      if (response.ok) {
        const docGenerado = resData.data?.codigo_documento || resData.constancia?.codigo_documento || '#CONST-GEN';
        setExpedientes((prev) =>
          prev.map((item) =>
            item.id_estudiante === estudiante.id_estudiante
              ? { ...item, estado: 'Constancia Emitida', exp: docGenerado, codigo_documento: docGenerado }
              : item
          )
        );
        mostrarToast('ok', `Constancia emitida para ${estudiante.nombre}.`);
      } else {
        mostrarToast('error', resData.message || 'No se pudo generar la constancia.');
      }
    } catch {
      mostrarToast('error', 'Error de conexión al emitir la constancia.');
    } finally {
      setProcesandoId(null);
      setConfirmando(null);
    }
  };

  // Base: búsqueda + módulo (para que los contadores de las pestañas sean coherentes)
  const base = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return expedientes.filter(
      (e) =>
        (modulo === 'todos' || e.moduloKey === modulo) &&
        (!q || [e.nombre, e.dni, e.exp].some((t) => (t || '').toLowerCase().includes(q))) &&
        dentroDeRango(e, desde, hasta)
    );
  }, [expedientes, busqueda, modulo, desde, hasta]);

  const conteos = useMemo(() => {
    const c = { todos: base.length, 'Apto para Constancia': 0, 'Constancia Emitida': 0, 'Horas Incompletas': 0 };
    base.forEach((e) => { c[calcular(e).estadoVisual] += 1; });
    return c;
  }, [base]);

  // Constancias emitidas que cumplen módulo + fechas + búsqueda (todas las páginas, no solo la visible)
  const paraImprimir = useMemo(() => base.filter((e) => calcular(e).emitida), [base]);
  const moduloLabel = OPC_MODULO.find(([k]) => k === modulo)?.[1] || 'Todos los Módulos';
  const rangoLabel =
    desde || hasta
      ? `${desde ? formatearFecha(desde) : 'Inicio'} – ${hasta ? formatearFecha(hasta) : 'Hoy'}`
      : 'Todas las fechas';

  const imprimirTodas = () => {
    const w = window.open('', '_blank');
    if (!w) {
      mostrarToast('error', 'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.');
      return;
    }
    w.document.open();
    w.document.write(generarHtmlConstancias(paraImprimir));
    w.document.close();
    setConfirmandoImpresion(false);
    mostrarToast('ok', `Preparando ${paraImprimir.length} constancia(s) para imprimir.`);
  };

  const filtrada = useMemo(() => {
    const arr = base.filter((e) => estado === 'todos' || calcular(e).estadoVisual === estado);
    const copia = [...arr];
    if (orden === 'nombre') copia.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    if (orden === 'horas_desc') copia.sort((a, b) => calcular(b).horas - calcular(a).horas);
    if (orden === 'horas_asc') copia.sort((a, b) => calcular(a).horas - calcular(b).horas);
    return copia;
  }, [base, estado, orden]);

  const totalPaginas = Math.max(1, Math.ceil(filtrada.length / POR_PAGINA));
  useEffect(() => { setPagina(1); }, [busqueda, modulo, estado, orden, desde, hasta]);
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [totalPaginas, pagina]);
  const lista = filtrada.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const hayFiltros = busqueda || modulo !== 'todos' || estado !== 'todos' || desde || hasta;
  const limpiar = () => { setBusqueda(''); setModulo('todos'); setEstado('todos'); setDesde(''); setHasta(''); };
  const aplicarPreset = (k) => {
    const [d, h] = rangoPreset(k);
    const yaActivo = desde === d && hasta === h;
    setDesde(yaActivo ? '' : d);
    setHasta(yaActivo ? '' : h);
  };

  const emitidas = expedientes.filter((e) => e.estado === 'Constancia Emitida').length;
  const aptos = expedientes.filter((e) => calcular(e).apto).length;
  const pctEmitidas = expedientes.length ? Math.round((emitidas / expedientes.length) * 100) : 0;

  return (
    <div className="w-full bg-slate-50/60 px-4 py-5 text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}>
      <style>{ESTILOS}</style>

      <div className="mx-auto max-w-[1400px] space-y-5">
        {/* Encabezado */}
        <header className="cs-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
              <span className="h-px w-6 bg-blue-600" /> Gestión académica
            </div>
            <h1 className="mt-1.5 text-[24px] font-extrabold leading-tight tracking-tight">Constancias EFSRT</h1>
            <p className="mt-1 max-w-2xl text-[12px] text-slate-500">
              Emisión y control institucional de constancias de Experiencias Formativas en Situaciones Reales de Trabajo.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-600 shadow-sm">Periodo 2026-I</span>
            <button
              onClick={cargar}
              disabled={cargando}
              className="cs-press flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-[11px] font-bold text-slate-700 shadow-sm hover:border-blue-500 hover:text-blue-600 disabled:opacity-60"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${cargando ? 'cs-spin' : ''}`} /> Actualizar
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi delay={0.05} icon={FiFileText} valor={expedientes.length} label="Expedientes" detalle="En seguimiento" tono={{ fondo: 'bg-blue-50', texto: 'text-blue-600' }} />
          <Kpi delay={0.1} icon={FiAward} valor={emitidas} label="Constancias emitidas" detalle="Del total de expedientes" anillo={pctEmitidas} tono={{ fondo: 'bg-emerald-50', texto: 'text-emerald-600' }} />
          <Kpi delay={0.15} icon={FiCheckCircle} valor={aptos} label="Aptos para emitir" detalle="Listos para constancia" tono={{ fondo: 'bg-amber-50', texto: 'text-amber-600' }} />
        </div>

        {/* Barra de herramientas */}
        <div style={{ animationDelay: '.2s' }} className={`${card} cs-up space-y-3.5 p-4`}>
          {/* Pestañas de estado */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1">
            {TABS.map(([k, label]) => {
              const activa = estado === k;
              return (
                <button
                  key={k}
                  onClick={() => setEstado(k)}
                  className={`cs-press flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-bold ${activa ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {label}
                  <span className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-extrabold transition-colors ${activa ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {conteos[k] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 text-slate-400 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <FiSearch className="h-4 w-4" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por alumno, DNI o código de expediente..."
                className="w-full bg-transparent text-[12px] text-slate-900 outline-none"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="cursor-pointer text-slate-400 hover:text-slate-900" aria-label="Borrar búsqueda">
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={modulo} onChange={setModulo} opciones={OPC_MODULO} w="w-[200px]" />
            <Select value={orden} onChange={setOrden} opciones={OPC_ORDEN} w="w-[190px]" icon={FiArrowUp} />
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[['tarjetas', FiGrid, 'Tarjetas'], ['tabla', FiList, 'Tabla']].map(([k, Icon, t]) => (
                <button
                  key={k}
                  onClick={() => setVista(k)}
                  className={`cs-press flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-bold ${vista === k ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por fecha */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <FiCalendar className="h-3.5 w-3.5" /> Fecha
            </span>
            {PRESETS_FECHA.map(([k, label]) => {
              const [d, h] = rangoPreset(k);
              const activo = desde === d && hasta === h;
              return (
                <button
                  key={k}
                  onClick={() => aplicarPreset(k)}
                  className={`cs-press cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                    activo
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                Desde
                <input
                  type="date"
                  value={desde}
                  max={hasta || undefined}
                  onChange={(e) => setDesde(e.target.value)}
                  className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                Hasta
                <input
                  type="date"
                  value={hasta}
                  min={desde || undefined}
                  onChange={(e) => setHasta(e.target.value)}
                  className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
              {(desde || hasta) && (
                <button
                  onClick={() => { setDesde(''); setHasta(''); }}
                  className="cs-pop cs-press grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500"
                  aria-label="Quitar filtro de fecha"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Impresión masiva por módulo y fechas */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
                <FiPrinter className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-slate-900">Impresión masiva de constancias</p>
                <p className="truncate text-[11px] text-slate-500">
                  <b className="text-blue-700">{paraImprimir.length}</b> emitida(s) · {moduloLabel} · {rangoLabel}
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmandoImpresion(true)}
              disabled={paraImprimir.length === 0}
              className="cs-press flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-[12px] font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <FiPrinter className="h-3.5 w-3.5" /> Imprimir todas ({paraImprimir.length})
            </button>
          </div>

          {hayFiltros && (
            <div className="cs-fade flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-500">{filtrada.length} resultado(s) con los filtros aplicados</span>
              <button onClick={limpiar} className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                <FiX className="h-3 w-3" /> Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Contenido */}
        {cargando ? (
          <Esqueleto />
        ) : filtrada.length === 0 ? (
          <div className={`${card} cs-pop py-16 text-center`}>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><FiSearch className="h-6 w-6" /></span>
            <p className="mt-3 text-[14px] font-bold">No se encontraron expedientes</p>
            <p className="text-[12px] text-slate-400">Prueba con otro alumno, DNI o limpia los filtros.</p>
            {hayFiltros && (
              <button onClick={limpiar} className="cs-press mt-4 cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-blue-700">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : vista === 'tarjetas' ? (
          <div key={`t-${pagina}-${estado}-${orden}`} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {lista.map((e, i) => (
              <Tarjeta
                key={e.exp || e.dni}
                e={e}
                indice={i}
                onSeleccionarEstudiante={onSeleccionarEstudiante}
                onVerConstancia={onVerConstancia}
                onPedirEmision={setConfirmando}
                procesandoId={procesandoId}
              />
            ))}
          </div>
        ) : (
          <TablaExpedientes
            key={`tb-${pagina}-${estado}-${orden}`}
            lista={lista}
            onSeleccionarEstudiante={onSeleccionarEstudiante}
            onVerConstancia={onVerConstancia}
            onPedirEmision={setConfirmando}
            procesandoId={procesandoId}
          />
        )}

        {/* Paginación */}
        {!cargando && filtrada.length > 0 && (
          <div className={`${card} flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[12px] text-slate-500`}>
            <span>
              Mostrando <b className="text-slate-900">{lista.length}</b> de <b className="text-slate-900">{filtrada.length}</b> expedientes
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                aria-label="Página anterior"
                className="cs-press grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  className={`cs-press h-9 w-9 cursor-pointer rounded-xl text-[12px] font-bold ${
                    n === pagina ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                aria-label="Página siguiente"
                className="cs-press grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {confirmando && (
        <ModalEmision
          alumno={confirmando}
          procesando={procesandoId === confirmando.id_estudiante}
          onConfirmar={() => handleEmitirConstancia(confirmando)}
          onCancelar={() => setConfirmando(null)}
        />
      )}

      {/* Modal de impresión masiva */}
      {confirmandoImpresion && (
        <ModalImpresion
          lista={paraImprimir}
          moduloLabel={moduloLabel}
          rangoLabel={rangoLabel}
          onConfirmar={imprimirTodas}
          onCancelar={() => setConfirmandoImpresion(false)}
        />
      )}

      {/* Notificación */}
      {toast && (
        <div
          key={toast.id}
          className={`cs-toast fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-[12px] font-semibold shadow-xl ${
            toast.tipo === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${toast.tipo === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.tipo === 'ok' ? <FiCheckCircle className="h-4 w-4" /> : <FiAlertCircle className="h-4 w-4" />}
          </span>
          <span className="flex-1">{toast.texto}</span>
          <button onClick={() => setToast(null)} className="cursor-pointer opacity-60 hover:opacity-100" aria-label="Cerrar">
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}