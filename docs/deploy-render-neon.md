# Deploy the API with Neon + Render

This guide assumes **the repository is already on GitHub** and you are deploying **only the NestJS API** (`apps/api`). **PostgreSQL** runs on **Neon**; **Render** runs the Node process. The **Expo mobile app** is not deployed here—it only needs the public API URL afterward.

**Related docs:** [deployment-env.md](./deployment-env.md) (all variables), [MIGRATIONS.md](./MIGRATIONS.md) (migrations detail), [DATABASE.md](./DATABASE.md) (pooled vs direct URLs), [render.yaml](../render.yaml) (Blueprint).

---

## 1. Create the Neon database

1. Sign in at [neon.tech](https://neon.tech) and create a **Project** (pick a region close to your Render region if possible).
2. Neon creates a default **branch** (often `main`) and a **database** (e.g. `neondb` or `postgres`). You can keep defaults for an MVP.
3. Optional: create additional **branches** for staging vs production later; for a first deploy, one branch is enough.

You will copy connection strings from this project in the next section.

---

## 2. Get the pooled and direct connection strings

Prisma uses **two** URLs (see [DATABASE.md](./DATABASE.md)):

| Variable | Neon dashboard | Purpose |
|----------|----------------|---------|
| **`DATABASE_URL`** | **Pooled** connection | Runtime queries (API, Prisma Client). Uses a **pooler** host (often contains `-pooler` in the hostname). |
| **`DIRECT_DATABASE_URL`** | **Direct** connection | `prisma migrate` and pre-deploy migrations. Uses the **non-pooled** host (no `-pooler`). |

**How to find them in Neon (typical UI):**

1. Open your Neon project → **Dashboard**.
2. Open **Connection details** (or **Connect**), choose **PostgreSQL** as the client if asked.
3. **Pooled connection string** — select the option labeled **Pooled**, **Transaction mode**, or similar (Neon documents this for serverless / pooler workloads). Copy the full URI.
4. **Direct connection string** — switch to **Direct** / **Session** / **Non-pooled** (wording varies). Copy that URI—it should **not** use the pooler hostname.

**Query parameters:** Neon URLs usually include **`sslmode=require`**. For Prisma with the pooler, Neon’s docs recommend adding **`pgbouncer=true`** to the pooled URL if it is not already present. Keep **`?schema=public`** (or your schema) consistent with local development.

**Security:** Treat both strings as **secrets** (they contain credentials).

---

## 3. Create the Render web service

### Option A — Blueprint (recommended)

1. In [Render](https://render.com), **New** → **Blueprint**.
2. Connect your **GitHub** account and select the **repository** and **branch** (e.g. `main`).
3. Render detects **`render.yaml`** at the repo root. Review the proposed **Web Service** (`cashflow-api` in the sample file—you can edit names/regions in the file before merging).
4. Complete the wizard; Render will create the service from the Blueprint.

### Option B — Web service manually

1. **New** → **Web Service** → connect the GitHub repo.
2. **Root directory:** repository root (empty or `.`).
3. **Runtime:** Node.
4. **Build command:**  
   `npm ci && npx turbo run build --filter=@cashflow/api`
5. **Pre-deploy command** (optional but recommended):  
   `npm run db:migrate:production`  
   Omit only if you run migrations yourself (see [MIGRATIONS.md](./MIGRATIONS.md)).
6. **Start command:**  
   `npm run start:prod -w @cashflow/api`
7. **Health check path:** `/health`

Match **[render.yaml](../render.yaml)** so behavior stays consistent with the repo.

---

## 4. Where to put environment variables

### Render Dashboard

1. Open your **Web Service** → **Environment**.
2. Add **Key / Value** pairs for each variable. Mark sensitive values as **Secret** if the UI offers it.

**From the Blueprint:** `render.yaml` sets **`NODE_ENV`** and **`HOST`** and declares **`DATABASE_URL`**, **`DIRECT_DATABASE_URL`**, **`JWT_SECRET`**, and **Plaid** keys (`PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_TOKEN_ENCRYPTION_KEY`) with `sync: false`—enter values in the Dashboard (Render prompts for unset keys).

**Minimum for the API to boot** (see [deployment-env.md](./deployment-env.md) for the full list):

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Neon **pooled** URI |
| `DIRECT_DATABASE_URL` | Neon **direct** URI |
| `JWT_SECRET` | Long random string (32+ characters) |
| `PLAID_CLIENT_ID` | Required at startup today—use **sandbox** Plaid credentials if unsure |
| `PLAID_SECRET` | Same |
| `PLAID_TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` — store securely; rotating breaks encrypted Plaid tokens |

Optional: `REDIS_URL`, `OPENAI_API_KEY`, `EXPO_ACCESS_TOKEN`, etc.

### Build-time env

`@cashflow/db` runs **`prisma generate`** during **`npm run build`**. The Prisma schema references **`DATABASE_URL`** and **`DIRECT_DATABASE_URL`**.

**[render.yaml](../render.yaml)** exports **placeholder** URLs when those variables are unset so **`prisma generate`** succeeds without connecting to Neon (first-time setup without “env in build” is OK). For consistency, you can still enable **Include environment variables in the build** so the real Neon URLs are used during `generate`.

---

## 5. How migrations run

**Default (this repo):** Render **`preDeployCommand`** runs:

```bash
npm run db:migrate:production
```

That executes **`prisma migrate deploy`** using **`DIRECT_DATABASE_URL`** (see [MIGRATIONS.md](./MIGRATIONS.md)). It runs **after** a successful build and **before** the new release receives traffic. If migrations **fail**, the deploy **fails** and the previous release keeps running—check **Logs** for Prisma output.

**Manual alternative:** Remove **`preDeployCommand`** (in the Dashboard or in `render.yaml`) and run migrations from your laptop or CI with production env:

```bash
export DATABASE_URL='…'
export DIRECT_DATABASE_URL='…'
npm run db:migrate:production
```

(from repository root)

**First deploy:** Ensure migration files exist in **`packages/db/prisma/migrations/`** in the branch you deploy. No separate “init Neon” step beyond applying those migrations.

---

## 6. Verify the deployment is healthy

1. **Service URL** — In Render, open the service and copy the **URL** (e.g. `https://cashflow-api.onrender.com`).
2. **Health check** — In a browser or terminal:  
   `GET https://<your-service>.onrender.com/health`  
   Expect **200** and JSON including **`"database":"connected"`** if Postgres is reachable. **503** means the DB check failed (wrong URL, Neon paused, or network issue).
3. **Render dashboard** — Confirm the instance is **Live** and recent **Deploy** succeeded (build + pre-deploy + start).
4. **API surface** — Optional: `GET https://<host>/docs` for Swagger UI (unauthenticated docs).

---

## 7. Point the mobile app at the deployed API

The Expo app reads **`EXPO_PUBLIC_API_URL`** (see `apps/mobile/src/api/env.ts`). It must include the **`/v1`** prefix.

**Format:**

```text
EXPO_PUBLIC_API_URL=https://<your-render-host>.onrender.com/v1
```

**Where to set it:**

- **Local / dev:** `apps/mobile/.env` (see `apps/mobile/.env.example`).
- **EAS Build / production:** Configure **`EXPO_PUBLIC_API_URL`** in **EAS Secrets** or **eas.json** env profiles so release builds target production—not `localhost`.

**CORS:** The API uses **`enableCors({ origin: true, credentials: true })`**, which allows browser/capacitor origins; adjust if you lock down origins later.

**HTTPS:** Use the **`https://`** Render URL for production clients.

---

## Quick checklist

See **[deploy-checklists.md](./deploy-checklists.md)** for copy-paste **first deploy** and **post-deploy verification** lists.

- [ ] Neon project created; **pooled** + **direct** URIs copied
- [ ] Render web service created (Blueprint or manual) with build / pre-deploy / start commands as above
- [ ] Environment variables set in Render (including Plaid + encryption key per [deployment-env.md](./deployment-env.md))
- [ ] Deploy logs show pre-deploy migrations succeeded
- [ ] `GET /health` returns 200 with database connected
- [ ] Mobile **`EXPO_PUBLIC_API_URL`** set to `https://<host>/v1`
