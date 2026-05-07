export function BrandMark({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <a className={compact ? "brand brand-compact" : "brand"} href={href} aria-label="КБ Парус">
      <img src="/brand/logo-g.png" alt="КБ Парус" />
      {!compact && (
        <span>
          <strong>Системы хранения металла</strong>
          <small>проектирование и производство</small>
        </span>
      )}
    </a>
  );
}
