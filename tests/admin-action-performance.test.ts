import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin action performance", () => {
  it("refreshes calculator data only when the sync created records", () => {
    const calculatorSync = source(
      "app/(payload)/components/CalculatorProfileSyncButton.tsx"
    );

    expect(calculatorSync).toContain(
      "if ((payload.created ?? 0) > 0)"
    );
    expect(calculatorSync.match(/router\.refresh\(\)/g)).toHaveLength(1);
  });
});
