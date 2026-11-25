-- Las cuentas existentes se consideran verificadas; las nuevas requieren confirmación.
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS correo_confirmado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS confirmacion_correo_token_activo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS confirmacion_correo_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS confirmacion_correo_jti TEXT,
    ADD COLUMN IF NOT EXISTS confirmacion_correo_expira_en TIMESTAMPTZ;

ALTER TABLE usuarios
    ALTER COLUMN correo_confirmado SET DEFAULT FALSE;

UPDATE usuarios AS usuario
SET correo_confirmado = TRUE
FROM roles_usuario AS rol
WHERE usuario.id_rol = rol.id_rol
  AND rol.codigo = 'administrador';
