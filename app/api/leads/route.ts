import { NextResponse } from "next/server";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";

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
}

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

  // Honeypot: если заполнено — бот
  if (payload.hp_url && payload.hp_url.length > 0) {
    return NextResponse.json({ ok: true, mode: "honeypot-blocked" });
  }

  // Минимальное время заполнения формы (защита от ботов)
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
    UF_UTM: payload.utm ?? {}
  };

  if (!process.env.BITRIX24_WEBHOOK_URL) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "Заявка подготовлена. Для отправки в Bitrix24 задайте BITRIX24_WEBHOOK_URL.",
      crmPayload
    });
  }

  try {
    const response = await fetch(process.env.BITRIX24_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: crmPayload }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "Bitrix24 request failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, mode: "bitrix24" });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Не удалось отправить заявку. Попробуйте через минуту." },
      { status: 502 }
    );
  }
}
