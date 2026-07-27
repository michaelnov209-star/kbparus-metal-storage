import { NextResponse } from "next/server";
import { canEditContent } from "@/payload/access/rbac";
import { getCmsClient } from "@/lib/cms/client";
import {
  getLiveSeoReport,
  parseSeoReportInput
} from "@/lib/seo-reporting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const report = await getLiveSeoReport(parsed.value);
  return NextResponse.json(report, { headers: privateHeaders });
}
