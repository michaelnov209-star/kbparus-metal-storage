import type { CollectionConfig, GlobalConfig } from "payload";
import {
  payloadCollections,
  payloadGlobals
} from "@/payload/admin/config-registry";

export const allCollections: CollectionConfig[] = payloadCollections;
export const allGlobals: GlobalConfig[] = payloadGlobals;
export const allAdminConfigs: Array<CollectionConfig | GlobalConfig> = [
  ...allCollections,
  ...allGlobals
];
