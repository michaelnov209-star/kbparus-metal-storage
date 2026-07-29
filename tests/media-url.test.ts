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

  it("keeps the Payload media route backed by the cloud-storage handler", () => {
    expect(
      resolveCmsMediaUrl(
        { url: "/api/media/file/item.jpg" },
        { fallback: "/assets/images/catalog/item.jpg" }
      )
    ).toBe("/api/media/file/item.jpg");
  });

  it("keeps an absolute same-site Payload media URL", () => {
    expect(
      resolveCmsMediaUrl(
        {
          url: "https://kbparus-metal-storage.vercel.app/api/media/file/item.jpg"
        },
        { fallback: "/assets/images/catalog/item.jpg" }
      )
    ).toBe(
      "https://kbparus-metal-storage.vercel.app/api/media/file/item.jpg"
    );
  });

  it("uses the requested Payload-generated responsive size", () => {
    expect(
      resolveCmsMediaUrl(
        {
          url: "https://example.public.blob.vercel-storage.com/item.jpg",
          sizes: { thumb: { filename: "item-thumb.jpg" } }
        },
        { size: "thumb", fallback: "/assets/images/catalog/item.jpg" }
      )
    ).toBe("/api/media/file/item-thumb.jpg");
  });

  it("returns the fallback when media is missing", () => {
    expect(resolveCmsMediaUrl(null, { fallback: "/assets/images/fallback.jpg" })).toBe(
      "/assets/images/fallback.jpg"
    );
  });
});
