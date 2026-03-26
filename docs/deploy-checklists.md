# Render + Neon — deploy checklists

Use with **[deploy-render-neon.md](./deploy-render-neon.md)** and **[deployment-env.md](./deployment-env.md)**.

---

## First deploy (before / during)

- [ ] Neon project created; **pooled** + **direct** connection strings copied (see [DATABASE.md](./DATABASE.md)).
- [ ] GitHub repo connected to Render; **branch** in `render.yaml` matches your default branch (`main` vs `master`).
- [ ] Render **Web Service** or **Blueprint** created from repo root; `render.yaml` reviewed (region, plan, name).
- [ ] **Environment** in Render: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `JWT_SECRET`, `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_TOKEN_ENCRYPTION_KEY` (see [deployment-env.md](./deployment-env.md)).
- [ ] Optional: enable **Include environment variables in the build** (real Neon URLs during `prisma generate` — otherwise the Blueprint uses **build placeholders** and does not need this for a successful build).
- [ ] `preDeployCommand` supported on your Render plan (or remove it and run migrations manually per [MIGRATIONS.md](./MIGRATIONS.md)).
- [ ] Root **`package-lock.json`** present (required for `npm ci` on Render).

---

## Post-deploy verification

- [ ] **Deploy** status **Live**; **Build** and **Pre-deploy** logs show success (no Prisma migration errors).
- [ ] `GET https://<your-service>.onrender.com/health` returns **200** and JSON includes **`"database":"connected"`**.
- [ ] `GET https://<your-service>.onrender.com/docs` loads Swagger (optional).
- [ ] `POST https://<your-service>.onrender.com/v1/auth/login` with a JSON body returns a JWT (requires DB seeded or user created — see seed / auth docs).
- [ ] Mobile / clients: **`EXPO_PUBLIC_API_URL`** = `https://<host>/v1` (EAS or `.env`).
- [ ] If using **Plaid webhooks**: `PLAID_WEBHOOK_URL` points to your public API webhook route.

---

## If something fails

| Symptom | Likely cause |
|--------|----------------|
| Build fails on Prisma / env | Rare if using Blueprint defaults; enable **env in build** and set Neon URLs. |
| Pre-deploy fails | Wrong `DIRECT_DATABASE_URL`, Neon paused, or migration SQL error — read **Pre-deploy** logs. |
| App crashes on start | Missing `JWT_SECRET` or Plaid / encryption keys — read **Runtime** logs. |
| `/health` returns 503 | DB unreachable — check Neon status, URLs, IP allowlist. |
| Cold start timeout | First request after idle can be slow on free/low tiers — retry. |

---

## Secrets in Git

**Never commit** `.env` files. This repo **gitignores** `.env` and `apps/*/.env` — only `*.env.example` templates belong in the tree. Rotate any credential that was ever committed.
