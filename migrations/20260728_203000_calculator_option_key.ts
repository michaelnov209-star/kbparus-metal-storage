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

  // The live array table used a varchar id field as the option business key.
  // Only the version array table has a serial row id.
  await db.execute(sql`
    UPDATE "calculator_profiles_options"
    SET "option_id" = "id"
    WHERE "option_id" IS NULL
  `);

  await db.execute(sql`
    WITH expected_options(parent_slug, option_order, option_title, option_id) AS (
      VALUES
        ('auto-sheet-metal', 0, 'Весы на распалетчик', 'scale'),
        ('auto-sheet-metal', 1, 'Инфракрасные ограждения', 'infrared-safety'),
        ('auto-sheet-metal', 2, 'Вакуумный захват', 'vacuum-grip'),
        ('auto-sheet-metal', 3, 'Консольно-поворотный кран', 'swing-crane'),
        ('auto-sheet-metal', 4, 'Интеграция со складским учетом', 'warehouse-accounting'),
        ('auto-sort-metal', 0, 'Весы на распалетчик', 'scale'),
        ('auto-sort-metal', 1, 'Инфракрасные ограждения', 'infrared-safety'),
        ('auto-sort-metal', 2, 'Вакуумный захват', 'vacuum-grip'),
        ('auto-sort-metal', 3, 'Консольно-поворотный кран', 'swing-crane'),
        ('auto-sort-metal', 4, 'Интеграция со складским учетом', 'warehouse-accounting'),
        ('rollout-cassette-rack', 0, 'Весы на распалетчик', 'scale'),
        ('rollout-cassette-rack', 1, 'Вакуумный захват', 'vacuum-grip'),
        ('rollout-cassette-rack', 2, 'Консольно-поворотный кран', 'swing-crane'),
        ('forklift-cassette-rack', 0, 'Весы на распалетчик', 'scale'),
        ('forklift-cassette-rack', 1, 'Вакуумный захват', 'vacuum-grip'),
        ('forklift-cassette-rack', 2, 'Консольно-поворотный кран', 'swing-crane'),
        ('two-side-rollout-rack', 0, 'Весы на распалетчик', 'scale'),
        ('two-side-rollout-rack', 1, 'Вакуумный захват', 'vacuum-grip'),
        ('two-side-rollout-rack', 2, 'Консольно-поворотный кран', 'swing-crane'),
        ('hybrid-rollout-rack', 0, 'Весы на распалетчик', 'scale'),
        ('hybrid-rollout-rack', 1, 'Вакуумный захват', 'vacuum-grip'),
        ('hybrid-rollout-rack', 2, 'Консольно-поворотный кран', 'swing-crane')
    )
    UPDATE "_calculator_profiles_v_version_options" AS option
    SET "option_id" = expected.option_id
    FROM "_calculator_profiles_v" AS profile_version, expected_options AS expected
    WHERE option."_parent_id" = profile_version."id"
      AND profile_version."version_slug"::text = expected.parent_slug
      AND option."_order" = expected.option_order
      AND option."title" = expected.option_title
      AND option."option_id" IS NULL
  `);

  await db.execute(sql`
    UPDATE "_calculator_profiles_v_version_options" AS option
    SET "option_id" =
      'legacy-' ||
      coalesce(profile_version."version_slug"::text, 'unknown-profile') ||
      '-' ||
      lpad(option."_order"::text, 2, '0') ||
      '-' ||
      substr(md5(coalesce(option."title", '')), 1, 10)
    FROM "_calculator_profiles_v" AS profile_version
    WHERE option."_parent_id" = profile_version."id"
      AND option."option_id" IS NULL
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