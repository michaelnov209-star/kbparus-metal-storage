import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogProducts } from "@/data/storageSystems/catalogDepth";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";

describe("catalog product coverage", () => {
  it("keeps every public category populated", () => {
    const productCounts = new Map<string, number>();
    for (const product of catalogProducts) {
      productCounts.set(
        product.categoryId,
        (productCounts.get(product.categoryId) ?? 0) + 1
      );
    }

    for (const category of excelHomeCatalog) {
      expect(
        productCounts.get(category.id),
        `empty category ${category.id}`
      ).toBeGreaterThan(0);
    }
  });

  it("uses unique product addresses and complete local galleries", () => {
    const ids = catalogProducts.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const product of catalogProducts) {
      expect(product.gallery.length, `${product.id} gallery`).toBeGreaterThanOrEqual(2);
      expect(product.galleryAlts?.length ?? product.gallery.length).toBe(
        product.gallery.length
      );
      expect(
        product.gallery.some((source) =>
          source.startsWith("/assets/images/catalog/")
        ),
        `${product.id} must not reuse a category cover inside its product gallery`
      ).toBe(false);

      for (const source of [product.image, ...product.gallery]) {
        if (!source.startsWith("/assets/")) continue;
        expect(
          existsSync(join(process.cwd(), "public", source.slice(1))),
          `missing ${source}`
        ).toBe(true);
      }
    }
  });
});
