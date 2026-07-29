import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("admin branding", () => {
  it("keeps the horizontal wordmark legible in the Payload header", () => {
    const styles = readProjectFile("app/(payload)/custom.scss");

    expect(styles).toMatch(/\.kb-admin-icon\s*\{[\s\S]*?width:\s*96px;[\s\S]*?height:\s*auto;/);
    expect(styles).toMatch(/\.step-nav__home\s*\{[\s\S]*?width:\s*110px;[\s\S]*?height:\s*38px;/);
    expect(styles).toMatch(
      /@media \(max-width:\s*520px\)[\s\S]*?\.step-nav__home\s*\{[\s\S]*?width:\s*84px;/
    );
  });

  it("shows a full-size brand mark in the workspace navigation", () => {
    const component = readProjectFile(
      "app/(payload)/components/AdminWorkspaceNav.tsx"
    );
    const styles = readProjectFile("app/(payload)/admin-workspace.scss");

    expect(component).toContain('className="kb-admin-workspace-nav__brand"');
    expect(component).toContain('src="/brand/logo-g.png"');
    expect(styles).toMatch(
      /\.kb-admin-workspace-nav__brand img\s*\{[\s\S]*?width:\s*148px;[\s\S]*?height:\s*auto;/
    );
  });

  it("does not force the wide logo into a square on the fast login screen", () => {
    const component = readProjectFile("app/(auth)/admin/login/LoginClient.tsx");
    const styles = readProjectFile("app/(auth)/auth.css");

    expect(component).toContain('width="118" height="39"');
    expect(component).toContain('width="104" height="35"');
    expect(styles).toMatch(
      /\.kb-auth-brand img\s*\{[\s\S]*?width:\s*118px;[\s\S]*?height:\s*auto;/
    );
  });
});
