import { NextResponse } from "next/server";
import { authenticateCmsRequest } from "@/lib/admin/request-auth";
import {
  buildSeoDateWindow,
  getLiveSeoReport,
  isYandexHistoryEnabled,
  parseSeoReportInput,
  readSeoReportingConfig
} from "@/lib/seo-reporting";
import { getTrackedSeoProperty } from "@/lib/seo-reporting/property";
import { buildSeoReportResponse } from "@/lib/seo-reporting/report";
import { readYandexHistoryDataset } from "@/lib/seo-reporting/yandex-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

export async function GET(request: Request) {
  const auth = await authenticateCmsRequest(request, ["admin", "editor"]);
  if (!auth.ok) {
    const error =
      auth.status === 503
        ? "CMS временно недоступна"
        : auth.status === 403
          ? "Недостаточно прав"
          : "Требуется авторизация";
    return NextResponse.json(
      { error },
      { status: auth.status, headers: privateHeaders }
    );
  }
  const cms = auth.cms;

  const searchParams = new URL(request.url).searchParams;
  const parsed = parseSeoReportInput(searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: privateHeaders }
    );
  }

  const input = parsed.value;
  if (input.provider === "yandex") {
    const config = readSeoReportingConfig();
    if (config.yandex.configured && isYandexHistoryEnabled()) {
      const generatedAt = new Date();
      try {
        const pool = cms.db.pool;
        const window = buildSeoDateWindow(
          input.period,
          generatedAt,
          "Europe/Moscow"
        );
        const history = await readYandexHistoryDataset({
          pool,
          window,
          device: input.device,
          query: input.query
        });
        const report = buildSeoReportResponse({
          input,
          generatedAt,
          execution: {
            state: "ok",
            dataset: history.dataset,
            coverageDates: history.coverageDates,
            lastCollectedAt: history.lastCollectedAt
          }
        });
        return NextResponse.json(
          {
            ...report,
            trackedProperty: getTrackedSeoProperty(config, input.provider)
          },
          { headers: privateHeaders }
        );
      } catch (error) {
        console.error(
          "[seo-reporting] Persisted Yandex history failed; using live fallback",
          error
        );
      }
    }
  }

  const report = await getLiveSeoReport(input, {
    forceRefresh: searchParams.get("refresh") === "1"
  });
  return NextResponse.json(
    {
      ...report,
      trackedProperty: getTrackedSeoProperty(
        readSeoReportingConfig(),
        input.provider
      )
    },
    { headers: privateHeaders }
  );
}
