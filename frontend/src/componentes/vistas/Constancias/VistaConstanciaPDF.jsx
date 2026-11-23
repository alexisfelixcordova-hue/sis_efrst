import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiPrinter, FiArrowLeft, FiEdit3, FiX, FiRotateCcw,
  FiZoomIn, FiZoomOut, FiCopy, FiShare2, FiSave, FiCheck
} from 'react-icons/fi';
import logo from '../../../assets/logo-iestp.png';
import logoDpw from '../../../assets/logo-dpw.png';
/* ───────────────────────────────────────────────────────────────
   LOGOS: pon aquí tus imágenes (o pásalas por props).
   Tamaños exactos del Word: IESTP 62.25 × 61.08 pt · DPW 75.75 × 67.1 pt
   Ej.:  import logoIestp from '../assets/logo-iestp.png';
         const LOGO_IESTP = logoIestp;
   ─────────────────────────────────────────────────────────────── */
const LOGO_IESTP = logo;
const LOGO_DPW = logoDpw;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

// "2026-09-11" -> "11 de setiembre 2026"  (formato del Word)
const formatearFecha = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} de ${MESES[m - 1]} ${y}`;
};

// "2022-01-21" -> "21/01/2022"
const formatearCorta = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

const crearBase = (estudiante) => ({
  alumno: estudiante?.nombre || 'RIOS HAUMAN, Ada Wrist',
  dni: estudiante?.dni || '76362524',
  codigoDoc: estudiante?.codigo_documento || estudiante?.exp || 'CONST-EFSRT-2026-0839',
  programa: estudiante?.modulo || 'Diseño y Programación Web',
  semestre: 'II',
  modulo: 'MODULO I',
  nombreModulo: 'DISEÑO WEB Y APLICACIONES MULTIMEDIA',
  competencia:
    'Diseñar la presentación, animación, organización y navegación de los contenidos y servicios web, de acuerdo a las demandas del negocio, buenas prácticas de diseño, técnicas de diseño web, usabilidad y experiencia del usuario objetivo.',
  indicadores: [
    'Ensamblar e instalar componentes de Hardware y Software para el funcionamiento de redes e internet.',
    'Diseñar la estructura de la página web para el desarrollo de aplicaciones por el lado del navegador.',
    'Administrar de manera eficiente los recursos de alojamiento web de acuerdo a los estándares establecido.',
    'Implementar los componentes de animación gráfica y elementos multimedia, de acuerdo a los prototipos y modelos.',
  ].join('\n'),
  razonSocial: 'Municipalidad Distrital de Chilca',
  ruc: '20133696661',
  area: 'Sub Gerencia de Procesos e Informática',
  direccion: 'Av. Huancavelica N° 606',
  representante: 'Ing. Huarcaya Winchez José Luis',
  fechaInicio: '2022-01-21',
  fechaFin: '2022-03-21',
  horas: '128',
  creditos: '4',
  nota: '16',
  fechaNota: '2022-12-27',
  supervisor: 'Mg. Alejandra Fortunata Blanco Espinoza',
  fecha: '2026-09-11',
});

export default function VistaConstanciaPDF({ estudiante, onVolver, onGuardar, logoIestp = LOGO_IESTP, logoDpw = LOGO_DPW }) {
  const base = useMemo(() => crearBase(estudiante), [estudiante]);

  const [datos, setDatos] = useState(base);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aviso, setAviso] = useState('');
  const avisoRef = useRef(null);
  const hojaRef = useRef(null);

  // Si llega otro estudiante, se reinician los datos editables
  useEffect(() => {
    setDatos(base);
  }, [base]);

  const d = datos;
  const indicadores = d.indicadores.split('\n').map((s) => s.trim()).filter(Boolean);
  const modificado = JSON.stringify(datos) !== JSON.stringify(base);

  const mostrarAviso = (msg) => {
    setAviso(msg);
    clearTimeout(avisoRef.current);
    avisoRef.current = setTimeout(() => setAviso(''), 2200);
  };

  const cambiar = (campo) => (e) => setDatos((prev) => ({ ...prev, [campo]: e.target.value }));

  const handleImprimir = () => {
    const hojaEl = hojaRef.current;
    if (!hojaEl) {
      window.print();
      return;
    }

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((node) => node.outerHTML)
      .join('\n');

    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) {
      window.print();
      return;
    }

    w.document.open();
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Constancia EFSRT</title>${styles}<style>
      @page { size: A4; margin: 0; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        width: 595.3pt;
        height: 841.9pt;
        overflow: hidden;
      }
      .hoja-print-solo {
        position: relative !important;
        margin: 0 !important;
        box-shadow: none !important;
        animation: none !important;
        transform: none !important;
        opacity: 1 !important;
      }
      .hoja-print-solo .logo-ph {
        border-color: transparent !important;
        color: transparent !important;
      }
    </style></head><body>${hojaEl.outerHTML}<script>
      window.onload = function () {
        setTimeout(function () {
          window.print();
          window.close();
        }, 250);
      };
    </script></body></html>`);
    w.document.close();
  };

  const copiar = async (texto, msg) => {
    try {
      await navigator.clipboard.writeText(texto);
      mostrarAviso(msg);
    } catch {
      mostrarAviso('No se pudo copiar');
    }
  };

  const compartirWhatsApp = () => {
    const texto = `Constancia EFSRT\nEstudiante: ${d.alumno}\nDNI: ${d.dni}\nCódigo: ${d.codigoDoc}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };

  const restablecer = () => {
    setDatos(base);
    mostrarAviso('Datos restablecidos');
  };

  const guardar = () => {
    if (typeof onGuardar === 'function') onGuardar(datos);
    mostrarAviso('Cambios aplicados');
  };

  const cambiarZoom = (delta) => setZoom((z) => Math.min(1.3, Math.max(0.6, +(z + delta).toFixed(2))));

  const campo = 'w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-[var(--acc)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--acc)_25%,transparent)] transition';
  const areaTxt = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-[13px] leading-snug text-slate-800 outline-none focus:border-[var(--acc)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--acc)_25%,transparent)] transition resize-y';
  const etiqueta = 'block text-[11px] font-semibold text-slate-500 mb-1';
  const botonBarra = 'btn-lift flex items-center gap-2 px-3 h-9 rounded-lg text-[12px] font-semibold text-slate-600 hover:text-[#0f1b3d] hover:bg-slate-100 cursor-pointer';

  const Campo = ({ id, label, children }) => (
    <div>
      <label className={etiqueta} htmlFor={id}>{label}</label>
      {children}
    </div>
  );

  return (
    <div
      className="constancia-root w-full min-h-screen p-4 md:p-8 text-[#0f1b3d]"
      style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif", '--acc': '#2f6bff', '--acc-dark': '#1e4fd8' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Overlock:wght@400;700;900&family=Carlito:wght@400;700&display=swap');

        .constancia-root {
          background:
            radial-gradient(900px 420px at 50% -10%, color-mix(in srgb, var(--acc) 16%, transparent), transparent 70%),
            linear-gradient(180deg, #eaeef8 0%, #f1f4fa 100%);
        }
        @keyframes paper-in { from { opacity: 0; transform: translateY(28px) scale(0.985); } to { opacity: 1; transform: none; } }
        @keyframes bar-in { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
        @keyframes toast-in { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .anim-bar { animation: bar-in .5s cubic-bezier(.2,.7,.2,1) both; }
        .anim-paper { animation: paper-in .8s cubic-bezier(.2,.7,.2,1) .1s both; }
        .anim-toast { animation: toast-in .25s ease-out both; }

        .btn-lift { transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease, color .18s ease; }
        .btn-lift:hover { transform: translateY(-1px); }
        .btn-lift:active { transform: scale(.97); }
        .constancia-root button:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
        .panel { transition: transform .3s cubic-bezier(.2,.7,.2,1), opacity .3s ease; }
        .hoja-wrap { transition: zoom .2s ease; }

        /* ═════════ HOJA A4 — réplica del Word (medidas en pt) ═════════ */
        .hoja {
          position: relative;
          width: 595.3pt;
          height: 841.9pt;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
          color: #000;
          font-family: Calibri, Carlito, 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.317;                 /* Calibri · interlineado 259 */
          box-shadow: 0 1px 2px rgba(15,27,61,.06), 0 18px 40px -12px rgba(15,27,61,.22), 0 40px 80px -30px rgba(47,107,255,.3);
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .hoja p { margin: 0; }
        .hoja .overlock { font-family: Overlock, 'Trebuchet MS', Arial, sans-serif; }
        .hoja .black { font-family: 'Arial Black', 'Arial Bold', Arial, sans-serif; font-weight: 900; }

        /* Cabecera */
        .hoja .enc { position: absolute; top: 35.4pt; left: 85.05pt; width: 425.2pt; text-align: center; color: #000; }
        .hoja .enc p { line-height: 13.43pt; }
        .hoja .enc p.nombre { font-size: 16pt; font-weight: 700; line-height: 19.53pt; }
        .hoja .logo { position: absolute; object-fit: fill; display: block; }
        .hoja .logo-ph { border: 1px dashed #cbd5e1; display: grid; place-items: center; font: 600 8pt system-ui, sans-serif; color: #94a3b8; }
        .hoja .logo-izq { left: 51pt;     top: 19.5pt; width: 62.25pt; height: 61.08pt; }
        .hoja .logo-der { left: 483.75pt; top: 19.5pt; width: 75.75pt; height: 67.1pt; }
        .hoja .linea-roja-sup { position: absolute; left: 12.75pt; top: 86.6pt; width: 576.7pt; height: 2.85pt; background: #ff0000; border-radius: 1.4pt; }
        .hoja .linea-roja-inf { position: absolute; left: 15.45pt; top: 777.9pt; width: 568pt; height: 4.3pt; background: #ff0000; border-radius: 2.1pt; }

        /* Pie */
        .hoja .pie { position: absolute; top: 779.64pt; left: 85.05pt; width: 425.2pt; text-align: center; color: #000; }
        .hoja .pie p { line-height: 13.43pt; }

        /* Cuerpo */
        .hoja .cuerpo { position: absolute; top: 101.3pt; left: 85.05pt; width: 425.2pt; }
        .hoja .j { text-align: justify; }
        .hoja .vacio { height: 14.49pt; }
        .hoja .vacio-240 { height: 13.43pt; }
        .hoja .t-constancia { font-size: 26pt; font-weight: 700; text-align: center; line-height: 35pt; }
        .hoja .t-sub { font-size: 12pt; text-align: center; line-height: 18.3pt; }
        .hoja .t-nombre { font-size: 18pt; text-align: center; line-height: 27.4pt; }
        .hoja .b13 { font-size: 13pt; font-weight: 700; }

        /* Tablas */
        .hoja table { border-collapse: collapse; table-layout: fixed; width: 439.2pt; }
        .hoja td { border: .5pt solid #000; padding: 0 5.4pt; vertical-align: top; line-height: 13.43pt; overflow-wrap: anywhere; }
        .hoja td:first-child { font-weight: 700; }
        .hoja td.az  { background: #0070c0; color: #fff; font-size: 12pt; line-height: 14.65pt; text-align: center; font-weight: 700; }
        .hoja td.az2 { background: #2e75b5; color: #fff; font-size: 12pt; line-height: 14.65pt; text-align: center; font-weight: 700; }
        .hoja td.mod { font-size: 16pt; line-height: 19.53pt; text-align: center; font-weight: 700; }
        .hoja td.sin-b { font-weight: 400; text-align: justify; }
        .hoja td.c  { text-align: center; font-weight: 400; }
        .hoja td.lbl { font-weight: 700; }
        .hoja td.val { font-weight: 400; text-align: justify; }
        .hoja tr.h-comp { height: 82.55pt; }

        .hoja .vi { display: flex; align-items: baseline; padding-right: 10.2pt; text-align: justify; font-weight: 400; }
        .hoja .vi-b { flex: none; width: 9.1pt; font-size: 13pt; line-height: 15.9pt; }
        .hoja .vi-t { flex: 1; min-width: 0; }

        /* Firmas */
        .hoja table.firmas { width: 425.2pt; margin-top: 51.65pt; }
        .hoja table.firmas td { border: 0; font-family: Overlock, 'Trebuchet MS', Arial, sans-serif; font-weight: 400; font-size: 7pt; line-height: 9.1pt; text-align: center; padding: 0 5.4pt; }
        .hoja table.firmas td.l { border-top: .5pt solid #000; }

        @media (prefers-reduced-motion: reduce) {
          .anim-bar, .anim-paper, .anim-toast { animation: none !important; }
          .btn-lift, .panel, .hoja-wrap { transition: none; }
        }
        @page { size: A4; margin: 0; }
        @media print {
          body * { visibility: hidden !important; }
          .hoja, .hoja * { visibility: visible !important; }
          html, body { margin: 0 !important; background: #fff !important; }
          .constancia-root { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
          .hoja-wrap { zoom: 1 !important; }
          .hoja { position: fixed !important; left: 0 !important; top: 0 !important; box-shadow: none !important; margin: 0 !important; height: 841.8pt !important; break-after: avoid; }
          .anim-bar, .anim-paper { animation: none !important; opacity: 1 !important; transform: none !important; }
          .hoja .logo-ph { border-color: transparent; color: transparent; }
        }
      `}</style>

      {/* Barra Superior de Acciones (Oculta al Imprimir) */}
      <div className="anim-bar max-w-4xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur p-3 rounded-xl border border-white shadow-[0_6px_24px_-8px_rgba(15,27,61,0.18)] print:hidden">
        <button onClick={onVolver} className={`${botonBarra} group`}>
          <FiArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Volver al Listado
        </button>

        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center mr-1 rounded-lg bg-slate-100 p-0.5" aria-label="Zoom">
            <button onClick={() => cambiarZoom(-0.1)} className="w-8 h-8 grid place-items-center rounded-md text-slate-600 hover:bg-white cursor-pointer" aria-label="Alejar">
              <FiZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(1)} className="px-1.5 text-[11px] font-bold text-slate-600 tabular-nums w-11 cursor-pointer" aria-label="Restablecer zoom">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => cambiarZoom(0.1)} className="w-8 h-8 grid place-items-center rounded-md text-slate-600 hover:bg-white cursor-pointer" aria-label="Acercar">
              <FiZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => copiar(d.codigoDoc, 'Código copiado')} className={botonBarra}>
            <FiCopy className="w-4 h-4" /> <span className="hidden sm:inline">Copiar código</span>
          </button>
          <button onClick={compartirWhatsApp} className={botonBarra}>
            <FiShare2 className="w-4 h-4" /> <span className="hidden sm:inline">Compartir</span>
          </button>
          <button
            onClick={() => setPanelAbierto((v) => !v)}
            className={`${botonBarra} ${panelAbierto ? '!bg-slate-100 !text-[#0f1b3d]' : ''}`}
            aria-expanded={panelAbierto}
          >
            <FiEdit3 className="w-4 h-4" /> Editar
            {modificado && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-label="Con cambios" />}
          </button>
          <button
            onClick={handleImprimir}
            className="btn-lift flex items-center gap-2 px-4 h-9 text-white rounded-lg text-[12px] font-semibold cursor-pointer shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--acc)_60%,transparent)] hover:shadow-[0_10px_22px_-4px_color-mix(in_srgb,var(--acc)_70%,transparent)]"
            style={{ background: 'linear-gradient(180deg, var(--acc), var(--acc-dark))' }}
          >
            <FiPrinter className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Panel lateral de edición (Oculto al Imprimir) */}
      <aside
        className={`panel print:hidden fixed top-0 right-0 z-40 h-full w-full sm:w-[380px] bg-white shadow-[-12px_0_40px_-12px_rgba(15,27,61,0.3)] flex flex-col ${panelAbierto ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
        aria-hidden={!panelAbierto}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 shrink-0">
          <h4 className="text-[14px] font-bold text-[#0f1b3d]">Editar constancia</h4>
          <button onClick={() => setPanelAbierto(false)} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Cerrar panel">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <section className="space-y-3">
            <h5 className="text-[12px] font-bold text-[#0f1b3d]">Estudiante</h5>
            <Campo id="f-alumno" label="Apellidos y nombres">
              <input id="f-alumno" className={campo} value={d.alumno} onChange={cambiar('alumno')} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo id="f-dni" label="DNI">
                <input id="f-dni" className={campo} value={d.dni} onChange={cambiar('dni')} inputMode="numeric" maxLength={8} />
              </Campo>
              <Campo id="f-semestre" label="Semestre">
                <input id="f-semestre" className={campo} value={d.semestre} onChange={cambiar('semestre')} />
              </Campo>
            </div>
            <Campo id="f-programa" label="Programa de estudios">
              <input id="f-programa" className={campo} value={d.programa} onChange={cambiar('programa')} />
            </Campo>
          </section>

          <section className="space-y-3">
            <h5 className="text-[12px] font-bold text-[#0f1b3d]">Módulo</h5>
            <div className="grid grid-cols-2 gap-3">
              <Campo id="f-modulo" label="Número de módulo">
                <input id="f-modulo" className={campo} value={d.modulo} onChange={cambiar('modulo')} />
              </Campo>
              <Campo id="f-nmodulo" label="Nombre del módulo">
                <input id="f-nmodulo" className={campo} value={d.nombreModulo} onChange={cambiar('nombreModulo')} />
              </Campo>
            </div>
            <Campo id="f-comp" label="Unidad de competencia">
              <textarea id="f-comp" rows={4} className={areaTxt} value={d.competencia} onChange={cambiar('competencia')} />
            </Campo>
            <Campo id="f-ind" label="Indicadores de logro (uno por línea)">
              <textarea id="f-ind" rows={6} className={areaTxt} value={d.indicadores} onChange={cambiar('indicadores')} />
            </Campo>
          </section>

          <section className="space-y-3">
            <h5 className="text-[12px] font-bold text-[#0f1b3d]">Datos de la empresa</h5>
            <Campo id="f-razon" label="Razón social">
              <input id="f-razon" className={campo} value={d.razonSocial} onChange={cambiar('razonSocial')} />
            </Campo>
            <Campo id="f-ruc" label="RUC">
              <input id="f-ruc" className={campo} value={d.ruc} onChange={cambiar('ruc')} inputMode="numeric" maxLength={11} />
            </Campo>
            <Campo id="f-area" label="Área">
              <input id="f-area" className={campo} value={d.area} onChange={cambiar('area')} />
            </Campo>
            <Campo id="f-dir" label="Dirección">
              <input id="f-dir" className={campo} value={d.direccion} onChange={cambiar('direccion')} />
            </Campo>
            <Campo id="f-rep" label="Representante">
              <input id="f-rep" className={campo} value={d.representante} onChange={cambiar('representante')} />
            </Campo>
          </section>

          <section className="space-y-3">
            <h5 className="text-[12px] font-bold text-[#0f1b3d]">Datos de las EFSRT</h5>
            <div className="grid grid-cols-2 gap-3">
              <Campo id="f-fini" label="Fecha de inicio">
                <input id="f-fini" type="date" className={campo} value={d.fechaInicio} onChange={cambiar('fechaInicio')} />
              </Campo>
              <Campo id="f-ffin" label="Fecha fin">
                <input id="f-ffin" type="date" className={campo} value={d.fechaFin} onChange={cambiar('fechaFin')} />
              </Campo>
              <Campo id="f-horas" label="Horas">
                <input id="f-horas" className={campo} value={d.horas} onChange={cambiar('horas')} inputMode="numeric" />
              </Campo>
              <Campo id="f-cred" label="Créditos">
                <input id="f-cred" className={campo} value={d.creditos} onChange={cambiar('creditos')} inputMode="numeric" />
              </Campo>
              <Campo id="f-nota" label="Nota">
                <input id="f-nota" className={campo} value={d.nota} onChange={cambiar('nota')} inputMode="numeric" />
              </Campo>
              <Campo id="f-fnota" label="Fecha de informe de nota">
                <input id="f-fnota" type="date" className={campo} value={d.fechaNota} onChange={cambiar('fechaNota')} />
              </Campo>
            </div>
            <Campo id="f-sup" label="Docente supervisor">
              <input id="f-sup" className={campo} value={d.supervisor} onChange={cambiar('supervisor')} />
            </Campo>
          </section>

          <section className="space-y-3">
            <h5 className="text-[12px] font-bold text-[#0f1b3d]">Documento</h5>
            <Campo id="f-fecha" label="Fecha de emisión">
              <input id="f-fecha" type="date" className={campo} value={d.fecha} onChange={cambiar('fecha')} />
            </Campo>
            <Campo id="f-codigo" label="Código digital (no se imprime)">
              <input id="f-codigo" className={`${campo} font-mono`} value={d.codigoDoc} onChange={cambiar('codigoDoc')} />
            </Campo>
          </section>
        </div>

        <div className="shrink-0 flex gap-2 p-4 border-t border-slate-100">
          <button
            onClick={restablecer}
            disabled={!modificado}
            className="btn-lift flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <FiRotateCcw className="w-4 h-4" /> Restablecer
          </button>
          <button
            onClick={guardar}
            className="btn-lift flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-white text-[12px] font-semibold cursor-pointer"
            style={{ background: 'linear-gradient(180deg, var(--acc), var(--acc-dark))' }}
          >
            <FiSave className="w-4 h-4" /> Aplicar cambios
          </button>
        </div>
      </aside>

      {/* Aviso breve */}
      {aviso && (
        <div className="anim-toast print:hidden fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-4 h-10 rounded-full bg-[#0f1b3d] text-white text-[12px] font-semibold shadow-xl" role="status">
          <FiCheck className="w-4 h-4 text-emerald-400" /> {aviso}
        </div>
      )}

      {/* ═══════════ DOCUMENTO — idéntico al Word (A4) ═══════════ */}
      <div className="hoja-wrap" style={{ zoom }}>
        <div ref={hojaRef} className="hoja hoja-print-solo anim-paper">

          {/* Cabecera */}
          {logoIestp
            ? <img className="logo logo-izq" src={logoIestp} alt="IESTP" />
            : <div className="logo logo-izq logo-ph">LOGO IESTP</div>}
          {logoDpw
            ? <img className="logo logo-der" src={logoDpw} alt="Diseño y Programación Web" />
            : <div className="logo logo-der logo-ph">LOGO DPW</div>}

          <div className="enc">
            <p>Dirección Regional de Educación Junín</p>
            <p>Instituto de Educación Superior Tecnológico Público</p>
            <p className="nombre">“ANDRÉS AVELINO CÁCERES DORREGARAY”</p>
          </div>
          <div className="linea-roja-sup" />

          {/* Pie */}
          <div className="linea-roja-inf" />
          <div className="pie">
            <p>Carretera central Km 8.900 – San Agustín – Teléfono: 064421149 – www.institutocajas.edu.pe</p>
            <p>¡En Cajas se aprende haciendo!</p>
          </div>

          {/* Cuerpo */}
          <div className="cuerpo">
            <p className="overlock t-constancia">CONSTANCIA</p>
            <p className="black t-sub">Experiencias Formativas en Situaciones Reales de Trabajo</p>

            <div className="vacio-240" />

            <p className="j">
              El que suscribe, Coordinador del Programa de Estudios de {d.programa}, expide la presente a favor de:
            </p>

            <p className="black t-nombre">{d.alumno}</p>

            <p className="j">
              Estudiante del Programa de Estudios de <span className="b13">{d.programa}</span> del <strong>semestre {d.semestre}</strong>
              <strong>,</strong> Identificado con DNI N°<span className="b13">{d.dni}</span>, ha realizado las Experiencia Formativas en Situaciones Reales de Trabajo, según se detalla:
            </p>

            <div className="vacio" />

            {/* Tabla 1 · Módulo */}
            <table>
              <colgroup><col style={{ width: '162.8pt' }} /><col style={{ width: '276.4pt' }} /></colgroup>
              <tbody>
                <tr>
                  <td className="az" colSpan={2} style={{ borderBottomStyle: 'hidden' }}>{d.modulo}</td>
                </tr>
                <tr>
                  <td className="mod" colSpan={2} style={{ borderTopStyle: 'hidden' }}>{d.nombreModulo}</td>
                </tr>
                <tr>
                  <td className="az2">UNIDADES DE COMPETENCIA</td>
                  <td className="az2">INDICADORES DE LOGRO</td>
                </tr>
                <tr className="h-comp">
                  <td className="sin-b" style={{ borderBottomStyle: 'hidden' }}>{d.competencia}</td>
                  <td style={{ borderBottomStyle: 'hidden', fontWeight: 400 }}>
                    {indicadores.map((txt, i) => (
                      <div className="vi" key={i}>
                        <span className="vi-b">▪</span>
                        <span className="vi-t">{txt}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="vacio" />

            {/* Tabla 2 · Empresa y EFSRT */}
            <table>
              <colgroup>
                <col style={{ width: '109.15pt' }} /><col style={{ width: '104.3pt' }} />
                <col style={{ width: '107.2pt' }} /><col style={{ width: '118.55pt' }} />
              </colgroup>
              <tbody>
                <tr><td className="az" colSpan={4}>DATOS DE LA EMPRESA </td></tr>
                <tr><td>RAZÓN SOCIAL:</td><td className="val" colSpan={3}>{d.razonSocial}</td></tr>
                <tr><td>RUC:</td><td className="val" colSpan={3}>{d.ruc}</td></tr>
                <tr><td>ÁREA: </td><td className="val" colSpan={3}>{d.area}</td></tr>
                <tr><td>DIRECCIÓN: </td><td className="val" colSpan={3}>{d.direccion}</td></tr>
                <tr><td>REPRESENTANTE:</td><td className="val" colSpan={3}>{d.representante}</td></tr>
                <tr><td className="az" colSpan={4}>DATOS DE LAS EFSRT</td></tr>
                <tr>
                  <td>FECHA DE INICIO:</td><td className="c">{formatearCorta(d.fechaInicio)}</td>
                  <td className="lbl">FECHA FIN:</td><td className="c">{formatearCorta(d.fechaFin)}</td>
                </tr>
                <tr>
                  <td>HORAS:</td><td className="c">{d.horas}</td>
                  <td className="lbl">CRÉDITOS:</td><td className="c">{d.creditos}</td>
                </tr>
                <tr>
                  <td>NOTA:</td><td className="c">{d.nota}</td>
                  <td className="lbl" style={{ fontSize: '7pt', lineHeight: '8.55pt', verticalAlign: 'middle' }}>FECHA DE INFORME DE NOTA.</td>
                  <td className="c">{formatearCorta(d.fechaNota)}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: '10pt', lineHeight: '12.2pt' }}>DOCENTE SUPERVISOR:</td>
                  <td className="c" colSpan={3}>{d.supervisor}</td>
                </tr>
              </tbody>
            </table>

            <div className="vacio" />

            <p style={{ textAlign: 'right' }}>San Agustín, {formatearFecha(d.fecha)}</p>

            <div className="vacio" />

            {/* Firmas */}
            <table className="firmas">
              <colgroup>
                <col style={{ width: '115.95pt' }} /><col style={{ width: '34.1pt' }} />
                <col style={{ width: '116.05pt' }} /><col style={{ width: '34.05pt' }} />
                <col style={{ width: '125.05pt' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="l">Jefe de Unidad Académica</td>
                  <td />
                  <td className="l">Docente Supervisor</td>
                  <td />
                  <td className="l">Coordinador del Programa de Estudios</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}