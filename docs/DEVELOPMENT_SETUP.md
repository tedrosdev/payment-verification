# Development Setup

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (for local Postgres)

## First-time setup

```bash
pnpm install

# start Postgres locally
docker compose up -d postgres

# copy env templates
cp apps/payment-verification-api/.env.example apps/payment-verification-api/.env
cp apps/payment-verification-web/.env.example apps/payment-verification-web/.env.local

# run migrations
pnpm --filter payment-verification-api prisma migrate dev
```

## Required env vars — `apps/payment-verification-api/.env`

| Var | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_ACCESS_SECRET` | |
| `JWT_REFRESH_SECRET` | |
| `VERIFY_ET_API_KEY` | from https://verify.et — needs `verification:read` + `verification:write` |
| `VERIFY_ET_BASE_URL` | `https://verify.et` |

## Required env vars — `apps/payment-verification-web/.env.local`

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | e.g. `http://localhost:3001/api/v1` |

## Running locally

```bash
pnpm turbo run dev
```

- API: `http://localhost:3001`
- Web: `http://localhost:3000`

## Tests

```bash
pnpm --filter payment-verification-api test         # unit tests, incl. mocked verify-et module
pnpm --filter payment-verification-api test:e2e     # e2e against local Postgres
```

## Useful scripts

| Command | Purpose |
|---|---|
| `pnpm prisma studio` | inspect local DB |
| `pnpm turbo run lint` | lint all apps |
| `pnpm turbo run build` | build all apps |