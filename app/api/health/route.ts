import { NextResponse } from "next/server";
import type { GlobalSlug } from "payload";
import { getCmsClient } from "@/lib/cms/client";
import { isSmtpConfigured, smtpSettingsFromEnv } from "@/lib/email/smtp-config";
import { getBitrix24RuntimeConfig } from "@/lib/leads/bitrix24-config";

/**
 * GET /api/health
 *
 * Public, low-detail runtime health endpoint. It exposes only booleans needed
 * by monitoring; provider names, recipients, table names and raw errors stay
 * in server logs.
 */
export const dynamic = "force-static";
export const revalidate = 30;

const REQUIRED_GLOBALS = ["contacts", "home-content", "site-navigation"] as const satisfies readonly GlobalSlug[];

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  components: {
    app: { ok: true };
    cms: {
      ok: boolean;
      configured: boolean;
      requiredContentReadable: boolean;
    };
    storage: { ok: boolean; configured: boolean };
    leadIntegrations: {
      email: { configured: boolean };
      telegram: { configured: boolean };
      bitrix24: { configured: boolean; enabled: boolean };
    };
    analytics: {
      yandexMetrika: { configured: boolean };
    };
  };
}

export async function GET() {
  const bitrix24Config = getBitrix24RuntimeConfig(process.env);
  const smtpSettings = smtpSettingsFromEnv(process.env);
  const cmsConfigured = Boolean(
    process.env.PAYLOAD_SECRET &&
      (
        process.env.DATABASE_URL ||
        process.env.DATABASE_POSTGRES_URL ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL_UNPOOLED ||
        process.env.DATABASE_POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_URL_NON_POOLING
      )
  );
  const result: HealthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    components: {
      app: { ok: true },
      cms: {
        ok: false,
        configured: cmsConfigured,
        requiredContentReadable: false
      },
      storage: {
        ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
      },
      leadIntegrations: {
        email: {
          configured: isSmtpConfigured(smtpSettings)
        },
        telegram: {
          configured: Boolean(
            process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
          )
        },
        bitrix24: {
          configured: bitrix24Config.webhookUrlConfigured,
          enabled: bitrix24Config.enabled
        }
      },
      analytics: {
        yandexMetrika: { configured: Boolean(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID) }
      }
    }
  };

  try {
    const cms = await getCmsClient();
    if (!cms) {
      result.status = "degraded";
    } else {
      await Promise.all(
        REQUIRED_GLOBALS.map((slug) => cms.findGlobal({ slug, depth: 0 }))
      );
      result.components.cms = {
        ok: true,
        configured: true,
        requiredContentReadable: true
      };
    }
  } catch (err) {
    console.error(
      "CMS health check failed",
      err instanceof Error ? err.name : "UnknownError"
    );
    result.status = "degraded";
  }

  if (!result.components.storage.ok) {
    result.status = result.status === "ok" ? "degraded" : result.status;
  }

  const httpStatus = result.status === "ok" ? 200 : result.status === "degraded" ? 200 : 503;
  return NextResponse.json(result, {
    status: httpStatus,
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
