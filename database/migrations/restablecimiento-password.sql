ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS restablecimiento_token_activo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS restablecimiento_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS restablecimiento_jti TEXT,
    ADD COLUMN IF NOT EXISTS restablecimiento_expira_en TIMESTAMPTZ;
