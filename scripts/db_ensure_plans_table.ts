/**
 * One-time bootstrap: create Drizzle `plans` table when legacy DB has profiles
 * but never received the full 0000 migration (partial schema from older deploy).
 */
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("❌ DATABASE_URL missing from .env.local");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });

  try {
    const [{ exists }] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'plans'
      ) AS exists
    `;

    if (exists) {
      console.log("✅ plans table already exists — nothing to do.");
      return;
    }

    const [{ profiles }] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
      ) AS profiles
    `;

    if (!profiles) {
      console.error("❌ profiles table missing — run full drizzle migrations first.");
      process.exit(1);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL,
        name text NOT NULL,
        engine text NOT NULL,
        payload jsonb DEFAULT '{}'::jsonb NOT NULL,
        thumbnail_url text,
        status text DEFAULT 'draft' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'plans_user_id_profiles_id_fk'
        ) THEN
          ALTER TABLE plans
            ADD CONSTRAINT plans_user_id_profiles_id_fk
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
      END $$
    `;

    console.log("✅ Created plans table with profiles FK.");
  } catch (error) {
    console.error("❌ Failed to ensure plans table:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
