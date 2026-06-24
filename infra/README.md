# Infra MiPlata — Terraform

Infraestructura AWS para MiPlata: VPC, RDS Postgres 16 (cifrado KMS), S3 para archivos, EC2 para backend NestJS.

## Uso

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # editar valores
terraform init
terraform plan
terraform apply
```

## Variables necesarias

| Variable | Descripción |
|----------|-------------|
| `aws_region` | Región AWS (default `us-east-1`) |
| `domain_name` | Subdominio (ej. `finanzas.tudominio.com`) |
| `db_username` | Usuario RDS |
| `db_password` | Password RDS (sensible) |
| `jwt_secret` | Secreto JWT (sensible) |

## Recursos creados

- VPC con 2 AZ (subnets públicas y privadas)
- RDS Postgres 16.2 `db.t4g.micro`, cifrado KMS, backups 7 días
- S3 privado versionado + cifrado AES256 (estados de cuenta, reportes)
- EC2 `t3.small` Amazon Linux 2023 con Node 20 + systemd
- KMS key dedicada para RDS

> CloudFront + ACM + Route 53 se agregan al apuntar el dominio real.
