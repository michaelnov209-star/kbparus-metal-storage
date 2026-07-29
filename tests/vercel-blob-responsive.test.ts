import { describe, expect, it } from "vitest";
import { shouldAddBlobRandomSuffix } from "@/lib/storage/vercel-blob-responsive";

describe("responsive Vercel Blob filenames", () => {
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
});
