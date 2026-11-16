import { useMemo, useState, useEffect } from 'react';
import {
  FiSearch, FiChevronDown, FiGrid, FiList, FiRefreshCw, FiFolder, FiFileText,
  FiCheckCircle, FiChevronLeft, FiChevronRight, FiAward, FiLoader, FiPrinter, FiClock
} from 'react-icons/fi';

/* ---------- Estilos de Módulos ---------- */
const moduloStyle = {
  desarrollo: 'bg-[#eef3ff] text-[#2f6bff] border-[#c9d9ff]',
  redes: 'bg-[#f3f0fe] text-[#6d4fe0] border-[#d9d0fb]',
  soporte: 'bg-[#e8f8fb] text-[#0891b2] border-[#bde9f1]',
};

const estadoBadge = {
  'Constancia Emitida': 'bg-[#eef3ff] text-[#2f6bff] border-[#c9d9ff]',
  'Apto para Constancia': 'bg-[#e6f7ee] text-[#15803d] border-[#bfe9d2]',
  'Horas Incompletas': 'bg-[#fff6e0] text-[#d97706] border-[#fde3a1]',
};

const estadoPunto = { 
  'Constancia Emitida': 'bg-[#2f6bff]', 
  'Apto para Constancia': 'bg-[#16a34a]',
  'Horas Incompletas': 'bg-[#d97706]'
};

const OPC_MODULO = [
  ['todos', 'Todos los Módulos'], 
  ['soporte', 'Módulo I – Soporte'],
  ['desarrollo', 'Módulo II – Desarrollo'], 
  ['redes', 'Módulo III – Redes'],
];

const OPC_ESTADO = [
  ['todos', 'Todos los Estados'], 
  ['Constancia Emitida', 'Constancia Emitida'],
  ['Apto para Constancia', 'Apto para Constancia'],
  ['Horas Incompletas', 'Horas Incompletas'],
];

const card = 'bg-white rounded-xl border border-[#e8ebf1] shadow-[0_1px_2px_rgba(16,24,40,0.04)]';

const Select = ({ value, onChange, opciones, w }) => (
  <div className={`relative ${w}`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 appearance-none border border-[#dfe3ec] rounded-lg pl-3 pr-8 text-[12px] text-[#374151] bg-white outline-none focus:border-[#2f6bff] focus:ring-2 focus:ring-[#2f6bff]/10 cursor-pointer"
    >
      {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
    <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8b92a5] pointer-events-none" />
  </div>
);

const Stat = ({ icon: Icon, valor, label, tono }) => (
  <div className={`${card} flex items-center gap-3 px-4 py-3`}>
    <span className={`w-9 h-9 rounded-lg grid place-items-center ${tono}`}><Icon className="w-4 h-4" /></span>
    <div>
      <div className="text-[18px] font-bold leading-none text-[#111827]">{valor}</div>
      <div className="text-[11px] text-[#6b7280] mt-1">{label}</div>
    </div>
  </div>
);

const Fila = ({ label, children, valueClass = 'text-[#111827]' }) => (
  <div className="flex items-center justify-between gap-3 text-[12px]">
    <span className="text-[#8b92a5]">{label}</span>
    <span className={`font-semibold text-right ${valueClass}`}>{children}</span>
  </div>
);

const Badge = ({ estado }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border whitespace-nowrap ${estadoBadge[estado] || estadoBadge['Horas Incompletas']}`}>
    <i className={`w-1.5 h-1.5 rounded-full ${estadoPunto[estado] || estadoPunto['Horas Incompletas']}`} />
    {estado}
  </span>
);

function Tarjeta({ e, onSeleccionarEstudiante, onVerConstancia, onEmitirConstancia, procesandoId }) {
  const horasActuales = e.hrs || 480;
  const horasCompletadas = horasActuales >= 480;
  const emitida = e.estado === 'Constancia Emitida';
  const apto = horasCompletadas && !emitida;
  const estadoVisual = emitida ? 'Constancia Emitida' : (horasCompletadas ? 'Apto para Constancia' : 'Horas Incompletas');

  const abrirExpediente = () => {
    if (onSeleccionarEstudiante) onSeleccionarEstudiante(e);
  };
  
  return (
    <div className={`${card} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={abrirExpediente}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-full border grid place-items-center text-[12px] font-bold bg-[#eef3ff] text-[#2f6bff] border-[#c9d9ff]">
            {e.ini || 'EF'}
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold leading-tight truncate hover:text-[#2f6bff] transition-colors">{e.nombre}</div>
            <div className="text-[11px] text-[#8b92a5] mt-1 flex items-center gap-1.5">
              <span>DNI {e.dni}</span><span>•</span>
              <span className="font-mono font-semibold text-[#6b7280]">{e.exp || '#EXP-2026'}</span>
            </div>
          </div>
        </div>
        <Badge estado={estadoVisual} />
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className={`text-[11px] font-semibold border rounded-md px-2.5 py-1 ${moduloStyle[e.moduloKey] || moduloStyle.desarrollo}`}>
          {e.modulo || 'Diseño y Programación Web'}
        </span>
        <span className="text-[11px] text-[#8b92a5]">{e.nota || (horasCompletadas ? 'Acreditación completada' : 'En proceso')}</span>
      </div>

      <div className="border-t border-[#f0f2f6] mt-4 pt-3.5 space-y-2.5">
        <Fila label="Empresa formadora">{e.empresa || 'WORLDNIC Tech'}</Fila>
        <Fila label="Asesor docente">{e.asesor || 'Julio César Gutarra Ramos'}</Fila>
        <Fila label="Horas EFSRT" valueClass={horasCompletadas ? 'text-[#2f6bff]' : 'text-amber-600'}>
          {horasActuales} / 480 hrs • {Math.round((horasActuales / 480) * 100)}%
        </Fila>
      </div>

      <div className="grid grid-cols-[1fr_1.35fr] gap-2.5 mt-4">
        <button 
          onClick={abrirExpediente} 
          className="flex items-center justify-center gap-2 h-9 bg-[#eef1f6] text-[#374151] rounded-lg text-[12px] font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <FiFolder className="w-3.5 h-3.5" /> Ver Expediente
        </button>
        
        <button 
          disabled={!apto && !emitida || procesandoId === e.id_estudiante}
          onClick={() => {
            if (emitida) {
              if (onVerConstancia) onVerConstancia(e);
            } else if (apto) {
              onEmitirConstancia(e);
            }
          }}
          className={`flex items-center justify-center gap-2 h-9 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
            emitida 
              ? 'bg-[#16a34a] text-white hover:bg-emerald-700' 
              : apto 
              ? 'bg-[#2f6bff] text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          {procesandoId === e.id_estudiante ? (
            <FiLoader className="w-3.5 h-3.5 animate-spin" />
          ) : emitida ? (
            <> <FiPrinter className="w-3.5 h-3.5" /> Ver Constancia </>
          ) : apto ? (
            <> <FiCheckCircle className="w-3.5 h-3.5" /> Emitir Constancia </>
          ) : (
            <> <FiClock className="w-3.5 h-3.5" /> Horas Incompletas </>
          )}
        </button>
      </div>
    </div>
  );
}

function TablaExpedientes({ lista, onSeleccionarEstudiante, onVerConstancia, onEmitirConstancia, procesandoId }) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f7f8fb] border-b border-[#e8ebf1]">
              {['Alumno', 'Expediente', 'Módulo', 'Empresa', 'Horas', 'Estado', 'Acción'].map((c) => (
                <th key={c} className="text-left text-[11px] font-bold uppercase tracking-wider text-[#6b7280] py-3 px-4">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((e) => {
              const horasCompletadas = (e.hrs || 480) >= 480;
              const emitida = e.estado === 'Constancia Emitida';
              const apto = horasCompletadas && !emitida;
              const estadoVisual = emitida ? 'Constancia Emitida' : (horasCompletadas ? 'Apto para Constancia' : 'Horas Incompletas');

              return (
                <tr key={e.exp || e.dni} className="border-b border-[#f0f2f6] last:border-0 text-[12px] hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 cursor-pointer" onClick={() => onSeleccionarEstudiante && onSeleccionarEstudiante(e)}>
                    <div className="font-bold text-[13px] text-[#2f6bff] hover:underline">{e.nombre}</div>
                    <div className="text-[11px] text-[#8b92a5]">DNI {e.dni}</div>
                  </td>
                  <td className="px-4 font-mono text-[#6b7280]">{e.exp}</td>
                  <td className="px-4">{e.modulo}</td>
                  <td className="px-4 text-[#6b7280]">{e.empresa}</td>
                  <td className="px-4 font-semibold text-[#2f6bff] whitespace-nowrap">{e.hrs || 480} / 480 hrs</td>
                  <td className="px-4"><Badge estado={estadoVisual} /></td>
                  <td className="px-4 flex items-center gap-2 py-3">
                    <button 
                      onClick={() => onSeleccionarEstudiante && onSeleccionarEstudiante(e)}
                      className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FiFolder className="w-3 h-3" /> Expediente
                    </button>
                    {emitida ? (
                      <button onClick={() => onVerConstancia && onVerConstancia(e)} className="text-[11px] font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer">
                        <FiPrinter className="w-3 h-3" /> Ver
                      </button>
                    ) : apto ? (
                      <button onClick={() => onEmitirConstancia(e)} className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer">
                        <FiCheckCircle className="w-3 h-3" /> Emitir
                      </button>
                    ) : null}
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

export default function Constancias({ onSeleccionarEstudiante, onVerConstancia }) {
  const [vista, setVista] = useState('tarjetas');
  const [busqueda, setBusqueda] = useState('');
  const [modulo, setModulo] = useState('todos');
  const [estado, setEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);
  
  const [expedientes, setExpedientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setCargando(true);
    
    fetch('/api/constancias-efsrt', {
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar con la API');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          const lista = Array.isArray(data) ? data : (data.expedientes || data.data || []);
          if (lista.length > 0) {
            setExpedientes(lista);
          } else {
            setExpedientes([
              {
                id_estudiante: 1, id_modulo: 2, nombre: 'Carlos Alberto Pérez Gómez', dni: '72345678', exp: '#EXP-2026-0841',
                ini: 'CP', estado: 'Constancia Emitida', modulo: 'Diseño y Programación Web', moduloKey: 'desarrollo',
                nota: 'Acreditación completada', empresa: 'TechLab Soluciones S.A.C.', asesor: 'Julio César Gutarra Ramos', hrs: 480
              },
              {
                id_estudiante: 2, id_modulo: 2, nombre: 'Alexis Yeshua Félix Córdova', dni: '61061388', exp: '#EXP-2026-0839',
                ini: 'AF', estado: 'Constancia Emitida', modulo: 'Diseño y Programación Web', moduloKey: 'desarrollo',
                nota: 'Acreditación completada', empresa: 'WORLDNIC Tech', asesor: 'Julio César Gutarra Ramos', hrs: 480
              }
            ]);
          }
          setCargando(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setExpedientes([
            {
              id_estudiante: 1, id_modulo: 2, nombre: 'Carlos Alberto Pérez Gómez', dni: '72345678', exp: '#EXP-2026-0841',
              ini: 'CP', estado: 'Constancia Emitida', modulo: 'Diseño y Programación Web', moduloKey: 'desarrollo',
              nota: 'Acreditación completada', empresa: 'TechLab Soluciones S.A.C.', asesor: 'Julio César Gutarra Ramos', hrs: 480
            },
            {
              id_estudiante: 2, id_modulo: 2, nombre: 'Alexis Yeshua Félix Córdova', dni: '61061388', exp: '#EXP-2026-0839',
              ini: 'AF', estado: 'Constancia Emitida', modulo: 'Diseño y Programación Web', moduloKey: 'desarrollo',
              nota: 'Acreditación completada', empresa: 'WORLDNIC Tech', asesor: 'Julio César Gutarra Ramos', hrs: 480
            }
          ]);
          setCargando(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  const handleEmitirConstancia = async (estudiante) => {
    setProcesandoId(estudiante.id_estudiante);
    try {
      const response = await fetch('/api/constancias/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
      } else {
        alert(resData.message || 'No se pudo generar la constancia.');
      }
    } catch (err) {
      alert('Error de conexión al emitir la constancia.');
    } finally {
      setProcesandoId(null);
    }
  };

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return expedientes.filter((e) => {
      const horasCompletadas = (e.hrs || 480) >= 480;
      const estadoVisual = e.estado === 'Constancia Emitida' ? 'Constancia Emitida' : (horasCompletadas ? 'Apto para Constancia' : 'Horas Incompletas');
      return (
        (modulo === 'todos' || e.moduloKey === modulo) &&
        (estado === 'todos' || estadoVisual === estado) &&
        (!q || [e.nombre, e.dni, e.exp].some((t) => (t || '').toLowerCase().includes(q)))
      );
    });
  }, [expedientes, busqueda, modulo, estado]);

  const hayFiltros = busqueda || modulo !== 'todos' || estado !== 'todos';
  const limpiar = () => { setBusqueda(''); setModulo('todos'); setEstado('todos'); };
  const emitidas = expedientes.filter((e) => e.estado === 'Constancia Emitida').length;
  const aptosParaEmitir = expedientes.filter((e) => (e.hrs || 480) >= 480 && e.estado !== 'Constancia Emitida').length;

  return (
    <div className="w-full px-4 py-3 text-[#111827]" style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}>
      <div className="space-y-3">
        <div>
          <h1 className="text-[18px] font-bold leading-tight">Constancias EFSRT</h1>
          <p className="text-[12px] text-[#6b7280] mt-0.5">Emisión y control institucional de constancias de Experiencias Formativas en Situaciones Reales de Trabajo · Periodo 2026-I</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat icon={FiFileText} valor={expedientes.length} label="Expedientes en seguimiento" tono="bg-[#eef3ff] text-[#2f6bff]" />
          <Stat icon={FiAward} valor={emitidas} label="Constancias emitidas" tono="bg-[#e6f7ee] text-[#16a34a]" />
          <Stat icon={FiCheckCircle} valor={aptosParaEmitir} label="Aptos para emitir" tono="bg-[#fff6e0] text-[#d97706]" />
        </div>

        <div className={`${card} p-3 space-y-3`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-[#dfe3ec] rounded-lg px-3 h-9 bg-white flex-1 min-w-[220px] text-[#9aa1b2]">
              <FiSearch className="w-3.5 h-3.5" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por alumno, DNI o código de expediente..."
                className="outline-none bg-transparent w-full text-[12px] text-[#111827]"
              />
            </div>
            <Select value={modulo} onChange={setModulo} opciones={OPC_MODULO} w="w-[200px]" />
            <Select value={estado} onChange={setEstado} opciones={OPC_ESTADO} w="w-[190px]" />
            <div className="flex rounded-lg border border-[#dfe3ec] bg-white p-0.5">
              {[['tarjetas', FiGrid, 'Tarjetas'], ['tabla', FiList, 'Tabla']].map(([k, Icon, t]) => (
                <button
                  key={k}
                  onClick={() => setVista(k)}
                  className={`flex items-center gap-1.5 rounded-md px-3 h-8 text-[12px] font-semibold transition-colors cursor-pointer ${vista === k ? 'bg-[#2f6bff] text-white' : 'text-[#6b7280] hover:text-[#111827]'}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2f6bff] bg-[#eef3ff] border border-[#c9d9ff] rounded-full px-2.5 py-1">
              <i className="w-1.5 h-1.5 rounded-full bg-[#2f6bff]" />
              Mostrando {lista.length} expedientes calificados
            </span>
            <button onClick={limpiar} disabled={!hayFiltros} className="flex items-center gap-1.5 text-[11px] font-medium text-[#6b7280] hover:text-gray-900 transition-colors disabled:opacity-40 cursor-pointer">
              <FiRefreshCw className="w-3 h-3" /> Limpiar filtros
            </button>
          </div>
        </div>

        {cargando ? (
          <div className={`${card} py-16 text-center flex flex-col items-center justify-center`}>
            <FiLoader className="w-6 h-6 animate-spin text-[#2f6bff]" />
            <p className="mt-3 text-[13px] font-semibold text-[#374151]">Cargando expedientes desde la base de datos...</p>
          </div>
        ) : lista.length === 0 ? (
          <div className={`${card} py-12 text-center`}>
            <FiSearch className="w-6 h-6 mx-auto text-[#9aa1b2]" />
            <p className="mt-2 text-[13px] font-semibold">No se encontraron expedientes</p>
            <p className="text-[12px] text-[#8b92a5]">Prueba con otro alumno, DNI o limpia los filtros.</p>
          </div>
        ) : vista === 'tarjetas' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {lista.map((e) => (
              <Tarjeta 
                key={e.exp || e.dni} 
                e={e} 
                onSeleccionarEstudiante={onSeleccionarEstudiante} 
                onVerConstancia={onVerConstancia}
                onEmitirConstancia={handleEmitirConstancia}
                procesandoId={procesandoId}
              />
            ))}
          </div>
        ) : (
          <TablaExpedientes 
            lista={lista} 
            onSeleccionarEstudiante={onSeleccionarEstudiante} 
            onVerConstancia={onVerConstancia}
            onEmitirConstancia={handleEmitirConstancia}
            procesandoId={procesandoId}
          />
        )}

        <div className={`${card} flex items-center justify-between px-4 py-2.5 text-[12px] text-[#6b7280]`}>
          <span>Mostrando <b className="text-[#111827]">{lista.length}</b> de <b className="text-[#111827]">{expedientes.length}</b> expedientes</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} className="w-8 h-8 rounded-md border border-[#dfe3ec] text-[#6b7280] grid place-items-center hover:bg-gray-50 cursor-pointer"><FiChevronLeft className="w-3.5 h-3.5" /></button>
            {[1, 2, 3, 4].map((n) => (
              <button key={n} onClick={() => setPagina(n)} className={`w-8 h-8 rounded-md text-[12px] font-semibold cursor-pointer ${n === pagina ? 'bg-[#2f6bff] text-white' : 'border border-[#dfe3ec] text-[#374151] hover:bg-gray-50'}`}>{n}</button>
            ))}
            <button onClick={() => setPagina((p) => Math.min(4, p + 1))} className="w-8 h-8 rounded-md border border-[#dfe3ec] text-[#374151] grid place-items-center hover:bg-gray-50 cursor-pointer"><FiChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>

      </div>
    </div>
  );
}