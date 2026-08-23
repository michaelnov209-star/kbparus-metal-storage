import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath =
  "migrations/20260730_123000_admin_roles_and_invitations";

describe("admin roles and invitations migration", () => {
  it("registers a matching executable migration and schema snapshot", () => {
    const index = readFileSync(resolve("migrations/index.ts"), "utf8");
    const migration = readFileSync(resolve(`${migrationPath}.ts`), "utf8");
    const snapshot = JSON.parse(
      readFileSync(resolve(`${migrationPath}.json`), "utf8")
    ) as {
      enums: Record<string, { values: string[] }>;
      tables: Record<
        string,
        {
          columns: Record<string, unknown>;
          foreignKeys: Record<string, unknown>;
          indexes: Record<string, unknown>;
        }
      >;
    };

    expect(index).toContain("migration_20260730_123000_admin_roles_and_invitations");
    expect(migration).toContain('ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT');
    expect(migration).toContain("Rollback blocked: reassign users");
    expect(migration).toContain("Rollback blocked: invitation history exists");
    expect(migration).toContain('"users_invited_by_id_users_id_fk"');

    expect(snapshot.enums["public.enum_users_role"].values).toEqual([
      "admin",
      "editor",
      "photographer",
      "director",
      "general_director",
      "sales_manager",
      "engineer",
      "seo_marketer"
    ]);
    expect(
      snapshot.enums["public.enum_users_invitation_status"].values
    ).toEqual(["active", "pending", "delivery_failed", "revoked"]);
    expect(snapshot.tables["public.users"].columns).toHaveProperty(
      "invitation_status"
    );
    expect(snapshot.tables["public.users"].columns).toHaveProperty(
      "invitation_expires_at"
    );
    expect(snapshot.tables["public.users"].indexes).toHaveProperty(
      "users_invited_by_idx"
    );
    expect(snapshot.tables["public.users"].foreignKeys).toHaveProperty(
      "users_invited_by_id_users_id_fk"
    );
  });
});
