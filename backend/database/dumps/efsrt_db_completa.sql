--
-- PostgreSQL database dump
--

\restrict uLxuvK5MPw1UUydVuQnr7CzGhiGLoLRBJYgT24R3UTd3qfnJNGOd0zpfFPwGtEY

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS fk_usuario_rol;
ALTER TABLE IF EXISTS ONLY public.evidencias_efsrt DROP CONSTRAINT IF EXISTS fk_evidencia_expediente;
ALTER TABLE IF EXISTS ONLY public.expediente_efsrt DROP CONSTRAINT IF EXISTS fk_efsrt_modulo;
ALTER TABLE IF EXISTS ONLY public.expediente_efsrt DROP CONSTRAINT IF EXISTS fk_efsrt_estudiante;
ALTER TABLE IF EXISTS ONLY public.expediente_efsrt DROP CONSTRAINT IF EXISTS fk_efsrt_empresa;
ALTER TABLE IF EXISTS ONLY public.expediente_efsrt DROP CONSTRAINT IF EXISTS fk_efsrt_docente;
ALTER TABLE IF EXISTS ONLY public.constancias_emitidas DROP CONSTRAINT IF EXISTS fk_constancia_modulo;
ALTER TABLE IF EXISTS ONLY public.constancias_emitidas DROP CONSTRAINT IF EXISTS fk_constancia_estudiante;
ALTER TABLE IF EXISTS ONLY public.constancias_emitidas DROP CONSTRAINT IF EXISTS fk_constancia_admin;
ALTER TABLE IF EXISTS ONLY public.asignacion_asesores DROP CONSTRAINT IF EXISTS fk_asig_modulo;
ALTER TABLE IF EXISTS ONLY public.asignacion_asesores DROP CONSTRAINT IF EXISTS fk_asig_estudiante;
ALTER TABLE IF EXISTS ONLY public.asignacion_asesores DROP CONSTRAINT IF EXISTS fk_asig_docente;
ALTER TABLE IF EXISTS ONLY public.docentes DROP CONSTRAINT IF EXISTS docentes_id_usuario_fkey;
DROP INDEX IF EXISTS public.sessions_user_id_index;
DROP INDEX IF EXISTS public.sessions_last_activity_index;
DROP INDEX IF EXISTS public.personal_access_tokens_tokenable_type_tokenable_id_index;
DROP INDEX IF EXISTS public.personal_access_tokens_expires_at_index;
DROP INDEX IF EXISTS public.jobs_queue_index;
DROP INDEX IF EXISTS public.idx_usuarios_rol;
DROP INDEX IF EXISTS public.idx_expediente_modulo;
DROP INDEX IF EXISTS public.idx_expediente_estudiante;
DROP INDEX IF EXISTS public.idx_expediente_estado;
DROP INDEX IF EXISTS public.idx_expediente_empresa;
DROP INDEX IF EXISTS public.idx_expediente_docente;
DROP INDEX IF EXISTS public.idx_evidencias_expediente;
DROP INDEX IF EXISTS public.idx_estudiantes_dni_apellidos;
DROP INDEX IF EXISTS public.idx_constancias_estudiante;
DROP INDEX IF EXISTS public.idx_asignacion_estudiante;
DROP INDEX IF EXISTS public.idx_asignacion_docente;
DROP INDEX IF EXISTS public.failed_jobs_connection_queue_failed_at_index;
DROP INDEX IF EXISTS public.cache_locks_expiration_index;
DROP INDEX IF EXISTS public.cache_expiration_index;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_dni_key;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_correo_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.asignacion_asesores DROP CONSTRAINT IF EXISTS uq_estudiante_modulo_periodo;
ALTER TABLE IF EXISTS ONLY public.expediente_efsrt DROP CONSTRAINT IF EXISTS uq_estudiante_modulo_efsrt;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_nombre_rol_key;
ALTER TABLE IF EXISTS ONLY public.personal_access_tokens DROP CONSTRAINT IF EXISTS personal_access_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.personal_access_tokens DROP CONSTRAINT IF EXISTS personal_access_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.modulos_profesionales DROP CONSTRAINT IF EXISTS modulos_profesionales_pkey;
ALTER TABLE IF EXISTS ONLY public.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.job_batches DROP CONSTRAINT IF EXISTS job_batches_pkey;
ALTER TABLE IF EXISTS ONLY public.failed_jobs DROP CONSTRAINT IF EXISTS failed_jobs_uuid_unique;
ALTER TABLE IF EXISTS ONLY public.failed_jobs DROP CONSTRAINT IF EXISTS failed_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.expediente_efsrt DROP CONSTRAINT IF EXISTS expediente_efsrt_pkey;
ALTER TABLE IF EXISTS ONLY public.evidencias_efsrt DROP CONSTRAINT IF EXISTS evidencias_efsrt_pkey;
ALTER TABLE IF EXISTS ONLY public.estudiantes DROP CONSTRAINT IF EXISTS estudiantes_pkey;
ALTER TABLE IF EXISTS ONLY public.estudiantes DROP CONSTRAINT IF EXISTS estudiantes_dni_key;
ALTER TABLE IF EXISTS ONLY public.empresas_convenio DROP CONSTRAINT IF EXISTS empresas_convenio_ruc_key;
ALTER TABLE IF EXISTS ONLY public.empresas_convenio DROP CONSTRAINT IF EXISTS empresas_convenio_pkey;
ALTER TABLE IF EXISTS ONLY public.docentes DROP CONSTRAINT IF EXISTS docentes_pkey;
ALTER TABLE IF EXISTS ONLY public.docentes DROP CONSTRAINT IF EXISTS docentes_id_usuario_key;
ALTER TABLE IF EXISTS ONLY public.docentes DROP CONSTRAINT IF EXISTS docentes_codigo_key;
ALTER TABLE IF EXISTS ONLY public.constancias_emitidas DROP CONSTRAINT IF EXISTS constancias_emitidas_pkey;
ALTER TABLE IF EXISTS ONLY public.constancias_emitidas DROP CONSTRAINT IF EXISTS constancias_emitidas_codigo_documento_key;
ALTER TABLE IF EXISTS ONLY public.cache DROP CONSTRAINT IF EXISTS cache_pkey;
ALTER TABLE IF EXISTS ONLY public.cache_locks DROP CONSTRAINT IF EXISTS cache_locks_pkey;
ALTER TABLE IF EXISTS ONLY public.asignacion_asesores DROP CONSTRAINT IF EXISTS asignacion_asesores_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.personal_access_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.jobs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.failed_jobs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.docentes ALTER COLUMN id_docente DROP DEFAULT;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.personal_access_tokens_id_seq;
DROP TABLE IF EXISTS public.personal_access_tokens;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.modulos_profesionales;
DROP SEQUENCE IF EXISTS public.migrations_id_seq;
DROP TABLE IF EXISTS public.migrations;
DROP SEQUENCE IF EXISTS public.jobs_id_seq;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.job_batches;
DROP SEQUENCE IF EXISTS public.failed_jobs_id_seq;
DROP TABLE IF EXISTS public.failed_jobs;
DROP TABLE IF EXISTS public.expediente_efsrt;
DROP TABLE IF EXISTS public.evidencias_efsrt;
DROP TABLE IF EXISTS public.estudiantes;
DROP TABLE IF EXISTS public.empresas_convenio;
DROP SEQUENCE IF EXISTS public.docentes_id_docente_seq;
DROP TABLE IF EXISTS public.docentes;
DROP TABLE IF EXISTS public.constancias_emitidas;
DROP TABLE IF EXISTS public.cache_locks;
DROP TABLE IF EXISTS public.cache;
DROP TABLE IF EXISTS public.asignacion_asesores;
DROP EXTENSION IF EXISTS pgcrypto;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asignacion_asesores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asignacion_asesores (
    id_asignacion bigint NOT NULL,
    id_docente bigint NOT NULL,
    id_estudiante bigint NOT NULL,
    id_modulo bigint NOT NULL,
    periodo_academico character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.asignacion_asesores OWNER TO postgres;

--
-- Name: asignacion_asesores_id_asignacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.asignacion_asesores ALTER COLUMN id_asignacion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.asignacion_asesores_id_asignacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache OWNER TO postgres;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO postgres;

--
-- Name: constancias_emitidas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.constancias_emitidas (
    id_constancia bigint NOT NULL,
    id_estudiante bigint NOT NULL,
    id_modulo bigint NOT NULL,
    id_administrador bigint NOT NULL,
    codigo_documento character varying(50) NOT NULL,
    tipo_emision character varying(20) DEFAULT 'Original'::character varying,
    fecha_emision timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ruta_archivo_pdf character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT constancias_emitidas_tipo_emision_check CHECK (((tipo_emision)::text = ANY (ARRAY[('Original'::character varying)::text, ('Duplicado'::character varying)::text])))
);


ALTER TABLE public.constancias_emitidas OWNER TO postgres;

--
-- Name: constancias_emitidas_id_constancia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.constancias_emitidas ALTER COLUMN id_constancia ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.constancias_emitidas_id_constancia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: docentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.docentes (
    id_docente bigint NOT NULL,
    id_usuario bigint NOT NULL,
    codigo character varying(20) NOT NULL,
    departamento character varying(100),
    grado character varying(150),
    especialidad character varying(150),
    condicion character varying(100),
    telefono character varying(20),
    capacidad smallint DEFAULT 12 NOT NULL,
    sede character varying(100),
    biografia text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.docentes OWNER TO postgres;

--
-- Name: docentes_id_docente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.docentes_id_docente_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.docentes_id_docente_seq OWNER TO postgres;

--
-- Name: docentes_id_docente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.docentes_id_docente_seq OWNED BY public.docentes.id_docente;


--
-- Name: empresas_convenio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresas_convenio (
    id_empresa bigint NOT NULL,
    ruc character varying(20) NOT NULL,
    razon_social character varying(150) NOT NULL,
    supervisor_empresa_nombre character varying(150),
    supervisor_empresa_cargo character varying(100),
    estado_convenio character varying(20) DEFAULT 'Activo'::character varying,
    documento_convenio_ruta character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT empresas_convenio_estado_convenio_check CHECK (((estado_convenio)::text = ANY (ARRAY[('Activo'::character varying)::text, ('Vencido'::character varying)::text, ('Suspendido'::character varying)::text])))
);


ALTER TABLE public.empresas_convenio OWNER TO postgres;

--
-- Name: empresas_convenio_id_empresa_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.empresas_convenio ALTER COLUMN id_empresa ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.empresas_convenio_id_empresa_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: estudiantes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estudiantes (
    id_estudiante bigint NOT NULL,
    dni character varying(15) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    programa_estudios character varying(100) DEFAULT 'Diseño y Programación Web'::character varying,
    semestre character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    correo character varying(100),
    telefono character varying(20),
    direccion character varying(150),
    estado character varying(50) DEFAULT 'Al día'::character varying
);


ALTER TABLE public.estudiantes OWNER TO postgres;

--
-- Name: estudiantes_id_estudiante_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.estudiantes ALTER COLUMN id_estudiante ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.estudiantes_id_estudiante_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: evidencias_efsrt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evidencias_efsrt (
    id_evidencia bigint NOT NULL,
    id_expediente bigint NOT NULL,
    tipo_evidencia character varying(50) NOT NULL,
    titulo_evidencia character varying(150) NOT NULL,
    ruta_archivo_o_url character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evidencias_efsrt_tipo_evidencia_check CHECK (((tipo_evidencia)::text = ANY (ARRAY[('Ficha Asistencia'::character varying)::text, ('Informe Semanal'::character varying)::text, ('Evaluación Empresa'::character varying)::text, ('Enlace Repositorio Web'::character varying)::text])))
);


ALTER TABLE public.evidencias_efsrt OWNER TO postgres;

--
-- Name: evidencias_efsrt_id_evidencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.evidencias_efsrt ALTER COLUMN id_evidencia ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.evidencias_efsrt_id_evidencia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: expediente_efsrt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expediente_efsrt (
    id_expediente bigint NOT NULL,
    id_estudiante bigint NOT NULL,
    id_modulo bigint NOT NULL,
    id_empresa bigint NOT NULL,
    id_docente_asesor bigint NOT NULL,
    horas_acumuladas integer DEFAULT 0,
    estado_efsrt character varying(30) DEFAULT 'No efectuó'::character varying,
    portafolio_fisico_revisado boolean DEFAULT false,
    observaciones text,
    fecha_validacion timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expediente_efsrt_estado_efsrt_check CHECK (((estado_efsrt)::text = ANY (ARRAY[('No efectuó'::character varying)::text, ('Por verificar'::character varying)::text, ('Validado'::character varying)::text]))),
    CONSTRAINT expediente_efsrt_horas_acumuladas_check CHECK ((horas_acumuladas >= 0))
);


ALTER TABLE public.expediente_efsrt OWNER TO postgres;

--
-- Name: expediente_efsrt_id_expediente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.expediente_efsrt ALTER COLUMN id_expediente ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.expediente_efsrt_id_expediente_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.failed_jobs_id_seq OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: modulos_profesionales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modulos_profesionales (
    id_modulo bigint NOT NULL,
    numero_modulo integer NOT NULL,
    nombre_modulo character varying(150) NOT NULL,
    horas_requeridas integer DEFAULT 160 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT modulos_profesionales_horas_requeridas_check CHECK ((horas_requeridas > 0)),
    CONSTRAINT modulos_profesionales_numero_modulo_check CHECK (((numero_modulo >= 1) AND (numero_modulo <= 3)))
);


ALTER TABLE public.modulos_profesionales OWNER TO postgres;

--
-- Name: modulos_profesionales_id_modulo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.modulos_profesionales ALTER COLUMN id_modulo ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.modulos_profesionales_id_modulo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol bigint NOT NULL,
    nombre_rol character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ALTER COLUMN id_rol ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_rol_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario bigint NOT NULL,
    dni character varying(15) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    correo character varying(150) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    estado_cuenta character varying(20) DEFAULT 'Activo'::character varying,
    id_rol bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_estado_cuenta_check CHECK (((estado_cuenta)::text = ANY (ARRAY[('Activo'::character varying)::text, ('Suspendido'::character varying)::text, ('Inactivo'::character varying)::text])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usuarios ALTER COLUMN id_usuario ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: docentes id_docente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes ALTER COLUMN id_docente SET DEFAULT nextval('public.docentes_id_docente_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: asignacion_asesores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) FROM stdin;
1	2	1	2	2026-I	2026-10-29 15:23:20.25242-05
3	2	3	1	2026-I	2026-10-29 15:23:20.25242-05
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache (key, value, expiration) FROM stdin;
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: constancias_emitidas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.constancias_emitidas (id_constancia, id_estudiante, id_modulo, id_administrador, codigo_documento, tipo_emision, fecha_emision, ruta_archivo_pdf, created_at) FROM stdin;
1	1	2	1	CONST-EFSRT-2026-001	Original	2026-06-21 16:00:00-05	storage/constancias/constancia_72345678_mod2.pdf	2026-10-29 15:23:20.25242-05
\.


--
-- Data for Name: docentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.docentes (id_docente, id_usuario, codigo, departamento, grado, especialidad, condicion, telefono, capacidad, sede, biografia, created_at, updated_at) FROM stdin;
3	2	DOC-2026-002	Computación e Informática	Ingeniero de Sistemas	Desarrollo Web y Bases de Datos	\N	+51 900 000 000	12	Campus Central – Sede Lima	\N	2026-11-08 19:23:04.765096	2026-11-08 19:23:04.765096
\.


--
-- Data for Name: empresas_convenio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empresas_convenio (id_empresa, ruc, razon_social, supervisor_empresa_nombre, supervisor_empresa_cargo, estado_convenio, documento_convenio_ruta, created_at, updated_at) FROM stdin;
2	20666987652	Soluciones Digitales Centro E.I.R.L.	Ana María Poma	Gerente de Proyectos Web	Activo	storage/convenios/convenio_soluciones.pdf	2026-10-29 15:23:20.25242-05	2026-10-29 15:23:20.25242-05
4	12345678910	Soluciones Informáticas Andinas S.A.C.xdxd	Carlos Mendoza	Líder Técnico	Activo	storage/convenios/convenio_prueba.pdf	2026-11-04 20:41:52-05	2026-11-04 20:41:52-05
1	20555123451	Software Center Huancayo S.A.C.	Elmas Capito	Líder Técnico / CTO	Suspendido	storage/convenios/convenio_sw_center.pdf	2026-10-29 15:23:20.25242-05	2026-11-04 21:00:41-05
\.


--
-- Data for Name: estudiantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado) FROM stdin;
3	74567890	Diego Alonso	Rojas Quispe	Diseño y Programación Web	IV Semestre	2026-10-29 15:23:20.25242-05	2026-10-29 15:23:20.25242-05	diego.rojas@iesteacd.edu.pe	987654321	San Agustín de Cajas, Huancayo	Al día
4	72345677	Carlos Alberto	Pérez Gómez	Diseño y Programación Web	VI Semestre	2026-11-04 21:48:31-05	2026-11-04 21:48:31-05	estudiante@iesteacd.edu.pe	987654321	San Agustín de Cajas, Huancayo	Al día
1	72345678	Carlos Alberto Actualizado	Pérez Gómez	Diseño y Programación Web	II Semestre	2026-10-29 15:23:20.25242-05	2026-11-04 21:59:47-05	carlos.perez@iesteacd.edu.pe	987654321	San Agustín de Cajas, Huancayo	Al día
\.


--
-- Data for Name: evidencias_efsrt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evidencias_efsrt (id_evidencia, id_expediente, tipo_evidencia, titulo_evidencia, ruta_archivo_o_url, created_at) FROM stdin;
2	1	Informe Semanal	Informe Final de Prácticas - API REST con Spring Boot	storage/evidencias/exp_1_informe.pdf	2026-10-29 15:23:20.25242-05
3	1	Enlace Repositorio Web	Repositorio GitHub - Sistema Web Comercial	https://github.com/kevin-huaman/efsrt-proyecto-web	2026-10-29 15:23:20.25242-05
5	1	Enlace Repositorio Web	Repositorio del Proyecto Final	https://github.com/usuario/proyecto-efsrt	2026-11-06 21:05:10-05
\.


--
-- Data for Name: expediente_efsrt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expediente_efsrt (id_expediente, id_estudiante, id_modulo, id_empresa, id_docente_asesor, horas_acumuladas, estado_efsrt, portafolio_fisico_revisado, observaciones, fecha_validacion, created_at, updated_at) FROM stdin;
3	3	1	1	2	0	No efectuó	f	Pendiente de inicio de actividades prácticas en la empresa asignada.	\N	2026-10-29 15:23:20.25242-05	2026-10-29 15:23:20.25242-05
1	1	2	1	2	120	Validado	t	Documentación completa y conforme según los requisitos del módulo.	2026-10-29 23:03:43-05	2026-10-29 15:23:20.25242-05	2026-10-29 23:03:43-05
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_10_29_212200_create_personal_access_tokens_table	2
5	2026_11_09_000942_create_docentes_table	3
\.


--
-- Data for Name: modulos_profesionales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modulos_profesionales (id_modulo, numero_modulo, nombre_modulo, horas_requeridas, created_at) FROM stdin;
1	1	Diseño web y herramientas multimedia	160	2026-10-29 15:18:18.607448-05
3	3	Integracion de Palicaciones web y moviles	160	2026-10-29 15:18:18.607448-05
2	2	Integracion de Aplicaciones Web y Moviles	160	2026-10-29 15:18:18.607448-05
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
1	App\\Models\\User	3	efsrt_auth_token	17718e07b5f5238c09a3a6db766cb1e577662f146dba7a114659392346809f5b	["*"]	2026-11-05 22:56:44	\N	2026-11-05 22:56:34	2026-11-05 22:56:44
2	App\\Models\\User	3	efsrt_auth_token	a55e8688be4360fc746e6b410e0e659de2fe2bcd819acc5eb0d5c331af093368	["*"]	\N	\N	2026-11-05 22:56:46	2026-11-05 22:56:46
4	App\\Models\\User	3	efsrt_auth_token	32b04ff28ad6925c56571d2a69a4d4c0920d8a4602a79091459816a40d3807ee	["*"]	2026-11-06 21:25:29	\N	2026-11-05 23:00:29	2026-11-06 21:25:29
5	App\\Models\\User	3	efsrt_auth_token	73d02e46e06ed952267d3401425ccb23163737766881924578a4f536b6faf9f0	["*"]	\N	\N	2026-11-06 22:20:36	2026-11-06 22:20:36
6	App\\Models\\User	3	efsrt_auth_token	e1ca2f44d8d60a7c6ae085e50d4aa9465e3aedac7f237c65f11690dee7794b15	["*"]	\N	\N	2026-11-06 22:21:57	2026-11-06 22:21:57
7	App\\Models\\User	3	efsrt_auth_token	3fceb85ffc18866dae421ce61627f206270d1b4edb70b211ce78c47e9da894e3	["*"]	\N	\N	2026-11-06 22:36:35	2026-11-06 22:36:35
3	App\\Models\\User	3	efsrt_auth_token	2462ea67177c7325ceb71a462b3387571f4d5ac7e07c51dca4d5a61df63a06fd	["*"]	2026-11-05 22:59:52	\N	2026-11-05 22:56:58	2026-11-05 22:59:52
9	App\\Models\\User	3	efsrt_auth_token	9ecb3b91d3d4b9e9e8e5673378bec92887ced8a2ee298e0b6a43b036c2a557ff	["*"]	2026-11-06 22:56:10	\N	2026-11-06 22:56:09	2026-11-06 22:56:10
8	App\\Models\\User	3	efsrt_auth_token	159aef749b865f75e0935ed7fd7756d623ffec7c911f21f9833df515005e6b16	["*"]	2026-11-06 23:06:43	\N	2026-11-06 22:53:26	2026-11-06 23:06:43
56	App\\Models\\User	14	efsrt_auth_token	3d7069e504d7bbd9d6aa513ccc45a83ef90071dac3635a069277e9592055cac9	["*"]	2026-11-16 02:58:42	\N	2026-11-16 02:19:14	2026-11-16 02:58:42
11	App\\Models\\User	3	efsrt_auth_token	1f820237684cb2a7b208ec4effa2523c2cecc6996fef2ef94b7e9bbfc781b939	["*"]	2026-11-08 04:31:35	\N	2026-11-08 04:24:25	2026-11-08 04:31:35
12	App\\Models\\User	3	efsrt_auth_token	329695cca2b7de32b6845f9a02554feca3b0d126fe820afbd64329b9e5de246a	["*"]	\N	\N	2026-11-08 04:39:23	2026-11-08 04:39:23
16	App\\Models\\User	3	efsrt_auth_token	d5bc459a2cf4ed4d21c67a65605caed4316d0d301ba8a795975cdc2e674e37e4	["*"]	2026-11-08 06:00:28	\N	2026-11-08 05:59:36	2026-11-08 06:00:28
17	App\\Models\\User	3	efsrt_auth_token	2bfa0a12cbaab0f67b7556b719be7a77f37108d9638bc36407655f2902cd5f02	["*"]	\N	\N	2026-11-08 06:13:47	2026-11-08 06:13:47
59	App\\Models\\User	1	efsrt_auth_token	51133ce61de34f681b94fd3fa3690508ba770a7af49a803184d669f903d17701	["*"]	2026-11-19 12:36:13	\N	2026-11-19 12:35:55	2026-11-19 12:36:13
55	App\\Models\\User	14	efsrt_auth_token	e81c52c1b43c8c1aca99faf4c268625095f29d1de6a0ef733545f9fffa34a5e8	["*"]	2026-11-15 03:49:24	\N	2026-11-15 00:50:56	2026-11-15 03:49:24
10	App\\Models\\User	3	efsrt_auth_token	1823cc78ab6d72fd7f3e95e18f2da153cfc0ba9b1699b826612da17e226c446b	["*"]	2026-11-08 05:12:01	\N	2026-11-08 04:23:54	2026-11-08 05:12:01
13	App\\Models\\User	3	efsrt_auth_token	ead41a499e06a4948183ceea30cb94b7d9267532a28665bfc82f8d741a1c2cc9	["*"]	2026-11-08 05:13:13	\N	2026-11-08 04:40:46	2026-11-08 05:13:13
14	App\\Models\\User	3	efsrt_auth_token	b31c17bf112798ad679a1468e68fee4f02b230955e64677cfd8a75d74198c47a	["*"]	2026-11-15 00:15:45	\N	2026-11-08 04:44:32	2026-11-15 00:15:45
20	App\\Models\\User	3	efsrt_auth_token	5011a992e362d1bd13a7af85cc98e15122e24ec434e96dc3a41f1bd68c6fc822	["*"]	2026-11-08 06:45:58	\N	2026-11-08 06:41:41	2026-11-08 06:45:58
15	App\\Models\\User	3	efsrt_auth_token	6eac1865fd51221ab7996fee118b7cadc7fc6f55198728216a59431cab7f3eb7	["*"]	2026-11-16 02:59:48	\N	2026-11-08 05:14:05	2026-11-16 02:59:48
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, nombre_rol, created_at) FROM stdin;
1	Administrador	2026-10-29 15:23:20.25242-05
2	Docente	2026-10-29 15:23:20.25242-05
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
OVyorfPa4Zl0ykHgtfjIzCd18trCRq0t9wxxt4Pw	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.144.0 Chrome/150.0.7871.250 Electron/43.8.3 Safari/537.36	eyJfdG9rZW4iOiJuYWkzQUNpZml0MU1XSUM2M1R5R053TFh1VjFpVmhUUXVXRXcwUGdjIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19	1793308730
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, email_verified_at, password, remember_token, created_at, updated_at) FROM stdin;
1	Admin EFSRT	admin@caceres.edu.pe	\N	$2y$12$fV6afNW/zjQrDUdb47c5nu37brvAE/KYMcv9u7cOTGC44kHe27Yxm	\N	2026-10-29 21:52:22	2026-10-29 21:52:22
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, dni, nombres, apellidos, correo, contrasena_hash, estado_cuenta, id_rol, created_at, updated_at) FROM stdin;
21	61061388	Alexis Yeshua	Felix Cordova	alexisfelixcordova@gmail.com	$2y$12$.ks.Eq15Pwi2Q8zK3Uz92Of1/uM0YtHFo3C5JQy.CVGAMYMMzvLei	Activo	2	2026-11-16 03:06:28-05	2026-11-16 03:06:28-05
1	70123456	Alexis Yeshua	Félix Córdova	alexis.felix@efsrt.edu.pe	$2y$12$SwHEgswXW4rR8tQSxttsReBxFwf6w2AukbVffi/CdmS1g4X2K6yRK	Activo	1	2026-10-29 15:23:20.25242-05	2026-11-08 08:20:02-05
2	45678912	Julio César	Gutarra Ramos	julio.gutarra@iestpacd.edu.pe	$2y$12$SwHEgswXW4rR8tQSxttsReBxFwf6w2AukbVffi/CdmS1g4X2K6yRK	Activo	2	2026-10-29 15:23:20.25242-05	2026-11-08 08:20:02-05
\.


--
-- Name: asignacion_asesores_id_asignacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asignacion_asesores_id_asignacion_seq', 3, true);


--
-- Name: constancias_emitidas_id_constancia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.constancias_emitidas_id_constancia_seq', 1, true);


--
-- Name: docentes_id_docente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.docentes_id_docente_seq', 4, true);


--
-- Name: empresas_convenio_id_empresa_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empresas_convenio_id_empresa_seq', 4, true);


--
-- Name: estudiantes_id_estudiante_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estudiantes_id_estudiante_seq', 6, true);


--
-- Name: evidencias_efsrt_id_evidencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evidencias_efsrt_id_evidencia_seq', 5, true);


--
-- Name: expediente_efsrt_id_expediente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expediente_efsrt_id_expediente_seq', 3, true);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 5, true);


--
-- Name: modulos_profesionales_id_modulo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modulos_profesionales_id_modulo_seq', 4, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 59, true);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 21, true);


--
-- Name: asignacion_asesores asignacion_asesores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_asesores
    ADD CONSTRAINT asignacion_asesores_pkey PRIMARY KEY (id_asignacion);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: constancias_emitidas constancias_emitidas_codigo_documento_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.constancias_emitidas
    ADD CONSTRAINT constancias_emitidas_codigo_documento_key UNIQUE (codigo_documento);


--
-- Name: constancias_emitidas constancias_emitidas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.constancias_emitidas
    ADD CONSTRAINT constancias_emitidas_pkey PRIMARY KEY (id_constancia);


--
-- Name: docentes docentes_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_codigo_key UNIQUE (codigo);


--
-- Name: docentes docentes_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_id_usuario_key UNIQUE (id_usuario);


--
-- Name: docentes docentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_pkey PRIMARY KEY (id_docente);


--
-- Name: empresas_convenio empresas_convenio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_convenio
    ADD CONSTRAINT empresas_convenio_pkey PRIMARY KEY (id_empresa);


--
-- Name: empresas_convenio empresas_convenio_ruc_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_convenio
    ADD CONSTRAINT empresas_convenio_ruc_key UNIQUE (ruc);


--
-- Name: estudiantes estudiantes_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_dni_key UNIQUE (dni);


--
-- Name: estudiantes estudiantes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_pkey PRIMARY KEY (id_estudiante);


--
-- Name: evidencias_efsrt evidencias_efsrt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidencias_efsrt
    ADD CONSTRAINT evidencias_efsrt_pkey PRIMARY KEY (id_evidencia);


--
-- Name: expediente_efsrt expediente_efsrt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expediente_efsrt
    ADD CONSTRAINT expediente_efsrt_pkey PRIMARY KEY (id_expediente);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: modulos_profesionales modulos_profesionales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modulos_profesionales
    ADD CONSTRAINT modulos_profesionales_pkey PRIMARY KEY (id_modulo);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: roles roles_nombre_rol_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_rol_key UNIQUE (nombre_rol);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: expediente_efsrt uq_estudiante_modulo_efsrt; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expediente_efsrt
    ADD CONSTRAINT uq_estudiante_modulo_efsrt UNIQUE (id_estudiante, id_modulo);


--
-- Name: asignacion_asesores uq_estudiante_modulo_periodo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_asesores
    ADD CONSTRAINT uq_estudiante_modulo_periodo UNIQUE (id_estudiante, id_modulo, periodo_academico);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- Name: usuarios usuarios_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_dni_key UNIQUE (dni);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: idx_asignacion_docente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asignacion_docente ON public.asignacion_asesores USING btree (id_docente);


--
-- Name: idx_asignacion_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asignacion_estudiante ON public.asignacion_asesores USING btree (id_estudiante);


--
-- Name: idx_constancias_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_constancias_estudiante ON public.constancias_emitidas USING btree (id_estudiante);


--
-- Name: idx_estudiantes_dni_apellidos; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiantes_dni_apellidos ON public.estudiantes USING btree (dni, apellidos);


--
-- Name: idx_evidencias_expediente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidencias_expediente ON public.evidencias_efsrt USING btree (id_expediente);


--
-- Name: idx_expediente_docente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expediente_docente ON public.expediente_efsrt USING btree (id_docente_asesor);


--
-- Name: idx_expediente_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expediente_empresa ON public.expediente_efsrt USING btree (id_empresa);


--
-- Name: idx_expediente_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expediente_estado ON public.expediente_efsrt USING btree (estado_efsrt);


--
-- Name: idx_expediente_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expediente_estudiante ON public.expediente_efsrt USING btree (id_estudiante);


--
-- Name: idx_expediente_modulo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expediente_modulo ON public.expediente_efsrt USING btree (id_modulo);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (id_rol);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: docentes docentes_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- Name: asignacion_asesores fk_asig_docente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_asesores
    ADD CONSTRAINT fk_asig_docente FOREIGN KEY (id_docente) REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT;


--
-- Name: asignacion_asesores fk_asig_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_asesores
    ADD CONSTRAINT fk_asig_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante) ON DELETE CASCADE;


--
-- Name: asignacion_asesores fk_asig_modulo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_asesores
    ADD CONSTRAINT fk_asig_modulo FOREIGN KEY (id_modulo) REFERENCES public.modulos_profesionales(id_modulo) ON DELETE RESTRICT;


--
-- Name: constancias_emitidas fk_constancia_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.constancias_emitidas
    ADD CONSTRAINT fk_constancia_admin FOREIGN KEY (id_administrador) REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT;


--
-- Name: constancias_emitidas fk_constancia_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.constancias_emitidas
    ADD CONSTRAINT fk_constancia_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante) ON DELETE RESTRICT;


--
-- Name: constancias_emitidas fk_constancia_modulo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.constancias_emitidas
    ADD CONSTRAINT fk_constancia_modulo FOREIGN KEY (id_modulo) REFERENCES public.modulos_profesionales(id_modulo) ON DELETE RESTRICT;


--
-- Name: expediente_efsrt fk_efsrt_docente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expediente_efsrt
    ADD CONSTRAINT fk_efsrt_docente FOREIGN KEY (id_docente_asesor) REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT;


--
-- Name: expediente_efsrt fk_efsrt_empresa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expediente_efsrt
    ADD CONSTRAINT fk_efsrt_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresas_convenio(id_empresa) ON DELETE RESTRICT;


--
-- Name: expediente_efsrt fk_efsrt_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expediente_efsrt
    ADD CONSTRAINT fk_efsrt_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante) ON DELETE CASCADE;


--
-- Name: expediente_efsrt fk_efsrt_modulo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expediente_efsrt
    ADD CONSTRAINT fk_efsrt_modulo FOREIGN KEY (id_modulo) REFERENCES public.modulos_profesionales(id_modulo) ON DELETE RESTRICT;


--
-- Name: evidencias_efsrt fk_evidencia_expediente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidencias_efsrt
    ADD CONSTRAINT fk_evidencia_expediente FOREIGN KEY (id_expediente) REFERENCES public.expediente_efsrt(id_expediente) ON DELETE CASCADE;


--
-- Name: usuarios fk_usuario_rol; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict uLxuvK5MPw1UUydVuQnr7CzGhiGLoLRBJYgT24R3UTd3qfnJNGOd0zpfFPwGtEY

