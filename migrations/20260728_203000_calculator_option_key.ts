import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "calculator_profiles_options"
      ADD COLUMN IF NOT EXISTS "option_id" varchar
  `);
  await db.execute(sql`
    ALTER TABLE IF EXISTS "_calculator_profiles_v_version_options"
      ADD COLUMN IF NOT EXISTS "option_id" varchar
  `);
  await db.execute(sql`
    UPDATE "calculator_profiles_options"
    SET "option_id" = "id"
    WHERE "option_id" IS NULL
  `);
  await db.execute(sql`
    UPDATE "_calculator_profiles_v_version_options"
    SET "option_id" = "id"::varchar
    WHERE "option_id" IS NULL
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "_calculator_profiles_v_version_options"
      DROP COLUMN IF EXISTS "option_id"
  `);
  await db.execute(sql`
    ALTER TABLE IF EXISTS "calculator_profiles_options"
      DROP COLUMN IF EXISTS "option_id"
  `);
}
