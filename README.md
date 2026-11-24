# MEDICOM - Servicios Médicos

Aplicación full stack para descubrir servicios médicos, consultar
especialidades y médicos, revisar horarios y gestionar citas.

Incluye autenticación de pacientes, perfil personal, reprogramación de citas,
panel administrativo y publicación automatizada de contenedores.

## Resumen técnico

| Tecnología | Uso | Justificación |
|---|---|---|
| Node.js 20 | Ejecución del backend | Runtime maduro, soporte LTS y integración natural con el ecosistema npm |
| Express 4 | API REST | Framework ligero para rutas, middleware y manejo de errores HTTP |
| Sequelize | Acceso a PostgreSQL | Modelado de entidades, relaciones y consultas con protección contra SQL dinámico |
| PostgreSQL 16 | Persistencia principal | Integridad relacional, transacciones, restricciones únicas y concurrencia |
| AngularJS 1.8 | Aplicación web del cliente | Interfaz existente basada en módulos y componentes, mantenida sin introducir una migración tecnológica innecesaria |
| Bootstrap 5 | Sistema visual responsivo | Componentes y utilidades consistentes para una interfaz adaptable |
| NGINX | Entrega del frontend | Servir archivos estáticos y actuar como gateway público |
| Docker | Empaquetado reproducible | Aislamiento de dependencias y consistencia entre desarrollo y producción |
| Docker Hub | Registro de imágenes | Distribución versionada de backend, frontend y migraciones |
| GitHub Actions | Integración y despliegue | Pruebas automáticas, publicación de imágenes y despliegue por commits |
| OCI Compute | Plataforma de producción | Ejecución de Docker Compose en una instancia de cómputo |
| OCI Database with PostgreSQL | Base administrada | Respaldos, disponibilidad y administración operativa de PostgreSQL |

## Arquitectura

```text
Internet
   |
   +--> Frontend NGINX
   |      +--> Archivos estáticos AngularJS
   |
   +--> OCI Load Balancer /api
          |
          +--> Servicio backend Express
                 |
                 +--> PostgreSQL administrado
```

El frontend consume la API mediante rutas relativas `/api`. En producción,
OCI Load Balancer conserva el prefijo `/api` y lo dirige al backend. Esto
permite usar el mismo origen HTTPS para HTML, JavaScript y cookies HttpOnly.

El backend usa Helmet para cabeceras de seguridad, CORS restringido a los
orígenes configurados, validación con Zod y sesiones persistidas en PostgreSQL.
Las citas utilizan transacciones y un índice único parcial para evitar
reservas simultáneas del mismo médico y horario.

## Arquitectura por componentes

- **Frontend:** interfaz AngularJS compilada como archivos estáticos.
- **Backend:** API Express separada de la interfaz.
- **Base de datos:** esquema SQL y migraciones idempotentes.
- **Autenticación:** contraseñas cifradas con bcrypt y sesiones mediante cookie.
- **Administrador:** catálogo, horarios y estados de citas.
- **Despliegue:** imágenes inmutables por SHA publicados desde GitHub Actions.

## Árbol del proyecto

```text
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
│   ├── test/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── common/
│   │   └── features/
│   ├── test/
│   └── Dockerfile
├── database/
│   ├── init.sql
│   └── migrations/
├── deploy/
│   ├── app.yaml
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   ├── frontend/nginx.conf
│   ├── migrations/
│   └── README.md
├── utility/
│   └── README.md
├── .github/workflows/
│   └── ci-cd.yml
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

`utility/README.md` contiene las instrucciones operativas para ejecutar el
proyecto localmente. `deploy/` contiene infraestructura y ejecución exclusiva
de producción.

## Flujo de CI/CD

```text
Push o Pull Request
        |
        v
Pruebas Docker backend + frontend + migraciones
        |
        v
Push a main
        |
        v
Construir imágenes de producción
        |
        v
Publicar latest y sha-<commit> en Docker Hub
        |
        v
Ejecutar migraciones
        |
        v
Desplegar backend y frontend en OCI Compute
```

Las imágenes se publican con dos tags:

- `latest`: referencia práctica para consulta.
- `sha-<commit>`: versión exacta utilizada por producción.

Este esquema permite reproducibilidad y retroceso a una imagen determinada.

## Seguridad

- Las credenciales administrativas se reciben mediante variables secretas.
- Las contraseñas se almacenan con hash bcrypt.
- Los secretos no se escriben en imágenes ni en el repositorio.
- Las sesiones usan cookies HttpOnly y `Secure` en producción.
- CORS se restringe mediante `CORS_ORIGINS`.
- PostgreSQL administrado requiere SSL.
- Las rutas administrativas exigen sesión y rol de administrador.
- El pipeline de CI verifica las pruebas antes de publicar imágenes.

## Variables de producción

Las variables de configuración se describen en
[`deploy/.env.production.example`](deploy/.env.production.example). Los valores
reales deben configurarse como secretos en OCI Vault o GitHub Actions.

Secretos mínimos:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`
- `DATABASE_URL`
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `OCI_DEPLOY_HOST`
- `OCI_DEPLOY_USER`
- `OCI_DEPLOY_SSH_KEY`

## Plan de despliegue

1. Configurar OCI Database with PostgreSQL.
2. Crear los secretos de administración y CORS.
3. Configurar Docker Hub y sus secretos de GitHub.
4. Publicar las imágenes mediante GitHub Actions.
5. Ejecutar el job previo al despliegue para inicializar o migrar PostgreSQL.
6. Actualizar OCI Compute con las imágenes identificadas por SHA.
7. Verificar `/health` y `/api`.
8. Confirmar login, registro, perfil y administración.

## Ejecución local

Las instrucciones completas para configurar Docker, levantar los servicios,
ejecutar pruebas y gestionar la base local están documentadas en
[`utility/README.md`](utility/README.md).
