#!/usr/bin/env node
/**
 * Non-destructive remote catalog seed through Payload REST API.
 *
 * Uses admin credentials from shell or local .env.local. It does not read DB
 * secrets, does not print credentials and never deletes records.
 */

import { existsSync, readFileSync } from "node:fs";
import { excelHomeCatalog } from "../../data/storageSystems/excelCatalog";
import { catalogProducts, catalogSubcategories } from "../../data/storageSystems/catalogDepth";

const ENV_KEYS = [
  "CMS_ADMIN_EMAIL",
  "CMS_ADMIN_PASSWORD",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "TEST_ADMIN_EMAIL",
  "TEST_ADMIN_PASSWORD",
  "PAYLOAD_ADMIN_EMAIL",
  "PAYLOAD_ADMIN_PASSWORD"
];

type CollectionSlug = "categories" | "subcategories" | "products" | "calculator-profiles";
type AnyRecord = Record<string, any>;

const args = process.argv.slice(2);
const baseUrlArg = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
const updateExisting = args.includes("--update-existing");

if (!baseUrlArg) {
  fail("Usage: npm run cms:seed-catalog -- <url> [--apply] [--update-existing]");
}

loadLocalEnv(".env.local");

const baseUrl = normalizeBaseUrl(baseUrlArg);
const email = readFirstEnv(["CMS_ADMIN_EMAIL", "E2E_ADMIN_EMAIL", "TEST_ADMIN_EMAIL", "PAYLOAD_ADMIN_EMAIL"]);
const password = readFirstEnv(["CMS_ADMIN_PASSWORD", "E2E_ADMIN_PASSWORD", "TEST_ADMIN_PASSWORD", "PAYLOAD_ADMIN_PASSWORD"]);

if (!email || !password) {
  fail("Admin credentials are missing. Use CMS_ADMIN_EMAIL/CMS_ADMIN_PASSWORD or supported aliases in .env.local.");
}

const token = await login();
const categoryIds = new Map<string, string>();
const subcategoryIds = new Map<string, string>();
const calculatorProfileIds = new Map<string, string>();
const stats = {
  categories: { created: 0, updated: 0, skipped: 0 },
  subcategories: { created: 0, updated: 0, skipped: 0 },
  products: { created: 0, updated: 0, skipped: 0 }
};

console.log(`Remote catalog seed: ${baseUrl}`);
console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
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

async function login() {
  const response = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const text = await response.text();
  if (!response.ok) {
    fail(`Admin login failed: HTTP ${response.status}`);
  }

  const payload = JSON.parse(text || "{}");
  if (typeof payload.token !== "string" || !payload.token) {
    fail("Admin login did not return a token.");
  }

  return payload.token;
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
    const category = categoryIds.get(item.categoryId);
    if (!category) {
      console.warn(`[WARN] skip subcategory ${item.id}: category ${item.categoryId} is missing`);
      stats.subcategories.skipped++;
      continue;
    }

    const existing = await findBySlug("subcategories", item.id);
    const data = {
      slug: item.id,
      category,
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
  const response = await apiGet("/api/calculator-profiles?limit=100&depth=0");
  for (const doc of response.docs ?? []) {
    if (typeof doc.slug === "string" && typeof doc.id === "string") {
      calculatorProfileIds.set(doc.slug, doc.id);
    }
  }
}

async function seedProducts() {
  for (const [index, product] of catalogProducts.entries()) {
    const category = categoryIds.get(product.categoryId);
    if (!category) {
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
      category,
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

    const subcategory = product.subcategoryId ? subcategoryIds.get(product.subcategoryId) : undefined;
    if (subcategory) data.subcategory = subcategory;

    const calculatorProfile = product.calculatorProfileId ? calculatorProfileIds.get(product.calculatorProfileId) : undefined;
    if (calculatorProfile) data.calculatorProfile = calculatorProfile;

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
    const updated = await apiJson(`/api/${collection}/${existing.id}`, "PATCH", data);
    stat.updated++;
    return updated.doc ?? updated;
  }

  const created = await apiJson(`/api/${collection}`, "POST", data);
  stat.created++;
  return created.doc ?? created;
}

async function findBySlug(collection: CollectionSlug, slug: string): Promise<AnyRecord | null> {
  const params = new URLSearchParams({
    "where[slug][equals]": slug,
    limit: "1",
    depth: "0"
  });
  const response = await apiGet(`/api/${collection}?${params.toString()}`);
  return response.docs?.[0] ?? null;
}

async function apiGet(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: authHeaders()
  });
  return readJsonResponse(response, path);
}

async function apiJson(path: string, method: "POST" | "PATCH", data: AnyRecord) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...authHeaders(),
      "content-type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return readJsonResponse(response, path);
}

async function readJsonResponse(response: Response, path: string) {
  const text = await response.text();
  if (!response.ok) {
    fail(`${path} failed: HTTP ${response.status} ${text.slice(0, 240)}`);
  }
  return text ? JSON.parse(text) : {};
}

function authHeaders() {
  return { authorization: `Bearer ${token}` };
}

function normalizeBaseUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

function compact<T extends AnyRecord>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}

function readFirstEnv(names: string[]) {
  for (const name of names) {
    if (process.env[name]) return process.env[name] ?? "";
  }
  return "";
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
