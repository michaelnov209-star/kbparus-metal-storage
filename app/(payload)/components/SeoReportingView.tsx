import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { LockKeyhole } from "lucide-react";
import { canEditContent } from "@/payload/access/rbac";
import { SeoReportsClient } from "./SeoReportsClient";

export function SeoReportingView({
  initPageResult,
  params,
  searchParams,
  user,
  viewType
}: AdminViewServerProps) {
  const authenticatedUser = user ?? initPageResult.req.user;

  const content = !canEditContent(authenticatedUser) ? (
    <section className="kb-seo-view kb-seo-view--denied">
      <LockKeyhole size={24} aria-hidden />
      <h1>SEO-отчёты недоступны</h1>
      <p>Раздел открыт администраторам и редакторам контента.</p>
    </section>
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
