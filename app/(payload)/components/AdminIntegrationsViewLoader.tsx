import type { AdminViewServerProps } from "payload";

export async function AdminIntegrationsViewLoader(
  props: AdminViewServerProps
) {
  const { AdminIntegrationsView } = await import("./AdminIntegrationsView");
  return <AdminIntegrationsView {...props} />;
}
