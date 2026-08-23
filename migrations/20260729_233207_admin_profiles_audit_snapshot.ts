import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_avatar_preset" AS ENUM('ember', 'graphite', 'steel', 'copper', 'carbon', 'sand', 'smoke', 'signal');
  ALTER TABLE "users" ADD COLUMN "avatar_preset" "enum_users_avatar_preset" DEFAULT 'ember' NOT NULL;
  ALTER TABLE "categories" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_updated_by_id" integer;
  ALTER TABLE "subcategories" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "_subcategories_v" ADD COLUMN "version_updated_by_id" integer;
  ALTER TABLE "products" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_updated_by_id" integer;
  ALTER TABLE "calculator_profiles" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_updated_by_id" integer;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subcategories_v" ADD CONSTRAINT "_subcategories_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "calculator_profiles" ADD CONSTRAINT "calculator_profiles_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_calculator_profiles_v" ADD CONSTRAINT "_calculator_profiles_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categories_updated_by_idx" ON "categories" USING btree ("updated_by_id");
  CREATE INDEX "_categories_v_version_version_updated_by_idx" ON "_categories_v" USING btree ("version_updated_by_id");
  CREATE INDEX "subcategories_updated_by_idx" ON "subcategories" USING btree ("updated_by_id");
  CREATE INDEX "_subcategories_v_version_version_updated_by_idx" ON "_subcategories_v" USING btree ("version_updated_by_id");
  CREATE INDEX "products_updated_by_idx" ON "products" USING btree ("updated_by_id");
  CREATE INDEX "_products_v_version_version_updated_by_idx" ON "_products_v" USING btree ("version_updated_by_id");
  CREATE INDEX "calculator_profiles_updated_by_idx" ON "calculator_profiles" USING btree ("updated_by_id");
  CREATE INDEX "_calculator_profiles_v_version_version_updated_by_idx" ON "_calculator_profiles_v" USING btree ("version_updated_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP CONSTRAINT "categories_updated_by_id_users_id_fk";
  
  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_updated_by_id_users_id_fk";
  
  ALTER TABLE "subcategories" DROP CONSTRAINT "subcategories_updated_by_id_users_id_fk";
  
  ALTER TABLE "_subcategories_v" DROP CONSTRAINT "_subcategories_v_version_updated_by_id_users_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_updated_by_id_users_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_updated_by_id_users_id_fk";
  
  ALTER TABLE "calculator_profiles" DROP CONSTRAINT "calculator_profiles_updated_by_id_users_id_fk";
  
  ALTER TABLE "_calculator_profiles_v" DROP CONSTRAINT "_calculator_profiles_v_version_updated_by_id_users_id_fk";
  
  DROP INDEX "categories_updated_by_idx";
  DROP INDEX "_categories_v_version_version_updated_by_idx";
  DROP INDEX "subcategories_updated_by_idx";
  DROP INDEX "_subcategories_v_version_version_updated_by_idx";
  DROP INDEX "products_updated_by_idx";
  DROP INDEX "_products_v_version_version_updated_by_idx";
  DROP INDEX "calculator_profiles_updated_by_idx";
  DROP INDEX "_calculator_profiles_v_version_version_updated_by_idx";
  ALTER TABLE "users" DROP COLUMN "avatar_preset";
  ALTER TABLE "categories" DROP COLUMN "updated_by_id";
  ALTER TABLE "_categories_v" DROP COLUMN "version_updated_by_id";
  ALTER TABLE "subcategories" DROP COLUMN "updated_by_id";
  ALTER TABLE "_subcategories_v" DROP COLUMN "version_updated_by_id";
  ALTER TABLE "products" DROP COLUMN "updated_by_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_updated_by_id";
  ALTER TABLE "calculator_profiles" DROP COLUMN "updated_by_id";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_updated_by_id";
  DROP TYPE "public"."enum_users_avatar_preset";`)
}
