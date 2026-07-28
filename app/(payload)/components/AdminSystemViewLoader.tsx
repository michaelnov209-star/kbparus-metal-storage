import type { AdminViewServerProps } from "payload";

export async function AdminSystemViewLoader(props: AdminViewServerProps) {
  const { AdminSystemView } = await import("./AdminSystemView");
  return <AdminSystemView {...props} />;
}