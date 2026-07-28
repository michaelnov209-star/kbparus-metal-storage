import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_HOME,
  shouldRedirectAnonymousAdmin
} from "@/lib/admin/routes";

const PAYLOAD_AUTH_COOKIE = "payload-token";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAuthCookie = Boolean(
    request.cookies.get(PAYLOAD_AUTH_COOKIE)?.value
  );

  if (!shouldRedirectAnonymousAdmin(pathname, hasAuthCookie)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  if (pathname !== ADMIN_HOME) {
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  }

  const response = NextResponse.redirect(loginUrl, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
