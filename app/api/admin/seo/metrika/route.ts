import { NextResponse } from "next/server";

import { getCmsClient } from "@/lib/cms/client";
import {
  getYandexMetrikaConversionReport,
  parseYandexMetrikaPeriod
} from "@/lib/seo-reporting/yandex-metrika";
import { canEditContent } from "@/payload/access/rbac";

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
