import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  create: vi.fn(),
  find: vi.fn(),
  findByID: vi.fn(),
  forgotPassword: vi.fn(),
  isTrusted: vi.fn(),
  update: vi.fn()
}));

vi.mock("@/lib/admin/request-auth", () => ({
  authenticateCmsRequest: mocks.authenticate,
  isTrustedAdminMutationRequest: mocks.isTrusted
}));

import { POST } from "@/app/api/admin/users/invitations/route";

function request(body: unknown) {
  return new Request(
    "https://kbparus-metal-storage.vercel.app/api/admin/users/invitations",
    {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "https://kbparus-metal-storage.vercel.app"
      },
      method: "POST"
    }
  );
}

describe("admin user invitation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_SECURE", "true");
    vi.stubEnv("SMTP_USER", "info@example.com");
    vi.stubEnv("SMTP_PASSWORD", "test-secret");
    vi.stubEnv("SMTP_FROM", "info@example.com");

    mocks.isTrusted.mockReturnValue(true);
    mocks.find.mockResolvedValue({ docs: [] });
    mocks.create.mockResolvedValue({
      email: "employee@example.com",
      id: 17
    });
    mocks.findByID.mockResolvedValue({
      email: "employee@example.com",
      id: 17,
      invitationStatus: "pending"
    });
    mocks.forgotPassword.mockResolvedValue("server-only-token");
    mocks.update.mockResolvedValue({ id: 17 });
    mocks.authenticate.mockResolvedValue({
      cms: {
        create: mocks.create,
        find: mocks.find,
        findByID: mocks.findByID,
        forgotPassword: mocks.forgotPassword,
        update: mocks.update
      },
      ok: true,
      role: "admin",
      user: { id: 3, role: "admin" }
    });
  });

  it("rejects cross-origin and non-admin requests before any mutation", async () => {
    mocks.isTrusted.mockReturnValue(false);
    const crossOrigin = await POST(request({ action: "create" }));
    expect(crossOrigin.status).toBe(403);
    expect(mocks.authenticate).not.toHaveBeenCalled();

    mocks.isTrusted.mockReturnValue(true);
    mocks.authenticate.mockResolvedValue({
      code: "admin-required",
      ok: false,
      status: 403
    });
    const nonAdmin = await POST(request({ action: "create" }));
    expect(nonAdmin.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects malformed bodies and non-JSON requests without mutating users", async () => {
    for (const body of [null, [], "invite", { action: "unknown" }]) {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
    }

    const wrongType = await POST(
      new Request(
        "https://kbparus-metal-storage.vercel.app/api/admin/users/invitations",
        {
          body: "action=create",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://kbparus-metal-storage.vercel.app"
          },
          method: "POST"
        }
      )
    );
    expect(wrongType.status).toBe(415);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates an invited user without returning password or reset token", async () => {
    const response = await POST(
      request({
        action: "create",
        email: "Employee@Example.com",
        firstName: "Иван",
        lastName: "Петров",
        position: "Инженер",
        role: "engineer"
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(
      expect.objectContaining({
        created: true,
        ok: true,
        status: "pending",
        userId: 17
      })
    );
    expect(JSON.stringify(json)).not.toMatch(/password|token/iu);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          avatarPreset: "ember",
          invitationStatus: "pending",
          invitedBy: 3,
          password: expect.stringMatching(/^[A-Za-z0-9_-]{64,}$/u),
          role: "engineer"
        }),
        overrideAccess: true
      })
    );
    expect(mocks.forgotPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        data: { email: "employee@example.com" },
        overrideAccess: true
      })
    );
  });

  it("rotates the one-time link when an admin resends a pending invitation", async () => {
    const response = await POST(
      request({ action: "resend", userId: 17 })
    );

    expect(response.status).toBe(200);
    expect(mocks.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        id: 17,
        overrideAccess: true
      })
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invitationStatus: "pending"
        }),
        id: 17
      })
    );
    expect(mocks.forgotPassword).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid IDs and throttles repeated invitation emails", async () => {
    const invalid = await POST(
      request({ action: "resend", userId: "not-an-id" })
    );
    expect(invalid.status).toBe(400);
    expect(mocks.findByID).not.toHaveBeenCalled();

    mocks.findByID.mockResolvedValueOnce({
      email: "employee@example.com",
      id: 17,
      invitationLastSentAt: new Date(Date.now() - 1_000).toISOString(),
      invitationStatus: "pending"
    });
    const throttled = await POST(
      request({ action: "resend", userId: "17" })
    );
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("retry-after")).toBeTruthy();
    expect(mocks.forgotPassword).not.toHaveBeenCalled();
  });

  it("allows an immediate retry after a recorded delivery failure", async () => {
    mocks.findByID.mockResolvedValueOnce({
      email: "employee@example.com",
      id: 17,
      invitationLastSentAt: new Date().toISOString(),
      invitationStatus: "delivery_failed"
    });

    const response = await POST(
      request({ action: "resend", userId: 17 })
    );

    expect(response.status).toBe(200);
    expect(mocks.forgotPassword).toHaveBeenCalledTimes(1);
  });

  it("handles a concurrent duplicate email as a conflict", async () => {
    mocks.find
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [{ id: 18 }] });
    mocks.create.mockRejectedValueOnce(new Error("unique constraint"));

    const response = await POST(
      request({
        action: "create",
        email: "employee@example.com",
        firstName: "Иван",
        lastName: "Петров",
        position: "Редактор",
        role: "editor"
      })
    );

    expect(response.status).toBe(409);
    expect(mocks.forgotPassword).not.toHaveBeenCalled();
  });

  it("records delivery failure without exposing the generated token", async () => {
    mocks.forgotPassword.mockRejectedValue(new Error("SMTP unavailable"));
    const response = await POST(
      request({
        action: "create",
        email: "employee@example.com",
        firstName: "Иван",
        lastName: "Петров",
        position: "Редактор",
        role: "editor"
      })
    );
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toContain("письмо не отправлено");
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invitationExpiresAt: null,
          invitationStatus: "delivery_failed"
        })
      })
    );
    expect(JSON.stringify(json)).not.toContain("server-only-token");
  });
});
