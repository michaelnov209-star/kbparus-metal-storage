import {
  ADMIN_HOME,
  isAdminAuthOnlyPath,
  isAdminPath
} from "@/lib/admin/routes";

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
    if (
      target.origin !== safeOrigin ||
      !isAdminPath(target.pathname) ||
      isAdminAuthOnlyPath(target.pathname)
    ) {
      return ADMIN_HOME;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return ADMIN_HOME;
  }
}
