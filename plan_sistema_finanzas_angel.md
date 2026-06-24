# 💰 MiPlata — Sistema de Finanzas Personales
> **Angel** · Querétaro, MX · Iniciado: Junio 2026 · Revisado: Junio 2026

---

## 📌 Contexto del Proyecto

Sistema web personal para gestionar gastos, ingresos, tarjetas de crédito y salud financiera. Con potencial de escalar a SaaS. Desplegado en AWS con subdominio propio.

| Dato | Valor |
|------|-------|
| Ingreso fijo | $4,800 / quincena ($9,600/mes) |
| Ingreso variable | $100–$200 / mes |
| Ingreso total estimado | ~$9,700–$9,800 / mes |
| Plataforma financiera principal | Revolut Metal |
| Idioma del sistema | Español (es-MX) |
| Dominio de producción | `miplata.skaspace.bid` |
| Repositorio | `github.com/EngineerAngel/Miplata` |

---

## 🧱 Stack Técnico Actual

```
Monorepo:   pnpm workspaces (Node >=20, pnpm >=9)
Frontend:   React 18 + Vite 5 + TypeScript + Tailwind CSS (tema dark)
              react-router-dom 6, axios, xlsx, date-fns, lucide-react, clsx, react-hot-toast
Backend:    NestJS 10 + TypeScript + Prisma 5 (PostgreSQL)
              @nestjs/jwt + passport-jwt, bcrypt, class-validator, class-transformer
Base datos: PostgreSQL 16 (local: docker-compose; prod: AWS RDS)
Auth:       JWT + bcrypt (passport-jwt strategy)
Deploy:     AWS EC2 (t3.small, Amazon Linux 2023) + Caddy (reverse proxy + TLS automático)
DNS/SSL:    Caddy (Let's Encrypt) — pendiente Route 53 + dominio real apuntado
Storage:    S3 privado versionado + cifrado AES256 (estados de cuenta, reportes)
Cifrado:    RDS cifrado con KMS (repositoro); TLS vía Caddy en tránsito
Infra:      Terraform >=1.7 (provider AWS ~>5.0)
```

> ⚠️ El plan original mencionaba Express o FastAPI y CloudFront + ALB. **Lo implementado es NestJS + Caddy sobre EC2**, más simple y suficiente para MVP.

---

## 📁 Estructura Real del Proyecto

```
Miplata/
├── backend/                      # NestJS + Prisma
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts         # importa ConfigModule, Prisma, Auth, Salud
│   │   ├── main.ts               # prefix /api, ValidationPipe, CORS
│   │   ├── auth/                 # register, login, me (JWT)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── dto/ (register.dto.ts, login.dto.ts)
│   │   │   ├── guards/jwt-auth.guard.ts
│   │   │   └── decorators/current-user.decorator.ts
│   │   ├── salud/                # dashboard de salud financiera (CONDUSEF)
│   │   │   ├── salud.controller.ts
│   │   │   ├── salud.service.ts
│   │   │   └── salud.module.ts
│   │   └── prisma/               # PrismaService + módulo
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts               # categorías + usuario inicial
│   ├── routes/                   # (vacío — residuo del plan Express, usar módulos NestJS)
│   ├── middleware/               # (vacío — residuo)
│   ├── models/                   # (vacío — residuo)
│   └── package.json
├── frontend/                     # React + Vite + TS + Tailwind
│   ├── src/
│   │   ├── api/                  # client.ts (axios + interceptores), auth.ts, salud.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ui/ (Button, Card, IndicadorCard, Input)
│   │   ├── context/AuthContext.tsx
│   │   ├── hooks/useAuth.ts
│   │   ├── pages/ (Dashboard, Login, Placeholder)
│   │   ├── types/index.ts
│   │   ├── utils/                # (vacío por ahora)
│   │   ├── App.tsx               # rutas: /login, /, /transacciones, /tarjetas, /salud
│   │   └── main.tsx
│   ├── tailwind.config.js        # tema dark con tokens primary/accent/surface
│   ├── vite.config.ts            # puerto 3000 + proxy /api → :4000
│   └── package.json
├── infra/                        # Terraform AWS + Caddyfile + user-data
│   ├── provider.tf               # variables, locals, tags
│   ├── vpc.tf                    # VPC + 2 AZ (public/private)
│   ├── rds.tf                    # Postgres 16.2 db.t4g.micro + KMS
│   ├── ec2.tf                    # t3.small + EIP + outputs
│   ├── s3.tf                     # bucket privado versionado + cifrado
│   ├── Caddyfile                 # miplata.skaspace.bid: estático + reverse_proxy /api
│   ├── user-data.sh              # Node 20, pnpm, Caddy, build, systemd
│   ├── terraform.tfvars.example
│   └── README.md
├── docker-compose.yml            # postgres:16-alpine + pgadmin (perfil opcional)
├── pnpm-workspace.yaml           # frontend, backend
├── package.json                  # scripts: dev, build, lint, db:up, prisma:*
├── .env.example
└── plan_sistema_finanzas_angel.md  # este documento
```

---

## 🗂️ Modelo de Datos (Prisma — actual)

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String                      // bcrypt hash
  nombre      String?
  ingresoFijo Decimal? @db.Decimal(10, 2)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt        @map("updated_at")
  tarjetas       Tarjeta[]
  transacciones  Transaccion[]
  @@map("users")
}

model Tarjeta {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  nombre       String
  banco        String?
  limite       Decimal? @db.Decimal(10, 2)
  saldoActual  Decimal  @default(0) @db.Decimal(10, 2) @map("saldo_actual")
  fechaCorte   Int?     @map("fecha_corte")     // día 1-31
  fechaLimite  Int?     @map("fecha_limite")    // día 1-31
  diasGracia   Int      @default(20) @map("dias_gracia")
  activa       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt        @map("updated_at")
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  transacciones Transaccion[]
  @@map("tarjetas")
}

model Transaccion {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  tarjetaId   String?  @map("tarjeta_id")
  tipo        TipoTransaccion             // ingreso | gasto
  monto       Decimal  @db.Decimal(10, 2)
  categoriaId Int?     @map("categoria_id")
  descripcion String?
  fecha       DateTime @db.Date
  createdAt   DateTime @default(now()) @map("created_at")
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  tarjeta   Tarjeta?   @relation(fields: [tarjetaId], references: [id], onDelete: SetNull)
  categoria Categoria? @relation(fields: [categoriaId], references: [id])
  @@index([userId, fecha])
  @@index([tarjetaId])
  @@map("transacciones")
}

model Categoria {
  id    Int      @id @default(autoincrement())
  nombre String
  tipo  TipoCategoria               // necesidad | gusto | ahorro
  icono String?
  transacciones Transaccion[]
  @@map("categorias")
}

enum TipoTransaccion { ingreso  gasto }
enum TipoCategoria   { necesidad  gusto  ahorro }
```

> Diferencias vs el SQL del plan v1.0: `Transaccion` ahora referencia `Categoria` por `categoria_id` (en lugar de campo `categoria` texto), y `User` tiene `updated_at`. Las categorías se siembran con `prisma:seed`.

---

## ✅ Estado de Funcionalidades

### Etapa 1 — MVP Personal

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Auth (register / login / me) con JWT | ✅ Hecho | `backend/src/auth`, bcrypt, passport-jwt |
| Dashboard de salud financiera | ✅ Hecho | endpoint `GET /api/salud` + página `Dashboard.tsx` |
| Indicadores CONDUSEF | ✅ Hecho | deuda/ingreso, fondo emergencia, utilización crédito, 50/30/20, puntualidad (fija 100%) |
| Layout + Sidebar + ProtectedRoute | ✅ Hecho | tema dark, rutas protegidas por token |
| Seed: categorías + usuario inicial | ✅ Hecho | `angel@miplata.local / miplata123` |
| Infraestructura Terraform (VPC/RDS/S3/EC2) | ✅ Hecho | `infra/`, user-data aprovisiona Node/pnpm/Caddy |
| CRUD de transacciones (ingresos y gastos) | 🔜 Pendiente | ruta `/transacciones` es placeholder |
| Módulo de tarjetas (CRUD, corte, límites) | 🔜 Pendiente | ruta `/tarjetas` es placeholder; solo lectura en dashboard |
| Página de Salud financiera (detalle) | 🔜 Pendiente | ruta `/salud` es placeholder; el endpoint ya existe |
| Alertas de fechas (corte / límite de pago) | 🔜 Pendiente | |
| Exportación a Excel (.xlsx) | 🔜 Pendiente | `xlsx` ya instalado en frontend |
| Carga de estados de cuenta PDF/CSV | 🔜 Pendiente | |

### Etapa 2 — Producto Serio (Mes 3–9)
- [ ] Importación de PDF/CSV de estados de cuenta
- [ ] Row-Level Security en PostgreSQL
- [ ] KMS + S3 para archivos (S3 ya creado en Terraform, falta integración app)
- [ ] Subdominios wildcard (CloudFront / Route 53)
- [ ] Aviso de privacidad + consentimiento expreso (LFPDPPP 2025)
- [ ] Onboarding de nuevos usuarios
- [ ] Score mensual de salud financiera

### Etapa 3 — SaaS (Mes 9+)
- [ ] Multi-tenancy completo
- [ ] Billing / planes de suscripción
- [ ] Integración con Syncfy/Belvo en producción
- [ ] Observabilidad por tenant (CloudWatch tags)

---

## 📊 Motor de Salud Financiera

Implementado en `backend/src/salud/salud.service.ts`. Indicadores CONDUSEF:

| Indicador | Fórmula | Meta | Alerta | Estado |
|-----------|---------|------|--------|--------|
| Ratio deuda/ingreso | Deudas mensuales / Ingreso | ≤ 35% | > 35% 🔴 | ✅ |
| Fondo de emergencia | Ahorro / Gastos mensuales | ≥ 3 meses | < 3 meses 🟡 | ✅ |
| Utilización de crédito | Saldo usado / Límite total | < 30% | > 70% 🔴, > 30% 🟡 | ✅ |
| Regla 50/30/20 | Necesidades/Gustos/Ahorro | 50/30/20 | desbalance > 10pts 🟡 | ✅ |
| Puntualidad de pagos | Pagos a tiempo / Total | 100% | pago tardío 🔴 | 🟡 Hardcode 100% (falta modelo de pagos) |

### Cálculo de referencia (base actual)

```
Ingreso mensual:     ~$9,700
35% máx. deudas:     ~$3,395 / mes
50% necesidades:     ~$4,850 / mes
30% gustos:          ~$2,910 / mes
20% ahorro/deuda:    ~$1,940 / mes
```

---

## 💳 Tarjetas de Crédito Registradas

| Tarjeta | Fecha de Corte | Fecha Límite | Días de Gracia | Configurable |
|---------|---------------|-------------|----------------|-------------|
| Stori | Día 12 ó 27 (fija) | ~20 días después | ~20 días | ❌ No |
| Nu | Asignada | Configurable desde app | ~10 días | ✅ Límite sí |
| Klar | Fija | 10 días después del corte | 10 días | 🔜 Próximamente |
| Ualá | Fija | ~20 días después | ~15–20 días | ❌ No |
| Bradescard | Ej: corte día 3, pago día 26 | Asignada | ~23 días | ❌ No |
| Mercado Pago | ~10 días antes del límite | Asignada | ~10–25 días* | ❌ No |
| Revolut | Configurable | Configurable | Variable | ✅ Sí |

> ⚠️ *Mercado Pago tiene información inconsistente en sus propias páginas. Verificar en app.*

---

## 🏗️ Arquitectura de Despliegue (actual)

```
Usuario
  │
  ▼
Caddy (HTTPS / Let's Encrypt)        ← miplata.skaspace.bid
  │  sirve estáticos frontend (dist)
  │  reverse_proxy /api/* → 127.0.0.1:4000
  ▼
NestJS (systemd: miplata.service)    ← EC2 t3.small, Amazon Linux 2023
  │
  ├──▶ PostgreSQL RDS 16.2           ← db.t4g.micro, cifrado KMS, backups 7d
  └──▶ S3 (privado, versionado)      ← estados de cuenta / reportes (falta integrar)
```

Headers de seguridad configurados en `infra/Caddyfile`: HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.

> CloudFront + ACM + Route 53 quedan como siguiente paso al apuntar el dominio real y querer CDN/edge.

---

## 🔗 Open Banking — Estado Actual

| Proveedor | Sandbox Gratis | Producción | Cubre tus tarjetas |
|-----------|---------------|------------|-------------------|
| Belvo | ✅ Gratis | 💰 Pago (sales-led) | Mercado Pago (parcial), Nu (no confirmado) |
| Syncfy (Paybook) | ✅ Autoservicio | 💰 ~$65 USD/mes | Mercado Pago ✅, resto no confirmado |
| Finerio | ❌ Solo enterprise | 💰 Sin precio público | Bancos tradicionales solo |
| Prometeo | ❌ | 💰 | Pagos/verificación, no PFM |

> 💡 **Recomendación MVP**: Empezar con carga manual de CSV/PDF. Integrar Syncfy sandbox en v1.5 para probar Mercado Pago. Producción con API solo si el proyecto escala.

---

## 🔒 Cumplimiento Legal (LFPDPPP 2025)

> Ley publicada en DOF el **20 de marzo de 2025**, vigente desde el **21 de marzo de 2025**.
> Autoridad actual: **Secretaría Anticorrupción y Buen Gobierno (SABG)** (sustituyó al extinto INAI).

### Checklist de Cumplimiento
- [ ] Aviso de privacidad integral + simplificado (Art. 15)
- [ ] Consentimiento expreso documentado para datos financieros
- [ ] Mecanismo ARCO (Acceso, Rectificación, Cancelación, Oposición)
- [x] Cifrado AES-256 en reposo (RDS KMS + S3) + TLS en tránsito (Caddy)
- [ ] Protocolo de notificación inmediata de brechas
- [ ] Registro de tratamiento de datos
- [ ] No almacenar PANs completos de tarjetas

---

## 🚀 Cómo trabajar en el proyecto

```bash
# 1) Instalar dependencias (raíz)
pnpm install

# 2) Levantar Postgres local
pnpm db:up                       # docker compose up -d (postgres en :5432)

# 3) Backend
pnpm prisma:generate             # genera cliente Prisma
pnpm prisma:migrate              # crea/aplica migraciones
pnpm prisma:seed                 # categorías + usuario inicial
pnpm dev:backend                 # NestJS en http://localhost:4000/api

# 4) Frontend
pnpm dev:frontend                # Vite en http://localhost:3000 (proxy /api → :4000)

# 5) Todo a la vez
pnpm dev                         # backend + frontend en paralelo

# Utilidades
pnpm db:logs                     # logs de postgres
pnpm prisma:studio               # Prisma Studio en :5555
pnpm lint                        # eslint backend + frontend
pnpm build                       # build de ambos paquetes
```

Usuario de prueba (seed): `angel@miplata.local` / `miplata123`.

### Despliegue en AWS
```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # editar db_password y jwt_secret
terraform init
terraform plan
terraform apply
```
El `user-data.sh` instala Node 20 + pnpm + Caddy, clona el repo, corre migraciones, build y arranca `miplata.service` + Caddy.

---

## 📋 Próximos Pasos Inmediatos

1. **CRUD Transacciones** — módulo NestJS `transacciones/` + página con formulario y listado
2. **CRUD Tarjetas** — módulo NestJS `tarjetas/` + página con fechas de corte/límite
3. **Página de Salud** — consumir `GET /api/salud` con vista detallada (ya existe el endpoint)
4. **Modelo de Pagos** — para que `puntualidadPagos` deje de estar hardcodeada en 100%
5. **Exportación Excel** — `xlsx` ya instalado, falta botón de exportar en Dashboard
6. **Alertas de fechas** — notificar corte/límite próximo
7. **Apuntar dominio real** `miplata.skaspace.bid` a la EIP de EC2 y verificar Caddy TLS
8. **Limpiar residuos** — borrar `backend/routes`, `backend/middleware`, `backend/models` vacíos
9. **Configurar cuenta AWS** con billing alerts desde el día 1

---

## 📎 Referencias

- [CONDUSEF — Salud Financiera](https://www.condusef.gob.mx)
- [ENSAFI 2023 — INEGI](https://www.inegi.org.mx)
- [Belvo Docs](https://developers.belvo.com)
- [Syncfy / Paybook](https://syncfy.com)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Caddy Docs](https://caddyserver.com/docs)
- [Nueva LFPDPPP 2025 — DOF](https://portalfiscal.com.mx/pagina/principal/leyes/2024/LFPDPPP%202024.htm)
- [AWS SaaS Architecture Guide](https://aws.amazon.com/saas)

---

*Documento generado: Junio 2026 · v1.0 · Revisado: Junio 2026 (alineado a lo implementado)*
