import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getLiveReport: vi.fn(),
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
    getLiveSeoReport: mocks.getLiveReport,
    readSeoReportingConfig: mocks.readConfig
  };
});

import { GET } from "@/app/api/admin/seo/report/route";

const serviceAccountEmail =
  "seo-reader@kbparus-storage.iam.gserviceaccount.com";
const privateKey = "PRIVATE-KEY-MUST-NOT-LEAVE-THE-SERVER";

function request() {
  return new Request(
    "https://kbparus-metal-storage.vercel.app/api/admin/seo/report?provider=google&period=30&device=all"
  );
}

describe("Google Search Console report credential boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL", serviceAccountEmail);
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY", privateKey);
    mocks.readConfig.mockReturnValue({
      google: {
        configured: true,
        clientEmail: serviceAccountEmail,
        privateKey,
        siteUrl: "https://kbparus-metal-storage.vercel.app/"
      },
      yandex: {
        configured: false,
        missing: [
          "YANDEX_WEBMASTER_OAUTH_TOKEN",
          "YANDEX_WEBMASTER_USER_ID",
          "YANDEX_WEBMASTER_HOST_ID"
        ]
      }
    });
    mocks.getLiveReport.mockResolvedValue({
      provider: "google",
      status: "empty",
      requestedDays: 30,
      coverageDays: 0,
      dateRange: {
        start: "2026-06-29",
        end: "2026-07-28"
      },
      generatedAt: "2026-07-29T12:00:00.000Z",
      summary: {
        clicks: 0,
        impressions: 0,
        ctr: null,
        position: null
      },
      trend: [],
      queries: [],
      pages: [],
      countries: [],
      notices: ["Показов пока нет."],
      truncated: false
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not return the service-account email to an editor", async () => {
    mocks.authenticate.mockResolvedValue({
      ok: true,
      cms: {},
      role: "editor",
      user: { role: "editor" }
    });

    const response = await GET(request());
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0"
    );
    expect(body.googleServiceAccountEmail).toBeUndefined();
    expect(serialized).not.toContain(serviceAccountEmail);
    expect(serialized).not.toContain(privateKey);
  });

  it("returns only the copyable email to an administrator", async () => {
    mocks.authenticate.mockResolvedValue({
      ok: true,
      cms: {},
      role: "admin",
      user: { role: "admin" }
    });

    const response = await GET(request());
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.googleServiceAccountEmail).toBe(serviceAccountEmail);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY");
  });
});
