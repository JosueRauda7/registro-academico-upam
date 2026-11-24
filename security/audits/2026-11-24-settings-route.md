# Revisión de acceso a Configuración

- Fecha: 2026-11-24. Alcance: corregir la navegación del administrador desde el menú. Cambios previos de SSH/modales/selectores y limpieza de datos conservados.
- Causa confirmada estáticamente: menú /configuracion frente a ruta registrada /configuración; React Router usaba wildcard y redirigía a dashboard. No era un fallo de la contraseña ni de permisos DB.
- Corrección: ruta canónica sin tilde con ProtectedRoute administrator, alias anterior redirige con replace a la ruta protegida. No se amplían roles ni se cambian APIs o datos.
- Evidencia: typecheck y build frontend correctos. Comprobación de AST real de App/Sidebar con matchRoutes: 19 enlaces corresponden a rutas concretas; ruta sin tilde y anterior codificada reconocidas. HTTP settings en backend con tokens efímeros en memoria: administrator 200; administrative/teacher/collector/student 403; anónimo 401. Solo GET, sin modificar branding/configuración ni imprimir respuestas privadas o identidades.
- Docker: frontend reconstruido/recreado, DB healthy y API activa. Página y bundle actualizado por Nginx HTTP 200; logs de arranque revisados mediante resultado booleano, sin copiar solicitudes/datos de clientes.
- Límites: sin navegador automatizado ni clic real de usuario; matchRoutes prueba el enrutador y no toda la interfaz. No se formaliza un hallazgo de seguridad nuevo; backend ya protegía sus operaciones. Sin pagos/correos, pruebas destructivas, secretos en evidencia, commit/push o publicación de imágenes.
