import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "lead_management"
      ALTER COLUMN "bitrix24_status" SET DEFAULT 'not_used'
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "lead_management"
      ALTER COLUMN "bitrix24_status" SET DEFAULT 'planned'
  `);
}
