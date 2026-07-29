import homeImageManifestJson from "./homeImageManifest.json";

const HOME_IMAGES = "/assets/images/home";
const SCENARIOS = `${HOME_IMAGES}/scenarios`;
const homeImageManifest = homeImageManifestJson as Record<string, string>;

function optimizedScenario(source: string) {
  return homeImageManifest[source] ?? source;
}

/**
 * Owned, locally optimized imagery. Public pages must not depend on temporary
 * third-party stock-photo URLs. Scenario filenames contain a content hash, so
 * they are safe for long immutable CDN caching.
 */
export const visualAssets = {
  hero: `${HOME_IMAGES}/optimized/metal-storage-hero-poster-e2b60a440bad.webp`,
  warehouse: `${SCENARIOS}/warehouse-after-f3da93cd8945.webp`,
  sheetMetal: optimizedScenario(`${SCENARIOS}/sheet-metal-near-laser-safe.png`),
  forklift: `${SCENARIOS}/pullout-cassette-forklift-04282fda184a.webp`,
  steelProfile: `${SCENARIOS}/cantilever-crane-access-eb8cfef04cdf.webp`,
  tubesProfile: `${SCENARIOS}/tubes-address-storage-3f234f0a235e.webp`,
  engineering: optimizedScenario(`${SCENARIOS}/sheet-metal-near-laser-safe.png`),
  metalCoils: `${SCENARIOS}/warehouse-after-f3da93cd8945.webp`,
  productionLine: optimizedScenario(`${SCENARIOS}/sheet-metal-near-laser-safe.png`),
  beforeWarehouse: `${SCENARIOS}/warehouse-before-0aca47ad13b1.webp`,
  afterWarehouse: `${SCENARIOS}/warehouse-after-f3da93cd8945.webp`,
  calculator: `${SCENARIOS}/pullout-cassette-forklift-04282fda184a.webp`
} as const;

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
