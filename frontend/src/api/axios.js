import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

const datosCacheados = new Map();
const respuestasFrescas = new Map();
const peticionesEnCurso = new Map();

const TTL_POR_RUTA = [
    ['/dashboard/resumen', 30 * 1000],
    ['/modulos-profesionales', 30 * 60 * 1000],
    ['/estudiantes', 10 * 60 * 1000],
    ['/docentes', 10 * 60 * 1000],
    ['/empresas', 10 * 60 * 1000],
    ['/expedientes', 5 * 60 * 1000],
    ['/constancias', 5 * 60 * 1000],
    ['/mis-alumnos', 5 * 60 * 1000],
    ['/reportes', 5 * 60 * 1000],
];
const TTL_DEFECTO = 5 * 60 * 1000;

const obtenerToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    '';

const normalizarRuta = (url = '') => {
    const ruta = String(url)
        .replace(/^https?:\/\/[^/]+\/api/, '')
        .split('?')[0];
    return ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta;
};

const ordenarParametros = (valor) => {
    if (Array.isArray(valor)) return valor.map(ordenarParametros);
    if (valor === null || valor === undefined) return '';
    if (typeof valor !== 'object') return String(valor);
    return Object.keys(valor)
        .sort()
        .reduce((resultado, clave) => {
            resultado[clave] = ordenarParametros(valor[clave]);
            return resultado;
        }, {});
};

const serializarParametros = (params = {}) =>
    JSON.stringify(ordenarParametros(params && typeof params === 'object' ? params : {}));

const parametrosDeUrl = (url, params = {}) => {
    const query = String(url).split('?')[1]?.split('#')[0] || '';
    const combinados = {};
    new URLSearchParams(query).forEach((valor, clave) => {
        combinados[clave] = valor;
    });
    const todos = { ...combinados, ...(params && typeof params === 'object' ? params : {}) };
    const ruta = normalizarRuta(url);

    if (ruta === '/docentes' || ruta === '/empresas') return {};
    if (ruta === '/mis-alumnos') {
        delete todos.per_page;
        delete todos.limit;
        delete todos.todos;
        delete todos.all;
    }
    if (
        ruta === '/estudiantes' &&
        (todos.all === true || todos.all === 'true' || todos.todos === 1 ||
            todos.todos === '1' || Number(todos.per_page) >= 500)
    ) {
        return { all: 'true', search: String(todos.search || '') };
    }
    return todos;
};

const claveDeRuta = (ruta, params = {}) =>
    `${obtenerToken()}::${normalizarRuta(ruta)}::${serializarParametros(parametrosDeUrl(ruta, params))}`;

export function getCachedData(url, params = {}) {
    const ruta = normalizarRuta(url);
    const exacto = datosCacheados.get(claveDeRuta(ruta, params));
    if (exacto) return exacto.data;
    return datosCacheados.get(claveDeRuta(ruta))?.data ?? null;
}

export function setCachedData(url, params = {}, data) {
    const ruta = normalizarRuta(url);
    const entrada = { ruta, data };
    datosCacheados.set(claveDeRuta(ruta, params), entrada);
    datosCacheados.set(claveDeRuta(ruta), entrada);
}

const ttlDe = (ruta) => {
    const regla = TTL_POR_RUTA.find(([prefijo]) => ruta.startsWith(prefijo));
    return regla ? regla[1] : TTL_DEFECTO;
};

export function clearApiCache() {
    datosCacheados.clear();
    respuestasFrescas.clear();
    peticionesEnCurso.clear();
}

const RUTAS_RELACIONADAS = {
    estudiantes: ['/estudiantes', '/expedientes', '/constancias', '/reportes', '/mis-alumnos', '/dashboard/resumen'],
    docentes: ['/docentes', '/estudiantes', '/expedientes', '/mis-alumnos', '/reportes', '/dashboard/resumen'],
    empresas: ['/empresas'],
    'modulos-profesionales': ['/modulos-profesionales', '/expedientes', '/reportes', '/dashboard/resumen'],
    expedientes: ['/expedientes', '/constancias', '/constancias-efsrt', '/reportes', '/mis-alumnos', '/dashboard/resumen'],
    evidencias: ['/evidencias', '/expedientes', '/constancias', '/reportes', '/dashboard/resumen'],
    'evidencias-efsrt': ['/evidencias', '/expedientes', '/constancias', '/reportes', '/dashboard/resumen'],
    efsrt: ['/efsrt', '/calificaciones-efsrt', '/calificaciones', '/evaluaciones-efsrt', '/estudiantes', '/expedientes', '/mis-alumnos', '/dashboard/resumen'],
    'calificaciones-efsrt': ['/efsrt', '/calificaciones-efsrt', '/calificaciones', '/evaluaciones-efsrt', '/estudiantes', '/expedientes', '/mis-alumnos', '/dashboard/resumen'],
    calificaciones: ['/efsrt', '/calificaciones-efsrt', '/calificaciones', '/evaluaciones-efsrt', '/estudiantes', '/expedientes', '/mis-alumnos', '/dashboard/resumen'],
    'evaluaciones-efsrt': ['/efsrt', '/calificaciones-efsrt', '/calificaciones', '/evaluaciones-efsrt', '/estudiantes', '/expedientes', '/mis-alumnos', '/dashboard/resumen'],
    constancias: ['/constancias', '/expedientes', '/reportes', '/dashboard/resumen'],
    'constancias-efsrt': ['/constancias', '/expedientes', '/reportes', '/dashboard/resumen'],
    'asignaciones-asesores': ['/asignaciones-asesores', '/docentes', '/mis-alumnos', '/expedientes', '/reportes', '/dashboard/resumen'],
    'mis-alumnos': ['/mis-alumnos', '/dashboard/resumen'],
    calendario: ['/calendario'],
    usuarios: ['/usuarios', '/docentes', '/dashboard/resumen'],
    perfil: ['/perfil', '/auth/me', '/user'],
    notificaciones: ['/notificaciones', '/notificaciones/preferencias'],
};

const coincideRuta = (ruta, prefijo) =>
    ruta === prefijo || ruta.startsWith(`${prefijo}/`);

export function invalidateApiCache(url) {
    const ruta = normalizarRuta(url);
    const recurso = ruta.split('/').filter(Boolean)[0];
    const afectadas = RUTAS_RELACIONADAS[recurso] || [ruta];
    const coincide = (candidata) =>
        afectadas.some((prefijo) => coincideRuta(candidata, prefijo));

    for (const [clave, entrada] of datosCacheados) {
        if (coincide(entrada.ruta)) datosCacheados.delete(clave);
    }
    for (const [clave, entrada] of respuestasFrescas) {
        if (coincide(entrada.ruta)) respuestasFrescas.delete(clave);
    }
    for (const [clave, entrada] of peticionesEnCurso) {
        if (coincide(entrada.ruta)) peticionesEnCurso.delete(clave);
    }
}

const adaptadorBase =
    typeof axios.getAdapter === 'function'
        ? axios.getAdapter(api.defaults.adapter)
        : api.defaults.adapter;

api.defaults.adapter = (config) => {
    const metodo = (config.method || 'get').toLowerCase();
    if (metodo !== 'get' || config.sinCache) return adaptadorBase(config);

    const ruta = normalizarRuta(config.url);
    const clave = claveDeRuta(config.url, config.params);
    const guardado = respuestasFrescas.get(clave);

    if (guardado && Date.now() - guardado.timestamp < guardado.ttl) {
        return Promise.resolve({ ...guardado.respuesta, config });
    }

    const enCurso = peticionesEnCurso.get(clave);
    if (enCurso) return enCurso.promise.then((respuesta) => ({ ...respuesta, config }));

    const promise = adaptadorBase(config)
        .then((respuesta) => {
            respuestasFrescas.set(clave, {
                ruta,
                timestamp: Date.now(),
                ttl: ttlDe(ruta),
                respuesta,
            });
            return respuesta;
        })
        .finally(() => peticionesEnCurso.delete(clave));

    peticionesEnCurso.set(clave, { ruta, promise });
    return promise;
};

api.interceptors.request.use(
    (config) => {
        const token = obtenerToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        const metodo = (response.config.method || 'get').toLowerCase();

        if (metodo === 'get') {
            setCachedData(
                response.config.url,
                response.config.params,
                response.data
            );
        } else {
            invalidateApiCache(response.config.url);
        }

        return response;
    },
    (error) => {
        if (error?.response?.status === 401) clearApiCache();
        return Promise.reject(error);
    }
);

const esAdministrador = (usuario) =>
    Number(usuario?.id_rol ?? usuario?.rol_id) === 1 ||
    /admin/i.test(String(usuario?.rol_nombre ?? usuario?.rol ?? usuario?.role ?? ''));

export async function precargarDatosBase(usuario) {
    const administrador = esAdministrador(usuario);
    const criticas = administrador
        ? [
            ['/reportes/estadisticas', () => api.get('/reportes/estadisticas', { params: { periodo: 'Sem' } })],
            ['/docentes', () => api.get('/docentes', { params: { all: true } })],
            ['/estudiantes', () => api.get('/estudiantes', { params: { all: true } })],
            ['/constancias-efsrt', () => api.get('/constancias-efsrt')],
        ]
        : [
            ['/mis-alumnos', () => api.get('/mis-alumnos')],
            ['/proyectos', () => api.get('/proyectos')],
        ];
    const secundarias = administrador
        ? [
            ['/modulos-profesionales', () => api.get('/modulos-profesionales')],
            ['/empresas', () => api.get('/empresas')],
            ['/calendario', () => api.get('/calendario')],
            ['/notificaciones/preferencias', () => api.get('/notificaciones/preferencias')],
            ['/reportes/estadisticas', () => api.get('/reportes/estadisticas', { params: { anio: new Date().getFullYear() } })],
            ['/usuarios', () => api.get('/usuarios')],
        ]
        : [
            ['/modulos-profesionales', () => api.get('/modulos-profesionales')],
            ['/calendario', () => api.get('/calendario')],
            ['/notificaciones/preferencias', () => api.get('/notificaciones/preferencias')],
        ];

    const registrarErrores = (solicitudes, resultados) => {
        resultados.forEach((resultado, indice) => {
            if (resultado.status === 'rejected') {
                console.error(`No se pudo precargar ${solicitudes[indice][0]}:`, resultado.reason);
            }
        });
    };

    const resultados = await Promise.allSettled(criticas.map(([, solicitar]) => solicitar()));
    registrarErrores(criticas, resultados);

    void Promise.allSettled(secundarias.map(([, solicitar]) => solicitar()))
        .then((respuestas) => registrarErrores(secundarias, respuestas));

    return resultados;
}

export default api;
