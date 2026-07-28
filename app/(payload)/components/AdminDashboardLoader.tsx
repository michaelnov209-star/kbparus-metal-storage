import type { AdminViewServerProps } from "payload";

export async function AdminDashboardLoader(props: AdminViewServerProps) {
  const { AdminDashboard } = await import("./AdminDashboard");
  return <AdminDashboard {...props} />;
}