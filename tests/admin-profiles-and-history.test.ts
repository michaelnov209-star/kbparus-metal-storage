import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  canAccessAdmin,
  ownUserOrAdmin
} from "../payload/access/rbac";
import {
  deriveUserDisplayName,
  protectUserProfileUpdate
} from "../payload/hooks/protectUserProfile";
import { stampUpdatedBy } from "../payload/hooks/stampUpdatedBy";

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function hookArgs(overrides: Record<string, unknown> = {}) {
  return {
    collection: {} as never,
    context: {},
    data: {},
    operation: "update" as const,
    originalDoc: {},
    req: { user: null } as never,
    ...overrides
  };
}

describe("admin profiles and audit history", () => {
  it("allows every valid CMS role into the admin while limiting user reads to self", async () => {
    for (const role of ["admin", "editor", "photographer"] as const) {
      expect(
        canAccessAdmin({
          req: {
            user: { id: 7, invitationStatus: "active", role }
          } as never
        })
      ).toBe(true);
    }
    expect(
      canAccessAdmin({
        req: {
          user: { id: 7, invitationStatus: "active", role: "unknown" }
        } as never
      })
    ).toBe(false);

    expect(
      await ownUserOrAdmin({
        req: {
          user: { id: 9, invitationStatus: "active", role: "editor" }
        } as never
      } as never)
    ).toEqual({ id: { equals: 9 } });
    expect(
      await ownUserOrAdmin({
        req: {
          user: { id: 1, invitationStatus: "active", role: "admin" }
        } as never
      } as never)
    ).toBe(true);
  });

  it("lets non-admins update profile presentation but blocks credentials and role escalation", async () => {
    const originalDoc = {
      displayName: "Иван Петров",
      email: "ivan@example.com",
      firstName: "Иван",
      lastName: "Петров",
      position: "Редактор",
      role: "editor"
    };
    const req = {
      user: { id: 4, invitationStatus: "active", role: "editor" }
    } as never;

    await expect(
      Promise.resolve(
        protectUserProfileUpdate(
          hookArgs({
            data: {
              avatarPreset: "steel",
              email: originalDoc.email,
              firstName: "Иван",
              lastName: "Сидоров",
              role: originalDoc.role
            },
            originalDoc,
            req
          }) as never
        )
      )
    ).resolves.toBeTruthy();

    for (const data of [
      { role: "admin" },
      { email: "attacker@example.com" },
      { password: "new-secret-password" }
    ]) {
      await expect(
        Promise.resolve().then(() =>
          protectUserProfileUpdate(
            hookArgs({ data, originalDoc, req }) as never
          )
        )
      ).rejects.toMatchObject({ status: 403 });
    }

    const derived = await deriveUserDisplayName(
      hookArgs({
        data: { firstName: "Иван", lastName: "Сидоров" },
        originalDoc
      }) as never
    );
    expect(derived).toMatchObject({ displayName: "Иван Сидоров" });
  });

  it("stamps the real request user and never invents an author", async () => {
    expect(
      await stampUpdatedBy(
        hookArgs({
          data: { title: "Товар" },
          req: {
            user: {
              avatarPreset: "steel",
              firstName: "Анна",
              id: 42,
              invitationStatus: "active",
              lastName: "Смирнова",
              role: "editor"
            }
          }
        }) as never
      )
    ).toMatchObject({
      updatedBy: 42,
      updatedByAvatarPreset: "steel",
      updatedByName: "Анна Смирнова",
      updatedByRole: "editor"
    });

    expect(
      await stampUpdatedBy(
        hookArgs({
          data: {
            title: "Системная синхронизация",
            updatedBy: 42,
            updatedByAvatarPreset: "steel",
            updatedByName: "Предыдущий редактор",
            updatedByRole: "editor"
          },
          req: { user: null }
        }) as never
      )
    ).toEqual({
      title: "Системная синхронизация",
      updatedBy: null,
      updatedByAvatarPreset: null,
      updatedByName: null,
      updatedByRole: null
    });
  });

  it("wires lightweight preset avatars, secure session actions, and version actors", () => {
    const users = read("payload/collections/Users.ts");
    const config = read("payload.config.ts");
    const menu = read("app/(payload)/components/AdminAccountMenu.tsx");
    const popover = read("app/(payload)/components/AdminAccountPopover.tsx");
    const history = read("app/(payload)/components/AdminSystemView.tsx");
    const migration = read(
      "migrations/20260729_233207_admin_profiles_audit_snapshot.ts"
    );
    const snapshotMigration = read(
      "migrations/20260729_234013_immutable_audit_actor_snapshot.ts"
    );

    expect(users).toContain("admin: canAccessAdmin");
    expect(users).toContain("update: ownUserOrAdmin");
    expect(users).toContain('name: "avatarPreset"');
    expect(config).toContain('exportName: "AdminAccountMenu"');
    expect(popover).toContain("await logOut()");
    expect(popover).toContain('window.location.replace("/admin/login")');
    expect(menu).toContain("scheduleHoverState");
    expect(history).toContain("depth: 1");
    expect(history).toContain('name: "Системное или старое изменение"');
    expect(history).toContain("version.updatedBy");
    expect(history).toContain("version.updatedByName");

    for (const table of [
      "products",
      "categories",
      "subcategories",
      "calculator_profiles"
    ]) {
      expect(migration).toContain(`"${table}"`);
    }
    expect(migration).toContain('"avatar_preset"');
    expect(migration).toContain('"version_updated_by_id"');
    expect(snapshotMigration).toContain('"version_updated_by_name"');
    expect(snapshotMigration).toContain('"version_updated_by_role"');
    expect(snapshotMigration).toContain('"version_updated_by_avatar_preset"');
  });
});
