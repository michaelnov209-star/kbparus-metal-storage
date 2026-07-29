import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_lead_management_bitrix24_status"
      ADD VALUE IF NOT EXISTS 'not_used' BEFORE 'planned'
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // PostgreSQL enum values cannot be removed safely in place.
}
