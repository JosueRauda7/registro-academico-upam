# Eliminación de docentes inactivos

- Fecha: 2026-11-24. Agente: Codex. Solicitud explícita: borrar docentes inactivos de la base local UPAM. Base Git 81274f5 con cambios locales previos conservados.
- Reconocimiento: un docente inactivo y uno activo. Inspección de FKs reales: subject_groups.teacher_id y grades.graded_by; cero referencias al docente inactivo.
- Operación: transacción con lock_timeout 5 s, statement_timeout 20 s e idle_in_transaction_session_timeout 30 s; bloqueo SHARE ROW EXCLUSIVE en teachers/subject_groups/grades. Revalidación de dependencias bajo bloqueo; respaldo previo al DELETE en .backups/, archivo 0600/directorio 0700, excluido de Git. No se imprime el contenido privado.
- Resultado: DELETE exclusivamente WHERE is_active=false eliminó una fila; COMMIT correcto. Comparación transaccional conserva los IDs de docentes activos y conteos de grupos, calificaciones y usuarios. No se eliminaron ni modificaron cuentas de usuario.
- Verificación independiente posterior: cero docentes inactivos y uno activo. Sin cambios de esquema, permisos, código, servicios o volúmenes; no aplica reconstrucción Docker ni pruebas de código. Sin seeds, pagos, correos o publicación.
- Seguridad: respaldo específico, no integral ni restauración ensayada. Sin hallazgos nuevos ni cierres de expedientes previos. Sin commit/push; arquitectura y decisiones sin cambios.
