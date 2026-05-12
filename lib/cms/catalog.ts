import { cache } from "react";
import { excelHomeCatalog, type ExcelHomeCatalogItem } from "@/data/storageSystems/excelCatalog";
import { getCmsClient } from "./client";

export interface CatalogCategoryView extends ExcelHomeCatalogItem {
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
  sortOrder?: number;
  source: "cms" | "fallback";
}

type CmsMediaLike = {
  url?: unknown;
  filename?: unknown;
};

type CmsKeywordLike = {
  value?: unknown;
};

export type CmsCategoryLike = {
  slug?: unknown;
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

function getMediaUrl(value: unknown): string | undefined {
  if (typeof value === "string") return undefined;
  if (!value || typeof value !== "object") return undefined;

  const media = value as CmsMediaLike;
  const url = asString(media.url);
  if (url) return url;

  const filename = asString(media.filename);
  return filename ? `/api/media/file/${filename}` : undefined;
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
  const image = getMediaUrl(doc.image) ?? asString(doc.legacyImagePath) ?? fallback?.image;
  if (!image) return null;

  return {
    id,
    title,
    summary,
    scenario: asString(doc.scenario) ?? fallback?.scenario ?? "",
    image,
    featured: asBoolean(doc.featured) ?? fallback?.featured,
    seoTitle: asString(doc.seoTitle),
    seoDescription: asString(doc.seoDescription),
    ogImage: getMediaUrl(doc.ogImage),
    keywords: getKeywords(doc.keywords),
    noIndex: asBoolean(doc.noIndex),
    sortOrder: asNumber(doc.sortOrder) ?? fallbackOrder.get(id),
    source: "cms"
  };
}

export function mergeCatalogCategories(cmsCategories: CatalogCategoryView[]): CatalogCategoryView[] {
  const byId = new Map<string, CatalogCategoryView>(
    excelHomeCatalog.map((item, index) => [
      item.id,
      {
        ...item,
        sortOrder: index,
        source: "fallback"
      }
    ])
  );

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
      limit: 100,
      pagination: false,
      sort: "sortOrder"
    });

    const cmsCategories = response.docs
      .map((doc) => normalizeCmsCategory(doc as CmsCategoryLike))
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
