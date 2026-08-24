import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin route assets", () => {
  it("keeps special-screen styles out of the global Payload stylesheet", () => {
    const globalStyles = source("app/(payload)/custom.scss");

    expect(globalStyles).not.toContain('@use "./seo-reports"');
    expect(globalStyles).not.toContain('@use "./control-center"');
    expect(globalStyles).not.toContain('@use "./system-center"');
    expect(globalStyles).toContain('@use "./admin-workspace"');
    expect(globalStyles).toContain('@use "./admin-polish"');
  });

  it("builds bounded, safely cached assets for special admin screens", () => {
    const assets = [
      ["public/assets/admin/control-center.css", 20_000],
      ["public/assets/admin/seo-reports.css", 28_000],
      ["public/assets/admin/system-center.css", 18_000]
    ] as const;

    for (const [asset, byteBudget] of assets) {
      const absolutePath = resolve(projectRoot, asset);
      expect(existsSync(absolutePath)).toBe(true);
      expect(statSync(absolutePath).size).toBeGreaterThan(1_000);
      expect(statSync(absolutePath).size).toBeLessThan(byteBudget);
    }

    const nextConfig = source("next.config.mjs");

    expect(nextConfig).toContain('source: "/assets/admin/:path*"');
    expect(nextConfig).toContain(
      '{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }'
    );
    expect(nextConfig).toContain(
      'source: "/assets/admin/workspace-bg-v1.webp"'
    );
    expect(nextConfig).toContain(
      '{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }'
    );
  });

  it("loads each special stylesheet only from its matching server view", () => {
    const dashboard = source(
      "app/(payload)/components/AdminDashboard.tsx"
    );
    const seo = source(
      "app/(payload)/components/SeoReportingView.tsx"
    );
    const system = source(
      "app/(payload)/components/AdminSystemView.tsx"
    );
    const integrations = source(
      "app/(payload)/components/AdminIntegrationsView.tsx"
    );
    const link = source(
      "app/(payload)/components/AdminRouteStylesheet.tsx"
    );

    expect(dashboard).toContain(
      '<AdminRouteStylesheet name="control-center" />'
    );
    expect(seo).toContain(
      '<AdminRouteStylesheet name="seo-reports" />'
    );
    expect(system).toContain(
      '<AdminRouteStylesheet name="system-center" />'
    );
    expect(integrations).toContain(
      '<AdminRouteStylesheet name="system-center" />'
    );
    expect(link).toContain("VERCEL_GIT_COMMIT_SHA");
    expect(link).toContain('rel="stylesheet"');
    expect(link).toContain("precedence=");
  });

  it("generates admin assets in local and Vercel build paths", () => {
    const packageJson = source("package.json");
    const generator = source(
      "scripts/performance/build-admin-styles.mjs"
    );

    expect(packageJson).toContain('"admin:styles"');
    expect(packageJson).toContain(
      '"prebuild": "npm run images:optimize && npm run admin:styles"'
    );
    expect(packageJson).toContain(
      "npm run images:optimize && npm run admin:styles && node scripts/cms/check.mjs"
    );
    expect(generator).toContain('style: "compressed"');
    expect(generator).toContain("public/assets/admin");
  });

  it("defers heavy clients while retaining server-rendered first paint", () => {
    const lazySeo = source(
      "app/(payload)/components/LazySeoReportsClient.tsx"
    );
    const lazyActions = source(
      "app/(payload)/components/LazyAdminActions.tsx"
    );

    expect(lazySeo).toContain('import("./SeoReportsClient")');
    expect(lazySeo).not.toContain("ssr: false");
    expect(lazyActions).toContain('import("./AdminActionClient")');
    expect(lazyActions).not.toContain("ssr: false");
  });
});
