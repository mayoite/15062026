/**
 * Apply pending local migrations from a per-target folder.
 * - supabase/migrations/         -> products (oando)   PRODUCTS_DATABASE_URL
 * - supabase/migrations.admin/   -> admin              SUPABASE_AUTH_DATABASE_URL
 *
 * State tracked in `_local_migration_history` in the public schema of each
 * target DB. Existing entries from before this change continue to work.
 *
 * Usage:
 *   npm run db:apply                   # apply pending to products
 *   npm run db:apply -- --target admin # apply pending to admin
 *   npm run db:apply -- --dry          # plan only
 */
import { config } from "dotenv";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { resolve, basename } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env.local") });

function pickArg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
}

async function main() {
  const target = pickArg("--target") ?? "products";
  const dry = process.argv.includes("--dry");

  const cfg =
    target === "admin"
      ? {
          url: process.env.SUPABASE_AUTH_DATABASE_URL?.trim(),
          dir: resolve(process.cwd(), "supabase", "migrations.admin"),
          batchPrefix: "20260524",
        }
      : {
          url: process.env.PRODUCTS_DATABASE_URL?.trim(),
          dir: resolve(process.cwd(), "supabase", "migrations"),
          batchPrefix: "20260524",
        };

  if (!cfg.url) {
    console.error(`Missing connection URL for target=${target}`);
    process.exit(1);
  }
  if (!existsSync(cfg.dir)) {
// eslint-disable-next-line no-console
    console.log(`No migrations directory for target=${target} (${cfg.dir})`);
    return;
  }

  const files = readdirSync(cfg.dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const candidates = files.filter((f) => f.startsWith(cfg.batchPrefix));

  if (candidates.length === 0) {
// eslint-disable-next-line no-console
    console.log(`No migrations matching prefix ${cfg.batchPrefix}.`);
    return;
  }

  const sql = postgres(cfg.url, { prepare: false, max: 1 });

  await sql`
    create table if not exists public._local_migration_history (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `;

  const applied = await sql<Array<{ filename: string }>>`
    select filename from public._local_migration_history;
  `;
  const appliedSet = new Set(applied.map((r) => r.filename));

  const plan = candidates.filter((f) => !appliedSet.has(f));

// eslint-disable-next-line no-console
  console.log(`Target: ${target}`);
// eslint-disable-next-line no-console
  console.log(`Migrations to apply:`);
// eslint-disable-next-line no-console
  for (const f of plan) console.log("  -", f);
  if (plan.length === 0) {
// eslint-disable-next-line no-console
    console.log("  (none — all up to date)");
    await sql.end({ timeout: 5 });
    return;
  }
  if (dry) {
    await sql.end({ timeout: 5 });
    return;
  }

  for (const f of plan) {
    const body = readFileSync(resolve(cfg.dir, f), "utf8");
    process.stdout.write(`Applying ${f}... `);
    try {
      // Run as a single multi-statement script (no implicit transaction
      // wrapping; each migration must contain its own BEGIN/COMMIT if needed).
      await sql.unsafe(body);
      await sql`
        insert into public._local_migration_history (filename)
        values (${f});
      `;
// eslint-disable-next-line no-console
      console.log("OK");
    } catch (err) {
// eslint-disable-next-line no-console
      console.log("FAILED");
      console.error(err);
      await sql.end({ timeout: 5 });
      process.exit(1);
    }
  }

  await sql.end({ timeout: 5 });
// eslint-disable-next-line no-console
  console.log("\nAll migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
