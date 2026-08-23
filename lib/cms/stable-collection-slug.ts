import { ValidationError, type CollectionBeforeValidateHook } from "payload";
import { createProductSlug } from "./product-slug";

type StableSlugCollection = "categories" | "subcategories";

const MAX_SLUG_LENGTH = 96;
const MAX_UNIQUENESS_ATTEMPTS = 100;

function withSuffix(baseSlug: string, suffix: number): string {
  const suffixText = `-${suffix}`;
  return `${baseSlug.slice(0, MAX_SLUG_LENGTH - suffixText.length)}${suffixText}`;
}

/**
 * Generates a safe URL slug on create and deliberately preserves it on update.
 * Existing public links therefore remain stable even if an editor renames an item.
 */
export function createStableCollectionSlug(
  collection: StableSlugCollection
): CollectionBeforeValidateHook {
  return async ({ data, operation, originalDoc, req }) => {
    if (!data) return data;

    const originalSlug =
      originalDoc && typeof originalDoc.slug === "string"
        ? originalDoc.slug.trim()
        : "";

    if (operation === "update" && originalSlug) {
      data.slug = originalSlug;
      return data;
    }

    const submittedSlug =
      typeof data.slug === "string" ? data.slug.trim() : "";
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const baseSlug = createProductSlug(submittedSlug || title);

    if (!baseSlug) return data;

    for (let attempt = 1; attempt <= MAX_UNIQUENESS_ATTEMPTS; attempt += 1) {
      const candidate = attempt === 1 ? baseSlug : withSuffix(baseSlug, attempt);
      const existing = await req.payload.find({
        collection,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { slug: { equals: candidate } }
      });

      if (existing.docs.length === 0) {
        data.slug = candidate;
        return data;
      }
    }

    throw new ValidationError({
      collection,
      errors: [
        {
          message:
            "Не удалось создать уникальный адрес страницы. Уточните название и попробуйте снова.",
          path: "slug"
        }
      ]
    });
  };
}
