import { describe, expect, it } from "vitest";
import { calculateStorageSystem, formatRoundedRub, normalizeCalculatorInput } from "@/lib/calculator";
import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";

describe("Excel-based storage calculator", () => {
  it("matches the selected automated sheet metal Excel scenario", () => {
    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "auto-sheet-metal",
        heightMm: 70,
        widthMm: 1600,
        lengthMm: 3100,
        loadKg: 2000,
        shelfCount: 20,
        towerCount: 1,
        optionIds: ["scale", "infrared-safety", "vacuum-grip", "swing-crane"]
      })
    );

    expect(result.sourceSheet).toBe("Авт. скл. лист. металл");
    expect(result.fromPrice).toBe(7408000);
    expect(result.factors.dimensionFactor).toBeCloseTo(1.21);
    expect(result.engineeringSummary.supportLoadKg).toBe(12375);
  });

  it("matches the automated sort metal workbook scenario", () => {
    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "auto-sort-metal",
        heightMm: 400,
        widthMm: 400,
        lengthMm: 6100,
        loadKg: 3000,
        shelfCount: 8,
        towerCount: 4,
        optionIds: []
      })
    );

    expect(result.fromPrice).toBe(21387840);
    expect(result.factors.dimensionFactor).toBeCloseTo(2.662);
  });

  it("matches rollout cassette rack pricing from Excel", () => {
    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "rollout-cassette-rack",
        heightMm: 150,
        widthMm: 1600,
        lengthMm: 3100,
        loadKg: 3000,
        shelfCount: 7,
        towerCount: 1,
        optionIds: ["vacuum-grip", "swing-crane"]
      })
    );

    expect(result.fromPrice).toBe(1783819);
  });

  it("matches forklift cassette rack pricing from Excel", () => {
    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "forklift-cassette-rack",
        heightMm: 200,
        widthMm: 1600,
        lengthMm: 3100,
        loadKg: 2000,
        shelfCount: 10,
        towerCount: 1,
        optionIds: []
      })
    );

    expect(result.fromPrice).toBe(567450);
  });

  it("matches two-sided rollout rack pricing from Excel", () => {
    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "two-side-rollout-rack",
        heightMm: 150,
        widthMm: 1600,
        lengthMm: 3100,
        loadKg: 2000,
        shelfCount: 7,
        towerCount: 1,
        rolloutSide: "two",
        optionIds: []
      })
    );

    expect(result.fromPrice).toBe(890155);
  });

  it("matches hybrid rack pricing from Excel", () => {
    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "hybrid-rollout-rack",
        heightMm: 150,
        widthMm: 1600,
        lengthMm: 3100,
        loadKg: 2500,
        shelfCount: 7,
        rolloutShelfCount: 10,
        towerCount: 1,
        optionIds: []
      })
    );

    expect(result.fromPrice).toBe(1516679);
  });

  it("uses the Excel progressive tower and gate formula for non-default hybrid shelf counts", () => {
    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "hybrid-rollout-rack",
        heightMm: 150,
        widthMm: 1600,
        lengthMm: 3100,
        loadKg: 2500,
        shelfCount: 5,
        rolloutShelfCount: 5,
        towerCount: 1,
        optionIds: []
      })
    );

    expect(result.fromPrice).toBe(906611);
    expect(result.lineItems[2]?.amount).toBe(270000);
    expect(result.factors.shelvesPerTowerFactor).toBeCloseTo(1.5);
  });

  it("limits a hybrid rack to 25 combined shelves before pricing", () => {
    const input = normalizeCalculatorInput({
      systemId: "hybrid-rollout-rack",
      heightMm: 150,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2500,
      shelfCount: 20,
      rolloutShelfCount: 10,
      towerCount: 1,
      optionIds: []
    });
    const result = calculateStorageSystem(input);

    expect(input.rolloutShelfCount).toBe(5);
    expect(result.engineeringSummary.totalStoredWeightKg).toBe(62500);
    expect(result.lineItems[2]?.amount).toBe(420000);
    expect(result.fromPrice).toBe(1839330);
  });

  it("uses the nearest permitted values and resolves equal distances downward", () => {
    const profile = calculatorProfiles.find((item) => item.id === "auto-sheet-metal");
    expect(profile).toBeDefined();

    const result = calculateStorageSystem(
      normalizeCalculatorInput({
        systemId: "auto-sheet-metal",
        heightMm: 130,
        widthMm: 1750,
        lengthMm: 4600,
        loadKg: 2250,
        shelfCount: 18,
        towerCount: 4.6,
        optionIds: []
      }),
      profile
    );

    expect(result.engineeringSummary.dimensionsLabel).toBe("3100×1600×120 мм");
    expect(result.engineeringSummary.totalStoredWeightKg).toBe(2000 * 20 * 5);
    expect(result.factors).toMatchObject({
      heightFactor: 1.15,
      widthFactor: 1.1,
      lengthFactor: 1.1,
      loadFactor: 1.2
    });
  });

  it("rounds public price display to thousands", () => {
    expect(formatRoundedRub(34_428_563)).toBe("34 429 000 ₽");
  });
});
