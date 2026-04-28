// Temporary production photos. Replace these URLs with KB Parus own photo/video assets when available.
export const visualAssets = {
  hero: "https://images.pexels.com/photos/36122954/pexels-photo-36122954.jpeg?auto=compress&cs=tinysrgb&w=1800",
  warehouse: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&w=1600",
  sheetMetal: "https://images.pexels.com/photos/36397989/pexels-photo-36397989.jpeg?auto=compress&cs=tinysrgb&w=1600",
  forklift: "https://images.pexels.com/photos/36878025/pexels-photo-36878025.jpeg?auto=compress&cs=tinysrgb&w=1600",
  steelProfile: "https://images.pexels.com/photos/36003983/pexels-photo-36003983.jpeg?auto=compress&cs=tinysrgb&w=1600",
  tubesProfile: "https://images.pexels.com/photos/36878027/pexels-photo-36878027.jpeg?auto=compress&cs=tinysrgb&w=1600",
  engineering: "https://images.pexels.com/photos/29224600/pexels-photo-29224600.jpeg?auto=compress&cs=tinysrgb&w=1600",
  metalCoils: "https://images.pexels.com/photos/33367148/pexels-photo-33367148.jpeg?auto=compress&cs=tinysrgb&w=1600",
  productionLine: "https://images.pexels.com/photos/9338479/pexels-photo-9338479.jpeg?auto=compress&cs=tinysrgb&w=1600",
  beforeWarehouse: "https://images.pexels.com/photos/36003983/pexels-photo-36003983.jpeg?auto=compress&cs=tinysrgb&w=1600",
  afterWarehouse: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&w=1600",
  calculator: "https://images.pexels.com/photos/36878025/pexels-photo-36878025.jpeg?auto=compress&cs=tinysrgb&w=1600"
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

export const photoCredits = [
  {
    block: "Hero / склад",
    source: "Pexels",
    url: "https://www.pexels.com/photo/spacious-industrial-warehouse-interior-with-storage-racks-36122954/"
  },
  {
    block: "Трубы и профиль",
    source: "Pexels",
    url: "https://www.pexels.com/photo/industrial-warehouse-with-stacked-metal-pipes-36878027/"
  },
  {
    block: "Листовой металл",
    source: "Pexels",
    url: "https://www.pexels.com/photo/industrial-warehouse-with-stacked-metal-sheets-36397989/"
  },
  {
    block: "Кран-балка / инженерный процесс",
    source: "Pexels",
    url: "https://www.pexels.com/photo/industrial-warehouse-with-metal-pipes-and-crane-29224600/"
  }
];
