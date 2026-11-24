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

## DEC-008 — Puertos locales compatibles con otros proyectos

- Fecha: 2026-10-29. Estado: APLICADA por autorización del usuario para levantar Compose y resolver conflictos de puertos.
- Contexto: 80, 3000 y 5433 ocupados por otros proyectos en el host; no había contenedores ni volúmenes previos UPAM en el Docker consultado.
- Decisión: publicar frontend en 127.0.0.1:8082, backend en 127.0.0.1:3002 y PostgreSQL en 127.0.0.1:5434. Conservar puertos internos y volúmenes; ajustar FRONTEND_URL a http://localhost:8082.
- Consecuencias: accesos locales y enlaces generados usan la nueva URL; no cambian los servicios de otros proyectos. `.env` local generado con secretos independientes mediante el helper existente, sin versionar valores.
- Alternativa: detener servicios ajenos; descartada por estar fuera del alcance.

## DEC-009 — Acceso remoto a la web de desarrollo

- Fecha: 2026-10-29. Estado: APLICADA por solicitud del usuario que accede al servidor mediante red.
- Decisión: ampliar la publicación del frontend a 0.0.0.0:8082; API directa y DB conservan loopback. FRONTEND_URL configurable, por defecto http://192.168.0.151:8082. Reemplaza únicamente la restricción loopback de la web y URL de DEC-008.
- Consecuencias: acceso por LAN o Tailscale al servidor, con API a través de Nginx. HTTP de desarrollo; no acredita preparación para producción. No se alteran firewall ni routers.

## DEC-010 — Cabeceras de transporte acordes a la URL configurada

- Fecha: 2026-10-29. Estado: APLICADA al corregir la visualización de Swagger solicitada.
- Evidencia: el HTML y bundle Swagger respondían 200 en HTTP, pero CSP incluía upgrade-insecure-requests y el servidor no ofrece TLS en ese puerto.
- Decisión: activar upgrade-insecure-requests y HSTS solo cuando FRONTEND_URL usa https://; conservar las demás protecciones de Helmet. HTTP de desarrollo no debe ordenar al navegador cambiar el protocolo de sus recursos.
- Consecuencias: la configuración de un despliegue TLS debe declarar FRONTEND_URL con HTTPS. No se deshabilita CSP ni se amplían sus orígenes de scripts.

## DEC-011 — Migración histórica mediante XLSX simple y lote atómico

- Fecha: 2026-10-29. Estado: APLICADA por solicitud del usuario para migrar notas anteriores a la adopción del sistema.
- Decisión: ExcelJS existente, plantilla sin PII con carnet/código de materia y catálogo; permitir varios estudiantes por lote. Conservar ingreso individual y usar el mismo historial, incluidas notas reprobadas.
- Integridad: validar todas las filas y reglas de negocio antes de insertar en una transacción; rechazar duplicados sin sobrescribir. Reutilizar columnas y unicidad SQL existentes; sin migración de esquema.
- Seguridad: permisos administrator/administrative también en backend, preanálisis ZIP con tamaños reales acotados antes de ExcelJS, valores simples, sin fórmulas/macros/enlaces/objetos y errores sin valores del archivo. Archivo solo en memoria. Límites de 2 MiB, 500 filas, 8 MiB expandidos y una importación por proceso.
- Alternativas: guardar las filas válidas omitiendo las inválidas o actualizar notas existentes automáticamente; descartadas para evitar migraciones parciales o reemplazos accidentales. La plantilla simple reduce compatibilidad con libros complejos a cambio de limitar contenido activo y consumo de recursos.
- Límites: no certifica ausencia de malware ni sustituye auditoría de dependencias; no permite libros XLS/XLSM, hojas adicionales, celdas combinadas ni contenido enriquecido. Una instancia adicional tiene su propio límite de concurrencia, con unicidad protegida en PostgreSQL.

## DEC-012 — Distribución autónoma mediante tres imágenes y Stack portable

- Fecha: 2026-11-24. Estado: APLICADA por solicitud de publicar Docker Hub y preparar YAML Compose/Portainer. Namespace público josuerauda117 confirmado explícitamente por el usuario tras revisión automática.
- Decisión: imágenes versionadas backend/frontend/database, YAML independiente sin rutas del repositorio, solo web publicada, variables externas, healthchecks y volúmenes por proyecto. Alcance Docker Standalone/Compose v2 Linux amd64; no Swarm/ARM64.
- Inicialización: imagen DB con DDL y configuración institucional, sin datos/usuarios de prueba; administrador inicial opcional con credenciales propias y solo si users está vacía. La inicialización de un volumen nuevo no es un procedimiento de migración.
- Alternativa: montar archivos SQL del repositorio en Portainer; descartada porque obliga a preparar rutas en el host y limita el editor Web. Publicar cuentas demo como instalación por defecto se evitó mediante separación del DDL y bootstrap.
- Consecuencias: un Stack nuevo empieza sin información académica/financiera; los datos anteriores se trasladan con backup/restauración verificables por separado. No se modifican credenciales ni volúmenes del servicio existente.

## DEC-013 — Diálogos compartidos para confirmaciones de interfaz

- Fecha: 2026-11-24. Estado: APLICADA por solicitud de sustituir alerts/confirmaciones del navegador por modales de la aplicación.
- Decisión: proveedor React con confirm/alert asíncronos, cola de solicitudes y cancelación al navegar. Todas las acciones existentes esperan confirmación explícita; cerrar/Cancelar no ejecuta la operación. Reutilizar Modal con dialog nativo para foco modal y Escape, sin paquetes nuevos ni sustitución global de funciones window.
- Consecuencias: mensajes como texto React, foco inicial en Cancelar y cancelación de solicitudes al salir de la pantalla. Las once confirmaciones existentes migradas; no había llamadas nativas alert/prompt. APIs y permisos efectivos permanecen en backend. Compatibilidad de navegadores antiguos sin dialog no certificada.

## DEC-014 — Búsqueda por etiquetas y listas de prerrequisitos

- Fecha: 2026-11-24. Estado: APLICADA por solicitud del usuario.
- Decisión: selector compartido que busca por label y mantiene IDs como valores, selección múltiple para prerrequisitos con etiquetas removibles. Reutilizar opciones y eventos del select y no añadir dependencias. La búsqueda no cambia el valor hasta elegir una opción.
- Datos/API: lista prerequisiteSubjectIds, carga/visualización completa y comprobación de todos los requisitos en inscripción. DTOs concretos y guardado atómico de materia/lista; grafo serializado en PostgreSQL para impedir ciclos concurrentes. Reutilizar tabla existente; no migrar ni borrar datos anteriores.
- Compatibilidad: mantener prerequisiteSubjectId escalar como alternativa depreciada, rechazar ambas representaciones en una solicitud. Campo omitido conserva y lista vacía limpia. Prerrequisitos existentes inactivos pueden mantenerse o quitarse; solo nuevos deben estar activos y todos deben corresponder a la carrera.
- Consecuencias: clientes antiguos con campo escalar conservan su semántica de reemplazo por un prerrequisito; la pantalla actual usa siempre la lista completa. Las confirmaciones y cambios SSH locales previos se conservan.

## DEC-015 — Ruta canónica de Configuración sin tilde

- Fecha: 2026-11-24. Estado: APLICADA para corregir el retorno al dashboard desde el menú del administrador.
- Decisión: usar /configuracion como ruta canónica coincidente con Sidebar, protegerla explícitamente para administrator y conservar /configuración como redirección replace por compatibilidad. No ampliar permisos ni cambiar contratos de API.
- Evidencia: el menú enviaba /configuracion mientras App solo registraba /configuración, por lo que se ejecutaba el wildcard al dashboard. Verificación de los 19 enlaces del menú con React Router y acceso de lectura API por rol.

## DEC-016 — Aranceles propios con herencia del ciclo e historial inmutable

- Fecha: 2026-11-24. Estado: APLICADA por solicitud de configurar matrícula y mensualidad por estudiante para administrador/administrativo.
- Decisión: dos overrides nullable en students, importes positivos USD de dos decimales; NULL usa el importe del ciclo. Formulario y endpoint propios con roles/DTOs, separados del perfil general. No reprecificar pagos creados, incluidos los pendientes del proveedor; nuevos cobros y saldos de conceptos no pagados usan el precio vigente.
- Integridad: cálculo del servidor para Wompi/manual, comparación exacta de centavos y resumen con montos pagados reales. No se añaden cuotas por ciclo ni exenciones cero en esta función; un cambio del estudiante afecta nuevos cobros en cualquier ciclo.
- Datos/despliegue: migración SQL aditiva verificada en instancia efímera antes de aplicarla localmente; defaults NULL conservan cobro anterior. DDL inicial e imagen distribuible actualizados sin publicar tags nuevos. Rollback de código puede mantener las columnas, sin eliminarlas ni perder aranceles.

## DEC-017 — Creación de recursos de planificación por administrativos

- Fecha: 2026-11-24. Estado: APLICADA por solicitud explícita del usuario para docentes, salones, grupos y horarios.
- Decisión: ampliar solo las altas de docentes y salones a administrative, conservando administrator. Grupos y horarios ya permiten ambos roles y mantienen su contrato. Editar/desactivar docentes y salones conserva su política anterior.
- Seguridad: DTOs de creación delimitan datos de la ficha y capacidad, sin permitir vinculación de cuentas ni IDs/relaciones internas. No se amplía la creación de usuarios o roles privilegiados. Pruebas HTTP con guards reales para los cinco roles y solicitudes anónimas; persistencia de pruebas aislada del sistema.

## DEC-018 — Disponibilidad por ocupación y escrituras de planificación atómicas

- Fecha: 2026-11-24. Estado: APLICADA. Solicitud de validar docente/salón al planificar y completar gestión de ciclos para administrator/administrative. El usuario aclaró: docente activo y sin cruces; no configurar disponibilidad semanal.
- Decisión: centralizar grupos, horarios (incluido endpoint anterior en subjects) y cambios de calendario/estado del ciclo bajo un bloqueo advisory transaccional común. Verificar recursos activos, intervalos válidos, conflictos entre ciclos con fechas coincidentes y capacidad; guardar grupo y horarios como unidad. Adjuntar clases con límites horarios coincidentes está permitido. Cambios de docente/salón y reactivación/fechas del ciclo no pueden introducir cruces.
- Ciclos: ambos roles crean, editan, activan/desactivan y abren/cierran inscripciones. Nuevo ciclo activo/cerrado; desactivar cierra inscripción. Mantener ciclos e historial existentes y aranceles propios prioritarios por concepto; importes base se usan en ausencia de overrides, sin reprecificar pagos ya creados. Edición acotada por DTO y estado de inscripción mediante endpoints específicos.
- Consecuencias: serialización global de escrituras de planificación simplifica concurrencia al volumen actual; no bloquea lecturas de catálogo. SQL externo puede evadir la política; no se introduce una restricción de exclusión ni cambios de esquema. Conflictos históricos no se corrigen automáticamente. No se eliminan ciclos con historial ni se modifican datos académicos reales para probar.

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
