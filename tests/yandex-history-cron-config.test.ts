import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Yandex Webmaster history scheduling", () => {
  it("runs the protected collector once per day in production", () => {
    const vercel = JSON.parse(read("vercel.json")) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };

    expect(vercel.crons).toEqual([
      {
        path: "/api/cron/seo/yandex",
        schedule: "15 3 * * *"
      }
    ]);
  });

  it("keeps the collector gated by both a secret and the migration flag", () => {
    const route = read("app/api/cron/seo/yandex/route.ts");
    const secretCheck = route.indexOf("if (!validCronAuthorization");
    const historyFlag = route.indexOf("if (!isYandexHistoryEnabled())");
    const cmsInitialization = route.indexOf("await getCmsClient()");

    expect(route).toContain("process.env.CRON_SECRET");
    expect(route).toContain("timingSafeEqual");
    expect(secretCheck).toBeGreaterThan(-1);
    expect(historyFlag).toBeGreaterThan(secretCheck);
    expect(cmsInitialization).toBeGreaterThan(historyFlag);
    expect(route).toContain('{ status: "skipped", reason: "disabled" }');
    expect(route).toContain('{ status: 200, headers: privateHeaders }');
  });

  it("keeps a 14-day refresh window and 400-day retention", () => {
    const history = read("lib/seo-reporting/yandex-history.ts");

    expect(history).toContain("const REFRESH_DAYS = 14");
    expect(history).toContain("const RETENTION_DAYS = 400");
  });

  it("declares the server-only activation variables", () => {
    const envExample = read(".env.example");

    expect(envExample).toContain("SEO_YANDEX_HISTORY_ENABLED=false");
    expect(envExample).toContain("CRON_SECRET=");
    expect(envExample).toContain("YANDEX_METRIKA_OAUTH_TOKEN=");
    expect(envExample).toContain("YANDEX_METRIKA_COUNTER_ID=");
    expect(envExample).not.toContain("NEXT_PUBLIC_CRON_SECRET");
  });

  it("wires the history migration into the configured Payload directory", () => {
    const payloadConfig = read("payload.config.ts");
    const migrationIndex = read("migrations/index.ts");
    const migration = read(
      "migrations/20260728_001500_seo_yandex_history.ts"
    );

    expect(payloadConfig).toContain(
      'migrationDir: path.resolve(dirname, "migrations")'
    );
    expect(migrationIndex).toContain(
      "import * as migration_20260728_001500_seo_yandex_history"
    );
    expect(migrationIndex).toContain(
      "up: migration_20260728_001500_seo_yandex_history.up"
    );
    expect(migrationIndex).toContain(
      "down: migration_20260728_001500_seo_yandex_history.down"
    );
    expect(migrationIndex).toContain(
      "name: '20260728_001500_seo_yandex_history'"
    );
    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "seo_yandex_history"'
    );
    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "seo_yandex_sync_days"'
    );
    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "seo_yandex_collection_runs"'
    );
  });

  it("documents the safe activation order and UTC schedule", () => {
    const docs = read("docs/operations/seo-reporting.md");

    expect(docs).toContain("03:15 UTC");
    expect(docs).toContain("SEO_YANDEX_HISTORY_ENABLED=true");
    expect(docs).toContain("`disabled`");
    expect(docs).toContain("Ручное обновление");
    expect(docs).toContain("обходит");
    expect(docs).toContain(
      "migrations/20260728_001500_seo_yandex_history.ts"
    );
  });
});