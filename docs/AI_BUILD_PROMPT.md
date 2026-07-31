# AI Build Prompt

Use this as the seed prompt for an agentic coding tool (Claude Code, etc.)
building this project. It should read the other docs in `docs/` for detail
— this file just orients the agent and sequences the work.

---

## Project

A payment-verification ticketing tool. Admin manually receives payment
reference numbers from customers over Telegram/WhatsApp/Imo, enters them
into this system, which verifies the payment via the Verify.ET API
(https://verify.et/docs/api) and issues a short ticket code (e.g. `AA11`)
once verified. Read `docs/BUSINESS_RULES.md` in full before writing any
code — it defines every rule referenced below.

## Stack

- `apps/payment-verification-api` — NestJS + Prisma + PostgreSQL
- `apps/payment-verification-web` — Next.js admin dashboard
- `packages/types` — shared request/response types
- `packages/config` — shared env schema
- Monorepo managed with pnpm workspaces + Turborepo
- Containerized: `docker/api`, `docker/web`, Nginx reverse proxy per
  `docs/DEPLOYMENT_WORKFLOW.md`

## Read order

1. `docs/BUSINESS_RULES.md` — domain rules, do not deviate without flagging it
2. `docs/DATABASE_DESIGN.md` — schema to implement in Prisma
3. `docs/API_DESIGN.md` — exact endpoint contracts
4. `docs/ARCHITECTURE.md` — module boundaries
5. `docs/DEVELOPMENT_SETUP.md` — local env setup

## Build sequence

1. Scaffold the monorepo per the folder structure in `ARCHITECTURE.md`.
2. Prisma schema from `DATABASE_DESIGN.md`, migrate.
3. NestJS `auth` module (JWT login, guard).
4. NestJS `settlement-accounts` and `batches` modules (basic CRUD).
5. NestJS `verify-et` module — a thin, well-tested client for Verify.ET's
   `POST /api/verify` and `GET /api/verify/:requestId`, normalizing
   per-bank fields (`cbe`/`boa` need `accountSuffix`, `telebirr` doesn't).
   Write this module's tests against mocked Verify.ET responses (success,
   `verified: false`, `settlementAccountMatch.matched: false`,
   `confirmationHistory.confirmedBefore: true`) since these are the exact
   branches `BUSINESS_RULES.md` §4 requires.
6. NestJS `payment-submissions` module implementing the dedup-check →
   verify → issue-tickets flow, using the `verify-et` module.
7. NestJS `tickets` module (code generation per `BUSINESS_RULES.md` §5,
   list endpoints).
8. Next.js dashboard: login, batch list/create, submission entry form,
   submission result view, ticket list with copy-to-clipboard.
9. Docker + Nginx wiring per `DEPLOYMENT_WORKFLOW.md`.

## Flagged assumptions to double-check with the product owner

These are called out in `BUSINESS_RULES.md` — don't silently "fix" them,
surface them:
- Settlement accounts configured globally per bank, not per batch.
- Initial bank support limited to CBE + Telebirr.
- Synchronous verification (`waitMs`) rather than async/webhook.
- Ticket codes unique per batch, not globally.

## Non-goals (do not build)

- No Telegram/WhatsApp bot ingestion.
- No customer login or portal.
- No winner/draw selection logic.