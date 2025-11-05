-- SCRIPT FINAL DE INICIALIZACIÓN (Para PostgreSQL)

-- 1. LIMPIEZA Y CREACIÓN DE ESTRUCTURA
DROP TABLE IF EXISTS usuarios, planes, suscripciones, clases, reservas, rutinas, consultas, avisos, plantillas_horarios, roles CASCADE;

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE planes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  max_clases_semana INT,
  max_clases_simultaneas INT
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  rol_id INT NOT NULL REFERENCES roles(id)
);

CREATE TABLE suscripciones (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
  plan_id INT NOT NULL REFERENCES planes(id),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente' 
);

CREATE TABLE clases (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  profesor_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP NOT NULL,
  duracion_minutos INT DEFAULT 60,
  capacidad_maxima INT NOT NULL
);

CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  clase_id INT NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
  fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  asistio BOOLEAN DEFAULT FALSE,
  UNIQUE(cliente_id, clase_id)
);

CREATE TABLE rutinas (
  id SERIAL PRIMARY KEY,
  profesor_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consultas (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  profesor_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  clase_id INT NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  respuesta TEXT,
  fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta TIMESTAMP
);

CREATE TABLE avisos (
  id SERIAL PRIMARY KEY,
  profesor_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  clase_id INT REFERENCES clases(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plantillas_horarios (
  id SERIAL PRIMARY KEY,
  nombre_clase VARCHAR(100) NOT NULL,
  descripcion TEXT,
  profesor_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL, 
  hora_inicio TIME NOT NULL,
  duracion_minutos INT DEFAULT 60,
  capacidad_maxima INT DEFAULT 20
);


-- 2. INSERCIÓN DE DATOS INICIALES
INSERT INTO roles (nombre) VALUES ('cliente'), ('profesor'), ('administracion'), ('jefe');

INSERT INTO planes (nombre, descripcion, precio, max_clases_semana, max_clases_simultaneas) 
VALUES
('Básico', 'Acceso a 1 clase, máximo 2 asistencias por semana', 3000.00, 2, 1),
('Medio', 'Acceso a 2 clases, máximo 4 asistencias por semana', 5000.00, 4, 2),
('Premium', 'Acceso ilimitado a todas las clases', 7000.00, NULL, NULL);

INSERT INTO usuarios (nombre, email, password, dni, rol_id)
VALUES (
    'Jefe Principal', 
    'jefe@gimnasio.com', 
    '$2a$10$f5.yK2S0S.wojNEQ7QY8TOfn/Y5.u.A63oV.s8iFpSjCj5jJ.8/mi', 
    '123456', 
    (SELECT id FROM roles WHERE nombre = 'jefe')
);