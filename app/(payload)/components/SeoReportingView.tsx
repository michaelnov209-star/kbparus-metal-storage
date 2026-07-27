import type { ServerProps } from "payload";
import { LockKeyhole } from "lucide-react";
import { canEditContent } from "@/payload/access/rbac";
import { SeoReportsClient } from "./SeoReportsClient";

type SeoReportingViewProps = Pick<ServerProps, "user">;

export function SeoReportingView({ user }: SeoReportingViewProps) {
  if (!canEditContent(user)) {
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
