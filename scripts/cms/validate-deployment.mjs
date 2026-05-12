#!/usr/bin/env node
/**
 * Non-destructive runtime validation for a Vercel deployment.
 *
 * Usage:
 *   npm run cms:validate-deployment -- https://preview-url.vercel.app
 *   npm run cms:validate-deployment -- https://kbparus-metal-storage.vercel.app --production
 *
 * This script does not create users, upload files, mutate globals, or touch DB
 * schema. It validates only public/runtime signals that are safe to check after
 * preview or production deploy.
 */

const REQUIRED_COLLECTIONS = [
  "calculator-profiles",
  "categories",
  "media",
  "products",
  "subcategories",
  "users"
];

const REQUIRED_GLOBALS = ["contacts", "home-content", "lead-management"];
const PRODUCTION_URL = "https://kbparus-metal-storage.vercel.app";

const args = process.argv.slice(2);
const baseUrlArg = args.find((arg) => !arg.startsWith("--"));
const productionMode = args.includes("--production");

if (!baseUrlArg) {
  console.error("Usage: npm run cms:validate-deployment -- <deployment-url> [--production]");
  process.exit(1);
}

const baseUrl = normalizeBaseUrl(baseUrlArg);
const checks = [];
let protectedResponses = 0;

function normalizeBaseUrl(value) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

function record(name, ok, detail = "", required = true) {
  checks.push({ name, ok, detail, required });
  const icon = ok ? "OK" : required ? "FAIL" : "WARN";
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`[${icon}] ${name}${suffix}`);
}

async function fetchText(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "follow",
    ...init,
    headers: {
      "user-agent": "kbparus-cms-validator/1.0",
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  if (response.status === 401 && text.toLowerCase().includes("authentication")) {
    protectedResponses++;
  }
  return { response, text };
}

function missing(expected, actual) {
  return expected.filter((item) => !actual.includes(item));
}

async function checkHealth() {
  const { response, text } = await fetchText("/api/health");

  if (response.status !== 200) {
    record("/api/health returns 200", false, `HTTP ${response.status}`);
    return null;
  }

  let health;
  try {
    health = JSON.parse(text);
  } catch (error) {
    record("/api/health returns JSON", false, error.message);
    return null;
  }

  record("/api/health returns JSON", true);
  record("health.status is ok", health.status === "ok", `status=${health.status}`);

  const cms = health.components?.cms;
  record("cms.ok is true", cms?.ok === true, cms?.ok === true ? "" : cms?.error || "cms not ok");

  const collectionNames = Array.isArray(cms?.collectionNames) ? cms.collectionNames : [];
  const missingCollections = missing(REQUIRED_COLLECTIONS, collectionNames);
  record(
    "required collections are present",
    missingCollections.length === 0,
    missingCollections.length ? `missing: ${missingCollections.join(", ")}` : collectionNames.join(", ")
  );

  const globalNames = Array.isArray(cms?.globalNames) ? cms.globalNames : [];
  const missingGlobals = missing(REQUIRED_GLOBALS, globalNames);
  record(
    "required globals are present",
    missingGlobals.length === 0,
    missingGlobals.length ? `missing: ${missingGlobals.join(", ")}` : globalNames.join(", ")
  );

  const storage = health.components?.storage;
  record(
    "Blob storage token is configured",
    storage?.configured === true && storage?.ok === true,
    storage ? `configured=${storage.configured}, ok=${storage.ok}` : "storage missing"
  );

  const integrations = health.components?.leadIntegrations || {};
  record(
    "Telegram env signal",
    integrations.telegram?.configured === true,
    `configured=${Boolean(integrations.telegram?.configured)}`,
    false
  );
  record(
    "Bitrix24 env signal",
    integrations.bitrix24?.configured === true,
    `configured=${Boolean(integrations.bitrix24?.configured)}`,
    false
  );

  return health;
}

async function checkAdminRender() {
  const { response, text } = await fetchText("/admin/create-first-user");
  const body = text.toLowerCase();
  const looksLikePayloadAdmin =
    body.includes("payload") ||
    body.includes("create first user") ||
    body.includes("email");

  record(
    "/admin/create-first-user renders",
    response.status >= 200 && response.status < 400 && looksLikePayloadAdmin,
    `HTTP ${response.status}, body=${text.length} chars`
  );
}

async function checkAuthBoundary() {
  const { response } = await fetchText("/api/users?limit=1");
  const protectedStatus = [401, 403, 404].includes(response.status);
  record(
    "users API is not publicly readable",
    protectedStatus,
    `HTTP ${response.status}`
  );
}

async function checkPublicSite() {
  const home = await fetchText("/");
  record("public homepage returns 200", home.response.status === 200, `HTTP ${home.response.status}`);

  const catalog = await fetchText("/catalog/auto-sheet-metal");
  record(
    "catalog page returns 200",
    catalog.response.status === 200,
    `HTTP ${catalog.response.status}`
  );
}

async function main() {
  console.log(`\nValidating deployment: ${baseUrl}\n`);

  if (productionMode) {
    record(
      "production URL is explicit",
      baseUrl === PRODUCTION_URL,
      `expected ${PRODUCTION_URL}, got ${baseUrl}`
    );
  }

  try {
    await checkHealth();
    await checkAdminRender();
    await checkAuthBoundary();
    await checkPublicSite();
  } catch (error) {
    record("validator completed without network/runtime exception", false, error.message);
  }

  const failed = checks.filter((check) => check.required && !check.ok);
  const warnings = checks.filter((check) => !check.required && !check.ok);

  console.log("\nSummary:");
  console.log(`  required failed: ${failed.length}`);
  console.log(`  warnings: ${warnings.length}`);
  if (protectedResponses > 0) {
    console.log(
      "  note: deployment returned 401 authentication responses; preview may be protected by Vercel Deployment Protection"
    );
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
