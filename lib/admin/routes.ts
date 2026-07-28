export const ADMIN_HOME = "/admin";

const ADMIN_AUTH_ONLY_PATHS = [
  "/admin/login",
  "/admin/logout",
  "/admin/forgot",
  "/admin/reset",
  "/admin/create-first-user",
  "/admin/unauthorized",
  "/admin/inactivity"
] as const;

export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
}

export function isAdminAuthOnlyPath(pathname: string): boolean {
  return ADMIN_AUTH_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function shouldRedirectAnonymousAdmin(
  pathname: string,
  hasAuthCookie: boolean
): boolean {
  return (
    !hasAuthCookie &&
    isAdminPath(pathname) &&
    !isAdminAuthOnlyPath(pathname)
  );
}
