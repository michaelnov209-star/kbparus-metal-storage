import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: async () => null
}));
import robots from "@/app/robots";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { mergeCatalogCategories } from "@/lib/cms/catalog";
import { resolveCmsMediaAlt } from "@/lib/cms/media-url";
import { productSchema } from "@/lib/seo/schema";

describe("SEO foundation", () => {
  it("keeps CMS media alt text and falls back safely", () => {
    expect(resolveCmsMediaAlt({ alt: "Кассетная система с листовым металлом" })).toBe(
      "Кассетная система с листовым металлом"
    );
    expect(resolveCmsMediaAlt({ alt: "  " }, "Система хранения")).toBe(
      "Система хранения"
    );
  });

  it("does not invent an offer for a request-priced product", () => {
    const schema = productSchema({
      name: "Система хранения",
      description: "Проектируется под параметры объекта.",
      image: "https://example.test/image.webp",
      sku: "TEST-1",
      url: "https://example.test/catalog/test/product"
    });

    expect(schema).not.toHaveProperty("offers");
  });

  it("supports explicit fallback tombstones without treating drafts as deletions", () => {
    const hiddenId = excelHomeCatalog[0].id;
    const categories = mergeCatalogCategories([], [hiddenId]);

    expect(categories.some((category) => category.id === hiddenId)).toBe(false);
  });

  it("keeps CMS media crawlable while blocking admin and API discovery", () => {
    const config = robots();
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;

    expect(rule.disallow).toContain("/admin/");
    expect(rule.disallow).toContain("/api/");
    expect(rule.allow).toContain("/api/media/file/");
    expect(config.sitemap).toContain("/sitemap.xml");
  });
});
