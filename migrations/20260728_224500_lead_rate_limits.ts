import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lead_rate_limits" (
      "rate_limit_key" varchar(64) PRIMARY KEY NOT NULL,
      "count" integer DEFAULT 0 NOT NULL,
      "reset_at" timestamp with time zone NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "lead_rate_limits_updated_at_idx"
      ON "lead_rate_limits" USING btree ("updated_at")
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "lead_rate_limits"
  `);
}
