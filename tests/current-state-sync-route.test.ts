import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  authenticate: vi.fn(),
  isTrusted: vi.fn(),
  revalidatePath: vi.fn(),
  syncAsset: vi.fn(),
  syncContent: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("@/lib/admin/request-auth", () => ({
  authenticateCmsRequest: mocks.authenticate,
  isTrustedAdminMutationRequest: mocks.isTrusted
}));

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => null)
}));

vi.mock("@/lib/cms/current-state-sync-runtime", () => ({
  auditCurrentState: mocks.audit,
  syncCurrentStateAsset: mocks.syncAsset,
  syncCurrentStateContent: mocks.syncContent
}));

import { CURRENT_STATE_ASSETS } from "@/lib/cms/current-state-sync";
import { POST } from "@/app/api/admin/cms/current-state/route";

function request(body: unknown) {
  return new Request(
    "https://kbparus-metal-storage.vercel.app/api/admin/cms/current-state",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://kbparus-metal-storage.vercel.app"
      },
      body: JSON.stringify(body)
    }
  );
}

describe("CMS current-state admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isTrusted.mockReturnValue(true);
    mocks.authenticate.mockResolvedValue({
      ok: true,
      cms: { marker: "cms" },
      role: "admin",
      user: { role: "admin" }
    });
    mocks.audit.mockResolvedValue({
      assetTotal: 3,
      missingAssets: [],
      missingFields: 0,
      missingRecords: 0
    });
    mocks.syncAsset.mockResolvedValue({ created: true, id: 17 });
    mocks.syncContent.mockResolvedValue({
      createdRecords: 1,
      updatedFields: 8,
      updatedRecords: 2
    });
  });

  it("rejects cross-origin requests before authentication", async () => {
    mocks.isTrusted.mockReturnValue(false);

    const response = await POST(request({ action: "audit" }));

    expect(response.status).toBe(403);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it("requires an administrator account", async () => {
    mocks.authenticate.mockResolvedValue({
      ok: false,
      code: "admin-required",
      status: 403
    });

    const response = await POST(request({ action: "audit" }));

    expect(response.status).toBe(403);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("delegates audit and only accepts fixed asset keys", async () => {
    const auditResponse = await POST(request({ action: "audit" }));
    const invalidAssetResponse = await POST(
      request({ action: "asset", assetKey: "https://attacker.example/file" })
    );
    const assetResponse = await POST(
      request({ action: "asset", assetKey: CURRENT_STATE_ASSETS[0].key })
    );

    expect(auditResponse.status).toBe(200);
    expect(invalidAssetResponse.status).toBe(400);
    expect(assetResponse.status).toBe(200);
    expect(mocks.audit).toHaveBeenCalledTimes(1);
    expect(mocks.syncAsset).toHaveBeenCalledTimes(1);
  });

  it("revalidates public pages after missing-only content sync", async () => {
    const response = await POST(request({ action: "content" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      createdRecords: 1,
      updatedFields: 8,
      updatedRecords: 2
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/catalog", "layout");
  });
});
