import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCmsClientMock } = vi.hoisted(() => ({
  getCmsClientMock: vi.fn()
}));

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: getCmsClientMock
}));

import { catalogProducts } from "@/data/storageSystems/catalogDepth";
import { getCatalogProducts, normalizeCmsProduct } from "@/lib/cms/products";
import { getLocalProductImageVariants } from "@/lib/cms/product-image-variants";

describe("CMS product media normalization", () => {
  it("keeps the optimized static fallback for synced legacy product media", () => {
    const product = normalizeCmsProduct({
      slug: "warehouse-management-system",
      title: "Warehouse Management System",
      summary: "Summary",
      description: "Description",
      category: { slug: "warehouse-erp" },
      legacyImagePath:
        "/assets/images/products/warehouse-erp/warehouse-management-system.png",
      image: {
        internalTitle:
          "Legacy asset: /assets/images/products/warehouse-erp/warehouse-management-system.png",
        url: "/api/media/file/warehouse-management-system.webp",
        sizes: {
          thumb: {
            url: "/api/media/file/warehouse-management-system-320.webp"
          },
          medium: {
            url: "/api/media/file/warehouse-management-system-800.webp"
          },
          large: {
            url: "/api/media/file/warehouse-management-system-1600.webp"
          }
        }
      }
    });

    expect(product?.image).toBe(
      "/assets/images/products/warehouse-erp/warehouse-management-system.png"
    );
    expect(product?.imageThumb).toMatch(
      /^\/assets\/images\/products\/optimized\/.+-320\.webp$/
    );
    expect(product?.imageMedium).toMatch(
      /^\/assets\/images\/products\/optimized\/.+-800\.webp$/
    );
    expect(product?.imageLarge).toMatch(
      /^\/assets\/images\/products\/optimized\/.+-1536\.webp$/
    );
  });

  it("uses the current seed image when a managed legacy product asset was replaced", () => {
    const product = normalizeCmsProduct({
      slug: "forklift-cassette-rack",
      title: "Кассетный стеллаж под погрузчик",
      summary: "Summary",
      description: "Description",
      category: { slug: "manual-sheet-metal" },
      legacyImagePath: "/assets/images/products/manual-sheet-metal/2.1.png",
      image: {
        internalTitle:
          "Legacy asset: /assets/images/products/manual-sheet-metal/2.1.png",
        url: "https://store.public.blob.vercel-storage.com/2.1-old.webp"
      }
    });

    expect(product?.image).toBe(
      "/assets/images/products/manual-sheet-metal/2.1-safe-studio.png"
    );
    expect(product?.imageMedium).toMatch(
      /^\/assets\/images\/products\/optimized\/.+-800\.webp$/
    );
  });

  it("keeps responsive gallery sizes from newly uploaded media", () => {
    const product = normalizeCmsProduct({
      slug: "new-product",
      title: "Новый товар",
      summary: "Краткое описание товара.",
      description: "Подробное описание товара.",
      category: { slug: "shelf-racks" },
      image: {
        url: "https://store.public.blob.vercel-storage.com/main.webp",
        sizes: {
          thumb: {
            url: "https://store.public.blob.vercel-storage.com/main-320.webp"
          },
          medium: {
            url: "https://store.public.blob.vercel-storage.com/main-800.webp"
          },
          large: {
            url: "https://store.public.blob.vercel-storage.com/main-1600.webp"
          }
        }
      },
      gallery: [
        {
          image: {
            id: 101,
            url: "https://store.public.blob.vercel-storage.com/angle.webp",
            sizes: {
              thumb: {
                url: "https://store.public.blob.vercel-storage.com/angle-320.webp"
              },
              medium: {
                url: "https://store.public.blob.vercel-storage.com/angle-800.webp"
              },
              large: {
                url: "https://store.public.blob.vercel-storage.com/angle-1600.webp"
              }
            }
          }
        }
      ]
    });

    expect(product).not.toBeNull();
    expect(product?.gallery).toEqual([
      "https://store.public.blob.vercel-storage.com/angle-800.webp"
    ]);
    expect(product?.galleryThumbs).toEqual([
      "https://store.public.blob.vercel-storage.com/angle-320.webp"
    ]);
    expect(product?.galleryMediums).toEqual([
      "https://store.public.blob.vercel-storage.com/angle-800.webp"
    ]);
    expect(product?.galleryLarges).toEqual([
      "https://store.public.blob.vercel-storage.com/angle-1600.webp"
    ]);
  });

  it("keeps same-origin editor uploads instead of replacing them with legacy fallbacks", () => {
    const product = normalizeCmsProduct({
      slug: "warehouse-management-system",
      title: "Editor upload",
      summary: "Summary",
      description: "Description",
      category: { slug: "warehouse-erp" },
      legacyImagePath:
        "/assets/images/products/warehouse-erp/warehouse-management-system.png",
      image: {
        internalTitle: "Editor main photo",
        url: "/api/media/file/editor-main.webp",
        sizes: {
          thumb: { url: "/api/media/file/editor-main-320.webp" },
          medium: { url: "/api/media/file/editor-main-800.webp" },
          large: { url: "/api/media/file/editor-main-1600.webp" }
        }
      },
      gallery: [
        {
          image: {
            id: 102,
            internalTitle: "Editor action photo",
            url: "/api/media/file/editor-action.webp",
            sizes: {
              thumb: { url: "/api/media/file/editor-action-320.webp" },
              medium: { url: "/api/media/file/editor-action-800.webp" },
              large: { url: "/api/media/file/editor-action-1600.webp" }
            }
          }
        }
      ]
    });

    expect(product?.image).toBe("/api/media/file/editor-main.webp");
    expect(product?.imageThumb).toBe(
      "/api/media/file/editor-main-320.webp"
    );
    expect(product?.gallery).toEqual([
      "/api/media/file/editor-action-800.webp"
    ]);
    expect(product?.galleryThumbs).toEqual([
      "/api/media/file/editor-action-320.webp"
    ]);
  });

  it("uses the exact managed secondary image after gallery sanitization", () => {
    const mainPath =
      "/assets/images/products/carousel-vertical-module/vertical-carousel-module.png";
    const actionPath =
      "/assets/images/products/carousel-vertical-module/vertical-carousel-module-in-action.png";
    const actionVariants = getLocalProductImageVariants(actionPath);

    const main = {
      id: 65,
      internalTitle: `Legacy asset: ${mainPath}`,
      url: "/api/media/file/vertical-carousel-module.webp"
    };
    const action = {
      id: 66,
      internalTitle: `Legacy asset: ${actionPath}`,
      url: "/api/media/file/vertical-carousel-module-in-action.webp"
    };
    const categoryCover = {
      id: 5,
      internalTitle:
        "Legacy asset: /assets/images/catalog/05-carousel-vertical-module.png",
      url: "/api/media/file/carousel-vertical-module.webp"
    };

    const product = normalizeCmsProduct({
      slug: "vertical-carousel-module",
      title: "Vertical Carousel",
      summary: "Summary",
      description: "Description",
      category: {
        slug: "carousel-vertical-module",
        image: categoryCover
      },
      image: main,
      gallery: [
        { image: main },
        { image: action },
        { image: categoryCover }
      ]
    });

    expect(actionVariants).toBeDefined();
    expect(product?.gallery).toEqual([actionVariants?.medium.src]);
    expect(product?.galleryThumbs).toEqual([actionVariants?.thumb.src]);
    expect(product?.galleryLarges).toEqual([actionVariants?.large.src]);
    expect(product?.gallery).not.toContain(
      getLocalProductImageVariants(mainPath)?.medium.src
    );
  });

  it("keeps each managed legacy image attached to its source after reordering", () => {
    const mainPath = "/assets/images/products/auto-sheet-metal/1.1.jpg";
    const firstPath = "/assets/images/products/auto-sheet-metal/1.2.jpg";
    const secondPath = "/assets/images/products/auto-sheet-metal/1.3.jpg";
    const product = normalizeCmsProduct({
      slug: "compact-3000x1500",
      title: "Compact 3000x1500",
      summary: "Summary",
      description: "Description",
      category: { slug: "auto-sheet-metal" },
      legacyImagePath: mainPath,
      image: {
        id: 11,
        internalTitle: `Legacy asset: ${mainPath}`,
        url: "/api/media/file/1.1.webp"
      },
      legacyGalleryPaths: [{ path: firstPath }, { path: secondPath }],
      gallery: [
        {
          image: {
            id: 13,
            internalTitle: `Legacy asset: ${secondPath}`,
            url: "/api/media/file/1.3.webp"
          }
        },
        {
          image: {
            id: 12,
            internalTitle: `Legacy asset: ${firstPath}`,
            url: "/api/media/file/1.2.webp"
          }
        }
      ]
    });

    expect(product?.gallery).toEqual([
      getLocalProductImageVariants(secondPath)?.medium.src,
      getLocalProductImageVariants(firstPath)?.medium.src
    ]);
  });

  it("uses only secondary static slots when the CMS gallery field is absent", () => {
    const mainPath =
      "/assets/images/products/carousel-vertical-module/vertical-carousel-module.png";
    const actionPath =
      "/assets/images/products/carousel-vertical-module/vertical-carousel-module-in-action.png";

    const product = normalizeCmsProduct({
      slug: "vertical-carousel-module",
      title: "Vertical Carousel",
      summary: "Summary",
      description: "Description",
      category: { slug: "carousel-vertical-module" },
      image: {
        internalTitle: `Legacy asset: ${mainPath}`,
        url: "/api/media/file/vertical-carousel-module.webp"
      }
    });

    expect(product?.gallery).toEqual([
      getLocalProductImageVariants(actionPath)?.medium.src
    ]);
    expect(product?.gallery).not.toContain(
      getLocalProductImageVariants(mainPath)?.medium.src
    );
  });

  it("keeps an explicitly cleared CMS gallery empty", () => {
    const product = normalizeCmsProduct({
      slug: "vertical-carousel-module",
      title: "Vertical Carousel",
      summary: "Summary",
      description: "Description",
      category: { slug: "carousel-vertical-module" },
      legacyImagePath:
        "/assets/images/products/carousel-vertical-module/vertical-carousel-module.png",
      image: {
        internalTitle:
          "Legacy asset: /assets/images/products/carousel-vertical-module/vertical-carousel-module.png",
        url: "/api/media/file/vertical-carousel-module.webp"
      },
      gallery: [],
      legacyGalleryPaths: [
        {
          path: "/assets/images/products/carousel-vertical-module/vertical-carousel-module-in-action.png"
        }
      ]
    });

    expect(product?.gallery).toEqual([]);
    expect(product?.galleryThumbs).toEqual([]);
    expect(product?.galleryMediums).toEqual([]);
    expect(product?.galleryLarges).toEqual([]);
    expect(product?.galleryAlts).toEqual([]);
  });

  it("never exposes the primary image or category cover as secondary product photos", () => {
    const main = {
      id: 10,
      url: "https://store.public.blob.vercel-storage.com/main.webp"
    };
    const categoryCover = {
      id: 20,
      url: "https://store.public.blob.vercel-storage.com/category.webp"
    };
    const action = {
      id: 30,
      url: "https://store.public.blob.vercel-storage.com/action.webp"
    };
    const product = normalizeCmsProduct({
      slug: "sanitized-gallery",
      title: "Товар с чистой галереей",
      summary: "Краткое описание товара.",
      description: "Подробное описание товара.",
      category: { slug: "shelf-racks", image: categoryCover },
      image: main,
      gallery: [
        { image: main },
        { image: action },
        { image: action },
        { image: categoryCover }
      ]
    });

    expect(product?.gallery).toEqual([
      "https://store.public.blob.vercel-storage.com/action.webp"
    ]);
    expect(product?.galleryAlts).toHaveLength(1);
  });

  it("drops executable or protocol-relative legacy document links", () => {
    const product = normalizeCmsProduct({
      slug: "safe-downloads",
      title: "Safe downloads",
      summary: "Summary",
      description: "Description",
      category: { slug: "shelf-racks" },
      image: {
        url: "https://store.public.blob.vercel-storage.com/product.webp"
      },
      documents: [
        { title: "Safe local PDF", href: "/documents/passport.pdf" },
        {
          title: "Safe remote PDF",
          href: "https://cdn.example.com/passport.pdf"
        },
        { title: "Executable link", href: "javascript:alert(1)" },
        { title: "Protocol-relative link", href: "//evil.example/file.pdf" }
      ]
    });

    expect(product?.documents).toEqual([
      { title: "Safe local PDF", href: "/documents/passport.pdf" },
      {
        title: "Safe remote PDF",
        href: "https://cdn.example.com/passport.pdf"
      }
    ]);
  });

  it("publishes every editable product field from the CMS", () => {
    const product = normalizeCmsProduct({
      slug: "edited-product",
      title: "Отредактированный товар",
      shortTitle: "Короткое название",
      sku: "KBP-EDIT-01",
      category: { slug: "manual-sheet-metal" },
      subcategory: { slug: "roll-out-racks" },
      badge: "Выбор инженера",
      summary: "Новое краткое описание.",
      description: "Новое подробное описание существующего товара.",
      image: {
        alt: "Основное фото отредактированного товара",
        url: "https://store.public.blob.vercel-storage.com/edited-main.webp"
      },
      gallery: [
        {
          image: {
            id: 103,
            alt: "Товар в работе",
            url: "https://store.public.blob.vercel-storage.com/edited-action.webp"
          }
        }
      ],
      priceMode: "fixed",
      priceFrom: 500_000,
      priceTo: 750_000,
      priceLabel: "от 500 000 ₽ с НДС",
      pageMode: "configurator",
      calculatorProfile: { slug: "hybrid-rollout-rack" },
      modelName: "Series E",
      operationMode: "mechanized",
      storageMaterials: ["sheet-metal"],
      loadingMethods: ["crane", "vacuum"],
      maxLoadKg: 3000,
      warrantyMonths: 18,
      overallDimensions: {
        lengthMm: 3200,
        widthMm: 1800,
        heightMm: 2400
      },
      installationEnvironments: ["workshop"],
      applications: [{ value: "Участки лазерной резки" }],
      specs: [{ label: "Количество кассет", value: "до 10" }],
      includes: [{ value: "Проверка нагрузки на пол" }],
      documents: [
        {
          title: "Паспорт оборудования",
          file: {
            url: "https://store.public.blob.vercel-storage.com/passport.pdf"
          }
        }
      ],
      featured: true,
      sortOrder: 7,
      seoTitle: "Отредактированный товар | КБ Парус",
      seoDescription: "Новое описание для поисковой выдачи.",
      ogImage: {
        url: "https://store.public.blob.vercel-storage.com/edited-og.webp"
      },
      keywords: [{ value: "стеллаж для листового металла" }],
      noIndex: true
    });

    expect(product).toMatchObject({
      applications: ["Участки лазерной резки"],
      badge: "Выбор инженера",
      calculatorProfileId: "hybrid-rollout-rack",
      categoryId: "manual-sheet-metal",
      description: "Новое подробное описание существующего товара.",
      documents: [
        {
          href: "https://store.public.blob.vercel-storage.com/passport.pdf",
          title: "Паспорт оборудования"
        }
      ],
      featured: true,
      gallery: [
        "https://store.public.blob.vercel-storage.com/edited-action.webp"
      ],
      galleryAlts: ["Товар в работе"],
      image: "https://store.public.blob.vercel-storage.com/edited-main.webp",
      imageAlt: "Основное фото отредактированного товара",
      includes: ["Проверка нагрузки на пол"],
      keywords: ["стеллаж для листового металла"],
      noIndex: true,
      ogImage: "https://store.public.blob.vercel-storage.com/edited-og.webp",
      pageMode: "configurator",
      priceFrom: 500_000,
      priceLabel: "от 500 000 ₽ с НДС",
      priceMode: "fixed",
      priceTo: 750_000,
      seoDescription: "Новое описание для поисковой выдачи.",
      seoTitle: "Отредактированный товар | КБ Парус",
      shortTitle: "Короткое название",
      sku: "KBP-EDIT-01",
      sortOrder: 7,
      subcategoryId: "roll-out-racks",
      summary: "Новое краткое описание.",
      title: "Отредактированный товар"
    });
    expect(product?.specs).toEqual(
      expect.arrayContaining([
        { label: "Модель / серия", value: "Series E" },
        { label: "Количество кассет", value: "до 10" },
        { label: "Максимальная рабочая нагрузка", value: "3 000 кг" }
      ])
    );
  });
});

describe("CMS product catalog authority", () => {
  beforeEach(() => {
    getCmsClientMock.mockReset();
  });

  it("returns only published CMS records when the collection contains records", async () => {
    getCmsClientMock.mockResolvedValue({
      find: vi.fn(async () => ({
        docs: [
          {
            _status: "draft",
            slug: "vertical-carousel-module"
          },
          {
            _status: "published",
            slug: "cms-only-product",
            title: "CMS product",
            summary: "Summary",
            description: "Description",
            category: { slug: "shelf-racks" },
            image: {
              url: "https://store.public.blob.vercel-storage.com/cms-only.webp"
            }
          }
        ]
      }))
    });

    const products = await getCatalogProducts();

    expect(products.map((product) => product.id)).toEqual([
      "cms-only-product"
    ]);
    expect(products.some((product) => product.id === "vertical-carousel-module"))
      .toBe(false);
  });

  it("uses the static catalog only when the CMS collection is empty", async () => {
    getCmsClientMock.mockResolvedValue({
      find: vi.fn(async () => ({ docs: [] }))
    });

    const products = await getCatalogProducts();

    expect(products).toHaveLength(catalogProducts.length);
    expect(products.map((product) => product.id)).toContain(
      "vertical-carousel-module"
    );
  });

  it("does not resurrect static products when the CMS contains only drafts", async () => {
    getCmsClientMock.mockResolvedValue({
      find: vi.fn(async ({ draft }: { draft?: boolean }) =>
        draft
          ? {
              docs: [
                {
                  _status: "draft",
                  slug: "vertical-carousel-module"
                }
              ],
              totalDocs: 1
            }
          : { docs: [], totalDocs: 0 }
      )
    });

    const products = await getCatalogProducts();

    expect(products).toEqual([]);
  });

  it("uses the static catalog when the CMS is unavailable", async () => {
    getCmsClientMock.mockResolvedValue(null);

    const products = await getCatalogProducts();

    expect(products).toHaveLength(catalogProducts.length);
  });
});
