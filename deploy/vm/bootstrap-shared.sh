#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT=${DEPLOY_ROOT:-/opt/semanticzap}
SHARED_DIR="${DEPLOY_ROOT}/shared"
CONFIG_DIR="${DEPLOY_ROOT}/config"

mkdir -p "${SHARED_DIR}/nginx/upstreams" "${CONFIG_DIR}" "${DEPLOY_ROOT}/semanticzap-admin" "${DEPLOY_ROOT}/semanticzap-agent-service"

if ! docker network inspect semanticzap-core >/dev/null 2>&1; then
  docker network create semanticzap-core >/dev/null
fi

cat > "${SHARED_DIR}/docker-compose.infra.yml" <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: semanticzap-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: semanticzap
      POSTGRES_PASSWORD: semanticzap
      POSTGRES_DB: semanticzap
    volumes:
      - semanticzap_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U semanticzap -d semanticzap"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  redis:
    image: redis:7-alpine
    container_name: semanticzap-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - semanticzap_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

networks:
  backend:
    external: true
    name: semanticzap-core

volumes:
  semanticzap_postgres_data:
  semanticzap_redis_data:
EOF

if [ ! -f "${SHARED_DIR}/nginx/upstreams/admin.conf" ]; then
  cat > "${SHARED_DIR}/nginx/upstreams/admin.conf" <<'EOF'
set $admin_upstream http://127.0.0.1:3001;
EOF
fi

if [ ! -f "${SHARED_DIR}/nginx/upstreams/agent-service.conf" ]; then
  agent_upstream_port="8001"
  if curl --silent --fail http://127.0.0.1:8200/health >/dev/null 2>&1; then
    agent_upstream_port="8200"
  fi
  cat > "${SHARED_DIR}/nginx/upstreams/agent-service.conf" <<'EOF'
set $agent_service_upstream http://127.0.0.1:__AGENT_UPSTREAM_PORT__;
EOF
  sed -i "s/__AGENT_UPSTREAM_PORT__/${agent_upstream_port}/" "${SHARED_DIR}/nginx/upstreams/agent-service.conf"
fi

cat > /etc/nginx/conf.d/semanticzap-admin.conf <<'EOF'
server {
    listen 3000;
    server_name _;
    client_max_body_size 20m;

    include /opt/semanticzap/shared/nginx/upstreams/admin.conf;

    location / {
        proxy_pass $admin_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
EOF

cat > /etc/nginx/conf.d/semanticzap-agent-service.conf <<'EOF'
server {
    listen 8000;
    server_name _;
    client_max_body_size 20m;

    include /opt/semanticzap/shared/nginx/upstreams/agent-service.conf;

    location / {
        proxy_pass $agent_service_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
EOF

if [ ! -f "${CONFIG_DIR}/semanticzap-admin.env.example" ]; then
  cat > "${CONFIG_DIR}/semanticzap-admin.env.example" <<'EOF'
# Copy to semanticzap-admin.env and fill production values.
DATABASE_URL=postgresql://semanticzap:semanticzap@semanticzap-postgres:5432/semanticzap
REDIS_URL=redis://semanticzap-redis:6379/0
INTERNAL_API_SECRET=change-me
INTERNAL_API_BASE_URL=http://app:3000
PYTHON_SERVICE_URL=http://host.docker.internal:8000
NEXT_TELEMETRY_DISABLED=1
EOF
fi

if [ ! -f "${CONFIG_DIR}/semanticzap-agent-service.env.example" ]; then
  cat > "${CONFIG_DIR}/semanticzap-agent-service.env.example" <<'EOF'
# Copy to semanticzap-agent-service.env and fill production values.
REDIS_URL=redis://semanticzap-redis:6379/0
INTERNAL_API_SECRET=change-me
OPENAI_API_KEY=change-me
EOF
fi

docker compose -f "${SHARED_DIR}/docker-compose.infra.yml" up -d
nginx -t
systemctl reload nginx
