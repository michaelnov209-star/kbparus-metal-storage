import type { ServerProps } from "payload";
import { Suspense } from "react";

type AdminDashboardLoaderProps = Pick<ServerProps, "payload" | "user">;

export async function AdminDashboardLoader(
  props: AdminDashboardLoaderProps
) {
  const { AdminDashboard } = await import("./AdminDashboard");

  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboard {...props} />
    </Suspense>
  );
}

function AdminDashboardLoading() {
  return (
    <section
      className="kb-admin-dashboard kb-admin-dashboard--loading"
      aria-label="Загрузка панели управления"
      aria-busy="true"
    >
      <div className="kb-admin-dashboard__hero">
        <div className="kb-admin-dashboard__hero-copy">
          <span className="kb-admin-dashboard__status">
            Подготавливаем рабочее пространство
          </span>
          <span className="kb-admin-dashboard__skeleton-line is-short" />
          <span className="kb-admin-dashboard__skeleton-line is-title" />
          <span className="kb-admin-dashboard__skeleton-line" />
          <span className="kb-admin-dashboard__skeleton-line is-medium" />
        </div>
        <div className="kb-admin-dashboard__hero-panel">
          <span className="kb-admin-dashboard__skeleton-line is-short" />
          <span className="kb-admin-dashboard__skeleton-line is-title" />
          <span className="kb-admin-dashboard__skeleton-line" />
        </div>
      </div>
      <div className="kb-admin-dashboard__kpis" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="kb-admin-dashboard__kpi-placeholder" key={index} />
        ))}
      </div>
    </section>
  );
}