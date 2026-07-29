import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin route loading experience", () => {
  it("keeps the current Payload shell visible instead of replacing the whole screen", () => {
    expect(
      existsSync(
        resolve(
          projectRoot,
          "app/(payload)/admin/[[...segments]]/loading.tsx"
        )
      )
    ).toBe(false);
  });

  it("does not ship the removed full-screen shimmer to every admin page", () => {
    const globalStyles = source("app/(payload)/custom.scss");
    const baseStyles = source("app/(payload)/admin-base.scss");
    const seoStyles = source("app/(payload)/seo-goals.scss");

    expect(globalStyles).not.toContain("kb-admin-route-loading");
    expect(baseStyles).not.toContain("kb-admin-route-loading");
    expect(seoStyles).not.toContain("kb-admin-route-loading");
    expect(globalStyles).toContain(
      '@use "./admin-base"'
    );
  });
});
