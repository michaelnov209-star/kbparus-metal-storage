import { getCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import type { FactorOption, PriceOption } from "@/data/storageSystems/excelCalculator";
import type { CalculatorInput, CalculatorResult, RecommendedConfig } from "./types";

function findFactor(options: readonly FactorOption[], value: number) {
  return options.find((option) => option.value === value)?.factor ?? options[0].factor;
}

function findPrice(options: readonly PriceOption[], value: number) {
  return options.find((option) => option.value === value)?.price ?? options[0].price;
}

function roundMoney(value: number) {
  return Math.round(value);
}

function progressiveFactor(count: number, baseCount: number, extraFactor: number) {
  return count > baseCount ? 1 + extraFactor * (count - baseCount) : 1;
}

function nearestAllowed(value: number, allowed: readonly number[]) {
  return allowed.includes(value) ? value : allowed[0];
}

export function calculateStorageSystem(input: CalculatorInput): CalculatorResult {
  const profile = getCalculatorProfile(input.systemId);
  const heightMm = nearestAllowed(input.heightMm, profile.heightOptions.map((option) => option.value));
  const widthMm = nearestAllowed(input.widthMm, profile.widthOptions.map((option) => option.value));
  const lengthMm = nearestAllowed(input.lengthMm, profile.lengthOptions.map((option) => option.value));
  const loadKg = nearestAllowed(input.loadKg, profile.loadOptions.map((option) => option.value));
  const shelfCount = nearestAllowed(input.shelfCount, profile.shelfCountOptions);
  const rolloutShelfCount = nearestAllowed(input.rolloutShelfCount, profile.rolloutShelfCountOptions ?? profile.shelfCountOptions);
  const towerCount = nearestAllowed(input.towerCount, profile.towerCountOptions);

  const heightFactor = findFactor(profile.heightOptions, heightMm);
  const widthFactor = findFactor(profile.widthOptions, widthMm);
  const lengthFactor = findFactor(profile.lengthOptions, lengthMm);
  const dimensionFactor = heightFactor * widthFactor * lengthFactor;
  const selectedOptions = profile.options.filter((option) => input.optionIds.includes(option.id));
  const optionsPrice = selectedOptions.reduce((sum, option) => sum + option.price, 0);
  const lineItems: Array<{ label: string; amount: number }> = [];
  let loadFactor = 1;
  let shelvesPerTowerFactor = 1;

  if (profile.pricing.kind === "automatic") {
    const shelfPriceByLoad = findPrice(profile.loadOptions, loadKg);
    const shelfUnit = shelfPriceByLoad * dimensionFactor;
    const shelvesPrice = shelfUnit * shelfCount * towerCount;
    const towerPrice = (profile.pricing.towerPricesByShelfCount[shelfCount] ?? profile.pricing.towerPricesByShelfCount[10]) * towerCount;
    const consolePrice =
      profile.pricing.consoleBasePrice *
      (shelfPriceByLoad / profile.loadOptions[0].price) *
      (lengthMm > 3100 ? profile.pricing.consoleLongFactor : 1);

    loadFactor = shelfPriceByLoad / profile.loadOptions[0].price;
    shelvesPerTowerFactor = towerPrice / towerCount / profile.pricing.towerPricesByShelfCount[10];

    lineItems.push(
      { label: "Полки по выбранным Д×Ш×В и нагрузке", amount: shelvesPrice },
      { label: "Башни автоматизированного склада", amount: towerPrice },
      { label: "Подъёмный модуль / консоль", amount: consolePrice }
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
      { label: gateMultiplier === 2 ? "Башни и двусторонние распашные ворота" : "Башни и распашные ворота", amount: towerPrice }
    );
  }

  if (profile.pricing.kind === "hybrid") {
    const forkliftShelfPrice = findPrice(profile.pricing.forkliftLoadOptions, loadKg);
    const rolloutShelfPrice = findPrice(profile.pricing.rolloutLoadOptions, loadKg);
    const forkliftShelvesPrice = forkliftShelfPrice * dimensionFactor * shelfCount * towerCount;
    const rolloutShelvesPrice = rolloutShelfPrice * dimensionFactor * rolloutShelfCount * towerCount;
    const towerPrice = profile.pricing.fixedTowerAndGatePrice * towerCount;

    loadFactor = forkliftShelfPrice / profile.pricing.forkliftLoadOptions[0].price;
    shelvesPerTowerFactor = 1;

    lineItems.push(
      { label: "Полки под погрузчик в гибридной системе", amount: forkliftShelvesPrice },
      { label: "Выкатные кассеты в гибридной системе", amount: rolloutShelvesPrice },
      { label: "Башни и ворота гибридного стеллажа", amount: towerPrice }
    );
  }

  selectedOptions.forEach((option) => {
    lineItems.push({ label: option.title, amount: option.price });
  });

  const preliminaryPrice = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const rackWeightWithoutLoadKg = profile.pricing.kind === "automatic" ? 3500 + 300 * shelfCount : 8500 + 100 * shelfCount;
  const totalStoredWeightKg =
    profile.pricing.kind === "hybrid"
      ? loadKg * (shelfCount + rolloutShelfCount) * towerCount
      : loadKg * shelfCount * towerCount;
  const rackWeightWithLoadKg = rackWeightWithoutLoadKg + totalStoredWeightKg;
  const supportLoadKg = Math.round(rackWeightWithLoadKg / 4);

  const recommendation: RecommendedConfig = {
    productType: profile.productType,
    title: profile.title,
    rationale: [
      profile.description,
      "Расчёт сделан по фиксированным вариантам из Excel: Д×Ш×В, нагрузка, количество полок, башен и опций."
    ],
    keyParameters: [
      `Д×Ш×В: ${lengthMm}×${widthMm}×${heightMm} мм`,
      `Нагрузка на полку: ${loadKg} кг`,
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
    selectedOptions: selectedOptions.map((option) => option.title),
    engineeringSummary: {
      dimensionsLabel: `${lengthMm}×${widthMm}×${heightMm} мм`,
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
