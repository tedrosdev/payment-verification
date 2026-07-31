# Deployment Workflow

## Shape

- `apps/payment-verification-api` and `apps/payment-verification-web` each build to a
  Docker image (`docker/api/Dockerfile`, `docker/web/Dockerfile`).
- Nginx (`docker/nginx` or reuse existing reverse-proxy config) routes
  `/api/*` to the API container and everything else to the Next.js
  container.
- PostgreSQL runs as its own container (or a managed instance) — not
  bundled into the app images.

## `docker-compose.yml` services (suggested)

```yaml
services:
  postgres:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    env_file: .env

  api:
    build: ./docker/api
    env_file: apps/payment-verification-api/.env
    depends_on: [postgres]

  web:
    build: ./docker/web
    env_file: apps/payment-verification-web/.env.local
    depends_on: [api]

  nginx:
    build: ./docker/nginx
    ports: ["80:80", "443:443"]
    depends_on: [api, web]

volumes:
  pgdata:
```

## Release steps

1. `pnpm turbo run build` — build both apps.
2. `docker compose build` — build images.
3. Run Prisma migrations against the target DB:
   `pnpm --filter payment-verification-api prisma migrate deploy`
4. `docker compose up -d` — roll out.
5. Smoke-test: log in as admin, create a test batch, confirm the
   `verify-et` module can reach `https://verify.et` (check API key env
   var is set in the deployed container, not just locally).

## Environment separation

Keep separate `.env` files (or secrets manager entries) per environment,
especially `VERIFY_ET_API_KEY` — use a separate key for staging vs
production if Verify.ET's plan allows it, so test submissions don't
consume production verification credits.

## Rollback

Since this is a small internal tool with no customer-facing downtime
risk, rollback is: redeploy the previous image tag, and re-run
`prisma migrate resolve` only if a migration needs reverting (avoid
destructive down-migrations against production data — prefer forward-fix
migrations).