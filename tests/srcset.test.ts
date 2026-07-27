import { describe, expect, it } from "vitest";
import { buildImageSrcSet } from "@/lib/media/srcset";

describe("responsive image srcset", () => {
  it("sorts by real width and deduplicates aliased files", () => {
    expect(
      buildImageSrcSet([
        { src: "/large.webp", width: 1200 },
        { src: "/small.webp", width: 320 },
        { src: "/large.webp", width: 800 },
        { src: undefined, width: 640 }
      ])
    ).toBe("/small.webp 320w, /large.webp 1200w");
  });

  it("returns undefined when no usable source exists", () => {
    expect(buildImageSrcSet([{ src: undefined, width: 0 }])).toBeUndefined();
  });
});
