import { cache } from "react";

import { calculatorProfiles as fallbackProfiles, type CalculatorProfile as RuntimeCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import { mergeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";
import { getCmsClient } from "./client";

export { mergeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";

export const getCalculatorProfiles = cache(async (): Promise<RuntimeCalculatorProfile[]> => {
  const cms = await getCmsClient();
  if (!cms) return fallbackProfiles.map((profile) => ({ ...profile }));

  try {
    const response = await cms.find({
      collection: "calculator-profiles",
      depth: 0,
      draft: false,
      limit: 20,
      overrideAccess: true,
      pagination: false
    });
    const bySlug = new Map(response.docs.map((doc) => [doc.slug, doc]));
    return fallbackProfiles.map((fallback) => {
      const doc = bySlug.get(fallback.id);
      return doc ? mergeCmsCalculatorProfile(doc, fallback) : fallback;
    });
  } catch (error) {
    console.warn("[cms] Calculator profiles unavailable, using verified fallback", error instanceof Error ? error.name : "UnknownError");
    return fallbackProfiles.map((profile) => ({ ...profile }));
  }
});