# Despliegue de producción en DigitalOcean App Platform

Esta carpeta contiene la especificación para desplegar imágenes ya publicadas
desde Docker Hub. El Compose y el entorno de desarrollo del directorio raíz no
se usan en App Platform.

## Archivos

- `app.yaml`: especificación de App Platform basada en imágenes Docker Hub.
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

Configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` como secretos en App Platform. No
incluyas valores reales en `app.yaml` ni en Git.

La contraseña se cifra con bcrypt antes de guardarla. La migración no muestra
la contraseña en los logs ni la incluye en la imagen.

## Base de datos

App Platform crea PostgreSQL administrado y expone su URL mediante
`${database.DATABASE_URL}`. El job `database-migration` ejecuta primero
`database/init.sql` y después las migraciones necesarias.

Antes del primer despliegue:

1. Configura las variables de App Platform.
2. Define `CORS_ORIGINS` con el dominio público final.
3. Crea secretos para `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
4. Despliega la aplicación desde el repositorio.

Cuando el dominio asignado por DigitalOcean cambie, actualiza
`CORS_ORIGINS`.

## Docker Hub

El repositorio utiliza por defecto la cuenta `donosty`. Si la cuenta de Docker
Hub es distinta, cambia el campo `registry` en `deploy/app.yaml`.

Las imágenes publicadas son:

- `<usuario>/servicios-medicos-backend`
- `<usuario>/servicios-medicos-frontend`
- `<usuario>/servicios-medicos-migrations`

Cada publicación debe conservar dos etiquetas:

- `latest`
- `sha-<SHA-del-commit>`

El flujo de GitHub Actions reemplaza automáticamente `latest` por
`sha-<SHA>` al generar la especificación temporal desplegada en DigitalOcean.
Esto hace que cada despliegue use exactamente el commit publicado.

Para imágenes privadas, configura las credenciales en DigitalOcean como
Docker Hub Registry o agrega `registry_credentials` al objeto `image` con el
formato `$username:$access_token`. No escribas el token dentro de Git.

## Despliegue automático

El workflow requiere estos secretos adicionales en GitHub:

- `DIGITALOCEAN_ACCESS_TOKEN`: token de API de DigitalOcean.
- `DIGITALOCEAN_APP_ID`: identificador de la App Platform.

El despliegue ocurre después de publicar las tres imágenes con GitHub Actions.
