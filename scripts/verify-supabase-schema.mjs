import pg from "pg";

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required");
}

const expectedTables = [
  "users",
  "organizations",
  "organization_members",
  "events",
  "attendees",
  "matches",
  "meetings",
  "notes",
  "followups",
  "analytics_events",
  "meeting_requests",
  "check_ins",
  "person_enrichments",
  "public_profile_signals",
];

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  const tables = await client.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name
    `,
    [expectedTables]
  );

  const migrations = await client.query(
    "select name from app_migrations.schema_migrations order by name"
  );

  console.log(`tables ${tables.rowCount}/${expectedTables.length}`);
  console.log(migrations.rows.map((row) => `migration ${row.name}`).join("\n"));

  if (tables.rowCount !== expectedTables.length) {
    const found = new Set(tables.rows.map((row) => row.table_name));
    const missing = expectedTables.filter((table) => !found.has(table));
    throw new Error(`Missing tables: ${missing.join(", ")}`);
  }

  if (migrations.rowCount === 0) {
    throw new Error("No applied migrations found");
  }
} finally {
  await client.end();
}
