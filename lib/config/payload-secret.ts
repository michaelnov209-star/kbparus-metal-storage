const LOCAL_DEVELOPMENT_SECRET =
  "kbparus-local-development-only-secret-not-for-production";

type PayloadSecretEnv = Readonly<Record<string, string | undefined>>;

function isVercelProduction(env: PayloadSecretEnv): boolean {
  return env.VERCEL === "1" && env.VERCEL_ENV === "production";
}

export function getPayloadSecret(
  env: PayloadSecretEnv = process.env
): string {
  const secret = env.PAYLOAD_SECRET?.trim();

  if (isVercelProduction(env)) {
    if (!secret || secret.length < 32) {
      throw new Error(
        "PAYLOAD_SECRET must contain at least 32 characters in Vercel production."
      );
    }

    return secret;
  }

  return secret || LOCAL_DEVELOPMENT_SECRET;
}
