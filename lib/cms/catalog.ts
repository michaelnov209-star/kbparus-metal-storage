import { cache } from "react";
import { excelHomeCatalog, type ExcelHomeCatalogItem } from "@/data/storageSystems/excelCatalog";
import { getCmsClient } from "./client";
import { getLocalCatalogImageVariants } from "./catalog-image-variants";
import { resolveCmsMediaAlt, resolveCmsMediaUrl } from "./media-url";

export interface CatalogCategoryView extends ExcelHomeCatalogItem {
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
  sortOrder?: number;
  source: "cms" | "fallback";
}

type CmsKeywordLike = {
  value?: unknown;
};

export type CmsCategoryLike = {
  slug?: unknown;
  _status?: unknown;
  title?: unknown;
  summary?: unknown;
  scenario?: unknown;
  image?: unknown;
  legacyImagePath?: unknown;
  featured?: unknown;
  sortOrder?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  ogImage?: unknown;
  keywords?: unknown;
  noIndex?: unknown;
};

const fallbackOrder = new Map(excelHomeCatalog.map((item, index) => [item.id, index]));
const fallbackById = new Map(excelHomeCatalog.map((item) => [item.id, item]));

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getKeywords(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const keywords = value
    .map((item) => (item && typeof item === "object" ? asString((item as CmsKeywordLike).value) : undefined))
    .filter((item): item is string => Boolean(item));

  return keywords.length > 0 ? keywords : undefined;
}

export function normalizeCmsCategory(doc: CmsCategoryLike): CatalogCategoryView | null {
  const id = asString(doc.slug);
  const title = asString(doc.title);
  const summary = asString(doc.summary);
  if (!id || !title || !summary) return null;

  const fallback = fallbackById.get(id);
  const localFallback = asString(doc.legacyImagePath) ?? fallback?.image;
  const localVariants = getLocalCatalogImageVariants(localFallback);
  const image = resolveCmsMediaUrl(doc.image, { fallback: localFallback });
  if (!image) return null;

  return {
    id,
    title,
    summary,
    scenario: asString(doc.scenario) ?? fallback?.scenario ?? "",
    image,
    imageAlt: resolveCmsMediaAlt(doc.image, title),
    imageThumb: resolveCmsMediaUrl(doc.image, {
      size: "cardSm",
      fallback: localVariants?.thumb ?? localFallback
    }),
    imageMedium: resolveCmsMediaUrl(doc.image, {
      size: "cardMd",
      fallback: localVariants?.medium ?? localFallback
    }),
    imageLarge: resolveCmsMediaUrl(doc.image, {
      size: "cardLg",
      fallback: localVariants?.large ?? localFallback
    }),
    featured: asBoolean(doc.featured) ?? fallback?.featured,
    seoTitle: asString(doc.seoTitle),
    seoDescription: asString(doc.seoDescription),
    ogImage: resolveCmsMediaUrl(doc.ogImage),
    keywords: getKeywords(doc.keywords),
    noIndex: asBoolean(doc.noIndex),
    sortOrder: asNumber(doc.sortOrder) ?? fallbackOrder.get(id),
    source: "cms"
  };
}

export function mergeCatalogCategories(
  cmsCategories: CatalogCategoryView[],
  suppressedFallbackIds: Iterable<string> = []
): CatalogCategoryView[] {
  const byId = new Map<string, CatalogCategoryView>(
    excelHomeCatalog.map((item, index) => {
      const variants = getLocalCatalogImageVariants(item.image);
      return [
        item.id,
        {
          ...item,
          imageThumb: variants?.thumb,
          imageMedium: variants?.medium,
          imageLarge: variants?.large,
          sortOrder: index,
          source: "fallback"
        }
      ];
    })
  );

  for (const id of suppressedFallbackIds) {
    byId.delete(id);
  }

  for (const category of cmsCategories) {
    byId.set(category.id, category);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const orderA = a.sortOrder ?? fallbackOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? fallbackOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB || a.title.localeCompare(b.title, "ru");
  });
}

export const getCatalogCategories = cache(async (): Promise<CatalogCategoryView[]> => {
  const cms = await getCmsClient();
  if (!cms) return mergeCatalogCategories([]);

  try {
    const response = await cms.find({
      collection: "categories",
      depth: 1,
      draft: false,
      overrideAccess: true,
      limit: 100,
      pagination: false,
      sort: "sortOrder"
    });

    const cmsCategories = response.docs
      .map((doc) => doc as CmsCategoryLike)
      .filter((doc) => doc._status !== "draft")
      .map((doc) => normalizeCmsCategory(doc))
      .filter((item): item is CatalogCategoryView => Boolean(item));

    return mergeCatalogCategories(cmsCategories);
  } catch (error) {
    console.warn("[cms] Catalog categories fallback is active:", error);
    return mergeCatalogCategories([]);
  }
});

export async function getCatalogCategory(id: string): Promise<CatalogCategoryView | undefined> {
  const categories = await getCatalogCategories();
  return categories.find((item) => item.id === id);
}

export async function getRelatedCatalogCategories(id: string, limit = 4): Promise<CatalogCategoryView[]> {
  const categories = await getCatalogCategories();
  return categories.filter((item) => item.id !== id).slice(0, limit);
}
