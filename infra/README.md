# Infra MiPlata — Terraform

Infraestructura AWS para MiPlata: VPC, RDS Postgres 16 (cifrado KMS), S3, EC2 Ubuntu 22.04 con NestJS + Caddy.

## Requisitos previos

- Terraform >= 1.7
- AWS CLI configurado (`aws configure`)
- Credenciales con permisos EC2, RDS, VPC, KMS, S3, IAM

## Uso

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # completar valores reales
terraform init
terraform plan
terraform apply
```

## Variables

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `aws_region` | Región AWS | No (default `us-east-1`) |
| `project` | Nombre del proyecto | No (default `miplata`) |
| `environment` | Entorno | No (default `prod`) |
| `domain_name` | Dominio completo (ej. `miplata.skaspace.bid`) | Sí |
| `repo_url` | URL GitHub del repo a clonar en EC2 | Sí |
| `db_username` | Usuario RDS | No (default `miplata`) |
| `db_password` | Password RDS — generar con `openssl rand -hex 24` | Sí |
| `jwt_secret` | Secret JWT — generar con `openssl rand -hex 32` | Sí |
| `ssh_allowed_cidr` | CIDR para SSH. Usar `<tu-ip>/32`, no `0.0.0.0/0` | No |

**IMPORTANTE**: usar `openssl rand -hex` para los secretos, nunca `base64`.
Base64 genera caracteres `+/=` y saltos de línea que rompen el parsing de `DATABASE_URL`.

## Recursos creados

- VPC con 2 AZ (subnets públicas y privadas)
- RDS Postgres 16.4 `db.t4g.micro`, cifrado KMS, backup 1 día (Free Tier)
- S3 privado versionado + cifrado AES256
- EC2 `t3.small` Ubuntu 22.04 LTS con Node 20, pnpm, Caddy, systemd
- KMS key dedicada para RDS
- EIP (IP pública fija) asociada al EC2

## DNS — Cloudflare

El DNS **debe estar en modo "DNS only" (nube gris)**, no "Proxied" (naranja).
Con Proxied, Cloudflare termina TLS antes de que llegue al servidor y Let's Encrypt
no puede completar el challenge `tls-alpn-01`. Caddy no obtendrá el certificado.

## Rotación de secretos

Solo RDS sin recrear EC2:
```bash
# 1. Generar nueva password
openssl rand -hex 24

# 2. Actualizar terraform.tfvars con la nueva password

# 3. Aplicar solo el RDS
terraform apply -target=aws_db_instance.main

# 4. Actualizar .env en el servidor
ssh ubuntu@<ec2-ip>
sudo nano /opt/miplata/backend/.env   # cambiar DATABASE_URL
sudo systemctl restart miplata
```

## Recrear EC2 (nuevo deploy desde cero)

```bash
terraform apply -replace="aws_instance.backend"
```

El `user-data.sh` clona el repo, instala dependencias, corre Prisma y levanta los servicios automáticamente.

## Archivos sensibles

- `terraform.tfvars` — **en .gitignore**, nunca commitear
- `terraform.tfstate` — **en .gitignore**, contiene valores sensibles en texto plano
- `terraform.tfstate.backup` — **en .gitignore**
