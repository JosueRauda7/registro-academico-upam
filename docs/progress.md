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
