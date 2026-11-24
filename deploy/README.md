# MEDICOM: despliegue nuevo en Google Cloud

El flujo publica imágenes por SHA en Docker Hub y despliega en Compute Engine mediante
IAP. Solo un push a `main` o una ejecución manual en `main` despliega; las PR ejecutan
pruebas. La VM ejecuta PostgreSQL, backend, frontend y Caddy. Solo Caddy publica 80/443.
La base persiste en un volumen Docker. HTTPS y las cookies Secure se conservan.

## Crear una VM nueva (Cloud Shell)

Desde la raíz de esta versión del repositorio:

```sh
export GCP_PROJECT_ID=project-2446ad52-eb6d-4f33-819
sh deploy/gcp/create-demo.sh
```

El script crea `medicom-demo-v2` en `us-central1-a`, Ubuntu 24.04, e2-medium, disco
estándar de 20 GB y red propia. Permite SSH solo por IAP; activa OS Login y no asigna
cuenta de servicio a la VM. No elimina ni modifica la VM anterior. Los recursos
nuevos consumen créditos: eliminar la VM anterior tras validar la nueva evita pagar
ambas durante el resto de la demo. No ejecutar startup.sh en Cloud Shell: es para Ubuntu.

Esperar que termine el script de arranque, entrando por el botón SSH o:

```sh
gcloud compute ssh medicom-demo-v2 --zone=us-central1-a \
  --project="$GCP_PROJECT_ID" --tunnel-through-iap
sudo docker compose version
sudo journalctl -u google-startup-scripts.service --no-pager -n 40
```

La identidad humana también necesita permisos de OS Login e IAP; una cuenta Owner
normalmente ya tiene los permisos necesarios. No copiar authorized_keys manualmente.
Si la organización restringe permisos o creación de recursos, resolver el error
concreto sin deshabilitar sus políticas.

## Dominio

Actualizar la IPv4 de `medicom-cuautitlan.duckdns.org` en DuckDNS con la IP de la VM
nueva. Verificar su resolución antes del primer despliegue. Este cambio mueve el
tráfico de la demo a la VM nueva. No publicar el token DuckDNS ni guardarlo en Git.
El dominio principal no lleva www. La configuración inicial no incluye alias www.
La IP es efímera: actualizar DuckDNS si cambia tras detener y arrancar la VM.

## Autenticación GitHub → GCP

La cuenta `medicom-deploy` recibe Compute Viewer, Compute OS Admin Login e IAP-secured
Tunnel User en el proyecto de la demo. No es Owner ni Editor. El script no genera
claves. Este workflow conserva el método JSON del repositorio. Para producción es
preferible Workload Identity Federation; si la organización prohíbe claves, configurar
WIF en lugar de debilitar esa política.

En IAM → Cuentas de servicio → medicom-deploy → Claves, crear una clave JSON si está
permitido. Copiar su contenido directamente al secreto GitHub `GCP_SERVICE_ACCOUNT_KEY`
y guardarla de forma segura fuera del repositorio. Nunca pegarla en chats ni logs.
Eliminar la clave y la cuenta de despliegue al retirar la demo si ya no se utilizan.

## Secretos de GitHub Actions

Repository Settings → Secrets and variables → Actions → Repository secrets.

| Secreto obligatorio | Valor |
|---|---|
| GCP_PROJECT_ID | project-2446ad52-eb6d-4f33-819 |
| GCP_ZONE | us-central1-a |
| GCP_VM_NAME | medicom-demo-v2 |
| GCP_SERVICE_ACCOUNT_KEY | JSON completo de la cuenta de despliegue |
| PUBLIC_HOST | medicom-cuautitlan.duckdns.org |
| DOCKERHUB_USERNAME | Usuario Docker Hub con acceso a las imágenes |
| DOCKERHUB_TOKEN | Token Docker Hub con permiso de publicación |
| DB_USER | medicom |
| DB_NAME | medicom |
| DB_PASSWORD | Contraseña nueva y fuerte |
| ADMIN_EMAIL | Correo del administrador de prueba |
| ADMIN_PASSWORD | Contraseña del administrador de prueba |
| PASSWORD_RESET_SECRET | Secreto aleatorio largo exclusivo de la aplicación |
| SMTP_USER | Cuenta de correo remitente |
| SMTP_PASSWORD | Credencial SMTP; para Gmail, contraseña de aplicación |

Opcionales: ADMIN_NAME, SMTP_HOST (smtp.gmail.com), SMTP_PORT (465), SMTP_SECURE (true),
SMTP_FROM (usa SMTP_USER). CORS_ORIGINS y APP_PUBLIC_URL se derivan de PUBLIC_HOST para
que coincidan con HTTPS; no hace falta configurar esos dos secretos por separado.
SMTP debe funcionar para probar recuperación de contraseña. No inventar credenciales.

## Primer despliegue

Integrar los cambios en main cuando la VM, DNS y secretos estén listos. También se
puede usar Actions → CI/CD → Run workflow → main. Un envío a la rama de trabajo no
despliega. El workflow valida los secretos, construye las imágenes, las publica y
copia Compose, Caddyfile y entorno a `/opt/servicios-medicos`.

`deploy.sh` espera PostgreSQL, ejecuta el manifiesto de migraciones una vez, inicia
backend y frontend, recrea Caddy y verifica HTTPS con validación de certificado.
El manifiesto incluye inicialización y datos de prueba; no copia los datos antiguos.
Las actualizaciones siguientes conservan el volumen. Este flujo no ofrece rollback
transaccional de migraciones ni despliegue sin interrupciones.

Comprobar en el navegador: inicio, catálogos, registro, login, sesión tras recargar,
reserva y consulta de citas, administrador y recuperación por correo. Probar también
con datos móviles. El healthcheck HTTPS no reemplaza estas pruebas.

```sh
cd /opt/servicios-medicos
sudo docker compose --env-file .env.production -f docker-compose.prod.yml ps
sudo docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=80 caddy backend
```

Para cambiar de dominio: actualizar DNS y PUBLIC_HOST en GitHub y volver a ejecutar
el workflow en main. No editar solo el archivo remoto: el siguiente despliegue lo reemplaza.

## Fin de la demo

Eliminar las VM y sus discos cuando ya no se necesiten, y revisar IP reservadas y
otros recursos. Si se desean conservar datos, respaldar PostgreSQL antes de eliminar.
Retirar los permisos y credenciales de despliegue que dejen de utilizarse.
