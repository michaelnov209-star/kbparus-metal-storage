import { priceFactors } from "@/data/storageSystems/priceFactors";
import type { CalculatorInput, CalculatorResult } from "./types";
import { recommendStorageSystem } from "./recommendation";

function nearestFactor(points: readonly { value: number; factor: number }[], value: number) {
  const sorted = [...points].sort((a, b) => a.value - b.value);
  return sorted.find((point) => value <= point.value)?.factor ?? sorted[sorted.length - 1].factor;
}

function roundMoney(value: number) {
  return Math.round(value / 1000) * 1000;
}

function towerQuantityFactor(count: number) {
  const safeCount = Math.max(count, 1);
  return safeCount > 5 ? 1 + (safeCount - 5) * 0.1 : 1;
}

function optionLineItems(input: CalculatorInput) {
  const base = priceFactors.basePrices;

  return [
    { label: "Монтаж на объекте", amount: input.needsMounting ? base.mounting : 0 },
    { label: "Доставка", amount: input.needsDelivery ? base.deliveryBase + Math.min(input.lengthMm * 12, 120000) : 0 },
    { label: "Промышленная окраска", amount: input.needsPainting ? base.painting : 0 },
    { label: "Уличное исполнение", amount: input.facility === "outdoor" ? base.outdoorExecution : 0 },
    { label: "Подготовка к передаче расчёта в CRM / 1С / WMS", amount: input.execution === "automatic" ? base.integration : 0 }
  ].filter((item) => item.amount > 0);
}

export function calculateStorageSystem(input: CalculatorInput): CalculatorResult {
  const recommendation = recommendStorageSystem(input);
  const heightFactor = nearestFactor(priceFactors.height, input.heightMm);
  const widthFactor = nearestFactor(priceFactors.width, input.widthMm);
  const lengthFactor = nearestFactor(priceFactors.length, input.lengthMm);
  const loadTable = recommendation.productType === "rollout" || recommendation.productType === "hybrid" ? priceFactors.rolloutLoad : priceFactors.load;
  const loadFactor = nearestFactor(loadTable, input.loadKg);
  const shelvesPerTowerFactor = nearestFactor(priceFactors.shelvesPerTower, input.shelfCount);
  const dimensionFactor = heightFactor * widthFactor * lengthFactor;
  const towerCount = Math.max(input.towerCount, 1);
  const shelfCount = Math.max(input.shelfCount, 1);
  const cassetteCount = Math.max(input.cassetteCount, input.needsRolloutCassettes ? 1 : 0);
  const longShelfFactor = input.lengthMm > priceFactors.longShelfFactor.thresholdMm ? priceFactors.longShelfFactor.factor : 1;
  const base = priceFactors.basePrices;

  const lineItems: Array<{ label: string; amount: number }> = [];

  if (recommendation.productType === "automated") {
    const shelfUnit = base.automaticShelf * loadFactor * dimensionFactor;
    const shelfBlock = shelfUnit * shelfCount;
    const towerBlock = base.automaticTower * shelvesPerTowerFactor;
    const liftModule = input.execution === "automatic" ? base.automaticConsole * loadFactor * longShelfFactor : 0;

    lineItems.push(
      { label: "Полки автоматизированной башни по габаритам и нагрузке", amount: shelfBlock * towerCount },
      { label: "Башни автоматизированного склада", amount: towerBlock * towerCount },
      { label: "Подъёмный модуль и автоматика", amount: liftModule }
    );
  } else if (recommendation.productType === "cassette") {
    const shelfUnit = base.forkliftShelf * loadFactor * dimensionFactor;
    const shelfBlock = shelfUnit * shelfCount;
    const towerBlock = base.forkliftTower * towerQuantityFactor(towerCount);

    lineItems.push(
      { label: "Кассеты под обслуживание погрузчиком", amount: shelfBlock * towerCount },
      { label: "Несущие башни кассетного стеллажа", amount: towerBlock * towerCount }
    );
  } else if (recommendation.productType === "hybrid") {
    const rolloutUnit = base.rolloutShelf * nearestFactor(priceFactors.rolloutLoad, input.loadKg) * dimensionFactor;
    const forkliftUnit = base.forkliftShelf * nearestFactor(priceFactors.load, input.loadKg) * dimensionFactor;
    const rolloutBlock = rolloutUnit * Math.max(cassetteCount, 1);
    const forkliftBlock = forkliftUnit * shelfCount;
    const towerAndGateBlock = (base.rolloutTower + base.gate) * towerQuantityFactor(towerCount);

    lineItems.push(
      { label: "Выкатные кассеты гибридной системы", amount: rolloutBlock * towerCount },
      { label: "Кассеты под погрузчик в гибридной системе", amount: forkliftBlock * towerCount },
      { label: "Башни и ворота гибридного стеллажа", amount: towerAndGateBlock * towerCount }
    );
  } else {
    const shelfUnit = base.rolloutShelf * loadFactor * dimensionFactor;
    const shelfBlock = shelfUnit * Math.max(cassetteCount, shelfCount);
    const towerAndGateBlock = (base.rolloutTower + base.gate) * towerQuantityFactor(towerCount);

    lineItems.push(
      { label: "Выкатные кассеты по габаритам и нагрузке", amount: shelfBlock * towerCount },
      { label: "Башни и ворота стеллажа с выкатными кассетами", amount: towerAndGateBlock * towerCount }
    );
  }

  lineItems.push(...optionLineItems(input));
  const preliminaryPrice = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const fromPrice = roundMoney(preliminaryPrice);

  return {
    recommendation,
    preliminaryPrice: fromPrice,
    fromPrice,
    factors: { heightFactor, widthFactor, lengthFactor, loadFactor, shelvesPerTowerFactor, dimensionFactor },
    lineItems: lineItems.filter((item) => item.amount > 0).map((item) => ({ ...item, amount: roundMoney(item.amount) }))
  };
}
