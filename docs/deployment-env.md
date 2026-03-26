# Environment variables — deployment checklist

Templates: [.env.example](../.env.example), [apps/api/.env.example](../apps/api/.env.example), [apps/mobile/.env.example](../apps/mobile/.env.example).  
**Never commit real secrets.**

**Legend:** **Req** = required vs optional · **Secret** = treat as confidential (yes/no) · **Where** = where to set for local dev (`root` = repo `.env`, `api` = `apps/api/.env`, `mobile` = `apps/mobile/.env`).

**Note:** The API loads **`PLAID_*`** and **`PLAID_TOKEN_ENCRYPTION_KEY`** at startup (`PlaidModule`). Without them the process exits during bootstrap—even if you are not using Plaid yet. Use **Plaid sandbox** credentials and a generated encryption key for dev and for production until you need production Plaid.

---

## Local development

### Required

| Variable | Where | Secret | Description |
|----------|-------|--------|-------------|
| `DATABASE_URL` | root + api | Yes | PostgreSQL URL for Prisma runtime (local: same host as direct; Neon: **pooled** URL). |
| `DIRECT_DATABASE_URL` | root + api | Yes | Prisma migrations / CLI; local duplicate of `DATABASE_URL`; Neon **direct** URL. |
| `JWT_SECRET` | api | Yes | HS256 signing secret for JWT access tokens (32+ random characters recommended). |
| `PLAID_CLIENT_ID` | api | Yes | Plaid dashboard client id (**sandbox** for dev). |
| `PLAID_SECRET` | api | Yes | Plaid dashboard secret (**sandbox** for dev). |
| `PLAID_TOKEN_ENCRYPTION_KEY` | api | Yes | Base64-encoded **32-byte** AES key for tokens at rest (`openssl rand -base64 32`). |

### Optional (local)

| Variable | Where | Secret | Description |
|----------|-------|--------|-------------|
| `PORT` | api | No | HTTP port (default `3000`). |
| `HOST` | api | No | Bind address (default `0.0.0.0`). |
| `NODE_ENV` | api | No | `development` or `production` (default development). |
| `JWT_EXPIRES_SEC` | api | No | Access token lifetime in seconds (default 7 days). |
| `PLAID_ENV` | api | No | `sandbox` (default), `development`, or `production`. |
| `PLAID_CLIENT_NAME` | api | No | Name shown in Plaid Link (default `Cashflow`). |
| `PLAID_WEBHOOK_URL` | api | No | HTTPS URL Plaid calls for webhooks (e.g. ngrok). |
| `PLAID_WEBHOOK_VERIFY` | api | No | Set `false` only for local webhook testing (skips JWT verification). |
| `REDIS_URL` | api | Yes* | `redis://…` for BullMQ; omit to run API without background jobs. |
| `WORKER_ENABLED` | api | No | `false` disables in-process workers (default `true` if Redis configured). |
| `JOB_SCHEDULER_ENABLED` | api | No | `false` disables cron enqueue into queues. |
| `OPENAI_API_KEY` | api | Yes | OpenAI API key for AI Coach routes. |
| `OPENAI_MODEL` | api | No | Model id (default `gpt-4o-mini`). |
| `EXPO_ACCESS_TOKEN` | api | Yes | Expo Push API token; omit to log pushes only. |
| `ALERT_LARGE_TX_AVG_MULTIPLIER` | api | No | Alert tuning (default `3`). |
| `ALERT_RECURRING_DAYS_AHEAD` | api | No | Alert tuning (default `7`). |
| `EXPO_PUBLIC_API_URL` | mobile | No | API base URL including `/v1` (e.g. `http://localhost:3000/v1`). |
| `EXPO_PUBLIC_API_TOKEN` | mobile | Yes* | Dev-only convenience JWT for simulator (omit in real prod builds). |

\*Redis URL often includes a password; treat as secret when present.

---

## Render production (API web service)

Set these in the Render **Environment** for the service (and enable **Include environment variables in the build** if `prisma generate` needs DB URLs during build).

### Required

| Variable | Secret | Description |
|----------|--------|-------------|
| `NODE_ENV` | No | Set to `production` (also in [render.yaml](../render.yaml)). |
| `HOST` | No | `0.0.0.0` so the container accepts external traffic (set in blueprint or Dashboard). |
| `DATABASE_URL` | Yes | Neon **pooled** connection string (`sslmode=require`, `pgbouncer=true` as needed). |
| `DIRECT_DATABASE_URL` | Yes | Neon **direct** connection string for `preDeployCommand` migrations. |
| `JWT_SECRET` | Yes | Strong random secret for JWT signing. |
| `PLAID_CLIENT_ID` | Yes | Plaid **sandbox or production** client id per your rollout. |
| `PLAID_SECRET` | Yes | Matching Plaid secret. |
| `PLAID_TOKEN_ENCRYPTION_KEY` | Yes | Same format as local: base64 32-byte key; **do not rotate** casually (invalidates stored tokens). |

### Optional (Render)

| Variable | Secret | Description |
|----------|--------|-------------|
| `PORT` | No | Usually **leave unset**; Render injects `PORT`. |
| `JWT_EXPIRES_SEC` | No | Token TTL override (default 7 days). |
| `PLAID_ENV` | No | `sandbox` vs `production` Plaid API. |
| `PLAID_CLIENT_NAME` | No | Plaid Link display name. |
| `PLAID_WEBHOOK_URL` | No | Public HTTPS URL of your API’s Plaid webhook route. |
| `PLAID_WEBHOOK_VERIFY` | No | Leave default verification on in production. |
| `REDIS_URL` | Yes* | Managed Redis (e.g. Render Redis, Upstash) for BullMQ. |
| `WORKER_ENABLED` | No | `false` if workers run in another process. |
| `JOB_SCHEDULER_ENABLED` | No | `false` on worker-only instances. |
| `OPENAI_API_KEY` | Yes | AI Coach; omit if feature unused. |
| `OPENAI_MODEL` | No | Model override. |
| `EXPO_ACCESS_TOKEN` | Yes | Push notifications; omit if unused. |
| `ALERT_LARGE_TX_AVG_MULTIPLIER` | No | Alert tuning. |
| `ALERT_RECURRING_DAYS_AHEAD` | No | Alert tuning. |

\*Treat as secret when the URL contains credentials.

**Mobile / Expo** is not deployed on Render; configure **`EXPO_PUBLIC_API_URL`** (and EAS secrets) in your mobile build pipeline to point at the deployed API.

---

## Copy-paste checklists

### Local — files to fill

**Repo root `.env`** (also used by `npm run db:*`):

```text
[ ] DATABASE_URL
[ ] DIRECT_DATABASE_URL
```

**`apps/api/.env`:**

```text
[ ] DATABASE_URL
[ ] DIRECT_DATABASE_URL
[ ] JWT_SECRET
[ ] PLAID_CLIENT_ID
[ ] PLAID_SECRET
[ ] PLAID_TOKEN_ENCRYPTION_KEY
```

**`apps/mobile/.env` (optional for device/simulator):**

```text
[ ] EXPO_PUBLIC_API_URL
[ ] EXPO_PUBLIC_API_TOKEN   (dev convenience only)
```

### Render — API service environment

```text
[ ] NODE_ENV=production
[ ] HOST=0.0.0.0
[ ] DATABASE_URL          (Neon pooled)
[ ] DIRECT_DATABASE_URL   (Neon direct)
[ ] JWT_SECRET
[ ] PLAID_CLIENT_ID
[ ] PLAID_SECRET
[ ] PLAID_TOKEN_ENCRYPTION_KEY
[ ] (optional) REDIS_URL
[ ] (optional) OPENAI_API_KEY
[ ] (optional) EXPO_ACCESS_TOKEN
[ ] (optional) PLAID_WEBHOOK_URL
[ ] Build: "Include environment variables in the build" if needed for Prisma generate
```

### Post-deploy — mobile / EAS (not on Render)

```text
[ ] EXPO_PUBLIC_API_URL=https://<your-api-host>/v1
```

---

See also: [ENVIRONMENT.md](./ENVIRONMENT.md), [DATABASE.md](./DATABASE.md), [MIGRATIONS.md](./MIGRATIONS.md).
