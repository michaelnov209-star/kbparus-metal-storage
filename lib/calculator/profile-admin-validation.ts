import { ValidationError } from "payload";
import type {
  CollectionBeforeValidateHook,
  PayloadRequest
} from "payload";

import { createProductSlug } from "@/lib/cms/product-slug";

type PlainRecord = Record<string, unknown>;

type NumericRow = {
  value?: unknown;
};

type FactorRow = NumericRow & {
  factor?: unknown;
};

type PriceRow = NumericRow & {
  price?: unknown;
};

type TowerPriceRow = {
  price?: unknown;
  shelfCount?: unknown;
};

type CalculatorOptionRow = {
  optionId?: unknown;
  price?: unknown;
  title?: unknown;
};

type ProfileValidationError = {
  message: string;
  path: string;
};

const PROFILE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is PlainRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function positiveNumber(value: unknown): value is number {
  return finiteNumber(value) && value > 0;
}

function nonNegativeNumber(value: unknown): value is number {
  return finiteNumber(value) && value >= 0;
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function rows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function uniqueNumbers(values: number[]) {
  return new Set(values).size === values.length;
}

function validateFactorRows(
  value: unknown,
  path: string,
  label: string,
  errors: ProfileValidationError[]
) {
  const items = rows<FactorRow>(value);
  if (!items.length) {
    errors.push({ path, message: `Добавьте хотя бы один вариант: ${label}.` });
    return;
  }

  const normalizedValues: number[] = [];
  for (const [index, item] of items.entries()) {
    if (!positiveNumber(item.value)) {
      errors.push({
        path: `${path}.${index}.value`,
        message: `${label}: значение должно быть больше нуля.`
      });
    } else {
      normalizedValues.push(item.value);
    }

    if (!positiveNumber(item.factor) || item.factor > 100) {
      errors.push({
        path: `${path}.${index}.factor`,
        message: `${label}: коэффициент должен быть больше 0 и не больше 100.`
      });
    }
  }

  if (!uniqueNumbers(normalizedValues)) {
    errors.push({
      path,
      message: `${label}: одинаковое значение нельзя добавлять дважды.`
    });
  }
}

function validatePriceRows(
  value: unknown,
  path: string,
  label: string,
  errors: ProfileValidationError[],
  required = true
) {
  const items = rows<PriceRow>(value);
  if (!items.length) {
    if (required) {
      errors.push({ path, message: `Добавьте хотя бы один вариант: ${label}.` });
    }
    return;
  }

  const normalizedValues: number[] = [];
  for (const [index, item] of items.entries()) {
    if (!positiveNumber(item.value)) {
      errors.push({
        path: `${path}.${index}.value`,
        message: `${label}: значение должно быть больше нуля.`
      });
    } else {
      normalizedValues.push(item.value);
    }

    if (!positiveNumber(item.price) || item.price > 1_000_000_000_000) {
      errors.push({
        path: `${path}.${index}.price`,
        message: `${label}: цена должна быть больше нуля и не превышать 1 трлн ₽.`
      });
    }
  }

  if (!uniqueNumbers(normalizedValues)) {
    errors.push({
      path,
      message: `${label}: одинаковое значение нельзя добавлять дважды.`
    });
  }
}

function validateCountRows(
  value: unknown,
  path: string,
  label: string,
  errors: ProfileValidationError[],
  required = true
): number[] {
  const items = rows<NumericRow>(value);
  if (!items.length) {
    if (required) {
      errors.push({ path, message: `Добавьте хотя бы один вариант: ${label}.` });
    }
    return [];
  }

  const normalizedValues: number[] = [];
  for (const [index, item] of items.entries()) {
    if (!positiveInteger(item.value) || item.value > 1_000) {
      errors.push({
        path: `${path}.${index}.value`,
        message: `${label}: укажите целое число от 1 до 1000.`
      });
    } else {
      normalizedValues.push(item.value);
    }
  }

  if (!uniqueNumbers(normalizedValues)) {
    errors.push({
      path,
      message: `${label}: одинаковое значение нельзя добавлять дважды.`
    });
  }

  return normalizedValues;
}

function validateTowerPrices(
  value: unknown,
  errors: ProfileValidationError[]
): number[] {
  const items = rows<TowerPriceRow>(value);
  if (!items.length) {
    errors.push({
      path: "towerByShelfCount",
      message: "Для автоматической системы добавьте цены башни."
    });
    return [];
  }

  const shelfCounts: number[] = [];
  for (const [index, item] of items.entries()) {
    if (!positiveInteger(item.shelfCount) || item.shelfCount > 1_000) {
      errors.push({
        path: `towerByShelfCount.${index}.shelfCount`,
        message: "Количество полок должно быть целым числом от 1 до 1000."
      });
    } else {
      shelfCounts.push(item.shelfCount);
    }

    if (!positiveNumber(item.price) || item.price > 1_000_000_000_000) {
      errors.push({
        path: `towerByShelfCount.${index}.price`,
        message: "Цена башни должна быть больше нуля и не превышать 1 трлн ₽."
      });
    }
  }

  if (!uniqueNumbers(shelfCounts)) {
    errors.push({
      path: "towerByShelfCount",
      message: "Цена для одного количества полок должна быть указана только один раз."
    });
  }

  return shelfCounts;
}

function validateOptions(value: unknown, errors: ProfileValidationError[]) {
  const items = rows<CalculatorOptionRow>(value);
  const keys: string[] = [];

  for (const [index, item] of items.entries()) {
    const key =
      typeof item.optionId === "string"
        ? createProductSlug(item.optionId)
        : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";

    if (!key || key.length > 80) {
      errors.push({
        path: `options.${index}.optionId`,
        message: "Укажите короткий системный ключ латиницей, например vacuum-grip."
      });
    } else {
      keys.push(key);
    }
    if (!title) {
      errors.push({
        path: `options.${index}.title`,
        message: "Укажите понятное название дополнительной опции."
      });
    }
    if (!nonNegativeNumber(item.price) || item.price > 1_000_000_000_000) {
      errors.push({
        path: `options.${index}.price`,
        message: "Цена опции должна быть от 0 до 1 трлн ₽."
      });
    }
  }

  if (new Set(keys).size !== keys.length) {
    errors.push({
      path: "options",
      message: "Системные ключи дополнительных опций не должны повторяться."
    });
  }
}

function numberSet(value: unknown): Set<number> {
  return new Set(
    rows<NumericRow>(value)
      .map((item) => item.value)
      .filter((item): item is number => positiveNumber(item))
  );
}

function requireDefault(
  profile: PlainRecord,
  field: string,
  available: Set<number>,
  path: string,
  label: string,
  errors: ProfileValidationError[]
) {
  const defaults = isRecord(profile.defaultValues)
    ? profile.defaultValues
    : {};
  const value = defaults[field];
  if (!positiveNumber(value) || !available.has(value)) {
    errors.push({
      path: `defaultValues.${path}`,
      message: `${label} по умолчанию должна быть выбрана из добавленных вариантов.`
    });
  }
}

function requiredPositive(
  profile: PlainRecord,
  field: string,
  label: string,
  errors: ProfileValidationError[],
  allowZero = false
) {
  const value = profile[field];
  const valid = allowZero ? nonNegativeNumber(value) : positiveNumber(value);
  if (!valid) {
    errors.push({
      path: field,
      message: `${label} ${allowZero ? "не может быть отрицательным" : "должна быть больше нуля"}.`
    });
  }
}

export function validatePublishedCalculatorProfile(
  profile: PlainRecord
): ProfileValidationError[] {
  const errors: ProfileValidationError[] = [];
  const slug = typeof profile.slug === "string" ? profile.slug.trim() : "";
  const kind = typeof profile.kind === "string" ? profile.kind : "";

  if (!PROFILE_KEY_PATTERN.test(slug) || slug.length > 96) {
    errors.push({
      path: "slug",
      message: "Внутренний адрес системы имеет неверный формат."
    });
  }
  if (
    !["automatic", "forkliftCassette", "rollout", "hybrid"].includes(
      kind
    )
  ) {
    errors.push({
      path: "kind",
      message: "Выберите одну из поддерживаемых моделей расчёта."
    });
  }
  if (
    typeof profile.bestFor !== "string" ||
    !profile.bestFor.trim()
  ) {
    errors.push({
      path: "bestFor",
      message: "Поясните, для каких задач лучше подходит эта система."
    });
  }

  validateFactorRows(
    profile.heightOptions,
    "heightOptions",
    "Полезная высота",
    errors
  );
  validateFactorRows(
    profile.widthOptions,
    "widthOptions",
    "Ширина",
    errors
  );
  validateFactorRows(
    profile.lengthOptions,
    "lengthOptions",
    "Длина",
    errors
  );
  validatePriceRows(
    profile.loadOptions,
    "loadOptions",
    kind === "hybrid"
      ? "Нагрузка полок под погрузчик"
      : "Нагрузка на уровень",
    errors
  );

  const shelfCounts = validateCountRows(
    profile.shelfCountOptions,
    "shelfCountOptions",
    kind === "hybrid" ? "Полки под погрузчик" : "Количество уровней",
    errors
  );
  const towerCounts = validateCountRows(
    profile.towerCountOptions,
    "towerCountOptions",
    "Количество секций",
    errors
  );
  const rolloutCounts = validateCountRows(
    profile.rolloutShelfCountOptions,
    "rolloutShelfCountOptions",
    "Количество выкатных полок",
    errors,
    kind === "hybrid"
  );

  if (kind === "automatic") {
    const pricedShelfCounts = validateTowerPrices(
      profile.towerByShelfCount,
      errors
    );
    for (const shelfCount of shelfCounts) {
      if (!pricedShelfCounts.includes(shelfCount)) {
        errors.push({
          path: "towerByShelfCount",
          message: `Добавьте цену башни для ${shelfCount} полок.`
        });
      }
    }
    requiredPositive(
      profile,
      "consoleBasePrice",
      "Базовая цена подъёмного модуля",
      errors
    );
    requiredPositive(
      profile,
      "consoleLongFactor",
      "Коэффициент длинной системы",
      errors
    );
    requiredPositive(
      profile,
      "consoleLongFromMm",
      "Порог длинной системы",
      errors
    );
  }

  if (kind === "forkliftCassette" || kind === "rollout" || kind === "hybrid") {
    requiredPositive(
      profile,
      "towerBasePrice",
      "Базовая цена несущей секции",
      errors
    );
    requiredPositive(
      profile,
      "baseShelfCount",
      "Базовое количество уровней",
      errors
    );
    requiredPositive(
      profile,
      "extraShelfFactor",
      "Коэффициент дополнительного уровня",
      errors,
      true
    );
  }

  if (kind === "rollout" || kind === "hybrid") {
    requiredPositive(
      profile,
      "gateBasePrice",
      "Цена защитных ворот",
      errors
    );
  }

  if (kind === "hybrid") {
    validatePriceRows(
      profile.rolloutLoadOptions,
      "rolloutLoadOptions",
      "Нагрузка выкатных полок",
      errors
    );
    requiredPositive(
      profile,
      "maxCombinedShelfCount",
      "Максимальное суммарное количество полок",
      errors
    );
  }

  const heightValues = numberSet(profile.heightOptions);
  const widthValues = numberSet(profile.widthOptions);
  const lengthValues = numberSet(profile.lengthOptions);
  const loadValues = numberSet(profile.loadOptions);
  requireDefault(
    profile,
    "heightMm",
    heightValues,
    "heightMm",
    "Высота",
    errors
  );
  requireDefault(
    profile,
    "widthMm",
    widthValues,
    "widthMm",
    "Ширина",
    errors
  );
  requireDefault(
    profile,
    "lengthMm",
    lengthValues,
    "lengthMm",
    "Длина",
    errors
  );
  requireDefault(
    profile,
    "loadKg",
    loadValues,
    "loadKg",
    "Нагрузка",
    errors
  );
  requireDefault(
    profile,
    "shelfCount",
    new Set(shelfCounts),
    "shelfCount",
    "Количество уровней",
    errors
  );
  requireDefault(
    profile,
    "towerCount",
    new Set(towerCounts),
    "towerCount",
    "Количество секций",
    errors
  );

  const defaults = isRecord(profile.defaultValues)
    ? profile.defaultValues
    : {};
  if (kind === "hybrid") {
    requireDefault(
      profile,
      "rolloutShelfCount",
      new Set(rolloutCounts),
      "rolloutShelfCount",
      "Количество выкатных полок",
      errors
    );
    const maxCombined = profile.maxCombinedShelfCount;
    if (
      positiveNumber(maxCombined) &&
      positiveNumber(defaults.shelfCount) &&
      positiveNumber(defaults.rolloutShelfCount) &&
      defaults.shelfCount + defaults.rolloutShelfCount > maxCombined
    ) {
      errors.push({
        path: "defaultValues.rolloutShelfCount",
        message:
          "Сумма обычных и выкатных полок по умолчанию превышает установленный максимум."
      });
    }
  }

  if (
    kind === "rollout" &&
    defaults.rolloutSide === "two" &&
    profile.supportsTwoSided !== true
  ) {
    errors.push({
      path: "defaultValues.rolloutSide",
      message:
        "Двусторонний выкат можно выбрать по умолчанию только после включения этой возможности."
    });
  }

  validateOptions(profile.options, errors);
  return errors;
}

async function uniqueSlug(
  baseSlug: string,
  req: PayloadRequest
): Promise<string> {
  let candidate = baseSlug;

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const existing = await req.payload.find({
      collection: "calculator-profiles",
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: candidate } }
    });
    if (existing.docs.length === 0) return candidate;
    candidate = `${baseSlug}-${suffix}`;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

export const prepareCalculatorProfile: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req
}) => {
  if (!data) return data;

  const originalSlug =
    originalDoc && typeof originalDoc.slug === "string"
      ? originalDoc.slug.trim()
      : "";
  const title = typeof data.title === "string" ? data.title.trim() : "";

  if (!data.shortTitle && title) {
    data.shortTitle =
      title.length > 64 ? `${title.slice(0, 61).trim()}…` : title;
  }

  if (Array.isArray(data.options)) {
    const usedKeys = new Set<string>();
    data.options = data.options.map((item, index) => {
      if (!isRecord(item)) return item;
      const submittedKey =
        typeof item.optionId === "string"
          ? createProductSlug(item.optionId)
          : "";
      const titleKey =
        typeof item.title === "string"
          ? createProductSlug(item.title)
          : "";
      const baseKey = submittedKey || titleKey || `option-${index + 1}`;
      let optionId = baseKey;
      let suffix = 2;
      while (usedKeys.has(optionId)) {
        optionId = `${baseKey}-${suffix}`;
        suffix += 1;
      }
      usedKeys.add(optionId);
      return { ...item, optionId };
    });
  }

  if (operation === "update" && originalSlug) {
    data.slug = originalSlug;
  } else {
    const submitted =
      typeof data.slug === "string" ? createProductSlug(data.slug) : "";
    const baseSlug = submitted || createProductSlug(title);
    if (baseSlug) {
      data.slug = await uniqueSlug(baseSlug, req);
    }
  }

  const merged = {
    ...(isRecord(originalDoc) ? originalDoc : {}),
    ...data
  };
  if (merged._status === "published") {
    const errors = validatePublishedCalculatorProfile(merged);
    if (errors.length) {
      throw new ValidationError({
        collection: "calculator-profiles",
        errors,
        id:
          originalDoc &&
          (typeof originalDoc.id === "string" ||
            typeof originalDoc.id === "number")
            ? originalDoc.id
            : undefined,
        req
      });
    }
  }

  return data;
};
