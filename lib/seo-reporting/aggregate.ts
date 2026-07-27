import { classifySeoDate, shiftIsoDate } from "./dates";
import type {
  SeoDateWindow,
  SeoMetricChange,
  SeoMetricSummary,
  SeoObservation,
  SeoPageMetric,
  SeoQueryMetric,
  SeoSource,
  SeoSourceSummary,
  SeoTrendPoint
} from "./types";

type MetricAccumulator = {
  clicks: number;
  impressions: number;
  positionWeightedSum: number;
  positionWeight: number;
};

function createAccumulator(): MetricAccumulator {
  return {
    clicks: 0,
    impressions: 0,
    positionWeightedSum: 0,
    positionWeight: 0
  };
}

function addObservation(accumulator: MetricAccumulator, row: SeoObservation): void {
  accumulator.clicks += row.clicks;
  accumulator.impressions += row.impressions;

  if (
    row.position !== null &&
    Number.isFinite(row.position) &&
    row.impressions > 0
  ) {
    accumulator.positionWeightedSum += row.position * row.impressions;
    accumulator.positionWeight += row.impressions;
  }
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function finalizeAccumulator(accumulator: MetricAccumulator): SeoMetricSummary {
  return {
    clicks: round(accumulator.clicks, 2),
    impressions: round(accumulator.impressions, 2),
    ctr:
      accumulator.impressions > 0
        ? round(accumulator.clicks / accumulator.impressions, 4)
        : null,
    averagePosition:
      accumulator.positionWeight > 0
        ? round(
            accumulator.positionWeightedSum / accumulator.positionWeight,
            2
          )
        : null
  };
}

export function emptySeoMetricSummary(): SeoMetricSummary {
  return finalizeAccumulator(createAccumulator());
}

export function aggregateSeoMetrics(rows: readonly SeoObservation[]): SeoMetricSummary {
  const accumulator = createAccumulator();
  for (const row of rows) addObservation(accumulator, row);
  return finalizeAccumulator(accumulator);
}

export function calculateSeoMetricChange(
  current: SeoMetricSummary,
  previous: SeoMetricSummary,
  hasPreviousData: boolean
): SeoMetricChange {
  if (!hasPreviousData) {
    return {
      clicks: null,
      impressions: null,
      ctr: null,
      positionImprovement: null
    };
  }

  return {
    clicks: round(current.clicks - previous.clicks, 2),
    impressions: round(current.impressions - previous.impressions, 2),
    ctr:
      current.ctr !== null && previous.ctr !== null
        ? round(current.ctr - previous.ctr, 4)
        : null,
    positionImprovement:
      current.averagePosition !== null && previous.averagePosition !== null
        ? round(previous.averagePosition - current.averagePosition, 2)
        : null
  };
}

export function buildSeoSourceSummary(
  rows: readonly SeoObservation[],
  window: SeoDateWindow
): SeoSourceSummary {
  const currentRows = rows.filter(
    (row) => classifySeoDate(row.date, window) === "current"
  );
  const previousRows = rows.filter(
    (row) => classifySeoDate(row.date, window) === "previous"
  );
  const current = aggregateSeoMetrics(currentRows);
  const previous = aggregateSeoMetrics(previousRows);

  return {
    current,
    previous,
    change: calculateSeoMetricChange(current, previous, previousRows.length > 0)
  };
}

function rowsForCurrentWindow(
  rows: readonly SeoObservation[],
  window: SeoDateWindow
): SeoObservation[] {
  return rows.filter((row) => classifySeoDate(row.date, window) === "current");
}

export function buildSeoTrend(
  rows: readonly SeoObservation[],
  window: SeoDateWindow
): SeoTrendPoint[] {
  const grouped = new Map<string, SeoObservation[]>();

  for (const row of rowsForCurrentWindow(rows, window)) {
    const key = `${row.date}:${row.source}`;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(row);
    else grouped.set(key, [row]);
  }

  const result: SeoTrendPoint[] = [];
  for (
    let date = window.currentStart;
    date <= window.currentEnd;
    date = shiftIsoDate(date, 1)
  ) {
    result.push({
      date,
      google: aggregateSeoMetrics(grouped.get(`${date}:google`) ?? []),
      yandex: aggregateSeoMetrics(grouped.get(`${date}:yandex`) ?? [])
    });
  }

  return result;
}

export function buildSeoQueryMetrics(
  rows: readonly SeoObservation[],
  window: SeoDateWindow
): SeoQueryMetric[] {
  const current = new Map<string, SeoObservation[]>();
  const previous = new Map<string, SeoObservation[]>();

  for (const row of rows) {
    if (!row.query) continue;
    const period = classifySeoDate(row.date, window);
    if (!period) continue;

    const key = `${row.source}:${row.query.toLocaleLowerCase("ru-RU")}`;
    const target = period === "current" ? current : previous;
    const bucket = target.get(key);
    if (bucket) bucket.push(row);
    else target.set(key, [row]);
  }

  const result: SeoQueryMetric[] = [];
  for (const [key, currentRows] of current) {
    const currentMetrics = aggregateSeoMetrics(currentRows);
    const previousRows = previous.get(key) ?? [];
    const previousMetrics = aggregateSeoMetrics(previousRows);
    const positionImprovement =
      previousRows.length > 0 &&
      currentMetrics.averagePosition !== null &&
      previousMetrics.averagePosition !== null
        ? round(
            previousMetrics.averagePosition - currentMetrics.averagePosition,
            2
          )
        : null;
    const page =
      currentRows
        .filter((row) => row.page)
        .sort((left, right) => right.impressions - left.impressions)[0]?.page ??
      null;

    result.push({
      source: currentRows[0]!.source,
      query: currentRows[0]!.query,
      page,
      ...currentMetrics,
      previousAveragePosition: previousMetrics.averagePosition,
      positionImprovement
    });
  }

  return result.sort(
    (left, right) =>
      right.impressions - left.impressions ||
      left.query.localeCompare(right.query, "ru")
  );
}

export function buildSeoPageMetrics(
  rows: readonly SeoObservation[],
  window: SeoDateWindow
): SeoPageMetric[] {
  const grouped = new Map<string, SeoObservation[]>();

  for (const row of rowsForCurrentWindow(rows, window)) {
    if (!row.page) continue;
    const key = `${row.source}:${row.page}`;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(row);
    else grouped.set(key, [row]);
  }

  const result: SeoPageMetric[] = [];
  for (const currentRows of grouped.values()) {
    result.push({
      source: currentRows[0]!.source,
      page: currentRows[0]!.page!,
      ...aggregateSeoMetrics(currentRows)
    });
  }

  return result.sort(
    (left, right) =>
      right.impressions - left.impressions ||
      left.page.localeCompare(right.page, "ru")
  );
}

export function filterRowsBySource(
  rows: readonly SeoObservation[],
  source: SeoSource
): SeoObservation[] {
  return rows.filter((row) => row.source === source);
}
