import type { CmsRole } from "@/payload/access/rbac";

type Environment = Record<string, string | undefined>;

const SERVICE_ACCOUNT_EMAIL =
  /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/i;

/**
 * Returns the only Google credential that an administrator needs to copy into
 * Search Console. Private-key variables are intentionally never read here.
 */
export function getGoogleServiceAccountEmailForAdmin(
  role: CmsRole,
  env: Environment = process.env
): string | null {
  if (role !== "admin") return null;

  const email = env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim();
  return email && SERVICE_ACCOUNT_EMAIL.test(email) ? email : null;
}
