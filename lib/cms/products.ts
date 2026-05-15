import { cache } from "react";
import { catalogProducts, type CatalogProduct } from "@/data/storageSystems/catalogDepth";
import { getCmsClient } from "./client";

type CmsMediaLike = {
  url?: unknown;
  filename?: unknown;
  sizes?: Record<string, { url?: unknown; filename?: unknown }> | null;
};

type CmsRelationLike = {
  slug?: unknown;
};

type CmsArrayValue = {
  value?: unknown;
};

type CmsGalleryItem = {
  image?: unknown;
};

type CmsLegacyGalleryItem = {
  path?: unknown;
};

type CmsDocumentItem = {
  title?: unknown;
  href?: unknown;
};

type CmsSpecItem = {
  label?: unknown;
  value?: unknown;
};

type CmsKeywordItem = {
  value?: unknown;
};

type CmsCalculatorProfileLike = {
  slug?: unknown;
};

type CmsProductLike = {
  slug?: unknown;
  title?: unknown;
  shortTitle?: unknown;
  sku?: unknown;
  category?: unknown;
  subcategory?: unknown;
  badge?: unknown;
  summary?: unknown;
  description?: unknown;
  image?: unknown;
  legacyImagePath?: unknown;
  gallery?: unknown;
  legacyGalleryPaths?: unknown;
  priceMode?: unknown;
  priceFrom?: unknown;
  priceTo?: unknown;
  priceLabel?: unknown;
  pageMode?: unknown;
  calculatorProfile?: unknown;
  applications?: unknown;
  specs?: unknown;
  includes?: unknown;
  documents?: unknown;
  referenceUrl?: unknown;
  featured?: unknown;
  sortOrder?: unknown;
  draft?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  ogImage?: unknown;
  keywords?: unknown;
  noIndex?: unknown;
};

const fallbackById = new Map(catalogProducts.map((product) => [product.id, product]));
const fallbackOrder = new Map(catalogProducts.map((product, index) => [product.id, index]));

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function mediaFileUrl(filename: string) {
  return `/api/media/file/${filename}`;
}

function getMediaUrl(value: unknown, size?: "thumb" | "medium" | "large"): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const media = value as CmsMediaLike;
  if (size) {
    const sized = media.sizes?.[size];
    const sizedUrl = asString(sized?.url);
    if (sizedUrl) return sizedUrl;
    const sizedFilename = asString(sized?.filename);
    if (sizedFilename) return mediaFileUrl(sizedFilename);
  }

  const url = asString(media.url);
  if (url) return url;
  const filename = asString(media.filename);
  return filename ? mediaFileUrl(filename) : undefined;
}

function getRelationSlug(value: unknown): string | undefined {
  if (typeof value === "string") return undefined;
  if (!value || typeof value !== "object") return undefined;
  return asString((value as CmsRelationLike).slug);
}

function getTextValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item && typeof item === "object" ? asString((item as CmsArrayValue).value) : undefined))
    .filter((item): item is string => Boolean(item));
}

function getSpecs(value: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = asString((item as CmsSpecItem).label);
      const specValue = asString((item as CmsSpecItem).value);
      return label && specValue ? { label, value: specValue } : null;
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

function getDocuments(value: unknown): Array<{ title: string; href: string }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const docs = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const title = asString((item as CmsDocumentItem).title);
      const href = asString((item as CmsDocumentItem).href);
      return title && href ? { title, href } : null;
    })
    .filter((item): item is { title: string; href: string } => Boolean(item));

  return docs.length > 0 ? docs : undefined;
}

function getGallery(doc: CmsProductLike, fallback?: CatalogProduct): string[] {
  const cmsGallery = Array.isArray(doc.gallery)
    ? doc.gallery
        .map((item) => (item && typeof item === "object" ? getMediaUrl((item as CmsGalleryItem).image, "large") : undefined))
        .filter((item): item is string => Boolean(item))
    : [];

  const legacyGallery = Array.isArray(doc.legacyGalleryPaths)
    ? doc.legacyGalleryPaths
        .map((item) => (item && typeof item === "object" ? asString((item as CmsLegacyGalleryItem).path) : undefined))
        .filter((item): item is string => Boolean(item))
    : [];

  return cmsGallery.length > 0 ? cmsGallery : legacyGallery.length > 0 ? legacyGallery : fallback?.gallery ?? [];
}

function getKeywords(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const keywords = value
    .map((item) => (item && typeof item === "object" ? asString((item as CmsKeywordItem).value) : undefined))
    .filter((item): item is string => Boolean(item));

  return keywords.length > 0 ? keywords : undefined;
}

export function normalizeCmsProduct(doc: CmsProductLike): CatalogProduct | null {
  const id = asString(doc.slug);
  const title = asString(doc.title);
  const summary = asString(doc.summary);
  const description = asString(doc.description);
  const categoryId = getRelationSlug(doc.category);
  if (!id || !title || !summary || !description || !categoryId) return null;

  const fallback = fallbackById.get(id);
  const image = getMediaUrl(doc.image) ?? asString(doc.legacyImagePath) ?? fallback?.image;
  if (!image) return null;

  const applications = getTextValues(doc.applications);
  const specs = getSpecs(doc.specs);
  const includes = getTextValues(doc.includes);
  const calculatorProfileId = getRelationSlug(doc.calculatorProfile as CmsCalculatorProfileLike) ?? fallback?.calculatorProfileId;

  return {
    id,
    categoryId,
    subcategoryId: getRelationSlug(doc.subcategory) ?? fallback?.subcategoryId,
    title,
    shortTitle: asString(doc.shortTitle) ?? fallback?.shortTitle ?? title,
    sku: asString(doc.sku) ?? fallback?.sku ?? id,
    image,
    imageThumb: getMediaUrl(doc.image, "thumb") ?? image,
    imageMedium: getMediaUrl(doc.image, "medium") ?? image,
    imageLarge: getMediaUrl(doc.image, "large") ?? image,
    gallery: getGallery(doc, fallback),
    pageMode: asString(doc.pageMode) === "configurator" ? "configurator" : "standard",
    calculatorProfileId: calculatorProfileId as CatalogProduct["calculatorProfileId"] | undefined,
    priceMode: asString(doc.priceMode) === "fixed" ? "fixed" : "request",
    priceFrom: asNumber(doc.priceFrom),
    priceTo: asNumber(doc.priceTo),
    priceLabel: asString(doc.priceLabel),
    badge: asString(doc.badge) ?? fallback?.badge ?? "Товар",
    summary,
    description,
    applications: applications.length > 0 ? applications : fallback?.applications ?? [],
    specs: specs.length > 0 ? specs : fallback?.specs ?? [],
    includes: includes.length > 0 ? includes : fallback?.includes ?? [],
    documents: getDocuments(doc.documents) ?? fallback?.documents,
    referenceUrl: asString(doc.referenceUrl) ?? fallback?.referenceUrl,
    featured: asBoolean(doc.featured) ?? fallback?.featured,
    sortOrder: asNumber(doc.sortOrder) ?? fallback?.sortOrder ?? fallbackOrder.get(id),
    draft: asBoolean(doc.draft),
    seoTitle: asString(doc.seoTitle) ?? fallback?.seoTitle,
    seoDescription: asString(doc.seoDescription) ?? fallback?.seoDescription,
    ogImage: getMediaUrl(doc.ogImage) ?? fallback?.ogImage,
    keywords: getKeywords(doc.keywords) ?? fallback?.keywords,
    noIndex: asBoolean(doc.noIndex) ?? fallback?.noIndex
  };
}

function bySortOrder(a: CatalogProduct, b: CatalogProduct) {
  return (a.sortOrder ?? fallbackOrder.get(a.id) ?? 0) - (b.sortOrder ?? fallbackOrder.get(b.id) ?? 0);
}

export const getCatalogProducts = cache(async (): Promise<CatalogProduct[]> => {
  const cms = await getCmsClient();
  if (!cms) return catalogProducts.filter((product) => !product.draft).slice().sort(bySortOrder);

  try {
    const response = await cms.find({
      collection: "products",
      depth: 1,
      draft: false,
      limit: 500,
      pagination: false,
      sort: "sortOrder"
    });

    const merged = new Map<string, CatalogProduct>(
      catalogProducts.filter((product) => !product.draft).map((product) => [product.id, product])
    );

    for (const doc of response.docs) {
      const product = normalizeCmsProduct(doc as CmsProductLike);
      if (product && !product.draft) merged.set(product.id, product);
    }

    return Array.from(merged.values()).sort(bySortOrder);
  } catch (error) {
    console.warn("[cms] Catalog products fallback is active:", error);
    return catalogProducts.filter((product) => !product.draft).slice().sort(bySortOrder);
  }
});

export async function getCatalogProductsByCategory(categoryId: string) {
  const products = await getCatalogProducts();
  return products.filter((product) => product.categoryId === categoryId && !product.draft).sort(bySortOrder);
}

export async function getCatalogProductView(categoryId: string, productId: string) {
  const products = await getCatalogProducts();
  return products.find((product) => product.categoryId === categoryId && product.id === productId && !product.draft);
}
