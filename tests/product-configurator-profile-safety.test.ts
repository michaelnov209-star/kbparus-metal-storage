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

  it("places technical details inside the product hero", () => {
    const page = fs.readFileSync(
      path.join(root, "app/(site)/catalog/[id]/[productId]/page.tsx"),
      "utf8"
    );
    const heroIndex = page.indexOf('className={`product-hero');
    const interactionIndex = page.indexOf("{productCalculatorProfile ? (");
    const detailsIndex = page.indexOf(
      '<div className="product-hero-details" data-testid="product-details">'
    );

    expect(heroIndex).toBeGreaterThan(-1);
    expect(detailsIndex).toBeGreaterThan(heroIndex);
    expect(detailsIndex).toBeLessThan(interactionIndex);
    expect(page).not.toContain('<section className="product-info-grid"');
  });
});
