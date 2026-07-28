import type { CalculatorProfile as RuntimeCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";

export type CalculatorProfileSeed = ReturnType<typeof toCalculatorProfileSeed>;

function loadFactor(price: number, basePrice: number) {
  return Math.round((price / basePrice) * 1000) / 1000;
}

export function toCalculatorProfileSeed(profile: RuntimeCalculatorProfile) {
  const baseLoadPrice = profile.loadOptions[0]?.price || 1;
  const pricing = profile.pricing;

  const towerByShelfCount = pricing.kind === "automatic"
    ? Object.entries(pricing.towerPricesByShelfCount).map(([shelfCount, price]) => ({
        shelfCount: Number(shelfCount),
        price,
        factor: Math.round((price / pricing.towerPricesByShelfCount[10]) * 1000) / 1000
      }))
    : [];

  const towerBasePrice = pricing.kind === "forkliftCassette" || pricing.kind === "rollout"
    ? pricing.towerBasePrice
    : pricing.kind === "hybrid"
      ? pricing.fixedTowerAndGatePrice
      : undefined;
  const baseShelfCount = pricing.kind === "forkliftCassette"
    ? pricing.towerBaseShelfCount
    : pricing.kind === "rollout"
      ? pricing.baseShelfCount
      : undefined;
  const extraShelfFactor = pricing.kind === "forkliftCassette"
    ? pricing.towerExtraShelfFactor
    : pricing.kind === "rollout"
      ? pricing.extraShelfFactor
      : undefined;

  return {
    slug: profile.id,
    kind: pricing.kind,
    title: profile.title,
    shortTitle: profile.shortTitle,
    description: profile.description,
    heightOptions: profile.heightOptions.map(({ value, factor }) => ({ value, factor })),
    widthOptions: profile.widthOptions.map(({ value, factor }) => ({ value, factor })),
    lengthOptions: profile.lengthOptions.map(({ value, factor }) => ({ value, factor })),
    loadOptions: profile.loadOptions.map(({ value, price }) => ({
      value,
      price,
      factor: loadFactor(price, baseLoadPrice)
    })),
    towerByShelfCount,
    towerBasePrice,
    baseShelfCount,
    extraShelfFactor,
    consoleBasePrice: pricing.kind === "automatic" ? pricing.consoleBasePrice : undefined,
    consoleLongFactor: pricing.kind === "automatic" ? pricing.consoleLongFactor : undefined,
    gateBasePrice: pricing.kind === "rollout" ? pricing.gateBasePrice : undefined,
    options: profile.options.map(({ id, title, price, defaultSelected }) => ({
      id,
      title,
      price,
      defaultSelected: Boolean(defaultSelected)
    })),
    defaultValues: {
      heightMm: profile.defaultValues.heightMm,
      widthMm: profile.defaultValues.widthMm,
      lengthMm: profile.defaultValues.lengthMm,
      loadKg: profile.defaultValues.loadKg,
      shelfCount: profile.defaultValues.shelfCount,
      towerCount: profile.defaultValues.towerCount,
      rolloutShelfCount: profile.defaultValues.rolloutShelfCount,
      rolloutSide: profile.defaultValues.rolloutSide
    },
    _status: "published" as const
  };
}

export const calculatorProfileSeeds = calculatorProfiles.map(toCalculatorProfileSeed);