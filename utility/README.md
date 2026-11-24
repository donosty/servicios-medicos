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
3. Publica tres imágenes en Docker Hub.
4. Genera un App Spec de App Platform con tags inmutables.
5. Despliega el commit en DigitalOcean.

Secretos requeridos en GitHub:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `DIGITALOCEAN_ACCESS_TOKEN`
- `DIGITALOCEAN_APP_ID`
