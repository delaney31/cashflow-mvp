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
| `docs` | Design notes and ADRs (add as the product grows) |

## Data flow (planned)

1. **Plaid** connects accounts; tokens and institution metadata are stored via `packages/db`.
2. **API** orchestrates sync, aggregation, caps, goals, and alerts.
3. **OpenAI** assists with categorization, explanations, and chat; prompts and outputs stay server-side where possible.
4. **Mobile** consumes REST (or future GraphQL) endpoints and renders balances, forecasts, and the assistant UI.

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

## Environment variables

- **Server secrets** (Plaid, OpenAI, database URLs) live only in API and tooling — never in the mobile bundle.
- **Expo public config** uses the `EXPO_PUBLIC_` prefix for values intentionally exposed to the client.

See root `.env.example` for a consolidated list.
