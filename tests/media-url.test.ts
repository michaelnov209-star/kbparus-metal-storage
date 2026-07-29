import { describe, expect, it } from "vitest";
import { resolveCmsMediaUrl } from "@/lib/cms/media-url";

describe("resolveCmsMediaUrl", () => {
  it("keeps absolute CDN URLs from Payload", () => {
    expect(
      resolveCmsMediaUrl(
        { url: "https://example.public.blob.vercel-storage.com/catalog/item.webp" },
        { fallback: "/assets/images/catalog/item.jpg" }
      )
    ).toBe("https://example.public.blob.vercel-storage.com/catalog/item.webp");
  });

  it("uses a versioned public asset for legacy records with broken derived Blob names", () => {
    expect(
      resolveCmsMediaUrl(
        { url: "/api/media/file/item.jpg" },
        { fallback: "/assets/images/catalog/item.jpg" }
      )
    ).toBe("/assets/images/catalog/item.jpg");
  });

  it("prefers the current fallback for managed legacy media even when its old Blob URL still works", () => {
    expect(
      resolveCmsMediaUrl(
        {
          internalTitle: "Legacy asset: /assets/images/catalog/old-item.jpg",
          url: "https://example.public.blob.vercel-storage.com/old-item.webp"
        },
        { fallback: "/assets/images/catalog/current-item.webp" }
      )
    ).toBe("/assets/images/catalog/current-item.webp");
  });

  it("recognizes an absolute same-site Payload proxy and uses the legacy fallback", () => {
    expect(
      resolveCmsMediaUrl(
        {
          url: "https://kbparus-metal-storage.vercel.app/api/media/file/item.jpg"
        },
        { fallback: "/assets/images/catalog/item.jpg" }
      )
    ).toBe("/assets/images/catalog/item.jpg");
  });

  it("uses the fallback when a legacy derived-size URL is local", () => {
    expect(
      resolveCmsMediaUrl(
        {
          url: "https://example.public.blob.vercel-storage.com/item.jpg",
          sizes: { thumb: { filename: "item-thumb.jpg" } }
        },
        { size: "thumb", fallback: "/assets/images/catalog/item.jpg" }
      )
    ).toBe("/assets/images/catalog/item.jpg");
  });

  it("returns the fallback when media is missing", () => {
    expect(resolveCmsMediaUrl(null, { fallback: "/assets/images/fallback.jpg" })).toBe(
      "/assets/images/fallback.jpg"
    );
  });
});
