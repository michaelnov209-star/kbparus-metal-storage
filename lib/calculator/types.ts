import type { ExecutionMode, FacilityKind, LoadingMethod, MaterialKind, ProductType } from "@/data/storageSystems/types";

export interface CalculatorInput {
  material: MaterialKind;
  materialLengthMm: number;
  sheetWidthMm: number;
  unitWeightKg: number;
  totalStorageWeightKg: number;
  loadingMethod: LoadingMethod;
  facility: FacilityKind;
  desiredCapacity: number;
  needsRolloutCassettes: boolean;
  needsPainting: boolean;
  needsMounting: boolean;
  needsDelivery: boolean;
  city: string;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  lengthMm: number;
  loadKg: number;
  towerCount: number;
  shelfCount: number;
  cassetteCount: number;
  execution: ExecutionMode;
  comment?: string;
}

export interface RecommendedConfig {
  productType: ProductType;
  title: string;
  rationale: string[];
  keyParameters: string[];
  engineerQuestions: string[];
}

export interface CalculatorResult {
  recommendation: RecommendedConfig;
  preliminaryPrice: number;
  fromPrice: number;
  factors: {
    heightFactor: number;
    widthFactor: number;
    lengthFactor: number;
    loadFactor: number;
    shelvesPerTowerFactor: number;
    dimensionFactor: number;
  };
  lineItems: Array<{
    label: string;
    amount: number;
  }>;
}
