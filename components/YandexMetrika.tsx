"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent
} from "@/lib/analytics/consent";

export function YandexMetrika() {
  const counterId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || 0);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(getAnalyticsConsent() === true);

    function handleConsent(event: Event) {
      const nextAllowed = (event as CustomEvent<boolean>).detail;
      setAllowed(nextAllowed);
      if (!nextAllowed && counterId && typeof window.ym === "function") {
        try {
          window.ym(counterId, "destruct");
          window.__kbparusMetrikaInitialized = false;
        } catch {
          // Analytics must not affect the public site.
        }
      }
    }

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, [counterId]);

  useEffect(() => {
    if (
      !allowed ||
      !counterId ||
      typeof window.ym !== "function" ||
      window.__kbparusMetrikaInitialized
    ) {
      return;
    }
    try {
      window.ym(counterId, "init", {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: false
      });
      window.__kbparusMetrikaInitialized = true;
    } catch {
      // The inline initializer below handles the first load.
    }
  }, [allowed, counterId]);

  if (!counterId || !Number.isInteger(counterId) || !allowed) return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
        ym(${counterId}, "init", {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: false
        });
        window.__kbparusMetrikaInitialized = true;
      `}
    </Script>
  );
}
