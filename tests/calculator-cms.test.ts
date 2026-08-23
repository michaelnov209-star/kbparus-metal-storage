import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => null)
}));

import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";
import { toCalculatorProfileSeed } from "@/lib/calculator/profile-seed";
import { mergeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";
import type { RuntimeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";
import { resolvePublishedCalculatorProfiles } from "@/lib/cms/calculator-profiles";
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
  it("maps a valid non-canonical published profile and calculates without a shelf-count 10 anchor", () => {
    const customDoc = {
      id: 101,
      slug: "custom-sheet-storage",
      kind: "automatic",
      title: "Специальная система хранения листа",
      shortTitle: "Система Custom",
      description: "Профиль, полностью созданный в CMS.",
      bestFor: "нестандартных производственных задач.",
      iconKey: "automation",
      sortOrder: 90,
      image: null,
      heightOptions: [{ value: 100, factor: 1 }],
      widthOptions: [{ value: 1500, factor: 1 }],
      lengthOptions: [{ value: 4000, factor: 1.2 }],
      loadOptions: [{ value: 2000, price: 80_000 }],
      shelfCountOptions: [{ value: 12 }],
      towerCountOptions: [{ value: 1 }, { value: 2 }],
      towerByShelfCount: [{ shelfCount: 12, price: 1_250_000 }],
      consoleBasePrice: 500_000,
      consoleLongFactor: 1.1,
      consoleLongFromMm: 4_000,
      options: [
        {
          optionId: "custom-option",
          title: "Проверенная опция",
          price: 25_000,
          defaultSelected: true
        }
      ],
      defaultValues: {
        heightMm: 100,
        widthMm: 1500,
        lengthMm: 4000,
        loadKg: 2000,
        shelfCount: 12,
        towerCount: 1
      },
      createdAt: "2026-07-30T00:00:00.000Z",
      updatedAt: "2026-07-30T00:00:00.000Z",
      _status: "published"
    } as unknown as RuntimeCmsCalculatorProfile;

    const profiles = resolvePublishedCalculatorProfiles([customDoc]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({
      id: "custom-sheet-storage",
      title: "Специальная система хранения листа",
      bestFor: "нестандартных производственных задач.",
      iconKey: "automation"
    });

    const input = normalizeCalculatorInput(
      { systemId: "custom-sheet-storage" },
      profiles[0]
    );
    const result = calculateStorageSystem(input, profiles[0]);
    expect(result.profileId).toBe("custom-sheet-storage");
    expect(result.preliminaryPrice).toBeGreaterThan(0);
    expect(Number.isFinite(result.preliminaryPrice)).toBe(true);
    expect(Number.isFinite(result.factors.shelvesPerTowerFactor)).toBe(true);
  });

  it("isolates one invalid custom profile instead of taking published profiles offline", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const validCanonical = cmsDocFromRuntime(calculatorProfiles[0], 0);
    const invalidCustom = {
      ...validCanonical,
      id: 404,
      slug: "broken-custom-profile",
      title: "Неполный профиль",
      heightOptions: []
    } as unknown as RuntimeCmsCalculatorProfile;

    const profiles = resolvePublishedCalculatorProfiles([
      invalidCustom,
      validCanonical
    ]);

    expect(profiles.map((profile) => profile.id)).toEqual([
      "auto-sheet-metal"
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("broken-custom-profile")
    );
    warn.mockRestore();
  });

  it("does not resurrect an unpublished profile from the static seed", () => {
    const published = cmsDocFromRuntime(calculatorProfiles[1], 1);
    const profiles = resolvePublishedCalculatorProfiles([published]);

    expect(profiles.map((profile) => profile.id)).toEqual([
      calculatorProfiles[1].id
    ]);
    expect(
      profiles.some((profile) => profile.id === calculatorProfiles[0].id)
    ).toBe(false);
  });

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

  it("uses the published CMS profile image and accessible description at runtime", () => {
    const profile = calculatorProfiles[0];
    const merged = mergeCmsCalculatorProfile(
      {
        ...cmsDocFromRuntime(profile, 0),
        image: {
          id: 42,
          publiclyAvailable: true,
          alt: "Автоматизированный склад в производственном цехе",
          url: "https://assets.example.com/calculator/automatic-storage.webp",
          createdAt: "2026-07-29T00:00:00.000Z",
          updatedAt: "2026-07-29T00:00:00.000Z"
        }
      },
      profile
    );

    expect(merged.image).toBe(
      "https://assets.example.com/calculator/automatic-storage.webp"
    );
    expect(merged.imageAlt).toBe(
      "Автоматизированный склад в производственном цехе"
    );
  });

  it("keeps the verified image fallback when CMS media is absent or unresolved", () => {
    const profile = calculatorProfiles[0];

    expect(
      mergeCmsCalculatorProfile(
        { ...cmsDocFromRuntime(profile, 0), image: null },
        profile
      )
    ).toMatchObject({
      image: profile.image,
      imageAlt: profile.imageAlt
    });

    expect(
      mergeCmsCalculatorProfile(
        { ...cmsDocFromRuntime(profile, 0), image: 42 },
        profile
      )
    ).toMatchObject({
      image: profile.image,
      imageAlt: profile.imageAlt
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
