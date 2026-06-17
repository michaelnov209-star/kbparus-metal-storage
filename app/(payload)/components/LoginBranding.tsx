/**
 * Брендированный блок над формой логина (admin.components.beforeLogin).
 * Премиум-вид: логотип, заголовок и подзаголовок панели управления.
 */
export function LoginBranding() {
  return (
    <div className="kb-login-branding">
      <img className="kb-login-branding__logo" src="/brand/logo-g.png" alt="КБ Парус" />
      <h2>Панель управления сайтом</h2>
      <p>Системы хранения металла — контент, каталог и заявки в одном месте.</p>
    </div>
  );
}
