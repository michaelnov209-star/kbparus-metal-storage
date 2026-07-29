"use client";

import dynamic from "next/dynamic";

import type { SeoReportsInitialState } from "./SeoReportsClient";

const SeoReportsClient = dynamic(
  () =>
    import("./SeoReportsClient").then((module) => module.SeoReportsClient),
  {
    loading: () => (
      <div className="kb-seo-initializing" role="status" aria-live="polite">
        <div>
          <strong>Открываю SEO-аналитику</strong>
          <span>Подключаю отчёты только для этого раздела.</span>
        </div>
      </div>
    )
  }
);

export function LazySeoReportsClient({
  initialState
}: {
  initialState: SeoReportsInitialState;
}) {
  return <SeoReportsClient initialState={initialState} />;
}
