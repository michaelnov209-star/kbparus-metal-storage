export const visualAssets = {
  hero:
    "https://images.unsplash.com/photo-1581093458791-9f3c3900df7b?auto=format&fit=crop&w=2200&q=86",
  warehouse:
    "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=1400&q=82",
  sheetMetal:
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1400&q=82",
  forklift:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=82",
  steelProfile:
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1400&q=82",
  engineering:
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=82",
  metalCoils:
    "https://images.unsplash.com/photo-1518709911915-712d5fd04677?auto=format&fit=crop&w=1400&q=82",
  productionLine:
    "https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?auto=format&fit=crop&w=1400&q=82"
};

export const solutionVisuals: Record<string, string> = {
  cantilever: visualAssets.steelProfile,
  cassette: visualAssets.warehouse,
  vertical: visualAssets.sheetMetal,
  rollout: visualAssets.forklift,
  automated: visualAssets.engineering,
  honeycomb: visualAssets.metalCoils,
  custom: visualAssets.productionLine,
  hybrid: visualAssets.forklift
};
