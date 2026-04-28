import { describe, expect, it } from "vitest";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";

describe("storage calculator", () => {
  it("recommends rollout systems when rollout cassettes are required", () => {
    const result = calculateStorageSystem(normalizeCalculatorInput({ needsRolloutCassettes: true, cassetteCount: 6, execution: "manual" }));
    expect(result.recommendation.productType).toBe("rollout");
    expect(result.fromPrice).toBeGreaterThan(0);
    expect(result.preliminaryPrice).toBe(result.fromPrice);
  });

  it("recommends automated sheet storage for automatic execution", () => {
    const result = calculateStorageSystem(normalizeCalculatorInput({ material: "sheet", execution: "automatic", needsRolloutCassettes: false }));
    expect(result.recommendation.productType).toBe("automated");
    expect(result.lineItems.some((item) => item.label.includes("автоматика"))).toBe(true);
  });

  it("uses higher factors for longer and heavier systems", () => {
    const small = calculateStorageSystem(normalizeCalculatorInput({ lengthMm: 2600, loadKg: 1500, needsRolloutCassettes: false }));
    const large = calculateStorageSystem(normalizeCalculatorInput({ lengthMm: 6100, loadKg: 5000, needsRolloutCassettes: false }));
    expect(large.preliminaryPrice).toBeGreaterThan(small.preliminaryPrice);
    expect(large.factors.lengthFactor).toBeGreaterThan(small.factors.lengthFactor);
    expect(large.factors.loadFactor).toBeGreaterThan(small.factors.loadFactor);
  });
});
