import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  checkGoogle: vi.fn(),
  checkYandex: vi.fn(),
  readConfig: vi.fn()
}));

vi.mock("@/lib/admin/request-auth", () => ({
  authenticateCmsRequest: mocks.authenticate
}));

vi.mock("@/lib/seo-reporting", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/seo-reporting")>();
  return {
    ...original,
    readSeoReportingConfig: mocks.readConfig
  };
});

vi.mock("@/lib/seo-reporting/providers/google-search-console", () => ({
  checkGoogleSearchConsoleConnection: mocks.checkGoogle
}));

vi.mock("@/lib/seo-reporting/providers/yandex-webmaster", () => ({
  checkYandexWebmasterConnection: mocks.checkYandex
}));

import { GET } from "@/app/api/admin/seo/connections/route";
import { SeoProviderError } from "@/lib/seo-reporting/providers/errors";

let configSequence = 0;

function configuredProviders() {
  configSequence += 1;
  return {
    google: {
      configured: true as const,
      clientEmail: `seo-${configSequence}@example.test`,
      privateKey: `private-key-${configSequence}`,
      siteUrl: `sc-domain:example-${configSequence}.test`
    },
    yandex: {
      configured: true as const,
      hostId: `https:example-${configSequence}.test:443`,
      oauthToken: `oauth-token-${configSequence}`,
      regionIds: [],
      userId: String(configSequence)
    }
  };
}

function request() {
  return new Request(
    "https://kbparus-metal-storage.vercel.app/api/admin/seo/connections"
  );
}

describe("SEO provider connection health route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T08:00:00.000Z"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.authenticate.mockResolvedValue({
      cms: {},
      ok: true,
      role: "admin",
      user: { role: "admin" }
    });
    mocks.checkGoogle.mockResolvedValue({
      permissionLevel: "siteRestrictedUser"
    });
    mocks.checkYandex.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("caches successful provider checks for five minutes", async () => {
    mocks.readConfig.mockReturnValue(configuredProviders());

    const first = await GET(request());
    const second = await GET(request());
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);
    await GET(request());

    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({
      google: { connected: true, stale: false, transient: false },
      yandex: { connected: true, stale: false, transient: false }
    });
    expect((await second.json()).google.connected).toBe(true);
    expect(mocks.checkGoogle).toHaveBeenCalledTimes(1);
    expect(mocks.checkYandex).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2);
    await GET(request());
    expect(mocks.checkGoogle).toHaveBeenCalledTimes(2);
    expect(mocks.checkYandex).toHaveBeenCalledTimes(2);
  });

  it("uses a recent successful status during a transient outage", async () => {
    mocks.readConfig.mockReturnValue(configuredProviders());
    await GET(request());

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    mocks.checkGoogle.mockRejectedValue(
      new SeoProviderError("temporary upstream error", 503)
    );

    const response = await GET(request());
    const body = await response.json();

    expect(body.google).toEqual({
      connected: true,
      stale: true,
      transient: true
    });

    vi.advanceTimersByTime(30 * 60 * 1000);
    const expiredResponse = await GET(request());
    expect((await expiredResponse.json()).google).toEqual({
      connected: false,
      stale: false,
      transient: true
    });
  });

  it("marks a first transient failure as unavailable, not disconnected", async () => {
    mocks.readConfig.mockReturnValue(configuredProviders());
    mocks.checkGoogle.mockRejectedValue(
      new SeoProviderError("rate limited", 429, "rateLimitExceeded")
    );

    const response = await GET(request());
    const body = await response.json();

    expect(body.google).toEqual({
      connected: false,
      stale: false,
      transient: true
    });
  });

  it("keeps definitive permission failures disconnected", async () => {
    mocks.readConfig.mockReturnValue(configuredProviders());
    mocks.checkGoogle.mockRejectedValue(
      new SeoProviderError(
        "insufficient permission",
        403,
        "insufficientPermission"
      )
    );

    const response = await GET(request());
    const body = await response.json();

    expect(body.google).toEqual({
      connected: false,
      stale: false,
      transient: false
    });
  });
});
