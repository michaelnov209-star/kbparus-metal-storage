import { ValidationError } from "payload";
import { describe, expect, it, vi } from "vitest";
import { createStableCollectionSlug } from "@/lib/cms/stable-collection-slug";
import { Categories } from "@/payload/collections/Categories";
import { Subcategories } from "@/payload/collections/Subcategories";

function fieldByName(
  fields: Array<Record<string, unknown>>,
  name: string
): Record<string, unknown> | undefined {
  for (const field of fields) {
    if (field.name === name) return field;
    if (Array.isArray(field.fields)) {
      const nested = fieldByName(
        field.fields as Array<Record<string, unknown>>,
        name
      );
      if (nested) return nested;
    }
  }
  return undefined;
}

function hookArgs({
  data,
  find,
  operation = "create",
  originalDoc
}: {
  data: Record<string, unknown>;
  find: ReturnType<typeof vi.fn>;
  operation?: "create" | "update";
  originalDoc?: Record<string, unknown>;
}) {
  return {
    collection: {} as never,
    context: {},
    data,
    operation,
    originalDoc,
    req: { payload: { find } }
  } as never;
}

describe("stable automatic category slugs", () => {
  it("keeps URL and legacy image fields out of the editor and category list", () => {
    for (const config of [Categories, Subcategories]) {
      const slug = fieldByName(
        config.fields as Array<Record<string, unknown>>,
        "slug"
      );
      const legacyImagePath = fieldByName(
        config.fields as Array<Record<string, unknown>>,
        "legacyImagePath"
      );

      expect(
        (slug?.admin as { hidden?: unknown } | undefined)?.hidden
      ).toBe(true);
      expect(
        (legacyImagePath?.admin as { hidden?: unknown } | undefined)?.hidden
      ).toBe(true);
      expect(config.admin?.defaultColumns).not.toContain("slug");
    }
  });

  it("creates a transliterated slug without exposing technical input to an editor", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] });
    const hook = createStableCollectionSlug("categories");
    const result = await hook(
      hookArgs({
        data: { title: "Ручные системы хранения металла" },
        find
      })
    );

    expect(result).toMatchObject({
      slug: "ruchnye-sistemy-hraneniya-metalla"
    });
    expect(find).toHaveBeenCalledTimes(1);
  });

  it("preserves the public URL on update even when the title changes", async () => {
    const find = vi.fn();
    const hook = createStableCollectionSlug("subcategories");
    const result = await hook(
      hookArgs({
        data: { title: "Новое название", slug: "attempted-change" },
        find,
        operation: "update",
        originalDoc: { slug: "existing-public-url" }
      })
    );

    expect(result).toMatchObject({ slug: "existing-public-url" });
    expect(find).not.toHaveBeenCalled();
  });

  it("uses a bounded suffix search and reports a field validation error", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1 }] });
    const hook = createStableCollectionSlug("categories");

    await expect(
      hook(
        hookArgs({
          data: { title: "Одинаковая категория" },
          find
        })
      )
    ).rejects.toBeInstanceOf(ValidationError);
    expect(find).toHaveBeenCalledTimes(100);
  });
});
