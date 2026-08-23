import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "migrations",
  "20260729_224943_calculator_profiles_dynamic.ts"
);
const migration = fs.readFileSync(migrationPath, "utf8");

describe("dynamic calculator profile migration", () => {
  it("backfills every canonical profile and its selectable counts", () => {
    for (const slug of [
      "auto-sheet-metal",
      "auto-sort-metal",
      "rollout-cassette-rack",
      "forklift-cassette-rack",
      "two-side-rollout-rack",
      "hybrid-rollout-rack"
    ]) {
      expect(migration).toContain(`'${slug}'`);
    }

    expect(migration).toContain(
      'INSERT INTO "calculator_profiles_shelf_count_options"'
    );
    expect(migration).toContain(
      'INSERT INTO "calculator_profiles_tower_count_options"'
    );
    expect(migration).toContain(
      'INSERT INTO "calculator_profiles_rollout_load_options"'
    );
    expect(migration).toContain(
      'UPDATE "_calculator_profiles_v" AS version'
    );
  });

  it("refuses a destructive rollback while custom profile slugs exist", () => {
    expect(migration).toContain(
      "Rollback blocked: custom calculator profiles exist"
    );
    expect(migration).toMatch(
      /FROM "calculator_profiles"[\s\S]*"slug" NOT IN/
    );
    expect(migration).toMatch(
      /FROM "_calculator_profiles_v"[\s\S]*"version_slug" NOT IN/
    );
  });
});
