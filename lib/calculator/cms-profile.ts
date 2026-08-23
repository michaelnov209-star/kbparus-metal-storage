import {
  type CalculatorOption,
  type CalculatorProfile as RuntimeCalculatorProfile,
  type FactorOption,
  type PriceOption
} from "@/data/storageSystems/excelCalculator";
import type { ProductType } from "@/data/storageSystems/types";
import type { CalculatorProfile as CmsCalculatorProfile } from "@/payload-types";
import { resolveCmsMediaAlt, resolveCmsMediaUrl } from "@/lib/cms/media-url";

type UnknownRecord = Record<string, unknown>;

/**
 * Payload types are generated from the deployed schema. Runtime mapping stays
 * forward-compatible with the profile-builder fields while a schema migration
 * is being rolled out, without weakening validation of published documents.
 */
export type RuntimeCmsCalculatorProfile = Omit<
  CmsCalculatorProfile,
  "slug"
> & {
  slug: string;
  bestFor?: string | null;
  iconKey?: string | null;
  sortOrder?: number | null;
  sourceReference?: string | null;
  shelfCountOptions?: unknown;
  rolloutShelfCountOptions?: unknown;
  towerCountOptions?: unknown;
  rolloutLoadOptions?: unknown;
  supportsTwoSided?: boolean | null;
  consoleLongFromMm?: number | null;
};

const CALCULATOR_PROFILE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CALCULATOR_KINDS = new Set([
  "automatic",
  "forkliftCassette",
  "rollout",
  "hybrid"
]);

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function trimmedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function positiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function optionalPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function nonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function optionalNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function factorOptions(
  value: unknown,
  fallback: readonly FactorOption[] = []
): FactorOption[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }
  const normalized = value
    .map(asRecord)
    .filter((item): item is UnknownRecord => Boolean(item))
    .filter(
      (item) =>
        Number.isFinite(item.value) &&
        Number(item.value) > 0 &&
        Number.isFinite(item.factor) &&
        Number(item.factor) > 0
    )
    .map((item) => ({
      value: Number(item.value),
      factor: Number(item.factor),
      ...(trimmedString(item.label)
        ? { label: trimmedString(item.label) }
        : {})
    }));
  return normalized.length
    ? uniqueByValue(normalized)
    : fallback.map((item) => ({ ...item }));
}

function priceOptions(
  value: unknown,
  fallback: readonly PriceOption[] = []
): PriceOption[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }
  const normalized = value
    .map(asRecord)
    .filter((item): item is UnknownRecord => Boolean(item))
    .filter(
      (item) =>
        Number.isFinite(item.value) &&
        Number(item.value) > 0 &&
        Number.isFinite(item.price) &&
        Number(item.price) > 0
    )
    .map((item) => ({
      value: Number(item.value),
      price: Number(item.price),
      ...(trimmedString(item.label)
        ? { label: trimmedString(item.label) }
        : {})
    }));
  return normalized.length
    ? uniqueByValue(normalized)
    : fallback.map((item) => ({ ...item }));
}

function uniqueByValue<T extends { value: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

function numericOptions(value: unknown, fallback: readonly number[] = []) {
  if (!Array.isArray(value) || value.length === 0) return [...fallback];

  const normalized = value
    .map((item) =>
      typeof item === "number" ? item : Number(asRecord(item)?.value)
    )
    .filter(
      (item) => Number.isFinite(item) && item > 0 && Number.isInteger(item)
    );

  return normalized.length
    ? [...new Set(normalized)]
    : [...fallback];
}

function calculatorOptions(
  value: unknown,
  fallback: readonly CalculatorOption[] = []
): CalculatorOption[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }
  const normalized = value
    .map(asRecord)
    .filter((item): item is UnknownRecord => Boolean(item))
    .filter((item) => {
      const id = trimmedString(item.optionId) ?? trimmedString(item.id);
      return (
        Boolean(id && trimmedString(item.title)) &&
        Number.isFinite(item.price) &&
        Number(item.price) >= 0
      );
    })
    .map((item) => ({
      id: String(trimmedString(item.optionId) ?? trimmedString(item.id)),
      title: String(trimmedString(item.title)),
      price: Number(item.price),
      defaultSelected: Boolean(item.defaultSelected)
    }));

  const seen = new Set<string>();
  const unique = normalized.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return unique.length
    ? unique
    : fallback.map((item) => ({ ...item }));
}

function defaultValues(
  doc: RuntimeCmsCalculatorProfile,
  fallback: RuntimeCalculatorProfile
) {
  const value = doc.defaultValues;
  if (!value) return { ...fallback.defaultValues };
  return {
    heightMm: positiveNumber(
      value.heightMm,
      fallback.defaultValues.heightMm
    ),
    widthMm: positiveNumber(value.widthMm, fallback.defaultValues.widthMm),
    lengthMm: positiveNumber(
      value.lengthMm,
      fallback.defaultValues.lengthMm
    ),
    loadKg: positiveNumber(value.loadKg, fallback.defaultValues.loadKg),
    shelfCount: positiveNumber(
      value.shelfCount,
      fallback.defaultValues.shelfCount
    ),
    towerCount: positiveNumber(
      value.towerCount,
      fallback.defaultValues.towerCount
    ),
    ...(fallback.defaultValues.rolloutShelfCount !== undefined ||
    value.rolloutShelfCount !== undefined
      ? {
          rolloutShelfCount: positiveNumber(
            value.rolloutShelfCount,
            fallback.defaultValues.rolloutShelfCount ??
              fallback.defaultValues.shelfCount
          )
        }
      : {}),
    ...(fallback.defaultValues.rolloutSide !== undefined || value.rolloutSide
      ? {
          rolloutSide:
            value.rolloutSide ?? fallback.defaultValues.rolloutSide
        }
      : {})
  };
}

function productTypeForKind(
  kind: RuntimeCmsCalculatorProfile["kind"]
): ProductType {
  if (kind === "automatic") return "automated";
  if (kind === "forkliftCassette") return "cassette";
  if (kind === "rollout") return "rollout";
  return "hybrid";
}

function nearestAllowed(value: unknown, options: readonly number[]) {
  if (options.length === 0) return 0;
  const numeric = optionalPositiveNumber(value);
  if (numeric === undefined) return options[0];
  return options.reduce((nearest, candidate) =>
    Math.abs(candidate - numeric) < Math.abs(nearest - numeric)
      ? candidate
      : nearest
  );
}

function customDefaultValues(
  doc: RuntimeCmsCalculatorProfile,
  dimensions: {
    heights: readonly FactorOption[];
    widths: readonly FactorOption[];
    lengths: readonly FactorOption[];
    loads: readonly PriceOption[];
    shelves: readonly number[];
    rolloutShelves: readonly number[];
    towers: readonly number[];
  }
): RuntimeCalculatorProfile["defaultValues"] {
  const value = doc.defaultValues;
  return {
    heightMm: nearestAllowed(
      value?.heightMm,
      dimensions.heights.map((item) => item.value)
    ),
    widthMm: nearestAllowed(
      value?.widthMm,
      dimensions.widths.map((item) => item.value)
    ),
    lengthMm: nearestAllowed(
      value?.lengthMm,
      dimensions.lengths.map((item) => item.value)
    ),
    loadKg: nearestAllowed(
      value?.loadKg,
      dimensions.loads.map((item) => item.value)
    ),
    shelfCount: nearestAllowed(value?.shelfCount, dimensions.shelves),
    towerCount: nearestAllowed(value?.towerCount, dimensions.towers),
    ...(dimensions.rolloutShelves.length
      ? {
          rolloutShelfCount: nearestAllowed(
            value?.rolloutShelfCount,
            dimensions.rolloutShelves
          )
        }
      : {}),
    ...(value?.rolloutSide
      ? { rolloutSide: value.rolloutSide }
      : {})
  };
}

function customCommonProfile(
  doc: RuntimeCmsCalculatorProfile
): Omit<RuntimeCalculatorProfile, "pricing"> | undefined {
  const id = trimmedString(doc.slug);
  const title = trimmedString(doc.title);
  const shortTitle = trimmedString(doc.shortTitle);
  const description = trimmedString(doc.description);
  if (
    !id ||
    id.length > 80 ||
    !CALCULATOR_PROFILE_SLUG.test(id) ||
    !CALCULATOR_KINDS.has(doc.kind) ||
    !title ||
    !shortTitle ||
    !description
  ) {
    return undefined;
  }

  const heightOptions = factorOptions(doc.heightOptions);
  const widthOptions = factorOptions(doc.widthOptions);
  const lengthOptions = factorOptions(doc.lengthOptions);
  const loadOptions = priceOptions(doc.loadOptions);
  const towerEntries = Array.isArray(doc.towerByShelfCount)
    ? doc.towerByShelfCount.filter(
        (item) =>
          Number.isFinite(item.shelfCount) &&
          item.shelfCount > 0 &&
          Number.isFinite(item.price) &&
          item.price > 0
      )
    : [];
  const shelfCountOptions = numericOptions(
    doc.shelfCountOptions,
    doc.kind === "automatic"
      ? towerEntries.map((item) => item.shelfCount)
      : []
  );
  const rolloutShelfCountOptions = numericOptions(
    doc.rolloutShelfCountOptions
  );
  const towerCountOptions = numericOptions(doc.towerCountOptions);

  if (
    !heightOptions.length ||
    !widthOptions.length ||
    !lengthOptions.length ||
    !loadOptions.length ||
    !shelfCountOptions.length ||
    !towerCountOptions.length
  ) {
    return undefined;
  }

  const maxCombinedShelfCount =
    doc.kind === "hybrid"
      ? optionalPositiveNumber(doc.maxCombinedShelfCount)
      : undefined;
  if (
    doc.kind === "hybrid" &&
    (!rolloutShelfCountOptions.length || !maxCombinedShelfCount)
  ) {
    return undefined;
  }

  return {
    id,
    title,
    shortTitle,
    sourceSheet:
      trimmedString(doc.sourceReference) ??
      `Профиль CMS: ${shortTitle}`,
    productType: productTypeForKind(doc.kind),
    description,
    bestFor: trimmedString(doc.bestFor),
    iconKey: trimmedString(doc.iconKey),
    sortOrder: optionalNonNegativeNumber(doc.sortOrder),
    image: resolveCmsMediaUrl(doc.image),
    imageAlt: resolveCmsMediaAlt(doc.image, title),
    heightOptions,
    widthOptions,
    lengthOptions,
    loadOptions,
    shelfCountOptions,
    ...(rolloutShelfCountOptions.length
      ? { rolloutShelfCountOptions }
      : {}),
    ...(maxCombinedShelfCount ? { maxCombinedShelfCount } : {}),
    towerCountOptions,
    defaultValues: customDefaultValues(doc, {
      heights: heightOptions,
      widths: widthOptions,
      lengths: lengthOptions,
      loads: loadOptions,
      shelves: shelfCountOptions,
      rolloutShelves: rolloutShelfCountOptions,
      towers: towerCountOptions
    }),
    options: calculatorOptions(doc.options)
  };
}

export function mergeCmsCalculatorProfile(
  rawDoc: CmsCalculatorProfile | RuntimeCmsCalculatorProfile,
  fallback: RuntimeCalculatorProfile
): RuntimeCalculatorProfile {
  const doc = rawDoc as RuntimeCmsCalculatorProfile;
  if (doc.slug !== fallback.id || doc.kind !== fallback.pricing.kind) {
    return fallback;
  }

  const common = {
    ...fallback,
    title: doc.title?.trim() || fallback.title,
    shortTitle: doc.shortTitle?.trim() || fallback.shortTitle,
    description: doc.description?.trim() || fallback.description,
    bestFor: trimmedString(doc.bestFor) ?? fallback.bestFor,
    iconKey: trimmedString(doc.iconKey) ?? fallback.iconKey,
    sortOrder:
      optionalNonNegativeNumber(doc.sortOrder) ?? fallback.sortOrder,
    image: resolveCmsMediaUrl(doc.image, { fallback: fallback.image }),
    imageAlt: resolveCmsMediaAlt(
      doc.image,
      fallback.imageAlt ?? fallback.title
    ),
    heightOptions: factorOptions(doc.heightOptions, fallback.heightOptions),
    widthOptions: factorOptions(doc.widthOptions, fallback.widthOptions),
    lengthOptions: factorOptions(doc.lengthOptions, fallback.lengthOptions),
    loadOptions: priceOptions(doc.loadOptions, fallback.loadOptions),
    shelfCountOptions: numericOptions(
      doc.shelfCountOptions,
      fallback.shelfCountOptions
    ),
    ...(fallback.rolloutShelfCountOptions ||
    Array.isArray(doc.rolloutShelfCountOptions)
      ? {
          rolloutShelfCountOptions: numericOptions(
            doc.rolloutShelfCountOptions,
            fallback.rolloutShelfCountOptions
          )
        }
      : {}),
    towerCountOptions: numericOptions(
      doc.towerCountOptions,
      fallback.towerCountOptions
    ),
    options: calculatorOptions(doc.options, fallback.options),
    defaultValues: defaultValues(doc, fallback)
  };

  if (fallback.pricing.kind === "automatic") {
    const towerEntries = Array.isArray(doc.towerByShelfCount)
      ? doc.towerByShelfCount.filter(
          (item) => item.shelfCount > 0 && item.price > 0
        )
      : [];
    const towerPricesByShelfCount = towerEntries.length
      ? Object.fromEntries(
          towerEntries.map((item) => [item.shelfCount, item.price])
        )
      : { ...fallback.pricing.towerPricesByShelfCount };

    return {
      ...common,
      pricing: {
        kind: "automatic",
        towerPricesByShelfCount,
        consoleBasePrice: positiveNumber(
          doc.consoleBasePrice,
          fallback.pricing.consoleBasePrice
        ),
        consoleLongFactor: positiveNumber(
          doc.consoleLongFactor,
          fallback.pricing.consoleLongFactor
        ),
        consoleLongFromMm: positiveNumber(
          doc.consoleLongFromMm,
          fallback.pricing.consoleLongFromMm ?? 3100
        )
      }
    };
  }

  if (fallback.pricing.kind === "forkliftCassette") {
    return {
      ...common,
      pricing: {
        kind: "forkliftCassette",
        towerBasePrice: positiveNumber(
          doc.towerBasePrice,
          fallback.pricing.towerBasePrice
        ),
        towerBaseShelfCount: positiveNumber(
          doc.baseShelfCount,
          fallback.pricing.towerBaseShelfCount
        ),
        towerExtraShelfFactor: nonNegativeNumber(
          doc.extraShelfFactor,
          fallback.pricing.towerExtraShelfFactor
        )
      }
    };
  }

  if (fallback.pricing.kind === "rollout") {
    return {
      ...common,
      pricing: {
        kind: "rollout",
        towerBasePrice: positiveNumber(
          doc.towerBasePrice,
          fallback.pricing.towerBasePrice
        ),
        gateBasePrice: positiveNumber(
          doc.gateBasePrice,
          fallback.pricing.gateBasePrice
        ),
        baseShelfCount: positiveNumber(
          doc.baseShelfCount,
          fallback.pricing.baseShelfCount
        ),
        extraShelfFactor: nonNegativeNumber(
          doc.extraShelfFactor,
          fallback.pricing.extraShelfFactor
        ),
        sides:
          typeof doc.supportsTwoSided === "boolean"
            ? doc.supportsTwoSided
              ? [
                  { value: "one" as const, label: "Выкат с одной стороны" },
                  { value: "two" as const, label: "Выкат с двух сторон" }
                ]
              : undefined
            : fallback.pricing.sides
      }
    };
  }

  return {
    ...common,
    maxCombinedShelfCount: positiveNumber(
      doc.maxCombinedShelfCount,
      fallback.maxCombinedShelfCount ?? 25
    ),
    pricing: {
      kind: "hybrid",
      forkliftLoadOptions: priceOptions(
        doc.loadOptions,
        fallback.pricing.forkliftLoadOptions
      ),
      rolloutLoadOptions: priceOptions(
        doc.rolloutLoadOptions,
        fallback.pricing.rolloutLoadOptions
      ),
      towerBasePrice: positiveNumber(
        doc.towerBasePrice,
        fallback.pricing.towerBasePrice
      ),
      gateBasePrice: positiveNumber(
        doc.gateBasePrice,
        fallback.pricing.gateBasePrice
      ),
      baseShelfCount: positiveNumber(
        doc.baseShelfCount,
        fallback.pricing.baseShelfCount
      ),
      extraShelfFactor: nonNegativeNumber(
        doc.extraShelfFactor,
        fallback.pricing.extraShelfFactor
      )
    }
  };
}

/**
 * Builds a runtime profile for a non-canonical CMS document. Returning
 * undefined isolates one invalid published document without taking the entire
 * calculator offline.
 */
export function createCmsCalculatorProfile(
  rawDoc: CmsCalculatorProfile | RuntimeCmsCalculatorProfile
): RuntimeCalculatorProfile | undefined {
  const doc = rawDoc as RuntimeCmsCalculatorProfile;
  const common = customCommonProfile(doc);
  if (!common) return undefined;

  if (doc.kind === "automatic") {
    const towerEntries = Array.isArray(doc.towerByShelfCount)
      ? doc.towerByShelfCount.filter(
          (item) =>
            Number.isFinite(item.shelfCount) &&
            item.shelfCount > 0 &&
            Number.isFinite(item.price) &&
            item.price > 0
        )
      : [];
    const consoleBasePrice = optionalPositiveNumber(doc.consoleBasePrice);
    const consoleLongFactor = optionalPositiveNumber(doc.consoleLongFactor);
    if (
      !towerEntries.length ||
      !common.shelfCountOptions.every((shelfCount) =>
        towerEntries.some((entry) => entry.shelfCount === shelfCount)
      ) ||
      consoleBasePrice === undefined ||
      consoleLongFactor === undefined
    ) {
      return undefined;
    }
    return {
      ...common,
      pricing: {
        kind: "automatic",
        towerPricesByShelfCount: Object.fromEntries(
          towerEntries.map((item) => [item.shelfCount, item.price])
        ),
        consoleBasePrice,
        consoleLongFactor,
        consoleLongFromMm:
          optionalPositiveNumber(doc.consoleLongFromMm) ?? 3100
      }
    };
  }

  const towerBasePrice = optionalPositiveNumber(doc.towerBasePrice);
  const baseShelfCount = optionalPositiveNumber(doc.baseShelfCount);
  const extraShelfFactor = optionalNonNegativeNumber(doc.extraShelfFactor);
  if (
    towerBasePrice === undefined ||
    baseShelfCount === undefined ||
    extraShelfFactor === undefined
  ) {
    return undefined;
  }

  if (doc.kind === "forkliftCassette") {
    return {
      ...common,
      pricing: {
        kind: "forkliftCassette",
        towerBasePrice,
        towerBaseShelfCount: baseShelfCount,
        towerExtraShelfFactor: extraShelfFactor
      }
    };
  }

  const gateBasePrice = optionalPositiveNumber(doc.gateBasePrice);
  if (gateBasePrice === undefined) return undefined;

  if (doc.kind === "rollout") {
    return {
      ...common,
      pricing: {
        kind: "rollout",
        towerBasePrice,
        gateBasePrice,
        baseShelfCount,
        extraShelfFactor,
        ...(doc.supportsTwoSided
          ? {
              sides: [
                { value: "one" as const, label: "Выкат с одной стороны" },
                { value: "two" as const, label: "Выкат с двух сторон" }
              ]
            }
          : {})
      }
    };
  }

  const rolloutLoadOptions = priceOptions(doc.rolloutLoadOptions);
  if (!rolloutLoadOptions.length || !common.maxCombinedShelfCount) {
    return undefined;
  }
  return {
    ...common,
    pricing: {
      kind: "hybrid",
      forkliftLoadOptions: common.loadOptions,
      rolloutLoadOptions,
      towerBasePrice,
      gateBasePrice,
      baseShelfCount,
      extraShelfFactor
    }
  };
}
