# Registro de remediaciones

No se implementaron remediaciones en la revisión inicial. Las recomendaciones de cada hallazgo son propuestas; no crear expedientes que las presenten como FIXED.

Actualización 2026-10-28: se implementaron y verificaron REM-2026-001 a REM-2026-006. Véanse la auditoría `../audits/2026-10-28-security-remediation.md` y los expedientes individuales; el párrafo anterior describe la revisión inicial histórica.

Al corregir, crear `REM-YYYY-NNN.md` con este formato:

```text
ID y fecha:
Hallazgo relacionado: FINDING-YYYY-NNN
Responsable/agente y alcance autorizado:
Estado:
Causa raíz:
Solución realmente implementada:
Archivos y revisión Git/estado del árbol:
Pruebas ejecutadas y resultado:
Evidencia sanitizada del re-test:
Riesgo residual y límites:
Resultado y fecha de cierre (solo tras verificación):
```

Asignar IDs sin reutilizarlos. Enlazar expediente, evidencia, auditoría y progreso. Una corrección sin prueba queda pendiente de RETEST; una prueba fallida mantiene el hallazgo abierto. No borrar el hallazgo original.
