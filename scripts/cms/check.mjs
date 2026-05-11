#!/usr/bin/env node
/**
 * Preflight CMS readiness check.
 *
 * Запускается:
 *   - перед `next build` на Vercel
 *   - вручную через `npm run cms:check` локально
 *
 * Валит build с код 1, если что-то сломано до того, как мы потратим время
 * на полную сборку и деплой.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const checks = [];
let failed = 0;
const SKIP_DB = process.env.CMS_CHECK_SKIP_DB === "1";

function check(name, fn, { soft = false } = {}) {
  try {
    const result = fn();
    if (result === false) throw new Error("проверка вернула false");
    console.log(`  ✓ ${name}`);
    checks.push({ name, ok: true });
  } catch (e) {
    if (soft) {
      console.log(`  ⚠ ${name}: ${e.message} (soft warning)`);
      checks.push({ name, ok: true, warn: e.message });
    } else {
      console.log(`  ✗ ${name}: ${e.message}`);
      checks.push({ name, ok: false, error: e.message });
      failed++;
    }
  }
}

function readFilesRecursive(dir, extension = ".ts") {
  if (!existsSync(dir)) return [];

  const result = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      result.push(...readFilesRecursive(fullPath, extension));
    } else if (entry.endsWith(extension)) {
      result.push(readFileSync(fullPath, "utf-8"));
    }
  }

  return result;
}

console.log("\n🔍 CMS preflight checks\n");

// === 0. Runtime ===
console.log("Runtime:");
check("Node major version is 22", () => {
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major !== 22) {
    throw new Error(
      `Node ${process.versions.node} обнаружен. Требуется Node 22.x. ` +
      `Vercel: проверить package.json engines = "22.x" и Project Settings → Node.js Version. ` +
      `Локально: nvm use 22 / volta install node@22.`
    );
  }
  return true;
}, { soft: true });

// === 1. Env vars ===
console.log("\nEnvironment variables:");
check("PAYLOAD_SECRET set (>=32 chars)", () => {
  const s = process.env.PAYLOAD_SECRET;
  if (!s) throw new Error("not set");
  if (s.length < 32) throw new Error(`only ${s.length} chars, need >=32`);
  return true;
});
check(
  "Database URL set (DATABASE_URL/POSTGRES_URL/_UNPOOLED variant)",
  () => Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  )
);
check(
  "Direct (unpooled) DB URL available — required for schema push",
  () => Boolean(process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING),
  { soft: true }
);
check("BLOB_READ_WRITE_TOKEN set", () => Boolean(process.env.BLOB_READ_WRITE_TOKEN));

// === 2. Files ===
console.log("\nFile structure:");
check("payload.config.ts exists", () => existsSync(resolve("payload.config.ts")));
check("admin route exists", () =>
  existsSync(resolve("app/(payload)/admin/[[...segments]]/page.tsx"))
);
check("api route exists", () =>
  existsSync(resolve("app/(payload)/api/[...slug]/route.ts"))
);
check("payload layout exists", () => existsSync(resolve("app/(payload)/layout.tsx")));
check("importMap.ts exists", () =>
  existsSync(resolve("app/(payload)/admin/importMap.ts"))
);

// === 3. importMap content ===
console.log("\nImportMap content (must contain components from active plugins):");
const importMapPath = resolve("app/(payload)/admin/importMap.ts");
if (existsSync(importMapPath)) {
  const content = readFileSync(importMapPath, "utf-8");
  const payloadSource = readFilesRecursive(resolve("payload")).join("\n");
  const usesRichTextFields =
    payloadSource.includes('type: "richText"') || payloadSource.includes("type: 'richText'");

  // Required because we use vercelBlobStorage plugin
  check("importMap registers VercelBlobClientUploadHandler", () =>
    content.includes("VercelBlobClientUploadHandler")
  );

  check("importMap registers Payload admin RSC components", () =>
    content.includes("CollectionCards")
  );

  if (usesRichTextFields) {
    check("importMap registers Lexical RscEntry components", () =>
      content.includes("RscEntryLexical")
    );
  } else {
    check("Lexical importMap entries not required without richText fields", () => true, { soft: true });
  }
}

// === 4. Drizzle/Next compatibility ===
console.log("\nNext.js / Payload integration:");
check("next.config.mjs has serverExternalPackages", () => {
  const c = readFileSync(resolve("next.config.mjs"), "utf-8");
  if (!c.includes("serverExternalPackages")) throw new Error("missing");
  if (!c.includes("@payloadcms/db-postgres")) throw new Error("missing db-postgres");
  if (!c.includes("sharp")) throw new Error("missing sharp");
  return true;
});
check("next.config.mjs wrapped in withPayload", () => {
  const c = readFileSync(resolve("next.config.mjs"), "utf-8");
  return c.includes("withPayload");
});

// === Summary ===
const ok = checks.filter((c) => c.ok).length;
const total = checks.length;
console.log(`\n${"=".repeat(50)}`);
if (failed > 0) {
  console.error(`❌ ${failed} CMS preflight check(s) failed (${ok}/${total} ok)`);
  console.error("Build aborted. Fix above issues before deploying.\n");
  process.exit(1);
}
console.log(`✅ All ${total} CMS preflight checks passed`);
console.log(`${SKIP_DB ? "(DB connectivity not tested)" : ""}\n`);
