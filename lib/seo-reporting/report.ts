import {
  buildSeoPageMetrics,
  buildSeoQueryMetrics,
  buildSeoSourceSummary,
  buildSeoTrend,
  filterRowsBySource
} from "./aggregate";
import {
  buildSeoDateWindow,
  clampYandexStart,
  countInclusiveDays
} from "./dates";
import type {
  SeoDateWindow,
  SeoReport,
  SeoReportInput,
  SeoReportResponse,
  SeoSource,
  SeoSourceDataset,
  SeoSourceReport
} from "./types";

export type SeoProviderExecution =
  | {
      state: "ok";
      dataset: SeoSourceDataset;
    }
  | {
      state: "not_configured";
      missing: string[];
    }
  | {
      state: "error";
      message: string;
    };

type ReportBuildOptions = {
  input: SeoReportInput;
  generatedAt?: Date;
  google: SeoProviderExecution;
  yandex: SeoProviderExecution;
};

type ProviderResponseOptions = {
  input: SeoReportInput;
  generatedAt?: Date;
  execution: SeoProviderExecution;
};

const RESPONSE_QUERY_LIMIT = 1000;

function providerWindow(
  input: SeoReportInput,
  generatedAt: Date
): SeoDateWindow {
  return buildSeoDateWindow(
    input.period,
    generatedAt,
    input.provider === "google"
      ? "America/Los_Angeles"
      : "Europe/Moscow"
  );
}

function sourceReport(
  source: SeoSource,
  execution: SeoProviderExecution,
  requestedStart: string,
  requestedEnd: string
): SeoSourceReport {
  const averagePositionLabel =
    source === "google"
      ? "Средняя позиция в Google Search Console"
      : "Средняя позиция в Яндекс Вебмастере";
  const coverageNote =
    source === "google"
      ? "Сводка считается на уровне ресурса; детализация по запросам может быть неполной из-за правил конфиденциальности Search Console."
      : "Яндекс Вебмастер отдаёт live-историю только за последние 14 дней. Для отчётов за 3–12 месяцев нужна ежедневная фиксация снимков.";

  if (execution.state === "not_configured") {
    return {
      configured: false,
      state: "not_configured",
      message: `Не настроены переменные: ${execution.missing.join(", ")}`,
      requestedStart,
      requestedEnd,
      actualStart: null,
      actualEnd: null,
      truncated: false,
      averagePositionLabel,
      coverageNote
    };
  }

  if (execution.state === "error") {
    return {
      configured: true,
      state: "error",
      message: execution.message,
      requestedStart,
      requestedEnd,
      actualStart: null,
      actualEnd: null,
      truncated: false,
      averagePositionLabel,
      coverageNote
    };
  }

  const hasData =
    execution.dataset.summaryRows.length > 0 ||
    execution.dataset.queryRows.length > 0 ||
    execution.dataset.pageRows.length > 0;
  return {
    configured: true,
    state: hasData ? "ok" : "empty",
    message: hasData
      ? "Данные получены"
      : "За выбранный период данных по заданным фильтрам нет",
    requestedStart,
    requestedEnd,
    actualStart: execution.dataset.actualStart,
    actualEnd: execution.dataset.actualEnd,
    truncated: execution.dataset.truncated,
    averagePositionLabel,
    coverageNote
  };
}

export function buildSeoReport(options: ReportBuildOptions): SeoReport {
  const generatedAt = options.generatedAt ?? new Date();
  const window = providerWindow(options.input, generatedAt);
  const executions = [options.google, options.yandex];
  const configured = executions.filter(
    (item) => item.state !== "not_configured"
  );
  const successes = executions.filter(
    (item): item is Extract<SeoProviderExecution, { state: "ok" }> =>
      item.state === "ok"
  );
  const errors = executions.filter((item) => item.state === "error");
  const summaryRows = successes.flatMap(
    (item) => item.dataset.summaryRows
  );
  const queryRows = successes.flatMap((item) => item.dataset.queryRows);
  const pageRows = successes.flatMap((item) => item.dataset.pageRows);

  let state: SeoReport["state"];
  if (configured.length === 0) state = "not_configured";
  else if (errors.length === configured.length) state = "error";
  else if (errors.length > 0) state = "partial";
  else if (
    summaryRows.length === 0 &&
    queryRows.length === 0 &&
    pageRows.length === 0
  ) {
    state = "empty";
  } else state = "ok";

  return {
    state,
    generatedAt: generatedAt.toISOString(),
    input: options.input,
    window,
    sources: {
      google: sourceReport(
        "google",
        options.google,
        window.previousStart,
        window.currentEnd
      ),
      yandex: sourceReport(
        "yandex",
        options.yandex,
        clampYandexStart(window.previousStart, generatedAt),
        window.currentEnd
      )
    },
    summary: {
      google: buildSeoSourceSummary(
        filterRowsBySource(summaryRows, "google"),
        window
      ),
      yandex: buildSeoSourceSummary(
        filterRowsBySource(summaryRows, "yandex"),
        window
      )
    },
    trend: buildSeoTrend(summaryRows, window),
    queries: buildSeoQueryMetrics(queryRows, window),
    pages: buildSeoPageMetrics(pageRows, window)
  };
}

export function buildSeoReportResponse({
  input,
  generatedAt = new Date(),
  execution
}: ProviderResponseOptions): SeoReportResponse {
  const window = providerWindow(input, generatedAt);
  const includeComparison =
    input.provider === "google" && input.period !== 365;
  const supportedCurrentStart =
    input.provider === "yandex"
      ? clampYandexStart(window.currentStart, generatedAt)
      : window.currentStart;
  const supportedCoverageDays = countInclusiveDays(
    supportedCurrentStart,
    window.currentEnd
  );
  const base: Omit<
    SeoReportResponse,
    "status" | "summary" | "trend" | "queries" | "notices" | "truncated"
  > = {
    provider: input.provider,
    requestedDays: input.period,
    coverageDays: supportedCoverageDays,
    dateRange: {
      start: supportedCurrentStart,
      end: window.currentEnd
    },
    ...(includeComparison
      ? {
          comparisonRange: {
            start: window.previousStart,
            end: window.previousEnd
          }
        }
      : {}),
    generatedAt: generatedAt.toISOString()
  };
  const emptySummary = {
    clicks: 0,
    impressions: 0,
    ctr: null,
    position: null
  } as const;

  if (execution.state === "not_configured") {
    return {
      ...base,
      status: "not_configured",
      summary: emptySummary,
      trend: [],
      queries: [],
      notices: [
        "Источник не подключён. После настройки отчёт начнёт показывать реальные данные."
      ],
      truncated: false,
      setup: execution.missing
    };
  }

  if (execution.state === "error") {
    return {
      ...base,
      status: "error",
      summary: emptySummary,
      trend: [],
      queries: [],
      notices: [execution.message],
      truncated: false
    };
  }

  const currentDates = Array.from(
    new Set(
      execution.dataset.summaryRows
        .filter(
          (row) =>
            row.date >= supportedCurrentStart &&
            row.date <= window.currentEnd
        )
        .map((row) => row.date)
    )
  ).sort();
  const readyBase = {
    ...base,
    coverageDays: currentDates.length,
    dateRange:
      currentDates.length > 0
        ? {
            start: currentDates[0]!,
            end: currentDates.at(-1)!
          }
        : base.dateRange
  };
  const summary = buildSeoSourceSummary(
    execution.dataset.summaryRows,
    window
  );
  const allQueryMetrics = buildSeoQueryMetrics(
    execution.dataset.queryRows,
    window
  );
  const queryMetrics = allQueryMetrics.slice(0, RESPONSE_QUERY_LIMIT);
  const responseTruncated =
    execution.dataset.truncated ||
    allQueryMetrics.length > RESPONSE_QUERY_LIMIT;
  const trend = buildSeoTrend(
    execution.dataset.summaryRows,
    window
  ).map((point) => {
    const metrics = point[input.provider];
    return {
      date: point.date,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      ctr: metrics.ctr,
      position: metrics.averagePosition
    };
  });
  const notices =
    input.provider === "google"
      ? [
          "Сводные клики, показы, CTR и график рассчитаны на уровне всего ресурса без двойного учёта страниц.",
          "Позиция — среднее значение Google Search Console, а не разовая проверка места в выдаче.",
          "Детализация по запросам может быть неполной из-за правил конфиденциальности Search Console; указана наиболее заметная посадочная страница."
        ]
      : [
          "Позиция — среднее значение Яндекс Вебмастера по выбранным фильтрам.",
          "Live API Яндекса хранит только последние 14 дней; длинные периоды станут доступны после накопления собственной истории.",
          "Для запроса Яндекс возвращает только его наиболее популярную посадочную страницу."
        ];
  if (input.provider === "google" && input.period === 365) {
    notices.push(
      "Сравнение с предыдущим годом отключено: live-истории Search Console недостаточно для двух полных лет."
    );
  }
  if (
    execution.dataset.summaryRows.length === 0 &&
    execution.dataset.queryRows.length === 0
  ) {
    notices.push("За выбранный период данных по заданным фильтрам нет.");
  }
  if (responseTruncated) {
    notices.push(
      `Показаны первые ${RESPONSE_QUERY_LIMIT} наиболее значимых запросов; используйте фильтр или CSV для более узкой выборки.`
    );
  }

  return {
    ...readyBase,
    status: "ready",
    summary: {
      clicks: summary.current.clicks,
      impressions: summary.current.impressions,
      ctr: summary.current.ctr,
      position: summary.current.averagePosition,
      ...(includeComparison
        ? {
            previousClicks: summary.previous.clicks,
            previousImpressions: summary.previous.impressions,
            previousCtr: summary.previous.ctr,
            previousPosition: summary.previous.averagePosition
          }
        : {})
    },
    trend,
    queries: queryMetrics.map((metric) => ({
      query: metric.query,
      page: metric.page,
      clicks: metric.clicks,
      impressions: metric.impressions,
      ctr: metric.ctr,
      position: metric.averagePosition,
      ...(metric.previousAveragePosition !== null
        ? { previousPosition: metric.previousAveragePosition }
        : {}),
      ...(metric.positionImprovement !== null
        ? { positionChange: metric.positionImprovement }
        : {})
    })),
    notices,
    truncated: responseTruncated
  };
}
