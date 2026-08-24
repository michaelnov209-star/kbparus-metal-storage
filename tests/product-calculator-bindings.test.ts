import { describe, expect, it } from "vitest";

import { catalogProducts } from "@/data/storageSystems/catalogDepth";
import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";

const expectedBindings = new Map<string, string>([
  ["compact-3000x1500", "auto-sheet-metal"],
  ["logic-sheet-metal-storage", "auto-sheet-metal"],
  ["spider-sheet-metal-storage", "auto-sheet-metal"],
  ["cross-sheet-metal-storage", "auto-sheet-metal"],
  ["forklift-cassette-rack", "forklift-cassette-rack"],
  ["rollout-cassette-rack", "rollout-cassette-rack"],
  ["hybrid-rollout-rack", "hybrid-rollout-rack"],
  ["two-side-rollout-rack", "two-side-rollout-rack"],
  ["automated-long-goods-tower", "auto-sort-metal"]
]);

describe("product calculator bindings", () => {
  it("binds calculators only to the approved product models", () => {
    const actual = catalogProducts
      .filter((product) => product.pageMode === "configurator")
      .map((product) => [product.id, product.calculatorProfileId] as const);

    expect(new Map(actual)).toEqual(expectedBindings);
  });

  it("does not leave configurator products without an existing profile", () => {
    const profileIds = new Set<string>(
      calculatorProfiles.map((profile) => profile.id)
    );

    for (const product of catalogProducts) {
      if (product.pageMode === "configurator") {
        expect(product.calculatorProfileId, product.id).toBeTruthy();
        expect(profileIds.has(product.calculatorProfileId!), product.id).toBe(true);
      } else {
        expect(product.calculatorProfileId, product.id).toBeUndefined();
      }
    }
  });

  it("uses every published calculator profile on at least one product", () => {
    const boundProfiles = new Set<string>(expectedBindings.values());

    for (const profile of calculatorProfiles) {
      expect(boundProfiles.has(profile.id), profile.id).toBe(true);
    }
  });
});
