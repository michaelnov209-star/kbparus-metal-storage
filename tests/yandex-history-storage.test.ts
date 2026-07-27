import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";

import {
  isYandexHistoryFresh,
  readYandexHistoryDataset,
  syncYandexHistoryDevice
} from "@/lib/seo-reporting/yandex-history";
import type { ConfiguredYandexWebmaster } from "@/lib/seo-reporting/types";

const config: ConfiguredYandexWebmaster = {
  configured: true,
  oauthToken: "test-token",
  userId: "1",
  hostId: "https:test.example:443",
  regionIds: []
};

type QueryMock = (
  sql: string,
  params?: unknown[]
) => Promise<{ rows: unknown[]; rowCount: number }>;

function emptyQueryResult(): { rows: unknown[]; rowCount: number } {
  return { rows: [], rowCount: 0 };
}

function createPool() {
  const clientQuery = vi.fn<QueryMock>(async () => emptyQueryResult());
  const release = vi.fn();
  const client = { query: clientQuery, release };
  const poolQuery = vi.fn<QueryMock>(async () => emptyQueryResult());
  const pool = {
    connect: vi.fn(async () => client),
    query: poolQuery
  } as unknown as Pool;
  return { pool, clientQuery, poolQuery, release };
}

function yandexResponse(itemCount = 1, count = itemCount): Response {
  const item = {
    text_indicator: { type: "QUERY", value: "металлический стеллаж" },
    popular_complementary_indicator: {
      type: "URL",
      value: "https://example.test/catalog"
    },
    statistics: [
      { date: "2026-07-27", field: "CLICKS", value: 2 },
      { date: "2026-07-27", field: "IMPRESSIONS", value: 20 },
      { date: "2026-07-27", field: "POSITION", value: 4.5 }
    ]
  };
  return new Response(
    JSON.stringify({
      count,
      text_indicator_to_statistics: Array.from(
        { length: itemCount },
        () => item
      )
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

describe("Yandex SEO history storage", () => {
  it("upserts a stable SHA-256 key and marks all 14 coverage days", async () => {
    const { pool, clientQuery } = createPool();
    const fetchImpl = vi.fn(async () => yandexResponse()) as unknown as typeof fetch;

    const first = await syncYandexHistoryDevice({
      pool,
      config,
      device: "all",
      now: new Date("2026-07-28T09:00:00.000Z"),
      fetchImpl
    });
    const second = await syncYandexHistoryDevice({
      pool,
      config,
      device: "all",
      now: new Date("2026-07-28T09:00:00.000Z"),
      fetchImpl
    });

    expect(first.coverageDates).toHaveLength(14);
    expect(first.coverageDates[0]).toBe("2026-07-14");
    expect(first.coverageDates.at(-1)).toBe("2026-07-27");
    expect(first.rowCount).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const upserts = clientQuery.mock.calls.filter(([sql]) =>
      String(sql).includes('INSERT INTO "seo_yandex_history"')
    );
    expect(upserts).toHaveLength(2);
    const firstKeys = (upserts[0]?.[1]?.[0] ?? []) as unknown[];
    const secondKeys = (upserts[1]?.[1]?.[0] ?? []) as unknown[];
    const firstKey = firstKeys[0];
    const secondKey = secondKeys[0];
    expect(firstKey).toMatch(/^[a-f0-9]{64}$/);
    expect(secondKey).toBe(firstKey);

    const syncDays = clientQuery.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO "seo_yandex_sync_days"')
    );
    expect(syncDays?.[1]?.[2]).toHaveLength(14);
    expect(second.truncated).toBe(false);
  });

  it("does not delete refreshed rows when the Yandex response is truncated", async () => {
    const { pool, clientQuery } = createPool();
    const fetchImpl = vi.fn(
      async () => yandexResponse(500, 10_001)
    ) as unknown as typeof fetch;

    const result = await syncYandexHistoryDevice({
      pool,
      config,
      device: "mobile",
      now: new Date("2026-07-28T09:00:00.000Z"),
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledTimes(20);
    expect(result.truncated).toBe(true);
    expect(
      clientQuery.mock.calls.some(([sql]) => {
        const statement = String(sql);
        return (
          statement.includes('DELETE FROM "seo_yandex_history"') &&
          statement.includes('"device" = $1')
        );
      })
    ).toBe(false);
    const syncDays = clientQuery.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO "seo_yandex_sync_days"')
    );
    expect(syncDays?.[1]?.[1]).toBe(true);
  });

  it("returns zero-row coverage dates and collection freshness", async () => {
    const { pool, poolQuery } = createPool();
    poolQuery.mockImplementation(async (sql: unknown) => {
      const statement = String(sql);
      if (statement.includes('FROM "seo_yandex_history"')) {
        return { rows: [], rowCount: 0 };
      }
      if (statement.includes('max("synced_at")')) {
        return {
          rows: [{ last_collected_at: "2026-07-28T03:00:00.000Z" }],
          rowCount: 1
        };
      }
      return {
        rows: [
          {
            date: "2026-07-26",
            synced_at: "2026-07-28T03:00:00.000Z",
            truncated: false
          },
          {
            date: "2026-07-27",
            synced_at: "2026-07-28T03:00:00.000Z",
            truncated: false
          }
        ],
        rowCount: 2
      };
    });

    const result = await readYandexHistoryDataset({
      pool,
      window: {
        previousStart: "2026-07-24",
        previousEnd: "2026-07-25",
        currentStart: "2026-07-26",
        currentEnd: "2026-07-27"
      },
      device: "desktop"
    });

    expect(result.coverageDates).toEqual(["2026-07-26", "2026-07-27"]);
    expect(result.dataset.actualStart).toBe("2026-07-26");
    expect(result.dataset.actualEnd).toBe("2026-07-27");
    expect(result.dataset.queryRows).toEqual([]);
    expect(result.lastCollectedAt).toBe("2026-07-28T03:00:00.000Z");
    expect(String(poolQuery.mock.calls[0]?.[0])).toContain('GROUP BY "date"');
    expect(String(poolQuery.mock.calls[1]?.[0])).toContain(
      "queries.query_rank <= $7"
    );
  });

  it("checks freshness in Postgres without calling the provider", async () => {
    const { pool, poolQuery } = createPool();
    poolQuery.mockResolvedValue({ rows: [{ fresh: true }], rowCount: 1 });

    await expect(isYandexHistoryFresh(pool, "tablet", 15)).resolves.toBe(true);
    expect(String(poolQuery.mock.calls[0]?.[0])).toContain(
      'max("synced_at")'
    );
    expect(poolQuery.mock.calls[0]?.[1]).toEqual(["tablet", 15]);
  });
});