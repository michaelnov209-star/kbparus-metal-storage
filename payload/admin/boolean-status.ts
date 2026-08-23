export type BooleanStatusTone =
  | "positive"
  | "accent"
  | "warning"
  | "negative"
  | "neutral";

export type BooleanStatusLabels = {
  trueLabel: string;
  falseLabel: string;
  trueTone?: BooleanStatusTone;
  falseTone?: BooleanStatusTone;
};

export const BOOLEAN_STATUS_CELL = {
  path: "@/app/(payload)/components/AdminBooleanStatusCell",
  exportName: "AdminBooleanStatusCell"
} as const;

export function booleanStatusAdmin({
  trueLabel,
  falseLabel,
  trueTone = "positive",
  falseTone = "neutral"
}: BooleanStatusLabels) {
  return {
    components: {
      Cell: BOOLEAN_STATUS_CELL
    },
    custom: {
      booleanStatus: {
        trueLabel,
        falseLabel,
        trueTone,
        falseTone
      }
    }
  };
}
