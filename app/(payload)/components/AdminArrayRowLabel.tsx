"use client";

import { useRowLabel } from "@payloadcms/ui";
import type { BusinessRowLabelOptions } from "@/payload/admin/array-row-label";

type RowData = Record<string, unknown>;

const MAX_LABEL_LENGTH = 88;

const shorten = (value: string) =>
  value.length > MAX_LABEL_LENGTH
    ? `${value.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`
    : value;

const readableValue = (
  value: unknown,
  valueLabels: BusinessRowLabelOptions["valueLabels"]
): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;
    return valueLabels?.[normalized] ?? normalized;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("ru-RU").format(value);
  }

  if (value && typeof value === "object") {
    const relation = value as Record<string, unknown>;
    for (const key of ["title", "name", "label", "alt", "filename"]) {
      const resolved = readableValue(relation[key], valueLabels);
      if (resolved) return resolved;
    }
  }

  return null;
};

const readPath = (data: RowData, path: string): unknown =>
  path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, data);

const firstReadable = (
  data: RowData,
  fields: readonly string[] | undefined,
  valueLabels: BusinessRowLabelOptions["valueLabels"]
) => {
  for (const field of fields ?? []) {
    const value = readableValue(readPath(data, field), valueLabels);
    if (value) return value;
  }
  return null;
};

export function AdminArrayRowLabel({
  fallback,
  primaryFields,
  secondaryFields,
  valueLabels
}: BusinessRowLabelOptions) {
  const { data, rowNumber } = useRowLabel<RowData>();
  const primary = firstReadable(data ?? {}, primaryFields, valueLabels);
  const secondary = firstReadable(data ?? {}, secondaryFields, valueLabels);
  const uniqueSecondary = secondary && secondary !== primary ? secondary : null;
  const fallbackLabel = `${fallback} №${(rowNumber ?? 0) + 1}`;
  const label = primary
    ? uniqueSecondary
      ? `${primary} — ${uniqueSecondary}`
      : primary
    : fallbackLabel;
  const visibleLabel = shorten(label);

  return <span title={label}>{visibleLabel}</span>;
}

