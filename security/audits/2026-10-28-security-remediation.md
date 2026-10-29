# Revisión de remediaciones y cierre de hallazgos iniciales

Fecha: 2026-10-28. Agente: Codex. Autorización: usuario solicitó resolver los hallazgos; actualización local Docker exigida por AGENTS.md. Base: f9be37d más cambios locales conservados.

## Resultado

| Hallazgo | Estado actual | Expediente |
| --- | --- | --- |
| FINDING-2026-001 | CLOSED | [REM-2026-001](../remediation/REM-2026-001.md) |
| FINDING-2026-002 | CLOSED | [REM-2026-002](../remediation/REM-2026-002.md) |
| FINDING-2026-003 | CLOSED | [REM-2026-003](../remediation/REM-2026-003.md) |
| FINDING-2026-004 | CLOSED en controles corregidos; integración comercial no certificada | [REM-2026-004](../remediation/REM-2026-004.md) |
| FINDING-2026-005 | CLOSED | [REM-2026-005](../remediation/REM-2026-005.md) |
| FINDING-2026-006 | CLOSED en configuración/repositorio y entorno local | [REM-2026-006](../remediation/REM-2026-006.md) |

Correcciones verificadas mediante regresiones HTTP aisladas, compilación/tipos, contenedores locales y PostgreSQL. [Evidencia y resultados detallados](../evidence/2026-10-28-remediation-tests.md). Se preservan la auditoría y evidencia iniciales como historial; sus estados describían el momento anterior a la corrección.

Los cierres no acreditan toda la aplicación para producción. Permanecen alertas de dependencias reportadas por npm ci y pendientes de clasificación, hardening de producción, sesión/revocación/rate limiting y pruebas de otras reglas académicas. Wompi sigue cerrado sin secreto de eventos: configurar y validar cuenta, moneda/región y eventos sandbox antes de habilitarlo. No hubo pagos ni correos reales.
