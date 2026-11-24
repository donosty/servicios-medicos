# Despliegue de producción en Google Cloud

Esta carpeta contiene el Compose de producción para Google Compute Engine y
los archivos necesarios para migrar PostgreSQL. El Compose del directorio raíz
sigue siendo el entorno de desarrollo local.

## Archivos

- `docker-compose.prod.yml`: ejecución del backend, frontend y migraciones.
- `backend/Dockerfile`: imagen de producción del backend.
- `frontend/Dockerfile`: imagen de producción del frontend.
- `gcp/startup.sh`: instalación de Docker en una VM Ubuntu.
- `gcp/deploy.sh`: actualización de contenedores en la VM.
- `frontend/nginx.conf`: servidor estático con proxy `/api`.
- `migrations/Dockerfile` y `migrations/migrate.sh`: inicialización y migración
  de PostgreSQL.
- `.env.production.example`: referencia local de las variables requeridas.

## Credenciales del administrador

El administrador inicial se crea durante la migración con tres secretos:

- `ADMIN_NAME`: nombre visible del administrador.
- `ADMIN_EMAIL`: correo de acceso.
- `ADMIN_PASSWORD`: contraseña de acceso.

Configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` como secretos de GitHub Actions o
Secret Manager. No incluyas valores reales en el repositorio.

La contraseña se cifra con bcrypt antes de guardarla. La migración no muestra
la contraseña en los logs ni la incluye en la imagen.

## Base de datos

PostgreSQL se ejecuta como contenedor dentro de la misma VM y conserva sus datos
en un volumen Docker. La tarea de migración ejecuta `database/init.sql` y
después las migraciones necesarias.

Antes del primer despliegue:

1. Configura las variables y secretos de GCP y GitHub Actions.
2. Define `CORS_ORIGINS` con el dominio público final.
3. Crea secretos para `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
4. Despliega la aplicación desde el repositorio.

Cuando cambie el dominio público, actualiza `CORS_ORIGINS`.

## Docker Hub

Las imágenes se identifican mediante el usuario de Docker Hub y el nombre del
repositorio.

Las imágenes publicadas son:

- `<usuario>/servicios-medicos-backend`
- `<usuario>/servicios-medicos-frontend`
- `<usuario>/servicios-medicos-migrations`

Cada publicación debe conservar dos etiquetas:

- `latest`
- `sha-<SHA-del-commit>`

GitHub Actions publica la arquitectura `amd64`. Cada despliegue
usa las imágenes identificadas por el SHA exacto del commit.

## Despliegue automático

El workflow requiere estos secretos en GitHub:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `GCP_PROJECT_ID`
- `GCP_ZONE`
- `GCP_VM_NAME`
- `GCP_SERVICE_ACCOUNT_KEY`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PASSWORD_RESET_SECRET`
- `APP_PUBLIC_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `CORS_ORIGINS`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Las imágenes se publican en Docker Hub y se despliegan desde GitHub Actions
mediante IAP hacia Google Compute Engine.

## Restablecimiento de contraseña

Para Gmail, crea una contraseña de aplicación en la cuenta Google y configura
`SMTP_USER` y `SMTP_PASSWORD`. `PASSWORD_RESET_SECRET` debe ser una clave larga
aleatoria exclusiva del entorno. `APP_PUBLIC_URL` debe ser el dominio público
HTTPS de la aplicación.
