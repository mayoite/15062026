/**
 * Apply missing Drizzle tables and indexes on DATABASE_URL
 * (DigitalOcean Postgres — the admin/planner DB).
 *
 * Safe to re-run:
 *  - 0000_daffy_longshot.sql is applied only when planner tables are
 *    missing (its CREATE TABLE statements are not IF NOT EXISTS).
 *  - 0001_add_missing_indexes.sql is applied every run because every
 *    statement uses IF NOT EXISTS, so it is fully idempotent.
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
  const migration0000 = resolve(
    process.cwd(),
    "platform/drizzle/migrations/0000_daffy_longshot.sql",
  );
  const migration0001 = resolve(
    process.cwd(),
    "platform/drizzle/migrations/0001_add_missing_indexes.sql",
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
// eslint-disable-next-line no-console
    console.log(`Before: ${[...beforeSet].join(", ") || "(none)"}`);

    // 1) Apply base schema only if tables are missing (0000 is not idempotent).
    const missing = EXPECTED_TABLES.filter((name) => !beforeSet.has(name));
    if (missing.length > 0) {
// eslint-disable-next-line no-console
      console.log(`Applying 0000 for missing tables: ${missing.join(", ")}`);
      const body = readFileSync(migration0000, "utf-8");
      await sql.unsafe(body);

      const after = await sql<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY(${[...EXPECTED_TABLES]})
        ORDER BY table_name
      `;
// eslint-disable-next-line no-console
      console.log(`After: ${after.map((row) => row.table_name).join(", ")}`);
    } else {
// eslint-disable-next-line no-console
      console.log("✅ Drizzle planner tables present.");
    }

    // 2) Always apply index migration — every statement is IF NOT EXISTS.
// eslint-disable-next-line no-console
    console.log("Applying 0001_add_missing_indexes (idempotent)...");
    const indexBody = readFileSync(migration0001, "utf-8");
    await sql.unsafe(indexBody);
// eslint-disable-next-line no-console
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
