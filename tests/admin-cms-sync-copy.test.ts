import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin CMS sync copy", () => {
  it("explains the scope of the single CMS check in plain language", () => {
    const systemView = source(
      "app/(payload)/components/AdminSystemView.tsx"
    );
    const syncButton = source(
      "app/(payload)/components/CmsCurrentStateSyncButton.tsx"
    );

    expect(systemView).toContain("Единая проверка CMS");
    expect(systemView).toContain(
      "Одна проверка охватывает профили калькулятора, каталог, медиатеку"
    );
    expect(systemView).toContain("и настройки сайта.");
    expect(systemView).toContain("Существующие правки не перезаписываются.");
    expect(syncButton).toContain("Проверить всю CMS");
  });

  it("counts only published canonical calculator profiles against the seed total", () => {
    const systemView = source(
      "app/(payload)/components/AdminSystemView.tsx"
    );

    expect(systemView).toContain(
      'import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed"'
    );
    expect(systemView).toContain("in: canonicalCalculatorProfileSlugs");
    expect(systemView).toContain("draft: false");
    expect(systemView).toContain("pagination: false");
    expect(systemView).toContain("result.docs.length");
    expect(systemView).toContain(
      "{profileCount}/{calculatorProfileSeeds.length}"
    );
    expect(systemView).not.toContain("{profileCount}/6");
  });
});
