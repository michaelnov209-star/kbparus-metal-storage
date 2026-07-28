import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin layout isolation", () => {
  it("keeps public pages inside their own root route group", () => {
    expect(existsSync(resolve(projectRoot, "app/layout.tsx"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "app/(site)/layout.tsx"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "app/(site)/page.tsx"))).toBe(true);
    expect(
      existsSync(resolve(projectRoot, "app/(site)/catalog/page.tsx"))
    ).toBe(true);
  });

  it("does not load public CMS data or analytics from the Payload layout", () => {
    const publicLayout = source("app/(site)/layout.tsx");
    const payloadLayout = source("app/(payload)/layout.tsx");

    expect(publicLayout).toContain("getSiteContacts");
    expect(publicLayout).toContain("<YandexMetrika />");
    expect(payloadLayout).not.toContain("getSiteContacts");
    expect(payloadLayout).not.toContain("YandexMetrika");
    expect(payloadLayout).not.toContain("CookieConsent");
  });

  it("keeps social preview generation inside the public route group", () => {
    const publicLayout = source("app/(site)/layout.tsx");

    expect(
      existsSync(resolve(projectRoot, "app/(site)/opengraph-image/route.ts"))
    ).toBe(true);
    expect(existsSync(resolve(projectRoot, "app/opengraph-image.tsx"))).toBe(
      false
    );
    expect(publicLayout).toContain('url: "/opengraph-image"');
  });

  it("uses exactly one document root per route group", () => {
    const publicLayout = source("app/(site)/layout.tsx");
    const payloadLayout = source("app/(payload)/layout.tsx");

    expect(publicLayout.match(/<html\b/g)).toHaveLength(1);
    expect(publicLayout.match(/<body\b/g)).toHaveLength(1);
    expect(payloadLayout).toContain("<RootLayout");
    expect(payloadLayout).not.toMatch(/<html\b/);
    expect(payloadLayout).not.toMatch(/<body\b/);
  });
  it("keeps internal admin links on client navigation", () => {
    const seoNav = source("app/(payload)/components/SeoNavLink.tsx");
    const training = source("app/(payload)/components/AdminTraining.tsx");

    expect(seoNav).toContain("@payloadcms/ui/elements/Link");
    expect(seoNav).not.toContain('<a className="kb-admin-seo-nav"');
    expect(training).toContain("@payloadcms/ui/elements/Link");
    expect(training).not.toContain('<a className="kb-admin-training__link"');
  });

  it("prefetches primary admin destinations only after user intent", () => {
    const intentLink = source(
      "app/(payload)/components/AdminIntentLink.tsx"
    );
    const workspaceNav = source(
      "app/(payload)/components/AdminWorkspaceNav.tsx"
    );

    expect(intentLink).toContain("router.prefetch(href)");
    expect(intentLink).toContain("@payloadcms/ui/elements/Link");
    expect(intentLink).toContain("usePathname");
    expect(intentLink).toContain('aria-current={props["aria-current"]');
    expect(intentLink).toContain("onMouseEnter={handleMouseEnter}");
    expect(intentLink).toContain("onFocus={handleFocus}");
    expect(intentLink).toContain("prefetch={false}");
    expect(workspaceNav).toContain("<AdminIntentLink");
    expect(workspaceNav).not.toContain("prefetch={false}");
  });

  it("routes conversion shortcuts to the goals and conversions workspace", () => {
    const integrations = source(
      "app/(payload)/components/AdminIntegrationsView.tsx"
    );
    const system = source(
      "app/(payload)/components/AdminSystemView.tsx"
    );

    expect(integrations).toContain("/admin/seo?view=goals");
    expect(system).toContain("/admin/seo?view=goals");
    expect(integrations).not.toContain("view=conversions");
    expect(system).not.toContain("view=conversions");
  });

  it("loads the goals workspace only when its SEO tab is opened", () => {
    const seoClient = source(
      "app/(payload)/components/SeoReportsClient.tsx"
    );

    expect(seoClient).toContain("const SeoGoalsClient = lazy(");
    expect(seoClient).toContain('import("./SeoGoalsClient")');
    expect(seoClient).toContain("<Suspense");
  });

  it("renders the SEO root view inside Payload's default navigation template", () => {
    const loader = source(
      "app/(payload)/components/SeoReportingViewLoader.tsx"
    );
    const view = source("app/(payload)/components/SeoReportingView.tsx");

    expect(loader).toContain("props: AdminViewServerProps");
    expect(loader).not.toContain("Pick<");
    expect(view).toContain("@payloadcms/next/templates");
    expect(view).toContain("<DefaultTemplate");
    expect(view).toContain("params={params}");
    expect(view).toContain("req={initPageResult.req}");
    expect(view).toContain("viewType={viewType}");
    expect(view).toContain("searchParams={searchParams}");
    expect(view).not.toContain(
      "visibleEntities={initPageResult.visibleEntities}"
    );
    expect(view).toContain(
      "collections: initPageResult.visibleEntities?.collections"
    );
    expect(view).toContain(
      "globals: initPageResult.visibleEntities?.globals"
    );
    expect(view).toContain("{content}");
  });

  it("does not nest the dashboard inside a second Payload navigation shell", () => {
    const dashboard = source("app/(payload)/components/AdminDashboard.tsx");

    expect(dashboard).not.toContain("@payloadcms/next/templates");
    expect(dashboard).not.toContain("<DefaultTemplate");
    expect(dashboard).toContain("return content;");
  });
});
