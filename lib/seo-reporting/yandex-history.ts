import { createHash } from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";

import { shiftIsoDate, toIsoDateInTimeZone } from "./dates";
import { publicSeoProviderError } from "./providers/errors";
import { fetchYandexWebmasterDataset } from "./providers/yandex-webmaster";
import type {
  ConfiguredYandexWebmaster,
  SeoDateWindow,
  SeoObservation,
  SeoReportDevice,
  SeoSourceDataset
} from "./types";

const YANDEX_HISTORY_DEVICES = [
  "all",
  "desktop",
  "mobile",
  "tablet"
] as const satisfies readonly SeoReportDevice[];
const REFRESH_DAYS = 14;
const RETENTION_DAYS = 400;
const UPSERT_BATCH_SIZE = 500;
const QUERY_BUCKET_LIMIT = 2000;

type CollectionTrigger = "cron" | "admin";
type CollectionStatus = "success" | "partial" | "failed";

type HistoryRow = {
  rowKey: string;
  date: string;
  device: SeoReportDevice;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  position: number | null;
};

type SyncWindow = {
  startDate: string;
  endDate: string;
  retentionStart: string;
};

export type SyncYandexHistoryDeviceOptions = {
  pool: Pool;
  config: ConfiguredYandexWebmaster;
  device: SeoReportDevice;
  now?: Date;
  fetchImpl?: typeof fetch;
};

export type SyncYandexHistoryDeviceResult = {
  device: SeoReportDevice;
  windowStart: string;
  windowEnd: string;
  rowCount: number;
  coverageDates: string[];
  truncated: boolean;
};

export type ReadYandexHistoryDatasetOptions = {
  pool: Pool;
  window: SeoDateWindow;
  device: SeoReportDevice;
  query?: string;
};

export type ReadYandexHistoryDatasetResult = {
  dataset: SeoSourceDataset;
  coverageDates: string[];
  lastCollectedAt: string | null;
};

export type CollectYandexHistoryOptions = {
  pool: Pool;
  config: ConfiguredYandexWebmaster;
  trigger: CollectionTrigger;
  devices?: readonly SeoReportDevice[];
  now?: Date;
  fetchImpl?: typeof fetch;
};

export type CollectYandexHistoryResult = {
  runId: string;
  status: CollectionStatus;
  windowStart: string;
  windowEnd: string;
  devices: SeoReportDevice[];
  completedDevices: SeoReportDevice[];
  rowCount: number;
  truncated: boolean;
  errors: Array<{ device: SeoReportDevice; message: string }>;
};

type StoredMetricRow = QueryResultRow & {
  clicks: string | number;
  impressions: string | number;
  position: number | string | null;
};

type StoredDailySummaryRow = StoredMetricRow & {
  date: string;
};

type StoredQueryBucketRow = StoredMetricRow & {
  bucket: "current" | "previous";
  query: string;
  page: string | null;
  bucket_count: string | number;
};
type StoredSyncDay = QueryResultRow & {
  date: string;
  synced_at: Date | string;
  truncated: boolean;
};

function buildSyncWindow(now: Date): SyncWindow {
  const today = toIsoDateInTimeZone(now, "Europe/Moscow");
  const endDate = shiftIsoDate(today, -1);
  const startDate = shiftIsoDate(endDate, -(REFRESH_DAYS - 1));

  return {
    startDate,
    endDate,
    retentionStart: shiftIsoDate(endDate, -(RETENTION_DAYS - 1))
  };
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  for (
    let date = startDate;
    date <= endDate;
    date = shiftIsoDate(date, 1)
  ) {
    dates.push(date);
  }
  return dates;
}

function assertIsoDate(value: string, name: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${name} must be an ISO date`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new TypeError(`${name} must be a valid date`);
  }
}

function assertDevice(device: SeoReportDevice): void {
  if (!YANDEX_HISTORY_DEVICES.includes(device)) {
    throw new TypeError("Unsupported SEO device");
  }
}

function safeCount(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Invalid ${field} returned by Yandex Webmaster`);
  }
  return value;
}

function historyRowKey(
  date: string,
  device: SeoReportDevice,
  query: string,
  page: string
): string {
  return createHash("sha256")
    .update(JSON.stringify([date, device, query, page]), "utf8")
    .digest("hex");
}

function normalizeHistoryRows(
  rows: readonly SeoObservation[],
  device: SeoReportDevice,
  startDate: string,
  endDate: string
): HistoryRow[] {
  const unique = new Map<string, HistoryRow>();

  for (const row of rows) {
    if (row.date < startDate || row.date > endDate || !row.query.trim()) {
      continue;
    }
    const page = row.page ?? "";
    const rowKey = historyRowKey(row.date, device, row.query, page);
    unique.set(rowKey, {
      rowKey,
      date: row.date,
      device,
      query: row.query,
      page,
      clicks: safeCount(row.clicks, "click count"),
      impressions: safeCount(row.impressions, "impression count"),
      position:
        row.position !== null &&
        Number.isFinite(row.position) &&
        row.position > 0
          ? row.position
          : null
    });
  }

  return Array.from(unique.values());
}

async function upsertHistoryBatch(
  client: PoolClient,
  rows: readonly HistoryRow[]
): Promise<void> {
  if (rows.length === 0) return;

  await client.query(
    `
      INSERT INTO "seo_yandex_history" (
        "row_key", "date", "device", "query", "page",
        "clicks", "impressions", "position", "updated_at"
      )
      SELECT
        incoming.row_key, incoming.date, incoming.device, incoming.query,
        incoming.page, incoming.clicks, incoming.impressions,
        incoming.position, now()
      FROM unnest(
        $1::varchar[], $2::date[], $3::varchar[], $4::text[],
        $5::text[], $6::bigint[], $7::bigint[], $8::double precision[]
      ) AS incoming(
        row_key, date, device, query, page, clicks, impressions, position
      )
      ON CONFLICT ("row_key") DO UPDATE SET
        "clicks" = EXCLUDED."clicks",
        "impressions" = EXCLUDED."impressions",
        "position" = EXCLUDED."position",
        "updated_at" = now()
    `,
    [
      rows.map((row) => row.rowKey),
      rows.map((row) => row.date),
      rows.map((row) => row.device),
      rows.map((row) => row.query),
      rows.map((row) => row.page),
      rows.map((row) => String(row.clicks)),
      rows.map((row) => String(row.impressions)),
      rows.map((row) => row.position)
    ]
  );
}

async function replaceHistoryWindow(
  client: PoolClient,
  rows: readonly HistoryRow[],
  device: SeoReportDevice,
  window: SyncWindow,
  truncated: boolean
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += UPSERT_BATCH_SIZE) {
    await upsertHistoryBatch(
      client,
      rows.slice(offset, offset + UPSERT_BATCH_SIZE)
    );
  }

  if (truncated) return;

  const rowKeys = rows.map((row) => row.rowKey);
  if (rowKeys.length === 0) {
    await client.query(
      `
        DELETE FROM "seo_yandex_history"
        WHERE "device" = $1
          AND "date" BETWEEN $2::date AND $3::date
      `,
      [device, window.startDate, window.endDate]
    );
    return;
  }

  await client.query(
    `
      DELETE FROM "seo_yandex_history"
      WHERE "device" = $1
        AND "date" BETWEEN $2::date AND $3::date
        AND NOT ("row_key" = ANY($4::varchar[]))
    `,
    [device, window.startDate, window.endDate, rowKeys]
  );
}

async function markSyncDays(
  client: PoolClient,
  rows: readonly HistoryRow[],
  device: SeoReportDevice,
  window: SyncWindow,
  truncated: boolean
): Promise<string[]> {
  const coverageDates = enumerateDates(window.startDate, window.endDate);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.date, (counts.get(row.date) ?? 0) + 1);
  }

  await client.query(
    `
      INSERT INTO "seo_yandex_sync_days" (
        "date", "device", "synced_at", "row_count", "truncated"
      )
      SELECT incoming.date, $1, now(), incoming.row_count, $2
      FROM unnest($3::date[], $4::integer[]) AS incoming(date, row_count)
      ON CONFLICT ("date", "device") DO UPDATE SET
        "synced_at" = now(),
        "row_count" = EXCLUDED."row_count",
        "truncated" = EXCLUDED."truncated"
    `,
    [
      device,
      truncated,
      coverageDates,
      coverageDates.map((date) => counts.get(date) ?? 0)
    ]
  );

  return coverageDates;
}

async function applyRetention(
  client: PoolClient,
  retentionStart: string
): Promise<void> {
  await client.query(
    `DELETE FROM "seo_yandex_history" WHERE "date" < $1::date`,
    [retentionStart]
  );
  await client.query(
    `DELETE FROM "seo_yandex_sync_days" WHERE "date" < $1::date`,
    [retentionStart]
  );
  await client.query(
    `DELETE FROM "seo_yandex_collection_runs" WHERE "started_at" < $1::date`,
    [retentionStart]
  );
}

export async function syncYandexHistoryDevice({
  pool,
  config,
  device,
  now = new Date(),
  fetchImpl = fetch
}: SyncYandexHistoryDeviceOptions): Promise<SyncYandexHistoryDeviceResult> {
  assertDevice(device);
  const window = buildSyncWindow(now);
  const dataset = await fetchYandexWebmasterDataset({
    config,
    startDate: window.startDate,
    endDate: window.endDate,
    device,
    query: "",
    fetchImpl,
    includePages: false
  });
  const rows = normalizeHistoryRows(
    dataset.queryRows,
    device,
    window.startDate,
    window.endDate
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await replaceHistoryWindow(
      client,
      rows,
      device,
      window,
      dataset.truncated
    );
    const coverageDates = await markSyncDays(
      client,
      rows,
      device,
      window,
      dataset.truncated
    );
    await applyRetention(client, window.retentionStart);
    await client.query("COMMIT");

    return {
      device,
      windowStart: window.startDate,
      windowEnd: window.endDate,
      rowCount: rows.length,
      coverageDates,
      truncated: dataset.truncated
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function storedNumber(value: string | number, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new TypeError(`Invalid ${field} stored in SEO history`);
  }
  return parsed;
}

function storedPosition(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isoTimestamp(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export async function isYandexHistoryFresh(
  pool: Pool,
  device: SeoReportDevice,
  maxAgeMinutes = 15
): Promise<boolean> {
  assertDevice(device);
  if (!Number.isFinite(maxAgeMinutes) || maxAgeMinutes <= 0) {
    throw new RangeError("maxAgeMinutes must be a positive number");
  }

  const result = await pool.query<QueryResultRow & { fresh: boolean }>(
    `
      SELECT coalesce(
        max("synced_at") >=
          now() - ($2::double precision * interval '1 minute'),
        false
      ) AS "fresh"
      FROM "seo_yandex_sync_days"
      WHERE "device" = $1
    `,
    [device, maxAgeMinutes]
  );
  return result.rows[0]?.fresh === true;
}

export async function readYandexHistoryDataset({
  pool,
  window,
  device,
  query = ""
}: ReadYandexHistoryDatasetOptions): Promise<ReadYandexHistoryDatasetResult> {
  assertIsoDate(window.currentStart, "window.currentStart");
  assertIsoDate(window.currentEnd, "window.currentEnd");
  assertIsoDate(window.previousStart, "window.previousStart");
  assertIsoDate(window.previousEnd, "window.previousEnd");
  assertDevice(device);
  if (
    window.previousStart > window.previousEnd ||
    window.previousEnd >= window.currentStart ||
    window.currentStart > window.currentEnd
  ) {
    throw new RangeError("Invalid SEO date window");
  }
  const normalizedQuery = query.trim();
  if (normalizedQuery.length > 200) {
    throw new RangeError("query must not exceed 200 characters");
  }

  const [summaryResult, queryResult, coverageResult, freshnessResult] =
    await Promise.all([
      pool.query<StoredDailySummaryRow>(
        `
          SELECT
            "date"::text,
            sum("clicks")::text AS "clicks",
            sum("impressions")::text AS "impressions",
            CASE
              WHEN sum("impressions") FILTER (
                WHERE "position" IS NOT NULL AND "impressions" > 0
              ) > 0
              THEN sum("position" * "impressions"::double precision) FILTER (
                WHERE "position" IS NOT NULL AND "impressions" > 0
              ) / sum("impressions") FILTER (
                WHERE "position" IS NOT NULL AND "impressions" > 0
              )
              ELSE NULL
            END AS "position"
          FROM "seo_yandex_history"
          WHERE "device" = $1
            AND "date" BETWEEN $2::date AND $3::date
            AND ($4 = '' OR position(lower($4) in lower("query")) > 0)
          GROUP BY "date"
          ORDER BY "date" ASC
        `,
        [
          device,
          window.previousStart,
          window.currentEnd,
          normalizedQuery
        ]
      ),
      pool.query<StoredQueryBucketRow>(
        `
          WITH filtered AS (
            SELECT
              CASE
                WHEN "date" BETWEEN $2::date AND $3::date THEN 'current'
                WHEN "date" BETWEEN $4::date AND $5::date THEN 'previous'
                ELSE NULL
              END AS bucket,
              "query",
              "page",
              "clicks",
              "impressions",
              "position"
            FROM "seo_yandex_history"
            WHERE "device" = $1
              AND "date" BETWEEN $4::date AND $3::date
              AND ($6 = '' OR position(lower($6) in lower("query")) > 0)
          ),
          query_totals AS (
            SELECT
              bucket,
              "query",
              sum("clicks") AS "clicks",
              sum("impressions") AS "impressions",
              CASE
                WHEN sum("impressions") FILTER (
                  WHERE "position" IS NOT NULL AND "impressions" > 0
                ) > 0
                THEN sum("position" * "impressions"::double precision) FILTER (
                  WHERE "position" IS NOT NULL AND "impressions" > 0
                ) / sum("impressions") FILTER (
                  WHERE "position" IS NOT NULL AND "impressions" > 0
                )
                ELSE NULL
              END AS "position"
            FROM filtered
            WHERE bucket IS NOT NULL
            GROUP BY bucket, "query"
          ),
          ranked_queries AS (
            SELECT
              *,
              count(*) OVER (PARTITION BY bucket) AS bucket_count,
              row_number() OVER (
                PARTITION BY bucket
                ORDER BY "impressions" DESC, "clicks" DESC, "query" ASC
              ) AS query_rank
            FROM query_totals
          ),
          page_totals AS (
            SELECT
              bucket,
              "query",
              "page",
              sum("impressions") AS "impressions",
              sum("clicks") AS "clicks"
            FROM filtered
            WHERE bucket IS NOT NULL AND "page" <> ''
            GROUP BY bucket, "query", "page"
          ),
          ranked_pages AS (
            SELECT
              *,
              row_number() OVER (
                PARTITION BY bucket, "query"
                ORDER BY "impressions" DESC, "clicks" DESC, "page" ASC
              ) AS page_rank
            FROM page_totals
          )
          SELECT
            queries.bucket,
            queries."query",
            pages."page",
            queries."clicks"::text AS "clicks",
            queries."impressions"::text AS "impressions",
            queries."position",
            queries.bucket_count::text AS bucket_count
          FROM ranked_queries AS queries
          LEFT JOIN ranked_pages AS pages
            ON pages.bucket = queries.bucket
            AND pages."query" = queries."query"
            AND pages.page_rank = 1
          WHERE queries.query_rank <= $7
          ORDER BY
            queries.bucket ASC,
            queries."impressions" DESC,
            queries."query" ASC
        `,
        [
          device,
          window.currentStart,
          window.currentEnd,
          window.previousStart,
          window.previousEnd,
          normalizedQuery,
          QUERY_BUCKET_LIMIT
        ]
      ),
      pool.query<StoredSyncDay>(
        `
          SELECT "date"::text, "synced_at", "truncated"
          FROM "seo_yandex_sync_days"
          WHERE "device" = $1
            AND "date" BETWEEN $2::date AND $3::date
          ORDER BY "date" ASC
        `,
        [device, window.previousStart, window.currentEnd]
      ),
      pool.query<QueryResultRow & { last_collected_at: Date | string | null }>(
        `
          SELECT max("synced_at") AS "last_collected_at"
          FROM "seo_yandex_sync_days"
          WHERE "device" = $1
        `,
        [device]
      )
    ]);

  const summaryRows: SeoObservation[] = summaryResult.rows.map((row) => ({
    source: "yandex",
    date: row.date,
    query: "",
    page: null,
    device,
    clicks: storedNumber(row.clicks, "click count"),
    impressions: storedNumber(row.impressions, "impression count"),
    position: storedPosition(row.position)
  }));
  const queryRows: SeoObservation[] = queryResult.rows.map((row) => ({
    source: "yandex",
    date:
      row.bucket === "current"
        ? window.currentStart
        : window.previousStart,
    query: row.query,
    page: row.page || null,
    device,
    clicks: storedNumber(row.clicks, "click count"),
    impressions: storedNumber(row.impressions, "impression count"),
    position: storedPosition(row.position)
  }));
  const coverageDates = coverageResult.rows.map((row) => row.date);
  const syncTruncated = coverageResult.rows.some((row) => row.truncated);
  const detailTruncated = queryResult.rows.some(
    (row) => storedNumber(row.bucket_count, "query bucket count") > QUERY_BUCKET_LIMIT
  );
  const actualStart = coverageDates[0] ?? summaryRows[0]?.date ?? null;
  const actualEnd = coverageDates.at(-1) ?? summaryRows.at(-1)?.date ?? null;

  return {
    dataset: {
      summaryRows,
      queryRows,
      pageRows: [],
      actualStart,
      actualEnd,
      truncated: syncTruncated || detailTruncated
    },
    coverageDates,
    lastCollectedAt: isoTimestamp(
      freshnessResult.rows[0]?.last_collected_at
    )
  };
}
async function insertCollectionRun(
  pool: Pool,
  trigger: CollectionTrigger,
  devices: readonly SeoReportDevice[],
  window: SyncWindow
): Promise<string> {
  const result = await pool.query<QueryResultRow & { id: string | number }>(
    `
      INSERT INTO "seo_yandex_collection_runs" (
        "trigger", "status", "window_start", "window_end", "devices"
      )
      VALUES ($1, 'running', $2::date, $3::date, $4::text[])
      RETURNING "id"
    `,
    [trigger, window.startDate, window.endDate, devices]
  );
  const id = result.rows[0]?.id;
  if (id === undefined) {
    throw new Error("SEO collection run was not created");
  }
  return String(id);
}

async function finishCollectionRun(
  pool: Pool,
  runId: string,
  status: CollectionStatus,
  rowCount: number,
  truncated: boolean,
  errors: readonly { device: SeoReportDevice; message: string }[]
): Promise<void> {
  await pool.query(
    `
      UPDATE "seo_yandex_collection_runs"
      SET "status" = $2,
          "finished_at" = now(),
          "row_count" = $3,
          "truncated" = $4,
          "error" = $5
      WHERE "id" = $1::bigint
    `,
    [
      runId,
      status,
      rowCount,
      truncated,
      errors.length > 0
        ? errors
            .map((item) => `${item.device}: ${item.message}`)
            .join("; ")
            .slice(0, 2000)
        : null
    ]
  );
}

export async function collectYandexHistory({
  pool,
  config,
  trigger,
  devices = YANDEX_HISTORY_DEVICES,
  now = new Date(),
  fetchImpl = fetch
}: CollectYandexHistoryOptions): Promise<CollectYandexHistoryResult> {
  const normalizedDevices = Array.from(new Set(devices));
  if (normalizedDevices.length === 0) {
    throw new TypeError("At least one SEO device is required");
  }
  for (const device of normalizedDevices) assertDevice(device);

  const window = buildSyncWindow(now);
  const runId = await insertCollectionRun(
    pool,
    trigger,
    normalizedDevices,
    window
  );
  const completedDevices: SeoReportDevice[] = [];
  const errors: Array<{ device: SeoReportDevice; message: string }> = [];
  let rowCount = 0;
  let truncated = false;

  for (const device of normalizedDevices) {
    try {
      const result = await syncYandexHistoryDevice({
        pool,
        config,
        device,
        now,
        fetchImpl
      });
      completedDevices.push(device);
      rowCount += result.rowCount;
      truncated ||= result.truncated;
    } catch (error) {
      console.error("[seo-reporting] Yandex history sync failed for %s", device, error);
      errors.push({
        device,
        message: publicSeoProviderError("Яндекс Вебмастер", error)
      });
    }
  }

  const status: CollectionStatus =
    completedDevices.length === 0
      ? "failed"
      : errors.length > 0 || truncated
        ? "partial"
        : "success";
  await finishCollectionRun(
    pool,
    runId,
    status,
    rowCount,
    truncated,
    errors
  );

  return {
    runId,
    status,
    windowStart: window.startDate,
    windowEnd: window.endDate,
    devices: normalizedDevices,
    completedDevices,
    rowCount,
    truncated,
    errors
  };
}
