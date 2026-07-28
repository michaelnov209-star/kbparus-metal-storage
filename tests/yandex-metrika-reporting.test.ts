import { describe, expect, it, vi } from "vitest";

import {
  getYandexMetrikaConversionReport,
  matchYandexMetrikaActionGoals,
  parseYandexMetrikaPeriod,
  readYandexMetrikaConfig
} from "@/lib/seo-reporting/yandex-metrika";

const now = new Date("2026-07-27T21:30:00.000Z");

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function configuredEnv(counterId: number) {
  return {
    YANDEX_METRIKA_OAUTH_TOKEN: `token-${counterId}`,
    YANDEX_METRIKA_COUNTER_ID: String(counterId)
  };
}

function goalsPayload() {
  return {
    goals: [
      {
        id: 101,
        name: "Клик по телефону",
        type: "action",
        conditions: [{ type: "exact", url: "phone_click" }]
      },
      {
        id: 102,
        name: "Отправка формы",
        type: "action",
        conditions: [{ type: "action", url: "form_submit" }]
      },
      {
        id: 103,
        name: "Успешная заявка",
        type: "action",
        conditions: [{ type: "exact", url: "lead_submit_success" }]
      },
      {
        id: 104,
        name: "Клик по мессенджеру",
        type: "action",
        conditions: [{ type: "exact", url: "messenger_click" }]
      },
      {
        id: 105,
        name: "Клик по email",
        type: "action",
        conditions: [{ type: "exact", url: "email_click" }]
      },
      {
        id: 106,
        name: "Calculator start",
        type: "action",
        conditions: [{ type: "exact", url: "calculator_start" }]
      },
      {
        id: 99,
        name: "Не action-цель",
        type: "url",
        conditions: [{ type: "exact", url: "phone_click" }]
      }
    ]
  };
}

function reportingPayload(current: boolean) {
  const multiplier = current ? 1 : 0.5;
  const values = [
    100,
    12,
    10,
    10,
    8,
    7,
    7,
    6,
    5,
    5,
    4,
    4,
    4,
    2,
    2,
    2,
    3,
    2,
    2
  ].map((value) => value * multiplier);

  return {
    totals: values,
    data: [
      {
        dimensions: [
          { id: current ? "2026-07-28" : "2026-06-28", name: "ignored" }
        ],
        metrics: values
      }
    ],
    sampled: false,
    sample_share: 1,
    sample_size: 1000,
    sample_space: 1000,
    data_lag: 0,
    contains_sensitive_data: false,
    total_rows: 1
  };
}

describe("Yandex Metrika conversion reporting", () => {
  it("uses the private counter id first and falls back to the public id", () => {
    expect(
      readYandexMetrikaConfig({
        YANDEX_METRIKA_OAUTH_TOKEN: " oauth ",
        YANDEX_METRIKA_COUNTER_ID: "111",
        NEXT_PUBLIC_YANDEX_METRIKA_ID: "222"
      })
    ).toEqual({
      configured: true,
      oauthToken: "oauth",
      counterId: 111
    });

    expect(
      readYandexMetrikaConfig({
        YANDEX_METRIKA_OAUTH_TOKEN: "oauth",
        NEXT_PUBLIC_YANDEX_METRIKA_ID: "222"
      })
    ).toMatchObject({ configured: true, counterId: 222 });
  });

  it("returns a transparent not-configured state without calling Yandex", async () => {
    const fetchMock = vi.fn();
    const report = await getYandexMetrikaConversionReport({
      period: 30,
      now,
      env: {},
      fetchImpl: fetchMock
    });

    expect(report).toMatchObject({
      status: "not_configured",
      missing: [
        "YANDEX_METRIKA_OAUTH_TOKEN",
        "YANDEX_METRIKA_COUNTER_ID or NEXT_PUBLIC_YANDEX_METRIKA_ID"
      ]
    });
    expect(report).not.toHaveProperty("visits");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("matches only action goals by their condition identifier", () => {
    expect(matchYandexMetrikaActionGoals(goalsPayload().goals)).toEqual([
      {
        key: "phone_click",
        id: 101,
        name: "Клик по телефону",
        conditionIdentifier: "phone_click"
      },
      {
        key: "form_submit",
        id: 102,
        name: "Отправка формы",
        conditionIdentifier: "form_submit"
      },
      {
        key: "lead_submit_success",
        id: 103,
        name: "Успешная заявка",
        conditionIdentifier: "lead_submit_success"
      },
      {
        key: "messenger_click",
        id: 104,
        name: "Клик по мессенджеру",
        conditionIdentifier: "messenger_click"
      },
      {
        key: "email_click",
        id: 105,
        name: "Клик по email",
        conditionIdentifier: "email_click"
      },
      {
        key: "calculator_start",
        id: 106,
        name: "Calculator start",
        conditionIdentifier: "calculator_start"
      }
    ]);
  });

  it("returns current and previous conversions, daily trends and sampling", async () => {
    const requestUrls: URL[] = [];
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      requestUrls.push(url);
      if (url.pathname.endsWith("/goals")) {
        return jsonResponse(goalsPayload());
      }
      return jsonResponse(
        reportingPayload(url.searchParams.get("date1") === "2026-06-29")
      );
    });

    const report = await getYandexMetrikaConversionReport({
      period: 30,
      now,
      env: configuredEnv(900001),
      fetchImpl: fetchMock
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(report).toMatchObject({
      status: "ready",
      counterId: 900001,
      dateRange: { start: "2026-06-29", end: "2026-07-28" },
      comparisonRange: { start: "2026-05-30", end: "2026-06-28" },
      visits: { current: 100, previous: 50 },
      missingGoalKeys: [],
      sampling: {
        current: {
          accuracy: "full",
          sampled: false,
          sampleShare: 1,
          totalRows: 1
        }
      }
    });
    if (report.status !== "ready") throw new Error("Expected ready report");
    expect(report.goals[0]).toMatchObject({
      key: "phone_click",
      current: {
        visits: 100,
        reaches: 12,
        convertedVisits: 10,
        conversionRate: 10
      },
      previous: {
        visits: 50,
        reaches: 6,
        convertedVisits: 5,
        conversionRate: 5
      }
    });
    expect(report.trend.current[0]).toMatchObject({
      date: "2026-07-28",
      visits: 100,
      goals: {
        lead_submit_success: {
          reaches: 6,
          convertedVisits: 5,
          conversionRate: 5
        }
      }
    });

    const reportingUrls = requestUrls.filter((url) =>
      url.pathname.endsWith("/data")
    );
    expect(reportingUrls).toHaveLength(2);
    expect(reportingUrls[0]?.searchParams.get("accuracy")).toBe("full");
    expect(reportingUrls[0]?.searchParams.get("metrics")).toContain(
      "ym:s:goal106conversionRate"
    );
  });

  it("returns an explicit permission error without false zero metrics", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ errors: [{ message: "forbidden" }] }, 403)
    );
    const report = await getYandexMetrikaConversionReport({
      period: 90,
      now,
      env: configuredEnv(900002),
      fetchImpl: fetchMock
    });

    expect(report.status).toBe("permission_error");
    expect(report).not.toHaveProperty("visits");
    expect(report).not.toHaveProperty("goals");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("deduplicates concurrent requests and caches a ready report", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      await Promise.resolve();
      return url.pathname.endsWith("/goals")
        ? jsonResponse(goalsPayload())
        : jsonResponse(
            reportingPayload(url.searchParams.get("date1") === "2026-06-29")
          );
    });
    const options = {
      period: 30 as const,
      now,
      env: configuredEnv(900003),
      fetchImpl: fetchMock
    };

    const [first, second] = await Promise.all([
      getYandexMetrikaConversionReport(options),
      getYandexMetrikaConversionReport(options)
    ]);
    const third = await getYandexMetrikaConversionReport(options);

    expect(first).toBe(second);
    expect(third).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("bypasses the ready cache on force refresh and keeps in-flight deduplication", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      await Promise.resolve();
      return url.pathname.endsWith("/goals")
        ? jsonResponse(goalsPayload())
        : jsonResponse(
            reportingPayload(url.searchParams.get("date1") === "2026-06-29")
          );
    });
    const options = {
      period: 30 as const,
      now,
      env: configuredEnv(900004),
      fetchImpl: fetchMock,
      forceRefresh: true
    };

    await getYandexMetrikaConversionReport(options);
    const [firstRefresh, secondRefresh] = await Promise.all([
      getYandexMetrikaConversionReport(options),
      getYandexMetrikaConversionReport(options)
    ]);

    expect(firstRefresh).toBe(secondRefresh);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("accepts only supported unambiguous periods", () => {
    expect(
      parseYandexMetrikaPeriod(new URLSearchParams("period=365"))
    ).toEqual({ ok: true, value: 365 });
    expect(
      parseYandexMetrikaPeriod(new URLSearchParams("period=030"))
    ).toMatchObject({ ok: false });
    expect(
      parseYandexMetrikaPeriod(new URLSearchParams("period=31"))
    ).toMatchObject({ ok: false });
  });
});
