const POSTGRES_URL_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_URL"
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

export function getPostgresConnectionString(env: PostgresEnvironment): string {
  for (const key of POSTGRES_URL_KEYS) {
    const value = env[key]?.trim();
    if (value) return normalizePostgresConnectionString(value);
  }

  return "";
}
