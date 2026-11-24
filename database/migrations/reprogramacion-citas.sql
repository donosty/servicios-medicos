ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS reprogramada_en TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS historial_citas (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cita UUID NOT NULL,
    id_usuario UUID,
    version_anterior JSONB NOT NULL,
    version_actualizada JSONB NOT NULL,
    realizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT historial_citas_cita_fk
        FOREIGN KEY (id_cita) REFERENCES citas (id_cita)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT historial_citas_usuario_fk
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS historial_citas_cita_fecha_idx
    ON historial_citas (id_cita, realizado_en DESC);
