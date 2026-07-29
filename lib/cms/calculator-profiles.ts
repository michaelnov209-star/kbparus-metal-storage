import { cache } from "react";

import { calculatorProfiles as fallbackProfiles, type CalculatorProfile as RuntimeCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import { mergeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";
import type { CalculatorProfile as CmsCalculatorProfile } from "@/payload-types";
import { getCmsClient } from "./client";

export { mergeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";

export function resolvePublishedCalculatorProfiles(
  docs: readonly CmsCalculatorProfile[]
): RuntimeCalculatorProfile[] {
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
  return fallbackProfiles.flatMap((fallback) => {
    const doc = bySlug.get(fallback.id);
    return doc ? [mergeCmsCalculatorProfile(doc, fallback)] : [];
  });
}

export const getCalculatorProfiles = cache(async (): Promise<RuntimeCalculatorProfile[]> => {
  const cms = await getCmsClient();
  if (!cms) return fallbackProfiles.map((profile) => ({ ...profile }));

  try {
    const [publishedResponse, latestStateResponse] = await Promise.all([
      cms.find({
        collection: "calculator-profiles",
        depth: 1,
        draft: false,
        limit: 20,
        overrideAccess: true,
        pagination: false
      }),
      cms.find({
        collection: "calculator-profiles",
        depth: 0,
        draft: true,
        limit: 1,
        overrideAccess: true
      })
    ]);
    const publishedDocs = Array.isArray(publishedResponse.docs)
      ? publishedResponse.docs
      : [];
    const latestStateDocs = Array.isArray(latestStateResponse.docs)
      ? latestStateResponse.docs
      : [];
    const collectionHasRecords =
      publishedDocs.length > 0 ||
      latestStateDocs.length > 0 ||
      (typeof latestStateResponse.totalDocs === "number" &&
        latestStateResponse.totalDocs > 0);

    return collectionHasRecords
      ? resolvePublishedCalculatorProfiles(publishedDocs)
      : fallbackProfiles.map((profile) => ({ ...profile }));
  } catch (error) {
    console.warn("[cms] Calculator profiles unavailable, using verified fallback", error instanceof Error ? error.name : "UnknownError");
    return fallbackProfiles.map((profile) => ({ ...profile }));
  }
});
