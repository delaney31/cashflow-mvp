# Environment variables

Values are loaded from `.env`, `.env.local`, or per-app `apps/<app>/.env` depending on how you start processes. **Never commit secrets.**

## Root / shared

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (DB + API) | PostgreSQL connection string for Prisma (`packages/db`, `apps/api`). |

## API (`apps/api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `3000`). |
| `NODE_ENV` | No | `development` / `production`. |
| `JWT_SECRET` | Yes (prod) | HS256 secret; min 32 chars recommended. |
| `JWT_EXPIRES_SEC` | No | Access token TTL in seconds (default 7 days). |
| `DATABASE_URL` | Yes | Same as root. |
| `OPENAI_API_KEY` | For AI Coach | OpenAI API key. |
| `OPENAI_MODEL` | No | Model id (default `gpt-4o-mini`). |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` | For Plaid | Sandbox or production Plaid credentials. |
| `PLAID_WEBHOOK_URL` | No | Public URL for Plaid webhooks. |
| `REDIS_URL` | No | `redis://…` — enables BullMQ background jobs; omit to run API without workers. |
| `WORKER_ENABLED` | No | `false` disables in-process BullMQ workers (default `true` when Redis present). |
| `JOB_SCHEDULER_ENABLED` | No | `false` disables cron enqueue (useful for worker-only replicas). |
| `EXPO_ACCESS_TOKEN` | For push | Expo push notification access token; without it, critical alerts log only. |

## Mobile (`apps/mobile`)

Only variables prefixed with **`EXPO_PUBLIC_`** are embedded in the client bundle.

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | No | API base including `/v1`, e.g. `http://localhost:3000/v1` (see `src/api/env.ts`). |
| `EXPO_PUBLIC_API_TOKEN` | Dev only | JWT from `POST /v1/auth/login` — convenient for simulator; use secure storage in production. |

## Local JWT user (seed)

`POST /v1/auth/login` issues a token for user id **`usr_mock_mvp_001`** (`apps/api/src/auth/auth.service.ts`).  
`npm run db:seed` creates that user and sample budget/goal data so dashboards are non-empty without Plaid.
