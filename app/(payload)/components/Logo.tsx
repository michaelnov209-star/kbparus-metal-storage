/**
 * Логотип КБ Парус в шапке админки и на экране логина (admin.components.graphics.Logo).
 * Серверный компонент — рендерит статичную разметку.
 */
export function Logo() {
  return (
    <div className="kb-admin-logo">
      <img src="/brand/logo-g.png" alt="КБ Парус" />
      <span className="kb-admin-logo__text">
        <strong>КБ Парус CMS</strong>
        <small>Системы хранения металла</small>
      </span>
    </div>
  );
}
