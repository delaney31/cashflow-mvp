/**
 * Runtime PostgreSQL URL for Prisma Client (pooled `DATABASE_URL` only).
 * Migrations use `DIRECT_DATABASE_URL` via `schema.prisma` `directUrl` — not read here.
 */

function isLocalPostgresHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    const h = hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.local');
  } catch {
    return /@[^/]*(localhost|127\.0\.0\.1)([:/]|$)/i.test(url);
  }
}

/**
 * Fail fast on misconfiguration. Neon requires TLS; local Docker Postgres often has no sslmode.
 */
export function assertRuntimeDatabaseUrl(raw: string | undefined): string {
  const url = raw?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Set it to your pooled connection string (Neon pooler in production; see docs/DATABASE.md).',
    );
  }

  const lower = url.toLowerCase();

  if (!lower.startsWith('postgres://') && !lower.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must start with postgres:// or postgresql://');
  }

  if (isLocalPostgresHost(url)) {
    return url;
  }

  // Hosted Postgres (Neon, RDS, etc.): forbid explicit TLS-off modes.
  if (lower.includes('sslmode=disable') || lower.includes('sslmode=allow')) {
    throw new Error(
      'DATABASE_URL: use TLS for remote Postgres (Neon requires encryption). Remove sslmode=disable and sslmode=allow from the connection string.',
    );
  }

  return url;
}
