import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  FiSearch, FiChevronDown, FiGrid, FiList, FiRefreshCw, FiFolder, FiFileText,
  FiCheckCircle, FiChevronLeft, FiChevronRight, FiAward, FiLoader, FiPrinter,
  FiClock, FiX, FiAlertCircle, FiArrowUp, FiShield, FiCalendar, FiFilter, FiLayers,
} from 'react-icons/fi';
import api, { getCachedData, invalidateApiCache } from '../../../api/axios';
import VistaConstanciaPDF from './VistaConstanciaPDF';
import AvatarEstudiante from '../../AvatarEstudiante.jsx';

/* ═════════════ Sistema de animación ═════════════ */
const ESTILOS = `
@keyframes cs-up { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:translateY(0);} }
@keyframes cs-pop { 0% { opacity:0; transform:scale(.96);} 100% { opacity:1; transform:scale(1);} }
@keyframes cs-modal { 0% { opacity:0; transform:translateY(18px) scale(.96);} 100% { opacity:1; transform:translateY(0) scale(1);} }
@keyframes cs-fade { from { opacity:0;} to { opacity:1;} }
@keyframes cs-toast { from { opacity:0; transform:translateY(16px) scale(.97);} to { opacity:1; transform:translateY(0) scale(1);} }
@keyframes cs-skel { 0%,100% { opacity:.5;} 50% { opacity:1;} }
@keyframes cs-ring { 0% { box-shadow:0 0 0 0 rgba(37,99,235,.40);} 100% { box-shadow:0 0 0 9px rgba(37,99,235,0);} }
@keyframes cs-draw { from { stroke-dashoffset: var(--cs-len);} to { stroke-dashoffset: var(--cs-off);} }
@keyframes cs-spin { to { transform: rotate(360deg);} }
@keyframes cs-grow { from { width:0;} }
.cs-up { animation: cs-up .45s cubic-bezier(.22,1,.36,1) both; }
.cs-pop { animation: cs-pop .3s cubic-bezier(.22,1,.36,1) both; }
.cs-modal { animation: cs-modal .3s cubic-bezier(.22,1,.36,1) both; }
.cs-fade { animation: cs-fade .2s ease-out both; }
.cs-toast { animation: cs-toast .3s ease-out both; }
.cs-skel { animation: cs-skel 1.4s ease-in-out infinite; }
.cs-pulse { animation: cs-ring 1.9s ease-out infinite; }
.cs-draw { animation: cs-draw .9s cubic-bezier(.22,1,.36,1) both; }
.cs-spin { animation: cs-spin .9s linear infinite; }
.cs-grow { animation: cs-grow .8s cubic-bezier(.22,1,.36,1) both; }
.cs-lift { transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease, border-color .25s ease; }
.cs-lift:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -18px rgba(15,23,42,.28); border-color:#cbd5e1; }
.cs-press { transition: transform .15s ease, filter .2s ease, background-color .2s ease, border-color .2s ease, color .2s ease; }
.cs-press:active:not(:disabled) { transform: scale(.97); }
@media (prefers-reduced-motion: reduce) { .cs-up,.cs-pop,.cs-modal,.cs-fade,.cs-toast,.cs-skel,.cs-pulse,.cs-draw,.cs-spin,.cs-grow { animation:none !important; } .cs-lift:hover { transform:none; } }
`;

/* ═════════════ Catálogo de los 3 Módulos Formativos ═════════════ */
const MODULOS_INFO = {
  modulo1: {
    id: 1,
    corto: 'Módulo I',
    nombre: 'Módulo I – Gestión de Soporte Técnico, Seguridad y Tecnologías de la Información',
    punto: 'bg-cyan-500',
  },
  modulo2: {
    id: 2,
    corto: 'Módulo II',
    nombre: 'Módulo II – Desarrollo de Software y Gestión de Base de Datos',
    punto: 'bg-blue-600',
  },
  modulo3: {
    id: 3,
    corto: 'Módulo III',
    nombre: 'Módulo III – Gestión de Aplicaciones para Internet y Producción Multimedia',
    punto: 'bg-violet-500',
  },
};

const moduloPunto = {
  modulo1: MODULOS_INFO.modulo1.punto,
  modulo2: MODULOS_INFO.modulo2.punto,
  modulo3: MODULOS_INFO.modulo3.punto,
};

const estadoPunto = {
  'Constancia Emitida': 'bg-blue-600',
  'Apto para Constancia': 'bg-emerald-500',
  'Horas Incompletas': 'bg-amber-500',
};

const OPC_MODULO = [
  ['todos', 'Todos los Módulos'],
  ['modulo1', 'Módulo I – Soporte y TI'],
  ['modulo2', 'Módulo II – Desarrollo de Software'],
  ['modulo3', 'Módulo III – Aplicaciones y Multimedia'],
];

const CHIPS_MODULO = [
  ['todos', 'Todos', null],
  ['modulo1', 'Módulo I', MODULOS_INFO.modulo1.punto],
  ['modulo2', 'Módulo II', MODULOS_INFO.modulo2.punto],
  ['modulo3', 'Módulo III', MODULOS_INFO.modulo3.punto],
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

const HORAS_META = 160;
const POR_PAGINA = 6;

const card = 'bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const fv = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';

/* ═════════════ Lectura segura de almacenamiento local ═════════════ */
const leerStorageSeguro = (clave) => {
  try {
    const raw = sessionStorage.getItem(clave) ?? localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const buscarDatosGuardadosModulo = (idEstudiante, idModulo) => {
  if (!idEstudiante) return null;
  const claves = [
    `expediente_calificacion_${idEstudiante}_m${idModulo}`,
    `expediente_calificacion_${idEstudiante}_${idModulo}`,
    `expediente_efsrt_${idEstudiante}_${idModulo}`,
    `expediente_efsrt_${idEstudiante}_m${idModulo}`,
  ];
  for (const k of claves) {
    const val = leerStorageSeguro(k);
    if (val && typeof val === 'object') return val;
  }
  return null;
};

/* ═════════════ Resolución de Módulos (I, II, III) ═════════════ */
const resolverModulo = (raw = {}) => {
  const idNum = Number(
    raw.id_modulo ??
      raw.modulo_id ??
      raw.numero_modulo ??
      raw.modulo?.id_modulo ??
      raw.modulo?.id ??
      NaN
  );

  if (idNum === 1) return { key: 'modulo1', id: 1, etiqueta: raw.nombre_modulo || MODULOS_INFO.modulo1.nombre };
  if (idNum === 2) return { key: 'modulo2', id: 2, etiqueta: raw.nombre_modulo || MODULOS_INFO.modulo2.nombre };
  if (idNum === 3) return { key: 'modulo3', id: 3, etiqueta: raw.nombre_modulo || MODULOS_INFO.modulo3.nombre };

  const textoOriginal =
    (typeof raw.modulo === 'string' ? raw.modulo : raw.modulo?.nombre) ||
    raw.nombre_modulo ||
    raw.titulo_modulo ||
    '';
  const t = String(textoOriginal).toLowerCase().trim();

  if (
    t.includes('módulo iii') ||
    t.includes('modulo iii') ||
    t.includes('modulo 3') ||
    t.includes('módulo 3') ||
    t.includes('tercer') ||
    t.includes('internet') ||
    t.includes('multimedia') ||
    t.includes('red')
  ) {
    return { key: 'modulo3', id: 3, etiqueta: textoOriginal || MODULOS_INFO.modulo3.nombre };
  }

  if (
    t.includes('módulo ii') ||
    t.includes('modulo ii') ||
    t.includes('modulo 2') ||
    t.includes('módulo 2') ||
    t.includes('segund') ||
    t.includes('desarrollo') ||
    t.includes('software') ||
    t.includes('base de datos')
  ) {
    return { key: 'modulo2', id: 2, etiqueta: textoOriginal || MODULOS_INFO.modulo2.nombre };
  }

  if (
    t.includes('módulo i') ||
    t.includes('modulo i') ||
    t.includes('modulo 1') ||
    t.includes('módulo 1') ||
    t.includes('primer') ||
    t.includes('soporte') ||
    t.includes('seguridad')
  ) {
    return { key: 'modulo1', id: 1, etiqueta: textoOriginal || MODULOS_INFO.modulo1.nombre };
  }

  const sem = String(raw.semestre || '').toUpperCase();
  if (sem.includes('V') || sem.includes('VI') || sem.includes('5') || sem.includes('6')) {
    return { key: 'modulo3', id: 3, etiqueta: MODULOS_INFO.modulo3.nombre };
  }
  if (sem.includes('III') || sem.includes('IV') || sem.includes('3') || sem.includes('4')) {
    return { key: 'modulo2', id: 2, etiqueta: MODULOS_INFO.modulo2.nombre };
  }
  return { key: 'modulo1', id: 1, etiqueta: MODULOS_INFO.modulo1.nombre };
};

/* ═════════════ Validación de constancia emitida / ID / impresión previa ═════════════ */
const tieneConstanciaYaEmitida = (item) => {
  if (!item || typeof item !== 'object') return false;
  const estadoRaw = String(item.estado || item.estado_constancia || '').toLowerCase();
  return Boolean(
    item.emitida ||
      item.impreso ||
      item.id_constancia ||
      item.codigo_documento ||
      item.codigo_constancia ||
      estadoRaw.includes('emitid')
  );
};

/* ═════════════ Normalización, cumplimiento de práctica y vínculo con expediente ═════════════ */
const extraerArreglo = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.expedientes)) return payload.expedientes;
  if (Array.isArray(payload.constancias)) return payload.constancias;
  if (Array.isArray(payload.estudiantes)) return payload.estudiantes;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  if (payload.data && Array.isArray(payload.data.expedientes)) return payload.data.expedientes;
  return [];
};

const estaCumplidoYListoParaConstancia = (item) => {
  if (!item || typeof item !== 'object') return false;

  const estadoRaw = String(item.estado || item.estado_constancia || item.estado_efsrt || '').toLowerCase();
  const constanciaEmitida =
    tieneConstanciaYaEmitida(item) ||
    estadoRaw.includes('culminad');

  const marcadoListo = Boolean(
    item.listo_para_constancia ||
      item.apto_constancia ||
      estadoRaw.includes('listo') ||
      estadoRaw.includes('apto') ||
      estadoRaw.includes('verificad') ||
      estadoRaw.includes('validad') ||
      estadoRaw.includes('aprob') ||
      estadoRaw.includes('complet') ||
      estadoRaw.includes('egresad')
  );

  const notaNumerica = Number(
    item.nota ??
      item.nota_final ??
      item.promedio ??
      item.promedio_final ??
      item.calificacion ??
      NaN
  );
  const tieneNotaAprobatoria = !Number.isNaN(notaNumerica) && notaNumerica >= 13;

  const evidenciasArr = Array.isArray(item.evidencias)
    ? item.evidencias
    : Array.isArray(item.documentos)
    ? item.documentos
    : Array.isArray(item.entregables)
    ? item.entregables
    : [];
  const cantidadEvidencias = Number(
    item.total_evidencias ?? item.evidencias_count ?? item.nro_evidencias ?? evidenciasArr.length ?? 0
  );

  const horasNum = Number(
    item.hrs ?? item.horas_acumuladas ?? item.horas_completadas ?? item.horas_efsrt ?? item.horas ?? 0
  );
  const metaHoras = Number(item.horas_requeridas ?? HORAS_META) || HORAS_META;
  const horasCumplidas = horasNum >= metaHoras;

  return (
    constanciaEmitida ||
    marcadoListo ||
    horasCumplidas ||
    (Boolean(item.verificado_docente) && (tieneNotaAprobatoria || cantidadEvidencias > 0))
  );
};

const normalizarRegistro = (raw, idx = 0, expedientesMap = new Map(), estudiantesMap = new Map()) => {
  const estObj = raw.estudiante && typeof raw.estudiante === 'object' ? raw.estudiante : {};
  const expObj = raw.expediente && typeof raw.expediente === 'object' ? raw.expediente : {};

  const idEstudiante =
    raw.id_estudiante ??
    estObj.id_estudiante ??
    expObj.id_estudiante ??
    raw.id ??
    idx + 1;

  const dni = String(raw.dni ?? estObj.dni ?? expObj.dni ?? '').trim();
  const estMatch = estudiantesMap.get(String(idEstudiante)) || (dni ? estudiantesMap.get(dni) : null) || {};
  const expMatch = expedientesMap.get(String(idEstudiante)) || (dni ? expedientesMap.get(dni) : null) || {};

  const modResuelto = resolverModulo({
    ...estMatch,
    ...expMatch,
    ...raw,
    id_modulo: raw.id_modulo ?? expObj.id_modulo ?? expMatch.id_modulo ?? raw.modulo_id,
    modulo: raw.modulo ?? expObj.modulo ?? expMatch.modulo,
  });

  const localGuardado = buscarDatosGuardadosModulo(idEstudiante, modResuelto.id) || {};

  const combinado = {
    ...estMatch,
    ...expMatch,
    ...raw,
    ...localGuardado,
  };

  const nombres = combinado.nombres ?? estObj.nombres ?? estMatch.nombres ?? '';
  const apellidos = combinado.apellidos ?? estObj.apellidos ?? estMatch.apellidos ?? '';
  const nombre =
    combinado.nombre ||
    estObj.nombre ||
    `${nombres} ${apellidos}`.trim() ||
    `${estMatch.nombres || ''} ${estMatch.apellidos || ''}`.trim() ||
    'Estudiante sin nombre';

  const idExpediente =
    combinado.id_expediente ??
    expObj.id_expediente ??
    expMatch.id_expediente ??
    raw.expediente_id ??
    null;

  const expCodigo =
    combinado.codigo_documento ||
    combinado.exp ||
    combinado.codigo_expediente ||
    combinado.numero_expediente ||
    expObj.codigo_expediente ||
    expObj.codigo ||
    expMatch.codigo_expediente ||
    expMatch.codigo ||
    (idExpediente
      ? `#EXP-${idExpediente}`
      : `#EXP-M${modResuelto.id}-${String(idEstudiante).padStart(4, '0')}`);

  const horasRequeridas = Number(
    combinado.horas_requeridas ?? expObj.horas_requeridas ?? expMatch.horas_requeridas ?? HORAS_META
  ) || HORAS_META;

  const horasRaw = Number(
    combinado.hrs ??
      combinado.horas_acumuladas ??
      combinado.horas_completadas ??
      combinado.horas_efsrt ??
      combinado.horas ??
      expObj.horas_acumuladas ??
      expMatch.horas_acumuladas ??
      0
  );

  const estadoOriginal =
    combinado.estado ||
    combinado.estado_constancia ||
    expObj.estado ||
    expMatch.estado ||
    '';

  const emitidaFlag =
    tieneConstanciaYaEmitida(combinado) ||
    estadoOriginal === 'Constancia Emitida' ||
    estadoOriginal === 'Emitida' ||
    estadoOriginal === 'Culminado' ||
    estadoOriginal === 'Culminada';

  const notaNum = Number(
    combinado.nota ??
      combinado.nota_final ??
      combinado.promedio ??
      combinado.calificacion ??
      NaN
  );

  const aptoFlag =
    !emitidaFlag &&
    (Boolean(combinado.listo_para_constancia) ||
      horasRaw >= horasRequeridas ||
      estMatch.estado === 'Egresado' ||
      (Boolean(combinado.verificado_docente) && !Number.isNaN(notaNum) && notaNum >= 13));

  const estadoNormalizado = emitidaFlag
    ? 'Constancia Emitida'
    : aptoFlag
    ? 'Apto para Constancia'
    : 'Horas Incompletas';

  return {
    ...combinado,
    id_estudiante: idEstudiante,
    id_expediente: idExpediente,
    id_modulo: modResuelto.id,
    id_constancia: combinado.id_constancia ?? null,
    moduloKey: modResuelto.key,
    modulo: modResuelto.etiqueta,
    dni,
    nombres: nombres || estMatch.nombres || '',
    apellidos: apellidos || estMatch.apellidos || '',
    nombre,
    exp: expCodigo,
    codigo_expediente: expCodigo,
    codigo_documento: combinado.codigo_documento || combinado.codigo_constancia || '',
    emitida: emitidaFlag,
    empresa:
      combinado.empresa ||
      combinado.empresa_nombre ||
      combinado.empresa_institucion ||
      combinado.razon_social ||
      expObj.empresa ||
      expMatch.empresa ||
      'Empresa formadora asignada',
    asesor:
      combinado.asesor ||
      combinado.docente_asesor ||
      combinado.docente_asignado ||
      combinado.docente_responsable ||
      expObj.asesor ||
      expMatch.asesor ||
      'Docente asesor EFSRT',
    nota: !Number.isNaN(notaNum) ? notaNum : null,
    estado_portafolio:
      combinado.estado_portafolio ||
      expObj.estado_portafolio ||
      expMatch.estado_portafolio ||
      'Conforme',
    horas_requeridas: horasRequeridas,
    hrs: horasRaw > 0 ? horasRaw : emitidaFlag || aptoFlag ? horasRequeridas : 0,
    estado: estadoNormalizado,
    fecha_emision:
      combinado.fecha_emision ||
      combinado.fecha_constancia ||
      combinado.fecha ||
      expObj.fecha_emision ||
      expMatch.fecha_emision ||
      combinado.created_at ||
      '',
  };
};

const calcular = (e) => {
  const meta = Number(e.horas_requeridas) || HORAS_META;
  const horas = Number(e.hrs) || 0;
  const emitida = tieneConstanciaYaEmitida(e) || e.estado === 'Constancia Emitida';
  const completas = horas >= meta || emitida || Boolean(e.listo_para_constancia);
  const apto = completas && !emitida;
  const estadoVisual = emitida ? 'Constancia Emitida' : apto ? 'Apto para Constancia' : 'Horas Incompletas';
  const pct = Math.min(100, Math.round((horas / meta) * 100));
  return { horas, meta, completas, emitida, apto, estadoVisual, pct };
};

/* ───── Fechas ───── */
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

const dentroDeRango = (e, desde, hasta) => {
  if (!desde && !hasta) return true;
  const f = fechaDe(e);
  if (!f) return false;
  let lo = desde;
  let hi = hasta;
  if (lo && hi && lo > hi) [lo, hi] = [hi, lo];
  return (!lo || f >= lo) && (!hi || f <= hi);
};

/* ───── Impresión masiva ───── */
const NOMBRE_INSTITUCION = 'IESTP "Andrés Avelino Cáceres Dorregaray"';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const fechaLarga = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${Number(d)} de ${MESES[Number(m) - 1]} de ${a}`;
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
            ha culminado y aprobado satisfactoriamente el
            <b>${esc(e.modulo)}</b>, acumulando
            <b>${info.horas} horas</b> de experiencia formativa en
            <b>${esc(e.empresa || 'la empresa formadora')}</b>, bajo la asesoría del docente
            <b>${esc(e.asesor || 'asignado')}</b>${e.nota != null ? ` con calificación final de <b>${Number(e.nota).toFixed(2)} / 20</b>` : ''}.
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
function useContador(objetivo, duracion = 500) {
  const [v, setV] = useState(objetivo);
  const ref = useRef(objetivo);
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

const Select = ({ value, onChange, opciones, w, icon: Icon, etiqueta }) => (
  <div className={`relative ${w}`}>
    {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />}
    <select
      value={value}
      aria-label={etiqueta}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-9 text-[12px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${Icon ? 'pl-9' : 'pl-3.5'}`}
    >
      {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
  </div>
);

const Badge = ({ estado }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
    <i className={`h-1.5 w-1.5 rounded-full ${estadoPunto[estado] || estadoPunto['Horas Incompletas']} ${estado === 'Apto para Constancia' ? 'animate-pulse' : ''}`} />
    {estado}
  </span>
);

const ModuloChip = ({ e }) => (
  <span className="inline-flex max-w-full items-center gap-1.5 text-[12px] font-semibold text-slate-800" title={e.modulo}>
    <i className={`h-2 w-2 shrink-0 rounded-full ${moduloPunto[e.moduloKey] || moduloPunto.modulo1}`} />
    <span className="truncate">{e.modulo}</span>
  </span>
);

const BarraHoras = ({ pct, completas }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
    <div
      className={`cs-grow h-full rounded-full ${completas ? 'bg-blue-600' : 'bg-amber-500'}`}
      style={{ width: `${pct}%`, transition: 'width .8s cubic-bezier(.22,1,.36,1)' }}
    />
  </div>
);

const Avatar = ({ e, size = 'h-11 w-11 text-[12px]' }) => (
  <span className={`${size} relative block shrink-0 rounded-full border border-slate-200 bg-white font-bold text-slate-700`}>
    <AvatarEstudiante
      estudiante={e}
      className="h-full w-full rounded-full"
    />
    <i className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${moduloPunto[e.moduloKey] || moduloPunto.modulo1}`} />
  </span>
);

const Kpi = ({ icon: Icon, valor, label, detalle, color, delay, anillo }) => {
  const n = useContador(valor);
  return (
    <div style={{ animationDelay: `${delay}s` }} className={`${card} cs-up cs-lift flex items-center gap-4 p-5`}>
      {anillo !== undefined ? (
        <Anillo pct={anillo} size={52} color={color}>{anillo}%</Anillo>
      ) : (
        <span className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-slate-200 bg-white ${color}`}><Icon className="h-5 w-5" /></span>
      )}
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-slate-500">{label}</div>
        <div className="text-[28px] font-extrabold leading-tight tracking-tight tabular-nums text-slate-900">{n}</div>
        <div className="text-[11px] text-slate-400">{detalle}</div>
      </div>
    </div>
  );
};

function BotonAccion({ e, info, procesandoId, onVerConstancia, onPedirEmision, compacto = false }) {
  const { emitida, apto } = info;
  const cargandoEste = procesandoId === `${e.id_estudiante}-${e.id_modulo}`;
  const tam = compacto ? 'h-8 px-3 text-[11px]' : 'h-10 text-[12px]';
  return (
    <button
      type="button"
      disabled={(!apto && !emitida) || cargandoEste}
      onClick={() => {
        if (emitida) {
          onVerConstancia && onVerConstancia(e);
        } else if (apto) {
          onPedirEmision(e);
        }
      }}
      className={`${tam} cs-press ${fv} flex items-center justify-center gap-2 rounded-lg font-bold ${
        emitida
          ? 'cursor-pointer bg-slate-900 text-white hover:bg-slate-800'
          : apto
          ? 'cs-pulse cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
          : 'cursor-not-allowed border border-slate-200 bg-white text-slate-400'
      }`}
    >
      {cargandoEste ? <FiLoader className="cs-spin h-3.5 w-3.5" />
        : emitida ? <><FiPrinter className="h-3.5 w-3.5" /> Ver Constancia</>
        : apto ? <><FiAward className="h-3.5 w-3.5" /> Emitir Constancia</>
        : <><FiClock className="h-3.5 w-3.5" /> Horas Incompletas</>}
    </button>
  );
}

function Tarjeta({ e, indice, onVerExpediente, onVerConstancia, onPedirEmision, procesandoId }) {
  const info = calcular(e);
  const abrir = () => onVerExpediente(e);
  return (
    <article style={{ animationDelay: `${indice * 0.04}s` }} className={`${card} cs-up cs-lift group`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={abrir} className={`flex min-w-0 cursor-pointer items-center gap-3.5 rounded-lg text-left ${fv}`}>
            <Avatar e={e} size="h-12 w-12 text-[13px]" />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-600">{e.nombre}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>DNI {e.dni || '—'}</span><span>•</span>
                <span className="font-mono font-semibold text-slate-500">{e.exp}</span>
              </div>
            </div>
          </button>
          <Badge estado={info.estadoVisual} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            <dt className="mb-1 text-[11px] text-slate-400">Módulo formativo</dt>
            <dd><ModuloChip e={e} /></dd>
          </div>
          <div className="min-w-0">
            <dt className="mb-1 text-[11px] text-slate-400">Empresa de práctica</dt>
            <dd className="truncate text-[12px] font-semibold text-slate-800">{e.empresa}</dd>
          </div>
          <div className="min-w-0">
            <dt className="mb-1 text-[11px] text-slate-400">Asesor / Nota</dt>
            <dd className="truncate text-[12px] font-semibold text-slate-800">
              {e.asesor}
              {e.nota != null ? ` · ${Number(e.nota).toFixed(2)}/20` : ''}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="mb-1 text-[11px] text-slate-400">Portafolio / Fecha</dt>
            <dd className="truncate text-[12px] font-semibold text-slate-800">
              {e.estado_portafolio} · {formatearFecha(fechaDe(e))}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-[11px] text-slate-400">
            <span><b className={info.completas ? 'text-blue-600' : 'text-amber-600'}>{info.horas}</b> / {info.meta} horas EFSRT</span>
            <b className="text-slate-700">{info.pct}%</b>
          </div>
          <BarraHoras pct={info.pct} completas={info.completas} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_1.35fr]">
          <button
            type="button"
            onClick={abrir}
            className={`cs-press ${fv} flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600`}
          >
            <FiFolder className="h-3.5 w-3.5" /> Ver Expediente
          </button>
          <BotonAccion e={e} info={info} procesandoId={procesandoId} onVerConstancia={onVerConstancia} onPedirEmision={onPedirEmision} />
        </div>
      </div>
    </article>
  );
}

function TablaExpedientes({ lista, onVerExpediente, onVerConstancia, onPedirEmision, procesandoId }) {
  return (
    <div className={`${card} cs-pop overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {['Alumno', 'Expediente', 'Módulo', 'Empresa / Asesor', 'Fecha', 'Avance', 'Estado', 'Acciones'].map((c) => (
                <th key={c} className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((e, i) => {
              const info = calcular(e);
              return (
                <tr
                  key={`${e.id_estudiante}-${e.id_modulo}-${e.exp}-${i}`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                  className="cs-up group border-b border-slate-100 text-[12px] transition-colors last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onVerExpediente(e)} className={`flex cursor-pointer items-center gap-3 rounded-lg text-left ${fv}`}>
                      <Avatar e={e} size="h-9 w-9 text-[11px]" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-900 transition-colors group-hover:text-blue-600">{e.nombre}</div>
                        <div className="text-[11px] text-slate-400">
                          DNI {e.dni || '—'}
                          {e.nota != null ? ` · Nota ${Number(e.nota).toFixed(2)}` : ''}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 font-mono text-slate-500">{e.exp}</td>
                  <td className="max-w-[230px] px-4"><ModuloChip e={e} /></td>
                  <td className="px-4 text-slate-500">
                    <div className="font-semibold text-slate-700">{e.empresa}</div>
                    <div className="text-[11px] text-slate-400">{e.asesor}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 font-medium text-slate-600">{formatearFecha(fechaDe(e))}</td>
                  <td className="min-w-[150px] px-4">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <b className={info.completas ? 'text-blue-600' : 'text-amber-600'}>{info.horas} / {info.meta} h</b>
                      <span className="text-slate-400">{info.pct}%</span>
                    </div>
                    <BarraHoras pct={info.pct} completas={info.completas} />
                  </td>
                  <td className="px-4"><Badge estado={info.estadoVisual} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onVerExpediente(e)}
                        className={`cs-press ${fv} inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600`}
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
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{ animationDelay: `${i * 0.08}s` }} className={`${card} cs-skel space-y-4 p-5`}>
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2"><div className="h-3.5 w-2/3 rounded bg-slate-100" /><div className="h-3 w-1/3 rounded bg-slate-100" /></div>
        </div>
        <div className="h-20 rounded-lg bg-slate-100" />
        <div className="h-10 rounded-lg bg-slate-100" />
      </div>
    ))}
  </div>
);

/* ═════════════ Módulo de filtros ═════════════ */
const Modulo = ({ icon: Icon, titulo, className = '', children }) => (
  <div className={`p-5 ${className}`}>
    <div className="mb-3.5 flex items-center gap-2 text-[12px] font-bold text-slate-700">
      <Icon className="h-3.5 w-3.5 text-slate-400" /> {titulo}
    </div>
    {children}
  </div>
);

const Chip = ({ activo, onClick, punto, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={activo}
    className={`cs-press ${fv} flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${
      activo ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
    }`}
  >
    {punto && <i className={`h-2 w-2 rounded-full ${punto} ${activo ? 'ring-2 ring-white/70' : ''}`} />}
    {children}
  </button>
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
      <div role="dialog" aria-modal="true" className="cs-modal w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-start gap-3.5 border-b border-slate-100 px-6 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm"><FiAward className="h-5 w-5" /></span>
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-900">Emitir constancia EFSRT</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">Esta acción registra el documento oficial del {MODULOS_INFO[alumno.moduloKey]?.corto || 'módulo'}.</p>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
            <Avatar e={alumno} size="h-11 w-11 text-[12px]" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900">{alumno.nombre}</p>
              <p className="truncate text-[11px] text-slate-500">DNI {alumno.dni} · {alumno.modulo}</p>
              <p className="truncate text-[11px] text-slate-400">Empresa: {alumno.empresa}</p>
            </div>
          </div>
          <ul className="space-y-2 text-[12px]">
            <li className="flex items-center gap-2 text-slate-600"><FiCheckCircle className="h-4 w-4 text-emerald-500" /> {info.horas} / {info.meta} horas acreditadas</li>
            <li className="flex items-center gap-2 text-slate-600"><FiShield className="h-4 w-4 text-emerald-500" /> Portafolio: {alumno.estado_portafolio}{alumno.nota != null ? ` · Nota: ${Number(alumno.nota).toFixed(2)}/20` : ''}</li>
          </ul>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onCancelar} disabled={procesando} className={`cs-press ${fv} h-11 cursor-pointer rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50`}>
              Cancelar
            </button>
            <button type="button" onClick={onConfirmar} disabled={procesando} className={`cs-press ${fv} flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 text-[12px] font-bold text-white hover:bg-blue-700 disabled:opacity-70`}>
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
      <div role="dialog" aria-modal="true" className="cs-modal flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex shrink-0 items-start gap-3.5 border-b border-slate-100 px-6 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm"><FiPrinter className="h-5 w-5" /></span>
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-900">Imprimir constancias en lote</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">Se generará una hoja A4 por cada constancia emitida.</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 text-center">
            {[
              ['Constancias', lista.length],
              ['Módulo', moduloLabel],
              ['Fechas', rangoLabel],
            ].map(([k, v]) => (
              <div key={k} className="px-2 py-3">
                <p className="text-[11px] text-slate-400">{k}</p>
                <p className="mt-1 text-[12px] font-bold leading-tight text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
              {lista.map((e, i) => (
                <div key={`${e.id_estudiante}-${e.id_modulo}-${e.exp}-${i}`} style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }} className="cs-up flex items-center gap-3 px-3.5 py-2.5">
                  <Avatar e={e} size="h-8 w-8 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-slate-900">{e.nombre}</p>
                    <p className="text-[11px] text-slate-400">DNI {e.dni} · {e.empresa} · {MODULOS_INFO[e.moduloKey]?.corto}</p>
                  </div>
                  <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">{formatearFecha(fechaDe(e))}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="flex items-start gap-2 text-[11px] text-slate-500">
            <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            Se abrirá una ventana nueva con el diálogo de impresión. Si tu navegador la bloquea, permite las ventanas emergentes para este sitio.
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 p-5">
          <button type="button" onClick={onCancelar} className={`cs-press ${fv} h-11 cursor-pointer rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50`}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirmar} className={`cs-press ${fv} flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 text-[12px] font-bold text-white hover:bg-blue-700`}>
            <FiPrinter className="h-4 w-4" /> Imprimir {lista.length}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════ Pantalla principal ═════════════ */
export default function Constancias({ onSeleccionarEstudiante, onVerConstancia }) {
  const cachedConstancias = getCachedData('/constancias-efsrt');
  const cachedEstudiantes = getCachedData('/estudiantes?all=true') || getCachedData('/estudiantes');
  const cachedExpedientes = getCachedData('/constancias-efsrt');

  const construirListaUnificada = useCallback((rawConstancias, rawEstudiantes, rawExpedientes) => {
    const estudiantesMap = new Map();
    rawEstudiantes.forEach((est) => {
      const idKey = String(est.id_estudiante ?? est.id ?? '');
      if (idKey) estudiantesMap.set(idKey, est);
      if (est.dni) estudiantesMap.set(String(est.dni).trim(), est);
    });

    const expedientesMap = new Map();
    rawExpedientes.forEach((exp) => {
      const idKey = String(exp.id_estudiante ?? exp.estudiante_id ?? '');
      if (idKey) expedientesMap.set(idKey, exp);
      if (exp.dni) expedientesMap.set(String(exp.dni).trim(), exp);
    });

    const fuente =
      rawConstancias.length > 0
        ? rawConstancias
        : rawExpedientes.length > 0
        ? rawExpedientes
        : rawEstudiantes;

    return fuente
      .map((item, idx) => normalizarRegistro(item, idx, expedientesMap, estudiantesMap))
      .filter(estaCumplidoYListoParaConstancia);
  }, []);

  const initialRegistros = useMemo(
    () =>
      construirListaUnificada(
        extraerArreglo(cachedConstancias),
        extraerArreglo(cachedEstudiantes),
        extraerArreglo(cachedExpedientes)
      ),
    [cachedConstancias, cachedEstudiantes, cachedExpedientes, construirListaUnificada]
  );

  const [vista, setVista] = useState('tarjetas');
  const [busqueda, setBusqueda] = useState('');
  const [modulo, setModulo] = useState('todos');
  const [estado, setEstado] = useState('todos');
  const [orden, setOrden] = useState('nombre');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const [expedientes, setExpedientes] = useState(initialRegistros);
  const [cargando, setCargando] = useState(initialRegistros.length === 0);
  const [procesandoId, setProcesandoId] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [confirmandoImpresion, setConfirmandoImpresion] = useState(false);
  const [constanciaPDFActiva, setConstanciaPDFActiva] = useState(null);
  const [toast, setToast] = useState(null);

  const mostrarToast = useCallback((tipo, texto) => {
    setToast({ tipo, texto, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAbrirVistaConstancia = useCallback((estudiante) => {
    if (!estudiante) return;

    const vigente =
      expedientes.find(
        (item) =>
          String(item.id_estudiante) === String(estudiante.id_estudiante) &&
          Number(item.id_modulo) === Number(estudiante.id_modulo)
      ) || estudiante;

    const alumnoEmitido = {
      ...vigente,
      ...estudiante,
      emitida: true,
      estado: 'Constancia Emitida',
      codigo_documento:
        estudiante.codigo_documento ||
        vigente.codigo_documento ||
        vigente.exp ||
        `CONST-EFSRT-2026-${String(vigente.id_estudiante).padStart(4, '0')}`,
      fecha_emision:
        estudiante.fecha_emision ||
        vigente.fecha_emision ||
        aISO(new Date()),
    };

    try {
      sessionStorage.setItem('constancia_pdf_actual', JSON.stringify(alumnoEmitido));
      localStorage.setItem('constancia_pdf_actual', JSON.stringify(alumnoEmitido));
    } catch {
      // Ignorar restricciones de storage
    }

    window.dispatchEvent(
      new CustomEvent('constancia-pdf:abrir', { detail: alumnoEmitido })
    );

    if (typeof onVerConstancia === 'function') {
      onVerConstancia(alumnoEmitido);
      return;
    }

    setConstanciaPDFActiva(alumnoEmitido);
  }, [expedientes, onVerConstancia]);

  const solicitarEmision = useCallback((estudiante) => {
    if (!estudiante) return;
    if (tieneConstanciaYaEmitida(estudiante)) {
      mostrarToast(
        'error',
        `La constancia de ${estudiante.nombre} en ${MODULOS_INFO[estudiante.moduloKey]?.corto || 'este módulo'} ya fue emitida o registrada. Solo puedes ver la constancia.`
      );
      return;
    }
    setConfirmando(estudiante);
  }, [mostrarToast]);

  const handleVerExpediente = useCallback((estudiante) => {
    if (!estudiante) return;

    const vigente =
      expedientes.find(
        (item) =>
          String(item.id_estudiante) === String(estudiante.id_estudiante) &&
          Number(item.id_modulo) === Number(estudiante.id_modulo)
      ) || estudiante;

    const guardadoLocal = buscarDatosGuardadosModulo(vigente.id_estudiante, vigente.id_modulo) || {};

    const alumnoActualizado = {
      ...vigente,
      ...guardadoLocal,
      id_estudiante: vigente.id_estudiante,
      id_expediente: guardadoLocal.id_expediente ?? vigente.id_expediente,
      id_modulo: vigente.id_modulo,
      codigo_expediente: guardadoLocal.codigo_expediente ?? vigente.exp,
      exp: guardadoLocal.exp ?? vigente.exp,
      hrs: guardadoLocal.hrs ?? vigente.hrs,
      estado: guardadoLocal.estado ?? vigente.estado,
      nota: guardadoLocal.nota ?? vigente.nota,
      fecha_emision: guardadoLocal.fecha_emision ?? vigente.fecha_emision,
      _refresco: Date.now(),
    };

    try {
      sessionStorage.setItem('expediente_alumno_actual', JSON.stringify(alumnoActualizado));
      localStorage.setItem('expediente_alumno_actual', JSON.stringify(alumnoActualizado));
    } catch {
      // Ignorar restricciones de storage
    }

    if (typeof onSeleccionarEstudiante === 'function') {
      onSeleccionarEstudiante(alumnoActualizado);
    }

    window.dispatchEvent(
      new CustomEvent('expediente-alumno:abrir', { detail: alumnoActualizado })
    );
  }, [expedientes, onSeleccionarEstudiante]);

  const cargar = useCallback(async ({ forzarRefresco = false } = {}) => {
    if (forzarRefresco) {
      invalidateApiCache('/constancias-efsrt');
    }
    if (forzarRefresco || expedientes.length === 0) {
      setCargando(true);
    }

    try {
      const [resConstancias, resEstudiantes, resExpedientes] = await Promise.allSettled([
        api.get('/constancias-efsrt'),
        api.get('/estudiantes?all=true'),
        api.get('/constancias-efsrt'),
      ]);

      const rawConstancias =
        resConstancias.status === 'fulfilled' ? extraerArreglo(resConstancias.value?.data) : [];
      const rawEstudiantes =
        resEstudiantes.status === 'fulfilled' ? extraerArreglo(resEstudiantes.value?.data) : [];
      const rawExpedientes =
        resExpedientes.status === 'fulfilled' ? extraerArreglo(resExpedientes.value?.data) : [];

      setExpedientes(construirListaUnificada(rawConstancias, rawEstudiantes, rawExpedientes));
    } catch (err) {
      console.error('Error al cargar constancias:', err);
      if (expedientes.length === 0) {
        setExpedientes([]);
      }
    } finally {
      setCargando(false);
    }
  }, [expedientes.length, construirListaUnificada]);

  useEffect(() => {
    if (initialRegistros.length === 0) {
      cargar({ forzarRefresco: false });
    }
    const alActualizar = () => cargar({ forzarRefresco: true });
    window.addEventListener('expediente:actualizado', alActualizar);
    return () => window.removeEventListener('expediente:actualizado', alActualizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmitirConstancia = async (estudiante) => {
    if (!estudiante) return;

    if (tieneConstanciaYaEmitida(estudiante)) {
      setConfirmando(null);
      mostrarToast(
        'error',
        `Ya se emitió o registró la constancia de ${estudiante.nombre} para este módulo. Solo puedes ver la constancia.`
      );
      return;
    }

    const claveProc = `${estudiante.id_estudiante}-${estudiante.id_modulo}`;
    setProcesandoId(claveProc);
    try {
      const response = await api.post('/constancias/generar', {
        id_estudiante: estudiante.id_estudiante,
        id_modulo: estudiante.id_modulo,
        id_expediente: estudiante.id_expediente || null,
        tipo_emision: 'Original',
      });
      const resData = response.data || {};
      const constanciaObj = resData.constancia || resData.data || {};
      const docGenerado =
        constanciaObj.codigo_documento ||
        resData.codigo_documento ||
        `#CONST-M${estudiante.id_modulo}-${String(estudiante.id_estudiante).padStart(4, '0')}`;
      const fechaEmitida = (
        constanciaObj.fecha_emision ||
        resData.fecha_emision ||
        estudiante.fecha_emision ||
        aISO(new Date())
      )
        .toString()
        .slice(0, 10);

      invalidateApiCache('/constancias-efsrt');
      setExpedientes((prev) =>
        prev.map((item) =>
          String(item.id_estudiante) === String(estudiante.id_estudiante) &&
          Number(item.id_modulo) === Number(estudiante.id_modulo)
            ? {
                ...item,
                id_constancia: constanciaObj.id_constancia ?? item.id_constancia ?? true,
                emitida: true,
                estado: 'Constancia Emitida',
                exp: docGenerado,
                codigo_documento: docGenerado,
                fecha_emision: fechaEmitida,
              }
            : item
        )
      );
      mostrarToast('ok', `Constancia del ${MODULOS_INFO[estudiante.moduloKey]?.corto} emitida para ${estudiante.nombre}. Ahora puedes Ver Constancia.`);
    } catch (err) {
      const dataErr = err?.response?.data || {};
      const yaEmitida =
        err?.response?.status === 409 ||
        Boolean(dataErr.already_issued) ||
        String(dataErr.message || '').toLowerCase().includes('ya se emitió') ||
        String(dataErr.message || '').toLowerCase().includes('ya cuenta con una constancia');

      if (yaEmitida) {
        const constExistente = dataErr.constancia || dataErr.data || {};
        const docExistente =
          constExistente.codigo_documento ||
          estudiante.codigo_documento ||
          estudiante.exp ||
          `#CONST-M${estudiante.id_modulo}-${String(estudiante.id_estudiante).padStart(4, '0')}`;

        setExpedientes((prev) =>
          prev.map((item) =>
            String(item.id_estudiante) === String(estudiante.id_estudiante) &&
            Number(item.id_modulo) === Number(estudiante.id_modulo)
              ? {
                  ...item,
                  id_constancia: constExistente.id_constancia ?? item.id_constancia ?? true,
                  emitida: true,
                  estado: 'Constancia Emitida',
                  exp: docExistente,
                  codigo_documento: docExistente,
                  fecha_emision: (
                    constExistente.fecha_emision ||
                    item.fecha_emision ||
                    aISO(new Date())
                  )
                    .toString()
                    .slice(0, 10),
                }
              : item
          )
        );
      }

      const mensaje = dataErr.message || 'No se pudo generar la constancia.';
      mostrarToast('error', mensaje);
    } finally {
      setProcesandoId(null);
      setConfirmando(null);
    }
  };

  const base = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return expedientes.filter(
      (e) =>
        (modulo === 'todos' || e.moduloKey === modulo) &&
        (!q || [e.nombre, e.dni, e.exp, e.modulo, e.empresa].some((t) => (t || '').toLowerCase().includes(q))) &&
        dentroDeRango(e, desde, hasta)
    );
  }, [expedientes, busqueda, modulo, desde, hasta]);

  const conteos = useMemo(() => {
    const c = { todos: base.length, 'Apto para Constancia': 0, 'Constancia Emitida': 0, 'Horas Incompletas': 0 };
    base.forEach((e) => { c[calcular(e).estadoVisual] += 1; });
    return c;
  }, [base]);

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

  const nFiltros = (busqueda ? 1 : 0) + (modulo !== 'todos' ? 1 : 0) + (estado !== 'todos' ? 1 : 0) + (desde || hasta ? 1 : 0);
  const hayFiltros = nFiltros > 0;
  const limpiar = () => { setBusqueda(''); setModulo('todos'); setEstado('todos'); setDesde(''); setHasta(''); };
  const aplicarPreset = (k) => {
    const [d, h] = rangoPreset(k);
    const yaActivo = desde === d && hasta === h;
    setDesde(yaActivo ? '' : d);
    setHasta(yaActivo ? '' : h);
  };

  const emitidas = expedientes.filter((e) => calcular(e).emitida).length;
  const aptos = expedientes.filter((e) => calcular(e).apto).length;
  const pctEmitidas = expedientes.length ? Math.round((emitidas / expedientes.length) * 100) : 0;
  const idxTab = Math.max(0, TABS.findIndex(([k]) => k === estado));

  if (constanciaPDFActiva && typeof onVerConstancia !== 'function') {
    return (
      <VistaConstanciaPDF
        estudiante={constanciaPDFActiva}
        onVolver={() => setConstanciaPDFActiva(null)}
      />
    );
  }

  return (
    <div className="w-full px-4 py-6 text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}>
      <style>{ESTILOS}</style>

      <div className="w-full space-y-6">
        <header className="cs-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
              Gestión académica <span aria-hidden="true">/</span> <span className="font-semibold text-slate-600">Constancias</span>
            </p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">Constancias EFSRT</h1>
            <p className="mt-1 max-w-2xl text-[12px] text-slate-500">
              Estudiantes que cumplieron su práctica y están listos para constancia o ya emitidos en Módulo I, Módulo II y Módulo III.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-600">Periodo 2026-I</span>
            <button
              type="button"
              onClick={() => cargar({ forzarRefresco: true })}
              disabled={cargando}
              className={`cs-press ${fv} flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[12px] font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 disabled:opacity-60`}
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${cargando ? 'cs-spin' : ''}`} /> Actualizar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi delay={0.04} icon={FiFileText} valor={expedientes.length} label="Listos / Emitidos" detalle="Práctica cumplida" color="text-blue-600" />
          <Kpi delay={0.08} icon={FiAward} valor={emitidas} label="Constancias emitidas" detalle="Culminadas y registradas" anillo={pctEmitidas} color="text-emerald-600" />
          <Kpi delay={0.12} icon={FiCheckCircle} valor={aptos} label="Aptos para emitir" detalle="Listos para constancia" color="text-amber-600" />
        </div>

        <section aria-label="Filtros" style={{ animationDelay: '.16s' }} className={`${card} cs-up overflow-hidden`}>
          <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-3">
            <FiFilter className="h-4 w-4 text-slate-400" />
            <h2 className="text-[13px] font-bold">Filtros</h2>
            {hayFiltros && <span className="cs-pop rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{nFiltros}</span>}
            <span className="ml-auto text-[12px] text-slate-400">
              <b className="text-slate-700">{filtrada.length}</b> {filtrada.length === 1 ? 'resultado' : 'resultados'}
            </span>
            {hayFiltros && (
              <button type="button" onClick={limpiar} className={`cs-fade flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] font-bold text-blue-600 hover:bg-slate-50 hover:text-blue-700 ${fv}`}>
                <FiX className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <Modulo icon={FiSearch} titulo="Búsqueda" className="lg:col-span-5">
              <div className="flex h-10 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 text-slate-400 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                <FiSearch className="h-4 w-4 shrink-0" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Alumno, DNI, empresa o expediente"
                  aria-label="Buscar expedientes"
                  className="w-full bg-transparent text-[12px] text-slate-900 outline-none placeholder:text-slate-400"
                />
                {busqueda && (
                  <button type="button" onClick={() => setBusqueda('')} className="cursor-pointer text-slate-400 hover:text-slate-900" aria-label="Borrar búsqueda">
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </Modulo>

            <Modulo icon={FiCheckCircle} titulo="Estado" className="border-t border-slate-200 lg:col-span-7 lg:border-l lg:border-t-0">
              <div role="tablist" aria-label="Estado" className="relative grid grid-cols-2 border-b border-slate-200 sm:grid-cols-4">
                {TABS.map(([k, label]) => {
                  const activa = estado === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={activa}
                      onClick={() => setEstado(k)}
                      className={`cursor-pointer rounded-t-md px-1 pb-2.5 text-left transition-colors ${fv} ${activa ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      <span className="block text-[20px] font-extrabold leading-none tabular-nums">{conteos[k] ?? 0}</span>
                      <span className={`mt-1 block text-[11px] font-semibold ${activa ? 'text-blue-600' : ''}`}>{label}</span>
                    </button>
                  );
                })}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-px left-0 h-0.5 w-1/4 rounded-full bg-blue-600 transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${idxTab * 100}%)` }}
                />
              </div>
            </Modulo>

            <Modulo icon={FiLayers} titulo="Módulo formativo" className="border-t border-slate-200 lg:col-span-5">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Módulo formativo">
                {CHIPS_MODULO.map(([k, label, punto]) => (
                  <Chip key={k} activo={modulo === k} punto={punto} onClick={() => setModulo(k)}>{label}</Chip>
                ))}
              </div>
            </Modulo>

            <Modulo icon={FiCalendar} titulo="Fecha de emisión" className="border-t border-slate-200 lg:col-span-7 lg:border-l">
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS_FECHA.map(([k, label]) => {
                  const [d, h] = rangoPreset(k);
                  return <Chip key={k} activo={desde === d && hasta === h} onClick={() => aplicarPreset(k)}>{label}</Chip>;
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <label className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                  Desde
                  <input
                    type="date"
                    value={desde}
                    max={hasta || undefined}
                    onChange={(e) => setDesde(e.target.value)}
                    className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
                <label className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                  Hasta
                  <input
                    type="date"
                    value={hasta}
                    min={desde || undefined}
                    onChange={(e) => setHasta(e.target.value)}
                    className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
                {(desde || hasta) && (
                  <button
                    type="button"
                    onClick={() => { setDesde(''); setHasta(''); }}
                    className={`cs-pop cs-press ${fv} grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500`}
                    aria-label="Quitar filtro de fecha"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Modulo>
          </div>
        </section>

        <div style={{ animationDelay: '.2s' }} className="cs-up flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] font-bold">
            Expedientes listos / emitidos <span className="ml-1 font-medium text-slate-400">{filtrada.length}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={orden} onChange={setOrden} opciones={OPC_ORDEN} w="w-[190px]" icon={FiArrowUp} etiqueta="Ordenar por" />
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              {[['tarjetas', FiGrid, 'Tarjetas'], ['tabla', FiList, 'Tabla']].map(([k, Icon, t]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setVista(k)}
                  aria-pressed={vista === k}
                  className={`cs-press ${fv} flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3.5 text-[12px] font-bold ${vista === k ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setConfirmandoImpresion(true)}
              disabled={paraImprimir.length === 0}
              title={`${paraImprimir.length} emitida(s) · ${moduloLabel} · ${rangoLabel}`}
              className={`cs-press ${fv} flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-[12px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <FiPrinter className="h-3.5 w-3.5" /> Imprimir emitidas ({paraImprimir.length})
            </button>
          </div>
        </div>

        {cargando && expedientes.length === 0 ? (
          <Esqueleto />
        ) : filtrada.length === 0 ? (
          <div className={`${card} cs-pop py-16 text-center`}>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-slate-200 text-blue-600"><FiSearch className="h-6 w-6" /></span>
            <p className="mt-3 text-[14px] font-bold">No hay estudiantes listos para constancia</p>
            <p className="text-[12px] text-slate-400">Aparecerán aquí los practicantes que cumplieron su práctica y están verificados/aptos o con constancia emitida.</p>
            {hayFiltros && (
              <button type="button" onClick={limpiar} className={`cs-press ${fv} mt-4 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-blue-700`}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : vista === 'tarjetas' ? (
          <div key={`t-${pagina}-${estado}-${orden}`} className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {lista.map((e, i) => (
              <Tarjeta
                key={`${e.id_estudiante}-${e.id_modulo}-${e.exp}-${i}`}
                e={e}
                indice={i}
                onVerExpediente={handleVerExpediente}
                onVerConstancia={handleAbrirVistaConstancia}
                onPedirEmision={solicitarEmision}
                procesandoId={procesandoId}
              />
            ))}
          </div>
        ) : (
          <TablaExpedientes
            key={`tb-${pagina}-${estado}-${orden}`}
            lista={lista}
            onVerExpediente={handleVerExpediente}
            onVerConstancia={handleAbrirVistaConstancia}
            onPedirEmision={solicitarEmision}
            procesandoId={procesandoId}
          />
        )}

        {!cargando && filtrada.length > 0 && (
          <div className={`${card} flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[12px] text-slate-500`}>
            <span>
              Mostrando <b className="text-slate-900">{lista.length}</b> de <b className="text-slate-900">{filtrada.length}</b> expedientes
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                aria-label="Página anterior"
                className={`cs-press ${fv} grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500`}
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPagina(n)}
                  aria-current={n === pagina ? 'page' : undefined}
                  className={`cs-press ${fv} h-9 w-9 cursor-pointer rounded-lg text-[12px] font-bold ${
                    n === pagina ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                aria-label="Página siguiente"
                className={`cs-press ${fv} grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500`}
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmando && !tieneConstanciaYaEmitida(confirmando) && (
        <ModalEmision
          alumno={confirmando}
          procesando={procesandoId === `${confirmando.id_estudiante}-${confirmando.id_modulo}`}
          onConfirmar={() => handleEmitirConstancia(confirmando)}
          onCancelar={() => setConfirmando(null)}
        />
      )}

      {confirmandoImpresion && (
        <ModalImpresion
          lista={paraImprimir}
          moduloLabel={moduloLabel}
          rangoLabel={rangoLabel}
          onConfirmar={imprimirTodas}
          onCancelar={() => setConfirmandoImpresion(false)}
        />
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="cs-toast fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-semibold text-slate-800 shadow-xl"
        >
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${toast.tipo === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.tipo === 'ok' ? <FiCheckCircle className="h-4 w-4" /> : <FiAlertCircle className="h-4 w-4" />}
          </span>
          <span className="flex-1">{toast.texto}</span>
          <button type="button" onClick={() => setToast(null)} className="cursor-pointer text-slate-400 hover:text-slate-900" aria-label="Cerrar">
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}