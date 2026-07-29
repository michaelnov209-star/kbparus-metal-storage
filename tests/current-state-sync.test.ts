import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => null)
}));

import { catalogProducts, catalogSubcategories } from "@/data/storageSystems/catalogDepth";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed";
import { DEFAULT_HERO_VIDEO } from "@/lib/media/hero";
import {
  buildCategorySeeds,
  buildHomeContentSeed,
  buildProductSeeds,
  buildSubcategorySeeds,
  CURRENT_STATE_ASSETS,
  mergeMissingState
} from "@/lib/cms/current-state-sync";
import {
  buildManagedHomeVisualPatch,
  buildManagedVisualPatch,
  currentStateRuntimeLimits,
  repairProductGalleries,
  syncCurrentStateAsset,
  syncCurrentStateContent
} from "@/lib/cms/current-state-sync-runtime";

describe("CMS current-state fallback model", () => {
  it("repairs stored product galleries without deleting valid secondary photos", async () => {
    const cms = {
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === "categories") {
          return {
            docs: [{ id: 1, image: 50, slug: "category" }],
            hasNextPage: false
          };
        }
        if (collection === "products") {
          return {
            docs: [
              {
                _status: "published",
                category: 1,
                gallery: [
                  { id: "primary", image: 10 },
                  { id: "valid", image: 20 },
                  { id: "duplicate", image: 20 },
                  { id: "category", image: 50 }
                ],
                id: 2,
                image: 10,
                slug: "product"
              }
            ],
            hasNextPage: false
          };
        }
        return { docs: [], hasNextPage: false };
      }),
      findGlobal: vi.fn(async () => ({})),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
    };

    const result = await repairProductGalleries(cms as never);

    expect(result).toEqual({ removedRows: 3, updatedProducts: 1 });
    expect(cms.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        data: {
          _status: "published",
          gallery: [{ id: "valid", image: 20 }]
        },
        draft: false,
        id: 2
      })
    );
  });

  it("registers every fixed asset once, including both hero videos and poster", () => {
    const paths = CURRENT_STATE_ASSETS.map((asset) => asset.publicPath);

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain(DEFAULT_HERO_VIDEO.desktopUrl);
    expect(paths).toContain(DEFAULT_HERO_VIDEO.mobileUrl);
    expect(paths).toContain(DEFAULT_HERO_VIDEO.posterUrl);
    expect(paths.every((path) => path.startsWith("/assets/"))).toBe(true);
    for (const path of paths) {
      const filePath = join(process.cwd(), "public", path.replace(/^\//, ""));
      expect(existsSync(filePath), `missing current asset ${path}`).toBe(true);
      expect(statSync(filePath).size, `oversized current asset ${path}`).toBeLessThanOrEqual(
        15 * 1024 * 1024
      );
    }
  });

  it("fills nested gaps without overwriting explicit editor values", () => {
    const current = {
      title: "Свой заголовок",
      enabled: false,
      count: 0,
      hero: { type: "video", video: null },
      cards: [{ title: "Первая", image: null, description: "Свой текст" }]
    };
    const fallback = {
      title: "Заголовок по умолчанию",
      enabled: true,
      count: 15,
      hero: { type: "image", video: 41 },
      cards: [
        {
          title: "Первая",
          image: 42,
          description: "Текст по умолчанию"
        },
        { title: "Вторая", image: 43, description: "Не добавлять" }
      ]
    };

    const merged = mergeMissingState(
      current as Record<string, unknown>,
      fallback as Record<string, unknown>
    );

    expect(merged.value).toEqual({
      title: "Свой заголовок",
      enabled: false,
      count: 0,
      hero: { type: "video", video: 41 },
      cards: [{ title: "Первая", image: 42, description: "Свой текст" }]
    });
    expect(merged.updatedFields).toBe(2);
  });

  it("keeps intentionally emptied arrays authoritative", () => {
    const merged = mergeMissingState(
      { gallery: [], applications: [] },
      {
        gallery: [{ image: 42 }],
        applications: [{ value: "Производство" }]
      }
    );

    expect(merged.value).toEqual({ gallery: [], applications: [] });
    expect(merged.updatedFields).toBe(0);
  });

  it("builds Payload-ready home and complete catalog seeds", () => {
    const mediaIds = new Map(
      CURRENT_STATE_ASSETS.map((asset, index) => [
        asset.publicPath,
        `media-${index + 1}`
      ])
    );
    const categories = buildCategorySeeds(mediaIds);
    const categoryIds = new Map(
      categories.map((category, index) => [
        String(category.slug),
        `category-${index + 1}`
      ])
    );
    const subcategories = buildSubcategorySeeds(mediaIds, categoryIds);
    const subcategoryIds = new Map(
      subcategories.map((subcategory, index) => [
        String(subcategory.slug),
        `subcategory-${index + 1}`
      ])
    );
    const products = buildProductSeeds(
      mediaIds,
      categoryIds,
      subcategoryIds
    );
    const home = buildHomeContentSeed(mediaIds);

    expect(categories).toHaveLength(excelHomeCatalog.length);
    expect(subcategories).toHaveLength(catalogSubcategories.length);
    expect(products).toHaveLength(catalogProducts.length);
    expect(home.hero).toMatchObject({
      background: {
        type: "video",
        video: expect.any(String),
        mobileVideo: expect.any(String),
        poster: expect.any(String)
      }
    });
    expect(products[0]).toMatchObject({
      category: expect.any(String),
      image: expect.any(String),
      legacyImagePath: expect.stringMatching(/^\/assets\//)
    });
    const firstProduct = catalogProducts[0];
    const firstProductSeed = products.find(
      (product) => product.slug === firstProduct.id
    );
    expect(
      (firstProductSeed?.gallery as Array<{ image: string }> | undefined) ?? []
    ).not.toContainEqual({ image: mediaIds.get(firstProduct.image) });
  });

  it("refreshes only seed-managed catalog images and preserves editor uploads", () => {
    const managedIds = new Set(["legacy-main", "legacy-angle"]);
    const seed = {
      gallery: [{ image: "safe-angle" }],
      image: "safe-main",
      legacyGalleryPaths: [{ path: "/assets/safe-angle.webp" }],
      legacyImagePath: "/assets/safe-main.webp"
    };

    expect(
      buildManagedVisualPatch(
        "products",
        {
          gallery: [{ image: "legacy-angle" }],
          image: "legacy-main"
        },
        seed,
        managedIds
      )
    ).toEqual(seed);

    expect(
      buildManagedVisualPatch(
        "products",
        {
          gallery: [{ image: "editor-angle" }],
          image: "editor-main"
        },
        seed,
        managedIds
      )
    ).toEqual({});
  });

  it("refreshes managed home media while preserving editor-selected images and row content", () => {
    const patch = buildManagedHomeVisualPatch(
      {
        hero: {
          background: {
            poster: "legacy-poster",
            video: "editor-video"
          },
          title: "Заголовок редактора"
        },
        storedMaterials: [
          {
            id: "row-1",
            title: "Листовой металл",
            description: "Текст редактора",
            image: "legacy-sheet"
          },
          {
            id: "row-2",
            title: "Трубы и профиль",
            description: "Другой текст",
            image: "editor-tubes"
          }
        ]
      },
      {
        hero: {
          background: {
            poster: "safe-poster",
            video: "seed-video"
          }
        },
        storedMaterials: [
          { title: "Листовой металл", image: "safe-sheet" },
          { title: "Трубы и профиль", image: "seed-tubes" }
        ]
      },
      new Set(["legacy-poster", "legacy-sheet"])
    );

    expect(patch).toEqual({
      hero: {
        background: {
          poster: "safe-poster",
          video: "editor-video"
        },
        title: "Заголовок редактора"
      },
      storedMaterials: [
        {
          id: "row-1",
          title: "Листовой металл",
          description: "Текст редактора",
          image: "safe-sheet"
        },
        {
          id: "row-2",
          title: "Трубы и профиль",
          description: "Другой текст",
          image: "editor-tubes"
        }
      ]
    });
  });

  it("copies fetched bytes into a Blob-safe upload buffer", async () => {
    const asset = CURRENT_STATE_ASSETS[0];
    let upload: Record<string, unknown> | undefined;
    const cms = {
      find: vi.fn(async () => ({ docs: [] })),
      create: vi.fn(async (args: Record<string, unknown>) => {
        upload = args;
        return { id: 91 };
      })
    };
    const fetcher = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3, 4]), {
          headers: { "content-type": asset.mimeType }
        })
    );

    const result = await syncCurrentStateAsset(
      cms as never,
      asset.key,
      "https://kbparus-metal-storage.vercel.app/api/admin/cms/current-state",
      fetcher
    );

    const file = upload?.file as { data: Buffer };
    expect(result).toEqual({ created: true, id: 91 });
    expect(Buffer.isBuffer(file.data)).toBe(true);
    expect(file.data.buffer).toBeInstanceOf(ArrayBuffer);
    expect(file.data.buffer).not.toBeInstanceOf(SharedArrayBuffer);
  });

  it("reads every CMS page instead of truncating a large collection", async () => {
    const asset = CURRENT_STATE_ASSETS[0];
    const matchingDoc = {
      id: "media-on-page-2",
      filename: "existing.mp4",
      internalTitle: `Legacy asset: ${asset.publicPath}`,
      url: "/api/media/file/existing.mp4"
    };
    const cms = {
      find: vi
        .fn()
        .mockResolvedValueOnce({
          docs: [{ id: "unrelated-page-1", internalTitle: "Другое" }],
          hasNextPage: true,
          nextPage: 2
        })
        .mockResolvedValueOnce({
          docs: [matchingDoc],
          hasNextPage: false,
          nextPage: null
        }),
      create: vi.fn()
    };
    const fetcher = vi.fn(async () => new Response(new Uint8Array([1])));

    const result = await syncCurrentStateAsset(
      cms as never,
      asset.key,
      "https://kbparus-metal-storage.vercel.app/api/admin/cms/current-state",
      fetcher
    );

    expect(result).toEqual({ created: false, id: matchingDoc.id });
    expect(cms.find).toHaveBeenCalledTimes(2);
    expect(cms.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: currentStateRuntimeLimits.collectionPageSize,
        page: 1,
        pagination: true,
        sort: "id"
      })
    );
    expect(cms.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 2 })
    );
    expect(cms.create).not.toHaveBeenCalled();
  });

  it("installs profiles before products and uses their published IDs", async () => {
    const cms = {
      create: vi.fn(
        async ({
          collection,
          data
        }: {
          collection: string;
          data: Record<string, unknown>;
        }) => ({
          ...data,
          id: `${collection}-${String(data.slug ?? "record")}`
        })
      ),
      find: vi.fn(async () => ({
        docs: [],
        hasNextPage: false,
        nextPage: null
      })),
      findGlobal: vi.fn(async () => ({})),
      update: vi.fn(),
      updateGlobal: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
    };

    const result = await syncCurrentStateContent(
      cms as never,
      "https://kbparus-metal-storage.vercel.app/api/admin/cms/current-state"
    );
    const linkedProduct = catalogProducts.find(
      (product) => product.calculatorProfileId
    )!;
    const productCreate = cms.create.mock.calls.find(
      ([args]) =>
        args.collection === "products" &&
        args.data.slug === linkedProduct.id
    )?.[0];

    expect(
      cms.create.mock.calls.filter(
        ([args]) => args.collection === "calculator-profiles"
      )
    ).toHaveLength(calculatorProfileSeeds.length);
    expect(productCreate?.data).toMatchObject({
      calculatorProfile: `calculator-profiles-${linkedProduct.calculatorProfileId}`
    });
    expect(result.createdRecords).toBe(
      calculatorProfileSeeds.length +
        excelHomeCatalog.length +
        catalogSubcategories.length +
        catalogProducts.length
    );
  });

  it("repairs a legacy media record when its Blob file is missing", async () => {
    const asset = CURRENT_STATE_ASSETS.find(
      (item) => item.publicPath.endsWith(".webp")
    )!;
    let upload: Record<string, unknown> | undefined;
    const cms = {
      find: vi.fn(async () => ({
        docs: [
          {
            id: 44,
            filename: "broken.webp",
            internalTitle: `Legacy asset: ${asset.publicPath}`,
            url: "/api/media/file/broken.webp"
          }
        ]
      })),
      create: vi.fn(),
      update: vi.fn(async (args: Record<string, unknown>) => {
        upload = args;
        return { id: 44 };
      })
    };
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (init?.headers && "range" in init.headers) {
        expect(url).toBe(
          "https://kbparus-metal-storage.vercel.app/api/media/file/broken.webp"
        );
        return new Response(null, { status: 404 });
      }
      return new Response(new Uint8Array([7, 8, 9]), {
        headers: { "content-type": asset.mimeType }
      });
    });

    const result = await syncCurrentStateAsset(
      cms as never,
      asset.key,
      "https://kbparus-metal-storage.vercel.app/api/admin/cms/current-state",
      fetcher as typeof fetch
    );

    expect(result).toEqual({ created: false, id: 44 });
    expect(cms.create).not.toHaveBeenCalled();
    expect(cms.update).toHaveBeenCalledTimes(1);
    expect(upload).toMatchObject({
      collection: "media",
      id: 44,
      file: {
        name: expect.stringMatching(/\.webp$/),
        size: 3
      }
    });
  });

  it("does not probe an untrusted media URL", async () => {
    const asset = CURRENT_STATE_ASSETS[0];
    const cms = {
      find: vi.fn(async () => ({
        docs: [
          {
            id: 77,
            filename: "unsafe.mp4",
            internalTitle: `Legacy asset: ${asset.publicPath}`,
            url: "https://attacker.example/internal"
          }
        ]
      })),
      update: vi.fn(async () => ({ id: 77 }))
    };
    const fetcher = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": asset.mimeType }
        })
    );

    await syncCurrentStateAsset(
      cms as never,
      asset.key,
      "https://kbparus-metal-storage.vercel.app/api/admin/cms/current-state",
      fetcher
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      new URL(
        asset.publicPath,
        "https://kbparus-metal-storage.vercel.app"
      ),
      expect.objectContaining({ redirect: "error" })
    );
  });
});
