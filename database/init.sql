BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS especialidades_medicas (
    id_especialidad SMALLSERIAL PRIMARY KEY,
    clave TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    ruta_icono TEXT,
    esta_activa BOOLEAN NOT NULL DEFAULT TRUE,
    orden_visualizacion SMALLINT NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT especialidades_medicas_nombre_no_vacio CHECK (btrim(nombre) <> ''),
    CONSTRAINT especialidades_medicas_clave_formato CHECK (clave ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS medicos (
    id_medico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo_profesional TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    ruta_imagen TEXT,
    esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medicos_titulo_no_vacio CHECK (btrim(titulo_profesional) <> ''),
    CONSTRAINT medicos_nombre_no_vacio CHECK (btrim(nombre) <> ''),
    CONSTRAINT medicos_apellidos_no_vacio CHECK (btrim(apellidos) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS medicos_nombre_completo_unico
    ON medicos (titulo_profesional, nombre, apellidos);

CREATE TABLE IF NOT EXISTS especialidades_medicos (
    id_medico UUID NOT NULL,
    id_especialidad SMALLINT NOT NULL,
    PRIMARY KEY (id_medico, id_especialidad),
    CONSTRAINT especialidades_medicos_medico_fk
        FOREIGN KEY (id_medico) REFERENCES medicos (id_medico)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT especialidades_medicos_especialidad_fk
        FOREIGN KEY (id_especialidad) REFERENCES especialidades_medicas (id_especialidad)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS horarios_disponibilidad_medicos (
    id_horario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_medico UUID NOT NULL,
    dia_semana SMALLINT NOT NULL,
    hora_inicio TIME NOT NULL,
    duracion_minutos SMALLINT NOT NULL DEFAULT 30,
    esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT horarios_disponibilidad_medico_fk
        FOREIGN KEY (id_medico) REFERENCES medicos (id_medico)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT horarios_dia_semana_valido CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT horarios_duracion_valida CHECK (duracion_minutos BETWEEN 15 AND 240)
);

CREATE UNIQUE INDEX IF NOT EXISTS horarios_medico_dia_hora_unicos
    ON horarios_disponibilidad_medicos (id_medico, dia_semana, hora_inicio);

CREATE TABLE IF NOT EXISTS pacientes (
    id_paciente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    telefono TEXT NOT NULL,
    correo TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pacientes_nombre_no_vacio CHECK (btrim(nombre_completo) <> ''),
    CONSTRAINT pacientes_telefono_no_vacio CHECK (btrim(telefono) <> ''),
    CONSTRAINT pacientes_correo_formato
        CHECK (correo ~* '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS pacientes_correo_unico
    ON pacientes (lower(correo));

CREATE TABLE IF NOT EXISTS roles_usuario (
    id_rol SMALLSERIAL PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    CONSTRAINT roles_usuario_codigo_formato CHECK (codigo ~ '^[a-z_]+$')
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID UNIQUE,
    nombre_completo TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    telefono TEXT,
    contrasena_hash TEXT NOT NULL,
    id_rol SMALLINT NOT NULL,
    esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_paciente_fk
        FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT usuarios_rol_fk
        FOREIGN KEY (id_rol) REFERENCES roles_usuario (id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT usuarios_nombre_no_vacio CHECK (btrim(nombre_completo) <> ''),
    CONSTRAINT usuarios_correo_formato
        CHECK (correo ~* '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*$')
);

CREATE TABLE IF NOT EXISTS sesiones_usuario (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expira_en TIMESTAMPTZ NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sesiones_usuario_fk
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estados_citas (
    id_estado SMALLSERIAL PRIMARY KEY,
    codigo_estado TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    CONSTRAINT estados_citas_codigo_formato
        CHECK (codigo_estado ~ '^[a-z_]+$')
);

CREATE TABLE IF NOT EXISTS citas (
    id_cita UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL UNIQUE,
    id_usuario UUID,
    id_paciente UUID NOT NULL,
    id_medico UUID NOT NULL,
    id_especialidad SMALLINT NOT NULL,
    inicia_en TIMESTAMPTZ NOT NULL,
    termina_en TIMESTAMPTZ NOT NULL,
    id_estado SMALLINT NOT NULL,
    notas TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT citas_usuario_fk
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT citas_paciente_fk
        FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT citas_medico_especialidad_fk
        FOREIGN KEY (id_medico, id_especialidad) REFERENCES especialidades_medicos (id_medico, id_especialidad)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT citas_estado_fk
        FOREIGN KEY (id_estado) REFERENCES estados_citas (id_estado)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT citas_horario_valido CHECK (termina_en > inicia_en)
);

ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS id_usuario UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'citas_usuario_fk'
    ) THEN
        ALTER TABLE citas
            ADD CONSTRAINT citas_usuario_fk
            FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS registros_citas (
    id_registro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cita UUID NOT NULL UNIQUE,
    folio TEXT NOT NULL UNIQUE,
    nombre_especialidad TEXT NOT NULL,
    nombre_medico TEXT NOT NULL,
    nombre_paciente TEXT NOT NULL,
    telefono_paciente TEXT NOT NULL,
    correo_paciente TEXT NOT NULL,
    fecha_cita DATE NOT NULL,
    hora_cita TIME NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT registros_citas_cita_fk
        FOREIGN KEY (id_cita) REFERENCES citas (id_cita)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS citas_medico_inicio_unico
    ON citas (id_medico, inicia_en)
    WHERE id_estado != 4;

CREATE INDEX IF NOT EXISTS citas_paciente_fecha_idx
    ON citas (id_paciente, inicia_en DESC);

CREATE INDEX IF NOT EXISTS citas_estado_fecha_idx
    ON citas (id_estado, inicia_en);

CREATE TABLE IF NOT EXISTS beneficios_atencion (
    id_beneficio SMALLSERIAL PRIMARY KEY,
    clave TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    ruta_icono TEXT,
    orden_visualizacion SMALLINT NOT NULL DEFAULT 0,
    esta_activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS testimonios_pacientes (
    id_testimonio SMALLSERIAL PRIMARY KEY,
    nombre_paciente TEXT NOT NULL,
    comentario TEXT NOT NULL,
    ruta_retrato TEXT,
    iniciales TEXT,
    calificacion SMALLINT NOT NULL DEFAULT 5,
    orden_visualizacion SMALLINT NOT NULL DEFAULT 0,
    esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT testimonios_calificacion_valida CHECK (calificacion BETWEEN 1 AND 5),
    CONSTRAINT testimonios_nombre_no_vacio CHECK (btrim(nombre_paciente) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS testimonios_nombre_paciente_unico
    ON testimonios_pacientes (nombre_paciente);

CREATE TABLE IF NOT EXISTS servicios_medicos (
    id_servicio SMALLSERIAL PRIMARY KEY,
    clave TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    ruta_icono TEXT,
    esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden_visualizacion SMALLINT NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT servicios_medicos_nombre_no_vacio CHECK (btrim(nombre) <> ''),
    CONSTRAINT servicios_medicos_clave_formato CHECK (clave ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE OR REPLACE FUNCTION establecer_actualizado_en()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS medicos_establecer_actualizado_en ON medicos;
CREATE TRIGGER medicos_establecer_actualizado_en
BEFORE UPDATE ON medicos
FOR EACH ROW EXECUTE FUNCTION establecer_actualizado_en();

DROP TRIGGER IF EXISTS pacientes_establecer_actualizado_en ON pacientes;
CREATE TRIGGER pacientes_establecer_actualizado_en
BEFORE UPDATE ON pacientes
FOR EACH ROW EXECUTE FUNCTION establecer_actualizado_en();

DROP TRIGGER IF EXISTS citas_establecer_actualizado_en ON citas;
CREATE TRIGGER citas_establecer_actualizado_en
BEFORE UPDATE ON citas
FOR EACH ROW EXECUTE FUNCTION establecer_actualizado_en();

DROP TRIGGER IF EXISTS usuarios_establecer_actualizado_en ON usuarios;
CREATE TRIGGER usuarios_establecer_actualizado_en
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION establecer_actualizado_en();

DROP TRIGGER IF EXISTS sesiones_establecer_actualizado_en ON sesiones_usuario;
CREATE TRIGGER sesiones_establecer_actualizado_en
BEFORE UPDATE ON sesiones_usuario
FOR EACH ROW EXECUTE FUNCTION establecer_actualizado_en();

INSERT INTO especialidades_medicas (clave, nombre, descripcion, ruta_icono, orden_visualizacion)
VALUES
    ('neurologia', 'Neurología', 'Diagnóstico y atención integral de trastornos del sistema nervioso.', '/assets/icons/neurologia.webp', 1),
    ('traumatologia', 'Traumatología', 'Atención especializada de lesiones traumáticas y del sistema musculoesquelético.', '/assets/icons/traumatologia.webp', 2),
    ('ortopedia', 'Ortopedia', 'Tratamiento de huesos, articulaciones y problemas de movimiento.', '/assets/icons/ortopedia.webp', 3),
    ('cardiologia', 'Cardiología', 'Prevención, diagnóstico y cuidado integral de tu corazón.', '/assets/icons/cardiologia.webp', 4),
    ('pediatria', 'Pediatría', 'Cuidamos la salud y el desarrollo de niñas y niños.', '/assets/icons/pediatria.webp', 5),
    ('nutricion', 'Nutrición', 'Acompañamiento personalizado para una alimentación saludable.', '/assets/icons/nutricion.webp', 6),
    ('cirugia-maxilofacial', 'Cirugía Maxilofacial', 'Atención quirúrgica de boca, cara, mandíbula y estructuras relacionadas.', '/assets/icons/cirugia-maxilofacial.webp', 7),
    ('cirugia-plastica', 'Cirugía Plástica', 'Procedimientos reconstructivos y estéticos con atención especializada.', '/assets/icons/cirugia-plastica.webp', 8),
    ('psiquiatria', 'Psiquiatría', 'Evaluación y tratamiento especializado de la salud mental.', '/assets/icons/psiquiatria.webp', 9)
ON CONFLICT (clave) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    ruta_icono = EXCLUDED.ruta_icono,
    orden_visualizacion = EXCLUDED.orden_visualizacion;

INSERT INTO medicos (id_medico, titulo_profesional, nombre, apellidos, descripcion, ruta_imagen)
VALUES
    ('1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10', 'Dr.', 'Daniel', 'Vega', 'Especialista en diagnóstico y tratamiento neurológico.', '/assets/photo 2.jpg'),
    ('2f5e3e32-83ed-4a1e-c38b-9b5b2f5d7f21', 'Dra.', 'Laura', 'Morales', 'Especialista en lesiones traumáticas y recuperación funcional.', '/assets/photo 3.jpg'),
    ('3f6a4f43-94fe-5b2f-d49c-ac6c3f6e8f32', 'Dr.', 'Ricardo', 'Navarro', 'Especialista en traumatología y salud de las articulaciones.', '/assets/photo 4.jpg'),
    ('4d170f18-a7d8-4c73-bc8d-6a51ec8f7ed7', 'Dr.', 'Carlos', 'Ramírez', 'Cardiólogo. Prevención y cuidado integral de tu corazón.', '/assets/photo 5.jpg'),
    ('6baf45e3-9a30-4d90-9ec3-5b9bd8d4fb41', 'Dra.', 'Sofía', 'Martínez', 'Pediatra. Especialista en atención integral infantil.', '/assets/photo 2.jpg'),
    ('5f7b5f54-a50f-6c30-e5ad-bd7d4f7f9f43', 'Lic.', 'Mariana', 'Cruz', 'Nutrióloga clínica con atención personalizada.', '/assets/photo 3.jpg'),
    ('6f8c6f65-b610-7d41-f6be-ce8e5f8fa054', 'Dr.', 'Alejandro', 'Ibarra', 'Especialista en cirugía oral y cirugía maxilofacial.', '/assets/photo 4.jpg'),
    ('7f9d7f76-c721-8e52-f7cf-df9f6f9fb165', 'Dra.', 'Valeria', 'Santos', 'Especialista en cirugía reconstructiva y plástica.', '/assets/photo 5.jpg'),
    ('8fac8077-d832-9f63-f8df-ffaf718fc276', 'Dr.', 'Andrés', 'Herrera', 'Psiquiatra enfocado en atención integral de la salud mental.', '/assets/photo 2.jpg')
ON CONFLICT (id_medico) DO UPDATE
SET titulo_profesional = EXCLUDED.titulo_profesional,
    nombre = EXCLUDED.nombre,
    apellidos = EXCLUDED.apellidos,
    descripcion = EXCLUDED.descripcion,
    ruta_imagen = EXCLUDED.ruta_imagen;

INSERT INTO especialidades_medicos (id_medico, id_especialidad)
SELECT asignacion.id_medico, especialidad.id_especialidad
FROM (
    VALUES
        ('1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10'::uuid, 'neurologia'),
        ('2f5e3e32-83ed-4a1e-c38b-9b5b2f5d7f21'::uuid, 'traumatologia'),
        ('3f6a4f43-94fe-5b2f-d49c-ac6c3f6e8f32'::uuid, 'ortopedia'),
        ('4d170f18-a7d8-4c73-bc8d-6a51ec8f7ed7'::uuid, 'cardiologia'),
        ('6baf45e3-9a30-4d90-9ec3-5b9bd8d4fb41'::uuid, 'pediatria'),
        ('5f7b5f54-a50f-6c30-e5ad-bd7d4f7f9f43'::uuid, 'nutricion'),
        ('6f8c6f65-b610-7d41-f6be-ce8e5f8fa054'::uuid, 'cirugia-maxilofacial'),
        ('7f9d7f76-c721-8e52-f7cf-df9f6f9fb165'::uuid, 'cirugia-plastica'),
        ('8fac8077-d832-9f63-f8df-ffaf718fc276'::uuid, 'psiquiatria')
) AS asignacion (id_medico, clave_especialidad)
JOIN especialidades_medicas especialidad
    ON especialidad.clave = asignacion.clave_especialidad
ON CONFLICT (id_medico, id_especialidad) DO NOTHING;

INSERT INTO estados_citas (codigo_estado, nombre)
VALUES
    ('pendiente', 'Pendiente'),
    ('confirmada', 'Confirmada'),
    ('completada', 'Completada'),
    ('cancelada', 'Cancelada'),
    ('no_asistio', 'No asistió')
ON CONFLICT (codigo_estado) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO horarios_disponibilidad_medicos (id_medico, dia_semana, hora_inicio, duracion_minutos)
SELECT medico.id_medico,
       dia_semana,
       hora_inicio::time,
       30
FROM medicos medico
CROSS JOIN generate_series(1, 6) AS dia_semana
CROSS JOIN (VALUES
    ('08:00:00'),
    ('09:30:00'),
    ('11:00:00'),
    ('12:30:00'),
    ('16:00:00'),
    ('17:30:00'),
    ('18:30:00'),
    ('19:30:00')
) AS horario(hora_inicio)
ON CONFLICT (id_medico, dia_semana, hora_inicio) DO NOTHING;

INSERT INTO beneficios_atencion (clave, nombre, descripcion, ruta_icono, orden_visualizacion)
VALUES
    ('profesionales', 'Profesionales calificados', 'Un equipo de especialistas dedicado a tu salud.', '/assets/icons/profesionales.webp', 1),
    ('tecnologia', 'Tecnología de vanguardia', 'Herramientas que apoyan a tu médico en cada consulta.', '/assets/icons/tecnologia.webp', 2),
    ('atencion', 'Atención personalizada', 'Escuchamos tus inquietudes y dedicamos tiempo a tus preguntas.', '/assets/icons/atencion.webp', 3),
    ('servicio', 'Servicio accesible', 'Información clara para encontrar la atención que buscas.', '/assets/icons/servicio.webp', 4)
ON CONFLICT (clave) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    ruta_icono = EXCLUDED.ruta_icono,
    orden_visualizacion = EXCLUDED.orden_visualizacion;

INSERT INTO testimonios_pacientes (nombre_paciente, comentario, ruta_retrato, iniciales, calificacion, orden_visualizacion)
VALUES
    ('Mariana López', 'La pediatra escuchó todas mis preguntas. Mi hija se sintió en confianza desde el primer momento.', '/assets/testimonio-1.webp', NULL, 5, 1),
    ('Elena Ruiz', 'Me explicaron cada paso de mi consulta con calma. Agradecí mucho ese trato tan cercano.', '/assets/testimonio-2.webp', NULL, 5, 2),
    ('Diego Torres', 'Encontré la especialidad que buscaba y desde recepción me orientaron con mucha amabilidad.', '/assets/testimonio-3.webp', NULL, 5, 3),
    ('Ana Vega', 'Pude acompañar a mi mamá a su consulta. El equipo nos dedicó tiempo para resolver nuestras dudas.', NULL, 'AV', 5, 4)
ON CONFLICT (nombre_paciente) DO UPDATE
SET comentario = EXCLUDED.comentario,
    ruta_retrato = EXCLUDED.ruta_retrato,
    iniciales = EXCLUDED.iniciales,
    calificacion = EXCLUDED.calificacion,
    orden_visualizacion = EXCLUDED.orden_visualizacion;

INSERT INTO servicios_medicos (clave, nombre, descripcion, ruta_icono, orden_visualizacion)
VALUES
    ('urgencias', 'Urgencias', 'Atención médica inmediata para situaciones que requieren valoración prioritaria.', NULL, 1),
    ('imagenologia', 'Imagenología', 'Estudios de imagen médica para apoyar el diagnóstico y seguimiento clínico.', NULL, 2),
    ('laboratorio', 'Laboratorio', 'Análisis clínicos y estudios de laboratorio para la prevención y el diagnóstico.', NULL, 3),
    ('medicina-general', 'Medicina General', 'Consulta integral y atención primaria para el cuidado general de la salud.', NULL, 4)
ON CONFLICT (clave) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    ruta_icono = EXCLUDED.ruta_icono,
    orden_visualizacion = EXCLUDED.orden_visualizacion;

INSERT INTO roles_usuario (codigo, nombre)
VALUES
    ('consumidor', 'Consumidor'),
    ('administrador', 'Administrador')
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO usuarios (
    nombre_completo,
    correo,
    telefono,
    contrasena_hash,
    id_rol
)
SELECT
    'Administrador MEDICOM',
    'admin@medicom.com',
    NULL,
    crypt('Admin123!', gen_salt('bf', 12)),
    id_rol
FROM roles_usuario
WHERE codigo = 'administrador'
ON CONFLICT (correo) DO NOTHING;

COMMIT;
