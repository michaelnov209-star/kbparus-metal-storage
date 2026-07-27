const POOLED_POSTGRES_URL_KEYS = [
  "DATABASE_URL",
  "DATABASE_POSTGRES_URL",
  "POSTGRES_URL"
] as const;

const DIRECT_POSTGRES_URL_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "DATABASE_POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NON_POOLING",
] as const;

type PostgresEnvironment = Record<string, string | undefined>;

/**
 * node-postgres is aligning sslmode semantics with libpq in a future major
 * release. Using verify-full explicitly keeps certificate and hostname
 * verification stable instead of relying on the legacy require/prefer aliases.
 */
export function normalizePostgresConnectionString(value: string): string {
  return value.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=(&|#|$))/gi,
    "$1verify-full"
  );
}

export function getPostgresConnectionString(
  env: PostgresEnvironment
): string {
  for (const key of [...POOLED_POSTGRES_URL_KEYS, ...DIRECT_POSTGRES_URL_KEYS]) {
    const value = env[key]?.trim();
    if (value) return normalizePostgresConnectionString(value);
  }

  return "";
}

/**
 * Schema operations must never silently fall back to a pooled connection.
 * Missing direct credentials are a hard configuration error.
 */
export function getDirectPostgresConnectionString(
  env: PostgresEnvironment
): string {
  for (const key of DIRECT_POSTGRES_URL_KEYS) {
    const value = env[key]?.trim();
    if (value) return normalizePostgresConnectionString(value);
  }

  throw new Error(
    "A direct PostgreSQL connection is required for migrations. Configure DATABASE_URL_UNPOOLED, DATABASE_POSTGRES_URL_NON_POOLING, or POSTGRES_URL_NON_POOLING."
  );
}
