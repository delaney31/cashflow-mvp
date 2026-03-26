# Plaid integration — local testing checklist

Base URL: `http://localhost:3000` (or your `PORT`). All API routes below use the global prefix **`/v1`** unless noted.

Use **`curl`**, **Postman**, or **HTTP client** with JSON. Protected routes need:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## 0. Prerequisites

| Step | What to do |
|------|------------|
| **Postgres** | Running and reachable via `DATABASE_URL` (and **`DIRECT_URL`** — match locally or use Neon’s direct URL). |
| **Migrations** | From repo root with root `.env`: **`npm run db:migrate:deploy`**. Or with env in the shell: `DATABASE_URL=... DIRECT_URL=... npm run migrate:deploy -w @cashflow/db` (applies all pending migrations, including Plaid tables). |
| **Mock user row** | JWT auth uses **`usr_mock_mvp_001`** as `sub`. Insert that user if missing, or Plaid FK inserts fail:<br>`INSERT INTO users (id, email, created_at, updated_at) VALUES ('usr_mock_mvp_001', 'demo@cashflow.app', NOW(), NOW()) ON CONFLICT DO NOTHING;` |
| **Plaid dashboard** | Sandbox **Client ID** and **Secret** (same values as env). |

---

## 1. Required environment variables

Set these in `apps/api/.env.local` or `.env` (loaded by Nest `ConfigModule`).

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string for Prisma. |
| `JWT_SECRET` | **Yes** | Signs JWTs (see `apps/api/.env.example`). |
| `PLAID_CLIENT_ID` | **Yes** | Plaid sandbox (or env) client id. |
| `PLAID_SECRET` | **Yes** | Plaid secret. |
| `PLAID_ENV` | **Yes** | Use **`sandbox`** for local testing. |
| `PLAID_TOKEN_ENCRYPTION_KEY` | **Yes** | Base64-encoded **32-byte** key: `openssl rand -base64 32` |
| `PLAID_WEBHOOK_URL` | Recommended | Public HTTPS URL to your API webhook path (e.g. ngrok `https://xxx.ngrok.io/v1/webhooks/plaid`). Needed for Link webhook + live webhook tests. |
| `PLAID_CLIENT_NAME` | Optional | Shown in Link (default `Cashflow`). |
| `PLAID_WEBHOOK_VERIFY` | Optional | Set to **`false`** only for local webhook tests **without** valid `Plaid-Verification` JWT (e.g. manual `curl`). **Use `true` or unset** with real Plaid deliveries. |

Start the API:

```bash
npm run dev:api
# or: npm run dev -w @cashflow/api
```

Health (no JWT, **no** `/v1` prefix):

- **GET** `http://localhost:3000/health` → `200`, JSON with `"ok": true`.

---

## 2. Obtain a JWT (mock login)

| Field | Value |
|-------|--------|
| **Endpoint** | `POST /v1/auth/login` |
| **Auth** | None |

**Request body:**

```json
{
  "email": "demo@cashflow.app",
  "password": "anything"
}
```

**Expected (200):**

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 604800,
  "tokenType": "Bearer"
}
```

**Working correctly:** `accessToken` is a non-empty string. Use it as `Authorization: Bearer <accessToken>` on all following steps.

---

## 3. Create Link token

| Field | Value |
|-------|--------|
| **Endpoint** | `POST /v1/plaid/link-token` |
| **Auth** | Bearer JWT |

**Request body:** empty `{}` or omit body if your client sends no body (POST with no body may need `Content-Type: application/json` and `{}` depending on client).

**Expected (201):**

```json
{
  "linkToken": "link-sandbox-....",
  "expiration": "<ISO-8601 datetime string>"
}
```

**Working correctly:**

- HTTP **201**.
- `linkToken` starts with `link-sandbox-` in sandbox.
- No Plaid error in API logs.

**Connect a sandbox institution (browser / Plaid Link):**

1. Use Plaid’s [Link demo](https://plaid.com/docs/link/web/#demo) or your own web/mobile app with the **Plaid Link** SDK.
2. Pass **`link_token`** = value from `linkToken`.
3. In sandbox, choose a test institution (e.g. **First Platypus Bank** — use Plaid’s documented sandbox credentials if prompted).
4. Complete Link; copy the **`public_token`** from the `onSuccess` callback (format `public-sandbox-...`).

---

## 4. Exchange public token

| Field | Value |
|-------|--------|
| **Endpoint** | `POST /v1/plaid/exchange-token` |
| **Auth** | Bearer JWT |

**Request body:**

```json
{
  "public_token": "public-sandbox-xxxxxxxx"
}
```

**Expected (200):**

```json
{
  "itemId": "<internal-cuid>",
  "plaidItemId": "<Plaid item_id>",
  "accountsLinked": 2
}
```

(`accountsLinked` depends on the sandbox institution.)

**Working correctly:**

- HTTP **200**.
- `itemId` is your **internal** Plaid item id (use for manual resync).
- `plaidItemId` matches Plaid’s item id.
- API logs show linked accounts; no unhandled Plaid errors.
- DB: rows in `plaid_items`, `linked_accounts`, `balance_snapshots`, `transactions` (after initial sync).

**Save `itemId`** for steps 8–9.

---

## 5. Fetch linked accounts

| Field | Value |
|-------|--------|
| **Endpoint** | `GET /v1/accounts` |
| **Auth** | Bearer JWT |

**Expected (200):** JSON array of accounts, each including at least:

- `id`, `institutionId`, `institutionName`, `itemId`, `plaidItemId`, `name`, `mask`, `type`, `subtype`, `currency`, `status`, `lastSyncedAt`

**Working correctly:**

- Same number of accounts as `accountsLinked` (typically).
- `itemId` matches the `itemId` from exchange (internal PlaidItem id).
- `plaidItemId` matches Plaid.

---

## 6. Fetch balances

| Field | Value |
|-------|--------|
| **Endpoint** | `GET /v1/balances` |
| **Auth** | Bearer JWT |

Optional query:

- **`refresh=true`** — calls Plaid balances before reading latest snapshots.

Examples:

- `GET /v1/balances`
- `GET /v1/balances?refresh=true`

**Expected (200):** Array of:

```json
{
  "linkedAccountId": "<uuid/cuid>",
  "balance": "1234.5600",
  "currency": "USD",
  "asOf": "<ISO-8601>",
  "source": "PLAID"
}
```

**Working correctly:**

- One entry per linked account (after at least one balance pull).
- `source` is `PLAID`.
- With `refresh=true`, `asOf` reflects a recent time after the call.

---

## 7. Sync transactions (list from DB)

| Field | Value |
|-------|--------|
| **Endpoint** | `GET /v1/transactions?page=1&limit=50` |
| **Auth** | Bearer JWT |

Optional: `linkedAccountId`, `from`, `to` (ISO dates).

**Expected (200):** Paginated payload:

```json
{
  "items": [
    {
      "id": "...",
      "linkedAccountId": "...",
      "amount": "-12.3400",
      "currency": "USD",
      "status": "PENDING" | "POSTED",
      "date": "2025-03-01",
      "postedAt": null | "<ISO-8601>",
      "name": "...",
      "merchantName": null | "...",
      ...
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": N, "hasMore": false }
}
```

**Working correctly:**

- `total` > 0 after sandbox link (sandbox may populate over time).
- Mix of **`PENDING`** and **`POSTED`** possible; posted rows often have `postedAt` set.
- `date` is `YYYY-MM-DD`.

---

## 8. Rerun sync without duplicates

**Goal:** Same Plaid transaction id must not create duplicate rows (DB unique on `plaid_transaction_id`).

**Steps:**

1. Note **`total`** (or max `id` count) from `GET /v1/transactions?limit=500`.
2. Call manual resync (step 9) **once**.
3. Call `GET /v1/transactions?limit=500` again.

**Expected:**

- **`total`** unchanged unless Plaid actually added/removed transactions.
- No duplicate `id` values for the same `transaction` content; each `plaid`-backed row should have a stable identity (internal `id` unchanged on upsert).

**Optional DB check:**

```sql
SELECT plaid_transaction_id, COUNT(*) FROM transactions
WHERE plaid_transaction_id IS NOT NULL
GROUP BY plaid_transaction_id
HAVING COUNT(*) > 1;
```

**Working correctly:** **0 rows** (no duplicate `plaid_transaction_id`).

---

## 9. Manual resync endpoint

| Field | Value |
|-------|--------|
| **Endpoint** | `POST /v1/plaid/items/:itemId/sync` |
| **Auth** | Bearer JWT |
| **Path param** | `itemId` = **`itemId`** from exchange response (internal id), **not** `plaidItemId`. |

**Example:**

```http
POST /v1/plaid/items/clxxxxxxxxxxxxxxxx/sync
```

**Expected (200):**

```json
{ "ok": true }
```

**Working correctly:**

- HTTP **200** and `ok: true`.
- Logs show balance + transaction sync for that item.
- `GET /v1/balances` / `GET /v1/transactions` may show updates if Plaid had new data.

---

## 10. Webhook handling

**Goal:** Plaid sends `POST` to your **`PLAID_WEBHOOK_URL`** (must match what you registered and what you pass in `link-token`). Path on **your** server should be **`/v1/webhooks/plaid`**.

### 10a. Tunnel (required for Plaid)

Expose local API:

```bash
ngrok http 3000
```

Set:

```env
PLAID_WEBHOOK_URL=https://<your-ngrok-subdomain>.ngrok.io/v1/webhooks/plaid
```

Restart the API, create a **new** link token (step 3), complete Link again (step 3–4) so the item uses the webhook URL.

### 10b. Verification modes

| Mode | Env | When to use |
|------|-----|-------------|
| **Strict** | `PLAID_WEBHOOK_VERIFY` unset or not `false` | Real Plaid webhooks; requires **`Plaid-Verification`** JWT and raw body. |
| **Dev skip** | `PLAID_WEBHOOK_VERIFY=false` | Manual replay tests without Plaid’s JWT header. **Do not use in production.** |

### 10c. Trigger from Plaid

Use Plaid Dashboard **Sandbox → Webhooks** to simulate **TRANSACTIONS** (e.g. `SYNC_UPDATES_AVAILABLE`) for the **item_id** you linked, **or** wait for natural sandbox updates.

### 10d. Expected behavior

- **Strict:** `401` if signature/body invalid; `200` with `{ "received": true }` when valid.
- **Dedupe:** Identical **raw body** replay returns **200** again but sync may be **skipped** (duplicate `body_hash` in `plaid_webhook_dedupes`).
- Logs: Plaid webhook line + sync for `item_id`.

**Working correctly:** After a valid webhook, a sync runs (or is skipped as duplicate); no unhandled exceptions; `transactions` / `balances` may update.

---

## 11. Quick “all green” summary

| Check | Signal |
|-------|--------|
| Link token | `linkToken` present, sandbox prefix. |
| Exchange | `itemId`, `accountsLinked` > 0. |
| Accounts | Array length matches expectations. |
| Balances | `PLAID` source, `asOf` recent. |
| Transactions | `POSTED`/`PENDING`, `date` populated. |
| No duplicates | No duplicate `plaid_transaction_id` in DB. |
| Manual resync | `200` + `{ "ok": true }`. |
| Webhook | `200` + logs; optional dashboard trigger. |

---

## 12. Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| `401` on Plaid routes | JWT missing/expired; repeat login. |
| `500` / Prisma error on exchange | User `usr_mock_mvp_001` exists in `users`; `DATABASE_URL` correct; migrations applied. |
| `public_token` validation error | Body field **`public_token`** (snake_case); value matches `public-sandbox-...`. |
| `PLAID_TOKEN_ENCRYPTION_KEY` error | Key must decode to **32 bytes** (base64). |
| Webhook never hits | `PLAID_WEBHOOK_URL` set, HTTPS tunnel, **new** link token after setting URL. |
| Webhook `401` | Verification failed; use `PLAID_WEBHOOK_VERIFY=false` only for manual tests, or send valid Plaid headers. |

---

## Reference: endpoints used in this checklist

| Method | Path |
|--------|------|
| `POST` | `/v1/auth/login` |
| `POST` | `/v1/plaid/link-token` |
| `POST` | `/v1/plaid/exchange-token` |
| `GET` | `/v1/accounts` |
| `GET` | `/v1/balances` |
| `GET` | `/v1/balances?refresh=true` |
| `GET` | `/v1/transactions` |
| `POST` | `/v1/plaid/items/:itemId/sync` |
| `POST` | `/v1/webhooks/plaid` (Plaid server → your app; not JWT) |
| `GET` | `/health` (no `/v1`) |

Swagger UI (if enabled): `http://localhost:3000/docs`.
