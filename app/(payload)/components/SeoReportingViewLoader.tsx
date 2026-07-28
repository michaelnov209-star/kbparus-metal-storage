import type { AdminViewServerProps } from "payload";

export async function SeoReportingViewLoader(
  props: AdminViewServerProps
) {
  const { SeoReportingView } = await import("./SeoReportingView");
  return <SeoReportingView {...props} />;
}