import { cache } from "react";
import { catalogProducts, type CatalogProduct } from "@/data/storageSystems/catalogDepth";
import { getLocalProductImageVariants } from "./product-image-variants";
import { getCmsClient } from "./client";
import {
  resolveCmsMediaAlt,
  resolveCmsMediaUrl,
  type CmsMediaSize
} from "./media-url";

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
  file?: unknown;
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
  _status?: unknown;
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
  modelName?: unknown;
  operationMode?: unknown;
  storageMaterials?: unknown;
  loadingMethods?: unknown;
  maxLoadKg?: unknown;
  warrantyMonths?: unknown;
  overallDimensions?: unknown;
  installationEnvironments?: unknown;
  applications?: unknown;
  specs?: unknown;
  includes?: unknown;
  documents?: unknown;
  referenceUrl?: unknown;
  featured?: unknown;
  sortOrder?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  ogImage?: unknown;
  keywords?: unknown;
  noIndex?: unknown;
};

const fallbackById = new Map(catalogProducts.map((product) => [product.id, product]));
const fallbackOrder = new Map(catalogProducts.map((product, index) => [product.id, index]));

function withLocalImageVariants(product: CatalogProduct): CatalogProduct {
  const variants = getLocalProductImageVariants(product.image);
  if (!variants) return product;

  return {
    ...product,
    imageThumb: variants.thumb.src,
    imageMedium: variants.medium.src,
    imageLarge: variants.large.src
  };
}

const fallbackProducts = catalogProducts.map(withLocalImageVariants);

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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

function getSelectValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((item): item is string => Boolean(item));
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

function safePublicDownloadHref(value: unknown): string | undefined {
  const href = asString(value);
  if (!href) return undefined;
  if (href.startsWith("/") && !href.startsWith("//")) return href;

  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:"
      ? href
      : undefined;
  } catch {
    return undefined;
  }
}

function getDocuments(value: unknown): Array<{ title: string; href: string }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const docs = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const title = asString((item as CmsDocumentItem).title);
      const href = safePublicDownloadHref(
        resolveCmsMediaUrl((item as CmsDocumentItem).file) ??
          (item as CmsDocumentItem).href
      );
      return title && href ? { title, href } : null;
    })
    .filter((item): item is { title: string; href: string } => Boolean(item));

  return docs.length > 0 ? docs : undefined;
}

const operationModeLabels: Record<string, string> = {
  manual: "ручной",
  mechanized: "механизированный",
  automated: "автоматизированный"
};

const storageMaterialLabels: Record<string, string> = {
  "sheet-metal": "листовой металл",
  pipes: "трубы",
  profiles: "профиль и сортовой прокат",
  pallets: "паллеты и тарные места",
  tooling: "оснастка и штампы",
  parts: "инструмент и комплектующие",
  cable: "кабель и барабаны",
  mixed: "смешанная номенклатура"
};

const loadingMethodLabels: Record<string, string> = {
  manual: "вручную",
  forklift: "погрузчиком",
  stacker: "штабелером или ричтраком",
  crane: "кран-балкой",
  vacuum: "вакуумным захватом",
  extractor: "автоматическим экстрактором"
};

const installationEnvironmentLabels: Record<string, string> = {
  workshop: "производственный цех",
  warehouse: "закрытый склад",
  "covered-outdoor": "улица под навесом",
  outdoor: "уличное исполнение"
};

function mappedList(value: unknown, labels: Record<string, string>) {
  return getSelectValues(value).map((item) => labels[item] ?? item).join(", ");
}

function getStructuredSpecs(doc: CmsProductLike): Array<{ label: string; value: string }> {
  const specs: Array<{ label: string; value: string }> = [];
  const modelName = asString(doc.modelName);
  const operationMode = asString(doc.operationMode);
  const materials = mappedList(doc.storageMaterials, storageMaterialLabels);
  const loading = mappedList(doc.loadingMethods, loadingMethodLabels);
  const environments = mappedList(doc.installationEnvironments, installationEnvironmentLabels);
  const maxLoadKg = asNumber(doc.maxLoadKg);
  const warrantyMonths = asNumber(doc.warrantyMonths);
  const dimensions =
    doc.overallDimensions && typeof doc.overallDimensions === "object"
      ? (doc.overallDimensions as {
          lengthMm?: unknown;
          widthMm?: unknown;
          heightMm?: unknown;
        })
      : undefined;
  const lengthMm = asNumber(dimensions?.lengthMm);
  const widthMm = asNumber(dimensions?.widthMm);
  const heightMm = asNumber(dimensions?.heightMm);

  if (modelName) specs.push({ label: "Модель / серия", value: modelName });
  if (materials) specs.push({ label: "Материал хранения", value: materials });
  if (operationMode) {
    specs.push({
      label: "Принцип работы",
      value: operationModeLabels[operationMode] ?? operationMode
    });
  }
  if (loading) specs.push({ label: "Способ загрузки", value: loading });
  if (maxLoadKg !== undefined) {
    specs.push({
      label: "Максимальная рабочая нагрузка",
      value: `${new Intl.NumberFormat("ru-RU").format(maxLoadKg)} кг`
    });
  }
  if (lengthMm || widthMm || heightMm) {
    specs.push({
      label: "Габарит системы",
      value: `${lengthMm ?? "—"} × ${widthMm ?? "—"} × ${heightMm ?? "—"} мм (Д × Ш × В)`
    });
  }
  if (environments) specs.push({ label: "Место установки", value: environments });
  if (warrantyMonths !== undefined) {
    specs.push({ label: "Гарантия", value: `${warrantyMonths} мес.` });
  }

  return specs;
}

function mergeSpecs(
  structured: Array<{ label: string; value: string }>,
  manual: Array<{ label: string; value: string }>
) {
  const merged = new Map<string, { label: string; value: string }>();
  for (const spec of [...structured, ...manual]) merged.set(spec.label.toLowerCase(), spec);
  return Array.from(merged.values());
}

function getGalleryFallback(
  fallback: CatalogProduct | undefined,
  index: number,
  size: CmsMediaSize
) {
  const source = fallback?.gallery[index] ?? fallback?.image;
  const variants = getLocalProductImageVariants(source);
  if (!variants) return source;
  if (size === "thumb") return variants.thumb.src;
  if (size === "medium") return variants.medium.src;
  return variants.large.src;
}

function getGalleryBySize(
  doc: CmsProductLike,
  fallback: CatalogProduct | undefined,
  size: "thumb" | "medium" | "large"
): string[] {
  const cmsGallery = Array.isArray(doc.gallery)
    ? doc.gallery
        .map((item, index) =>
          item && typeof item === "object"
            ? resolveCmsMediaUrl((item as CmsGalleryItem).image, {
                size,
                fallback: getGalleryFallback(fallback, index, size)
              })
            : undefined
        )
        .filter((item): item is string => Boolean(item))
    : [];

  if (cmsGallery.length > 0) return cmsGallery;
  return (
    fallback?.gallery
      .map((_, index) => getGalleryFallback(fallback, index, size))
      .filter((item): item is string => Boolean(item)) ?? []
  );
}

function getGallery(doc: CmsProductLike, fallback?: CatalogProduct): string[] {
  const cmsGallery = getGalleryBySize(doc, fallback, "medium");
  const legacyGallery = Array.isArray(doc.legacyGalleryPaths)
    ? doc.legacyGalleryPaths
        .map((item) => (item && typeof item === "object" ? asString((item as CmsLegacyGalleryItem).path) : undefined))
        .filter((item): item is string => Boolean(item))
    : [];

  return cmsGallery.length > 0 ? cmsGallery : legacyGallery.length > 0 ? legacyGallery : fallback?.gallery ?? [];
}

function getGalleryAlts(
  doc: CmsProductLike,
  fallback: CatalogProduct | undefined,
  productTitle: string
): string[] {
  const cmsAlts = Array.isArray(doc.gallery)
    ? doc.gallery.map((item, index) =>
        item && typeof item === "object"
          ? resolveCmsMediaAlt(
              (item as CmsGalleryItem).image,
              `${productTitle} — фото ${index + 1}`
            ) ?? ""
          : ""
      )
    : [];

  return cmsAlts.length > 0 ? cmsAlts : fallback?.galleryAlts ?? [];
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
  const localFallback = asString(doc.legacyImagePath) ?? fallback?.image;
  const localVariants = getLocalProductImageVariants(localFallback);
  const image = resolveCmsMediaUrl(doc.image, { fallback: localFallback });
  if (!image) return null;

  const applications = getTextValues(doc.applications);
  const specs = mergeSpecs(getStructuredSpecs(doc), getSpecs(doc.specs));
  const includes = getTextValues(doc.includes);
  const storageMaterials = getSelectValues(
    doc.storageMaterials
  ) as CatalogProduct["storageMaterials"];
  const loadingMethods = getSelectValues(
    doc.loadingMethods
  ) as CatalogProduct["loadingMethods"];
  const installationEnvironments = getSelectValues(
    doc.installationEnvironments
  ) as CatalogProduct["installationEnvironments"];
  const dimensions =
    doc.overallDimensions && typeof doc.overallDimensions === "object"
      ? (doc.overallDimensions as {
          lengthMm?: unknown;
          widthMm?: unknown;
          heightMm?: unknown;
        })
      : undefined;
  const calculatorProfileId = getRelationSlug(doc.calculatorProfile as CmsCalculatorProfileLike) ?? fallback?.calculatorProfileId;
  const gallery = getGallery(doc, fallback);
  const galleryThumbs = getGalleryBySize(doc, fallback, "thumb");
  const galleryMediums = getGalleryBySize(doc, fallback, "medium");
  const galleryLarges = getGalleryBySize(doc, fallback, "large");

  return {
    id,
    categoryId,
    subcategoryId: getRelationSlug(doc.subcategory) ?? fallback?.subcategoryId,
    title,
    shortTitle: asString(doc.shortTitle) ?? fallback?.shortTitle ?? title,
    sku: asString(doc.sku) ?? fallback?.sku ?? id,
    image,
    imageAlt: resolveCmsMediaAlt(doc.image, title),
    imageThumb: resolveCmsMediaUrl(doc.image, {
      size: "thumb",
      fallback: localVariants?.thumb.src ?? localFallback
    }),
    imageMedium: resolveCmsMediaUrl(doc.image, {
      size: "medium",
      fallback: localVariants?.medium.src ?? localFallback
    }),
    imageLarge: resolveCmsMediaUrl(doc.image, {
      size: "large",
      fallback: localVariants?.large.src ?? localFallback
    }),
    gallery,
    galleryThumbs:
      galleryThumbs.length === gallery.length ? galleryThumbs : undefined,
    galleryMediums:
      galleryMediums.length === gallery.length ? galleryMediums : undefined,
    galleryLarges:
      galleryLarges.length === gallery.length ? galleryLarges : undefined,
    galleryAlts: getGalleryAlts(doc, fallback, title),
    pageMode: asString(doc.pageMode) === "configurator" ? "configurator" : "standard",
    calculatorProfileId: calculatorProfileId as CatalogProduct["calculatorProfileId"] | undefined,
    modelName: asString(doc.modelName) ?? fallback?.modelName,
    operationMode:
      (asString(doc.operationMode) as CatalogProduct["operationMode"]) ??
      fallback?.operationMode,
    storageMaterials: storageMaterials?.length
      ? storageMaterials
      : fallback?.storageMaterials,
    loadingMethods: loadingMethods?.length
      ? loadingMethods
      : fallback?.loadingMethods,
    maxLoadKg: asNumber(doc.maxLoadKg) ?? fallback?.maxLoadKg,
    warrantyMonths: asNumber(doc.warrantyMonths) ?? fallback?.warrantyMonths,
    overallDimensions: dimensions
      ? {
          lengthMm: asNumber(dimensions.lengthMm),
          widthMm: asNumber(dimensions.widthMm),
          heightMm: asNumber(dimensions.heightMm)
        }
      : fallback?.overallDimensions,
    installationEnvironments: installationEnvironments?.length
      ? installationEnvironments
      : fallback?.installationEnvironments,
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
    seoTitle: asString(doc.seoTitle) ?? fallback?.seoTitle,
    seoDescription: asString(doc.seoDescription) ?? fallback?.seoDescription,
    ogImage: resolveCmsMediaUrl(doc.ogImage, { fallback: fallback?.ogImage }),
    keywords: getKeywords(doc.keywords) ?? fallback?.keywords,
    noIndex: asBoolean(doc.noIndex) ?? fallback?.noIndex
  };
}

function bySortOrder(a: CatalogProduct, b: CatalogProduct) {
  if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
  return (a.sortOrder ?? fallbackOrder.get(a.id) ?? 0) - (b.sortOrder ?? fallbackOrder.get(b.id) ?? 0);
}

export const getCatalogProducts = cache(async (): Promise<CatalogProduct[]> => {
  const cms = await getCmsClient();
  if (!cms) return fallbackProducts.slice().sort(bySortOrder);

  try {
    const response = await cms.find({
      collection: "products",
      depth: 1,
      draft: false,
      overrideAccess: true,
      limit: 500,
      pagination: false,
      sort: "sortOrder"
    });

    const merged = new Map<string, CatalogProduct>(
      fallbackProducts.map((product) => [product.id, product])
    );

    for (const rawDoc of response.docs) {
      const doc = rawDoc as CmsProductLike;
      if (doc._status === "draft") continue;

      const product = normalizeCmsProduct(doc);
      if (product) merged.set(product.id, product);
    }

    return Array.from(merged.values()).sort(bySortOrder);
  } catch (error) {
    console.warn("[cms] Catalog products fallback is active:", error);
    return fallbackProducts.slice().sort(bySortOrder);
  }
});

export async function getCatalogProductsByCategory(categoryId: string) {
  const products = await getCatalogProducts();
  return products.filter((product) => product.categoryId === categoryId).sort(bySortOrder);
}

export async function getCatalogProductView(categoryId: string, productId: string) {
  const products = await getCatalogProducts();
  return products.find((product) => product.categoryId === categoryId && product.id === productId);
}
