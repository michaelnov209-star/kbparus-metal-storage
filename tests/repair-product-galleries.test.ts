import { describe, expect, it, vi } from "vitest";
import { runProductGalleryRepair } from "@/scripts/cms/repair-product-galleries";

describe("standalone product gallery repair", () => {
  it("repairs drafts and published products without changing publication state", async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({
        docs: [{ id: 10, image: 900 }]
      })
      .mockResolvedValueOnce({
        docs: [
          {
            _status: "draft",
            category: 10,
            gallery: [
              { id: "draft-main", image: 100 },
              { id: "draft-angle", image: 200 }
            ],
            id: "draft-product",
            image: 100,
            slug: "draft-product"
          },
          {
            _status: "published",
            category: 10,
            gallery: [
              { id: "published-angle", image: 300 },
              { id: "published-duplicate", image: 300 }
            ],
            id: "published-product",
            image: 100,
            slug: "published-product"
          }
        ]
      });
    const update = vi.fn(async () => undefined);

    const result = await runProductGalleryRepair({
      apply: true,
      cms: { find, update } as never,
      log: vi.fn()
    });

    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "products",
        draft: true
      })
    );
    expect(update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: {
          _status: "draft",
          gallery: [{ id: "draft-angle", image: 200 }]
        },
        draft: true,
        id: "draft-product"
      })
    );
    expect(update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: {
          _status: "published",
          gallery: [{ id: "published-angle", image: 300 }]
        },
        draft: false,
        id: "published-product"
      })
    );
    expect(result).toEqual({
      affectedProducts: 2,
      removedRows: 2,
      updatedProducts: 2
    });
  });

  it("keeps audit mode read-only", async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({
        docs: [
          {
            _status: "draft",
            gallery: [{ image: 100 }, { image: 100 }],
            id: "draft-product",
            image: 200,
            slug: "draft-product"
          }
        ]
      });
    const update = vi.fn();

    const result = await runProductGalleryRepair({
      apply: false,
      cms: { find, update } as never,
      log: vi.fn()
    });

    expect(update).not.toHaveBeenCalled();
    expect(result).toEqual({
      affectedProducts: 1,
      removedRows: 1,
      updatedProducts: 0
    });
  });
});
