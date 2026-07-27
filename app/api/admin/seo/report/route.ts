import { NextResponse } from "next/server";
import { canEditContent } from "@/payload/access/rbac";
import { getCmsClient } from "@/lib/cms/client";
import {
  buildSeoDateWindow,
  getLiveSeoReport,
  isYandexHistoryEnabled,
  parseSeoReportInput,
  readSeoReportingConfig
} from "@/lib/seo-reporting";
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
  const cms = await getCmsClient();
  if (!cms) {
    return NextResponse.json(
      { error: "CMS временно недоступна" },
      { status: 503, headers: privateHeaders }
    );
  }

  let user: unknown;
  try {
    const auth = await cms.auth({ headers: request.headers });
    user = auth.user;
  } catch {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401, headers: privateHeaders }
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401, headers: privateHeaders }
    );
  }

  if (!canEditContent(user)) {
    return NextResponse.json(
      { error: "Недостаточно прав" },
      { status: 403, headers: privateHeaders }
    );
  }

  const parsed = parseSeoReportInput(new URL(request.url).searchParams);
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
        return NextResponse.json(report, { headers: privateHeaders });
      } catch (error) {
        console.error(
          "[seo-reporting] Persisted Yandex history failed; using live fallback",
          error
        );
      }
    }
  }

  const report = await getLiveSeoReport(input);
  return NextResponse.json(report, { headers: privateHeaders });
}
