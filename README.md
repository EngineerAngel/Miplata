# MiPlata — Sistema de Finanzas Personales

> Aplicación web de gestión de finanzas personales con análisis de indicadores CONDUSEF. Proyecto educativo enfocado en arquitectura escalable y buenas prácticas de desarrollo.

![Live](https://img.shields.io/badge/status-live-brightgreen) [![GitHub](https://img.shields.io/badge/github-EngineerAngel/Miplata-blue)](https://github.com/EngineerAngel/Miplata)

## Acerca del Proyecto

MiPlata es un **proyecto de curiosidad y aprendizaje** desarrollado para explorar cómo se estructura una aplicación full-stack moderna y escalable. El objetivo no fue resolver un problema específico, sino entender:

- Cómo organizar un monorepo con backend y frontend separados
- Cómo implementar autenticación segura con JWT
- Cómo desplegar infraestructura en AWS de forma reproducible (Terraform)
- Cómo escribir código mantenible en una escala media
- El flujo completo: desarrollo → testing → deployment en producción

**Nota:** Este proyecto fue desarrollado con asistencia de [Claude Code](https://claude.com/claude-code), un IDE con IA. El código está íntegramente en el repositorio para que puedas revisar la arquitectura y las decisiones de diseño.

---

## Demo en Vivo

**URL:** [https://miplata.skaspace.bid](https://miplata.skaspace.bid)

**Credenciales de prueba:**
- Email: `angel@miplata.local`
- Password: `miplata123`

---

## Stack Tecnológico

### Backend
- **Framework:** NestJS 10 (TypeScript)
- **Base de datos:** PostgreSQL 16 con Prisma 5 (ORM)
- **Autenticación:** JWT + bcrypt
- **Validación:** class-validator

### Frontend
- **Framework:** React 18 + Vite 5
- **Lenguaje:** TypeScript
- **Styling:** Tailwind CSS
- **Cliente HTTP:** Axios
- **Routing:** React Router 6

### Infraestructura
- **Servidor:** AWS EC2 t3.small (Ubuntu 22.04)
- **Base de datos:** AWS RDS PostgreSQL 16 (db.t4g.micro)
- **Reverse proxy:** Caddy (HTTPS automático con Let's Encrypt)
- **IaC:** Terraform (AWS provider v5)
- **Almacenamiento:** AWS S3 (privado, versionado)
- **Cifrado:** AWS KMS

---

## Características

✅ **Autenticación segura** — Login/Register con JWT, contraseñas hasheadas con bcrypt

✅ **Dashboard con indicadores financieros** — Visualización de deuda/ingreso, fondo de emergencia, utilización de crédito, regla 50/30/20

✅ **Gestión de transacciones** — Crear, editar, clasificar por categoría

✅ **Análisis CONDUSEF** — Indicadores basados en estándares de la Comisión Nacional Bancaria

✅ **HTTPS con certificado válido** — Let's Encrypt automático

✅ **Responsive** — Interfaz adaptable a móvil, tablet, desktop

---

## Estructura del Proyecto

```
├── backend/              # API REST (NestJS)
│   ├── src/
│   │   ├── auth/        # Módulo de autenticación
│   │   ├── usuarios/    # Módulo de usuarios
│   │   ├── transacciones/ # Módulo de transacciones
│   │   ├── salud/       # Cálculo de indicadores
│   │   └── main.ts
│   ├── prisma/          # Schema de BD y migrations
│   └── package.json
│
├── frontend/             # SPA (React + Vite)
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Páginas (Dashboard, Login, etc)
│   │   ├── services/    # Llamadas a API
│   │   └── main.tsx
│   └── package.json
│
├── infra/               # Infraestructura (Terraform)
│   ├── provider.tf      # Configuración de AWS
│   ├── ec2.tf          # Servidor
│   ├── rds.tf          # Base de datos
│   ├── vpc.tf          # Red
│   ├── s3.tf           # Almacenamiento
│   ├── user-data.sh    # Script de inicialización del servidor
│   └── Caddyfile       # Configuración del reverse proxy
│
├── pnpm-workspace.yaml  # Configuración del monorepo
└── package.json        # Dependencias compartidas
```

---

## Inicio Rápido

### Prerequisitos
- **Node.js** ≥ 20.x
- **pnpm** 9.14.2+ (`npm install -g pnpm`)
- **PostgreSQL** 15+ (local) o usar Docker

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/EngineerAngel/Miplata.git
cd Miplata

# 2. Instalar dependencias del monorepo
pnpm install

# 3. Configurar variables de entorno
cd backend
echo "DATABASE_URL=postgresql://usuario:password@localhost:5432/miplata" > .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
cd ../frontend
echo "VITE_API_URL=http://localhost:4000/api" > .env
cd ..

# 4. Ejecutar base de datos
cd backend
pnpm exec prisma migrate dev  # crea BD y tablas
pnpm exec prisma db seed      # carga datos iniciales
cd ..

# 5. Iniciar servidor de desarrollo
pnpm dev
```

**Backend** estará en `http://localhost:4000`
**Frontend** estará en `http://localhost:5173`

---

## Deployment en AWS

La infraestructura está completamente definida en Terraform. Para desplegar:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars

# Editar terraform.tfvars con tus valores:
# - domain_name: tu dominio (ej. app.tudominio.com)
# - db_password: contraseña segura (openssl rand -hex 24)
# - jwt_secret: secreto JWT (openssl rand -hex 32)
# - ssh_allowed_cidr: tu IP/32

terraform init
terraform plan
terraform apply
```

El `user-data.sh` automatiza:
- Instalación de Node.js, pnpm, Caddy
- Clonación del repositorio
- Instalación de dependencias
- Creación de la base de datos
- Compilación de frontend y backend
- Configuración de systemd y HTTPS automático

**Logs del servidor:** `ssh ubuntu@<ip>` → `journalctl -u miplata -f`

---

## Decisiones Arquitectónicas

### ¿Por qué NestJS en lugar de Express?
NestJS obliga a estructura desde el inicio (módulos, controllers, services). Es más verboso, pero escala mejor. Express es libre pero rápidamente se vuelve caótico.

### ¿Por qué Terraform?
Para que cualquier persona (o CI/CD) pueda replicar la infraestructura exacta. No hay pasos manuales en AWS Console que se olviden o diverjan.

### ¿Por qué Caddy?
Reverse proxy moderno que obtiene certificados Let's Encrypt automáticamente. No requiere renovaciones manuales o certificados autofirmados.

### ¿Por qué Prisma?
ORM type-safe que genera migrations automáticas y validación en tiempo de compilación. Menos errores en BD.

---

## Lo que Aprendí

- **Infraestructura como código** es crítico para reproducibilidad
- **Monorepos con pnpm** facilitan compartir tipos entre backend y frontend
- **JWT + refresh tokens** es más seguro que sesiones en cookies para APIs
- **Validación en dos capas** (DTO + class-validator + Prisma) previene muchos bugs
- **HTTPS en producción es obligatorio**, no opcional
- **El deploy manual es frágil** — pequeños pasos olvidados rompen todo

---

## Próximas Mejoras

- [ ] CRUD completo de tarjetas de crédito
- [ ] Importación de transacciones desde CSV
- [ ] Alertas presupuestarias (email)
- [ ] Gráficos de tendencia de gastos
- [ ] Autenticación con Google/GitHub
- [ ] Autenticación 2FA
- [ ] Tests unitarios y E2E

---

## Cómo Usar Este Proyecto

**Si eres reclutador:**
- Lee `CLAUDE.md` en la raíz — contiene el runbook de deploy y errores conocidos
- Lee `infra/README.md` — detalles de Terraform
- Explora `backend/src` — arquitectura con módulos, services, DTOs
- Explora `frontend/src` — estructura con hooks custom, páginas, componentes

**Si quieres aprender:**
- Clona el repo
- Corre `pnpm dev` localmente
- Intenta agregar una nueva feature (ej. CRUD de tarjetas)
- Estudia cómo los cambios fluyen: frontend → API → BD

**Si quieres deployar:**
- Ve a `infra/README.md`
- Sigue los pasos con tu propio dominio y AWS Account

---

## Licencia

Este proyecto es de código abierto y está disponible bajo licencia MIT.

---

## Contacto

- **GitHub:** [@EngineerAngel](https://github.com/EngineerAngel)
- **Email:** ag4648413@gmail.com

---

**Hecho con curiosidad y Claude Code.** 🚀
