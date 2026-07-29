import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_storage_materials"
        AS ENUM ('sheet-metal', 'pipes', 'profiles', 'pallets', 'tooling', 'parts', 'cable', 'mixed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_loading_methods"
        AS ENUM ('manual', 'forklift', 'stacker', 'crane', 'vacuum', 'extractor');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_installation_environments"
        AS ENUM ('workshop', 'warehouse', 'covered-outdoor', 'outdoor');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_operation_mode"
        AS ENUM ('manual', 'mechanized', 'automated');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__products_v_version_storage_materials"
        AS ENUM ('sheet-metal', 'pipes', 'profiles', 'pallets', 'tooling', 'parts', 'cable', 'mixed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__products_v_version_loading_methods"
        AS ENUM ('manual', 'forklift', 'stacker', 'crane', 'vacuum', 'extractor');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__products_v_version_installation_environments"
        AS ENUM ('workshop', 'warehouse', 'covered-outdoor', 'outdoor');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__products_v_version_operation_mode"
        AS ENUM ('manual', 'mechanized', 'automated');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_storage_materials" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_products_storage_materials",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "products_loading_methods" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_products_loading_methods",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "products_installation_environments" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_products_installation_environments",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_storage_materials" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum__products_v_version_storage_materials",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_loading_methods" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum__products_v_version_loading_methods",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_installation_environments" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum__products_v_version_installation_environments",
      "id" serial PRIMARY KEY NOT NULL
    );
  `);

  await db.execute(sql`
    ALTER TABLE IF EXISTS "products_documents"
      ADD COLUMN IF NOT EXISTS "file_id" integer;

    ALTER TABLE IF EXISTS "products"
      ADD COLUMN IF NOT EXISTS "model_name" varchar,
      ADD COLUMN IF NOT EXISTS "operation_mode" "enum_products_operation_mode",
      ADD COLUMN IF NOT EXISTS "max_load_kg" numeric,
      ADD COLUMN IF NOT EXISTS "warranty_months" numeric,
      ADD COLUMN IF NOT EXISTS "overall_dimensions_length_mm" numeric,
      ADD COLUMN IF NOT EXISTS "overall_dimensions_width_mm" numeric,
      ADD COLUMN IF NOT EXISTS "overall_dimensions_height_mm" numeric;

    ALTER TABLE IF EXISTS "_products_v_version_documents"
      ADD COLUMN IF NOT EXISTS "file_id" integer;

    ALTER TABLE IF EXISTS "_products_v"
      ADD COLUMN IF NOT EXISTS "version_model_name" varchar,
      ADD COLUMN IF NOT EXISTS "version_operation_mode" "enum__products_v_version_operation_mode",
      ADD COLUMN IF NOT EXISTS "version_max_load_kg" numeric,
      ADD COLUMN IF NOT EXISTS "version_warranty_months" numeric,
      ADD COLUMN IF NOT EXISTS "version_overall_dimensions_length_mm" numeric,
      ADD COLUMN IF NOT EXISTS "version_overall_dimensions_width_mm" numeric,
      ADD COLUMN IF NOT EXISTS "version_overall_dimensions_height_mm" numeric;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "products_storage_materials"
        ADD CONSTRAINT "products_storage_materials_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_loading_methods"
        ADD CONSTRAINT "products_loading_methods_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_installation_environments"
        ADD CONSTRAINT "products_installation_environments_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v_version_storage_materials"
        ADD CONSTRAINT "_products_v_version_storage_materials_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v_version_loading_methods"
        ADD CONSTRAINT "_products_v_version_loading_methods_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v_version_installation_environments"
        ADD CONSTRAINT "_products_v_version_installation_environments_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_documents"
        ADD CONSTRAINT "products_documents_file_id_media_id_fk"
        FOREIGN KEY ("file_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v_version_documents"
        ADD CONSTRAINT "_products_v_version_documents_file_id_media_id_fk"
        FOREIGN KEY ("file_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_storage_materials_order_idx"
      ON "products_storage_materials" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_storage_materials_parent_idx"
      ON "products_storage_materials" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_loading_methods_order_idx"
      ON "products_loading_methods" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_loading_methods_parent_idx"
      ON "products_loading_methods" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_installation_environments_order_idx"
      ON "products_installation_environments" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_installation_environments_parent_idx"
      ON "products_installation_environments" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_storage_materials_order_idx"
      ON "_products_v_version_storage_materials" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_products_v_version_storage_materials_parent_idx"
      ON "_products_v_version_storage_materials" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_loading_methods_order_idx"
      ON "_products_v_version_loading_methods" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_products_v_version_loading_methods_parent_idx"
      ON "_products_v_version_loading_methods" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_installation_environments_order_idx"
      ON "_products_v_version_installation_environments" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_products_v_version_installation_environments_parent_idx"
      ON "_products_v_version_installation_environments" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_documents_file_idx"
      ON "products_documents" USING btree ("file_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_documents_file_idx"
      ON "_products_v_version_documents" USING btree ("file_id");
  `);

  await db.execute(sql`
    UPDATE "products"
    SET "model_name" = coalesce(nullif("short_title", ''), nullif("title", ''))
    WHERE "model_name" IS NULL;

    UPDATE "_products_v"
    SET "version_model_name" =
      coalesce(nullif("version_short_title", ''), nullif("version_title", ''))
    WHERE "version_model_name" IS NULL;

    ALTER TABLE IF EXISTS "products"
      ALTER COLUMN "no_index" SET DEFAULT false,
      ALTER COLUMN "featured" SET DEFAULT false;

    ALTER TABLE IF EXISTS "_products_v"
      ALTER COLUMN "version_no_index" SET DEFAULT false,
      ALTER COLUMN "version_featured" SET DEFAULT false;

    ALTER TABLE IF EXISTS "site_navigation"
      ALTER COLUMN "catalog_href" SET DEFAULT '/catalog';
  `);

}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "products"
      ALTER COLUMN "no_index" DROP DEFAULT,
      ALTER COLUMN "featured" DROP DEFAULT;

    ALTER TABLE IF EXISTS "_products_v"
      ALTER COLUMN "version_no_index" DROP DEFAULT,
      ALTER COLUMN "version_featured" DROP DEFAULT;

    ALTER TABLE IF EXISTS "site_navigation"
      ALTER COLUMN "catalog_href" SET DEFAULT '#catalog';
  `);

  await db.execute(sql`
    DROP INDEX IF EXISTS "_products_v_version_documents_file_idx";
    DROP INDEX IF EXISTS "products_documents_file_idx";

    ALTER TABLE IF EXISTS "_products_v_version_documents"
      DROP COLUMN IF EXISTS "file_id";
    ALTER TABLE IF EXISTS "products_documents"
      DROP COLUMN IF EXISTS "file_id";

    DROP TABLE IF EXISTS "_products_v_version_installation_environments";
    DROP TABLE IF EXISTS "_products_v_version_loading_methods";
    DROP TABLE IF EXISTS "_products_v_version_storage_materials";
    DROP TABLE IF EXISTS "products_installation_environments";
    DROP TABLE IF EXISTS "products_loading_methods";
    DROP TABLE IF EXISTS "products_storage_materials";

    ALTER TABLE IF EXISTS "_products_v"
      DROP COLUMN IF EXISTS "version_overall_dimensions_height_mm",
      DROP COLUMN IF EXISTS "version_overall_dimensions_width_mm",
      DROP COLUMN IF EXISTS "version_overall_dimensions_length_mm",
      DROP COLUMN IF EXISTS "version_warranty_months",
      DROP COLUMN IF EXISTS "version_max_load_kg",
      DROP COLUMN IF EXISTS "version_operation_mode",
      DROP COLUMN IF EXISTS "version_model_name";

    ALTER TABLE IF EXISTS "products"
      DROP COLUMN IF EXISTS "overall_dimensions_height_mm",
      DROP COLUMN IF EXISTS "overall_dimensions_width_mm",
      DROP COLUMN IF EXISTS "overall_dimensions_length_mm",
      DROP COLUMN IF EXISTS "warranty_months",
      DROP COLUMN IF EXISTS "max_load_kg",
      DROP COLUMN IF EXISTS "operation_mode",
      DROP COLUMN IF EXISTS "model_name";

    DROP TYPE IF EXISTS "public"."enum__products_v_version_operation_mode";
    DROP TYPE IF EXISTS "public"."enum__products_v_version_installation_environments";
    DROP TYPE IF EXISTS "public"."enum__products_v_version_loading_methods";
    DROP TYPE IF EXISTS "public"."enum__products_v_version_storage_materials";
    DROP TYPE IF EXISTS "public"."enum_products_operation_mode";
    DROP TYPE IF EXISTS "public"."enum_products_installation_environments";
    DROP TYPE IF EXISTS "public"."enum_products_loading_methods";
    DROP TYPE IF EXISTS "public"."enum_products_storage_materials";
  `);
}
