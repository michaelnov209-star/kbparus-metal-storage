"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  LoaderCircle,
  Minus,
  MousePointerClick,
  Settings2,
  ShieldAlert,
  Target,
  Users
} from "lucide-react";
import type { SeoReportPeriod } from "@/lib/seo-reporting/types";

type MetrikaGoalKey =
  | "phone_click"
  | "form_submit"
  | "lead_submit_success"
  | "messenger_click"
  | "email_click"
  | "calculator_start"
  | (string & {});

type MetrikaGoalMetrics = {
  visits: number | null;
  reaches: number | null;
  convertedVisits: number | null;
  conversionRate: number | null;
};

type MetrikaGoalReport = {
  key: MetrikaGoalKey;
  id: number;
  name: string;
  conditionIdentifier: string;
  current: MetrikaGoalMetrics;
  previous: MetrikaGoalMetrics;
};

type MetrikaDailyPoint = {
  date: string;
  visits: number | null;
  goals: Partial<
    Record<
      MetrikaGoalKey,
      Omit<MetrikaGoalMetrics, "visits">
    >
  >;
};

type MetrikaSampling = {
  accuracy: "full";
  sampled: boolean | null;
  sampleShare: number | null;
  sampleSize: number | null;
  sampleSpace: number | null;
  dataLag: number | null;
  containsSensitiveData: boolean | null;
  totalRows: number | null;
};

type MetrikaReadyReport = {
  status: "ready";
  period: SeoReportPeriod;
  generatedAt: string;
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
  goals: MetrikaGoalReport[];
  missingGoalKeys: MetrikaGoalKey[];
  trend: {
    current: MetrikaDailyPoint[];
    previous: MetrikaDailyPoint[];
  };
  sampling: {
    current: MetrikaSampling;
    previous: MetrikaSampling;
  };
};

type MetrikaStateReport = {
  status: "not_configured" | "permission_error" | "error";
  period: SeoReportPeriod;
  generatedAt: string;
  message: string;
  missing?: string[];
};

type MetrikaReport = MetrikaReadyReport | MetrikaStateReport;

type SeoGoalsClientProps = {
  period: SeoReportPeriod;
  refreshKey: number;
  onLoadingChange: (loading: boolean) => void;
};

const GOAL_LABELS: Record<string, string> = {
  phone_click: "Клики по телефону",
  form_submit: "Отправки формы",
  lead_submit_success: "Успешные заявки",
  messenger_click: "Переходы в мессенджер",
  email_click: "Клики по email",
  calculator_start: "Запуски калькулятора"
};

function isMetrikaReport(value: unknown): value is MetrikaReport {
  if (!value || typeof value !== "object") return false;
  const status = (value as { status?: unknown }).status;
  return (
    status === "ready" ||
    status === "not_configured" ||
    status === "permission_error" ||
    status === "error"
  );
}

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number | null | undefined): string {
  if (!finite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(value);
}

function formatConversionRate(value: number | null | undefined): string {
  if (!finite(value)) return "—";
  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
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

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
}

function goalLabel(goal: Pick<MetrikaGoalReport, "key" | "name">): string {
  return GOAL_LABELS[goal.key] ?? goal.name;
}

function goalKeyLabel(key: MetrikaGoalKey): string {
  return GOAL_LABELS[key] ?? key;
}

function GoalDelta({
  current,
  previous,
  percentagePoints = false
}: {
  current: number | null;
  previous: number | null;
  percentagePoints?: boolean;
}) {
  if (!finite(current) || !finite(previous)) {
    return (
      <span className="kb-seo-delta is-neutral">
        <Minus size={13} aria-hidden />
        нет сравнения
      </span>
    );
  }

  const value = current - previous;
  if (Math.abs(value) < 0.001) {
    return (
      <span className="kb-seo-delta is-neutral">
        <Minus size={13} aria-hidden />
        без изменений
      </span>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`kb-seo-delta ${isPositive ? "is-positive" : "is-negative"}`}>
      <Icon size={13} aria-hidden />
      {isPositive ? "+" : "−"}
      {Math.abs(value).toLocaleString("ru-RU", {
        maximumFractionDigits: percentagePoints ? 2 : 0
      })}
      {percentagePoints ? " п.п." : ""}
    </span>
  );
}

function GoalTrendChart({
  goal,
  points
}: {
  goal: MetrikaGoalReport;
  points: MetrikaDailyPoint[];
}) {
  const width = 900;
  const height = 260;
  const paddingX = 26;
  const paddingY = 28;

  const reaches = points.flatMap((point, index) => {
    const value = point.goals[goal.key]?.reaches;
    return finite(value) ? [{ index, value }] : [];
  });
  const convertedVisits = points.flatMap((point, index) => {
    const value = point.goals[goal.key]?.convertedVisits;
    return finite(value) ? [{ index, value }] : [];
  });
  const values = [...reaches, ...convertedVisits].map((point) => point.value);

  if (
    points.length < 2 ||
    values.length < 2 ||
    (reaches.length < 2 && convertedVisits.length < 2)
  ) {
    return (
      <div className="kb-seo-chart-empty">
        <BarChart3 size={22} aria-hidden />
        <span>
          Для динамики цели пока недостаточно дневных данных. Нулевые значения
          вместо отсутствующих не подставляются.
        </span>
      </div>
    );
  }

  const maxValue = Math.max(1, ...values);
  const x = (index: number) =>
    paddingX +
    (index / Math.max(1, points.length - 1)) * (width - paddingX * 2);
  const y = (value: number) =>
    height -
    paddingY -
    (value / maxValue) * (height - paddingY * 2);
  const toPolyline = (series: Array<{ index: number; value: number }>) =>
    series
      .map((point) => `${x(point.index).toFixed(1)},${y(point.value).toFixed(1)}`)
      .join(" ");

  return (
    <div className="kb-seo-goal-chart">
      <div className="kb-seo-goal-chart__scale" aria-hidden>
        <span>{formatNumber(maxValue)}</span>
        <span>{formatNumber(maxValue / 2)}</span>
        <span>0</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Динамика цели «${goalLabel(goal)}» с ${formatDate(points[0].date)} по ${formatDate(points.at(-1)!.date)}`}
      >
        <defs>
          <linearGradient
            id={`kb-seo-goal-fill-${goal.id}`}
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#fc5413" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#fc5413" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={paddingX}
            x2={width - paddingX}
            y1={paddingY + ratio * (height - paddingY * 2)}
            y2={paddingY + ratio * (height - paddingY * 2)}
          />
        ))}
        {reaches.length >= 2 ? (
          <>
            <polygon
              points={`${x(reaches[0].index)},${height - paddingY} ${toPolyline(reaches)} ${x(reaches.at(-1)!.index)},${height - paddingY}`}
              fill={`url(#kb-seo-goal-fill-${goal.id})`}
            />
            <polyline
              points={toPolyline(reaches)}
              fill="none"
              stroke="#fc5413"
              strokeWidth="4"
            />
          </>
        ) : null}
        {convertedVisits.length >= 2 ? (
          <polyline
            points={toPolyline(convertedVisits)}
            fill="none"
            stroke="#283746"
            strokeDasharray="9 7"
            strokeWidth="3"
          />
        ) : null}
      </svg>
      <div className="kb-seo-goal-chart__footer">
        <span>{formatDate(points[0].date)}</span>
        <div className="kb-seo-goal-chart__legend" aria-label="Легенда графика">
          <span className="is-reaches">Достижения</span>
          <span className="is-visits">Целевые визиты</span>
        </div>
        <span>{formatDate(points.at(-1)!.date)}</span>
      </div>
    </div>
  );
}

function setupLabel(value: string): string {
  if (value.includes("OAUTH")) return "OAuth-доступ к Яндекс Метрике";
  if (value.includes("COUNTER") || value.includes("METRIKA_ID")) {
    return "ID счётчика Яндекс Метрики";
  }
  return "Серверное подключение Метрики";
}

export function SeoGoalsClient({
  period,
  refreshKey,
  onLoadingChange
}: SeoGoalsClientProps) {
  const [report, setReport] = useState<MetrikaReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoalKey, setSelectedGoalKey] =
    useState<MetrikaGoalKey>("lead_submit_success");

  const loadReport = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      onLoadingChange(true);
      setError(null);
      setReport(null);

      try {
        const params = new URLSearchParams({ period: String(period) });
        if (refreshKey > 0) params.set("refresh", "1");
        const response = await fetch(`/api/admin/seo/metrika?${params}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal
        });
        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            typeof (payload as { error?: unknown }).error === "string"
              ? (payload as { error: string }).error
              : "Не удалось загрузить цели Яндекс Метрики.";
          throw new Error(message);
        }
        if (!isMetrikaReport(payload)) {
          throw new Error("Сервис целей вернул данные в неожиданном формате.");
        }

        setReport(payload);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не удалось загрузить цели Яндекс Метрики."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          onLoadingChange(false);
        }
      }
    },
    [onLoadingChange, period, refreshKey]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadReport(controller.signal);
    return () => {
      controller.abort();
      onLoadingChange(false);
    };
  }, [loadReport, onLoadingChange, refreshKey]);

  const readyReport = report?.status === "ready" ? report : null;
  const selectedGoal = useMemo(() => {
    if (!readyReport) return null;
    return (
      readyReport.goals.find((goal) => goal.key === selectedGoalKey) ??
      readyReport.goals[0] ??
      null
    );
  }, [readyReport, selectedGoalKey]);

  return (
    <div className="kb-seo-goals" aria-busy={loading}>
      {loading ? (
        <div className="kb-seo-state" role="status" aria-live="polite">
          <LoaderCircle className="is-spinning" size={28} aria-hidden />
          <h2>Загружаю цели и конверсии</h2>
          <p>
            Получаю точные метрики Яндекс Метрики за выбранный период и период
            сравнения.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="kb-seo-state is-error" role="alert">
          <AlertCircle size={28} aria-hidden />
          <h2>Конверсии не загрузились</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadReport()}>
            Повторить
          </button>
        </div>
      ) : null}

      {report?.status === "not_configured" ? (
        <div className="kb-seo-state is-setup">
          <Settings2 size={28} aria-hidden />
          <h2>Подключите отчёты Яндекс Метрики</h2>
          <p>{report.message}</p>
          <ul>
            {(report.missing?.length
              ? [...new Set(report.missing.map(setupLabel))]
              : ["OAuth-доступ и ID счётчика"]
            ).map((item) => (
              <li key={item}>
                <CheckCircle2 size={16} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report?.status === "permission_error" ? (
        <div className="kb-seo-state is-error" role="alert">
          <ShieldAlert size={28} aria-hidden />
          <h2>Нет доступа к счётчику</h2>
          <p>{report.message}</p>
          <button type="button" onClick={() => void loadReport()}>
            Проверить снова
          </button>
        </div>
      ) : null}

      {report?.status === "error" ? (
        <div className="kb-seo-state is-error" role="alert">
          <AlertCircle size={28} aria-hidden />
          <h2>Яндекс Метрика временно не ответила</h2>
          <p>{report.message}</p>
          <button type="button" onClick={() => void loadReport()}>
            Повторить
          </button>
        </div>
      ) : null}

      {readyReport ? (
        <>
          <div className="kb-seo-coverage kb-seo-coverage--goals">
            <span>
              <CheckCircle2 size={16} aria-hidden />
              Все каналы: данные с {formatDate(readyReport.dateRange.start)} по{" "}
              {formatDate(readyReport.dateRange.end)}
            </span>
            <strong>
              Сравнение: {formatDate(readyReport.comparisonRange.start)} —{" "}
              {formatDate(readyReport.comparisonRange.end)}
            </strong>
          </div>

          <div className="kb-seo-goals-overview">
            <article>
              <span>
                <Users size={17} aria-hidden />
                Все визиты
              </span>
              <strong>{formatNumber(readyReport.visits.current)}</strong>
              <GoalDelta
                current={readyReport.visits.current}
                previous={readyReport.visits.previous}
              />
              <small>Поиск, реклама, прямые и другие источники</small>
            </article>
            <article>
              <span>
                <Target size={17} aria-hidden />
                Настроенные цели
              </span>
              <strong>{formatNumber(readyReport.goals.length)}</strong>
              <small>Цели, найденные в счётчике и включённые в отчёт</small>
            </article>
            <article>
              <span>
                <CheckCircle2 size={17} aria-hidden />
                Точность
              </span>
              <strong>
                {readyReport.sampling.current.sampled === true
                  ? "С выборкой"
                  : readyReport.sampling.current.sampled === false
                    ? "Полные данные"
                    : "Максимальная точность"}
              </strong>
              <small>Запрос выполняется с максимальной точностью Метрики</small>
            </article>
          </div>

          <div className="kb-seo-goal-definitions">
            <div>
              <MousePointerClick size={19} aria-hidden />
              <p>
                <strong>Достижения</strong>
                Точное число событий или кликов по цели.
              </p>
            </div>
            <div>
              <Users size={19} aria-hidden />
              <p>
                <strong>Целевые визиты</strong>
                Посещения, в которых цель была выполнена хотя бы один раз.
              </p>
            </div>
            <p>
              Два клика в одном визите могут дать 2 достижения и 1 целевой
              визит. Поэтому эти показатели не должны совпадать.
            </p>
          </div>

          {readyReport.goals.length > 0 ? (
            <>
              <div className="kb-seo-goal-grid" aria-label="Метрики по целям">
                {readyReport.goals.map((goal) => {
                  const active = selectedGoal?.key === goal.key;
                  return (
                    <article
                      className={`kb-seo-goal-card ${active ? "is-active" : ""}`}
                      key={goal.key}
                    >
                      <div className="kb-seo-goal-card__head">
                        <div>
                          <span>Цель Метрики</span>
                          <h2>{goalLabel(goal)}</h2>
                          <small>{goal.name}</small>
                        </div>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedGoalKey(goal.key)}
                        >
                          {active ? "На графике" : "Показать график"}
                        </button>
                      </div>
                      <div className="kb-seo-goal-card__metrics">
                        <div>
                          <span>Достижения</span>
                          <strong>{formatNumber(goal.current.reaches)}</strong>
                          <GoalDelta
                            current={goal.current.reaches}
                            previous={goal.previous.reaches}
                          />
                        </div>
                        <div>
                          <span>Целевые визиты</span>
                          <strong>
                            {formatNumber(goal.current.convertedVisits)}
                          </strong>
                          <GoalDelta
                            current={goal.current.convertedVisits}
                            previous={goal.previous.convertedVisits}
                          />
                        </div>
                        <div>
                          <span>Конверсия</span>
                          <strong>
                            {formatConversionRate(goal.current.conversionRate)}
                          </strong>
                          <GoalDelta
                            current={goal.current.conversionRate}
                            previous={goal.previous.conversionRate}
                            percentagePoints
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {selectedGoal ? (
                <section className="kb-seo-panel kb-seo-goal-trend">
                  <div className="kb-seo-panel__head">
                    <div>
                      <span>Динамика цели</span>
                      <h2>{goalLabel(selectedGoal)} по дням</h2>
                    </div>
                    <small>
                      Достижения и целевые визиты · все каналы
                    </small>
                  </div>
                  <GoalTrendChart
                    goal={selectedGoal}
                    points={readyReport.trend.current}
                  />
                </section>
              ) : null}
            </>
          ) : (
            <div className="kb-seo-state is-setup">
              <Target size={28} aria-hidden />
              <h2>Нужные цели не найдены</h2>
              <p>
                В счётчике нет action-целей, которые использует сайт. Метрики не
                заменены нулями.
              </p>
            </div>
          )}

          {readyReport.missingGoalKeys.length > 0 ? (
            <div className="kb-seo-notices">
              <p>
                <AlertCircle size={15} aria-hidden />
                Не найдены в счётчике:{" "}
                {readyReport.missingGoalKeys.map(goalKeyLabel).join(", ")}.
                Для них показатели не отображаются.
              </p>
            </div>
          ) : null}

          {readyReport.sampling.current.sampled === true ? (
            <div className="kb-seo-notices">
              <p>
                <AlertCircle size={15} aria-hidden />
                Яндекс Метрика применила выборку. Значения показаны как вернул
                API и могут отличаться от полного массива визитов.
              </p>
            </div>
          ) : null}

          <p className="kb-seo-goals-updated">
            Обновлено {formatDateTime(readyReport.generatedAt)} · данные только
            для чтения
            <br />
            {finite(readyReport.sampling.current.dataLag) &&
            readyReport.sampling.current.dataLag > 0
              ? `Задержка данных Метрики: около ${Math.max(1, Math.ceil(readyReport.sampling.current.dataLag / 60))} мин.`
              : "Метрика может обновлять цели с небольшой задержкой."}
          </p>
        </>
      ) : null}
    </div>
  );
}
