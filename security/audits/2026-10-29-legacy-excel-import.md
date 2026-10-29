# Revisión de importación Excel de materias previas

- Fecha: 2026-10-29. Agente: Codex. Base: b1605a2, árbol limpio al iniciar. Alcance autorizado: migración de notas anteriores al sistema mediante Excel, plantilla y seguridad del contenido. Sin commit/push.
- Superficie: nuevas rutas de plantilla/importación, multipart, ZIP/XML/ExcelJS, filas/DTOs, reglas académicas, transacción PostgreSQL, descarga Blob e interfaz React. Se revisaron política, auditoría Swagger más reciente y REM-2026-005 como antecedente de privacidad de archivos.

## Controles implementados

- Solo administrator/administrative, con JWT/roles en servidor antes de procesar multipart. El archivo no permite elegir actor, roles ni campos HTTP adicionales; registered_by procede de la sesión.
- XLSX por extensión y MIME permitido, además de validación real del contenedor y lectura de contenido: no se confía en el nombre. Un archivo en memoria de hasta 2 MiB; sin persistencia, descompresión a disco ni publicación de contenidos. Plantilla con no-store y sin datos de estudiantes.
- Antes de ExcelJS: límites ZIP de 100 entradas y 8 MiB expandidos, tamaños reales acotados mediante inflateRaw con maxOutputLength, nombres/partes permitidos, coincidencia de cabeceras local/central, rechazo de solapamientos, extras, comentarios del archivo ZIP, cifrado y ZIP64. Solo contenedores OOXML simples. La API de [zlib de Node](https://nodejs.org/api/zlib.html) documenta maxOutputLength para limitar la salida de descompresión.
- Rechazo de macros/partes desconocidas, objetos/archivos incrustados, fórmulas aunque tengan resultado almacenado, enlaces externos/hipervínculos, DTD/entidades, nombres definidos, celdas combinadas, hojas no previstas y valores complejos. Límites adicionales de coordenadas/columnas/filas y cantidad de marcas XML antes del parser. Se permite una importación en curso por proceso; las otras reciben 409.
- Hoja Notas previas visible, encabezados exactos y hasta 500 filas. DTOs runtime para carnet/código como texto, nota finita 0–10 con dos decimales, año/semestre y observaciones acotadas. Textos de datos que comienzan con =,+,-,@ rechazados para reducir riesgo al reutilizarlos en hojas de cálculo.
- Validación de estudiante existente, materia activa de su carrera y duplicados dentro del archivo/DB. Ante errores de validación, no hay inserciones; hasta 50 mensajes por fila sin repetir contenido personal del archivo. Todos los registros válidos se insertan en una transacción; UNIQUE(student_id, subject_id) ya existente impide duplicación concurrente. Se conservan notas existentes y se admite historial reprobado.
- Errores de DB conocidos convertidos a respuestas explícitas; errores inesperados devuelven mensaje genérico 503 sin registrar parámetros SQL que puedan contener notas/PII. Ante error de confirmación se indica actualizar registros antes de reintentar.

## Validación y resultado

[Evidencia sanitizada](../evidence/2026-10-29-legacy-excel-tests.md). Builds y typechecks de ambos proyectos correctos; ocho pruebas nuevas aprobadas y siete regresiones existentes aprobadas. Diecinueve comprobaciones locales de API/PostgreSQL, incluidas transacción/rollback, concurrencia, actor y permisos, aprobadas con fixtures eliminados. El primer ensayo HTTP detectó un límite multipart demasiado estricto; se ajustó parts a 2 manteniendo files=1 y fields=0, y el re-test validó archivo permitido/campos extra rechazados.

No se formalizaron nuevos hallazgos independientes ni se alteraron los seis cierres anteriores. Este resultado verifica los controles ensayados; no certifica ausencia de toda vulnerabilidad ni reemplaza antivirus o auditoría de dependencias.

## Límites

- Sin navegador automatizado ni Excel/LibreOffice de escritorio disponibles: se verifica el formato generado por ExcelJS y casos sintéticos, no compatibilidad con todos los editores. Libros con extras ZIP, comentarios de archivo, formatos enriquecidos o metadatos no permitidos deben copiar sus valores a la plantilla simple.
- Una instancia adicional tiene su propio límite de importación simultánea; PostgreSQL mantiene la unicidad. No se implementa un rate limiter distribuido ni aislamiento del parser en otro proceso. El parser recibe únicamente contenido previamente acotado.
- Alertas de dependencias anteriores siguen pendientes de clasificación; no se instalaron librerías nuevas ni se alteraron lockfiles. Se reutiliza ExcelJS existente.
- Sin pagos/correos, consultas sobre datos personales ajenos ni migraciones de esquema. Pruebas locales ficticias con limpieza en finally; sin seeds ni eliminación de volúmenes. No se valida un despliegue de producción.
