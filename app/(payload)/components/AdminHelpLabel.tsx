"use client";

import { FieldLabel } from "@payloadcms/ui";
import { CircleHelp } from "lucide-react";
import type { FieldLabelClientProps } from "payload";
import "./product-editor.scss";

type HelpField = FieldLabelClientProps["field"] & {
  admin?: {
    custom?: {
      helpText?: string;
    };
  };
};

export function AdminHelpLabel({
  field,
  ...labelProps
}: FieldLabelClientProps & { field?: HelpField }) {
  const helpText = field?.admin?.custom?.helpText;

  return (
    <span className="admin-help-label">
      <FieldLabel {...labelProps} />
      {helpText ? (
        <span className="admin-help-label__trigger" tabIndex={0} aria-label="Показать подсказку">
          <CircleHelp aria-hidden="true" size={15} strokeWidth={2} />
          <span className="admin-help-label__tooltip" role="tooltip">
            {helpText}
          </span>
        </span>
      ) : null}
    </span>
  );
}
