# MEDICOM — Plataforma de Servicios Médicos

MEDICOM es una aplicación web full stack para consultar servicios médicos, especialidades y profesionales de la salud, revisar disponibilidad y gestionar citas. Incluye un portal para pacientes, autenticación, perfil de usuario y un panel administrativo para mantener el catálogo médico y los horarios.

El proyecto integra desarrollo de software, persistencia relacional, automatización de pruebas, contenerización y despliegue en Google Cloud Platform (GCP).

## Funcionalidades principales

### Pacientes
- Consulta del catálogo de servicios, especialidades, médicos y precios.
- Exploración de disponibilidad y selección de horarios.
- Registro, inicio y cierre de sesión.
- Confirmación de correo electrónico y gestión del perfil.
- Agendamiento de citas con folio de seguimiento.
- Consulta y reprogramación de citas, con una regla de anticipación mínima de 24 horas.
- Recuperación de contraseña y reactivación de cuentas desactivadas.
- Notificaciones por correo de confirmación y reprogramación de citas.

### Administración
- Consulta del estado general de la operación.
- Gestión de médicos y sus especialidades.
- Administración de especialidades médicas.
- Gestión de servicios, precios y disponibilidad.
- Alta y actualización de horarios de atención.

## Stack tecnológico

| Área | Tecnología | Uso en MEDICOM |
|---|---|---|
| Frontend | JavaScript, HTML5 y CSS3 | Interfaz y comportamiento del cliente |
| Frontend | AngularJS 1.8.2 | Módulos, controladores, componentes y vistas dinámicas |
| Frontend | Bootstrap 5.3.3 y Popper.js 2 | Componentes y utilidades de interfaz responsiva |
| Backend | Node.js 20 | Runtime del servidor |
| Backend | Express 4.21 | API REST, rutas, middleware y manejo de solicitudes |
| Backend | Sequelize 6 | ORM y relaciones con PostgreSQL |
| Backend | Zod 4 | Validación de datos de entrada |
| Backend | bcrypt 6 | Hash de contraseñas |
| Backend | jsonwebtoken 9 | Tokens temporales para confirmación de correo y recuperación de contraseña |
| Backend | Nodemailer 7 | Envío de correos mediante SMTP |
| Backend | Helmet, CORS y Morgan | Cabeceras de seguridad, control de orígenes y registro HTTP |
| Datos | PostgreSQL 16 | Persistencia relacional |
| Datos | pg | Driver de PostgreSQL para Node.js |
| Infraestructura | Docker y Docker Compose v2 | Entornos aislados y orquestación de servicios |
| Infraestructura | Docker Buildx | Construcción de imágenes y uso de caché |
| Infraestructura | NGINX | Servidor de archivos estáticos del frontend y proxy interno |
| Infraestructura | Caddy 2 | Entrada HTTPS, terminación TLS y proxy inverso en producción |
| CI/CD | GitHub Actions | Pruebas, construcción, publicación y despliegue automatizados |
| Registro | Docker Hub | Publicación de imágenes versionadas |
| Cloud | Google Compute Engine | Máquina virtual donde se ejecuta la aplicación |
| Cloud | VPC, subredes, firewall e IAM | Segmentación de red y control de acceso a recursos |
| Cloud | IAP y OS Login | Acceso administrativo a la VM mediante túnel seguro |
| Correo | SMTP | Entrega de confirmaciones y notificaciones a usuarios |

Las versiones de runtime y librerías corresponden a los manifiestos y Dockerfiles del repositorio. El frontend utiliza **AngularJS 1.8.2**; no es una aplicación basada en las versiones modernas de Angular.

## Arquitectura de la aplicación

En producción, los servicios se ejecutan dentro de una red privada de Docker Compose en una VM de Compute Engine. Caddy es el único servicio que publica los puertos HTTP/HTTPS en la VM.

\`\`\`text
                         Internet
                            |
                       HTTPS :443
                            |
                 Google Compute Engine
                            |
                      Caddy 2
                    (TLS / Reverse Proxy)
                     /             \
           /api/* y /health         /
                  |                |
             Express API        NGINX
              :3000              :80
                  |                |
              Sequelize       AngularJS
                  |
             PostgreSQL 16
                  |
       Disco persistente de la VM
       /srv/medicom-data/postgres
\`\`\`

- **Frontend:** AngularJS se entrega como archivos estáticos desde un contenedor NGINX.
- **Backend:** Express expone la API REST y concentra las reglas de negocio.
- **Persistencia:** Sequelize conecta la API con PostgreSQL.
- **Proxy y TLS:** Caddy recibe el tráfico público, dirige \`/api/*\` y \`/health\` al backend y envía el resto de las solicitudes al frontend.
- **Red interna:** PostgreSQL y el backend no publican sus puertos directamente a Internet.
- **Persistencia física:** el directorio de datos de PostgreSQL se monta desde un disco persistente de GCP; el despliegue valida que el disco esté montado antes de iniciar los servicios.

## Diseño del backend y datos

El backend mantiene una separación por responsabilidades:

- \`routes/\`: definición de rutas HTTP.
- \`controllers/\`: adaptación de solicitudes y respuestas.
- \`services/\`: reglas de negocio y coordinación de operaciones.
- \`models/\`: entidades y relaciones Sequelize.
- \`middlewares/\`: autenticación, autorización y manejo de errores.
- \`validators/\`: validación de entradas.

El modelo relacional contempla usuarios, pacientes, roles, sesiones, médicos, especialidades, servicios, horarios, citas, estados y registros históricos. El agendamiento y la reprogramación utilizan transacciones para proteger operaciones relacionadas. También existen restricciones e índices en PostgreSQL para reforzar la integridad de los datos y evitar que se reserve el mismo horario de un médico más de una vez.

### Migraciones

El esquema inicial y los cambios incrementales se organizan en \`database/\`. El manifiesto \`database/migrate.sql\` establece un orden compartido para la inicialización y las migraciones de servicios, precios, catálogo, horarios, reprogramación, identificadores médicos, restablecimiento de contraseña y confirmación de correo.

El contenedor de migraciones ejecuta ese manifiesto con PostgreSQL \`psql\`. En Compose, el backend espera a que PostgreSQL esté saludable y a que el servicio de migraciones termine correctamente.

## Seguridad de la aplicación

- Contraseñas almacenadas mediante hash con bcrypt.
- Sesiones persistidas en base de datos; la cookie de sesión utiliza \`HttpOnly\`, \`SameSite=Lax\` y el atributo \`Secure\` en producción.
- Tokens firmados y con expiración para confirmación de correo y recuperación de contraseña.
- Autorización por rol en las rutas administrativas.
- Validación de entradas con Zod en los flujos que la implementan.
- Helmet para cabeceras HTTP y CORS restringido mediante \`CORS_ORIGINS\`.
- Credenciales y secretos suministrados en tiempo de ejecución; no deben incluirse en el repositorio ni en las imágenes.
- PostgreSQL permanece dentro de la red privada de Compose, sin publicar el puerto 5432 en la VM.

## Infraestructura cloud

La plataforma de producción se desplegó sobre **Google Compute Engine**, con Ubuntu 24.04 como sistema operativo de la VM. La infraestructura de red y acceso contempla:

- VM de Compute Engine y red VPC personalizada con subred.
- Reglas de firewall para el tráfico web en 80/443 y acceso SSH administrativo a través de IAP.
- IAM y cuenta de servicio para las operaciones automatizadas de despliegue.
- OS Login y túneles IAP para administración y transferencia de archivos sin depender de exponer SSH públicamente.
- Disco persistente adicional para los datos de PostgreSQL.
- Montaje del disco en la VM y uso de \`/srv/medicom-data/postgres\` como directorio de persistencia de la base de datos.

El repositorio incluye scripts de apoyo en \`deploy/gcp/\`: \`startup.sh\` instala Docker Engine, Buildx y Docker Compose; \`create-demo.sh\` contiene automatización de recursos de demostración; y \`deploy.sh\` prepara y ejecuta la versión desplegada, valida el montaje del disco, aplica migraciones y comprueba la respuesta HTTPS.

## Contenerización y despliegue

Se mantienen configuraciones separadas para desarrollo y producción:

- \`docker-compose.yml\`: servicios base de base de datos, migraciones, backend y frontend.
- \`docker-compose.dev.yml\`: ejecución local con código montado como volumen y puertos de desarrollo.
- \`deploy/docker-compose.prod.yml\`: despliegue en GCP con imágenes publicadas, Caddy y montaje del disco persistente.

Los Dockerfiles utilizan **multi-stage builds** para separar dependencias, pruebas, compilación y runtime. La imagen de producción del backend utiliza Node.js Distroless; el frontend se entrega mediante NGINX Alpine; y la imagen auxiliar de migraciones se basa en PostgreSQL Alpine.

## Flujo CI/CD

El workflow se encuentra en \`.github/workflows/ci-cd.yml\`.

\`\`\`text
Pull Request o push a main
           |
           v
       GitHub Actions
           |
           v
   Pruebas del backend
   Pruebas del frontend
   Construcción de imagen de migraciones
           |
           v
  Push a main / ejecución manual en main
           |
           v
  Buildx construye tres imágenes
           |
           v
    Publicación en Docker Hub
           |
           v
 Autenticación con cuenta de servicio GCP
           |
           v
  SCP y SSH mediante túnel IAP
           |
           v
  PostgreSQL -> migraciones -> aplicación
           |
           v
     Verificación de HTTPS
\`\`\`

El pipeline:

1. Construye los stages de prueba del backend y frontend, que ejecutan sus pruebas automatizadas con el test runner nativo de Node.js.
2. Construye la imagen de migraciones.
3. En eventos de publicación o ejecución manual sobre \`main\`, construye y publica las imágenes de backend, frontend y migraciones para \`linux/amd64\`.
4. Publica las etiquetas \`latest\` y \`sha-<commit>\` para identificar la versión exacta.
5. Se autentica en GCP mediante la clave JSON de una cuenta de servicio almacenada como secreto de GitHub.
6. Transfiere la configuración a la VM y ejecuta el despliegue mediante SSH sobre IAP.
7. Comprueba la disponibilidad HTTPS al finalizar.

Las Pull Requests ejecutan la etapa de pruebas; la publicación de imágenes y el despliegue están condicionados a \`main\).

## Configuración y secretos

Para desarrollo local, copia \`.env.example\` a \`.env\` y completa las credenciales de prueba. Para producción, el workflow utiliza **GitHub Actions Secrets** y genera el archivo de entorno requerido por Compose durante el despliegue.

Los secretos de GitHub contemplados por el pipeline incluyen:

- GCP: \`GCP_PROJECT_ID\`, \`GCP_ZONE\`, \`GCP_VM_NAME\`, \`GCP_SERVICE_ACCOUNT_KEY\`.
- Docker Hub: \`DOCKERHUB_USERNAME\`, \`DOCKERHUB_TOKEN\`.
- PostgreSQL: \`DB_USER\`, \`DB_PASSWORD\`, \`DB_NAME\`.
- Aplicación: \`PUBLIC_HOST\`, \`ADMIN_EMAIL\`, \`ADMIN_PASSWORD\`, \`PASSWORD_RESET_SECRET\`.
- SMTP: \`SMTP_USER\`, \`SMTP_PASSWORD\`; \`SMTP_HOST\`, \`SMTP_PORT\`, \`SMTP_SECURE\` y \`SMTP_FROM\` admiten configuración adicional.

\`CORS_ORIGINS\` y \`APP_PUBLIC_URL\` se derivan del dominio \`PUBLIC_HOST\` en el flujo de producción. Los valores reales nunca deben escribirse en archivos versionados.

> El flujo actual utiliza una clave JSON de cuenta de servicio mediante \`GCP_SERVICE_ACCOUNT_KEY\`. Workload Identity Federation puede evaluarse como una mejora posterior para evitar mantener claves de larga duración.

## Pruebas y validación

El proyecto cuenta con pruebas del backend y frontend basadas en \`node:test\`. La suite del backend contempla, entre otros, flujos de autenticación, confirmación y reactivación de cuentas, reprogramación y notificaciones por correo. El workflow construye las etapas de prueba dentro de Docker para ejecutarlas en un entorno reproducible.

La validación de despliegue también comprueba el estado de los servicios y realiza una solicitud HTTPS con validación del certificado. Esto complementa las pruebas automatizadas, pero no sustituye una suite end-to-end de navegador ni pruebas de restauración de respaldos.

## Estructura del repositorio

\`\`\`text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   └── test/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── common/
│   │   └── features/
│   └── test/
├── database/
│   ├── init.sql
│   ├── migrate.sql
│   └── migrations/
├── deploy/
│   ├── Caddyfile
│   ├── docker-compose.prod.yml
│   ├── gcp/
│   ├── frontend/
│   └── migrations/
├── utility/
│   └── README.md
├── .github/workflows/
│   └── ci-cd.yml
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
\`\`\`

## Metodologías y prácticas de ingeniería

Las prácticas que pueden observarse en el repositorio son:

- **Arquitectura modular por capas:** rutas, controladores, servicios, modelos, middlewares y validadores separados por responsabilidad.
- **Diseño API REST:** operaciones de negocio expuestas mediante endpoints HTTP.
- **Modelado relacional:** integridad referencial, restricciones, índices y transacciones para operaciones sensibles.
- **Migraciones SQL versionadas:** cambios del esquema organizados en archivos y orquestados desde un manifiesto común.
- **Separación de entornos:** configuración local y de producción diferenciada mediante Docker Compose y variables de entorno.
- **Contenerización multi-stage:** separación entre desarrollo, pruebas, compilación y ejecución.
- **Integración continua:** pruebas automatizadas antes de publicar artefactos.
- **Despliegue continuo condicionado:** publicación y despliegue vinculados a \`main\`, con imágenes identificadas por SHA.
- **Control de cambios mediante Git y Pull Requests:** trabajo distribuido en ramas y cambios integrados a través de PR.

No se atribuye al proyecto un marco formal como Scrum o Kanban porque no hay evidencia suficiente de su uso en el historial disponible.

## Informe de contribuciones del equipo

Este informe reconstruye las responsabilidades a partir del historial de Git, los Pull Requests y los archivos modificados desde la creación del repositorio (**4 de noviembre de 2026**) hasta la integración más reciente revisada (**25 de noviembre de 2026**). Los roles son descripciones profesionales del trabajo realizado en MEDICOM, no niveles de seniority.

El número de commits, líneas modificadas o Pull Requests no se utiliza como medida directa de esfuerzo, calidad o capacidad individual: los merges, las integraciones y el trabajo colaborativo pueden alterar esas cifras. La asignación de responsabilidad de infraestructura también incorpora la distribución de tareas confirmada por el equipo.

### donosty — Full-Stack Developer | DevOps & Cloud Engineer

**Responsabilidad principal:** diseño e integración de la aplicación full stack, persistencia de datos y ownership técnico del flujo DevOps.

**Contribuciones identificadas:**
- Estructura inicial del repositorio y organización de los componentes.
- Diseño y evolución del esquema PostgreSQL, datos iniciales y manifiesto de migraciones.
- Desarrollo de la base del backend con Express, Sequelize, modelos, servicios, controladores, rutas y validaciones.
- Implementación de flujos de agendamiento y consulta de citas, catálogo médico, perfiles, autenticación y sesiones.
- Desarrollo de funciones administrativas y de seguridad, incluyendo recuperación de contraseña y confirmación de correo.
- Integración de correos transaccionales y ajustes funcionales del sistema.
- Configuración y responsabilidad de DevOps: Docker, Docker Compose, Dockerfiles multi-stage, NGINX, Caddy, GitHub Actions, publicación de imágenes en Docker Hub, variables de entorno, secretos y scripts de despliegue.
- Integración y estabilización del flujo de CI/CD entre GitHub, Docker Hub y GCP.

**Fortalezas observadas:** visión transversal del producto, integración entre aplicación y operación, diseño de persistencia y atención a la reproducibilidad del despliegue. Su contribución conecta el desarrollo de funcionalidades con la infraestructura necesaria para ejecutarlas.

**Siguiente área de crecimiento:** ampliar las pruebas end-to-end de los recorridos completos, formalizar pruebas de respaldo/restauración y continuar haciendo más reproducible la provisión de infraestructura mediante infraestructura como código.

PRs y cambios representativos: [PR #3 — base de datos y Compose](https://github.com/donosty/servicios-medicos/pull/3), [PR #4 — backend y dinamismo](https://github.com/donosty/servicios-medicos/pull/4), [PR #13 — administración y funcionalidades](https://github.com/donosty/servicios-medicos/pull/13), [PR #14 — multi-stage y CI/CD](https://github.com/donosty/servicios-medicos/pull/14), [PR #18 — evolución del despliegue](https://github.com/donosty/servicios-medicos/pull/18), [PR #19 — autenticación y recuperación de contraseña](https://github.com/donosty/servicios-medicos/pull/19) y [PR #22 — confirmación de correo y reactivación](https://github.com/donosty/servicios-medicos/pull/22).

### diego2432 — Full-Stack Developer | Backend & Frontend Features

**Responsabilidad principal:** desarrollo de funcionalidades orientadas al usuario y al administrador, trabajando tanto en frontend como en backend.

**Contribuciones identificadas:**
- Desarrollo inicial de la interfaz de inicio y ajustes posteriores de navegación y presentación.
- Integración del catálogo de servicios con horarios, filtros y consulta pública de servicios y precios.
- Ajustes de la interfaz administrativa.
- Implementación y evolución de reglas de negocio relacionadas con la reprogramación de citas, incluida la anticipación mínima de 24 horas.
- Funciones de baja y recuperación/reactivación de cuentas.
- Gestión administrativa de médicos, especialidades y horarios de disponibilidad.
- Notificación por correo cuando una cita es reprogramada.
- Correcciones de presentación y desbordamiento en vistas de perfil, blog y agendamiento.
- Colaboración con donosty en la creación y preparación de la infraestructura cloud de GCP.

**Fortalezas observadas:** entrega de funcionalidades de extremo a extremo, conexión entre interfaz y reglas de negocio, y atención a flujos operativos concretos como administración de directorios médicos, horarios y reprogramaciones.

**Siguiente área de crecimiento:** extender las pruebas de integración para operaciones administrativas y notificaciones; para correos críticos, una cola de reintentos o patrón outbox podría mejorar la tolerancia a fallos del proveedor SMTP.

PRs y cambios representativos: [PR #5 — navegación y especialidades](https://github.com/donosty/servicios-medicos/pull/5), [PR #16 — regla de reprogramación](https://github.com/donosty/servicios-medicos/pull/16), [PR #20 — cambios de integración de despliegue](https://github.com/donosty/servicios-medicos/pull/20) y [PR #23 — gestión de médicos, especialidades, horarios y notificaciones](https://github.com/donosty/servicios-medicos/pull/23).

### ojdevgh-dev — Frontend Developer | UI Developer

**Responsabilidad principal:** construcción e integración de secciones de interfaz y navegación del portal.

**Contribuciones identificadas:**
- Desarrollo de las secciones **Nosotros**, **Servicios** y **Blog**.
- Implementación de vistas, hojas de estilo y comportamiento asociado a esas secciones.
- Integración de enlaces y navegación en encabezado y pie de página.
- Ajustes de interacción entre las vistas de inicio, servicios, blog y agendamiento.
- Actualización de elementos visuales y recursos asociados a especialidades médicas.
- Limpieza de archivos de respaldo dentro de las funcionalidades de agendamiento.

**Fortalezas observadas:** enfoque en experiencia visual, organización de contenido, navegación y ampliación de la superficie funcional del frontend. Su aportación se concentra principalmente en la capa de presentación.

**Siguiente área de crecimiento:** ampliar las pruebas específicas de las vistas y navegación, así como validaciones de accesibilidad y comportamiento responsivo para las páginas informativas.

PR representativo: [PR #9 — secciones Nosotros, Servicios y Blog](https://github.com/donosty/servicios-medicos/pull/9).

### Colaboración en infraestructura cloud

La creación y preparación de la infraestructura cloud fue una actividad compartida entre **donosty y diego2432**. Ambos colaboraron en la creación de la VM, VPC, reglas de firewall, roles y configuración IAM, cuenta de servicio, acceso y configuración mediante SSH, creación de discos y montaje del almacenamiento persistente utilizado por PostgreSQL dentro de la VM.

Dentro de ese trabajo conjunto, **donosty tuvo la responsabilidad técnica de DevOps**: contenerización, configuración de Docker y Compose, NGINX, Caddy, GitHub Actions, secretos, variables de entorno y automatización del despliegue. Esta asignación refleja el reparto de responsabilidades confirmado por el equipo; la autoría de un commit o de un PR, por sí sola, no describe necesariamente quién llevó la responsabilidad operativa de cada actividad.

### Evaluación global de colaboración

El historial muestra una distribución complementaria:

- **donosty:** base full stack, persistencia, autenticación, integración y operación DevOps.
- **diego2432:** funcionalidades de producto que recorren frontend y backend, especialmente administración, citas y comunicación por correo.
- **ojdevgh-dev:** secciones informativas, presentación visual y navegación del frontend.
- **donosty + diego2432:** provisión y configuración de infraestructura de GCP.

La colaboración evolucionó desde la estructura inicial de la aplicación y el esquema de datos hacia módulos de usuario, administración, automatización de despliegues y funcionalidades adicionales. Las aportaciones no son intercambiables: cada integrante cubrió una parte distinta del producto y el resultado depende de su integración.

## Oportunidades técnicas para siguientes iteraciones

Las siguientes propuestas se desprenden de la arquitectura y las pruebas visibles en el repositorio; no representan funcionalidades ya implementadas:

1. Añadir pruebas end-to-end de navegador para registro, inicio de sesión, agendamiento, reprogramación y administración.
2. Ejecutar pruebas de integración de migraciones contra una instancia PostgreSQL efímera en CI.
3. Definir y probar un procedimiento periódico de respaldo y restauración del disco/base de datos.
4. Incorporar monitoreo, alertas y métricas de disponibilidad para la VM, contenedores, API y PostgreSQL.
5. Evaluar infraestructura como código para versionar y reproducir VPC, firewall, IAM, discos y VM.
6. Diseñar una estrategia de rollback de aplicación y migraciones, además de la identificación de imágenes por SHA.

## Ejecución local

Consulta la [guía local de desarrollo](utility/README.md) para instalar los requisitos, configurar el archivo \`.env\`, levantar los servicios con Docker Compose y ejecutar las pruebas.

## Despliegue en GCP

Consulta la [guía de despliegue en Google Cloud](deploy/README.md) para revisar los secretos requeridos, la VM, el dominio, el acceso mediante IAP y el procedimiento de publicación y despliegue.

---

**Repositorio:** [github.com/donosty/servicios-medicos](https://github.com/donosty/servicios-medicos)
