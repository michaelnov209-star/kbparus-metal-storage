import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MEDIA_UPLOAD_MAX_BYTES,
  MEDIA_UPLOAD_MIME_TYPES,
  getBlobClientUploadPolicy
} from "@/lib/storage/media-upload-policy";
import { shouldAddBlobRandomSuffix } from "@/lib/storage/vercel-blob-responsive";

describe("responsive Vercel Blob filenames", () => {
  it("rejects anonymous uploads before reading the request body", () => {
    const source = readFileSync(
      resolve("lib/storage/vercel-blob-responsive.ts"),
      "utf8"
    );
    const authCheck = source.indexOf("if (!req.user)");
    const bodyRead = source.indexOf("const body = await req.json?.()");

    expect(authCheck).toBeGreaterThan(-1);
    expect(bodyRead).toBeGreaterThan(authCheck);
    expect(source).toContain("if (error instanceof APIError)");
  });

  it("adds a random suffix to the original upload", () => {
    expect(
      shouldAddBlobRandomSuffix("product.webp", "product.webp")
    ).toBe(true);
  });

  it("keeps Payload image-size filenames unchanged", () => {
    expect(
      shouldAddBlobRandomSuffix(
        "product-320x240.webp",
        "product.webp"
      )
    ).toBe(false);
    expect(
      shouldAddBlobRandomSuffix(
        "product-800x600.webp",
        "product.webp"
      )
    ).toBe(false);
  });

  it("limits direct uploads before bytes reach the public Blob store", () => {
    const policy = getBlobClientUploadPolicy(31_536_000);

    expect(policy.maximumSizeInBytes).toBe(64 * 1024 * 1024);
    expect(policy.maximumSizeInBytes).toBe(MEDIA_UPLOAD_MAX_BYTES);
    expect(policy.allowedContentTypes).toEqual([
      ...MEDIA_UPLOAD_MIME_TYPES
    ]);
    expect(policy.allowedContentTypes).not.toContain("image/svg+xml");
    expect(policy.allowedContentTypes).not.toContain("text/html");
  });
});
