import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'hare';
  ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'dog';
  ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'squirrel';
  ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'badger';
  ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'moose';
  ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'cat';
  ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'hedgehog';
  ALTER TYPE "public"."enum_users_avatar_preset" ADD VALUE 'raven';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "users"
  SET "avatar_preset" = 'ember'
  WHERE "avatar_preset" IN ('hare', 'dog', 'squirrel', 'badger', 'moose', 'cat', 'hedgehog', 'raven');
  ALTER TABLE "users" ALTER COLUMN "avatar_preset" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "avatar_preset" SET DEFAULT 'ember'::text;
  DROP TYPE "public"."enum_users_avatar_preset";
  CREATE TYPE "public"."enum_users_avatar_preset" AS ENUM('ember', 'graphite', 'steel', 'copper', 'carbon', 'sand', 'smoke', 'signal');
  ALTER TABLE "users" ALTER COLUMN "avatar_preset" SET DEFAULT 'ember'::"public"."enum_users_avatar_preset";
  ALTER TABLE "users" ALTER COLUMN "avatar_preset" SET DATA TYPE "public"."enum_users_avatar_preset" USING "avatar_preset"::"public"."enum_users_avatar_preset";`)
}
