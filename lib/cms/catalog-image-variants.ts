import catalogImageManifestJson from "@/data/storageSystems/catalogImageManifest.json";

export interface CatalogImageVariants {
  thumb: string;
  medium: string;
  large: string;
}

export const catalogImageManifest =
  catalogImageManifestJson as Record<string, CatalogImageVariants>;

export function getLocalCatalogImageVariants(
  imageUrl: string | undefined
): CatalogImageVariants | undefined {
  return imageUrl ? catalogImageManifest[imageUrl] : undefined;
}
