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
    const configurator = fs.readFileSync(
      path.join(root, "components/ProductConfigurator.tsx"),
      "utf8"
    );

    expect(page).toContain("calculatorProfile ?");
    expect(page).toContain("profileData={calculatorProfile}");
    expect(configurator).toContain("profileData: CalculatorProfile");
    expect(configurator).not.toContain("getCalculatorProfile");
  });
});
