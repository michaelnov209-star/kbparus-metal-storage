import { BarChart3, LayoutDashboard } from "lucide-react";
import { Link } from "@payloadcms/ui/elements/Link";
import type { ServerProps } from "payload";
import { canEditContent } from "@/payload/access/rbac";
import { AdminPerformanceBridge } from "./AdminPerformanceBridge";

type AdminWorkspaceNavProps = Pick<ServerProps, "user">;

export function AdminWorkspaceNav({ user }: AdminWorkspaceNavProps) {
  const canViewSeo = canEditContent(user);

  return (
    <>
      <AdminPerformanceBridge />
      <div className="kb-admin-workspace-nav" aria-label="Основные разделы">
        <span className="kb-admin-workspace-nav__label">Рабочее пространство</span>
        <Link className="kb-admin-workspace-nav__link" href="/admin">
          <LayoutDashboard size={17} aria-hidden />
          <span>Обзор и быстрые действия</span>
        </Link>
        {canViewSeo ? (
          <Link className="kb-admin-workspace-nav__link" href="/admin/seo">
            <BarChart3 size={17} aria-hidden />
            <span>SEO, цели и конверсии</span>
          </Link>
        ) : null}
      </div>
    </>
  );
}
