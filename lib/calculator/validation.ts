import type { CalculatorInput } from "./types";

export function normalizeCalculatorInput(input: Partial<CalculatorInput>): CalculatorInput {
  return {
    material: input.material ?? "sheet",
    materialLengthMm: Number(input.materialLengthMm ?? 3100),
    sheetWidthMm: Number(input.sheetWidthMm ?? 1600),
    unitWeightKg: Number(input.unitWeightKg ?? 120),
    totalStorageWeightKg: Number(input.totalStorageWeightKg ?? 8000),
    loadingMethod: input.loadingMethod ?? "crane",
    facility: input.facility ?? "workshop",
    desiredCapacity: Number(input.desiredCapacity ?? 10),
    needsRolloutCassettes: Boolean(input.needsRolloutCassettes),
    needsPainting: Boolean(input.needsPainting),
    needsMounting: Boolean(input.needsMounting),
    needsDelivery: Boolean(input.needsDelivery),
    city: input.city ?? "",
    heightMm: Number(input.heightMm ?? 150),
    widthMm: Number(input.widthMm ?? 1600),
    depthMm: Number(input.depthMm ?? 150),
    lengthMm: Number(input.lengthMm ?? 3100),
    loadKg: Number(input.loadKg ?? 2500),
    towerCount: Number(input.towerCount ?? 1),
    shelfCount: Number(input.shelfCount ?? 7),
    cassetteCount: Number(input.cassetteCount ?? 0),
    execution: input.execution ?? "manual",
    comment: input.comment ?? ""
  };
}
