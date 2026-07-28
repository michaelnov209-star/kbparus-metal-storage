import { Client } from "pg";

const LEGACY_MARKER_NAME = "dev";
const BASELINE_MIGRATION_NAME = "20260727_135515_legacy_baseline";
const LEGACY_CONFIRMATION = "RECLASSIFY_REVIEWED_DEV_SCHEMA";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.DATABASE_POSTGRES_URL_NON_POOLING?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim();

if (!connectionString) {
  throw new Error(
    "A direct PostgreSQL URL is required to reconcile the legacy Payload migration marker."
  );
}

const client = new Client({
  application_name: "kbparus-legacy-migration-reconciliation",
  connectionString,
  connectionTimeoutMillis: 10_000,
  query_timeout: 15_000,
  statement_timeout: 15_000
});

async function reconcileLegacyMarker() {
  let transactionOpen = false;

  try {
    await client.connect();
    await client.query("BEGIN");
    transactionOpen = true;

    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      ["kbparus:payload-migration-transition"]
    );

    const migrationTable = await client.query(
      "SELECT to_regclass('public.payload_migrations') AS table_name"
    );

    if (!migrationTable.rows[0]?.table_name) {
      await client.query("COMMIT");
      transactionOpen = false;
      console.log(
        "[cms-migrate] No legacy migration table exists; reconciliation is not required."
      );
      return;
    }

    const legacyMarkers = await client.query(
      'SELECT id, name, batch FROM "payload_migrations" WHERE batch = -1 ORDER BY id FOR UPDATE'
    );

    if (legacyMarkers.rowCount === 0) {
      await client.query("COMMIT");
      transactionOpen = false;
      console.log(
        "[cms-migrate] No legacy development marker found; reconciliation is not required."
      );
      return;
    }

    if (
      process.env.PAYLOAD_LEGACY_BASELINE_CONFIRMATION !==
      LEGACY_CONFIRMATION
    ) {
      throw new Error(
        `Legacy development schema detected. Set PAYLOAD_LEGACY_BASELINE_CONFIRMATION=${LEGACY_CONFIRMATION} only for the reviewed one-time transition.`
      );
    }

    if (
      legacyMarkers.rowCount !== 1 ||
      legacyMarkers.rows[0]?.name !== LEGACY_MARKER_NAME
    ) {
      throw new Error(
        "Unexpected legacy migration state. Expected exactly one Payload marker named dev with batch -1."
      );
    }

    const marker = legacyMarkers.rows[0];
    const baselineConflict = await client.query(
      'SELECT id FROM "payload_migrations" WHERE name = $1 AND id <> $2 LIMIT 1',
      [BASELINE_MIGRATION_NAME, marker.id]
    );

    if (baselineConflict.rowCount !== 0) {
      throw new Error(
        "The reviewed legacy baseline is already recorded alongside a development marker. Manual investigation is required."
      );
    }

    const updated = await client.query(
      `UPDATE "payload_migrations"
        SET name = $1, batch = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND name = $3 AND batch = -1`,
      [BASELINE_MIGRATION_NAME, marker.id, LEGACY_MARKER_NAME]
    );

    if (updated.rowCount !== 1) {
      throw new Error(
        "The legacy marker changed during reconciliation; no migration was started."
      );
    }

    await client.query("COMMIT");
    transactionOpen = false;
    console.log(
      "[cms-migrate] Reclassified the reviewed legacy schema as the DDL-free baseline. No application tables were modified."
    );
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original reconciliation error.
      }
    }

    const message =
      error instanceof Error ? error.message : "Unknown reconciliation error";
    throw new Error(`Legacy migration reconciliation failed: ${message}`);
  } finally {
    await client.end();
  }
}

await reconcileLegacyMarker();
