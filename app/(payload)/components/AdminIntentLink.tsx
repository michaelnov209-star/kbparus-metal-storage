"use client";

import { Link } from "@payloadcms/ui/elements/Link";
import { usePathname, useRouter } from "next/navigation";
import {
  type AnchorHTMLAttributes,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type PropsWithChildren,
  useCallback,
  useRef
} from "react";

type AdminIntentLinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "prefetch"> & {
    href: string;
    /**
     * Enables Next.js viewport prefetching for a small set of permanent,
     * high-frequency admin routes. Keep disabled for large tables and lists.
     */
    prefetch?: boolean;
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
  onPointerDown,
  prefetch: eagerPrefetch = false,
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

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    prefetch();
    onPointerDown?.(event);
  };

  return (
    <Link
      {...props}
      aria-current={props["aria-current"] ?? (isCurrent ? "page" : undefined)}
      href={href}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onPointerDown={handlePointerDown}
      prefetch={eagerPrefetch}
    >
      {children}
    </Link>
  );
}
