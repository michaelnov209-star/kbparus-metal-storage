export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <a className={compact ? "brand brand-compact" : "brand"} href="#top" aria-label="КБ Парус">
      <img src="/brand/logo-g.png" alt="КБ Парус" />
      {!compact && (
        <span>
          <strong>Системы хранения металла</strong>
          <small>инженерный подбор и производство</small>
        </span>
      )}
    </a>
  );
}
