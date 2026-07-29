import { posix } from "node:path";
import type { Payload } from "payload";

import { catalogProducts, catalogSubcategories } from "@/data/storageSystems/catalogDepth";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import {
  buildCategorySeeds,
  buildContactsSeed,
  buildHomeContentSeed,
  buildProductSeeds,
  buildSiteNavigationSeed,
  buildSubcategorySeeds,
  CURRENT_STATE_ASSET_BY_KEY,
  CURRENT_STATE_ASSETS,
  legacyMediaTitle,
  mergeMissingState,
  stripDocumentMeta,
  type MediaIdMap,
  type PlainRecord
} from "@/lib/cms/current-state-sync";

const MAX_ASSET_BYTES = 15 * 1024 * 1024;
const COLLECTION_LIMIT = 500;

type SupportedCollection =
  | "calculator-profiles"
  | "categories"
  | "media"
  | "products"
  | "subcategories";

type CurrentStateSnapshot = {
  calculatorProfiles: PlainRecord[];
  categories: PlainRecord[];
  contacts: PlainRecord;
  home: PlainRecord;
  media: PlainRecord[];
  navigation: PlainRecord;
  products: PlainRecord[];
  subcategories: PlainRecord[];
};

export type CurrentStateAudit = {
  assetTotal: number;
  missingAssets: string[];
  missingFields: number;
  missingRecords: number;
};

export type CurrentStateContentResult = {
  createdRecords: number;
  updatedFields: number;
  updatedRecords: number;
};

function asDocs(value: unknown): PlainRecord[] {
  if (!value || typeof value !== "object") return [];
  const docs = (value as { docs?: unknown }).docs;
  return Array.isArray(docs) ? (docs as PlainRecord[]) : [];
}

async function findDocs(
  cms: Payload,
  collection: SupportedCollection,
  draft = false
): Promise<PlainRecord[]> {
  const response = await cms.find({
    collection,
    depth: 0,
    draft,
    limit: COLLECTION_LIMIT,
    overrideAccess: true,
    pagination: false
  });
  return asDocs(response);
}

async function readSnapshot(cms: Payload): Promise<CurrentStateSnapshot> {
  const [
    home,
    contacts,
    navigation,
    media,
    categories,
    subcategories,
    products,
    calculatorProfiles
  ] = await Promise.all([
    cms.findGlobal({ slug: "home-content", depth: 0, overrideAccess: true }),
    cms.findGlobal({ slug: "contacts", depth: 0, overrideAccess: true }),
    cms.findGlobal({ slug: "site-navigation", depth: 0, overrideAccess: true }),
    findDocs(cms, "media"),
    findDocs(cms, "categories", true),
    findDocs(cms, "subcategories", true),
    findDocs(cms, "products", true),
    findDocs(cms, "calculator-profiles", true)
  ]);

  return {
    home: home as unknown as PlainRecord,
    contacts: contacts as unknown as PlainRecord,
    navigation: navigation as unknown as PlainRecord,
    media,
    categories,
    subcategories,
    products,
    calculatorProfiles
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function documentId(value: PlainRecord): number | string | undefined {
  return typeof value.id === "number" || typeof value.id === "string"
    ? value.id
    : undefined;
}

function mapIdsBySlug(docs: PlainRecord[]): Map<string, number | string> {
  const ids = new Map<string, number | string>();
  for (const doc of docs) {
    const slug = stringValue(doc.slug);
    const id = documentId(doc);
    if (slug && id !== undefined) ids.set(slug, id);
  }
  return ids;
}

function mapMediaIds(docs: PlainRecord[]): Map<string, number | string> {
  const byLegacyTitle = new Map<string, number | string>();

  for (const doc of docs) {
    const id = documentId(doc);
    if (id === undefined) continue;
    const title = stringValue(doc.internalTitle);
    if (title) byLegacyTitle.set(title, id);
  }

  const result = new Map<string, number | string>();
  for (const asset of CURRENT_STATE_ASSETS) {
    const id = byLegacyTitle.get(legacyMediaTitle(asset.publicPath));
    if (id !== undefined) result.set(asset.publicPath, id);
  }
  return result;
}

function docsBySlug(docs: PlainRecord[]): Map<string, PlainRecord> {
  return new Map(
    docs
      .map((doc) => [stringValue(doc.slug), doc] as const)
      .filter(
        (entry): entry is readonly [string, PlainRecord] =>
          typeof entry[0] === "string"
      )
  );
}

function auditExistingRecords(
  docs: PlainRecord[],
  seeds: PlainRecord[]
): { missingFields: number; missingRecords: number } {
  const existing = docsBySlug(docs);
  let missingFields = 0;
  let missingRecords = 0;

  for (const seed of seeds) {
    const slug = stringValue(seed.slug);
    const current = slug ? existing.get(slug) : undefined;
    if (!current) {
      missingRecords += 1;
      continue;
    }
    missingFields += mergeMissingState(current, seed).updatedFields;
  }
  return { missingFields, missingRecords };
}

export async function auditCurrentState(
  cms: Payload
): Promise<CurrentStateAudit> {
  const snapshot = await readSnapshot(cms);
  const mediaIds = mapMediaIds(snapshot.media);
  const categoryIds = mapIdsBySlug(snapshot.categories);
  const subcategoryIds = mapIdsBySlug(snapshot.subcategories);
  const calculatorProfileIds = mapIdsBySlug(snapshot.calculatorProfiles);

  let missingFields = 0;
  missingFields += mergeMissingState(
    snapshot.home,
    buildHomeContentSeed(mediaIds)
  ).updatedFields;
  missingFields += mergeMissingState(
    snapshot.contacts,
    buildContactsSeed()
  ).updatedFields;
  missingFields += mergeMissingState(
    snapshot.navigation,
    buildSiteNavigationSeed()
  ).updatedFields;

  const categoryAudit = auditExistingRecords(
    snapshot.categories,
    buildCategorySeeds(mediaIds)
  );
  const subcategoryAudit = auditExistingRecords(
    snapshot.subcategories,
    buildSubcategorySeeds(mediaIds, categoryIds)
  );
  const productAudit = auditExistingRecords(
    snapshot.products,
    buildProductSeeds(
      mediaIds,
      categoryIds,
      subcategoryIds,
      calculatorProfileIds
    )
  );

  missingFields +=
    categoryAudit.missingFields +
    subcategoryAudit.missingFields +
    productAudit.missingFields;

  const missingRecords =
    excelHomeCatalog.filter((item) => !categoryIds.has(item.id)).length +
    catalogSubcategories.filter((item) => !subcategoryIds.has(item.id)).length +
    catalogProducts.filter(
      (item) => !mapIdsBySlug(snapshot.products).has(item.id)
    ).length;

  return {
    assetTotal: CURRENT_STATE_ASSETS.length,
    missingAssets: CURRENT_STATE_ASSETS.filter(
      (asset) => !mediaIds.has(asset.publicPath)
    ).map((asset) => asset.key),
    missingFields,
    missingRecords
  };
}

function safeContentType(
  responseType: string | null,
  expectedType: string
): string {
  const value = responseType?.split(";")[0]?.trim().toLowerCase();
  if (!value || value === "application/octet-stream") return expectedType;
  const expectedFamily = expectedType.split("/")[0];
  if (value.split("/")[0] !== expectedFamily) {
    throw new Error("Полученный файл не соответствует ожидаемому типу");
  }
  return value;
}

export async function syncCurrentStateAsset(
  cms: Payload,
  assetKey: string,
  requestUrl: string,
  fetcher: typeof fetch = fetch
): Promise<{ created: boolean; id: number | string }> {
  const asset = CURRENT_STATE_ASSET_BY_KEY.get(assetKey);
  if (!asset) throw new Error("Неизвестный ресурс текущего сайта");

  const currentMedia = await findDocs(cms, "media");
  const existingId = mapMediaIds(currentMedia).get(asset.publicPath);
  if (existingId !== undefined) return { created: false, id: existingId };

  const requestOrigin = new URL(requestUrl).origin;
  const sourceUrl = new URL(asset.publicPath, requestOrigin);
  if (sourceUrl.origin !== requestOrigin) {
    throw new Error("Недопустимый источник файла");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let response: Response;
  let bytes: Buffer;
  try {
    response = await fetcher(sourceUrl, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Не удалось получить действующий файл (${response.status})`);
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_ASSET_BYTES) {
      throw new Error("Файл превышает безопасный лимит 15 МБ");
    }
    bytes = Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }

  if (bytes.byteLength === 0 || bytes.byteLength > MAX_ASSET_BYTES) {
    throw new Error(
      bytes.byteLength === 0
        ? "Получен пустой файл"
        : "Файл превышает безопасный лимит 15 МБ"
    );
  }
  const mimetype = safeContentType(
    response.headers.get("content-type"),
    asset.mimeType
  );

  const created = await cms.create({
    collection: "media",
    data: {
      alt: asset.alt,
      assetType: asset.assetType,
      caption: asset.title,
      internalTitle: legacyMediaTitle(asset.publicPath),
      managerNote: `Импортировано из текущего состояния сайта: ${asset.publicPath}`,
      publiclyAvailable: true,
      usageArea: asset.usageArea
    },
    file: {
      data: bytes,
      mimetype,
      name: posix.basename(asset.publicPath),
      size: bytes.byteLength
    },
    overrideAccess: true
  });
  const id = documentId(created as unknown as PlainRecord);
  if (id === undefined) throw new Error("CMS не вернула идентификатор файла");
  return { created: true, id };
}

async function updateGlobalMissingOnly(
  cms: Payload,
  slug: "contacts" | "home-content" | "site-navigation",
  current: PlainRecord,
  seed: PlainRecord
): Promise<{ updatedFields: number; updatedRecords: number }> {
  const merged = mergeMissingState(current, seed);
  if (merged.updatedFields === 0) {
    return { updatedFields: 0, updatedRecords: 0 };
  }

  await cms.updateGlobal({
    slug,
    data: stripDocumentMeta(merged.value) as never,
    overrideAccess: true
  });
  return { updatedFields: merged.updatedFields, updatedRecords: 1 };
}

async function syncCollectionMissingOnly(
  cms: Payload,
  collection: "categories" | "products" | "subcategories",
  currentDocs: PlainRecord[],
  seeds: PlainRecord[]
): Promise<{
  createdRecords: number;
  docs: PlainRecord[];
  updatedFields: number;
  updatedRecords: number;
}> {
  const bySlug = docsBySlug(currentDocs);
  const docs = [...currentDocs];
  let createdRecords = 0;
  let updatedFields = 0;
  let updatedRecords = 0;

  for (const seed of seeds) {
    const slug = stringValue(seed.slug);
    if (!slug) continue;
    const current = bySlug.get(slug);

    if (!current) {
      const created = (await cms.create({
        collection,
        data: { ...seed, _status: "published" } as never,
        draft: false,
        overrideAccess: true
      })) as unknown as PlainRecord;
      docs.push(created);
      bySlug.set(slug, created);
      createdRecords += 1;
      continue;
    }

    const id = documentId(current);
    if (id === undefined) continue;
    const merged = mergeMissingState(current, seed);
    if (merged.updatedFields === 0) continue;

    const keepDraft = current._status === "draft";
    const updated = (await cms.update({
      collection,
      id,
      data: stripDocumentMeta(merged.value) as never,
      draft: keepDraft,
      overrideAccess: true
    })) as unknown as PlainRecord;
    const index = docs.findIndex((item) => documentId(item) === id);
    if (index >= 0) docs[index] = updated;
    bySlug.set(slug, updated);
    updatedFields += merged.updatedFields;
    updatedRecords += 1;
  }

  return { createdRecords, docs, updatedFields, updatedRecords };
}

export async function syncCurrentStateContent(
  cms: Payload
): Promise<CurrentStateContentResult> {
  const snapshot = await readSnapshot(cms);
  const mediaIds = mapMediaIds(snapshot.media);
  const globalResults = await Promise.all([
    updateGlobalMissingOnly(
      cms,
      "home-content",
      snapshot.home,
      buildHomeContentSeed(mediaIds)
    ),
    updateGlobalMissingOnly(
      cms,
      "contacts",
      snapshot.contacts,
      buildContactsSeed()
    ),
    updateGlobalMissingOnly(
      cms,
      "site-navigation",
      snapshot.navigation,
      buildSiteNavigationSeed()
    )
  ]);

  const categories = await syncCollectionMissingOnly(
    cms,
    "categories",
    snapshot.categories,
    buildCategorySeeds(mediaIds)
  );
  const categoryIds = mapIdsBySlug(categories.docs);

  const subcategories = await syncCollectionMissingOnly(
    cms,
    "subcategories",
    snapshot.subcategories,
    buildSubcategorySeeds(mediaIds, categoryIds)
  );
  const subcategoryIds = mapIdsBySlug(subcategories.docs);
  const calculatorProfileIds = mapIdsBySlug(snapshot.calculatorProfiles);

  const products = await syncCollectionMissingOnly(
    cms,
    "products",
    snapshot.products,
    buildProductSeeds(
      mediaIds,
      categoryIds,
      subcategoryIds,
      calculatorProfileIds
    )
  );

  return {
    createdRecords:
      categories.createdRecords +
      subcategories.createdRecords +
      products.createdRecords,
    updatedFields:
      globalResults.reduce((total, result) => total + result.updatedFields, 0) +
      categories.updatedFields +
      subcategories.updatedFields +
      products.updatedFields,
    updatedRecords:
      globalResults.reduce((total, result) => total + result.updatedRecords, 0) +
      categories.updatedRecords +
      subcategories.updatedRecords +
      products.updatedRecords
  };
}

export const currentStateRuntimeLimits = {
  maxAssetBytes: MAX_ASSET_BYTES
} as const;
