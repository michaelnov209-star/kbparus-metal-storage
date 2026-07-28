import { NextResponse } from "next/server";

import {
  authenticateCmsRequest,
  isTrustedAdminMutationRequest
} from "@/lib/admin/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

type TelegramResponse = {
  ok?: boolean;
};

async function telegramRequest(token: string, method: string, search = "") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}${search}`, {
      cache: "no-store",
      signal: controller.signal
    });
    const payload = (await response.json()) as TelegramResponse;
    return response.ok && payload.ok === true;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyTelegram(request: Request) {
  if (!isTrustedAdminMutationRequest(request)) {
    return NextResponse.json(
      { ok: false, error: "origin-forbidden" },
      { status: 403, headers: privateHeaders }
    );
  }

  const auth = await authenticateCmsRequest(request, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.code },
      { status: auth.status, headers: privateHeaders }
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: "telegram-not-configured" },
      { status: 503, headers: privateHeaders }
    );
  }

  try {
    const botOk = await telegramRequest(token, "getMe");
    if (!botOk) {
      return NextResponse.json(
        { ok: false, error: "telegram-bot-unavailable" },
        { status: 502, headers: privateHeaders }
      );
    }

    const chatOk = await telegramRequest(
      token,
      "getChat",
      `?chat_id=${encodeURIComponent(chatId)}`
    );
    if (!chatOk) {
      return NextResponse.json(
        { ok: false, error: "telegram-chat-unavailable" },
        { status: 502, headers: privateHeaders }
      );
    }

    return NextResponse.json(
      { ok: true, provider: "telegram" },
      { headers: privateHeaders }
    );
  } catch (error) {
    const errorCode = error instanceof Error && error.name === "AbortError"
      ? "telegram-timeout"
      : "telegram-unavailable";
    console.error("[telegram-verify] Probe failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { ok: false, error: errorCode },
      { status: 502, headers: privateHeaders }
    );
  }
}

export const POST = verifyTelegram;
