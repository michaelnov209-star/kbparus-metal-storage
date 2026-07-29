import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => null)
}));

import { normalizeCmsProduct } from "@/lib/cms/products";

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
});
