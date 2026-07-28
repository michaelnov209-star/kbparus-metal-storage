"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ROUTE_GROUPS = {
  dashboard: [
    "/admin/collections/products",
    "/admin/collections/leads",
    "/admin/collections/calculator-profiles",
    "/admin/globals/home-content"
  ],
  content: [
    "/admin",
    "/admin/collections/products",
    "/admin/collections/media",
    "/admin/collections/calculator-profiles"
  ],
  system: [
    "/admin",
    "/admin/system",
    "/admin/integrations",
    "/admin/seo"
  ]
} as const;

function getIdleRoutes(pathname: string): readonly string[] {
  if (pathname === "/admin") return ROUTE_GROUPS.dashboard;
  if (pathname === "/admin/system" || pathname === "/admin/integrations" || pathname === "/admin/seo") {
    return ROUTE_GROUPS.system;
  }
  return ROUTE_GROUPS.content;
}

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

type WindowWithIdleCallback = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (
    callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
    options?: { timeout: number }
  ) => number;
};

function canPrefetch(): boolean {
  const connection = (navigator as NavigatorWithConnection).connection;
  return (
    !connection?.saveData &&
    connection?.effectiveType !== "slow-2g" &&
    connection?.effectiveType !== "2g"
  );
}

function getAdminHref(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;

  const anchor = target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return null;

  const url = new URL(anchor.href, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/admin")) return null;
  if (url.pathname === "/admin/logout" || url.pathname === window.location.pathname) return null;

  return url.pathname + url.search;
}

export function AdminPerformanceBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());
  const clearTimer = useRef<number | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    document.documentElement.removeAttribute("data-kb-admin-navigating");
    setStatus("");

    if (clearTimer.current !== null) {
      window.clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    function prefetchRoute(href: string | null) {
      if (!href || !canPrefetch() || prefetchedRoutes.current.has(href)) return;
      prefetchedRoutes.current.add(href);
      router.prefetch(href);
    }

    function handleIntent(event: Event) {
      prefetchRoute(getAdminHref(event.target));
    }

    function handleNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href = getAdminHref(event.target);
      if (!href) return;

      document.documentElement.setAttribute("data-kb-admin-navigating", "true");
      setStatus("Открываем раздел…");

      if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => {
        document.documentElement.removeAttribute("data-kb-admin-navigating");
        setStatus("");
      }, 12_000);
    }

    document.addEventListener("pointerover", handleIntent, true);
    document.addEventListener("focusin", handleIntent, true);
    document.addEventListener("touchstart", handleIntent, {
      capture: true,
      passive: true
    });
    document.addEventListener("click", handleNavigation, true);

    const idleWindow = window as WindowWithIdleCallback;
    const idleHandles: number[] = [];
    const timeoutHandles: number[] = [];

    if (canPrefetch()) {
      getIdleRoutes(pathname).filter((route) => route !== pathname).forEach((route, index) => {
        const schedule = () => {
          if (idleWindow.requestIdleCallback) {
            idleHandles.push(
              idleWindow.requestIdleCallback(() => prefetchRoute(route), {
                timeout: 3_000 + index * 700
              })
            );
          } else {
            timeoutHandles.push(
              window.setTimeout(() => prefetchRoute(route), 1_600 + index * 800)
            );
          }
        };

        timeoutHandles.push(window.setTimeout(schedule, 1_000 + index * 800));
      });
    }

    return () => {
      document.removeEventListener("pointerover", handleIntent, true);
      document.removeEventListener("focusin", handleIntent, true);
      document.removeEventListener("touchstart", handleIntent, true);
      document.removeEventListener("click", handleNavigation, true);
      idleHandles.forEach((handle) => idleWindow.cancelIdleCallback?.(handle));
      timeoutHandles.forEach((handle) => window.clearTimeout(handle));
      if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
    };
  }, [pathname, router]);

  return (
    <>
      <div className="kb-admin-route-progress" aria-hidden="true">
        <span />
      </div>
      <div className="kb-admin-route-status" aria-live="polite" aria-atomic="true">
        {status}
      </div>
    </>
  );
}
