import { NextResponse } from "next/server";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";
import { formatRoundedRub } from "@/lib/calculator/format";

interface LeadPayload {
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  city?: string;
  comment?: string;
  utm?: Record<string, string>;
  calculatorInput?: Record<string, unknown>;
  /** Honeypot — бот заполнит, человек нет. Любое значение = бот. */
  hp_url?: string;
  /** Время загрузки формы (мс). Слишком быстрая отправка = бот. */
  formStartedAt?: number;
  /** Откуда отправлена заявка (текст). */
  source?: string;
  /** Полный URL страницы-источника (для гиперссылки в Telegram). */
  sourceUrl?: string;
  /** Название товара/страницы (отображается как ссылка). */
  sourceTitle?: string;
  /** Относительный путь к картинке товара (отправляется как preview). */
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
  const recent = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every((t) => now - t > RATE_LIMIT_WINDOW_MS)) requestLog.delete(key);
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

function sanitize(value: string | undefined): string {
  if (!value) return "";
  return String(value).slice(0, MAX_FIELD_LENGTH).trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface TelegramLead {
  name: string;
  phone: string;
  email: string;
  city: string;
  comment: string;
  source?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceImageUrl?: string;
  recommendationTitle: string;
  fromPriceLabel: string;
  utm?: Record<string, string>;
}

function buildTelegramMessage(lead: TelegramLead): string {
  const phoneClean = lead.phone.replace(/[\s\-()]/g, "");
  const lines: string[] = [];

  lines.push("🔔 <b>Новая заявка с сайта КБ Парус</b>");
  lines.push("");

  if (lead.name) lines.push(`👤 <b>Имя:</b> ${escapeHtml(lead.name)}`);
  lines.push(`📞 <b>Телефон:</b> <a href="tel:${escapeHtml(phoneClean)}">${escapeHtml(lead.phone)}</a>`);
  if (lead.email) lines.push(`✉️ <b>E-mail:</b> ${escapeHtml(lead.email)}`);
  if (lead.city) lines.push(`📍 <b>Город:</b> ${escapeHtml(lead.city)}`);
  lines.push("");

  lines.push(`🏗 <b>Оборудование:</b> ${escapeHtml(lead.recommendationTitle)}`);
  lines.push(`💰 <b>Ориентировочно:</b> ${escapeHtml(lead.fromPriceLabel)}`);

  if (lead.comment) {
    lines.push("");
    lines.push("💬 <b>Комментарий:</b>");
    lines.push(escapeHtml(lead.comment));
  }

  // "Откуда" — приоритет: ссылка с названием → ссылка → текст
  if (lead.sourceUrl && lead.sourceTitle) {
    lines.push("");
    lines.push(`📄 Откуда: <a href="${escapeHtml(lead.sourceUrl)}">${escapeHtml(lead.sourceTitle)}</a>`);
  } else if (lead.sourceUrl) {
    lines.push("");
    lines.push(`📄 Откуда: <a href="${escapeHtml(lead.sourceUrl)}">${escapeHtml(lead.sourceUrl)}</a>`);
  } else if (lead.source) {
    lines.push("");
    lines.push(`📄 Откуда: ${escapeHtml(lead.source)}`);
  }

  if (lead.utm && Object.keys(lead.utm).length > 0) {
    const utmStr = Object.entries(lead.utm)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    if (utmStr) lines.push(`🌐 UTM: ${escapeHtml(utmStr)}`);
  }

  const time = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  lines.push("");
  lines.push(`🕒 ${time} МСК`);

  return lines.join("\n");
}

async function notifyTelegram(lead: TelegramLead): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: "not-configured" };

  const text = buildTelegramMessage(lead);

  // Если есть картинка товара — отправляем sendPhoto с подписью.
  // Telegram caption ограничен 1024 символами; если перебор — fallback на sendMessage.
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
      // Если sendPhoto упал (битая картинка / слишком большой файл) — fallback на текст
    } catch {
      // fallback ниже
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

  const calculatorInput = normalizeCalculatorInput({
    ...payload.calculatorInput,
    city: city || String(payload.calculatorInput?.city ?? ""),
    comment
  });
  const result = calculateStorageSystem(calculatorInput);

  const telegramLead: TelegramLead = {
    name,
    phone,
    email,
    city: city || calculatorInput.city,
    comment,
    source: source || undefined,
    sourceUrl,
    sourceTitle: sourceTitle || undefined,
    sourceImageUrl,
    recommendationTitle: result.recommendation.title,
    fromPriceLabel: `от ${formatRoundedRub(result.fromPrice)}`,
    utm: payload.utm
  };

  // Telegram-уведомление: отправляется параллельно, не блокирует ответ
  const telegramPromise = notifyTelegram(telegramLead);

  const crmPayload = {
    TITLE: `Заявка: ${result.recommendation.title}`,
    NAME: name,
    PHONE: phone ? [{ VALUE: phone, VALUE_TYPE: "WORK" }] : [],
    EMAIL: email ? [{ VALUE: email, VALUE_TYPE: "WORK" }] : [],
    COMMENTS: comment,
    UF_CITY: city || calculatorInput.city,
    UF_CALCULATOR_INPUT: calculatorInput,
    UF_RECOMMENDED_CONFIG: result.recommendation,
    UF_PRELIMINARY_PRICE_FROM: result.fromPrice,
    UF_PRELIMINARY_PRICE: result.preliminaryPrice,
    UF_UTM: payload.utm ?? {},
    UF_SOURCE: source
  };

  const channels: string[] = [];

  if (process.env.BITRIX24_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.BITRIX24_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: crmPayload }),
        signal: AbortSignal.timeout(10_000)
      });
      if (response.ok) channels.push("bitrix24");
    } catch {
      // не валим заявку из-за CRM
    }
  }

  const telegramResult = await telegramPromise;
  if (telegramResult.ok) channels.push("telegram");

  // Если ни один канал не сконфигурирован — mock-режим
  if (channels.length === 0 && !process.env.BITRIX24_WEBHOOK_URL && !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "Заявка подготовлена. Настройте TELEGRAM_BOT_TOKEN или BITRIX24_WEBHOOK_URL для реальной доставки.",
      crmPayload
    });
  }

  // Хотя бы один канал должен сработать — иначе 502
  if (channels.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Не удалось отправить заявку. Попробуйте через минуту или позвоните нам." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, channels });
}
