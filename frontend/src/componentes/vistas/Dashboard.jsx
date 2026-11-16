import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

/* ---------- Iconos ---------- */
const Icon = ({ d, className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {d}
  </svg>
)
const SearchIcon = () => (
  <Icon d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />
)
const PlusIcon = () => <Icon d={<path d="M12 5v14M5 12h14" />} />
const DownloadIcon = () => (
  <Icon d={<><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>} />
)
const SortIcon = () => <Icon d={<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />} />
const FilterIcon = () => <Icon d={<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />} />

/* ---------- Datos ---------- */
const sparkBars = [30, 45, 28, 60, 40, 75, 55, 90, 65, 50].map((v, i) => ({ i, v }))
const sparkLine = [
  18, 22, 20, 26, 24, 30, 28, 34, 40, 36, 48, 44, 56, 62, 58, 70, 66, 78, 74, 90,
].map((v, i) => ({ i, v }))

const docentes = [
  { name: 'Jordana Nicloly', role: 'Asesor Módulo III', status: 'Activo', img: 'https://i.pravatar.cc/80?img=47' },
  { name: 'Jacob Jack', role: 'Asesor Módulo I', status: 'Activo', img: 'https://i.pravatar.cc/80?img=12' },
  { name: 'Sammy Mica', role: 'Asesor Módulo II', status: 'En Revisión', img: 'https://i.pravatar.cc/80?img=15' },
  { name: 'Giles Gilley', role: 'Asesor Módulo I', status: 'Activo', img: 'https://i.pravatar.cc/80?img=33' },
]

const semanal = [
  { d: 'Lun', ok: 38, obs: -22 },
  { d: 'Mar', ok: 70, obs: -45 },
  { d: 'Mié', ok: 52, obs: -30 },
  { d: 'Jue', ok: 62, obs: -50 },
  { d: 'Vie', ok: 74, obs: -26 },
  { d: 'Sáb', ok: 30, obs: -40 },
  { d: 'Dom', ok: 46, obs: -18 },
]

const modulos = [
  ['Ene', 70, 40], ['Feb', 55, 62], ['Mar', 68, 35], ['Abr', 78, 52], ['May', 60, 70],
  ['Jun', 82, 44], ['Jul', 66, 58], ['Ago', 90, 48], ['Sep', 58, 64], ['Oct', 76, 40],
  ['Nov', 84, 56], ['Dic', 62, 72],
].map(([m, a, b]) => ({ m, horas: a, proy: b }))

const expedientes = [
  { id: '1200689173', fecha: '19 Feb 2026', est: 'Nolea Leo', hrs: '160 hrs', estado: 'Aprobado' },
  { id: '1200689172', fecha: '19 Feb 2026', est: 'Nolea Leo', hrs: '160 hrs', estado: 'Aprobado' },
  { id: '1200689171', fecha: '18 Feb 2026', est: 'Jackson Leo', hrs: '160 hrs', estado: 'Aprobado' },
  { id: '1200689170', fecha: '18 Feb 2026', est: 'Nolea Leo', hrs: '90 hrs', estado: 'En Progreso' },
  { id: '1200689170', fecha: '17 Feb 2026', est: 'Marlene Chris', hrs: '90 hrs', estado: 'Observado' },
]

const estadoStyle = {
  Aprobado: 'bg-[#e6f7ee] text-[#16a34a]',
  'En Progreso': 'bg-[#fff3df] text-[#f59e0b]',
  Observado: 'bg-[#fde8ea] text-[#ef4444]',
}

const alumnos = [
  { name: 'Timmy Cooper', tag: 'DOCENTE', color: 'text-[#f59e0b]', img: 'https://i.pravatar.cc/200?img=5' },
  { name: 'Daniel Prado', tag: 'ALUMNO', color: 'text-[#16a34a]', img: 'https://i.pravatar.cc/200?img=14' },
  { name: 'Helena Ramos', tag: 'DOCENTE', color: 'text-[#f59e0b]', img: 'https://i.pravatar.cc/200?img=32' },
  { name: 'Zurita M.', tag: 'DOCENTE', color: 'text-[#f59e0b]', img: 'https://i.pravatar.cc/200?img=52' },
  { name: 'Daniel Vega', tag: 'ALUMNO', color: 'text-[#16a34a]', img: 'https://i.pravatar.cc/200?img=60' },
]

/* ---------- Piezas reutilizables ---------- */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#eceef3] p-4 ${className}`}>{children}</div>
)

const Badge = ({ children }) => (
  <span className="text-[10px] font-semibold text-[#16a34a] bg-[#e6f7ee] rounded-md px-1.5 py-0.5">
    {children}
  </span>
)

const SearchBox = ({ placeholder, w = 'w-40' }) => (
  <div className={`flex items-center gap-1.5 border border-[#e3e6ee] rounded-lg px-2.5 py-1.5 text-[#9aa1b2] text-[11px] ${w}`}>
    <SearchIcon />
    <input placeholder={placeholder} className="outline-none bg-transparent w-full placeholder:text-[#9aa1b2]" />
  </div>
)

const GhostBtn = ({ icon, children }) => (
  <button className="flex items-center gap-1.5 border border-[#e3e6ee] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#374151] bg-white">
    {icon}{children}
  </button>
)

/* ---------- Vista ---------- */
export default function Dashboard({ setVista, setEstudiante }) {
  return (
    <div
      className="min-h-screen bg-[#f4f6fa] p-6 text-[#111827]"
      style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}
    >
      <div className="max-w-[3/4] mx-auto space-y-4">

        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight">Buenos Días, Administrador.</h1>
            <p className="text-[11px] text-[#8b92a5] mt-1">
              Gestión y control de prácticas preprofesionales EFSRT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GhostBtn icon={<DownloadIcon />}>Exportar Reporte</GhostBtn>
            <button className="flex items-center gap-1.5 bg-[#2f6bff] text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold">
              <PlusIcon /> Nueva Constancia
            </button>
          </div>
        </div>

        {/* Fila 1: métricas */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              Alumnos Registrados <Badge>+3.7%</Badge>
            </div>
            <div className="flex items-end justify-between mt-2">
              <div className="text-[28px] font-extrabold leading-none">92k</div>
              <div className="w-20 h-10">
                <ResponsiveContainer>
                  <BarChart data={sparkBars} barCategoryGap={2}>
                    <Bar dataKey="v" fill="#2f6bff" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              Revisiones EFSRT <Badge>+7.1%</Badge>
            </div>
            <div className="flex items-end justify-between mt-2">
              <div className="text-[28px] font-extrabold leading-none">34.2k</div>
              <div className="w-24 h-10">
                <ResponsiveContainer>
                  <LineChart data={sparkLine}>
                    <Line type="monotone" dataKey="v" stroke="#2f6bff" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              Horas Validadas <Badge>+10.4%</Badge>
            </div>
            <div className="text-[28px] font-extrabold leading-none mt-2">128k</div>
            <div className="flex items-center justify-between text-[9px] text-[#6b7280] mt-2">
              <span className="font-medium">Meta Institucional</span>
              <span className="font-bold text-[#111827]">98%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#e8ebf2] mt-1">
              <div className="h-1.5 rounded-full bg-[#2f6bff]" style={{ width: '98%' }} />
            </div>
          </Card>

          <Card>
            <div className="text-[11px] text-[#6b7280]">Docentes Asesores</div>
            <div className="flex items-end justify-between mt-2">
              <div className="text-[28px] font-extrabold leading-none">1.2k</div>
              <div className="flex -space-x-2">
                {[8, 20, 41].map((n) => (
                  <img key={n} src={`https://i.pravatar.cc/40?img=${n}`}
                    className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                ))}
                <span className="w-6 h-6 rounded-full border-2 border-white bg-[#111827] text-white text-[8px] grid place-items-center">+9</span>
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[9px] font-semibold text-[#16a34a] bg-[#e6f7ee] rounded px-1.5 py-0.5">Activos</span>
            </div>
          </Card>
        </div>

        {/* Fila 2: docentes + revisiones semanales */}
        <div className="grid grid-cols-[1.05fr_1fr] gap-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[13px] font-bold">Docentes y Asesores</h3>
                <p className="text-[10px] text-[#8b92a5] mt-0.5 max-w-[150px] leading-snug">
                  Asignación y seguimiento de tutores de prácticas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SearchBox placeholder="Buscar tutor..." w="w-36" />
                <button className="flex items-center gap-1 bg-[#2f6bff] text-white rounded-lg px-2.5 py-1.5 text-[11px] font-semibold">
                  <PlusIcon /> Asignar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
              {docentes.map((d) => (
                <div
                  key={d.name}
                  onClick={() => { setEstudiante(d); setVista('Ficha Docente') }}
                  className="flex items-center gap-2.5 border border-[#eceef3] rounded-xl p-2.5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <img src={d.img} className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">{d.name}</div>
                    <div className="text-[9px] text-[#8b92a5] truncate">{d.role}</div>
                  </div>
                  <span className={`text-[8px] font-semibold rounded px-1.5 py-0.5 ${
                    d.status === 'Activo' ? 'bg-[#e6f7ee] text-[#16a34a]' : 'bg-[#e8f0ff] text-[#2f6bff]'
                  }`}>{d.status}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 text-[10px]">
              <span className="text-[#8b92a5]">Mostrando 4 de 12 docentes asignados</span>
              <a
                onClick={() => setVista('Plantel Docente')}
                className="text-[#2f6bff] font-semibold cursor-pointer"
              >
                Administrar todos los asesores
              </a>
            </div>
          </Card>

          <Card>
            <h3 className="text-[13px] font-bold">Revisiones Semanales</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[20px] font-extrabold">25,217</span>
              <Badge>+2.7% vs anterior</Badge>
            </div>
            <div className="h-[130px] mt-2">
              <ResponsiveContainer>
                <BarChart data={semanal} stackOffset="sign" barSize={5}>
                  <CartesianGrid vertical={false} stroke="#eef0f5" />
                  <XAxis dataKey="d" axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fill: '#8b92a5' }} />
                  <YAxis hide />
                  <ReferenceLine y={0} stroke="#e3e6ee" />
                  <Bar dataKey="ok" stackId="a" fill="#34c38f" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="obs" stackId="a" fill="#f78fa0" radius={[0, 0, 3, 3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[9px] text-[#6b7280] mt-1">
              <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#34c38f]" />Aprobados</span>
              <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#f78fa0]" />Observados</span>
            </div>
          </Card>
        </div>

        {/* Fila 3: módulos + tabla */}
        <div className="grid grid-cols-[1fr_1.05fr] gap-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[13px] font-bold">Resumen de Módulos</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[20px] font-extrabold">25,217 hrs</span>
                  <Badge>+3.7%</Badge>
                </div>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-[#e3e6ee] text-[10px] font-semibold">
                {['Sem', 'Mes', 'Año', 'All'].map((t, i) => (
                  <button key={t} className={`px-2.5 py-1 ${i === 0 ? 'bg-[#2f6bff] text-white' : 'bg-white text-[#6b7280]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[150px] mt-3">
              <ResponsiveContainer>
                <BarChart data={modulos} barGap={2} barSize={4}>
                  <XAxis dataKey="m" axisLine={false} tickLine={false}
                    tick={{ fontSize: 8, fill: '#8b92a5' }} />
                  <YAxis hide />
                  <Bar dataKey="horas" fill="#1f2937" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="proy" fill="#2f6bff" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[9px] text-[#6b7280] mt-1">
              <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#1f2937]" />Horas Registradas</span>
              <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#2f6bff]" />Proyectos Activos</span>
            </div>
            <div className="grid grid-cols-4 border-t border-[#eceef3] mt-3 pt-3 text-center">
              {[['12,721', 'Total de horas'], ['721', 'EFSRT'], ['2,80,523', 'Alumnos'], ['12,345', 'Con Retraso']].map(([v, l]) => (
                <div key={l}>
                  <div className="text-[11px] font-bold">{v}</div>
                  <div className="text-[8px] text-[#8b92a5]">{l}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <h3 className="text-[13px] font-bold max-w-[110px] leading-snug">
                Últimas Actualizaciones de Prácticas
              </h3>
              <div className="flex items-center gap-2">
                <SearchBox placeholder="Buscar ID..." w="w-28" />
                <GhostBtn icon={<SortIcon />}>Ordenar</GhostBtn>
                <GhostBtn icon={<FilterIcon />}>Filtrar</GhostBtn>
              </div>
            </div>

            <table className="w-full mt-3 text-left">
              <thead>
                <tr className="text-[8px] uppercase tracking-wide text-[#8b92a5] bg-[#f7f8fb]">
                  {['ID Expediente', 'Fecha', 'Estudiante', 'Horas EFSRT', 'Estado', 'Acción'].map((h) => (
                    <th key={h} className="font-semibold py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expedientes.map((r, i) => (
                  <tr
                    key={i}
                    onClick={() => { setEstudiante({ name: r.est, id: r.id }); setVista('Ficha Docente') }}
                    className="border-b border-[#f0f2f6] text-[10px] cursor-pointer hover:bg-[#f7f8fb]"
                  >
                    <td className="py-2.5 px-2 text-[#2f6bff] font-semibold">{r.id}</td>
                    <td className="px-2 text-[#6b7280]">{r.fecha}</td>
                    <td className="px-2 font-semibold">{r.est}</td>
                    <td className="px-2 text-[#2f6bff] font-semibold">{r.hrs}</td>
                    <td className="px-2">
                      <span className={`text-[9px] font-semibold rounded px-1.5 py-0.5 ${estadoStyle[r.estado]}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-2 text-[#9aa1b2]">⋮</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-3 text-[9px] text-[#8b92a5]">
              <span>Mostrando 5 de 63 expedientes</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <button key={n} className={`w-5 h-5 rounded text-[9px] font-semibold ${
                    n === 1 ? 'bg-[#2f6bff] text-white' : 'border border-[#e3e6ee] text-[#374151]'
                  }`}>{n}</button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Fila 4: últimos alumnos */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold">Últimos Alumnos</h3>
            <div className="flex gap-2">
              <GhostBtn icon={<SortIcon />}>Ordenar</GhostBtn>
              <GhostBtn icon={<FilterIcon />}>Filtrar</GhostBtn>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4 mt-3">
            {alumnos.map((a) => (
              <div
                key={a.name}
                onClick={() => { setEstudiante(a); setVista('Ficha Docente') }}
                className="border border-[#eceef3] rounded-xl p-2 text-center cursor-pointer hover:shadow-md transition-shadow"
              >
                <img src={a.img} className="w-full h-[90px] object-cover rounded-lg" />
                <div className={`text-[8px] font-bold tracking-wider mt-2 ${a.color}`}>{a.tag}</div>
                <div className="text-[11px] font-bold mt-0.5">{a.name}</div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}