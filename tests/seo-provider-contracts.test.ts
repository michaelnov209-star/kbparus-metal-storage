import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { fetchGoogleSearchConsoleDataset } from "@/lib/seo-reporting/providers/google-search-console";
import { fetchYandexWebmasterDataset } from "@/lib/seo-reporting/providers/yandex-webmaster";

function googleConfig(clientEmail: string) {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });
  return {
    configured: true as const,
    clientEmail,
    privateKey: privateKey.export({
      type: "pkcs8",
      format: "pem"
    }).toString(),
    siteUrl: "sc-domain:example.test"
  };
}

describe("Google Search Console provider contract", () => {
  it("separates property totals, queries and query-page detail", async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({ access_token: "google-token", expires_in: 3600 }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      const body = JSON.parse(String(init?.body)) as {
        startDate: string;
        dimensions: string[];
      };
      requestBodies.push(body);
      if (body.dimensions.join(",") === "date") {
        return new Response(
          JSON.stringify({
            rows: [
              {
                keys: ["2026-07-25"],
                clicks: 12,
                impressions: 120,
                position: 7
              },
              {
                keys: ["2026-07-26"],
                clicks: 0,
                impressions: 0,
                position: 3
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      if (body.dimensions.join(",") === "query,page") {
        return new Response(
          JSON.stringify({
            rows: [
              {
                keys: [
                  "стеллажи для металла",
                  "https://example.test/catalog/racks"
                ],
                clicks: 5,
                impressions: 70,
                position: 6
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      if (body.dimensions.join(",") === "page") {
        return new Response(
          JSON.stringify({
            rows: [
              {
                keys: ["https://example.test/catalog/racks"],
                clicks: 7,
                impressions: 90,
                position: 6.5
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      if (body.dimensions.join(",") === "country") {
        return new Response(
          JSON.stringify({
            rows: [
              {
                keys: ["rus"],
                clicks: 8,
                impressions: 100,
                position: 7
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          rows: [
            {
              keys: ["стеллажи для металла"],
              clicks: body.startDate === "2026-06-27" ? 8 : 4,
              impressions: body.startDate === "2026-06-27" ? 100 : 80,
              position: body.startDate === "2026-06-27" ? 6 : 10
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    const dataset = await fetchGoogleSearchConsoleDataset({
      config: googleConfig("seo-contract-1@example.test"),
      window: {
        currentStart: "2026-06-27",
        currentEnd: "2026-07-26",
        previousStart: "2026-05-28",
        previousEnd: "2026-06-26"
      },
      period: 30,
      device: "mobile",
      query: "стеллажи",
      fetchImpl: fetchMock as typeof fetch
    });

    expect(requestBodies).toHaveLength(6);
    expect(requestBodies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimensions: ["date"],
          aggregationType: "byProperty"
        }),
        expect.objectContaining({
          dimensions: ["query"],
          aggregationType: "byProperty"
        }),
        expect.objectContaining({
          dimensions: ["query", "page"],
          aggregationType: "byPage"
        }),
        expect.objectContaining({
          dimensions: ["page"],
          aggregationType: "byPage"
        }),
        expect.objectContaining({
          dimensions: ["country"],
          aggregationType: "byProperty"
        })
      ])
    );
    expect(dataset.summaryRows).toHaveLength(2);
    expect(dataset.summaryRows[1]?.position).toBeNull();
    expect(dataset.queryRows).toHaveLength(2);
    expect(dataset.queryRows[0]).toMatchObject({
      query: "стеллажи для металла",
      page: "https://example.test/catalog/racks"
    });
    expect(dataset.pageRows[0]).toMatchObject({
      page: "https://example.test/catalog/racks",
      impressions: 90
    });
    expect(dataset.countryRows?.[0]).toMatchObject({
      country: "rus",
      impressions: 100
    });
  });

  it("does not request an incomplete previous year", async () => {
    const searchBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({ access_token: "google-token-2", expires_in: 3600 }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      searchBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(JSON.stringify({ rows: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    await fetchGoogleSearchConsoleDataset({
      config: googleConfig("seo-contract-2@example.test"),
      window: {
        currentStart: "2025-07-27",
        currentEnd: "2026-07-26",
        previousStart: "2024-07-27",
        previousEnd: "2025-07-26"
      },
      period: 365,
      device: "all",
      query: "",
      fetchImpl: fetchMock as typeof fetch
    });

    expect(searchBodies).toHaveLength(5);
    expect(
      searchBodies.some((body) => body.startDate === "2024-07-27")
    ).toBe(false);
  });
});

describe("Yandex Webmaster provider contract", () => {
  it("sends supported filters and preserves the honest 14-day rows", async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        text_indicator: "QUERY" | "URL";
      };
      requestBodies.push(body);
      const isQuery = body.text_indicator === "QUERY";
      return new Response(
        JSON.stringify({
          count: 1,
          text_indicator_to_statistics: [
            {
              text_indicator: {
                type: isQuery ? "QUERY" : "URL",
                value: isQuery
                  ? "хранение листового металла"
                  : "https://example.test/catalog/sheet"
              },
              popular_complementary_indicator: {
                type: isQuery ? "URL" : "QUERY",
                value: isQuery
                  ? "https://example.test/catalog/sheet"
                  : "хранение листового металла"
              },
              statistics: [
                { date: "2026-07-26", field: "CLICKS", value: 3 },
                { date: "2026-07-26", field: "IMPRESSIONS", value: 40 },
                { date: "2026-07-26", field: "POSITION", value: 8 }
              ]
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    const dataset = await fetchYandexWebmasterDataset({
      config: {
        configured: true,
        oauthToken: "oauth",
        userId: "42",
        hostId: "https:example.test:443",
        regionIds: [1, 225]
      },
      startDate: "2026-07-13",
      endDate: "2026-07-26",
      device: "mobile",
      query: "лист",
      fetchImpl: fetchMock as typeof fetch
    });

    expect(requestBodies).toHaveLength(2);
    expect(requestBodies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text_indicator: "QUERY",
          device_type_indicator: "MOBILE",
          region_ids: [1, 225]
        }),
        expect.objectContaining({
          text_indicator: "URL",
          device_type_indicator: "MOBILE",
          region_ids: [1, 225]
        })
      ])
    );
    expect(dataset.summaryRows).toEqual(dataset.queryRows);
    expect(dataset.queryRows[0]).toMatchObject({
      query: "хранение листового металла",
      page: "https://example.test/catalog/sheet",
      position: 8
    });
  });
});
