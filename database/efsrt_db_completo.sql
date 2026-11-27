--
-- PostgreSQL database dump
--

\restrict od7NPahlPJPq16fZjBI5mcuC4SsMsxtHwbEKKjLFFclVWl1QPCeIzAowQDZQ9uo

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END $$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_datos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_datos (
    id_dato bigint NOT NULL,
    id_usuario bigint NOT NULL,
    aplicacion character varying(32) NOT NULL,
    datos json NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.app_datos OWNER TO postgres;

--
-- Name: app_datos_id_dato_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.app_datos_id_dato_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_datos_id_dato_seq OWNER TO postgres;

--
-- Name: app_datos_id_dato_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.app_datos_id_dato_seq OWNED BY public.app_datos.id_dato;


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
-- Name: calendario_notas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendario_notas (
    id_usuario bigint NOT NULL,
    contenido text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.calendario_notas OWNER TO postgres;

--
-- Name: calendario_tareas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendario_tareas (
    id_tarea bigint NOT NULL,
    id_usuario bigint NOT NULL,
    texto character varying(255) NOT NULL,
    hecha boolean DEFAULT false NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.calendario_tareas OWNER TO postgres;

--
-- Name: calendario_tareas_id_tarea_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.calendario_tareas ALTER COLUMN id_tarea ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.calendario_tareas_id_tarea_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: carpetas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carpetas (
    id_carpeta bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_carpeta_padre bigint,
    nombre character varying(100) NOT NULL,
    icono character varying(30) DEFAULT 'folder'::character varying NOT NULL,
    color character varying(7) DEFAULT '#2563eb'::character varying NOT NULL,
    eliminada_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_carpeta_no_es_su_padre CHECK ((id_carpeta_padre IS DISTINCT FROM id_carpeta))
);


ALTER TABLE public.carpetas OWNER TO postgres;

--
-- Name: carpetas_id_carpeta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.carpetas ALTER COLUMN id_carpeta ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.carpetas_id_carpeta_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


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
-- Name: contactos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contactos (
    id_contacto bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_empresa bigint,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100),
    cargo character varying(100),
    correo character varying(150),
    telefono character varying(20),
    notas text,
    favorito boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contactos OWNER TO postgres;

--
-- Name: contactos_id_contacto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.contactos ALTER COLUMN id_contacto ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.contactos_id_contacto_seq
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
-- Name: documentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documentos (
    id_documento bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_carpeta bigint,
    nombre character varying(150) NOT NULL,
    extension character varying(10),
    mime_type character varying(100),
    tamano_bytes bigint DEFAULT 0 NOT NULL,
    ruta_archivo character varying(255) NOT NULL,
    eliminado_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_documento_tamano CHECK ((tamano_bytes >= 0))
);


ALTER TABLE public.documentos OWNER TO postgres;

--
-- Name: documentos_id_documento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.documentos ALTER COLUMN id_documento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.documentos_id_documento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


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
    estado character varying(30),
    condicion character varying(30),
    tipo_contribuyente character varying(100),
    departamento character varying(100),
    provincia character varying(100),
    distrito character varying(100),
    ubigeo character varying(6),
    telefono character varying(50),
    correo_electronico character varying(255),
    direccion character varying(500),
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
    estado character varying(50) DEFAULT 'Al día'::character varying,
    foto_url character varying(255)
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
-- Name: eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos (
    id_evento bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_empresa bigint,
    id_estudiante bigint,
    titulo character varying(150) NOT NULL,
    nota text,
    tipo character varying(10) DEFAULT 'Reunión'::character varying NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_evento_horas CHECK ((hora_fin > hora_inicio)),
    CONSTRAINT chk_evento_tipo CHECK (((tipo)::text = ANY ((ARRAY['Reunión'::character varying, 'Entrega'::character varying, 'Visita'::character varying, 'Otro'::character varying])::text[])))
);


ALTER TABLE public.eventos OWNER TO postgres;

--
-- Name: eventos_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.eventos ALTER COLUMN id_evento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.eventos_id_evento_seq
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
    id_empresa bigint,
    id_docente_asesor bigint NOT NULL,
    horas_acumuladas integer DEFAULT 0,
    estado_efsrt character varying(30) DEFAULT 'No efectuó'::character varying,
    portafolio_fisico_revisado boolean DEFAULT false,
    observaciones text,
    fecha_validacion timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio date,
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
-- Name: nota_categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nota_categorias (
    id_categoria bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    color character varying(7) DEFAULT '#94a3b8'::character varying NOT NULL,
    orden smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.nota_categorias OWNER TO postgres;

--
-- Name: nota_categorias_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.nota_categorias ALTER COLUMN id_categoria ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nota_categorias_id_categoria_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nota_imagenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nota_imagenes (
    id_imagen bigint NOT NULL,
    id_nota bigint NOT NULL,
    nombre character varying(150),
    ruta character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.nota_imagenes OWNER TO postgres;

--
-- Name: nota_imagenes_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.nota_imagenes ALTER COLUMN id_imagen ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nota_imagenes_id_imagen_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nota_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nota_items (
    id_item bigint NOT NULL,
    id_nota bigint NOT NULL,
    texto character varying(255) NOT NULL,
    hecho boolean DEFAULT false NOT NULL,
    orden integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.nota_items OWNER TO postgres;

--
-- Name: nota_items_id_item_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.nota_items ALTER COLUMN id_item ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nota_items_id_item_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notas (
    id_nota bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_categoria bigint,
    titulo character varying(150),
    contenido text,
    tipo character varying(10) DEFAULT 'texto'::character varying NOT NULL,
    fijada boolean DEFAULT false NOT NULL,
    archivada boolean DEFAULT false NOT NULL,
    eliminada_at timestamp with time zone,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_nota_tipo CHECK (((tipo)::text = ANY ((ARRAY['texto'::character varying, 'checklist'::character varying])::text[])))
);


ALTER TABLE public.notas OWNER TO postgres;

--
-- Name: notas_id_nota_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.notas ALTER COLUMN id_nota ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notas_id_nota_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    type character varying(255) NOT NULL,
    notifiable_type character varying(255) NOT NULL,
    notifiable_id bigint NOT NULL,
    data json NOT NULL,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

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
-- Name: proyectos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proyectos (
    id_proyecto bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_empresa bigint NOT NULL,
    id_estudiante bigint NOT NULL,
    id_modulo bigint,
    titulo character varying(150) NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'Por iniciar'::character varying NOT NULL,
    avance smallint DEFAULT 0 NOT NULL,
    fecha_limite date,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_proyecto_avance CHECK (((avance >= 0) AND (avance <= 100))),
    CONSTRAINT chk_proyecto_estado CHECK (((estado)::text = ANY ((ARRAY['Por iniciar'::character varying, 'En curso'::character varying, 'En revisión'::character varying, 'Finalizado'::character varying])::text[])))
);


ALTER TABLE public.proyectos OWNER TO postgres;

--
-- Name: proyectos_id_proyecto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.proyectos ALTER COLUMN id_proyecto ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.proyectos_id_proyecto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


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
    foto_perfil character varying(255),
    telefono character varying(20),
    preferencias_notificaciones json,
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
-- Name: v_explorador; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_explorador WITH (security_invoker='true') AS
 SELECT 'carpeta'::text AS clase,
    f.id_carpeta AS id,
    f.id_usuario,
    f.id_carpeta_padre AS id_padre,
    f.nombre,
    'Carpeta'::text AS tipo,
    NULL::character varying AS extension,
    NULL::bigint AS tamano_bytes,
    (( SELECT count(*) AS count
           FROM public.carpetas h
          WHERE ((h.id_carpeta_padre = f.id_carpeta) AND (h.eliminada_at IS NULL))) + ( SELECT count(*) AS count
           FROM public.documentos d
          WHERE ((d.id_carpeta = f.id_carpeta) AND (d.eliminado_at IS NULL)))) AS elementos,
    f.icono,
    f.color,
    f.updated_at AS modificado,
    f.eliminada_at
   FROM public.carpetas f
UNION ALL
 SELECT 'documento'::text AS clase,
    d.id_documento AS id,
    d.id_usuario,
    d.id_carpeta AS id_padre,
    d.nombre,
        CASE lower((COALESCE(d.extension, ''::character varying))::text)
            WHEN 'xlsx'::text THEN 'Documento Excel'::text
            WHEN 'xls'::text THEN 'Documento Excel'::text
            WHEN 'docx'::text THEN 'Documento Word'::text
            WHEN 'doc'::text THEN 'Documento Word'::text
            WHEN 'pdf'::text THEN 'Documento PDF'::text
            WHEN 'pptx'::text THEN 'Presentación'::text
            WHEN 'png'::text THEN 'Imagen'::text
            WHEN 'jpg'::text THEN 'Imagen'::text
            WHEN 'jpeg'::text THEN 'Imagen'::text
            WHEN 'webp'::text THEN 'Imagen'::text
            ELSE 'Archivo'::text
        END AS tipo,
    d.extension,
    d.tamano_bytes,
    NULL::bigint AS elementos,
    NULL::character varying AS icono,
    NULL::character varying AS color,
    d.updated_at AS modificado,
    d.eliminado_at AS eliminada_at
   FROM public.documentos d;


ALTER VIEW public.v_explorador OWNER TO postgres;

--
-- Name: v_notas; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_notas WITH (security_invoker='true') AS
 SELECT n.id_nota,
    n.id_usuario,
    n.id_categoria,
    n.titulo,
    n.contenido,
    n.tipo,
    n.fijada,
    n.archivada,
    n.eliminada_at,
    n.orden,
    n.created_at,
    n.updated_at,
    c.nombre AS categoria,
    c.color AS categoria_color,
    ( SELECT count(*) AS count
           FROM public.nota_items i
          WHERE (i.id_nota = n.id_nota)) AS items_total,
    ( SELECT count(*) AS count
           FROM public.nota_items i
          WHERE ((i.id_nota = n.id_nota) AND i.hecho)) AS items_hechos
   FROM (public.notas n
     LEFT JOIN public.nota_categorias c ON ((c.id_categoria = n.id_categoria)));


ALTER VIEW public.v_notas OWNER TO postgres;

--
-- Name: v_proyectos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_proyectos WITH (security_invoker='true') AS
 SELECT p.id_proyecto,
    p.id_usuario,
    p.titulo,
    p.descripcion,
    p.estado,
    p.avance,
    p.fecha_limite,
    p.orden,
    p.id_empresa,
    e.razon_social AS entidad,
    p.id_estudiante,
    (((s.nombres)::text || ' '::text) || (s.apellidos)::text) AS alumno,
    p.id_modulo,
    p.created_at,
    p.updated_at,
    (p.fecha_limite - CURRENT_DATE) AS dias_restantes,
    (((p.estado)::text <> 'Finalizado'::text) AND (p.fecha_limite < CURRENT_DATE)) AS vencido,
    (((p.estado)::text <> 'Finalizado'::text) AND ((p.fecha_limite >= CURRENT_DATE) AND (p.fecha_limite <= (CURRENT_DATE + 7)))) AS por_vencer
   FROM ((public.proyectos p
     JOIN public.empresas_convenio e ON ((e.id_empresa = p.id_empresa)))
     JOIN public.estudiantes s ON ((s.id_estudiante = p.id_estudiante)));


ALTER VIEW public.v_proyectos OWNER TO postgres;

--
-- Name: v_proyectos_resumen; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_proyectos_resumen WITH (security_invoker='true') AS
 SELECT id_usuario,
    count(*) AS total,
    COALESCE(round(avg(avance)), (0)::numeric) AS avance_promedio,
    count(*) FILTER (WHERE ((estado)::text = 'Por iniciar'::text)) AS por_iniciar,
    count(*) FILTER (WHERE ((estado)::text = 'En curso'::text)) AS en_curso,
    count(*) FILTER (WHERE ((estado)::text = 'En revisión'::text)) AS en_revision,
    count(*) FILTER (WHERE ((estado)::text = 'Finalizado'::text)) AS finalizado,
    count(*) FILTER (WHERE por_vencer) AS por_vencer
   FROM public.v_proyectos
  GROUP BY id_usuario;


ALTER VIEW public.v_proyectos_resumen OWNER TO postgres;

--
-- Name: app_datos id_dato; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_datos ALTER COLUMN id_dato SET DEFAULT nextval('public.app_datos_id_dato_seq'::regclass);


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
-- Data for Name: app_datos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.app_datos (id_dato, id_usuario, aplicacion, datos, created_at, updated_at) VALUES (1, 2, 'notas', '[{"id":"17957528581928574","titulo":"Reuni\u00f3n con asesor","tipo":"lista","contenido":null,"items":[{"id":"17957528569604275","texto":"Presentar avance de horas","hecho":false},{"id":"17957528569604745","texto":"Consultar dudas del informe","hecho":false},{"id":"17957528569605131","texto":"Revisar documentos pendientes","hecho":false},{"id":"17957528569608491","texto":"Acordar fecha de la pr\u00f3xima reuni\u00f3n","hecho":false}],"imagen":null,"categoria":"Pr\u00e1cticas","fijada":false,"estado":"activa","creada":"2026-11-27T04:14:18.192Z","editada":"2026-11-27T04:14:18.192Z"}]', '2026-11-27 04:14:19', '2026-11-27 04:14:19');
INSERT INTO public.app_datos (id_dato, id_usuario, aplicacion, datos, created_at, updated_at) VALUES (2, 2, 'archivos', '{"items":[{"id":"e5f4c589-d23b-4699-8a25-010e20036730","padre":null,"tipo":"archivo","nombre":"Manual_del_Programador_Gu\u00eda.docx","tam":50540,"fecha":"2026-11-27","mime_type":"application\/vnd.openxmlformats-officedocument.wordprocessingml.document","ruta_almacenamiento":"apps\/2\/e5f4c589-d23b-4699-8a25-010e20036730"}],"papelera":[]}', '2026-11-27 04:14:24', '2026-11-27 04:14:35');


--
-- Data for Name: asignacion_asesores; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (9, 23, 29, 3, '2026-II', '2026-11-23 02:47:38-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (10, 23, 100, 3, '2026-II', '2026-11-23 02:47:38-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (11, 23, 101, 3, '2026-II', '2026-11-23 02:47:38-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (12, 23, 104, 3, '2026-II', '2026-11-23 02:47:38-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (13, 23, 102, 3, '2026-II', '2026-11-23 02:47:38-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (14, 23, 98, 3, '2026-II', '2026-11-23 02:47:38-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (23, 23, 100, 1, '2026-II', '2026-11-23 04:31:31-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (24, 23, 101, 1, '2026-II', '2026-11-23 04:31:31-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (27, 23, 98, 1, '2026-II', '2026-11-23 04:31:31-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (28, 22, 106, 1, '2026-II', '2026-11-26 23:41:10-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (29, 22, 104, 1, '2026-II', '2026-11-26 23:41:10-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (30, 22, 102, 1, '2026-II', '2026-11-26 23:41:10-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (43, 2, 105, 1, '2026-II', '2026-11-27 04:13:35-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (44, 2, 30, 1, '2026-II', '2026-11-27 04:13:35-05');
INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at) OVERRIDING SYSTEM VALUE VALUES (45, 2, 29, 1, '2026-II', '2026-11-27 04:13:35-05');


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cache (key, value, expiration) VALUES ('laravel-cache-estudiantes_todos', 'a:106:{i:0;a:13:{s:13:"id_estudiante";i:106;s:3:"dni";s:8:"78109774";s:7:"nombres";s:13:"AISHA YADHIRA";s:9:"apellidos";s:14:"MIGUEL HUAMANI";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:46:16.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:16.000000Z";s:6:"correo";s:30:"78109774@institutocajas.edu.pe";s:8:"telefono";s:9:"936145081";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:1;a:13:{s:13:"id_estudiante";i:105;s:3:"dni";s:8:"78005772";s:7:"nombres";s:12:"ALCEDES IDER";s:9:"apellidos";s:14:"ALIAGA MENDOZA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:46:15.000000Z";s:10:"updated_at";s:27:"2026-11-27T08:55:56.000000Z";s:6:"correo";s:30:"78005772@institutocajas.edu.pe";s:8:"telefono";s:9:"990041526";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";s:65:"/storage/estudiantes/BlAPPUuECByB6Bg8L4VZjqZXAQ922Wa9hDhcvqgW.jpg";}i:2;a:13:{s:13:"id_estudiante";i:104;s:3:"dni";s:8:"77903101";s:7:"nombres";s:5:"HELEN";s:9:"apellidos";s:24:"CHUQUILLANQUI APOLINARIO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:46:15.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:15.000000Z";s:6:"correo";s:30:"77903101@institutocajas.edu.pe";s:8:"telefono";s:9:"902351973";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:3;a:13:{s:13:"id_estudiante";i:103;s:3:"dni";s:8:"77797728";s:7:"nombres";s:6:"MOISES";s:9:"apellidos";s:14:"MOLINA CRISPIN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:46:14.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:14.000000Z";s:6:"correo";s:30:"77797728@institutocajas.edu.pe";s:8:"telefono";s:9:"953856494";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:4;a:13:{s:13:"id_estudiante";i:102;s:3:"dni";s:8:"77356832";s:7:"nombres";s:12:"JUAN BEN HUR";s:9:"apellidos";s:14:"PACHECO HUAMAN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:46:12.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:12.000000Z";s:6:"correo";s:30:"77356832@institutocajas.edu.pe";s:8:"telefono";s:9:"921528201";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:5;a:13:{s:13:"id_estudiante";i:101;s:3:"dni";s:8:"77277836";s:7:"nombres";s:13:"ASTRID LUCERO";s:9:"apellidos";s:13:"ARROYO PRIALE";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:46:11.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:11.000000Z";s:6:"correo";s:30:"77277836@institutocajas.edu.pe";s:8:"telefono";s:9:"951141619";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:6;a:13:{s:13:"id_estudiante";i:100;s:3:"dni";s:8:"76840236";s:7:"nombres";s:17:"WILLIAM FLORENCIO";s:9:"apellidos";s:12:"HUANUCO CORI";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:46:09.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:09.000000Z";s:6:"correo";s:30:"76840236@institutocajas.edu.pe";s:8:"telefono";s:9:"997282373";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:7;a:13:{s:13:"id_estudiante";i:99;s:3:"dni";s:8:"76560607";s:7:"nombres";s:15:"PEDRO JHAMPIERE";s:9:"apellidos";s:10:"VIVAS MEZA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:46:08.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:08.000000Z";s:6:"correo";s:30:"76560607@institutocajas.edu.pe";s:8:"telefono";s:9:"983731486";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:8;a:13:{s:13:"id_estudiante";i:98;s:3:"dni";s:8:"76525718";s:7:"nombres";s:13:"CARLOS DANIEL";s:9:"apellidos";s:15:"HUAYCA?E FLORES";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:46:06.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:06.000000Z";s:6:"correo";s:30:"76525718@institutocajas.edu.pe";s:8:"telefono";s:9:"904229462";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:9;a:13:{s:13:"id_estudiante";i:97;s:3:"dni";s:8:"76120800";s:7:"nombres";s:13:"MARITH SELENA";s:9:"apellidos";s:14:"PACHECO TORRES";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:46:04.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:04.000000Z";s:6:"correo";s:30:"76120800@institutocajas.edu.pe";s:8:"telefono";s:9:"929479984";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:10;a:13:{s:13:"id_estudiante";i:96;s:3:"dni";s:8:"75998829";s:7:"nombres";s:13:"RONALDO JESUS";s:9:"apellidos";s:14:"CAMPOS CALLUPE";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:46:03.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:03.000000Z";s:6:"correo";s:30:"75998829@institutocajas.edu.pe";s:8:"telefono";s:9:"968393666";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:11;a:13:{s:13:"id_estudiante";i:95;s:3:"dni";s:8:"75995021";s:7:"nombres";s:14:"MORELIA FATIMA";s:9:"apellidos";s:11:"LAZO HUAMAN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:46:01.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:01.000000Z";s:6:"correo";s:30:"75995021@institutocajas.edu.pe";s:8:"telefono";s:9:"912661254";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:12;a:13:{s:13:"id_estudiante";i:94;s:3:"dni";s:8:"75991660";s:7:"nombres";s:15:"CYNTHIA ABIGAIL";s:9:"apellidos";s:13:"HUERTA YLANZO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:46:00.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:46:00.000000Z";s:6:"correo";s:30:"75991660@institutocajas.edu.pe";s:8:"telefono";s:9:"991213838";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:13;a:13:{s:13:"id_estudiante";i:93;s:3:"dni";s:8:"75990566";s:7:"nombres";s:11:"JUAN ARTURO";s:9:"apellidos";s:15:"ADARMES ZENTENO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:58.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:58.000000Z";s:6:"correo";s:30:"75990566@institutocajas.edu.pe";s:8:"telefono";s:9:"978901387";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:14;a:13:{s:13:"id_estudiante";i:92;s:3:"dni";s:8:"75971346";s:7:"nombres";s:14:"RICARDO SAMUEL";s:9:"apellidos";s:13:"CORONEL ROJAS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:57.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:57.000000Z";s:6:"correo";s:30:"75971346@institutocajas.edu.pe";s:8:"telefono";s:9:"984936361";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:15;a:13:{s:13:"id_estudiante";i:91;s:3:"dni";s:8:"75889758";s:7:"nombres";s:14:"ANTONY JHOSEPS";s:9:"apellidos";s:16:"FLORES CASTILLON";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:56.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:56.000000Z";s:6:"correo";s:30:"75889758@institutocajas.edu.pe";s:8:"telefono";s:9:"962238836";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:16;a:13:{s:13:"id_estudiante";i:90;s:3:"dni";s:8:"75704479";s:7:"nombres";s:11:"ANGY NIKOLL";s:9:"apellidos";s:15:"HUARCAYA CULQUI";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:54.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:54.000000Z";s:6:"correo";s:30:"75704479@institutocajas.edu.pe";s:8:"telefono";s:9:"971283090";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:17;a:13:{s:13:"id_estudiante";i:89;s:3:"dni";s:8:"75689415";s:7:"nombres";s:12:"CARLOS JESUS";s:9:"apellidos";s:14:"HUAYTA MELCHOR";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:53.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:53.000000Z";s:6:"correo";s:30:"75689415@institutocajas.edu.pe";s:8:"telefono";s:9:"904396512";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:18;a:13:{s:13:"id_estudiante";i:88;s:3:"dni";s:8:"75655848";s:7:"nombres";s:14:"JOSE JHEFERSON";s:9:"apellidos";s:16:"CARDENAS CAMARGO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:52.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:52.000000Z";s:6:"correo";s:30:"75655848@institutocajas.edu.pe";s:8:"telefono";s:9:"924153238";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:19;a:13:{s:13:"id_estudiante";i:87;s:3:"dni";s:8:"75610161";s:7:"nombres";s:13:"GUSTAVO PIERO";s:9:"apellidos";s:17:"GRANADOS ORELLANA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:50.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:50.000000Z";s:6:"correo";s:30:"75610161@institutocajas.edu.pe";s:8:"telefono";s:9:"948368662";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:20;a:13:{s:13:"id_estudiante";i:86;s:3:"dni";s:8:"75575578";s:7:"nombres";s:15:"ANNETTE STEFANY";s:9:"apellidos";s:11:"LOZANO CASO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:49.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:49.000000Z";s:6:"correo";s:30:"75575578@institutocajas.edu.pe";s:8:"telefono";s:9:"921395935";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:21;a:13:{s:13:"id_estudiante";i:85;s:3:"dni";s:8:"75557502";s:7:"nombres";s:13:"EXAR WILLIAMS";s:9:"apellidos";s:11:"ATAO PAUCAR";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:48.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:48.000000Z";s:6:"correo";s:30:"75557502@institutocajas.edu.pe";s:8:"telefono";s:9:"916694173";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:22;a:13:{s:13:"id_estudiante";i:84;s:3:"dni";s:8:"75460820";s:7:"nombres";s:13:"ADHERLY JESUS";s:9:"apellidos";s:13:"MEDRANO ROJAS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:47.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:47.000000Z";s:6:"correo";s:30:"75460820@institutocajas.edu.pe";s:8:"telefono";s:9:"929956310";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:23;a:13:{s:13:"id_estudiante";i:83;s:3:"dni";s:8:"75435152";s:7:"nombres";s:11:"CARLOS JOSE";s:9:"apellidos";s:10:"PE?A PONCE";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:45.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:45.000000Z";s:6:"correo";s:30:"75435152@institutocajas.edu.pe";s:8:"telefono";s:9:"929996163";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:24;a:13:{s:13:"id_estudiante";i:82;s:3:"dni";s:8:"75285913";s:7:"nombres";s:15:"DENZEL DUDIKOFF";s:9:"apellidos";s:17:"FERNANDEZ HUACCHO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:44.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:44.000000Z";s:6:"correo";s:30:"75285913@institutocajas.edu.pe";s:8:"telefono";s:9:"931892438";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:25;a:13:{s:13:"id_estudiante";i:81;s:3:"dni";s:8:"75241371";s:7:"nombres";s:14:"KALET MAURICIO";s:9:"apellidos";s:15:"CCASANI PAINADO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:43.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:43.000000Z";s:6:"correo";s:30:"75241371@institutocajas.edu.pe";s:8:"telefono";s:9:"900771943";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:26;a:13:{s:13:"id_estudiante";i:80;s:3:"dni";s:8:"75212411";s:7:"nombres";s:14:"OSWALDO JUNIOR";s:9:"apellidos";s:13:"PEREZ PAREDES";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:42.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:42.000000Z";s:6:"correo";s:30:"75212411@institutocajas.edu.pe";s:8:"telefono";s:9:"910509218";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:27;a:13:{s:13:"id_estudiante";i:79;s:3:"dni";s:8:"75100055";s:7:"nombres";s:11:"ELVIS FARIT";s:9:"apellidos";s:14:"MORALES SEGURA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:41.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:41.000000Z";s:6:"correo";s:30:"75100055@institutocajas.edu.pe";s:8:"telefono";s:9:"918185504";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:28;a:13:{s:13:"id_estudiante";i:78;s:3:"dni";s:8:"75100007";s:7:"nombres";s:14:"THALIA YENIFER";s:9:"apellidos";s:18:"LLANTOY APOLINARIO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:39.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:39.000000Z";s:6:"correo";s:30:"75100007@institutocajas.edu.pe";s:8:"telefono";s:9:"920306840";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:29;a:13:{s:13:"id_estudiante";i:77;s:3:"dni";s:8:"75047364";s:7:"nombres";s:11:"FRANCO OMAR";s:9:"apellidos";s:16:"DAVILA SAMANIEGO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:38.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:38.000000Z";s:6:"correo";s:30:"75047364@institutocajas.edu.pe";s:8:"telefono";s:9:"931514061";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:30;a:13:{s:13:"id_estudiante";i:76;s:3:"dni";s:8:"75026154";s:7:"nombres";s:11:"SERGIO ALEX";s:9:"apellidos";s:16:"ARREDONDO VALERO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:37.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:37.000000Z";s:6:"correo";s:30:"75026154@institutocajas.edu.pe";s:8:"telefono";s:9:"920864203";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:31;a:13:{s:13:"id_estudiante";i:75;s:3:"dni";s:8:"74978089";s:7:"nombres";s:9:"JOSE LUIS";s:9:"apellidos";s:12:"SANTOS ALLER";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:35.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:35.000000Z";s:6:"correo";s:30:"74978089@institutocajas.edu.pe";s:8:"telefono";s:9:"901009168";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:32;a:13:{s:13:"id_estudiante";i:74;s:3:"dni";s:8:"74961805";s:7:"nombres";s:16:"GIANELLA GIOVANA";s:9:"apellidos";s:14:"POMA ATAHUAMAN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:33.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:33.000000Z";s:6:"correo";s:30:"74961805@institutocajas.edu.pe";s:8:"telefono";s:9:"931239168";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:33;a:13:{s:13:"id_estudiante";i:73;s:3:"dni";s:8:"74885840";s:7:"nombres";s:13:"ALVARO RENATO";s:9:"apellidos";s:16:"MAGUI?A SUTACORO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:32.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:32.000000Z";s:6:"correo";s:30:"74885840@institutocajas.edu.pe";s:8:"telefono";s:9:"925423424";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:34;a:13:{s:13:"id_estudiante";i:72;s:3:"dni";s:8:"74805347";s:7:"nombres";s:12:"ZULEMA DELCY";s:9:"apellidos";s:11:"ROJAS SUC?O";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:31.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:31.000000Z";s:6:"correo";s:30:"74805347@institutocajas.edu.pe";s:8:"telefono";s:9:"977568296";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:35;a:13:{s:13:"id_estudiante";i:71;s:3:"dni";s:8:"74801208";s:7:"nombres";s:14:"BIANCA NATHALY";s:9:"apellidos";s:11:"CALSIN JULI";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:30.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:30.000000Z";s:6:"correo";s:30:"74801208@institutocajas.edu.pe";s:8:"telefono";s:9:"936260986";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:36;a:13:{s:13:"id_estudiante";i:70;s:3:"dni";s:8:"73936233";s:7:"nombres";s:14:"GIANCARLO ABEL";s:9:"apellidos";s:11:"MEZA HUAMAN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:29.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:29.000000Z";s:6:"correo";s:30:"73936233@institutocajas.edu.pe";s:8:"telefono";s:9:"925602410";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:37;a:13:{s:13:"id_estudiante";i:69;s:3:"dni";s:8:"73779071";s:7:"nombres";s:13:"CHRIS GISENIA";s:9:"apellidos";s:16:"VALERO CAINICELA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:28.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:28.000000Z";s:6:"correo";s:30:"73779071@institutocajas.edu.pe";s:8:"telefono";s:9:"986602090";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:38;a:13:{s:13:"id_estudiante";i:68;s:3:"dni";s:8:"73616299";s:7:"nombres";s:10:"MAX EDWARD";s:9:"apellidos";s:16:"OLARTE ZUASNABAR";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:26.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:26.000000Z";s:6:"correo";s:30:"73616299@institutocajas.edu.pe";s:8:"telefono";s:9:"992029773";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:39;a:13:{s:13:"id_estudiante";i:67;s:3:"dni";s:8:"73611118";s:7:"nombres";s:10:"JHON EDGAR";s:9:"apellidos";s:20:"CONTRERAS HINOSTROZA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:26.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:26.000000Z";s:6:"correo";s:30:"73611118@institutocajas.edu.pe";s:8:"telefono";s:9:"972163584";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:40;a:13:{s:13:"id_estudiante";i:66;s:3:"dni";s:8:"73423141";s:7:"nombres";s:18:"ANAMARIA DEL PILAR";s:9:"apellidos";s:15:"SANCHEZ BALDEON";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:24.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:24.000000Z";s:6:"correo";s:30:"73423141@institutocajas.edu.pe";s:8:"telefono";s:9:"903180962";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:41;a:13:{s:13:"id_estudiante";i:65;s:3:"dni";s:8:"73145710";s:7:"nombres";s:16:"ELEAZAR NATANAEL";s:9:"apellidos";s:17:"MEJICO DE LA CRUZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:23.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:23.000000Z";s:6:"correo";s:30:"73145710@institutocajas.edu.pe";s:8:"telefono";s:9:"935691026";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:42;a:13:{s:13:"id_estudiante";i:64;s:3:"dni";s:8:"73127152";s:7:"nombres";s:17:"FABRIZZIO RICARDO";s:9:"apellidos";s:10:"ROJAS POMA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:22.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:22.000000Z";s:6:"correo";s:30:"73127152@institutocajas.edu.pe";s:8:"telefono";s:9:"930509329";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:43;a:13:{s:13:"id_estudiante";i:63;s:3:"dni";s:8:"73027729";s:7:"nombres";s:12:"SAMIRA TAYLI";s:9:"apellidos";s:13:"SOLLER RIVERA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:20.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:20.000000Z";s:6:"correo";s:30:"73027729@institutocajas.edu.pe";s:8:"telefono";s:9:"964902460";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:44;a:13:{s:13:"id_estudiante";i:62;s:3:"dni";s:8:"72979547";s:7:"nombres";s:7:"ABRAHAM";s:9:"apellidos";s:14:"PAREJAS ARAUJO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:19.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:19.000000Z";s:6:"correo";s:30:"72979547@institutocajas.edu.pe";s:8:"telefono";s:9:"906250556";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:45;a:13:{s:13:"id_estudiante";i:61;s:3:"dni";s:8:"72748273";s:7:"nombres";s:15:"TATIANA DAMARIS";s:9:"apellidos";s:16:"SOLORZANO CHAUCA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:18.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:18.000000Z";s:6:"correo";s:30:"72748273@institutocajas.edu.pe";s:8:"telefono";s:9:"951038386";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:46;a:13:{s:13:"id_estudiante";i:60;s:3:"dni";s:8:"72670265";s:7:"nombres";s:6:"JEMINA";s:9:"apellidos";s:13:"SULLCA VARGAS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:17.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:17.000000Z";s:6:"correo";s:30:"72670265@institutocajas.edu.pe";s:8:"telefono";s:9:"904561774";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:47;a:13:{s:13:"id_estudiante";i:59;s:3:"dni";s:8:"72571243";s:7:"nombres";s:15:"GABRIEL FRANCIS";s:9:"apellidos";s:12:"RAPRI CAPCHA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:16.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:16.000000Z";s:6:"correo";s:30:"72571243@institutocajas.edu.pe";s:8:"telefono";s:9:"958684615";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:48;a:13:{s:13:"id_estudiante";i:58;s:3:"dni";s:8:"72438097";s:7:"nombres";s:14:"SADITH DANITZA";s:9:"apellidos";s:15:"MELO CABANILLAS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:14.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:14.000000Z";s:6:"correo";s:30:"72438097@institutocajas.edu.pe";s:8:"telefono";s:9:"970894017";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:49;a:13:{s:13:"id_estudiante";i:57;s:3:"dni";s:8:"72309767";s:7:"nombres";s:14:"LEONARDO FAVIO";s:9:"apellidos";s:14:"COTERA ARRIETA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:14.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:14.000000Z";s:6:"correo";s:30:"72309767@institutocajas.edu.pe";s:8:"telefono";s:9:"924654441";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:50;a:13:{s:13:"id_estudiante";i:56;s:3:"dni";s:8:"71988658";s:7:"nombres";s:17:"CHRISTOFER ANTONY";s:9:"apellidos";s:10:"YALE PONCE";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:13.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:13.000000Z";s:6:"correo";s:30:"71988658@institutocajas.edu.pe";s:8:"telefono";s:9:"973873114";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:51;a:13:{s:13:"id_estudiante";i:55;s:3:"dni";s:8:"71944025";s:7:"nombres";s:11:"JAREN JHONY";s:9:"apellidos";s:14:"ORE DE LA CRUZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:12.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:12.000000Z";s:6:"correo";s:30:"71944025@institutocajas.edu.pe";s:8:"telefono";s:9:"978659891";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:52;a:13:{s:13:"id_estudiante";i:54;s:3:"dni";s:8:"71922520";s:7:"nombres";s:10:"JACK YULER";s:9:"apellidos";s:14:"LOYOLA REQUIEN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:10.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:10.000000Z";s:6:"correo";s:30:"71922520@institutocajas.edu.pe";s:8:"telefono";s:9:"968475067";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:53;a:13:{s:13:"id_estudiante";i:53;s:3:"dni";s:8:"71849439";s:7:"nombres";s:13:"JAMYL BRANDOM";s:9:"apellidos";s:10:"LUIS GOMEZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:45:09.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:09.000000Z";s:6:"correo";s:30:"71849439@institutocajas.edu.pe";s:8:"telefono";s:9:"920504763";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:54;a:13:{s:13:"id_estudiante";i:52;s:3:"dni";s:8:"71607320";s:7:"nombres";s:7:"ANSELMO";s:9:"apellidos";s:19:"ALMINAGORDA ALMERCO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:08.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:08.000000Z";s:6:"correo";s:30:"71607320@institutocajas.edu.pe";s:8:"telefono";s:9:"972805067";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:55;a:13:{s:13:"id_estudiante";i:51;s:3:"dni";s:8:"71598363";s:7:"nombres";s:7:"ANTONIO";s:9:"apellidos";s:16:"PRADO HINOSTROZA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:06.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:06.000000Z";s:6:"correo";s:30:"71598363@institutocajas.edu.pe";s:8:"telefono";s:9:"991175654";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:56;a:13:{s:13:"id_estudiante";i:50;s:3:"dni";s:8:"71468748";s:7:"nombres";s:14:"FERNANDO JAIME";s:9:"apellidos";s:13:"ARIAS MALLQUI";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:04.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:04.000000Z";s:6:"correo";s:30:"71468748@institutocajas.edu.pe";s:8:"telefono";s:9:"972600413";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:57;a:13:{s:13:"id_estudiante";i:49;s:3:"dni";s:8:"71450145";s:7:"nombres";s:11:"FLOR JANELA";s:9:"apellidos";s:11:"ROMAN OCHOA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:45:03.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:03.000000Z";s:6:"correo";s:30:"71450145@institutocajas.edu.pe";s:8:"telefono";s:9:"944923644";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:58;a:13:{s:13:"id_estudiante";i:48;s:3:"dni";s:8:"71350180";s:7:"nombres";s:6:"MIGUEL";s:9:"apellidos";s:11:"QUISPE CURO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:02.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:02.000000Z";s:6:"correo";s:30:"71350180@institutocajas.edu.pe";s:8:"telefono";s:9:"925465575";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:59;a:13:{s:13:"id_estudiante";i:47;s:3:"dni";s:8:"71313187";s:7:"nombres";s:12:"FELIX DANIEL";s:9:"apellidos";s:15:"DE LA CRUZ MATA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:45:00.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:45:00.000000Z";s:6:"correo";s:30:"71313187@institutocajas.edu.pe";s:8:"telefono";s:9:"999999999";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:60;a:13:{s:13:"id_estudiante";i:46;s:3:"dni";s:8:"71312970";s:7:"nombres";s:13:"JUNIOR MAICOL";s:9:"apellidos";s:17:"CRISTOBAL TORPOCO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:44:59.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:59.000000Z";s:6:"correo";s:30:"71312970@institutocajas.edu.pe";s:8:"telefono";s:9:"981360545";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:61;a:13:{s:13:"id_estudiante";i:45;s:3:"dni";s:8:"71249797";s:7:"nombres";s:12:"SAUL PATRICK";s:9:"apellidos";s:15:"COTRINA VALERIO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:44:59.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:59.000000Z";s:6:"correo";s:30:"71249797@institutocajas.edu.pe";s:8:"telefono";s:9:"997701605";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:62;a:13:{s:13:"id_estudiante";i:44;s:3:"dni";s:8:"71190421";s:7:"nombres";s:15:"JOS?AS BENJAM?N";s:9:"apellidos";s:15:"TAIPE VELASQUEZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:58.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:58.000000Z";s:6:"correo";s:30:"71190421@institutocajas.edu.pe";s:8:"telefono";s:9:"904699590";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:63;a:13:{s:13:"id_estudiante";i:43;s:3:"dni";s:8:"70853743";s:7:"nombres";s:12:"MANUEL FRANZ";s:9:"apellidos";s:14:"ROSALES YAPIAS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:57.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:57.000000Z";s:6:"correo";s:30:"70853743@institutocajas.edu.pe";s:8:"telefono";s:9:"974718412";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:64;a:13:{s:13:"id_estudiante";i:42;s:3:"dni";s:8:"70693427";s:7:"nombres";s:14:"CARLOS ALFREDO";s:9:"apellidos";s:12:"FALCONI LIRA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:44:57.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:57.000000Z";s:6:"correo";s:30:"70693427@institutocajas.edu.pe";s:8:"telefono";s:9:"987755125";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:65;a:13:{s:13:"id_estudiante";i:41;s:3:"dni";s:8:"70531769";s:7:"nombres";s:16:"BRAYAN SEBASTIAN";s:9:"apellidos";s:13:"RIVAS PIZARRO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:56.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:56.000000Z";s:6:"correo";s:30:"70531769@institutocajas.edu.pe";s:8:"telefono";s:9:"922694680";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:66;a:13:{s:13:"id_estudiante";i:40;s:3:"dni";s:8:"70308211";s:7:"nombres";s:11:"ANTONY JOSE";s:9:"apellidos";s:13:"ALVAREZ POVIS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:44:56.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:56.000000Z";s:6:"correo";s:30:"70308211@institutocajas.edu.pe";s:8:"telefono";s:9:"931364392";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:67;a:13:{s:13:"id_estudiante";i:39;s:3:"dni";s:8:"70302213";s:7:"nombres";s:11:"JOSE MANUEL";s:9:"apellidos";s:14:"PALOMINO BARBA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:55.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:55.000000Z";s:6:"correo";s:30:"70302213@institutocajas.edu.pe";s:8:"telefono";s:9:"931584467";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:68;a:13:{s:13:"id_estudiante";i:38;s:3:"dni";s:8:"62831340";s:7:"nombres";s:14:"CARLOS ALBERTO";s:9:"apellidos";s:14:"MENDOZA PAUCAR";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:54.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:54.000000Z";s:6:"correo";s:30:"62831340@institutocajas.edu.pe";s:8:"telefono";s:9:"900275978";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:69;a:13:{s:13:"id_estudiante";i:37;s:3:"dni";s:8:"61957140";s:7:"nombres";s:13:"GERARDO KEVIN";s:9:"apellidos";s:16:"REYNOSO JAUREGUI";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:44:54.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:54.000000Z";s:6:"correo";s:30:"61957140@institutocajas.edu.pe";s:8:"telefono";s:9:"999999999";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:70;a:13:{s:13:"id_estudiante";i:36;s:3:"dni";s:8:"61712695";s:7:"nombres";s:14:"HILDER YAMPIER";s:9:"apellidos";s:12:"ROCHA HUAROC";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:53.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:53.000000Z";s:6:"correo";s:30:"61712695@institutocajas.edu.pe";s:8:"telefono";s:9:"903094656";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:71;a:13:{s:13:"id_estudiante";i:35;s:3:"dni";s:8:"61342653";s:7:"nombres";s:5:"EMELY";s:9:"apellidos";s:12:"VILA S?NCHEZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:53.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:53.000000Z";s:6:"correo";s:30:"61342653@institutocajas.edu.pe";s:8:"telefono";s:9:"971962556";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:72;a:13:{s:13:"id_estudiante";i:34;s:3:"dni";s:8:"61289866";s:7:"nombres";s:14:"SHIRLEY YAHANA";s:9:"apellidos";s:11:"PEREZ RAMOS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:52.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:52.000000Z";s:6:"correo";s:30:"61289866@institutocajas.edu.pe";s:8:"telefono";s:9:"963084218";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:73;a:13:{s:13:"id_estudiante";i:33;s:3:"dni";s:8:"61206494";s:7:"nombres";s:12:"ANIBAL SMITH";s:9:"apellidos";s:13:"CHAVEZ TORRES";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:51.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:51.000000Z";s:6:"correo";s:30:"61206494@institutocajas.edu.pe";s:8:"telefono";s:9:"904561774";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:74;a:13:{s:13:"id_estudiante";i:32;s:3:"dni";s:8:"61203839";s:7:"nombres";s:13:"AXEL FABRICIO";s:9:"apellidos";s:17:"CAPARO TRUJILLANO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:50.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:50.000000Z";s:6:"correo";s:30:"61203839@institutocajas.edu.pe";s:8:"telefono";s:9:"920523268";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:75;a:13:{s:13:"id_estudiante";i:31;s:3:"dni";s:8:"61159372";s:7:"nombres";s:12:"OSCAR NELSON";s:9:"apellidos";s:13:"NINALAYA VEGA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:49.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:49.000000Z";s:6:"correo";s:30:"61159372@institutocajas.edu.pe";s:8:"telefono";s:9:"947769688";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:76;a:13:{s:13:"id_estudiante";i:30;s:3:"dni";s:8:"61114712";s:7:"nombres";s:14:"RODRIGO ALEXIS";s:9:"apellidos";s:13:"GASPAR ALIAGA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:48.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:48.000000Z";s:6:"correo";s:30:"61114712@institutocajas.edu.pe";s:8:"telefono";s:9:"981760140";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:77;a:13:{s:13:"id_estudiante";i:29;s:3:"dni";s:8:"61061388";s:7:"nombres";s:13:"ALEXIS YESHUA";s:9:"apellidos";s:13:"FELIX CORDOVA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:45.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:45.000000Z";s:6:"correo";s:30:"61061388@institutocajas.edu.pe";s:8:"telefono";s:9:"976137483";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:78;a:13:{s:13:"id_estudiante";i:28;s:3:"dni";s:8:"61061245";s:7:"nombres";s:12:"JUAN GABRIEL";s:9:"apellidos";s:12:"LOPEZ PARADO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:44.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:44.000000Z";s:6:"correo";s:30:"61061245@institutocajas.edu.pe";s:8:"telefono";s:9:"916962100";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:79;a:13:{s:13:"id_estudiante";i:27;s:3:"dni";s:8:"61060784";s:7:"nombres";s:14:"RODRIGO ALONSO";s:9:"apellidos";s:18:"CONTRERAS TRUJILLO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:42.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:42.000000Z";s:6:"correo";s:30:"61060784@institutocajas.edu.pe";s:8:"telefono";s:9:"970189208";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:80;a:13:{s:13:"id_estudiante";i:26;s:3:"dni";s:8:"60981811";s:7:"nombres";s:15:"DIEGO SEBASTIAN";s:9:"apellidos";s:14:"ALANYA GAMARRA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:41.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:41.000000Z";s:6:"correo";s:30:"60981811@institutocajas.edu.pe";s:8:"telefono";s:9:"960460948";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:81;a:13:{s:13:"id_estudiante";i:25;s:3:"dni";s:8:"60931370";s:7:"nombres";s:15:"MARIELA XIOMARA";s:9:"apellidos";s:14:"CHANCOS HUAMAN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:40.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:40.000000Z";s:6:"correo";s:30:"60931370@institutocajas.edu.pe";s:8:"telefono";s:9:"904409401";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:82;a:13:{s:13:"id_estudiante";i:24;s:3:"dni";s:8:"60905690";s:7:"nombres";s:13:"YOSELIN SOFIA";s:9:"apellidos";s:11:"CHUCO PEREZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:39.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:39.000000Z";s:6:"correo";s:30:"60905690@institutocajas.edu.pe";s:8:"telefono";s:9:"932409973";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:83;a:13:{s:13:"id_estudiante";i:23;s:3:"dni";s:8:"60891297";s:7:"nombres";s:11:"JOSEP TAYWA";s:9:"apellidos";s:11:"TUNQUE MEZA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:39.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:39.000000Z";s:6:"correo";s:30:"60891297@institutocajas.edu.pe";s:8:"telefono";s:9:"988552195";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:84;a:13:{s:13:"id_estudiante";i:22;s:3:"dni";s:8:"60847274";s:7:"nombres";s:12:"CARLOS JOSUE";s:9:"apellidos";s:10:"RAMOS MOYA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:38.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:38.000000Z";s:6:"correo";s:30:"60847274@institutocajas.edu.pe";s:8:"telefono";s:9:"926151306";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:85;a:13:{s:13:"id_estudiante";i:21;s:3:"dni";s:8:"60846946";s:7:"nombres";s:13:"STEVEN EFRAIN";s:9:"apellidos";s:15:"ATAU DE LA CRUZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:37.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:37.000000Z";s:6:"correo";s:30:"60846946@institutocajas.edu.pe";s:8:"telefono";s:9:"985998883";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:86;a:13:{s:13:"id_estudiante";i:20;s:3:"dni";s:8:"60829841";s:7:"nombres";s:18:"CRISTHIAN ESNAIDER";s:9:"apellidos";s:15:"RIVERA AUJATOMA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:36.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:36.000000Z";s:6:"correo";s:30:"60829841@institutocajas.edu.pe";s:8:"telefono";s:9:"931109628";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:87;a:13:{s:13:"id_estudiante";i:19;s:3:"dni";s:8:"60761676";s:7:"nombres";s:16:"ADRIAN ALEJANDRO";s:9:"apellidos";s:16:"VALENCIA SANCHEZ";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:34.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:34.000000Z";s:6:"correo";s:30:"60761676@institutocajas.edu.pe";s:8:"telefono";s:9:"900651800";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:88;a:13:{s:13:"id_estudiante";i:18;s:3:"dni";s:8:"60761106";s:7:"nombres";s:12:"HENRY DANIEL";s:9:"apellidos";s:17:"VILCHEZ CAMAVILCA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"VI";s:10:"created_at";s:27:"2026-11-23T05:44:32.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:32.000000Z";s:6:"correo";s:30:"60761106@institutocajas.edu.pe";s:8:"telefono";s:9:"930293068";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:89;a:13:{s:13:"id_estudiante";i:17;s:3:"dni";s:8:"60744985";s:7:"nombres";s:12:"ANGIE JANELA";s:9:"apellidos";s:12:"MU?OZ JULIAN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:31.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:31.000000Z";s:6:"correo";s:30:"60744985@institutocajas.edu.pe";s:8:"telefono";s:9:"943859432";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:90;a:13:{s:13:"id_estudiante";i:16;s:3:"dni";s:8:"60733938";s:7:"nombres";s:12:"JOS? EDUARDO";s:9:"apellidos";s:16:"ALARC?N LAUREANO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:30.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:30.000000Z";s:6:"correo";s:30:"60733938@institutocajas.edu.pe";s:8:"telefono";s:9:"961635096";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:91;a:13:{s:13:"id_estudiante";i:15;s:3:"dni";s:8:"60612256";s:7:"nombres";s:9:"JOSE JOEL";s:9:"apellidos";s:13:"CHOQUE ROMERO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:28.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:28.000000Z";s:6:"correo";s:30:"60612256@institutocajas.edu.pe";s:8:"telefono";s:9:"904561774";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:92;a:13:{s:13:"id_estudiante";i:14;s:3:"dni";s:8:"60559919";s:7:"nombres";s:14:"DILBER ESTIBEN";s:9:"apellidos";s:13:"ROQUE HURTADO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:27.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:27.000000Z";s:6:"correo";s:30:"60559919@institutocajas.edu.pe";s:8:"telefono";s:9:"946532107";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:93;a:13:{s:13:"id_estudiante";i:13;s:3:"dni";s:8:"60546167";s:7:"nombres";s:12:"HUBER DANIEL";s:9:"apellidos";s:13:"PAREJAS DURAN";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:25.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:25.000000Z";s:6:"correo";s:30:"60546167@institutocajas.edu.pe";s:8:"telefono";s:9:"927440986";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:94;a:13:{s:13:"id_estudiante";i:12;s:3:"dni";s:8:"60534329";s:7:"nombres";s:15:"JHANPIER SAMAEL";s:9:"apellidos";s:17:"VALDERRAMA ROMERO";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:24.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:24.000000Z";s:6:"correo";s:30:"60534329@institutocajas.edu.pe";s:8:"telefono";s:9:"987171585";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:95;a:13:{s:13:"id_estudiante";i:11;s:3:"dni";s:8:"60514781";s:7:"nombres";s:6:"ANTONY";s:9:"apellidos";s:17:"ROMERO HINOSTROZA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:22.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:22.000000Z";s:6:"correo";s:30:"60514781@institutocajas.edu.pe";s:8:"telefono";s:9:"901631596";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:96;a:13:{s:13:"id_estudiante";i:10;s:3:"dni";s:8:"60256090";s:7:"nombres";s:12:"MIJAEL JAIRO";s:9:"apellidos";s:14:"HUAMAN CHIPANA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:21.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:21.000000Z";s:6:"correo";s:30:"60256090@institutocajas.edu.pe";s:8:"telefono";s:9:"948488994";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:97;a:13:{s:13:"id_estudiante";i:9;s:3:"dni";s:8:"60252847";s:7:"nombres";s:16:"KEMBERLY JOSELYN";s:9:"apellidos";s:16:"TIRACCAYA ALANYA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:20.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:20.000000Z";s:6:"correo";s:30:"60252847@institutocajas.edu.pe";s:8:"telefono";s:9:"965625159";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:98;a:13:{s:13:"id_estudiante";i:8;s:3:"dni";s:8:"60252378";s:7:"nombres";s:11:"ALEX MISAEL";s:9:"apellidos";s:13:"GALLEGOS INGA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:18.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:18.000000Z";s:6:"correo";s:30:"60252378@institutocajas.edu.pe";s:8:"telefono";s:9:"953232173";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:99;a:13:{s:13:"id_estudiante";i:7;s:3:"dni";s:8:"60240757";s:7:"nombres";s:12:"EVELYN MAILY";s:9:"apellidos";s:12:"INGA CURASMA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:17.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:17.000000Z";s:6:"correo";s:30:"60240757@institutocajas.edu.pe";s:8:"telefono";s:9:"931620865";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:100;a:13:{s:13:"id_estudiante";i:6;s:3:"dni";s:8:"60232991";s:7:"nombres";s:12:"LUDWIN PEDRO";s:9:"apellidos";s:10:"ROJAS RIOS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:16.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:16.000000Z";s:6:"correo";s:30:"60232991@institutocajas.edu.pe";s:8:"telefono";s:9:"975652055";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:101;a:13:{s:13:"id_estudiante";i:5;s:3:"dni";s:8:"60208444";s:7:"nombres";s:15:"JUAN SEBASTHIAN";s:9:"apellidos";s:15:"GUERREROS RICRA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:14.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:14.000000Z";s:6:"correo";s:30:"60208444@institutocajas.edu.pe";s:8:"telefono";s:9:"968243589";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:102;a:13:{s:13:"id_estudiante";i:4;s:3:"dni";s:8:"60100950";s:7:"nombres";s:12:"EVELIN NOEMI";s:9:"apellidos";s:16:"CAPCHA ADVINCULA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:13.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:13.000000Z";s:6:"correo";s:30:"60100950@institutocajas.edu.pe";s:8:"telefono";s:9:"954738955";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:103;a:13:{s:13:"id_estudiante";i:3;s:3:"dni";s:8:"60085115";s:7:"nombres";s:13:"YHENNER YEINS";s:9:"apellidos";s:14:"ALCANTARA CAJA";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:11.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:11.000000Z";s:6:"correo";s:30:"60085115@institutocajas.edu.pe";s:8:"telefono";s:9:"927435682";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:104;a:13:{s:13:"id_estudiante";i:2;s:3:"dni";s:8:"60005716";s:7:"nombres";s:11:"MAYLIN MARY";s:9:"apellidos";s:20:"ZAMUDIO JUAN DE DIOS";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"IV";s:10:"created_at";s:27:"2026-11-23T05:44:10.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:10.000000Z";s:6:"correo";s:30:"60005716@institutocajas.edu.pe";s:8:"telefono";s:9:"952374069";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}i:105;a:13:{s:13:"id_estudiante";i:1;s:3:"dni";s:8:"60005485";s:7:"nombres";s:12:"RUTT KATERIN";s:9:"apellidos";s:12:"VILLA JACOBI";s:17:"programa_estudios";s:27:"DISEÑO Y PROGRAMACIÓN WEB";s:8:"semestre";s:2:"II";s:10:"created_at";s:27:"2026-11-23T05:44:09.000000Z";s:10:"updated_at";s:27:"2026-11-23T05:44:09.000000Z";s:6:"correo";s:30:"60005485@institutocajas.edu.pe";s:8:"telefono";s:9:"928812621";s:9:"direccion";N;s:6:"estado";s:6:"Activo";s:8:"foto_url";N;}}', 1795756038);
INSERT INTO public.cache (key, value, expiration) VALUES ('laravel-cache-asistente_datos_sistema', 's:418:"Datos actuales del sistema (solo cantidades):
- estudiantes: 106 en total; por estado (Activo: 106); por programa_estudios (DISEÑO Y PROGRAMACIÓN WEB: 106); por semestre (II: 41, VI: 28, IV: 37).
- empresas: 4 en total; por estado (sin dato: 3, SUSPENSION TEMPORAL: 1).
- módulos profesionales: 3 en total.
- constancias emitidas: 1 en total.
- asignaciones de asesores: 15 en total.
- evidencias EFSRT: 0 en total.";', 1795754124);


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: calendario_notas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: calendario_tareas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.calendario_tareas (id_tarea, id_usuario, texto, hecha, orden, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 23, 'hola', true, 1, '2026-11-26 06:10:55-05');
INSERT INTO public.calendario_tareas (id_tarea, id_usuario, texto, hecha, orden, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 23, 'revison de calendario', true, 2, '2026-11-26 06:11:03-05');
INSERT INTO public.calendario_tareas (id_tarea, id_usuario, texto, hecha, orden, created_at) OVERRIDING SYSTEM VALUE VALUES (4, 1, 'Enviar Regalos', false, 2, '2026-11-26 23:30:08-05');
INSERT INTO public.calendario_tareas (id_tarea, id_usuario, texto, hecha, orden, created_at) OVERRIDING SYSTEM VALUE VALUES (3, 1, 'Saludar', true, 1, '2026-11-26 23:30:02-05');


--
-- Data for Name: carpetas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: constancias_emitidas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.constancias_emitidas (id_constancia, id_estudiante, id_modulo, id_administrador, codigo_documento, tipo_emision, fecha_emision, ruta_archivo_pdf, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 98, 1, 1, 'CONST-EFSRT-2026-GMX6', 'Original', '2026-11-23 05:28:08-05', 'storage/constancias/constancia_CONST-EFSRT-2026-GMX6.pdf', '2026-11-23 05:28:08-05');


--
-- Data for Name: contactos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: docentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.docentes (id_docente, id_usuario, codigo, departamento, grado, especialidad, condicion, telefono, capacidad, sede, biografia, created_at, updated_at) VALUES (3, 2, 'DOC-2026-002', 'Computación e Informática', 'Ingeniero de Sistemas', 'Desarrollo Web y Bases de Datos', NULL, '+51 900 000 000', 12, 'Campus Central – Sede Lima', NULL, '2026-11-08 19:23:04.765096', '2026-11-08 19:23:04.765096');


--
-- Data for Name: documentos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: empresas_convenio; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.empresas_convenio (id_empresa, ruc, razon_social, supervisor_empresa_nombre, supervisor_empresa_cargo, estado_convenio, documento_convenio_ruta, created_at, updated_at, estado, condicion, tipo_contribuyente, departamento, provincia, distrito, ubigeo, telefono, correo_electronico, direccion) OVERRIDING SYSTEM VALUE VALUES (2, '20666987652', 'Soluciones Digitales Centro E.I.R.L.', 'Ana María Poma', 'Gerente de Proyectos Web', 'Activo', 'storage/convenios/convenio_soluciones.pdf', '2026-10-29 15:23:20.25242-05', '2026-10-29 15:23:20.25242-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.empresas_convenio (id_empresa, ruc, razon_social, supervisor_empresa_nombre, supervisor_empresa_cargo, estado_convenio, documento_convenio_ruta, created_at, updated_at, estado, condicion, tipo_contribuyente, departamento, provincia, distrito, ubigeo, telefono, correo_electronico, direccion) OVERRIDING SYSTEM VALUE VALUES (4, '12345678910', 'Soluciones Informáticas Andinas S.A.C.xdxd', 'Carlos Mendoza', 'Líder Técnico', 'Activo', 'storage/convenios/convenio_prueba.pdf', '2026-11-04 20:41:52-05', '2026-11-04 20:41:52-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.empresas_convenio (id_empresa, ruc, razon_social, supervisor_empresa_nombre, supervisor_empresa_cargo, estado_convenio, documento_convenio_ruta, created_at, updated_at, estado, condicion, tipo_contribuyente, departamento, provincia, distrito, ubigeo, telefono, correo_electronico, direccion) OVERRIDING SYSTEM VALUE VALUES (1, '20555123451', 'Software Center Huancayo S.A.C.', 'Elmas Capito', 'Líder Técnico / CTO', 'Suspendido', 'storage/convenios/convenio_sw_center.pdf', '2026-10-29 15:23:20.25242-05', '2026-11-04 21:00:41-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.empresas_convenio (id_empresa, ruc, razon_social, supervisor_empresa_nombre, supervisor_empresa_cargo, estado_convenio, documento_convenio_ruta, created_at, updated_at, estado, condicion, tipo_contribuyente, departamento, provincia, distrito, ubigeo, telefono, correo_electronico, direccion) OVERRIDING SYSTEM VALUE VALUES (9, '20552103816', 'AGROLIGHT PERU S.A.C.', NULL, NULL, 'Activo', NULL, '2026-11-27 03:21:22-05', '2026-11-27 03:21:22-05', 'SUSPENSION TEMPORAL', 'HABIDO', NULL, 'LIMA', 'LIMA', 'SANTA ANITA', '150137', NULL, NULL, 'PJ. JORGE BASADRE NRO 158 URB. POP LA UNIVERSAL 2DA ET.');


--
-- Data for Name: estudiantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (1, '60005485', 'RUTT KATERIN', 'VILLA JACOBI', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:09-05', '2026-11-23 00:44:09-05', '60005485@institutocajas.edu.pe', '928812621', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (2, '60005716', 'MAYLIN MARY', 'ZAMUDIO JUAN DE DIOS', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:10-05', '2026-11-23 00:44:10-05', '60005716@institutocajas.edu.pe', '952374069', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (3, '60085115', 'YHENNER YEINS', 'ALCANTARA CAJA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:11-05', '2026-11-23 00:44:11-05', '60085115@institutocajas.edu.pe', '927435682', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (4, '60100950', 'EVELIN NOEMI', 'CAPCHA ADVINCULA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:13-05', '2026-11-23 00:44:13-05', '60100950@institutocajas.edu.pe', '954738955', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (5, '60208444', 'JUAN SEBASTHIAN', 'GUERREROS RICRA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:14-05', '2026-11-23 00:44:14-05', '60208444@institutocajas.edu.pe', '968243589', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (6, '60232991', 'LUDWIN PEDRO', 'ROJAS RIOS', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:16-05', '2026-11-23 00:44:16-05', '60232991@institutocajas.edu.pe', '975652055', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (7, '60240757', 'EVELYN MAILY', 'INGA CURASMA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:17-05', '2026-11-23 00:44:17-05', '60240757@institutocajas.edu.pe', '931620865', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (8, '60252378', 'ALEX MISAEL', 'GALLEGOS INGA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:18-05', '2026-11-23 00:44:18-05', '60252378@institutocajas.edu.pe', '953232173', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (9, '60252847', 'KEMBERLY JOSELYN', 'TIRACCAYA ALANYA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:20-05', '2026-11-23 00:44:20-05', '60252847@institutocajas.edu.pe', '965625159', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (10, '60256090', 'MIJAEL JAIRO', 'HUAMAN CHIPANA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:21-05', '2026-11-23 00:44:21-05', '60256090@institutocajas.edu.pe', '948488994', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (11, '60514781', 'ANTONY', 'ROMERO HINOSTROZA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:22-05', '2026-11-23 00:44:22-05', '60514781@institutocajas.edu.pe', '901631596', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (12, '60534329', 'JHANPIER SAMAEL', 'VALDERRAMA ROMERO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:24-05', '2026-11-23 00:44:24-05', '60534329@institutocajas.edu.pe', '987171585', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (13, '60546167', 'HUBER DANIEL', 'PAREJAS DURAN', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:25-05', '2026-11-23 00:44:25-05', '60546167@institutocajas.edu.pe', '927440986', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (14, '60559919', 'DILBER ESTIBEN', 'ROQUE HURTADO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:27-05', '2026-11-23 00:44:27-05', '60559919@institutocajas.edu.pe', '946532107', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (15, '60612256', 'JOSE JOEL', 'CHOQUE ROMERO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:28-05', '2026-11-23 00:44:28-05', '60612256@institutocajas.edu.pe', '904561774', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (16, '60733938', 'JOS? EDUARDO', 'ALARC?N LAUREANO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:30-05', '2026-11-23 00:44:30-05', '60733938@institutocajas.edu.pe', '961635096', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (17, '60744985', 'ANGIE JANELA', 'MU?OZ JULIAN', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:31-05', '2026-11-23 00:44:31-05', '60744985@institutocajas.edu.pe', '943859432', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (18, '60761106', 'HENRY DANIEL', 'VILCHEZ CAMAVILCA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:44:32-05', '2026-11-23 00:44:32-05', '60761106@institutocajas.edu.pe', '930293068', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (19, '60761676', 'ADRIAN ALEJANDRO', 'VALENCIA SANCHEZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:34-05', '2026-11-23 00:44:34-05', '60761676@institutocajas.edu.pe', '900651800', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (20, '60829841', 'CRISTHIAN ESNAIDER', 'RIVERA AUJATOMA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:36-05', '2026-11-23 00:44:36-05', '60829841@institutocajas.edu.pe', '931109628', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (21, '60846946', 'STEVEN EFRAIN', 'ATAU DE LA CRUZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:37-05', '2026-11-23 00:44:37-05', '60846946@institutocajas.edu.pe', '985998883', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (22, '60847274', 'CARLOS JOSUE', 'RAMOS MOYA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:38-05', '2026-11-23 00:44:38-05', '60847274@institutocajas.edu.pe', '926151306', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (23, '60891297', 'JOSEP TAYWA', 'TUNQUE MEZA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:39-05', '2026-11-23 00:44:39-05', '60891297@institutocajas.edu.pe', '988552195', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (24, '60905690', 'YOSELIN SOFIA', 'CHUCO PEREZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:39-05', '2026-11-23 00:44:39-05', '60905690@institutocajas.edu.pe', '932409973', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (25, '60931370', 'MARIELA XIOMARA', 'CHANCOS HUAMAN', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:40-05', '2026-11-23 00:44:40-05', '60931370@institutocajas.edu.pe', '904409401', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (26, '60981811', 'DIEGO SEBASTIAN', 'ALANYA GAMARRA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:41-05', '2026-11-23 00:44:41-05', '60981811@institutocajas.edu.pe', '960460948', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (27, '61060784', 'RODRIGO ALONSO', 'CONTRERAS TRUJILLO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:42-05', '2026-11-23 00:44:42-05', '61060784@institutocajas.edu.pe', '970189208', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (28, '61061245', 'JUAN GABRIEL', 'LOPEZ PARADO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:44-05', '2026-11-23 00:44:44-05', '61061245@institutocajas.edu.pe', '916962100', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (29, '61061388', 'ALEXIS YESHUA', 'FELIX CORDOVA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:45-05', '2026-11-23 00:44:45-05', '61061388@institutocajas.edu.pe', '976137483', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (30, '61114712', 'RODRIGO ALEXIS', 'GASPAR ALIAGA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:48-05', '2026-11-23 00:44:48-05', '61114712@institutocajas.edu.pe', '981760140', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (31, '61159372', 'OSCAR NELSON', 'NINALAYA VEGA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:49-05', '2026-11-23 00:44:49-05', '61159372@institutocajas.edu.pe', '947769688', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (32, '61203839', 'AXEL FABRICIO', 'CAPARO TRUJILLANO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:50-05', '2026-11-23 00:44:50-05', '61203839@institutocajas.edu.pe', '920523268', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (33, '61206494', 'ANIBAL SMITH', 'CHAVEZ TORRES', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:51-05', '2026-11-23 00:44:51-05', '61206494@institutocajas.edu.pe', '904561774', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (34, '61289866', 'SHIRLEY YAHANA', 'PEREZ RAMOS', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:52-05', '2026-11-23 00:44:52-05', '61289866@institutocajas.edu.pe', '963084218', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (35, '61342653', 'EMELY', 'VILA S?NCHEZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:53-05', '2026-11-23 00:44:53-05', '61342653@institutocajas.edu.pe', '971962556', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (36, '61712695', 'HILDER YAMPIER', 'ROCHA HUAROC', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:53-05', '2026-11-23 00:44:53-05', '61712695@institutocajas.edu.pe', '903094656', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (37, '61957140', 'GERARDO KEVIN', 'REYNOSO JAUREGUI', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:44:54-05', '2026-11-23 00:44:54-05', '61957140@institutocajas.edu.pe', '999999999', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (38, '62831340', 'CARLOS ALBERTO', 'MENDOZA PAUCAR', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:54-05', '2026-11-23 00:44:54-05', '62831340@institutocajas.edu.pe', '900275978', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (39, '70302213', 'JOSE MANUEL', 'PALOMINO BARBA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:55-05', '2026-11-23 00:44:55-05', '70302213@institutocajas.edu.pe', '931584467', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (40, '70308211', 'ANTONY JOSE', 'ALVAREZ POVIS', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:44:56-05', '2026-11-23 00:44:56-05', '70308211@institutocajas.edu.pe', '931364392', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (41, '70531769', 'BRAYAN SEBASTIAN', 'RIVAS PIZARRO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:44:56-05', '2026-11-23 00:44:56-05', '70531769@institutocajas.edu.pe', '922694680', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (42, '70693427', 'CARLOS ALFREDO', 'FALCONI LIRA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:44:57-05', '2026-11-23 00:44:57-05', '70693427@institutocajas.edu.pe', '987755125', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (43, '70853743', 'MANUEL FRANZ', 'ROSALES YAPIAS', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:57-05', '2026-11-23 00:44:57-05', '70853743@institutocajas.edu.pe', '974718412', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (44, '71190421', 'JOS?AS BENJAM?N', 'TAIPE VELASQUEZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:44:58-05', '2026-11-23 00:44:58-05', '71190421@institutocajas.edu.pe', '904699590', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (45, '71249797', 'SAUL PATRICK', 'COTRINA VALERIO', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:44:59-05', '2026-11-23 00:44:59-05', '71249797@institutocajas.edu.pe', '997701605', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (46, '71312970', 'JUNIOR MAICOL', 'CRISTOBAL TORPOCO', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:44:59-05', '2026-11-23 00:44:59-05', '71312970@institutocajas.edu.pe', '981360545', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (47, '71313187', 'FELIX DANIEL', 'DE LA CRUZ MATA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:00-05', '2026-11-23 00:45:00-05', '71313187@institutocajas.edu.pe', '999999999', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (48, '71350180', 'MIGUEL', 'QUISPE CURO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:02-05', '2026-11-23 00:45:02-05', '71350180@institutocajas.edu.pe', '925465575', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (49, '71450145', 'FLOR JANELA', 'ROMAN OCHOA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:03-05', '2026-11-23 00:45:03-05', '71450145@institutocajas.edu.pe', '944923644', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (50, '71468748', 'FERNANDO JAIME', 'ARIAS MALLQUI', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:04-05', '2026-11-23 00:45:04-05', '71468748@institutocajas.edu.pe', '972600413', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (51, '71598363', 'ANTONIO', 'PRADO HINOSTROZA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:06-05', '2026-11-23 00:45:06-05', '71598363@institutocajas.edu.pe', '991175654', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (52, '71607320', 'ANSELMO', 'ALMINAGORDA ALMERCO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:08-05', '2026-11-23 00:45:08-05', '71607320@institutocajas.edu.pe', '972805067', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (53, '71849439', 'JAMYL BRANDOM', 'LUIS GOMEZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:09-05', '2026-11-23 00:45:09-05', '71849439@institutocajas.edu.pe', '920504763', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (54, '71922520', 'JACK YULER', 'LOYOLA REQUIEN', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:10-05', '2026-11-23 00:45:10-05', '71922520@institutocajas.edu.pe', '968475067', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (55, '71944025', 'JAREN JHONY', 'ORE DE LA CRUZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:12-05', '2026-11-23 00:45:12-05', '71944025@institutocajas.edu.pe', '978659891', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (56, '71988658', 'CHRISTOFER ANTONY', 'YALE PONCE', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:13-05', '2026-11-23 00:45:13-05', '71988658@institutocajas.edu.pe', '973873114', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (57, '72309767', 'LEONARDO FAVIO', 'COTERA ARRIETA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:14-05', '2026-11-23 00:45:14-05', '72309767@institutocajas.edu.pe', '924654441', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (58, '72438097', 'SADITH DANITZA', 'MELO CABANILLAS', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:14-05', '2026-11-23 00:45:14-05', '72438097@institutocajas.edu.pe', '970894017', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (59, '72571243', 'GABRIEL FRANCIS', 'RAPRI CAPCHA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:16-05', '2026-11-23 00:45:16-05', '72571243@institutocajas.edu.pe', '958684615', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (60, '72670265', 'JEMINA', 'SULLCA VARGAS', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:17-05', '2026-11-23 00:45:17-05', '72670265@institutocajas.edu.pe', '904561774', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (61, '72748273', 'TATIANA DAMARIS', 'SOLORZANO CHAUCA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:18-05', '2026-11-23 00:45:18-05', '72748273@institutocajas.edu.pe', '951038386', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (62, '72979547', 'ABRAHAM', 'PAREJAS ARAUJO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:19-05', '2026-11-23 00:45:19-05', '72979547@institutocajas.edu.pe', '906250556', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (63, '73027729', 'SAMIRA TAYLI', 'SOLLER RIVERA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:20-05', '2026-11-23 00:45:20-05', '73027729@institutocajas.edu.pe', '964902460', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (64, '73127152', 'FABRIZZIO RICARDO', 'ROJAS POMA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:22-05', '2026-11-23 00:45:22-05', '73127152@institutocajas.edu.pe', '930509329', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (65, '73145710', 'ELEAZAR NATANAEL', 'MEJICO DE LA CRUZ', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:23-05', '2026-11-23 00:45:23-05', '73145710@institutocajas.edu.pe', '935691026', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (66, '73423141', 'ANAMARIA DEL PILAR', 'SANCHEZ BALDEON', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:24-05', '2026-11-23 00:45:24-05', '73423141@institutocajas.edu.pe', '903180962', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (67, '73611118', 'JHON EDGAR', 'CONTRERAS HINOSTROZA', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:26-05', '2026-11-23 00:45:26-05', '73611118@institutocajas.edu.pe', '972163584', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (68, '73616299', 'MAX EDWARD', 'OLARTE ZUASNABAR', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:26-05', '2026-11-23 00:45:26-05', '73616299@institutocajas.edu.pe', '992029773', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (69, '73779071', 'CHRIS GISENIA', 'VALERO CAINICELA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:28-05', '2026-11-23 00:45:28-05', '73779071@institutocajas.edu.pe', '986602090', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (70, '73936233', 'GIANCARLO ABEL', 'MEZA HUAMAN', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:29-05', '2026-11-23 00:45:29-05', '73936233@institutocajas.edu.pe', '925602410', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (71, '74801208', 'BIANCA NATHALY', 'CALSIN JULI', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:30-05', '2026-11-23 00:45:30-05', '74801208@institutocajas.edu.pe', '936260986', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (72, '74805347', 'ZULEMA DELCY', 'ROJAS SUC?O', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:31-05', '2026-11-23 00:45:31-05', '74805347@institutocajas.edu.pe', '977568296', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (73, '74885840', 'ALVARO RENATO', 'MAGUI?A SUTACORO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:32-05', '2026-11-23 00:45:32-05', '74885840@institutocajas.edu.pe', '925423424', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (74, '74961805', 'GIANELLA GIOVANA', 'POMA ATAHUAMAN', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:33-05', '2026-11-23 00:45:33-05', '74961805@institutocajas.edu.pe', '931239168', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (75, '74978089', 'JOSE LUIS', 'SANTOS ALLER', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:35-05', '2026-11-23 00:45:35-05', '74978089@institutocajas.edu.pe', '901009168', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (76, '75026154', 'SERGIO ALEX', 'ARREDONDO VALERO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:37-05', '2026-11-23 00:45:37-05', '75026154@institutocajas.edu.pe', '920864203', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (77, '75047364', 'FRANCO OMAR', 'DAVILA SAMANIEGO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:38-05', '2026-11-23 00:45:38-05', '75047364@institutocajas.edu.pe', '931514061', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (78, '75100007', 'THALIA YENIFER', 'LLANTOY APOLINARIO', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:39-05', '2026-11-23 00:45:39-05', '75100007@institutocajas.edu.pe', '920306840', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (79, '75100055', 'ELVIS FARIT', 'MORALES SEGURA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:41-05', '2026-11-23 00:45:41-05', '75100055@institutocajas.edu.pe', '918185504', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (80, '75212411', 'OSWALDO JUNIOR', 'PEREZ PAREDES', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:42-05', '2026-11-23 00:45:42-05', '75212411@institutocajas.edu.pe', '910509218', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (81, '75241371', 'KALET MAURICIO', 'CCASANI PAINADO', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:43-05', '2026-11-23 00:45:43-05', '75241371@institutocajas.edu.pe', '900771943', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (82, '75285913', 'DENZEL DUDIKOFF', 'FERNANDEZ HUACCHO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:44-05', '2026-11-23 00:45:44-05', '75285913@institutocajas.edu.pe', '931892438', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (83, '75435152', 'CARLOS JOSE', 'PE?A PONCE', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:45-05', '2026-11-23 00:45:45-05', '75435152@institutocajas.edu.pe', '929996163', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (84, '75460820', 'ADHERLY JESUS', 'MEDRANO ROJAS', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:47-05', '2026-11-23 00:45:47-05', '75460820@institutocajas.edu.pe', '929956310', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (85, '75557502', 'EXAR WILLIAMS', 'ATAO PAUCAR', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:48-05', '2026-11-23 00:45:48-05', '75557502@institutocajas.edu.pe', '916694173', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (86, '75575578', 'ANNETTE STEFANY', 'LOZANO CASO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:49-05', '2026-11-23 00:45:49-05', '75575578@institutocajas.edu.pe', '921395935', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (87, '75610161', 'GUSTAVO PIERO', 'GRANADOS ORELLANA', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:50-05', '2026-11-23 00:45:50-05', '75610161@institutocajas.edu.pe', '948368662', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (88, '75655848', 'JOSE JHEFERSON', 'CARDENAS CAMARGO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:52-05', '2026-11-23 00:45:52-05', '75655848@institutocajas.edu.pe', '924153238', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (89, '75689415', 'CARLOS JESUS', 'HUAYTA MELCHOR', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:53-05', '2026-11-23 00:45:53-05', '75689415@institutocajas.edu.pe', '904396512', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (90, '75704479', 'ANGY NIKOLL', 'HUARCAYA CULQUI', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:54-05', '2026-11-23 00:45:54-05', '75704479@institutocajas.edu.pe', '971283090', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (91, '75889758', 'ANTONY JHOSEPS', 'FLORES CASTILLON', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:45:56-05', '2026-11-23 00:45:56-05', '75889758@institutocajas.edu.pe', '962238836', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (92, '75971346', 'RICARDO SAMUEL', 'CORONEL ROJAS', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:45:57-05', '2026-11-23 00:45:57-05', '75971346@institutocajas.edu.pe', '984936361', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (93, '75990566', 'JUAN ARTURO', 'ADARMES ZENTENO', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:45:58-05', '2026-11-23 00:45:58-05', '75990566@institutocajas.edu.pe', '978901387', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (94, '75991660', 'CYNTHIA ABIGAIL', 'HUERTA YLANZO', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:46:00-05', '2026-11-23 00:46:00-05', '75991660@institutocajas.edu.pe', '991213838', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (95, '75995021', 'MORELIA FATIMA', 'LAZO HUAMAN', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:46:01-05', '2026-11-23 00:46:01-05', '75995021@institutocajas.edu.pe', '912661254', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (96, '75998829', 'RONALDO JESUS', 'CAMPOS CALLUPE', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:46:03-05', '2026-11-23 00:46:03-05', '75998829@institutocajas.edu.pe', '968393666', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (97, '76120800', 'MARITH SELENA', 'PACHECO TORRES', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:46:04-05', '2026-11-23 00:46:04-05', '76120800@institutocajas.edu.pe', '929479984', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (98, '76525718', 'CARLOS DANIEL', 'HUAYCA?E FLORES', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:46:06-05', '2026-11-23 00:46:06-05', '76525718@institutocajas.edu.pe', '904229462', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (99, '76560607', 'PEDRO JHAMPIERE', 'VIVAS MEZA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:46:08-05', '2026-11-23 00:46:08-05', '76560607@institutocajas.edu.pe', '983731486', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (100, '76840236', 'WILLIAM FLORENCIO', 'HUANUCO CORI', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:46:09-05', '2026-11-23 00:46:09-05', '76840236@institutocajas.edu.pe', '997282373', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (101, '77277836', 'ASTRID LUCERO', 'ARROYO PRIALE', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:46:11-05', '2026-11-23 00:46:11-05', '77277836@institutocajas.edu.pe', '951141619', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (102, '77356832', 'JUAN BEN HUR', 'PACHECO HUAMAN', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:46:12-05', '2026-11-23 00:46:12-05', '77356832@institutocajas.edu.pe', '921528201', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (103, '77797728', 'MOISES', 'MOLINA CRISPIN', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:46:14-05', '2026-11-23 00:46:14-05', '77797728@institutocajas.edu.pe', '953856494', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (104, '77903101', 'HELEN', 'CHUQUILLANQUI APOLINARIO', 'DISEÑO Y PROGRAMACIÓN WEB', 'II', '2026-11-23 00:46:15-05', '2026-11-23 00:46:15-05', '77903101@institutocajas.edu.pe', '902351973', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (106, '78109774', 'AISHA YADHIRA', 'MIGUEL HUAMANI', 'DISEÑO Y PROGRAMACIÓN WEB', 'VI', '2026-11-23 00:46:16-05', '2026-11-23 00:46:16-05', '78109774@institutocajas.edu.pe', '936145081', NULL, 'Activo', NULL);
INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado, foto_url) OVERRIDING SYSTEM VALUE VALUES (105, '78005772', 'ALCEDES IDER', 'ALIAGA MENDOZA', 'DISEÑO Y PROGRAMACIÓN WEB', 'IV', '2026-11-23 00:46:15-05', '2026-11-27 03:55:56-05', '78005772@institutocajas.edu.pe', '990041526', NULL, 'Activo', '/storage/estudiantes/BlAPPUuECByB6Bg8L4VZjqZXAQ922Wa9hDhcvqgW.jpg');


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.eventos (id_evento, id_usuario, id_empresa, id_estudiante, titulo, nota, tipo, fecha, hora_inicio, hora_fin, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (1, 23, NULL, NULL, 'xd', NULL, 'Visita', '2026-11-12', '09:00:00', '10:00:00', '2026-11-26 06:02:28-05', '2026-11-26 06:02:28-05');
INSERT INTO public.eventos (id_evento, id_usuario, id_empresa, id_estudiante, titulo, nota, tipo, fecha, hora_inicio, hora_fin, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (2, 23, NULL, NULL, 'xdd', NULL, 'Visita', '2026-11-21', '04:45:00', '10:00:00', '2026-11-26 06:07:41-05', '2026-11-26 06:07:41-05');
INSERT INTO public.eventos (id_evento, id_usuario, id_empresa, id_estudiante, titulo, nota, tipo, fecha, hora_inicio, hora_fin, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (3, 1, NULL, NULL, 'Cumpleaños', NULL, 'Entrega', '2026-11-26', '09:00:00', '10:00:00', '2026-11-26 23:29:54-05', '2026-11-26 23:29:54-05');
INSERT INTO public.eventos (id_evento, id_usuario, id_empresa, id_estudiante, titulo, nota, tipo, fecha, hora_inicio, hora_fin, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (4, 2, NULL, NULL, 'cmpleaños2', NULL, 'Otro', '2026-11-27', '09:00:00', '10:00:00', '2026-11-26 23:57:40-05', '2026-11-26 23:57:40-05');


--
-- Data for Name: evidencias_efsrt; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: expediente_efsrt; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.expediente_efsrt (id_expediente, id_estudiante, id_modulo, id_empresa, id_docente_asesor, horas_acumuladas, estado_efsrt, portafolio_fisico_revisado, observaciones, fecha_validacion, created_at, updated_at, fecha_inicio) OVERRIDING SYSTEM VALUE VALUES (6, 105, 1, 9, 2, 0, 'No efectuó', false, NULL, NULL, '2026-11-27 04:13:35-05', '2026-11-27 04:13:35-05', '2026-11-26');
INSERT INTO public.expediente_efsrt (id_expediente, id_estudiante, id_modulo, id_empresa, id_docente_asesor, horas_acumuladas, estado_efsrt, portafolio_fisico_revisado, observaciones, fecha_validacion, created_at, updated_at, fecha_inicio) OVERRIDING SYSTEM VALUE VALUES (5, 30, 1, 4, 2, 0, 'No efectuó', false, NULL, NULL, '2026-11-27 03:21:50-05', '2026-11-27 04:13:35-05', '2026-11-26');
INSERT INTO public.expediente_efsrt (id_expediente, id_estudiante, id_modulo, id_empresa, id_docente_asesor, horas_acumuladas, estado_efsrt, portafolio_fisico_revisado, observaciones, fecha_validacion, created_at, updated_at, fecha_inicio) OVERRIDING SYSTEM VALUE VALUES (4, 29, 1, 4, 2, 0, 'No efectuó', false, NULL, NULL, '2026-11-27 03:21:50-05', '2026-11-27 04:13:35-05', '2026-11-26');


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.migrations (id, migration, batch) VALUES (1, '0001_01_01_000000_create_users_table', 1);
INSERT INTO public.migrations (id, migration, batch) VALUES (2, '0001_01_01_000001_create_cache_table', 1);
INSERT INTO public.migrations (id, migration, batch) VALUES (3, '0001_01_01_000002_create_jobs_table', 1);
INSERT INTO public.migrations (id, migration, batch) VALUES (4, '2026_10_29_212200_create_personal_access_tokens_table', 2);
INSERT INTO public.migrations (id, migration, batch) VALUES (5, '2026_11_09_000942_create_docentes_table', 3);
INSERT INTO public.migrations (id, migration, batch) VALUES (6, '2026_11_26_193500_create_notifications_and_preferences', 4);
INSERT INTO public.migrations (id, migration, batch) VALUES (7, '2026_11_26_194000_create_app_datos_table', 5);
INSERT INTO public.migrations (id, migration, batch) VALUES (8, '2026_11_27_000000_add_sunat_details_to_empresas_convenio', 6);
INSERT INTO public.migrations (id, migration, batch) VALUES (9, '2026_11_27_000100_add_practice_details_to_expediente_efsrt', 7);
INSERT INTO public.migrations (id, migration, batch) VALUES (10, '2026_11_27_000200_add_photo_url_to_estudiantes', 8);


--
-- Data for Name: modulos_profesionales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.modulos_profesionales (id_modulo, numero_modulo, nombre_modulo, horas_requeridas, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 1, 'Diseño web y herramientas multimedia', 160, '2026-10-29 15:18:18.607448-05');
INSERT INTO public.modulos_profesionales (id_modulo, numero_modulo, nombre_modulo, horas_requeridas, created_at) OVERRIDING SYSTEM VALUE VALUES (3, 3, 'Integracion de Palicaciones web y moviles', 160, '2026-10-29 15:18:18.607448-05');
INSERT INTO public.modulos_profesionales (id_modulo, numero_modulo, nombre_modulo, horas_requeridas, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 2, 'Integracion de Aplicaciones Web y Moviles', 160, '2026-10-29 15:18:18.607448-05');


--
-- Data for Name: nota_categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.nota_categorias (id_categoria, nombre, color, orden) OVERRIDING SYSTEM VALUE VALUES (1, 'General', '#94a3b8', 1);
INSERT INTO public.nota_categorias (id_categoria, nombre, color, orden) OVERRIDING SYSTEM VALUE VALUES (2, 'Bitácora', '#0ea5e9', 2);
INSERT INTO public.nota_categorias (id_categoria, nombre, color, orden) OVERRIDING SYSTEM VALUE VALUES (3, 'Prácticas', '#10b981', 3);
INSERT INTO public.nota_categorias (id_categoria, nombre, color, orden) OVERRIDING SYSTEM VALUE VALUES (4, 'Ideas', '#f59e0b', 4);
INSERT INTO public.nota_categorias (id_categoria, nombre, color, orden) OVERRIDING SYSTEM VALUE VALUES (5, 'Pendiente', '#f43f5e', 5);


--
-- Data for Name: nota_imagenes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: nota_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.notifications (id, type, notifiable_type, notifiable_id, data, read_at, created_at, updated_at) VALUES ('a400025c-e0f2-449b-abab-75ff98a99ce8', 'App\Notifications\AsignacionRecibida', 'App\Models\User', 2, '{"categoria":"asignaciones","titulo":"Nuevo alumno asignado","detalle":"1 alumno(s) asignado(s) al m\u00f3dulo #1.","vista":"Mis Alumnos"}', NULL, '2026-11-27 03:56:19', '2026-11-27 03:56:19');


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (1, 'App\Models\User', 3, 'efsrt_auth_token', '17718e07b5f5238c09a3a6db766cb1e577662f146dba7a114659392346809f5b', '["*"]', '2026-11-05 22:56:44', NULL, '2026-11-05 22:56:34', '2026-11-05 22:56:44');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (2, 'App\Models\User', 3, 'efsrt_auth_token', 'a55e8688be4360fc746e6b410e0e659de2fe2bcd819acc5eb0d5c331af093368', '["*"]', NULL, NULL, '2026-11-05 22:56:46', '2026-11-05 22:56:46');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (4, 'App\Models\User', 3, 'efsrt_auth_token', '32b04ff28ad6925c56571d2a69a4d4c0920d8a4602a79091459816a40d3807ee', '["*"]', '2026-11-06 21:25:29', NULL, '2026-11-05 23:00:29', '2026-11-06 21:25:29');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (5, 'App\Models\User', 3, 'efsrt_auth_token', '73d02e46e06ed952267d3401425ccb23163737766881924578a4f536b6faf9f0', '["*"]', NULL, NULL, '2026-11-06 22:20:36', '2026-11-06 22:20:36');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (6, 'App\Models\User', 3, 'efsrt_auth_token', 'e1ca2f44d8d60a7c6ae085e50d4aa9465e3aedac7f237c65f11690dee7794b15', '["*"]', NULL, NULL, '2026-11-06 22:21:57', '2026-11-06 22:21:57');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (7, 'App\Models\User', 3, 'efsrt_auth_token', '3fceb85ffc18866dae421ce61627f206270d1b4edb70b211ce78c47e9da894e3', '["*"]', NULL, NULL, '2026-11-06 22:36:35', '2026-11-06 22:36:35');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (3, 'App\Models\User', 3, 'efsrt_auth_token', '2462ea67177c7325ceb71a462b3387571f4d5ac7e07c51dca4d5a61df63a06fd', '["*"]', '2026-11-05 22:59:52', NULL, '2026-11-05 22:56:58', '2026-11-05 22:59:52');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (9, 'App\Models\User', 3, 'efsrt_auth_token', '9ecb3b91d3d4b9e9e8e5673378bec92887ced8a2ee298e0b6a43b036c2a557ff', '["*"]', '2026-11-06 22:56:10', NULL, '2026-11-06 22:56:09', '2026-11-06 22:56:10');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (8, 'App\Models\User', 3, 'efsrt_auth_token', '159aef749b865f75e0935ed7fd7756d623ffec7c911f21f9833df515005e6b16', '["*"]', '2026-11-06 23:06:43', NULL, '2026-11-06 22:53:26', '2026-11-06 23:06:43');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (103, 'App\Models\User', 23, 'efsrt_auth_token', 'a81b49658e5a06f1fa1d30a6471b71e0ac0c4fca380a0d24ef8285ef6899f453', '["*"]', '2026-11-23 01:24:06', NULL, '2026-11-23 01:03:08', '2026-11-23 01:24:06');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (56, 'App\Models\User', 14, 'efsrt_auth_token', '3d7069e504d7bbd9d6aa513ccc45a83ef90071dac3635a069277e9592055cac9', '["*"]', '2026-11-16 02:58:42', NULL, '2026-11-16 02:19:14', '2026-11-16 02:58:42');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (11, 'App\Models\User', 3, 'efsrt_auth_token', '1f820237684cb2a7b208ec4effa2523c2cecc6996fef2ef94b7e9bbfc781b939', '["*"]', '2026-11-08 04:31:35', NULL, '2026-11-08 04:24:25', '2026-11-08 04:31:35');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (12, 'App\Models\User', 3, 'efsrt_auth_token', '329695cca2b7de32b6845f9a02554feca3b0d126fe820afbd64329b9e5de246a', '["*"]', NULL, NULL, '2026-11-08 04:39:23', '2026-11-08 04:39:23');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (16, 'App\Models\User', 3, 'efsrt_auth_token', 'd5bc459a2cf4ed4d21c67a65605caed4316d0d301ba8a795975cdc2e674e37e4', '["*"]', '2026-11-08 06:00:28', NULL, '2026-11-08 05:59:36', '2026-11-08 06:00:28');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (17, 'App\Models\User', 3, 'efsrt_auth_token', '2bfa0a12cbaab0f67b7556b719be7a77f37108d9638bc36407655f2902cd5f02', '["*"]', NULL, NULL, '2026-11-08 06:13:47', '2026-11-08 06:13:47');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (117, 'App\Models\User', 1, 'efsrt_auth_token', '1867b99e3fe2013648ae29c818ba649fb170d2bf9cfafb731e07efcbfc79c342', '["*"]', '2026-11-23 05:46:49', NULL, '2026-11-23 05:26:45', '2026-11-23 05:46:49');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (55, 'App\Models\User', 14, 'efsrt_auth_token', 'e81c52c1b43c8c1aca99faf4c268625095f29d1de6a0ef733545f9fffa34a5e8', '["*"]', '2026-11-15 03:49:24', NULL, '2026-11-15 00:50:56', '2026-11-15 03:49:24');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (10, 'App\Models\User', 3, 'efsrt_auth_token', '1823cc78ab6d72fd7f3e95e18f2da153cfc0ba9b1699b826612da17e226c446b', '["*"]', '2026-11-08 05:12:01', NULL, '2026-11-08 04:23:54', '2026-11-08 05:12:01');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (13, 'App\Models\User', 3, 'efsrt_auth_token', 'ead41a499e06a4948183ceea30cb94b7d9267532a28665bfc82f8d741a1c2cc9', '["*"]', '2026-11-08 05:13:13', NULL, '2026-11-08 04:40:46', '2026-11-08 05:13:13');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (77, 'App\Models\User', 2, 'efsrt_auth_token', '652069868afbda1c6a3871d6bfbb1659fc80b7546a6a67d5c13086bcc8b83b9f', '["*"]', '2026-11-22 04:22:17', NULL, '2026-11-22 03:49:37', '2026-11-22 04:22:17');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (122, 'App\Models\User', 1, 'efsrt_auth_token', 'c8b35031890779056419ba74d6f485d7a374a4f6c4d816b67ef532992d14c02b', '["*"]', '2026-11-27 05:04:55', NULL, '2026-11-26 23:25:20', '2026-11-27 05:04:55');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (14, 'App\Models\User', 3, 'efsrt_auth_token', 'b31c17bf112798ad679a1468e68fee4f02b230955e64677cfd8a75d74198c47a', '["*"]', '2026-11-15 00:15:45', NULL, '2026-11-08 04:44:32', '2026-11-15 00:15:45');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (20, 'App\Models\User', 3, 'efsrt_auth_token', '5011a992e362d1bd13a7af85cc98e15122e24ec434e96dc3a41f1bd68c6fc822', '["*"]', '2026-11-08 06:45:58', NULL, '2026-11-08 06:41:41', '2026-11-08 06:45:58');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (116, 'App\Models\User', 1, 'efsrt_auth_token', '9efb18c25d0af8c509ab8eac46fa59bf2785ea6ad68b87d7ba6ed2ac2cc29aa9', '["*"]', '2026-11-23 05:20:44', NULL, '2026-11-23 05:19:29', '2026-11-23 05:20:44');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (15, 'App\Models\User', 3, 'efsrt_auth_token', '6eac1865fd51221ab7996fee118b7cadc7fc6f55198728216a59431cab7f3eb7', '["*"]', '2026-11-16 02:59:48', NULL, '2026-11-08 05:14:05', '2026-11-16 02:59:48');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (74, 'App\Models\User', 2, 'efsrt_auth_token', '34920725d2a0c37026343694bdf85464cd40cbe5cbcdfa1e105b15c2eb7c9b92', '["*"]', '2026-11-22 03:33:06', NULL, '2026-11-22 03:15:28', '2026-11-22 03:33:06');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (75, 'App\Models\User', 2, 'efsrt_auth_token', 'c067a93b7a4faa743d01304b86232dee9e392a81275344c2a477b1c45ba1c89c', '["*"]', '2026-11-22 03:46:40', NULL, '2026-11-22 03:33:12', '2026-11-22 03:46:40');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (76, 'App\Models\User', 2, 'efsrt_auth_token', 'd940ddb76436289687a56f92764fdd2676ce32a2c5ec8d969407df6481caa0b0', '["*"]', '2026-11-22 03:46:53', NULL, '2026-11-22 03:46:48', '2026-11-22 03:46:53');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (139, 'App\Models\User', 1, 'efsrt_auth_token', 'da6ea44b9a3f4a89076070f5e9d71ab90bf2a43a64d9dc657bdd32ecffa8356f', '["*"]', '2026-11-27 04:34:53', NULL, '2026-11-27 04:34:36', '2026-11-27 04:34:53');
INSERT INTO public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES (143, 'App\Models\User', 1, 'efsrt_auth_token', '15157ee81fc07b5ecf7ca7989baa9c9a75ba967d143db98384ec453154f908e8', '["*"]', '2026-11-27 05:06:53', NULL, '2026-11-27 04:57:42', '2026-11-27 05:06:53');


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles (id_rol, nombre_rol, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Administrador', '2026-10-29 15:23:20.25242-05');
INSERT INTO public.roles (id_rol, nombre_rol, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Docente', '2026-10-29 15:23:20.25242-05');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) VALUES ('OVyorfPa4Zl0ykHgtfjIzCd18trCRq0t9wxxt4Pw', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.144.0 Chrome/150.0.7871.250 Electron/43.8.3 Safari/537.36', 'eyJfdG9rZW4iOiJuYWkzQUNpZml0MU1XSUM2M1R5R053TFh1VjFpVmhUUXVXRXcwUGdjIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793308730);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, name, email, email_verified_at, password, remember_token, created_at, updated_at) VALUES (1, 'Admin EFSRT', 'admin@caceres.edu.pe', NULL, '$2y$12$fV6afNW/zjQrDUdb47c5nu37brvAE/KYMcv9u7cOTGC44kHe27Yxm', NULL, '2026-10-29 21:52:22', '2026-10-29 21:52:22');


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.usuarios (id_usuario, dni, nombres, apellidos, correo, contrasena_hash, estado_cuenta, id_rol, created_at, updated_at, foto_perfil, telefono, preferencias_notificaciones) OVERRIDING SYSTEM VALUE VALUES (22, '61061388', 'Alexis', 'Cordova', 'alexisfelixcordova@gmail.com', '$2y$12$tpeUme5EcNPprBikkYK4Qek1dZiHsUSRciVLjJINdwgv2c2paB5gO', 'Activo', 2, '2026-11-22 05:03:07-05', '2026-11-22 05:03:07-05', '/storage/perfiles/usuario_1795323786_6b02778ac9a58.jpg', '976137483', NULL);
INSERT INTO public.usuarios (id_usuario, dni, nombres, apellidos, correo, contrasena_hash, estado_cuenta, id_rol, created_at, updated_at, foto_perfil, telefono, preferencias_notificaciones) OVERRIDING SYSTEM VALUE VALUES (2, '45678912', 'Julio César', 'Gutarra Ramos', 'julio.gutarra@iestpacd.edu.pe', '$2y$12$SwHEgswXW4rR8tQSxttsReBxFwf6w2AukbVffi/CdmS1g4X2K6yRK', 'Activo', 2, '2026-10-29 15:23:20.25242-05', '2026-11-22 22:31:00-05', '/storage/perfiles/usuario_2_1795386660.jpg', '+51 976 137 483', NULL);
INSERT INTO public.usuarios (id_usuario, dni, nombres, apellidos, correo, contrasena_hash, estado_cuenta, id_rol, created_at, updated_at, foto_perfil, telefono, preferencias_notificaciones) OVERRIDING SYSTEM VALUE VALUES (23, '74628290', 'Sheper', 'Puto', 'sheper.puto@worldnic.edu.pe', '$2y$12$OXx3k96QIHG9ujZHktPnh.3U2eQn7ebCJfBZheiPIAZRXqe85lxLy', 'Activo', 2, '2026-11-23 00:55:19-05', '2026-11-23 00:55:19-05', '/storage/perfiles/usuario_1795395318_6b038ef626879.webp', '976137483', NULL);
INSERT INTO public.usuarios (id_usuario, dni, nombres, apellidos, correo, contrasena_hash, estado_cuenta, id_rol, created_at, updated_at, foto_perfil, telefono, preferencias_notificaciones) OVERRIDING SYSTEM VALUE VALUES (1, '70123456', 'Alexis Yeshua', 'Félix Córdova', 'alexis.felix@efsrt.edu.pe', '$2y$12$SwHEgswXW4rR8tQSxttsReBxFwf6w2AukbVffi/CdmS1g4X2K6yRK', 'Activo', 1, '2026-10-29 15:23:20.25242-05', '2026-11-27 03:28:35-05', '/storage/perfiles/usuario_1_1795323353.jpg', '976 137 483', '{"login":true,"clave":true,"constancias":true,"revisiones":true,"sistema":true,"asignaciones":true}');


--
-- Name: app_datos_id_dato_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.app_datos_id_dato_seq', 2, true);


--
-- Name: asignacion_asesores_id_asignacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asignacion_asesores_id_asignacion_seq', 45, true);


--
-- Name: calendario_tareas_id_tarea_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendario_tareas_id_tarea_seq', 4, true);


--
-- Name: carpetas_id_carpeta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carpetas_id_carpeta_seq', 1, false);


--
-- Name: constancias_emitidas_id_constancia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.constancias_emitidas_id_constancia_seq', 1, true);


--
-- Name: contactos_id_contacto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contactos_id_contacto_seq', 1, false);


--
-- Name: docentes_id_docente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.docentes_id_docente_seq', 4, true);


--
-- Name: documentos_id_documento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documentos_id_documento_seq', 1, false);


--
-- Name: empresas_convenio_id_empresa_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empresas_convenio_id_empresa_seq', 9, true);


--
-- Name: estudiantes_id_estudiante_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estudiantes_id_estudiante_seq', 108, true);


--
-- Name: eventos_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventos_id_evento_seq', 4, true);


--
-- Name: evidencias_efsrt_id_evidencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evidencias_efsrt_id_evidencia_seq', 1, false);


--
-- Name: expediente_efsrt_id_expediente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expediente_efsrt_id_expediente_seq', 6, true);


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

SELECT pg_catalog.setval('public.migrations_id_seq', 10, true);


--
-- Name: modulos_profesionales_id_modulo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modulos_profesionales_id_modulo_seq', 4, true);


--
-- Name: nota_categorias_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nota_categorias_id_categoria_seq', 5, true);


--
-- Name: nota_imagenes_id_imagen_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nota_imagenes_id_imagen_seq', 1, false);


--
-- Name: nota_items_id_item_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nota_items_id_item_seq', 1, false);


--
-- Name: notas_id_nota_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notas_id_nota_seq', 1, false);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 143, true);


--
-- Name: proyectos_id_proyecto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyectos_id_proyecto_seq', 1, false);


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

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 23, true);


--
-- Name: app_datos app_datos_id_usuario_aplicacion_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_datos
    ADD CONSTRAINT app_datos_id_usuario_aplicacion_unique UNIQUE (id_usuario, aplicacion);


--
-- Name: app_datos app_datos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_datos
    ADD CONSTRAINT app_datos_pkey PRIMARY KEY (id_dato);


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
-- Name: calendario_notas calendario_notas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_notas
    ADD CONSTRAINT calendario_notas_pkey PRIMARY KEY (id_usuario);


--
-- Name: calendario_tareas calendario_tareas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_tareas
    ADD CONSTRAINT calendario_tareas_pkey PRIMARY KEY (id_tarea);


--
-- Name: carpetas carpetas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carpetas
    ADD CONSTRAINT carpetas_pkey PRIMARY KEY (id_carpeta);


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
-- Name: contactos contactos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contactos
    ADD CONSTRAINT contactos_pkey PRIMARY KEY (id_contacto);


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
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id_documento);


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
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id_evento);


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
-- Name: nota_categorias nota_categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_categorias
    ADD CONSTRAINT nota_categorias_pkey PRIMARY KEY (id_categoria);


--
-- Name: nota_imagenes nota_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_imagenes
    ADD CONSTRAINT nota_imagenes_pkey PRIMARY KEY (id_imagen);


--
-- Name: nota_items nota_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_items
    ADD CONSTRAINT nota_items_pkey PRIMARY KEY (id_item);


--
-- Name: notas notas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_pkey PRIMARY KEY (id_nota);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


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
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id_proyecto);


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
-- Name: nota_categorias uq_nota_categoria_nombre; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_categorias
    ADD CONSTRAINT uq_nota_categoria_nombre UNIQUE (nombre);


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
-- Name: idx_documentos_carpeta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documentos_carpeta ON public.documentos USING btree (id_carpeta);


--
-- Name: idx_estudiantes_dni_apellidos; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiantes_dni_apellidos ON public.estudiantes USING btree (dni, apellidos);


--
-- Name: idx_eventos_usuario_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_eventos_usuario_fecha ON public.eventos USING btree (id_usuario, fecha, hora_inicio);


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
-- Name: idx_nota_imagenes_nota; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nota_imagenes_nota ON public.nota_imagenes USING btree (id_nota);


--
-- Name: idx_nota_items_nota; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nota_items_nota ON public.nota_items USING btree (id_nota, orden);


--
-- Name: idx_notas_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notas_usuario ON public.notas USING btree (id_usuario, archivada, eliminada_at);


--
-- Name: idx_proyectos_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proyectos_empresa ON public.proyectos USING btree (id_empresa);


--
-- Name: idx_proyectos_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proyectos_estado ON public.proyectos USING btree (estado, orden);


--
-- Name: idx_proyectos_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proyectos_estudiante ON public.proyectos USING btree (id_estudiante);


--
-- Name: idx_proyectos_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proyectos_usuario ON public.proyectos USING btree (id_usuario);


--
-- Name: idx_tareas_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tareas_usuario ON public.calendario_tareas USING btree (id_usuario, hecha, orden);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (id_rol);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: notifications_notifiable_type_notifiable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_notifiable_type_notifiable_id_index ON public.notifications USING btree (notifiable_type, notifiable_id);


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
-- Name: uq_carpeta_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_carpeta_nombre ON public.carpetas USING btree (id_usuario, COALESCE(id_carpeta_padre, (0)::bigint), lower((nombre)::text)) WHERE (eliminada_at IS NULL);


--
-- Name: uq_contacto_correo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_contacto_correo ON public.contactos USING btree (id_usuario, lower((correo)::text)) WHERE (correo IS NOT NULL);


--
-- Name: uq_documento_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_documento_nombre ON public.documentos USING btree (id_usuario, COALESCE(id_carpeta, (0)::bigint), lower((nombre)::text)) WHERE (eliminado_at IS NULL);


--
-- Name: uq_evento_repetido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_evento_repetido ON public.eventos USING btree (id_usuario, fecha, hora_inicio, lower((titulo)::text));


--
-- Name: calendario_notas trg_calendario_notas_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_calendario_notas_updated BEFORE UPDATE ON public.calendario_notas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: carpetas trg_carpetas_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_carpetas_updated BEFORE UPDATE ON public.carpetas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: contactos trg_contactos_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contactos_updated BEFORE UPDATE ON public.contactos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: documentos trg_documentos_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_documentos_updated BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: eventos trg_eventos_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_eventos_updated BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notas trg_notas_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notas_updated BEFORE UPDATE ON public.notas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: proyectos trg_proyectos_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_proyectos_updated BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


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
-- Name: calendario_notas fk_calnota_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_notas
    ADD CONSTRAINT fk_calnota_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: carpetas fk_carpeta_padre; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carpetas
    ADD CONSTRAINT fk_carpeta_padre FOREIGN KEY (id_carpeta_padre) REFERENCES public.carpetas(id_carpeta);


--
-- Name: carpetas fk_carpeta_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carpetas
    ADD CONSTRAINT fk_carpeta_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


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
-- Name: contactos fk_contacto_empresa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contactos
    ADD CONSTRAINT fk_contacto_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresas_convenio(id_empresa) ON DELETE SET NULL;


--
-- Name: contactos fk_contacto_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contactos
    ADD CONSTRAINT fk_contacto_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: documentos fk_documento_carpeta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT fk_documento_carpeta FOREIGN KEY (id_carpeta) REFERENCES public.carpetas(id_carpeta);


--
-- Name: documentos fk_documento_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT fk_documento_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


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
-- Name: eventos fk_evento_empresa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresas_convenio(id_empresa) ON DELETE SET NULL;


--
-- Name: eventos fk_evento_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante) ON DELETE SET NULL;


--
-- Name: eventos fk_evento_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: evidencias_efsrt fk_evidencia_expediente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidencias_efsrt
    ADD CONSTRAINT fk_evidencia_expediente FOREIGN KEY (id_expediente) REFERENCES public.expediente_efsrt(id_expediente) ON DELETE CASCADE;


--
-- Name: notas fk_nota_categoria; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT fk_nota_categoria FOREIGN KEY (id_categoria) REFERENCES public.nota_categorias(id_categoria) ON DELETE SET NULL;


--
-- Name: nota_imagenes fk_nota_imagen_nota; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_imagenes
    ADD CONSTRAINT fk_nota_imagen_nota FOREIGN KEY (id_nota) REFERENCES public.notas(id_nota) ON DELETE CASCADE;


--
-- Name: nota_items fk_nota_item_nota; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_items
    ADD CONSTRAINT fk_nota_item_nota FOREIGN KEY (id_nota) REFERENCES public.notas(id_nota) ON DELETE CASCADE;


--
-- Name: notas fk_nota_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT fk_nota_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: proyectos fk_proyecto_empresa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresas_convenio(id_empresa);


--
-- Name: proyectos fk_proyecto_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante);


--
-- Name: proyectos fk_proyecto_modulo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_modulo FOREIGN KEY (id_modulo) REFERENCES public.modulos_profesionales(id_modulo);


--
-- Name: proyectos fk_proyecto_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: calendario_tareas fk_tarea_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_tareas
    ADD CONSTRAINT fk_tarea_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


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

\unrestrict od7NPahlPJPq16fZjBI5mcuC4SsMsxtHwbEKKjLFFclVWl1QPCeIzAowQDZQ9uo

