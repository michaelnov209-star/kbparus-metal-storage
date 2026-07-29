import { createSign } from "node:crypto";
import type {
  ConfiguredGoogleSearchConsole,
  SeoCountryObservation,
  SeoDateWindow,
  SeoObservation,
  SeoReportDevice,
  SeoReportPeriod,
  SeoSourceDataset
} from "../types";
import { SeoProviderError } from "./errors";

type GoogleSearchAnalyticsRow = {
  keys?: unknown;
  clicks?: unknown;
  impressions?: unknown;
  position?: unknown;
};

type GoogleSearchAnalyticsResponse = {
  rows?: GoogleSearchAnalyticsRow[];
};

type GoogleAccessTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
};

type GoogleFetchOptions = {
  config: ConfiguredGoogleSearchConsole;
  window: SeoDateWindow;
  period: SeoReportPeriod;
  device: SeoReportDevice;
  query: string;
  fetchImpl?: typeof fetch;
};

type GoogleQueryOptions = {
  config: ConfiguredGoogleSearchConsole;
  token: string;
  startDate: string;
  endDate: string;
  dimensions: Array<"date" | "query" | "page" | "country">;
  aggregationType: "byPage" | "byProperty";
  device: SeoReportDevice;
  query: string;
  fetchImpl: typeof fetch;
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SEARCH_SCOPE =
  "https://www.googleapis.com/auth/webmasters.readonly";
const GOOGLE_PAGE_SIZE = 25_000;

let tokenCache:
  | {
      clientEmail: string;
      token: string;
      expiresAt: number;
    }
  | undefined;

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function createServiceAccountAssertion(
  config: ConfiguredGoogleSearchConsole,
  now = Date.now()
): string {
  const issuedAt = Math.floor(now / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: GOOGLE_SEARCH_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(config.privateKey);
  return `${unsignedToken}.${encodeBase64Url(signature)}`;
}

async function getGoogleAccessToken(
  config: ConfiguredGoogleSearchConsole,
  fetchImpl: typeof fetch
): Promise<string> {
  const now = Date.now();
  if (
    tokenCache &&
    tokenCache.clientEmail === config.clientEmail &&
    tokenCache.expiresAt > now + 60_000
  ) {
    return tokenCache.token;
  }

  let assertion: string;
  try {
    assertion = createServiceAccountAssertion(config, now);
  } catch {
    throw new SeoProviderError(
      "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY имеет неверный формат"
    );
  }

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  });
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new SeoProviderError(
      "Google OAuth не выдал токен доступа",
      response.status
    );
  }

  const data = (await response.json()) as GoogleAccessTokenResponse;
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new SeoProviderError("Google OAuth вернул некорректный ответ");
  }

  const expiresIn =
    typeof data.expires_in === "number" && Number.isFinite(data.expires_in)
      ? data.expires_in
      : 3600;
  tokenCache = {
    clientEmail: config.clientEmail,
    token: data.access_token,
    expiresAt: now + expiresIn * 1000
  };
  return data.access_token;
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function positionOrNull(
  value: unknown,
  impressions: number
): number | null {
  return impressions > 0 &&
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : null;
}

function stringKeys(
  row: GoogleSearchAnalyticsRow,
  expectedLength: number
): string[] | null {
  if (
    !Array.isArray(row.keys) ||
    row.keys.length !== expectedLength ||
    row.keys.some((key) => typeof key !== "string")
  ) {
    return null;
  }
  return row.keys as string[];
}

function googleFilters(device: SeoReportDevice, query: string) {
  const filters: Array<{
    dimension: string;
    operator: string;
    expression: string;
  }> = [];
  if (query) {
    filters.push({
      dimension: "query",
      operator: "contains",
      expression: query
    });
  }
  if (device !== "all") {
    filters.push({
      dimension: "device",
      operator: "equals",
      expression: device.toUpperCase()
    });
  }
  return filters;
}

async function runGoogleQuery({
  config,
  token,
  startDate,
  endDate,
  dimensions,
  aggregationType,
  device,
  query,
  fetchImpl
}: GoogleQueryOptions): Promise<{
  rows: GoogleSearchAnalyticsRow[];
  truncated: boolean;
}> {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    config.siteUrl
  )}/searchAnalytics/query`;
  const filters = googleFilters(device, query);
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      type: "web",
      aggregationType,
      dataState: "final",
      rowLimit: GOOGLE_PAGE_SIZE,
      startRow: 0,
      ...(filters.length > 0
        ? {
            dimensionFilterGroups: [
              {
                groupType: "and",
                filters
              }
            ]
          }
        : {})
    }),
    signal: AbortSignal.timeout(25_000)
  });

  if (!response.ok) {
    throw new SeoProviderError(
      "Google Search Console не вернул отчёт",
      response.status
    );
  }

  const data = (await response.json()) as GoogleSearchAnalyticsResponse;
  const rows = Array.isArray(data.rows) ? data.rows : [];
  return {
    rows,
    truncated: rows.length >= GOOGLE_PAGE_SIZE
  };
}

function metricObservation(
  row: GoogleSearchAnalyticsRow,
  input: {
    date: string;
    query: string;
    page: string | null;
    device: SeoReportDevice;
  }
): SeoObservation {
  const impressions = numberOrZero(row.impressions);
  return {
    source: "google",
    ...input,
    clicks: numberOrZero(row.clicks),
    impressions,
    position: positionOrNull(row.position, impressions)
  };
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function fetchGoogleSearchConsoleDataset({
  config,
  window,
  period,
  device,
  query,
  fetchImpl = fetch
}: GoogleFetchOptions): Promise<SeoSourceDataset> {
  const token = await getGoogleAccessToken(config, fetchImpl);
  const includeComparison = period !== 365;
  const emptyResult = Promise.resolve({
    rows: [] as GoogleSearchAnalyticsRow[],
    truncated: false
  });

  const [
    timeline,
    currentQueries,
    previousQueries,
    queryPages,
    currentPages,
    currentCountries
  ] =
    await Promise.all([
      runGoogleQuery({
        config,
        token,
        startDate: includeComparison
          ? window.previousStart
          : window.currentStart,
        endDate: window.currentEnd,
        dimensions: ["date"],
        aggregationType: "byProperty",
        device,
        query,
        fetchImpl
      }),
      runGoogleQuery({
        config,
        token,
        startDate: window.currentStart,
        endDate: window.currentEnd,
        dimensions: ["query"],
        aggregationType: "byProperty",
        device,
        query,
        fetchImpl
      }),
      includeComparison
        ? runGoogleQuery({
            config,
            token,
            startDate: window.previousStart,
            endDate: window.previousEnd,
            dimensions: ["query"],
            aggregationType: "byProperty",
            device,
            query,
            fetchImpl
          })
        : emptyResult,
      runGoogleQuery({
        config,
        token,
        startDate: window.currentStart,
        endDate: window.currentEnd,
        dimensions: ["query", "page"],
        aggregationType: "byPage",
        device,
        query,
        fetchImpl
      }),
      runGoogleQuery({
        config,
        token,
        startDate: window.currentStart,
        endDate: window.currentEnd,
        dimensions: ["page"],
        aggregationType: "byPage",
        device,
        query,
        fetchImpl
      }),
      runGoogleQuery({
        config,
        token,
        startDate: window.currentStart,
        endDate: window.currentEnd,
        dimensions: ["country"],
        aggregationType: "byProperty",
        device,
        query,
        fetchImpl
      })
    ]);

  const summaryRows = timeline.rows.flatMap((row) => {
    const keys = stringKeys(row, 1);
    if (!keys || !/^\d{4}-\d{2}-\d{2}$/.test(keys[0]!)) return [];
    return [
      metricObservation(row, {
        date: keys[0]!,
        query: "",
        page: null,
        device
      })
    ];
  });

  const pageByQuery = new Map<
    string,
    { page: string; impressions: number }
  >();
  queryPages.rows.forEach((row) => {
    const keys = stringKeys(row, 2);
    if (!keys || !keys[0] || !keys[1]) return;
    const page = safeHttpUrl(keys[1]!);
    if (!page) return;
    const impressions = numberOrZero(row.impressions);
    const current = pageByQuery.get(keys[0]!);
    if (!current || impressions > current.impressions) {
      pageByQuery.set(keys[0]!, { page, impressions });
    }
  });

  const pageRows = currentPages.rows.flatMap((row) => {
    const keys = stringKeys(row, 1);
    if (!keys?.[0]) return [];
    const page = safeHttpUrl(keys[0]);
    if (!page) return [];
    return [
      metricObservation(row, {
        date: window.currentEnd,
        query: "",
        page,
        device
      })
    ];
  });

  const countryRows: SeoCountryObservation[] = currentCountries.rows.flatMap(
    (row) => {
      const keys = stringKeys(row, 1);
      const country = keys?.[0]?.trim().toLowerCase();
      if (!country || !/^[a-z]{3}$/.test(country)) return [];
      const impressions = numberOrZero(row.impressions);
      return [
        {
          source: "google" as const,
          date: window.currentEnd,
          country,
          clicks: numberOrZero(row.clicks),
          impressions,
          position: positionOrNull(row.position, impressions)
        }
      ];
    }
  );

  function normalizeQueryRows(
    rows: GoogleSearchAnalyticsRow[],
    date: string,
    withPage: boolean
  ): SeoObservation[] {
    return rows.flatMap((row) => {
      const keys = stringKeys(row, 1);
      const searchQuery = keys?.[0]?.trim();
      if (!searchQuery) return [];
      return [
        metricObservation(row, {
          date,
          query: searchQuery,
          page: withPage
            ? pageByQuery.get(searchQuery)?.page ?? null
            : null,
          device
        })
      ];
    });
  }

  const queryRows = [
    ...normalizeQueryRows(
      currentQueries.rows,
      window.currentEnd,
      true
    ),
    ...normalizeQueryRows(
      previousQueries.rows,
      window.previousEnd,
      false
    )
  ];
  const dates = summaryRows.map((row) => row.date).sort();

  return {
    summaryRows,
    queryRows,
    pageRows,
    countryRows,
    actualStart: dates[0] ?? null,
    actualEnd: dates.at(-1) ?? null,
    truncated:
      timeline.truncated ||
      currentQueries.truncated ||
      previousQueries.truncated ||
      queryPages.truncated ||
      currentPages.truncated ||
      currentCountries.truncated
  };
}
