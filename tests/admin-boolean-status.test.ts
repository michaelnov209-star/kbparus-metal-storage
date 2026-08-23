import type { Field } from "payload";
import { describe, expect, it } from "vitest";
import { BOOLEAN_STATUS_CELL } from "@/payload/admin/boolean-status";
import { allCollections } from "./helpers/admin-configs";

function childFields(field: Field): Field[] {
  if (field.type === "tabs") {
    return field.tabs.flatMap((tab) => tab.fields);
  }
  if (field.type === "blocks") {
    return field.blocks.flatMap((block) => block.fields);
  }
  return "fields" in field && Array.isArray(field.fields)
    ? field.fields
    : [];
}

function collectNamedFields(fields: Field[]): Map<string, Field> {
  const result = new Map<string, Field>();

  for (const field of fields) {
    if ("name" in field && field.name) {
      result.set(String(field.name), field);
    }
    for (const [name, nestedField] of collectNamedFields(childFields(field))) {
      result.set(name, nestedField);
    }
  }

  return result;
}

describe("business labels for boolean values in lists", () => {
  it("renders every checkbox used as a default column through a labelled status cell", () => {
    let booleanColumnCount = 0;

    for (const collection of allCollections) {
      const fields = collectNamedFields(collection.fields);
      for (const column of collection.admin?.defaultColumns ?? []) {
        const field = fields.get(column);
        if (!field || field.type !== "checkbox") continue;

        booleanColumnCount += 1;
        const cell = field.admin?.components?.Cell;
        const labels = field.admin?.custom?.booleanStatus as
          | { trueLabel?: unknown; falseLabel?: unknown }
          | undefined;

        expect(cell).toEqual(BOOLEAN_STATUS_CELL);
        expect(typeof labels?.trueLabel).toBe("string");
        expect(typeof labels?.falseLabel).toBe("string");
        expect(labels?.trueLabel).not.toMatch(/^(true|правда)$/i);
        expect(labels?.falseLabel).not.toMatch(/^(false|ложь)$/i);
      }
    }

    expect(booleanColumnCount).toBeGreaterThan(0);
  });
});
