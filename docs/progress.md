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
