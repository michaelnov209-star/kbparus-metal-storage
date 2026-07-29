import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => null)
}));

import { catalogProducts, catalogSubcategories } from "@/data/storageSystems/catalogDepth";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { DEFAULT_HERO_VIDEO } from "@/lib/media/hero";
import {
  buildCategorySeeds,
  buildHomeContentSeed,
  buildProductSeeds,
  buildSubcategorySeeds,
  CURRENT_STATE_ASSETS,
  mergeMissingState
} from "@/lib/cms/current-state-sync";
import { syncCurrentStateAsset } from "@/lib/cms/current-state-sync-runtime";

describe("CMS current-state fallback model", () => {
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
});
