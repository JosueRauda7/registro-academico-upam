# Auditoría inicial de seguridad

Fecha: 2026-10-28. Agente: Codex. Base: `f9be37d` con cambios locales preexistentes. Método: revisión estática selectiva, sin modificar código de aplicación.

## Alcance y resultado

Se inspeccionaron bootstrap, configuración Docker/Nginx, esquema/conexión, autenticación/recuperación, guard JWT, registro, pagos/webhook/repositorio/entidad User, uploads, cliente HTTP y contexto de sesión. Se revisaron manifiestos y disponibilidad de scripts; no se consultaron advisories de dependencias.

| Hallazgo | Severidad | Estado | Condición principal |
| --- | --- | --- | --- |
| [FINDING-2026-001](../findings/FINDING-2026-001.md) Registro con rol privilegiado | Critical | OPEN | Registro público accesible y DB operativa |
| [FINDING-2026-002](../findings/FINDING-2026-002.md) Token de recuperación aceptable como sesión | High | OPEN | Acceso a un token de recuperación vigente; afecta rutas sin RolesGuard |
| [FINDING-2026-003](../findings/FINDING-2026-003.md) Acceso transversal a pagos y datos sensibles | High | OPEN | JWT y conocimiento de UUID de un pago ajeno |
| [FINDING-2026-004](../findings/FINDING-2026-004.md) Webhook sin firma ni vinculación completa | High | OPEN | Referencia local y transacción remota consultable; fraude por verificar en sandbox |
| [FINDING-2026-005](../findings/FINDING-2026-005.md) Comprobantes con lectura pública | Medium | OPEN | Conocer la URL de un comprobante cargado |
| [FINDING-2026-006](../findings/FINDING-2026-006.md) Credenciales conocidas en configuración Compose | High | OPEN | Despliegue con configuración versionada sin sustituir valores |

Las severidades son cualitativas y se justifican en cada expediente. Todos los defectos de control descritos están observados en código; no se ejecutó explotación HTTP ni se verificó exposición de un despliegue real. No se acepta riesgo mediante este informe.

## Controles observados

- Hash bcrypt con factor 10 y mensajes genéricos en recuperación para correo no encontrado.
- Guards de JWT y roles disponibles; validación global con whitelist, forbidNonWhitelisted y transform para DTOs decorados.
- Helmet y CORS de un origen configurable.
- Upload con límite de 5 MB, nombre UUID y recodificación mediante sharp.
- Aplicación con synchronize false y consultas TypeORM; esto no acredita todas las consultas como seguras.
- Webhook consulta el estado a Wompi: no toma directamente el estado enviado por el cliente, pero esa consulta no coteja la identidad económica de la transacción.

## Otras verificaciones pendientes

Rate limiting no observado en bootstrap/auth inspeccionados; no se descartó protección externa. Swagger habilitado sin condición; JWT persistido en localStorage; ausencia de revocación/consulta de estado de usuario en JwtAuthGuard; almacenamiento del reset token en claro; SQL logging si NODE_ENV no es production; seed con synchronize true; transacciones/concurrencia en cupos y duplicados; DTOs inline; minimización de respuestas en otros módulos; seguridad de exportaciones y correo HTML; backups/TLS/privilegios efectivos e imágenes. No constituyen una auditoría exhaustiva ni se presentan como explotaciones comprobadas.

## Evidencia, límites y siguiente acción

Evidencia sanitizada: [revisión estática](../evidence/2026-10-28-static-review.md). Verificación de tipos y documentación: [bitácora](../../docs/progress.md). Typecheck no prueba seguridad.

No se arrancaron servicios, tocaron bases de datos, enviaron correos, hicieron pagos ni ejecutaron seed/migraciones. No se realizaron pruebas dinámicas, revisión histórica de secretos ni auditoría de CVEs. Siguiente acción recomendada: corregir 001/003 y añadir regresiones de permisos; continuar con identidad JWT e integridad financiera. Mantener los seis hallazgos abiertos hasta remediación y re-test documentados.
