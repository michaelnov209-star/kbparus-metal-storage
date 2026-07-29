import { NextResponse } from "next/server";
import {
  calculateStorageSystem,
  normalizeCalculatorInput,
  type CalculatorInput
} from "@/lib/calculator";
import { formatRoundedRub } from "@/lib/calculator/format";
import { getCalculatorProfiles } from "@/lib/cms/calculator-profiles";
import { getCmsClient } from "@/lib/cms/client";
import {
  LEAD_CONSENT_POLICY_PATH,
  LEAD_CONSENT_VERSION
} from "@/lib/leads/contract";
import { getBitrix24RuntimeConfig } from "@/lib/leads/bitrix24-config";
import { bitrix24FieldMapFromEnv, buildBitrix24Payload, resolveBitrix24WebhookUrl } from "@/lib/leads/bitrix24";
import { saveLeadToCms } from "@/lib/leads/cms";
import { leadEmailConfigFromEnv, sendLeadEmail } from "@/lib/leads/email";
import {
  checkLeadRateLimit,
  getLeadClientIdentity,
  rateLimitHeaders
} from "@/lib/leads/rate-limit";
import { buildTelegramMessage, type TelegramLead } from "@/lib/leads/telegram";
import {
  LeadValidationError,
  parseLeadPayload,
  readLeadJsonBody
} from "@/lib/leads/validation";
import {
  FALLBACK_SITE_URL,
  normalizeProjectSiteOrigin
} from "@/lib/seo/site";

export const runtime = "nodejs";

const PRODUCTION_ORIGIN = FALLBACK_SITE_URL;
const MIN_FORM_FILL_MS = 2_000;

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

function getAllowedOrigins(request: Request): Set<string> {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigins = [
    PRODUCTION_ORIGIN,
    requestOrigin,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
    ...(process.env.LEAD_ALLOWED_ORIGINS?.split(",") ?? [])
  ]
    .map((value) => normalizeProjectSiteOrigin(value?.trim()))
    .filter((value): value is string => Boolean(value));

  return new Set(configuredOrigins);
}

function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return process.env.NODE_ENV !== "production" || process.env.LEAD_ALLOW_NO_ORIGIN === "true";
  }
  const normalized = normalizeProjectSiteOrigin(origin);
  return Boolean(normalized && getAllowedOrigins(request).has(normalized));
}

function resolveAbsoluteUrl(
  value: string | undefined,
  request: Request,
  kind: "page" | "image"
): string | undefined {
  if (!value) return undefined;
  try {
    const requestOrigin = new URL(request.url).origin;
    const url = new URL(value, requestOrigin);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;

    const allowedOrigins = getAllowedOrigins(request);
    const isAllowedBlob =
      kind === "image" &&
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com");
    if (!allowedOrigins.has(url.origin) && !isAllowedBlob) return undefined;

    return url.toString();
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json(
      { ok: false, code: "origin_forbidden", error: "Источник запроса не разрешён." },
      { status: 403 }
    );
  }

  const cmsForRateLimit = await getCmsClient();
  const rateLimit = await checkLeadRateLimit(
    getLeadClientIdentity(request),
    process.env,
    Date.now(),
    cmsForRateLimit?.db.pool
  );
  if (!rateLimit.allowed) {
    const limiterUnavailable = rateLimit.backend === "unavailable";
    return NextResponse.json(
      {
        ok: false,
        code: limiterUnavailable ? "security_unavailable" : "rate_limited",
        error: limiterUnavailable
          ? "Защита формы временно недоступна. Попробуйте через полминуты или позвоните нам."
          : "Слишком много запросов. Подождите минуту и попробуйте снова."
      },
      {
        status: limiterUnavailable ? 503 : 429,
        headers: rateLimitHeaders(rateLimit)
      }
    );
  }

  let payload;
  try {
    payload = parseLeadPayload(await readLeadJsonBody(request));
  } catch (error) {
    if (error instanceof LeadValidationError) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message },
        { status: error.status, headers: rateLimitHeaders(rateLimit) }
      );
    }
    return NextResponse.json(
      { ok: false, code: "invalid_request", error: "Некорректный запрос." },
      { status: 400, headers: rateLimitHeaders(rateLimit) }
    );
  }

  if (payload.hp_url) {
    return NextResponse.json(
      { ok: true, mode: "accepted" },
      { headers: rateLimitHeaders(rateLimit) }
    );
  }

  if (typeof payload.formStartedAt === "number") {
    const elapsed = Date.now() - payload.formStartedAt;
    if (elapsed < MIN_FORM_FILL_MS) {
      return NextResponse.json(
        { ok: true, mode: "accepted" },
        { headers: rateLimitHeaders(rateLimit) }
      );
    }
  }

  const { name, phone, email } = payload.contact;
  const { city, comment, source, sourceTitle } = payload;
  const sourceUrl = resolveAbsoluteUrl(payload.sourceUrl || undefined, request, "page");
  const sourceImageUrl = resolveAbsoluteUrl(payload.sourceImage || undefined, request, "image");
  const rawCalculatorInput = payload.calculatorInput ?? {};
  const hasCalculatorInput = Object.keys(rawCalculatorInput).length > 0;
  const isConfiguratorLead = payload.leadType === "configurator" || hasCalculatorInput;

  const calculatorProfiles = isConfiguratorLead ? await getCalculatorProfiles() : [];
  const calculatorProfileId =
    typeof rawCalculatorInput.systemId === "string"
      ? rawCalculatorInput.systemId
      : undefined;
  const calculatorProfile = isConfiguratorLead
    ? calculatorProfiles.find((profile) => profile.id === calculatorProfileId)
    : undefined;
  if (isConfiguratorLead && !calculatorProfile) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Этот профиль расчёта сейчас недоступен. Обновите страницу и выберите опубликованный вариант."
      },
      {
        status: 422,
        headers: rateLimitHeaders(rateLimit)
      }
    );
  }
  const calculatorInput = isConfiguratorLead
    ? normalizeCalculatorInput(
        {
          ...(rawCalculatorInput as Partial<CalculatorInput>),
          city: city || String(rawCalculatorInput.city ?? ""),
          comment
        },
        calculatorProfile
      )
    : undefined;
  const result = calculatorInput
    ? calculateStorageSystem(calculatorInput, calculatorProfile)
    : undefined;
  const fromPrice = result?.fromPrice ?? payload.preliminaryPriceFrom;
  const selectedOptions = payload.recommendedConfig?.options?.filter(Boolean) ?? result?.selectedOptions;
  const acceptedAt = new Date().toISOString();
  const requestOrigin = new URL(request.url).origin;
  const utm = {
    ...payload.utm,
    consent_accepted: "true",
    consent_version: LEAD_CONSENT_VERSION,
    consent_accepted_at: acceptedAt,
    consent_policy_url: `${requestOrigin}${LEAD_CONSENT_POLICY_PATH}`
  };

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
    recommendationTitle:
      sourceTitle || payload.recommendedConfig?.title || result?.recommendation.title,
    fromPriceLabel: fromPrice ? `от ${formatRoundedRub(fromPrice)}` : undefined,
    calculatorInput,
    selectedOptions
  };

  const telegramPromise = notifyTelegram(telegramLead);
  const baseLead = {
    leadType: isConfiguratorLead ? "configurator" : "contact",
    name,
    phone,
    email,
    city: city || calculatorInput?.city,
    comment,
    source: source || undefined,
    sourceTitle: sourceTitle || undefined,
    sourceUrl,
    utm,
    calculatorInput,
    result,
    selectedOptions,
    fromPrice
  } as const;

  const bitrixPayload = buildBitrix24Payload(
    baseLead,
    bitrix24FieldMapFromEnv(process.env)
  );

  const channels: string[] = [];
  const deliveryErrors: string[] = [];
  const emailResult = await sendLeadEmail(
    {
      ...baseLead,
      emailDelivered: false,
      telegramDelivered: false,
      bitrix24Delivered: false
    },
    leadEmailConfigFromEnv(process.env)
  );
  if (emailResult.ok) channels.push("email");
  else if (emailResult.error && emailResult.error !== "email-not-configured") {
    deliveryErrors.push(`email-${emailResult.error}`);
    console.warn(`Email delivery failed: ${emailResult.error}`);
  }

  const bitrix24Config = getBitrix24RuntimeConfig(process.env);
  const bitrix24WebhookUrl = bitrix24Config.enabled
    ? resolveBitrix24WebhookUrl(process.env.BITRIX24_WEBHOOK_URL)
    : undefined;

  if (bitrix24WebhookUrl) {
    try {
      const response = await fetch(bitrix24WebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bitrixPayload),
        signal: AbortSignal.timeout(10_000)
      });
      if (response.ok) channels.push("bitrix24");
      else {
        deliveryErrors.push(`bitrix24-http-${response.status}`);
        console.warn(`Bitrix24 delivery failed with HTTP ${response.status}`);
      }
    } catch {
      deliveryErrors.push("bitrix24-network");
      console.warn("Bitrix24 delivery failed with network error");
      // CRM outage must not block lead processing if Telegram works.
    }
  }

  const telegramResult = await telegramPromise;
  if (telegramResult.ok) channels.push("telegram");
  else if (telegramResult.error && telegramResult.error !== "not-configured") {
    deliveryErrors.push(telegramResult.error);
  }

  const cmsResult = await saveLeadToCms({
    ...baseLead,
    emailDelivered: channels.includes("email"),
    telegramDelivered: channels.includes("telegram"),
    bitrix24Delivered: channels.includes("bitrix24"),
    deliveryErrors
  });
  if (cmsResult.ok) channels.push("cms");
  else if (cmsResult.error) console.warn(`CMS lead save failed: ${cmsResult.error}`);

  if (channels.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        code: "delivery_unavailable",
        error: "Не удалось отправить заявку. Попробуйте через минуту или позвоните нам."
      },
      { status: 503, headers: rateLimitHeaders(rateLimit) }
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: rateLimitHeaders(rateLimit) }
  );
}
