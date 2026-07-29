import Image from "next/image";

const navigationRows = Array.from({ length: 4 }, (_, index) => index);
const metricCards = Array.from({ length: 4 }, (_, index) => index);
const workspaceCards = Array.from({ length: 6 }, (_, index) => index);

export default function AdminRouteLoading() {
  return (
    <section
      className="kb-admin-route-loading"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="kb-admin-route-loading__sr">
        Загружаю рабочее пространство КБ Парус
      </span>

      <div className="kb-admin-route-loading__shell" aria-hidden="true">
        <aside className="kb-admin-route-loading__rail">
          <div className="kb-admin-route-loading__brand">
            <Image
              src="/brand/logo-g.png"
              alt=""
              width={226}
              height={75}
              priority
            />
          </div>

          <div className="kb-admin-route-loading__rail-label" />
          <div className="kb-admin-route-loading__rail-links">
            {navigationRows.map((row) => (
              <span key={row} />
            ))}
          </div>
        </aside>

        <div className="kb-admin-route-loading__content">
          <div className="kb-admin-route-loading__topbar">
            <span />
            <span />
          </div>

          <div className="kb-admin-route-loading__stage">
            <div className="kb-admin-route-loading__hero">
              <div>
                <span className="kb-admin-route-loading__eyebrow" />
                <span className="kb-admin-route-loading__title" />
                <span className="kb-admin-route-loading__copy" />
                <span className="kb-admin-route-loading__copy kb-admin-route-loading__copy--short" />
              </div>
              <span className="kb-admin-route-loading__status-card" />
            </div>

            <div className="kb-admin-route-loading__metrics">
              {metricCards.map((card) => (
                <span key={card} />
              ))}
            </div>

            <div className="kb-admin-route-loading__workspace">
              {workspaceCards.map((card) => (
                <article key={card}>
                  <span />
                  <div>
                    <span />
                    <span />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
