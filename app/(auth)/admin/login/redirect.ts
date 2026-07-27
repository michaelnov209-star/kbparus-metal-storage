const ADMIN_HOME = "/admin";
const AUTH_ONLY_PATHS = [
  "/admin/login",
  "/admin/logout",
  "/admin/forgot",
  "/admin/reset",
  "/admin/create-first-user",
  "/admin/unauthorized",
  "/admin/inactivity"
] as const;

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function getSafeAdminRedirect(
  requestedPath: string | null,
  origin: string
): string {
  if (
    !requestedPath ||
    requestedPath.startsWith("//") ||
    requestedPath.includes("\\")
  ) {
    return ADMIN_HOME;
  }

  try {
    const safeOrigin = new URL(origin).origin;
    const target = new URL(requestedPath, safeOrigin);
    const isAdminPath =
      target.pathname === ADMIN_HOME ||
      target.pathname.startsWith(`${ADMIN_HOME}/`);

    if (
      target.origin !== safeOrigin ||
      !isAdminPath ||
      isAuthOnlyPath(target.pathname)
    ) {
      return ADMIN_HOME;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return ADMIN_HOME;
  }
}
