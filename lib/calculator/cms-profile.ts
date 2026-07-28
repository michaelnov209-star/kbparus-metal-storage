import {
  type CalculatorOption,
  type CalculatorProfile as RuntimeCalculatorProfile,
  type FactorOption,
  type PriceOption
} from "@/data/storageSystems/excelCalculator";
import type { CalculatorProfile as CmsCalculatorProfile } from "@/payload-types";

function positiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function factorOptions(value: CmsCalculatorProfile["heightOptions"], fallback: readonly FactorOption[]): FactorOption[] {
  if (!Array.isArray(value) || value.length === 0) return fallback.map((item) => ({ ...item }));
  const normalized = value
    .filter((item) => Number.isFinite(item.value) && item.value > 0 && Number.isFinite(item.factor) && item.factor > 0)
    .map((item) => ({ value: item.value, factor: item.factor }));
  return normalized.length ? normalized : fallback.map((item) => ({ ...item }));
}

function priceOptions(value: CmsCalculatorProfile["loadOptions"], fallback: readonly PriceOption[]): PriceOption[] {
  if (!Array.isArray(value) || value.length === 0) return fallback.map((item) => ({ ...item }));
  const normalized = value
    .filter((item) => Number.isFinite(item.value) && item.value > 0 && Number.isFinite(item.price) && item.price > 0)
    .map((item) => ({ value: item.value, price: item.price }));
  return normalized.length ? normalized : fallback.map((item) => ({ ...item }));
}

function calculatorOptions(value: CmsCalculatorProfile["options"], fallback: readonly CalculatorOption[]): CalculatorOption[] {
  if (!Array.isArray(value) || value.length === 0) return fallback.map((item) => ({ ...item }));
  const normalized = value
    .filter((item) => Boolean(item.id && item.title) && Number.isFinite(item.price) && item.price >= 0)
    .map((item) => ({
      id: String(item.id),
      title: item.title,
      price: item.price,
      defaultSelected: Boolean(item.defaultSelected)
    }));
  return normalized.length ? normalized : fallback.map((item) => ({ ...item }));
}

function defaultValues(doc: CmsCalculatorProfile, fallback: RuntimeCalculatorProfile) {
  const value = doc.defaultValues;
  if (!value) return { ...fallback.defaultValues };
  return {
    heightMm: positiveNumber(value.heightMm, fallback.defaultValues.heightMm),
    widthMm: positiveNumber(value.widthMm, fallback.defaultValues.widthMm),
    lengthMm: positiveNumber(value.lengthMm, fallback.defaultValues.lengthMm),
    loadKg: positiveNumber(value.loadKg, fallback.defaultValues.loadKg),
    shelfCount: positiveNumber(value.shelfCount, fallback.defaultValues.shelfCount),
    towerCount: positiveNumber(value.towerCount, fallback.defaultValues.towerCount),
    ...(fallback.defaultValues.rolloutShelfCount !== undefined || value.rolloutShelfCount !== undefined
      ? {
          rolloutShelfCount: positiveNumber(
            value.rolloutShelfCount,
            fallback.defaultValues.rolloutShelfCount ?? fallback.defaultValues.shelfCount
          )
        }
      : {}),
    ...(fallback.defaultValues.rolloutSide !== undefined || value.rolloutSide
      ? { rolloutSide: value.rolloutSide ?? fallback.defaultValues.rolloutSide }
      : {})
  };
}

export function mergeCmsCalculatorProfile(
  doc: CmsCalculatorProfile,
  fallback: RuntimeCalculatorProfile
): RuntimeCalculatorProfile {
  if (doc.slug !== fallback.id || doc.kind !== fallback.pricing.kind) return fallback;

  const common = {
    ...fallback,
    title: doc.title?.trim() || fallback.title,
    shortTitle: doc.shortTitle?.trim() || fallback.shortTitle,
    description: doc.description?.trim() || fallback.description,
    heightOptions: factorOptions(doc.heightOptions, fallback.heightOptions),
    widthOptions: factorOptions(doc.widthOptions, fallback.widthOptions),
    lengthOptions: factorOptions(doc.lengthOptions, fallback.lengthOptions),
    loadOptions: priceOptions(doc.loadOptions, fallback.loadOptions),
    options: calculatorOptions(doc.options, fallback.options),
    defaultValues: defaultValues(doc, fallback)
  };

  if (fallback.pricing.kind === "automatic") {
    const towerEntries = Array.isArray(doc.towerByShelfCount)
      ? doc.towerByShelfCount.filter((item) => item.shelfCount > 0 && item.price > 0)
      : [];
    const towerPricesByShelfCount = towerEntries.length
      ? Object.fromEntries(towerEntries.map((item) => [item.shelfCount, item.price]))
      : { ...fallback.pricing.towerPricesByShelfCount };

    return {
      ...common,
      pricing: {
        kind: "automatic",
        towerPricesByShelfCount,
        consoleBasePrice: positiveNumber(doc.consoleBasePrice, fallback.pricing.consoleBasePrice),
        consoleLongFactor: positiveNumber(doc.consoleLongFactor, fallback.pricing.consoleLongFactor)
      }
    };
  }

  if (fallback.pricing.kind === "forkliftCassette") {
    return {
      ...common,
      pricing: {
        kind: "forkliftCassette",
        towerBasePrice: positiveNumber(doc.towerBasePrice, fallback.pricing.towerBasePrice),
        towerBaseShelfCount: positiveNumber(doc.baseShelfCount, fallback.pricing.towerBaseShelfCount),
        towerExtraShelfFactor: nonNegativeNumber(doc.extraShelfFactor, fallback.pricing.towerExtraShelfFactor)
      }
    };
  }

  if (fallback.pricing.kind === "rollout") {
    return {
      ...common,
      pricing: {
        kind: "rollout",
        towerBasePrice: positiveNumber(doc.towerBasePrice, fallback.pricing.towerBasePrice),
        gateBasePrice: positiveNumber(doc.gateBasePrice, fallback.pricing.gateBasePrice),
        baseShelfCount: positiveNumber(doc.baseShelfCount, fallback.pricing.baseShelfCount),
        extraShelfFactor: nonNegativeNumber(doc.extraShelfFactor, fallback.pricing.extraShelfFactor),
        sides: fallback.pricing.sides
      }
    };
  }

  return {
    ...common,
    pricing: {
      kind: "hybrid",
      forkliftLoadOptions: priceOptions(doc.loadOptions, fallback.pricing.forkliftLoadOptions),
      rolloutLoadOptions: fallback.pricing.rolloutLoadOptions.map((item) => ({ ...item })),
      fixedTowerAndGatePrice: positiveNumber(doc.towerBasePrice, fallback.pricing.fixedTowerAndGatePrice)
    }
  };
}
