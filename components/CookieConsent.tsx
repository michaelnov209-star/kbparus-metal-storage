"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent
} from "@/lib/analytics/consent";

function useAnalyticsConsentChoice() {
  const [choice, setChoice] = useState<boolean | null | undefined>(undefined);

  useEffect(() => {
    setChoice(getAnalyticsConsent());

    function handleConsent(event: Event) {
      const analytics = (event as CustomEvent<boolean>).detail;
      setChoice(analytics);
    }

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, []);

  const update = useCallback((analytics: boolean) => {
    setChoice(analytics);
    setAnalyticsConsent(analytics);
  }, []);

  return { choice, update };
}

export function CookieConsent() {
  const { choice, update } = useAnalyticsConsentChoice();
  if (choice !== null) return null;

  return (
    <aside
      aria-label="Настройки аналитики"
      className="cookie-consent"
      data-testid="cookie-consent"
      role="region"
    >
      <div>
        <strong>Конфиденциальность без скрытых настроек</strong>
        <p>
          Необходимые функции работают всегда. Яндекс Метрика запускается только
          после вашего разрешения. Подробнее — в{" "}
          <a href="/privacy-policy">политике конфиденциальности</a>.
        </p>
      </div>
      <div className="cookie-consent-actions">
        <button
          className="cookie-secondary"
          data-testid="cookie-reject"
          type="button"
          onClick={() => update(false)}
        >
          Только необходимые
        </button>
        <button
          className="cookie-primary"
          data-testid="cookie-accept"
          type="button"
          onClick={() => update(true)}
        >
          Разрешить аналитику
        </button>
      </div>
    </aside>
  );
}
export function PrivacyAnalyticsControls() {
  const { choice, update } = useAnalyticsConsentChoice();
  const status =
    choice === undefined
      ? "Проверяем настройку…"
      : choice
        ? "Аналитика разрешена"
        : "Аналитика отключена";

  return (
    <div className="privacy-consent-controls">
      <p aria-live="polite" role="status">
        Текущий выбор: <strong>{status}</strong>
      </p>
      <div>
        <button
          className="cookie-secondary"
          type="button"
          onClick={() => update(false)}
        >
          Отключить аналитику
        </button>
        <button
          className="cookie-primary"
          type="button"
          onClick={() => update(true)}
        >
          Разрешить аналитику
        </button>
      </div>
    </div>
  );
}
