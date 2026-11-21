ALTER TABLE servicios_medicos
    ADD COLUMN IF NOT EXISTS titulo_catalogo TEXT,
    ADD COLUMN IF NOT EXISTS descripcion_catalogo TEXT,
    ADD COLUMN IF NOT EXISTS categoria TEXT,
    ADD COLUMN IF NOT EXISTS simbolo TEXT,
    ADD COLUMN IF NOT EXISTS caracteristicas TEXT[],
    ADD COLUMN IF NOT EXISTS orden_catalogo SMALLINT;

CREATE TABLE IF NOT EXISTS servicios_especialidades (
    id_servicio SMALLINT NOT NULL,
    id_especialidad SMALLINT NOT NULL,
    PRIMARY KEY (id_servicio, id_especialidad),
    CONSTRAINT servicios_especialidades_servicio_fk
        FOREIGN KEY (id_servicio) REFERENCES servicios_medicos (id_servicio)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT servicios_especialidades_especialidad_fk
        FOREIGN KEY (id_especialidad) REFERENCES especialidades_medicas (id_especialidad)
        ON UPDATE CASCADE ON DELETE CASCADE
);

WITH fichas (clave, titulo, descripcion, categoria, simbolo, caracteristicas, orden) AS (
    VALUES
        (
            'consulta-especializada',
            'Consulta Especializada',
            'Cardiología, pediatría, neurología y más de 20 disciplinas importantes por médicos.',
            'Consultas Médicas',
            '♧',
            ARRAY['25+ Médicos especialistas certificados', 'Citas presenciales y en el mismo día'],
            1
        ),
        (
            'laboratorio',
            'Laboratorio Clínico Automatizado',
            'Análisis clínicos precisos de sangre, perfiles bioquímicos, inmunología y estudios especializados.',
            'Laboratorio Clínico',
            '⚗',
            ARRAY['Entrega de resultados digitales el mismo día', 'Acceso seguro encriptado desde el portal'],
            2
        ),
        (
            'imagenologia',
            'Ultrasonido y Rayos X Digital',
            'Imagenología diagnóstica digital de alta definición, ecografía Doppler, color y rayos X.',
            'Diagnóstico e Imagen',
            '▦',
            ARRAY['Informe radiológico detallado en menos de 24 hrs', 'Interpretado por médicos subespecialistas'],
            3
        ),
        (
            'medicina-general',
            'Check-up Preventivo Integral',
            'Protocolos diseñados por rango de edad que integran electrocardiograma, pruebas y consultas.',
            'Preventivo',
            '♡',
            ARRAY['Valoración médica integral en una sola sesión', 'Plan personalizado y reporte con recomendaciones'],
            4
        ),
        (
            'cirugia-ambulatoria',
            'Cirugía Ambulatoria y Endoscopia',
            'Salas quirúrgicas estériles y unidades de recuperación inmediata para procedimientos seguros.',
            'Cirugía Ambulatoria',
            '▱',
            ARRAY['Alta médica y recuperación segura el mismo día', 'Protocolos antisépticos con estándares mundiales'],
            5
        ),
        (
            'urgencias',
            'Urgencias y Triaje Continuo',
            'Guardia médica permanente los 365 días del año con clasificación inmediata.',
            'Urgencias 24/7',
            '⊕',
            ARRAY['Atención presencial según el nivel de urgencia', 'Enlace directo con unidades de ambulancia'],
            6
        )
), servicios_inicializados AS (
    UPDATE servicios_medicos AS servicio
    SET titulo_catalogo = COALESCE(servicio.titulo_catalogo, ficha.titulo),
        descripcion_catalogo = COALESCE(servicio.descripcion_catalogo, ficha.descripcion),
        categoria = COALESCE(servicio.categoria, ficha.categoria),
        simbolo = COALESCE(servicio.simbolo, ficha.simbolo),
        caracteristicas = COALESCE(servicio.caracteristicas, ficha.caracteristicas),
        orden_catalogo = ficha.orden
    FROM fichas AS ficha
    WHERE servicio.clave = ficha.clave
        AND servicio.orden_catalogo IS NULL
    RETURNING servicio.id_servicio, servicio.clave
)
INSERT INTO servicios_especialidades (id_servicio, id_especialidad)
SELECT servicio.id_servicio, especialidad.id_especialidad
FROM servicios_inicializados AS servicio
JOIN (
    VALUES
        ('consulta-especializada', 'cardiologia'),
        ('consulta-especializada', 'pediatria'),
        ('consulta-especializada', 'neurologia'),
        ('laboratorio', 'analisis-clinicos'),
        ('laboratorio', 'laboratorio'),
        ('imagenologia', 'imagenologia'),
        ('medicina-general', 'medicina-general'),
        ('cirugia-ambulatoria', 'cirugia-maxilofacial'),
        ('cirugia-ambulatoria', 'cirugia-plastica')
) AS asignacion (clave_servicio, clave_especialidad)
    ON asignacion.clave_servicio = servicio.clave
JOIN especialidades_medicas AS especialidad
    ON especialidad.clave = asignacion.clave_especialidad
ON CONFLICT (id_servicio, id_especialidad) DO NOTHING;
