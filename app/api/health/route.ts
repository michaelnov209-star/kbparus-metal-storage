import { NextResponse } from "next/server";
import type { GlobalSlug } from "payload";
import { getCmsClient } from "@/lib/cms/client";
import { getBitrix24RuntimeConfig } from "@/lib/leads/bitrix24-config";

/**
 * GET /api/health
 *
 * Safe runtime health endpoint. It does not expose secrets or connection
 * strings. The CMS check validates both collection metadata and readable
 * global tables, because Payload globals are required by the public site.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const REQUIRED_GLOBALS = ["contacts", "home-content", "site-navigation"] as const satisfies readonly GlobalSlug[];

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  components: {
    app: { ok: true };
    cms:
      | {
          ok: true;
          collections: number;
          collectionNames: string[];
          globals: number;
          globalNames: string[];
        }
      | { ok: false; error: string; collectionNames?: string[]; globalNames?: string[] };
    storage: { ok: boolean; configured: boolean };
    leadIntegrations: {
      email: { configured: boolean; to: string };
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
  const result: HealthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    components: {
      app: { ok: true },
      cms: { ok: false, error: "not initialized" },
      storage: {
        ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
      },
      leadIntegrations: {
        email: {
          configured: Boolean(
            process.env.SMTP_HOST &&
              process.env.SMTP_PORT &&
              process.env.SMTP_USER &&
              process.env.SMTP_PASSWORD &&
              (process.env.SMTP_FROM || process.env.SMTP_USER)
          ),
          to: process.env.LEAD_EMAIL_TO || "info@kbparus.ru"
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
      result.components.cms = {
        ok: false,
        error: "CMS not configured (no DATABASE_URL or PAYLOAD_SECRET)"
      };
      result.status = "degraded";
    } else {
      const collectionNames = Object.keys(cms.collections).sort();
      const globalNames = cms.globals.config.map((global) => global.slug).sort();
      const globalReadErrors: string[] = [];

      for (const slug of REQUIRED_GLOBALS) {
        try {
          await cms.findGlobal({ slug, depth: 0 });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          globalReadErrors.push(`${slug}: ${message}`);
        }
      }

      if (globalReadErrors.length > 0) {
        result.components.cms = {
          ok: false,
          error: `CMS globals are not readable: ${globalReadErrors.join("; ")}`,
          collectionNames,
          globalNames
        };
        result.status = "degraded";
      } else {
        result.components.cms = {
          ok: true,
          collections: collectionNames.length,
          collectionNames,
          globals: globalNames.length,
          globalNames
        };
      }
    }
  } catch (err) {
    result.components.cms = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error"
    };
    result.status = "degraded";
  }

  if (!result.components.storage.ok) {
    result.status = result.status === "ok" ? "degraded" : result.status;
  }

  const httpStatus = result.status === "ok" ? 200 : result.status === "degraded" ? 200 : 503;
  return NextResponse.json(result, { status: httpStatus });
}
