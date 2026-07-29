import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin route loading experience", () => {
  it("renders a branded, accessible fallback for cold admin transitions", () => {
    const loading = source(
      "app/(payload)/admin/[[...segments]]/loading.tsx"
    );

    expect(loading).toContain('src="/brand/logo-g.png"');
    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("kb-admin-route-loading__workspace");
  });

  it("keeps the loading workspace responsive and motion-safe", () => {
    const styles = source("app/(payload)/custom.scss");

    expect(styles).toContain(".kb-admin-route-loading");
    expect(styles).toMatch(
      /@media \(max-width:\s*820px\)[\s\S]*?\.kb-admin-route-loading__shell\s*\{[\s\S]*?grid-template-columns:\s*1fr;/
    );
    expect(styles).toMatch(
      /@media \(max-width:\s*560px\)[\s\S]*?\.kb-admin-route-loading__workspace\s*\{[\s\S]*?grid-template-columns:\s*1fr;/
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none;/
    );
  });
});
