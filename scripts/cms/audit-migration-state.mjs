import { Client } from "pg";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.DATABASE_POSTGRES_URL_NON_POOLING?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim();

if (!connectionString) {
  throw new Error(
    "Для read-only аудита обязателен direct Postgres URL: DATABASE_URL_UNPOOLED, DATABASE_POSTGRES_URL_NON_POOLING или POSTGRES_URL_NON_POOLING. Fallback на pooled URL запрещён."
  );
}

const client = new Client({
  application_name: "kbparus-migration-readonly-audit",
  connectionString,
  query_timeout: 15_000,
  statement_timeout: 15_000
});

try {
  await client.connect();
  await client.query("BEGIN READ ONLY");

  const migrations = await client.query(
    "SELECT id, name, batch, created_at, updated_at FROM payload_migrations ORDER BY id"
  );
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  const transaction = await client.query("SHOW transaction_read_only");

  await client.query("ROLLBACK");

  process.stdout.write(
    `${JSON.stringify(
      {
        readOnly: transaction.rows[0]?.transaction_read_only === "on",
        migrations: migrations.rows,
        tableCount: tables.rowCount,
        tables: tables.rows.map(({ table_name: tableName }) => tableName)
      },
      null,
      2
    )}\n`
  );
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // The connection may have failed before a transaction was opened.
  }

  const message = error instanceof Error ? error.message : "Unknown database error";
  throw new Error(`Read-only migration audit failed: ${message}`);
} finally {
  await client.end();
}
