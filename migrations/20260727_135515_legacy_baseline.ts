import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";

/**
 * Records the schema that existed before controlled Payload migrations.
 *
 * The adjacent JSON snapshot is generated from the current Payload schema so
 * future `migrate:create` commands produce incremental diffs. This file must
 * never execute the generated initial CREATE statements against the existing
 * production database.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {
  // The legacy schema already exists in production.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error(
    "The legacy baseline is irreversible. Restore a verified Neon snapshot instead."
  );
}
