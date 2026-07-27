"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent
} from "@/lib/analytics/consent";
import {
  dispatchYandexPageView,
  shouldRenderYandexMetrika,
  YANDEX_METRIKA_INIT_OPTIONS
} from "@/lib/analytics/metrika-runtime";

type RouteTrackerProps = {
  counterId: number;
  runtimeReady: boolean;
};

function YandexMetrikaRouteTracker({
  counterId,
  runtimeReady
}: RouteTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const previousUrl = useRef("");

  useEffect(() => {
    if (!runtimeReady || getAnalyticsConsent() !== true) return;

    const frame = window.requestAnimationFrame(() => {
      const url = window.location.href;
      if (previousUrl.current === url) return;

      const sent = dispatchYandexPageView({
        counterId,
        consent: getAnalyticsConsent() === true,
        url,
        title: document.title,
        referer: previousUrl.current || document.referrer,
        ym: window.ym
      });
      if (sent) previousUrl.current = url;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [counterId, pathname, runtimeReady, search]);

  return null;
}

export function YandexMetrika() {
  const counterId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || 0);
  const [allowed, setAllowed] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);

  useEffect(() => {
    setAllowed(getAnalyticsConsent() === true);

    function handleConsent(event: Event) {
      const nextAllowed = (event as CustomEvent<boolean>).detail;
      setAllowed(nextAllowed);
      if (!nextAllowed) {
        setRuntimeReady(false);
        if (counterId && typeof window.ym === "function") {
          try {
            window.ym(counterId, "destruct");
            window.__kbparusMetrikaInitialized = false;
          } catch {
            // Analytics must not affect the public site.
          }
        }
      }
    }

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, [counterId]);

  useEffect(() => {
    if (
      !shouldRenderYandexMetrika(counterId, allowed) ||
      typeof window.ym !== "function"
    ) {
      return;
    }
    try {
      if (!window.__kbparusMetrikaInitialized) {
        window.ym(counterId, "init", YANDEX_METRIKA_INIT_OPTIONS);
        window.__kbparusMetrikaInitialized = true;
      }
      setRuntimeReady(true);
    } catch {
      // The inline initializer below handles the first load.
    }
  }, [allowed, counterId]);

  if (!shouldRenderYandexMetrika(counterId, allowed)) return null;

  const initOptions = JSON.stringify(YANDEX_METRIKA_INIT_OPTIONS);

  return (
    <>
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        onReady={() => setRuntimeReady(true)}
      >
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(${counterId}, "init", ${initOptions});
          window.__kbparusMetrikaInitialized = true;
        `}
      </Script>
      <Suspense fallback={null}>
        <YandexMetrikaRouteTracker
          counterId={counterId}
          runtimeReady={runtimeReady}
        />
      </Suspense>
    </>
  );
}
