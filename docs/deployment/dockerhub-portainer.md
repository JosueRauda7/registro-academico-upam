# Instalación con imágenes Docker Hub

Este despliegue usa `docker-compose.portainer.yml` tanto con Docker Compose v2 como en **Portainer / Docker Standalone**. El YAML no usa build, rutas del host ni archivos del repositorio montados. Las imágenes de esta entrega son Linux amd64; ARM64/Swarm no están certificados.

## Imágenes

Namespace: `josuerauda117`. Tag de esta entrega: `2026.11.24.1`.

- `josuerauda117/registro-academico-upam-backend:2026.11.24.1`
- `josuerauda117/registro-academico-upam-frontend:2026.11.24.1`
- `josuerauda117/registro-academico-upam-database:2026.11.24.1`

Los digest y plataformas publicados están registrados en [images-2026.11.24.1.json](images-2026.11.24.1.json).

La imagen de base de datos contiene el esquema, configuración institucional inicial y creación del rol limitado `upam_app`. No incluye registros del servidor, usuarios de demostración ni sus contraseñas. En un volumen nuevo no habrá estudiantes, carreras, materias o ciclos; se cargan desde la aplicación. La inicialización no se ejecuta de nuevo sobre un volumen existente.

## Variables

Descarga el YAML y `.env.portainer.example`. Copia la plantilla a `.env.portainer`, archivo ignorado por Git, y completa:

| Variable | Valor |
| --- | --- |
| POSTGRES_PASSWORD | Secreto aleatorio exclusivo del administrador PostgreSQL |
| DATABASE_PASSWORD | Otro secreto aleatorio para upam_app |
| JWT_SECRET | Otro secreto aleatorio de al menos 32 bytes |
| FRONTEND_URL | URL exacta que abrirás, por ejemplo http://192.168.0.151:8082 o http://localhost:8082 |
| INITIAL_ADMIN_EMAIL | Tu correo para crear el primer administrador en la base nueva |
| INITIAL_ADMIN_PASSWORD | Contraseña propia, mínimo 16 caracteres y máximo 72 bytes |
| WEB_PORT | Puerto del host disponible; por defecto 8082 |
| WEB_BIND_ADDRESS | 0.0.0.0 para acceso desde otro equipo; 127.0.0.1 para acceso solo local |

Para cada uno de los tres secretos puedes ejecutar `openssl rand -hex 32`, o `node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"`. Genera cada uno por separado. No copies el .env ni las claves del servidor; usa valores propios. Wompi y Resend son opcionales y quedan sin configurar inicialmente.

El bootstrap usa una transacción y bloqueo de tabla; crea **un administrador solo si users está vacía**. No crea, cambia ni reemplaza usuarios si ya existen. Tras el primer arranque, retira INITIAL_ADMIN_EMAIL y INITIAL_ADMIN_PASSWORD de las variables del Stack y actualiza/recrea el backend. Para recuperar acceso a una base existente no uses este mecanismo.

## Docker Compose

Con los dos archivos en una carpeta:

```bash
cp .env.portainer.example .env.portainer
# Editar .env.portainer y completar variables antes de continuar.
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml pull
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml up -d
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml ps
```

Abre `http://TU_SERVIDOR:8082` y `http://TU_SERVIDOR:8082/api/docs`, ajustando puerto/esquema a tus variables. Inicia sesión con el administrador que configuraste. En tu computadora puedes usar localhost.

Para detener conservando datos:

```bash
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml stop
```

Para actualizar desde la versión 2026.11.24, aplica primero la migración de aranceles descrita abajo con el backend detenido; luego configura IMAGE_TAG=2026.11.24.1, ejecuta pull y up -d. Para otras versiones revisa las migraciones de esa entrega. Mantén el mismo nombre de proyecto/Stack: los volúmenes dependen de él. Cambiar el password en variables de un volumen existente no modifica por sí solo las credenciales de PostgreSQL. No elimines volúmenes para actualizar ni ejecutes seeds sobre ellos.

## Portainer

1. Selecciona tu entorno **Docker Standalone**, entra en **Stacks → Add stack** y asigna el nombre `upam`.
2. En **Web editor**, pega todo `docker-compose.portainer.yml`, o súbelo con **Upload**.
3. En **Environment variables**, carga tu `.env.portainer` o añade sus variables manualmente. No necesitas `env_file: stack.env`; las variables están referenciadas en el YAML.
4. Pulsa **Deploy the stack** y espera a que los servicios estén healthy. Abre la web/Swagger y entra con tu administrador inicial.
5. Retira las dos variables INITIAL_ADMIN_* y actualiza el Stack tras completar la inicialización.

El editor y las variables de Stack se documentan en la [guía oficial de Portainer](https://docs.portainer.io/user/docker/stacks/add). Esta entrega no configura Portainer ni despliega automáticamente en entornos remotos.

## Datos, red y actualización

Los servicios backend/DB no publican puertos al host; Nginx comunica `/api` dentro de la red del Stack. Los volúmenes `pgdata` y `uploads` persisten datos y comprobantes. Una instalación nueva no copia el volumen ni los archivos del servidor anterior: la migración requiere backup/restauración verificados por separado.

El YAML conserva HTTP para uso local/LAN. Para Internet configura un proxy con HTTPS y FRONTEND_URL=https://...; la publicación de estas imágenes no certifica un despliegue de producción ni cierra las alertas de dependencias anteriores. Ningún secreto debe ir dentro de imágenes, YAML, commits o parámetros de build.

## Publicar nuevas versiones

Desde el repositorio, con tu cuenta autenticada mediante `docker login`:

```bash
DOCKERHUB_NAMESPACE=josuerauda117 sh scripts/publish-images.sh NUEVO_TAG
```

El script exige un tag explícito, construye las tres imágenes y publica únicamente ese tag. Usa tags nuevos para conservar las versiones anteriores. No sobrescribe `latest` de forma automática. El comando de subida se describe en la [referencia oficial de Docker](https://docs.docker.com/reference/cli/docker/image/push/). Publicar otro tag requiere ejecutar el script explícitamente; modificar el repositorio no lo publica por sí solo.

## Actualización de esquema: aranceles del estudiante

Antes de ejecutar un backend que incluya esta función sobre un volumen existente, aplica la migración aditiva desde el repositorio actualizado:

```bash
docker compose exec -T db psql -X -v ON_ERROR_STOP=1 -U postgres -d upam_academico < database/migrations/20261124_student_fees.sql
```

Si usas otro archivo/proyecto Compose, añade los mismos parámetros --env-file, -p y -f de ese despliegue. En Portainer usa la consola de su contenedor DB como postgres para ejecutar el contenido del archivo; la imagen DB 2026.11.24.1 también lo incluye en /opt/upam/migrations/20261124_student_fees.sql. El tag anterior 2026.11.24 no incluye la migración ni las nuevas funciones. La migración puede repetirse y conserva los registros existentes con ambos overrides en NULL; requiere permisos de propietario del esquema. Verifica backup y conectividad antes de aplicarla en otra base. No elimina columnas ni cambia pagos; para volver a código anterior conserva las columnas en vez de borrarlas.

### Actualizar desde Portainer sin reinicializar volúmenes

1. Conserva el mismo Stack y sus volúmenes. Realiza un respaldo verificado y detén el contenedor backend para evitar peticiones durante la actualización.
2. Abre la consola del contenedor db como usuario postgres, ejecuta `psql -X -v ON_ERROR_STOP=1 -U postgres -d upam_academico` y pega el contenido de [20261124_student_fees.sql](../../database/migrations/20261124_student_fees.sql). Comprueba que termina con COMMIT. En el tag anterior este archivo aún no existe dentro del contenedor: usa el SQL del repositorio actualizado.
3. Tras confirmar la migración, configura IMAGE_TAG=`2026.11.24.1` en el Stack y actualízalo con descarga de imágenes habilitada, conservando sus variables y volúmenes.
4. Comprueba salud de los tres servicios, acceso a la web/Swagger y los nuevos campos de aranceles. La imagen database nueva incluye la migración en `/opt/upam/migrations/20261124_student_fees.sql`, pero cambiar de imagen no ejecuta migraciones sobre un volumen existente.

Con Compose, el equivalente usando las variables de la entrega es:

```bash
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml stop backend
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml pull
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml up -d --no-deps db
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml exec -T db psql -X -v ON_ERROR_STOP=1 -U postgres -d upam_academico -f /opt/upam/migrations/20261124_student_fees.sql
docker compose --env-file .env.portainer -p upam -f docker-compose.portainer.yml up -d
```

Configura IMAGE_TAG=2026.11.24.1 antes de estos comandos y espera a que db esté healthy antes de ejecutar psql. El procedimiento no ejecuta migraciones automáticamente ni elimina volúmenes.
