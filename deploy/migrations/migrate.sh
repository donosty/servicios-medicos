#!/bin/sh
set -eu

: "${ADMIN_EMAIL:?ADMIN_EMAIL is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"

export PGSSLMODE="${PGSSLMODE:-require}"

if [ -n "${DATABASE_URL:-}" ]; then
  set -- "$DATABASE_URL"
else
  : "${DB_HOST:?DB_HOST is required when DATABASE_URL is not set}"
  : "${DB_USER:?DB_USER is required when DATABASE_URL is not set}"
  : "${DB_PASSWORD:?DB_PASSWORD is required when DATABASE_URL is not set}"
  : "${DB_NAME:?DB_NAME is required when DATABASE_URL is not set}"

  export PGPASSWORD="$DB_PASSWORD"
  set -- --host "$DB_HOST" \
    --port "${DB_PORT:-5432}" \
    --username "$DB_USER" \
    --dbname "$DB_NAME"
fi

psql "$@" \
  --set=ON_ERROR_STOP=1 \
  --set="ADMIN_NAME=${ADMIN_NAME:-Administrador MEDICOM}" \
  --set="ADMIN_EMAIL=$ADMIN_EMAIL" \
  --set="ADMIN_PASSWORD=$ADMIN_PASSWORD" \
  --file /migrations/database/migrate.sql
