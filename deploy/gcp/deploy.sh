#!/bin/sh
set -eu

cd /opt/servicios-medicos
mv /tmp/docker-compose.prod.yml ./docker-compose.prod.yml
mv /tmp/.env.production ./.env.production
chmod 600 ./.env.production

DOCKERHUB_USERNAME=$(python3 - "$PWD/.env.production" <<'PY'
import json
import sys
for line in open(sys.argv[1], encoding="utf-8"):
    key, separator, value = line.strip().partition("=")
    if separator and key == "DOCKERHUB_USERNAME":
        print(json.loads(value))
        break
PY
)
DOCKERHUB_TOKEN=$(python3 - "$PWD/.env.production" <<'PY'
import json
import sys
for line in open(sys.argv[1], encoding="utf-8"):
    key, separator, value = line.strip().partition("=")
    if separator and key == "DOCKERHUB_TOKEN":
        print(json.loads(value), end="")
        break
PY
)

if [ -n "$DOCKERHUB_TOKEN" ]; then
  printf '%s' "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm migrations
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --remove-orphans backend frontend
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker image prune -f
