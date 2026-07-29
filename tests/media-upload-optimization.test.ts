import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Media } from "@/payload/collections/Media";

describe("CMS media upload optimization", () => {
  it("converts uploaded images to WebP and caps oversized originals", () => {
    const upload = Media.upload;
    expect(upload).toBeTruthy();
    if (!upload || typeof upload === "boolean") return;

    expect(upload.formatOptions).toMatchObject({
      format: "webp",
      options: { quality: 82 }
    });
    expect(upload.resizeOptions).toMatchObject({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true
    });
  });

  it("creates responsive WebP variants for cards and full product pages", () => {
    const upload = Media.upload;
    expect(upload).toBeTruthy();
    if (!upload || typeof upload === "boolean") return;

    expect(
      upload.imageSizes?.map((size) => ({
        format: size.formatOptions?.format,
        height: size.height,
        name: size.name,
        width: size.width
      }))
    ).toEqual([
      { format: "webp", height: undefined, name: "thumb", width: 320 },
      { format: "webp", height: undefined, name: "medium", width: 800 },
      { format: "webp", height: undefined, name: "large", width: 1600 },
      { format: "webp", height: 240, name: "cardSm", width: 320 },
      { format: "webp", height: 480, name: "cardMd", width: 640 },
      { format: "webp", height: 720, name: "cardLg", width: 960 }
    ]);
  });

  it("rejects unsafe image formats while keeping business documents and video", () => {
    const upload = Media.upload;
    expect(upload).toBeTruthy();
    if (!upload || typeof upload === "boolean") return;

    expect(upload.mimeTypes).toContain("image/avif");
    expect(upload.mimeTypes).toContain("application/pdf");
    expect(upload.mimeTypes).not.toContain("image/svg+xml");
    expect(upload.mimeTypes).not.toContain("text/html");
    expect(upload.mimeTypes).not.toContain("application/xml");
    expect(upload.mimeTypes).not.toContain("text/javascript");
    expect(upload.allowRestrictedFileTypes).toBe(false);
  });

  it("limits image decompression and disables browser MIME sniffing", () => {
    const upload = Media.upload;
    expect(upload).toBeTruthy();
    if (!upload || typeof upload === "boolean") return;

    expect(upload.constructorOptions).toMatchObject({
      limitInputPixels: 40_000_000
    });

    const headers = upload.modifyResponseHeaders?.({
      headers: new Headers()
    });

    expect(headers?.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("uses authenticated direct uploads to bypass Vercel's function body limit", () => {
    const config = readFileSync(
      resolve(process.cwd(), "payload.config.ts"),
      "utf8"
    );

    expect(config).toContain("clientUploads:");
    expect(config).toContain("canManageMedia(req.user)");
  });
});
