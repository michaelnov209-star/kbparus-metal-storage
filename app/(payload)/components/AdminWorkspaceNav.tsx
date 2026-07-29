import { BarChart3, CircleGauge, LayoutDashboard, Settings2 } from "lucide-react";
import type { ServerProps } from "payload";
import { canEditContent, getCmsRole } from "@/payload/access/rbac";
import { AdminIntentLink } from "./AdminIntentLink";

type AdminWorkspaceNavProps = Pick<ServerProps, "user">;

export function AdminWorkspaceNav({ user }: AdminWorkspaceNavProps) {
  if (!user) {
    return null;
  }

  const canViewSeo = canEditContent(user);
  const isAdmin = getCmsRole(user) === "admin";

  return (
    <div className="kb-admin-workspace-nav" aria-label="Основные разделы">
      <AdminIntentLink
        aria-label="КБ Парус — обзор админки"
        className="kb-admin-workspace-nav__brand"
        href="/admin"
      >
        <img src="/brand/logo-g.png" alt="КБ Парус" width={226} height={75} />
      </AdminIntentLink>
      <span className="kb-admin-workspace-nav__label">Рабочее пространство</span>
      <AdminIntentLink className="kb-admin-workspace-nav__link" href="/admin">
        <LayoutDashboard size={17} aria-hidden />
        <span>Обзор и быстрые действия</span>
      </AdminIntentLink>
      {canViewSeo ? (
        <AdminIntentLink className="kb-admin-workspace-nav__link" href="/admin/seo">
          <BarChart3 size={17} aria-hidden />
          <span>SEO, цели и конверсии</span>
        </AdminIntentLink>
      ) : null}
      {isAdmin ? (
        <AdminIntentLink className="kb-admin-workspace-nav__link" href="/admin/system">
          <CircleGauge size={17} aria-hidden />
          <span>Здоровье и история</span>
        </AdminIntentLink>
      ) : null}
      {isAdmin ? (
        <AdminIntentLink className="kb-admin-workspace-nav__link" href="/admin/integrations">
          <Settings2 size={17} aria-hidden />
          <span>Интеграции и статусы</span>
        </AdminIntentLink>
      ) : null}
    </div>
  );
}
