import { describe, expect, it } from "vitest";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";

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

    expect(result.sourceSheet).toBe("Авт.скл. лист. металл");
    expect(result.fromPrice).toBe(7318003);
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
});
