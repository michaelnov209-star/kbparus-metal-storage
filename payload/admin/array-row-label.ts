export type BusinessRowLabelOptions = {
  fallback: string;
  primaryFields?: readonly string[];
  secondaryFields?: readonly string[];
  valueLabels?: Readonly<Record<string, string>>;
};

export const businessRowLabel = (options: BusinessRowLabelOptions) =>
  ({
    path: "@/app/(payload)/components/AdminArrayRowLabel",
    exportName: "AdminArrayRowLabel",
    clientProps: options
  }) as const;

