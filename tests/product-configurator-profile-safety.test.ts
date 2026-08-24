import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("product configurator profile safety", () => {
  it("renders only with a resolved published profile and has no canonical fallback", () => {
    const page = fs.readFileSync(
      path.join(
        root,
        "app/(site)/catalog/[id]/[productId]/page.tsx"
      ),
      "utf8"
    );
    expect(page).toContain("const productCalculatorProfile =");
    expect(page).toContain("calculatorProfile");
    expect(page).toContain("profiles={[productCalculatorProfile]}");
    expect(page).toContain("productContext={{");
    expect(page).not.toContain("@/components/ProductConfigurator");
  });
});
