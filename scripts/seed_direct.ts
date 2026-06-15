import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const sql = postgres({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  username: 'postgres.erpweaiypimorcunaimz',
  password: 'Buddy@#0212202',
  ssl: 'require',
  max: 1,
});

async function seed() {
  try {
// eslint-disable-next-line no-console
    console.log('📋 Re-applying fixed catalog functions...');
    // Re-apply the fixed migration to update functions with ELSE NULL
    const migrationSql = fs.readFileSync(
      path.resolve(__dirname, '../supabase/migrations/20260309113000_add_canonical_catalog_fields.sql'),
      'utf8'
    );
    // Run the whole migration again (idempotent due to CREATE OR REPLACE)
    await sql.unsafe(migrationSql);
// eslint-disable-next-line no-console
    console.log('✅ Functions updated.');

// eslint-disable-next-line no-console
    console.log('🌱 Running seed_data.sql...');
    let seedSql = fs.readFileSync(
      path.resolve(__dirname, '../scripts/seed_data.sql'),
      'utf8'
    );
    // Route inserts directly to catalog_products/catalog_categories instead of views
    seedSql = seedSql
      .replace(/INSERT INTO products /g, 'INSERT INTO catalog_products ')
      .replace(/INSERT INTO categories /g, 'INSERT INTO catalog_categories ');
    // Split on semicolons and run each statement
    const statements = seedSql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

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
    console.log(`\n✅ Done: ${ok} statements succeeded, ${fail} failed.`);
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await sql.end();
  }
}

seed();
