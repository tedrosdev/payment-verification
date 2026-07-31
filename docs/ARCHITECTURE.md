# Architecture

## Overview

A small internal admin tool. One admin (or a few) manually enters payment
reference numbers received over Telegram/WhatsApp/Imo; the system verifies
them against Verify.ET and issues ticket codes. No public-facing surface,
no bot integrations in this version — see `BUSINESS_RULES.md` for scope.

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────┐
│  payment-verification-   │─────▶│  payment-verification-   │─────▶│   Verify.ET    │
│  web (Next.js)   │ REST │  api (NestJS)    │ HTTPS│   (external)   │
│  admin dashboard │◀─────│                  │◀─────│                │
└─────────────────┘      └──────┬───────────┘      └────────────────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  PostgreSQL  │
                          └──────────────┘
```

## Components

### `apps/payment-verification-web` (Next.js)
- Admin dashboard only — no customer-facing pages.
- Key screens: batch list/create, submission entry form (bank + reference
  + participant), submission review/result, ticket list per batch with
  copy-to-clipboard.
- Talks to the API over REST; auth via JWT stored in an httpOnly cookie.

### `apps/payment-verification-api` (NestJS)
- Modules: `auth`, `settlement-accounts`, `batches`, `payment-submissions`,
  `tickets`, `verify-et` (integration client).
- `verify-et` module wraps Verify.ET's `POST /api/verify` and
  `GET /api/verify/:requestId`, isolating bank-specific payload shaping
  (see `API_DESIGN.md`) so the rest of the app deals with a normalized
  result, not per-bank field names.
- Business rules (dedup check, amount-to-ticket-count math, ticket code
  generation) live in a `payment-submissions` service, not in controllers.

### `packages/types`
- Shared TypeScript types for API request/response shapes, so web and api
  stay in sync without duplicating interfaces.

### `packages/config`
- Shared env/config schema (e.g. via `zod`), consumed by both apps.

## Auth

Simple JWT-based auth, scoped to this app (not shared Keycloak):
- `POST /auth/login` issues a short-lived access token + refresh token.
- NestJS `@nestjs/jwt` + a guard on all routes except `/auth/*`.
- Single `admin` role for now; the `role` column on `admins` leaves room
  to add roles later without a migration to a new auth system.

## Data Flow: Submitting a Reference Number

1. Admin fills the submission form in `payment-verification-web`.
2. `payment-verification-api` checks local dedup first (cheap, no external call).
3. If not a duplicate, `verify-et` module calls Verify.ET synchronously
   (`waitMs`) and normalizes the response.
4. Result (verified / rejected / needs_review) is persisted and, if
   verified, ticket codes are generated and returned in the same request —
   the admin sees the ticket immediately and copies it to relay manually.

## Why no queue/webhook in v1

Verification is a manual, one-at-a-time admin action (not a
high-throughput customer-facing flow), so a synchronous request/response
is simpler to build and reason about than a queue + webhook + polling UI.
If volume grows enough that `waitMs` timeouts become a problem, the
`verify-et` module is the single place to swap in the async/webhook path
without touching the rest of the app.

## Deployment shape

See `DEPLOYMENT_WORKFLOW.md`. Both apps are containerized (`docker/api`,
`docker/web`) behind an Nginx reverse proxy, consistent with the pattern
already used for bank-client deployments.