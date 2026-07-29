import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Payload admin select controls", () => {
  const styles = source("app/(payload)/admin-selects.scss");

  it("resets the tiny react-select search input without removing control focus", () => {
    expect(styles).toMatch(
      /\.react-select input\.rs__input:focus[\s\S]*?min-height:\s*0;[\s\S]*?box-shadow:\s*none;/
    );
    expect(styles).toMatch(
      /\.rs__control:focus-within[\s\S]*?border-color:\s*#fc5413;[\s\S]*?box-shadow:/
    );
  });

  it("hides only an idle caret and restores it for typed search text", () => {
    expect(styles).toContain(
      '.rs__input-container[data-value=""] input.rs__input'
    );
    expect(styles).toMatch(
      /\.rs__input-container:not\(\[data-value=""\]\) input\.rs__input[\s\S]*?caret-color:\s*currentColor;/
    );
  });

  it("keeps an open menu above following fields and internally scrollable", () => {
    expect(styles).toContain(
      ".field-type:has(.rs__control--menu-is-open)"
    );
    expect(styles).toMatch(
      /\.react-select \.rs__menu\s*\{[\s\S]*?z-index:\s*90;/
    );
    expect(styles).toMatch(
      /\.react-select \.rs__menu-list\s*\{[\s\S]*?overflow-y:\s*auto;[\s\S]*?overscroll-behavior:\s*contain;/
    );
  });

  it("loads the select corrections after the shared admin polish", () => {
    const globalStyles = source("app/(payload)/custom.scss");
    expect(globalStyles.indexOf('@use "./admin-selects"')).toBeGreaterThan(
      globalStyles.indexOf('@use "./admin-polish"')
    );
  });
});
