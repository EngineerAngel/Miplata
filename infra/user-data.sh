#!/bin/bash
set -euo pipefail

# MiPlata - user-data para EC2 (Amazon Linux 2023)
# Variables provistas por Terraform: db_host, db_user, db_password, db_name, jwt_secret, domain, repo_url

# 1) Node 20 + pnpm + git
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs git tar

corepack enable
corepack prepare pnpm@9.14.2 --activate

# 2) Caddy (repo copr, epel-9 compatible con Amazon Linux 2023)
dnf install -y 'dnf-command(copr)'
dnf copr enable -y @caddy/caddy epel-9-x86_64
dnf install -y caddy

# 3) Clonar repo
rm -rf /opt/miplata
git clone "${repo_url}" /opt/miplata

# 4) Instalar dependencias del monorepo (desde la raiz, sin frozen-lockfile)
cd /opt/miplata
pnpm install

# 5) Backend: env + prisma + build
cd /opt/miplata/backend
cat > .env <<EOF
DATABASE_URL=postgresql://${db_user}:${db_password}@${db_host}:5432/${db_name}?schema=public
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=https://${domain}
EOF

pnpm exec prisma generate
pnpm exec prisma db push --accept-data-loss
pnpm exec ts-node prisma/seed.ts
pnpm build

# 6) Frontend: env + build
cd /opt/miplata/frontend
cat > .env <<EOF
VITE_API_URL=https://${domain}/api
EOF

pnpm build

# 7) Caddy config
cp /opt/miplata/infra/Caddyfile /etc/caddy/Caddyfile
chown caddy:caddy /etc/caddy/Caddyfile

# 8) Permisos frontend dist para Caddy
chown -R caddy:caddy /opt/miplata/frontend/dist

# 9) systemd backend
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
