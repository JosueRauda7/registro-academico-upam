# Política de seguridad — Registro Académico UPAM

## 1. Objetivo y alcance

Definir revisión, evidencia, seguimiento y remediación durante todo el desarrollo. Proteger identidad, datos académicos y financieros y disponibilidad. Esta política establece controles a verificar; no afirma que todos estén implementados.

Incluye SPA React, API NestJS `/api`, JWT, roles, recuperación de contraseñas, PostgreSQL/TypeORM, inscripciones/cupos/notas, pagos manuales y Wompi, webhooks, Resend, reportes Excel/PDF, uploads, Docker/Nginx, variables, dependencias, CORS, Swagger y endpoints administrativos. No se observó una API externa con API Keys, scopes o allowlist: no importar esos controles del ejemplo como funcionalidad existente. Si se incorpora, documentar su modelo de amenazas y controles antes de exponerla.

## 2. Flujo de auditoría

```text
Definir alcance y entorno → reconocer código/configuración → revisar dependencias
→ pruebas autorizadas con datos ficticios → registrar evidencia sanitizada
→ crear hallazgos y justificar severidad → proponer remediación
→ corregir dentro del alcance autorizado → re-test → cerrar con evidencia
```

Registrar fecha, agente, base Git y cambios locales, superficies revisadas, métodos, resultados reales y limitaciones. Revisión estática y explotación runtime son evidencias diferentes. Revisar seguridad en cada cambio y ampliar el alcance ante nuevas integraciones o cambios de identidad, roles, datos, pagos o infraestructura.

## 3. Controles mínimos

### Autenticación y recuperación

- Registro público limitado a student; creación de roles privilegiados mediante flujo administrativo autorizado.
- Hash de contraseñas, política de contraseñas, mensajes que no faciliten enumeración y límites contra fuerza bruta/abuso de recuperación. Verificar los límites efectivamente configurados en aplicación y proxy.
- Validar firma, expiración, propósito y claims obligatorios de JWT. Un token de recuperación nunca autentica como sesión. Revisar invalidación tras cambio de contraseña, desactivación o cambio de rol.
- Recuperación de un solo uso con expiración, almacenamiento protegido, sin tokens en logs, reportes o respuestas de entidades.
- Revisar localStorage/XSS, CSP, enlaces de recuperación y comportamiento de cierre de sesión. No atribuir revocación al simple borrado local del token.

### Autorización y API

Roles reales: `student`, `administrator`, `collector`, `administrative`, `teacher`.

- Verificar cada controller y la autorización por objeto en services/repositorios: estudiante solo sus datos; docente solo grupos/notas asignados; colector solo funciones financieras autorizadas. Probar acceso horizontal y vertical.
- Validar DTOs, UUIDs, enums, paginación, límites y campos permitidos. Los tipos inline/any no activan validación decorada.
- Revisar inyección, mass assignment, IDOR/BOLA, exposición de hashes/tokens, errores, CORS y cabeceras. No confiar en ProtectedRoute del frontend.
- En reportes, verificar propietario/rol, mínimo de datos y fórmulas de hoja de cálculo originadas en entradas de usuario.
- Swagger está habilitado incondicionalmente: decidir restricción por entorno antes de producción; revisar también contrato JSON y acceso directo al puerto backend.

### Negocio académico

- Pago de matrícula requerido, ciclo abierto, pertenencia de grupos al ciclo y materia, prerrequisitos, materias históricas, choque de horario, cupos y estados válidos.
- Probar concurrencia en reserva/confirmación/cancelación y duplicados. Exigir atomicidad o mecanismos equivalentes que preserven invariantes.
- Notas: rango, asignación del docente, integridad de historial y permisos para rectificaciones.

### Pagos y webhooks

- Importes y moneda determinados/validados por servidor; no confiar en campos enviados por cliente.
- Verificar firma/autenticidad del webhook conforme al contrato real del proveedor configurado; revisar cuerpo original si el mecanismo lo exige. La descripción Swagger no prueba implementación.
- Cotejar transacción consultada con referencia, monto, moneda y cuenta/comercio del pago local; no aceptar únicamente el estado remoto.
- Revisar replay, idempotencia, eventos fuera de orden, transiciones válidas y duplicados concurrentes; proteger pagos manuales y comprobantes.
- Usar sandbox y mocks en pruebas; no efectuar cobros reales. Confirmar compatibilidad del contrato Wompi antes de afirmar que la integración funciona.

### Datos, archivos y privacidad

- SQL parametrizado, mínimo privilegio, credenciales externas, backups/restauración y restricciones relacionales. No usar cuenta superusuario para la aplicación en producción.
- `DatabaseModule` usa synchronize false; el seed usa true: evitar seed sobre datos reales. Revisar migraciones antes de ejecutarlas.
- Separar logos públicos de comprobantes privados; descargas privadas deben comprobar identidad/propiedad. UUID impredecible no es autorización. Revisar caché pública y retención/borrado.
- Verificar límites de tamaño/dimensiones/recursos, tipo real, recodificación de imágenes, nombres generados, traversal, permisos de disco y cuotas. La carga actual recodifica a WebP y limita a 5 MB; también se debe proteger la lectura.
- No servir ejecutables ni exponer PII innecesaria. No serializar entidades User completas ni sus relaciones sensibles.

### Integraciones, infraestructura y dependencias

- Resend: secretos externos, remitente controlado, escape de contenido HTML y datos mínimos en logs; comprobar entrega/errores sin exponer tokens.
- Producción: HTTPS, puertos mínimos, secretos propios, usuario de DB limitado, NODE_ENV correcto, logs seguros, contenedores y volúmenes con permisos adecuados y restauración ensayada.
- Revisar `backend/package.json`, `frontend/package.json`, ambos lockfiles e imágenes. Ejecutar auditoría de dependencias cuando haya acceso autorizado al registro y guardar fecha, comando y resultado sanitizado. Sin consulta de advisories no afirmar ausencia o presencia de CVEs por intuición.
- No ejecutar actualizaciones automáticas con cambios incompatibles; registrar dependencia, advisory verificado, alcance, solución y validación. La auditoría inicial no incluyó esta consulta.

## 4. Severidad

| Nivel | Criterio |
| --- | --- |
| Critical | Compromiso amplio, por ejemplo obtención pública de privilegios administrativos |
| High | Acceso no autorizado significativo, secretos o integridad financiera comprometidos |
| Medium | Impacto acotado o dependiente de condiciones adicionales |
| Low | Impacto reducido o endurecimiento |

Justificar impacto, actor, acceso requerido y condiciones. CVSS puede añadirse con vector y razonamiento; no inventar puntuación. Un defecto confirmado en código no equivale a explotación comprobada en despliegue.

## 5. Estados y expedientes

Estados: `OPEN`, `IN_PROGRESS`, `FIXED`, `RETEST`, `CLOSED`, `ACCEPTED_RISK`, `FALSE_POSITIVE`, `NOT_REPRODUCED`. Flujo habitual OPEN → IN_PROGRESS → FIXED → RETEST → CLOSED; si el re-test falla, volver a IN_PROGRESS/OPEN. NOT_REPRODUCED no significa seguro. ACCEPTED_RISK exige responsable, aprobación explícita, justificación y fecha de revisión.

- Auditorías: `security/audits/YYYY-MM-DD-descripcion.md`.
- Hallazgos: `security/findings/FINDING-YYYY-NNN.md`, identificadores únicos incrementales por año; revisar los existentes antes de asignar.
- Evidencia: `security/evidence/`, con referencias al hallazgo, origen, método y resultado. Puede ser evidencia estática con archivos/símbolos y pasos de comprobación, sin copiar secretos.
- Remediación: `security/remediation/REM-YYYY-NNN.md`, vinculada al hallazgo, con causa, cambio implementado, archivos, pruebas ejecutadas, resultado y riesgo residual. Una propuesta no es corrección implementada.

Cada hallazgo debe responder qué falla, dónde, cómo se reproduce con datos ficticios, impacto, resultado esperado/observado y cómo se verificará/verificó la corrección. Incluir alcance estático/runtime, estado, severidad y condiciones. No cerrar sin evidencia de re-test.

## 6. Reglas para agentes y manejo de incidentes

1. Leer los documentos del proyecto y revisar el alcance autorizado. Una auditoría documental no requiere modificar la aplicación; una tarea de corrección sí autoriza cambios dentro de su alcance.
2. Conservar evidencia/historial, evitar duplicados y distinguir defectos confirmados, riesgos condicionados e hipótesis.
3. Usar datos de prueba y entornos locales/sandbox; no escanear infraestructura externa, enviar correos ni realizar cobros reales fuera del alcance autorizado.
4. No guardar contraseñas, tokens válidos, claves privadas ni PII innecesaria. Referenciar nombres de variables y ubicaciones, nunca valores.
5. No publicar evidencia sensible en issues públicos. Si se descubre un secreto real, informar de forma privada al responsable del proyecto y coordinar revocación/rotación y revisión del uso; borrar el archivo no basta.
6. No eliminar ni alterar datos ajenos durante pruebas. Registrar límites, dependencias inaccesibles y verificaciones pendientes.
7. Actualizar arquitectura/decisiones cuando corresponda y progreso en cada trabajo. Documentar remediación y re-test antes del cierre.

No hay canal público de reporte de seguridad definido en el repositorio revisado; el responsable debe establecer uno antes de una publicación operativa. No inventar un correo de contacto.

## 7. Línea base

Primera revisión histórica: [auditoría inicial del 2026-10-28](audits/2026-10-28-initial-security-audit.md), con seis hallazgos inicialmente abiertos. Estado actualizado: [remediaciones del 2026-10-28](audits/2026-10-28-security-remediation.md), seis controles corregidos y cerrados con re-test; límites de Wompi comercial y despliegues externos explicitados en cada expediente. Hay alertas de dependencias pendientes de clasificación. Esta política no acredita controles de FacturaSV ni incorpora resultados del ejemplo proporcionado por el usuario.
