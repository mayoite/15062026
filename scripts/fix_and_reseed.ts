import postgres from 'postgres';

const sql = postgres({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  username: 'postgres.erpweaiypimorcunaimz',
  password: 'Buddy@#0212202',
  ssl: 'require',
  max: 1,
});

async function fix() {
  try {
    // Insert missing category
    await sql`
      INSERT INTO catalog_categories (id, name) VALUES ('oando-workstations', 'Workstations')
      ON CONFLICT (id) DO NOTHING
    `;
// eslint-disable-next-line no-console
    console.log('✅ Added oando-workstations category');

    // Now re-run seed_data.sql for the failed workstation products
    // We know failures were workstation products — re-run the whole seed, idempotent
    const fs = await import('fs');
    const path = await import('path');
    const seedSql = fs.readFileSync(
      path.resolve(__dirname, '../scripts/seed_data.sql'),
      'utf8'
    );
    const statements = seedSql
      .split(/;\s*\n/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith('--'));

    let ok = 0, fail = 0;
    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt + ';');
        ok++;
      } catch (e: unknown) {
        console.error(`  → Error: ${e.message?.split('\n')[0]}`);
        fail++;
      }
    }
// eslint-disable-next-line no-console
    console.log(`\n✅ Re-seed done: ${ok} succeeded, ${fail} failed.`);

    // Verify count
    const count = await sql`SELECT COUNT(*) as cnt FROM catalog_products`;
// eslint-disable-next-line no-console
    console.log(`📦 Total products in DB: ${count[0].cnt}`);
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await sql.end();
  }
}

fix();
