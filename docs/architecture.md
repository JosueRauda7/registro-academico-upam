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

`AuthContext` persiste token y perfiles en localStorage; `api/axios.ts` agrega Authorization y limpia sesión/redirige ante 401. `ProtectedRoute` y la navegación por rol mejoran la experiencia, pero la autorización efectiva debe residir en backend. localStorage requiere especial atención ante XSS; no se verificó una vulnerabilidad XSS concreta.

El registro público solo admite student, incluso al invocar el servicio directamente. Los JWT de sesión incluyen purpose access y claims obligatorios; los de recuperación tienen purpose password-reset y jti aleatorio, y solo se guarda su hash SHA-256. Los tokens anteriores sin purpose access requieren iniciar sesión otra vez; los enlaces de recuperación anteriores a esta corrección deben solicitarse de nuevo. Los atributos sensibles de User se excluyen por defecto de las consultas; el interceptor sanitiza respuestas anidadas y pagos usa una proyección explícita.

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
