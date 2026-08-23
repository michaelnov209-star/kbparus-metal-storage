import { describe, expect, it } from "vitest";
import {
  aggregateSeoMetrics,
  buildSeoQueryMetrics
} from "@/lib/seo-reporting/aggregate";
import {
  isYandexHistoryEnabled,
  readSeoReportingConfig
} from "@/lib/seo-reporting/config";
import {
  buildSeoDateWindow,
  clampYandexStart,
  parseSeoReportInput
} from "@/lib/seo-reporting/dates";
import { buildSeoReportResponse } from "@/lib/seo-reporting/report";
import {
  publicSeoProviderError,
  SeoProviderError
} from "@/lib/seo-reporting/providers/errors";
import type {
  SeoObservation,
  SeoReportInput
} from "@/lib/seo-reporting/types";

const now = new Date("2026-07-27T12:00:00.000Z");

function observation(
  overrides: Partial<SeoObservation> = {}
): SeoObservation {
  return {
    source: "google",
    date: "2026-07-10",
    query: "металлические стеллажи",
    page: "https://kbparus-metal-storage.vercel.app/catalog/shelving",
    device: "desktop",
    clicks: 10,
    impressions: 100,
    position: 8,
    ...overrides
  };
}

describe("SEO reporting dates and input", () => {
  it("builds equal current and comparison windows ending yesterday", () => {
    expect(buildSeoDateWindow(30, now)).toEqual({
      currentStart: "2026-06-27",
      currentEnd: "2026-07-26",
      previousStart: "2026-05-28",
      previousEnd: "2026-06-26"
    });
  });

  it("honestly clamps Yandex live history to the last 14 days", () => {
    expect(clampYandexStart("2025-01-01", now)).toBe("2026-07-13");
    expect(clampYandexStart("2026-07-20", now)).toBe("2026-07-20");
  });

  it("accepts supported filters and rejects ambiguous period values", () => {
    const valid = parseSeoReportInput(
      new URLSearchParams(
        "provider=yandex&period=180&device=mobile&query=%D1%81%D1%82%D0%B5%D0%BB%D0%BB%D0%B0%D0%B6"
      )
    );
    expect(valid).toEqual({
      ok: true,
      value: {
        provider: "yandex",
        period: 180,
        device: "mobile",
        query: "стеллаж"
      }
    });

    expect(
      parseSeoReportInput(new URLSearchParams("period=030"))
    ).toMatchObject({ ok: false });
    expect(
      parseSeoReportInput(new URLSearchParams("provider=bing"))
    ).toMatchObject({ ok: false });
  });
});

describe("SEO reporting configuration", () => {
  it("keeps persisted Yandex history disabled unless explicitly enabled", () => {
    expect(isYandexHistoryEnabled({})).toBe(false);
    expect(
      isYandexHistoryEnabled({ SEO_YANDEX_HISTORY_ENABLED: " true " })
    ).toBe(true);
    expect(
      isYandexHistoryEnabled({ SEO_YANDEX_HISTORY_ENABLED: "1" })
    ).toBe(false);
  });

  it("reports missing providers without creating placeholder credentials", () => {
    const config = readSeoReportingConfig({});
    expect(config.google).toEqual({
      configured: false,
      missing: [
        "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL",
        "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY",
        "GOOGLE_SEARCH_CONSOLE_SITE_URL"
      ]
    });
    expect(config.yandex).toMatchObject({
      configured: false,
      missing: [
        "YANDEX_WEBMASTER_OAUTH_TOKEN",
        "YANDEX_WEBMASTER_USER_ID",
        "YANDEX_WEBMASTER_HOST_ID"
      ]
    });
  });

  it("normalizes a service-account key and optional Yandex regions", () => {
    const config = readSeoReportingConfig({
      GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL: "seo@example.test",
      GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY: "line-1\\nline-2",
      GOOGLE_SEARCH_CONSOLE_SITE_URL: "sc-domain:example.test",
      YANDEX_WEBMASTER_OAUTH_TOKEN: "token",
      YANDEX_WEBMASTER_USER_ID: "42",
      YANDEX_WEBMASTER_HOST_ID: "https:example.test:443",
      YANDEX_WEBMASTER_REGION_IDS: "1, 225, invalid, 1"
    });

    expect(config.google).toEqual({
      configured: true,
      clientEmail: "seo@example.test",
      privateKey: "line-1\nline-2",
      siteUrl: "sc-domain:example.test"
    });
    expect(config.yandex).toMatchObject({
      configured: true,
      regionIds: [1, 225]
    });
  });

  it("rejects a Search Console property that belongs to another КБ Парус site", () => {
    const config = readSeoReportingConfig({
      GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL: "seo@example.test",
      GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY: "line-1\\nline-2",
      GOOGLE_SEARCH_CONSOLE_SITE_URL: "sc-domain:kbparus.ru"
    });

    expect(config.google).toEqual({
      configured: false,
      missing: [
        "GOOGLE_SEARCH_CONSOLE_SITE_URL (указан ресурс другого сайта КБ Парус)"
      ]
    });
  });
});

describe("SEO provider errors", () => {
  it("does not confuse an OAuth failure with missing Search Console property access", () => {
    expect(
      publicSeoProviderError(
        "Google Search Console",
        new SeoProviderError("Google OAuth не выдал токен доступа", 403)
      )
    ).toContain("учётные данные service account");

    expect(
      publicSeoProviderError(
        "Google Search Console",
        new SeoProviderError("Google Search Console не вернул отчёт", 403)
      )
    ).toContain("Доступ к ресурсу");

    expect(
      publicSeoProviderError(
        "Google Search Console",
        new SeoProviderError(
          "Google Search Console не подтвердил доступ к ресурсу",
          403,
          "SERVICE_DISABLED"
        )
      )
    ).toContain("API выключен");
  });
});

describe("SEO reporting aggregation", () => {
  it("weights average position by impressions and calculates CTR", () => {
    const metrics = aggregateSeoMetrics([
      observation({ clicks: 10, impressions: 100, position: 5 }),
      observation({ clicks: 5, impressions: 50, position: 20 })
    ]);

    expect(metrics).toEqual({
      clicks: 15,
      impressions: 150,
      ctr: 0.1,
      averagePosition: 10
    });
  });

  it("compares the same query with the previous period", () => {
    const window = buildSeoDateWindow(30, now);
    const rows = [
      observation({ date: "2026-07-10", position: 6 }),
      observation({ date: "2026-06-10", position: 10 })
    ];
    const metrics = buildSeoQueryMetrics(rows, window);

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      query: "металлические стеллажи",
      page: "https://kbparus-metal-storage.vercel.app/catalog/shelving",
      averagePosition: 6,
      previousAveragePosition: 10,
      positionImprovement: 4
    });
  });

  it("returns a transparent not-configured response with no demo rows", () => {
    const input: SeoReportInput = {
      provider: "google",
      period: 90,
      device: "all",
      query: ""
    };
    const report = buildSeoReportResponse({
      input,
      generatedAt: now,
      execution: {
        state: "not_configured",
        missing: ["GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL"]
      }
    });

    expect(report.status).toBe("not_configured");
    expect(report.queries).toEqual([]);
    expect(report.pages).toEqual([]);
    expect(report.countries).toEqual([]);
    expect(report.trend).toEqual([]);
    expect(report.setup).toEqual(["GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL"]);
    expect(report.summary.position).toBeNull();
  });

  it("returns real Google landing pages and country breakdowns", () => {
    const input: SeoReportInput = {
      provider: "google",
      period: 30,
      device: "all",
      query: ""
    };
    const report = buildSeoReportResponse({
      input,
      generatedAt: now,
      execution: {
        state: "ok",
        dataset: {
          summaryRows: [
            observation({ date: "2026-07-10", query: "", page: null })
          ],
          queryRows: [],
          pageRows: [
            observation({
              date: "2026-07-26",
              query: "",
              page: "https://example.test/catalog/racks",
              impressions: 80
            })
          ],
          countryRows: [
            {
              source: "google",
              date: "2026-07-26",
              country: "rus",
              clicks: 7,
              impressions: 90,
              position: 6
            }
          ],
          actualStart: "2026-07-10",
          actualEnd: "2026-07-10",
          providerAccessLevel: "siteRestrictedUser",
          truncated: false
        }
      }
    });

    expect(report.pages[0]).toMatchObject({
      page: "https://example.test/catalog/racks",
      impressions: 80
    });
    expect(report.countries[0]).toMatchObject({
      country: "rus",
      impressions: 90,
      position: 6
    });
    expect(report.googlePermissionLevel).toBe("siteRestrictedUser");
  });

  it("reports zero actual coverage when Yandex returned no rows", () => {
    const input: SeoReportInput = {
      provider: "yandex",
      period: 365,
      device: "tablet",
      query: ""
    };
    const report = buildSeoReportResponse({
      input,
      generatedAt: now,
      execution: {
        state: "ok",
        dataset: {
          summaryRows: [],
          queryRows: [],
          pageRows: [],
          actualStart: null,
          actualEnd: null,
          truncated: false
        }
      }
    });

    expect(report.status).toBe("empty");
    expect(report.coverageDays).toBe(0);
    expect(report.dateRange).toEqual({
      start: "2026-07-13",
      end: "2026-07-26"
    });
    expect(report.comparisonRange).toBeUndefined();
  });


  it("does not expose an incomplete previous-year comparison", () => {
    const input: SeoReportInput = {
      provider: "google",
      period: 365,
      device: "all",
      query: ""
    };
    const report = buildSeoReportResponse({
      input,
      generatedAt: now,
      execution: {
        state: "ok",
        dataset: {
          summaryRows: [],
          queryRows: [],
          pageRows: [],
          actualStart: null,
          actualEnd: null,
          truncated: false
        }
      }
    });

    expect(report.comparisonRange).toBeUndefined();
    expect(report.summary.previousClicks).toBeUndefined();
    expect(report.notices.join(" ")).toContain(
      "Сравнение с предыдущим годом отключено"
    );
  });
});
