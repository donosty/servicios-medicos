# Despliegue de producción en Oracle Cloud

Esta carpeta contiene el Compose de producción para OCI Compute y los archivos
necesarios para migrar PostgreSQL. El Compose del directorio raíz sigue siendo
el entorno de desarrollo local.

## Archivos

- `docker-compose.prod.yml`: ejecución del backend, frontend y migraciones.
- `backend/Dockerfile`: imagen de producción del backend.
- `frontend/Dockerfile`: imagen de producción del frontend.
- `frontend/nginx.conf`: servidor estático sin proxy Docker local.
- `migrations/Dockerfile` y `migrations/migrate.sh`: inicialización y migración
  de PostgreSQL administrado.
- `.env.production.example`: referencia local de las variables requeridas.

## Credenciales del administrador

El administrador inicial se crea durante la migración con tres secretos:

- `ADMIN_NAME`: nombre visible del administrador.
- `ADMIN_EMAIL`: correo de acceso.
- `ADMIN_PASSWORD`: contraseña de acceso.

Configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` como secretos de GitHub Actions o
OCI Vault. No incluyas valores reales en el repositorio.

La contraseña se cifra con bcrypt antes de guardarla. La migración no muestra
la contraseña en los logs ni la incluye en la imagen.

## Base de datos

OCI Database with PostgreSQL expone una URL de conexión. La tarea de migración
ejecuta primero `database/init.sql` y después las migraciones necesarias.

Antes del primer despliegue:

1. Configura las variables y secretos de OCI y GitHub Actions.
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

GitHub Actions publica ambas arquitecturas `amd64` y `arm64`. Cada despliegue
usa las imágenes identificadas por el SHA exacto del commit.

## Despliegue automático

El workflow requiere estos secretos en GitHub:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `OCI_DEPLOY_HOST`
- `OCI_DEPLOY_USER`
- `OCI_DEPLOY_SSH_KEY`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Las imágenes se publican en Docker Hub y se despliegan desde GitHub Actions
mediante SSH hacia OCI Compute.
