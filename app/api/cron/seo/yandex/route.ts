import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getCmsClient } from "@/lib/cms/client";
import {
  isYandexHistoryEnabled,
  readSeoReportingConfig
} from "@/lib/seo-reporting/config";
import { collectYandexHistory } from "@/lib/seo-reporting/yandex-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADVISORY_LOCK_NAMESPACE = 1263751251;
const ADVISORY_LOCK_KEY = 1497715791;
const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

function validCronAuthorization(request: Request, secret: string): boolean {
  const actual = Buffer.from(
    request.headers.get("authorization") ?? "",
    "utf8"
  );
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Сбор SEO-истории не настроен" },
      { status: 503, headers: privateHeaders }
    );
  }
  if (!validCronAuthorization(request, cronSecret)) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      {
        status: 401,
        headers: {
          ...privateHeaders,
          "www-authenticate": "Bearer"
        }
      }
    );
  }

  if (!isYandexHistoryEnabled()) {
    return NextResponse.json(
      { status: "skipped", reason: "disabled" },
      { status: 200, headers: privateHeaders }
    );
  }

  const cms = await getCmsClient();
  if (!cms) {
    return NextResponse.json(
      { error: "Хранилище временно недоступно" },
      { status: 503, headers: privateHeaders }
    );
  }
  const config = readSeoReportingConfig();
  if (!config.yandex.configured) {
    return NextResponse.json(
      { error: "Яндекс Вебмастер не подключён" },
      { status: 503, headers: privateHeaders }
    );
  }

  const pool = cms.db.pool;
  const lockClient = await pool.connect().catch(() => null);
  if (!lockClient) {
    return NextResponse.json(
      { error: "Хранилище временно недоступно" },
      { status: 503, headers: privateHeaders }
    );
  }

  let transactionOpen = false;
  try {
    await lockClient.query("BEGIN");
    transactionOpen = true;
    const lock = await lockClient.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_xact_lock($1, $2) AS acquired",
      [ADVISORY_LOCK_NAMESPACE, ADVISORY_LOCK_KEY]
    );
    const acquired = lock.rows[0]?.acquired === true;
    if (!acquired) {
      await lockClient.query("ROLLBACK");
      transactionOpen = false;
      return NextResponse.json(
        { status: "skipped", reason: "already_running" },
        { headers: privateHeaders }
      );
    }

    const result = await collectYandexHistory({
      pool,
      config: config.yandex,
      trigger: "cron"
    });
    await lockClient.query("COMMIT");
    transactionOpen = false;
    return NextResponse.json(result, {
      status: result.status === "failed" ? 502 : 200,
      headers: privateHeaders
    });
  } catch (error) {
    if (transactionOpen) {
      await lockClient.query("ROLLBACK").catch(() => undefined);
      transactionOpen = false;
    }

    console.error("[seo-reporting] Yandex history cron failed", error);
    return NextResponse.json(
      { error: "Не удалось обновить SEO-историю" },
      { status: 500, headers: privateHeaders }
    );
  } finally {
    lockClient.release();
  }
}