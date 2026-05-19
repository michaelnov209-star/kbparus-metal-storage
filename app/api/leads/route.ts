import { NextResponse } from "next/server";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";
import { formatRoundedRub } from "@/lib/calculator/format";
import { bitrix24FieldMapFromEnv, buildBitrix24Payload, resolveBitrix24WebhookUrl } from "@/lib/leads/bitrix24";
import { buildTelegramMessage, type TelegramLead } from "@/lib/leads/telegram";

interface LeadPayload {
  leadType?: "contact" | "configurator";
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  city?: string;
  comment?: string;
  utm?: Record<string, string>;
  calculatorInput?: Record<string, unknown>;
  recommendedConfig?: {
    title?: string;
    dimensions?: string;
    loadKg?: number;
    shelfCount?: number;
    towerCount?: number;
    options?: string[];
  };
  preliminaryPriceFrom?: number;
  hp_url?: string;
  formStartedAt?: number;
  source?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceImage?: string;
}

const SITE_URL = "https://kbparus-metal-storage.vercel.app";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MIN_FORM_FILL_MS = 2_000;
const MAX_FIELD_LENGTH = 1000;

const requestLog = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  requestLog.set(ip, recent);

  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every((time) => now - time > RATE_LIMIT_WINDOW_MS)) requestLog.delete(key);
    }
  }

  return false;
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()+]/g, "");
  return /^\d{10,15}$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_FIELD_LENGTH).trim();
}

async function notifyTelegram(lead: TelegramLead): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: "not-configured" };

  const text = buildTelegramMessage(lead);

  if (lead.sourceImageUrl && text.length <= 1024) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: lead.sourceImageUrl,
          caption: text,
          parse_mode: "HTML"
        }),
        signal: AbortSignal.timeout(10_000)
      });
      if (response.ok) return { ok: true };
    } catch {
      // Fallback to plain text below.
    }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: !lead.sourceImageUrl
      }),
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) return { ok: false, error: `telegram-${response.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "telegram-network" };
  }
}

function resolveAbsoluteUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Слишком много запросов. Подождите минуту и попробуйте снова." },
      { status: 429 }
    );
  }

  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  if (payload.hp_url && payload.hp_url.length > 0) {
    return NextResponse.json({ ok: true, mode: "honeypot-blocked" });
  }

  if (typeof payload.formStartedAt === "number") {
    const elapsed = Date.now() - payload.formStartedAt;
    if (elapsed < MIN_FORM_FILL_MS) {
      return NextResponse.json({ ok: true, mode: "speed-blocked" });
    }
  }

  const name = sanitize(payload.contact?.name);
  const phone = sanitize(payload.contact?.phone);
  const email = sanitize(payload.contact?.email);
  const city = sanitize(payload.city);
  const comment = sanitize(payload.comment);
  const source = sanitize(payload.source);
  const sourceTitle = sanitize(payload.sourceTitle);
  const sourceUrl = resolveAbsoluteUrl(sanitize(payload.sourceUrl) || undefined);
  const sourceImageUrl = resolveAbsoluteUrl(sanitize(payload.sourceImage) || undefined);
  const rawCalculatorInput = payload.calculatorInput ?? {};
  const hasCalculatorInput = Object.keys(rawCalculatorInput).length > 0;
  const isConfiguratorLead = payload.leadType === "configurator" || hasCalculatorInput;

  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Укажите телефон, чтобы инженер мог связаться с вами." },
      { status: 400 }
    );
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "Телефон указан в неверном формате." },
      { status: 400 }
    );
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Email указан в неверном формате." },
      { status: 400 }
    );
  }

  const calculatorInput = isConfiguratorLead
    ? normalizeCalculatorInput({
        ...rawCalculatorInput,
        city: city || String(rawCalculatorInput.city ?? ""),
        comment
      })
    : undefined;
  const result = calculatorInput ? calculateStorageSystem(calculatorInput) : undefined;
  const fromPrice = typeof payload.preliminaryPriceFrom === "number" ? payload.preliminaryPriceFrom : result?.fromPrice;

  const telegramLead: TelegramLead = {
    leadType: isConfiguratorLead ? "configurator" : "contact",
    name,
    phone,
    email,
    city: city || calculatorInput?.city,
    comment,
    source: source || undefined,
    sourceUrl,
    sourceTitle: sourceTitle || undefined,
    sourceImageUrl,
    recommendationTitle: sanitize(payload.recommendedConfig?.title) || result?.recommendation.title,
    fromPriceLabel: fromPrice ? `от ${formatRoundedRub(fromPrice)}` : undefined,
    calculatorInput,
    selectedOptions: payload.recommendedConfig?.options?.map((option) => sanitize(option)).filter(Boolean)
  };

  const telegramPromise = notifyTelegram(telegramLead);

  const bitrixPayload = buildBitrix24Payload(
    {
      leadType: isConfiguratorLead ? "configurator" : "contact",
      name,
      phone,
      email,
      city: city || calculatorInput?.city,
      comment,
      source: source || undefined,
      sourceTitle: sourceTitle || undefined,
      sourceUrl,
      utm: payload.utm,
      calculatorInput,
      result,
      selectedOptions: payload.recommendedConfig?.options?.map((option) => sanitize(option)).filter(Boolean),
      fromPrice
    },
    bitrix24FieldMapFromEnv(process.env)
  );

  const channels: string[] = [];
  const bitrix24WebhookUrl = resolveBitrix24WebhookUrl(process.env.BITRIX24_WEBHOOK_URL);

  if (bitrix24WebhookUrl) {
    try {
      const response = await fetch(bitrix24WebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bitrixPayload),
        signal: AbortSignal.timeout(10_000)
      });
      if (response.ok) channels.push("bitrix24");
      else console.warn(`Bitrix24 delivery failed with HTTP ${response.status}`);
    } catch {
      console.warn("Bitrix24 delivery failed with network error");
      // CRM outage must not block lead processing if Telegram works.
    }
  }

  const telegramResult = await telegramPromise;
  if (telegramResult.ok) channels.push("telegram");

  if (channels.length === 0 && !bitrix24WebhookUrl && !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "Заявка подготовлена. Настройте TELEGRAM_BOT_TOKEN или BITRIX24_WEBHOOK_URL для реальной доставки.",
      bitrixPayload
    });
  }

  if (channels.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Не удалось отправить заявку. Попробуйте через минуту или позвоните нам." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, channels });
}
