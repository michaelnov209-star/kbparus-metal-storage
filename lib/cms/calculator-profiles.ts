import { cache } from "react";

import { calculatorProfiles as fallbackProfiles, type CalculatorProfile as RuntimeCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import {
  createCmsCalculatorProfile,
  mergeCmsCalculatorProfile,
  type RuntimeCmsCalculatorProfile
} from "@/lib/calculator/cms-profile";
import type { CalculatorProfile as CmsCalculatorProfile } from "@/payload-types";
import { getCmsClient } from "./client";

export { mergeCmsCalculatorProfile } from "@/lib/calculator/cms-profile";

export function resolvePublishedCalculatorProfiles(
  docs: readonly (CmsCalculatorProfile | RuntimeCmsCalculatorProfile)[]
): RuntimeCalculatorProfile[] {
  const bySlug = new Map<string, RuntimeCmsCalculatorProfile>();
  for (const rawDoc of docs) {
    const doc = rawDoc as RuntimeCmsCalculatorProfile;
    if (typeof doc.slug === "string" && !bySlug.has(doc.slug)) {
      bySlug.set(doc.slug, doc);
    }
  }

  const canonicalIds = new Set<string>(
    fallbackProfiles.map((profile) => profile.id)
  );
  const canonicalProfiles = fallbackProfiles.flatMap((fallback) => {
    const doc = bySlug.get(fallback.id);
    if (!doc) return [];
    if (doc.kind !== fallback.pricing.kind) {
      console.warn(
        `[cms] Calculator profile ${fallback.id} has an incompatible pricing kind and was skipped`
      );
      return [];
    }
    return [mergeCmsCalculatorProfile(doc, fallback)];
  });

  const customProfiles = [...bySlug.values()]
    .filter((doc) => !canonicalIds.has(doc.slug))
    .flatMap((doc) => {
      const profile = createCmsCalculatorProfile(doc);
      if (profile) return [profile];
      console.warn(
        `[cms] Calculator profile ${doc.slug || "without-slug"} is incomplete and was skipped`
      );
      return [];
    })
    .sort(
      (left, right) =>
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.title.localeCompare(right.title, "ru")
    );

  return [...canonicalProfiles, ...customProfiles];
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
      ? resolvePublishedCalculatorProfiles(
          publishedDocs as RuntimeCmsCalculatorProfile[]
        )
      : fallbackProfiles.map((profile) => ({ ...profile }));
  } catch (error) {
    console.warn("[cms] Calculator profiles unavailable, using verified fallback", error instanceof Error ? error.name : "UnknownError");
    return fallbackProfiles.map((profile) => ({ ...profile }));
  }
});
