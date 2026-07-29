"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  isAdminAuthOnlyPath,
  isAdminPath
} from "@/lib/admin/routes";

const PREFETCH_COOLDOWN_MS = 30_000;

function getAdminDestination(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;

  const anchor = target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor || !anchor.closest(".nav")) return null;

  const url = new URL(anchor.href, window.location.origin);
  if (
    url.origin !== window.location.origin ||
    !isAdminPath(url.pathname) ||
    isAdminAuthOnlyPath(url.pathname)
  ) {
    return null;
  }

  const destination = `${url.pathname}${url.search}`;
  const current = `${window.location.pathname}${window.location.search}`;
  return destination === current ? null : destination;
}

/**
 * Payload deliberately disables prefetching for its sidebar links. Warm only
 * the route a user is about to open, preserving fast transitions without
 * issuing requests for every collection and global in the navigation.
 */
export function AdminNavPrefetchBridge() {
  const router = useRouter();

  useEffect(() => {
    const prefetchedAt = new Map<string, number>();

    const prefetchFromTarget = (target: EventTarget | null) => {
      const destination = getAdminDestination(target);
      if (!destination) return;

      const now = Date.now();
      const previous = prefetchedAt.get(destination) ?? 0;
      if (now - previous < PREFETCH_COOLDOWN_MS) return;

      prefetchedAt.set(destination, now);
      router.prefetch(destination);
    };

    const handlePointerOver = (event: PointerEvent) => {
      prefetchFromTarget(event.target);
    };
    const handlePointerDown = (event: PointerEvent) => {
      prefetchFromTarget(event.target);
    };
    const handleFocusIn = (event: FocusEvent) => {
      prefetchFromTarget(event.target);
    };

    document.addEventListener("pointerover", handlePointerOver, {
      passive: true
    });
    document.addEventListener("pointerdown", handlePointerDown, {
      passive: true
    });
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [router]);

  return null;
}
