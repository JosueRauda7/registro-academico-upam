# Progreso del proyecto

Bitácora acumulativa de trabajos de IA. No borrar entradas anteriores ni atribuirse cambios preexistentes. Estado funcional observado no equivale a funcionalidad probada. Fechas en zona America/El_Salvador.

## 2026-10-28 — Documentación inicial y revisión estática de seguridad

- Agente: Codex. Estado: documentación completada; remediaciones pendientes.
- Objetivo: crear contexto persistente para colaboración entre modelos y proceso de seguridad adaptado a UPAM.
- Base: HEAD `f9be37d` más cambios locales existentes; no se reconstruyó historial de desarrollo anterior.
- Revisado: manifiestos, estructura funcional, bootstrap, módulos, conexión y entidades, SQL, autenticación, guard JWT, pagos/webhook/repositorio, uploads, correo, contexto y cliente HTTP del frontend, Docker/Nginx y scripts disponibles.
- Entregables: `AGENTS.md`; `docs/architecture.md`, `docs/decisions.md`, `docs/progress.md`; política, auditoría inicial, evidencia sanitizada, hallazgos individuales y guía de remediación en `security/`.
- Hallazgos: FINDING-2026-001 a FINDING-2026-006, todos OPEN. Véase el índice de la auditoría para prioridad y condiciones.
- Cambios de aplicación: ninguno; se conservaron modificaciones previas del usuario.
- Verificación: lectura estática; `npm --prefix backend run typecheck` y `npm --prefix frontend run typecheck` completaron sin errores (salida de tsc sin diagnósticos; proceso final exit 0). No son pruebas funcionales ni de seguridad. Se revisaron enlaces relativos de Markdown y alcance de archivos nuevos al finalizar.
- No ejecutado: servicios, migraciones, seed, pagos Wompi, correos Resend, pruebas HTTP, pentest, auditoría de dependencias y despliegue. No se consultó ni alteró una base de datos.
- Próximos pasos: priorizar registro con rol arbitrario y exposición de datos en pagos, separar tokens por propósito, revisar integridad del webhook, proteger comprobantes y endurecer configuración; implementar pruebas y corregir migraciones antes de cambios de esquema.
- Limitación: revisión inicial selectiva; no acredita la ausencia de otros defectos ni el funcionamiento completo.

## 2026-10-28 — Regla de actualización de Docker por tarea

- Agente: Codex. Estado: completado.
- Solicitud: añadir la actualización de contenedores al flujo de trabajos de IA.
- Cambios propios: `AGENTS.md` incorpora reconstrucción/recreación local de servicios afectados, comandos orientativos, comprobación de estado/logs y prueba relevante; `docs/decisions.md` registra DEC-005; esta entrada registra el avance.
- Seguridad revisada: se exige conservar datos/volúmenes, no usar seeds ni reinicialización como mecanismo de actualización y mantener autorización específica para producción/remotos. Sin nuevos hallazgos por este cambio documental.
- Verificación: lectura de las reglas y revisión de coherencia con DEC-005 y esta bitácora; sin cambios en código ni configuración ejecutable.
- Docker: no aplica reconstrucción ni reinicio porque esta tarea modifica exclusivamente documentación. No se ejecutaron comandos Docker ni pruebas de aplicación.
- Pendientes: aplicar esta regla en los siguientes trabajos que afecten a los servicios.

## 2026-10-28 — Remediación de los seis hallazgos de seguridad

- Agente: Codex. Estado: completado en código y entorno local; seis hallazgos cerrados con límites documentados.
- Solicitud: resolver FINDING-2026-001 a FINDING-2026-006. Base f9be37d con cambios previos conservados; sin commit/push.
- Cambios: registro student; separación de tokens y hash de recuperación; propiedad/permisos y proyección de pagos; exclusión/sanitización de secretos; checksum Wompi y vinculación remota con bloqueo de fila; comprobantes privados y logos públicos con descarga autenticada; secretos externos/rotados y rol DB limitado. Véanse REM-2026-001 a REM-2026-006 para archivos y alcance.
- Decisiones: DEC-006 y DEC-007. Arquitectura, README, política y expedientes actualizados.
- Verificación: typecheck backend/frontend, builds de ambos, 7 regresiones HTTP de seguridad correctas y 32 comprobaciones en API/PostgreSQL/TypeORM Docker. Rechazo de password anterior DB y de Compose sin secretos; Nginx devuelve frontend 200, API privada 401 y antiguo upload 404. Evidencia: security/evidence/2026-10-28-remediation-tests.md.
- Docker: reconstruidos/recreados backend y frontend; DB recreada con mismo volumen al cambiar configuración. Todos activos y DB healthy; puertos 127.0.0.1. Secretos locales rotados y cuenta upam_app configurada conservando datos/volúmenes. Logo anterior copiado y referencia actualizada sin borrar original. Fixtures de QA eliminados al finalizar. Primera prueba tras recreación encontró API aún arrancando; se añadió espera acotada y el re-test pasó.
- Límites: sin pagos ni correos reales. WOMPI_EVENTS_SECRET no está configurado en local: webhook rechaza con 503 hasta habilitar proveedor verificado. No se certificaron región/moneda/cuenta comercial ni despliegues externos. Sesiones/enlaces antiguos requieren volver a autenticarse/solicitar recuperación. No se pueden revocar copias externas de comprobantes.
- Pendientes: investigar alertas de dependencias reportadas por npm ci (runtime backend 17, backend total 37, frontend 7), hardening de producción y controles fuera de los seis hallazgos. No se ejecutó actualización forzada de paquetes ni migración general del esquema.
- Revisión final: enlaces locales de documentación sin roturas y git diff --check sin errores de espacios. Ejemplos de entorno sin credenciales predeterminadas; no se guardaron secretos en archivos versionables. Los cambios finales de documentación/plantillas no alteran las imágenes ejecutadas.

## 2026-10-29 — Commits de los cambios pendientes

- Agente: Codex. Estado: preparación y registro de commits locales solicitados por el usuario.
- Base: `f9be37d`, con cambios funcionales, de seguridad y documentación preexistentes; esta tarea no implementó esas modificaciones ni alteró su contenido.
- Organización: un commit de aplicación e infraestructura (backend, frontend, base de datos, scripts y plantillas de entorno), seguido de otro de documentación (README, AGENTS, docs y expedientes security). Los cambios funcionales y remediaciones comparten archivos y se conservan juntos.
- Cambio propio: esta entrada en `docs/progress.md`. Sin cambios de arquitectura ni nuevas decisiones técnicas.
- Verificación actual: typecheck backend y frontend correctos; `npm --prefix backend run test:security`, 7 pruebas aprobadas y 0 fallidas; diff preparado sin errores de espacios; 22 documentos de AGENTS/docs/security con 0 enlaces relativos rotos. Node/npm requirieron ejecución fuera del sandbox; el primer intento no encontró npm.
- Seguridad: revisión de plantillas y archivos candidatos; escaneo de patrones de claves privadas, claves de servicio y JWT sin coincidencias. `.env` y `backend/.env` ignorados y excluidos de los commits. Sin nuevos hallazgos confirmados ni cambios de estado en los expedientes.
- Docker: `docker compose ps` comprobado fuera del sandbox, backend/frontend activos y DB healthy. No aplica reconstrucción: esta tarea registra cambios existentes y añade documentación; la actualización de imágenes anterior consta en la entrada de remediación.
- Límites: no se repitieron builds, pruebas con PostgreSQL ni integraciones externas; se conservan los resultados históricos y sus límites. Sin push ni despliegue. Siguiente paso: revisar los commits locales y publicar solo cuando el usuario lo solicite.

## 2026-10-29 — Análisis de contexto para continuar el desarrollo

- Agente: Codex. Estado: completado; revisión estática selectiva solicitada por el usuario.
- Base: `db342a3`; `git status --short` limpio al iniciar. No se modificó código de aplicación.
- Revisado: instrucciones y documentación obligatoria, expedientes de remediación, manifiestos/scripts, estructura backend/frontend, bootstrap, DB, rutas y sesión, inscripción, notas, pruebas existentes y Docker/Nginx.
- Resultado: confirmado el mapa React/Vite → NestJS → PostgreSQL/TypeORM y sus integraciones Wompi/Resend. Pendientes existentes: migraciones verificables, DTOs, cobertura de reglas académicas/concurrencia, dependencias y preparación de producción. El archivo de datasource mencionado por los scripts de migración no está presente.
- Cambios propios: esta entrada y `security/audits/2026-10-29-project-analysis.md`. Sin cambios de arquitectura ni decisiones nuevas.
- Seguridad: revisión de contexto registrada en la auditoría enlazada; se conservan los seis cierres anteriores y sus límites. No se ejecutó re-test ni se formalizaron hallazgos nuevos.
- Verificación: lectura/contraste con código, revisión del diff y enlaces locales de los documentos añadidos. Sin builds/typechecks/pruebas funcionales: cambio exclusivamente documental y sin directorios node_modules locales observados. Los resultados de pruebas previas siguen siendo históricos.
- Docker: no aplica reconstrucción ni reinicio; no hubo cambios ejecutables. No se consultó estado runtime ni se alteraron datos, secretos o volúmenes.
- Siguiente paso: desarrollar la siguiente funcionalidad solicitada dentro de los módulos existentes, verificando permisos y reglas de negocio afectados; completar migraciones antes de alterar esquema.

## 2026-10-29 — Arranque local Docker en puertos disponibles

- Agente: Codex. Estado: completado. Solicitud: levantar Compose, cambiando puertos en conflicto.
- Cambios propios: docker-compose.yml publica web 8082, API 3002 y DB 5434 en loopback, FRONTEND_URL actualizado; README y arquitectura reflejan accesos; DEC-008 documenta la decisión. `.env` local generado con el helper --init-env, ignorado por Git y sin exponer secretos. Se conservan cambios documentales de la tarea anterior.
- Incidencias: sandbox impedía acceso al socket Docker, resuelto con ejecución escalada autorizada. Primera construcción interrumpida; reintento demorado varios minutos en npm ci backend, cancelado para probar --no-audit en backend/Dockerfile. Con ese ajuste la instalación terminó y el build pasó, sin cambiar paquetes/lockfiles. No se acredita la causa interna del retraso; auditoría npm separada pendiente.
- Verificación: `docker compose up -d --build backend frontend` exit 0, builds backend/frontend correctos; `docker compose ps`: backend/frontend Up, DB healthy. Logs recientes sin errores de arranque. curl: frontend 8082 y Swagger 3002 HTTP 200; API privada de inscripciones y settings a través de Nginx HTTP 401 sin token. `git diff --check` correcto.
- Seguridad: security/audits/2026-10-29-local-compose.md registra revisión y evidencia sanitizada. Puertos solo 127.0.0.1, secretos externos, rol DB limitado, sin modificar servicios ajenos. Alertas npm existentes pendientes; sin nuevos hallazgos formalizados.
- Datos: no existían volúmenes ni contenedores UPAM en este Docker; Compose creó pgdata/uploads e inicializó una base nueva con el SQL ya configurado. No se borraron volúmenes ni se ejecutó seed manual.
- Límites: sin pagos/correos reales, pruebas de login ni recorridos completos. Sin typechecks adicionales ni suite de regresión: cambios de empaquetado/configuración verificados mediante build y arranque HTTP. Sin commit/push.
- Siguiente paso: abrir http://localhost:8082 y continuar con la funcionalidad solicitada; revisar dependencias en una tarea específica.

## 2026-10-29 — Acceso a la web desde fuera del servidor

- Solicitud: usuario puede acceder a los servicios 80/81 del servidor pero no a UPAM. Causa verificada: frontend publicado solo en loopback.
- Cambios propios: docker-compose.yml publica frontend en 0.0.0.0:8082 y permite FRONTEND_URL configurable (por defecto URL LAN del servidor); README, arquitectura y DEC-009 actualizados. API directa y PostgreSQL conservan 127.0.0.1. Se conservan cambios anteriores y datos.
- Docker: `docker compose up -d --build backend frontend` exit 0, imágenes desde caché y contenedores recreados; ps confirma frontend 0.0.0.0:8082, backend Up y DB healthy. Logs recientes confirman Nest/Nginx iniciados.
- Verificación desde el servidor: curl a 192.168.0.151:8082 y 100.74.201.76:8082 devuelve HTTP 200; API privada vía IP LAN devuelve 401 sin token. Diff comprobado sin errores de espacios.
- Seguridad: acceso remoto de desarrollo autorizado; no se expone DB ni puerto directo API, sin cambios de firewall/router, secretos o integraciones. Resultado ampliado en security/audits/2026-10-29-local-compose.md; sin hallazgos nuevos formalizados.
- Límites: no se puede verificar desde el dispositivo del usuario; sin pruebas de login, pagos/correos, typechecks ni regresión adicionales por cambio de publicación de puertos. Siguiente paso: acceder a la misma dirección del servidor usada en 80/81 con puerto 8082.

## 2026-10-29 — Corrección de Swagger en HTTP remoto

- Agente: Codex. Estado: corrección aplicada y comprobaciones HTTP completadas; visualización en cliente por confirmar.
- Solicitud: usuario no puede ver Swagger. El HTML respondía 200, pero Helmet incluía upgrade-insecure-requests, incompatible con recursos servidos por este puerto HTTP. La comprobación anterior de solo estado 200 era insuficiente.
- Cambios propios: backend/src/main.ts omite upgrade-insecure-requests y HSTS cuando FRONTEND_URL no usa HTTPS; conserva CSP y demás cabeceras. docs/architecture.md y DEC-010 documentan el contrato. Sin cambios de datos ni paquetes.
- Docker/verificación: `docker compose up -d --build backend` exit 0, Nest build correcto (incluye comprobación TypeScript), backend recreado y Up, DB healthy, logs de arranque correctos. Por LAN y Tailscale, HTML y sus seis recursos referenciados dan 200 con MIME apropiado; CSP mantiene script-src self sin upgrade, HSTS ausente. OpenAPI JSON válido con 70 rutas; API privada devuelve 401. `git diff --check` sin errores.
- Seguridad: security/audits/2026-10-29-swagger-http.md registra evidencia y límites. No se deshabilita CSP ni se abren orígenes de scripts; políticas HTTPS se conservan para FRONTEND_URL https://. Sin nuevos hallazgos de seguridad formalizados.
- Límites: sin navegador disponible ni validación desde dispositivo del usuario, sin prueba TLS, sin suite general/typecheck separado. Sin pagos/correos ni commit/push. Siguiente paso: recargar Swagger por HTTP y confirmar renderizado en el cliente.

## 2026-10-29 — Instrucciones para ejecutar en otra computadora

- Solicitud: explicar cómo descargar el repositorio y ejecutar aplicación/Swagger en local.
- Verificación: revisados remote Git, estado de cambios, README, Compose, plantillas de entorno y helper --init-env. Las instrucciones corresponden al árbol actual; los ajustes de puertos/Swagger aún no están en commit/push y un clon no los incorpora automáticamente.
- Guía entregada: Git, Docker con Compose y Node para generar secretos; clonar, generar .env una sola vez, establecer FRONTEND_URL=http://localhost:8082 y levantar Compose; web/Swagger por localhost:8082, API directa 3002 y DB 5434 para la configuración actual. Una DB nueva usa el SQL inicial del repositorio; no copia datos/uploads del servidor.
- Seguridad: usar secretos independientes en cada computadora, no copiar .env del servidor, no versionarlo; integraciones sin claves no ejecutan pagos/correos reales. Sin nuevos hallazgos ni cambios de controles.
- Cambio propio: solo esta entrada. No aplica reconstrucción Docker; no se ejecutaron instalaciones ni pruebas en la computadora del usuario. Siguiente paso: publicar cambios solo cuando el usuario lo autorice, antes de replicar exactamente esta configuración desde GitHub.

## 2026-10-29 — Commits de Docker, acceso remoto y Swagger

- Agente: Codex. Solicitud: crear commits de los cambios pendientes; sin push autorizado.
- Base: db342a3 y cambios de las tareas de esta conversación conservados. Organización: configuración Docker/acceso remoto, corrección HTTP de Swagger y documentación/evidencia.
- Registro Git: 12211c9 para Docker y 71abe2f para Swagger; documentación en el commit que incluye esta entrada. El sandbox rechazó crear .git/index.lock por ser de solo lectura; se usó ejecución escalada autorizada para los commits locales.
- Ajustes documentales propios en esta tarea: README con URL real de clonación, directorio correcto, FRONTEND_URL local e ingreso a Swagger vía frontend; auditoría Swagger incorpora confirmación posterior del usuario; esta entrada.
- Verificación actual: diff sin errores de espacios, escaneo de patrones de claves privadas/JWT/claves de servicio sin coincidencias y enlaces relativos de los archivos candidatos sin roturas. `.env` ignorado, sin archivos .env versionados. ps confirma backend/frontend activos y DB healthy; Swagger remoto HTTP 200.
- Validación previa conservada: builds correctos, recursos Swagger/OpenAPI 200 y API privada 401, detallados en las entradas anteriores. No se repiten builds ni suite general porque esta tarea solo registra lo ya verificado y ajusta documentación.
- Seguridad: sin secretos incluidos, sin nuevos hallazgos ni cambios de estado; se conservan auditorías y límites. Docker: no aplica reconstrucción por crear commits y editar únicamente documentación; los contenedores ya incorporan los cambios ejecutables anteriores.
- Siguiente paso: revisar los commits locales; publicar solo por solicitud del usuario.

## 2026-10-29 — Importación Excel de materias previas

- Agente: Codex. Estado: implementado y verificado en Docker local. Solicitud: migrar notas anteriores al sistema desde Excel, brindar plantilla y validar seguridad del contenido. Base b1605a2, árbol limpio al iniciar.
- Backend: LegacyImportService, preanálisis safe-xlsx y DTO por fila; rutas GET /legacy-subjects/template y POST /legacy-subjects/import con JWT/roles administrator/administrative. Plantilla con Notas previas, Instrucciones y catálogo Materias, sin datos personales. Lotes de varios estudiantes por carnet/código, nota 0–10 y opcionales año/semestre/observaciones.
- Integridad: validación completa y errores por fila, sin sobrescribir registros; importBatch inserta en una transacción usando unicidad SQL existente y actor autenticado. Conserva historial reprobado y sus efectos existentes en CUM/prerrequisitos. Sin cambios de entidades, SQL o esquema ni migraciones necesarias.
- Frontend: LegacyImportCard en Materias previas, descarga autenticada, selector XLSX, botón Validar e importar, resumen de registros/estudiantes y errores. Se conserva formulario individual y se actualiza la tabla seleccionada tras importar. API frontend ampliada.
- Seguridad: 2 MiB comprimidos, 8 MiB expandidos, 100 entradas ZIP, 500 notas y una importación por proceso. Rechazo de fórmulas/resultados cacheados, macros, enlaces, objetos, DTD/entidades, ZIP sospechoso, hojas/formatos no admitidos, coordenadas desmedidas y campos multipart extra. Archivo solo en memoria, plantilla no-store, errores sin datos de filas ni parámetros SQL. Sin nuevos hallazgos formalizados ni cambios de estado de los cierres anteriores.
- Verificación: typecheck backend/frontend y builds NestJS/Vite correctos en imágenes de validación/construcción con dependencias existentes. Ocho pruebas nuevas de importación aprobadas; siete regresiones de seguridad existentes aprobadas. Primer ensayo encontró parts=1 demasiado estricto; parts=2 con files=1/fields=0 corregido y re-test exitoso. Casos adicionales de tamaño ZIP falsificado y columnas gigantes rechazados.
- Docker: `docker compose up -d --build backend frontend` completó, ambos recreados y Up, DB healthy. Rebuild final incorpora mensajes de error ajustados. `docker compose exec -T backend node < backend/test/docker-legacy-import.cjs`: 19 comprobaciones API/PostgreSQL correctas, incluidas reversión del lote y duplicados concurrentes; fixtures eliminados en finally. Logs recientes de arranque sin errores. Página /materias-previas HTTP 200 y plantilla anónima 401 a través de Nginx.
- Documentación: README, arquitectura y DEC-011 actualizados; auditoría security/audits/2026-10-29-legacy-excel-import.md y evidencia security/evidence/2026-10-29-legacy-excel-tests.md. Diff y enlaces revisados al terminar.
- Límites: sin navegador automatizado ni prueba con Excel/LibreOffice de escritorio; compatibilidad limitada a libros simples de la plantilla. No es antivirus ni nueva auditoría de dependencias. Sin librerías nuevas/lockfiles, datos ajenos, pagos/correos, seeds, cambios de volumen, commit o push. El último cambio del archivo de pruebas solo amplía casos y no altera recursos de las imágenes en ejecución.
- Siguiente paso: entrar a Materias previas como administrador/administrativo, descargar plantilla y cargar un lote histórico revisado; si se necesita otro formato de origen, acordar su mapeo antes de ampliar el importador.

## 2026-10-29 — Commit de importación Excel de materias previas

- Agente: Codex. Solicitud: registrar en un commit local la funcionalidad recién implementada. Base b1605a2, conservando los archivos de esa tarea; sin cambios nuevos de aplicación.
- Alcance: importador/plantilla, UI, DTOs, controles de contenido, transacción, pruebas y documentación/evidencia de seguridad en un commit funcional. Cambio propio de esta tarea: esta entrada.
- Verificación actual: git diff --check correcto, escaneo de patrones sensibles sin coincidencias y enlaces relativos de archivos candidatos sin roturas. `.env` ignorado y excluido del commit. Se conservan resultados previos de builds/typechecks, ocho pruebas nuevas, siete regresiones y 19 comprobaciones API/PostgreSQL; no se repiten por tratarse del registro de cambios ya verificados.
- Seguridad: sin hallazgos nuevos ni cambios de estado. Docker: no aplica reconstrucción por este commit y cambio documental; la actualización de ambos servicios consta en la entrada anterior. Sin push, pagos, correos ni cambios de datos. Siguiente paso: publicar solo cuando el usuario lo solicite.

## 2026-11-24 — Imágenes Docker Hub y YAML Compose/Portainer

- Agente: Codex. Estado: completado. Solicitud: publicar imágenes y brindar un YAML utilizable en Compose o Portainer. Base da16833, árbol limpio al iniciar. Namespace josuerauda117 y tres repositorios públicos confirmados explícitamente por el usuario tras auto-review inicial del push backend; reintento posterior autorizado completado.
- Cambios: docker-compose.portainer.yml, .env.portainer.example, scripts/publish-images.sh, database/Dockerfile/.dockerignore/initial-settings.sql, backend/scripts/bootstrap-admin.cjs y COPY/CMD del Dockerfile backend, frontend/.dockerignore y .gitignore. Imagen DB sin datos/usuarios demo; administrador inicial opcional solo si users vacía, sin modificar usuarios existentes. Stack sin build/bind mounts y únicamente web publicada.
- Documentación: guía docs/deployment/dockerhub-portainer.md, metadatos de digest/plataforma images-2026.11.24.json, README, arquitectura y DEC-012. Auditoría/evidencia security de la fecha. Sin cambios de esquema, dependencias o lockfiles.
- Verificación: builds de tres imágenes correctos, node --check y sh -n correctos, Compose config --quiet correcto. Stack QA aislado con secretos independientes: tres servicios healthy, 15 comprobaciones DB/API aprobadas (admin/login/idempotencia, permisos DB, ausencia de datos demo y settings/Swagger/plantilla). Web/Swagger por proxy 200. Imágenes revisadas sin .env ni usuarios demo. No se repiten suites académicas/Excel ni typechecks separados, por cambios de empaquetado y bootstrap JS; Nest/Vite recompilados.
- Docker local: docker compose up -d --build backend frontend completó; ambos recreados y activos, DB existente healthy, logs de arranque y Swagger 200. QA up --wait correcto y down sin -v completado; volúmenes de todos los proyectos preservados. Credenciales QA temporales retiradas después de detener sus contenedores.
- Publicación: backend/frontend/database en josuerauda117/registro-academico-upam-<componente>:2026.11.24, tres pushes exit 0. Manifiestos accesibles anónimamente y digest confirmados en metadatos/evidencia. Solo linux/amd64 disponible; no se publica latest. No se suben datos o secretos del servidor.
- Seguridad/límites: inicialización y credenciales externas documentadas; retirar INITIAL_ADMIN_* tras primer arranque. Sin hallazgos nuevos formalizados, sin cerrar por intuición los pendientes anteriores. Alertas npm existentes pendientes. Sin prueba del editor Portainer, Swarm/ARM64/TLS/restauración ni certificación productiva; sin migrar datos, pagos/correos reales o despliegues remotos. Sin commit/push Git.
- Siguiente paso: cargar el YAML y variables propias en Portainer Docker Standalone o ejecutar Compose según la guía; si se requiere migrar datos existentes, verificar backup/restauración por separado.

## 2026-11-24 — Commits de distribución Docker Hub y Portainer

- Agente: Codex. Solicitud: registrar los cambios de la distribución en commits locales. Base da16833 y archivos de la tarea anterior conservados; sin cambios nuevos de aplicación.
- Organización: commit de empaquetado, Stack, bootstrap, publicación y prueba de instalación; commit de guía, metadatos Docker Hub, arquitectura/decisiones y expediente de seguridad. Cambio propio de esta tarea: esta entrada.
- Verificación actual: diff sin errores de espacios, escaneo de patrones sensibles sin coincidencias, enlaces relativos sin roturas y JSON de metadatos válido. node --check bootstrap y sh -n publicación correctos; .env y .env.portainer ignorados y excluidos. Se conservan los builds, 15 comprobaciones de instalación y verificación de tres manifiestos públicos de la tarea anterior; no se repiten por registrar cambios ya probados.
- Seguridad: sin hallazgos nuevos ni cambios de estado. Docker: no aplica reconstrucción por crear commits y añadir bitácora; la actualización de servicios consta en la entrada anterior. Sin push Git ni nuevas publicaciones Docker Hub. Siguiente paso: publicar el código en Git solo si el usuario lo solicita.

## 2026-11-24 — Diagnóstico de acceso PostgreSQL por túnel SSH

- Solicitud: fallo de contraseña al conectar como upam_app por túnel SSH local 5433. Revisado: estado Docker, puertos, Compose/Portainer y plantilla backend.
- Resultado: UPAM publica 127.0.0.1:5434 en el servidor; el 5433 corresponde a otro proyecto. Autenticación TCP real de upam_app con las credenciales del contenedor correcta (SELECT 1); contraseña runtime coincide con configuración Compose actual, comparadas sin imprimir valores. Un túnel local 5433 es válido si su destino remoto es 127.0.0.1:5434. Propuesto túnel alternativo local 15434 para evitar confusión.
- Cambio propio: backend/.env.example actualiza el puerto directo de 5433 a 5434 y distingue el puerto local del túnel. Esta entrada y auditoría security/audits/2026-11-24-db-ssh-access.md registran evidencia sin secretos. No se modifican contraseñas, datos, permisos o servicios.
- Verificación: SELECT 1 autenticado exit 0 y diff sin errores de espacios. No se puede verificar el túnel del dispositivo del usuario. Docker: no aplica reconstrucción; plantilla .env.example excluida del contexto backend y sin cambios ejecutables. Sin pruebas de aplicación ni commit/push.
- Seguridad: el usuario compartió credenciales en la conversación; no se copiaron a archivos, comandos ni evidencia. Recomendación de rotación coordinada tras recuperar acceso, sin invalidar sesiones de forma inesperada. Siguiente paso: ajustar el destino remoto del túnel a 5434 y conectar al puerto local elegido.

## 2026-11-24 — Modales para confirmaciones de la aplicación

- Agente: Codex. Estado: implementado y verificado. Solicitud: usar un modal de la aplicación en lugar de alerts del navegador. Base 81274f5; cambios previos de diagnóstico SSH en backend/.env.example, bitácora y auditoría DB conservados.
- Cambios propios: DialogProvider/useDialog y controlador de cola con confirm/alert asíncronos; App incorpora proveedor dentro de BrowserRouter; Modal usa dialog nativo, título accesible, Escape/X/fondo, foco inicial en Cancelar y restauración gestionada por navegador. Once confirmaciones en usuarios, estudiantes, carreras, materias, pensum, planificación y materias previas esperan la elección antes de invocar APIs. No había llamadas nativas alert/prompt. Sin paquetes nuevos ni cambios de backend.
- Seguridad: cancelar/cerrar no ejecuta operaciones; navegar/desmontar cancela todas las solicitudes pendientes; mensajes como texto React sin HTML, logs o persistencia. Sin nuevos hallazgos formalizados ni cambios de autorización. Alcance y límites en security/audits/2026-11-24-ui-dialogs.md; arquitectura y DEC-013 actualizados.
- Verificación: typecheck frontend correcto y cinco pruebas Node del controlador aprobadas (cancelación, aceptación única, cola aislada, cancelAll y alert/texto literal). Primera comprobación detectó referencia a Student.isActive; corregida a user.isActive y re-test aprobado. Build Vite final correcto. Sin navegador/automatización visual disponible para comprobar foco/teclado/clics reales ni lectores de pantalla; no se modificaron registros para ensayar acciones destructivas.
- Docker: docker compose up -d --build frontend completó y comprobó dependencias; último ajuste incorporado con docker compose up -d --build --no-deps frontend, exit 0. Frontend recreado; backend activo y DB healthy. Logs de Nginx correctos; página /materias-previas y bundle actualizado con showModal/Confirmar acción HTTP 200. Volúmenes y datos conservados.
- Límites: requiere navegador con dialog/showModal; pruebas del controlador no sustituyen interacción visual. Sin nueva publicación de imágenes Docker Hub, commit o push Git. Diff y enlaces revisados. Siguiente paso: recargar la web y comprobar las confirmaciones al eliminar/desactivar un registro.

## 2026-11-24 — Selectores con búsqueda y prerrequisitos múltiples

- Agente: Codex. Estado: implementado y verificado. Solicitud: buscar por label en combobox y elegir varias materias prerrequisito. Cambios anteriores de SSH/modales conservados; base Git 81274f5, árbol con trabajo previo sin commit.
- Frontend: SearchableSelect/select-options compartidos, 19 selectores migrados en páginas; búsqueda local insensible a acentos/case por etiqueta, manejo de foco/teclas, required y múltiples con etiquetas removibles. Materias carga/envía/muestra toda la lista y permite retirar referencias inactivas existentes; inscripción comprueba todos los requisitos y sus etiquetas. No hay texto libre como ID.
- Backend: DTOs concretos create/update, array UUID único máximo 100 y compatibilidad con campo escalar anterior. Guardado atómico en SubjectRepository con bloqueo advisory transaccional, validaciones de referencias/carrera/actividad de nuevos requisitos/autorreferencia/ciclos y coherencia de dependientes al cambiar carrera. Omitir lista conserva; [] elimina. Sin cambios de esquema, seeds, migraciones o librerías.
- Verificación: builds Nest/Vite y typechecks de ambos proyectos correctos en Docker. Seis pruebas frontend (búsqueda y cinco regresiones de diálogos) y siete regresiones backend de seguridad aprobadas. docker-prerequisites.cjs: 36 comprobaciones API/PostgreSQL correctas, incluyendo varios IDs, conservación/limpieza, compatibilidad, validaciones y permisos, rollback y ciclos concurrentes; fixtures sintéticos retirados en finally.
- Docker: docker compose up -d --build backend frontend exit 0; ambos recreados, activos y DB healthy. Página /materias y bundle nuevo HTTP 200, Swagger expone prerequisiteSubjectIds. Revisados logs de arranque con salida sanitizada. Volúmenes y datos ajenos conservados.
- Documentación: arquitectura y DEC-014, auditoría security/audits/2026-11-24-searchable-prerequisites.md. Diff y enlaces comprobados al finalizar. Sin hallazgos nuevos independientes ni cambios de estado previos.
- Límites: sin navegador automatizado o prueba visual de interacción/foco/required del combobox; pruebas Node de búsqueda no cubren DOM. Sin acciones sobre datos reales, pagos/correos, publicación Docker Hub, commit ni push Git. Los clientes escalares antiguos siguen reemplazando por un requisito y deben migrar a arrays para mantener varios. Siguiente paso: recargar la web y probar búsqueda y selección de varias materias en crear/editar.

## 2026-11-24 — Eliminación de inactivos de catálogos solicitada por el usuario

- Agente: Codex. Estado: completado. Solicitud explícita: eliminar registros inactivos de docentes, salones, materias y carreras de la BD. Trabajos previos SSH/modales/selectores conservados; sin cambios nuevos de aplicación o arquitectura.
- Inspección: consultas agregadas y FKs reales; 4 docentes, 4 salones, 12 materias y 7 carreras inactivos. Sin grupos, inscripciones, notas o historial asociados; 4 prerrequisitos únicamente entre materias inactivas. Carreras sin referencias por nombre/código desde estudiantes o materias.
- Ejecución: respaldo privado específico antes de borrar, dentro de una transacción con bloqueos y límites de espera. Guardado bajo .backups/ con archivo 0600/directorio 0700, ignorado en Git antes de escribir; no se copió contenido a evidencia. DELETE solo is_active=false; COMMIT correcto con 27 registros eliminados y 4 relaciones de prerrequisitos retiradas en cascada. Usuarios vinculados se conservan.
- Verificación: conteos de registros activos y tablas de historial/usuarios/estudiantes/grupos/horarios/pagos/inscripciones idénticos antes/después dentro de la transacción. Consulta independiente tras COMMIT confirma cero inactivos en las cuatro tablas; Swagger HTTP 200. No se ejecutaron pruebas de código por operación de datos sin cambios ejecutables.
- Cambios propios de archivos: .gitignore excluye .backups/, esta entrada y security/audits/2026-11-24-inactive-record-cleanup.md. Sin nuevas decisiones de arquitectura o hallazgos independientes. Diff y exclusión de respaldo comprobados.
- Docker: no requiere reconstrucción/reinicio; no hubo cambios de recursos incluidos en imágenes, esquema o configuración de servicios. Volúmenes conservados, sin seeds/reinicialización. Sin commit/push ni publicación. Siguiente paso: actualizar las pantallas de catálogos; respaldo privado disponible para recuperación selectiva si se necesita.

## 2026-11-24 — Corrección de acceso a Configuración

- Agente: Codex. Estado: completado. Solicitud: administrador vuelve al dashboard al entrar a Configuración. Causa: Sidebar usa /configuracion y App registraba únicamente /configuración; se activaba la ruta wildcard al dashboard.
- Cambios propios: frontend/src/App.tsx registra /configuracion con ProtectedRoute administrator y conserva la ruta con tilde como redirección replace. Arquitectura/DEC-015 y auditoría security/audits/2026-11-24-settings-route.md actualizadas; trabajos previos del árbol conservados, sin cambios de backend o datos.
- Verificación: typecheck correcto y build Vite correcto. Extracción AST de rutas/enlaces reales con TypeScript y matchRoutes de React Router: 19 enlaces del menú coinciden con rutas concretas, /configuracion no cae en wildcard y la ruta anterior codificada se reconoce. GET API settings de solo lectura: administrador 200, cuatro roles restantes 403 y anónimo 401; tokens solo en memoria, sin imprimir datos/credenciales.
- Docker: docker compose up -d --build --no-deps frontend exit 0; frontend recreado, backend activo y DB healthy. Página /configuracion y bundle actualizado HTTP 200; arranque Nginx comprobado con logs sanitizados. Sin reinicio de DB ni cambios de volúmenes.
- Seguridad: acceso frontend restringido en consonancia con menú/API; autorización backend comprobada. Sin nuevos hallazgos independientes ni cierres de pendientes anteriores. Diff y enlaces comprobados. Sin navegador automatizado o clic real de UI; no se ejecutaron pruebas destructivas ni se guardaron ajustes. Sin dependencias, commit/push o publicación Docker Hub. Siguiente paso: recargar navegador y abrir Configuración desde el menú.

## 2026-11-24 — Aranceles configurables por estudiante

- Agente: Codex. Estado: completado. Solicitud: apartado para administrator/administrative para precio de matrícula/mensualidad en configuración del estudiante. Cambios previos del árbol preservados; base 81274f5 con trabajo sin commit.
- Frontend: StudentFeesSection en Editar estudiante, formulario independiente con importes USD, Guardar aranceles y vacío para heredar ciclo. Colecturía utiliza override del estudiante; tipado/API actualizados. No se configura al registrar públicamente ni por estudiantes/colectores.
- Backend: PUT /students/:id/fees con UUID y DTO concreto, roles y respuesta mínima; columnas NUMERIC(10,2) nullable en Student, dominio y SQL. Resolver de precios centralizado para nuevas órdenes Wompi/manual, coincidencia exacta de centavos, resumen con montos históricos reales y saldos vigentes. Sin reprecificar pagos creados/completados/pendientes.
- Migración: database/migrations/20261124_student_fees.sql aditiva/idempotente. Probada dos veces en PostgreSQL efímero con estudiante sintético previo; preserva datos y valida CHECK/NULL/decimales. Aplicada en DB local con psql ON_ERROR_STOP y COMMIT correcto. init.sql e imagen DB actualizados para instalaciones nuevas; imagen local adicional arrancada y validada. No se recrea ni reinicializa la DB existente ni sus volúmenes.
- Verificación: typechecks backend/frontend y builds Nest/Vite correctos; 5 pruebas nuevas de precios/mocks y 7 regresiones de seguridad aprobadas. 33 comprobaciones API/PostgreSQL con fixtures y limpieza: roles, precisión, rechazo de montos inválidos, propiedad de lectura, aplicación, persistencia y reset sin alterar histórico. Sin pagos/correos reales. Instancias de DB aisladas retiradas sin borrar volúmenes.
- Seguridad: GET perfil antes no verificaba dueño; con los nuevos datos monetarios se limitó a propietario o personal, registrado y corregido como FINDING-2026-007/REM-2026-007, CLOSED tras pruebas con usuarios ficticios. Auditoría/evidencia security de aranceles detallan alcance; cierres anteriores conservados.
- Docker: docker compose up -d --build backend frontend exit 0; ambos recreados, backend/frontend activos, DB healthy, logs sanitizados con arranque confirmado. Página/bundle HTTP 200 y Swagger documenta nuevo endpoint. No se publican Docker Hub ni Git, no se rotan secretos.
- Documentación: arquitectura, DEC-016 y guía de despliegue con migración previa; límites y evidencia registrados. Sin navegador automatizado/sandbox Wompi, sin pruebas visuales ni refactor de migraciones generales. Vacío hereda ciclo; importes configurados deben ser >=0.01, no exenciones cero. El cambio afecta nuevos cobros de cualquier ciclo para ese estudiante. Próximo paso: recargar Estudiantes → Editar → Aranceles del estudiante y guardar precios; en otros despliegues aplicar migración antes del nuevo backend.

## 2026-11-24 — Creación de recursos de planificación para administrativos

- Agente: Codex. Estado: completado. Solicitud: administrativos pueden crear docentes, salones, grupos y horarios. Base 81274f5; cambios anteriores del árbol conservados.
- Cambios propios: POST teachers/classrooms permite administrator y administrative; DTOs concretos CreateTeacherDto/CreateClassroomDto delimitan campos, nombre, email, capacidad y longitudes. No aceptan IDs ni relaciones/cuentas internas. Grupos y horarios ya admitían ambos roles; contratos y formularios existentes conservados. Editar/desactivar docentes/salones sigue reservado a administrator.
- Seguridad: guards del servidor son el control efectivo; sin ampliación de administración de usuarios. Auditoría security/audits/2026-11-24-planning-creation-permissions.md; sin nuevos hallazgos independientes ni cambios en cierres anteriores. Arquitectura y DEC-017 actualizadas; no cambia esquema o dependencias.
- Verificación: docker run --rm con imagen builder upam-backend-fees-validation y src/test montados de solo lectura: npm run typecheck, node --test test/planning-permissions.test.cjs (cuatro subpruebas aprobadas) y npm run test:security (siete pruebas aprobadas). Controllers/guards HTTP reales; docentes/salones con servicios reales y repositorios en memoria; persistencia de grupos/horarios simulada para probar sus permisos. Entradas internas/invalidas y edición/bajas no autorizadas rechazadas.
- Docker: docker compose up -d --build backend exit 0, build Nest correcto y backend recreado. docker compose ps: backend/frontend activos, DB healthy; logs sanitizados confirman arranque sin errores ExceptionHandler. Verificación runtime con Node en backend: 25 comprobaciones (24 solicitudes de permisos más Swagger), cero escrituras; respuestas esperadas 400/404 para peticiones sintéticas permitidas, 403 otros roles, 401 anónimo. /planificacion y /api/docs-json por frontend HTTP 200.
- Límites: sin pruebas visuales de navegador ni altas reales; frontend sin cambios propios, por tanto no requiere reconstrucción en esta tarea. Sin cambios de datos, volúmenes, pagos/correos, publicación de imágenes, commit/push ni despliegue remoto. Diff revisado. Siguiente paso: recargar Planificación con la cuenta administrativa y usar los formularios de creación.

## 2026-11-24 — Eliminación de docentes inactivos

- Agente: Codex. Estado: completado. Solicitud explícita: borrar docentes inactivos. Trabajos previos del árbol conservados; sin cambios propios de aplicación.
- Inspección de FKs reales y conteos: un docente inactivo sin referencias desde grupos o calificaciones, uno activo.
- Ejecución: respaldo privado de la fila en .backups/ (0600/directorio 0700, ignorado por Git), transacción con bloqueos de teachers/subject_groups/grades y límites de espera. DELETE WHERE is_active=false eliminó una fila; COMMIT correcto. Conservados IDs activos y conteos de usuarios, grupos y calificaciones.
- Verificación: consulta independiente posterior mediante docker compose exec -T db psql confirma cero inactivos y un activo. Evidencia sanitizada y revisión de seguridad en security/audits/2026-11-24-inactive-teachers-cleanup.md; sin nuevos hallazgos o cambios de estado anteriores.
- Docker: reconstrucción/reinicio no aplica a esta operación de datos y documentación; servicios, volúmenes y esquema conservados. Sin pruebas de código por ausencia de cambios ejecutables. Arquitectura/decisiones sin cambios. Sin commit/push ni publicación. Siguiente paso: recargar la lista de docentes.

## 2026-11-24 — Cruces de planificación y gestión completa de ciclos

- Agente: Codex. Estado: completado. Solicitud: validar docente activo/libre y salón al crear grupos/horarios; creación/edición de ciclos con inscripción y aranceles base para administrator/administrative. Usuario aclaró no configurar disponibilidad semanal. Base 81274f5; todo trabajo local anterior conservado.
- Backend: PlanningRepository centraliza transacciones/bloqueo advisory para grupos, horarios y ciclos; valida actividad, capacidad, intervalos y cruces en ciclos con fechas coincidentes. Altas grupo/bloques atómicas, reasignaciones seguras, UUIDs y DTOs concretos, teacherId nullable para retirar docente. Endpoint anterior subjects/schedules usa el mismo control. Eliminación de horario verifica grupo y conserva inscripciones; grupos con historial no se borran.
- Ciclos: API y menú/ruta autorizan ambos roles para crear, editar, activar/desactivar y abrir/cerrar inscripciones. Nuevos activos/cerrados, abrir exige activo y desactivar cierra; reactivar/fechas modificadas valida cruces. Fechas/importes/cantidad de cuotas delimitados; base hereda por concepto si estudiante no tiene override, sin alterar pagos existentes. No se permite quitar cuotas con pagos pendientes/completados según comprobación de edición.
- Frontend: formulario completo de ciclos, tarjetas con acciones/estado, errores del servidor, modales de confirmación y control de envío. Planificación carga docentes/salones desde el inicio y ofrece recursos activos; retiro de docente envía null. Arquitectura, README y DEC-018 actualizados.
- Seguridad: FINDING-2026-008/REM-2026-008 CLOSED tras re-test; auditoría y evidencia security/audits/2026-11-24-planning-cycles.md y security/evidence/2026-11-24-planning-cycles.md. No se modifican cierres previos. Sin paquetes, lockfiles o DDL nuevos.
- Verificación: typechecks backend/frontend y builds Nest/Vite correctos. Primer typecheck detectó teacherId nullable y ciclo previo potencialmente ausente; corregidos, re-test y builds aprobados. Suites Node de permisos/aranceles (10 tests contando contenedor) y seguridad (7 contando contenedor) aprobadas. docker compose exec -T backend node < backend/test/docker-planning-cycles.cjs: 110 comprobaciones finales aprobadas con fixtures sintéticos, incluidas carreras concurrentes, rollback, segundos existentes, reasignación efectiva, historial, permisos y herencia/precios. Sin cobros/correos externos. Limpieza finally e inspección independiente: cero fixtures en ciclos/docentes/salones/materias.
- Docker: docker compose up -d --build backend frontend exitoso, con reconstrucciones adicionales de backend durante ajustes; última ejecución conjunta incorpora código final. docker compose ps: ambos activos y DB healthy, logs sanitizados confirman arranque Nest/Nginx sin ExceptionHandler. /ciclos, /planificacion, bundle y Swagger HTTP 200, contratos DTO verificados. Volúmenes y registros reales conservados.
- Límites: sin navegador automatizado ni ensayo de carga; no se corrigen cruces históricos y SQL externo no queda protegido por exclusión de DB. No se rediseña concurrencia de pagos/inscripciones. Sin publicación Docker Hub, commit/push ni despliegue remoto. Diff/enlaces revisados. Próximo paso: recargar Ciclos/Planificación con administrador o administrativo y usar los nuevos formularios/validaciones.

## 2026-11-24 — Commits y publicación Docker 2026.11.24.1

- Agente: Codex. Estado: completado. Solicitud explícita: crear commits de lo pendiente y publicar imágenes nuevas. Base inicial 81274f5 con 84 archivos de trabajos anteriores revisados/conservados. Commit funcional 358de64: gestión académica, ciclos/aranceles/permisos, modales/selectores, pruebas, migración y expedientes. No se incluyen secretos ni respaldos; sin Git push solicitado.
- Distribución: tag nuevo 2026.11.24.1 para las tres imágenes públicas ya autorizadas bajo josuerauda117; YAML/plantilla apuntan al nuevo tag, script exige tag explícito. Guía con migración previa para instalaciones existentes mediante Compose o consola DB de Portainer, backend detenido y volúmenes conservados. Arquitectura y DEC-019 actualizadas.
- Publicación: DOCKERHUB_NAMESPACE=josuerauda117 sh scripts/publish-images.sh 2026.11.24.1 exit 0; tres push correctos. Verificación anónima de manifiestos/digest/plataforma linux/amd64 en docs/deployment/images-2026.11.24.1.json, fuente de código 358de64. Tres manifiestos de 2026.11.24 intactos; no se publica latest. No se despliega remotamente.
- Verificación: git diff --check, sh -n, rechazo de tag ausente/inválido y Compose config --quiet correctos. Imágenes sin .env/secretos de build, DB sin datos demo e incluye migración; artefactos backend/frontend públicos coinciden con los locales mediante hash agregado. No hay cambios de dependencias o DDL propios de esta entrega.
- QA: Stack nuevo upam-release-qa-a631c960 con secretos independientes 0600 y puerto loopback libre, tres servicios healthy. Doce checks de arranque/bootstrap/login/catálogos vacíos/Swagger/plantilla/rol/columnas y 110 checks API/DB de planificación/ciclos/aranceles sobre las imágenes publicadas aprobados. Fixtures retirados, verificación independiente con solo administrador QA y cero registros académicos. Sin cobros/correos externos. QA detenido con down sin -v, volúmenes preservados y variables privadas temporales retiradas.
- Docker local: docker compose up -d --build backend frontend exit 0; código ya actualizado, servicios permanecen activos y DB healthy; web/Swagger 200, logs sanitizados de arranque correctos. No fue necesaria recreación adicional porque los artefactos no cambiaron. Sin tocar datos reales, DB o volúmenes.
- Seguridad: auditoría/evidencia security/audits/2026-11-24-release-2026.11.24.1.md y security/evidence/2026-11-24-release-2026.11.24.1.md. Sin hallazgos nuevos o cierres adicionales. Límites: sin navegador/editor Portainer, ARM/Swarm, HTTPS, restauración o auditoría nueva de advisories; alertas anteriores conservadas. Siguiente paso para otro entorno: aplicar migración de aranceles antes de actualizar a IMAGE_TAG=2026.11.24.1.

## 2026-11-24 — Diagnóstico preliminar de contraseña en pgAdmin local

- Agente: Codex. Estado: diagnóstico preliminar, pendiente de detalles del equipo del usuario. Base 886fcc8, árbol limpio antes de registrar esta consulta. Revisión de ambos Compose, variables de ejemplo y scripts de rol; distribución no publica DB, desarrollo usa localhost:5434. postgres corresponde a POSTGRES_PASSWORD y upam_app a DATABASE_PASSWORD; volúmenes existentes conservan contraseñas previas.
- No se puede verificar el despliegue de su computadora desde este servidor. Se solicitó distinguir login pgAdmin de conexión PostgreSQL e indicar host/puerto/usuario/error sin contraseñas. No se ejecutaron pruebas o cambios de credenciales/red/datos sobre ningún despliegue. Auditoría security/audits/2026-11-24-local-pgadmin-access.md, sin hallazgos nuevos.
- Docker: no aplica reconstrucción o reinicio por consulta y documentación. Arquitectura/decisiones sin cambios; sin commit/push o nueva publicación. Siguiente paso: confirmar conexión exacta para ajustar puerto/usuario o recuperar contraseña del rol conservando datos.

## 2026-11-24 — Mostrar todos los días del grupo en Mi Horario

- Agente: Codex. Estado: implementado y verificado localmente. Solicitud: materia con varios horarios solo aparece el primer día. Base 886fcc8 con diagnóstico pgAdmin sin commit conservado; usuario confirmó acceso tras corregir puerto de su computadora a 5435, resolución añadida a aquella auditoría sin registrar secretos.
- Cambios propios: EnrollmentRepository carga subjects.schedule.group.schedules en consultas detalladas; SchedulePage usa schedule-blocks.ts para expandir todos los bloques de su grupo, excluir canceladas, deduplicar/ordenar y mantener fallback del ancla. Totales de materias/créditos no cambian. Cuadrícula reemplaza render repetido por hora con un contenedor único y columnas/días, una tarjeta por bloque, rango dinámico para clases tempranas/nocturnas y detalle con todos los días. Sin modificar inscripciones, esquema o reglas de reserva.
- Verificación: typechecks backend/frontend correctos en builders Docker; builds Nest/Vite correctos. frontend/test/schedule-blocks.test.cjs: siete pruebas aprobadas, incluida página real con renderToStaticMarkup que comprueba tres tarjetas, todos los días, una materia/cuatro créditos y rango nocturno. backend/test/docker-enrollment-schedules.cjs: 29 comprobaciones API/DB aprobadas con fixtures de dos estudiantes/grupos, colección correcta, propiedad, sin relaciones sensibles, anónimo/listado restringidos y ninguna inscripción duplicada. Limpieza finally y consulta independiente en cero. npm run test:security: siete tests aprobados contando suite.
- Docker: docker compose up -d --build backend frontend exit 0, ambos recreados/activos y DB healthy; logs sanitizados confirman arranque Nest/Nginx sin ExceptionHandler. /horario y bundle actualizado HTTP 200. Volúmenes y datos reales conservados, sin cobros/correos externos o dependencias nuevas.
- Seguridad/documentación: auditoría security/audits/2026-11-24-enrollment-schedules.md, arquitectura y DEC-020. Hallazgo estático adyacente FINDING-2026-009 OPEN: choques de inscripción comparan bloques ancla en vez del grupo completo; queda separado de esta corrección de lectura, sin cierre ni REM ficticios. No se cambian cierres previos.
- Límites: sin navegador automatizado/layout visual, pruebas de reserva/concurrencia o exportaciones. SSR verifica marcado pero no sustituye prueba de navegador. Sin commit/push ni nueva publicación Docker Hub; el tag 2026.11.24.1 del equipo del usuario aún no incluye esta corrección. Diff/enlaces comprobados. Siguiente paso: probar Mi Horario con una materia de varios días; para su instalación por imágenes se requiere publicar/actualizar una entrega posterior.

## 2026-11-24 — Commits y publicación del horario completo 2026.11.24.2

- Agente: Codex. Estado: completado. Solicitud explícita: publicar imágenes y hacer commits. Base 886fcc8, once archivos previos revisados/preservados; commit funcional 386c467 con todos los bloques del grupo en Mi Horario, pruebas y documentación. Escaneo sin patrones de secretos y git diff --check correctos; respaldos/.env privados excluidos.
- Distribución: tag nuevo 2026.11.24.2 para los tres repositorios públicos ya autorizados de josuerauda117. YAML/plantilla y guía actualizados; sin migración nueva desde 2026.11.24.1 y conservación explícita de variables/volúmenes/mapeo local de pgAdmin 5435. Arquitectura y DEC-021 actualizadas; tag anterior preservado y sin latest nuevo.
- Publicación: DOCKERHUB_NAMESPACE=josuerauda117 sh scripts/publish-images.sh 2026.11.24.2 exit 0; tres push correctos. Manifiestos anónimos/digest/SHA-256/plataforma linux/amd64 en docs/deployment/images-2026.11.24.2.json, código fuente 386c467. Tres digest anteriores 2026.11.24.1 intactos.
- QA: Compose config --quiet y up -d --wait --wait-timeout 120 correctos en proyecto aislado upam-release-qa-b6ce2695, secretos independientes 0600 y puerto loopback libre. Tres servicios healthy; 12 checks de instalación/bootstrap/login/esquema/Swagger/plantilla y 29 API/DB del horario aprobados, sin proveedores externos. Fixtures retirados; consulta final con solo administrador QA y cero registros académicos. QA detenido con down sin -v, volúmenes preservados y variables privadas temporales retiradas.
- Empaquetado/local: tres imágenes sin .env o secretos de build, DB sin datos demo y migración previa presente. Consulta group.schedules compilada y hashes de artefactos públicos iguales a backend/frontend locales en ejecución. docker compose up -d --build backend frontend exit 0, caché vigente verificada y servicios ya actualizados activos; DB healthy, logs sanitizados sin ExceptionHandler y /horario/Swagger HTTP 200. No se necesitó recrear de nuevo porque los artefactos no cambiaron.
- Seguridad: auditoría/evidencia security/audits/2026-11-24-release-2026.11.24.2.md y security/evidence/2026-11-24-release-2026.11.24.2.md. FINDING-2026-009 permanece OPEN; publicación sin cambios de reglas de reserva, dependencias o DDL. No se alteran cierres previos ni se afirma auditoría nueva de advisories.
- Límites: sin navegador/editor Portainer, ARM/Swarm, HTTPS o restauración; sin Git push o despliegue remoto. Diff/enlaces revisados. Próximo paso: en la computadora del usuario cambiar IMAGE_TAG=2026.11.24.2 y actualizar el Stack descargando imágenes, conservando el puerto 5435 y los volúmenes.

## Plantilla por trabajo

```text
Fecha — Título
Agente/modelo y estado:
Solicitud y alcance:
Base y cambios previos relevantes:
Cambios propios y archivos:
Decisiones (DEC-NNN):
Seguridad revisada y hallazgos/remediaciones:
Verificación ejecutada, comando y resultado:
Limitaciones / pruebas no ejecutadas:
Pendientes y siguiente paso concreto:
```
