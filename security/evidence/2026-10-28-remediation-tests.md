# Evidencia de re-test de los seis hallazgos iniciales

Fecha: 2026-10-28. Agente: Codex. Base: árbol local sobre f9be37d, conservando cambios previos. No se imprimieron credenciales nuevas, JWT, passwords ni datos personales. Las pruebas usan fixtures ficticios, mocks del proveedor y servicios locales.

## Comprobaciones ejecutadas

| Comando / método | Resultado observado |
| --- | --- |
| npm --prefix backend run typecheck | Sin diagnósticos, exit 0 |
| npm --prefix frontend run typecheck | Sin diagnósticos, exit 0 |
| npm --prefix backend run test:security | 7 pruebas correctas, 0 fallos (suite HTTP con seis subpruebas) |
| npm --prefix backend run build | Compilación Nest completada |
| npm --prefix frontend run build | Build Vite completado |
| node scripts/secure-local-docker.cjs | Rotación local y rol de aplicación configurados; sin borrar datos/volúmenes |
| docker compose up -d --build backend frontend | Imágenes construidas y servicios recreados; DB healthy |
| backend/test/docker-security.cjs enviado a docker compose exec -T backend node | 32 comprobaciones correctas con API, PostgreSQL y repositorio TypeORM real; limpieza de fixtures en finally |
| scripts/migrate-local-logo.cjs enviado al backend por stdin | Logo antiguo copiado a logos públicos y referencia actualizada; original conservado |
| docker compose --env-file .env.example config --quiet | Falló como se esperaba por secretos obligatorios vacíos |
| HTTP desde backend hacia frontend/Nginx | / devuelve 200; /api/auth/profile sin sesión, 401; antiguo /uploads/:archivo, 404 |
| docker compose ps y logs recientes | Backend y frontend activos; DB healthy; tres puertos publicados en 127.0.0.1; Nest arrancado sin error |

La primera comprobación inmediata tras recrear servicios encontró un arranque aún no terminado (fetch failed). Se añadió espera acotada al verificador y se repitió con éxito. No se ocultó ni atribuyó ese fallo a un defecto de autorización.

## Cobertura por hallazgo

- 001: rechazo HTTP de los cuatro roles privilegiados y campos extra; registro student correcto; rechazo en servicio directo incluso fuera del ValidationPipe.
- 002: login válido; sesión con purpose access aceptada; token de recuperación, tokens sin propósito/claims, vencidos o malformados rechazados; recuperación acepta su propósito y rechaza token de sesión/reutilización secuencial. Reset token en DB ahora es hash y cada emisión tiene jti aleatorio.
- 003: pago ajeno devuelve 404; dueño/admin/collector permitidos; administrative/teacher rechazados; pago inexistente, 404. Sin secretos en respuesta, incluidos objetos anidados inyectados con campos sensibles; metadatos ORM select false comprobados. Se repitió dueño/ajeno y ausencia de secretos con PostgreSQL real.
- 004: checksum ausente/incorrecto y cambio de ID firmado rechazados; falta de secreto, 503. Mock remoto verifica diferencias de ID, referencia, monto y moneda; evento válido aplica una sola vez. El repositorio TypeORM real con dos llamadas concurrentes aplica una sola transición; no degrada completed a failed ni acepta otro ID de transacción. No se contactó a Wompi ni se envió correo real.
- 005: carga real sharp/WebP en contenedor; comprobantes actuales y antiguos inaccesibles por ruta pública; sin JWT, 401; otro estudiante, 404; dueño y roles financieros, acceso permitido; cabecera private, no-store. Logo público, 200; Nginx bloquea ruta antigua.
- 006: aplicación corre como upam_app sin rolsuper/rolcreatedb/rolcreaterole; secretos nuevos externos; contraseña anterior de postgres rechazada por conexión TCP (28P01); Compose rechaza secretos vacíos; puertos restringidos a loopback; .env ignorado por Git y excluido del contexto backend.

## Limitaciones y riesgos residuales

No se certifica integración comercial Wompi ni moneda/región: el entorno local carece de WOMPI_EVENTS_SECRET y rechaza webhooks con 503 hasta configurar el secreto real adecuado. Se validó el algoritmo conforme al [contrato oficial Wompi.co](https://docs.wompi.co/en/docs/colombia/eventos/) y se probaron controles con mocks; no se realizaron cobros ni correos externos. Los pagos anteriores sin ID vinculado requieren conciliación antes de procesar eventos.

Las copias de comprobantes previamente descargadas o cacheadas fuera del servidor no se pueden revocar con esta corrección. La revocación de sesiones después de cambios de rol/contraseña, rate limiting, Swagger en producción y otras superficies permanecen fuera de estos seis cierres.

Durante npm ci en Docker se informaron 17 alertas para dependencias runtime backend (9 moderate, 7 high, 1 critical), 37 para backend con desarrollo y 7 para frontend. Son reportes del instalador, no una evaluación de explotabilidad de cada advisory. Deben investigarse con npm audit y validación de versiones/alcance; no se ejecutó npm audit fix --force ni se declararon resueltas. No equivalen a ausencia de otros riesgos.
