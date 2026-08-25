import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  "components/calculator/CalculatorV4.module.css",
  "utf8"
);
const linePageCss = readFileSync("styles/line-page.css", "utf8");
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

    expect(root).toContain("overflow: visible");
    expect(mobileBar).toContain("position: fixed");
    expect(mobileBar).toContain("left: 8px");
    expect(mobileBar).toContain("right: 8px");
  });

  it("keeps the wide summary sticky without clipped ancestors", () => {
    const summary = rules(".desktopSummary");
    const image = rules(".summaryImageFrame img");
    const verification = rules(".summaryVerification");

    expect(linePageCss).toMatch(/\.line-page\{[^}]*overflow:visible/);
    expect(linePageCss).not.toMatch(/\.line-page\{[^}]*overflow:hidden/);
    expect(summary).toContain("display: none");
    expect(css).toContain("@container calculator (min-width: 1180px)");
    expect(css).toMatch(
      /@container calculator \(min-width: 1180px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?display: grid/
    );
    expect(css).toMatch(
      /@container calculator \(min-width: 1180px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?position: sticky/
    );
    expect(css).toMatch(
      /@container calculator \(min-width: 1180px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?top: 20px/
    );
    expect(css).toMatch(
      /@container calculator \(min-width: 1180px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?overflow: visible/
    );
    expect(css).not.toMatch(
      /@container calculator \(min-width: 1180px\)[\s\S]*?\.desktopSummary\s*\{[\s\S]*?overscroll-behavior: contain/
    );
    expect(css).toMatch(
      /@container calculator \(min-width: 1180px\)[\s\S]*?\.summaryFacts\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)[\s\S]*?overflow: visible/
    );
    expect(image).toContain("height: clamp(320px, 36vh, 430px)");
    expect(css).toMatch(
      /\.summaryFacts span,\s*[\r\n]+\.modalFacts span\s*\{[\s\S]*?font-size: 14px/
    );
    expect(verification).toContain("font-size: 13px");
  });

  it("keeps object conditions readable enough for buyers", () => {
    const conditionTitle = rules(".conditionButton strong");
    const conditionCopy = rules(".conditionButton small");
    const conditionNote = rules(".conditionsNote");

    expect(conditionTitle).toContain("font-size: 15px");
    expect(conditionCopy).toContain("font-size: 13px");
    expect(conditionNote).toContain("font-size: 13px");
  });

  it("uses the approved orange for active actions without legacy red tokens", () => {
    expect(css).toContain("--v4-accent: #fc5413");
    expect(css).toMatch(
      /\.nextButton,[\s\S]*?\.mobileAction\s*\{[\s\S]*?background: var\(--v4-accent\)/
    );
    expect(css).toMatch(
      /\.nextButton,[\s\S]*?\.mobileAction\s*\{[\s\S]*?color: var\(--v4-ink\)/
    );
    expect(css).not.toMatch(/#(?:d83d06|c83a07|b93405)/i);
    expect(css).not.toMatch(/--v4-accent-(?:dark|action):/);
    expect(css).toContain("--v4-accent-text: #b93600");
  });

  it("keeps all live specification cards visually equal", () => {
    const specification = rules(".liveSpecification");
    const dimensions = rules(".dimensionsValue");
    const priceParts = rules(".liveSpecification .priceValue > span");

    expect(specification).toContain(
      "grid-template-columns: repeat(4, minmax(0, 1fr))"
    );
    expect(css).toContain(".liveSpecification > div > span");
    expect(css).not.toContain(".liveSpecification span {");
    expect(dimensions).toContain("white-space: nowrap");
    expect(dimensions).not.toContain("flex-wrap");
    expect(priceParts).toContain("font-size: inherit");
    expect(priceParts).toContain("white-space");
  });

  it("gives additional option images enough space to inspect the equipment", () => {
    const optionGrid = rules(".optionGrid");
    const optionButton = rules(".optionButton");

    expect(optionGrid).toContain(
      "grid-template-columns: repeat(2, minmax(0, 1fr))"
    );
    expect(optionButton).toContain(
      "grid-template-rows: 230px minmax(0, 1fr)"
    );
  });

  it("provides touch-sized value chips without noisy sliders", () => {
    const choiceButton = rules(".choiceButton");

    expect(choiceButton).toContain("min-height: 48px");
    expect(choiceField).not.toContain('type="range"');
    expect(choiceField).not.toContain("ruler");
    expect(choiceField).toContain('role="group"');
    expect(css).not.toContain(".rulerRange");
    expect(css).toContain('.choiceGrid[data-count="20"]');
    expect(css).toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
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

  it("keeps compact visual options in two columns and forms readable on phones", () => {
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.factGrid,[\s\S]*?\.contactGrid\s*\{[\s\S]*?grid-template-columns: 1fr/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.optionGrid\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.conditionGrid\s*\{[\s\S]*?grid-template-columns: 1fr/
    );
  });
});
