-- Creación de la Base de Datos
CREATE DATABASE IF NOT EXISTS efsrt_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE efsrt_db;

-- 1. Tabla ROLES
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Tabla USUARIOS (Administradores y Docentes)
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(8) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    estado_cuenta ENUM('ACTIVO', 'SUSPENDIDO') DEFAULT 'ACTIVO',
    id_rol INT NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Tabla EMPRESAS_CONVENIO
CREATE TABLE empresas_convenio (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    estado_convenio ENUM('ACTIVO', 'VENCIDO') DEFAULT 'ACTIVO',
    documento_convenio_ruta VARCHAR(255) NULL
) ENGINE=InnoDB;

-- 4. Tabla ESTUDIANTES
CREATE TABLE estudiantes (
    id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(8) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    programa_estudios VARCHAR(100) DEFAULT 'Diseño y Programación Web',
    semestre VARCHAR(10) NOT NULL,
    id_docente_asesor INT NULL,
    FOREIGN KEY (id_docente_asesor) REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. Tabla EXPEDIENTES_EFSRT (Núcleo Académico)
CREATE TABLE expedientes_efsrt (
    id_expediente INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_empresa INT NOT NULL,
    id_docente_evaluador INT NULL,
    horas_acumuladas INT DEFAULT 0,
    estado_efsrt ENUM('No efectuó', 'Por verificar', 'Validado') DEFAULT 'Por verificar',
    portafolio_fisico_revisado BOOLEAN DEFAULT FALSE,
    observaciones TEXT NULL,
    fecha_validacion DATETIME NULL,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_empresa) REFERENCES empresas_convenio(id_empresa) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_docente_evaluador) REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Tabla CONSTANCIAS_EMITIDAS
CREATE TABLE constancias_emitidas (
    id_constancia INT AUTO_INCREMENT PRIMARY KEY,
    id_expediente INT NOT NULL,
    id_administrador INT NOT NULL,
    codigo_documento VARCHAR(50) NOT NULL UNIQUE,
    tipo_emision ENUM('Original', 'Duplicado') DEFAULT 'Original',
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    ruta_archivo_pdf VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_expediente) REFERENCES expedientes_efsrt(id_expediente) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_administrador) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Insertar Datos Semilla Básicos
INSERT INTO roles (nombre_rol) VALUES ('Administrador'), ('Docente');