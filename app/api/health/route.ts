import { NextResponse } from "next/server";
import { getCmsClient } from "@/lib/cms/client";

/**
 * GET /api/health
 *
 * Безопасный health endpoint — НЕ раскрывает секреты, connection strings,
 * env-переменные. Возвращает только агрегированный статус компонентов:
 *  - app:  всегда ok если хэндлер вызвался
 *  - cms:  payload init работает / нет
 *  - db:   список существующих коллекций (только имена, не содержимое)
 *  - storage: настроен ли Blob token
 *
 * Полезно для:
 *  - быстрой диагностики после деплоя ("/api/health возвращает all ok?")
 *  - uptime-мониторинга
 *  - проверки что schema push прошёл (collections > 0)
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  components: {
    app: { ok: true };
    cms:
      | { ok: true; collections: number; collectionNames: string[] }
      | { ok: false; error: string };
    storage: { ok: boolean; configured: boolean };
    leadIntegrations: {
      telegram: { configured: boolean };
      bitrix24: { configured: boolean };
    };
  };
}

export async function GET() {
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
        telegram: {
          configured: Boolean(
            process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
          )
        },
        bitrix24: { configured: Boolean(process.env.BITRIX24_WEBHOOK_URL) }
      }
    }
  };

  // CMS check — пытаемся получить список коллекций
  try {
    const cms = await getCmsClient();
    if (!cms) {
      result.components.cms = { ok: false, error: "CMS not configured (no DATABASE_URL or PAYLOAD_SECRET)" };
      result.status = "degraded";
    } else {
      // Безопасно: только метаданные, не контент
      const collectionNames = Object.keys(cms.collections);
      result.components.cms = {
        ok: true,
        collections: collectionNames.length,
        collectionNames: collectionNames.sort()
      };
    }
  } catch (err) {
    result.components.cms = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error"
    };
    result.status = "degraded";
  }

  if (!result.components.storage.ok) result.status = result.status === "ok" ? "degraded" : result.status;

  const httpStatus = result.status === "ok" ? 200 : result.status === "degraded" ? 200 : 503;
  return NextResponse.json(result, { status: httpStatus });
}
