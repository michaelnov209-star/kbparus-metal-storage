import productImageManifestJson from "@/data/storageSystems/productImageManifest.json";

export interface ProductImageVariant {
  src: string;
  width: number;
  height: number;
}

export interface ProductImageVariants {
  thumb: ProductImageVariant;
  medium: ProductImageVariant;
  large: ProductImageVariant;
}

export type ProductImageVariantKey = keyof ProductImageVariants;

export const productImageManifest =
  productImageManifestJson as Record<string, ProductImageVariants>;

export function getLocalProductImageVariants(
  imageUrl: string | undefined
): ProductImageVariants | undefined {
  return imageUrl ? productImageManifest[imageUrl] : undefined;
}

export function getLocalProductImageVariant(
  imageUrl: string | undefined,
  variant: ProductImageVariantKey
): ProductImageVariant | undefined {
  return getLocalProductImageVariants(imageUrl)?.[variant];
}
