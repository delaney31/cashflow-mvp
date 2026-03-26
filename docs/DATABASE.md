# Database connections (PostgreSQL + Neon)

Prisma is configured in `packages/db/prisma/schema.prisma` with **two** connection URLs:

| Env var | Role |
|---------|------|
| **`DATABASE_URL`** | **Runtime** — used by the NestJS API and by Prisma Client for `db seed` queries. On Neon, use the **pooled** connection string (transaction pooler / `-pooler` host). |
| **`DIRECT_DATABASE_URL`** | **Migrations & introspection only** — `prisma migrate`, `prisma db pull`, etc. On Neon, use the **direct** (non-pooled) connection string. For local Postgres, set **the same value as `DATABASE_URL`**. |

This split matches [Neon’s guidance for Prisma](https://neon.tech/docs/guides/prisma): pooled connections for app traffic; a direct session for migrations (poolers like PgBouncer restrict features migrations need).

## Neon query parameters (pooled `DATABASE_URL`)

From the Neon dashboard, copy the **pooled** connection string for `DATABASE_URL`. For Prisma with Neon's transaction pooler, the URL should include:

- **`sslmode=require`** (or equivalent) — Neon requires TLS; the API rejects `sslmode=disable` / `sslmode=allow` for non-local hosts.
- **`pgbouncer=true`** — recommended for Prisma + PgBouncer so prepared statements are handled correctly (see [Neon’s Prisma guide](https://neon.tech/docs/guides/prisma)).

Example shape (values differ per project):

`postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require&pgbouncer=true`

Direct URL for `DIRECT_DATABASE_URL` uses the **non-pooler** host (no `-pooler` in the hostname).

## SSL (Neon)

Neon requires TLS. Connection strings from the Neon dashboard usually include **`sslmode=require`**. Do **not** use `sslmode=disable` against Neon.

For **local** Postgres without TLS, omit `sslmode` or use your Docker/Postgres SSL settings. The API skips strict TLS checks when the host is `localhost` / `127.0.0.1`.

## Runtime behavior (API)

1. `@cashflow/db` exports a Prisma Client generated from the schema.
2. The API uses one **`PrismaService`** (global singleton) extending `PrismaClient`.
3. That client reads **`DATABASE_URL` only** for connections — use Neon’s **pooled** URL in production.
4. **`main.ts`** calls **`app.enableShutdownHooks()`** so on SIGTERM/SIGINT (e.g. Render deploy) Nest runs **`onModuleDestroy`** → **`$disconnect()`**, reducing connection leaks on shutdown.

## Migrations

- **Local (repo root `.env`):** `npm run db:migrate` / `npm run db:migrate:deploy` load env via `dotenv-cli`; both **`DATABASE_URL`** and **`DIRECT_DATABASE_URL`** must be set (identical for local Postgres).
- **Render / CI / manual production:** Set both variables in the environment (no repo `.env`) and run **`npm run db:migrate:production`** from the repo root (wrapper around `prisma migrate deploy` — see **[MIGRATIONS.md](./MIGRATIONS.md)**).

Prisma applies migrations using **`directUrl`** (`DIRECT_DATABASE_URL`), not the pooled URL.

## Naming note

We use **`DIRECT_DATABASE_URL`** (not `DIRECT_URL`) so it is obvious this URL is for direct database access, separate from the pooled **`DATABASE_URL`**.
