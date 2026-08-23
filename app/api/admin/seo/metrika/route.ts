import { NextResponse } from "next/server";

import { authenticateCmsRequest } from "@/lib/admin/request-auth";
import {
  getYandexMetrikaConversionReport,
  parseYandexMetrikaPeriod
} from "@/lib/seo-reporting/yandex-metrika";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

export async function GET(request: Request) {
  const auth = await authenticateCmsRequest(request, [
    "admin",
    "director",
    "general_director",
    "editor",
    "seo_marketer"
  ]);
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

  const searchParams = new URL(request.url).searchParams;
  const parsedPeriod = parseYandexMetrikaPeriod(searchParams);
  if (!parsedPeriod.ok) {
    return NextResponse.json(
      { error: parsedPeriod.error },
      { status: 400, headers: privateHeaders }
    );
  }

  const report = await getYandexMetrikaConversionReport({
    period: parsedPeriod.value,
    forceRefresh: searchParams.get("refresh") === "1"
  });
  return NextResponse.json(report, { headers: privateHeaders });
}
