import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  authenticateCmsRequest,
  isTrustedAdminMutationRequest
} from "@/lib/admin/request-auth";
import { CURRENT_STATE_ASSET_BY_KEY } from "@/lib/cms/current-state-sync";
import {
  auditCurrentState,
  repairProductGalleries,
  syncCurrentStateAsset,
  syncCurrentStateContent
} from "@/lib/cms/current-state-sync-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

type SyncRequestBody = {
  action?: "asset" | "audit" | "content" | "product-galleries";
  assetKey?: string;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: privateHeaders });
}
export async function POST(request: Request) {
  if (!isTrustedAdminMutationRequest(request)) {
    return errorResponse("Источник запроса не разрешён", 403);
  }

  const auth = await authenticateCmsRequest(request, ["admin"]);
  if (!auth.ok) {
    return errorResponse(
      auth.status === 503
        ? "CMS временно недоступна"
        : auth.status === 403
          ? "Недостаточно прав"
          : "Требуется авторизация",
      auth.status
    );
  }

  const bodyLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(bodyLength) && bodyLength > 2_048) {
    return errorResponse("Запрос слишком большой", 413);
  }

  let body: SyncRequestBody;
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    return errorResponse("Некорректный JSON", 400);
  }

  if (
    !body.action ||
    !["asset", "audit", "content", "product-galleries"].includes(body.action)
  ) {
    return errorResponse("Неизвестное действие синхронизации", 400);
  }

  try {
    if (body.action === "audit") {
      const status = await auditCurrentState(auth.cms, request.url);
      return NextResponse.json(
        { ok: true, status },
        { headers: privateHeaders }
      );
    }

    if (body.action === "asset") {
      if (
        typeof body.assetKey !== "string" ||
        !CURRENT_STATE_ASSET_BY_KEY.has(body.assetKey)
      ) {
        return errorResponse("Неизвестный ресурс текущего сайта", 400);
      }
      const result = await syncCurrentStateAsset(
        auth.cms,
        body.assetKey,
        request.url
      );
      return NextResponse.json(
        { ok: true, ...result },
        { headers: privateHeaders }
      );
    }

    if (body.action === "product-galleries") {
      const result = await repairProductGalleries(auth.cms);
      revalidatePath("/catalog", "layout");
      return NextResponse.json(
        { ok: true, ...result },
        { headers: privateHeaders }
      );
    }

    const result = await syncCurrentStateContent(auth.cms, request.url);
    revalidatePath("/", "layout");
    revalidatePath("/catalog", "layout");
    return NextResponse.json(
      { ok: true, ...result },
      { headers: privateHeaders }
    );
  } catch (error) {
    console.error(
      "[cms-current-state] Synchronization failed",
      error instanceof Error ? error.message : "Unknown error"
    );
    return errorResponse(
      error instanceof Error && error.message.includes("15 МБ")
        ? error.message
        : "Не удалось завершить синхронизацию. Повторный запуск безопасно продолжит с места остановки.",
      500
    );
  }
}
