import type {
  BuiltInCalculatorProfileId,
  CalculatorProfile as RuntimeCalculatorProfile
} from "@/data/storageSystems/excelCalculator";
import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";
import { interpolateTierPrice } from "@/lib/calculator/pricing";

export type CalculatorProfileSeed = ReturnType<typeof toCalculatorProfileSeed>;

const builtInProfilePresentation: Record<
  BuiltInCalculatorProfileId,
  {
    bestFor: string;
    iconKey:
      | "automation"
      | "long-products"
      | "rollout"
      | "forklift"
      | "two-sided"
      | "hybrid";
    sortOrder: number;
  }
> = {
  "auto-sheet-metal": {
    bestFor:
      "Для производства с частым оборотом листов, дефицитом площади и автоматической выдачей.",
    iconKey: "automation",
    sortOrder: 10
  },
  "auto-sort-metal": {
    bestFor:
      "Для склада труб, профиля и балок с большим ассортиментом и регулярной комплектацией.",
    iconKey: "long-products",
    sortOrder: 20
  },
  "rollout-cassette-rack": {
    bestFor:
      "Для участка, где важен быстрый доступ к каждой пачке без разбора соседних уровней.",
    iconKey: "rollout",
    sortOrder: 30
  },
  "forklift-cassette-rack": {
    bestFor:
      "Для склада с погрузчиком, где приоритетны плотность хранения и экономичность.",
    iconKey: "forklift",
    sortOrder: 40
  },
  "two-side-rollout-rack": {
    bestFor:
      "Для цеха с двумя проходами или одновременной работой нескольких операторов.",
    iconKey: "two-sided",
    sortOrder: 50
  },
  "hybrid-rollout-rack": {
    bestFor:
      "Для предприятия, которому нужны плотное хранение и быстрый доступ к ходовым позициям.",
    iconKey: "hybrid",
    sortOrder: 60
  }
};

export function toCalculatorProfileSeed(
  profile: RuntimeCalculatorProfile & { id: BuiltInCalculatorProfileId }
) {
  const pricing = profile.pricing;
  const presentation = builtInProfilePresentation[profile.id];

  const towerByShelfCount =
    pricing.kind === "automatic"
      ? (() => {
          const priceTiers = Object.entries(
            pricing.towerPricesByShelfCount
          )
            .map(([shelfCount, price]) => [Number(shelfCount), price] as const)
            .filter(
              ([shelfCount, price]) =>
                Number.isFinite(shelfCount) &&
                shelfCount > 0 &&
                Number.isFinite(price) &&
                price > 0
            )
            .sort(([left], [right]) => left - right);
          const fallbackPrice = priceTiers[0]?.[1] ?? 0;

          return profile.shelfCountOptions.map((shelfCount) => ({
            shelfCount,
            price: interpolateTierPrice(
              priceTiers,
              shelfCount,
              fallbackPrice
            )
          }));
        })()
      : [];

  const towerBasePrice = pricing.kind === "forkliftCassette" || pricing.kind === "rollout" || pricing.kind === "hybrid"
    ? pricing.towerBasePrice
    : undefined;
  const baseShelfCount = pricing.kind === "forkliftCassette"
    ? pricing.towerBaseShelfCount
    : pricing.kind === "rollout" || pricing.kind === "hybrid"
      ? pricing.baseShelfCount
      : undefined;
  const extraShelfFactor = pricing.kind === "forkliftCassette"
    ? pricing.towerExtraShelfFactor
    : pricing.kind === "rollout" || pricing.kind === "hybrid"
      ? pricing.extraShelfFactor
      : undefined;

  return {
    slug: profile.id,
    kind: pricing.kind,
    title: profile.title,
    shortTitle: profile.shortTitle,
    description: profile.description,
    bestFor: profile.bestFor ?? presentation.bestFor,
    iconKey: presentation.iconKey,
    sortOrder: presentation.sortOrder,
    heightOptions: profile.heightOptions.map(({ value, factor }) => ({ value, factor })),
    widthOptions: profile.widthOptions.map(({ value, factor }) => ({ value, factor })),
    lengthOptions: profile.lengthOptions.map(({ value, factor }) => ({ value, factor })),
    loadOptions: profile.loadOptions.map(({ value, price }) => ({ value, price })),
    rolloutLoadOptions:
      pricing.kind === "hybrid"
        ? pricing.rolloutLoadOptions.map(({ value, price }) => ({
            value,
            price
          }))
        : [],
    shelfCountOptions: profile.shelfCountOptions.map((value) => ({ value })),
    rolloutShelfCountOptions:
      profile.rolloutShelfCountOptions?.map((value) => ({ value })) ?? [],
    towerCountOptions: profile.towerCountOptions.map((value) => ({ value })),
    towerByShelfCount,
    towerBasePrice,
    baseShelfCount,
    extraShelfFactor,
    maxCombinedShelfCount: profile.maxCombinedShelfCount,
    consoleBasePrice: pricing.kind === "automatic" ? pricing.consoleBasePrice : undefined,
    consoleLongFactor: pricing.kind === "automatic" ? pricing.consoleLongFactor : undefined,
    consoleLongFromMm:
      pricing.kind === "automatic"
        ? (pricing.consoleLongFromMm ?? 3100)
        : undefined,
    gateBasePrice: pricing.kind === "rollout" || pricing.kind === "hybrid" ? pricing.gateBasePrice : undefined,
    supportsTwoSided:
      pricing.kind === "rollout"
        ? Boolean(pricing.sides?.some((side) => side.value === "two"))
        : false,
    options: profile.options.map(({ id, title, price, defaultSelected }) => ({
      optionId: id,
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
