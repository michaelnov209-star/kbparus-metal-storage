export type MaterialKind = "sheet" | "pipe" | "profile" | "longProduct" | "mixed";
export type LoadingMethod = "crane" | "forklift" | "manual";
export type FacilityKind = "workshop" | "warehouse" | "outdoor";
export type ExecutionMode = "manual" | "automatic";
export type ProductType =
  | "cantilever"
  | "cassette"
  | "vertical"
  | "rollout"
  | "hybrid"
  | "automated"
  | "honeycomb"
  | "tree"
  | "custom";

export interface StorageEquipment {
  product_id: string;
  sku: string;
  external_1c_id: string;
  name: string;
  product_type: ProductType;
  execution: ExecutionMode;
  vat_rate: number;
  currency: "RUB";
  price_net: number;
  price_gross: number;
  weight_kg: number;
  dimensions_mm: {
    height: number;
    width: number;
    depth: number;
    length: number;
  };
  load_kg: number;
  compatible_materials: MaterialKind[];
  description: string;
  keySpecs: string[];
}

export interface ProductCategory {
  id: string;
  title: string;
  product_type: ProductType;
  summary: string;
  fitFor: string[];
  typicalSpecs: string[];
}
