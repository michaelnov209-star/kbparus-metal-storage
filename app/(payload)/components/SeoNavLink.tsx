import type { ServerProps } from "payload";
import { BarChart3 } from "lucide-react";
import { Link } from "@payloadcms/ui/elements/Link";
import { canEditContent } from "@/payload/access/rbac";

type SeoNavLinkProps = Pick<ServerProps, "user">;

export function SeoNavLink({ user }: SeoNavLinkProps) {
  if (!canEditContent(user)) return null;

  return (
    <Link className="kb-admin-seo-nav" href="/admin/seo">
      <BarChart3 size={17} aria-hidden />
      <span>SEO и позиции</span>
    </Link>
  );
}
