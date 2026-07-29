import { NextResponse } from "next/server";

import {
  authenticateCmsRequest,
  isTrustedAdminMutationRequest
} from "@/lib/admin/request-auth";
import {
  readCalculatorProfileSyncState,
  syncCalculatorProfilesMissingOnly
} from "@/lib/calculator/profile-sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

export async function POST(request: Request) {
  if (!isTrustedAdminMutationRequest(request)) {
    return NextResponse.json(
      { error: "Источник запроса не разрешён" },
      { status: 403, headers: privateHeaders }
    );
  }

  const auth = await authenticateCmsRequest(request, ["admin"]);
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

  let body: { mode?: string } = {};
  try {
    body = (await request.json()) as { mode?: string };
  } catch {
    // Empty body is equivalent to the only supported safe mode.
  }
  if (body.mode && body.mode !== "missing-only") {
    return NextResponse.json({ error: "Поддерживается только безопасное добавление отсутствующих профилей" }, { status: 400, headers: privateHeaders });
  }

  try {
    const state = await readCalculatorProfileSyncState(cms);
    const result = await syncCalculatorProfilesMissingOnly(cms, state);
    return NextResponse.json(
      {
        ok: true,
        created: result.created,
        existing: result.existing,
        published: result.published,
        total: result.total
      },
      { headers: privateHeaders }
    );
  } catch (error) {
    console.error(
      "[calculator-profile-sync] Failed to install base profiles",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          "Не удалось завершить установку профилей. Уже созданные записи сохранены; повторный запуск безопасно добавит только недостающие."
      },
      { status: 500, headers: privateHeaders }
    );
  }
}
