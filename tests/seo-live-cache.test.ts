import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLiveSeoReport } from "@/lib/seo-reporting/live";
import type { SeoReportInput } from "@/lib/seo-reporting/types";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("live SEO report cache", () => {
  it("bypasses the ready/empty cache only for an explicit refresh", async () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048
    });
    vi.stubEnv(
      "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL",
      "seo-force-refresh@example.test"
    );
    vi.stubEnv(
      "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY",
      privateKey
        .export({ type: "pkcs8", format: "pem" })
        .toString()
    );
    vi.stubEnv(
      "GOOGLE_SEARCH_CONSOLE_SITE_URL",
      "sc-domain:force-refresh.example.test"
    );

    const fetchMock = vi.fn(
      async (input: string | URL | Request) => {
        if (String(input).includes("oauth2.googleapis.com/token")) {
          return new Response(
            JSON.stringify({
              access_token: "google-force-refresh-token",
              expires_in: 3600
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" }
            }
          );
        }

        return new Response(JSON.stringify({ rows: [] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const input: SeoReportInput = {
      provider: "google",
      period: 30,
      device: "all",
      query: "cache-force-refresh-contract"
    };

    await getLiveSeoReport(input);
    const afterInitialLoad = fetchMock.mock.calls.filter(([request]) =>
      String(request).includes("searchconsole.googleapis.com")
    ).length;

    await getLiveSeoReport(input);
    const afterCachedLoad = fetchMock.mock.calls.filter(([request]) =>
      String(request).includes("searchconsole.googleapis.com")
    ).length;

    await getLiveSeoReport(input, { forceRefresh: true });
    const afterForcedRefresh = fetchMock.mock.calls.filter(([request]) =>
      String(request).includes("searchconsole.googleapis.com")
    ).length;

    expect(afterInitialLoad).toBe(6);
    expect(afterCachedLoad).toBe(6);
    expect(afterForcedRefresh).toBe(12);
  });
});
