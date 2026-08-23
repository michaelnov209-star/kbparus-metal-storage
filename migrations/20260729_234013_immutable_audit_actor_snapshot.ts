import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN "updated_by_name" varchar;
  ALTER TABLE "categories" ADD COLUMN "updated_by_role" varchar;
  ALTER TABLE "categories" ADD COLUMN "updated_by_avatar_preset" varchar;
  ALTER TABLE "_categories_v" ADD COLUMN "version_updated_by_name" varchar;
  ALTER TABLE "_categories_v" ADD COLUMN "version_updated_by_role" varchar;
  ALTER TABLE "_categories_v" ADD COLUMN "version_updated_by_avatar_preset" varchar;
  ALTER TABLE "subcategories" ADD COLUMN "updated_by_name" varchar;
  ALTER TABLE "subcategories" ADD COLUMN "updated_by_role" varchar;
  ALTER TABLE "subcategories" ADD COLUMN "updated_by_avatar_preset" varchar;
  ALTER TABLE "_subcategories_v" ADD COLUMN "version_updated_by_name" varchar;
  ALTER TABLE "_subcategories_v" ADD COLUMN "version_updated_by_role" varchar;
  ALTER TABLE "_subcategories_v" ADD COLUMN "version_updated_by_avatar_preset" varchar;
  ALTER TABLE "products" ADD COLUMN "updated_by_name" varchar;
  ALTER TABLE "products" ADD COLUMN "updated_by_role" varchar;
  ALTER TABLE "products" ADD COLUMN "updated_by_avatar_preset" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_updated_by_name" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_updated_by_role" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_updated_by_avatar_preset" varchar;
  ALTER TABLE "calculator_profiles" ADD COLUMN "updated_by_name" varchar;
  ALTER TABLE "calculator_profiles" ADD COLUMN "updated_by_role" varchar;
  ALTER TABLE "calculator_profiles" ADD COLUMN "updated_by_avatar_preset" varchar;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_updated_by_name" varchar;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_updated_by_role" varchar;
  ALTER TABLE "_calculator_profiles_v" ADD COLUMN "version_updated_by_avatar_preset" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP COLUMN "updated_by_name";
  ALTER TABLE "categories" DROP COLUMN "updated_by_role";
  ALTER TABLE "categories" DROP COLUMN "updated_by_avatar_preset";
  ALTER TABLE "_categories_v" DROP COLUMN "version_updated_by_name";
  ALTER TABLE "_categories_v" DROP COLUMN "version_updated_by_role";
  ALTER TABLE "_categories_v" DROP COLUMN "version_updated_by_avatar_preset";
  ALTER TABLE "subcategories" DROP COLUMN "updated_by_name";
  ALTER TABLE "subcategories" DROP COLUMN "updated_by_role";
  ALTER TABLE "subcategories" DROP COLUMN "updated_by_avatar_preset";
  ALTER TABLE "_subcategories_v" DROP COLUMN "version_updated_by_name";
  ALTER TABLE "_subcategories_v" DROP COLUMN "version_updated_by_role";
  ALTER TABLE "_subcategories_v" DROP COLUMN "version_updated_by_avatar_preset";
  ALTER TABLE "products" DROP COLUMN "updated_by_name";
  ALTER TABLE "products" DROP COLUMN "updated_by_role";
  ALTER TABLE "products" DROP COLUMN "updated_by_avatar_preset";
  ALTER TABLE "_products_v" DROP COLUMN "version_updated_by_name";
  ALTER TABLE "_products_v" DROP COLUMN "version_updated_by_role";
  ALTER TABLE "_products_v" DROP COLUMN "version_updated_by_avatar_preset";
  ALTER TABLE "calculator_profiles" DROP COLUMN "updated_by_name";
  ALTER TABLE "calculator_profiles" DROP COLUMN "updated_by_role";
  ALTER TABLE "calculator_profiles" DROP COLUMN "updated_by_avatar_preset";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_updated_by_name";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_updated_by_role";
  ALTER TABLE "_calculator_profiles_v" DROP COLUMN "version_updated_by_avatar_preset";`)
}
