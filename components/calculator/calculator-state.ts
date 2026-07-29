import {
  getCalculatorProfile,
  type CalculatorProfile,
  type CalculatorProfileId
} from "@/data/storageSystems/excelCalculator";
import { normalizeCalculatorInput } from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";

function includesValue(
  options: readonly { value: number }[] | readonly number[],
  value: number
) {
  return options.some((option) =>
    typeof option === "number" ? option === value : option.value === value
  );
}

export function buildInputForProfile(
  profileId: CalculatorProfileId,
  profiles: readonly CalculatorProfile[]
): CalculatorInput {
  const profile = getCalculatorProfile(profileId, profiles);
  const defaults = profile.defaultValues;

  return normalizeCalculatorInput(
    {
      systemId: profile.id,
      heightMm: defaults.heightMm,
      widthMm: defaults.widthMm,
      lengthMm: defaults.lengthMm,
      materialLengthMm: defaults.lengthMm,
      sheetWidthMm: defaults.widthMm,
      loadKg: defaults.loadKg,
      totalStorageWeightKg:
        defaults.loadKg * defaults.shelfCount * defaults.towerCount,
      desiredCapacity: defaults.shelfCount,
      shelfCount: defaults.shelfCount,
      rolloutShelfCount:
        defaults.rolloutShelfCount ?? defaults.shelfCount,
      cassetteCount: defaults.rolloutShelfCount ?? defaults.shelfCount,
      towerCount: defaults.towerCount,
      rolloutSide: defaults.rolloutSide ?? "one",
      optionIds: profile.options
        .filter((option) => option.defaultSelected)
        .map((option) => option.id),
      execution: profile.productType === "automated" ? "automatic" : "manual",
      needsRolloutCassettes:
        profile.productType === "rollout" || profile.productType === "hybrid",
      city: "",
      comment: ""
    },
    profile
  );
}

/**
 * Переключает тип системы без потери уже введённых данных.
 * Значение переносится только если новый профиль действительно его поддерживает;
 * иначе используется проверенное значение по умолчанию нового профиля.
 */
export function reconcileInputForProfile(
  current: CalculatorInput,
  profileId: CalculatorProfileId,
  profiles: readonly CalculatorProfile[]
): CalculatorInput {
  const profile = getCalculatorProfile(profileId, profiles);
  const next = buildInputForProfile(profileId, profiles);
  const lengthMm = includesValue(profile.lengthOptions, current.lengthMm)
    ? current.lengthMm
    : next.lengthMm;
  const widthMm = includesValue(profile.widthOptions, current.widthMm)
    ? current.widthMm
    : next.widthMm;
  const heightMm = includesValue(profile.heightOptions, current.heightMm)
    ? current.heightMm
    : next.heightMm;
  const loadKg = includesValue(profile.loadOptions, current.loadKg)
    ? current.loadKg
    : next.loadKg;
  const shelfCount = includesValue(
    profile.shelfCountOptions,
    current.shelfCount
  )
    ? current.shelfCount
    : next.shelfCount;
  const rolloutOptions =
    profile.rolloutShelfCountOptions ?? profile.shelfCountOptions;
  const rolloutShelfCount = includesValue(
    rolloutOptions,
    current.rolloutShelfCount
  )
    ? current.rolloutShelfCount
    : next.rolloutShelfCount;
  const towerCount = includesValue(
    profile.towerCountOptions,
    current.towerCount
  )
    ? current.towerCount
    : next.towerCount;
  const allowedOptionIds = new Set(
    profile.options.map((option) => option.id)
  );
  const optionIds = current.optionIds.filter((id) =>
    allowedOptionIds.has(id)
  );
  const supportedSides =
    profile.pricing.kind === "rollout" && profile.pricing.sides
      ? new Set(profile.pricing.sides.map((side) => side.value))
      : null;
  const rolloutSide =
    supportedSides?.has(current.rolloutSide) || !supportedSides
      ? current.rolloutSide
      : next.rolloutSide;

  return normalizeCalculatorInput(
    {
      ...next,
      material: current.material,
      unitWeightKg: current.unitWeightKg,
      loadingMethod: current.loadingMethod,
      facility: current.facility,
      needsPainting: current.needsPainting,
      needsMounting: current.needsMounting,
      needsDelivery: current.needsDelivery,
      lengthMm,
      materialLengthMm: lengthMm,
      widthMm,
      sheetWidthMm: widthMm,
      heightMm,
      depthMm: heightMm,
      loadKg,
      shelfCount,
      desiredCapacity: shelfCount,
      rolloutShelfCount,
      cassetteCount: rolloutShelfCount,
      towerCount,
      totalStorageWeightKg: loadKg * shelfCount * towerCount,
      rolloutSide,
      optionIds,
      city: current.city,
      comment: current.comment ?? ""
    },
    profile
  );
}
