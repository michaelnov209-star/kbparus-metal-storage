"use client";

const UTM_STORAGE_KEY = "kbparus:lead-utm";
const CALCULATOR_STORAGE_KEY = "kbparus:last-calculator-lead";
const CALCULATOR_TTL_MS = 24 * 60 * 60 * 1000;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_referrer"
] as const;

export interface StoredCalculatorLead {
  calculatorInput: object;
  recommendedConfig?: {
    title?: string;
    dimensions?: string;
    loadKg?: number;
    shelfCount?: number;
    towerCount?: number;
    options?: string[];
  };
  preliminaryPriceFrom?: number;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceImage?: string;
  savedAt: number;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string): T | undefined {
  if (!canUseStorage()) return undefined;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be disabled in private mode. Lead submission must still work.
  }
}

export function captureLeadUtm() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const existing = readJson<Record<string, string>>(UTM_STORAGE_KEY) ?? {};
  const next: Record<string, string> = { ...existing };
  let changed = false;

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      next[key] = value.slice(0, 200);
      changed = true;
    }
  }

  if (!next.utm_referrer && document.referrer) {
    next.utm_referrer = document.referrer.slice(0, 500);
    changed = true;
  }

  if (changed) writeJson(UTM_STORAGE_KEY, next);
}

export function getStoredLeadUtm(): Record<string, string> {
  return readJson<Record<string, string>>(UTM_STORAGE_KEY) ?? {};
}

export function saveLastCalculatorLead(value: Omit<StoredCalculatorLead, "savedAt">) {
  writeJson(CALCULATOR_STORAGE_KEY, { ...value, savedAt: Date.now() });
}

export function getLastCalculatorLead(): StoredCalculatorLead | undefined {
  const value = readJson<StoredCalculatorLead>(CALCULATOR_STORAGE_KEY);
  if (!value?.calculatorInput || Date.now() - value.savedAt > CALCULATOR_TTL_MS) return undefined;
  return value;
}
