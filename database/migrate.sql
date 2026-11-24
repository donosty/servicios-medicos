\set ON_ERROR_STOP on

-- Esquema base y datos iniciales.
\ir init.sql

-- Migraciones incrementales: mantener aquí el orden de ejecución compartido.
\ir migrations/precios-servicios.sql
\ir migrations/catalogo-servicios.sql
\ir migrations/horarios-servicios.sql
\ir migrations/reprogramacion-citas.sql
\ir migrations/normalizar-identificadores-medicos.sql
\ir migrations/restablecimiento-password.sql
