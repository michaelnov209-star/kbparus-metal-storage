"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackYandexGoal } from "@/lib/analytics/metrika";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    trackYandexGoal("web_vital", {
      id: metric.id,
      name: metric.name,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      rating: metric.rating,
      navigationType: metric.navigationType
    });
  });

  return null;
}
