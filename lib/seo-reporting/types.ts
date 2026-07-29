export const SEO_REPORT_PERIODS = [30, 90, 180, 365] as const;
export const SEO_REPORT_DEVICES = ["all", "desktop", "mobile", "tablet"] as const;
export const SEO_REPORT_PROVIDERS = ["google", "yandex"] as const;

export type SeoReportPeriod = (typeof SEO_REPORT_PERIODS)[number];
export type SeoReportDevice = (typeof SEO_REPORT_DEVICES)[number];
export type SeoDevice = SeoReportDevice;
export type SeoProvider = (typeof SEO_REPORT_PROVIDERS)[number];
export type SeoSource = SeoProvider;
export type SeoReportState = "ok" | "partial" | "empty" | "not_configured" | "error";
export type SeoSourceState = "ok" | "empty" | "not_configured" | "error";

export type SeoReportInput = {
  provider: SeoProvider;
  period: SeoReportPeriod;
  device: SeoReportDevice;
  query: string;
};

export type SeoDateWindow = {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
};

export type SeoObservation = {
  source: SeoSource;
  date: string;
  query: string;
  page: string | null;
  device: SeoReportDevice;
  clicks: number;
  impressions: number;
  position: number | null;
};

export type SeoCountryObservation = {
  source: SeoSource;
  date: string;
  country: string;
  clicks: number;
  impressions: number;
  position: number | null;
};

export type SeoSourceDataset = {
  summaryRows: SeoObservation[];
  queryRows: SeoObservation[];
  pageRows: SeoObservation[];
  countryRows?: SeoCountryObservation[];
  actualStart: string | null;
  actualEnd: string | null;
  truncated: boolean;
};

export type SeoMetricSummary = {
  clicks: number;
  impressions: number;
  ctr: number | null;
  averagePosition: number | null;
};

export type SeoMetricChange = {
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  positionImprovement: number | null;
};

export type SeoSourceSummary = {
  current: SeoMetricSummary;
  previous: SeoMetricSummary;
  change: SeoMetricChange;
};

export type SeoTrendPoint = {
  date: string;
  google: SeoMetricSummary;
  yandex: SeoMetricSummary;
};

export type SeoQueryMetric = SeoMetricSummary & {
  source: SeoSource;
  query: string;
  page: string | null;
  previousAveragePosition: number | null;
  positionImprovement: number | null;
};

export type SeoPageMetric = SeoMetricSummary & {
  source: SeoSource;
  page: string;
};

export type SeoCountryMetric = SeoMetricSummary & {
  source: SeoSource;
  country: string;
};

export type SeoSourceReport = {
  configured: boolean;
  state: SeoSourceState;
  message: string;
  requestedStart: string;
  requestedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  truncated: boolean;
  averagePositionLabel: string;
  coverageNote: string;
};

export type SeoReport = {
  state: SeoReportState;
  generatedAt: string;
  input: SeoReportInput;
  window: SeoDateWindow;
  sources: Record<SeoSource, SeoSourceReport>;
  summary: Record<SeoSource, SeoSourceSummary>;
  trend: SeoTrendPoint[];
  queries: SeoQueryMetric[];
  pages: SeoPageMetric[];
};

export type ConfiguredGoogleSearchConsole = {
  configured: true;
  clientEmail: string;
  privateKey: string;
  siteUrl: string;
};

export type ConfiguredYandexWebmaster = {
  configured: true;
  oauthToken: string;
  userId: string;
  hostId: string;
  regionIds: number[];
};

export type UnconfiguredProvider = {
  configured: false;
  missing: string[];
};

export type SeoReportingConfig = {
  google: ConfiguredGoogleSearchConsole | UnconfiguredProvider;
  yandex: ConfiguredYandexWebmaster | UnconfiguredProvider;
};

export type SeoReportResponse = {
  provider: SeoProvider;
  /** Visible only to an authenticated administrator; never contains a key. */
  googleServiceAccountEmail?: string;
  trackedProperty?: string | null;
  status: "ready" | "empty" | "not_configured" | "error";
  requestedDays: SeoReportPeriod;
  coverageDays: number;
  lastCollectedAt?: string | null;
  dateRange: {
    start: string;
    end: string;
  };
  comparisonRange?: {
    start: string;
    end: string;
  };
  generatedAt: string;
  summary: {
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
    previousClicks?: number;
    previousImpressions?: number;
    previousCtr?: number | null;
    previousPosition?: number | null;
  };
  trend: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
  }>;
  queries: Array<{
    query: string;
    page: string | null;
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
    previousPosition?: number | null;
    positionChange?: number | null;
  }>;
  pages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
  }>;
  countries: Array<{
    country: string;
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
  }>;
  notices: string[];
  truncated: boolean;
  setup?: string[];
};
