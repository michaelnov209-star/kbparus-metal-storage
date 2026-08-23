import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TYPE "public"."enum_users_role" RENAME TO "enum_users_role_legacy";
    CREATE TYPE "public"."enum_users_role" AS ENUM(
      'admin',
      'editor',
      'photographer',
      'director',
      'general_director',
      'sales_manager',
      'engineer',
      'seo_marketer'
    );
    ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "public"."enum_users_role"
      USING "role"::text::"public"."enum_users_role";
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
    DROP TYPE "public"."enum_users_role_legacy";

    CREATE TYPE "public"."enum_users_invitation_status" AS ENUM(
      'active',
      'pending',
      'delivery_failed',
      'revoked'
    );
    ALTER TABLE "users"
      ADD COLUMN "invitation_status" "public"."enum_users_invitation_status" DEFAULT 'active' NOT NULL,
      ADD COLUMN "invited_at" timestamp(3) with time zone,
      ADD COLUMN "invitation_last_sent_at" timestamp(3) with time zone,
      ADD COLUMN "invitation_expires_at" timestamp(3) with time zone,
      ADD COLUMN "invitation_accepted_at" timestamp(3) with time zone,
      ADD COLUMN "invited_by_id" integer;
    ALTER TABLE "users"
      ADD CONSTRAINT "users_invited_by_id_users_id_fk"
      FOREIGN KEY ("invited_by_id")
      REFERENCES "public"."users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    CREATE INDEX "users_invited_by_idx" ON "users" USING btree ("invited_by_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "users"
        WHERE "role"::text IN (
          'director',
          'general_director',
          'sales_manager',
          'engineer',
          'seo_marketer'
        )
      ) THEN
        RAISE EXCEPTION
          'Rollback blocked: reassign users with expanded CMS roles first.';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM "users"
        WHERE "invitation_status"::text <> 'active'
          OR "invited_at" IS NOT NULL
          OR "invitation_last_sent_at" IS NOT NULL
          OR "invitation_expires_at" IS NOT NULL
          OR "invitation_accepted_at" IS NOT NULL
          OR "invited_by_id" IS NOT NULL
      ) THEN
        RAISE EXCEPTION
          'Rollback blocked: invitation history exists and would be lost.';
      END IF;
    END
    $$;

    DROP INDEX "users_invited_by_idx";
    ALTER TABLE "users" DROP CONSTRAINT "users_invited_by_id_users_id_fk";
    ALTER TABLE "users"
      DROP COLUMN "invited_by_id",
      DROP COLUMN "invitation_accepted_at",
      DROP COLUMN "invitation_expires_at",
      DROP COLUMN "invitation_last_sent_at",
      DROP COLUMN "invited_at",
      DROP COLUMN "invitation_status";
    DROP TYPE "public"."enum_users_invitation_status";

    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TYPE "public"."enum_users_role" RENAME TO "enum_users_role_expanded";
    CREATE TYPE "public"."enum_users_role" AS ENUM(
      'admin',
      'editor',
      'photographer'
    );
    ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "public"."enum_users_role"
      USING "role"::text::"public"."enum_users_role";
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
    DROP TYPE "public"."enum_users_role_expanded";
  `);
}
