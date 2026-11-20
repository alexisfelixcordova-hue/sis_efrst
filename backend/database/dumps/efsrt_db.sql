-- ==========================================
-- 1. LIMPIEZA PREVIA (ORDEN SEGURO)
-- ==========================================
DROP TABLE IF EXISTS public.evidencias_efsrt CASCADE;
DROP TABLE IF EXISTS public.expediente_efsrt CASCADE;
DROP TABLE IF EXISTS public.asignacion_asesores CASCADE;
DROP TABLE IF EXISTS public.constancias_emitidas CASCADE;
DROP TABLE IF EXISTS public.docentes CASCADE;
DROP TABLE IF EXISTS public.estudiantes CASCADE;
DROP TABLE IF EXISTS public.empresas_convenio CASCADE;
DROP TABLE IF EXISTS public.modulos_profesionales CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

DROP TABLE IF EXISTS public.personal_access_tokens CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.cache_locks CASCADE;
DROP TABLE IF EXISTS public.cache CASCADE;
DROP TABLE IF EXISTS public.failed_jobs CASCADE;
DROP TABLE IF EXISTS public.job_batches CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.migrations CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- ==========================================
-- 2. CREACIÓN DE TABLAS
-- ==========================================
CREATE TABLE public.roles (
    id_rol bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol character varying(50) NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.usuarios (
    id_usuario bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dni character varying(15) NOT NULL UNIQUE,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    correo character varying(150) NOT NULL UNIQUE,
    contrasena_hash character varying(255) NOT NULL,
    estado_cuenta character varying(20) DEFAULT 'Activo'::character varying
        CHECK (estado_cuenta IN ('Activo', 'Suspendido', 'Inactivo')),
    id_rol bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.docentes (
    id_docente bigserial PRIMARY KEY,
    id_usuario bigint NOT NULL UNIQUE,
    codigo character varying(20) NOT NULL UNIQUE,
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

CREATE TABLE public.estudiantes (
    id_estudiante bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dni character varying(15) NOT NULL UNIQUE,
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

CREATE TABLE public.modulos_profesionales (
    id_modulo bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_modulo integer NOT NULL CHECK (numero_modulo >= 1 AND numero_modulo <= 3),
    nombre_modulo character varying(150) NOT NULL,
    horas_requeridas integer DEFAULT 160 NOT NULL CHECK (horas_requeridas > 0),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.empresas_convenio (
    id_empresa bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ruc character varying(20) NOT NULL UNIQUE,
    razon_social character varying(150) NOT NULL,
    supervisor_empresa_nombre character varying(150),
    supervisor_empresa_cargo character varying(100),
    estado_convenio character varying(20) DEFAULT 'Activo'::character varying
        CHECK (estado_convenio IN ('Activo', 'Vencido', 'Suspendido')),
    documento_convenio_ruta character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.asignacion_asesores (
    id_asignacion bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_docente bigint NOT NULL,
    id_estudiante bigint NOT NULL,
    id_modulo bigint NOT NULL,
    periodo_academico character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_estudiante_modulo_periodo UNIQUE (id_estudiante, id_modulo, periodo_academico)
);

CREATE TABLE public.expediente_efsrt (
    id_expediente bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_estudiante bigint NOT NULL,
    id_modulo bigint NOT NULL,
    id_empresa bigint NOT NULL,
    id_docente_asesor bigint NOT NULL,
    horas_acumuladas integer DEFAULT 0 CHECK (horas_acumuladas >= 0),
    estado_efsrt character varying(30) DEFAULT 'No efectuó'::character varying
        CHECK (estado_efsrt IN ('No efectuó', 'Por verificar', 'Validado')),
    portafolio_fisico_revisado boolean DEFAULT false,
    observaciones text,
    fecha_validacion timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_estudiante_modulo_efsrt UNIQUE (id_estudiante, id_modulo)
);

CREATE TABLE public.evidencias_efsrt (
    id_evidencia bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_expediente bigint NOT NULL,
    tipo_evidencia character varying(50) NOT NULL
        CHECK (tipo_evidencia IN ('Ficha Asistencia', 'Informe Semanal', 'Evaluación Empresa', 'Enlace Repositorio Web')),
    titulo_evidencia character varying(150) NOT NULL,
    ruta_archivo_o_url character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.constancias_emitidas (
    id_constancia bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_estudiante bigint NOT NULL,
    id_modulo bigint NOT NULL,
    id_administrador bigint NOT NULL,
    codigo_documento character varying(50) NOT NULL UNIQUE,
    tipo_emision character varying(20) DEFAULT 'Original'::character varying
        CHECK (tipo_emision IN ('Original', 'Duplicado')),
    fecha_emision timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ruta_archivo_pdf character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Tablas estándar de Laravel
CREATE TABLE public.migrations (
    id serial PRIMARY KEY,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);

CREATE TABLE public.users (
    id bigserial PRIMARY KEY,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL UNIQUE,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

CREATE TABLE public.password_reset_tokens (
    email character varying(255) PRIMARY KEY,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);

CREATE TABLE public.sessions (
    id character varying(255) PRIMARY KEY,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);

CREATE TABLE public.cache (
    key character varying(255) PRIMARY KEY,
    value text NOT NULL,
    expiration bigint NOT NULL
);

CREATE TABLE public.cache_locks (
    key character varying(255) PRIMARY KEY,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);

CREATE TABLE public.jobs (
    id bigserial PRIMARY KEY,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);

CREATE TABLE public.job_batches (
    id character varying(255) PRIMARY KEY,
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

CREATE TABLE public.failed_jobs (
    id bigserial PRIMARY KEY,
    uuid character varying(255) NOT NULL UNIQUE,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.personal_access_tokens (
    id bigserial PRIMARY KEY,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL UNIQUE,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- ==========================================
-- 3. INSERCIÓN DE DATOS
-- ==========================================
-- OJO: Asegúrate de insertar primero los roles y usuarios que referencian docentes/asignaciones
-- Ejemplo base si necesitas crear al usuario id_usuario = 2 y admin id_usuario = 1:
-- INSERT INTO public.roles (nombre_rol) VALUES ('Administrador'), ('Docente'), ('Estudiante');
-- INSERT INTO public.usuarios (dni, nombres, apellidos, correo, contrasena_hash, estado_cuenta, id_rol)
-- VALUES
--   ('10000001', 'Admin', 'Sistema', 'admin@efsrt.edu.pe', crypt('123456', gen_salt('bf')), 'Activo', 1),
--   ('20000002', 'Julio César', 'Docente Asesor', 'julio.cesar@efsrt.edu.pe', crypt('123456', gen_salt('bf')), 'Activo', 2);
INSERT INTO public.roles (id_rol, nombre_rol)
OVERRIDING SYSTEM VALUE VALUES
(1, 'Administrador'),
(2, 'Docente'),
(3, 'Estudiante');

INSERT INTO public.usuarios (id_usuario, dni, nombres, apellidos, correo, contrasena_hash, estado_cuenta, id_rol)
OVERRIDING SYSTEM VALUE VALUES
(1, '10000001', 'Admin', 'Sistema', 'admin@efsrt.edu.pe', crypt('123456', gen_salt('bf')), 'Activo', 1),
(2, '20000002', 'Julio César', 'Docente Asesor', 'julio.cesar@efsrt.edu.pe', crypt('123456', gen_salt('bf')), 'Activo', 2);
INSERT INTO public.docentes (id_docente, id_usuario, codigo, departamento, grado, especialidad, condicion, telefono, capacidad, sede, biografia, created_at, updated_at)
OVERRIDING SYSTEM VALUE VALUES
(3, 2, 'DOC-2026-002', 'Computación e Informática', 'Ingeniero de Sistemas', 'Desarrollo Web y Bases de Datos', NULL, '+51 900 000 000', 12, 'Campus Central – Sede Lima', NULL, '2026-11-08 19:23:04.765096', '2026-11-08 19:23:04.765096');

INSERT INTO public.estudiantes (id_estudiante, dni, nombres, apellidos, programa_estudios, semestre, created_at, updated_at, correo, telefono, direccion, estado)
OVERRIDING SYSTEM VALUE VALUES
(3, '74567890', 'Diego Alonso', 'Rojas Quispe', 'Diseño y Programación Web', 'IV Semestre', '2026-10-29 15:23:20.25242-05', '2026-10-29 15:23:20.25242-05', 'diego.rojas@iesteacd.edu.pe', '987654321', 'San Agustín de Cajas, Huancayo', 'Al día'),
(4, '72345677', 'Carlos Alberto', 'Pérez Gómez', 'Diseño y Programación Web', 'VI Semestre', '2026-11-04 21:48:31-05', '2026-11-04 21:48:31-05', 'estudiante@iesteacd.edu.pe', '987654321', 'San Agustín de Cajas, Huancayo', 'Al día'),
(1, '72345678', 'Carlos Alberto Actualizado', 'Pérez Gómez', 'Diseño y Programación Web', 'II Semestre', '2026-10-29 15:23:20.25242-05', '2026-11-04 21:59:47-05', 'carlos.perez@iesteacd.edu.pe', '987654321', 'San Agustín de Cajas, Huancayo', 'Al día');

INSERT INTO public.modulos_profesionales (id_modulo, numero_modulo, nombre_modulo, horas_requeridas, created_at)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Diseño web y herramientas multimedia', 160, '2026-10-29 15:18:18.607448-05'),
(3, 3, 'Integracion de Palicaciones web y moviles', 160, '2026-10-29 15:18:18.607448-05'),
(2, 2, 'Integracion de Aplicaciones Web y Moviles', 160, '2026-10-29 15:18:18.607448-05');

INSERT INTO public.empresas_convenio (id_empresa, ruc, razon_social, supervisor_empresa_nombre, supervisor_empresa_cargo, estado_convenio, documento_convenio_ruta, created_at, updated_at)
OVERRIDING SYSTEM VALUE VALUES
(2, '20666987652', 'Soluciones Digitales Centro E.I.R.L.', 'Ana María Poma', 'Gerente de Proyectos Web', 'Activo', 'storage/convenios/convenio_soluciones.pdf', '2026-10-29 15:23:20.25242-05', '2026-10-29 15:23:20.25242-05'),
(4, '12345678910', 'Soluciones Informáticas Andinas S.A.C.xdxd', 'Carlos Mendoza', 'Líder Técnico', 'Activo', 'storage/convenios/convenio_prueba.pdf', '2026-11-04 20:41:52-05', '2026-11-04 20:41:52-05'),
(1, '20555123451', 'Software Center Huancayo S.A.C.', 'Elmas Capito', 'Líder Técnico / CTO', 'Suspendido', 'storage/convenios/convenio_sw_center.pdf', '2026-10-29 15:23:20.25242-05', '2026-11-04 21:00:41-05');

INSERT INTO public.asignacion_asesores (id_asignacion, id_docente, id_estudiante, id_modulo, periodo_academico, created_at)
OVERRIDING SYSTEM VALUE VALUES
(1, 2, 1, 2, '2026-I', '2026-10-29 15:23:20.25242-05'),
(3, 2, 3, 1, '2026-I', '2026-10-29 15:23:20.25242-05');

INSERT INTO public.expediente_efsrt (id_expediente, id_estudiante, id_modulo, id_empresa, id_docente_asesor, horas_acumuladas, estado_efsrt, portafolio_fisico_revisado, observaciones, fecha_validacion, created_at, updated_at)
OVERRIDING SYSTEM VALUE VALUES
(3, 3, 1, 1, 2, 0, 'No efectuó', false, 'Pendiente de inicio de actividades prácticas en la empresa asignada.', NULL, '2026-10-29 15:23:20.25242-05', '2026-10-29 15:23:20.25242-05'),
(1, 1, 2, 1, 2, 120, 'Validado', true, 'Documentación completa y conforme según los requisitos del módulo.', '2026-10-29 23:03:43-05', '2026-10-29 15:23:20.25242-05', '2026-10-29 23:03:43-05');

INSERT INTO public.evidencias_efsrt (id_evidencia, id_expediente, tipo_evidencia, titulo_evidencia, ruta_archivo_o_url, created_at)
OVERRIDING SYSTEM VALUE VALUES
(2, 1, 'Informe Semanal', 'Informe Final de Prácticas - API REST con Spring Boot', 'storage/evidencias/exp_1_informe.pdf', '2026-10-29 15:23:20.25242-05'),
(3, 1, 'Enlace Repositorio Web', 'Repositorio GitHub - Sistema Web Comercial', 'https://github.com/kevin-huaman/efsrt-proyecto-web', '2026-10-29 15:23:20.25242-05'),
(5, 1, 'Enlace Repositorio Web', 'Repositorio del Proyecto Final', 'https://github.com/usuario/proyecto-efsrt', '2026-11-06 21:05:10-05');

INSERT INTO public.constancias_emitidas (id_constancia, id_estudiante, id_modulo, id_administrador, codigo_documento, tipo_emision, fecha_emision, ruta_archivo_pdf, created_at)
OVERRIDING SYSTEM VALUE VALUES
(1, 1, 2, 1, 'CONST-EFSRT-2026-001', 'Original', '2026-06-21 16:00:00-05', 'storage/constancias/constancia_72345678_mod2.pdf', '2026-10-29 15:23:20.25242-05');

INSERT INTO public.migrations (id, migration, batch) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_10_29_212200_create_personal_access_tokens_table', 2),
(5, '2026_11_09_000942_create_docentes_table', 3);

-- ==========================================
-- 4. LLAVES FORÁNEAS E ÍNDICES
-- ==========================================
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);

-- Nota: asignacion_asesores.id_docente y expediente_efsrt.id_docente_asesor usan id_usuario (ej. 2)
ALTER TABLE ONLY public.asignacion_asesores
    ADD CONSTRAINT fk_asig_docente FOREIGN KEY (id_docente) REFERENCES public.usuarios(id_usuario),
    ADD CONSTRAINT fk_asig_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante),
    ADD CONSTRAINT fk_asig_modulo FOREIGN KEY (id_modulo) REFERENCES public.modulos_profesionales(id_modulo);

ALTER TABLE ONLY public.expediente_efsrt
    ADD CONSTRAINT fk_efsrt_docente FOREIGN KEY (id_docente_asesor) REFERENCES public.usuarios(id_usuario),
    ADD CONSTRAINT fk_efsrt_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresas_convenio(id_empresa),
    ADD CONSTRAINT fk_efsrt_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante),
    ADD CONSTRAINT fk_efsrt_modulo FOREIGN KEY (id_modulo) REFERENCES public.modulos_profesionales(id_modulo);

ALTER TABLE ONLY public.evidencias_efsrt
    ADD CONSTRAINT fk_evidencia_expediente FOREIGN KEY (id_expediente) REFERENCES public.expediente_efsrt(id_expediente);

ALTER TABLE ONLY public.constancias_emitidas
    ADD CONSTRAINT fk_constancia_admin FOREIGN KEY (id_administrador) REFERENCES public.usuarios(id_usuario),
    ADD CONSTRAINT fk_constancia_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante),
    ADD CONSTRAINT fk_constancia_modulo FOREIGN KEY (id_modulo) REFERENCES public.modulos_profesionales(id_modulo);

CREATE INDEX idx_usuarios_rol ON public.usuarios (id_rol);
CREATE INDEX idx_asignacion_docente ON public.asignacion_asesores (id_docente);
CREATE INDEX idx_asignacion_estudiante ON public.asignacion_asesores (id_estudiante);
CREATE INDEX idx_expediente_docente ON public.expediente_efsrt (id_docente_asesor);
CREATE INDEX idx_expediente_empresa ON public.expediente_efsrt (id_empresa);
CREATE INDEX idx_expediente_estado ON public.expediente_efsrt (estado_efsrt);
CREATE INDEX idx_expediente_estudiante ON public.expediente_efsrt (id_estudiante);
CREATE INDEX idx_expediente_modulo ON public.expediente_efsrt (id_modulo);
CREATE INDEX idx_evidencias_expediente ON public.evidencias_efsrt (id_expediente);
CREATE INDEX idx_estudiantes_dni_apellidos ON public.estudiantes (dni, apellidos);
CREATE INDEX idx_constancias_estudiante ON public.constancias_emitidas (id_estudiante);

-- ==========================================
-- 5. SINCRONIZAR SECUENCIAS
-- ==========================================
SELECT setval(pg_get_serial_sequence('public.roles', 'id_rol'), COALESCE((SELECT MAX(id_rol) FROM public.roles), 1));
SELECT setval(pg_get_serial_sequence('public.usuarios', 'id_usuario'), COALESCE((SELECT MAX(id_usuario) FROM public.usuarios), 1));
SELECT setval(pg_get_serial_sequence('public.docentes', 'id_docente'), COALESCE((SELECT MAX(id_docente) FROM public.docentes), 1));
SELECT setval(pg_get_serial_sequence('public.estudiantes', 'id_estudiante'), COALESCE((SELECT MAX(id_estudiante) FROM public.estudiantes), 1));
SELECT setval(pg_get_serial_sequence('public.modulos_profesionales', 'id_modulo'), COALESCE((SELECT MAX(id_modulo) FROM public.modulos_profesionales), 1));
SELECT setval(pg_get_serial_sequence('public.empresas_convenio', 'id_empresa'), COALESCE((SELECT MAX(id_empresa) FROM public.empresas_convenio), 1));
SELECT setval(pg_get_serial_sequence('public.asignacion_asesores', 'id_asignacion'), COALESCE((SELECT MAX(id_asignacion) FROM public.asignacion_asesores), 1));
SELECT setval(pg_get_serial_sequence('public.expediente_efsrt', 'id_expediente'), COALESCE((SELECT MAX(id_expediente) FROM public.expediente_efsrt), 1));
SELECT setval(pg_get_serial_sequence('public.evidencias_efsrt', 'id_evidencia'), COALESCE((SELECT MAX(id_evidencia) FROM public.evidencias_efsrt), 1));
SELECT setval(pg_get_serial_sequence('public.constancias_emitidas', 'id_constancia'), COALESCE((SELECT MAX(id_constancia) FROM public.constancias_emitidas), 1));
SELECT setval(pg_get_serial_sequence('public.migrations', 'id'), COALESCE((SELECT MAX(id) FROM public.migrations), 1));