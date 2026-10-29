# Evidencia sanitizada de revisión estática

Fecha: 2026-10-28. Base: `f9be37d` más cambios locales. Método ejecutado: lectura de archivos y búsqueda de símbolos con rg. No contiene claves, JWT, contraseñas ni información de usuarios reales. Los pasos dinámicos de los hallazgos son propuestas; no se ejecutaron.

| Hallazgo | Ubicación y observación reproducible mediante lectura |
| --- | --- |
| 001 | `backend/src/application/auth/auth.controller.ts`, register: ruta POST sin guard. `dto/register.dto.ts`: role acepta enum UserRole. `auth.service.ts`, register: selecciona dto.role, persiste usuario y genera token con ese rol. |
| 002 | `auth.service.ts`, issueResetToken: JWT con sub y purpose password-reset usando JwtService. `auth.module.ts`: configuración compartida de firma. `common/guards/jwt-auth.guard.ts`, canActivate: verifica firma/expiración pero asigna payload a request.user sin validar purpose o claims de sesión. |
| 003 | `payments.controller.ts`, getPaymentById: solo JwtAuthGuard y parámetro id, sin identidad del actor. `payments.service.ts`, getPaymentById: devuelve entidad obtenida por ID. `payment.repository.ts`, findById: carga student.user. `entities/user.entity.ts`: passwordHash/resetToken se seleccionan normalmente y no hay exclusión de serialización en la entidad. |
| 004 | `payments.controller.ts`, handleWebhook: pasa únicamente req.body al servicio. `payments.service.ts`, handleWompiWebhook: busca pago por transaction.reference del cuerpo y consulta estado usando transaction.id del cuerpo. `infrastructure/payment/wompi.gateway.ts`, getTransactionStatus: devuelve solo estado; no referencia, importe, moneda o comercio para cotejo. No hay validación de firma en ese recorrido. |
| 005 | `uploads.controller.ts`: incluye comprobantes entre usos del upload; `payments.controller.ts`: receiptImageUrl para pago manual. `main.ts`: useStaticAssets de uploads sin guard. `frontend/nginx.conf`: location /uploads con Cache-Control public y expires 30d. |
| 006 | `docker-compose.yml`: credenciales DB y JWT_SECRET con valores literales conocidos, DB/backend publicados al host. `auth.module.ts` y `jwt-auth.guard.ts`: usan JWT_SECRET para firma/verificación. No se reproducen los valores. |

Para revalidar la evidencia, abrir los archivos en el árbol de trabajo y buscar los símbolos indicados. Si cambia el código, preservar este registro histórico y añadir nueva evidencia con la revisión exacta. No considerar esta tabla evidencia de explotación runtime ni de corrección.
