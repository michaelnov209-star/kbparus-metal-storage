import { describe, expect, it } from "vitest";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

describe("sitemap", () => {
  it("excludes no-index categories, their products and no-index products", () => {
    const entries = buildSitemapEntries(
      [
        { id: "public-category", noIndex: false },
        { id: "hidden-category", noIndex: true }
      ],
      [
        { id: "public-product", categoryId: "public-category", noIndex: false },
        { id: "hidden-product", categoryId: "public-category", noIndex: true },
        { id: "orphaned-product", categoryId: "hidden-category", noIndex: false }
      ],
      "https://example.test"
    );

    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://example.test/catalog/public-category");
    expect(urls).toContain("https://example.test/catalog/public-category/public-product");
    expect(urls.some((url) => url.includes("hidden-category"))).toBe(false);
    expect(urls.some((url) => url.includes("hidden-product"))).toBe(false);
  });

  it("does not publish synthetic last-modified timestamps", () => {
    const entries = buildSitemapEntries([], [], "https://example.test");
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
  });
});
