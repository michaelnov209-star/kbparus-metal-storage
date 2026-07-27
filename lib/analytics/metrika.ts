"use client";

import { getAnalyticsConsent } from "@/lib/analytics/consent";
import type { YandexMetrikaFunction } from "@/lib/analytics/metrika-runtime";

declare global {
  interface Window {
    ym?: YandexMetrikaFunction;
    __kbparusMetrikaInitialized?: boolean;
  }
}

const COUNTER_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || 0);

export function trackYandexGoal(goal: string, params?: Record<string, unknown>) {
  if (
    !COUNTER_ID ||
    typeof window === "undefined" ||
    getAnalyticsConsent() !== true ||
    typeof window.ym !== "function"
  ) {
    return;
  }

  try {
    window.ym(COUNTER_ID, "reachGoal", goal, params);
  } catch {
    // Analytics must never block sales flows.
  }
}
