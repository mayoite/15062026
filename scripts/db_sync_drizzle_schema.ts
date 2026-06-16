/**
 * Apply missing Drizzle tables on DATABASE_URL (DigitalOcean Postgres).
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS for planner schema gaps.
 */
import * as dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

const EXPECTED_TABLES = [
  "profiles",
  "plans",
  "teams",
  "team_members",
  "invites",
  "audit_events",
] as const;

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("❌ DATABASE_URL missing from .env.local");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  const migrationPath = resolve(
    process.cwd(),
    "platform/drizzle/migrations/0000_daffy_longshot.sql",
  );

  try {
    const before = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${[...EXPECTED_TABLES]})
      ORDER BY table_name
    `;
    const beforeSet = new Set(before.map((row) => row.table_name));
    console.log(`Before: ${[...beforeSet].join(", ") || "(none)"}`);

    const missing = EXPECTED_TABLES.filter((name) => !beforeSet.has(name));
    if (missing.length === 0) {
      console.log("✅ Drizzle planner schema complete — nothing to apply.");
      return;
    }

    console.log(`Applying migration for missing tables: ${missing.join(", ")}`);
    const body = readFileSync(migrationPath, "utf8");
    await sql.unsafe(body);

    const after = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${[...EXPECTED_TABLES]})
      ORDER BY table_name
    `;
    console.log(`After: ${after.map((row) => row.table_name).join(", ")}`);
    console.log("✅ Drizzle schema sync finished.");
  } catch (error) {
    console.error("❌ Drizzle schema sync failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();