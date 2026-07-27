export const FALLBACK_SITE_URL = "https://kbparus-metal-storage.vercel.app";

export function getSiteUrl(
  value =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL
): string {
  const candidate = value?.trim() || FALLBACK_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  return withProtocol.replace(/\/+$/, "");
}

export const SITE_URL = getSiteUrl();
