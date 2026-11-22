# Servicios Médicos

Aplicación full stack contenerizada con:

- **Backend:** JavaScript ECMAScript 6, Node.js 20, Express y PostgreSQL.
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

### Inicio de sesión y registro

Las cuentas consumidor se crean desde `http://localhost:4200/register.html`.
El inicio de sesión está disponible en `http://localhost:4200/login.html`.
Las sesiones se mantienen mediante una cookie HttpOnly y pueden durar hasta
siete días.

El inicio, los servicios, las especialidades, los médicos y los horarios se
pueden consultar sin cuenta. Al confirmar una cita, se pide iniciar sesión
si hace falta. Después de entrar, la agenda recupera la selección y comprueba
si el horario sigue disponible para que el usuario confirme la cita.

La base de datos crea el usuario administrador inicial:

- Correo: `admin@medicom.com`
- Contraseña: `Admin123!`

Cambia esta contraseña antes de desplegar la aplicación en producción.

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

### CI/CD con GitHub Actions

El flujo `.github/workflows/ci-cd.yml` ejecuta las pruebas del backend y del
frontend dentro de Docker para cada Pull Request hacia `main` y para cada push
a `main`.

Solo después de que las pruebas sean exitosas se construyen y publican las
imágenes de producción. Cada imagen recibe dos etiquetas:

- `latest`
- `sha-<codigo-SHA-del-commit>`

Las imágenes se publican en Docker Hub con los nombres:

- `<usuario>/servicios-medicos-backend`
- `<usuario>/servicios-medicos-frontend`

Configura estos secretos en GitHub (`Settings` > `Secrets and variables` >
`Actions`):

- `DOCKERHUB_USERNAME`: usuario de Docker Hub.
- `DOCKERHUB_TOKEN`: token de acceso de Docker Hub.

### API REST de especialidades

La relación inicial entre backend y frontend expone las especialidades activas
desde PostgreSQL mediante:

- `GET /api/specialties`

El endpoint utiliza Sequelize y responde las especialidades ordenadas por su
posición configurada. El frontend carga este recurso al iniciar la aplicación
para construir dinámicamente la sección «Especialidades Médicas».

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

## Base de datos

El esquema PostgreSQL y los datos iniciales se encuentran en
`database/init.sql`. Todas las tablas, columnas, restricciones, índices y
datos catalogados utilizan nombres en español, incluyendo tablas como
`especialidades_medicas`, `medicos`, `pacientes`, `citas` y
`servicios_medicos`.

La tabla `servicios_medicos` almacena las fichas del catálogo y los precios
ficticios en MXN. La tabla `servicios_especialidades` relaciona los servicios
con las especialidades cuyos horarios se consultan para mostrar disponibilidad.

Docker monta el archivo SQL en
`/docker-entrypoint-initdb.d/01-init.sql`, por lo que PostgreSQL lo ejecuta
automáticamente la primera vez que crea el volumen `postgres_data`.

Si el volumen ya existía antes de incorporar los precios, aplica la migración
de forma directa para conservar las citas, cuentas y precios existentes:

```sh
docker compose exec -T db sh -c 'psql --single-transaction -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < database/migrations/precios-servicios.sql
```

Para incorporar el catálogo a un volumen existente, aplica su migración
después de la de precios:

```sh
docker compose exec -T db sh -c 'psql --single-transaction -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < database/migrations/catalogo-servicios.sql
```

Para añadir los especialistas y horarios de prueba de Medicina General e
Imagenología a un volumen existente, ejecuta esta migración después del
catálogo.

```sh
docker compose exec -T db sh -c 'psql --single-transaction -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < database/migrations/horarios-servicios.sql
```

El script crea las especialidades, médicos y sus relaciones; los horarios
recurrentes; los estados de cita; beneficios y testimonios utilizados por el
frontend. También incluye tablas normalizadas para pacientes y citas.

Para habilitar una sola reprogramación por cita en una base ya creada, aplica:

```sh
docker compose exec -T db sh -c 'psql --single-transaction -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < database/migrations/reprogramacion-citas.sql
```

La migración añade la columna `reprogramada_en` a la tabla `citas`. Cuando
el usuario cambia el horario por primera vez, el backend registra la fecha
de la reprogramación y oculta la opción de volver a cambiarla para esa cita.

### Prevención de citas duplicadas y concurrencia

Las citas se protegen mediante dos mecanismos:

- Antes de insertar una cita o reprogramarla, el backend verifica dentro de
  una transacción PostgreSQL que el médico no tenga ya una cita activa en el
  horario solicitado.
- El esquema incluye el índice único
  `citas_medico_inicio_unico`, creado sobre `id_medico` e `inicia_en` para
  citas cuyo estado no sea cancelado. PostgreSQL rechaza cualquier segundo
  registro que coincida en médico y hora.

Si dos personas intentan confirmar el mismo horario al mismo tiempo, solo una
transacción puede crear la cita. La otra transacción será rechazada por la
comprobación de disponibilidad o por el índice único, por lo que no se
duplicará una cita ni se asignará simultáneamente el mismo horario. El frontend
debe volver a cargar los horarios disponibles después de recibir un conflicto,
y el backend mantiene el horario original si una reprogramación no puede
completarse.

Para inicializar nuevamente la base de datos desde el archivo SQL, elimina
el volumen de PostgreSQL y vuelve a levantar los contenedores:

```sh
docker compose down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

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
