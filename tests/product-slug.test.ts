import { describe, expect, it } from "vitest";

import { createProductSlug } from "@/lib/cms/product-slug";

describe("createProductSlug", () => {
  it("creates a readable stable URL from a Russian product title", () => {
    expect(
      createProductSlug("Консольный стеллаж для длинномерного металла")
    ).toBe("konsolnyy-stellazh-dlya-dlinnomernogo-metalla");
  });

  it("normalizes punctuation, accents and repeated separators", () => {
    expect(createProductSlug("Compact 3000×1500 — Série № 2")).toBe(
      "compact-3000-1500-serie-no-2"
    );
  });

  it("does not leave a trailing separator after the length limit", () => {
    const slug = createProductSlug(`${"товар ".repeat(30)}финал`);
    expect(slug.length).toBeLessThanOrEqual(96);
    expect(slug).not.toMatch(/-$/);
  });
});
