export const visualAssets = {
  hero: "/assets/images/hero-metal-storage.svg",
  warehouse: "/assets/images/cassette-storage.svg",
  sheetMetal: "/assets/images/sheet-metal-storage.svg",
  forklift: "/assets/images/rollout-cassettes.svg",
  steelProfile: "/assets/images/cantilever-racks.svg",
  tubesProfile: "/assets/images/tubes-profile-storage.svg",
  engineering: "/assets/images/calculator-configurator.svg",
  metalCoils: "/assets/images/tubes-profile-storage.svg",
  productionLine: "/assets/images/hero-metal-storage.svg",
  beforeWarehouse: "/assets/images/warehouse-before.svg",
  afterWarehouse: "/assets/images/warehouse-after.svg",
  calculator: "/assets/images/calculator-configurator.svg"
};

export const solutionVisuals: Record<string, string> = {
  cantilever: visualAssets.steelProfile,
  cassette: visualAssets.warehouse,
  vertical: visualAssets.sheetMetal,
  rollout: visualAssets.forklift,
  automated: visualAssets.engineering,
  honeycomb: visualAssets.tubesProfile,
  custom: visualAssets.productionLine,
  hybrid: visualAssets.forklift
};
