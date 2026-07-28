import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const enabled = process.env.RUN_PAYLOAD_MIGRATIONS === "true";

if (!enabled) {
  console.log("[cms-migrate] Release migration is disabled.");
  process.exit(0);
}

if (process.env.VERCEL_ENV !== "production") {
  throw new Error(
    "RUN_PAYLOAD_MIGRATIONS is allowed only in a Vercel production build."
  );
}

if (
  process.env.PAYLOAD_MIGRATION_CONFIRMATION !==
  "APPLY_PRODUCTION_MIGRATIONS"
) {
  throw new Error(
    "Set PAYLOAD_MIGRATION_CONFIRMATION=APPLY_PRODUCTION_MIGRATIONS for the controlled production release."
  );
}

const migrationIndex = readFileSync(resolve("migrations/index.ts"), "utf8");
const migrationNames = [
  ...migrationIndex.matchAll(/\bname:\s*['"]([^'"]+)['"]/g)
].map((match) => match[1]);
const latestMigration = migrationNames.at(-1);
const requestedRelease = process.env.PAYLOAD_MIGRATION_RELEASE?.trim();

if (!latestMigration || requestedRelease !== latestMigration) {
  throw new Error(
    "PAYLOAD_MIGRATION_RELEASE must exactly match the latest registered migration. " +
      `Expected ${latestMigration ?? "a registered migration name"}.`
  );
}

const hasDirectDatabaseUrl = Boolean(
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.DATABASE_POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim()
);

if (!hasDirectDatabaseUrl) {
  throw new Error(
    "A direct PostgreSQL URL is required for the controlled production migration."
  );
}

console.log("[cms-migrate] Applying pending production migrations.");
// nosemgrep: javascript.lang.security.detect-child-process.detect-child-process -- fixed executable and fixed argv, shell is disabled.
const result = spawnSync(
  process.execPath,
  [resolve("scripts/cms/run-payload-migration.mjs"), "migrate"],
  {
    env: {
      ...process.env,
      PAYLOAD_MIGRATING: "true"
    },
    shell: false,
    stdio: "inherit"
  }
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(
    `Production migration failed with exit code ${result.status ?? "unknown"}.`
  );
}

console.log("[cms-migrate] Production migrations completed.");
