import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Tooltip,
} from 'recharts'
import api, { getCachedData, invalidateApiCache } from '../../api/axios'

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

const estadoStyle = {
  Aprobado: 'bg-[#e6f7ee] text-[#16a34a]',
  APROBADO: 'bg-[#e6f7ee] text-[#16a34a]',
  'En Progreso': 'bg-[#fff3df] text-[#f59e0b]',
  'EN PROGRESO': 'bg-[#fff3df] text-[#f59e0b]',
  Observado: 'bg-[#fde8ea] text-[#ef4444]',
  OBSERVADO: 'bg-[#fde8ea] text-[#ef4444]',
}

/* ---------- Persistencia en localStorage (sin recargas entre secciones) ---------- */
const LS_KEYS = {
  resumen: 'dashboard_efsrt_resumen_v2',
  docentes: 'dashboard_efsrt_docentes_v1',
  expedientes: 'dashboard_efsrt_expedientes_v1',
  alumnos: 'dashboard_efsrt_alumnos_v1',
  rolUsuario: 'dashboard_efsrt_rol_usuario_v1',
}

const leerLocal = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const guardarLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignorar cuota o restricciones de almacenamiento */
  }
}

const urlFotoPublica = (valor) => {
  const foto = String(valor || '').trim()
  if (!foto) return ''
  if (/^(https?:|data:|blob:)/i.test(foto)) return foto
  const origen = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${origen}/${foto.replace(/^\/+/, '')}`
}

const limpiarLocalDashboard = () => {
  ;[LS_KEYS.resumen, LS_KEYS.docentes, LS_KEYS.expedientes, LS_KEYS.alumnos].forEach((k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignorar error */
    }
  })
}

/* ---------- Resolución del rol del usuario que accede ---------- */
const formatearRol = (valor) => {
  if (!valor) return ''
  if (Array.isArray(valor)) {
    const primero = valor[0]
    if (!primero) return ''
    valor = typeof primero === 'string'
      ? primero
      : (primero.nombre || primero.name || primero.rol || primero.role || '')
  }
  if (typeof valor === 'object') {
    valor = valor.nombre || valor.name || valor.rol || valor.role || valor.descripcion || ''
  }
  const limpio = String(valor).trim()
  if (!limpio) return ''

  const mapa = {
    admin: 'Administrador',
    administrador: 'Administrador',
    superadmin: 'Super Administrador',
    docente: 'Docente',
    asesor: 'Asesor EFSRT',
    coordinador: 'Coordinador',
    estudiante: 'Estudiante',
    alumno: 'Alumno',
    secretaria: 'Secretaría Académica',
  }
  const clave = limpio.toLowerCase()
  if (mapa[clave]) return mapa[clave]

  return limpio
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const extraerRolDeObjeto = (obj) => {
  if (!obj || typeof obj !== 'object') return ''
  const objetivo = obj.user && typeof obj.user === 'object'
    ? obj.user
    : (obj.usuario && typeof obj.usuario === 'object' ? obj.usuario : obj)

  const candidatos = [
    objetivo.rol,
    objetivo.role,
    objetivo.tipo_usuario,
    objetivo.perfil,
    objetivo.cargo,
    objetivo.roles,
    obj.rol,
    obj.role,
    obj.tipo_usuario,
    obj.roles,
  ]

  for (const c of candidatos) {
    const rolFormateado = formatearRol(c)
    if (rolFormateado) return rolFormateado
  }
  return ''
}

const obtenerRolActual = (apiPayload) => {
  const desdeApi = extraerRolDeObjeto(apiPayload)
  if (desdeApi) {
    guardarLocal(LS_KEYS.rolUsuario, desdeApi)
    return desdeApi
  }

  const keysUsuario = [
    'user',
    'usuario',
    'auth_user',
    'perfil',
    'sesion',
    'rol',
    'role',
    'tipo_usuario',
    'user_role',
  ]
  for (const k of keysUsuario) {
    try {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        const rolObj = extraerRolDeObjeto(parsed) || formatearRol(parsed)
        if (rolObj) {
          guardarLocal(LS_KEYS.rolUsuario, rolObj)
          return rolObj
        }
      } catch {
        const rolTexto = formatearRol(raw)
        if (rolTexto) {
          guardarLocal(LS_KEYS.rolUsuario, rolTexto)
          return rolTexto
        }
      }
    } catch {
      /* ignorar error */
    }
  }

  const guardado = leerLocal(LS_KEYS.rolUsuario)
  if (typeof guardado === 'string' && guardado.trim()) return guardado.trim()

  return 'Usuario'
}

/* ---------- Helpers para extraer listas y campos de respuestas Laravel ---------- */
const extraerLista = (data) => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.expedientes)) return data.expedientes
  if (Array.isArray(data.docentes)) return data.docentes
  if (Array.isArray(data.estudiantes)) return data.estudiantes
  if (Array.isArray(data.alumnos)) return data.alumnos
  if (data.data && Array.isArray(data.data.data)) return data.data.data
  return []
}

const normalizarDocente = (d = {}) => {
  const nombre =
    d.name ||
    d.nombre ||
    [d.nombres, d.apellidos].filter(Boolean).join(' ') ||
    d.usuario?.name ||
    'Docente'
  const rol =
    d.role ||
    d.especialidad ||
    d.cargo ||
    d.modulo ||
    d.modulo_nombre ||
    'Asesor EFSRT'
  const estado = d.status || d.estado || (d.activo === false ? 'En Revisión' : 'Activo')
  const rawImg = d.img || d.foto_url || d.foto || d.avatar || ''
  const foto = urlFotoPublica(rawImg)
  const img =
    foto && !foto.includes('pravatar')
      ? foto
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=e8f0ff&color=2f6bff`

  return {
    id: d.id ?? d.docente_id ?? nombre,
    name: nombre,
    role: rol,
    status: estado,
    img,
    raw: d,
  }
}

const normalizarExpediente = (r = {}, idx = 0) => {
  const estObj = r.estudiante || r.alumno || null
  const nombreEst =
    r.est ||
    r.estudiante_nombre ||
    r.nombre ||
    (typeof estObj === 'string' ? estObj : '') ||
    (estObj
      ? estObj.name || estObj.nombre || [estObj.nombres, estObj.apellidos].filter(Boolean).join(' ')
      : '') ||
    '-'

  const horasNum = r.horas ?? r.horas_efsrt ?? r.horas_acumuladas ?? r.total_horas
  const hrs =
    r.hrs ||
    (horasNum !== undefined && horasNum !== null && horasNum !== ''
      ? String(horasNum).includes('hr')
        ? String(horasNum)
        : `${horasNum} hrs`
      : '-')

  const fechaRaw = r.fecha || r.fecha_emision || r.fecha_registro || r.fecha_inicio || r.created_at || ''
  const fecha = fechaRaw ? String(fechaRaw).slice(0, 10) : '-'

  return {
    id: r.id ?? r.id_expediente ?? r.codigo ?? r.numero_expediente ?? `EXP-${idx + 1}`,
    fecha,
    est: nombreEst,
    hrs,
    estado: r.estado || 'En Progreso',
    raw: r,
  }
}

const normalizarAlumno = (a = {}, idx = 0) => {
  const nombre =
    a.name ||
    a.nombre ||
    [a.nombres, a.apellidos].filter(Boolean).join(' ') ||
    a.usuario?.name ||
    `Alumno ${idx + 1}`
  const tag = String(a.tag || a.rol || a.tipo || a.estado || 'ALUMNO').toUpperCase()
  const color = tag.includes('DOC') ? 'text-[#f59e0b]' : 'text-[#16a34a]'
  const rawImg = a.img || a.foto_url || a.foto || a.avatar || ''
  const foto = urlFotoPublica(rawImg)
  const img =
    foto && !foto.includes('pravatar')
      ? foto
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=e6f7ee&color=16a34a`

  return {
    id: a.id ?? a.id_estudiante ?? a.estudiante_id ?? `alu-${idx + 1}`,
    name: nombre,
    tag,
    color,
    img,
    raw: a,
  }
}

const desempaquetarObjeto = (data, fallback) => {
  if (!data || typeof data !== 'object') return fallback
  return data.data && typeof data.data === 'object' && !Array.isArray(data.data)
    ? { ...fallback, ...data.data }
    : { ...fallback, ...data }
}

/* ---------- Piezas reutilizables ---------- */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#eceef3] p-4 ${className}`}>{children}</div>
)

const Badge = ({ children }) => (
  <span className="text-[10px] font-semibold text-[#16a34a] bg-[#e6f7ee] rounded-md px-1.5 py-0.5">
    {children}
  </span>
)

const SearchBox = ({ placeholder, w = 'w-40', value, onChange }) => (
  <div className={`flex items-center gap-1.5 border border-[#e3e6ee] rounded-lg px-2.5 py-1.5 text-[#9aa1b2] text-[11px] ${w}`}>
    <SearchIcon />
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="outline-none bg-transparent text-[#111827] w-full placeholder:text-[#9aa1b2]"
    />
  </div>
)

const GhostBtn = ({ icon, children, onClick, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    className="flex items-center gap-1.5 border border-[#e3e6ee] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#374151] bg-white hover:bg-[#f9fafb] transition-colors cursor-pointer"
  >
    {icon}{children}
  </button>
)

const RESUMEN_BASE = {
  alumnosRegistrados: 0,
  varAlumnos: '0%',
  revisionesEfsrt: 0,
  varRevisiones: '0%',
  horasValidadas: 0,
  varHoras: '0%',
  metaInstitucional: 0,
  docentesAsesores: 0,
  totalDocentesAsignados: 0,
  revisionesSemanalesTotal: 0,
  varSemanal: '0%',
  horasModuloTotal: '0 hrs',
  varModulo: '0%',
  sparkBars: [],
  sparkLine: [],
  semanal: [],
  modulos: [],
  totalesModulos: [
    [0, 'Total de horas'],
    [0, 'EFSRT'],
    [0, 'Alumnos'],
    [0, 'Con Retraso'],
  ],
}

/* ---------- Vista ---------- */
export default function Dashboard({ setVista, setEstudiante, darkMode }) {
  const [rolUsuario, setRolUsuario] = useState(() => obtenerRolActual())
  const [periodoModulo, setPeriodoModulo] = useState('Sem')
  const [buscarTutor, setBuscarTutor] = useState('')
  const [buscarExpediente, setBuscarExpediente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [ordenExp, setOrdenExp] = useState('desc')
  const [pagina, setPagina] = useState(1)
  const [exportando, setExportando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  const [modalAsignar, setModalAsignar] = useState(false)
  const [formAsignar, setFormAsignar] = useState({ docente: '', modulo: 'Asesor Módulo I' })
  const [guardando, setGuardando] = useState(false)

  const [resumen, setResumen] = useState(() => {
    const cached = getCachedData('/dashboard/resumen', { periodo: 'Sem' }) || leerLocal(LS_KEYS.resumen)
    return desempaquetarObjeto(cached, RESUMEN_BASE)
  })

  const [docentes, setDocentes] = useState(() => {
    const cached = getCachedData('/docentes', { all: true }) || leerLocal(LS_KEYS.docentes)
    return cached ? extraerLista(cached).map(normalizarDocente) : []
  })

  const [expedientes, setExpedientes] = useState(() => {
    const cached = getCachedData('/constancias-efsrt') || leerLocal(LS_KEYS.expedientes)
    return cached ? extraerLista(cached).map(normalizarExpediente) : []
  })

  const [alumnos, setAlumnos] = useState(() => {
    const cached = getCachedData('/estudiantes', { all: true }) || leerLocal(LS_KEYS.alumnos)
    return cached ? extraerLista(cached).map(normalizarAlumno) : []
  })

  const [filtroRolAlumno, setFiltroRolAlumno] = useState('')
  const [ordenAlumnoAsc, setOrdenAlumnoAsc] = useState(true)

  // Carga paralela de datos reales con respaldo inmediato en caché y localStorage
  useEffect(() => {
    let activo = true

    setRolUsuario(obtenerRolActual())

    const cachedRes = getCachedData('/dashboard/resumen', { periodo: periodoModulo })
    if (cachedRes) setResumen((prev) => desempaquetarObjeto(cachedRes, prev))

    const cachedDoc = getCachedData('/docentes', { all: true })
    if (cachedDoc) setDocentes(extraerLista(cachedDoc).map(normalizarDocente))

    const cachedExp = getCachedData('/constancias-efsrt')
    if (cachedExp) setExpedientes(extraerLista(cachedExp).map(normalizarExpediente))

    const cachedAlu = getCachedData('/estudiantes', { all: true })
    if (cachedAlu) setAlumnos(extraerLista(cachedAlu).map(normalizarAlumno))

    async function cargarTodo() {
      const [resEst, resDoc, resExp, resAlu, resPerfil] = await Promise.allSettled([
        api.get('/dashboard/resumen', { params: { periodo: periodoModulo } }),
        api.get('/docentes', { params: { all: true } }),
        api.get('/constancias-efsrt'),
        api.get('/estudiantes', { params: { all: true } }),
        api.get('/perfil'),
      ])

      if (!activo) return

      if (resPerfil.status === 'fulfilled' && resPerfil.value?.data) {
        setRolUsuario(obtenerRolActual(resPerfil.value.data))
      }

      let totalDocentesCalc = null
      let totalAlumnosCalc = null

      if (resDoc.status === 'fulfilled' && resDoc.value?.data) {
        const d = resDoc.value.data
        const lista = extraerLista(d).map(normalizarDocente)
        setDocentes(lista)
        guardarLocal(LS_KEYS.docentes, lista)
        totalDocentesCalc = typeof d?.total === 'number'
          ? d.total
          : (typeof d?.meta?.total === 'number' ? d.meta.total : lista.length)
      }

      if (resAlu.status === 'fulfilled' && resAlu.value?.data) {
        const a = resAlu.value.data
        const lista = extraerLista(a).map(normalizarAlumno)
        setAlumnos(lista)
        guardarLocal(LS_KEYS.alumnos, lista)
        totalAlumnosCalc = typeof a?.total === 'number'
          ? a.total
          : (typeof a?.meta?.total === 'number' ? a.meta.total : lista.length)
      }

      if (resEst.status === 'fulfilled' && resEst.value?.data) {
        setRolUsuario((rActual) => obtenerRolActual(resEst.value.data) || rActual)
        setResumen((prev) => {
          const next = desempaquetarObjeto(resEst.value.data, prev)
          const actualizado = {
            ...next,
            ...(totalDocentesCalc !== null ? { totalDocentesAsignados: totalDocentesCalc } : {}),
            ...(totalAlumnosCalc !== null && !next.alumnosRegistrados
              ? { alumnosRegistrados: totalAlumnosCalc }
              : {}),
          }
          guardarLocal(LS_KEYS.resumen, actualizado)
          return actualizado
        })
      } else if (totalDocentesCalc !== null || totalAlumnosCalc !== null) {
        setResumen((prev) => {
          const actualizado = {
            ...prev,
            ...(totalDocentesCalc !== null ? { totalDocentesAsignados: totalDocentesCalc } : {}),
            ...(totalAlumnosCalc !== null && !prev.alumnosRegistrados
              ? { alumnosRegistrados: totalAlumnosCalc }
              : {}),
          }
          guardarLocal(LS_KEYS.resumen, actualizado)
          return actualizado
        })
      }

      if (resExp.status === 'fulfilled' && resExp.value?.data) {
        const e = resExp.value.data
        const lista = extraerLista(e).map(normalizarExpediente)
        setExpedientes(lista)
        guardarLocal(LS_KEYS.expedientes, lista)
      }
    }

    cargarTodo()
    return () => { activo = false }
  }, [periodoModulo, recargar])

  const listaDocentesCompleta = Array.isArray(docentes) ? docentes : []
  const listaExpedientesCompleta = Array.isArray(expedientes) ? expedientes : []
  const listaAlumnosCompleta = Array.isArray(alumnos) ? alumnos : []

  // Docentes filtrados completos
  const docentesFiltrados = useMemo(() => {
    const q = buscarTutor.trim().toLowerCase()
    if (!q) return listaDocentesCompleta
    return listaDocentesCompleta.filter((d) =>
      `${d.name} ${d.role} ${d.status}`.toLowerCase().includes(q)
    )
  }, [listaDocentesCompleta, buscarTutor])

  // Expedientes filtrados, ordenados y paginados
  const expedientesFiltrados = useMemo(() => {
    const q = buscarExpediente.trim().toLowerCase()
    const base = listaExpedientesCompleta.filter((r) => {
      const coincideTexto =
        !q ||
        String(r.id).toLowerCase().includes(q) ||
        String(r.est).toLowerCase().includes(q) ||
        String(r.estado).toLowerCase().includes(q)
      const coincideEstado =
        !filtroEstado || String(r.estado).toLowerCase() === filtroEstado.toLowerCase()
      return coincideTexto && coincideEstado
    })
    return [...base].sort((a, b) => {
      const cmp = String(a.id).localeCompare(String(b.id), 'es', { numeric: true })
      return ordenExp === 'asc' ? cmp : -cmp
    })
  }, [listaExpedientesCompleta, buscarExpediente, filtroEstado, ordenExp])

  const porPaginaExp = 5
  const totalExpedientes = expedientesFiltrados.length
  const totalPaginas = Math.max(1, Math.ceil(totalExpedientes / porPaginaExp))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const listaExpedientes = useMemo(() => {
    const inicio = (paginaSegura - 1) * porPaginaExp
    return expedientesFiltrados.slice(inicio, inicio + porPaginaExp)
  }, [expedientesFiltrados, paginaSegura])

  // Todos los alumnos reales filtrados y ordenados
  const alumnosFiltrados = useMemo(() => {
    const base = listaAlumnosCompleta.filter((a) => {
      if (!filtroRolAlumno) return true
      return String(a.tag).toUpperCase().includes(filtroRolAlumno)
    })
    return [...base].sort((a, b) => {
      const cmp = String(a.name).localeCompare(String(b.name), 'es', { sensitivity: 'base' })
      return ordenAlumnoAsc ? cmp : -cmp
    })
  }, [listaAlumnosCompleta, filtroRolAlumno, ordenAlumnoAsc])

  const alternarFiltroEstado = () => {
    const ciclos = ['', 'Aprobado', 'En Progreso', 'Observado']
    const siguiente = ciclos[(ciclos.indexOf(filtroEstado) + 1) % ciclos.length]
    setFiltroEstado(siguiente)
    setPagina(1)
  }

  const alternarFiltroAlumno = () => {
    const ciclos = ['', 'ALUMNO', 'DOCENTE']
    const siguiente = ciclos[(ciclos.indexOf(filtroRolAlumno) + 1) % ciclos.length]
    setFiltroRolAlumno(siguiente)
  }

  const handleExportar = async () => {
    try {
      setExportando(true)
      const response = await api.get('/reportes/estadisticas', {
        params: { estado: filtroEstado, buscar: buscarExpediente, periodo: periodoModulo, exportar: 'csv' },
        responseType: 'blob',
      })
      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob(
            [
              '\uFEFF' +
                [
                  ['ID Expediente', 'Fecha', 'Estudiante', 'Horas EFSRT', 'Estado'],
                  ...expedientesFiltrados.map((r) => [r.id, r.fecha, r.est, r.hrs, r.estado]),
                ]
                  .map((fila) => fila.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
                  .join('\n'),
            ],
            { type: 'text/csv;charset=utf-8;' }
          )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reporte-efsrt.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al exportar reporte:', err)
    } finally {
      setExportando(false)
    }
  }

  const asignarAsesor = async (e) => {
    e.preventDefault()
    if (!formAsignar.docente.trim()) return
    try {
      setGuardando(true)
      await api.post('/asignaciones-asesores', formAsignar)
      invalidateApiCache('/asignaciones-asesores')
      limpiarLocalDashboard()
      setModalAsignar(false)
      setFormAsignar({ docente: '', modulo: 'Asesor Módulo I' })
      setRecargar((r) => r + 1)
    } catch (err) {
      console.error('Error al asignar asesor:', err)
    } finally {
      setGuardando(false)
    }
  }

  const totalAlumnosReal = resumen.alumnosRegistrados || listaAlumnosCompleta.length
  const totalDocentesReal = resumen.totalDocentesAsignados || listaDocentesCompleta.length
  const totalDocentesActivos = resumen.docentesAsesores || listaDocentesCompleta.length

  const sparkBarsData = Array.isArray(resumen.sparkBars) ? resumen.sparkBars : []
  const sparkLineData = Array.isArray(resumen.sparkLine) ? resumen.sparkLine : []
  const semanalData = Array.isArray(resumen.semanal) ? resumen.semanal : []
  const modulosData = Array.isArray(resumen.modulos) ? resumen.modulos : []
  const totalesModulosData = Array.isArray(resumen.totalesModulos) ? resumen.totalesModulos : []

  return (
    <div
      className="dashboard-admin min-h-full w-full bg-[#f4f6fa] text-[#111827]"
      data-theme={darkMode ? "dark" : "light"}
      style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-[1500px] min-w-0 space-y-5">

        {/* Encabezado */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight">Buenos Días, {rolUsuario}.</h1>
            <p className="mt-1 text-sm text-[#8b92a5]">
              Gestión y control de prácticas preprofesionales EFSRT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GhostBtn icon={<DownloadIcon />} onClick={handleExportar}>
              {exportando ? 'Exportando...' : 'Exportar Reporte'}
            </GhostBtn>
          </div>
        </div>

        {/* Fila 1: métricas */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#6b7280]">
              Alumnos Registrados <Badge>{resumen.varAlumnos}</Badge>
            </div>
            <div className="flex items-end justify-between mt-2">
              <div className="text-[28px] font-extrabold leading-none">{totalAlumnosReal}</div>
              <div className="w-20 h-10">
                <ResponsiveContainer>
                  <BarChart data={sparkBarsData} barCategoryGap={2}>
                    <Bar dataKey="v" fill="#2f6bff" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              Revisiones EFSRT <Badge>{resumen.varRevisiones}</Badge>
            </div>
            <div className="flex items-end justify-between mt-2">
              <div className="text-[28px] font-extrabold leading-none">{resumen.revisionesEfsrt}</div>
              <div className="w-24 h-10">
                <ResponsiveContainer>
                  <LineChart data={sparkLineData}>
                    <Line type="monotone" dataKey="v" stroke="#2f6bff" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              Horas Validadas <Badge>{resumen.varHoras}</Badge>
            </div>
            <div className="text-[28px] font-extrabold leading-none mt-2">{resumen.horasValidadas}</div>
            <div className="flex items-center justify-between text-[9px] text-[#6b7280] mt-2">
              <span className="font-medium">Meta Institucional</span>
              <span className="font-bold text-[#111827]">{resumen.metaInstitucional}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#e8ebf2] mt-1">
              <div
                className="h-1.5 rounded-full bg-[#2f6bff]"
                style={{ width: `${Math.min(100, Math.max(0, Number(resumen.metaInstitucional) || 0))}%` }}
              />
            </div>
          </Card>

          <Card>
            <div className="text-[11px] text-[#6b7280]">Docentes Asesores</div>
            <div className="flex items-end justify-between mt-2">
              <div className="text-[28px] font-extrabold leading-none">{totalDocentesActivos}</div>
              <div className="flex -space-x-2">
                {listaDocentesCompleta.slice(0, 3).map((d, idx) => (
                  <img
                    key={d.id ?? `avatar-doc-${idx}`}
                    src={d.img}
                    alt={d.name || 'Asesor'}
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                ))}
                {totalDocentesReal > 3 && (
                  <span className="w-6 h-6 rounded-full border-2 border-white bg-[#111827] text-white text-[8px] grid place-items-center">
                    +{totalDocentesReal - 3}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[9px] font-semibold text-[#16a34a] bg-[#e6f7ee] rounded px-1.5 py-0.5">Activos</span>
            </div>
          </Card>
        </div>

        {/* Fila 2: docentes completos + revisiones semanales */}
        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[1.05fr_1fr] sm:gap-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-[13px] font-bold">Docentes y Asesores</h3>
                <p className="text-[10px] text-[#8b92a5] mt-0.5 max-w-[150px] leading-snug">
                  Asignación y seguimiento de tutores de prácticas
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SearchBox
                  placeholder="Buscar tutor..."
                  w="w-36"
                  value={buscarTutor}
                  onChange={(e) => setBuscarTutor(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setModalAsignar(true)}
                  className="flex items-center gap-1 bg-[#2f6bff] text-white rounded-lg px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer"
                >
                  <PlusIcon /> Asignar
                </button>
              </div>
            </div>

            <div className="mt-4 grid max-h-[260px] grid-cols-1 gap-x-4 gap-y-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {docentesFiltrados.length === 0 ? (
                <div className="col-span-full py-6 text-center text-[10px] text-[#8b92a5]">
                  No hay docentes registrados o no coinciden con la búsqueda.
                </div>
              ) : (
                docentesFiltrados.map((d, idx) => (
                  <div
                    key={d.id ?? `doc-${idx}`}
                    onClick={() => { setEstudiante && setEstudiante(d); setVista && setVista('Ficha Docente') }}
                    className="flex items-center gap-2.5 border border-[#eceef3] rounded-xl p-2.5 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <img src={d.img} alt={d.name || 'Docente'} className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate">{d.name}</div>
                      <div className="text-[9px] text-[#8b92a5] truncate">{d.role}</div>
                    </div>
                    <span className={`text-[8px] font-semibold rounded px-1.5 py-0.5 ${
                      String(d.status).toLowerCase() === 'activo' ? 'bg-[#e6f7ee] text-[#16a34a]' : 'bg-[#e8f0ff] text-[#2f6bff]'
                    }`}>{d.status}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between mt-4 text-[10px]">
              <span className="text-[#8b92a5]">
                Mostrando {docentesFiltrados.length} de {totalDocentesReal} docentes asignados
              </span>
              <button
                type="button"
                onClick={() => setVista && setVista('Plantel Docente')}
                className="text-[#2f6bff] font-semibold cursor-pointer bg-transparent border-0 p-0"
              >
                Administrar todos los asesores
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="text-[13px] font-bold">Revisiones Semanales</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[20px] font-extrabold">{resumen.revisionesSemanalesTotal}</span>
              <Badge>{resumen.varSemanal}</Badge>
            </div>
            <div className="h-[130px] mt-2">
              <ResponsiveContainer>
                <BarChart data={semanalData} stackOffset="sign" barSize={5}>
                  <CartesianGrid vertical={false} stroke="#eef0f5" />
                  <XAxis dataKey="d" axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fill: '#8b92a5' }} />
                  <YAxis hide />
                  <Tooltip />
                  <ReferenceLine y={0} stroke="#e3e6ee" />
                  <Bar dataKey="ok" name="Aprobados" stackId="a" fill="#34c38f" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="obs" name="Observados" stackId="a" fill="#f78fa0" radius={[0, 0, 3, 3]} />
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
        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[1fr_1.05fr] sm:gap-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[13px] font-bold">Resumen de Módulos</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[20px] font-extrabold">{resumen.horasModuloTotal}</span>
                  <Badge>{resumen.varModulo}</Badge>
                </div>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-[#e3e6ee] text-[10px] font-semibold">
                {['Sem', 'Mes', 'Año', 'All'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPeriodoModulo(t)}
                    className={`px-2.5 py-1 cursor-pointer ${
                      periodoModulo === t ? 'bg-[#2f6bff] text-white' : 'bg-white text-[#6b7280]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[150px] mt-3">
              <ResponsiveContainer>
                <BarChart data={modulosData} barGap={2} barSize={4}>
                  <XAxis dataKey="m" axisLine={false} tickLine={false}
                    tick={{ fontSize: 8, fill: '#8b92a5' }} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="horas" name="Horas Registradas" fill="#1f2937" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="proy" name="Proyectos Activos" fill="#2f6bff" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[9px] text-[#6b7280] mt-1">
              <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#1f2937]" />Horas Registradas</span>
              <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#2f6bff]" />Proyectos Activos</span>
            </div>
            <div className="mt-3 grid grid-cols-2 border-t border-[#eceef3] pt-3 text-center sm:grid-cols-4">
              {totalesModulosData.map((item, idx) => {
                const v = Array.isArray(item) ? item[0] : item?.valor ?? 0
                const l = Array.isArray(item) ? item[1] : item?.etiqueta ?? ''
                return (
                  <div key={l || `tot-${idx}`}>
                    <div className="text-[11px] font-bold">{v}</div>
                    <div className="text-[8px] text-[#8b92a5]">{l}</div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-[13px] font-bold max-w-[110px] leading-snug">
                Últimas Actualizaciones de Prácticas
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <SearchBox
                  placeholder="Buscar ID..."
                  w="w-28"
                  value={buscarExpediente}
                  onChange={(e) => { setBuscarExpediente(e.target.value); setPagina(1) }}
                />
                <GhostBtn
                  icon={<SortIcon />}
                  onClick={() => setOrdenExp((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                >
                  Ordenar
                </GhostBtn>
                <GhostBtn icon={<FilterIcon />} onClick={alternarFiltroEstado}>
                  {filtroEstado || 'Filtrar'}
                </GhostBtn>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="text-[8px] uppercase tracking-wide text-[#8b92a5] bg-[#f7f8fb]">
                  {['ID Expediente', 'Fecha', 'Estudiante', 'Horas EFSRT', 'Estado', 'Acción'].map((h) => (
                    <th key={h} className="font-semibold py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaExpedientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[10px] text-[#8b92a5]">
                      No se encontraron expedientes en la base de datos.
                    </td>
                  </tr>
                ) : (
                  listaExpedientes.map((r, i) => (
                    <tr
                      key={`${r.id}-${i}`}
                      onClick={() => { setEstudiante && setEstudiante({ name: r.est, id: r.id }); setVista && setVista('Ficha Docente') }}
                      className="border-b border-[#f0f2f6] text-[10px] cursor-pointer hover:bg-[#f7f8fb]"
                    >
                      <td className="py-2.5 px-2 text-[#2f6bff] font-semibold">{r.id}</td>
                      <td className="px-2 text-[#6b7280]">{r.fecha}</td>
                      <td className="px-2 font-semibold">{r.est}</td>
                      <td className="px-2 text-[#2f6bff] font-semibold">{r.hrs}</td>
                      <td className="px-2">
                        <span className={`text-[9px] font-semibold rounded px-1.5 py-0.5 ${estadoStyle[r.estado] || 'bg-[#f3f4f6] text-[#374151]'}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-2 text-[#9aa1b2]">⋮</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            <div className="flex items-center justify-between mt-3 text-[9px] text-[#8b92a5]">
              <span>Mostrando {listaExpedientes.length} de {totalExpedientes} expedientes</span>
              <div className="flex gap-1">
                {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).slice(0, 3).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPagina(n)}
                    className={`w-5 h-5 rounded text-[9px] font-semibold cursor-pointer ${
                      paginaSegura === n ? 'bg-[#2f6bff] text-white' : 'border border-[#e3e6ee] text-[#374151]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Fila 4: todos los alumnos reales */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[13px] font-bold">
              Alumnos Registrados ({alumnosFiltrados.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              <GhostBtn icon={<SortIcon />} onClick={() => setOrdenAlumnoAsc((v) => !v)}>
                Ordenar
              </GhostBtn>
              <GhostBtn icon={<FilterIcon />} onClick={alternarFiltroAlumno}>
                {filtroRolAlumno || 'Filtrar'}
              </GhostBtn>
            </div>
          </div>
          <div className="mt-3 grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {alumnosFiltrados.length === 0 ? (
              <div className="col-span-full py-6 text-center text-[10px] text-[#8b92a5]">
                No hay alumnos registrados en la base de datos.
              </div>
            ) : (
              alumnosFiltrados.map((a, idx) => (
                <div
                  key={a.id ?? `alu-${idx}`}
                  onClick={() => { setEstudiante && setEstudiante(a); setVista && setVista('Ficha Docente') }}
                  className="border border-[#eceef3] rounded-xl p-2 text-center cursor-pointer hover:shadow-md transition-shadow"
                >
                  <img src={a.img} alt={a.name || 'Alumno'} className="w-full h-[90px] object-cover rounded-lg" />
                  <div className={`text-[8px] font-bold tracking-wider mt-2 ${a.color}`}>{a.tag}</div>
                  <div className="text-[11px] font-bold mt-0.5">{a.name}</div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

      {/* Modal: Asignar Asesor */}
      {modalAsignar && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
          <form onSubmit={asignarAsesor} className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3 shadow-xl">
            <h3 className="text-[15px] font-bold">Asignar Docente Asesor</h3>
            <div>
              <label className="text-[11px] text-[#6b7280] block mb-1">Nombre del Docente</label>
              <input
                required
                value={formAsignar.docente}
                onChange={(e) => setFormAsignar({ ...formAsignar, docente: e.target.value })}
                className="w-full border border-[#e3e6ee] rounded-lg px-3 py-2 text-[12px] outline-none"
                placeholder="Ej. Ing. Carlos Mendoza"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#6b7280] block mb-1">Cargo / Módulo asignado</label>
              <select
                value={formAsignar.modulo}
                onChange={(e) => setFormAsignar({ ...formAsignar, modulo: e.target.value })}
                className="w-full border border-[#e3e6ee] rounded-lg px-3 py-2 text-[12px] outline-none"
              >
                <option>Asesor Módulo I</option>
                <option>Asesor Módulo II</option>
                <option>Asesor Módulo III</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <GhostBtn onClick={() => setModalAsignar(false)}>Cancelar</GhostBtn>
              <button
                type="submit"
                disabled={guardando}
                className="bg-[#2f6bff] text-white rounded-lg px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer"
              >
                {guardando ? 'Asignando...' : 'Guardar Asignación'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}