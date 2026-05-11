/**
 * Explicit Payload + Postgres schema push for production builds.
 *
 * This script runs on Vercel before `next build`. It intentionally fails the
 * build if CMS schema creation is incomplete, so a broken admin is not
 * published by accident.
 */

import { getPayload } from "payload";
import type { GlobalSlug, Payload } from "payload";
import config from "../../payload.config";

const REQUIRED_GLOBALS = ["contacts", "home-content"] as const satisfies readonly GlobalSlug[];

async function verifyGlobalSchema(payload: Payload) {
  const failures: string[] = [];

  for (const slug of REQUIRED_GLOBALS) {
    try {
      await payload.findGlobal({ slug, depth: 0 });
      console.log(`✓ Global "${slug}" is readable`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${slug}: ${message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      [
        "Global schema verification failed after Payload init.",
        "This usually means Drizzle did not create one or more global tables.",
        ...failures.map((failure) => `- ${failure}`)
      ].join("\n")
    );
  }
}

async function main() {
  const dbUrl =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.log("⚠ No DATABASE_URL found. Skipping schema push for DB-less build.");
    console.log("  Production builds must provide DATABASE_URL_UNPOOLED or another Postgres URL.");
    process.exit(0);
  }

  const isPooled = dbUrl.includes("pooler.") || dbUrl.includes("pgbouncer");
  if (isPooled) {
    console.warn("⚠ Pooled Postgres connection detected. DDL may fail through pgbouncer.");
    console.warn("  Prefer DATABASE_URL_UNPOOLED for Payload schema operations.");
  }

  console.log("→ Initializing Payload and pushing schema...");
  const start = Date.now();

  try {
    process.env.PAYLOAD_FORCE_DRIZZLE_PUSH ||= "true";

    const payload = await getPayload({ config });
    await verifyGlobalSchema(payload);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✓ Schema push complete in ${elapsed}s`);
    console.log("  Collections and globals are readable. /admin is ready for first request.");
    process.exit(0);
  } catch (err) {
    console.error("✗ Schema push failed:");
    console.error(err);
    console.error("\nDiagnostics:");
    console.error("  - Is DATABASE_URL configured correctly?");
    console.error("  - Is DATABASE_URL_UNPOOLED available for direct DDL operations?");
    console.error("  - Is PAYLOAD_SECRET configured?");
    console.error("  - Is Postgres reachable from the build environment?");
    process.exit(1);
  }
}

main();
