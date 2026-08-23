import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { authenticateCmsRequest } from "@/lib/admin/request-auth";
import { readSeoReportingConfig } from "@/lib/seo-reporting";
import { SeoProviderError } from "@/lib/seo-reporting/providers/errors";
import { checkGoogleSearchConsoleConnection } from "@/lib/seo-reporting/providers/google-search-console";
import { checkYandexWebmasterConnection } from "@/lib/seo-reporting/providers/yandex-webmaster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

const CONNECTION_TTL_MS = 5 * 60 * 1000;
const TRANSIENT_RETRY_TTL_MS = 60 * 1000;
const STALE_IF_ERROR_MS = 30 * 60 * 1000;
const TRANSIENT_REASONS = new Set([
  "rateLimitExceeded",
  "userRateLimitExceeded",
  "dailyLimitExceeded",
  "quotaExceeded"
]);

type Provider = "google" | "yandex";

type ConnectionStatus = {
  connected: boolean;
  stale: boolean;
  transient: boolean;
};

type ProviderCache = {
  expiresAt: number;
  fingerprint: string;
  lastSuccessAt: number | null;
  status: ConnectionStatus;
};

type InFlightCheck = {
  fingerprint: string;
  promise: Promise<ConnectionStatus>;
};

const connectionCache: Partial<Record<Provider, ProviderCache>> = {};
const inFlightChecks: Partial<Record<Provider, InFlightCheck>> = {};
const activeFingerprints: Partial<Record<Provider, string>> = {};

function configFingerprint(parts: string[]): string {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}

function isTransientConnectionError(error: unknown): boolean {
  if (error instanceof SeoProviderError) {
    if (error.reason && TRANSIENT_REASONS.has(error.reason)) return true;
    return (
      error.status === 408 ||
      error.status === 425 ||
      error.status === 429 ||
      (typeof error.status === "number" && error.status >= 500)
    );
  }

  return true;
}

function logConnectionError(
  provider: Provider,
  error: unknown,
  transient: boolean
) {
  console.warn(`[seo-reporting] ${provider} connection check failed`, {
    name: error instanceof Error ? error.name : "UnknownError",
    reason: error instanceof SeoProviderError ? error.reason : null,
    status: error instanceof SeoProviderError ? error.status : null,
    transient
  });
}

async function resolveConnectionStatus({
  provider,
  fingerprint,
  check
}: {
  provider: Provider;
  fingerprint: string;
  check: () => Promise<void>;
}): Promise<ConnectionStatus> {
  const now = Date.now();
  let cached = connectionCache[provider];

  if (activeFingerprints[provider] !== fingerprint) {
    activeFingerprints[provider] = fingerprint;
    delete connectionCache[provider];
    delete inFlightChecks[provider];
    cached = undefined;
  }

  if (cached && cached.expiresAt > now) return cached.status;

  const inFlight = inFlightChecks[provider];
  if (inFlight?.fingerprint === fingerprint) return inFlight.promise;

  const promise = (async () => {
    try {
      await check();
      const checkedAt = Date.now();
      const status: ConnectionStatus = {
        connected: true,
        stale: false,
        transient: false
      };
      if (activeFingerprints[provider] === fingerprint) {
        connectionCache[provider] = {
          expiresAt: checkedAt + CONNECTION_TTL_MS,
          fingerprint,
          lastSuccessAt: checkedAt,
          status
        };
      }
      return status;
    } catch (error) {
      const failedAt = Date.now();
      const transient = isTransientConnectionError(error);
      const previous = connectionCache[provider];
      const hasSafeLastSuccess =
        transient &&
        previous?.fingerprint === fingerprint &&
        previous.lastSuccessAt !== null &&
        failedAt - previous.lastSuccessAt <= STALE_IF_ERROR_MS;
      const status: ConnectionStatus = {
        connected: hasSafeLastSuccess,
        stale: hasSafeLastSuccess,
        transient
      };

      logConnectionError(provider, error, transient);
      if (activeFingerprints[provider] === fingerprint) {
        connectionCache[provider] = {
          expiresAt:
            failedAt +
            (transient ? TRANSIENT_RETRY_TTL_MS : CONNECTION_TTL_MS),
          fingerprint,
          lastSuccessAt: transient
            ? previous?.lastSuccessAt ?? null
            : null,
          status
        };
      }
      return status;
    }
  })();

  inFlightChecks[provider] = { fingerprint, promise };
  try {
    return await promise;
  } finally {
    if (inFlightChecks[provider]?.promise === promise) {
      delete inFlightChecks[provider];
    }
  }
}

async function checkGoogle(): Promise<ConnectionStatus> {
  const config = readSeoReportingConfig().google;
  if (!config.configured) {
    delete activeFingerprints.google;
    delete connectionCache.google;
    delete inFlightChecks.google;
    return { connected: false, stale: false, transient: false };
  }

  return resolveConnectionStatus({
    provider: "google",
    fingerprint: configFingerprint([
      config.clientEmail,
      config.siteUrl,
      config.privateKey
    ]),
    check: async () => {
      await checkGoogleSearchConsoleConnection({ config });
    }
  });
}

async function checkYandex(): Promise<ConnectionStatus> {
  const config = readSeoReportingConfig().yandex;
  if (!config.configured) {
    delete activeFingerprints.yandex;
    delete connectionCache.yandex;
    delete inFlightChecks.yandex;
    return { connected: false, stale: false, transient: false };
  }

  return resolveConnectionStatus({
    provider: "yandex",
    fingerprint: configFingerprint([
      config.userId,
      config.hostId,
      config.oauthToken
    ]),
    check: () => checkYandexWebmasterConnection({ config })
  });
}

export async function GET(request: Request) {
  const auth = await authenticateCmsRequest(request, [
    "admin",
    "director",
    "general_director",
    "editor",
    "seo_marketer"
  ]);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: auth.status, headers: privateHeaders }
    );
  }

  const [google, yandex] = await Promise.all([checkGoogle(), checkYandex()]);
  return NextResponse.json(
    {
      google,
      yandex,
      checkedAt: new Date().toISOString()
    },
    { headers: privateHeaders }
  );
}
