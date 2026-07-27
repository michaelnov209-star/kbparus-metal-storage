export type SearchVerificationMetadata = {
  google?: string;
  yandex?: string;
};

type Environment = Record<string, string | undefined>;

export function buildSearchVerificationMetadata(
  env: Environment = process.env
): SearchVerificationMetadata {
  const google = env.GOOGLE_SITE_VERIFICATION?.trim();
  const yandex = env.YANDEX_SITE_VERIFICATION?.trim();

  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {})
  };
}
