import type { SeoReportingConfig } from "./types";

type Environment = Record<string, string | undefined>;

const OTHER_KBPARUS_PROJECT_HOSTS = new Set([
  "kbparus.ru",
  "www.kbparus.ru",
  "линииокраски.рф",
  "xn--80apaabkbctmxn.xn--p1ai"
]);

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

function googlePropertyBelongsToAnotherProject(value: string): boolean {
  const normalized = value.trim();
  const domainProperty = normalized.match(/^sc-domain:(.+)$/i)?.[1]?.trim();
  if (domainProperty) {
    return OTHER_KBPARUS_PROJECT_HOSTS.has(
      domainProperty.toLocaleLowerCase("en-US")
    );
  }

  try {
    return OTHER_KBPARUS_PROJECT_HOSTS.has(
      new URL(normalized).hostname.toLocaleLowerCase("en-US")
    );
  } catch {
    return false;
  }
}

export function isYandexHistoryEnabled(
  env: Environment = process.env
): boolean {
  return env.SEO_YANDEX_HISTORY_ENABLED?.trim().toLowerCase() === "true";
}

export function readSeoReportingConfig(env: Environment = process.env): SeoReportingConfig {
  const googleRequired = [
    "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL",
    "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY",
    "GOOGLE_SEARCH_CONSOLE_SITE_URL"
  ] as const;
  const google = readRequired(env, googleRequired);
  const googleSiteUrl = google.values.get("GOOGLE_SEARCH_CONSOLE_SITE_URL");
  if (
    googleSiteUrl &&
    googlePropertyBelongsToAnotherProject(googleSiteUrl)
  ) {
    google.values.delete("GOOGLE_SEARCH_CONSOLE_SITE_URL");
    google.missing.push(
      "GOOGLE_SEARCH_CONSOLE_SITE_URL (указан ресурс другого сайта КБ Парус)"
    );
  }

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
