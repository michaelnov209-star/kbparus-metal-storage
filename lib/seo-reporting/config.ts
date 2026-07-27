import type { SeoReportingConfig } from "./types";

type Environment = Record<string, string | undefined>;

function readRequired(env: Environment, names: readonly string[]) {
  const values = new Map<string, string>();
  const missing: string[] = [];

  for (const name of names) {
    const value = env[name]?.trim();
    if (value) {
      values.set(name, value);
    } else {
      missing.push(name);
    }
  }

  return { values, missing };
}

function parseRegionIds(value: string | undefined): number[] {
  if (!value?.trim()) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => Number.parseInt(item.trim(), 10))
        .filter((item) => Number.isSafeInteger(item) && item > 0)
    )
  );
}

export function readSeoReportingConfig(env: Environment = process.env): SeoReportingConfig {
  const googleRequired = [
    "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL",
    "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY",
    "GOOGLE_SEARCH_CONSOLE_SITE_URL"
  ] as const;
  const google = readRequired(env, googleRequired);

  const yandexRequired = [
    "YANDEX_WEBMASTER_OAUTH_TOKEN",
    "YANDEX_WEBMASTER_USER_ID",
    "YANDEX_WEBMASTER_HOST_ID"
  ] as const;
  const yandex = readRequired(env, yandexRequired);
  const regionValue =
    env.YANDEX_WEBMASTER_REGION_IDS ?? env.YANDEX_WEBMASTER_REGION_ID;

  return {
    google:
      google.missing.length > 0
        ? { configured: false, missing: google.missing }
        : {
            configured: true,
            clientEmail: google.values.get("GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL")!,
            privateKey: google.values
              .get("GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY")!
              .replace(/\\n/g, "\n"),
            siteUrl: google.values.get("GOOGLE_SEARCH_CONSOLE_SITE_URL")!
          },
    yandex:
      yandex.missing.length > 0
        ? { configured: false, missing: yandex.missing }
        : {
            configured: true,
            oauthToken: yandex.values.get("YANDEX_WEBMASTER_OAUTH_TOKEN")!,
            userId: yandex.values.get("YANDEX_WEBMASTER_USER_ID")!,
            hostId: yandex.values.get("YANDEX_WEBMASTER_HOST_ID")!,
            regionIds: parseRegionIds(regionValue)
          }
  };
}
