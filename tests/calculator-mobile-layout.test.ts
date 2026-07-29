import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("styles/calculator-v3.css", "utf8");

function rules(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, "g"))
  );

  expect(matches.length, `CSS rule not found: ${selector}`).toBeGreaterThan(0);
  return matches.map((match) => match[1]).join("\n");
}

describe("calculator mobile layout contract", () => {
  it("keeps the mobile price control attached to the viewport", () => {
    const root = rules('#calculator[data-ui="calculator-v3"]');
    const mobileBar = rules(
      '#calculator[data-ui="calculator-v3"] .mobile-summary-bar'
    );

    expect(root).toContain("transform: none");
    expect(root).toContain("overflow: clip");
    expect(mobileBar).toContain("position: fixed");
    expect(mobileBar).toContain("left: 8px");
    expect(mobileBar).toContain("right: 8px");
  });

  it("does not lose width to the browser's default details padding", () => {
    const picker = rules(
      '#calculator[data-ui="calculator-v3"] .equipment-picker'
    );

    expect(picker).toContain("width: 100%");
    expect(picker).toContain("min-width: 0");
    expect(picker).toContain("padding: 0");
  });

  it("contains long system labels inside narrow cards", () => {
    const tags = rules(
      '#calculator[data-ui="calculator-v3"] .system-card-tags'
    );
    const title = rules(
      '#calculator[data-ui="calculator-v3"] .system-card > strong'
    );

    expect(tags).toContain("min-width: 0");
    expect(tags).toContain("max-width: 100%");
    expect(tags).toContain("overflow: hidden");
    expect(title).toContain("overflow-wrap: anywhere");
    expect(title).toContain("overflow: hidden");
  });

  it("resets legacy content padding inside the compact result card", () => {
    const copy = rules(
      '#calculator[data-ui="calculator-v3"] .solution-copy'
    );

    expect(copy).toContain("min-width: 0");
    expect(copy).toContain("padding: 0 !important");
  });
});
