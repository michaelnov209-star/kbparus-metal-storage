import { readSeoReportingConfig } from "./config";
import { buildSeoDateWindow, clampYandexStart } from "./dates";
import { fetchGoogleSearchConsoleDataset } from "./providers/google-search-console";
import { publicSeoProviderError } from "./providers/errors";
import { fetchYandexWebmasterDataset } from "./providers/yandex-webmaster";
import {
  buildSeoReportResponse,
  type SeoProviderExecution
} from "./report";
import type { SeoReportInput, SeoReportResponse } from "./types";

type Environment = Record<string, string | undefined>;

type LiveSeoReportOptions = {
  env?: Environment;
  now?: Date;
  fetchImpl?: typeof fetch;
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;
const reportCache = new Map<
  string,
  { expiresAt: number; value: SeoReportResponse }
>();
const inFlightReports = new Map<string, Promise<SeoReportResponse>>();

function reportCacheKey(input: SeoReportInput): string {
  return [
    input.provider,
    input.period,
    input.device,
    input.query.toLocaleLowerCase("ru-RU")
  ].join(":");
}

function readCachedReport(key: string): SeoReportResponse | null {
  const now = Date.now();
  const cached = reportCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= now) {
    reportCache.delete(key);
    return null;
  }
  return cached.value;
}

function cacheReport(key: string, value: SeoReportResponse): void {
  for (const [cachedKey, cached] of reportCache) {
    if (cached.expiresAt <= Date.now()) reportCache.delete(cachedKey);
  }
  while (reportCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = reportCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    reportCache.delete(oldestKey);
  }
  reportCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value
  });
}

async function loadLiveSeoReport(
  input: SeoReportInput,
  env: Environment,
  now: Date,
  fetchImpl: typeof fetch
): Promise<SeoReportResponse> {
  const config = readSeoReportingConfig(env);
  const window = buildSeoDateWindow(
    input.period,
    now,
    input.provider === "google"
      ? "America/Los_Angeles"
      : "Europe/Moscow"
  );
  let execution: SeoProviderExecution;

  try {
    if (input.provider === "google") {
      if (!config.google.configured) {
        return buildSeoReportResponse({
          input,
          generatedAt: now,
          execution: {
            state: "not_configured",
            missing: config.google.missing
          }
        });
      }

      execution = {
        state: "ok",
        dataset: await fetchGoogleSearchConsoleDataset({
          config: config.google,
          window,
          period: input.period,
          device: input.device,
          query: input.query,
          fetchImpl
        })
      };
    } else {
      if (!config.yandex.configured) {
        return buildSeoReportResponse({
          input,
          generatedAt: now,
          execution: {
            state: "not_configured",
            missing: config.yandex.missing
          }
        });
      }

      execution = {
        state: "ok",
        dataset: await fetchYandexWebmasterDataset({
          config: config.yandex,
          startDate: clampYandexStart(window.currentStart, now),
          endDate: window.currentEnd,
          device: input.device,
          query: input.query,
          fetchImpl
        })
      };
    }
  } catch (error) {
    console.error(`[seo-reporting] ${input.provider} request failed`, error);
    execution = {
      state: "error",
      message: publicSeoProviderError(
        input.provider === "google"
          ? "Google Search Console"
          : "Яндекс Вебмастер",
        error
      )
    };
  }

  return buildSeoReportResponse({
    input,
    generatedAt: now,
    execution
  });
}

export async function getLiveSeoReport(
  input: SeoReportInput,
  {
    env = process.env,
    now = new Date(),
    fetchImpl = fetch
  }: LiveSeoReportOptions = {}
): Promise<SeoReportResponse> {
  const canUseRuntimeCache = env === process.env && fetchImpl === fetch;
  if (!canUseRuntimeCache) {
    return loadLiveSeoReport(input, env, now, fetchImpl);
  }

  const key = reportCacheKey(input);
  const cached = readCachedReport(key);
  if (cached) return cached;

  const inFlight = inFlightReports.get(key);
  if (inFlight) return inFlight;

  const request = loadLiveSeoReport(input, env, now, fetchImpl)
    .then((report) => {
      if (report.status === "ready") cacheReport(key, report);
      return report;
    })
    .finally(() => {
      inFlightReports.delete(key);
    });
  inFlightReports.set(key, request);
  return request;
}
