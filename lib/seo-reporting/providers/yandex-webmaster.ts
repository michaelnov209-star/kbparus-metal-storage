import type {
  ConfiguredYandexWebmaster,
  SeoObservation,
  SeoReportDevice,
  SeoSourceDataset
} from "../types";
import { SeoProviderError } from "./errors";

type YandexStatistic = {
  date?: unknown;
  field?: unknown;
  value?: unknown;
};

type YandexAnalyticsItem = {
  text_indicator?: {
    type?: unknown;
    value?: unknown;
  };
  popular_complementary_indicator?: {
    type?: unknown;
    value?: unknown;
  };
  statistics?: unknown;
};

type YandexAnalyticsResponse = {
  count?: unknown;
  text_indicator_to_statistics?: unknown;
};

type YandexHostsResponse = {
  hosts?: Array<{
    host_id?: unknown;
    verified?: unknown;
  }>;
};

type YandexFetchOptions = {
  config: ConfiguredYandexWebmaster;
  startDate: string;
  endDate: string;
  device: SeoReportDevice;
  query: string;
  fetchImpl?: typeof fetch;
  includePages?: boolean;
};

const YANDEX_PAGE_SIZE = 500;
const YANDEX_MAX_PAGES = 20;

export async function checkYandexWebmasterConnection({
  config,
  fetchImpl = fetch
}: {
  config: ConfiguredYandexWebmaster;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const endpoint = `https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(
    config.userId
  )}/hosts`;
  const response = await fetchImpl(endpoint, {
    headers: {
      authorization: `OAuth ${config.oauthToken}`,
      accept: "application/json"
    },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new SeoProviderError(
      "Яндекс Вебмастер не подтвердил подключение",
      response.status
    );
  }

  const data = (await response.json()) as YandexHostsResponse;
  const target = Array.isArray(data.hosts)
    ? data.hosts.find((host) => host.host_id === config.hostId)
    : undefined;
  if (!target || target.verified !== true) {
    throw new SeoProviderError(
      "Сайт не найден среди подтверждённых ресурсов Яндекс Вебмастера"
    );
  }
}

function yandexDevice(device: SeoReportDevice): string {
  return device === "all" ? "ALL" : device.toUpperCase();
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getTextValue(
  value: YandexAnalyticsItem["text_indicator"],
  expectedType: "QUERY" | "URL"
): string | null {
  return value?.type === expectedType && typeof value.value === "string"
    ? value.value
    : null;
}

function safePageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function normalizeYandexItems(
  items: YandexAnalyticsItem[],
  kind: "QUERY" | "URL",
  device: SeoReportDevice,
  startDate: string,
  endDate: string
): SeoObservation[] {
  const result: SeoObservation[] = [];

  for (const item of items) {
    const primary = getTextValue(item.text_indicator, kind);
    if (!primary || !Array.isArray(item.statistics)) continue;

    const complementaryType = kind === "QUERY" ? "URL" : "QUERY";
    const complementary = getTextValue(
      item.popular_complementary_indicator,
      complementaryType
    );
    const perDate = new Map<
      string,
      { clicks: number; impressions: number; position: number | null }
    >();

    for (const rawStatistic of item.statistics as YandexStatistic[]) {
      if (
        typeof rawStatistic.date !== "string" ||
        rawStatistic.date < startDate ||
        rawStatistic.date > endDate ||
        typeof rawStatistic.field !== "string"
      ) {
        continue;
      }
      const value = safeNumber(rawStatistic.value);
      if (value === null) continue;
      const metrics = perDate.get(rawStatistic.date) ?? {
        clicks: 0,
        impressions: 0,
        position: null
      };
      if (rawStatistic.field === "CLICKS") metrics.clicks = value;
      if (rawStatistic.field === "IMPRESSIONS") metrics.impressions = value;
      if (rawStatistic.field === "POSITION" && value > 0) {
        metrics.position = value;
      }
      perDate.set(rawStatistic.date, metrics);
    }

    for (const [date, metrics] of perDate) {
      const page = safePageUrl(
        kind === "URL" ? primary : complementary
      );
      if (kind === "URL" && !page) continue;
      result.push({
        source: "yandex",
        date,
        query: kind === "QUERY" ? primary : complementary ?? "",
        page,
        device,
        clicks: metrics.clicks,
        impressions: metrics.impressions,
        position: metrics.position
      });
    }
  }

  return result;
}

async function fetchYandexDimension(
  options: YandexFetchOptions,
  kind: "QUERY" | "URL"
): Promise<{ rows: SeoObservation[]; truncated: boolean }> {
  const {
    config,
    startDate,
    endDate,
    device,
    query,
    fetchImpl = fetch
  } = options;
  const endpoint = `https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(
    config.userId
  )}/hosts/${encodeURIComponent(config.hostId)}/query-analytics/list`;
  const items: YandexAnalyticsItem[] = [];
  let truncated = false;

  for (let page = 0; page < YANDEX_MAX_PAGES; page += 1) {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        authorization: `OAuth ${config.oauthToken}`,
        "content-type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify({
        offset: page * YANDEX_PAGE_SIZE,
        limit: YANDEX_PAGE_SIZE,
        device_type_indicator: yandexDevice(device),
        search_location: "WEB_LOCATION",
        text_indicator: kind,
        ...(config.regionIds.length > 0 ? { region_ids: config.regionIds } : {}),
        ...(query
          ? {
              filters: {
                text_filters: [
                  {
                    text_indicator: "QUERY",
                    operation: "TEXT_CONTAINS",
                    value: query
                  }
                ]
              }
            }
          : {})
      }),
      signal: AbortSignal.timeout(25_000)
    });

    if (!response.ok) {
      throw new SeoProviderError(
        "Яндекс Вебмастер не вернул отчёт",
        response.status
      );
    }

    const data = (await response.json()) as YandexAnalyticsResponse;
    const pageItems = Array.isArray(data.text_indicator_to_statistics)
      ? (data.text_indicator_to_statistics as YandexAnalyticsItem[])
      : [];
    items.push(...pageItems);
    const count =
      typeof data.count === "number" && Number.isFinite(data.count)
        ? data.count
        : items.length;
    if (pageItems.length < YANDEX_PAGE_SIZE || items.length >= count) break;
    if (page === YANDEX_MAX_PAGES - 1) truncated = true;
  }

  return {
    rows: normalizeYandexItems(items, kind, device, startDate, endDate),
    truncated
  };
}

export async function fetchYandexWebmasterDataset(
  options: YandexFetchOptions
): Promise<SeoSourceDataset> {
  if (options.includePages === false) {
    const queries = await fetchYandexDimension(options, "QUERY");
    const dates = queries.rows.map((row) => row.date).sort();

    return {
      summaryRows: queries.rows,
      queryRows: queries.rows,
      pageRows: [],
      actualStart: dates[0] ?? null,
      actualEnd: dates.at(-1) ?? null,
      truncated: queries.truncated
    };
  }

  const [queries, pages] = await Promise.all([
    fetchYandexDimension(options, "QUERY"),
    fetchYandexDimension(options, "URL")
  ]);
  const dates = [...queries.rows, ...pages.rows].map((row) => row.date).sort();

  return {
    summaryRows: queries.rows,
    queryRows: queries.rows,
    pageRows: pages.rows,
    actualStart: dates[0] ?? null,
    actualEnd: dates.at(-1) ?? null,
    truncated: queries.truncated || pages.truncated
  };
}
