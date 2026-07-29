"use client";

import dynamic from "next/dynamic";

import type { AdminActionClientProps } from "./AdminActionClient";
import type { ProbeKind } from "./IntegrationProbeButton";

const AdminActionClient = dynamic(
  () =>
    import("./AdminActionClient").then((module) => module.AdminActionClient),
  {
    loading: () => (
      <button type="button" disabled>
        Подготавливаю проверку…
      </button>
    )
  }
);

function LazyAdminAction(props: AdminActionClientProps) {
  return (
    <div className="kb-admin-action-slot" data-action={props.action}>
      <AdminActionClient {...props} />
    </div>
  );
}

export function LazyCalculatorProfileSyncButton({
  existingCount
}: {
  existingCount: number;
}) {
  return (
    <LazyAdminAction
      action="calculator-profiles"
      existingCount={existingCount}
    />
  );
}

export function LazyCmsCurrentStateSyncButton() {
  return <LazyAdminAction action="cms-current-state" />;
}

export function LazyIntegrationProbeButton({ kind }: { kind: ProbeKind }) {
  return (
    <LazyAdminAction action="integration-probe" probeKind={kind} />
  );
}
