import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("styles/line-page.css", "utf8");
const catalog = readFileSync("components/CatalogGrid.tsx", "utf8");

describe("mobile catalog layout contract", () => {
  it("shows two compact category cards per row on regular phones", () => {
    expect(css).toMatch(
      /@media\(max-width:640px\)\{[\s\S]*?\.catalog-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/
    );
    expect(css).toMatch(
      /@media\(max-width:640px\)\{[\s\S]*?\.catalog-card\{[\s\S]*?grid-template-columns:1fr!important;[\s\S]*?grid-template-rows:132px minmax\(118px,auto\)!important/
    );
    expect(catalog).toContain('(max-width: 640px) calc(50vw - 18px)');
  });

  it("keeps a readable one-column fallback for exceptionally narrow screens", () => {
    expect(css).toMatch(
      /@media\(max-width:350px\)\{[\s\S]*?\.catalog-grid\{grid-template-columns:1fr!important/
    );
  });
});
