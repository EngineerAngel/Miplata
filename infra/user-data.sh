#!/bin/bash
set -euo pipefail

# MiPlata - user-data para EC2 (Amazon Linux 2023)
# Instala Node 20, pnpm, Caddy; clona repo, construye backend + frontend, arranca servicios
# Variables provistas por Terraform: db_host, db_user, db_name, jwt_secret, domain, repo_url

# 1) Node 20 + pnpm + git
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs git tar

corepack enable
corepack prepare pnpm@9.14.2 --activate

# 2) Caddy (repo oficial copr)
dnf install -y 'dnf-command(copr)'
dnf copr enable -y @caddy/caddy
dnf install -y caddy

# 3) Clonar repo
mkdir -p /opt/miplata
git clone "${repo_url}" /opt/miplata 2>/dev/null || (cd /opt/miplata && git pull)

# 4) Backend
cd /opt/miplata/backend
cat > .env <<EOF
DATABASE_URL=postgresql://${db_user}:CHANGE_ME@${db_host}:5432/${db_name}?schema=public
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=https://${domain}
EOF

pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm build

# 5) Frontend
cd /opt/miplata/frontend
cat > .env <<EOF
VITE_API_URL=https://${domain}/api
EOF

pnpm install --frozen-lockfile
pnpm build

# 6) Caddy config
cp /opt/miplata/infra/Caddyfile /etc/caddy/Caddyfile
chown caddy:caddy /etc/caddy/Caddyfile

# 7) Permisos frontend dist para Caddy
chown -R caddy:caddy /opt/miplata/frontend/dist

# 8) systemd backend
cat > /etc/systemd/system/miplata.service <<EOF
[Unit]
Description=MiPlata Backend (NestJS)
After=network.target

[Service]
WorkingDirectory=/opt/miplata/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
User=root
EnvironmentFile=/opt/miplata/backend/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now miplata
systemctl enable --now caddy
systemctl restart caddy

echo "✅ MiPlata desplegado en https://${domain}"
