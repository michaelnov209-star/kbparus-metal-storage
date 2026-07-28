import type { CalculatorInput } from "./types";
import { defaultCalculatorProfileId, getCalculatorProfile, type CalculatorProfile } from "@/data/storageSystems/excelCalculator";

export function normalizeCalculatorInput(
  input: Partial<CalculatorInput>,
  profileOverride?: CalculatorProfile
): CalculatorInput {
  const profile = profileOverride ?? getCalculatorProfile(input.systemId ?? defaultCalculatorProfileId);
  const defaults = profile.defaultValues;
  const optionIds = input.optionIds ?? profile.options.filter((option) => option.defaultSelected).map((option) => option.id);
  const shelfCount = Number(input.shelfCount ?? defaults.shelfCount);
  let rolloutShelfCount = Number(input.rolloutShelfCount ?? defaults.rolloutShelfCount ?? defaults.shelfCount);

  if (profile.pricing.kind === "hybrid" && profile.maxCombinedShelfCount && shelfCount + rolloutShelfCount > profile.maxCombinedShelfCount) {
    const rolloutOptions = profile.rolloutShelfCountOptions ?? profile.shelfCountOptions;
    rolloutShelfCount =
      [...rolloutOptions].reverse().find((value) => value + shelfCount <= profile.maxCombinedShelfCount!) ??
      rolloutOptions[0];
  }

  return {
    systemId: profile.id,
    material: input.material ?? "sheet",
    materialLengthMm: Number(input.materialLengthMm ?? defaults.lengthMm),
    sheetWidthMm: Number(input.sheetWidthMm ?? defaults.widthMm),
    unitWeightKg: Number(input.unitWeightKg ?? 120),
    totalStorageWeightKg: Number(input.totalStorageWeightKg ?? defaults.loadKg * defaults.shelfCount * defaults.towerCount),
    loadingMethod: input.loadingMethod ?? "crane",
    facility: input.facility ?? "workshop",
    desiredCapacity: Number(input.desiredCapacity ?? defaults.shelfCount),
    needsRolloutCassettes: Boolean(input.needsRolloutCassettes),
    needsPainting: Boolean(input.needsPainting),
    needsMounting: Boolean(input.needsMounting),
    needsDelivery: Boolean(input.needsDelivery),
    city: input.city ?? "",
    heightMm: Number(input.heightMm ?? defaults.heightMm),
    widthMm: Number(input.widthMm ?? defaults.widthMm),
    depthMm: Number(input.depthMm ?? defaults.heightMm),
    lengthMm: Number(input.lengthMm ?? defaults.lengthMm),
    loadKg: Number(input.loadKg ?? defaults.loadKg),
    towerCount: Number(input.towerCount ?? defaults.towerCount),
    shelfCount,
    rolloutShelfCount,
    rolloutSide: input.rolloutSide ?? defaults.rolloutSide ?? "one",
    cassetteCount: Number(input.cassetteCount ?? rolloutShelfCount),
    execution: input.execution ?? "manual",
    optionIds,
    comment: input.comment ?? ""
  };
}
