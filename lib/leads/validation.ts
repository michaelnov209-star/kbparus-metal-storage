import {
  LEAD_CONSENT_VERSION,
  type LeadConsent
} from "@/lib/leads/contract";

const MAX_BODY_BYTES = 32 * 1024;
const UTM_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_referrer"
]);
const TOP_LEVEL_KEYS = new Set([
  "leadType",
  "contact",
  "city",
  "comment",
  "utm",
  "calculatorInput",
  "recommendedConfig",
  "preliminaryPriceFrom",
  "preliminaryPriceRange",
  "hp_url",
  "formStartedAt",
  "source",
  "sourceUrl",
  "sourceTitle",
  "sourceImage",
  "consent"
]);
const CONTACT_KEYS = new Set(["name", "phone", "email"]);
const CONSENT_KEYS = new Set(["accepted", "version"]);
const RECOMMENDATION_KEYS = new Set([
  "title",
  "dimensions",
  "loadKg",
  "shelfCount",
  "towerCount",
  "options"
]);
const LEGACY_PRICE_RANGE_KEYS = new Set(["from", "label"]);
const CALCULATOR_KEYS = new Set([
  "systemId",
  "material",
  "materialLengthMm",
  "sheetWidthMm",
  "unitWeightKg",
  "totalStorageWeightKg",
  "loadingMethod",
  "facility",
  "desiredCapacity",
  "needsRolloutCassettes",
  "needsPainting",
  "needsMounting",
  "needsDelivery",
  "city",
  "heightMm",
  "widthMm",
  "depthMm",
  "lengthMm",
  "loadKg",
  "towerCount",
  "shelfCount",
  "rolloutShelfCount",
  "rolloutSide",
  "cassetteCount",
  "execution",
  "optionIds",
  "comment"
]);

const CALCULATOR_PROFILE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MATERIALS = new Set(["sheet", "pipe", "profile", "longProduct", "mixed"]);
const LOADING_METHODS = new Set(["crane", "forklift", "manual"]);
const FACILITIES = new Set(["workshop", "warehouse", "outdoor"]);
const EXECUTION_MODES = new Set(["manual", "automatic"]);
const ROLLOUT_SIDES = new Set(["one", "two"]);

type UnknownRecord = Record<string, unknown>;

export interface LeadPayload {
  leadType?: "contact" | "configurator";
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  city: string;
  comment: string;
  utm: Record<string, string>;
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
  hp_url: string;
  formStartedAt?: number;
  source: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceImage: string;
  consent: LeadConsent;
}

export class LeadValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "LeadValidationError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertKnownKeys(value: UnknownRecord, allowed: Set<string>, field: string) {
  const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
  if (unknownKey) {
    throw new LeadValidationError(
      "unknown_field",
      `Поле «${field}.${unknownKey}» не поддерживается. Обновите страницу и повторите отправку.`
    );
  }
}

function stringValue(
  value: unknown,
  field: string,
  maxLength: number,
  required = false
): string {
  if (value === undefined || value === null) {
    if (required) {
      throw new LeadValidationError("required_field", `Заполните поле «${field}».`);
    }
    return "";
  }
  if (typeof value !== "string") {
    throw new LeadValidationError("invalid_type", `Поле «${field}» имеет неверный формат.`);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new LeadValidationError(
      "field_too_long",
      `Поле «${field}» слишком длинное. Максимум ${maxLength} символов.`
    );
  }
  if (required && !result) {
    throw new LeadValidationError("required_field", `Заполните поле «${field}».`);
  }
  return result;
}

function optionalNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number
): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new LeadValidationError("invalid_number", `Поле «${field}» содержит недопустимое значение.`);
  }
  return value;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new LeadValidationError("invalid_type", `Поле «${field}» имеет неверный формат.`);
  }
  return value;
}

function optionalEnum(
  value: unknown,
  field: string,
  allowed: Set<string>
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !allowed.has(value)) {
    throw new LeadValidationError("invalid_value", `Поле «${field}» содержит недопустимое значение.`);
  }
  return value;
}

function parseContact(value: unknown): LeadPayload["contact"] {
  if (!isRecord(value)) {
    throw new LeadValidationError("invalid_contact", "Контактные данные имеют неверный формат.");
  }
  assertKnownKeys(value, CONTACT_KEYS, "contact");

  const name = stringValue(value.name, "Имя", 120);
  const phone = stringValue(value.phone, "Телефон", 30, true);
  const email = stringValue(value.email, "Email", 254);
  const normalizedPhone = phone.replace(/[\s\-()+]/g, "");

  if (!/^\d{10,15}$/.test(normalizedPhone)) {
    throw new LeadValidationError("invalid_phone", "Телефон указан в неверном формате.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new LeadValidationError("invalid_email", "Email указан в неверном формате.");
  }

  return { name, phone, email };
}

function parseConsent(value: unknown): LeadConsent {
  if (!isRecord(value)) {
    throw new LeadValidationError(
      "consent_required",
      "Подтвердите согласие на обработку персональных данных."
    );
  }
  assertKnownKeys(value, CONSENT_KEYS, "consent");
  if (value.accepted !== true || value.version !== LEAD_CONSENT_VERSION) {
    throw new LeadValidationError(
      "consent_required",
      "Подтвердите актуальное согласие на обработку персональных данных."
    );
  }
  return { accepted: true, version: LEAD_CONSENT_VERSION };
}

function parseUtm(value: unknown): Record<string, string> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new LeadValidationError("invalid_utm", "UTM-метки имеют неверный формат.");
  }
  assertKnownKeys(value, UTM_KEYS, "utm");

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [
        key,
        stringValue(item, `utm.${key}`, key === "utm_referrer" ? 500 : 200)
      ])
      .filter(([, item]) => Boolean(item))
  );
}

function parseStringArray(
  value: unknown,
  field: string,
  maxItems: number,
  maxItemLength: number
): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new LeadValidationError("invalid_array", `Поле «${field}» имеет неверный формат.`);
  }
  return value.map((item, index) => stringValue(item, `${field}.${index}`, maxItemLength, true));
}

function parseRecommendation(value: unknown): LeadPayload["recommendedConfig"] {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new LeadValidationError("invalid_recommendation", "Рекомендация имеет неверный формат.");
  }
  assertKnownKeys(value, RECOMMENDATION_KEYS, "recommendedConfig");

  return {
    title: stringValue(value.title, "recommendedConfig.title", 240) || undefined,
    dimensions: stringValue(value.dimensions, "recommendedConfig.dimensions", 120) || undefined,
    loadKg: optionalNumber(value.loadKg, "recommendedConfig.loadKg", 0, 10_000_000),
    shelfCount: optionalNumber(value.shelfCount, "recommendedConfig.shelfCount", 0, 10_000),
    towerCount: optionalNumber(value.towerCount, "recommendedConfig.towerCount", 0, 10_000),
    options: parseStringArray(value.options, "recommendedConfig.options", 30, 160)
  };
}

function validateLegacyPriceRange(value: unknown) {
  if (value === undefined) return;
  if (!isRecord(value)) {
    throw new LeadValidationError(
      "invalid_price_range",
      "Диапазон стоимости имеет неверный формат."
    );
  }
  assertKnownKeys(value, LEGACY_PRICE_RANGE_KEYS, "preliminaryPriceRange");
  optionalNumber(value.from, "preliminaryPriceRange.from", 0, 1_000_000_000_000);
  stringValue(value.label, "preliminaryPriceRange.label", 120);
}

function parseCalculatorInput(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new LeadValidationError("invalid_calculator", "Параметры калькулятора имеют неверный формат.");
  }
  assertKnownKeys(value, CALCULATOR_KEYS, "calculatorInput");

  const result: Record<string, unknown> = {};
  if (value.systemId !== undefined) {
    const systemId = stringValue(
      value.systemId,
      "calculatorInput.systemId",
      80,
      true
    );
    if (!CALCULATOR_PROFILE_SLUG.test(systemId)) {
      throw new LeadValidationError(
        "invalid_value",
        "Поле «calculatorInput.systemId» содержит недопустимое значение."
      );
    }
    result.systemId = systemId;
  }
  const enumFields: Array<[string, Set<string>]> = [
    ["material", MATERIALS],
    ["loadingMethod", LOADING_METHODS],
    ["facility", FACILITIES],
    ["rolloutSide", ROLLOUT_SIDES],
    ["execution", EXECUTION_MODES]
  ];
  for (const [field, allowed] of enumFields) {
    const item = optionalEnum(value[field], `calculatorInput.${field}`, allowed);
    if (item !== undefined) result[field] = item;
  }

  const booleanFields = [
    "needsRolloutCassettes",
    "needsPainting",
    "needsMounting",
    "needsDelivery"
  ];
  for (const field of booleanFields) {
    const item = optionalBoolean(value[field], `calculatorInput.${field}`);
    if (item !== undefined) result[field] = item;
  }

  const numericRanges: Record<string, [number, number]> = {
    materialLengthMm: [0, 100_000],
    sheetWidthMm: [0, 100_000],
    unitWeightKg: [0, 10_000_000],
    totalStorageWeightKg: [0, 100_000_000],
    desiredCapacity: [0, 10_000],
    heightMm: [0, 100_000],
    widthMm: [0, 100_000],
    depthMm: [0, 100_000],
    lengthMm: [0, 100_000],
    loadKg: [0, 10_000_000],
    towerCount: [0, 10_000],
    shelfCount: [0, 10_000],
    rolloutShelfCount: [0, 10_000],
    cassetteCount: [0, 10_000]
  };
  for (const [field, [minimum, maximum]] of Object.entries(numericRanges)) {
    const item = optionalNumber(value[field], `calculatorInput.${field}`, minimum, maximum);
    if (item !== undefined) result[field] = item;
  }

  const city = stringValue(value.city, "calculatorInput.city", 120);
  const comment = stringValue(value.comment, "calculatorInput.comment", 1000);
  const optionIds = parseStringArray(value.optionIds, "calculatorInput.optionIds", 30, 80);
  if (city) result.city = city;
  if (comment) result.comment = comment;
  if (optionIds) result.optionIds = optionIds;

  return result;
}

export function parseLeadPayload(value: unknown): LeadPayload {
  if (!isRecord(value)) {
    throw new LeadValidationError("invalid_payload", "Тело запроса должно быть JSON-объектом.");
  }
  assertKnownKeys(value, TOP_LEVEL_KEYS, "request");
  validateLegacyPriceRange(value.preliminaryPriceRange);

  const leadType = optionalEnum(value.leadType, "leadType", new Set(["contact", "configurator"])) as
    | LeadPayload["leadType"]
    | undefined;
  const formStartedAt = optionalNumber(
    value.formStartedAt,
    "formStartedAt",
    0,
    Date.now() + 5 * 60_000
  );

  return {
    leadType,
    contact: parseContact(value.contact),
    city: stringValue(value.city, "Город", 120),
    comment: stringValue(value.comment, "Комментарий", 1000),
    utm: parseUtm(value.utm),
    calculatorInput: parseCalculatorInput(value.calculatorInput),
    recommendedConfig: parseRecommendation(value.recommendedConfig),
    preliminaryPriceFrom: optionalNumber(
      value.preliminaryPriceFrom,
      "preliminaryPriceFrom",
      0,
      1_000_000_000_000
    ),
    hp_url: stringValue(value.hp_url, "hp_url", 200),
    formStartedAt,
    source: stringValue(value.source, "source", 240),
    sourceUrl: stringValue(value.sourceUrl, "sourceUrl", 2048),
    sourceTitle: stringValue(value.sourceTitle, "sourceTitle", 240),
    sourceImage: stringValue(value.sourceImage, "sourceImage", 2048),
    consent: parseConsent(value.consent)
  };
}

export async function readLeadJsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new LeadValidationError(
      "unsupported_media_type",
      "Отправьте данные в формате application/json.",
      415
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new LeadValidationError("payload_too_large", "Запрос слишком большой.", 413);
  }

  if (!request.body) {
    throw new LeadValidationError("empty_body", "Тело запроса пустое.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new LeadValidationError("payload_too_large", "Запрос слишком большой.", 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new LeadValidationError("invalid_json", "Некорректный JSON.");
  }
}
