#!/usr/bin/env node
/**
 * Non-destructive remote media seed through Payload REST API.
 *
 * Imports existing local /assets images into Payload Media and links them only
 * where CMS media fields are empty. Existing manager edits are preserved.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { excelHomeCatalog } from "../../data/storageSystems/excelCatalog";
import { catalogProducts, catalogSubcategories } from "../../data/storageSystems/catalogDepth";
import { DEFAULT_HOME_CONTENT } from "../../lib/cms/home-content";

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

type CollectionSlug = "categories" | "subcategories" | "products";
type UsageArea = "home" | "catalog";
type AssetType = "photo" | "banner";
type AnyRecord = Record<string, any>;
type JsonResponse = { status: number; text: string; body: AnyRecord };
type MediaAsset = {
  webPath: string;
  filePath: string;
  filename: string;
  title: string;
  alt: string;
  usageArea: UsageArea;
  assetType: AssetType;
};

const args = process.argv.slice(2);
const baseUrlArg = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
let transport = args.includes("--vercel-curl") ? "vercel-curl" : "fetch";

if (!baseUrlArg) {
  fail("Usage: npm run cms:seed-media -- <url> [--apply] [--vercel-curl]");
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

console.log(`Remote media seed: ${baseUrl}`);
console.log(`Transport: ${transport}`);
console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
console.log("Existing media/relations: preserve");

const assets = collectAssets();
const mediaByPath = new Map<string, string>();
const stats = {
  media: { created: 0, reused: 0, missingFiles: 0 },
  categories: { linked: 0, skipped: 0 },
  subcategories: { linked: 0, skipped: 0 },
  products: { coverLinked: 0, galleryLinked: 0, skipped: 0 },
  home: { linked: 0, skipped: 0 }
};

await ensureMediaAssets();
await linkCollectionImages("categories", excelHomeCatalog.map((item) => ({ slug: item.id, image: item.image })));
await linkCollectionImages("subcategories", catalogSubcategories.map((item) => ({ slug: item.id, image: item.image })));
await linkProductImages();
await linkHomeBanners();

console.log("Summary:");
console.log(`  media: created=${stats.media.created}, reused=${stats.media.reused}, missing_files=${stats.media.missingFiles}`);
console.log(`  categories: linked=${stats.categories.linked}, skipped=${stats.categories.skipped}`);
console.log(`  subcategories: linked=${stats.subcategories.linked}, skipped=${stats.subcategories.skipped}`);
console.log(`  products: cover_linked=${stats.products.coverLinked}, gallery_linked=${stats.products.galleryLinked}, skipped=${stats.products.skipped}`);
console.log(`  home-content: linked=${stats.home.linked}, skipped=${stats.home.skipped}`);

if (!apply) {
  console.log("Dry-run only. Re-run with --apply to upload missing media and link empty fields.");
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

function collectAssets() {
  const byPath = new Map<string, MediaAsset>();

  for (const item of excelHomeCatalog) {
    addAsset(byPath, item.image, item.title, item.title, "catalog", "photo");
  }

  for (const item of catalogSubcategories) {
    addAsset(byPath, item.image, item.title, item.title, "catalog", "photo");
  }

  for (const product of catalogProducts) {
    addAsset(byPath, product.image, product.title, product.title, "catalog", "photo");
    for (const [index, image] of product.gallery.entries()) {
      addAsset(byPath, image, `${product.title}: фото ${index + 1}`, product.title, "catalog", "photo");
    }
  }

  addAsset(
    byPath,
    DEFAULT_HOME_CONTENT.banners.kbparus.imageUrl,
    "Баннер KB Parus",
    DEFAULT_HOME_CONTENT.banners.kbparus.imageAlt,
    "home",
    "banner"
  );
  addAsset(
    byPath,
    DEFAULT_HOME_CONTENT.banners.coating.imageUrl,
    "Баннер ЛинииОкраски",
    DEFAULT_HOME_CONTENT.banners.coating.imageAlt,
    "home",
    "banner"
  );

  return [...byPath.values()];
}

function addAsset(
  byPath: Map<string, MediaAsset>,
  webPath: string | undefined,
  title: string,
  alt: string,
  usageArea: UsageArea,
  assetType: AssetType
) {
  if (!webPath || !webPath.startsWith("/assets/")) return;
  const filePath = join(process.cwd(), "public", webPath.replace(/^\//, ""));
  if (!existsSync(filePath)) {
    stats.media.missingFiles++;
    console.warn(`[WARN] missing local asset: ${webPath}`);
    return;
  }
  if (byPath.has(webPath)) return;
  byPath.set(webPath, {
    webPath,
    filePath,
    filename: basename(webPath),
    title,
    alt,
    usageArea,
    assetType
  });
}

async function ensureMediaAssets() {
  for (const asset of assets) {
    const existing = await findMedia(asset);
    if (existing?.id) {
      mediaByPath.set(asset.webPath, existing.id);
      stats.media.reused++;
      continue;
    }

    if (!apply) {
      mediaByPath.set(asset.webPath, `dry-run:media:${asset.webPath}`);
      stats.media.created++;
      continue;
    }

    const created = await uploadMedia(asset);
    const doc = created.doc ?? created;
    if (!doc?.id) {
      fail(`Media upload did not return id for ${asset.webPath}`);
    }
    mediaByPath.set(asset.webPath, doc.id);
    stats.media.created++;
  }
}

async function findMedia(asset: MediaAsset): Promise<AnyRecord | null> {
  const title = legacyTitle(asset.webPath);
  const byTitle = await apiGet(`/api/media?${new URLSearchParams({ "where[internalTitle][equals]": title, limit: "1", depth: "0" })}`);
  if (byTitle.docs?.[0]) return byTitle.docs[0];

  const byFilename = await apiGet(`/api/media?${new URLSearchParams({ "where[filename][equals]": asset.filename, limit: "10", depth: "0" })}`);
  const exact = byFilename.docs?.find((doc: AnyRecord) => doc.internalTitle === title);
  return exact ?? byFilename.docs?.[0] ?? null;
}

async function uploadMedia(asset: MediaAsset) {
  const data = {
    internalTitle: legacyTitle(asset.webPath),
    alt: asset.alt,
    caption: asset.title,
    assetType: asset.assetType,
    usageArea: asset.usageArea,
    managerNote: `Импортировано из текущего frontend asset: ${asset.webPath}`
  };

  if (transport === "vercel-curl") {
    return requestViaVercelCurlMultipart("/api/media", asset, data).body;
  }

  const form = new FormData();
  const bytes = readFileSync(asset.filePath);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  form.set("file", new Blob([arrayBuffer], { type: mimeType(asset.filePath) }), asset.filename);
  form.set("_payload", JSON.stringify(data));

  const response = await fetch(`${baseUrl}/api/media`, {
    method: "POST",
    headers: { authorization: `Bearer ${authToken}` },
    body: form,
    redirect: "follow"
  });
  const text = await response.text();
  if (response.status >= 400) {
    fail(`/api/media failed: HTTP ${response.status} ${safeSnippet(text)}`);
  }
  return parseJson(text);
}

async function linkCollectionImages(collection: CollectionSlug, rows: Array<{ slug: string; image: string }>) {
  for (const row of rows) {
    const mediaId = mediaByPath.get(row.image);
    const existing = await findBySlug(collection, row.slug);
    if (!existing?.id || hasValue(existing.image) || !mediaId) {
      collection === "categories" ? stats.categories.skipped++ : stats.subcategories.skipped++;
      continue;
    }

    if (apply) await apiJson(`/api/${collection}/${existing.id}`, "PATCH", { image: mediaId });
    collection === "categories" ? stats.categories.linked++ : stats.subcategories.linked++;
  }
}

async function linkProductImages() {
  for (const product of catalogProducts) {
    const existing = await findBySlug("products", product.id);
    if (!existing?.id) {
      stats.products.skipped++;
      continue;
    }

    const patch: AnyRecord = {};
    const coverId = mediaByPath.get(product.image);
    if (!hasValue(existing.image) && coverId) patch.image = coverId;

    const galleryIds = product.gallery.map((image) => mediaByPath.get(image)).filter((id): id is string => Boolean(id));
    if (isEmptyArray(existing.gallery) && galleryIds.length > 0) {
      patch.gallery = galleryIds.map((image) => ({ image }));
    }

    if (Object.keys(patch).length === 0) {
      stats.products.skipped++;
      continue;
    }

    if (apply) await apiJson(`/api/products/${existing.id}`, "PATCH", patch);
    if (patch.image) stats.products.coverLinked++;
    if (patch.gallery) stats.products.galleryLinked++;
  }
}

async function linkHomeBanners() {
  const existing = await apiGet("/api/globals/home-content?depth=0");
  const kbparusId = mediaByPath.get(DEFAULT_HOME_CONTENT.banners.kbparus.imageUrl);
  const coatingId = mediaByPath.get(DEFAULT_HOME_CONTENT.banners.coating.imageUrl);
  const patch: AnyRecord = {};

  if (!hasValue(existing?.kbparusBanner?.image) && kbparusId) {
    patch.kbparusBanner = { ...(existing.kbparusBanner ?? {}), image: kbparusId };
  }
  if (!hasValue(existing?.coatingBanner?.image) && coatingId) {
    patch.coatingBanner = { ...(existing.coatingBanner ?? {}), image: coatingId };
  }

  const count = Object.keys(patch).length;
  if (count === 0) {
    stats.home.skipped++;
    return;
  }

  if (apply) await apiJson("/api/globals/home-content", "POST", buildGlobalWriteData(existing, patch));
  stats.home.linked += count;
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

function buildGlobalWriteData(existing: AnyRecord, patch: AnyRecord) {
  const { id, globalType, createdAt, updatedAt, sizes, ...content } = existing;
  void id;
  void globalType;
  void createdAt;
  void updatedAt;
  void sizes;
  return { ...content, ...patch };
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isEmptyArray(value: unknown) {
  return !Array.isArray(value) || value.length === 0;
}

function legacyTitle(webPath: string) {
  return `Legacy asset: ${webPath}`;
}

function mimeType(path: string) {
  const ext = extname(path).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function normalizeBaseUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
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
  const tempDir = mkdtempSync(join(tmpdir(), "cms-media-seed-"));
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
      `write-out = "\\n__CMS_MEDIA_SEED_HTTP_STATUS__:%{http_code}\\n"`
    ].filter(Boolean);

    writeFileSync(configPath, configLines.join("\n"), "utf8");
    return runVercelCurl(path, configPath);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function requestViaVercelCurlMultipart(path: string, asset: MediaAsset, data: AnyRecord): JsonResponse {
  const tempDir = mkdtempSync(join(tmpdir(), "cms-media-upload-"));
  const configPath = join(tempDir, "curl.conf");

  try {
    const payload = JSON.stringify(data);
    const configLines = [
      "silent",
      "show-error",
      "location",
      `request = "POST"`,
      `header = "authorization: Bearer ${authToken}"`,
      `form = "file=@${toCurlPath(asset.filePath)};type=${mimeType(asset.filePath)}"`,
      `form-string = "_payload=${escapeCurlConfigValue(payload)}"`,
      `write-out = "\\n__CMS_MEDIA_SEED_HTTP_STATUS__:%{http_code}\\n"`
    ];

    writeFileSync(configPath, configLines.join("\n"), "utf8");
    return runVercelCurl(path, configPath);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function runVercelCurl(path: string, configPath: string): JsonResponse {
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

  const marker = "__CMS_MEDIA_SEED_HTTP_STATUS__:";
  const markerIndex = output.lastIndexOf(marker);
  const text = markerIndex === -1 ? output : output.slice(0, markerIndex);
  const jsonText = extractJsonText(text);
  const body = parseJson(jsonText || text);
  const inferredOk = Boolean(body.token || Array.isArray(body.docs) || body.id || body.doc || body.globalType);
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
  const start = objectIndex === -1 ? arrayIndex : arrayIndex === -1 ? objectIndex : Math.min(objectIndex, arrayIndex);
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

    if (depth === 0) return text.slice(start, index + 1).trim();
  }

  return text.slice(start).trim();
}

function toCurlPath(path: string) {
  return path.replace(/\\/g, "/");
}

function escapeCurlConfigValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function safeSnippet(text: string) {
  return text.replace(email, "[email]").slice(0, 240);
}
