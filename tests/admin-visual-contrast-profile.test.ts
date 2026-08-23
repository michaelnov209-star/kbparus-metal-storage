import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  avatarPresetLabels,
  avatarPresetValues
} from "../payload/admin/avatar-presets";

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("admin visual contrast and profile menu", () => {
  it("keeps dark hero descriptions readable above the global paragraph color", () => {
    const workspace = source("app/(payload)/admin-workspace.scss");
    const sharedHero = source("app/(payload)/admin-section-hero.scss");
    const training = source("app/(payload)/control-center.scss");

    expect(workspace).toContain("--kb-admin-on-dark-muted: #dbe3e9");
    expect(sharedHero).toContain(
      "html[data-theme] .kb-admin-section-hero > div > p"
    );
    expect(sharedHero).toContain(
      "color: var(--kb-admin-on-dark-muted, #dbe3e9)"
    );
    expect(training).toContain(
      "html[data-theme] .kb-admin-training-popover p"
    );
  });

  it("keeps the sticky save controls below the account popover layer", () => {
    const polish = source("app/(payload)/admin-polish.scss");
    const menu = source(
      "app/(payload)/components/admin-account-menu.scss"
    );
    const popover = source(
      "app/(payload)/components/admin-account-popover.scss"
    );

    expect(polish).toMatch(
      /main\.collection-edit \.doc-controls \{[\s\S]*?z-index: 20;/
    );
    expect(menu).toContain("z-index: 80");
    expect(popover).toContain("position: absolute");
    expect(popover).toContain("max-height: calc(100dvh - 82px)");
  });

  it("ships sixteen distinct, lightweight production-themed avatar assets", () => {
    const avatarStyles = source(
      "app/(payload)/components/avatar-presets.scss"
    );
    const labels = avatarPresetValues.map(
      (preset) => avatarPresetLabels[preset]
    );
    let totalBytes = 0;

    expect(new Set(labels).size).toBe(avatarPresetValues.length);

    for (const preset of avatarPresetValues) {
      const asset = resolve(
        process.cwd(),
        `public/assets/admin/avatars-v2/${preset}.webp`
      );
      expect(existsSync(asset), `${preset} avatar is missing`).toBe(true);
      const bytes = statSync(asset).size;
      expect(bytes).toBeGreaterThan(3_000);
      expect(bytes).toBeLessThan(12_000);
      totalBytes += bytes;
      expect(avatarStyles).toContain(
        `/assets/admin/avatars-v2/${preset}.webp`
      );
    }

    expect(avatarPresetValues).toHaveLength(16);
    expect(totalBytes).toBeLessThan(180_000);
  });

  it("renders the animal gallery large enough to identify every character", () => {
    const field = source(
      "app/(payload)/components/AvatarPresetFieldImpl.tsx"
    );
    const styles = source(
      "app/(payload)/components/avatar-preset-field.scss"
    );

    expect(field).toContain("size={112}");
    expect(field).toContain("size={96}");
    expect(field).toContain("avatarPresetMeta");
    expect(styles).toContain(
      "grid-template-columns: repeat(4, minmax(0, 1fr))"
    );
    expect(styles).toContain("min-height: 128px");
  });

  it("keeps the staff list focused on avatar, name, and position", () => {
    const users = source("payload/collections/Users.ts");
    const field = source(
      "app/(payload)/components/AvatarPresetFieldImpl.tsx"
    );
    const styles = source(
      "app/(payload)/components/avatar-preset-field.scss"
    );

    expect(users).toContain('exportName: "UserDisplayNameCell"');
    expect(field).toContain('className="kb-user-name-cell"');
    expect(field).toContain("<small>{position}</small>");
    expect(field).toContain("size={44}");
    expect(field).not.toContain("<span>{avatarPresetLabels[preset]}</span>");
    expect(styles).toContain(
      "html[data-theme] .kb-user-name-cell strong"
    );
  });

  it("migrates the additional avatar choices without invalid rollback values", () => {
    const migration = source(
      "migrations/20260730_074038_admin_animal_avatars.ts"
    );

    for (const preset of avatarPresetValues.slice(8)) {
      expect(migration).toContain(`ADD VALUE '${preset}'`);
    }
    expect(migration).toContain(
      'UPDATE "users"'
    );
    expect(migration).toContain(
      'SET "avatar_preset" = \'ember\''
    );
  });
});
