# Environment variables

Values are loaded from `.env`, `.env.local`, or per-app `apps/<app>/.env` depending on how you start processes. **Never commit secrets.**

Root scripts **`npm run db:migrate`**, **`npm run db:migrate:deploy`**, and **`npm run db:seed`** load the **repository root** `.env` via `dotenv-cli` (`dotenv -e .env`). To run Prisma without that file (e.g. CI or Render), set `DATABASE_URL` and `DIRECT_URL` in the environment and invoke **`npm run migrate:deploy -w @cashflow/db`** (or `migrate:dev` / `seed` in the `@cashflow/db` workspace) directly. The API loads `apps/api/.env` when started from that app; keep URLs aligned with the root `.env` or use one file and symlink.

## Root / shared

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (DB + API) | PostgreSQL connection string for Prisma at runtime. On **Neon**, use the **pooled** connection string (includes `-pooler` in the host or connection pooling parameters). Append `?sslmode=require` if Neon provides it. |
| `DIRECT_URL` | Yes | **Direct** (non-pooled) PostgreSQL URL for `prisma migrate` and introspection. For **local** Postgres, set **equal to** `DATABASE_URL`. On **Neon**, copy the **direct** connection string from the dashboard (different host than the pooler). |

### Neon PostgreSQL

Neon exposes two connection strings:

1. **Pooled** → set as `DATABASE_URL` (serverless-friendly, use with Prisma’s pooler settings; Neon often documents `pgbouncer=true` or similar in the query string).
2. **Direct** → set as `DIRECT_URL` (used by Prisma migrations; avoids transaction limitations of poolers).

Both must be present wherever Prisma runs (local CLI, CI, Render **pre-deploy**). The API process uses `DATABASE_URL` for queries via Prisma Client.

### Render (API web service)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Injected by Render; the app reads `process.env.PORT` (default `3000` locally). |
| `HOST` | No | Defaults to `0.0.0.0` so the service accepts external connections (Render). |
| `DATABASE_URL` | Yes | Neon **pooled** URL. |
| `DIRECT_URL` | Yes | Neon **direct** URL (for `preDeployCommand` migrations). |
| `JWT_SECRET` | Yes | Strong secret for HS256. |
| `REDIS_URL` | No | Omit if you are not running Redis; background jobs stay disabled. |
| Others | No | Plaid, OpenAI, Expo push — see API table below. |

## API (`apps/api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `3000`; Render sets this automatically). |
| `HOST` | No | Bind address (default **`0.0.0.0`** — required for cloud hosts). |
| `NODE_ENV` | No | `development` / `production`. |
| `JWT_SECRET` | Yes (prod) | HS256 secret; min 32 chars recommended. |
| `JWT_EXPIRES_SEC` | No | Access token TTL in seconds (default 7 days). |
| `DATABASE_URL` | Yes | Same as root (pooled on Neon). |
| `DIRECT_URL` | Yes | Same as root (direct on Neon; locally same as `DATABASE_URL`). |
| `OPENAI_API_KEY` | For AI Coach | OpenAI API key. |
| `OPENAI_MODEL` | No | Model id (default `gpt-4o-mini`). |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` | For Plaid | Sandbox or production Plaid credentials. |
| `PLAID_TOKEN_ENCRYPTION_KEY` | For Plaid | Base64 **32-byte** key for encrypting Plaid tokens at rest (`openssl rand -base64 32`). |
| `PLAID_CLIENT_NAME` | No | Shown in Plaid Link (default product name). |
| `PLAID_WEBHOOK_VERIFY` | No | Webhook JWT verification; see Plaid testing doc. |
| `PLAID_WEBHOOK_URL` | No | Public HTTPS URL for Plaid webhooks (e.g. ngrok in dev). |
| `REDIS_URL` | No | `redis://…` — enables BullMQ background jobs; omit to run API without workers. |
| `WORKER_ENABLED` | No | `false` disables in-process BullMQ workers (default `true` when Redis present). |
| `JOB_SCHEDULER_ENABLED` | No | `false` disables cron enqueue (useful for worker-only replicas). |
| `EXPO_ACCESS_TOKEN` | For push | Expo push notification access token; without it, critical alerts log only. |

### Plaid (optional)

Full local testing steps, curl examples, and webhook notes: **[plaid-local-testing-checklist.md](./plaid-local-testing-checklist.md)**.

## Mobile (`apps/mobile`)

Only variables prefixed with **`EXPO_PUBLIC_`** are embedded in the client bundle.

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | No | API base including `/v1`, e.g. `http://localhost:3000/v1` (see `src/api/env.ts`). |
| `EXPO_PUBLIC_API_TOKEN` | Dev only | JWT from `POST /v1/auth/login` — convenient for simulator; use secure storage in production. |

## Local JWT user (seed)

`POST /v1/auth/login` issues a token for user id **`usr_mock_mvp_001`** (`apps/api/src/auth/auth.service.ts`).  
`npm run db:seed` creates that user and sample budget/goal data so dashboards are non-empty without Plaid.
