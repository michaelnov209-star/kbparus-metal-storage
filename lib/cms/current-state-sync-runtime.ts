import { posix } from "node:path";
import type { Payload } from "payload";

import { catalogProducts, catalogSubcategories } from "@/data/storageSystems/catalogDepth";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import {
  countMissingPublishedCalculatorProfiles,
  mapPublishedCalculatorProfileIds,
  readCalculatorProfileSyncState,
  syncCalculatorProfilesMissingOnly,
  type CalculatorProfileSyncState
} from "@/lib/calculator/profile-sync-service";
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
import {
  relationDocumentId,
  sanitizeProductGalleryRows,
  type ProductGalleryRow
} from "@/lib/cms/product-gallery-policy";

const MAX_ASSET_BYTES = 15 * 1024 * 1024;
const COLLECTION_PAGE_SIZE = 100;

type SupportedCollection =
  | "categories"
  | "media"
  | "products"
  | "subcategories";

type CurrentStateSnapshot = {
  calculatorProfiles: CalculatorProfileSyncState;
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
  invalidProductGalleryRows: number;
  missingAssets: string[];
  missingFields: number;
  missingRecords: number;
};

export type CurrentStateContentResult = {
  createdRecords: number;
  updatedFields: number;
  updatedRecords: number;
};

export type ProductGalleryRepairResult = {
  removedRows: number;
  updatedProducts: number;
};

type ManagedVisualSyncResult = {
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
  const docs: PlainRecord[] = [];
  let page = 1;

  while (true) {
    const response = await cms.find({
      collection,
      depth: 0,
      draft,
      limit: COLLECTION_PAGE_SIZE,
      overrideAccess: true,
      page,
      pagination: true,
      sort: "id"
    });
    docs.push(...asDocs(response));

    const pagination = response as unknown as {
      hasNextPage?: boolean;
      nextPage?: number | null;
    };
    if (pagination.hasNextPage !== true) break;
    if (
      typeof pagination.nextPage !== "number" ||
      !Number.isInteger(pagination.nextPage) ||
      pagination.nextPage <= page
    ) {
      throw new Error("CMS вернула некорректную пагинацию");
    }
    page = pagination.nextPage;
  }

  return docs;
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
    readCalculatorProfileSyncState(cms)
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

function mediaDocsByLegacyTitle(
  docs: PlainRecord[]
): Map<string, PlainRecord[]> {
  const byLegacyTitle = new Map<string, PlainRecord[]>();

  for (const doc of docs) {
    const title = stringValue(doc.internalTitle);
    if (!title) continue;
    const matching = byLegacyTitle.get(title) ?? [];
    matching.push(doc);
    byLegacyTitle.set(title, matching);
  }

  return byLegacyTitle;
}

function trustedMediaUrl(value: unknown, requestOrigin: string): URL | undefined {
  const url = stringValue(value);
  if (!url) return undefined;
  try {
    const parsed = new URL(url, requestOrigin);
    if (parsed.protocol !== "https:") return undefined;
    if (
      parsed.origin !== requestOrigin &&
      !parsed.hostname.endsWith(".public.blob.vercel-storage.com")
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

async function mediaDocumentIsAvailable(
  doc: PlainRecord,
  requestOrigin: string,
  fetcher: typeof fetch
): Promise<boolean> {
  if (documentId(doc) === undefined || !stringValue(doc.filename)) return false;
  const url = trustedMediaUrl(doc.url, requestOrigin);
  if (!url) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetcher(url, {
      cache: "no-store",
      headers: { range: "bytes=0-0" },
      method: "GET",
      redirect: "error",
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function availableMediaId(
  candidates: PlainRecord[],
  requestOrigin: string,
  fetcher: typeof fetch
): Promise<number | string | undefined> {
  for (const doc of candidates) {
    if (!(await mediaDocumentIsAvailable(doc, requestOrigin, fetcher))) {
      continue;
    }
    const id = documentId(doc);
    if (id !== undefined) return id;
  }
  return undefined;
}

async function mapMediaIds(
  docs: PlainRecord[],
  requestOrigin: string,
  fetcher: typeof fetch = fetch
): Promise<Map<string, number | string>> {
  const byLegacyTitle = mediaDocsByLegacyTitle(docs);
  const result = new Map<string, number | string>();

  await Promise.all(
    CURRENT_STATE_ASSETS.map(async (asset) => {
      const candidates =
        byLegacyTitle.get(legacyMediaTitle(asset.publicPath)) ?? [];
      const id = await availableMediaId(candidates, requestOrigin, fetcher);
      if (id !== undefined) result.set(asset.publicPath, id);
    })
  );

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

function managedLegacyMediaIds(docs: PlainRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const doc of docs) {
    const id = documentId(doc);
    const title = stringValue(doc.internalTitle);
    if (
      id !== undefined &&
      title?.startsWith("Legacy asset: /assets/")
    ) {
      ids.add(String(id));
    }
  }
  return ids;
}

function relationIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      relationDocumentId(
        item && typeof item === "object"
          ? (item as { image?: unknown }).image
          : item
      )
    )
    .filter(
      (id): id is number | string =>
        typeof id === "number" || typeof id === "string"
    )
    .map(String);
}

function relationIdEquals(left: unknown, right: unknown) {
  const leftId = relationDocumentId(left);
  const rightId = relationDocumentId(right);
  return (
    leftId !== undefined &&
    rightId !== undefined &&
    String(leftId) === String(rightId)
  );
}

function sameRelationList(left: unknown, right: unknown) {
  const leftIds = relationIds(left);
  const rightIds = relationIds(right);
  return (
    leftIds.length === rightIds.length &&
    leftIds.every((id, index) => id === rightIds[index])
  );
}

function buildProductGalleryRepairPlan(
  categories: PlainRecord[],
  products: PlainRecord[]
) {
  const categoryImageById = new Map<string, number | string>();
  for (const category of categories) {
    const id = relationDocumentId(category.id);
    const imageId = relationDocumentId(category.image);
    if (id !== undefined && imageId !== undefined) {
      categoryImageById.set(String(id), imageId);
    }
  }

  return products
    .map((product) => {
      const id = documentId(product);
      const categoryId = relationDocumentId(product.category);
      const gallery = Array.isArray(product.gallery)
        ? (product.gallery as ProductGalleryRow[])
        : [];
      const repair = sanitizeProductGalleryRows({
        categoryImageId:
          categoryId === undefined
            ? undefined
            : categoryImageById.get(String(categoryId)),
        mainImageId: relationDocumentId(product.image),
        rows: gallery
      });
      return {
        id,
        isDraft: product._status === "draft",
        repair
      };
    })
    .filter(
      (
        item
      ): item is {
        id: number | string;
        isDraft: boolean;
        repair: ReturnType<typeof sanitizeProductGalleryRows<ProductGalleryRow>>;
      } => item.id !== undefined && item.repair.removed > 0
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

function countManagedCollectionVisualChanges(
  collection: "categories" | "products" | "subcategories",
  docs: PlainRecord[],
  seeds: PlainRecord[],
  managedMediaIds: Set<string>
) {
  const currentBySlug = docsBySlug(docs);
  return seeds.reduce((total, seed) => {
    const slug = stringValue(seed.slug);
    const current = slug ? currentBySlug.get(slug) : undefined;
    if (!current) return total;
    return (
      total +
      Object.keys(
        buildManagedVisualPatch(
          collection,
          current,
          seed,
          managedMediaIds
        )
      ).length
    );
  }, 0);
}

export async function auditCurrentState(
  cms: Payload,
  requestUrl: string,
  fetcher: typeof fetch = fetch
): Promise<CurrentStateAudit> {
  const snapshot = await readSnapshot(cms);
  const requestOrigin = new URL(requestUrl).origin;
  const mediaIds = await mapMediaIds(
    snapshot.media,
    requestOrigin,
    fetcher
  );
  const categoryIds = mapIdsBySlug(snapshot.categories);
  const subcategoryIds = mapIdsBySlug(snapshot.subcategories);
  const calculatorProfileIds = mapPublishedCalculatorProfileIds(
    snapshot.calculatorProfiles.published
  );
  const managedMediaIds = managedLegacyMediaIds(snapshot.media);
  const homeSeed = buildHomeContentSeed(mediaIds);
  const categorySeeds = buildCategorySeeds(mediaIds);
  const subcategorySeeds = buildSubcategorySeeds(mediaIds, categoryIds);
  const productSeeds = buildProductSeeds(
    mediaIds,
    categoryIds,
    subcategoryIds,
    calculatorProfileIds
  );

  let missingFields = 0;
  missingFields += mergeMissingState(
    snapshot.home,
    homeSeed
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
    categorySeeds
  );
  const subcategoryAudit = auditExistingRecords(
    snapshot.subcategories,
    subcategorySeeds
  );
  const productAudit = auditExistingRecords(
    snapshot.products,
    productSeeds
  );

  missingFields +=
    categoryAudit.missingFields +
    subcategoryAudit.missingFields +
    productAudit.missingFields;
  missingFields += Object.keys(
    buildManagedHomeVisualPatch(
      snapshot.home,
      homeSeed,
      managedMediaIds
    )
  ).length;
  missingFields += countManagedCollectionVisualChanges(
    "categories",
    snapshot.categories,
    categorySeeds,
    managedMediaIds
  );
  missingFields += countManagedCollectionVisualChanges(
    "subcategories",
    snapshot.subcategories,
    subcategorySeeds,
    managedMediaIds
  );
  missingFields += countManagedCollectionVisualChanges(
    "products",
    snapshot.products,
    productSeeds,
    managedMediaIds
  );

  const missingRecords =
    excelHomeCatalog.filter((item) => !categoryIds.has(item.id)).length +
    catalogSubcategories.filter((item) => !subcategoryIds.has(item.id)).length +
    catalogProducts.filter(
      (item) => !mapIdsBySlug(snapshot.products).has(item.id)
    ).length +
    countMissingPublishedCalculatorProfiles(snapshot.calculatorProfiles);

  return {
    assetTotal: CURRENT_STATE_ASSETS.length,
    invalidProductGalleryRows: buildProductGalleryRepairPlan(
      snapshot.categories,
      snapshot.products
    ).reduce((total, item) => total + item.repair.removed, 0),
    missingAssets: CURRENT_STATE_ASSETS.filter(
      (asset) => !mediaIds.has(asset.publicPath)
    ).map((asset) => asset.key),
    missingFields,
    missingRecords
  };
}

export async function repairProductGalleries(
  cms: Payload
): Promise<ProductGalleryRepairResult> {
  const snapshot = await readSnapshot(cms);
  const plan = buildProductGalleryRepairPlan(
    snapshot.categories,
    snapshot.products
  );

  for (const item of plan) {
    await cms.update({
      collection: "products",
      id: item.id,
      data: {
        gallery: item.repair.rows,
        _status: item.isDraft ? "draft" : "published"
      } as never,
      draft: item.isDraft,
      overrideAccess: true
    });
  }

  return {
    removedRows: plan.reduce(
      (total, item) => total + item.repair.removed,
      0
    ),
    updatedProducts: plan.length
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

function copyIntoUploadBuffer(arrayBuffer: ArrayBuffer): Buffer {
  const source = new Uint8Array(arrayBuffer);
  // Node's fetch implementation may expose a SharedArrayBuffer-backed view in
  // serverless runtimes. Blob storage rejects that backing store, so copy into
  // an unpooled Buffer with a regular, isolated ArrayBuffer.
  const copy = Buffer.allocUnsafeSlow(source.byteLength);
  copy.set(source);
  return copy;
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
  const requestOrigin = new URL(requestUrl).origin;
  const matchingDocs =
    mediaDocsByLegacyTitle(currentMedia).get(
      legacyMediaTitle(asset.publicPath)
    ) ?? [];
  const existingId = await availableMediaId(
    matchingDocs,
    requestOrigin,
    fetcher
  );
  if (existingId !== undefined) return { created: false, id: existingId };

  const orphan = matchingDocs.find((doc) => documentId(doc) !== undefined);
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
    bytes = copyIntoUploadBuffer(await response.arrayBuffer());
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

  const data = {
    alt: asset.alt,
    assetType: asset.assetType,
    caption: asset.title,
    internalTitle: legacyMediaTitle(asset.publicPath),
    managerNote: `Импортировано из текущего состояния сайта: ${asset.publicPath}`,
    publiclyAvailable: true,
    usageArea: asset.usageArea
  } as const;
  const file = {
    data: bytes,
    mimetype,
    name: posix.basename(asset.publicPath),
    size: bytes.byteLength
  };
  const orphanId = orphan ? documentId(orphan) : undefined;
  const saved =
    orphanId !== undefined
      ? await cms.update({
          collection: "media",
          id: orphanId,
          data,
          file,
          overrideAccess: true
        })
      : await cms.create({
          collection: "media",
          data,
          file,
          overrideAccess: true
        });
  const id = documentId(saved as unknown as PlainRecord);
  if (id === undefined) throw new Error("CMS не вернула идентификатор файла");
  return { created: orphanId === undefined, id };
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

/**
 * A catalog image stays seed-managed only while the record points to a media
 * document created from a local "Legacy asset". Images chosen by an editor
 * have another media id and are therefore never overwritten here.
 */
async function syncManagedCollectionVisuals(
  cms: Payload,
  collection: "categories" | "products" | "subcategories",
  currentDocs: PlainRecord[],
  seeds: PlainRecord[],
  managedMediaIds: Set<string>
): Promise<ManagedVisualSyncResult> {
  const bySlug = docsBySlug(currentDocs);
  let updatedFields = 0;
  let updatedRecords = 0;

  for (const seed of seeds) {
    const slug = stringValue(seed.slug);
    const current = slug ? bySlug.get(slug) : undefined;
    const id = current ? documentId(current) : undefined;
    if (!current || id === undefined) continue;

    const patch = buildManagedVisualPatch(
      collection,
      current,
      seed,
      managedMediaIds
    );

    const fields = Object.keys(patch).length;
    if (fields === 0) continue;

    const keepDraft = current._status === "draft";
    await cms.update({
      collection,
      id,
      data: patch as never,
      draft: keepDraft,
      overrideAccess: true
    });
    updatedFields += fields;
    updatedRecords += 1;
  }

  return { updatedFields, updatedRecords };
}

export function buildManagedVisualPatch(
  collection: "categories" | "products" | "subcategories",
  current: PlainRecord,
  seed: PlainRecord,
  managedMediaIds: Set<string>
): PlainRecord {
  const patch: PlainRecord = {};
  const currentImageId = relationDocumentId(current.image);
  const desiredImageId = relationDocumentId(seed.image);
  if (
    currentImageId !== undefined &&
    desiredImageId !== undefined &&
    managedMediaIds.has(String(currentImageId)) &&
    !relationIdEquals(current.image, seed.image)
  ) {
    patch.image = seed.image;
    patch.legacyImagePath = seed.legacyImagePath;
  }

  if (collection !== "products") return patch;

  const currentGalleryIds = relationIds(current.gallery);
  const galleryIsManaged =
    currentGalleryIds.length > 0 &&
    currentGalleryIds.every((galleryId) =>
      managedMediaIds.has(galleryId)
    );

  if (
    galleryIsManaged &&
    !sameRelationList(current.gallery, seed.gallery)
  ) {
    patch.gallery = seed.gallery;
    patch.legacyGalleryPaths = seed.legacyGalleryPaths;
  }

  return patch;
}

function plainRecord(value: unknown): PlainRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as PlainRecord)
    : undefined;
}

function replaceManagedRelation(
  current: PlainRecord,
  desired: PlainRecord,
  field: string,
  managedMediaIds: Set<string>
): PlainRecord | undefined {
  const currentId = relationDocumentId(current[field]);
  const desiredId = relationDocumentId(desired[field]);
  if (
    currentId === undefined ||
    desiredId === undefined ||
    !managedMediaIds.has(String(currentId)) ||
    relationIdEquals(current[field], desired[field])
  ) {
    return undefined;
  }
  return { ...current, [field]: desired[field] };
}

function patchManagedRelationRows(
  currentValue: unknown,
  desiredValue: unknown,
  matchField: string,
  mediaField: string,
  managedMediaIds: Set<string>
): PlainRecord[] | undefined {
  if (!Array.isArray(currentValue) || !Array.isArray(desiredValue)) {
    return undefined;
  }

  const desiredByKey = new Map<string, PlainRecord>();
  for (const item of desiredValue) {
    const desired = plainRecord(item);
    const key = desired ? stringValue(desired[matchField]) : undefined;
    if (desired && key) desiredByKey.set(key, desired);
  }

  let changed = false;
  const rows = currentValue.map((item) => {
    const current = plainRecord(item);
    const key = current ? stringValue(current[matchField]) : undefined;
    const desired = key ? desiredByKey.get(key) : undefined;
    if (!current || !desired) return item as PlainRecord;

    const updated = replaceManagedRelation(
      current,
      desired,
      mediaField,
      managedMediaIds
    );
    if (!updated) return current;
    changed = true;
    return updated;
  });

  return changed ? rows : undefined;
}

/**
 * Home-page media selected by an editor is never replaced. Only relations to
 * media imported as "Legacy asset" follow a newer versioned seed asset, so the
 * admin form continues to show the same image that the public page uses.
 */
export function buildManagedHomeVisualPatch(
  current: PlainRecord,
  seed: PlainRecord,
  managedMediaIds: Set<string>
): PlainRecord {
  const patch: PlainRecord = {};

  const patchBlock = (block: string, mediaField: string) => {
    const currentBlock = plainRecord(current[block]);
    const desiredBlock = plainRecord(seed[block]);
    if (!currentBlock || !desiredBlock) return;
    const updated = replaceManagedRelation(
      currentBlock,
      desiredBlock,
      mediaField,
      managedMediaIds
    );
    if (updated) patch[block] = updated;
  };

  const currentHero = plainRecord(current.hero);
  const desiredHero = plainRecord(seed.hero);
  const currentBackground = plainRecord(currentHero?.background);
  const desiredBackground = plainRecord(desiredHero?.background);
  if (currentHero && desiredHero && currentBackground && desiredBackground) {
    let nextBackground = currentBackground;
    let backgroundChanged = false;
    for (const field of ["video", "mobileVideo", "poster", "image"]) {
      const updated = replaceManagedRelation(
        nextBackground,
        desiredBackground,
        field,
        managedMediaIds
      );
      if (!updated) continue;
      nextBackground = updated;
      backgroundChanged = true;
    }
    if (backgroundChanged) {
      patch.hero = { ...currentHero, background: nextBackground };
    }
  }

  patchBlock("beforeBlock", "image");
  patchBlock("afterBlock", "image");
  patchBlock("kbparusBanner", "image");
  patchBlock("coatingBanner", "image");

  const rowCollections = [
    ["storedMaterials", "title", "image"],
    ["cases", "title", "image"],
    ["reviews", "name", "image"],
    ["partners", "name", "logo"]
  ] as const;
  for (const [field, matchField, mediaField] of rowCollections) {
    const rows = patchManagedRelationRows(
      current[field],
      seed[field],
      matchField,
      mediaField,
      managedMediaIds
    );
    if (rows) patch[field] = rows;
  }

  return patch;
}

async function syncManagedHomeVisuals(
  cms: Payload,
  current: PlainRecord,
  seed: PlainRecord,
  managedMediaIds: Set<string>
): Promise<ManagedVisualSyncResult> {
  const patch = buildManagedHomeVisualPatch(
    current,
    seed,
    managedMediaIds
  );
  const updatedFields = Object.keys(patch).length;
  if (updatedFields === 0) {
    return { updatedFields: 0, updatedRecords: 0 };
  }

  await cms.updateGlobal({
    slug: "home-content",
    data: patch as never,
    overrideAccess: true
  });
  return { updatedFields, updatedRecords: 1 };
}

export async function syncCurrentStateContent(
  cms: Payload,
  requestUrl: string,
  fetcher: typeof fetch = fetch
): Promise<CurrentStateContentResult> {
  const snapshot = await readSnapshot(cms);
  const requestOrigin = new URL(requestUrl).origin;
  const mediaIds = await mapMediaIds(
    snapshot.media,
    requestOrigin,
    fetcher
  );
  const managedMediaIds = managedLegacyMediaIds(snapshot.media);
  const homeSeed = buildHomeContentSeed(mediaIds);
  const mergedHome = mergeMissingState(snapshot.home, homeSeed);
  const globalResults = await Promise.all([
    updateGlobalMissingOnly(
      cms,
      "home-content",
      snapshot.home,
      homeSeed
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
  const homeVisuals = await syncManagedHomeVisuals(
    cms,
    mergedHome.value,
    homeSeed,
    managedMediaIds
  );

  const categorySeeds = buildCategorySeeds(mediaIds);
  const categories = await syncCollectionMissingOnly(
    cms,
    "categories",
    snapshot.categories,
    categorySeeds
  );
  const categoryVisuals = await syncManagedCollectionVisuals(
    cms,
    "categories",
    categories.docs,
    categorySeeds,
    managedMediaIds
  );
  const categoryIds = mapIdsBySlug(categories.docs);

  const subcategorySeeds = buildSubcategorySeeds(mediaIds, categoryIds);
  const subcategories = await syncCollectionMissingOnly(
    cms,
    "subcategories",
    snapshot.subcategories,
    subcategorySeeds
  );
  const subcategoryVisuals = await syncManagedCollectionVisuals(
    cms,
    "subcategories",
    subcategories.docs,
    subcategorySeeds,
    managedMediaIds
  );
  const subcategoryIds = mapIdsBySlug(subcategories.docs);
  const calculatorProfiles = await syncCalculatorProfilesMissingOnly(
    cms,
    snapshot.calculatorProfiles
  );
  const calculatorProfileIds = mapPublishedCalculatorProfileIds(
    calculatorProfiles.publishedDocs
  );
  const productSeeds = buildProductSeeds(
    mediaIds,
    categoryIds,
    subcategoryIds,
    calculatorProfileIds
  );

  const products = await syncCollectionMissingOnly(
    cms,
    "products",
    snapshot.products,
    productSeeds
  );
  const productVisuals = await syncManagedCollectionVisuals(
    cms,
    "products",
    products.docs,
    productSeeds,
    managedMediaIds
  );

  return {
    createdRecords:
      calculatorProfiles.created +
      categories.createdRecords +
      subcategories.createdRecords +
      products.createdRecords,
    updatedFields:
      globalResults.reduce((total, result) => total + result.updatedFields, 0) +
      homeVisuals.updatedFields +
      categoryVisuals.updatedFields +
      categories.updatedFields +
      subcategoryVisuals.updatedFields +
      subcategories.updatedFields +
      productVisuals.updatedFields +
      products.updatedFields,
    updatedRecords:
      calculatorProfiles.published +
      globalResults.reduce((total, result) => total + result.updatedRecords, 0) +
      homeVisuals.updatedRecords +
      categoryVisuals.updatedRecords +
      categories.updatedRecords +
      subcategoryVisuals.updatedRecords +
      subcategories.updatedRecords +
      productVisuals.updatedRecords +
      products.updatedRecords
  };
}

export const currentStateRuntimeLimits = {
  collectionPageSize: COLLECTION_PAGE_SIZE,
  maxAssetBytes: MAX_ASSET_BYTES
} as const;
