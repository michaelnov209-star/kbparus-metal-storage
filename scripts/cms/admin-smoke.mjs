#!/usr/bin/env node
/**
 * Authenticated, non-destructive Payload admin smoke test.
 *
 * Usage:
 *   CMS_ADMIN_EMAIL=... CMS_ADMIN_PASSWORD=... npm run cms:admin-smoke -- https://preview-url.vercel.app
 *
 * Accepted credential aliases:
 *   CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 *   PAYLOAD_ADMIN_EMAIL / PAYLOAD_ADMIN_PASSWORD
 *
 * Optional Vercel Deployment Protection bypass:
 *   VERCEL_AUTOMATION_BYPASS_SECRET=...
 *
 * The script intentionally does not create users, upload media, mutate globals,
 * reset data, or print credentials.
 */

const ADMIN_COLLECTIONS = [
  { name: "users", label: "Администраторы и редакторы", path: "/api/users?limit=1" },
  { name: "media", label: "Медиа-библиотека", path: "/api/media?limit=1" },
  { name: "products", label: "Каталог: товары", path: "/api/products?limit=1" }
];

const ADMIN_GLOBALS = [
  { name: "home-content", label: "Главная страница", path: "/api/globals/home-content" },
  { name: "contacts", label: "Контакты", path: "/api/globals/contacts" },
  { name: "lead-management", label: "Заявки и интеграции", path: "/api/globals/lead-management" }
];

const SEVERE_MS = 15_000;

const args = process.argv.slice(2);
const baseUrlArg = args.find((arg) => !arg.startsWith("--"));

if (!baseUrlArg) {
  console.error("Usage: npm run cms:admin-smoke -- <deployment-url>");
  process.exit(1);
}

const baseUrl = normalizeBaseUrl(baseUrlArg);
const email = readFirstEnv(["CMS_ADMIN_EMAIL", "E2E_ADMIN_EMAIL", "TEST_ADMIN_EMAIL", "PAYLOAD_ADMIN_EMAIL"]);
const password = readFirstEnv([
  "CMS_ADMIN_PASSWORD",
  "E2E_ADMIN_PASSWORD",
  "TEST_ADMIN_PASSWORD",
  "PAYLOAD_ADMIN_PASSWORD"
]);
const vercelBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";
const checks = [];
let authHeaders = {};

function normalizeBaseUrl(value) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

function readFirstEnv(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return "";
}

function record(name, ok, detail = "", required = true) {
  checks.push({ name, ok, detail, required });
  const icon = ok ? "OK" : required ? "FAIL" : "WARN";
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`[${icon}] ${name}${suffix}`);
}

function redact(text) {
  return text
    .replaceAll(email, "[redacted-email]")
    .replaceAll(password, "[redacted-password]")
    .replaceAll(vercelBypass, "[redacted-vercel-bypass]");
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const cookie = headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

function cookieHeaderFromSetCookie(setCookies) {
  return setCookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function fetchWithTiming(path, init = {}) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "follow",
    ...init,
    headers: {
      "user-agent": "kbparus-admin-smoke/1.0",
      ...(vercelBypass ? { "x-vercel-protection-bypass": vercelBypass } : {}),
      ...(authHeaders || {}),
      ...(init.headers || {})
    }
  });
  const ms = Math.round(performance.now() - started);
  const text = await response.text();
  return { response, text, ms };
}

async function login() {
  if (!email || !password) {
    record(
      "admin credentials are provided",
      false,
      "set CMS_ADMIN_EMAIL/CMS_ADMIN_PASSWORD or supported aliases"
    );
    return false;
  }

  record("admin credentials are provided", true);

  const { response, text, ms } = await fetchWithTiming("/api/users/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }

  const cookies = cookieHeaderFromSetCookie(getSetCookies(response.headers));
  const token = typeof payload.token === "string" ? payload.token : "";
  authHeaders = {
    ...(cookies ? { cookie: cookies } : {}),
    ...(token ? { authorization: `JWT ${token}` } : {})
  };

  record(
    "admin login endpoint accepts credentials",
    response.status === 200 && (Boolean(cookies) || Boolean(token)),
    `HTTP ${response.status}, ${ms}ms`
  );

  return response.status === 200 && (Boolean(cookies) || Boolean(token));
}

async function checkMe() {
  const { response, text, ms } = await fetchWithTiming("/api/users/me");
  const body = text.toLowerCase();
  const ok = response.status === 200 && !body.includes("not authenticated") && !body.includes("unauthorized");
  record("existing admin auth is valid", ok, `HTTP ${response.status}, ${ms}ms`);
  record("admin auth response is not catastrophically slow", ms < SEVERE_MS, `${ms}ms`, false);
}

async function checkAdminShell() {
  const { response, text, ms } = await fetchWithTiming("/admin");
  const lower = text.toLowerCase();
  const hasHtml = response.status === 200 && text.includes("<!DOCTYPE html>");
  const hasLightTheme = text.includes('data-theme="light"');
  const hasRussian = text.includes("Администраторы") || text.includes("Медиа") || text.includes("Выйти");
  const hasDashboard = text.includes("КБ Парус CMS") || text.includes("Центр управления сайтом");
  const hasRuntimeError =
    lower.includes("application error") ||
    lower.includes("runtime error") ||
    lower.includes("minified react error");

  record("/admin authenticated shell returns HTML", hasHtml, `HTTP ${response.status}, ${ms}ms`);
  record("admin light theme is active", hasLightTheme);
  record("admin Russian labels are present", hasRussian, hasRussian ? "" : "not visible in initial HTML", false);
  record("dashboard markers are present in initial HTML", hasDashboard, hasDashboard ? "" : "may require browser render", false);
  record("admin shell has no visible runtime error", !hasRuntimeError);
  record("admin shell is not catastrophically slow", ms < SEVERE_MS, `${ms}ms`, false);
}

async function checkAdminDataRoutes() {
  for (const item of [...ADMIN_COLLECTIONS, ...ADMIN_GLOBALS]) {
    const { response, text, ms } = await fetchWithTiming(item.path);
    const lower = text.toLowerCase();
    const ok =
      response.status === 200 &&
      !lower.includes("not authenticated") &&
      !lower.includes("unauthorized") &&
      !lower.includes("forbidden");

    record(`${item.label} route loads`, ok, `HTTP ${response.status}, ${ms}ms`);
    record(`${item.label} route speed`, ms < SEVERE_MS, `${ms}ms`, false);
  }
}

async function main() {
  console.log(`\nAuthenticated admin smoke: ${baseUrl}\n`);

  try {
    const loggedIn = await login();
    if (loggedIn) {
      await checkMe();
      await checkAdminShell();
      await checkAdminDataRoutes();
    }
  } catch (error) {
    record("admin smoke completed without runtime exception", false, redact(error.message));
  }

  const failed = checks.filter((check) => check.required && !check.ok);
  const warnings = checks.filter((check) => !check.required && !check.ok);

  console.log("\nSummary:");
  console.log(`  required failed: ${failed.length}`);
  console.log(`  warnings: ${warnings.length}`);
  console.log("  writes performed: 0");

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
