"use client";

import { useEffect, useRef } from "react";
import { trackYandexGoal } from "@/lib/analytics/metrika";

export function AnalyticsEvents() {
  const reachedScrollDepths = useRef<Set<number>>(new Set());

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-metrika-goal]") : null;
      if (!target) return;

      trackYandexGoal(target.dataset.metrikaGoal || "contact_click", {
        href: target instanceof HTMLAnchorElement ? target.href : undefined,
        label: target.textContent?.trim().slice(0, 120)
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    function handleScrollDepth() {
      const documentElement = document.documentElement;
      const scrollableHeight = documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const currentDepth = Math.round(((window.scrollY + window.innerHeight) / documentElement.scrollHeight) * 100);
      for (const targetDepth of [50, 100]) {
        if (currentDepth >= targetDepth && !reachedScrollDepths.current.has(targetDepth)) {
          reachedScrollDepths.current.add(targetDepth);
          trackYandexGoal("scroll_depth", {
            depth: targetDepth,
            path: window.location.pathname
          });
        }
      }
    }

    handleScrollDepth();
    window.addEventListener("scroll", handleScrollDepth, { passive: true });
    window.addEventListener("resize", handleScrollDepth);
    return () => {
      window.removeEventListener("scroll", handleScrollDepth);
      window.removeEventListener("resize", handleScrollDepth);
    };
  }, []);

  return null;
}
