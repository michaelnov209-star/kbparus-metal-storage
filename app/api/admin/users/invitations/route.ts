import { NextResponse } from "next/server";

import {
  authenticateCmsRequest,
  isTrustedAdminMutationRequest
} from "@/lib/admin/request-auth";
import {
  createTemporaryInvitationPassword,
  invitationExpiresAt,
  isPendingInvitation,
  parseUserInvitationInput,
  USER_INVITATION_EXPIRATION_MS
} from "@/lib/admin/user-invitations";
import {
  isSmtpConfigured,
  smtpSettingsFromEnv
} from "@/lib/email/smtp-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RESEND_COOLDOWN_MS = 60_000;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

type InvitationRequest =
  | {
      action: "create";
      email?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      position?: unknown;
      role?: unknown;
    }
  | {
      action: "resend";
      userId?: unknown;
    };

function parseInvitationRequest(value: unknown): InvitationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const action = (value as { action?: unknown }).action;
  return action === "create" || action === "resend"
    ? (value as InvitationRequest)
    : null;
}

function requestUserId(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^[1-9]\d{0,15}$/u.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { headers: privateHeaders, status }
  );
}

export async function POST(request: Request) {
  if (!isTrustedAdminMutationRequest(request)) {
    return errorResponse("Источник запроса не разрешён.", 403);
  }

  const auth = await authenticateCmsRequest(request, ["admin"]);
  if (!auth.ok) {
    return errorResponse(
      auth.status === 503
        ? "CMS временно недоступна."
        : auth.status === 403
          ? "Недостаточно прав."
          : "Требуется авторизация.",
      auth.status
    );
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return errorResponse("Требуется формат application/json.", 415);
  }

  if (!isSmtpConfigured(smtpSettingsFromEnv(process.env))) {
    return errorResponse(
      "Почта для приглашений пока не настроена. Проверьте SMTP в интеграциях.",
      503
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("Некорректный формат запроса.", 400);
  }
  const body = parseInvitationRequest(rawBody);
  if (!body) {
    return errorResponse("Некорректные данные приглашения.", 400);
  }

  const cms = auth.cms;
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const expiresAt = invitationExpiresAt(nowMs);
  const localReq = {
    headers: request.headers,
    user: auth.user
  };

  let userId: number | string;
  let email: string;
  let created = false;

  if (body.action === "create") {
    const parsed = parseUserInvitationInput(body);
    if (!parsed.ok) return errorResponse(parsed.error, 400);

    const existing = await cms.find({
      collection: "users",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: parsed.value.email
        }
      }
    });
    if (existing.docs.length > 0) {
      return errorResponse(
        "Сотрудник с таким email уже существует. Откройте его карточку или повторите приглашение.",
        409
      );
    }

    let user;
    try {
      user = await cms.create({
        collection: "users",
        data: {
          ...parsed.value,
          avatarPreset: "ember",
          invitationExpiresAt: expiresAt,
          invitationLastSentAt: now,
          invitationStatus: "pending",
          invitedAt: now,
          invitedBy: auth.user.id,
          password: createTemporaryInvitationPassword()
        },
        overrideAccess: true,
        req: localReq
      });
    } catch (error) {
      const duplicate = await cms.find({
        collection: "users",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: parsed.value.email
          }
        }
      });
      if (duplicate.docs.length > 0) {
        return errorResponse(
          "Сотрудник с таким email уже существует. Откройте его карточку или повторите приглашение.",
          409
        );
      }
      throw error;
    }
    userId = user.id;
    email = parsed.value.email;
    created = true;
  } else if (body.action === "resend") {
    const requestedId = requestUserId(body.userId);
    if (requestedId === null) {
      return errorResponse("Не удалось определить сотрудника.", 400);
    }

    let user;
    try {
      user = await cms.findByID({
        id: requestedId,
        collection: "users",
        depth: 0,
        overrideAccess: true
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        (error as { status?: unknown }).status === 404
      ) {
        return errorResponse("Сотрудник не найден.", 404);
      }
      throw error;
    }
    if (!isPendingInvitation(user.invitationStatus)) {
      return errorResponse(
        "Повторная отправка доступна только для непринятого приглашения.",
        409
      );
    }
    const lastSentAt =
      typeof user.invitationLastSentAt === "string"
        ? Date.parse(user.invitationLastSentAt)
        : Number.NaN;
    if (
      user.invitationStatus === "pending" &&
      Number.isFinite(lastSentAt) &&
      nowMs - lastSentAt < RESEND_COOLDOWN_MS
    ) {
      const retryAfter = Math.max(
        1,
        Math.ceil((RESEND_COOLDOWN_MS - (nowMs - lastSentAt)) / 1000)
      );
      return NextResponse.json(
        {
          error: `Повторное письмо можно отправить через ${retryAfter} сек.`,
          retryAfter
        },
        {
          headers: {
            ...privateHeaders,
            "retry-after": String(retryAfter)
          },
          status: 429
        }
      );
    }

    userId = user.id;
    email = user.email;
    await cms.update({
      id: user.id,
      collection: "users",
      data: {
        invitationExpiresAt: expiresAt,
        invitationLastSentAt: now,
        invitationStatus: "pending"
      },
      overrideAccess: true,
      req: localReq
    });
  } else {
    return errorResponse("Неизвестное действие.", 400);
  }

  try {
    await cms.forgotPassword({
      collection: "users",
      data: { email },
      expiration: USER_INVITATION_EXPIRATION_MS,
      overrideAccess: true,
      req: localReq
    });
  } catch (error) {
    await cms.update({
      id: userId,
      collection: "users",
      data: {
        invitationExpiresAt: null,
        invitationLastSentAt: now,
        invitationStatus: "delivery_failed"
      },
      overrideAccess: true,
      req: localReq
    });
    console.error("[admin-invitations] Email delivery failed", {
      created,
      userId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return errorResponse(
      "Аккаунт сохранён, но письмо не отправлено. Проверьте почту в интеграциях и нажмите «Отправить повторно».",
      502
    );
  }

  return NextResponse.json(
    {
      created,
      expiresAt,
      ok: true,
      status: "pending",
      userId
    },
    { headers: privateHeaders }
  );
}
