import type { Field } from "payload";
import { describe, expect, it } from "vitest";
import { allAdminConfigs } from "./helpers/admin-configs";

type ArrayCoverage = {
  name: string;
  hasBusinessLabels: boolean;
  hasRowLabel: boolean;
};

type VisibleFieldCoverage = {
  name: string;
  hasLabel: boolean;
};

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

const collectArrays = (fields: Field[], parent = ""): ArrayCoverage[] => {
  const arrays: ArrayCoverage[] = [];

  for (const field of fields) {
    if (field.type === "array") {
      const name = parent ? `${parent}.${field.name}` : field.name;
      arrays.push({
        name,
        hasBusinessLabels: Boolean(
          field.labels?.singular && field.labels?.plural
        ),
        hasRowLabel: Boolean(field.admin?.components?.RowLabel)
      });
      arrays.push(...collectArrays(field.fields, name));
      continue;
    }

    const currentName =
      "name" in field && field.name
        ? parent
          ? `${parent}.${String(field.name)}`
          : String(field.name)
        : parent;
    arrays.push(...collectArrays(childFields(field), currentName));
  }

  return arrays;
};

const collectVisibleFields = (
  fields: Field[],
  parent = "",
  ancestorHidden = false
): VisibleFieldCoverage[] => {
  const result: VisibleFieldCoverage[] = [];

  for (const field of fields) {
    const hasName = "name" in field && Boolean(field.name);
    const currentName = hasName
      ? parent
        ? `${parent}.${String(field.name)}`
        : String(field.name)
      : parent;
    const admin =
      "admin" in field && field.admin && typeof field.admin === "object"
        ? (field.admin as { hidden?: unknown })
        : undefined;
    const isHidden = ancestorHidden || admin?.hidden === true;

    if (hasName && field.type !== "ui" && !isHidden) {
      result.push({
        name: currentName,
        hasLabel: Boolean("label" in field && field.label)
      });
    }

    result.push(
      ...collectVisibleFields(childFields(field), currentName, isHidden)
    );
  }

  return result;
};

describe("business labels for Payload admin fields", () => {
  it("discovers every collection and global and labels every array row, including calculator profiles", () => {
    const arrays = allAdminConfigs.flatMap((config) =>
      collectArrays(config.fields, config.slug)
    );

    expect(allAdminConfigs.length).toBeGreaterThanOrEqual(11);
    expect(
      arrays.some((field) =>
        field.name.startsWith("calculator-profiles.")
      )
    ).toBe(true);
    expect(arrays.length).toBeGreaterThanOrEqual(40);
    expect(arrays.filter((field) => !field.hasBusinessLabels)).toEqual([]);
    expect(arrays.filter((field) => !field.hasRowLabel)).toEqual([]);
  });

  it("does not leave visible named inputs without a business label", () => {
    const visibleFields = allAdminConfigs.flatMap((config) =>
      collectVisibleFields(config.fields, config.slug)
    );

    expect(
      visibleFields.filter((field) => !field.hasLabel)
    ).toEqual([]);
  });
});
