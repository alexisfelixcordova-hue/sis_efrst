import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

/* ───────── Caché de "semilla" ───────── */
const cacheExacta = new Map();
const cacheBase = new Map();

const normalizarRuta = (url = '') => {
    const sinBase = String(url).replace(/^https?:\/\/[^/]+\/api/, '');
    return sinBase.split('?')[0];
};

const claveExacta = (url, params) => {
    const ruta = normalizarRuta(url);
    const cleanParams = params && typeof params === 'object' ? params : {};
    return `${ruta}::${JSON.stringify(cleanParams)}`;
};

export function getCachedData(url, params = {}) {
    const ruta = normalizarRuta(url);
    return (
        cacheExacta.get(claveExacta(ruta, params)) ??
        cacheBase.get(ruta) ??
        null
    );
}

export function setCachedData(url, params = {}, data) {
    const ruta = normalizarRuta(url);
    cacheExacta.set(claveExacta(ruta, params), data);
    cacheBase.set(ruta, data);
}

/* ───────── Caché rápida con tiempo de vida + peticiones sin duplicar ───────── */
const frescos = new Map();
const enVuelo = new Map();

const TTL_POR_RUTA = [
    ['/modulos-profesionales', 5 * 60 * 1000],
    ['/empresas', 2 * 60 * 1000],
    ['/docentes', 2 * 60 * 1000],
    ['/estudiantes', 30 * 1000],
];
const TTL_DEFECTO = 15 * 1000;

const ttlDe = (ruta) => {
    const r = TTL_POR_RUTA.find(([prefijo]) => ruta.startsWith(prefijo));
    return r ? r[1] : TTL_DEFECTO;
};

const tokenActual = () =>
    localStorage.getItem('token') || localStorage.getItem('access_token') || '';

export function clearApiCache() {
    cacheExacta.clear();
    cacheBase.clear();
    frescos.clear();
    enVuelo.clear();
}

const adaptadorBase =
    typeof axios.getAdapter === 'function'
        ? axios.getAdapter(api.defaults.adapter)
        : api.defaults.adapter;

api.defaults.adapter = (config) => {
    const metodo = (config.method || 'get').toLowerCase();
    if (metodo !== 'get' || config.sinCache) return adaptadorBase(config);

    const ruta = normalizarRuta(config.url);
    const urlCompleta = String(config.url || '').replace(
        /^https?:\/\/[^/]+\/api/,
        ''
    );
    const clave = `${tokenActual()}::${urlCompleta}::${JSON.stringify(
        config.params && typeof config.params === 'object' ? config.params : {}
    )}`;

    const guardado = frescos.get(clave);
    if (guardado && Date.now() - guardado.t < guardado.ttl) {
        return Promise.resolve({ ...guardado.respuesta, config });
    }

    if (enVuelo.has(clave)) {
        return enVuelo.get(clave).then((r) => ({ ...r, config }));
    }

    const promesa = adaptadorBase(config)
        .then((respuesta) => {
            frescos.set(clave, { t: Date.now(), ttl: ttlDe(ruta), respuesta });
            return respuesta;
        })
        .finally(() => enVuelo.delete(clave));

    enVuelo.set(clave, promesa);
    return promesa;
};

/* ───────── Interceptores ───────── */
api.interceptors.request.use(
    (config) => {
        const token = tokenActual();
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
            clearApiCache();
        }

        return response;
    },
    (error) => {
        if (error?.response?.status === 401) clearApiCache();
        return Promise.reject(error);
    }
);

/* ───────── Precarga: llamar una vez tras iniciar sesión ───────── */
export function precargarDatosBase() {
    return Promise.allSettled([
        api.get('/docentes', { params: { per_page: 500, todos: 1 } }),
        api.get('/estudiantes', { params: { all: true, per_page: 1000, todos: 1 } }),
        api.get('/modulos-profesionales'),
        api.get('/empresas', { params: { per_page: 500, todos: 1 } }),
    ]);
}

export default api;