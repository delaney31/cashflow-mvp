# Architecture overview

This repository is a TypeScript monorepo for a mobile-first cash flow product.

## Layout

| Path | Role |
|------|------|
| `apps/mobile` | Expo (React Native) client |
| `apps/api` | NestJS HTTP API |
| `packages/shared` | Shared types and API contract shapes consumed by mobile and API |
| `packages/db` | Prisma schema, migrations, and database client export |
| `packages/ui` | Reusable React Native UI primitives and components |
| `docs` | See [docs/README.md](./README.md) for the full index |
| `render.yaml` (repo root) | Render Blueprint for deploying **`@cashflow/api`** |

## HTTP API surface (MVP)

- **Global prefix:** `GET`, `POST`, etc. under **`/v1/...`** (JWT on most routes).
- **Exceptions:** **`GET /health`** (no `/v1`) — liveness/readiness with a DB ping; **`GET /docs`** — Swagger UI; **`POST /v1/auth/login`** — public.

## Data flow

1. **Plaid** connects accounts; tokens and institution metadata persist via `packages/db`.
2. **API** orchestrates sync, budgets, goals, alerts, optional **BullMQ** jobs, and **OpenAI** explanations.
3. **Mobile** consumes REST under `/v1` (see `apps/mobile/src/api/http.ts`).

Environment variables: **[ENVIRONMENT.md](./ENVIRONMENT.md)** (root `.env.example` is a short template). Production API hosting: **[README — Deploying the API](../README.md#deploying-the-api-render--neon)** and root **`render.yaml`**.

## Database (MVP schema)

PostgreSQL tables are defined in `packages/db/prisma/schema.prisma` and migrated under `packages/db/prisma/migrations/`. Highlights:

- **transactions**: `TransactionStatus` (PENDING | POSTED), optional `postedAt`, separate FKs `aiCategoryId` and `userCategoryId` on `categories`.
- **monthly_budgets** + **budget_categories**: one row per user/month plus line items; optional link to `categories` for rollups.
- **goals**: `GoalType` (e.g. cash buffer, debt payoff, spending cap), `GoalStatus`, `deletedAt` for soft delete, `archivedAt` for UX.
- **alerts**: `AlertSeverity`, `resolvedAt` for resolution.
- **scenarios**: JSON `inputs` and `outputs` for AI what-if runs.
- **daily_cashflow_snapshots**: per-user per-day aggregates.

## Tooling

- **Turborepo** coordinates `build`, `dev`, `lint`, and `typecheck` across packages.
- **ESLint** (flat config) and **Prettier** enforce consistent style.
- **npm workspaces** link internal packages (use `"*"` as the version range in `package.json` dependencies).

