/**
 * Pre-split backup. Dumps every table we are about to drop or move,
 * from BOTH databases, into timestamped SQL files under backups/.
 * Restorable with `psql -f <file>` after recreating the table structure.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env.local") });

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function quoteValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object")
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function dumpTables(
  url: string,
  label: string,
  tables: string[],
): Promise<void> {
  const sql = postgres(url, { prepare: false, max: 1 });
  if (!existsSync("backups")) mkdirSync("backups", { recursive: true });
  const ts = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  const out = `backups/pre-split-${label}-${ts}.sql`;
  const lines: string[] = [
    `-- Backup: ${label} pre-split @ ${new Date().toISOString()}`,
    `-- Tables: ${tables.join(", ")}`,
    "",
  ];
  for (const t of tables) {
    try {
      const rows = (await sql.unsafe(`select * from public.${quoteIdent(t).slice(1, -1)}`)) as unknown as Record<string, unknown>[];
      lines.push(`-- ${t}: ${rows.length} rows`);
      if (rows.length === 0) {
        lines.push("");
        continue;
      }
      const cols = Object.keys(rows[0]);
      const colList = cols.map(quoteIdent).join(", ");
      for (const row of rows) {
        const vals = cols.map((c) => quoteValue(row[c])).join(", ");
        lines.push(
          `INSERT INTO public.${quoteIdent(t)} (${colList}) VALUES (${vals});`,
        );
      }
      lines.push("");
    } catch (err) {
      lines.push(`-- ${t}: ERROR ${(err as Error).message}`);
      lines.push("");
    }
  }
  writeFileSync(out, lines.join("\n"), "utf8");
  console.log(`Wrote ${out}`);
  await sql.end({ timeout: 5 });
}

const PRODUCTS_TABLES_TO_BACKUP = [
  // empty admin-domain tables in oando we will drop
  "clients",
  "customer_queries",
  "quotes",
  "team_members",
  "teams",
  "invites",
  "offices",
  "plan_comments",
  "plan_shares",
  "plan_versions",
  "projects",
  "profiles",
  "user_history",
  // tables with data we will drop after admin owns them
  "plans",
  "users",
];

const ADMIN_TABLES_TO_BACKUP = [
  // catalog duplicates we will drop
  "catalog_products",
  "catalog_categories",
  "catalog_items",
  "catalog_product_images",
  "catalog_product_specs",
  "products",
  "categories",
  "product_images",
  "product_specs",
  "series",
  "__drizzle_migrations",
  // dead better-auth tables we will drop
  "auth_account",
  "auth_session",
  "auth_user",
  "auth_verification",
];

(async () => {
  await dumpTables(
    process.env.PRODUCTS_DATABASE_URL!,
    "products",
    PRODUCTS_TABLES_TO_BACKUP,
  );
  await dumpTables(
    process.env.SUPABASE_AUTH_DATABASE_URL!,
    "admin",
    ADMIN_TABLES_TO_BACKUP,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
