"use client";

import { useAuth } from "@payloadcms/ui";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { getCmsRole } from "@/payload/access/rbac";
const AdminTrainingRuntime = dynamic(
  () =>
    import("./AdminTrainingRuntime").then(
      (module) => module.AdminTrainingRuntime
    ),
  { ssr: false }
);

type TrainingUser = {
  id?: number | string;
  invitationStatus?: unknown;
  role?: unknown;
};

export function AdminTrainingProvider({
  children
}: {
  children?: ReactNode;
}) {
  const { user } = useAuth<TrainingUser>();
  const role = getCmsRole(user);
  const userId = user?.id;

  return (
    <>
      {children}
      {role && (typeof userId === "string" || typeof userId === "number") ? (
        <AdminTrainingRuntime role={role} userId={userId} />
      ) : null}
    </>
  );
}
