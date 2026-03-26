# Database migrations (local, Render, Neon)

This repo uses **Prisma Migrate**. Only **versioned SQL files** under `packages/db/prisma/migrations/` are applied in production via **`prisma migrate deploy`**.

## Decision: when migrations run on Render

| Approach | Behavior |
|----------|----------|
| **Pre-deploy (default in `render.yaml`)** | Before each deploy goes live, Render runs **`npm run db:migrate:production`**, which executes **`prisma migrate deploy`**. If migrations fail (non-zero exit), **the deploy is blocked** and the previous release stays serving traffic. |
| **Manual only** | Remove **`preDeployCommand`** from your Render service (or Blueprint). Run **`npm run db:migrate:production`** yourself from CI or a trusted machine with production **`DATABASE_URL`** + **`DIRECT_DATABASE_URL`** **before** or **after** merging, depending on your release process. |

**Why pre-deploy is the default:** `migrate deploy` is **not** interactive and only applies **pending** migrations already committed to the repo. It does **not** run `migrate reset`, `db push`, or generate new migration files. That matches a typical “migrations ship with code” workflow.

**Destructive commands are never part of automation:** `migrate reset`, `db push --accept-data-loss`, and similar are **development-only** and must be run explicitly by a developer against the right database — they are **not** in npm deploy scripts.

## Scripts (canonical)

| Script | Loads root `.env`? | Use |
|--------|-------------------|-----|
| **`npm run db:migrate`** | Yes | **Local:** create/apply migrations in dev (`prisma migrate dev`). |
| **`npm run db:migrate:deploy`** | Yes | **Local / staging file:** apply pending migrations (`prisma migrate deploy`) using repo-root `.env`. |
| **`npm run db:migrate:status`** | Yes | **Local:** show migration status vs database. |
| **`npm run db:migrate:production`** | **No** | **Render, CI, manual prod:** same as deploy, but **requires env vars in the process** (no `dotenv`). Prints a clear banner; exits non-zero on failure. |
| **`npm run db:migrate:production:status`** | **No** | Same env as production deploy; **`prisma migrate status`**. |
| **`npm run migrate:deploy -w @cashflow/db`** | No | Low-level Prisma command (same deploy behavior; no banner). Prefer **`db:migrate:production`** for production for clarity. |

Implementation: `db:migrate:production` → `packages/db/scripts/migrate-deploy-production.sh` → `npx prisma migrate deploy`.

## Recommended deploy-time flow (Render + Neon)

1. Merge migration files + application code to the branch Render deploys.
2. Ensure **Neon** has **`DATABASE_URL`** (pooled) and **`DIRECT_DATABASE_URL`** (direct) set on the Render service.
3. Trigger deploy. **Build** runs, then **pre-deploy** runs **`db:migrate:production`**, then **start** runs the API.
4. If pre-deploy fails, open **Render deploy logs** — Prisma prints the error; fix the migration or DB, then redeploy.

## Rollback considerations

- **Application rollback:** Redeploy a previous Git commit in Render. That does **not** automatically reverse SQL already applied by Prisma.
- **Schema rollback:** Prisma does **not** auto-downgrade. Options:
  - **Forward fix:** Add a **new** migration that reverses or adjusts the previous change (preferred for production).
  - **Restore database:** Restore a Neon backup / point-in-time restore to before the bad migration, then align migration history (advanced; coordinate with `prisma migrate resolve` if needed).
- **Failed migration mid-deploy:** The deploy fails; the DB may be in a partial state if a multi-statement migration failed partway — inspect Prisma’s error, fix forward, and avoid re-running destructive statements manually without understanding `_prisma_migrations`.

## Exact commands

### Local development

```bash
# From repo root; requires root .env with DATABASE_URL + DIRECT_DATABASE_URL
npm run db:generate
npm run db:migrate              # iterate schema + create migration files (dev DB)
# or, apply existing migrations only:
npm run db:migrate:deploy
npm run db:migrate:status       # optional: see pending / applied
```

### Production (manual run — same as Render pre-deploy)

Set **`DATABASE_URL`** and **`DIRECT_DATABASE_URL`** in the environment (do not commit secrets), then from **repository root**:

```bash
npm run db:migrate:production
```

Check status against the same database (optional):

```bash
npm run db:migrate:production:status
```

Example with inline env (shell):

```bash
export DATABASE_URL='postgresql://...'
export DIRECT_DATABASE_URL='postgresql://...'
npm run db:migrate:production
```

### CI (example)

Same as production: inject both variables as secrets, then `npm ci` and `npm run db:migrate:production` from the repo root.

---

**See also:** [DATABASE.md](./DATABASE.md) (pooled vs direct URLs), [ENVIRONMENT.md](./ENVIRONMENT.md) (variables).
