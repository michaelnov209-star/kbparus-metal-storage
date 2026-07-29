import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath }));

import type { CatalogProduct } from "@/data/storageSystems/catalogDepth";
import { getProductGallerySlots } from "@/lib/catalog/product-gallery";
import { getProductPriceLabel } from "@/lib/catalog/product-price";
import {
  revalidateProductAfterChange,
  revalidateProductAfterDelete
} from "@/payload/hooks/revalidateProduct";
import { normalizeProductGallery } from "@/payload/hooks/normalizeProductGallery";
import { Products } from "@/payload/collections/Products";

function product(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    applications: [],
    badge: "Товар",
    categoryId: "category",
    description: "Подробное описание",
    gallery: [],
    id: "product",
    image: "/main.webp",
    includes: [],
    pageMode: "standard",
    priceMode: "request",
    shortTitle: "Товар",
    sku: "SKU",
    specs: [],
    summary: "Краткое описание",
    title: "Товар",
    ...overrides
  };
}

describe("published product editing", () => {
  beforeEach(() => revalidatePath.mockClear());

  it("invalidates all catalog pages after a published save", async () => {
    await revalidateProductAfterChange({
      doc: { _status: "published" },
      previousDoc: { _status: "draft" }
    } as never);

    expect(revalidatePath).toHaveBeenCalledWith("/catalog", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("does not flush the public catalog for a draft-only save", async () => {
    await revalidateProductAfterChange({
      doc: { _status: "draft" },
      previousDoc: { _status: "draft" }
    } as never);

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates the catalog after deleting a published product", async () => {
    await revalidateProductAfterDelete({
      doc: { _status: "published" }
    } as never);

    expect(revalidatePath).toHaveBeenCalledWith("/catalog", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });
});

describe("product gallery editor guardrails", () => {
  it("removes the primary image, category cover and repeated secondary media", async () => {
    const findByID = vi.fn(async () => ({ image: 900 }));
    const data = await normalizeProductGallery({
      data: {
        category: 10,
        gallery: [
          { id: "row-1", image: 100 },
          { id: "row-2", image: 200 },
          { id: "row-3", image: 200 },
          { id: "row-4", image: 900 }
        ],
        image: 100
      },
      req: {
        payload: {
          findByID,
          logger: { warn: vi.fn() }
        }
      }
    } as never);

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "categories",
        depth: 0,
        id: 10
      })
    );
    expect(data?.gallery).toEqual([{ id: "row-2", image: 200 }]);
  });

  it("keeps a valid gallery when category media lookup is unavailable", async () => {
    const warn = vi.fn();
    const data = await normalizeProductGallery({
      data: {
        category: 10,
        gallery: [{ image: 200 }],
        image: 100
      },
      req: {
        payload: {
          findByID: vi.fn(async () => {
            throw new Error("temporary database error");
          }),
          logger: { warn }
        }
      }
    } as never);

    expect(data?.gallery).toEqual([{ image: 200 }]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("normalizes the existing gallery after a partial main-image PATCH", async () => {
    const data = await normalizeProductGallery({
      data: { image: 200 },
      originalDoc: {
        category: 10,
        gallery: [
          { id: "old-main", image: 100 },
          { id: "new-main", image: 200 },
          { id: "category-cover", image: 900 }
        ],
        image: 100
      },
      req: {
        payload: {
          findByID: vi.fn(async () => ({ image: 900 })),
          logger: { warn: vi.fn() }
        }
      }
    } as never);

    expect(data?.gallery).toEqual([{ id: "old-main", image: 100 }]);
  });

  it("normalizes the existing gallery after a partial category PATCH", async () => {
    const findByID = vi.fn(async () => ({ image: 901 }));
    const data = await normalizeProductGallery({
      data: { category: 11 },
      originalDoc: {
        category: 10,
        gallery: [
          { id: "angle", image: 200 },
          { id: "new-category-cover", image: 901 },
          { id: "duplicate", image: 200 }
        ],
        image: 100
      },
      req: {
        payload: {
          findByID,
          logger: { warn: vi.fn() }
        }
      }
    } as never);

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "categories", id: 11 })
    );
    expect(data?.gallery).toEqual([{ id: "angle", image: 200 }]);
  });

  it("drops incomplete relation rows instead of retaining broken gallery items", async () => {
    const data = await normalizeProductGallery({
      data: {
        category: { id: 10, image: 900 },
        gallery: [
          {},
          { image: null },
          { image: "   " },
          { image: { value: { id: "nested-media" } } }
        ],
        image: 100
      },
      req: {
        payload: {
          findByID: vi.fn(),
          logger: { warn: vi.fn() }
        }
      }
    } as never);

    expect(data?.gallery).toEqual([
      { image: { value: { id: "nested-media" } } }
    ]);
  });
});

describe("product media field limits", () => {
  function findField(
    fields: unknown[],
    name: string
  ): Record<string, unknown> | undefined {
    for (const value of fields) {
      if (!value || typeof value !== "object") continue;
      const field = value as Record<string, unknown>;
      if (field.name === name) return field;

      if (Array.isArray(field.fields)) {
        const nested = findField(field.fields, name);
        if (nested) return nested;
      }
      if (Array.isArray(field.tabs)) {
        for (const tabValue of field.tabs) {
          if (!tabValue || typeof tabValue !== "object") continue;
          const tab = tabValue as Record<string, unknown>;
          if (!Array.isArray(tab.fields)) continue;
          const nested = findField(tab.fields, name);
          if (nested) return nested;
        }
      }
    }
    return undefined;
  }

  it("requires one main image and caps the secondary gallery at 12 rows", () => {
    const fields = Products.fields as unknown[];
    const image = findField(fields, "image");
    const gallery = findField(fields, "gallery");

    expect(image?.required).toBe(true);
    expect(gallery?.maxRows).toBe(12);
  });
});

describe("product storefront presentation", () => {
  it("always shows the editor main image first and removes repeated media", () => {
    const slots = getProductGallerySlots(
      product({
        gallery: ["/main-800.webp", "/angle-800.webp"],
        galleryMediums: ["/main-800.webp", "/angle-800.webp"],
        image: "/main.webp",
        imageMedium: "/main-800.webp"
      })
    );

    expect(slots).toEqual([
      { index: -1, isMain: true, source: "/main.webp" },
      { index: 1, isMain: false, source: "/angle-800.webp" }
    ]);
  });

  it("uses the complete price range and respects a custom public label", () => {
    expect(
      getProductPriceLabel({
        priceFrom: 500_000,
        priceMode: "fixed",
        priceTo: 750_000
      })
    ).toMatch(/500.+750/);
    expect(
      getProductPriceLabel({
        priceFrom: 500_000,
        priceLabel: "После инженерного расчёта",
        priceMode: "fixed",
        priceTo: 750_000
      })
    ).toBe("После инженерного расчёта");
  });
});
