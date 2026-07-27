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

  it("does not mutate the database from the Vercel build", () => {
    const pkg = JSON.parse(read("package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(pkg.scripts?.["vercel-build"]).not.toContain("push-schema");
    expect(pkg.scripts?.["vercel-build"]).not.toContain("migrate");
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
