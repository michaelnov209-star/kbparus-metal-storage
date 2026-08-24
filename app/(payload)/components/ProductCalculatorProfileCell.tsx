"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DefaultCellComponentProps,
  RelationshipFieldClient
} from "payload";
import { Calculator, Minus } from "lucide-react";
import "./product-editor.scss";

const profileTitleCache = new Map<string, string>();
const profileRequestCache = new Map<string, Promise<string | undefined>>();

function relationId(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (!value || typeof value !== "object") return undefined;
  const relation = value as { value?: unknown; id?: unknown };
  if (typeof relation.id === "string" || typeof relation.id === "number") {
    return String(relation.id);
  }
  if (relation.value !== undefined && relation.value !== value) {
    return relationId(relation.value);
  }
  return undefined;
}

function relationTitle(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const relation = value as {
    title?: unknown;
    value?: unknown;
    id?: unknown;
  };
  if (typeof relation.title === "string" && relation.title.trim()) {
    return relation.title.trim();
  }
  if (relation.value !== undefined && relation.value !== value) {
    return relationTitle(relation.value);
  }
  return undefined;
}

function loadProfileTitle(profileId: string) {
  const cachedTitle = profileTitleCache.get(profileId);
  if (cachedTitle) return Promise.resolve(cachedTitle);

  const pending = profileRequestCache.get(profileId);
  if (pending) return pending;

  const request = fetch(
    `/api/calculator-profiles/${encodeURIComponent(profileId)}`,
    { credentials: "same-origin" }
  )
    .then(async (response) => {
      if (!response.ok) return undefined;
      const body = (await response.json()) as { title?: unknown };
      const title =
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : undefined;
      if (title) profileTitleCache.set(profileId, title);
      return title;
    })
    .catch(() => undefined)
    .finally(() => profileRequestCache.delete(profileId));

  profileRequestCache.set(profileId, request);
  return request;
}

export function ProductCalculatorProfileCell({
  cellData,
  rowData
}: DefaultCellComponentProps<RelationshipFieldClient>) {
  const usesCalculator = rowData.pageMode === "configurator";
  const embeddedTitle =
    relationTitle(cellData) ?? relationTitle(rowData.calculatorProfile);
  const profileId = useMemo(
    () => relationId(cellData) ?? relationId(rowData.calculatorProfile),
    [cellData, rowData.calculatorProfile]
  );
  const [resolvedTitle, setResolvedTitle] = useState<string>();

  useEffect(() => {
    setResolvedTitle(undefined);
    if (!usesCalculator || embeddedTitle || !profileId) return;

    let active = true;
    void loadProfileTitle(profileId).then((title) => {
      if (active) setResolvedTitle(title);
    });
    return () => {
      active = false;
    };
  }, [embeddedTitle, profileId, usesCalculator]);

  if (!usesCalculator) {
    return (
      <span className="product-calculator-cell" data-state="standard">
        <Minus size={14} aria-hidden />
        Без калькулятора
      </span>
    );
  }

  const title = embeddedTitle ?? resolvedTitle;
  const fallback = profileId ? "Загружаем название…" : "Калькулятор не выбран";

  return (
    <span
      className="product-calculator-cell"
      data-state={profileId ? "configured" : "warning"}
      title={title ?? fallback}
    >
      <Calculator size={14} aria-hidden />
      {title ?? fallback}
    </span>
  );
}
