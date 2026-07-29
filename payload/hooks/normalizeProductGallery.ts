import type { CollectionBeforeValidateHook } from "payload";
import {
  relationDocumentId,
  sanitizeProductGalleryRows,
  type ProductGalleryRow
} from "@/lib/cms/product-gallery-policy";

function nestedCategoryImageId(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  return relationDocumentId((value as { image?: unknown }).image);
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * The product gallery contains only secondary product photos:
 * no primary-image duplicate, no category cover and no repeated media rows.
 */
export const normalizeProductGallery: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req
}) => {
  if (!data) return data;

  const original = originalDoc as Record<string, unknown> | undefined;
  const galleryWasSubmitted = hasOwn(data, "gallery");
  const relationWasChanged = hasOwn(data, "image") || hasOwn(data, "category");
  const galleryRows = Array.isArray(data.gallery)
    ? data.gallery
    : !galleryWasSubmitted &&
        relationWasChanged &&
        Array.isArray(original?.gallery)
      ? original.gallery
      : undefined;

  if (!galleryRows) return data;

  const mainImageValue = hasOwn(data, "image") ? data.image : original?.image;
  const mainImageId = relationDocumentId(mainImageValue);
  const categoryValue = hasOwn(data, "category")
    ? data.category
    : original?.category;
  const categoryId = relationDocumentId(categoryValue);
  let categoryImageId = nestedCategoryImageId(categoryValue);

  if (categoryImageId === undefined && categoryId !== undefined) {
    try {
      const category = await req.payload.findByID({
        collection: "categories",
        depth: 0,
        id: categoryId,
        overrideAccess: true
      });
      categoryImageId = relationDocumentId(
        (category as unknown as { image?: unknown }).image
      );
    } catch (error) {
      // A transient category lookup must not make the whole product unsavable.
      req.payload.logger.warn({
        err: error,
        msg: "[products] Category cover validation was skipped"
      });
    }
  }

  data.gallery = sanitizeProductGalleryRows({
    categoryImageId,
    mainImageId,
    rows: galleryRows as ProductGalleryRow[]
  }).rows;

  return data;
};
