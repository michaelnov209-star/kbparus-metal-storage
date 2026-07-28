"use client";

import { Link } from "@payloadcms/ui/elements/Link";
import { usePathname, useRouter } from "next/navigation";
import {
  type AnchorHTMLAttributes,
  type FocusEvent,
  type MouseEvent,
  type PropsWithChildren,
  useCallback,
  useRef
} from "react";

type AdminIntentLinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  }
>;

/**
 * Prefetches after real user intent. This avoids an admin-wide background
 * request burst while removing the RSC/auth/DB wait after a deliberate click.
 */
export function AdminIntentLink({
  children,
  href,
  onFocus,
  onMouseEnter,
  ...props
}: AdminIntentLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prefetched = useRef(false);
  const targetPath = href.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  const currentPath = pathname.replace(/\/+$/, "") || "/";
  const isCurrent =
    targetPath === "/admin"
      ? currentPath === targetPath
      : currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
  const prefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    router.prefetch(href);
  }, [href, router]);

  const handleFocus = (event: FocusEvent<HTMLAnchorElement>) => {
    prefetch();
    onFocus?.(event);
  };

  const handleMouseEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    prefetch();
    onMouseEnter?.(event);
  };

  return (
    <Link
      {...props}
      aria-current={props["aria-current"] ?? (isCurrent ? "page" : undefined)}
      href={href}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
