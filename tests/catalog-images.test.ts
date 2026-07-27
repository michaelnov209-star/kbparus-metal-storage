import { describe, expect, it } from "vitest";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import {
  catalogImageManifest,
  getLocalCatalogImageVariants
} from "@/lib/cms/catalog-image-variants";

describe("catalog image variants", () => {
  it("contains an optimized responsive set for every fallback category", () => {
    expect(Object.keys(catalogImageManifest)).toHaveLength(excelHomeCatalog.length);

    for (const item of excelHomeCatalog) {
      const variants = getLocalCatalogImageVariants(item.image);
      expect(variants).toBeDefined();
      expect(variants?.thumb).toMatch(/-320-[a-f0-9]{10}\.webp$/);
      expect(variants?.medium).toMatch(/-640-[a-f0-9]{10}\.webp$/);
      expect(variants?.large).toMatch(/-960-[a-f0-9]{10}\.webp$/);
      expect(new Set(Object.values(variants ?? {})).size).toBe(3);
    }
  });

  it("does not invent variants for an unknown asset", () => {
    expect(getLocalCatalogImageVariants("/assets/images/catalog/unknown.png")).toBeUndefined();
  });
});
