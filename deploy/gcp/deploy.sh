#!/bin/sh
set -eu

cd /opt/servicios-medicos

# Verificar que el disco persistente está montado.
if ! mountpoint -q /srv/medicom-data; then
  echo "ERROR: El disco medicom-data no está montado." >&2
  exit 1
fi

# Verificar el directorio de PostgreSQL.
if [ ! -d /srv/medicom-data/postgres ]; then
  echo "ERROR: No existe el directorio de datos de PostgreSQL." >&2
  exit 1
fi

mv /tmp/docker-compose.prod.yml ./docker-compose.prod.yml
mv /tmp/.env.production ./.env.production
mv /tmp/Caddyfile ./Caddyfile
chmod 600 ./.env.production

DOCKERHUB_USERNAME=$(python3 - "$PWD/.env.production" <<'PY'
import json
import sys
for line in open(sys.argv[1], encoding="utf-8"):
    key, separator, value = line.strip().partition("=")
    if separator and key == "DOCKERHUB_USERNAME":
        print(json.loads(value).replace("$$", "$"))
        break
PY
)
DOCKERHUB_TOKEN=$(python3 - "$PWD/.env.production" <<'PY'
import json
import sys
for line in open(sys.argv[1], encoding="utf-8"):
    key, separator, value = line.strip().partition("=")
    if separator and key == "DOCKERHUB_TOKEN":
        print(json.loads(value).replace("$$", "$"), end="")
        break
PY
)

if [ -n "$DOCKERHUB_TOKEN" ]; then
  printf '%s' "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

compose() {
  docker compose --env-file .env.production -f docker-compose.prod.yml "$@"
}

compose --profile migrations config --quiet
compose --profile migrations pull
compose up -d --wait --wait-timeout 120 db
compose run --rm --no-deps migrations
compose up -d --wait --wait-timeout 180 backend frontend
# Reabrir el bind mount incluso si el Caddyfile fue reemplazado por mv.
compose up -d --force-recreate --wait --wait-timeout 60 caddy
docker compose --env-file .env.production -f docker-compose.prod.yml ps
PUBLIC_HOST=$(python3 - "$PWD/.env.production" <<'PYHOST'
import json, sys
for line in open(sys.argv[1], encoding="utf-8"):
    key, separator, value = line.strip().partition("=")
    if separator and key == "PUBLIC_HOST":
        print(json.loads(value))
        break
PYHOST
)

# Verifica certificado, Caddy y backend. No omitir la validacion TLS con -k.
for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error --connect-timeout 5 --max-time 10 \
      --resolve "$PUBLIC_HOST:443:127.0.0.1" "https://$PUBLIC_HOST/health"; then
    exit 0
  fi
  sleep 5
done
printf '%s\n' 'No se pudo verificar HTTPS. Revisar DNS, firewall y logs de Caddy.' >&2
exit 1
