#!/usr/bin/env node
/**
 * Non-destructive remote navigation/footer seed through Payload REST API.
 *
 * It fills only empty site-navigation fields. Existing manager edits are
 * preserved; no records are deleted and no secrets are printed.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_SITE_NAVIGATION } from "../../lib/cms/site-navigation";

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

type AnyRecord = Record<string, any>;
type JsonResponse = { status: number; text: string; body: AnyRecord };

const args = process.argv.slice(2);
const baseUrlArg = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
let transport = args.includes("--vercel-curl") ? "vercel-curl" : "fetch";

if (!baseUrlArg) {
  fail("Usage: npm run cms:seed-site-navigation -- <url> [--apply] [--vercel-curl]");
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

console.log(`Remote navigation seed: ${baseUrl}`);
console.log(`Transport: ${transport}`);
console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
console.log("Existing navigation/footer fields: preserve non-empty");

const existing = await apiGet("/api/globals/site-navigation?depth=0");
const seed = buildNavigationSeed();
const patch = buildPatch(existing, seed);
const keys = Object.keys(patch);

if (keys.length === 0) {
  console.log("Summary:");
  console.log("  site-navigation: updated=0, skipped=all");
  process.exit(0);
}

console.log(`Planned fields: ${keys.join(", ")}`);

if (!apply) {
  console.log("Summary:");
  console.log(`  site-navigation: would_update=${keys.length}, skipped_existing=${Object.keys(seed).length - keys.length}`);
  console.log("Dry-run only. Re-run with --apply to fill empty navigation/footer fields.");
  process.exit(0);
}

await apiJson("/api/globals/site-navigation", "POST", buildWriteData(existing, patch));

console.log("Summary:");
console.log(`  site-navigation: updated=${keys.length}, skipped_existing=${Object.keys(seed).length - keys.length}`);

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

function buildNavigationSeed(): AnyRecord {
  const navigation = DEFAULT_SITE_NAVIGATION;
  return {
    catalog: navigation.header.catalog,
    headerLinks: navigation.header.links.map(toPayloadLink),
    detailPageLinks: navigation.header.detailLinks.map(toPayloadLink),
    headerContacts: navigation.header.contacts,
    footerDescription: navigation.footer.description,
    footerLinks: navigation.footer.links.map(toPayloadLink),
    legalLinks: navigation.footer.legalLinks.map(toPayloadLink),
    footerCta: { enabled: false, label: "", href: "" }
  };
}

function toPayloadLink(link: { label: string; href: string; openInNewTab?: boolean }) {
  return {
    label: link.label,
    href: link.href,
    enabled: true,
    openInNewTab: Boolean(link.openInNewTab)
  };
}

function buildPatch(existing: AnyRecord, seed: AnyRecord) {
  const patch: AnyRecord = {};
  if (isEmptySection(existing?.catalog)) patch.catalog = seed.catalog;
  if (isEmptySection(existing?.headerLinks)) patch.headerLinks = seed.headerLinks;
  if (isEmptySection(existing?.detailPageLinks)) patch.detailPageLinks = seed.detailPageLinks;
  if (isEmptySection(existing?.headerContacts)) patch.headerContacts = seed.headerContacts;
  if (isEmptySection(existing?.footerDescription)) patch.footerDescription = seed.footerDescription;
  if (isEmptySection(existing?.footerLinks)) patch.footerLinks = seed.footerLinks;
  if (isEmptySection(existing?.legalLinks) && seed.legalLinks.length > 0) patch.legalLinks = seed.legalLinks;
  if (isEmptySection(existing?.footerCta)) patch.footerCta = seed.footerCta;
  return patch;
}

function buildWriteData(existing: AnyRecord, patch: AnyRecord) {
  const { id, globalType, createdAt, updatedAt, sizes, ...content } = existing;
  void id;
  void globalType;
  void createdAt;
  void updatedAt;
  void sizes;
  return { ...content, ...patch };
}

function isEmptySection(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.values(value as AnyRecord).every((child) => isEmptySection(child));
  }
  return false;
}

async function apiGet(path: string) {
  const response = await requestJson(path, { method: "GET", auth: true });
  return response.body;
}

async function apiJson(path: string, method: "POST", data: AnyRecord) {
  const response = await requestJson(path, { method, data, auth: true });
  return response.body;
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
  const tempDir = mkdtempSync(join(tmpdir(), "cms-nav-seed-"));
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
      `write-out = "\\n__CMS_NAV_SEED_HTTP_STATUS__:%{http_code}\\n"`
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

    const marker = "__CMS_NAV_SEED_HTTP_STATUS__:";
    const markerIndex = output.lastIndexOf(marker);
    const text = markerIndex === -1 ? output : output.slice(0, markerIndex);
    const jsonText = extractJsonText(text);
    const body = parseJson(jsonText || text);
    const inferredOk = Boolean(body.token || body.id || body.globalType || body.headerLinks || body.footerLinks);
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

function safeSnippet(text: string) {
  return text.replace(email, "[email]").slice(0, 240);
}
