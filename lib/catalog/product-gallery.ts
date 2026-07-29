import type { CatalogProduct } from "@/data/storageSystems/catalogDepth";

export type ProductGallerySlot = {
  index: number;
  isMain: boolean;
  source: string;
};

function urlsForMain(product: CatalogProduct) {
  return [
    product.image,
    product.imageThumb,
    product.imageMedium,
    product.imageLarge
  ].filter((value): value is string => Boolean(value));
}

function urlsForGalleryItem(product: CatalogProduct, index: number) {
  return [
    product.gallery[index],
    product.galleryThumbs?.[index],
    product.galleryMediums?.[index],
    product.galleryLarges?.[index]
  ].filter((value): value is string => Boolean(value));
}

/**
 * The primary editor image is always the first public product image.
 * Re-selecting the same media item in the gallery does not create a duplicate.
 */
export function getProductGallerySlots(
  product: CatalogProduct
): ProductGallerySlot[] {
  const seen = new Set(urlsForMain(product));
  const slots: ProductGallerySlot[] = [
    { index: -1, isMain: true, source: product.image }
  ];

  product.gallery.forEach((source, index) => {
    const urls = urlsForGalleryItem(product, index);
    if (urls.some((url) => seen.has(url))) return;

    urls.forEach((url) => seen.add(url));
    slots.push({ index, isMain: false, source });
  });

  return slots;
}
