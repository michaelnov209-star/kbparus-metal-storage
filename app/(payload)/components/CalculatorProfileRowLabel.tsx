"use client";

import { useRowLabel } from "@payloadcms/ui";

type RowData = {
  optionId?: unknown;
  price?: unknown;
  shelfCount?: unknown;
  title?: unknown;
  value?: unknown;
};

function formattedNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("ru-RU")
    : undefined;
}

export function CalculatorProfileRowLabel() {
  const { data, path, rowNumber } = useRowLabel<RowData>();
  const number = rowNumber === undefined ? "" : `Вариант ${rowNumber + 1}`;
  const value = formattedNumber(data?.value);
  const price = formattedNumber(data?.price);
  const shelfCount = formattedNumber(data?.shelfCount);
  const title =
    typeof data?.title === "string" ? data.title.trim() : "";

  if (title) {
    return <span>{title}{price ? ` · ${price} ₽` : ""}</span>;
  }
  if (path.includes("towerByShelfCount") && shelfCount) {
    return <span>{shelfCount} полок{price ? ` · ${price} ₽` : ""}</span>;
  }
  if (
    (path.includes("loadOptions") ||
      path.includes("rolloutLoadOptions")) &&
    value
  ) {
    return <span>{value} кг{price ? ` · ${price} ₽` : ""}</span>;
  }
  if (value) {
    return <span>{number}: {value}</span>;
  }
  return <span>{number || "Новый вариант"}</span>;
}

