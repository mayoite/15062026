# Database Advisors

The `npm.cmd run db:advisors` script (`scripts/db_advisors.ts`) is a standalone replica of Supabase's hosted `get_advisors` MCP tool. It runs the same lint queries Supabase's advisor UI uses, directly against your linked Postgres database, so you can catch security and performance issues without the dashboard.

Lint definitions are sourced from [supabase/splinter](https://github.com/supabase/splinter) — the open-source linter that powers the advisors UI and MCP tool.

> **Prerequisites**: `.env.local` must define `PRODUCTS_DATABASE_URL` (or `SUPABASE_DB_URL`). PowerShell: use `npm.cmd`.

---

## Commands

| Command | Scope |
|---|---|
| `npm.cmd run db:advisors` | Both SECURITY and PERFORMANCE lints against the products DB |
| `npm.cmd run db:advisors:security` | SECURITY lints only |
| `npm.cmd run db:advisors:performance` | PERFORMANCE lints only |
| `npm.cmd run db:advisors:admin` | Same lints against the admin/planner DB (`SUPABASE_AUTH_DATABASE_URL`) |

The `:admin` variant (`scripts/db_advisors_admin.ts`) simply sets `PRODUCTS_DATABASE_URL` to `SUPABASE_AUTH_DATABASE_URL` and reuses the same lint set.

### Output format

Findings are grouped by category (SECURITY then PERFORMANCE) and sorted by severity (ERROR → WARN → INFO). Each finding shows:
- a severity badge,
- the lint title and machine name,
- the number of affected objects,
- the description,
- up to 12 sample object names,
- a one-line `fix:` remediation.

A totals line summarizes ERROR / WARN / INFO counts. If nothing is flagged, it prints `No issues detected. Nice.`

---

## SECURITY lints

### `rls_disabled_in_public` — ERROR

**What**: A table in the `public` schema has Row Level Security disabled.
**Risk**: Anyone with the anon key can read/write all rows via PostgREST.
**Fix**: `ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;` then add policies.

### `policy_exists_rls_disabled` — ERROR

**What**: A table has RLS policies defined but RLS is not enabled, so the policies are inert.
**Risk**: Policies look protective but do nothing; the table is effectively open.
**Fix**: `ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;`

### `rls_enabled_no_policy` — WARN

**What**: RLS is enabled but no policies are defined.
**Risk**: All reads/writes through PostgREST are denied. Sometimes intentional (admin-only via service role) but often unintentional.
**Fix**: Add policies, or confirm the table is meant to be service-role-only.

### `function_search_path_mutable` — WARN

**What**: A `public` schema function does not pin its `search_path`.
**Risk**: A privileged caller's session can be tricked into resolving unqualified names to attacker-controlled objects (search-path injection).
**Fix**: `ALTER FUNCTION <fn>(...) SET search_path = public, pg_temp;` (or `''` for strict).
**Status in this repo**: All public functions are pinned by `20260524233836_pin_function_search_path.sql`.

### `security_definer_view` — WARN

**What**: A view is defined with `SECURITY DEFINER` (or `security_invoker = off`), so it runs with the definer's privileges and bypasses the caller's RLS.
**Risk**: Views can leak rows the caller shouldn't see.
**Fix**: `ALTER VIEW public.<view> SET (security_invoker = on);`
**Status in this repo**: Catalog compatibility views are created `WITH (security_invoker=true)` in `20260307153500`.

---

## PERFORMANCE lints

### `unindexed_foreign_keys` — WARN

**What**: A foreign key column is not covered by an index.
**Risk**: Joins, FK lookups, and cascading delete/update on the parent table do a sequential scan.
**Fix**: `CREATE INDEX ON <table> (<fk columns>);`
**Status in this repo**: Products DB FKs are indexed by `20260524233837_add_foreign_key_indexes.sql` plus `20260620050600_add_missing_indexes.sql` (which adds the remaining common-query and composite indexes). Admin/planner DB FKs are indexed by `platform/drizzle/migrations/0001_add_missing_indexes.sql`.

### `duplicate_index` — WARN

**What**: Two or more indexes on the same table cover the same columns in the same order.
**Risk**: Wastes storage and slows writes (every insert/update maintains all copies).
**Fix**: `DROP INDEX <one of the duplicates>;`
**Status in this repo**: Known duplicates were cleaned by `20260524233838_drop_duplicate_index.sql` and `20260524233840_drop_duplicate_indexes_from_tier3.sql`. The redundant `catalog_product_specs_product_id_idx` (duplicate of the PK) is dropped by `20260620050600_add_missing_indexes.sql`.

### `no_primary_key` — INFO

**What**: A table has no primary key.
**Risk**: Replication, joins, and many ORMs require one; behavior is undefined without it.
**Fix**: `ALTER TABLE public.<table> ADD PRIMARY KEY (<column>);`
**Status in this repo**: `team_members` previously had no PK. `platform/drizzle/migrations/0001_add_missing_indexes.sql` adds a composite PK `(team_id, user_id)`.

---

## Interpreting results

- **ERROR** — fix immediately. These are live security holes (`rls_disabled_in_public`, `policy_exists_rls_disabled`).
- **WARN** — fix before next release. Performance warnings (`unindexed_foreign_keys`, `duplicate_index`) and latent security warnings (`function_search_path_mutable`, `security_definer_view`, `rls_enabled_no_policy`).
- **INFO** — address when convenient (`no_primary_key`).

When a `rls_enabled_no_policy` finding is intentional (e.g. a service-role-only table), leave it as-is — the service role bypasses RLS and the empty policy set correctly denies anon/authenticated access.

---

## Workflow

1. **After applying migrations** — run `npm.cmd run db:advisors` to confirm the migrations achieved their intent (RLS enabled, indexes created, no duplicates).
2. **Before release** — run `npm.cmd run db:advisors:security` as a release gate. Zero ERRORs is the target.
3. **After schema changes** — run `npm.cmd run db:advisors:performance` to catch new unindexed FKs or accidental duplicate indexes.
4. **On the admin DB** — run `npm.cmd run db:advisors:admin` periodically. The admin DB is service-role-accessed, so `rls_enabled_no_policy` findings there are expected and intentional.

### Adding a new lint

Lints are defined in the `lints` array in `scripts/db_advisors.ts`. Each entry has:
- `name` (machine id, matches splinter),
- `title` (human label),
- `level` (`ERROR` | `WARN` | `INFO`),
- `category` (`SECURITY` | `PERFORMANCE`),
- `description`,
- `detectionSql` (the query that returns offending rows),
- `identify` (maps a row to a short display string),
- `remediation` (the `fix:` line).

To add one, append an object to `lints` following the existing shape. The runner picks it up automatically based on its `category`.

---

## Related files

- `scripts/db_advisors.ts` — the advisor runner and lint definitions.
- `scripts/db_advisors_admin.ts` — admin-DB wrapper.
- `platform/supabase/migrations/20260524233836_pin_function_search_path.sql` — fixes `function_search_path_mutable`.
- `platform/supabase/migrations/20260524233839_enable_rls_and_policies.sql` — fixes `rls_disabled_in_public` / `policy_exists_rls_disabled`.
- `platform/supabase/migrations/20260524233837_add_foreign_key_indexes.sql` + `20260620050600_add_missing_indexes.sql` — fix `unindexed_foreign_keys`.
- `platform/supabase/migrations/20260524233838_drop_duplicate_index.sql` + `20260524233840_drop_duplicate_indexes_from_tier3.sql` + `20260620050600_add_missing_indexes.sql` — fix `duplicate_index`.
- `platform/drizzle/migrations/0001_add_missing_indexes.sql` — fixes `no_primary_key` and `unindexed_foreign_keys` on the admin DB.
- `docs/database/SCHEMA.md` — full table/index/RLS reference.
