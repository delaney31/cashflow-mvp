# Documentation index

| Document | Contents |
|----------|----------|
| **[ENVIRONMENT.md](./ENVIRONMENT.md)** | All environment variables: root/Prisma, API, mobile, Neon pooled vs direct URLs, Render. |
| **[deployment-env.md](./deployment-env.md)** | Local vs Render production checklist, secrets, optional vars, copy-paste lists. |
| **[MIGRATIONS.md](./MIGRATIONS.md)** | Local vs production migrations, Render pre-deploy, rollback, exact commands. |
| **[deploy-render-neon.md](./deploy-render-neon.md)** | Step-by-step Neon + Render deployment (URLs, env, migrations, health, mobile). |
| **[deploy-checklists.md](./deploy-checklists.md)** | First-deploy and post-deploy verification checklists (Render + Neon). |
| **[architecture.md](./architecture.md)** | Monorepo layout, data flow, database highlights, tooling. |
| **[plaid-local-testing-checklist.md](./plaid-local-testing-checklist.md)** | Plaid sandbox setup, webhooks, and API testing (optional integration). |
| **[README.md](../README.md)** (repo root) | Install, local dev, database scripts, quality checks, **Render + Neon deployment**, tech stack. |
| **[render.yaml](../render.yaml)** | Render Blueprint for the NestJS API (build, pre-deploy migrations, start, health check). |

**Quick links**

- API base path: **`/v1`** for REST; **`GET /health`** for load balancers (no `/v1`; includes DB probe).
- OpenAPI UI (local): `http://localhost:3000/docs`
- Contracts: `apps/api/src/contracts/api-responses.ts` · mobile types: `apps/mobile/src/api/types.ts`
