# Diagnóstico preliminar de acceso local desde pgAdmin

- Fecha: 2026-11-24. Base 886fcc8, árbol limpio al iniciar. Solicitud: despliegue en computadora del usuario rechaza contraseña en pgAdmin.
- Revisión estática: docker-compose.portainer.yml no publica PostgreSQL al host; docker-compose.yml del repositorio publica 127.0.0.1:5434 a 5432. POSTGRES_USER es postgres y usa POSTGRES_PASSWORD; init-app-role.sh/security-role.sql asignan DATABASE_PASSWORD a upam_app únicamente durante inicialización de un volumen nuevo. Cambiar variables no cambia roles existentes.
- No se incluye un servicio pgAdmin ni se define su contraseña de acceso en estos YAML. Hay que distinguir login de pgAdmin y autenticación PostgreSQL, y confirmar host/puerto/usuario/error y Compose/Portainer sin solicitar contraseñas.
- Alcance: no hay acceso al equipo local del usuario ni evidencia de su error exacto. No se atribuye una causa confirmada, no se cambian credenciales, no se abre la DB de este servidor ni se eliminan volúmenes. Sin nuevos hallazgos o cambios de estado anteriores.
- Verificación: archivos y scripts inspeccionados, sin pruebas de conexión contra el equipo del usuario. Solo documentación; no requiere reconstrucción Docker. Pendiente: contexto de conexión y mensaje sanitizado para indicar el ajuste específico.

## Resolución posterior confirmada por el usuario

La salida de docker ps de su computadora mostró UPAM sin puerto PostgreSQL publicado y los puertos 5432/5434 ocupados por otras instancias. Se indicó publicar db en 127.0.0.1:5435:5432 y conectar pgAdmin a upam_academico con el rol y variable correspondientes. El usuario confirmó que ya puede acceder. No se cambiaron contraseñas ni configuración en este servidor; valores secretos compartidos en la conversación no se copiaron a archivos o herramientas.
