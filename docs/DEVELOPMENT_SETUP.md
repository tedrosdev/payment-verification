# Development Setup

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (for local Postgres or full stack)

## Running Locally

### Method 1: Local Dev Mode (Port 3000 Web, Port 3001 API)

1. Start Postgres:
   ```bash
   docker compose up -d postgres
   ```

2. Run Prisma migrations and seed:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

3. Launch development servers:
   ```bash
   pnpm dev
   ```

- **Web Dashboard**: `http://localhost:3000`
- **REST API**: `http://localhost:3001/api/v1`
- **Seed Login**: `admin@verify.et` / `AdminPass123!`

### Method 2: Full Docker Stack Mode

```bash
docker compose up -d --build
```
- Access at `http://localhost` (Nginx proxies `/api` to API container and `/` to Web container).

## Tests

```bash
pnpm --filter payment-verification-api test
```