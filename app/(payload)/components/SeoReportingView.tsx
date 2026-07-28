import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { canEditContent } from "@/payload/access/rbac";
import { AdminAccessDenied } from "./AdminAccessDenied";
import { SeoReportsClient } from "./SeoReportsClient";

export function SeoReportingView({
  initPageResult,
  params,
  searchParams,
  user,
  viewType
}: AdminViewServerProps) {
  const authenticatedUser = user ?? initPageResult.req.user;
  if (!authenticatedUser) {
    redirect("/admin/login?redirect=%2Fadmin%2Fseo");
  }

  const content = !canEditContent(authenticatedUser) ? (
    <AdminAccessDenied
      description="Раздел открыт администраторам и редакторам контента."
      icon={LockKeyhole}
      title="SEO-отчёты недоступны"
    />
  ) : (
    <SeoReportsClient />
  );

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      req={initPageResult.req}
      searchParams={searchParams}
      user={authenticatedUser || undefined}
      viewType={viewType}
      visibleEntities={{
        collections: initPageResult.visibleEntities?.collections,
        globals: initPageResult.visibleEntities?.globals
      }}
    >
      {content}
    </DefaultTemplate>
  );
}
