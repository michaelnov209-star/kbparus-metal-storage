"use client";

import type {
  CheckboxFieldClient,
  DefaultCellComponentProps
} from "payload";
import type {
  BooleanStatusLabels,
  BooleanStatusTone
} from "@/payload/admin/boolean-status";
import "./admin-status-cell.scss";

type StatusField = CheckboxFieldClient & {
  admin?: CheckboxFieldClient["admin"] & {
    custom?: {
      booleanStatus?: BooleanStatusLabels;
    };
  };
};

const DEFAULT_STATUS: Required<BooleanStatusLabels> = {
  trueLabel: "Да",
  falseLabel: "Нет",
  trueTone: "positive",
  falseTone: "neutral"
};

export function AdminBooleanStatusCell({
  cellData,
  field
}: DefaultCellComponentProps<CheckboxFieldClient>) {
  const statusField = field as StatusField;
  const configured = statusField.admin?.custom?.booleanStatus;

  if (typeof cellData !== "boolean") {
    return (
      <span className="kb-admin-status-cell" data-tone="neutral">
        Не задано
      </span>
    );
  }

  const label = cellData
    ? configured?.trueLabel ?? DEFAULT_STATUS.trueLabel
    : configured?.falseLabel ?? DEFAULT_STATUS.falseLabel;
  const tone: BooleanStatusTone = cellData
    ? configured?.trueTone ?? DEFAULT_STATUS.trueTone
    : configured?.falseTone ?? DEFAULT_STATUS.falseTone;

  return (
    <span className="kb-admin-status-cell" data-tone={tone} title={label}>
      <i aria-hidden />
      {label}
    </span>
  );
}
