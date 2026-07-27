import type { AdminViewServerProps } from "payload";
import { LockKeyhole } from "lucide-react";
import { canEditContent } from "@/payload/access/rbac";
import { SeoReportsClient } from "./SeoReportsClient";

type SeoReportingViewProps = Pick<
  AdminViewServerProps,
  "initPageResult" | "user"
>;

export function SeoReportingView({
  initPageResult,
  user
}: SeoReportingViewProps) {
  const authenticatedUser = user ?? initPageResult.req.user;

  if (!canEditContent(authenticatedUser)) {
    return (
      <section className="kb-seo-view kb-seo-view--denied">
        <LockKeyhole size={24} aria-hidden />
        <h1>SEO-отчёты недоступны</h1>
        <p>Раздел открыт администраторам и редакторам контента.</p>
      </section>
    );
  }

  return <SeoReportsClient />;
}
