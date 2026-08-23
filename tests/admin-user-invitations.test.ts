import { describe, expect, it, vi } from "vitest";

import {
  createTemporaryInvitationPassword,
  invitationExpiresAt,
  parseUserInvitationInput,
  userAccessEmailHtml,
  userAccessEmailSubject,
  USER_INVITATION_EXPIRATION_MS
} from "@/lib/admin/user-invitations";
import { Users } from "@/payload/collections/Users";
import {
  activateInvitationAfterPasswordSet,
  blockUnacceptedInvitationLogin
} from "@/payload/hooks/userInvitations";

describe("admin user invitations", () => {
  it("accepts only complete invitations with a known CMS role", () => {
    expect(
      parseUserInvitationInput({
        email: " Employee@Example.COM ",
        firstName: " Иван ",
        lastName: " Петров ",
        position: " Менеджер по заявкам ",
        role: "sales_manager"
      })
    ).toEqual({
      ok: true,
      value: {
        email: "employee@example.com",
        firstName: "Иван",
        lastName: "Петров",
        position: "Менеджер по заявкам",
        role: "sales_manager"
      }
    });

    expect(
      parseUserInvitationInput({
        email: "employee@example.com",
        firstName: "Иван",
        lastName: "Петров",
        position: "Менеджер",
        role: "super_admin"
      })
    ).toMatchObject({ ok: false });
    expect(
      parseUserInvitationInput({
        email: "not-an-email",
        firstName: "Иван",
        lastName: "Петров",
        position: "Менеджер",
        role: "editor"
      })
    ).toMatchObject({ ok: false });
  });

  it("creates an unguessable server-only temporary credential and 24-hour expiry", () => {
    const first = createTemporaryInvitationPassword();
    const second = createTemporaryInvitationPassword();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(64);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/u);

    const now = Date.UTC(2026, 6, 30, 9, 0, 0);
    expect(Date.parse(invitationExpiresAt(now)) - now).toBe(
      USER_INVITATION_EXPIRATION_MS
    );
  });

  it("builds branded invitation email without exposing the temporary password", () => {
    const req = {
      payload: {
        config: {
          admin: { routes: { reset: "/reset" } },
          routes: { admin: "/admin" },
          serverURL: "https://storage.example/"
        }
      }
    };
    const html = userAccessEmailHtml({
      req: req as never,
      token: "one-time-token",
      user: {
        firstName: "<Иван>",
        invitationStatus: "pending"
      }
    });

    expect(userAccessEmailSubject({ invitationStatus: "pending" })).toContain(
      "Приглашение"
    );
    expect(html).toContain(
      "https://storage.example/admin/reset/one-time-token"
    );
    expect(html).toContain("&lt;Иван&gt;");
    expect(html).not.toContain("password");
    expect(html).not.toContain("temporary");
  });

  it("disables direct user creation in favor of the invitation endpoint", async () => {
    const createAccess = Users.access?.create;
    expect(createAccess).toBeTypeOf("function");
    expect(
      await createAccess?.({
        req: { user: { role: "admin" } }
      } as never)
    ).toBe(false);
    expect(
      Users.admin?.components?.beforeList?.some(
        (component) =>
          typeof component === "object" &&
          component !== null &&
          "exportName" in component &&
          component.exportName === "AdminUserInvitationPanel"
      )
    ).toBe(true);
  });

  it("blocks normal login until the one-time link has been accepted", () => {
    expect(() =>
      blockUnacceptedInvitationLogin({
        req: { data: { email: "employee@example.com", password: "secret" } },
        user: { id: 7, invitationStatus: "pending" }
      } as never)
    ).toThrow("Сначала примите приглашение");

    expect(
      blockUnacceptedInvitationLogin({
        req: { data: { password: "new-secret", token: "verified-token" } },
        user: { id: 7, invitationStatus: "pending" }
      } as never)
    ).toMatchObject({ invitationStatus: "pending" });

    expect(() =>
      blockUnacceptedInvitationLogin({
        req: {
          data: {
            email: "employee@example.com",
            password: "unknown-temporary-password",
            token: "unverified-extra-field"
          }
        },
        user: { id: 7, invitationStatus: "pending" }
      } as never)
    ).toThrow("Сначала примите приглашение");
  });

  it("keeps revoked access blocked, including reset-style requests", () => {
    expect(() =>
      blockUnacceptedInvitationLogin({
        req: { data: { email: "employee@example.com", password: "secret" } },
        user: { id: 7, invitationStatus: "revoked" }
      } as never)
    ).toThrow("Доступ к аккаунту отозван");

    expect(() =>
      blockUnacceptedInvitationLogin({
        req: { data: { password: "new-secure-password", token: "token" } },
        user: { id: 7, invitationStatus: "revoked" }
      } as never)
    ).toThrow("Доступ к аккаунту отозван");
  });

  it("marks a pending invitation active only after successful password reset", async () => {
    const updateOne = vi.fn(async () => ({}));
    const result = await activateInvitationAfterPasswordSet({
      req: {
        data: { token: "verified-token" },
        payload: { db: { updateOne } }
      },
      user: { id: 7, invitationStatus: "pending" }
    } as never);

    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        data: expect.objectContaining({
          invitationExpiresAt: null,
          invitationStatus: "active",
          updatedAt: expect.any(String)
        }),
        id: 7,
        req: expect.any(Object),
        returning: false
      })
    );
    expect(result).toMatchObject({ id: 7, invitationStatus: "active" });
  });

  it("does not activate an invitation during a normal login", async () => {
    const updateOne = vi.fn(async () => ({}));
    const user = { id: 7, invitationStatus: "pending" };
    const result = await activateInvitationAfterPasswordSet({
      req: {
        data: { email: "employee@example.com", password: "secret" },
        payload: { db: { updateOne } }
      },
      user
    } as never);

    expect(updateOne).not.toHaveBeenCalled();
    expect(result).toBe(user);
  });

  it("does not reactivate a revoked account after a reset-style request", async () => {
    const updateOne = vi.fn(async () => ({}));
    const user = { id: 7, invitationStatus: "revoked" };
    const result = await activateInvitationAfterPasswordSet({
      req: {
        data: { password: "new-secure-password", token: "token" },
        payload: { db: { updateOne } }
      },
      user
    } as never);

    expect(updateOne).not.toHaveBeenCalled();
    expect(result).toBe(user);
  });
});
