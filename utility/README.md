# Guía local de desarrollo

Esta guía conserva las instrucciones para preparar y ejecutar el proyecto en
la computadora del equipo. La documentación técnica para reclutadores y
evaluadores se encuentra en el [README principal](../README.md).

## Requisitos

- Git
- Docker Engine
- Docker Compose v2

En Windows y macOS puedes utilizar Docker Desktop.

Verifica las herramientas:

```sh
git --version
docker --version
docker compose version
```

No necesitas instalar Node.js, npm, PostgreSQL ni NGINX directamente en el
host.

## Configuración inicial

```sh
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Define en `.env` una contraseña real para PostgreSQL y las credenciales iniciales
del administrador:

```dotenv
DB_USER=servicios_medicos
DB_PASSWORD=una-contraseña-segura
DB_NAME=servicios_medicos
ADMIN_NAME=Administrador MEDICOM
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=una-contraseña-secreta
```

No confirmes el archivo `.env`. Está incluido en `.gitignore`.

## Entorno de desarrollo

Construye e inicia todos los servicios:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Para ejecutarlo en segundo plano:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

Accesos:

- Frontend: http://localhost:4200
- Backend: http://localhost:3000
- Salud del backend: http://localhost:3000/health
- PostgreSQL: únicamente dentro de la red Docker

El código de `backend/` y `frontend/` se monta como volumen. Los cambios se
reflejan sin reconstruir los contenedores.

Detén el entorno:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Entorno de producción local

```sh
docker compose up --build -d
```

Accesos:

- Aplicación: http://localhost
- API: http://localhost/api
- Salud interna: http://localhost:3000/health

El volumen `postgres_data` conserva los datos entre recreaciones.

## Pruebas

Ejecuta las pruebas dentro de Docker:

```sh
docker build --target test --tag servicios-medicos-backend:test ./backend
docker build --target test --tag servicios-medicos-frontend:test ./frontend
docker build --file deploy/migrations/Dockerfile --tag servicios-medicos-migrations:test .
```

## Base de datos

`database/init.sql` crea el esquema y los datos iniciales la primera vez que
PostgreSQL crea su volumen.

Las variables `ADMIN_*` deben proporcionarse antes de la inicialización. No
hay credenciales administrativas predeterminadas ni almacenadas en el repositorio.

Para inicializar nuevamente desde cero:

```sh
docker compose down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Este comando elimina los datos de PostgreSQL.

## Migraciones existentes

Las migraciones adicionales están en `database/migrations/`. En el despliegue
de producción se ejecutan mediante la imagen
`servicios-medicos-migrations` antes de iniciar los servicios.

## CI/CD con GitHub Actions

El workflow:

1. Ejecuta las pruebas del backend y frontend.
2. Construye y prueba la imagen de migraciones.
3. Publica tres imágenes para `amd64` en Docker Hub.
4. Despliega el commit en Google Compute Engine mediante IAP.
5. Ejecuta las migraciones antes de iniciar backend y frontend.

Secretos requeridos en GitHub:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `GCP_PROJECT_ID`
- `GCP_ZONE`
- `GCP_VM_NAME`
- `GCP_SERVICE_ACCOUNT_KEY`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `CORS_ORIGINS`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Uso manual de las imágenes en Google Compute Engine

Docker Hub no necesita cambios adicionales para que GCP pueda ejecutar las
imágenes. Las imágenes deben publicar una variante `linux/amd64`, compatible
con las VM tradicionales de Compute Engine.

En la instancia GCP, instala Docker Engine y Docker Compose v2. Después copia
[`deploy/docker-compose.prod.yml`](../deploy/docker-compose.prod.yml) y crea
`/opt/servicios-medicos/.env.production` con la configuración real:

```dotenv
BACKEND_IMAGE=tu-usuario/servicios-medicos-backend:latest
FRONTEND_IMAGE=tu-usuario/servicios-medicos-frontend:latest
MIGRATIONS_IMAGE=tu-usuario/servicios-medicos-migrations:latest
DB_USER=servicios_medicos
DB_PASSWORD=una-contraseña-secreta
DB_NAME=servicios_medicos
DATABASE_URL=postgresql://servicios_medicos:una-contraseña-secreta@db:5432/servicios_medicos
CORS_ORIGINS=https://tudominio.com
ADMIN_NAME=Administrador MEDICOM
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=una-contraseña-secreta
```

Para asegurar que GCP despliegue exactamente el commit probado, sustituye
`latest` por `sha-<SHA-del-commit>` en las tres variables.

Si los repositorios de Docker Hub son privados, inicia sesión una vez en GCP:

```sh
docker login -u tu-usuario
```

Para repositorios públicos no es necesario iniciar sesión.

### Preparación inicial de la VM

En una VM Ubuntu de Compute Engine, ejecuta:

```sh
sudo sh deploy/gcp/startup.sh
```

Desde el equipo local, la VM debe estar accesible mediante IAP. Configura en GCP:

- IAP API habilitada.
- Servicio SSH de IAP habilitado.
- Regla de firewall que permita TCP 22 desde `35.235.240.0/20`.
- Puerto `80` permitido para el frontend.
- La cuenta de GitHub Actions autorizada con permisos de Compute Instance
  Admin y IAP-secured Tunnel User.

Ejemplo de creación manual de una VM económica:

```sh
gcloud compute instances create servicios-medicos \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-balanced \
  --tags=http-server \
  --metadata-from-file=startup-script=deploy/gcp/startup.sh
```

La VM puede usar PostgreSQL dentro de Docker Compose durante la prueba
gratuita. Para una implementación permanente se recomienda crear snapshots del
disco y migrar posteriormente a Cloud SQL si se requiere alta disponibilidad o
respaldos administrados.

Descarga las imágenes y ejecuta las migraciones antes de iniciar la aplicación:

```sh
cd /opt/servicios-medicos
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm migrations
docker compose --env-file .env.production -f docker-compose.prod.yml up -d backend frontend
```

La migración debe ejecutarse una sola vez por despliegue que modifique el
esquema. Si falla, detén el despliegue y corrige la migración antes de iniciar
una nueva versión.

Verifica el servicio:

```sh
curl --fail http://127.0.0.1/health
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Expone el puerto 80 públicamente para el frontend. El backend y PostgreSQL
deben permanecer dentro de la red Docker interna y no publicar sus puertos al
host. Nginx dirige `/api` al backend y `/` al frontend.
