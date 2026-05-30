#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT=${DEPLOY_ROOT:-/opt/semanticzap}
APP_NAME=semanticzap-admin
APP_DIR="${DEPLOY_ROOT}/${APP_NAME}"
CONFIG_FILE="${DEPLOY_ROOT}/config/${APP_NAME}.env"
UPSTREAM_FILE="${DEPLOY_ROOT}/shared/nginx/upstreams/admin.conf"
BOOTSTRAP_SCRIPT="${APP_DIR}/bootstrap-shared.sh"
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"
ACTIVE_FILE="${APP_DIR}/active_color"

if [ -z "${IMAGE_REF:-}" ]; then
  echo "IMAGE_REF is required" >&2
  exit 1
fi

if [ -z "${REGISTRY_TOKEN:-}" ]; then
  echo "REGISTRY_TOKEN is required" >&2
  exit 1
fi

bash "${BOOTSTRAP_SCRIPT}"

install -m 644 "${APP_DIR}/${APP_NAME}.env.example" "${DEPLOY_ROOT}/config/${APP_NAME}.env.example"

if [ ! -f "${CONFIG_FILE}" ]; then
  echo "Missing ${CONFIG_FILE}. Copy ${DEPLOY_ROOT}/config/${APP_NAME}.env.example and fill production values." >&2
  exit 1
fi

current_color=""
if [ -f "${ACTIVE_FILE}" ]; then
  current_color=$(cat "${ACTIVE_FILE}")
fi

next_color="blue"
host_port="3001"
if [ "${current_color}" = "blue" ]; then
  next_color="green"
  host_port="3002"
elif [ "${current_color}" = "green" ]; then
  next_color="blue"
  host_port="3001"
fi

project_name="${APP_NAME}-${next_color}"

printf '%s' "${REGISTRY_TOKEN}" | docker login -u oauth2accesstoken --password-stdin https://us-east1-docker.pkg.dev >/dev/null

IMAGE_REF="${IMAGE_REF}" HOST_PORT="${host_port}" docker compose -p "${project_name}" -f "${COMPOSE_FILE}" pull app worker
IMAGE_REF="${IMAGE_REF}" HOST_PORT="${host_port}" docker compose -p "${project_name}" -f "${COMPOSE_FILE}" run --rm --no-deps app npx prisma migrate deploy
IMAGE_REF="${IMAGE_REF}" HOST_PORT="${host_port}" docker compose -p "${project_name}" -f "${COMPOSE_FILE}" up -d app worker

for _ in $(seq 1 30); do
  if curl --fail --silent "http://127.0.0.1:${host_port}/api/health" >/dev/null; then
    break
  fi
  sleep 2
done

if ! curl --fail --silent "http://127.0.0.1:${host_port}/api/health" >/dev/null; then
  echo "Admin candidate failed health check on port ${host_port}" >&2
  IMAGE_REF="${IMAGE_REF}" HOST_PORT="${host_port}" docker compose -p "${project_name}" -f "${COMPOSE_FILE}" logs --tail=100
  exit 1
fi

if ! IMAGE_REF="${IMAGE_REF}" HOST_PORT="${host_port}" docker compose -p "${project_name}" -f "${COMPOSE_FILE}" ps --status running worker | grep -q worker; then
  echo "Admin worker is not running for color ${next_color}" >&2
  IMAGE_REF="${IMAGE_REF}" HOST_PORT="${host_port}" docker compose -p "${project_name}" -f "${COMPOSE_FILE}" logs --tail=100 worker
  exit 1
fi

tmp_upstream=$(mktemp)
cat > "${tmp_upstream}" <<EOF
set \$admin_upstream http://127.0.0.1:${host_port};
EOF
install -m 644 "${tmp_upstream}" "${UPSTREAM_FILE}"
rm -f "${tmp_upstream}"

nginx -t
systemctl reload nginx

echo "${next_color}" > "${ACTIVE_FILE}"

if [ -n "${current_color}" ] && [ "${current_color}" != "${next_color}" ]; then
  old_port="3001"
  if [ "${current_color}" = "green" ]; then
    old_port="3002"
  fi
  IMAGE_REF="${IMAGE_REF}" HOST_PORT="${old_port}" docker compose -p "${APP_NAME}-${current_color}" -f "${COMPOSE_FILE}" down --remove-orphans
fi

docker logout https://us-east1-docker.pkg.dev >/dev/null 2>&1 || true
