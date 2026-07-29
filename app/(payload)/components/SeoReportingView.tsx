import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { canEditContent } from "@/payload/access/rbac";
import type {
  SeoProvider,
  SeoReportDevice,
  SeoReportPeriod
} from "@/lib/seo-reporting/types";
import { AdminAccessDenied } from "./AdminAccessDenied";
import {
  SeoReportsClient,
  type SeoReportsInitialState
} from "./SeoReportsClient";

const allowedPeriods = new Set<number>([30, 90, 180, 365]);
const allowedProviders = new Set<SeoProvider>(["google", "yandex"]);
const allowedDevices = new Set<SeoReportDevice>([
  "all",
  "desktop",
  "mobile",
  "tablet"
]);

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSeoReportsInitialState(
  searchParams: AdminViewServerProps["searchParams"]
): SeoReportsInitialState {
  const requestedPeriod = Number(firstParam(searchParams?.period));
  const requestedProvider = firstParam(searchParams?.provider) as
    | SeoProvider
    | undefined;
  const requestedDevice = firstParam(searchParams?.device) as
    | SeoReportDevice
    | undefined;

  return {
    activeView:
      firstParam(searchParams?.view) === "goals" ? "goals" : "visibility",
    period: allowedPeriods.has(requestedPeriod)
      ? (requestedPeriod as SeoReportPeriod)
      : 30,
    provider:
      requestedProvider && allowedProviders.has(requestedProvider)
        ? requestedProvider
        : "yandex",
    device:
      requestedDevice && allowedDevices.has(requestedDevice)
        ? requestedDevice
        : "all",
    query: firstParam(searchParams?.query)?.trim() ?? ""
  };
}

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
    <SeoReportsClient initialState={parseSeoReportsInitialState(searchParams)} />
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
