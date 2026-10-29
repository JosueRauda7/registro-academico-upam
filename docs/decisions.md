# Registro de decisiones

Mantener historial cronológico con identificadores estables. Registrar contexto, decisión, alternativas relevantes, consecuencias, evidencia y estado. No atribuir decisiones históricas a autores o fechas desconocidos. Una propuesta requiere aceptación antes de presentarse como acuerdo.

## DEC-001 — Documentación persistente para continuidad

- Fecha: 2026-10-28. Estado: ACEPTADA por solicitud del usuario.
- Contexto: permitir que otros modelos continúen el trabajo con contexto verificable.
- Decisión: mantener `AGENTS.md`, `docs/architecture.md`, `docs/decisions.md`, `docs/progress.md` y el expediente `security/` en el repositorio, en español.
- Consecuencias: cada trabajo de IA debe actualizar progreso; actualizar arquitectura y decisiones cuando corresponda. Los hallazgos requieren evidencia, y los cierres requieren re-test. Los documentos no sustituyen el código ni las instrucciones actuales del usuario.
- Alternativa: contexto solo en conversaciones; descartada porque no garantiza continuidad entre modelos.

## DEC-002 — Conservar arquitectura y cambios locales durante la revisión

- Fecha: 2026-10-28. Estado: APLICADA en esta tarea.
- Contexto: el árbol de trabajo ya contiene numerosos cambios funcionales, incluidos uploads y prerrequisitos.
- Decisión: documentar el estado observado y realizar revisión estática sin refactorizar ni corregir código de aplicación en esta tarea.
- Consecuencias: problemas de seguridad permanecen abiertos; no implica aceptación del riesgo. Los cambios previos no se atribuyen a esta IA.
- Evidencia: `git status --short`, módulos de `backend/src/` y `frontend/src/` inspeccionados.

## DEC-003 — Base arquitectónica observada

- Fecha de registro: 2026-10-28. Estado: OBSERVADA; fecha y motivación originales desconocidas.
- Decisión existente: SPA React + API REST modular NestJS + PostgreSQL/TypeORM, con adaptadores Wompi y Resend, desplegables mediante Compose/Nginx.
- Evidencia: manifiestos, `app.module.ts`, `database.module.ts`, `docker-compose.yml` y `frontend/nginx.conf`.
- Consecuencias: separación por capas con acoplamiento de aplicación a infraestructura; dos proyectos npm y esquema SQL que deben evolucionar coordinadamente.
- Alternativas originales: no documentadas; no se infieren.

## DEC-004 — Separar defectos observados de explotación verificada

- Fecha: 2026-10-28. Estado: APLICADA como convención de documentación.
- Decisión: registrar severidad y condiciones de cada defecto estático sin afirmar que se ejecutó una explotación; distinguir pruebas propuestas de ejecutadas.
- Consecuencias: todos los hallazgos iniciales quedan OPEN, con remediación propuesta y re-test pendiente. No se inventan resultados de auditoría de dependencias ni certificaciones de producción.

## DEC-005 — Actualizar contenedores locales tras cambios ejecutables

- Fecha: 2026-10-28. Estado: ACEPTADA por solicitud del usuario.
- Contexto: los trabajos de desarrollo deben quedar reflejados en la aplicación ejecutada con Docker.
- Decisión: reconstruir y recrear los servicios locales afectados al modificar código, dependencias o configuración, comprobar estado/logs y una respuesta o flujo relevante, y registrar resultados en progreso. Los cambios exclusivamente documentales no requieren actualización de contenedores.
- Consecuencias: la actualización local forma parte de la tarea; si Docker no está disponible se comunica el impedimento y el comando pendiente. Se preservan volúmenes y datos; no se aplican seeds ni se reinicializa la base. Producción y entornos remotos mantienen autorización específica.
- Alternativa: reiniciar siempre todos los contenedores; descartada porque un reinicio no reconstruye imágenes ni incorpora necesariamente la configuración y afecta servicios innecesariamente.
- Evidencia: sección «Actualización de contenedores Docker» de `AGENTS.md`.

## DEC-006 — Separar credenciales y recursos privados

- Fecha: 2026-10-28. Estado: APLICADA para resolver FINDING-2026-001/002/003/005.
- Decisión: registro público solo student; tokens con propósito explícito y claims de sesión obligatorios; recuperación con jti aleatorio y hash en DB; secretos User excluidos de consultas habituales y de respuestas; pagos con proyección explícita y autorización por propietario/rol financiero.
- Archivos: comprobantes privados bajo endpoint autenticado y logos en directorio público independiente; soporte de comprobantes antiguos sin publicarlos. El frontend descarga con Axios, sin credenciales en URLs.
- Consecuencias: sesiones anteriores requieren login y enlaces de recuperación previos deben solicitarse de nuevo; comprobantes no se abren mediante enlace público. Administradores/colectores pueden leer archivos financieros todavía no asociados; estudiantes solo asociados a sus pagos.
- Alternativas: confiar en UUIDs impredecibles o protección frontend; descartadas por no proporcionar autorización en servidor.

## DEC-007 — Webhook cerrado por defecto y secretos Docker externos

- Fecha: 2026-10-28. Estado: APLICADA para resolver FINDING-2026-004/006.
- Decisión: adoptar checksum de eventos Wompi.co para el endpoint configurado, consultar transacción remota y exigir ID vinculado previamente por el servidor, referencia, importe y moneda USD. Serializar transiciones con bloqueo de fila; ignorar replay/regresiones. Sin WOMPI_EVENTS_SECRET rechazar con 503, sin fallback permisivo.
- Infraestructura: secretos independientes externos, rol upam_app limitado, puertos ligados a loopback y NODE_ENV production. Rotación local realizada sin borrar volúmenes; helpers para nuevas instalaciones y migración de credenciales/logo anteriores.
- Consecuencias: no certificar un pago real, ni cuenta/región/moneda hasta validar el sandbox del proveedor. Pagos anteriores sin ID local deben conciliarse. Producción requiere configuración y hardening propios; la rotación invalida sesiones previas.
- Referencia de contrato: https://docs.wompi.co/en/docs/colombia/eventos/ (consultada el 2026-10-28).
- Alternativas: aceptar notificaciones sin firma o configurar secretos conocidos como fallback; descartadas por permitir suplantación.

## Plantilla para futuras decisiones

```text
DEC-NNN — Título
Fecha:
Estado: PROPUESTA / ACEPTADA / APLICADA / OBSERVADA / REEMPLAZADA
Contexto y objetivo:
Decisión:
Alternativas consideradas:
Consecuencias y riesgos:
Evidencia o archivos:
Reemplaza / reemplazada por:
```
