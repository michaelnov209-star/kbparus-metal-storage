import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  "components/calculator/CalculatorV4.module.css",
  "utf8"
);
const component = readFileSync("components/Calculator.tsx", "utf8");
const choiceField = readFileSync(
  "components/calculator/CalculatorV4ChoiceField.tsx",
  "utf8"
);

function rules(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, "g"))
  );

  expect(matches.length, `CSS rule not found: ${selector}`).toBeGreaterThan(0);
  return matches.map((match) => match[1]).join("\n");
}

describe("calculator v4 responsive layout contract", () => {
  it("isolates the calculator from legacy global calc classes", () => {
    expect(component).toContain(
      'import styles from "@/components/calculator/CalculatorV4.module.css"'
    );
    expect(component).toContain('data-ui="calculator-v4"');
    expect(component).not.toMatch(/className="calc-/);
    expect(component).not.toContain('className="primary-button"');
  });

  it("keeps the mobile quote action attached to the viewport", () => {
    const root = rules(".root");
    const mobileBar = rules(".mobileBar");

    expect(root).toContain("overflow-x: clip");
    expect(mobileBar).toContain("position: fixed");
    expect(mobileBar).toContain("left: 8px");
    expect(mobileBar).toContain("right: 8px");
  });

  it("does not show the wide summary before a safe container width", () => {
    const summary = rules(".desktopSummary");
    const image = rules(".summaryImageFrame img");

    expect(summary).toContain("display: none");
    expect(css).toContain("@container calculator (min-width: 1320px)");
    expect(css).toMatch(
      /@container calculator \(min-width: 1320px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?display: grid/
    );
    expect(css).toMatch(
      /@container calculator \(min-width: 1320px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?position: sticky/
    );
    expect(css).toMatch(
      /@container calculator \(min-width: 1320px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?top: 18px/
    );
    expect(image).toContain("height: clamp(390px, 34vw, 490px)");
  });

  it("provides touch-sized value chips without noisy sliders", () => {
    const choiceButton = rules(".choiceButton");

    expect(choiceButton).toContain("min-height: 48px");
    expect(choiceField).not.toContain('type="range"');
    expect(choiceField).toContain('role="group"');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("shows parameter help as a hover/focus tooltip", () => {
    expect(choiceField).toContain("aria-describedby={hintId}");
    expect(choiceField).toContain('role="tooltip"');
    expect(choiceField).not.toContain("closeOnOutsideClick");
    expect(choiceField).not.toContain("aria-expanded={helpOpen}");
    expect(css).toContain(".fieldHelpPanel");
    expect(css).toMatch(/\.fieldHelpPanel\s*\{[^}]*position:\s*absolute/);
    expect(css).toContain(".fieldHelp:hover .fieldHelpPanel");
    expect(css).toContain(".fieldHelp:focus-within .fieldHelpPanel");
  });

  it("collapses complex grids to one column on phones", () => {
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.factGrid,[\s\S]*?\.contactGrid\s*\{[\s\S]*?grid-template-columns: 1fr/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.optionGrid,[\s\S]*?\.conditionGrid\s*\{[\s\S]*?grid-template-columns: 1fr/
    );
  });
});
