#!/usr/bin/env node
/**
 * Non-destructive runtime validation for a Vercel deployment.
 *
 * Usage:
 *   npm run smoke:deployment -- https://preview-url.vercel.app
 *   npm run smoke:production
 *
 * Only GET/HEAD requests are used. The validator never submits leads, changes
 * CMS records, uploads media, or mutates database schema.
 */

const PRODUCTION_URL = "https://kbparus-metal-storage.vercel.app";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_PAGE_ATTEMPTS = 3;
const SITEMAP_CONCURRENCY = 6;
const IMMUTABLE_MAX_AGE = 31_536_000;
const protectionBypassSecret =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || "";

const args = process.argv.slice(2);
const productionMode = args.includes("--production");
const baseUrlArg = args.find((arg) => !arg.startsWith("--"));

if (!baseUrlArg) {
  console.error(
    "Usage: npm run smoke:deployment -- <deployment-url> [--production]"
  );
  process.exit(1);
}

const baseUrl = normalizeBaseUrl(baseUrlArg);
const baseOrigin = new URL(baseUrl).origin;
const baseHostname = new URL(baseUrl).hostname.toLowerCase();
const checks = [];
let protectedResponses = 0;

const trustedBypassHost =
  baseHostname === "kbparus-metal-storage.vercel.app" ||
  (
    baseHostname.startsWith("kbparus-metal-storage-") &&
    baseHostname.endsWith(".vercel.app")
  );

if (protectionBypassSecret && !trustedBypassHost) {
  console.error(
    "Refusing to send the Vercel protection bypass secret to an untrusted deployment host."
  );
  process.exit(1);
}

function normalizeBaseUrl(value) {
  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

function record(name, ok, detail = "", required = true) {
  checks.push({ name, ok, detail, required });
  const icon = ok ? "OK" : required ? "FAIL" : "WARN";
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`[${icon}] ${name}${suffix}`);
}

function toTargetUrl(pathOrUrl) {
  const url = new URL(pathOrUrl, `${baseUrl}/`);
  if (url.origin === baseOrigin) return url;

  // Sitemap entries may use the canonical production origin while a Preview
  // deployment is being validated. Keep the path/query but target the exact
  // deployment supplied on the command line.
  return new URL(`${url.pathname}${url.search}`, `${baseUrl}/`);
}

async function request(pathOrUrl, init = {}, attempts = 1) {
  const url = toTargetUrl(pathOrUrl);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ...init,
        headers: {
          "user-agent": "kbparus-deployment-smoke/2.0",
          ...(protectionBypassSecret
            ? {
                "x-vercel-protection-bypass": protectionBypassSecret,
                "x-vercel-set-bypass-cookie": "true"
              }
            : {}),
          ...(init.headers || {})
        }
      });

      if (
        response.status === 401 &&
        (response.headers.get("content-type") || "").includes("text/html")
      ) {
        protectedResponses += 1;
      }

      if (response.status >= 500 && attempt < attempts) {
        await response.body?.cancel();
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
  }

  throw lastError || new Error(`Request failed: ${url}`);
}

async function fetchText(pathOrUrl, options = {}) {
  const response = await request(
    pathOrUrl,
    { method: "GET" },
    options.attempts || 1
  );
  return { response, text: await response.text() };
}

function extractAttribute(tag, attribute) {
  const patterns = {
    media: /\bmedia\s*=\s*(?:"([^"]+)"|'([^']+)')/i,
    poster: /\bposter\s*=\s*(?:"([^"]+)"|'([^']+)')/i,
    src: /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i
  };
  const pattern = patterns[attribute];
  if (!pattern) return "";
  const match = tag.match(pattern);
  return match?.[1] || match?.[2] || "";
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    match[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
  );
}

function extractHeroAssets(html) {
  const videoMatch = html.match(/<video\b[^>]*>[\s\S]*?<\/video>/i);
  if (!videoMatch) {
    return { videoFound: false, mobile: "", desktop: "", poster: "" };
  }

  const video = videoMatch[0];
  const openingTag = video.match(/<video\b[^>]*>/i)?.[0] || "";
  const sources = [...video.matchAll(/<source\b[^>]*>/gi)].map(
    (match) => match[0]
  );
  const mobileTag = sources.find((tag) =>
    extractAttribute(tag, "media").includes("max-width: 1180px")
  );
  const desktopTag = sources.find((tag) => !extractAttribute(tag, "media"));

  return {
    videoFound: true,
    mobile: mobileTag ? extractAttribute(mobileTag, "src") : "",
    desktop: desktopTag ? extractAttribute(desktopTag, "src") : "",
    poster: extractAttribute(openingTag, "poster")
  };
}

function extractOptimizedAsset(html, segment) {
  const start = html.indexOf(segment);
  if (start === -1) return "";
  const candidate = html.slice(start);
  const end = candidate.search(/["'\s,<>]/);
  const value = candidate
    .slice(0, end === -1 ? undefined : end)
    .replaceAll("&amp;", "&")
    .replaceAll("\\u0026", "&");
  return value.startsWith("/") ? value : `/${value}`;
}

function extractCmsMediaAsset(html) {
  const match = html.match(
    /(?:src|href)\s*=\s*(?:"([^"]*\/api\/media\/file\/[^"]+)"|'([^']*\/api\/media\/file\/[^']+)')/i
  );
  return (match?.[1] || match?.[2] || "")
    .replaceAll("&amp;", "&")
    .replaceAll("\\u0026", "&");
}

function cacheMaxAge(cacheControl) {
  const match = cacheControl.match(/(?:s-maxage|max-age)=(\d+)/i);
  return match ? Number(match[1]) : 0;
}

async function checkAsset(label, path, expectedType) {
  if (!path) {
    record(`${label} is referenced`, false, "asset URL not found");
    return;
  }

  // Payload's protected media route intentionally handles GET/range requests;
  // Next.js does not synthesize HEAD for this catch-all route. One byte proves
  // the backing Blob exists without downloading a full image or video.
  const response = await request(path, {
    method: "GET",
    headers: { range: "bytes=0-0" }
  });
  const contentType = response.headers.get("content-type") || "";
  const cacheControl = response.headers.get("cache-control") || "";
  const cacheIsImmutable =
    cacheControl.toLowerCase().includes("immutable") &&
    cacheMaxAge(cacheControl) >= IMMUTABLE_MAX_AGE;

  record(
    `${label} is readable`,
    response.status === 200 || response.status === 206,
    `HTTP ${response.status}`
  );
  record(
    `${label} has ${expectedType}`,
    contentType.toLowerCase().includes(expectedType),
    contentType || "missing content-type"
  );
  record(
    `${label} has immutable one-year cache`,
    cacheIsImmutable,
    cacheControl || "missing cache-control"
  );
}

async function checkHealth() {
  const { response, text } = await fetchText("/api/health", {
    attempts: MAX_PAGE_ATTEMPTS
  });

  if (response.status !== 200) {
    record("/api/health returns 200", false, `HTTP ${response.status}`);
    return;
  }

  let health;
  try {
    health = JSON.parse(text);
  } catch (error) {
    record("/api/health returns JSON", false, error.message);
    return;
  }

  record("/api/health returns JSON", true);
  record("health.status is ok", health.status === "ok", `status=${health.status}`);

  const cms = health.components?.cms;
  record(
    "CMS is configured and readable",
    cms?.configured === true &&
      cms?.ok === true &&
      cms?.requiredContentReadable === true,
    `configured=${Boolean(cms?.configured)}, ok=${Boolean(cms?.ok)}, content=${Boolean(cms?.requiredContentReadable)}`
  );

  const storage = health.components?.storage;
  record(
    "Blob storage is ready",
    storage?.configured === true && storage?.ok === true,
    storage
      ? `configured=${storage.configured}, ok=${storage.ok}`
      : "storage missing"
  );

  const integrations = health.components?.leadIntegrations || {};
  record(
    "Telegram env signal",
    integrations.telegram?.configured === true,
    `configured=${Boolean(integrations.telegram?.configured)}`,
    false
  );
  record(
    "Email env signal",
    integrations.email?.configured === true,
    `configured=${Boolean(integrations.email?.configured)}`,
    false
  );
  record(
    "Bitrix24 env signal",
    integrations.bitrix24?.configured === true,
    `configured=${Boolean(integrations.bitrix24?.configured)}`,
    false
  );
}

async function checkAdminRender() {
  const { response, text } = await fetchText("/admin/create-first-user", {
    attempts: MAX_PAGE_ATTEMPTS
  });
  const body = text.toLowerCase();
  const looksLikePayloadAdmin =
    body.includes("payload") ||
    body.includes("create first user") ||
    body.includes("email");

  record(
    "/admin/create-first-user renders",
    response.status === 200 && looksLikePayloadAdmin,
    `HTTP ${response.status}, body=${text.length} chars`
  );
}

async function checkAuthBoundary() {
  const [users, leadManagement] = await Promise.all([
    request("/api/users?limit=1", { method: "GET" }),
    request("/api/globals/lead-management", { method: "GET" })
  ]);
  record(
    "users API is not publicly readable",
    [401, 403, 404].includes(users.status),
    `HTTP ${users.status}`
  );
  record(
    "lead-management API is not publicly readable",
    [401, 403, 404].includes(leadManagement.status),
    `HTTP ${leadManagement.status}`
  );
  await Promise.all([users.body?.cancel(), leadManagement.body?.cancel()]);
}

async function mapWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;
  const results = new Array(items.length);

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, run)
  );
  return results;
}

async function checkSitemap() {
  const { response, text } = await fetchText("/sitemap.xml", {
    attempts: MAX_PAGE_ATTEMPTS
  });
  const contentType = response.headers.get("content-type") || "";
  record("/sitemap.xml returns 200", response.status === 200, `HTTP ${response.status}`);
  record(
    "/sitemap.xml returns XML",
    contentType.includes("xml") && /<urlset\b/i.test(text),
    contentType || "missing content-type"
  );

  const urls = extractSitemapUrls(text);
  record("sitemap contains public URLs", urls.length > 0, `${urls.length} URLs`);

  const invalidOrigins = urls.filter(
    (value) => new URL(value, `${baseUrl}/`).origin !== new URL(PRODUCTION_URL).origin
  );
  record(
    "sitemap URLs use the canonical production origin",
    invalidOrigins.length === 0,
    invalidOrigins.length ? `${invalidOrigins.length} invalid origins` : ""
  );

  const statuses = await mapWithConcurrency(
    urls,
    SITEMAP_CONCURRENCY,
    async (value) => {
      try {
        const response = await request(value, { method: "HEAD" });
        await response.body?.cancel();
        return { value, status: response.status };
      } catch (error) {
        return {
          value,
          status: 0,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
  );
  const failures = statuses.filter((item) => item.status !== 200);
  record(
    "all sitemap URLs return exactly 200",
    failures.length === 0,
    failures.length
      ? failures
          .slice(0, 3)
          .map((item) => `${new URL(item.value).pathname}: ${item.status || item.error}`)
          .join("; ")
      : `${statuses.length}/${statuses.length}`
  );

  const paths = urls.map((value) => new URL(value).pathname);
  const productPath = paths.find(
    (path) => path.startsWith("/catalog/") && path.split("/").filter(Boolean).length >= 3
  );
  const categoryPath = paths.find(
    (path) =>
      path.startsWith("/catalog/") &&
      path.split("/").filter(Boolean).length === 2
  );

  return { categoryPath, productPath };
}

async function checkPublicMedia(categoryPath, productPath) {
  const home = await fetchText("/", { attempts: MAX_PAGE_ATTEMPTS });
  record("public homepage returns 200", home.response.status === 200, `HTTP ${home.response.status}`);

  const hero = extractHeroAssets(home.text);
  record("homepage contains hero video", hero.videoFound);
  record("hero has mobile source", Boolean(hero.mobile), hero.mobile || "missing");
  record("hero has desktop source", Boolean(hero.desktop), hero.desktop || "missing");
  record("hero has poster", Boolean(hero.poster), hero.poster || "missing");

  await checkAsset("mobile hero video", hero.mobile, "video/");
  await checkAsset("hero poster", hero.poster, "image/");

  if (!categoryPath || !productPath) {
    record(
      "sitemap exposes category and product routes",
      false,
      `category=${categoryPath || "missing"}, product=${productPath || "missing"}`
    );
    return;
  }

  const [category, product] = await Promise.all([
    fetchText(categoryPath, { attempts: MAX_PAGE_ATTEMPTS }),
    fetchText(productPath, { attempts: MAX_PAGE_ATTEMPTS })
  ]);
  record("category page returns 200", category.response.status === 200, categoryPath);
  record("product page returns 200", product.response.status === 200, productPath);

  const categoryAsset =
    extractOptimizedAsset(category.text, "/assets/images/catalog/optimized/") ||
    // Product-first category pages intentionally open with their assortment,
    // so the first meaningful visual can be a product image rather than a
    // separate decorative category hero.
    extractOptimizedAsset(category.text, "/assets/images/products/optimized/") ||
    extractCmsMediaAsset(category.text);
  const productAsset =
    extractOptimizedAsset(product.text, "/assets/images/products/optimized/") ||
    extractCmsMediaAsset(product.text);
  await checkAsset("category page image", categoryAsset, "image/");
  await checkAsset("product image", productAsset, "image/");
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
    const { categoryPath, productPath } = await checkSitemap();
    await checkPublicMedia(categoryPath, productPath);
  } catch (error) {
    record(
      "validator completed without network/runtime exception",
      false,
      error instanceof Error ? error.message : String(error)
    );
  }

  const failed = checks.filter((check) => check.required && !check.ok);
  const warnings = checks.filter((check) => !check.required && !check.ok);

  console.log("\nSummary:");
  console.log(`  required failed: ${failed.length}`);
  console.log(`  warnings: ${warnings.length}`);
  if (protectedResponses > 0) {
    console.log(
      "  note: one or more routes returned deployment protection HTML; use an authorized Preview URL"
    );
  }

  if (failed.length > 0) process.exit(1);
}

main();
