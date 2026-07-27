import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "seo_yandex_history" (
      "row_key" varchar(64) PRIMARY KEY,
      "date" date NOT NULL,
      "device" varchar(16) NOT NULL,
      "query" text NOT NULL,
      "page" text NOT NULL DEFAULT '',
      "clicks" bigint NOT NULL DEFAULT 0,
      "impressions" bigint NOT NULL DEFAULT 0,
      "position" double precision,
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "seo_yandex_history_device_check"
        CHECK ("device" IN ('all', 'desktop', 'mobile', 'tablet')),
      CONSTRAINT "seo_yandex_history_clicks_check" CHECK ("clicks" >= 0),
      CONSTRAINT "seo_yandex_history_impressions_check" CHECK ("impressions" >= 0),
      CONSTRAINT "seo_yandex_history_position_check"
        CHECK ("position" IS NULL OR "position" > 0)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "seo_yandex_history_date_device_idx"
      ON "seo_yandex_history" ("date", "device")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "seo_yandex_history_device_date_idx"
      ON "seo_yandex_history" ("device", "date")
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "seo_yandex_sync_days" (
      "date" date NOT NULL,
      "device" varchar(16) NOT NULL,
      "synced_at" timestamptz NOT NULL DEFAULT now(),
      "row_count" integer NOT NULL DEFAULT 0,
      "truncated" boolean NOT NULL DEFAULT false,
      PRIMARY KEY ("date", "device"),
      CONSTRAINT "seo_yandex_sync_days_device_check"
        CHECK ("device" IN ('all', 'desktop', 'mobile', 'tablet')),
      CONSTRAINT "seo_yandex_sync_days_row_count_check" CHECK ("row_count" >= 0)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "seo_yandex_sync_days_synced_at_idx"
      ON "seo_yandex_sync_days" ("synced_at")
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "seo_yandex_collection_runs" (
      "id" bigserial PRIMARY KEY,
      "trigger" varchar(16) NOT NULL,
      "status" varchar(16) NOT NULL,
      "started_at" timestamptz NOT NULL DEFAULT now(),
      "finished_at" timestamptz,
      "window_start" date NOT NULL,
      "window_end" date NOT NULL,
      "devices" text[] NOT NULL DEFAULT '{}',
      "row_count" integer NOT NULL DEFAULT 0,
      "truncated" boolean NOT NULL DEFAULT false,
      "error" text,
      CONSTRAINT "seo_yandex_collection_runs_trigger_check"
        CHECK ("trigger" IN ('cron', 'admin')),
      CONSTRAINT "seo_yandex_collection_runs_status_check"
        CHECK ("status" IN ('running', 'success', 'partial', 'failed')),
      CONSTRAINT "seo_yandex_collection_runs_row_count_check" CHECK ("row_count" >= 0)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "seo_yandex_collection_runs_started_at_idx"
      ON "seo_yandex_collection_runs" ("started_at" DESC)
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "seo_yandex_collection_runs"`);
  await db.execute(sql`DROP TABLE IF EXISTS "seo_yandex_sync_days"`);
  await db.execute(sql`DROP TABLE IF EXISTS "seo_yandex_history"`);
}
