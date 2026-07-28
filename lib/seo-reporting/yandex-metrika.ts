import { createHash } from "node:crypto";

import { shiftIsoDate, toIsoDateInTimeZone } from "./dates";
import {
  SEO_REPORT_PERIODS,
  type SeoDateWindow,
  type SeoReportPeriod
} from "./types";

const GOALS_API_BASE = "https://api-metrika.yandex.net/management/v1";
const REPORTING_API_URL = "https://api-metrika.yandex.net/stat/v1/data";
const REPORT_CACHE_TTL_MS = 15 * 60 * 1000;
const REPORT_CACHE_MAX_ENTRIES = 32;
const REQUEST_TIMEOUT_MS = 25_000;

export const YANDEX_METRIKA_REQUIRED_GOALS = [
  "phone_click",
  "form_submit",
  "lead_submit_success",
  "messenger_click"
] as const;

export const YANDEX_METRIKA_OPTIONAL_GOALS = [
  "email_click",
  "calculator_start"
] as const;

const TARGET_GOALS = [
  ...YANDEX_METRIKA_REQUIRED_GOALS,
  ...YANDEX_METRIKA_OPTIONAL_GOALS
] as const;

export type YandexMetrikaGoalKey = (typeof TARGET_GOALS)[number];

export type YandexMetrikaGoalMetadata = {
  key: YandexMetrikaGoalKey;
  id: number;
  name: string;
  conditionIdentifier: YandexMetrikaGoalKey;
};

export type YandexMetrikaGoalMetrics = {
  visits: number | null;
  reaches: number | null;
  convertedVisits: number | null;
  conversionRate: number | null;
};

export type YandexMetrikaGoalReport = YandexMetrikaGoalMetadata & {
  current: YandexMetrikaGoalMetrics;
  previous: YandexMetrikaGoalMetrics;
};

export type YandexMetrikaSamplingMetadata = {
  accuracy: "full";
  sampled: boolean | null;
  sampleShare: number | null;
  sampleSize: number | null;
  sampleSpace: number | null;
  dataLag: number | null;
  containsSensitiveData: boolean | null;
  totalRows: number | null;
};

export type YandexMetrikaDailyPoint = {
  date: string;
  visits: number | null;
  goals: Partial<
    Record<
      YandexMetrikaGoalKey,
      Omit<YandexMetrikaGoalMetrics, "visits">
    >
  >;
};

type ReportContext = {
  period: SeoReportPeriod;
  generatedAt: string;
};

export type YandexMetrikaReadyReport = ReportContext & {
  status: "ready";
  counterId: number;
  dateRange: {
    start: string;
    end: string;
  };
  comparisonRange: {
    start: string;
    end: string;
  };
  visits: {
    current: number | null;
    previous: number | null;
  };
  goals: YandexMetrikaGoalReport[];
  missingGoalKeys: YandexMetrikaGoalKey[];
  trend: {
    current: YandexMetrikaDailyPoint[];
    previous: YandexMetrikaDailyPoint[];
  };
  sampling: {
    current: YandexMetrikaSamplingMetadata;
    previous: YandexMetrikaSamplingMetadata;
  };
};

export type YandexMetrikaNotConfiguredReport = ReportContext & {
  status: "not_configured";
  message: string;
  missing: string[];
};

export type YandexMetrikaPermissionErrorReport = ReportContext & {
  status: "permission_error";
  message: string;
};

export type YandexMetrikaErrorReport = ReportContext & {
  status: "error";
  message: string;
};

export type YandexMetrikaConversionReport =
  | YandexMetrikaReadyReport
  | YandexMetrikaNotConfiguredReport
  | YandexMetrikaPermissionErrorReport
  | YandexMetrikaErrorReport;

export type ConfiguredYandexMetrika = {
  configured: true;
  oauthToken: string;
  counterId: number;
};

export type UnconfiguredYandexMetrika = {
  configured: false;
  missing: string[];
};

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

type RawGoal = {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  conditions?: unknown;
};

type ReportingPeriod = {
  visits: number | null;
  goals: Map<YandexMetrikaGoalKey, Omit<YandexMetrikaGoalMetrics, "visits">>;
  trend: YandexMetrikaDailyPoint[];
  sampling: YandexMetrikaSamplingMetadata;
};

type ReportCacheEntry = {
  expiresAt: number;
  value: YandexMetrikaReadyReport;
};

function buildYandexMetrikaDateWindow(
  period: SeoReportPeriod,
  now: Date
): SeoDateWindow {
  const currentEnd = toIsoDateInTimeZone(now, "Europe/Moscow");
  const currentStart = shiftIsoDate(currentEnd, -(period - 1));
  const previousEnd = shiftIsoDate(currentStart, -1);
  const previousStart = shiftIsoDate(previousEnd, -(period - 1));

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd
  };
}

class YandexMetrikaApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message);
    this.name = "YandexMetrikaApiError";
  }
}

const reportCache = new Map<string, ReportCacheEntry>();
const inFlightReports = new Map<
  string,
  Promise<YandexMetrikaConversionReport>
>();

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function parsePositiveInteger(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : Number.NaN;

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function readYandexMetrikaConfig(
  env: Record<string, string | undefined> = process.env
): ConfiguredYandexMetrika | UnconfiguredYandexMetrika {
  const oauthToken = clean(env.YANDEX_METRIKA_OAUTH_TOKEN);
  const serverCounterId = clean(env.YANDEX_METRIKA_COUNTER_ID);
  const publicCounterId = clean(env.NEXT_PUBLIC_YANDEX_METRIKA_ID);
  const rawCounterId = serverCounterId || publicCounterId;
  const counterId = parsePositiveInteger(rawCounterId);
  const missing: string[] = [];

  if (!oauthToken) {
    missing.push("YANDEX_METRIKA_OAUTH_TOKEN");
  }
  if (!counterId) {
    missing.push(
      "YANDEX_METRIKA_COUNTER_ID or NEXT_PUBLIC_YANDEX_METRIKA_ID"
    );
  }

  return missing.length > 0
    ? { configured: false, missing }
    : {
        configured: true,
        oauthToken,
        counterId: counterId as number
      };
}

export function parseYandexMetrikaPeriod(
  searchParams: Pick<URLSearchParams, "get">
):
  | { ok: true; value: SeoReportPeriod }
  | { ok: false; error: string } {
  const rawPeriod = searchParams.get("period") ?? "30";
  const period = Number.parseInt(rawPeriod, 10);

  if (
    !Number.isSafeInteger(period) ||
    !SEO_REPORT_PERIODS.includes(period as SeoReportPeriod) ||
    String(period) !== rawPeriod
  ) {
    return {
      ok: false,
      error: "period должен быть одним из значений: 30, 90, 180, 365"
    };
  }

  return { ok: true, value: period as SeoReportPeriod };
}

function toTargetGoalKey(value: unknown): YandexMetrikaGoalKey | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return TARGET_GOALS.includes(normalized as YandexMetrikaGoalKey)
    ? (normalized as YandexMetrikaGoalKey)
    : null;
}

export function matchYandexMetrikaActionGoals(
  rawGoals: unknown
): YandexMetrikaGoalMetadata[] {
  if (!Array.isArray(rawGoals)) return [];

  const candidates = rawGoals
    .filter((goal): goal is RawGoal => Boolean(goal && typeof goal === "object"))
    .map((goal) => {
      const id = parsePositiveInteger(goal.id);
      const name = typeof goal.name === "string" ? goal.name.trim() : "";
      const type = typeof goal.type === "string" ? goal.type.toLowerCase() : "";
      const conditions = Array.isArray(goal.conditions) ? goal.conditions : [];
      const keys = conditions
        .map((condition) => {
          if (!condition || typeof condition !== "object") return null;
          return toTargetGoalKey(
            (condition as { url?: unknown }).url
          );
        })
        .filter((key): key is YandexMetrikaGoalKey => key !== null);

      return { id, name, type, keys };
    })
    .filter(
      (
        goal
      ): goal is {
        id: number;
        name: string;
        type: string;
        keys: YandexMetrikaGoalKey[];
      } => goal.id !== null && goal.name.length > 0 && goal.type === "action"
    )
    .sort((left, right) => left.id - right.id);

  return TARGET_GOALS.flatMap((key) => {
    const goal = candidates.find((candidate) => candidate.keys.includes(key));
    return goal
      ? [
          {
            key,
            id: goal.id,
            name: goal.name,
            conditionIdentifier: key
          }
        ]
      : [];
  });
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function readSamplingMetadata(
  payload: Record<string, unknown>
): YandexMetrikaSamplingMetadata {
  return {
    accuracy: "full",
    sampled: booleanOrNull(payload.sampled),
    sampleShare: finiteNumber(payload.sample_share),
    sampleSize: finiteNumber(payload.sample_size),
    sampleSpace: finiteNumber(payload.sample_space),
    dataLag: finiteNumber(payload.data_lag),
    containsSensitiveData: booleanOrNull(payload.contains_sensitive_data),
    totalRows: finiteNumber(payload.total_rows)
  };
}

function buildMetrics(goals: YandexMetrikaGoalMetadata[]): string[] {
  return [
    "ym:s:visits",
    ...goals.flatMap((goal) => [
      `ym:s:goal${goal.id}reaches`,
      `ym:s:goal${goal.id}visits`,
      `ym:s:goal${goal.id}conversionRate`
    ])
  ];
}

function parseGoalMetrics(
  values: unknown[],
  goals: YandexMetrikaGoalMetadata[]
): Map<
  YandexMetrikaGoalKey,
  Omit<YandexMetrikaGoalMetrics, "visits">
> {
  return new Map(
    goals.map((goal, index) => {
      const offset = 1 + index * 3;
      return [
        goal.key,
        {
          reaches: finiteNumber(values[offset]),
          convertedVisits: finiteNumber(values[offset + 1]),
          conversionRate: finiteNumber(values[offset + 2])
        }
      ];
    })
  );
}

function readIsoDate(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const dimension = value as { id?: unknown; name?: unknown };
  const candidate =
    typeof dimension.id === "string"
      ? dimension.id
      : typeof dimension.name === "string"
        ? dimension.name
        : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

async function fetchJson(
  url: URL,
  oauthToken: string,
  fetchImpl: FetchLike
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `OAuth ${oauthToken}`
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    throw new YandexMetrikaApiError(
      error instanceof Error ? error.message : "Yandex Metrika request failed",
      null
    );
  }

  if (!response.ok) {
    throw new YandexMetrikaApiError(
      `Yandex Metrika API returned HTTP ${response.status}`,
      response.status
    );
  }

  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Unexpected JSON payload");
    }
    return payload as Record<string, unknown>;
  } catch {
    throw new YandexMetrikaApiError(
      "Yandex Metrika API returned malformed JSON",
      response.status
    );
  }
}

async function fetchGoals(
  config: ConfiguredYandexMetrika,
  fetchImpl: FetchLike
): Promise<YandexMetrikaGoalMetadata[]> {
  const url = new URL(
    `${GOALS_API_BASE}/counter/${config.counterId}/goals`
  );
  const payload = await fetchJson(url, config.oauthToken, fetchImpl);
  if (!Array.isArray(payload.goals)) {
    throw new YandexMetrikaApiError(
      "Yandex Metrika goals response is malformed",
      200
    );
  }
  return matchYandexMetrikaActionGoals(payload.goals);
}

async function fetchReportingPeriod(
  config: ConfiguredYandexMetrika,
  goals: YandexMetrikaGoalMetadata[],
  start: string,
  end: string,
  fetchImpl: FetchLike
): Promise<ReportingPeriod> {
  const metricNames = buildMetrics(goals);
  const url = new URL(REPORTING_API_URL);
  url.searchParams.set("ids", String(config.counterId));
  url.searchParams.set("date1", start);
  url.searchParams.set("date2", end);
  url.searchParams.set("dimensions", "ym:s:date");
  url.searchParams.set("metrics", metricNames.join(","));
  url.searchParams.set("accuracy", "full");
  url.searchParams.set("limit", "10000");

  const payload = await fetchJson(url, config.oauthToken, fetchImpl);
  if (
    !Array.isArray(payload.totals) ||
    payload.totals.length < metricNames.length ||
    !Array.isArray(payload.data)
  ) {
    throw new YandexMetrikaApiError(
      "Yandex Metrika reporting response is malformed",
      200
    );
  }

  const totals = payload.totals;
  const trend = payload.data
    .flatMap((rawRow) => {
      if (!rawRow || typeof rawRow !== "object") return [];
      const row = rawRow as { dimensions?: unknown; metrics?: unknown };
      if (!Array.isArray(row.dimensions) || !Array.isArray(row.metrics)) {
        return [];
      }
      const date = readIsoDate(row.dimensions[0]);
      if (!date || row.metrics.length < metricNames.length) return [];

      return [
        {
          date,
          visits: finiteNumber(row.metrics[0]),
          goals: Object.fromEntries(
            parseGoalMetrics(row.metrics, goals)
          ) as YandexMetrikaDailyPoint["goals"]
        }
      ];
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return {
    visits: finiteNumber(totals[0]),
    goals: parseGoalMetrics(totals, goals),
    trend,
    sampling: readSamplingMetadata(payload)
  };
}

function missingGoalKeys(
  goals: YandexMetrikaGoalMetadata[]
): YandexMetrikaGoalKey[] {
  const found = new Set(goals.map((goal) => goal.key));
  return TARGET_GOALS.filter((key) => !found.has(key));
}

function isPermissionError(error: unknown): boolean {
  return (
    error instanceof YandexMetrikaApiError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  );
}

function buildCacheKey(
  config: ConfiguredYandexMetrika,
  period: SeoReportPeriod,
  window: SeoDateWindow
): string {
  const tokenHash = createHash("sha256")
    .update(config.oauthToken)
    .digest("hex")
    .slice(0, 16);
  return `${config.counterId}:${period}:${window.currentEnd}:${tokenHash}`;
}

function readReadyCache(
  key: string,
  nowMs: number
): YandexMetrikaReadyReport | null {
  const entry = reportCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs) {
    reportCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeReadyCache(
  key: string,
  value: YandexMetrikaReadyReport,
  nowMs: number
): void {
  for (const [cacheKey, entry] of reportCache) {
    if (entry.expiresAt <= nowMs) reportCache.delete(cacheKey);
  }
  while (reportCache.size >= REPORT_CACHE_MAX_ENTRIES) {
    const oldestKey = reportCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    reportCache.delete(oldestKey);
  }
  reportCache.set(key, {
    expiresAt: nowMs + REPORT_CACHE_TTL_MS,
    value
  });
}

async function buildReadyReport(options: {
  config: ConfiguredYandexMetrika;
  period: SeoReportPeriod;
  generatedAt: Date;
  window: SeoDateWindow;
  fetchImpl: FetchLike;
}): Promise<YandexMetrikaReadyReport> {
  const { config, period, generatedAt, window, fetchImpl } = options;
  const goals = await fetchGoals(config, fetchImpl);
  const [current, previous] = await Promise.all([
    fetchReportingPeriod(
      config,
      goals,
      window.currentStart,
      window.currentEnd,
      fetchImpl
    ),
    fetchReportingPeriod(
      config,
      goals,
      window.previousStart,
      window.previousEnd,
      fetchImpl
    )
  ]);

  return {
    status: "ready",
    counterId: config.counterId,
    period,
    generatedAt: generatedAt.toISOString(),
    dateRange: {
      start: window.currentStart,
      end: window.currentEnd
    },
    comparisonRange: {
      start: window.previousStart,
      end: window.previousEnd
    },
    visits: {
      current: current.visits,
      previous: previous.visits
    },
    goals: goals.map((goal) => ({
      ...goal,
      current: {
        visits: current.visits,
        ...(current.goals.get(goal.key) ?? {
          reaches: null,
          convertedVisits: null,
          conversionRate: null
        })
      },
      previous: {
        visits: previous.visits,
        ...(previous.goals.get(goal.key) ?? {
          reaches: null,
          convertedVisits: null,
          conversionRate: null
        })
      }
    })),
    missingGoalKeys: missingGoalKeys(goals),
    trend: {
      current: current.trend,
      previous: previous.trend
    },
    sampling: {
      current: current.sampling,
      previous: previous.sampling
    }
  };
}

export async function getYandexMetrikaConversionReport(options: {
  period: SeoReportPeriod;
  now?: Date;
  env?: Record<string, string | undefined>;
  fetchImpl?: FetchLike;
  forceRefresh?: boolean;
}): Promise<YandexMetrikaConversionReport> {
  const generatedAt = options.now ?? new Date();
  const context: ReportContext = {
    period: options.period,
    generatedAt: generatedAt.toISOString()
  };
  const config = readYandexMetrikaConfig(options.env);

  if (!config.configured) {
    return {
      ...context,
      status: "not_configured",
      message: "Интеграция Яндекс Метрики не настроена.",
      missing: config.missing
    };
  }

  const window = buildYandexMetrikaDateWindow(options.period, generatedAt);
  const cacheKey = buildCacheKey(config, options.period, window);
  const nowMs = Date.now();
  if (!options.forceRefresh) {
    const cached = readReadyCache(cacheKey, nowMs);
    if (cached) return cached;
  }

  const inFlight = inFlightReports.get(cacheKey);
  if (inFlight) return inFlight;

  const request = buildReadyReport({
    config,
    period: options.period,
    generatedAt,
    window,
    fetchImpl: options.fetchImpl ?? fetch
  })
    .then((report): YandexMetrikaConversionReport => {
      writeReadyCache(cacheKey, report, Date.now());
      return report;
    })
    .catch((error): YandexMetrikaConversionReport => {
      if (isPermissionError(error)) {
        return {
          ...context,
          status: "permission_error",
          message:
            "У OAuth-токена нет доступа к счётчику Яндекс Метрики. Проверьте аккаунт токена и права на счётчик."
        };
      }
      return {
        ...context,
        status: "error",
        message:
          "Не удалось получить отчёт Яндекс Метрики. Повторите попытку позже."
      };
    });

  inFlightReports.set(cacheKey, request);
  request.finally(() => {
    if (inFlightReports.get(cacheKey) === request) {
      inFlightReports.delete(cacheKey);
    }
  });

  return request;
}
