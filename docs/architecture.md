# Arquitectura de Registro Académico UPAM

Última revisión: 2026-10-28. Base: código del árbol de trabajo sobre `f9be37d`, incluidos cambios locales existentes. Este documento describe lo observado; no certifica seguridad ni funcionamiento integral.

## Propósito y flujo

Aplicación académica para gestionar estudiantes, carreras, pensum, ciclos, materias, prerrequisitos, grupos, docentes, aulas, horarios, inscripciones, notas, equivalencias históricas, pagos y reportes. El flujo previsto es autenticarse, pagar matrícula, reservar materias validando prerrequisitos/cupo/horario, confirmar inscripción y pagar mensualidades. La integración externa y el flujo completo no se probaron en esta revisión.

## Vista general

```text
Navegador: React SPA
    → /api: Axios + Bearer JWT
    → Nginx (Docker) o proxy Vite (desarrollo)
    → NestJS: controllers → services → repositories → PostgreSQL
                              → Wompi (pagos)
                              → Resend (correo)
                              → uploads/ (imágenes WebP)
```

API bajo `/api`; Swagger en `/api/docs`, actualmente habilitado sin condición por ambiente. Solo `/uploads/logos/` es público; comprobantes se descargan con Bearer JWT en `/api/uploads/receipts/:filename` y autorización por propietario o rol financiero.

Helmet conserva sus cabeceras y CSP por defecto, salvo las políticas que requieren HTTPS: `upgrade-insecure-requests` y HSTS se activan cuando `FRONTEND_URL` comienza por `https://`. En desarrollo HTTP se omiten para que el navegador pueda cargar los recursos de Swagger por el mismo protocolo. Configurar la URL HTTPS real al desplegar con TLS.

## Tecnologías y paquetes

Los números siguientes son rangos declarados en los manifiestos; los `package-lock.json` determinan las versiones resueltas. Un paquete declarado no demuestra su uso en todas las pantallas.

| Área | Tecnologías / rangos principales | Responsabilidad |
| --- | --- | --- |
| Backend | NestJS ^10.3, TypeScript ^5.3.3, Node 20 Alpine en Docker | API modular y compilación |
| Persistencia | TypeORM ^0.3.19, @nestjs/typeorm ^10, pg ^8.11.3; PostgreSQL 16 Alpine | Entidades, repositorios y base relacional |
| Identidad | @nestjs/jwt ^10.2, bcryptjs ^2.4.3; Passport y passport-jwt declarados | JWT y hash de contraseñas; guard JWT propio |
| Contratos HTTP | class-validator ^0.14.1, class-transformer ^0.5.1, Swagger ^7.4.2 | DTOs, transformación y documentación |
| Servicios | resend ^6.24, sharp ^0.35.4, uuid ^9 | Correo, conversión de imágenes e identificadores |
| Reportes / protección | ExcelJS ^4.4, PDFKit ^0.15, Helmet ^7.1 | Exportaciones y cabeceras HTTP |
| Frontend | React ^18.2, React Router ^6.21.1, Axios ^1.6.5 | SPA, rutas y cliente HTTP |
| Presentación | Tailwind ^3.4.1, Lucide ^0.303, react-hot-toast ^2.4.1, clsx, tailwind-merge | Estilos, iconos y notificaciones |
| Otros declarados | @tanstack/react-query ^5.17, date-fns ^3.2, nestjs-typeorm-paginate | Confirmar uso en cada cambio; no asumir adopción global |
| Infraestructura | Docker Compose, Dockerfiles multietapa, Nginx Alpine, Vite ^5.0.11 | Empaquetado, proxy y desarrollo |

## Organización del backend

- `backend/src/domain/`: interfaces de entidades, contratos de email/pagos y enums, incluidos los roles.
- `backend/src/application/`: módulos funcionales con controllers, services y algunos DTOs: auth, careers, classrooms, cycles, enrollments, grades, legacy-subjects, payments, pensum, reports, settings, students, subject-groups, subjects, teachers, uploads y users.
- `backend/src/infrastructure/`: entidades y repositorios TypeORM, conexión a base de datos, seed, adaptador Wompi y servicio Resend.
- `backend/src/common/`: guards JWT/roles, decoradores, filtro de excepciones e interceptor de respuestas.
- `main.ts`: configuración de parsers (10 MB), Helmet, CORS, prefijos, archivos estáticos, ValidationPipe y Swagger. `app.module.ts` ensambla módulos.

Es una arquitectura modular por capas inspirada en Clean Architecture. No aplica inversión de dependencias estricta: servicios de aplicación importan repositorios y servicios concretos de infraestructura. Los contratos del dominio no eliminan ese acoplamiento. No describirla como implementación completa de arquitectura hexagonal o DDD.

## Organización del frontend

`src/pages/` agrupa pantallas por funcionalidad; `src/api/` concentra llamadas HTTP; `src/components/ui/` aporta componentes reutilizables y `components/layout/` la estructura visual. `types/` y `utils/` concentran tipos y utilidades. `App.tsx` configura React Router, AuthProvider, SettingsProvider y rutas protegidas.

La ruta canónica de Configuración es `/configuracion`, restringida a administrator en ProtectedRoute, en coherencia con el menú y la API. `/configuración` se conserva como redirección con replace para enlaces anteriores.

`AuthContext` persiste token y perfiles en localStorage; `api/axios.ts` agrega Authorization y limpia sesión/redirige ante 401. `ProtectedRoute` y la navegación por rol mejoran la experiencia, pero la autorización efectiva debe residir en backend. localStorage requiere especial atención ante XSS; no se verificó una vulnerabilidad XSS concreta.

El registro público solo admite student, incluso al invocar el servicio directamente. Los JWT de sesión incluyen purpose access y claims obligatorios; los de recuperación tienen purpose password-reset y jti aleatorio, y solo se guarda su hash SHA-256. Los tokens anteriores sin purpose access requieren iniciar sesión otra vez; los enlaces de recuperación anteriores a esta corrección deben solicitarse de nuevo. Los atributos sensibles de User se excluyen por defecto de las consultas; el interceptor sanitiza respuestas anidadas y pagos usa una proyección explícita.

## Permisos de creación en planificación (2026-11-24)

Administrator y administrative pueden crear docentes y salones mediante POST /api/teachers y POST /api/classrooms, además de crear grupos y agregar horarios mediante POST /api/subject-groups y POST /api/subject-groups/:id/schedules (estos dos ya admitían ambos roles). El menú Planificación y sus formularios existentes permiten estas acciones a administrativos. Editar/desactivar docentes y salones conserva el permiso exclusivo de administrator; no se amplía la administración de usuarios.

Las nuevas altas de docentes y salones usan DTOs concretos con whitelist: nombre obligatorio sin espacios vacíos, longitudes acotadas, correo opcional válido (vacío permitido por el formulario) y capacidad entera positiva. No aceptan IDs, userId, relaciones, roles ni estados internos. Crear un docente registra su ficha; no crea ni vincula una cuenta de acceso. No hay cambios de esquema.

## Cruces de planificación y gestión de ciclos (2026-11-24)

PlanningRepository centraliza escrituras de grupos/horarios y ciclos en transacciones con pg_advisory_xact_lock(471250850). Crear grupo y sus bloques es atómico; agregar horarios o cambiar docente/salón revalida todos los bloques existentes. Solo se asignan materias, docentes y salones activos en ciclos activos; el docente puede quedar sin asignar (teacherId null). Capacidad positiva dentro del salón y no inferior al contador de inscritos. DTOs concretos delimitan campos/UUIDs, días monday–saturday y horas HH:mm con fin posterior al inicio; los bloques del mismo grupo no se superponen.

La disponibilidad del docente significa activo y sin otra clase, según aclaración del usuario; no se incorpora una agenda de disponibilidad semanal. Un cruce requiere mismo día e intervalos horarios superpuestos, en grupos y ciclos activos con fechas coincidentes (límites de fechas inclusivos). Aplica dentro del ciclo y entre ciclos simultáneos, incluso si las materias son distintas o iguales. Un bloque puede comenzar cuando termina otro. El control contempla segundos de horarios existentes; nuevas entradas usan minutos. Se validan recursos antes del guardado bajo bloqueo, para impedir carreras entre solicitudes de la API. POST /subjects/schedules usa la misma ruta transaccional. El control no es una restricción SQL para escrituras externas.

Cambiar fechas reales o reactivar un ciclo valida sus grupos activos y revierte toda la operación si hay cruces o recursos inactivos. Cambios solo de nombre/precio con calendario/estado sin cambios no fuerzan corregir conflictos históricos. Borrar horarios verifica pertenencia al grupo; borrar grupo/horario conserva cualquier inscripción asociada, incluso cancelada, mediante comprobación bajo bloqueos de filas.

Gestión de ciclos está disponible para administrator y administrative en menú/ruta /ciclos y POST /cycles, PUT /cycles/:id, PUT /cycles/:id/open-enrollment y close-enrollment. CyclesPage ofrece formulario de creación/edición, fechas, año/período, matrícula/mensualidad base, cantidad de mensualidades y estado activo. Nuevo ciclo inicia activo con inscripción cerrada; abrir requiere activo, desactivar cierra inscripción y reactivar no la abre automáticamente. DTOs validan fechas YYYY-MM-DD reales, fin posterior al inicio, importes USD positivos de hasta dos decimales, mensualidades 1–12, año 1900–2200 y período 1–3. No se admite enrollmentOpen en el formulario genérico: se usa la acción dedicada.

Los importes base se resuelven por concepto con resolveStudentFees: NULL o ausencia de importe propio usa ciclo; un override conserva prioridad. Editar precios no modifica pagos existentes. No se permite reducir la cantidad de mensualidades por debajo de un mes con pagos pendientes/completados al verificar la edición. Esta comprobación no rediseña la concurrencia del subsistema de pagos. No hay DDL ni migraciones nuevas en este trabajo; se conserva la migración de aranceles por estudiante previa.

Planificación carga docentes y salones al entrar, sin depender de visitar otras pestañas; sus selectores muestran activos y conservan la etiqueta de una referencia inactiva seleccionada para permitir reemplazarla. El servidor sigue siendo la autoridad aunque el catálogo cambie tras cargar la página.

## Diálogos de interfaz (2026-11-24)

`DialogProvider`, dentro de BrowserRouter, ofrece `useDialog().confirm(message, options)` y `alert(message, options)`. Son asíncronos: las páginas esperan la elección antes de llamar a la API. Un controlador mantiene solicitudes separadas en cola y cancela todas al navegar/desmontar el proveedor. Las 11 confirmaciones nativas de usuarios, estudiantes, carreras, materias, pensum, planificación y materias previas usan este servicio; notificaciones de resultado existentes conservan react-hot-toast.

`Modal` reutiliza el elemento HTML dialog con showModal/close, título accesible, foco inicial opcional, cierre Escape/X/fondo y estilos existentes. Las confirmaciones enfocan Cancelar y usan variante de peligro para acciones destructivas. El texto se renderiza como string React, sin HTML interpretado. Esto requiere soporte de dialog/showModal en el navegador. No cambia contratos HTTP ni autorización backend.

## Datos

El esquema inicial está en `database/init.sql`; existen 16 entidades registradas en `DatabaseModule`.

| Grupo | Tablas |
| --- | --- |
| Identidad | users, students, teachers |
| Catálogo y planificación | careers, subjects, prerequisites, cycles, classrooms, subject_groups, schedules |
| Trayectoria académica | enrollments, enrollment_subjects, grades, legacy_completed_subjects |
| Finanzas y configuración | payments, system_settings |

Los estudiantes se vinculan a usuarios; los grupos reúnen materia, ciclo, docente y aula, con horarios asociados. Las inscripciones agrupan materias reservadas/confirmadas/canceladas. Pagos se relacionan con estudiante y ciclo; incorporan referencias Wompi y datos de cobros manuales/comprobantes. Revisar las entidades y SQL al alterar relaciones, restricciones o enums.

La aplicación usa `synchronize: false`, pero el seed usa `synchronize: true` y registra solo parte de las entidades: no ejecutarlo sobre datos valiosos. Compose monta `init.sql` para inicialización de un volumen nuevo; editarlo no actualiza automáticamente un volumen existente. Los scripts de migración apuntan a `src/config/data-source.ts`, archivo no encontrado en esta revisión: el flujo de migraciones requiere completarse y verificarse.

## Integraciones y almacenamiento

- Wompi usa fetch y el protocolo Wompi.co del endpoint configurado. El webhook verifica checksum SHA-256 con WOMPI_EVENTS_SECRET, exige ID firmado y consulta la transacción remota: coteja ID previamente vinculado al crear el pago, referencia, monto y moneda USD. El ID local vincula el pago con la cuenta que lo creó; no se acepta un ID distinto. Un bloqueo de fila PostgreSQL evita aplicar dos veces una transición o degradar un pago completado por un evento anterior. Sin secreto de eventos responde 503; firma inválida, 401. No se verificó un pago real ni compatibilidad de moneda/región con una cuenta comercial. Pagos antiguos sin ID vinculado requieren conciliación con el proveedor; no se vinculan automáticamente desde un webhook.
- Resend envía recuperación y confirmaciones. Sin clave, omite el envío y registra una advertencia; no asumir entrega por una respuesta exitosa del endpoint.
- Uploads acepta hasta 5 MB, genera UUID y recodifica a WebP. POST /api/uploads guarda comprobantes en uploads/receipts; POST /api/uploads/logos (solo administrator) guarda logos públicos en uploads/logos. Comprobantes asociados: propietario student o administrator/collector; archivos aún no asociados: solo estos roles financieros. La descarga usa Cache-Control private, no-store. Los comprobantes antiguos en la raíz siguen privados y se resuelven por su referencia en pagos. El frontend descarga mediante Axios autenticado, sin tokens en URLs. El script scripts/migrate-local-logo.cjs copia únicamente el logo configurado anterior, comprobando que no sea un comprobante; el original se conserva.
- ExcelJS/PDFKit generan reportes; al modificarlos revisar autorización y datos exportados, además de presentación.

## Migración Excel de notas previas

`LegacySubjectsModule` ofrece `GET /api/legacy-subjects/template` y `POST /api/legacy-subjects/import` (multipart, campo `file`), exclusivamente para administrator/administrative. La pantalla Materias previas mantiene el registro individual y añade descarga autenticada de plantilla y carga de lotes de varios estudiantes, sin seleccionar uno previamente.

La plantilla XLSX contiene `Notas previas` (carnet, codigo_materia, nota, anio, semestre, observaciones), `Instrucciones` y `Materias` (catálogo activo, hasta 2000 materias, sin datos de estudiantes). Carnet/código deben ser texto; la nota es 0–10 con hasta dos decimales. Año opcional 1900–año actual, semestre opcional 1/2 y observaciones opcionales de hasta 500 caracteres. Se admiten notas reprobadas para reconstruir historial y CUM.

Límites: 2 MiB comprimidos, 8 MiB descomprimidos, 100 entradas ZIP, hasta 500 filas de notas y una importación simultánea por proceso. El preanálisis ZIP limita nombres/partes, compresión, tamaños y coordenadas antes de cargar ExcelJS; rechaza ZIP64, cifrado, extras/comentarios de archivo, DTD/entidades, macros/objetos, fórmulas, enlaces, hojas adicionales y celdas combinadas. El lector solo admite valores simples, sin fechas, rich text ni resultados de fórmulas. El contenido se procesa en memoria y se descarta, sin guardarlo ni extraer archivos a disco. No es un antivirus ni admite todos los formatos posibles de Excel: se debe usar la plantilla simple.

Se valida cada fila mediante DTO concreto, existencia de estudiante, materia activa de su carrera y duplicados. Se devuelven hasta 50 mensajes por número de fila, sin repetir contenido personal del archivo. Si hay errores de validación no se escribe nada; todo el lote válido se inserta en una transacción, sin sobrescribir notas y registrando el actor en `registered_by`. La restricción UNIQUE(student_id, subject_id) ya presente en SQL impide duplicados concurrentes; no hay cambios de esquema ni migraciones nuevas. La importación alimenta los mismos registros históricos usados por CUM y prerrequisitos.

Pruebas: `node --test test/legacy-import.test.cjs` desde backend con sus dependencias; `docker compose exec -T backend node < backend/test/docker-legacy-import.cjs` prueba API/PostgreSQL locales con fixtures ficticios y limpieza en finally. No ejecutar este último contra producción.

## Configuración y ejecución

Variables observadas: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `POSTGRES_PASSWORD` (Compose), `JWT_SECRET`, `JWT_EXPIRATION`, `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_BASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL`, `PORT`, `NODE_ENV`. No copiar valores secretos a documentación. `.env.example` de la raíz documenta Compose; `backend/.env.example`, ejecución fuera de Docker. `.env` está ignorado por Git y excluido del contexto Docker del backend. JWT_SECRET debe tener al menos 32 bytes y generarse aleatoriamente.

Compose publica frontend en 8082, backend en 3002 y PostgreSQL en 5434, frontend ligado a 0.0.0.0 para acceso remoto autorizado y API directa/DB a 127.0.0.1; mantiene volúmenes pgdata y uploads. Los puertos publicados se cambiaron el 2026-10-29 por conflictos con otros proyectos locales; los internos siguen en 80/3000/5432 y FRONTEND_URL es configurable y por defecto http://192.168.0.151:8082 para este servidor. Exige secretos externos sin defaults y usa upam_app (sin superusuario/crear roles/crear bases) en la aplicación, con NODE_ENV production para evitar logs SQL. Es un entorno de desarrollo HTTP con acceso remoto a la web, no un despliegue de producción validado. Nginx reenvía /api y logos; bloquea los antiguos /uploads/:archivo. Solo logos conservan caché pública de 30 días.

Para un clon nuevo, `node scripts/secure-local-docker.cjs --init-env` crea .env solo si no existe; luego `docker compose up -d --build`. Los scripts database/init-app-role.sh y database/security-role.sql crean el rol limitado al inicializar una base nueva. Para una base local existente, `node scripts/secure-local-docker.cjs` rota secretos/credenciales sobre upam_db sin borrar datos; recrear servicios inmediatamente después. Este comando rota sesiones: no ejecutarlo innecesariamente. Migraciones futuras deberán conceder permisos al rol; editar init.sql no actualiza volúmenes existentes.

Desde la raíz:

```powershell
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run start:dev
npm --prefix frontend run dev
npm --prefix backend run typecheck
npm --prefix frontend run typecheck
npm --prefix backend run build
npm --prefix frontend run build
```

Instalar dependencias y arrancar servicios según la tarea. Al cambiar código/configuración, actualizar Docker conforme a AGENTS.md. El script lint del backend usa --fix y modifica archivos; el frontend declara eslint sin incluirlo en sus devDependencies. `npm --prefix backend run test:security` ejecuta regresiones HTTP aisladas con Node test runner, ts-node y dependencias existentes. `backend/test/docker-security.cjs`, enviado por stdin a `docker compose exec -T backend node`, valida API y PostgreSQL reales con registros/archivos ficticios que elimina al finalizar; no usa Wompi ni Resend reales.

## Buenas prácticas observadas y reglas de mantenimiento

Hay módulos por funcionalidad, inyección de dependencias, repositorios, tipos/enums compartidos por capa, validación global estricta para DTOs reales, manejo central de errores, componentes UI reutilizables, cliente HTTP común, hashes bcrypt y builds multietapa.

Estos mecanismos no garantizan por sí solos código limpio o seguridad. Algunos cuerpos usan tipos inline/`any`, que no reciben la misma validación de un DTO decorado; varias pantallas y servicios concentran responsabilidades. Preferir funciones pequeñas con nombres de negocio, DTOs concretos, respuestas explícitas que excluyan secretos, autorización por objeto, cambios acotados y pruebas de reglas críticas. No introducir abstracciones o refactorizaciones extensas sin necesidad.

Consultar el estado actualizado en security/audits/. Quedan pendientes migraciones generales verificables, pruebas adicionales de inscripciones/notas, concurrencia de cupos y pagos manuales, revisión de dependencias, revocación de sesiones y endurecimiento de producción. La corrección de los seis hallazgos iniciales no certifica toda la aplicación.

## Distribución Docker Hub y Portainer (2026-11-24)

`docker-compose.portainer.yml` usa imágenes versionadas de backend/frontend/database bajo josuerauda117, sin build, bind mounts o container_name fijo. Soporta Compose v2 y Portainer Docker Standalone en Linux amd64. Solo publica web (WEB_BIND_ADDRESS/WEB_PORT); DB/API usan la red interna, con healthchecks y volúmenes pgdata/uploads por proyecto. FRONTEND_URL y secretos son obligatorios y externos. La configuración de desarrollo docker-compose.yml conserva su comportamiento y volúmenes.

`database/Dockerfile` genera DDL desde init.sql en una etapa de construcción hasta el primer INSERT; la imagen final incluye solo esquema, ajustes institucionales no sensibles, script del rol upam_app y migraciones SQL. No incluye registros/usuarios demo ni datos del host. El SQL empaquetado se ejecuta únicamente sobre un volumen PostgreSQL nuevo; no reemplaza migraciones sobre datos existentes. `database/.dockerignore` restringe el contexto a esos recursos.

El backend ejecuta scripts/bootstrap-admin.cjs antes de NestJS. Sin INITIAL_ADMIN_EMAIL/PASSWORD no hace nada; con ambos valida email/password (16 caracteres mínimo, 72 bytes máximo) y crea el primer administrator solo cuando users está vacía, usando bcrypt 12, transacción y bloqueo de tabla. En una base con usuarios no los cambia. Retirar esas variables tras el primer inicio. Los errores no imprimen parámetros SQL ni secretos. La imagen frontend excluye .env y .env.* del contexto.

Los valores de ejemplo y la guía están en .env.portainer.example y docs/deployment/dockerhub-portainer.md; .env.portainer está ignorado. scripts/publish-images.sh construye/publica tags explícitos, sin latest automático ni credenciales de build. La publicación no despliega un Stack remoto, no migra volúmenes y no certifica producción ni compatibilidad Swarm/ARM64. La entrega 2026.11.24.1 usa como base de código el commit 358de64; es el tag por defecto del YAML y la plantilla. Manifiestos/digest públicos en docs/deployment/images-2026.11.24.1.json; la versión 2026.11.24 anterior se conserva. El script exige indicar tag para evitar republicación accidental por un valor predeterminado.

## Selectores y prerrequisitos múltiples (2026-11-24)

`SearchableSelect` sustituye los 19 selectores de páginas. Busca localmente por texto visible, sin distinguir mayúsculas/acentos y admitiendo varias palabras; no crea opciones con texto libre. Conserva select nativo como respaldo de eventos/formulario/required, con input combobox, lista navegable y selección múltiple con etiquetas removibles. Los datos de búsqueda no se envían a servicios externos ni se persisten.

Materias usa `prerequisiteSubjectIds: string[]` para crear/editar, carga y muestra todas las relaciones; cambiar carrera limpia la selección. Se pueden retirar también prerrequisitos existentes inactivos. Inscripción requiere aprobar todos los IDs y muestra todos sus nombres. La validación backend de inscripción ya recorría todos los prerrequisitos.

POST/PUT subjects reciben DTOs concretos, con whitelist, UUIDs únicos y hasta 100 prerrequisitos. Campo omitido al editar conserva relaciones, [] las elimina; el campo anterior prerequisiteSubjectId sigue como alternativa escalar depreciada (no se aceptan ambos juntos). La escritura de materia/relaciones usa una transacción y bloqueo advisory PostgreSQL compartido entre ediciones del grafo; valida referencias, carrera, nuevos prerrequisitos activos, no autorreferencia ni ciclos, incluyendo cambios simultáneos. Relaciones inactivas existentes pueden conservarse. Cambiar una carrera tampoco puede dejar dependientes de otra carrera. No hay cambios de tablas ni migraciones: prerequisites ya admite varias filas por materia.

Verificación: frontend/test/select-options.test.cjs para búsqueda; backend/test/docker-prerequisites.cjs para API/PostgreSQL locales con fixtures propios y limpieza. No ejecutar este último sobre producción. La interacción visual y los eventos/foco del combobox necesitan verificación en navegador real, no disponible en este entorno.

## Aranceles por estudiante (2026-11-24)

Students incorpora tuition_amount y monthly_amount NUMERIC(10,2) nullable: NULL hereda el precio del ciclo; valores propios deben estar entre 0.01 y 99999999.99 USD con dos decimales. No se admiten exenciones de importe cero en esta función. Entidad TypeORM con conversión decimal a número y dominio/tipos frontend actualizados. PUT /api/students/:id/fees usa DTO concreto, UUID validado y roles administrator/administrative; omitir un campo lo conserva y null restablece el valor del ciclo. Respuesta explícita de ID/aranceles, sin relaciones sensibles. GET /students/:id limita lectura a personal autorizado o estudiante propietario.

Editar estudiante contiene StudentFeesSection con formulario independiente Guardar aranceles; disponible para ambos roles. Colecturía muestra el importe del estudiante seleccionado. PaymentsService resuelve cada arancel con fallback al ciclo para nuevas órdenes Wompi y pagos manuales; verifica coincidencia exacta en centavos con el importe del servidor. No cambia registros de pagos previos. El resumen mantiene los importes históricos de pagos completados y usa el precio actual para conceptos no pagados, contando meses únicos y sumando montos reales.

La migración aditiva/idempotente database/migrations/20261124_student_fees.sql se aplica antes del nuevo backend sobre volúmenes existentes; no basta reconstruir contenedores. Fue probada dos veces en PostgreSQL efímero con un estudiante sintético previo y luego aplicada en la base local conservando valores NULL. init.sql incluye columnas/restricciones para instalaciones nuevas; database/Dockerfile empaqueta SQL de migraciones en /opt/upam/migrations en la imagen publicada 2026.11.24.1. La imagen local renovada fue validada y la entrega nueva incluye esos recursos; el tag anterior 2026.11.24 no los contiene. No se usa synchronize ni seeds.

## Lectura del horario completo de un grupo (2026-11-24)

Una EnrollmentSubject conserva un scheduleId como ancla de su grupo; no se generan inscripciones ni créditos por cada día. EnrollmentRepository carga subjects.schedule.group.schedules junto con las relaciones existentes para consultas detalladas de inscripción, incluida GET /enrollments/my/:cycleId. Los bloques hijos contienen solo campos de Schedule, sin expandir inscripciones o grupos de vuelta. El servicio conserva la resolución de estudiante por usuario autenticado.

Mi Horario expande cada inscripción activa a todos los bloques del mismo grupo para cuadrícula y detalle; ignora canceladas, deduplica IDs, ordena por día/hora y conserva el ancla como fallback para respuestas antiguas sin lista. La cuadrícula usa una columna por día y un único contenedor temporal, dibuja cada bloque una vez y amplía el rango si hay clases antes de las 06:00 o después de las 20:00. Los totales siguen contando materias/créditos de las inscripciones, sin multiplicarlos por bloques.

Cambio exclusivamente de lectura/presentación, sin DDL, migración o modificación de las reglas de reserva. La validación de choques de inscripción existente revisa anclas individuales: seguimiento separado en FINDING-2026-009; este cambio de visualización no certifica toda la lógica de inscripción. El tag Docker Hub 2026.11.24.1 conserva la entrega anterior y no contiene esta corrección hasta una publicación nueva.
