ALTER TABLE servicios_medicos
    ADD COLUMN IF NOT EXISTS precio NUMERIC(10, 2)
    CHECK (precio >= 0);

INSERT INTO servicios_medicos (clave, nombre, descripcion, orden_visualizacion)
VALUES
    ('consulta-especializada', 'Consulta Especializada', 'Valoración médica por un especialista.', 5),
    ('cirugia-ambulatoria', 'Cirugía Ambulatoria y Endoscopia', 'Procedimientos con recuperación el mismo día.', 6)
ON CONFLICT (clave) DO NOTHING;

UPDATE servicios_medicos AS servicio
SET precio = tarifa.precio
FROM (VALUES
    ('urgencias', 950.00),
    ('imagenologia', 1200.00),
    ('laboratorio', 650.00),
    ('medicina-general', 700.00),
    ('consulta-especializada', 900.00),
    ('cirugia-ambulatoria', 8500.00)
) AS tarifa(clave, precio)
WHERE servicio.clave = tarifa.clave AND servicio.precio IS NULL;
