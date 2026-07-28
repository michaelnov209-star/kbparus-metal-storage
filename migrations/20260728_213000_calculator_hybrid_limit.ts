import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "calculator_profiles"
      ADD COLUMN IF NOT EXISTS "max_combined_shelf_count" numeric
  `);
  await db.execute(sql`
    ALTER TABLE IF EXISTS "_calculator_profiles_v"
      ADD COLUMN IF NOT EXISTS "version_max_combined_shelf_count" numeric
  `);

  await db.execute(sql`
    UPDATE "calculator_profiles"
    SET "max_combined_shelf_count" = 25
    WHERE "kind" = 'hybrid'
      AND "max_combined_shelf_count" IS NULL
  `);
  await db.execute(sql`
    UPDATE "_calculator_profiles_v"
    SET "version_max_combined_shelf_count" = 25
    WHERE "version_kind" = 'hybrid'
      AND "version_max_combined_shelf_count" IS NULL
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "_calculator_profiles_v"
      DROP COLUMN IF EXISTS "version_max_combined_shelf_count"
  `);
  await db.execute(sql`
    ALTER TABLE IF EXISTS "calculator_profiles"
      DROP COLUMN IF EXISTS "max_combined_shelf_count"
  `);
}
