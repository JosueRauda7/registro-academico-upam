# Diagnóstico PostgreSQL por SSH

- Fecha: 2026-11-24. Alcance: acceso DB por túnel desde el equipo del usuario. Revisión de configuración y autenticación local; sin modificar usuarios, credenciales o volúmenes.
- Evidencia: Docker publica UPAM en 127.0.0.1:5434; el puerto 5433 del servidor pertenece a otro proyecto. Prueba pg desde backend usando sus variables runtime: conexión TCP y SELECT 1 correctos, exit 0. Comparación booleana de credencial runtime con Compose actual correcta; valores no impresos.
- Resultado: credenciales de upam_app verificadas para UPAM. El túnel puede usar cualquier puerto local libre, pero debe apuntar al 127.0.0.1:5434 remoto. No se inspeccionó el equipo/túnel del usuario; la causa del fallo desde su cliente sigue condicionada a su configuración de forwarding.
- Cambio: backend/.env.example corrige puerto directo desactualizado y aclara el puerto local de un túnel. Sin nuevas superficies ejecutables o cambios de autorización. No se formaliza una vulnerabilidad nueva.
- Manejo de secretos: usuario pegó credenciales en la conversación; no se transcribieron ni almacenaron en el expediente o comandos. Se recomienda coordinar su rotación posterior; no se alteraron ni invalidaron sesiones durante el diagnóstico.
