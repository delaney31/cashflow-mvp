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
| `docs/` | **[Documentation index](docs/README.md)** — environment, architecture, Plaid checklist |
| `render.yaml` | Optional [Render](https://render.com) Blueprint for the API (Neon is configured separately) |

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

   - Set **`DATABASE_URL`** and **`DIRECT_DATABASE_URL`**. For local Postgres, use the **same** connection string for both (see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for Neon).
   - Root `npm run db:*` scripts load **`.env` at the repo root** via `dotenv-cli`. The API also reads `apps/api/.env` when you start it from that package—keep URLs in sync or use one file and symlink.
   - Full variable reference: **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)**.

3. **Database: generate client, migrate, and seed** (requires root `.env` with `DATABASE_URL` and `DIRECT_DATABASE_URL`)

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

   Seed creates the mock JWT user (`usr_mock_mvp_001`), a monthly budget cap, and a sample goal so the dashboard has data **without Plaid**. The dev login flow uses that user id (see **Auth** under [Development workflow](#development-workflow)).

4. **Build internal packages** (first time or after shared/db changes):

   ```bash
   npm run build
   ```

## Development workflow

| Goal | Command |
|------|---------|
| API (watch) | `npm run dev:api` — default **http://localhost:3000** (binds **0.0.0.0**; override with `HOST`) · OpenAPI **http://localhost:3000/docs** · Health **GET http://localhost:3000/health** (no `/v1`; checks DB connectivity) |
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
- **Seed:** `npm run db:seed` — idempotent upserts for local testing (requires root `.env` with `DATABASE_URL` + `DIRECT_DATABASE_URL`)
- **Production workflow:** **[docs/MIGRATIONS.md](docs/MIGRATIONS.md)** — Render pre-deploy, rollback, and what is never run automatically

### Migration scripts

| Command | When to use |
|---------|----------------|
| `npm run db:migrate` | **Local dev** — `prisma migrate dev` (creates migration files; loads root `.env`). |
| `npm run db:migrate:deploy` | **Local** — apply pending migrations only (`migrate deploy`; loads root `.env`). |
| `npm run db:migrate:status` | **Local** — `prisma migrate status` (loads root `.env`). |
| `npm run db:migrate:production` | **Render / CI / manual prod** — `migrate deploy` with a clear log banner; **no** `dotenv`; requires `DATABASE_URL` + `DIRECT_DATABASE_URL` in the environment. |
| `npm run db:migrate:production:status` | **Render / CI / manual prod** — `prisma migrate status` (same env vars as above; no `dotenv`). |

**Render:** `render.yaml` runs **`npm run db:migrate:production`** as **`preDeployCommand`**. If it fails, the deploy stops and logs show Prisma’s error. To run migrations only by hand, remove `preDeployCommand` and follow [docs/MIGRATIONS.md](docs/MIGRATIONS.md).

**Never automated:** `migrate reset`, `db push`, or other destructive Prisma commands — use them only locally on purpose.

## Deploying the API (Render + Neon)

**Step-by-step guide:** **[docs/deploy-render-neon.md](docs/deploy-render-neon.md)** — Neon project setup, pooled vs direct URLs, creating the Render web service (Blueprint or manual), environment variables, migrations, health checks, and pointing the mobile app at production. **Checklists:** **[docs/deploy-checklists.md](docs/deploy-checklists.md)**.

**Summary**

| Step | What to do |
|------|------------|
| **Neon** | Create a project/branch; copy **pooled** → `DATABASE_URL` and **direct** → `DIRECT_DATABASE_URL` ([DATABASE.md](docs/DATABASE.md)). |
| **Render** | **New → Blueprint**, connect GitHub, use repo-root **[render.yaml](render.yaml)** *or* create a **Web Service** with the same build / pre-deploy / start commands as that file. |
| **Env vars** | Set secrets in **Environment** (Neon URLs, `JWT_SECRET`, Plaid keys — see [deployment-env.md](docs/deployment-env.md)). Enable **env vars in build** if `prisma generate` fails. |
| **Migrations** | Default: **`preDeployCommand`** runs `npm run db:migrate:production` ([MIGRATIONS.md](docs/MIGRATIONS.md)). |
| **Health** | `GET https://<service>/health` → **200** and `"database":"connected"`. |
| **Mobile** | Set **`EXPO_PUBLIC_API_URL=https://<host>/v1`** (`.env` locally, EAS for releases). |

**First-deploy checklist:** Neon URLs + secrets in Render → deploy succeeds → `/health` OK → mobile API URL updated. Details: [deploy-render-neon.md](docs/deploy-render-neon.md).

## Environment variable checklist

Full tables, optional variables, copy-paste checklists, and notes: **[docs/deployment-env.md](docs/deployment-env.md)**.

**Legend:** **Secret** = confidential · **Req** = required for that environment unless noted optional.

### Local development

| Variable | Scope | Req | Secret | Description |
|----------|-------|-----|--------|-------------|
| `DATABASE_URL` | root `.env` + `apps/api/.env` | Yes | Yes | Postgres URL for Prisma (pooled on Neon); root file powers `npm run db:*`. |
| `DIRECT_DATABASE_URL` | root + api | Yes | Yes | Migrations / Prisma CLI; duplicate `DATABASE_URL` locally; Neon direct URL in prod. |
| `JWT_SECRET` | api | Yes | Yes | HS256 secret for JWTs (32+ random chars recommended). |
| `PLAID_CLIENT_ID` | api | Yes | Yes | Plaid client id (use **sandbox** for dev). |
| `PLAID_SECRET` | api | Yes | Yes | Plaid secret (**sandbox** for dev). |
| `PLAID_TOKEN_ENCRYPTION_KEY` | api | Yes | Yes | Base64 32-byte key for AES-256-GCM (`openssl rand -base64 32`). |
| `PORT` | api | Optional | No | HTTP port (default `3000`). |
| `HOST` | api | Optional | No | Bind address (default `0.0.0.0`). |
| `NODE_ENV` | api | Optional | No | `development` / `production`. |
| `JWT_EXPIRES_SEC` | api | Optional | No | Access token TTL seconds (default 7 days). |
| `PLAID_ENV` | api | Optional | No | `sandbox` (default), `development`, or `production`. |
| `PLAID_CLIENT_NAME` | api | Optional | No | Shown in Plaid Link. |
| `PLAID_WEBHOOK_URL` | api | Optional | No | Public HTTPS webhook URL (e.g. ngrok). |
| `PLAID_WEBHOOK_VERIFY` | api | Optional | No | `false` only for local webhook testing. |
| `REDIS_URL` | api | Optional | Yes* | BullMQ / Redis; omit for API-only without background jobs. |
| `WORKER_ENABLED` | api | Optional | No | `false` disables in-process workers. |
| `JOB_SCHEDULER_ENABLED` | api | Optional | No | `false` disables cron enqueue. |
| `OPENAI_API_KEY` | api | Optional | Yes | AI Coach; omit if unused. |
| `OPENAI_MODEL` | api | Optional | No | Model id (default `gpt-4o-mini`). |
| `EXPO_ACCESS_TOKEN` | api | Optional | Yes | Expo Push; omit logs pushes only. |
| `ALERT_LARGE_TX_AVG_MULTIPLIER` | api | Optional | No | Alert threshold tuning (default `3`). |
| `ALERT_RECURRING_DAYS_AHEAD` | api | Optional | No | Alert tuning (default `7`). |
| `EXPO_PUBLIC_API_URL` | mobile | Optional | No | API base with `/v1` (e.g. `http://localhost:3000/v1`). |
| `EXPO_PUBLIC_API_TOKEN` | mobile | Optional | Yes* | Dev-only JWT for simulator; not for production apps. |

\*Secret when the value is sensitive; Redis URL may include a password.

The API initializes the **Plaid** module at startup, so **`PLAID_CLIENT_ID`**, **`PLAID_SECRET`**, and **`PLAID_TOKEN_ENCRYPTION_KEY`** are required even if you are not using Link yet—use **sandbox** Plaid credentials and a generated encryption key.

### Render production (API service)

| Variable | Req | Secret | Description |
|----------|-----|--------|-------------|
| `NODE_ENV` | Yes | No | `production` (see [render.yaml](render.yaml)). |
| `HOST` | Yes | No | `0.0.0.0` so traffic reaches the process. |
| `DATABASE_URL` | Yes | Yes | Neon **pooled** URL. |
| `DIRECT_DATABASE_URL` | Yes | Yes | Neon **direct** URL for migrations. |
| `JWT_SECRET` | Yes | Yes | Strong JWT signing secret. |
| `PLAID_CLIENT_ID` | Yes | Yes | Plaid client id (sandbox or production). |
| `PLAID_SECRET` | Yes | Yes | Plaid secret. |
| `PLAID_TOKEN_ENCRYPTION_KEY` | Yes | Yes | Same format as local; avoid rotating without a migration plan. |
| `PORT` | Optional | No | Render sets this automatically; usually omit. |
| `JWT_EXPIRES_SEC` | Optional | No | Token TTL override. |
| `PLAID_ENV` | Optional | No | Plaid API environment. |
| `PLAID_CLIENT_NAME` | Optional | No | Plaid Link name. |
| `PLAID_WEBHOOK_URL` | Optional | No | Public webhook URL for Plaid. |
| `PLAID_WEBHOOK_VERIFY` | Optional | No | Keep verification enabled in production. |
| `REDIS_URL` | Optional | Yes* | BullMQ; omit if no Redis. |
| `WORKER_ENABLED` | Optional | No | Worker process toggle. |
| `JOB_SCHEDULER_ENABLED` | Optional | No | Cron enqueue toggle. |
| `OPENAI_API_KEY` | Optional | Yes | AI Coach. |
| `OPENAI_MODEL` | Optional | No | Model id. |
| `EXPO_ACCESS_TOKEN` | Optional | Yes | Push notifications. |
| `ALERT_LARGE_TX_AVG_MULTIPLIER` | Optional | No | Alert tuning. |
| `ALERT_RECURRING_DAYS_AHEAD` | Optional | No | Alert tuning. |

Mobile is **not** hosted on Render; set **`EXPO_PUBLIC_API_URL`** in Expo / EAS to the deployed API URL. Enable **Include environment variables in the build** on Render if Prisma `generate` needs DB URLs during build.

## Documentation

- **[docs/README.md](docs/README.md)** — index of all docs (environment, architecture, Plaid, deployment)
- **[docs/deploy-render-neon.md](docs/deploy-render-neon.md)** — step-by-step Neon + Render deployment
- **[docs/deploy-checklists.md](docs/deploy-checklists.md)** — first deploy + post-deploy verification
- **[docs/deployment-env.md](docs/deployment-env.md)** — production deployment env checklist (copy-paste lists)
- **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)** — environment variables (Neon, Render, API, mobile)
- **[docs/architecture.md](docs/architecture.md)** — monorepo and data-flow overview
- **[docs/plaid-local-testing-checklist.md](docs/plaid-local-testing-checklist.md)** — optional Plaid sandbox testing
- **[render.yaml](render.yaml)** — Render Blueprint for the API (optional; adjust `name` / `region` before use)

## Tech stack

- Monorepo: npm workspaces + Turborepo  
- API: NestJS, JWT, Prisma, BullMQ (optional), OpenAI (optional), Plaid (optional)  
- Mobile: Expo SDK 55, React Navigation, TanStack Query  
