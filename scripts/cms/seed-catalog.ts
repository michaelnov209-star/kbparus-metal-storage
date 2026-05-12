#!/usr/bin/env node
/**
 * Non-destructive catalog seed for Payload CMS.
 *
 * Creates missing categories, subcategories and products from current
 * data/storageSystems sources. It never deletes records and does not overwrite
 * existing manager edits unless --update-existing is explicitly passed.
 */

import { existsSync, readFileSync } from "node:fs";
import { getPayload } from "payload";
import config from "@payload-config";
import { excelHomeCatalog } from "../../data/storageSystems/excelCatalog";
import { catalogProducts, catalogSubcategories } from "../../data/storageSystems/catalogDepth";

const ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "PAYLOAD_SECRET"
];

type CollectionSlug = "categories" | "subcategories" | "products" | "calculator-profiles";
type AnyRecord = Record<string, any>;

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const updateExisting = args.includes("--update-existing");

loadLocalEnv(".env.local");
loadLocalEnv(".env.seed.local");

if (!process.env.PAYLOAD_SECRET) {
  fail("PAYLOAD_SECRET is missing.");
}

if (
  !process.env.DATABASE_URL &&
  !process.env.POSTGRES_URL &&
  !process.env.DATABASE_URL_UNPOOLED &&
  !process.env.POSTGRES_URL_NON_POOLING
) {
  fail("Database URL is missing.");
}

const payload = await getPayload({ config });

const stats = {
  categories: { created: 0, updated: 0, skipped: 0 },
  subcategories: { created: 0, updated: 0, skipped: 0 },
  products: { created: 0, updated: 0, skipped: 0 }
};

const categoryIds = new Map<string, string>();
const subcategoryIds = new Map<string, string>();
const calculatorProfileIds = new Map<string, string>();

console.log(`Catalog seed mode: ${apply ? "apply" : "dry-run"}`);
console.log(`Existing records: ${updateExisting ? "update enabled" : "preserve existing"}`);

await seedCategories();
await seedSubcategories();
await cacheCalculatorProfiles();
await seedProducts();

console.log("Summary:");
console.log(`  categories: created=${stats.categories.created}, updated=${stats.categories.updated}, skipped=${stats.categories.skipped}`);
console.log(`  subcategories: created=${stats.subcategories.created}, updated=${stats.subcategories.updated}, skipped=${stats.subcategories.skipped}`);
console.log(`  products: created=${stats.products.created}, updated=${stats.products.updated}, skipped=${stats.products.skipped}`);

if (!apply) {
  console.log("Dry-run only. Re-run with --apply to write missing records.");
}

async function seedCategories() {
  for (const [index, item] of excelHomeCatalog.entries()) {
    const existing = await findBySlug("categories", item.id);
    const data = {
      slug: item.id,
      title: item.title,
      summary: item.summary,
      scenario: item.scenario,
      featured: Boolean(item.featured),
      sortOrder: index,
      legacyImagePath: item.image,
      _status: "published"
    };

    const saved = await upsertBySlug("categories", item.id, data, stats.categories);
    if (saved?.id) categoryIds.set(item.id, saved.id);
    if (!saved && existing?.id) categoryIds.set(item.id, existing.id);
  }
}

async function seedSubcategories() {
  for (const [index, item] of catalogSubcategories.entries()) {
    const categoryId = categoryIds.get(item.categoryId);
    if (!categoryId) {
      console.warn(`[WARN] skip subcategory ${item.id}: category ${item.categoryId} is missing`);
      stats.subcategories.skipped++;
      continue;
    }

    const existing = await findBySlug("subcategories", item.id);
    const data = {
      slug: item.id,
      category: categoryId,
      title: item.title,
      summary: item.summary,
      featured: Boolean(item.featured),
      sortOrder: item.sortOrder ?? index,
      legacyImagePath: item.image,
      _status: "published"
    };

    const saved = await upsertBySlug("subcategories", item.id, data, stats.subcategories);
    if (saved?.id) subcategoryIds.set(item.id, saved.id);
    if (!saved && existing?.id) subcategoryIds.set(item.id, existing.id);
  }
}

async function cacheCalculatorProfiles() {
  const response = await (payload as any).find({
    collection: "calculator-profiles",
    limit: 100,
    pagination: false,
    depth: 0,
    overrideAccess: true
  });

  for (const doc of response.docs ?? []) {
    if (typeof doc.slug === "string" && typeof doc.id === "string") {
      calculatorProfileIds.set(doc.slug, doc.id);
    }
  }
}

async function seedProducts() {
  for (const [index, product] of catalogProducts.entries()) {
    const categoryId = categoryIds.get(product.categoryId);
    if (!categoryId) {
      console.warn(`[WARN] skip product ${product.id}: category ${product.categoryId} is missing`);
      stats.products.skipped++;
      continue;
    }

    const data: AnyRecord = {
      slug: product.id,
      sku: product.sku,
      sortOrder: product.sortOrder ?? index,
      title: product.title,
      shortTitle: product.shortTitle,
      category: categoryId,
      badge: product.badge,
      summary: product.summary,
      description: product.description,
      legacyImagePath: product.image,
      legacyGalleryPaths: product.gallery.map((path) => ({ path })),
      pageMode: product.pageMode,
      priceMode: product.priceMode,
      priceFrom: product.priceFrom,
      priceTo: product.priceTo,
      priceLabel: product.priceLabel,
      applications: product.applications.map((value) => ({ value })),
      specs: product.specs,
      includes: product.includes.map((value) => ({ value })),
      documents: product.documents,
      referenceUrl: product.referenceUrl,
      featured: Boolean(product.featured),
      draft: Boolean(product.draft),
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      keywords: product.keywords?.map((value) => ({ value })),
      noIndex: Boolean(product.noIndex),
      _status: "published"
    };

    const subcategoryId = product.subcategoryId ? subcategoryIds.get(product.subcategoryId) : undefined;
    if (subcategoryId) data.subcategory = subcategoryId;

    const calculatorProfileId = product.calculatorProfileId ? calculatorProfileIds.get(product.calculatorProfileId) : undefined;
    if (calculatorProfileId) data.calculatorProfile = calculatorProfileId;

    await upsertBySlug("products", product.id, compact(data), stats.products);
  }
}

async function upsertBySlug(collection: CollectionSlug, slug: string, data: AnyRecord, stat: { created: number; updated: number; skipped: number }) {
  const existing = await findBySlug(collection, slug);

  if (existing && !updateExisting) {
    stat.skipped++;
    return null;
  }

  if (!apply) {
    if (existing) stat.skipped++;
    else stat.created++;
    return existing ?? null;
  }

  if (existing) {
    const updated = await (payload as any).update({
      collection,
      id: existing.id,
      data,
      overrideAccess: true,
      depth: 0
    });
    stat.updated++;
    return updated;
  }

  const created = await (payload as any).create({
    collection,
    data,
    overrideAccess: true,
    depth: 0
  });
  stat.created++;
  return created;
}

async function findBySlug(collection: CollectionSlug, slug: string): Promise<AnyRecord | null> {
  const response = await (payload as any).find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true
  });

  return response.docs?.[0] ?? null;
}

function compact<T extends AnyRecord>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}

function loadLocalEnv(path: string) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    if (!ENV_KEYS.includes(key) || process.env[key]) continue;

    const raw = trimmed.slice(index + 1).trim();
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

function fail(message: string): never {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
}
