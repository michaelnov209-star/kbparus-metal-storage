import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";
import {
  buildInputForProfile,
  reconcileInputForProfile
} from "@/components/calculator/calculator-state";

describe("calculator UI state", () => {
  it("starts a profile with its configured default options", () => {
    const input = buildInputForProfile("auto-sheet-metal", calculatorProfiles);

    expect(input.optionIds).toEqual([
      "scale",
      "infrared-safety",
      "vacuum-grip",
      "swing-crane"
    ]);
  });

  it("preserves supported choices, city and comment when the system changes", () => {
    const current = {
      ...buildInputForProfile("auto-sheet-metal", calculatorProfiles),
      heightMm: 150,
      widthMm: 1600,
      lengthMm: 3100,
      materialLengthMm: 3100,
      sheetWidthMm: 1600,
      loadKg: 2000,
      shelfCount: 20,
      towerCount: 2,
      optionIds: ["scale", "infrared-safety"],
      city: "Казань",
      comment: "Кран-балка над зоной выдачи"
    };

    const next = reconcileInputForProfile(
      current,
      "rollout-cassette-rack",
      calculatorProfiles
    );

    expect(next.heightMm).toBe(150);
    expect(next.widthMm).toBe(1600);
    expect(next.lengthMm).toBe(3100);
    expect(next.loadKg).toBe(2000);
    expect(next.towerCount).toBe(2);
    expect(next.shelfCount).toBe(7);
    expect(next.optionIds).toEqual(["scale"]);
    expect(next.city).toBe("Казань");
    expect(next.comment).toBe("Кран-балка над зоной выдачи");
  });

  it("keeps a hybrid configuration inside the combined shelf limit", () => {
    const current = {
      ...buildInputForProfile("forklift-cassette-rack", calculatorProfiles),
      shelfCount: 20,
      rolloutShelfCount: 10,
      city: "Самара"
    };

    const next = reconcileInputForProfile(
      current,
      "hybrid-rollout-rack",
      calculatorProfiles
    );

    expect(next.shelfCount + next.rolloutShelfCount).toBeLessThanOrEqual(25);
    expect(next.city).toBe("Самара");
  });
});

describe("calculator lead form semantics", () => {
  const source = readFileSync("components/Calculator.tsx", "utf8");

  it("uses native form validation before sending a lead", () => {
    expect(source).toContain('className="calculator-lead-form"');
    expect(source).toContain("onSubmit={handleLeadSubmit}");
    expect(source).toContain('data-testid="calculator-phone"');
    expect(source).toContain('data-testid="calculator-consent"');
    expect(source).toContain('type="submit"');
    expect(source).not.toContain("disabled={submittingLead || !consentAccepted}");
  });

  it("exposes one universal calculator without role-specific modes", () => {
    expect(source).toContain('data-ui="calculator-v3"');
    expect(source).not.toMatch(/режим менеджера|режим клиента/i);
  });
});
