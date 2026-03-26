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

   - Set **`DATABASE_URL`** and **`DIRECT_URL`**. For local Postgres, use the **same** connection string for both (see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for Neon).
   - Root `npm run db:*` scripts load **`.env` at the repo root** via `dotenv-cli`. The API also reads `apps/api/.env` when you start it from that package—keep URLs in sync or use one file and symlink.
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
- **Seed:** `npm run db:seed` — idempotent upserts for local testing (requires root `.env` with `DATABASE_URL` + `DIRECT_URL`)

```bash
# Local (loads repo-root .env)
npm run db:migrate:deploy

# CI / platforms that inject env (no .env file), e.g. Render pre-deploy
npm run migrate:deploy -w @cashflow/db
```

## Deploying the API (Render + Neon)

The Expo app calls the API over HTTPS. Use **Neon** for PostgreSQL and **Render** for the Node web service. This repo includes a **[render.yaml](render.yaml)** blueprint (API only; database is external Neon).

### 1. Neon (PostgreSQL)

1. Create a project at [neon.tech](https://neon.tech) and a database branch (e.g. `main`).
2. In the Neon dashboard, open **Connection details** and copy:
   - **Pooled** connection string → set as **`DATABASE_URL`** on Render (often includes `-pooler` in the host; keep `?sslmode=require` if present).
   - **Direct** connection string → set as **`DIRECT_URL`** (non-pooled; used by Prisma migrations).
3. Optional: allow **IP allowlist** `0.0.0.0/0` if Neon restricts inbound (Render egress IPs are not fixed on all plans—Neon typically allows SSL from anywhere when configured for public access).

Prisma is configured with `url = DATABASE_URL` and `directUrl = DIRECT_URL` so the app uses the pooler at runtime and migrations use a direct session.

### 2. Render (web service)

1. In [Render](https://render.com), **New** → **Blueprint** (or **Web Service** if not using the file).
2. Connect the GitHub repo and select the branch to deploy.
3. If using **Blueprint**, point it at `render.yaml` in the repo root. If creating a service manually, use:
   - **Root directory:** repository root (default).
   - **Build command:** `npm ci && npm run build`
   - **Pre-deploy command:** `npm run migrate:deploy -w @cashflow/db` (runs Prisma migrations with env vars from Render; see [Render pre-deploy](https://render.com/docs/deploys#pre-deploy-command). If your plan does not support it, run the same command locally or in CI with Neon `DATABASE_URL` + `DIRECT_URL` set.)
   - **Start command:** `npm run start:prod -w @cashflow/api`
   - **Health check path:** `/health`
4. Under **Environment**, set at minimum:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = Neon **pooled** URL
   - `DIRECT_URL` = Neon **direct** URL
   - `JWT_SECRET` = long random string (32+ characters)
5. Enable **Include environment variables in the build** if your build step needs them (Prisma client generation reads the schema; migrate runs in pre-deploy with runtime env).
6. After deploy, note the service URL (e.g. `https://cashflow-api.onrender.com`). Your mobile app should set `EXPO_PUBLIC_API_URL=https://<host>/v1`.

**Optional:** `REDIS_URL` (Render Redis or Upstash) for BullMQ jobs. If unset, the API runs without background workers—fine for an MVP.

**Manual steps not in YAML:** Create the Neon project/branches, paste secrets in Render, connect the Git repo, and point the Expo `EXPO_PUBLIC_API_URL` at the deployed API.

### 3. First deploy checklist

- [ ] Neon `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) in Render
- [ ] `JWT_SECRET` set
- [ ] Pre-deploy migrations succeeded (check deploy logs)
- [ ] `GET https://<your-service>/health` returns `200` with `"database":"connected"`
- [ ] Mobile `.env` / EAS env: `EXPO_PUBLIC_API_URL=https://<your-service>/v1`

## Documentation

- **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)** — environment variables (including Neon + Render)
- **[docs/architecture.md](docs/architecture.md)** — high-level map
- **[render.yaml](render.yaml)** — Render Blueprint for the API (optional; adjust `name` / `region` before use)

## Tech stack

- Monorepo: npm workspaces + Turborepo  
- API: NestJS, JWT, Prisma, BullMQ (optional), OpenAI (optional), Plaid (optional)  
- Mobile: Expo SDK 55, React Navigation, TanStack Query  
