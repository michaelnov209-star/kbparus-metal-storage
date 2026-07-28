import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "@payloadcms/ui/elements/Link";

type AdminAccessDeniedProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

export function AdminAccessDenied({
  description,
  icon: Icon,
  title
}: AdminAccessDeniedProps) {
  return (
    <section className="kb-admin-access-denied" aria-label="Ограничение доступа">
      <span className="kb-admin-access-denied__icon">
        <Icon size={24} aria-hidden />
      </span>
      <span className="kb-admin-access-denied__eyebrow">Ограничение доступа</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link className="kb-admin-access-denied__action" href="/admin" prefetch={false}>
        Вернуться к обзору
        <ArrowRight size={15} aria-hidden />
      </Link>
    </section>
  );
}
