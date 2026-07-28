const LOCAL_DEVELOPMENT_SECRET =
  "kbparus-local-development-only-secret-not-for-production";

type PayloadSecretEnv = Readonly<Record<string, string | undefined>>;

function hasDatabaseConnection(env: PayloadSecretEnv): boolean {
  return Boolean(
    env.DATABASE_URL?.trim() ||
      env.DATABASE_POSTGRES_URL?.trim() ||
      env.POSTGRES_URL?.trim() ||
      env.DATABASE_URL_UNPOOLED?.trim() ||
      env.DATABASE_POSTGRES_URL_NON_POOLING?.trim() ||
      env.POSTGRES_URL_NON_POOLING?.trim()
  );
}

function requiresProductionSecret(env: PayloadSecretEnv): boolean {
  return (
    (env.VERCEL === "1" && env.VERCEL_ENV === "production") ||
    (env.NODE_ENV === "production" && hasDatabaseConnection(env))
  );
}

export function getPayloadSecret(
  env: PayloadSecretEnv = process.env
): string {
  const secret = env.PAYLOAD_SECRET?.trim();

  if (requiresProductionSecret(env)) {
    if (!secret || secret.length < 32) {
      throw new Error(
        "PAYLOAD_SECRET must contain at least 32 characters in a production runtime with a database."
      );
    }

    return secret;
  }

  return secret || LOCAL_DEVELOPMENT_SECRET;
}
