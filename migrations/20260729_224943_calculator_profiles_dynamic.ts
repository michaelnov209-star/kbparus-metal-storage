import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_calculator_profiles_icon_key" AS ENUM('automation', 'long-products', 'rollout', 'forklift', 'two-sided', 'hybrid');
  CREATE TYPE "public"."enum__calculator_profiles_v_version_icon_key" AS ENUM('automation', 'long-products', 'rollout', 'forklift', 'two-sided', 'hybrid');
  CREATE TABLE "calculator_profiles_rollout_load_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"price" numeric
  );
  
  CREATE TABLE "calculator_profiles_shelf_count_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric
  );
  
  CREATE TABLE "calculator_profiles_rollout_shelf_count_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric
  );
  
  CREATE TABLE "calculator_profiles_tower_count_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric
  );
  
  CREATE TABLE "_calculator_profiles_v_version_rollout_load_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"price" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_calculator_profiles_v_version_shelf_count_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_calculator_profiles_v_version_rollout_shelf_count_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_calculator_profiles_v_version_tower_count_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"_uuid" varchar
  );
  
  ALTER TABLE "calculator_profiles" ALTER COLUMN "slug" SET DATA TYPE varchar;
  ALTER TABLE "calculator_profiles" ALTER COLUMN "kind" SET DEFAULT 'automatic';
  ALTER TABLE "_calculator_profiles_v" ALTER COLUMN "version_slug" SET DATA TYPE varchar;
  ALTER TABLE "_calculator_profiles_v" ALTER COLUMN "version_kind" SET DEFAULT 'automatic';
  ALTER TABLE "calculator_profiles" ADD COLUMN "icon_key" "enum_calculator_profiles_icon_key" DEFAULT 'automation';
  ALTER TABLE "calculator_profiles" ADD COLUMN "sort_order" numeric DEFAULT 100;
  ALTER TABLE "calculator_profiles" ADD COLUMN "best_for" varchar;
  ALTER TABLE "calculator_profiles" ADD COLUMN "console_long_from_mm" numeric DEFAULT 3100;
  ALTER TABLE "calculator_profiles" ADD COLUMN "supports_two_sided" boolean DEFAULT false;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_icon_key" "enum__calculator_profiles_v_version_icon_key" DEFAULT 'automation';
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_sort_order" numeric DEFAULT 100;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_best_for" varchar;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_console_long_from_mm" numeric DEFAULT 3100;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_supports_two_sided" boolean DEFAULT false;
  ALTER TABLE "calculator_profiles_rollout_load_options" ADD CONSTRAINT "calculator_profiles_rollout_load_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."calculator_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "calculator_profiles_shelf_count_options" ADD CONSTRAINT "calculator_profiles_shelf_count_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."calculator_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "calculator_profiles_rollout_shelf_count_options" ADD CONSTRAINT "calculator_profiles_rollout_shelf_count_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."calculator_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "calculator_profiles_tower_count_options" ADD CONSTRAINT "calculator_profiles_tower_count_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."calculator_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_calculator_profiles_v_version_rollout_load_options" ADD CONSTRAINT "_calculator_profiles_v_version_rollout_load_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_calculator_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_calculator_profiles_v_version_shelf_count_options" ADD CONSTRAINT "_calculator_profiles_v_version_shelf_count_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_calculator_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_calculator_profiles_v_version_rollout_shelf_count_options" ADD CONSTRAINT "_calculator_profiles_v_version_rollout_shelf_count_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_calculator_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_calculator_profiles_v_version_tower_count_options" ADD CONSTRAINT "_calculator_profiles_v_version_tower_count_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_calculator_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "calculator_profiles_rollout_load_options_order_idx" ON "calculator_profiles_rollout_load_options" USING btree ("_order");
  CREATE INDEX "calculator_profiles_rollout_load_options_parent_id_idx" ON "calculator_profiles_rollout_load_options" USING btree ("_parent_id");
  CREATE INDEX "calculator_profiles_shelf_count_options_order_idx" ON "calculator_profiles_shelf_count_options" USING btree ("_order");
  CREATE INDEX "calculator_profiles_shelf_count_options_parent_id_idx" ON "calculator_profiles_shelf_count_options" USING btree ("_parent_id");
  CREATE INDEX "calculator_profiles_rollout_shelf_count_options_order_idx" ON "calculator_profiles_rollout_shelf_count_options" USING btree ("_order");
  CREATE INDEX "calculator_profiles_rollout_shelf_count_options_parent_id_idx" ON "calculator_profiles_rollout_shelf_count_options" USING btree ("_parent_id");
  CREATE INDEX "calculator_profiles_tower_count_options_order_idx" ON "calculator_profiles_tower_count_options" USING btree ("_order");
  CREATE INDEX "calculator_profiles_tower_count_options_parent_id_idx" ON "calculator_profiles_tower_count_options" USING btree ("_parent_id");
  CREATE INDEX "_calculator_profiles_v_version_rollout_load_options_order_idx" ON "_calculator_profiles_v_version_rollout_load_options" USING btree ("_order");
  CREATE INDEX "_calculator_profiles_v_version_rollout_load_options_parent_id_idx" ON "_calculator_profiles_v_version_rollout_load_options" USING btree ("_parent_id");
  CREATE INDEX "_calculator_profiles_v_version_shelf_count_options_order_idx" ON "_calculator_profiles_v_version_shelf_count_options" USING btree ("_order");
  CREATE INDEX "_calculator_profiles_v_version_shelf_count_options_parent_id_idx" ON "_calculator_profiles_v_version_shelf_count_options" USING btree ("_parent_id");
  CREATE INDEX "_calculator_profiles_v_version_rollout_shelf_count_options_order_idx" ON "_calculator_profiles_v_version_rollout_shelf_count_options" USING btree ("_order");
  CREATE INDEX "_calculator_profiles_v_version_rollout_shelf_count_options_parent_id_idx" ON "_calculator_profiles_v_version_rollout_shelf_count_options" USING btree ("_parent_id");
  CREATE INDEX "_calculator_profiles_v_version_tower_count_options_order_idx" ON "_calculator_profiles_v_version_tower_count_options" USING btree ("_order");
  CREATE INDEX "_calculator_profiles_v_version_tower_count_options_parent_id_idx" ON "_calculator_profiles_v_version_tower_count_options" USING btree ("_parent_id");

  CREATE TEMP TABLE "calculator_profile_migration_defaults" (
    "slug" varchar PRIMARY KEY,
    "best_for" varchar NOT NULL,
    "icon_key" varchar NOT NULL,
    "sort_order" numeric NOT NULL,
    "shelf_counts" numeric[] NOT NULL,
    "rollout_shelf_counts" numeric[] NOT NULL,
    "tower_counts" numeric[] NOT NULL,
    "supports_two_sided" boolean NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO "calculator_profile_migration_defaults"
    ("slug", "best_for", "icon_key", "sort_order", "shelf_counts", "rollout_shelf_counts", "tower_counts", "supports_two_sided")
  VALUES
    (
      'auto-sheet-metal',
      'Для производства с частым оборотом листов, дефицитом площади и автоматической выдачей.',
      'automation',
      10,
      ARRAY[10, 15, 20, 25]::numeric[],
      ARRAY[]::numeric[],
      ARRAY[1, 2, 3, 4, 5, 6]::numeric[],
      false
    ),
    (
      'auto-sort-metal',
      'Для склада труб, профиля и балок с большим ассортиментом и регулярной комплектацией.',
      'long-products',
      20,
      ARRAY[8, 15, 20, 25]::numeric[],
      ARRAY[]::numeric[],
      ARRAY[1, 2, 3, 4, 5, 6]::numeric[],
      false
    ),
    (
      'rollout-cassette-rack',
      'Для участка, где важен быстрый доступ к каждой пачке без разбора соседних уровней.',
      'rollout',
      30,
      ARRAY[5, 6, 7, 8, 9, 10]::numeric[],
      ARRAY[]::numeric[],
      ARRAY[1, 2, 3, 4, 5, 6]::numeric[],
      false
    ),
    (
      'forklift-cassette-rack',
      'Для склада с погрузчиком, где приоритетны плотность хранения и экономичность.',
      'forklift',
      40,
      ARRAY[5, 10, 15, 20, 25]::numeric[],
      ARRAY[]::numeric[],
      ARRAY[1, 2, 3, 4, 5, 6]::numeric[],
      false
    ),
    (
      'two-side-rollout-rack',
      'Для цеха с двумя проходами или одновременной работой нескольких операторов.',
      'two-sided',
      50,
      ARRAY[5, 6, 7, 8, 9, 10]::numeric[],
      ARRAY[]::numeric[],
      ARRAY[1, 2, 3, 4, 5, 6]::numeric[],
      true
    ),
    (
      'hybrid-rollout-rack',
      'Для предприятия, которому нужны плотное хранение и быстрый доступ к ходовым позициям.',
      'hybrid',
      60,
      ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]::numeric[],
      ARRAY[5, 6, 7, 8, 9, 10]::numeric[],
      ARRAY[1, 2, 3, 4, 5, 6]::numeric[],
      false
    );

  UPDATE "calculator_profiles" AS profile
  SET
    "best_for" = defaults."best_for",
    "icon_key" = defaults."icon_key"::"enum_calculator_profiles_icon_key",
    "sort_order" = defaults."sort_order",
    "console_long_from_mm" = CASE
      WHEN profile."kind" = 'automatic' THEN 3100
      ELSE profile."console_long_from_mm"
    END,
    "supports_two_sided" = defaults."supports_two_sided"
  FROM "calculator_profile_migration_defaults" AS defaults
  WHERE profile."slug" = defaults."slug";

  UPDATE "_calculator_profiles_v" AS version
  SET
    "version_best_for" = defaults."best_for",
    "version_icon_key" = defaults."icon_key"::"enum__calculator_profiles_v_version_icon_key",
    "version_sort_order" = defaults."sort_order",
    "version_console_long_from_mm" = CASE
      WHEN version."version_kind" = 'automatic' THEN 3100
      ELSE version."version_console_long_from_mm"
    END,
    "version_supports_two_sided" = defaults."supports_two_sided"
  FROM "calculator_profile_migration_defaults" AS defaults
  WHERE version."version_slug" = defaults."slug";

  INSERT INTO "calculator_profiles_shelf_count_options"
    ("_order", "_parent_id", "id", "value")
  SELECT
    (choice."ordinality" - 1)::integer,
    profile."id",
    concat('migration-shelf-', profile."id", '-', choice."value"),
    choice."value"
  FROM "calculator_profiles" AS profile
  INNER JOIN "calculator_profile_migration_defaults" AS defaults
    ON defaults."slug" = profile."slug"
  CROSS JOIN LATERAL unnest(defaults."shelf_counts")
    WITH ORDINALITY AS choice("value", "ordinality")
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "calculator_profiles_rollout_shelf_count_options"
    ("_order", "_parent_id", "id", "value")
  SELECT
    (choice."ordinality" - 1)::integer,
    profile."id",
    concat('migration-rollout-shelf-', profile."id", '-', choice."value"),
    choice."value"
  FROM "calculator_profiles" AS profile
  INNER JOIN "calculator_profile_migration_defaults" AS defaults
    ON defaults."slug" = profile."slug"
  CROSS JOIN LATERAL unnest(defaults."rollout_shelf_counts")
    WITH ORDINALITY AS choice("value", "ordinality")
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "calculator_profiles_tower_count_options"
    ("_order", "_parent_id", "id", "value")
  SELECT
    (choice."ordinality" - 1)::integer,
    profile."id",
    concat('migration-tower-', profile."id", '-', choice."value"),
    choice."value"
  FROM "calculator_profiles" AS profile
  INNER JOIN "calculator_profile_migration_defaults" AS defaults
    ON defaults."slug" = profile."slug"
  CROSS JOIN LATERAL unnest(defaults."tower_counts")
    WITH ORDINALITY AS choice("value", "ordinality")
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "_calculator_profiles_v_version_shelf_count_options"
    ("_order", "_parent_id", "value", "_uuid")
  SELECT
    (choice."ordinality" - 1)::integer,
    version."id",
    choice."value",
    concat('migration-shelf-', version."id", '-', choice."value")
  FROM "_calculator_profiles_v" AS version
  INNER JOIN "calculator_profile_migration_defaults" AS defaults
    ON defaults."slug" = version."version_slug"
  CROSS JOIN LATERAL unnest(defaults."shelf_counts")
    WITH ORDINALITY AS choice("value", "ordinality");

  INSERT INTO "_calculator_profiles_v_version_rollout_shelf_count_options"
    ("_order", "_parent_id", "value", "_uuid")
  SELECT
    (choice."ordinality" - 1)::integer,
    version."id",
    choice."value",
    concat('migration-rollout-shelf-', version."id", '-', choice."value")
  FROM "_calculator_profiles_v" AS version
  INNER JOIN "calculator_profile_migration_defaults" AS defaults
    ON defaults."slug" = version."version_slug"
  CROSS JOIN LATERAL unnest(defaults."rollout_shelf_counts")
    WITH ORDINALITY AS choice("value", "ordinality");

  INSERT INTO "_calculator_profiles_v_version_tower_count_options"
    ("_order", "_parent_id", "value", "_uuid")
  SELECT
    (choice."ordinality" - 1)::integer,
    version."id",
    choice."value",
    concat('migration-tower-', version."id", '-', choice."value")
  FROM "_calculator_profiles_v" AS version
  INNER JOIN "calculator_profile_migration_defaults" AS defaults
    ON defaults."slug" = version."version_slug"
  CROSS JOIN LATERAL unnest(defaults."tower_counts")
    WITH ORDINALITY AS choice("value", "ordinality");

  INSERT INTO "calculator_profiles_rollout_load_options"
    ("_order", "_parent_id", "id", "value", "price")
  SELECT
    choice."sort_order",
    profile."id",
    concat('migration-rollout-load-', profile."id", '-', choice."value"),
    choice."value",
    choice."price"
  FROM "calculator_profiles" AS profile
  CROSS JOIN (
    VALUES
      (0, 1500::numeric, 45000::numeric),
      (1, 2000::numeric, 49500::numeric),
      (2, 2500::numeric, 54000::numeric),
      (3, 3000::numeric, 58500::numeric),
      (4, 4000::numeric, 63000::numeric),
      (5, 5000::numeric, 67500::numeric)
  ) AS choice("sort_order", "value", "price")
  WHERE profile."slug" = 'hybrid-rollout-rack'
  ON CONFLICT ("id") DO NOTHING;

  INSERT INTO "_calculator_profiles_v_version_rollout_load_options"
    ("_order", "_parent_id", "value", "price", "_uuid")
  SELECT
    choice."sort_order",
    version."id",
    choice."value",
    choice."price",
    concat('migration-rollout-load-', version."id", '-', choice."value")
  FROM "_calculator_profiles_v" AS version
  CROSS JOIN (
    VALUES
      (0, 1500::numeric, 45000::numeric),
      (1, 2000::numeric, 49500::numeric),
      (2, 2500::numeric, 54000::numeric),
      (3, 3000::numeric, 58500::numeric),
      (4, 4000::numeric, 63000::numeric),
      (5, 5000::numeric, 67500::numeric)
  ) AS choice("sort_order", "value", "price")
  WHERE version."version_slug" = 'hybrid-rollout-rack';

  DROP TYPE "public"."enum_calculator_profiles_slug";
  DROP TYPE "public"."enum__calculator_profiles_v_version_slug";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $calculator_profile_rollback$
   BEGIN
     IF EXISTS (
       SELECT 1
       FROM "calculator_profiles"
       WHERE "slug" NOT IN (
         'auto-sheet-metal',
         'auto-sort-metal',
         'rollout-cassette-rack',
         'forklift-cassette-rack',
         'two-side-rollout-rack',
         'hybrid-rollout-rack'
       )
     ) OR EXISTS (
       SELECT 1
       FROM "_calculator_profiles_v"
       WHERE "version_slug" IS NOT NULL
         AND "version_slug" NOT IN (
           'auto-sheet-metal',
           'auto-sort-metal',
           'rollout-cassette-rack',
           'forklift-cassette-rack',
           'two-side-rollout-rack',
           'hybrid-rollout-rack'
         )
     ) THEN
       RAISE EXCEPTION
         'Rollback blocked: custom calculator profiles exist and cannot be converted to the legacy slug enum.';
     END IF;
   END
   $calculator_profile_rollback$;

   CREATE TYPE "public"."enum_calculator_profiles_slug" AS ENUM('auto-sheet-metal', 'auto-sort-metal', 'rollout-cassette-rack', 'forklift-cassette-rack', 'two-side-rollout-rack', 'hybrid-rollout-rack');
  CREATE TYPE "public"."enum__calculator_profiles_v_version_slug" AS ENUM('auto-sheet-metal', 'auto-sort-metal', 'rollout-cassette-rack', 'forklift-cassette-rack', 'two-side-rollout-rack', 'hybrid-rollout-rack');
  ALTER TABLE "calculator_profiles_rollout_load_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "calculator_profiles_shelf_count_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "calculator_profiles_rollout_shelf_count_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "calculator_profiles_tower_count_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_calculator_profiles_v_version_rollout_load_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_calculator_profiles_v_version_shelf_count_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_calculator_profiles_v_version_rollout_shelf_count_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_calculator_profiles_v_version_tower_count_options" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "calculator_profiles_rollout_load_options" CASCADE;
  DROP TABLE "calculator_profiles_shelf_count_options" CASCADE;
  DROP TABLE "calculator_profiles_rollout_shelf_count_options" CASCADE;
  DROP TABLE "calculator_profiles_tower_count_options" CASCADE;
  DROP TABLE "_calculator_profiles_v_version_rollout_load_options" CASCADE;
  DROP TABLE "_calculator_profiles_v_version_shelf_count_options" CASCADE;
  DROP TABLE "_calculator_profiles_v_version_rollout_shelf_count_options" CASCADE;
  DROP TABLE "_calculator_profiles_v_version_tower_count_options" CASCADE;
  ALTER TABLE "calculator_profiles" ALTER COLUMN "slug" SET DATA TYPE "public"."enum_calculator_profiles_slug" USING "slug"::"public"."enum_calculator_profiles_slug";
  ALTER TABLE "calculator_profiles" ALTER COLUMN "kind" DROP DEFAULT;
  ALTER TABLE "_calculator_profiles_v" ALTER COLUMN "version_slug" SET DATA TYPE "public"."enum__calculator_profiles_v_version_slug" USING "version_slug"::"public"."enum__calculator_profiles_v_version_slug";
  ALTER TABLE "_calculator_profiles_v" ALTER COLUMN "version_kind" DROP DEFAULT;
  ALTER TABLE "calculator_profiles" DROP COLUMN "icon_key";
  ALTER TABLE "calculator_profiles" DROP COLUMN "sort_order";
  ALTER TABLE "calculator_profiles" DROP COLUMN "best_for";
  ALTER TABLE "calculator_profiles" DROP COLUMN "console_long_from_mm";
  ALTER TABLE "calculator_profiles" DROP COLUMN "supports_two_sided";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_icon_key";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_sort_order";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_best_for";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_console_long_from_mm";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_supports_two_sided";
  DROP TYPE "public"."enum_calculator_profiles_icon_key";
  DROP TYPE "public"."enum__calculator_profiles_v_version_icon_key";`)
}
