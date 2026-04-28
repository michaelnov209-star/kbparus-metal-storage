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

export function calculateStorageSystem(input: CalculatorInput): CalculatorResult {
  const recommendation = recommendStorageSystem(input);
  const heightFactor = nearestFactor(priceFactors.height, input.heightMm);
  const widthFactor = nearestFactor(priceFactors.width, input.widthMm);
  const lengthFactor = nearestFactor(priceFactors.length, input.lengthMm);
  const loadTable = recommendation.productType === "rollout" || recommendation.productType === "hybrid" ? priceFactors.rolloutLoad : priceFactors.load;
  const loadFactor = nearestFactor(loadTable, input.loadKg);
  const shelvesPerTowerFactor = nearestFactor(priceFactors.shelvesPerTower, input.shelfCount);
  const dimensionFactor = heightFactor * widthFactor * lengthFactor;
  const base = priceFactors.basePrices;

  const shelfBase =
    recommendation.productType === "cassette"
      ? base.forkliftShelf
      : recommendation.productType === "rollout" || recommendation.productType === "hybrid"
        ? base.rolloutShelf
        : base.automaticShelf;
  const towerBase =
    recommendation.productType === "cassette"
      ? base.forkliftTower
      : recommendation.productType === "rollout" || recommendation.productType === "hybrid"
        ? base.rolloutTower
        : base.automaticTower;

  const shelfPrice = shelfBase * dimensionFactor * loadFactor * Math.max(input.shelfCount, 1);
  const towerPrice = towerBase * shelvesPerTowerFactor * Math.max(input.towerCount, 1);
  const longShelfFactor = input.lengthMm > priceFactors.longShelfFactor.thresholdMm ? priceFactors.longShelfFactor.factor : 1;
  const cassettePrice = input.needsRolloutCassettes || input.cassetteCount > 0
    ? base.rolloutShelf * Math.max(input.cassetteCount, 1) * dimensionFactor * loadFactor
    : 0;
  const automationPrice = input.execution === "automatic" ? base.automaticConsole * loadFactor * longShelfFactor : 0;
  const mountingPrice = input.needsMounting ? base.mounting : 0;
  const deliveryPrice = input.needsDelivery ? base.deliveryBase + Math.min(input.lengthMm * 12, 120000) : 0;
  const paintingPrice = input.needsPainting ? base.painting : 0;
  const outdoorPrice = input.facility === "outdoor" ? base.outdoorExecution : 0;
  const integrationPrice = input.execution === "automatic" ? base.integration : 0;

  const lineItems = [
    { label: "Полки / кассеты с учётом габаритов и нагрузки", amount: shelfPrice },
    { label: "Башни / несущая конструкция", amount: towerPrice },
    { label: "Выкатные кассеты", amount: cassettePrice },
    { label: "Автоматизация и подъёмный модуль", amount: automationPrice },
    { label: "Монтаж", amount: mountingPrice },
    { label: "Доставка", amount: deliveryPrice },
    { label: "Промышленная окраска", amount: paintingPrice },
    { label: "Уличное исполнение", amount: outdoorPrice },
    { label: "Интеграция с учётом", amount: integrationPrice }
  ].filter((item) => item.amount > 0);

  const preliminaryPrice = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    recommendation,
    preliminaryPrice: roundMoney(preliminaryPrice),
    priceRange: {
      min: roundMoney(preliminaryPrice * priceFactors.range.low),
      max: roundMoney(preliminaryPrice * priceFactors.range.high)
    },
    factors: { heightFactor, widthFactor, lengthFactor, loadFactor, shelvesPerTowerFactor, dimensionFactor },
    lineItems: lineItems.map((item) => ({ ...item, amount: roundMoney(item.amount) }))
  };
}
