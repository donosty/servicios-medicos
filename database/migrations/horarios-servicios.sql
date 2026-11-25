WITH nuevas_especialidades AS (
INSERT INTO especialidades_medicas (clave, nombre, descripcion, ruta_icono, orden_visualizacion)
VALUES
    ('medicina-general', 'Medicina General', 'Consulta médica general y atención preventiva.', '/assets/icons/medicina-general.webp', 10),
    ('imagenologia', 'Imagenología', 'Estudios de ultrasonido y rayos X.', '/assets/icons/tecnologia.webp', 11)
ON CONFLICT (clave) DO NOTHING
RETURNING id_especialidad, clave
)
INSERT INTO servicios_especialidades (id_servicio, id_especialidad)
SELECT servicio.id_servicio, especialidad.id_especialidad
FROM servicios_medicos AS servicio
JOIN nuevas_especialidades AS especialidad ON especialidad.clave = servicio.clave
WHERE servicio.clave IN ('medicina-general', 'imagenologia')
ON CONFLICT (id_servicio, id_especialidad) DO NOTHING;

INSERT INTO medicos (id_medico, titulo_profesional, nombre, apellidos, descripcion, ruta_imagen)
VALUES
    ('bb08d6a1-9d37-4a4d-90a1-08e054d5e101', 'Dra.', 'Paula', 'Méndez', 'Médica general con enfoque en atención primaria y prevención.', '/assets/Photo 1.jpg'),
    ('aa782f30-fe47-455c-8d45-2019a24a86a2', 'Dr.', 'Emiliano', 'Ríos', 'Especialista en imagenología, ultrasonido y radiología diagnóstica.', '/assets/photo 5.jpg')
ON CONFLICT (id_medico) DO NOTHING;

INSERT INTO especialidades_medicos (id_medico, id_especialidad)
SELECT asignacion.id_medico, especialidad.id_especialidad
FROM (VALUES
    ('bb08d6a1-9d37-4a4d-90a1-08e054d5e101'::uuid, 'medicina-general'),
    ('aa782f30-fe47-455c-8d45-2019a24a86a2'::uuid, 'imagenologia')
) AS asignacion(id_medico, clave_especialidad)
JOIN especialidades_medicas AS especialidad ON especialidad.clave = asignacion.clave_especialidad
WHERE NOT EXISTS (
    SELECT 1 FROM especialidades_medicos AS existente
    WHERE existente.id_medico = asignacion.id_medico
)
ON CONFLICT (id_medico, id_especialidad) DO NOTHING;

INSERT INTO horarios_disponibilidad_medicos (id_medico, dia_semana, hora_inicio)
SELECT medico.id_medico, dias.dia_semana, horario.hora_inicio
FROM medicos AS medico
CROSS JOIN generate_series(1, 5) AS dias(dia_semana)
CROSS JOIN (VALUES (TIME '09:00'), (TIME '10:30'), (TIME '12:00')) AS horario(hora_inicio)
WHERE medico.id_medico IN (
    'bb08d6a1-9d37-4a4d-90a1-08e054d5e101',
    'aa782f30-fe47-455c-8d45-2019a24a86a2'
)
ON CONFLICT (id_medico, dia_semana, hora_inicio) DO NOTHING;
