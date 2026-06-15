import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

async function checkDatabaseConnection() {
  console.log("Starting database connection check...");

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("❌ ERROR: DATABASE_URL is missing from .env.local");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, idle_timeout: 5, connect_timeout: 10 });

  try {
    console.log("Connecting to DigitalOcean Postgres...");
    const ping = await sql`SELECT 1 AS connected`;
    if (ping[0]?.connected !== 1) {
      console.error("❌ ERROR: Unexpected ping result", ping);
      process.exit(1);
    }
    console.log("✅ SUCCESS: Database connection established.");

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('plans', 'profiles')
      ORDER BY table_name
    `;
    const names = tables.map((row) => row.table_name as string);
    console.log(`Tables present: ${names.join(", ") || "(none)"}`);

    if (!names.includes("plans")) {
      console.error("❌ ERROR: Drizzle plans table not found — apply drizzle migrations.");
      process.exit(1);
    }

    const [{ n }] = await sql`SELECT count(*)::int AS n FROM plans`;
    console.log(`✅ plans table reachable (${n} rows).`);
  } catch (error) {
    console.error("❌ DB CONNECTION ERROR:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }

  const adminUrl = process.env.SUPABASE_AUTH_DATABASE_URL?.trim();
  const adminKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim();
  if (adminUrl && adminKey) {
    console.log("✅ Admin Supabase env vars present (admin session auth).");
  } else {
    console.warn("⚠️ Admin Supabase env vars missing — admin session auth unverified.");
  }

  process.exit(0);
}

checkDatabaseConnection();
