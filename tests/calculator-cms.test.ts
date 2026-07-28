import { describe, expect, it } from "vitest";

import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";
import { toCalculatorProfileSeed } from "@/lib/calculator/profile-seed";
import { mergeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";
import { CalculatorProfiles } from "@/payload/collections/CalculatorProfiles";
import type { CalculatorProfile as CmsCalculatorProfile } from "@/payload-types";

type CalculatorProfileField = {
  name?: string;
  fields?: unknown[];
  tabs?: Array<{ fields?: unknown[] }>;
  defaultValue?: unknown;
  validate?: (
    value: unknown,
    options: { siblingData: Record<string, unknown> }
  ) => unknown;
};

function findCalculatorProfileField(
  fields: readonly unknown[],
  name: string
): CalculatorProfileField | undefined {
  for (const node of fields) {
    if (!node || typeof node !== "object") continue;
    const field = node as CalculatorProfileField;
    if (field.name === name) return field;

    const nestedFields = [
      ...(Array.isArray(field.fields) ? field.fields : []),
      ...(Array.isArray(field.tabs)
        ? field.tabs.flatMap((tab) => (Array.isArray(tab.fields) ? tab.fields : []))
        : [])
    ];
    const nestedMatch = findCalculatorProfileField(nestedFields, name);
    if (nestedMatch) return nestedMatch;
  }

  return undefined;
}

function cmsDocFromRuntime(profile: (typeof calculatorProfiles)[number], index: number): CmsCalculatorProfile {
  return {
    id: index + 1,
    ...toCalculatorProfileSeed(profile),
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z"
  } as CmsCalculatorProfile;
}

describe("CMS calculator profile parity", () => {
  const excelDefaultTotals = {
    "auto-sheet-metal": 7_408_000,
    "auto-sort-metal": 21_387_840,
    "rollout-cassette-rack": 1_783_819,
    "forklift-cassette-rack": 567_450,
    "two-side-rollout-rack": 890_155,
    "hybrid-rollout-rack": 1_516_679
  } as const;

  it.each(calculatorProfiles)(
    "$id keeps the rounded default total saved in the supplied Excel workbook",
    (profile) => {
      const input = normalizeCalculatorInput({ systemId: profile.id }, profile);

      expect(calculateStorageSystem(input, profile).preliminaryPrice).toBe(
        excelDefaultTotals[profile.id]
      );
    }
  );

  it.each(calculatorProfiles.map((profile, index) => [profile.id, profile, index] as const))(
    "%s keeps the current website result after seed and CMS normalization",
    (_profileId, profile, index) => {
      const merged = mergeCmsCalculatorProfile(cmsDocFromRuntime(profile, index), profile);
      const baselineInput = normalizeCalculatorInput({ systemId: profile.id }, profile);
      const cmsInput = normalizeCalculatorInput({ systemId: profile.id }, merged);

      expect(cmsInput).toEqual(baselineInput);
      expect(calculateStorageSystem(cmsInput, merged)).toEqual(
        calculateStorageSystem(baselineInput, profile)
      );
    }
  );

  it.each(calculatorProfiles.map((profile, index) => [profile.id, profile, index] as const))(
    "%s keeps the current result at the largest selectable configuration",
    (_profileId, profile, index) => {
      const merged = mergeCmsCalculatorProfile(cmsDocFromRuntime(profile, index), profile);
      const input = normalizeCalculatorInput(
        {
          systemId: profile.id,
          heightMm: profile.heightOptions.at(-1)?.value,
          widthMm: profile.widthOptions.at(-1)?.value,
          lengthMm: profile.lengthOptions.at(-1)?.value,
          loadKg: profile.loadOptions.at(-1)?.value,
          shelfCount: profile.shelfCountOptions.at(-1),
          rolloutShelfCount: profile.rolloutShelfCountOptions?.at(-1),
          towerCount: profile.towerCountOptions.at(-1),
          optionIds: profile.options.map((option) => option.id)
        },
        profile
      );

      expect(calculateStorageSystem(input, merged)).toEqual(
        calculateStorageSystem(input, profile)
      );
    }
  );
  it("stores the hybrid Excel tower and gate inputs separately in CMS", () => {
    const profile = calculatorProfiles.find((item) => item.id === "hybrid-rollout-rack");
    expect(profile).toBeDefined();

    const seed = toCalculatorProfileSeed(profile!);
    expect(seed).toMatchObject({
      towerBasePrice: 100000,
      gateBasePrice: 120000,
      baseShelfCount: 5,
      extraShelfFactor: 0.1,
      maxCombinedShelfCount: 25
    });

    const merged = mergeCmsCalculatorProfile(
      {
        ...cmsDocFromRuntime(profile!, 5),
        towerBasePrice: 110000,
        gateBasePrice: 130000,
        baseShelfCount: 5,
        extraShelfFactor: 0.2,
        maxCombinedShelfCount: 24
      },
      profile!
    );

    expect(merged.maxCombinedShelfCount).toBe(24);
    expect(merged.pricing).toMatchObject({
      kind: "hybrid",
      towerBasePrice: 110000,
      gateBasePrice: 130000,
      baseShelfCount: 5,
      extraShelfFactor: 0.2
    });
  });

  it("keeps each valid hybrid CMS value when another pricing field is missing", () => {
    const profile = calculatorProfiles.find((item) => item.id === "hybrid-rollout-rack");
    expect(profile).toBeDefined();

    const merged = mergeCmsCalculatorProfile(
      {
        ...cmsDocFromRuntime(profile!, 5),
        towerBasePrice: 115000,
        gateBasePrice: null,
        baseShelfCount: 6,
        extraShelfFactor: 0.15
      },
      profile!
    );

    expect(merged.pricing).toMatchObject({
      kind: "hybrid",
      towerBasePrice: 115000,
      gateBasePrice: 120000,
      baseShelfCount: 6,
      extraShelfFactor: 0.15
    });
  });

  it("requires every hybrid pricing input and exposes the combined-shelf limit in CMS", () => {
    const hybridFieldNames = [
      "towerBasePrice",
      "gateBasePrice",
      "baseShelfCount",
      "extraShelfFactor",
      "maxCombinedShelfCount"
    ];

    for (const fieldName of hybridFieldNames) {
      const field = findCalculatorProfileField(CalculatorProfiles.fields, fieldName);
      expect(field, `${fieldName} is missing from the CMS schema`).toBeDefined();
      expect(
        field?.validate?.(undefined, { siblingData: { kind: "hybrid" } })
      ).toEqual(expect.stringContaining("обязательно"));
      expect(
        field?.validate?.(undefined, { siblingData: { kind: "automatic" } })
      ).toBe(true);
    }

    expect(
      findCalculatorProfileField(CalculatorProfiles.fields, "maxCombinedShelfCount")
        ?.defaultValue
    ).toBe(25);
  });
});
