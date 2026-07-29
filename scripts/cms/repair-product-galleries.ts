#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Payload } from "payload";
import {
  relationDocumentId,
  sanitizeProductGalleryRows,
  type ProductGalleryRow
} from "../../lib/cms/product-gallery-policy";

type PlainRecord = Record<string, unknown>;
type RepairCms = Pick<Payload, "find" | "update">;

type RepairPlanItem = {
  id: number | string;
  result: ReturnType<
    typeof sanitizeProductGalleryRows<ProductGalleryRow>
  >;
  slug: string;
  status: "draft" | "published";
};

function docs(value: unknown): PlainRecord[] {
  if (!value || typeof value !== "object") return [];
  const valueDocs = (value as { docs?: unknown }).docs;
  return Array.isArray(valueDocs) ? (valueDocs as PlainRecord[]) : [];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function buildProductGalleryRepairPlan(
  categories: PlainRecord[],
  products: PlainRecord[]
): RepairPlanItem[] {
  const categoryImageById = new Map<string, number | string>();
  for (const category of categories) {
    const id = relationDocumentId(category.id);
    const imageId = relationDocumentId(category.image);
    if (id !== undefined && imageId !== undefined) {
      categoryImageById.set(String(id), imageId);
    }
  }

  return products
    .map((product) => {
      const id = relationDocumentId(product.id);
      const categoryId = relationDocumentId(product.category);
      const gallery = Array.isArray(product.gallery)
        ? (product.gallery as ProductGalleryRow[])
        : [];
      const result = sanitizeProductGalleryRows({
        categoryImageId:
          categoryId === undefined
            ? undefined
            : categoryImageById.get(String(categoryId)),
        mainImageId: relationDocumentId(product.image),
        rows: gallery
      });

      return {
        id,
        result,
        slug: text(product.slug) ?? String(id ?? "unknown"),
        status: product._status === "draft" ? "draft" : "published"
      };
    })
    .filter(
      (item): item is RepairPlanItem =>
        item.id !== undefined && item.result.removed > 0
    );
}

export async function runProductGalleryRepair({
  apply,
  cms,
  log = console.log
}: {
  apply: boolean;
  cms: RepairCms;
  log?: (message: string) => void;
}) {
  const [categoryResult, productResult] = await Promise.all([
    cms.find({
      collection: "categories",
      depth: 0,
      draft: true,
      limit: 100,
      overrideAccess: true,
      pagination: false
    }),
    cms.find({
      collection: "products",
      depth: 0,
      draft: true,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: "slug"
    })
  ]);

  const products = docs(productResult);
  const plan = buildProductGalleryRepairPlan(docs(categoryResult), products);
  const totals = plan.reduce(
    (sum, item) => ({
      categoryCovers:
        sum.categoryCovers + item.result.removedCategoryCover,
      duplicateSecondary:
        sum.duplicateSecondary + item.result.removedDuplicates,
      invalid: sum.invalid + item.result.removedInvalid,
      primaryDuplicates:
        sum.primaryDuplicates + item.result.removedPrimary,
      rows: sum.rows + item.result.removed
    }),
    {
      categoryCovers: 0,
      duplicateSecondary: 0,
      invalid: 0,
      primaryDuplicates: 0,
      rows: 0
    }
  );

  log(
    `[product-gallery] mode=${apply ? "apply" : "audit"} products=${products.length} affected=${plan.length} removeRows=${totals.rows} primary=${totals.primaryDuplicates} categoryCovers=${totals.categoryCovers} duplicateSecondary=${totals.duplicateSecondary} invalid=${totals.invalid}`
  );
  for (const item of plan) {
    log(
      `[product-gallery] ${item.slug}: status=${item.status}, remove=${item.result.removed}, keep=${item.result.rows.length}`
    );
  }

  if (!apply) {
    log(
      "[product-gallery] Read-only audit. Re-run with --apply and the explicit confirmation environment variable."
    );
    return {
      affectedProducts: plan.length,
      removedRows: totals.rows,
      updatedProducts: 0
    };
  }

  for (const item of plan) {
    const isDraft = item.status === "draft";
    await cms.update({
      collection: "products",
      id: item.id,
      data: {
        gallery: item.result.rows,
        _status: item.status
      } as never,
      draft: isDraft,
      overrideAccess: true
    });
  }

  log(
    `[product-gallery] complete updated=${plan.length}, removedRows=${totals.rows}`
  );
  return {
    affectedProducts: plan.length,
    removedRows: totals.rows,
    updatedProducts: plan.length
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (
    apply &&
    process.env.PRODUCT_GALLERY_REPAIR_CONFIRMATION !==
      "APPLY_PRODUCT_GALLERY_REPAIR"
  ) {
    throw new Error(
      "Запись заблокирована. Укажите PRODUCT_GALLERY_REPAIR_CONFIRMATION=APPLY_PRODUCT_GALLERY_REPAIR."
    );
  }

  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config")
  ]);
  const cms = await getPayload({ config });
  await runProductGalleryRepair({ apply, cms });
}

function isDirectExecution() {
  const entry = process.argv[1];
  return Boolean(
    entry && pathToFileURL(resolve(entry)).href === import.meta.url
  );
}

if (isDirectExecution()) {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
