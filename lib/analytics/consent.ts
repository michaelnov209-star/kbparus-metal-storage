"use client";

export const ANALYTICS_CONSENT_EVENT = "kbparus:analytics-consent-change";
export const ANALYTICS_CONSENT_VERSION = "2026-07-27";

const STORAGE_KEY = "kbparus:analytics-consent";

interface StoredAnalyticsConsent {
  analytics: boolean;
  version: typeof ANALYTICS_CONSENT_VERSION;
  updatedAt: string;
}

export function getAnalyticsConsent(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredAnalyticsConsent>;
    if (
      value.version !== ANALYTICS_CONSENT_VERSION ||
      typeof value.analytics !== "boolean"
    ) {
      return null;
    }
    return value.analytics;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(analytics: boolean) {
  if (typeof window === "undefined") return;
  const value: StoredAnalyticsConsent = {
    analytics,
    version: ANALYTICS_CONSENT_VERSION,
    updatedAt: new Date().toISOString()
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Privacy choice still applies to the current page via the event.
  }

  window.dispatchEvent(
    new CustomEvent<boolean>(ANALYTICS_CONSENT_EVENT, { detail: analytics })
  );
}
