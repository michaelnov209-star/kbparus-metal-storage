import { getCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import type { CalculatorProfile, FactorOption, PriceOption } from "@/data/storageSystems/excelCalculator";
import { calculatorOptionPresentation } from "@/data/storageSystems/calculatorOptionPresentation";
import type { CalculatorInput, CalculatorResult, RecommendedConfig } from "./types";

function findFactor(options: readonly FactorOption[], value: number) {
  return options.find((option) => option.value === value)?.factor ?? options[0]?.factor ?? 1;
}

function findPrice(options: readonly PriceOption[], value: number) {
  return options.find((option) => option.value === value)?.price ?? options[0]?.price ?? 0;
}

function roundMoney(value: number) {
  return Math.round(value);
}

function progressiveFactor(count: number, baseCount: number, extraFactor: number) {
  return count > baseCount ? 1 + extraFactor * (count - baseCount) : 1;
}

function formatDimensions(lengthMm: number, widthMm: number, heightMm: number) {
  return `${lengthMm.toLocaleString("ru-RU")}×${widthMm.toLocaleString("ru-RU")}×${heightMm.toLocaleString("ru-RU")}\u00a0мм`;
}

function loadTargetLabel(profile: CalculatorProfile) {
  if (profile.pricing.kind === "forkliftCassette") return "кассету";
  if (profile.pricing.kind === "rollout") return "выкатную кассету";
  if (profile.pricing.kind === "hybrid") return "полку или кассету";
  return "полку";
}

export function interpolateTierPrice(
  entries: ReadonlyArray<readonly [number, number]>,
  selectedCount: number,
  fallbackPrice: number
) {
  if (entries.length === 0) return fallbackPrice;

  const exact = entries.find(([count]) => count === selectedCount);
  if (exact) return exact[1];
  if (selectedCount <= entries[0][0]) return entries[0][1];
  if (selectedCount >= entries[entries.length - 1][0]) {
    return entries[entries.length - 1][1];
  }

  const upperIndex = entries.findIndex(([count]) => count > selectedCount);
  const lower = entries[upperIndex - 1];
  const upper = entries[upperIndex];
  const progress = (selectedCount - lower[0]) / (upper[0] - lower[0]);

  return Math.round(lower[1] + (upper[1] - lower[1]) * progress);
}

function calculateRackDimensions({
  profile,
  lengthMm,
  widthMm,
  heightMm,
  shelfCount,
  towerCount
}: {
  profile: CalculatorProfile;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  shelfCount: number;
  towerCount: number;
}) {
  const model = profile.rackDimensionModel;
  if (!model || model.kind !== "excel-automatic-sheet") {
    return {
      rackDimensionStatus: "engineering-check" as const
    };
  }

  return {
    rackDimensionStatus: "calculated" as const,
    rackLengthMm: model.lengthReserveMm + lengthMm,
    rackWidthMm: model.widthReserveMm + model.widthMultiplier * widthMm,
    rackHeightMm:
      model.baseHeightMm +
      shelfCount * (heightMm + model.shelfConstructionHeightMm) +
      model.towerHeightReserveMm * towerCount
  };
}

function nearestAllowed(value: number, allowed: readonly number[]) {
  if (allowed.length === 0) return value;
  if (!Number.isFinite(value)) return allowed[0];

  return allowed.reduce((nearest, candidate) => {
    const candidateDistance = Math.abs(candidate - value);
    const nearestDistance = Math.abs(nearest - value);

    if (candidateDistance < nearestDistance) return candidate;
    if (candidateDistance === nearestDistance && candidate < nearest) return candidate;
    return nearest;
  }, allowed[0]);
}

export function calculateStorageSystem(
  input: CalculatorInput,
  profileOverride?: CalculatorProfile
): CalculatorResult {
  const profile = profileOverride ?? getCalculatorProfile(input.systemId);
  const heightMm = nearestAllowed(input.heightMm, profile.heightOptions.map((option) => option.value));
  const widthMm = nearestAllowed(input.widthMm, profile.widthOptions.map((option) => option.value));
  const lengthMm = nearestAllowed(input.lengthMm, profile.lengthOptions.map((option) => option.value));
  const loadKg = nearestAllowed(input.loadKg, profile.loadOptions.map((option) => option.value));
  const shelfCount = nearestAllowed(input.shelfCount, profile.shelfCountOptions);
  let rolloutShelfCount = nearestAllowed(input.rolloutShelfCount, profile.rolloutShelfCountOptions ?? profile.shelfCountOptions);
  const towerCount = nearestAllowed(input.towerCount, profile.towerCountOptions);

  if (
    profile.pricing.kind === "hybrid" &&
    profile.maxCombinedShelfCount &&
    shelfCount + rolloutShelfCount > profile.maxCombinedShelfCount
  ) {
    const rolloutOptions = profile.rolloutShelfCountOptions ?? profile.shelfCountOptions;
    rolloutShelfCount =
      [...rolloutOptions].reverse().find((value) => value + shelfCount <= profile.maxCombinedShelfCount!) ??
      rolloutOptions[0];
  }

  const heightFactor = findFactor(profile.heightOptions, heightMm);
  const widthFactor = findFactor(profile.widthOptions, widthMm);
  const lengthFactor = findFactor(profile.lengthOptions, lengthMm);
  const dimensionFactor = heightFactor * widthFactor * lengthFactor;
  const selectedOptions = profile.options.filter((option) => input.optionIds.includes(option.id));
  const lineItems: Array<{ label: string; amount: number }> = [];
  let loadFactor = 1;
  let shelvesPerTowerFactor = 1;

  if (profile.pricing.kind === "automatic") {
    const shelfPriceByLoad = findPrice(profile.loadOptions, loadKg);
    const shelfUnit = shelfPriceByLoad * dimensionFactor;
    const shelvesPrice = shelfUnit * shelfCount * towerCount;
    const towerPriceEntries = Object.entries(
      profile.pricing.towerPricesByShelfCount
    )
      .map(([count, price]) => [Number(count), price] as const)
      .filter(
        ([count, price]) =>
          Number.isFinite(count) &&
          count > 0 &&
          Number.isFinite(price) &&
          price > 0
      )
      .sort(([left], [right]) => left - right);
    const defaultTowerPrice =
      profile.pricing.towerPricesByShelfCount[10] ??
      towerPriceEntries[0]?.[1] ??
      0;
    const selectedTowerPrice = interpolateTierPrice(
      towerPriceEntries,
      shelfCount,
      defaultTowerPrice
    );
    const towerPrice = selectedTowerPrice * towerCount;
    const consolePrice =
      profile.pricing.consoleBasePrice *
      (shelfPriceByLoad / profile.loadOptions[0].price) *
      (lengthMm > (profile.pricing.consoleLongFromMm ?? 3100)
        ? profile.pricing.consoleLongFactor
        : 1);

    loadFactor = shelfPriceByLoad / profile.loadOptions[0].price;
    shelvesPerTowerFactor =
      towerCount > 0 && defaultTowerPrice > 0
        ? towerPrice / towerCount / defaultTowerPrice
        : 1;

    lineItems.push(
      { label: "Полки по выбранным размерам и нагрузке", amount: shelvesPrice },
      { label: "Башни автоматизированного склада", amount: towerPrice },
      { label: "Подъемный модуль / консоль", amount: consolePrice }
    );
  }

  if (profile.pricing.kind === "forkliftCassette") {
    const shelfPriceByLoad = findPrice(profile.loadOptions, loadKg);
    const shelfUnit = shelfPriceByLoad * dimensionFactor;
    const towerFactor = progressiveFactor(shelfCount, profile.pricing.towerBaseShelfCount, profile.pricing.towerExtraShelfFactor);
    const towerPrice = profile.pricing.towerBasePrice * towerFactor * towerCount;
    const shelvesPrice = shelfUnit * shelfCount * towerCount;

    loadFactor = shelfPriceByLoad / profile.loadOptions[0].price;
    shelvesPerTowerFactor = towerFactor;

    lineItems.push(
      { label: "Кассеты под обслуживание погрузчиком", amount: shelvesPrice },
      { label: "Несущие башни кассетного стеллажа", amount: towerPrice }
    );
  }

  if (profile.pricing.kind === "rollout") {
    const shelfPriceByLoad = findPrice(profile.loadOptions, loadKg);
    const shelfUnit = shelfPriceByLoad * dimensionFactor;
    const towerFactor = progressiveFactor(shelfCount, profile.pricing.baseShelfCount, profile.pricing.extraShelfFactor);
    const gateMultiplier = input.rolloutSide === "two" ? 2 : 1;
    const towerPrice =
      (profile.pricing.towerBasePrice * towerFactor + profile.pricing.gateBasePrice * towerFactor * gateMultiplier) * towerCount;
    const shelvesPrice = shelfUnit * shelfCount * towerCount;

    loadFactor = shelfPriceByLoad / profile.loadOptions[0].price;
    shelvesPerTowerFactor = towerFactor;

    lineItems.push(
      { label: "Выкатные полки / кассеты", amount: shelvesPrice },
      { label: gateMultiplier === 2 ? "Башни и двухсторонние распашные ворота" : "Башни и распашные ворота", amount: towerPrice }
    );
  }

  if (profile.pricing.kind === "hybrid") {
    const forkliftShelfPrice = findPrice(profile.pricing.forkliftLoadOptions, loadKg);
    const rolloutShelfPrice = findPrice(profile.pricing.rolloutLoadOptions, loadKg);
    const forkliftShelvesPrice = forkliftShelfPrice * dimensionFactor * shelfCount * towerCount;
    const rolloutShelvesPrice = rolloutShelfPrice * dimensionFactor * rolloutShelfCount * towerCount;
    const totalShelfCount = shelfCount + rolloutShelfCount;
    const towerFactor = progressiveFactor(totalShelfCount, profile.pricing.baseShelfCount, profile.pricing.extraShelfFactor);
    const gateFactor = progressiveFactor(rolloutShelfCount, profile.pricing.baseShelfCount, profile.pricing.extraShelfFactor);
    const towerPrice =
      (
        profile.pricing.towerBasePrice * towerFactor +
        profile.pricing.gateBasePrice * gateFactor
      ) * towerCount;

    loadFactor = forkliftShelfPrice / profile.pricing.forkliftLoadOptions[0].price;
    shelvesPerTowerFactor = towerFactor;

    lineItems.push(
      { label: "Полки под погрузчик в гибридной системе", amount: forkliftShelvesPrice },
      { label: "Выкатные кассеты в гибридной системе", amount: rolloutShelvesPrice },
      { label: "Башни и ворота гибридного стеллажа", amount: towerPrice }
    );
  }

  selectedOptions.forEach((option) => {
    lineItems.push({
      label: calculatorOptionPresentation[option.id]?.title ?? option.title,
      amount: option.price
    });
  });

  const preliminaryPrice = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const totalStoredWeightKg =
    profile.pricing.kind === "hybrid"
      ? loadKg * (shelfCount + rolloutShelfCount) * towerCount
      : loadKg * shelfCount * towerCount;
  const hasVerifiedLoadDistribution = Boolean(profile.rackDimensionModel);
  const rackWeightWithoutLoadKg = hasVerifiedLoadDistribution
    ? (3500 + 300 * shelfCount) * towerCount
    : undefined;
  const rackWeightWithLoadKg =
    rackWeightWithoutLoadKg === undefined
      ? undefined
      : rackWeightWithoutLoadKg + totalStoredWeightKg;
  const supportLoadKg = hasVerifiedLoadDistribution
    ? Math.round((3500 + 300 * shelfCount + loadKg * shelfCount) / 4)
    : undefined;
  const rackDimensions = calculateRackDimensions({
    profile,
    lengthMm,
    widthMm,
    heightMm,
    shelfCount,
    towerCount
  });
  const workingCellDimensionsLabel = formatDimensions(lengthMm, widthMm, heightMm);
  const rackDimensionsLabel =
    rackDimensions.rackDimensionStatus === "calculated"
      ? formatDimensions(
          rackDimensions.rackLengthMm,
          rackDimensions.rackWidthMm,
          rackDimensions.rackHeightMm
        )
      : "Уточняется после компоновки объекта";

  const recommendation: RecommendedConfig = {
    productType: profile.productType,
    title: profile.title,
    rationale: [
      profile.description,
      "Расчет сделан по фиксированным ходовым вариантам: длина, ширина, высота, нагрузка, количество полок, башен и опций."
    ],
    keyParameters: [
      `Рабочая ячейка: ${workingCellDimensionsLabel}`,
      rackDimensions.rackDimensionStatus === "calculated"
        ? `Ориентировочный габарит системы: ${rackDimensionsLabel}`
        : "Габарит системы: уточнит инженер после компоновки объекта",
      `Нагрузка на ${loadTargetLabel(profile)}: ${loadKg} кг`,
      `Полки: ${shelfCount}`,
      `Башни: ${towerCount}`
    ],
    engineerQuestions: [
      "Проверить фактические размеры помещения, проходы и зоны обслуживания.",
      "Уточнить способ загрузки: погрузчик, кран-балка или ручная подача.",
      "Проверить запас по нагрузке, основание пола и необходимость дополнительных опций."
    ]
  };

  return {
    recommendation,
    preliminaryPrice,
    fromPrice: preliminaryPrice,
    profileId: profile.id,
    sourceSheet: profile.sourceSheet,
    selectedOptions: selectedOptions.map(
      (option) => calculatorOptionPresentation[option.id]?.title ?? option.title
    ),
    engineeringSummary: {
      dimensionsLabel: `${lengthMm}×${widthMm}×${heightMm} мм`,
      workingCellDimensionsLabel,
      rackDimensionsLabel,
      ...rackDimensions,
      loadDistributionStatus: hasVerifiedLoadDistribution
        ? "calculated"
        : "engineering-check",
      totalStoredWeightKg,
      rackWeightWithoutLoadKg,
      rackWeightWithLoadKg,
      supportLoadKg
    },
    factors: { heightFactor, widthFactor, lengthFactor, loadFactor, shelvesPerTowerFactor, dimensionFactor },
    lineItems: lineItems
      .filter((item) => item.amount > 0)
      .map((item) => ({ ...item, amount: roundMoney(item.amount) }))
  };
}
