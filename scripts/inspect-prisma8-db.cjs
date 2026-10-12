
require("dotenv/config");

const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // All diagnostic queries execute in a read-only transaction.
    await client.query("BEGIN TRANSACTION READ ONLY");

    const server = await client.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        current_setting('server_version') AS postgres_version
    `);

    console.log("\nDATABASE INFORMATION");
    console.table(server.rows);

    const registrationStatus = await client.query(`
      SELECT
        e.enumlabel AS enum_value,
        e.enumsortorder AS sort_order
      FROM pg_type AS t
      JOIN pg_enum AS e
        ON e.enumtypid = t.oid
      JOIN pg_namespace AS n
        ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'RegistrationStatus'
      ORDER BY e.enumsortorder
    `);

    console.log("\nLIVE RegistrationStatus ENUM");
    console.table(registrationStatus.rows);

    const paymentProvider = await client.query(`
      SELECT
        column_name,
        data_type,
        udt_name,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Payment'
        AND column_name = 'provider'
    `);

    console.log("\nLIVE Payment.provider COLUMN");
    console.table(paymentProvider.rows);

    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Database inspection failed:", error.message);
  process.exitCode = 1;
});
