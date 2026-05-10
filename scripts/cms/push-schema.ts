/**
 * Явный schema push для Payload + Postgres.
 *
 * Вызывается на Vercel build ПЕРЕД `next build`, чтобы:
 *  1. Таблицы users / media / categories / ... были созданы заранее
 *  2. Первый запрос к /admin не падал с "relation does not exist"
 *
 * Технически: getPayload({ config }) триггерит init адаптера, который
 * с push:true вызывает Drizzle db.push(). Это создаёт/обновляет схему
 * на основе TypeScript-определений коллекций.
 *
 * НЕ запускать локально на Windows — tsx + Node 24 падает (см. import-map).
 */

import { getPayload } from "payload";
import config from "../../payload.config";

async function main() {
  const dbUrl =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.log("⚠ Нет DATABASE_URL — пропускаю schema push (build без БД).");
    console.log("  При первом запросе на /admin схема будет push'нута лениво.");
    process.exit(0);
  }

  const isPooled = dbUrl.includes("pooler.") || dbUrl.includes("pgbouncer");
  if (isPooled) {
    console.warn(
      "⚠ Внимание: используется pooled connection. DDL может не работать через pgbouncer."
    );
    console.warn("  Рекомендуется добавить DATABASE_URL_UNPOOLED env-переменную.");
  }

  console.log("→ Инициализация Payload (это триггерит push схемы)...");
  const start = Date.now();

  try {
    await getPayload({ config });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✓ Schema push complete за ${elapsed}s`);
    console.log("  Таблицы созданы или обновлены — /admin готов к первому запросу.");
    process.exit(0);
  } catch (err) {
    console.error("✗ Schema push failed:");
    console.error(err);
    console.error("\nДиагностика:");
    console.error("  - DATABASE_URL правильно настроен?");
    console.error("  - Используется direct connection (DATABASE_URL_UNPOOLED)?");
    console.error("  - PAYLOAD_SECRET задан?");
    console.error("  - Postgres доступен из build environment?");
    process.exit(1);
  }
}

main();
