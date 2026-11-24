-- Los tokens de recuperación pertenecen a la cuenta de usuario que inicia sesión.
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS restablecimiento_token_activo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS restablecimiento_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS restablecimiento_jti TEXT,
    ADD COLUMN IF NOT EXISTS restablecimiento_expira_en TIMESTAMPTZ;

-- Versiones anteriores del esquema colocaron accidentalmente estos campos en medicos.
ALTER TABLE medicos
    DROP COLUMN IF EXISTS restablecimiento_token_activo,
    DROP COLUMN IF EXISTS restablecimiento_token_hash,
    DROP COLUMN IF EXISTS restablecimiento_jti,
    DROP COLUMN IF EXISTS restablecimiento_expira_en;
