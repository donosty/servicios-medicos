# Servicios Médicos

Aplicación full stack contenerizada con:

- **Backend:** JavaScript CommonJS, Node.js 20, Express y PostgreSQL.
- **Frontend:** AngularJS 1.8.2 servido por NGINX.
- **Estilos:** Bootstrap 5.
- **Orquestación:** Docker Compose.

El proyecto no requiere instalar Node.js, npm, PostgreSQL ni NGINX en la
máquina local. Las dependencias se instalan y ejecutan dentro de contenedores.

## Requisitos locales

Instala en la máquina:

1. **Git**, para clonar el repositorio.
2. **Docker Engine** y el complemento **Docker Compose v2**.

En Windows y macOS se puede utilizar [Docker Desktop](https://www.docker.com/products/docker-desktop/).
En Linux, instala Docker Engine y habilita el comando `docker compose`.

Verifica la instalación:

```sh
docker --version
docker compose version
git --version
```

No es necesario instalar localmente Node.js, npm, AngularJS, PostgreSQL,
Bootstrap ni dependencias de frontend/backend.

## Configuración inicial

Clona el repositorio y entra en su directorio:

```sh
git clone <URL_DEL_REPOSITORIO>
cd servicios-medicos
```

Crea el archivo local de variables de entorno:

```sh
cp .env.example .env
```

En Windows PowerShell, utiliza:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y define valores propios:

```dotenv
DB_USER=servicios_medicos
DB_PASSWORD=una-contraseña-segura
DB_NAME=servicios_medicos
```

El archivo `.env` contiene configuración privada y no debe subirse al
repositorio.

## Entorno de desarrollo

Construye las imágenes y levanta todos los servicios:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Para dejar los contenedores ejecutándose en segundo plano:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

Accesos:

- Frontend: <http://localhost:4200>
- Backend: <http://localhost:3000>
- Salud del backend: <http://localhost:3000/health>
- PostgreSQL: accesible únicamente dentro de la red Docker.

El código de `backend/` y `frontend/` se monta como volumen durante el
desarrollo. Los cambios se reflejan dentro de los contenedores sin instalar
dependencias en el host.

Detén el entorno de desarrollo con:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Si existe un contenedor anterior llamado `angular_frontend_dev`, recréalo para
que utilice la imagen de desarrollo Node.js 20 actualizada:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
```

El frontend de desarrollo utiliza el puerto `4200`; el frontend de producción
utiliza NGINX en el puerto `80`.

## Entorno de producción

Construye las imágenes y despliega la aplicación:

```sh
docker compose up --build -d
```

La aplicación queda disponible en:

- Frontend: <http://localhost>
- API: <http://localhost/api>

El endpoint `/health` del backend está disponible dentro de la red Docker para
los healthchecks; no se publica directamente en producción.

Consulta el estado de los servicios:

```sh
docker compose ps
```

Consulta los logs:

```sh
docker compose logs -f
```

Detén el entorno de producción sin eliminar los datos de PostgreSQL:

```sh
docker compose down
```

El volumen Docker `postgres_data` conserva la información de PostgreSQL
entre reinicios y recreaciones de contenedores.

## Comandos útiles

Reconstruir las imágenes sin utilizar la caché:

```sh
docker compose build --no-cache
```

Eliminar contenedores y también el volumen de PostgreSQL **(borra los datos)**:

```sh
docker compose down -v
```

Ver los volúmenes existentes:

```sh
docker volume ls
```

## Puertos utilizados

| Servicio | Desarrollo | Producción |
|---|---:|---:|
| Frontend | `4200` | `80` |
| Backend | `3000` | Interno; se accede mediante NGINX |
| PostgreSQL | Interno | Interno |

Si alguno de los puertos publicados ya está ocupado, cambia el puerto del lado
izquierdo en `docker-compose.dev.yml` o `docker-compose.yml`, según el entorno.
