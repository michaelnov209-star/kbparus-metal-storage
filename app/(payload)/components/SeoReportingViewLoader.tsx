import type { AdminViewServerProps } from "payload";

type SeoReportingViewLoaderProps = Pick<
  AdminViewServerProps,
  "initPageResult" | "user"
>;

export async function SeoReportingViewLoader(
  props: SeoReportingViewLoaderProps
) {
  const { SeoReportingView } = await import("./SeoReportingView");
  return <SeoReportingView {...props} />;
}