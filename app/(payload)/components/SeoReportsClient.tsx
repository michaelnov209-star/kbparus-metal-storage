"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Download,
  ExternalLink,
  LoaderCircle,
  Minus,
  RefreshCw,
  Search,
  Settings2,
  Target,
  TrendingUp
} from "lucide-react";
import type {
  SeoProvider,
  SeoReportDevice,
  SeoReportPeriod,
  SeoReportResponse
} from "@/lib/seo-reporting/types";

const SeoGoalsClient = lazy(() =>
  import("./SeoGoalsClient").then((module) => ({
    default: module.SeoGoalsClient
  }))
);

const PERIODS = [
  { days: 30, label: "1 месяц" },
  { days: 90, label: "3 месяца" },
  { days: 180, label: "Полгода" },
  { days: 365, label: "Год" }
] as const;

const PROVIDERS: Array<{ value: SeoProvider; label: string }> = [
  { value: "google", label: "Google" },
  { value: "yandex", label: "Яндекс" }
];

const DEVICES: Array<{ value: SeoReportDevice; label: string }> = [
  { value: "all", label: "Все устройства" },
  { value: "desktop", label: "Компьютеры" },
  { value: "mobile", label: "Смартфоны" },
  { value: "tablet", label: "Планшеты" }
];

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function formatPosition(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Нет данных";
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${(value * 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(date);
}

function getDisplayPath(value: string): string {
  try {
    return new URL(value).pathname || "/";
  } catch {
    return value;
  }
}

function delta(current: number | null | undefined, previous: number | null | undefined) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous)
  ) {
    return null;
  }
  return current - previous;
}

function percentagePointDelta(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  const value = delta(current, previous);
  return value === null ? null : value * 100;
}

function DeltaBadge({
  value,
  inverse = false,
  suffix = ""
}: {
  value: number | null;
  inverse?: boolean;
  suffix?: string;
}) {
  if (value === null) {
    return (
      <span className="kb-seo-delta is-neutral">
        <Minus size={13} aria-hidden /> нет сравнения
      </span>
    );
  }

  if (Math.abs(value) < 0.05) {
    return (
      <span className="kb-seo-delta is-neutral">
        <Minus size={13} aria-hidden /> без изменений
      </span>
    );
  }

  const isPositive = inverse ? value < 0 : value > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`kb-seo-delta ${isPositive ? "is-positive" : "is-negative"}`}>
      <Icon size={13} aria-hidden />
      {Math.abs(value).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
      {suffix}
    </span>
  );
}

function PositionChart({ report }: { report: SeoReportResponse }) {
  const points = report.trend.filter(
    (
      point
    ): point is (typeof report.trend)[number] & {
      position: number;
    } => typeof point.position === "number" && Number.isFinite(point.position)
  );
  if (points.length < 2) {
    return (
      <div className="kb-seo-chart-empty">
        <BarChart3 size={22} aria-hidden />
        <span>Для графика пока недостаточно данных.</span>
      </div>
    );
  }

  const width = 900;
  const height = 250;
  const paddingX = 22;
  const paddingY = 24;
  const values = points.map((point) => point.position);
  const min = Math.max(1, Math.min(...values) - 1);
  const max = Math.max(min + 1, Math.max(...values) + 1);
  const range = max - min;
  const polyline = points
    .map((point, index) => {
      const x =
        paddingX +
        (index / Math.max(1, points.length - 1)) * (width - paddingX * 2);
      const y =
        paddingY +
        ((point.position - min) / range) * (height - paddingY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="kb-seo-chart">
      <div className="kb-seo-chart__labels" aria-hidden>
        <span>Позиция {min.toFixed(0)}</span>
        <span>Позиция {max.toFixed(0)}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Динамика средней позиции с ${formatDate(points[0].date)} по ${formatDate(points.at(-1)!.date)}`}
      >
        <defs>
          <linearGradient id="kb-seo-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fc5413" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fc5413" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={paddingX} x2={width - paddingX} y1={height / 2} y2={height / 2} />
        <polygon
          points={`${paddingX},${height - paddingY} ${polyline} ${width - paddingX},${height - paddingY}`}
          fill="url(#kb-seo-line-fill)"
        />
        <polyline points={polyline} fill="none" stroke="#fc5413" strokeWidth="4" />
      </svg>
      <div className="kb-seo-chart__dates">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points.at(-1)!.date)}</span>
      </div>
    </div>
  );
}

function exportCsv(report: SeoReportResponse) {
  const rows = [
    [
      "Запрос",
      "Страница",
      "Средняя позиция",
      "Изменение позиции",
      "Показы",
      "Клики",
      "CTR"
    ],
    ...report.queries.map((row) => [
      row.query,
      row.page ?? "",
      typeof row.position === "number" ? row.position.toFixed(2) : "",
      row.positionChange === null || row.positionChange === undefined
        ? ""
        : row.positionChange.toFixed(2),
      String(row.impressions),
      String(row.clicks),
      typeof row.ctr === "number" ? (row.ctr * 100).toFixed(2) : ""
    ])
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `seo-${report.provider}-${report.dateRange.start}-${report.dateRange.end}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

type SeoReportView = "visibility" | "goals";

export function SeoReportsClient() {
  const [filtersReady, setFiltersReady] = useState(false);
  const [activeView, setActiveView] = useState<SeoReportView>("visibility");
  const [period, setPeriod] = useState<SeoReportPeriod>(30);
  const [provider, setProvider] = useState<SeoProvider>("yandex");
  const [device, setDevice] = useState<SeoReportDevice>("all");
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<SeoReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedPeriod = Number(params.get("period"));
    const requestedProvider = params.get("provider");
    const requestedDevice = params.get("device");
    const requestedQuery = params.get("query")?.trim() ?? "";

    setActiveView(params.get("view") === "goals" ? "goals" : "visibility");
    if (PERIODS.some((item) => item.days === requestedPeriod)) {
      setPeriod(requestedPeriod as SeoReportPeriod);
    }
    if (PROVIDERS.some((item) => item.value === requestedProvider)) {
      setProvider(requestedProvider as SeoProvider);
    }
    if (DEVICES.some((item) => item.value === requestedDevice)) {
      setDevice(requestedDevice as SeoReportDevice);
    }
    setQueryDraft(requestedQuery);
    setQuery(requestedQuery);
    setFiltersReady(true);
  }, []);

  const loadReport = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          period: String(period),
          provider,
          device
        });
        if (query) params.set("query", query);

        const response = await fetch(`/api/admin/seo/report?${params}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal
        });
        const payload = (await response.json()) as SeoReportResponse | { error?: string };
        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Не удалось загрузить SEO-отчёт."
          );
        }
        setReport(payload as SeoReportResponse);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не удалось загрузить SEO-отчёт."
        );
        setReport(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [device, period, provider, query]
  );

  useEffect(() => {
    if (!filtersReady || activeView !== "visibility") return;

    const controller = new AbortController();
    void loadReport(controller.signal);
    return () => controller.abort();
  }, [activeView, filtersReady, loadReport]);

  useEffect(() => {
    if (!filtersReady) return;

    const params = new URLSearchParams(window.location.search);
    params.set("view", activeView);
    params.set("period", String(period));

    if (activeView === "visibility") {
      params.set("provider", provider);
      params.set("device", device);
      if (query) params.set("query", query);
      else params.delete("query");
    } else {
      params.delete("provider");
      params.delete("device");
      params.delete("query");
    }

    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      search ? `${window.location.pathname}?${search}` : window.location.pathname
    );
  }, [activeView, device, filtersReady, period, provider, query]);

  const handleGoalsLoadingChange = useCallback((value: boolean) => {
    setGoalsLoading(value);
  }, []);

  const handleRefresh = useCallback(() => {
    if (activeView === "goals") {
      setGoalsRefreshKey((value) => value + 1);
      return;
    }
    void loadReport();
  }, [activeView, loadReport]);

  const queryStats = useMemo(() => {
    const rows = report?.queries || [];
    return {
      top3: rows.filter(
        (row) => typeof row.position === "number" && row.position <= 3
      ).length,
      top10: rows.filter(
        (row) => typeof row.position === "number" && row.position <= 10
      ).length,
      top20: rows.filter(
        (row) => typeof row.position === "number" && row.position <= 20
      ).length,
      growing: rows.filter((row) => (row.positionChange ?? 0) > 0.2).length,
      falling: rows.filter((row) => (row.positionChange ?? 0) < -0.2).length
    };
  }, [report]);

  const summary = report?.summary;
  const providerLabel = PROVIDERS.find((item) => item.value === provider)?.label ?? provider;
  const activeLoading = activeView === "goals" ? goalsLoading : loading;

  if (!filtersReady) {
    return (
      <section
        className="kb-seo-view"
        aria-label="Загрузка раздела аналитики"
        aria-busy="true"
      >
        <div className="kb-seo-initializing" role="status" aria-live="polite">
          <LoaderCircle className="is-spinning" size={22} aria-hidden />
          <div>
            <strong>Открываю аналитику</strong>
            <span>Восстанавливаю выбранный раздел и период.</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="kb-seo-view"
      aria-label={
        activeView === "goals"
          ? "Цели и конверсии"
          : "SEO-отчёты и позиции"
      }
    >
      <header className="kb-seo-view__header">
        <div>
          <span className="kb-seo-view__eyebrow">
            {activeView === "goals" ? (
              <Target size={16} aria-hidden />
            ) : (
              <TrendingUp size={16} aria-hidden />
            )}
            SEO Reporting Center
          </span>
          <h1>
            {activeView === "goals"
              ? "Цели и конверсии"
              : "Поисковая видимость и позиции"}
          </h1>
          <p>
            {activeView === "goals"
              ? "Звонки, заявки, переходы в мессенджеры и другие полезные действия по всем каналам. Видно и количество событий, и реальные целевые визиты."
              : "Реальные показы, клики, CTR и средняя позиция по данным поисковых систем. Позиция считается только там, где сайт участвовал в выдаче."}
          </p>
        </div>
        <button
          className="kb-seo-refresh"
          type="button"
          onClick={handleRefresh}
          disabled={activeLoading || !filtersReady}
        >
          <RefreshCw
            size={16}
            aria-hidden
            className={activeLoading ? "is-spinning" : ""}
          />
          Обновить
        </button>
      </header>

      <div
        className="kb-seo-tabs"
        role="tablist"
        aria-label="Разделы аналитики"
      >
        <button
          id="kb-seo-tab-visibility"
          type="button"
          role="tab"
          aria-selected={activeView === "visibility"}
          aria-controls="kb-seo-panel-visibility"
          className={activeView === "visibility" ? "is-active" : undefined}
          onClick={() => setActiveView("visibility")}
        >
          <BarChart3 size={17} aria-hidden />
          Поисковая видимость
        </button>
        <button
          id="kb-seo-tab-goals"
          type="button"
          role="tab"
          aria-selected={activeView === "goals"}
          aria-controls="kb-seo-panel-goals"
          className={activeView === "goals" ? "is-active" : undefined}
          onClick={() => setActiveView("goals")}
        >
          <Target size={17} aria-hidden />
          Цели и конверсии
        </button>
      </div>

      <div
        className={`kb-seo-controls ${
          activeView === "goals" ? "kb-seo-controls--period-only" : ""
        }`}
        aria-label="Фильтры отчёта"
      >
        <div className="kb-seo-control-group">
          <span>Период</span>
          <div className="kb-seo-segmented">
            {PERIODS.map((item) => (
              <button
                className={period === item.days ? "is-active" : undefined}
                type="button"
                key={item.days}
                onClick={() => setPeriod(item.days)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {activeView === "visibility" ? (
          <>
            <div className="kb-seo-control-group">
              <span>Поисковик</span>
          <div className="kb-seo-segmented">
            {PROVIDERS.map((item) => (
              <button
                className={provider === item.value ? "is-active" : undefined}
                type="button"
                key={item.value}
                onClick={() => setProvider(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="kb-seo-select">
          <span>Устройство</span>
          <select
            value={device}
            onChange={(event) =>
              setDevice(event.target.value as SeoReportDevice)
            }
          >
            {DEVICES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <form
          className="kb-seo-search"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(queryDraft.trim());
          }}
        >
          <span>Определённый запрос</span>
          <div>
            <Search size={16} aria-hidden />
            <input
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
              placeholder="Например: склад листового металла…"
              maxLength={160}
            />
            <button type="submit">Показать</button>
          </div>
            </form>
          </>
        ) : null}
      </div>

      <div
        id="kb-seo-panel-visibility"
        role="tabpanel"
        aria-labelledby="kb-seo-tab-visibility"
        aria-busy={activeView === "visibility" && loading}
        hidden={activeView !== "visibility"}
      >
      {loading && !report ? (
        <div className="kb-seo-state">
          <LoaderCircle className="is-spinning" size={28} aria-hidden />
          <h2>Загружаю данные {providerLabel}</h2>
          <p>Формируется отчёт за выбранный период.</p>
        </div>
      ) : null}

      {error ? (
        <div className="kb-seo-state is-error" role="alert">
          <AlertCircle size={28} aria-hidden />
          <h2>Отчёт не загрузился</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadReport()}>
            Повторить
          </button>
        </div>
      ) : null}

      {report?.status === "error" ? (
        <div className="kb-seo-state is-error" role="alert">
          <AlertCircle size={28} aria-hidden />
          <h2>{providerLabel} временно не вернул данные</h2>
          <p>{report.notices[0] ?? "Проверьте доступ и повторите запрос."}</p>
          <button type="button" onClick={() => void loadReport()}>
            Повторить
          </button>
        </div>
      ) : null}

      {report?.status === "not_configured" ? (
        <div className="kb-seo-state is-setup">
          <Settings2 size={28} aria-hidden />
          <h2>Подключите {providerLabel}</h2>
          <p>
            Интерфейс готов. Для реальных отчётов нужно выдать сайту доступ только
            на чтение к данным поисковой системы.
          </p>
          <ul>
            {(report.setup || []).map((item) => (
              <li key={item}>
                <CheckCircle2 size={16} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report?.status === "ready" && summary ? (
        <>
          <div className="kb-seo-coverage">
            <span>
              <CheckCircle2 size={16} aria-hidden />
              {providerLabel}: данные с {formatDate(report.dateRange.start)} по{" "}
              {formatDate(report.dateRange.end)}
            </span>
            <strong>
              {provider === "yandex"
                ? `Накоплено ${report.coverageDays} из ${report.requestedDays} дней истории`
                : `Покрытие ${report.coverageDays} из ${report.requestedDays} дней`}
            </strong>
          </div>

          <div className="kb-seo-kpis">
            <article>
              <span>Клики</span>
              <strong>{formatNumber(summary.clicks)}</strong>
              <DeltaBadge value={delta(summary.clicks, summary.previousClicks)} />
            </article>
            <article>
              <span>Показы</span>
              <strong>{formatNumber(summary.impressions)}</strong>
              <DeltaBadge value={delta(summary.impressions, summary.previousImpressions)} />
            </article>
            <article>
              <span>CTR</span>
              <strong>{formatPercent(summary.ctr)}</strong>
              <DeltaBadge
                value={percentagePointDelta(summary.ctr, summary.previousCtr)}
                suffix=" п.п."
              />
            </article>
            <article>
              <span>Средняя позиция</span>
              <strong>{formatPosition(summary.position)}</strong>
              <DeltaBadge
                value={delta(summary.position, summary.previousPosition)}
                inverse
              />
            </article>
          </div>

          <div className="kb-seo-position-strip">
            <article>
              <span>В топ-3</span>
              <strong>{queryStats.top3}</strong>
            </article>
            <article>
              <span>В топ-10</span>
              <strong>{queryStats.top10}</strong>
            </article>
            <article>
              <span>В топ-20</span>
              <strong>{queryStats.top20}</strong>
            </article>
            <article className="is-positive">
              <span>Выросли</span>
              <strong>+{queryStats.growing}</strong>
            </article>
            <article className="is-negative">
              <span>Снизились</span>
              <strong>−{queryStats.falling}</strong>
            </article>
          </div>

          <section className="kb-seo-panel">
            <div className="kb-seo-panel__head">
              <div>
                <span>Динамика</span>
                <h2>Средняя позиция по дням</h2>
              </div>
              <small>Чем меньше число, тем выше сайт в выдаче</small>
            </div>
            <PositionChart report={report} />
          </section>

          <section className="kb-seo-panel">
            <div className="kb-seo-panel__head">
              <div>
                <span>Запросы и страницы</span>
                <h2>
                  {query
                    ? `Результаты по запросу «${query}»`
                    : "Поисковые запросы сайта"}
                </h2>
              </div>
              <button
                className="kb-seo-export"
                type="button"
                onClick={() => exportCsv(report)}
                disabled={report.queries.length === 0}
              >
                <Download size={15} aria-hidden />
                Скачать CSV
              </button>
            </div>

            {report.queries.length > 0 ? (
              <div className="kb-seo-table-wrap">
                <table className="kb-seo-table">
                  <thead>
                    <tr>
                      <th>Запрос</th>
                      <th>
                        {provider === "yandex"
                          ? "Популярная страница"
                          : "Страница"}
                      </th>
                      <th>Позиция</th>
                      <th>Изменение</th>
                      <th>Показы</th>
                      <th>Клики</th>
                      <th>CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.queries.map((row) => (
                      <tr key={`${row.query}-${row.page}`}>
                        <td data-label="Запрос">
                          <strong>{row.query}</strong>
                        </td>
                        <td
                          data-label={
                            provider === "yandex"
                              ? "Популярная страница"
                              : "Страница"
                          }
                        >
                          {row.page ? (
                            <a href={row.page} target="_blank" rel="noreferrer">
                              <span>{getDisplayPath(row.page)}</span>
                              <ExternalLink size={13} aria-hidden />
                            </a>
                          ) : (
                            <span>Страница не определена</span>
                          )}
                        </td>
                        <td data-label="Позиция">
                          <strong>{formatPosition(row.position)}</strong>
                        </td>
                        <td data-label="Изменение">
                          <DeltaBadge
                            value={
                              row.positionChange === null ||
                              row.positionChange === undefined
                                ? null
                                : -row.positionChange
                            }
                            inverse
                          />
                        </td>
                        <td data-label="Показы">{formatNumber(row.impressions)}</td>
                        <td data-label="Клики">{formatNumber(row.clicks)}</td>
                        <td data-label="CTR">{formatPercent(row.ctr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="kb-seo-chart-empty">
                <Search size={22} aria-hidden />
                <span>
                  По выбранным фильтрам показов нет. Это не означает позицию «100+».
                </span>
              </div>
            )}

            {report.truncated ? (
              <p className="kb-seo-footnote">
                Показаны наиболее значимые строки, доступные через API поисковой системы.
              </p>
            ) : null}
          </section>

          {report.notices.length > 0 ? (
            <div className="kb-seo-notices">
              {report.notices.map((notice) => (
                <p key={notice}>
                  <AlertCircle size={15} aria-hidden />
                  {notice}
                </p>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
      </div>

      <div
        id="kb-seo-panel-goals"
        role="tabpanel"
        aria-labelledby="kb-seo-tab-goals"
        aria-busy={activeView === "goals" && goalsLoading}
        hidden={activeView !== "goals"}
      >
        {activeView === "goals" ? (
          <Suspense
            fallback={(
              <div className="kb-seo-initializing" role="status" aria-live="polite">
                <LoaderCircle className="is-spinning" size={22} aria-hidden />
                <div>
                  <strong>Открываю цели и конверсии</strong>
                  <span>Загружаю только данные и интерфейс выбранной вкладки.</span>
                </div>
              </div>
            )}
          >
            <SeoGoalsClient
              period={period}
              refreshKey={goalsRefreshKey}
              onLoadingChange={handleGoalsLoadingChange}
            />
          </Suspense>
        ) : null}
      </div>
    </section>
  );
}
