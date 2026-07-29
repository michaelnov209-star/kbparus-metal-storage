export type ProductGalleryRow = {
  image?: unknown;
  [key: string]: unknown;
};

type RelationObject = {
  id?: unknown;
  filename?: unknown;
  url?: unknown;
  value?: unknown;
};

function relationScalar(value: unknown): number | string | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || undefined;
  }
  return undefined;
}

export function relationDocumentId(
  value: unknown
): number | string | undefined {
  const direct = relationScalar(value);
  if (direct !== undefined) return direct;
  if (!value || typeof value !== "object") return undefined;

  const relation = value as RelationObject;
  const id = relationScalar(relation.id);
  if (id !== undefined) return id;

  const relationValue = relationScalar(relation.value);
  if (relationValue !== undefined) return relationValue;

  if (relation.value && typeof relation.value === "object") {
    return relationScalar((relation.value as RelationObject).id);
  }

  return undefined;
}

function isExpandedRelationDocument(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const relation = value as RelationObject;
  return (
    relationScalar(relation.url) !== undefined ||
    relationScalar(relation.filename) !== undefined
  );
}

export function sanitizeProductGalleryRows<T extends ProductGalleryRow>({
  categoryImageId,
  mainImageId,
  rows
}: {
  categoryImageId?: number | string;
  mainImageId?: number | string;
  rows: T[];
}) {
  const seen = new Set<string>();
  let removedCategoryCover = 0;
  let removedDuplicates = 0;
  let removedInvalid = 0;
  let removedPrimary = 0;

  const sanitizedRows = rows.filter((row) => {
    const id = relationDocumentId(row?.image);
    if (id === undefined) {
      if (isExpandedRelationDocument(row?.image)) return true;
      removedInvalid += 1;
      return false;
    }

    const key = String(id);
    if (mainImageId !== undefined && key === String(mainImageId)) {
      removedPrimary += 1;
      return false;
    }
    if (categoryImageId !== undefined && key === String(categoryImageId)) {
      removedCategoryCover += 1;
      return false;
    }
    if (seen.has(key)) {
      removedDuplicates += 1;
      return false;
    }

    seen.add(key);
    return true;
  });

  return {
    removed:
      removedCategoryCover +
      removedDuplicates +
      removedInvalid +
      removedPrimary,
    removedCategoryCover,
    removedDuplicates,
    removedInvalid,
    removedPrimary,
    rows: sanitizedRows
  };
}
