# Instrucciones para agentes de IA

## Al comenzar

1. Leer este archivo, `docs/architecture.md`, `docs/decisions.md`, `docs/progress.md` y `security/SECURITY.md` antes de modificar el proyecto.
2. Leer la auditoría más reciente en `security/audits/` y los hallazgos/remediaciones relacionados con la tarea. Revisar instrucciones adicionales si aparecen en subdirectorios.
3. Revisar `git status --short` y el código afectado. Conservar cambios locales y no atribuirse trabajo previo. La documentación describe una fotografía y debe contrastarse con el código.
4. Respetar la solicitud actual del usuario y los permisos del entorno. No solicitar confirmaciones rutinarias cuando el trabajo ya esté autorizado.

## Desarrollo

- Mantener módulos por funcionalidad y responsabilidades claras; consultar arquitectura para rutas y convenciones. Evitar refactorizaciones ajenas al objetivo.
- Validar entradas con DTOs concretos; los tipos inline de TypeScript no son validación runtime. Aplicar autorización por rol y por propietario en backend.
- No devolver entidades completas con relaciones sensibles: usar respuestas explícitas sin hashes, tokens o secretos.
- Cambios de datos deben considerar entidades, SQL, migraciones, integridad y datos existentes. No usar synchronize, seeds ni reinicialización de volúmenes en producción o sobre datos valiosos.
- No copiar `.env`, claves, JWT, contraseñas ni datos personales a logs, documentación o evidencia. No ejecutar pagos, enviar correos o probar contra producción sin alcance explícito.
- No instalar paquetes ni cambiar lockfiles sin necesidad. Revisar manifiestos y scripts antes de ejecutar comandos; lint del backend modifica archivos con `--fix`.
- Ejecutar verificación proporcional: typecheck/build para cambios de código y pruebas de reglas/permisos cuando corresponda. Para documentación, comprobar enlaces y coherencia. Informar fallos y pruebas omitidas; no inventar resultados.

## Actualización de contenedores Docker

- Al completar una tarea que modifique código, dependencias, Dockerfiles, configuración de servicios o recursos incluidos en las imágenes, reconstruir y recrear los servicios locales afectados con Docker Compose para que ejecuten los cambios. Esta actualización local forma parte del trabajo autorizado de desarrollo.
- Desde la raíz, usar `docker compose up -d --build backend` para backend, `docker compose up -d --build frontend` para frontend, o `docker compose up -d --build backend frontend` si cambian ambos. Revisar las dependencias y la configuración aplicable antes de ejecutar; un simple restart no incorpora código copiado en una imagen ni cambios de variables de entorno.
- Comprobar `docker compose ps`, los logs recientes de los servicios afectados y una respuesta HTTP o flujo relacionado con el cambio. Registrar comandos, resultados y problemas pendientes en `docs/progress.md`; no declarar actualizados los contenedores si la construcción o el arranque fallan.
- Si Docker no está disponible o el entorno impide la actualización, registrar el impedimento y el comando pendiente e informar al usuario. Respetar los permisos de ejecución del entorno.
- Los cambios exclusivamente documentales y las consultas sin cambios ejecutables no requieren reconstrucción ni reinicio; indicar que no aplica en la bitácora.
- Conservar los volúmenes y los datos existentes. No usar `docker compose down -v`, eliminar volúmenes, reinicializar la base ni ejecutar seeds para actualizar contenedores. Cambios de esquema requieren un procedimiento de migración verificado; reconstruir no aplica modificaciones de `database/init.sql` sobre un volumen existente.
- Esta regla aplica al entorno local del proyecto. Despliegues remotos o de producción requieren autorización dentro del alcance de la tarea.

## Seguridad en cada trabajo

Evaluar la superficie afectada según `security/SECURITY.md`. Registrar defectos nuevos en `security/findings/`, evidencia sanitizada en `security/evidence/` y alcance/resultados en `security/audits/`. No duplicar hallazgos existentes ni cerrar por intuición. Si la tarea autoriza corregir, implementar dentro de ese alcance y documentar `REM-YYYY-NNN` en `security/remediation/` con re-test. Una auditoría documental por sí sola no autoriza una refactorización de la aplicación.

## Antes de terminar cada trabajo

1. Añadir una entrada a `docs/progress.md` con cambios propios, archivos, comprobaciones y resultados, revisión de seguridad, límites y siguiente paso. Si no hubo cambios por un bloqueo, dejar registro cuando sea posible.
2. Actualizar `docs/architecture.md` si cambian tecnologías, contratos, estructura, datos o despliegue.
3. Añadir decisiones relevantes a `docs/decisions.md`, distinguiendo propuestas de acuerdos; no inventar motivaciones históricas.
4. Actualizar los expedientes de seguridad relacionados; conservar historial y evidencia. Un hallazgo solo pasa a CLOSED tras verificación documentada.
5. Revisar diff y resumir resultado, verificación y pendientes al usuario. No hacer commit, push ni desplegar salvo que la tarea lo autorice.
