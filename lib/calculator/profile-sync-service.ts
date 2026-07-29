import type { Payload } from "payload";

import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed";

type PlainRecord = Record<string, unknown>;

export type CalculatorProfileSyncState = {
  latest: PlainRecord[];
  published: PlainRecord[];
};

export type CalculatorProfileSyncResult = {
  created: number;
  existing: number;
  published: number;
  publishedDocs: PlainRecord[];
  total: number;
};

const canonicalSlugs = calculatorProfileSeeds.map((seed) => seed.slug);

function asDocs(value: unknown): PlainRecord[] {
  if (!value || typeof value !== "object") return [];
  const docs = (value as { docs?: unknown }).docs;
  return Array.isArray(docs) ? (docs as PlainRecord[]) : [];
}

function recordId(value: PlainRecord): number | string | undefined {
  return typeof value.id === "number" || typeof value.id === "string"
    ? value.id
    : undefined;
}

function recordSlug(value: PlainRecord): string | undefined {
  return typeof value.slug === "string" && value.slug.trim()
    ? value.slug.trim()
    : undefined;
}

function recordsBySlug(records: PlainRecord[]): Map<string, PlainRecord> {
  const result = new Map<string, PlainRecord>();
  for (const record of records) {
    const slug = recordSlug(record);
    if (slug && !result.has(slug)) result.set(slug, record);
  }
  return result;
}

function withoutDocumentMeta(record: PlainRecord): PlainRecord {
  const {
    createdAt: _createdAt,
    id: _id,
    updatedAt: _updatedAt,
    ...data
  } = record;
  return data;
}

export async function readCalculatorProfileSyncState(
  cms: Payload
): Promise<CalculatorProfileSyncState> {
  const where = {
    slug: {
      in: canonicalSlugs
    }
  };
  const [published, latest] = await Promise.all([
    cms.find({
      collection: "calculator-profiles",
      depth: 0,
      draft: false,
      overrideAccess: true,
      pagination: false,
      where
    }),
    cms.find({
      collection: "calculator-profiles",
      depth: 0,
      draft: true,
      overrideAccess: true,
      pagination: false,
      where
    })
  ]);

  return {
    latest: asDocs(latest),
    published: asDocs(published)
  };
}

export function countMissingPublishedCalculatorProfiles(
  state: CalculatorProfileSyncState
): number {
  const publishedBySlug = recordsBySlug(state.published);
  return calculatorProfileSeeds.filter((seed) => {
    const record = publishedBySlug.get(seed.slug);
    return !record || recordId(record) === undefined;
  }).length;
}

export function mapPublishedCalculatorProfileIds(
  records: PlainRecord[]
): Map<string, number | string> {
  const ids = new Map<string, number | string>();
  const canonicalSlugSet = new Set<string>(canonicalSlugs);

  for (const record of records) {
    const slug = recordSlug(record);
    const id = recordId(record);
    if (slug && canonicalSlugSet.has(slug) && id !== undefined) {
      ids.set(slug, id);
    }
  }

  return ids;
}

/**
 * Installs only absent canonical profiles. Existing published profiles are
 * authoritative. A draft-only profile is published with its editor-entered
 * values instead of being replaced with seed pricing.
 */
export async function syncCalculatorProfilesMissingOnly(
  cms: Payload,
  state: CalculatorProfileSyncState
): Promise<CalculatorProfileSyncResult> {
  const publishedBySlug = recordsBySlug(state.published);
  const latestBySlug = recordsBySlug(state.latest);
  const publishedDocs = [...state.published];
  let created = 0;
  let existing = 0;
  let published = 0;

  for (const seed of calculatorProfileSeeds) {
    const existingPublished = publishedBySlug.get(seed.slug);
    if (existingPublished && recordId(existingPublished) !== undefined) {
      existing += 1;
      continue;
    }

    const draftOnly = latestBySlug.get(seed.slug);
    const draftOnlyId = draftOnly ? recordId(draftOnly) : undefined;
    let saved: PlainRecord;

    if (draftOnly && draftOnlyId !== undefined) {
      saved = (await cms.update({
        collection: "calculator-profiles",
        id: draftOnlyId,
        data: {
          ...withoutDocumentMeta(draftOnly),
          _status: "published"
        } as never,
        draft: false,
        overrideAccess: true
      })) as unknown as PlainRecord;
      published += 1;
    } else {
      saved = (await cms.create({
        collection: "calculator-profiles",
        data: seed,
        draft: false,
        overrideAccess: true
      })) as unknown as PlainRecord;
      created += 1;
    }

    if (recordId(saved) === undefined) {
      throw new Error(
        `CMS не вернула идентификатор профиля калькулятора ${seed.slug}`
      );
    }

    publishedBySlug.set(seed.slug, saved);
    publishedDocs.push(saved);
  }

  return {
    created,
    existing,
    published,
    publishedDocs,
    total: calculatorProfileSeeds.length
  };
}
