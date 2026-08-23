import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getReport: vi.fn()
}));

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => ({ auth: mocks.auth }))
}));

vi.mock("@/lib/seo-reporting/yandex-metrika", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/lib/seo-reporting/yandex-metrika")
    >();
  return {
    ...original,
    getYandexMetrikaConversionReport: mocks.getReport
  };
});

import { GET } from "@/app/api/admin/seo/metrika/route";

describe("Yandex Metrika admin route", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.getReport.mockReset();
  });

  it("requires an authenticated content editor", async () => {
    mocks.auth.mockResolvedValueOnce({ user: null });
    const unauthorized = await GET(
      new Request("https://example.test/api/admin/seo/metrika?period=30")
    );
    expect(unauthorized.status).toBe(401);

    mocks.auth.mockResolvedValueOnce({
      user: { invitationStatus: "active", role: "photographer" }
    });
    const forbidden = await GET(
      new Request("https://example.test/api/admin/seo/metrika?period=30")
    );
    expect(forbidden.status).toBe(403);
    expect(mocks.getReport).not.toHaveBeenCalled();
  });

  it("validates the period before calling the provider", async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { invitationStatus: "active", role: "editor" }
    });
    const response = await GET(
      new Request("https://example.test/api/admin/seo/metrika?period=031")
    );

    expect(response.status).toBe(400);
    expect(mocks.getReport).not.toHaveBeenCalled();
  });

  it("returns a private authenticated report", async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { invitationStatus: "active", role: "admin" }
    });
    mocks.getReport.mockResolvedValueOnce({
      status: "not_configured",
      period: 90,
      generatedAt: "2026-07-28T09:00:00.000Z",
      message: "Интеграция Яндекс Метрики не настроена.",
      missing: ["YANDEX_METRIKA_OAUTH_TOKEN"]
    });

    const response = await GET(
      new Request("https://example.test/api/admin/seo/metrika?period=90")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0"
    );
    expect(mocks.getReport).toHaveBeenCalledWith({
      period: 90,
      forceRefresh: false
    });
    await expect(response.json()).resolves.toMatchObject({
      status: "not_configured",
      missing: ["YANDEX_METRIKA_OAUTH_TOKEN"]
    });
  });

  it("forwards an authenticated refresh request without weakening no-store", async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { invitationStatus: "active", role: "admin" }
    });
    mocks.getReport.mockResolvedValueOnce({
      status: "not_configured",
      period: 30,
      generatedAt: "2026-07-28T09:00:00.000Z",
      message: "not configured",
      missing: ["YANDEX_METRIKA_OAUTH_TOKEN"]
    });

    const response = await GET(
      new Request(
        "https://example.test/api/admin/seo/metrika?period=30&refresh=1"
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0"
    );
    expect(mocks.getReport).toHaveBeenCalledWith({
      period: 30,
      forceRefresh: true
    });
  });
});
