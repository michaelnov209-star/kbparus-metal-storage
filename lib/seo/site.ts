export const FALLBACK_SITE_URL = "https://kbparus-metal-storage.vercel.app";

// These are separate КБ Парус web properties. They may be linked as related
// projects, but must never become this site's canonical origin or CMS origin.
const NON_PROJECT_HOSTNAMES = new Set([
  "kbparus.ru",
  "www.kbparus.ru",
  "xn--80apaabkbctmxn.xn--p1ai",
  "линииокраски.рф"
]);

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

export function normalizeProjectSiteOrigin(
  value: string | undefined
): string | undefined {
  const candidate = value?.trim();
  if (!candidate || candidate.startsWith("//")) return undefined;

  try {
    const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`;
    const url = new URL(withProtocol);
    const protocolAllowed =
      url.protocol === "https:" ||
      (url.protocol === "http:" && isLocalHostname(url.hostname));
    const hostname = url.hostname.toLocaleLowerCase("en-US");

    if (
      !protocolAllowed ||
      url.username ||
      url.password ||
      !hostname ||
      NON_PROJECT_HOSTNAMES.has(hostname)
    ) {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

export function getSiteUrl(
  value =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL
): string {
  return normalizeProjectSiteOrigin(value) ?? FALLBACK_SITE_URL;
}

export function getTrustedSiteOrigins(
  env: Record<string, string | undefined> = process.env
): string[] {
  const origins = [
    FALLBACK_SITE_URL,
    normalizeProjectSiteOrigin(env.NEXT_PUBLIC_SITE_URL),
    normalizeProjectSiteOrigin(env.VERCEL_PROJECT_PRODUCTION_URL),
    normalizeProjectSiteOrigin(env.VERCEL_URL),
    normalizeProjectSiteOrigin(env.VERCEL_BRANCH_URL)
  ];

  if (env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000", "http://localhost:3100");
  }

  return Array.from(
    new Set(origins.filter((origin): origin is string => Boolean(origin)))
  );
}

export const SITE_URL = getSiteUrl();
