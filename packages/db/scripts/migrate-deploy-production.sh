#!/usr/bin/env bash
# Production-safe: runs ONLY `prisma migrate deploy` (applies pending versioned SQL migrations).
# Never runs migrate reset, db push, or other destructive Prisma commands.
# Intended for Render pre-deploy, CI, or manual runs with DATABASE_URL + DIRECT_DATABASE_URL in the environment.
set -euo pipefail

cd "$(dirname "$0")/.."

echo ""
echo "--------------------------------------------------------------------------------"
echo "  Prisma migrate deploy (production)"
echo "  - Applies pending migrations from prisma/migrations/"
echo "  - Uses DIRECT_DATABASE_URL from the environment (see packages/db prisma schema)"
echo "  - On failure: exits non-zero — fix migrations or DB state, then retry"
echo "--------------------------------------------------------------------------------"
echo ""

exec npx prisma migrate deploy
