#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
namespace="${DOCKERHUB_NAMESPACE:-josuerauda117}"
tag="${1:?Indica un tag nuevo, por ejemplo 2026.11.24.2}"
case "$namespace" in ''|*[!a-z0-9_-]*) echo 'Namespace Docker Hub inválido' >&2; exit 1;; esac
case "$tag" in ''|*[!a-zA-Z0-9_.-]*) echo 'Tag inválido' >&2; exit 1;; esac
# Authenticate once with docker login. Credentials are never passed in build arguments.
docker build -t "$namespace/registro-academico-upam-database:$tag" ./database
docker build -t "$namespace/registro-academico-upam-backend:$tag" ./backend
docker build -t "$namespace/registro-academico-upam-frontend:$tag" ./frontend
for component in database backend frontend; do
  docker push "$namespace/registro-academico-upam-$component:$tag"
done
