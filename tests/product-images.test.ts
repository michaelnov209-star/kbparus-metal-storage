import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  catalogProducts,
  catalogSubcategories
} from "@/data/storageSystems/catalogDepth";
import {
  getLocalProductImageVariant,
  getLocalProductImageVariants,
  productImageManifest,
  type ProductImageVariantKey
} from "@/lib/cms/product-image-variants";

const variantTargets: Record<ProductImageVariantKey, number> = {
  thumb: 320,
  medium: 800,
  large: 1600
};

const fallbackProductImages = [
  ...new Set(
    catalogProducts
      .flatMap((product) => [
        product.image,
        product.imageThumb,
        product.imageMedium,
        product.imageLarge,
        ...product.gallery
      ])
      .concat(catalogSubcategories.map((subcategory) => subcategory.image))
      .filter(
        (image): image is string =>
          typeof image === "string" &&
          image.startsWith("/assets/images/products/")
      )
  )
].sort();

describe("fallback product image variants", () => {
  it("covers every unique local fallback product image", () => {
    expect(Object.keys(productImageManifest).sort()).toEqual(fallbackProductImages);
  });

  it("stores real dimensions for deterministic content-hashed WebP files", async () => {
    for (const source of fallbackProductImages) {
      const variants = getLocalProductImageVariants(source);
      expect(variants).toBeDefined();
      const sourcePath = path.join("public", source.slice(1));
      const sourceMetadata = await sharp(sourcePath).metadata();
      const orientedSourceWidth =
        sourceMetadata.orientation &&
        [5, 6, 7, 8].includes(sourceMetadata.orientation)
          ? sourceMetadata.height
          : sourceMetadata.width;

      for (const [key, targetWidth] of Object.entries(variantTargets) as Array<
        [ProductImageVariantKey, number]
      >) {
        const variant = variants?.[key];
        expect(variant?.src).toMatch(
          /\/optimized\/[a-f0-9]{16}-\d+\.webp$/
        );
        expect(variant?.width).toBeGreaterThan(0);
        expect(variant?.width).toBeLessThanOrEqual(targetWidth);
        expect(variant?.width).toBeLessThanOrEqual(orientedSourceWidth ?? 0);
        expect(variant?.height).toBeGreaterThan(0);

        const outputPath = path.join("public", variant?.src.slice(1) ?? "");
        expect(existsSync(outputPath)).toBe(true);

        const metadata = await sharp(outputPath).metadata();
        expect(metadata.format).toBe("webp");
        expect(metadata.width).toBe(variant?.width);
        expect(metadata.height).toBe(variant?.height);
        if (sourceMetadata.hasAlpha) {
          expect(metadata.hasAlpha).toBe(true);
        }
      }

      const variantsByWidth = Object.values(variants ?? {}).reduce<
        Map<number, string[]>
      >((groups, variant) => {
        const sources = groups.get(variant.width) ?? [];
        sources.push(variant.src);
        groups.set(variant.width, sources);
        return groups;
      }, new Map());

      for (const sources of variantsByWidth.values()) {
        expect(new Set(sources).size).toBe(1);
      }
    }
  });

  it("leaves no stale WebP files outside the current manifest", () => {
    const expectedFiles = [
      ...new Set(
        Object.values(productImageManifest).flatMap((variants) =>
          Object.values(variants).map((variant) => path.basename(variant.src))
        )
      )
    ].sort();
    const actualFiles = readdirSync(
      path.join("public", "assets", "images", "products", "optimized")
    )
      .filter((fileName) => fileName.endsWith(".webp"))
      .sort();

    expect(actualFiles).toEqual(expectedFiles);
  });

  it("reuses one generated set when multiple paths contain identical source bytes", () => {
    const pathsByContent = new Map<string, string[]>();

    for (const source of fallbackProductImages) {
      const sourcePath = path.join("public", source.slice(1));
      const contentHash = createHash("sha256")
        .update(readFileSync(sourcePath))
        .digest("hex");
      const aliases = pathsByContent.get(contentHash) ?? [];
      aliases.push(source);
      pathsByContent.set(contentHash, aliases);
    }

    for (const aliases of pathsByContent.values()) {
      const [canonical, ...duplicates] = aliases;
      for (const duplicate of duplicates) {
        expect(productImageManifest[duplicate]).toEqual(
          productImageManifest[canonical]
        );
      }
    }
  });

  it("returns a requested size and rejects unknown assets", () => {
    const source = fallbackProductImages[0];
    expect(getLocalProductImageVariant(source, "medium")).toEqual(
      productImageManifest[source].medium
    );
    expect(
      getLocalProductImageVariants(
        "/assets/images/products/unknown/product.png"
      )
    ).toBeUndefined();
  });
});
