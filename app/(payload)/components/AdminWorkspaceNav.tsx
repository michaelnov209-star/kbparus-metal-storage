import { BarChart3, CircleGauge, LayoutDashboard, Settings2 } from "lucide-react";
import { Link } from "@payloadcms/ui/elements/Link";
import type { ServerProps } from "payload";
import { canEditContent, getCmsRole } from "@/payload/access/rbac";

type AdminWorkspaceNavProps = Pick<ServerProps, "user">;

export function AdminWorkspaceNav({ user }: AdminWorkspaceNavProps) {
  if (!user) {
    return null;
  }

  const canViewSeo = canEditContent(user);
  const isAdmin = getCmsRole(user) === "admin";

  return (
    <div className="kb-admin-workspace-nav" aria-label="Основные разделы">
      <span className="kb-admin-workspace-nav__label">Рабочее пространство</span>
      <Link className="kb-admin-workspace-nav__link" href="/admin" prefetch={false}>
        <LayoutDashboard size={17} aria-hidden />
        <span>Обзор и быстрые действия</span>
      </Link>
      {canViewSeo ? (
        <Link className="kb-admin-workspace-nav__link" href="/admin/seo" prefetch={false}>
          <BarChart3 size={17} aria-hidden />
          <span>SEO, цели и конверсии</span>
        </Link>
      ) : null}
      {isAdmin ? (
        <Link className="kb-admin-workspace-nav__link" href="/admin/system" prefetch={false}>
          <CircleGauge size={17} aria-hidden />
          <span>Здоровье и история</span>
        </Link>
      ) : null}
      {isAdmin ? (
        <Link className="kb-admin-workspace-nav__link" href="/admin/integrations" prefetch={false}>
          <Settings2 size={17} aria-hidden />
          <span>Интеграции и статусы</span>
        </Link>
      ) : null}
    </div>
  );
}
