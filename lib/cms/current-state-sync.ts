import { catalogProducts, catalogSubcategories } from "@/data/storageSystems/catalogDepth";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { DEFAULT_CONTACTS } from "@/lib/cms/contacts";
import { DEFAULT_HOME_CONTENT } from "@/lib/cms/home-content";
import { getProductGallerySlots } from "@/lib/catalog/product-gallery";
import { DEFAULT_SITE_NAVIGATION } from "@/lib/cms/site-navigation";

export type CurrentStateAsset = {
  alt: string;
  assetType: "banner" | "photo" | "video";
  key: string;
  mimeType: string;
  publicPath: string;
  title: string;
  usageArea: "catalog" | "cases" | "home" | "partners";
};

export type MediaIdMap = ReadonlyMap<string, number | string>;
export type PlainRecord = Record<string, unknown>;

type MergeResult<T> = {
  updatedFields: number;
  value: T;
};

const DOCUMENT_META_FIELDS = new Set([
  "_status",
  "createdAt",
  "globalType",
  "id",
  "sizes",
  "updatedAt"
]);

function isPlainRecord(value: unknown): value is PlainRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMissingScalar(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0)
  );
}

function countPopulatedLeaves(value: unknown): number {
  if (isMissingScalar(value)) return 0;
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countPopulatedLeaves(item), 0);
  }
  if (isPlainRecord(value)) {
    return Object.values(value).reduce<number>(
      (total, item) => total + countPopulatedLeaves(item),
      0
    );
  }
  return 1;
}

function arrayIdentity(value: unknown): string | undefined {
  if (!isPlainRecord(value)) return undefined;
  for (const key of [
    "slug",
    "title",
    "label",
    "name",
    "question",
    "city",
    "platform",
    "value"
  ]) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return `${key}:${candidate.trim().toLocaleLowerCase("ru")}`;
    }
  }
  return undefined;
}

/**
 * Fills only values that are absent in the CMS. Explicit false/0 values,
 * existing arrays and editor-entered content are authoritative.
 */
export function mergeMissingState<T>(
  current: T,
  fallback: T
): MergeResult<T> {
  if (isMissingScalar(current)) {
    return {
      updatedFields: countPopulatedLeaves(fallback),
      value: structuredClone(fallback)
    };
  }

  if (Array.isArray(current) && Array.isArray(fallback)) {
    if (current.length === 0) {
      return {
        updatedFields: 0,
        value: current
      };
    }

    const fallbackByIdentity = new Map(
      fallback
        .map((item) => [arrayIdentity(item), item] as const)
        .filter(
          (entry): entry is readonly [string, unknown] =>
            typeof entry[0] === "string"
        )
    );
    let updatedFields = 0;
    const value = current.map((item, index) => {
      const matchingFallback =
        (arrayIdentity(item)
          ? fallbackByIdentity.get(arrayIdentity(item)!)
          : undefined) ?? fallback[index];
      if (matchingFallback === undefined) return item;
      const merged = mergeMissingState(item, matchingFallback);
      updatedFields += merged.updatedFields;
      return merged.value;
    });
    return { updatedFields, value: value as T };
  }

  if (isPlainRecord(current) && isPlainRecord(fallback)) {
    const value: PlainRecord = { ...current };
    let updatedFields = 0;
    for (const [key, fallbackValue] of Object.entries(fallback)) {
      if (fallbackValue === undefined) continue;
      const merged = mergeMissingState(value[key], fallbackValue);
      value[key] = merged.value;
      updatedFields += merged.updatedFields;
    }
    return { updatedFields, value: value as T };
  }

  return { updatedFields: 0, value: current };
}

export function stripDocumentMeta(value: PlainRecord): PlainRecord {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !DOCUMENT_META_FIELDS.has(key))
  );
}

function inferMimeType(path: string): string {
  const extension = path.split("?")[0].split(".").at(-1)?.toLowerCase();
  if (extension === "mp4") return "video/mp4";
  if (extension === "webm") return "video/webm";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

function collectCurrentStateAssets(): CurrentStateAsset[] {
  const assets = new Map<string, CurrentStateAsset>();
  const add = (
    publicPath: string | undefined,
    title: string,
    alt: string,
    usageArea: CurrentStateAsset["usageArea"],
    assetType: CurrentStateAsset["assetType"] = "photo"
  ) => {
    if (!publicPath?.startsWith("/assets/") || assets.has(publicPath)) return;
    assets.set(publicPath, {
      alt,
      assetType,
      key: publicPath,
      mimeType: inferMimeType(publicPath),
      publicPath,
      title,
      usageArea
    });
  };

  const hero = DEFAULT_HOME_CONTENT.hero.background;
  if (hero.type === "video") {
    add(hero.videoUrl, "Видео Hero для компьютеров", "Фоновое видео производства КБ Парус", "home", "video");
    add(hero.mobileVideoUrl, "Видео Hero для телефонов и планшетов", "Облегчённое фоновое видео производства КБ Парус", "home", "video");
    add(hero.posterUrl, "Постер видео Hero", "Система хранения металла КБ Парус", "home");
  } else {
    add(hero.imageUrl, "Фон Hero", hero.alt, "home");
  }

  for (const item of DEFAULT_HOME_CONTENT.storedMaterials) {
    add(item.imageUrl, `Главная: ${item.title}`, item.imageAlt, "home");
  }
  add(
    DEFAULT_HOME_CONTENT.beforeAfter.before.imageUrl,
    "Главная: склад до внедрения",
    DEFAULT_HOME_CONTENT.beforeAfter.before.imageAlt,
    "home"
  );
  add(
    DEFAULT_HOME_CONTENT.beforeAfter.after.imageUrl,
    "Главная: склад после внедрения",
    DEFAULT_HOME_CONTENT.beforeAfter.after.imageAlt,
    "home"
  );
  for (const item of DEFAULT_HOME_CONTENT.cases) {
    add(item.imageUrl, `Кейс: ${item.title}`, item.imageAlt, "cases");
  }
  for (const item of DEFAULT_HOME_CONTENT.reviews) {
    add(item.imageUrl, `Отзыв: ${item.name}`, item.imageAlt ?? item.name, "home");
  }
  add(
    DEFAULT_HOME_CONTENT.banners.kbparus.imageUrl,
    "Баннер КБ Парус",
    DEFAULT_HOME_CONTENT.banners.kbparus.imageAlt,
    "home",
    "banner"
  );
  add(
    DEFAULT_HOME_CONTENT.banners.coating.imageUrl,
    "Баннер ЛинииОкраски",
    DEFAULT_HOME_CONTENT.banners.coating.imageAlt,
    "home",
    "banner"
  );
  for (const item of DEFAULT_HOME_CONTENT.partners) {
    add(item.logoUrl, `Логотип партнёра: ${item.name}`, item.logoAlt ?? item.name, "partners");
  }

  for (const item of excelHomeCatalog) {
    add(item.image, `Категория: ${item.title}`, item.imageAlt ?? item.title, "catalog");
  }
  for (const item of catalogSubcategories) {
    add(item.image, `Подкатегория: ${item.title}`, item.title, "catalog");
  }
  for (const product of catalogProducts) {
    add(product.image, `Товар: ${product.title}`, product.imageAlt ?? product.title, "catalog");
    product.gallery.forEach((path, index) => {
      add(
        path,
        `${product.title}: фото ${index + 1}`,
        product.galleryAlts?.[index] ?? product.title,
        "catalog"
      );
    });
  }

  return [...assets.values()];
}

export const CURRENT_STATE_ASSETS = collectCurrentStateAssets();
export const CURRENT_STATE_ASSET_BY_KEY = new Map(
  CURRENT_STATE_ASSETS.map((asset) => [asset.key, asset])
);

export function legacyMediaTitle(publicPath: string): string {
  return `Legacy asset: ${publicPath}`;
}

function mediaId(mediaIds: MediaIdMap, publicPath?: string): number | string | undefined {
  return publicPath ? mediaIds.get(publicPath) : undefined;
}

function removeUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (!isPlainRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [key, removeUndefined(child)])
  );
}

export function buildHomeContentSeed(mediaIds: MediaIdMap): PlainRecord {
  const home = DEFAULT_HOME_CONTENT;
  const heroBackground =
    home.hero.background.type === "video"
      ? {
          type: "video",
          video: mediaId(mediaIds, home.hero.background.videoUrl),
          mobileVideo: mediaId(mediaIds, home.hero.background.mobileVideoUrl),
          poster: mediaId(mediaIds, home.hero.background.posterUrl)
        }
      : {
          type: "image",
          image: mediaId(mediaIds, home.hero.background.imageUrl)
        };

  return removeUndefined({
    hero: {
      eyebrow: home.hero.eyebrow,
      title: home.hero.title,
      description: home.hero.description,
      background: heroBackground,
      metrics: home.hero.metrics,
      actions: home.hero.actions
    },
    advantages: home.advantages.map((item) => ({
      title: item.title,
      icon: item.icon,
      description: item.text
    })),
    storedMaterials: home.storedMaterials.map((item) => ({
      title: item.title,
      label: item.label,
      icon: item.icon,
      description: item.text,
      image: mediaId(mediaIds, item.imageUrl)
    })),
    beforeBlock: {
      title: home.beforeAfter.before.title,
      text: home.beforeAfter.before.text,
      image: mediaId(mediaIds, home.beforeAfter.before.imageUrl),
      points: home.beforeAfter.before.points.map((value) => ({ value }))
    },
    afterBlock: {
      title: home.beforeAfter.after.title,
      text: home.beforeAfter.after.text,
      image: mediaId(mediaIds, home.beforeAfter.after.imageUrl),
      points: home.beforeAfter.after.points.map((value) => ({ value }))
    },
    cases: home.cases.map((item) => ({
      customer: item.customer,
      title: item.title,
      task: item.task,
      result: item.result,
      description: item.task,
      image: mediaId(mediaIds, item.imageUrl)
    })),
    geoProjects: home.geography.projects.map((item) => ({
      city: item.city,
      project: item.company
    })),
    reviews: home.reviews.map((item) => ({
      name: item.name,
      role: item.role,
      text: item.text,
      image: mediaId(mediaIds, item.imageUrl)
    })),
    partners: home.partners.map((item) => ({
      name: item.name,
      logo: mediaId(mediaIds, item.logoUrl),
      url: item.url
    })),
    shipmentSteps: home.shipmentSteps.map((item) => ({
      title: item.title,
      icon: item.icon,
      description: item.text
    })),
    aboutTitle: home.about.title,
    aboutText: home.about.text,
    aboutFeatures: home.about.features,
    aboutMetrics: home.about.metrics.map((item) => ({
      value: item.value,
      label: item.label
    })),
    kbparusBanner: {
      image: mediaId(mediaIds, home.banners.kbparus.imageUrl),
      url: home.banners.kbparus.url,
      ctaLabel: home.banners.kbparus.ctaLabel
    },
    coatingBanner: {
      image: mediaId(mediaIds, home.banners.coating.imageUrl),
      url: home.banners.coating.url,
      ctaLabel: home.banners.coating.ctaLabel
    },
    faq: home.faq
  }) as PlainRecord;
}

export function buildContactsSeed(): PlainRecord {
  return {
    phones: DEFAULT_CONTACTS.phones.map((phone, index) => ({
      label: index === 0 ? "Основной телефон" : "Дополнительный телефон",
      number: phone.label
    })),
    email: DEFAULT_CONTACTS.email.label,
    workingHours: DEFAULT_CONTACTS.worktime,
    address: DEFAULT_CONTACTS.address,
    legalName: DEFAULT_CONTACTS.legalName,
    inn: DEFAULT_CONTACTS.inn,
    socials: Object.entries(DEFAULT_CONTACTS.socials).map(([platform, url]) => ({
      platform,
      url
    }))
  };
}

function toPayloadLink(link: {
  href: string;
  label: string;
  openInNewTab?: boolean;
}) {
  return {
    label: link.label,
    href: link.href,
    enabled: true,
    openInNewTab: Boolean(link.openInNewTab)
  };
}

export function buildSiteNavigationSeed(): PlainRecord {
  const navigation = DEFAULT_SITE_NAVIGATION;
  return {
    catalog: navigation.header.catalog,
    headerLinks: navigation.header.links.map(toPayloadLink),
    detailPageLinks: navigation.header.detailLinks.map(toPayloadLink),
    headerContacts: navigation.header.contacts,
    footerDescription: navigation.footer.description,
    footerLinks: navigation.footer.links.map(toPayloadLink),
    legalLinks: navigation.footer.legalLinks.map(toPayloadLink),
    footerCta: navigation.footer.cta
      ? { ...toPayloadLink(navigation.footer.cta), enabled: true }
      : { enabled: false, label: "", href: "" }
  };
}

export function buildCategorySeeds(mediaIds: MediaIdMap): PlainRecord[] {
  return excelHomeCatalog.map((item, index) =>
    removeUndefined({
      slug: item.id,
      sortOrder: index,
      featured: Boolean(item.featured),
      title: item.title,
      summary: item.summary,
      scenario: item.scenario,
      image: mediaId(mediaIds, item.image),
      legacyImagePath: item.image
    }) as PlainRecord
  );
}

export function buildSubcategorySeeds(
  mediaIds: MediaIdMap,
  categoryIds: MediaIdMap
): PlainRecord[] {
  return catalogSubcategories
    .map((item, index) => {
      const category = categoryIds.get(item.categoryId);
      if (!category) return undefined;
      return removeUndefined({
        slug: item.id,
        category,
        title: item.title,
        summary: item.summary,
        image: mediaId(mediaIds, item.image),
        legacyImagePath: item.image,
        sortOrder: item.sortOrder ?? index
      }) as PlainRecord;
    })
    .filter((item): item is PlainRecord => Boolean(item));
}

export function buildProductSeeds(
  mediaIds: MediaIdMap,
  categoryIds: MediaIdMap,
  subcategoryIds: MediaIdMap,
  calculatorProfileIds: MediaIdMap = new Map()
): PlainRecord[] {
  return catalogProducts
    .map((product, index) => {
      const category = categoryIds.get(product.categoryId);
      if (!category) return undefined;
      const subcategory = product.subcategoryId
        ? subcategoryIds.get(product.subcategoryId)
        : undefined;
      const calculatorProfile = product.calculatorProfileId
        ? calculatorProfileIds.get(product.calculatorProfileId)
        : undefined;
      const secondaryGalleryPaths = getProductGallerySlots(product)
        .filter((slot) => !slot.isMain)
        .map((slot) => slot.source);

      return removeUndefined({
        slug: product.id,
        sku: product.sku,
        sortOrder: product.sortOrder ?? index,
        title: product.title,
        shortTitle: product.shortTitle,
        category,
        subcategory,
        badge: product.badge,
        summary: product.summary,
        description: product.description,
        image: mediaId(mediaIds, product.image),
        legacyImagePath: product.image,
        gallery: secondaryGalleryPaths
          .map((path) => mediaId(mediaIds, path))
          .filter((id): id is number | string => id !== undefined)
          .map((image) => ({ image })),
        legacyGalleryPaths: secondaryGalleryPaths.map((path) => ({ path })),
        priceMode: product.priceMode,
        priceFrom: product.priceFrom,
        priceTo: product.priceTo,
        priceLabel: product.priceLabel,
        pageMode: product.pageMode,
        calculatorProfile,
        modelName: product.modelName,
        operationMode: product.operationMode,
        storageMaterials: product.storageMaterials,
        loadingMethods: product.loadingMethods,
        maxLoadKg: product.maxLoadKg,
        warrantyMonths: product.warrantyMonths,
        overallDimensions: product.overallDimensions,
        installationEnvironments: product.installationEnvironments,
        applications: product.applications.map((value) => ({ value })),
        specs: product.specs,
        includes: product.includes.map((value) => ({ value })),
        documents: product.documents,
        referenceUrl: product.referenceUrl,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        ogImage: mediaId(mediaIds, product.ogImage),
        keywords: product.keywords?.map((value) => ({ value })),
        noIndex: product.noIndex,
        featured: Boolean(product.featured),
        draft: Boolean(product.draft)
      }) as PlainRecord;
    })
    .filter((item): item is PlainRecord => Boolean(item));
}
