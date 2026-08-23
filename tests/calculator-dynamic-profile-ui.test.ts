import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Calculator } from "@/components/Calculator";
import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";

describe("dynamic calculator profile UI", () => {
  it("renders a non-canonical published profile without hardcoded copy or icon entries", () => {
    const profile = {
      ...calculatorProfiles[0],
      id: "custom-production-storage",
      title: "Производственная система Custom",
      shortTitle: "Custom Storage",
      description: "Профиль создан и опубликован через CMS.",
      bestFor: "производства с нестандартной технологической картой.",
      iconKey: "long-products"
    };

    const html = renderToStaticMarkup(
      createElement(Calculator, { profiles: [profile] })
    );

    expect(html).toContain("Custom Storage");
    expect(html).toContain("Профиль создан и опубликован через CMS.");
    expect(html).toContain(
      "производства с нестандартной технологической картой."
    );
    expect(html).toContain("1 вариант");
  });
});
