# Evidencia sanitizada de imágenes y Stack portable

Fecha: 2026-11-24. Alcance local y publicación Docker Hub autorizada. Sin secretos o datos personales en esta evidencia.

## Comprobaciones

- node --check backend/scripts/bootstrap-admin.cjs y sh -n scripts/publish-images.sh: correctos.
- docker compose up -d --build backend frontend: exit 0; compilaciones NestJS/Vite correctas, servicios recreados con volúmenes existentes y DB healthy. Logs recientes y Swagger 200 por web actual.
- docker build -t josuerauda117/registro-academico-upam-database:2026.11.24 ./database: exit 0. Runtime solo esquema, defaults de settings y rol limitado. Inspección de archivos: no INSERT INTO users ni /tmp/init.sql en imagen database; backend sin /app/.env o .env.portainer.
- docker compose --env-file <QA independiente> -f docker-compose.portainer.yml config --quiet: exit 0, sin expandir secretos a salida.
- Stack QA -p upam-hub-qa, con puerto 18082 ligado a loopback, up -d --wait --wait-timeout 120: exit 0 y tres servicios healthy. Solo frontend publica puerto. Web / y /api/docs: 200.
- docker compose ... exec -T backend node < backend/test/docker-distribution.cjs: {"result":"passed","checks":15,"credentialsPrinted":false}. Comprueba administrador con hash bcrypt propio y rol correcto; reintento no crea usuario; contraseña corta rechazada; sin estudiantes/materias; settings presente; app DB sin tres flags privilegiados; login, settings autenticado, Swagger y plantilla correctos.
- QA down sin -v completado; contenedores de prueba retirados y volúmenes conservados. No se detuvo ningún proyecto ajeno. Archivos temporales de credenciales de QA retirados.

## Registro remoto

Los tres docker push finalizaron con exit 0 y los digest siguientes:

| Imagen (namespace josuerauda117, tag 2026.11.24) | Digest OCI |
| --- | --- |
| registro-academico-upam-backend | sha256:a01d9972698a63b4e29eede22d4fd3d6dd66abdcdacc72a0ed34f5dc0b1a9f6e |
| registro-academico-upam-frontend | sha256:40fd4d5061123c3735605b032a1cf303e9785cd835f9e128a7dc80f2f8e9258b |
| registro-academico-upam-database | sha256:c2e579b2a090e3ac7b7fc2a221b930cf92765fc13d752438ec94fc9c46d82397 |

Verificación posterior con solicitud de token anónimo a auth.docker.io y lectura de manifiestos registry-1.docker.io: los tres accesibles públicamente, con los digest indicados y plataforma linux/amd64. Tokens efímeros en memoria, sin imprimirse ni guardarse. El rechazo inicial automático del push backend se resolvió con confirmación explícita del usuario del namespace y los tres repositorios públicos antes de reintentar.

No se probaron nuevos recorridos académicos ni las suites completas: cambios de empaquetado/bootstrap verificados por compilación, inspección e instalación nueva. Sin interfaz Portainer o TLS probados; no hay despliegue remoto automático.
