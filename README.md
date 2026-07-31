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
- Docker & Docker Compose (for running local PostgreSQL or full stack)

---

### Method 1: Local Development Mode (Recommended)

Run the apps locally with hot-reloading:

#### 1. Start Local PostgreSQL Database
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
- **Default Seed Admin Login**:
  - Email: `admin@verify.et`
  - Password: `AdminPass123!`

---

### Method 2: Full Docker Stack Containerized Mode

Run the entire application stack (PostgreSQL + NestJS API + Next.js Web + Nginx Reverse Proxy) inside Docker:

```bash
# Build and start all services in background
docker compose up -d --build
```

#### Service URLs:
- **Nginx Entrypoint**: `http://localhost`
  - Web UI routed to `http://localhost/`
  - API routed to `http://localhost/api/v1`

---

## Testing & Build Commands

```bash
# Run unit tests (mocking external Verify.ET API responses & ticket math)
pnpm --filter payment-verification-api test

# Build all workspace packages & applications
pnpm turbo run build
```
