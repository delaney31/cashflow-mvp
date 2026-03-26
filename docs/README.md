# Documentation index

| Document | Contents |
|----------|----------|
| **[ENVIRONMENT.md](./ENVIRONMENT.md)** | All environment variables: root/Prisma, API, mobile, Neon pooled vs direct URLs, Render. |
| **[architecture.md](./architecture.md)** | Monorepo layout, data flow, database highlights, tooling. |
| **[plaid-local-testing-checklist.md](./plaid-local-testing-checklist.md)** | Plaid sandbox setup, webhooks, and API testing (optional integration). |
| **[README.md](../README.md)** (repo root) | Install, local dev, database scripts, quality checks, **Render + Neon deployment**, tech stack. |
| **[render.yaml](../render.yaml)** | Render Blueprint for the NestJS API (build, pre-deploy migrations, start, health check). |

**Quick links**

- API base path: **`/v1`** for REST; **`GET /health`** for load balancers (no `/v1`; includes DB probe).
- OpenAPI UI (local): `http://localhost:3000/docs`
- Contracts: `apps/api/src/contracts/api-responses.ts` · mobile types: `apps/mobile/src/api/types.ts`
