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
});
