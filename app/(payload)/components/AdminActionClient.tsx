"use client";

import { CalculatorProfileSyncButton } from "./CalculatorProfileSyncButton";
import { CmsCurrentStateSyncButton } from "./CmsCurrentStateSyncButton";
import {
  IntegrationProbeButton,
  type ProbeKind
} from "./IntegrationProbeButton";

export type AdminActionClientProps =
  | { action: "calculator-profiles"; existingCount: number }
  | { action: "cms-current-state" }
  | { action: "integration-probe"; probeKind: ProbeKind };

export function AdminActionClient(props: AdminActionClientProps) {
  if (props.action === "calculator-profiles") {
    return (
      <CalculatorProfileSyncButton existingCount={props.existingCount} />
    );
  }

  if (props.action === "integration-probe") {
    return <IntegrationProbeButton kind={props.probeKind} />;
  }

  return <CmsCurrentStateSyncButton />;
}
