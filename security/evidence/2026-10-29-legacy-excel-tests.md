# Evidencia de importación Excel de notas históricas

Fecha: 2026-10-29. Entorno local Docker; entradas y registros exclusivamente ficticios. Sin tokens, contraseñas, datos reales ni contenido de uploads en esta evidencia.

## Comandos y resultados

- Imagen de validación backend: `docker build --target builder -t upam-backend-validation ./backend`; compilación NestJS correcta. Imagen frontend equivalente con target builder: build Vite correcto.
- `docker run --rm upam-frontend-validation npm run typecheck`: exit 0. Ajuste posterior solo de texto de mensaje, recompilado en el build final.
- Imagen backend con src/test actuales montados solo lectura: `npm run typecheck`: exit 0; `node --test test/legacy-import.test.cjs`: 8 pruebas aprobadas, 0 fallidas; `npm run test:security`: 7 pruebas aprobadas, 0 fallidas. Re-test de importación tras ajustes finales y casos de tamaños ZIP falsificados/columnas gigantes también aprobado.
- `docker compose up -d --build backend frontend`: exit 0. Ambos servicios reconstruidos/recreados; DB conserva volumen. Build NestJS/Vite final correcto, backend/frontend Up y DB healthy, logs recientes con arranque correcto.
- `docker compose exec -T backend node < backend/test/docker-legacy-import.cjs`: resultado `{ "checks": 19, "result": "passed", "realPaymentsOrEmails": false }`. Fixtures propios eliminados en finally.
- Desde el servidor: página `/materias-previas` HTTP 200; plantilla anónima `/api/legacy-subjects/template` HTTP 401 por Nginx. Esto no sustituye prueba visual en navegador.

## Casos cubiertos

1. Notas válidas 0/5/7.25/10 y decimal textual con coma; opcionales vacíos y actor conservado.
2. Plantilla XLSX con encabezados/catálogo/instrucciones, sin registros personales; se rechaza vacía y se acepta al completarla.
3. Campos inválidos, nota faltante/fuera de rango/más de dos decimales, carnet numérico, año/semestre inválidos, notas extensas/controles y texto de fórmula: errores por fila sin escrituras.
4. Estudiante/materia inexistente, materia inactiva/de otra carrera y duplicados en archivo/DB: rechazo completo.
5. Lote de 500 notas válido; segunda importación simultánea en el proceso recibe 409.
6. Fórmula con resultado almacenado, hipervínculo, rich text, fecha, hoja oculta/adicional, encabezados alterados, exceso de filas/columnas y celdas combinadas: rechazo.
7. Archivo disfrazado/corrupto/truncado/sobredimensionado, parte VBA/objeto incrustado, DTD, coordenada/columna enorme, ZIP excesivamente expandido y tamaño expandido declarado falsificado: rechazo antes de escritura.
8. HTTP: anónimo 401, student/teacher/collector 403; administrator/administrative permitidos; archivo >2 MiB 413, campos adicionales/archivo ausente 400; plantilla no-store.
9. API/PostgreSQL reales: importación guarda nota/actor; duplicados y fila inválida no modifican registros; rol administrativo permitido y estudiante rechazado. Inserción de lote con conflicto revierte la fila válida; dos inserciones concurrentes del mismo registro producen una sola nueva fila y un conflicto 409.

## Incidencias y límites

Primer ensayo HTTP: 400 en archivo válido por parts=1. Corregido a parts=2 conservando files=1/fields=0; pruebas posteriores pasan y rechazan campos extra. No se incluyen resultados fallidos como aprobados.

Sin navegador automatizado, prueba con Excel de escritorio, antivirus, nueva consulta de advisories ni validación de producción. Los límites y riesgos restantes constan en la auditoría vinculada.
