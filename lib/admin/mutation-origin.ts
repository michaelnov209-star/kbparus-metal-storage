/**
 * Adds explicit CSRF protection for custom cookie-authenticated mutations.
 * Payload protects its own routes; custom `/api/admin/*` handlers must enforce
 * same-origin requests themselves.
 */
export function isTrustedAdminMutationRequest(
  request: Request,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    return true;
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  // Browser mutations in production always send Origin or Fetch Metadata.
  // Tests and local maintenance scripts remain usable outside production.
  return env.NODE_ENV !== "production";
}
