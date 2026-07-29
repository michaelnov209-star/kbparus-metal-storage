import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Payload production migration safety", () => {
  it("disables schema push and declares the migration directory", () => {
    const config = read("payload.config.ts");

    expect(config).toContain('migrationDir: path.resolve(dirname, "migrations")');
    expect(config).toMatch(/push:\s*false/);
    expect(config).not.toMatch(/push:\s*true/);
  });

  it("runs release migrations only through the explicitly guarded production step", () => {
    const pkg = JSON.parse(read("package.json")) as {
      scripts?: Record<string, string>;
    };
    const releaseGuard = read(
      "scripts/cms/conditional-production-migrate.mjs"
    );

    expect(pkg.scripts?.["vercel-build"]).not.toContain("push-schema");
    expect(pkg.scripts?.["vercel-build"]).toContain(
      "conditional-production-migrate.mjs"
    );
    expect(pkg.scripts?.["vercel-build"]).not.toContain("cms:migrate:apply");
    expect(releaseGuard).toContain(
      'process.env.RUN_PAYLOAD_MIGRATIONS === "true"'
    );
    expect(releaseGuard).toContain(
      'process.env.VERCEL_ENV !== "production"'
    );
    expect(releaseGuard).toContain(
      '"APPLY_PRODUCTION_MIGRATIONS"'
    );
    expect(releaseGuard).toContain("PAYLOAD_MIGRATION_RELEASE");
    expect(releaseGuard).toContain("latest registered migration");
    expect(releaseGuard).toContain("DATABASE_URL_UNPOOLED");
    expect(releaseGuard).toContain(
      "reconcile-legacy-migration-marker.mjs"
    );
    expect(releaseGuard).toContain("pg_try_advisory_lock");
    expect(releaseGuard).toContain("pg_advisory_unlock");
    expect(releaseGuard).toContain(
      "Another controlled production migration is already running."
    );
  });

  it("reclassifies only the exact reviewed Payload dev marker", () => {
    const reconciliation = read(
      "scripts/cms/reconcile-legacy-migration-marker.mjs"
    );

    expect(reconciliation).toContain(
      'const LEGACY_MARKER_NAME = "dev"'
    );
    expect(reconciliation).toContain(
      'const BASELINE_MIGRATION_NAME = "20260727_135515_legacy_baseline"'
    );
    expect(reconciliation).toContain(
      '"RECLASSIFY_REVIEWED_DEV_SCHEMA"'
    );
    expect(reconciliation).toContain("pg_advisory_xact_lock");
    expect(reconciliation).toContain("FOR UPDATE");
    expect(reconciliation).toContain("legacyMarkers.rowCount !== 1");
    expect(reconciliation).toContain(
      "legacyMarkers.rows[0]?.name !== LEGACY_MARKER_NAME"
    );
    expect(reconciliation).toContain("updated.rowCount !== 1");
    expect(reconciliation).toContain('await client.query("ROLLBACK")');
    expect(reconciliation).not.toContain("DROP TABLE");
    expect(reconciliation).not.toContain("DELETE FROM");
  });

  it("uses the guarded wrapper for every supported migration command", () => {
    const pkg = JSON.parse(read("package.json")) as {
      scripts?: Record<string, string>;
    };
    const scripts = pkg.scripts ?? {};

    expect(scripts["cms:migrate:create"]).toContain(
      "run-payload-migration.mjs migrate:create"
    );
    expect(scripts["cms:migrate:status"]).toContain(
      "run-payload-migration.mjs migrate:status"
    );
    expect(scripts["cms:migrate:apply"]).toContain(
      "run-payload-migration.mjs migrate"
    );
  });

  it("keeps the legacy baseline DDL-free and irreversible", () => {
    const baseline = read(
      "migrations/20260727_135515_legacy_baseline.ts"
    );

    expect(baseline).not.toContain("db.execute");
    expect(baseline).not.toContain("CREATE TABLE");
    expect(baseline).toContain("legacy baseline is irreversible");
  });

  it("repairs calculator option keys from profile semantics, never serial row ids", () => {
    const initial = read(
      "migrations/20260728_203000_calculator_option_key.ts"
    );
    const correction = read(
      "migrations/20260728_214500_calculator_option_business_key.ts"
    );
    const index = read("migrations/index.ts");

    expect(initial).not.toContain('SET "option_id" = "id"::varchar');
    expect(initial).toContain('profile_version."version_slug"');
    expect(initial).toContain('option."_order"');
    expect(initial).toContain('option."title"');

    expect(correction).toContain(
      'option."option_id" = option."id"::varchar'
    );
    expect(correction).toContain("expected.option_id");
    expect(correction).toContain('lpad(option."_order"::text');
    expect(correction).toContain('md5(coalesce(option."title"');
    expect(correction).toContain("business-key repair is irreversible");

    expect(index).toContain(
      "import * as migration_20260728_214500_calculator_option_business_key"
    );
    expect(index).toContain(
      "up: migration_20260728_214500_calculator_option_business_key.up"
    );
  });

  it("adds public-media visibility as an additive, reversible migration", () => {
    const migration = read(
      "migrations/20260728_221500_media_visibility.ts"
    );
    const index = read("migrations/index.ts");

    expect(migration).toContain(
      'ADD COLUMN IF NOT EXISTS "publicly_available" boolean DEFAULT true NOT NULL'
    );
    expect(migration).toContain(
      'DROP COLUMN IF EXISTS "publicly_available"'
    );
    expect(index).toContain(
      "migration_20260728_221500_media_visibility"
    );
  });

  it("adds a shared PostgreSQL limiter for public lead submissions", () => {
    const migration = read(
      "migrations/20260728_224500_lead_rate_limits.ts"
    );
    const index = read("migrations/index.ts");

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "lead_rate_limits"'
    );
    expect(migration).toContain('"rate_limit_key" varchar(64) PRIMARY KEY');
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "lead_rate_limits_updated_at_idx"'
    );
    expect(index).toContain("migration_20260728_224500_lead_rate_limits");
  });

  it("keeps the product editor migration additive, repeat-safe and reversible", () => {
    const migration = read(
      "migrations/20260729_171500_product_editor_experience.ts"
    );
    const index = read("migrations/index.ts");

    expect(migration).toContain("EXCEPTION WHEN duplicate_object THEN NULL");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS");
    expect(migration).toContain("DROP TABLE IF EXISTS");
    expect(migration).toContain("DROP COLUMN IF EXISTS");
    expect(migration).toContain(
      'ALTER COLUMN "no_index" DROP DEFAULT'
    );
    expect(migration).toContain(
      `ALTER COLUMN "catalog_href" SET DEFAULT '#catalog'`
    );
    expect(index).toContain(
      "migration_20260729_171500_product_editor_experience"
    );
  });

  it("keeps the production workflow read-only and main-only", () => {
    const workflow = read(".github/workflows/cms-migrate-production.yml");
    const jobPreamble = workflow.slice(
      workflow.indexOf("jobs:"),
      workflow.indexOf("steps:")
    );

    expect(workflow).toContain(
      "if: ${{ github.ref == 'refs/heads/main' }}"
    );
    expect(workflow).toContain("npm run cms:migrate:audit");
    expect(workflow).not.toContain("cms:migrate:apply");
    expect(workflow).not.toContain("cms:migrate:status");
    expect(workflow).not.toContain("PAYLOAD_SECRET");
    expect(jobPreamble).not.toMatch(/^\s{4}env:/m);
  });

  it("does not let the read-only audit fall back to pooled credentials", () => {
    const auditScript = read("scripts/cms/audit-migration-state.mjs");

    expect(auditScript).toContain("DATABASE_URL_UNPOOLED");
    expect(auditScript).not.toContain("process.env.DATABASE_URL?.trim()");
    expect(auditScript).not.toContain(
      "process.env.DATABASE_POSTGRES_URL?.trim()"
    );
    expect(auditScript).toContain('await client.query("BEGIN READ ONLY")');
  });
});
