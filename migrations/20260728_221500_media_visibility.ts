import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "media"
      ADD COLUMN IF NOT EXISTS "publicly_available" boolean DEFAULT true NOT NULL
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "media"
      DROP COLUMN IF EXISTS "publicly_available"
  `);
}
