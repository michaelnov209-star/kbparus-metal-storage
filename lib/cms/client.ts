import { getPayload } from "payload";
import config from "@payload-config";
import { getPostgresConnectionString } from "@/lib/config/postgres";

/**
 * Безопасный singleton-доступ к Payload Local API.
 *
 * Возвращает payload-клиент или null, если БД недоступна / переменные не заданы
 * (важно для локальной разработки и build-time когда БД не подключена).
 *
 * Все вызовы оборачивайте в try/catch — БД может быть временно недоступна.
 */
export async function getCmsClient() {
  if (
    !getPostgresConnectionString(process.env) ||
    !process.env.PAYLOAD_SECRET
  ) {
    return null;
  }

  try {
    return await getPayload({ config });
  } catch (error) {
    console.warn(
      "[cms] Payload init failed, falling back to defaults:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return null;
  }
}
