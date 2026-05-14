import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required");
}

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const migrations = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query("create schema if not exists app_migrations");
  await client.query(`
    create table if not exists app_migrations.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const name of migrations) {
    const existing = await client.query(
      "select 1 from app_migrations.schema_migrations where name = $1",
      [name]
    );
    if (existing.rowCount) {
      console.log(`skip ${name}`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, name), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into app_migrations.schema_migrations (name) values ($1)",
        [name]
      );
      await client.query("commit");
      console.log(`applied ${name}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
