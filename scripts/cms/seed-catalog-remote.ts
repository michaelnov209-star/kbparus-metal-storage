#!/usr/bin/env node
/**
 * Non-destructive remote catalog seed through Payload REST API.
 *
 * Uses admin credentials from shell or local .env.local. It does not read DB
 * secrets, does not print credentials and never deletes records.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
type JsonResponse = { status: number; text: string; body: AnyRecord };

const args = process.argv.slice(2);
const baseUrlArg = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
const updateExisting = args.includes("--update-existing");
let transport = args.includes("--vercel-curl") ? "vercel-curl" : "fetch";

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

let authToken = "";
authToken = await login();
const categoryIds = new Map<string, string>();
const subcategoryIds = new Map<string, string>();
const calculatorProfileIds = new Map<string, string>();
const stats = {
  categories: { created: 0, updated: 0, skipped: 0 },
  subcategories: { created: 0, updated: 0, skipped: 0 },
  products: { created: 0, updated: 0, skipped: 0 }
};

console.log(`Remote catalog seed: ${baseUrl}`);
console.log(`Transport: ${transport}`);
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

async function login(): Promise<string> {
  const response = await requestJson("/api/users/login", {
    method: "POST",
    data: { email, password },
    auth: false,
    allowProtectedRetry: true
  });
  if (typeof response.body.token !== "string" || !response.body.token) {
    fail("Admin login did not return a token.");
  }

  return response.body.token;
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
    return existing ?? { id: `dry-run:${collection}:${slug}`, slug };
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
  const response = await requestJson(path, { method: "GET", auth: true });
  return response.body;
}

async function apiJson(path: string, method: "POST" | "PATCH", data: AnyRecord) {
  const response = await requestJson(path, { method, data, auth: true });
  return response.body;
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

async function requestJson(
  path: string,
  options: {
    method: "GET" | "POST" | "PATCH";
    data?: AnyRecord;
    auth?: boolean;
    allowProtectedRetry?: boolean;
  }
): Promise<JsonResponse> {
  const response = transport === "vercel-curl" ? requestViaVercelCurl(path, options) : await requestViaFetch(path, options);

  if (response.status === 401 && options.allowProtectedRetry && transport === "fetch" && baseUrl.includes(".vercel.app")) {
    transport = "vercel-curl";
    const retried = requestViaVercelCurl(path, options);
    if (retried.status < 400) return retried;
    fail(`${path} failed through vercel curl: HTTP ${retried.status} ${safeSnippet(retried.text)}`);
  }

  if (response.status >= 400) {
    fail(`${path} failed: HTTP ${response.status} ${safeSnippet(response.text)}`);
  }

  return response;
}

async function requestViaFetch(
  path: string,
  options: {
    method: "GET" | "POST" | "PATCH";
    data?: AnyRecord;
    auth?: boolean;
  }
): Promise<JsonResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      ...(options.auth ? { authorization: `Bearer ${authToken}` } : {}),
      ...(options.data ? { "content-type": "application/json" } : {})
    },
    body: options.data ? JSON.stringify(options.data) : undefined,
    redirect: "follow"
  });
  const text = await response.text();
  return { status: response.status, text, body: parseJson(text) };
}

function requestViaVercelCurl(
  path: string,
  options: {
    method: "GET" | "POST" | "PATCH";
    data?: AnyRecord;
    auth?: boolean;
  }
): JsonResponse {
  const tempDir = mkdtempSync(join(tmpdir(), "cms-seed-"));
  const configPath = join(tempDir, "curl.conf");
  const bodyPath = join(tempDir, "body.json");

  try {
    if (options.data) {
      writeFileSync(bodyPath, JSON.stringify(options.data), "utf8");
    }

    const configLines = [
      "silent",
      "show-error",
      "location",
      `request = "${options.method}"`,
      options.auth ? `header = "authorization: Bearer ${authToken}"` : "",
      options.data ? `header = "content-type: application/json"` : "",
      options.data ? `data-binary = "@${toCurlPath(bodyPath)}"` : "",
      `write-out = "\\n__CMS_SEED_HTTP_STATUS__:%{http_code}\\n"`
    ].filter(Boolean);

    writeFileSync(configPath, configLines.join("\n"), "utf8");

    const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawnSync(
      npxBin,
      ["vercel@latest", "curl", path, "--deployment", baseUrl, "--", "--config", configPath],
      { encoding: "utf8", shell: process.platform === "win32" }
    );

    const output = `${child.stdout ?? ""}\n${child.stderr ?? ""}`;
    if (child.error) {
      fail(`vercel curl failed for ${path}: ${child.error.message}`);
    }

    const marker = "__CMS_SEED_HTTP_STATUS__:";
    const markerIndex = output.lastIndexOf(marker);
    const text = markerIndex === -1 ? output : output.slice(0, markerIndex);
    const jsonText = extractJsonText(text);
    const body = parseJson(jsonText || text);
    const inferredOk = Boolean(body.token || Array.isArray(body.docs) || body.id || body.doc);
    const status =
      markerIndex === -1
        ? inferredOk
          ? 200
          : 500
        : Number(output.slice(markerIndex + marker.length).match(/\d+/)?.[0] ?? 0);

    if (child.status !== 0 && !inferredOk) {
      fail(`vercel curl failed for ${path}: ${safeSnippet(output)}`);
    }

    return { status, text: jsonText || text, body };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function parseJson(text: string) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function extractJsonText(text: string) {
  const objectIndex = text.indexOf("{");
  const arrayIndex = text.indexOf("[");
  const start =
    objectIndex === -1 ? arrayIndex : arrayIndex === -1 ? objectIndex : Math.min(objectIndex, arrayIndex);
  if (start === -1) return "";

  const opener = text[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index++) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === opener) depth++;
    if (char === closer) depth--;

    if (depth === 0) {
      return text.slice(start, index + 1).trim();
    }
  }

  return text.slice(start).trim();
}

function toCurlPath(path: string) {
  return path.replace(/\\/g, "/");
}

function safeSnippet(text: string) {
  return text.replace(email, "[email]").slice(0, 240);
}
