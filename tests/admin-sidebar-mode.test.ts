import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("admin sidebar display mode", () => {
  const navigation = source(
    "app/(payload)/components/AdminWorkspaceNav.tsx"
  );
  const toggle = source(
    "app/(payload)/components/AdminNavModeToggle.tsx"
  );
  const styles = source("app/(payload)/admin-workspace.scss");

  it("persists and synchronizes compact mode without requiring storage", () => {
    expect(toggle).toContain('const STORAGE_KEY = "kb-admin-nav-mode"');
    expect(toggle).toContain("useLayoutEffect");
    expect(toggle).toContain('window.addEventListener("storage", syncMode)');
    expect(toggle).toMatch(
      /function readStoredMode\(\)[\s\S]*?try \{[\s\S]*?catch \{/
    );
    expect(toggle).toMatch(
      /function storeMode\(compact: boolean\)[\s\S]*?try \{[\s\S]*?catch \{/
    );
    expect(toggle).toContain("setCompact((currentCompact) =>");
  });

  it("exposes the toggle and icon-only links to assistive technology", () => {
    expect(toggle).toContain("aria-label={compact ?");
    expect(toggle).toContain("aria-pressed={compact}");
    expect(toggle).toContain('type="button"');
    expect(navigation).toContain("aria-label={item.label}");
    expect(navigation).toContain(
      'aria-label="Обзор и быстрые действия"'
    );
    expect(navigation).toContain("title={item.label}");
    expect(navigation).toContain('title="КБ Парус — обзор админки"');
  });

  it("keeps compact layout desktop-only and icons on one axis", () => {
    expect(styles).toMatch(
      /@media \(min-width:\s*1024px\)[\s\S]*?--nav-width:\s*300px;[\s\S]*?--nav-width:\s*84px;/
    );
    expect(styles).toMatch(
      /@media \(max-width:\s*1023px\)[\s\S]*?\.kb-admin-workspace-nav__mode-toggle\s*\{[\s\S]*?display:\s*none;/
    );
    expect(styles).toMatch(
      /data-kb-admin-nav="compact"[\s\S]*?\.kb-admin-workspace-nav__section-link:hover[\s\S]*?transform:\s*none;/
    );
  });

  it("keeps compact actions keyboard-readable and visibly focusable", () => {
    expect(styles).toMatch(
      /\.kb-admin-workspace-nav__tour > span:last-child\s*\{[\s\S]*?clip-path:\s*inset\(50%\);/
    );
    expect(styles).toMatch(
      /\.kb-admin-workspace-nav__section-link:focus-visible\s*\{[\s\S]*?outline:\s*3px solid/
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.template-default,[\s\S]*?transition:\s*none !important;/
    );
  });
});
