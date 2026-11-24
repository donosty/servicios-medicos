#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${ADMIN_EMAIL:?ADMIN_EMAIL is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"

export PGSSLMODE="${PGSSLMODE:-require}"

psql "$DATABASE_URL" \
  --set=ON_ERROR_STOP=1 \
  --set="ADMIN_NAME=${ADMIN_NAME:-Administrador MEDICOM}" \
  --set="ADMIN_EMAIL=$ADMIN_EMAIL" \
  --set="ADMIN_PASSWORD=$ADMIN_PASSWORD" \
  --file /migrations/database/init.sql

psql "$DATABASE_URL" \
  --set=ON_ERROR_STOP=1 \
  --file /migrations/database/migrations/reprogramacion-citas.sql
