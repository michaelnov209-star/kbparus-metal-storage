import {
  SEO_REPORT_DEVICES,
  SEO_REPORT_PERIODS,
  SEO_REPORT_PROVIDERS,
  type SeoDateWindow,
  type SeoReportDevice,
  type SeoReportInput,
  type SeoReportPeriod,
  type SeoProvider
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toIsoDateInTimeZone(
  date: Date,
  timeZone: string
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function shiftIsoDate(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return toIsoDate(new Date(parsed.getTime() + days * DAY_MS));
}

export function countInclusiveDays(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00.000Z`).getTime();
  const endMs = new Date(`${end}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round((endMs - startMs) / DAY_MS) + 1);
}

export function buildSeoDateWindow(
  period: SeoReportPeriod,
  now = new Date(),
  timeZone = "UTC"
): SeoDateWindow {
  const today =
    timeZone === "UTC"
      ? toIsoDate(now)
      : toIsoDateInTimeZone(now, timeZone);
  const currentEnd = shiftIsoDate(today, -1);
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

export function classifySeoDate(
  date: string,
  window: SeoDateWindow
): "current" | "previous" | null {
  if (date >= window.currentStart && date <= window.currentEnd) return "current";
  if (date >= window.previousStart && date <= window.previousEnd) return "previous";
  return null;
}

export function clampYandexStart(
  requestedStart: string,
  now = new Date()
): string {
  const today = toIsoDateInTimeZone(now, "Europe/Moscow");
  const earliestAvailable = shiftIsoDate(today, -14);
  return requestedStart > earliestAvailable ? requestedStart : earliestAvailable;
}

export function parseSeoReportInput(
  searchParams: Pick<URLSearchParams, "get">
): { ok: true; value: SeoReportInput } | { ok: false; error: string } {
  const provider = (searchParams.get("provider") ?? "google").toLowerCase();
  if (!SEO_REPORT_PROVIDERS.includes(provider as SeoProvider)) {
    return {
      ok: false,
      error: "provider должен быть одним из значений: google, yandex"
    };
  }

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

  const device = (searchParams.get("device") ?? "all").toLowerCase();
  if (!SEO_REPORT_DEVICES.includes(device as SeoReportDevice)) {
    return {
      ok: false,
      error: "device должен быть одним из значений: all, desktop, mobile, tablet"
    };
  }

  const query = (searchParams.get("query") ?? "").trim();
  if (query.length > 200) {
    return { ok: false, error: "query не должен быть длиннее 200 символов" };
  }

  return {
    ok: true,
    value: {
      provider: provider as SeoProvider,
      period: period as SeoReportPeriod,
      device: device as SeoReportDevice,
      query
    }
  };
}
