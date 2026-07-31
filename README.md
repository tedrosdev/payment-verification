# Payment Verification & Ticketing Tool

A monorepo payment-verification ticketing system. Admin manually enters payment reference numbers from customers (over Telegram, WhatsApp, or Imo), verifies them against the **Verify.ET API**, and issues batch-scoped short ticket codes (e.g. `AA01`, `AA02`) upon successful payment verification.

## Tech Stack

- **API**: NestJS + Prisma ORM + PostgreSQL (`apps/payment-verification-api`)
- **Web**: Next.js 14 (App Router) Admin Dashboard (`apps/payment-verification-web`)
- **Packages**: Shared TS Types (`packages/types`) & Environment Config (`packages/config`)
- **Orchestration**: pnpm Workspaces + Turborepo
- **Containerization**: Docker, Docker Compose & Nginx Reverse Proxy

---

## How to Run Locally

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

---

### Method 1: Local Development Mode (Recommended)

#### 1. Start Local PostgreSQL Database (Port 5433 to avoid host 5432 conflicts)
```bash
docker compose up -d postgres
```

#### 2. Run Database Migrations & Seed Data
```bash
# Generate Prisma Client & apply schema migrations
pnpm db:generate
pnpm db:migrate

# Seed default admin user (admin@verify.et) and settlement accounts (CBE, Telebirr, BOA)
pnpm db:seed
```

#### 3. Start API & Web Apps Concurrently
```bash
pnpm dev
```

#### Service URLs:
- **Next.js Web Admin Dashboard**: `http://localhost:3000`
- **NestJS API**: `http://localhost:3001/api/v1`
- **Swagger Documentation**: `http://localhost:3001/api/docs`
- **Default Seed Admin Login**:
  - Email: `admin@verify.et`
  - Password: `AdminPass123!`

---

### Method 2: Full Docker Stack Containerized Mode

```bash
docker compose up -d --build
```

#### Service URLs:
- **Nginx Entrypoint**: `http://localhost`
  - Web UI: `http://localhost/`
  - API: `http://localhost/api/v1`
