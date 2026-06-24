# MiPlata — Contexto para Claude Code

## Stack
- **Monorepo**: pnpm workspaces, Node >=20, pnpm 9.14.2
- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL, JWT, bcrypt, class-validator
- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind CSS
- **Infra**: Terraform (AWS provider ~>5.0), EC2 t3.small Ubuntu 22.04, RDS Postgres 16 db.t4g.micro, Caddy reverse proxy + Let's Encrypt

## Producción
- URL: https://miplata.skaspace.bid
- EC2 IP: 54.161.142.44 (EIP fija)
- Backend: puerto 4000 (NestJS), systemd `miplata.service`, usuario `miplata`
- Frontend: `/opt/miplata/frontend/dist`, servido por Caddy
- .env backend: `/opt/miplata/backend/.env` (chmod 600, dueño miplata)
- Logs backend: `journalctl -u miplata -f`
- Logs Caddy: `/var/log/caddy/miplata.log`

## Flujo de deploy manual (tras git push)

```bash
# En el servidor (ssh ubuntu@54.161.142.44)
cd /opt/miplata
sudo -u miplata git pull origin main

# Si cambia backend:
cd backend && sudo -u miplata pnpm build
sudo systemctl restart miplata

# Si cambia frontend:
sudo chown -R miplata:miplata /opt/miplata/frontend/dist
sudo -u miplata sh -c 'cd /opt/miplata && pnpm --filter frontend build'
sudo chown -R caddy:caddy /opt/miplata/frontend/dist

# Si cambia Caddyfile:
sudo cp /opt/miplata/infra/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Errores conocidos — NO repetir

### SSH: usuario correcto es `ubuntu`
```bash
ssh -i ~/.ssh/miplata.pem ubuntu@54.161.142.44   # CORRECTO
# ec2-user → Permission denied (es Amazon Linux, no Ubuntu)
```

### Permisos tras instalar dependencias como root
Si se ejecutó `pnpm install` como root, `node_modules` queda dueño de root y falla al correr como `miplata`:
```bash
sudo chown -R miplata:miplata /opt/miplata
```

### Frontend dist bloqueado por Caddy al hacer rebuild
Caddy sirve `frontend/dist` como usuario `caddy`; si el dist es de caddy, `pnpm build` como `miplata` falla con EACCES:
```bash
sudo chown -R miplata:miplata /opt/miplata/frontend/dist
sudo -u miplata pnpm --filter frontend build
sudo chown -R caddy:caddy /opt/miplata/frontend/dist   # devolver a caddy
```

### Caddy 405 en POST /api/*
`try_files` antes de `reverse_proxy` atrapa `/api/*` y devuelve `index.html` con 405.
El Caddyfile usa `handle` blocks en orden: primero `/api/*` → reverse_proxy, luego `handle` → file_server. No cambiar ese orden.

### Frontend llama localhost:4000
Significa que falta `VITE_API_URL` en `frontend/.env` antes del build:
```bash
echo 'VITE_API_URL=https://miplata.skaspace.bid/api' | sudo -u miplata tee /opt/miplata/frontend/.env
```
Luego rebuild frontend.

### Secretos: usar HEX, nunca base64
Base64 genera newlines y caracteres `+/=` que rompen el parsing de `DATABASE_URL` en la URL de Postgres y en Terraform.
```bash
openssl rand -hex 32   # para jwt_secret
openssl rand -hex 24   # para db_password
```

### RDS password drift
Si terraform.tfvars tiene una contraseña diferente a la que está en RDS, `terraform apply` intentará actualizar la instancia (tarda 15+ min). Antes de aplicar, verificar que `db_password` en tfvars coincide con el `.env` del backend y con el RDS actual.

### Cloudflare DNS: modo "DNS only" (gris), NO "Proxied" (naranja)
Con Proxied, Cloudflare termina TLS y bloquea el challenge tls-alpn-01 de Let's Encrypt. Caddy no puede obtener el certificado. El registro DNS debe ser gris (DNS only) para que el cert funcione.

## Seed de usuario inicial
El seed crea `angel@miplata.local` / `miplata123` solo si no existe ningún usuario.
**Cambiar esta contraseña en producción** via la API o directamente en la BD.

## Variables de entorno requeridas

### Backend (`/opt/miplata/backend/.env`)
```
DATABASE_URL=postgresql://miplata:<password>@<rds-host>:5432/miplata?schema=public
JWT_SECRET=<hex-64-chars>
JWT_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=https://miplata.skaspace.bid
```

### Frontend (`/opt/miplata/frontend/.env` o en local `frontend/.env.local`)
```
VITE_API_URL=https://miplata.skaspace.bid/api
```

## Terraform
- `terraform.tfvars` está en `.gitignore` — nunca commitear
- Secrets generados con `openssl rand -hex`
- Para rotar solo RDS sin recrear todo: `terraform apply -target=aws_db_instance.main`
- Para recrear EC2 (nuevo deploy): `terraform apply -replace="aws_instance.backend"`
- Estado local en `infra/terraform.tfstate` — respaldar antes de operaciones destructivas
