import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getSafeAdminRedirect } from "../app/(auth)/admin/login/redirect";
import { shouldRedirectAnonymousAdmin } from "@/lib/admin/routes";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin login fast path", () => {
  it("has a dedicated static route outside the Payload admin catch-all", () => {
    expect(
      existsSync(resolve(projectRoot, "app/(auth)/admin/login/page.tsx"))
    ).toBe(true);

    const page = source("app/(auth)/admin/login/page.tsx");
    const layout = source("app/(auth)/layout.tsx");

    expect(page).toContain('dynamic = "force-static"');
    expect(page).not.toContain("@payload-config");
    expect(layout).not.toContain("@payloadcms");
    expect(layout).not.toContain("getSiteContacts");
  });

  it("keeps Payload authentication without rendering the dashboard in the background", () => {
    const client = source("app/(auth)/admin/login/LoginClient.tsx");

    expect(client).toContain('fetch("/api/users/me?depth=0"');
    expect(client).not.toContain("warmup=1");
    expect(client).not.toContain('fetch("/admin"');
    expect(client).toContain('fetch("/api/users/login"');
    expect(client).toContain('credentials: "include"');
    expect(client).toContain('"Content-Type": "application/json"');
    expect(client).toContain("new FormData(event.currentTarget)");
    expect(client).not.toContain("noValidate");
  });

  it("redirects anonymous admin traffic before the heavy Payload catch-all loads", () => {
    const proxy = source("proxy.ts");

    expect(proxy).toContain('const PAYLOAD_AUTH_COOKIE = "payload-token"');
    expect(proxy).toContain('matcher: ["/admin/:path*"]');
    expect(proxy).toContain("NextResponse.redirect(loginUrl, 307)");
    expect(proxy).toContain('"Cache-Control", "private, no-store, max-age=0"');

    expect(shouldRedirectAnonymousAdmin("/admin", false)).toBe(true);
    expect(shouldRedirectAnonymousAdmin("/admin/seo?period=30", false)).toBe(
      true
    );
    expect(shouldRedirectAnonymousAdmin("/admin/login", false)).toBe(false);
    expect(
      shouldRedirectAnonymousAdmin("/admin/create-first-user", false)
    ).toBe(false);
    expect(shouldRedirectAnonymousAdmin("/admin", true)).toBe(false);
    expect(shouldRedirectAnonymousAdmin("/catalog", false)).toBe(false);
  });

  it("only redirects to safe paths inside the admin", () => {
    const origin = "https://kbparus-metal-storage.vercel.app";

    expect(getSafeAdminRedirect("//evil.example", origin)).toBe("/admin");
    expect(getSafeAdminRedirect("%2F%2Fevil.example", origin)).toBe("/admin");
    expect(getSafeAdminRedirect("\\evil.example", origin)).toBe("/admin");
    expect(getSafeAdminRedirect("/admin/../evil", origin)).toBe("/admin");
    expect(getSafeAdminRedirect("/admin/login/foo", origin)).toBe("/admin");
    expect(getSafeAdminRedirect("/admin/logout", origin)).toBe("/admin");
    expect(getSafeAdminRedirect("/admin/forgot", origin)).toBe("/admin");
    expect(getSafeAdminRedirect("/admin/seo?period=30", origin)).toBe(
      "/admin/seo?period=30"
    );
  });

  it("loads dashboard and SEO implementations only on their own pages", () => {
    const config = source("payload.config.ts");
    const dashboardLoader = source(
      "app/(payload)/components/AdminDashboardLoader.tsx"
    );
    const seoLoader = source(
      "app/(payload)/components/SeoReportingViewLoader.tsx"
    );

    expect(config).toContain("AdminDashboardLoader");
    expect(config).toContain("SeoReportingViewLoader");
    expect(dashboardLoader).toContain('await import("./AdminDashboard")');
    expect(seoLoader).toContain('await import("./SeoReportingView")');
  });
});
