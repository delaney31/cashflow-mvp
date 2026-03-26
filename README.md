# Cashflow MVP (monorepo)

Mobile-first cash flow app: **Expo** (React Native), **NestJS** API, **PostgreSQL** via **Prisma**, shared **TypeScript**, **Turborepo** orchestration. Core flows include Plaid sync, budgets, goals, alerts, background jobs (BullMQ), and an AI coach (OpenAI).

## Repository layout

| Path | Description |
|------|-------------|
| `apps/mobile` | Expo app (`@cashflow/mobile`) |
| `apps/api` | NestJS HTTP API (`@cashflow/api`), `/v1` prefix |
| `packages/shared` | Shared types |
| `packages/db` | Prisma schema, migrations, seed |
| `packages/ui` | Shared React Native UI primitives |
| `docs/` | Environment reference, architecture notes |

API contracts for JSON responses live in `apps/api/src/contracts/api-responses.ts`; the mobile client mirrors shapes in `apps/mobile/src/api/types.ts`.

## Prerequisites

- **Node.js** 20+
- **npm** 9+ (workspaces)
- **PostgreSQL** 14+ for Prisma
- **Redis** (optional) for background workers — omit `REDIS_URL` to run the API without queues

## Quick start (local)

1. **Install dependencies** (repo root):

   ```bash
   npm install
   ```

2. **Configure environment**

   - Copy templates and adjust:

     ```bash
     cp .env.example .env
     cp apps/api/.env.example apps/api/.env
     cp apps/mobile/.env.example apps/mobile/.env
     ```

   - Set `DATABASE_URL` everywhere Prisma or the API needs it.
   - Full variable reference: **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)**.

3. **Database: migrate and seed**

   ```bash
   npm run db:generate
   npm run db:migrate -w @cashflow/db
   npm run db:seed
   ```

   Seed creates the mock JWT user (`usr_mock_mvp_001`), a monthly budget cap, and a sample goal so the dashboard has data **without Plaid**. Use the same id as in `POST /v1/auth/login` (see [Auth](#auth)).

4. **Build internal packages** (first time or after shared/db changes):

   ```bash
   npm run build
   ```

## Development workflow

| Goal | Command |
|------|---------|
| API (watch) | `npm run dev:api` — default **http://localhost:3000** · OpenAPI **http://localhost:3000/docs** · Health **GET http://localhost:3000/health** (no `/v1`) |
| Mobile (Expo) | `npm run dev:mobile` or `cd apps/mobile && npx expo start` |
| API + mobile (parallel) | `npm run dev` |

**Auth (development):** `POST http://localhost:3000/v1/auth/login` with JSON `{ "email": "you@example.com", "password": "anything" }` — password is ignored; response includes `accessToken`. Set `JWT_SECRET` in `apps/api/.env`.

**Mobile → API:** In `apps/mobile/.env`, set `EXPO_PUBLIC_API_URL=http://localhost:3000/v1` and optionally `EXPO_PUBLIC_API_TOKEN=<paste accessToken>` for the simulator (see `apps/mobile/src/api/env.ts`).

**Background jobs:** With `REDIS_URL` set, the API enqueues Plaid sync, forecast snapshots, recurring detection, and alert evaluation on a schedule. See `docs/ENVIRONMENT.md`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run format:check
```

## Database

- **Schema:** `packages/db/prisma/schema.prisma`
- **Migrations:** `packages/db/prisma/migrations/`
- **Seed:** `npm run db:seed` — idempotent upserts for local testing

```bash
npm run db:migrate:deploy -w @cashflow/db   # CI / production
```

## Documentation

- **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)** — environment variables
- **[docs/architecture.md](docs/architecture.md)** — high-level map

## Tech stack

- Monorepo: npm workspaces + Turborepo  
- API: NestJS, JWT, Prisma, BullMQ (optional), OpenAI (optional), Plaid (optional)  
- Mobile: Expo SDK 55, React Navigation, TanStack Query  
