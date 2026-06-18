# Database — three stores, one site

*Where catalog paths, CRM, and planner persistence live — and how to verify each.*

---

## One sentence

**Catalog metadata is on products Supabase; CRM and legacy admin tables are on admin Supabase; planner canvas persistence is on DigitalOcean Postgres via Drizzle (`DATABASE_URL`).**

---

## The three databases

| Store | Connection | Host (this env) | Owns |
|-------|------------|-----------------|------|
| **Products Supabase** | `NEXT_PUBLIC_SUPABASE_URL` + anon/service keys | `erpweaiypimorcunaimz.supabase.co` | `products`, `categories`, `catalog_*`, `business_stats_current` |
| **Admin Supabase** | `NEXT_ADMIN_SUPABASE_URL` + `SUPABASE_ADMIN_SERVICE_ROLE_KEY` | `rxzpznmxbaoxpikowmfc.supabase.co` | `customer_queries`, admin `profiles`, `teams`, `clients`, `projects`, … |
| **Planner Postgres** | `DATABASE_URL` (Drizzle) | DigitalOcean managed Postgres | `profiles`, `plans`, `teams`, `team_members`, `invites`, `audit_events` |

R2 (`oando-asset-cdn`) holds catalog **bytes** — not covered here. See [`backend.md`](backend.md).

---

## Which code talks to which DB

| Feature | Client / module | Database |
|---------|-----------------|----------|
| Product pages, FilterGrid, catalog adapters | `platform/supabase/client.ts`, `platform/supabase/admin.ts` | Products Supabase |
| Contact / quote form (`/api/customer-queries`) | `platform/supabase/auth-admin.ts` | Admin Supabase |
| Ops CRM UI (`CustomerQueriesOpsPageView`) | same admin client via API routes | Admin Supabase |
| Planner plan save/load (Drizzle) | `platform/drizzle/db.ts`, plan API routes | `DATABASE_URL` |

**Important:** `profiles` exists on **both** admin Supabase and planner Postgres, with **different columns**. Admin: `display_name`, `avatar_url`. Drizzle: `email`, `name`, `role`. Do not assume one schema fits the other.

---

## Environment variables

Put these in `.env.local` (never commit secrets).

### Products Supabase (catalog)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<products-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_URL=https://<products-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role>
PRODUCTS_DATABASE_URL=postgresql://...   # direct Postgres URL for migrations
```

### Admin Supabase (auth + CRM)

```env
NEXT_ADMIN_SUPABASE_URL=https://<admin-project>.supabase.co
SUPABASE_ADMIN_SERVICE_ROLE_KEY=<service-role>
SUPABASE_AUTH_DATABASE_URL=postgresql://...   # direct Postgres URL for migrations
```

### Planner Postgres (Drizzle)

```env
DATABASE_URL=postgresql://...   # DigitalOcean Postgres
```

### Fallback behavior

| Missing env | Effect |
|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Site catalog falls back to `localCatalogIndex.json` |
| `DATABASE_URL` | Planner plan APIs fail; `release:gate` needs this set |
| `NEXT_ADMIN_SUPABASE_URL` | `/api/customer-queries` and admin CRM routes fail |

---

## Schema sources

| DB | Schema definition | Migrations |
|----|-------------------|------------|
| Products Supabase | `config/database/types/database.types.ts` | `platform/supabase/migrations/` |
| Admin Supabase | `config/database/types/database.admin.types.ts` | `platform/supabase/migrations.admin/` |
| Planner Postgres | `platform/drizzle/schema.ts` | `platform/drizzle/migrations/0000_daffy_longshot.sql` |

### 2026-05 split (products vs admin)

Migration `20260524240000_drop_admin_domain_tables.sql` **removed** CRM, teams, plans, and `customer_queries` from the **products** project. Those tables now live on **admin** Supabase only.

Planner persistence was moved to **`DATABASE_URL`** (Drizzle), not admin Supabase.

---

## Verify commands

Run from repo root with `.env.local` loaded.

```bash
# Planner Postgres — all six Drizzle tables + connection
npm.cmd run db:test

# Apply missing Drizzle tables (idempotent)
npm.cmd run db:sync-drizzle

# Supabase SQL migrations (tracked in _local_migration_history)
npm.cmd run db:apply -- --dry          # products — plan only
npm.cmd run db:apply                   # products — apply
npm.cmd run db:apply:admin -- --dry    # admin — plan only
npm.cmd run db:apply:admin             # admin — apply

# PostgREST / data audits (writes results/audits/)
npm.cmd run audit:supabase:catalog
npm.cmd run audit:supabase:admin
```

### Verified 2026-06-16 (this worktree)

| Check | Result |
|-------|--------|
| `db:test` | OK — 6 Drizzle tables; `plans` 0 rows |
| `db:sync-drizzle` | OK — schema already complete |
| `db:apply` / `db:apply:admin` | OK — all migrations up to date |
| `audit:supabase:catalog` | OK — 85 products, 11 categories; all runtime checks pass |
| `audit:supabase:admin` | OK — `customer_queries` reachable (1 row); CRM insert path works |

Audit artifacts:

- `results/audits/supabase-schema-audit.md` — products
- `results/audits/supabase-admin-schema-audit.md` — admin
- `results/audits/supabase-data-quality-audit.json` — catalog quality counters

---

## Catalog data quality

From latest `audit:supabase:catalog` (2026-06-16):

| Metric | Count | Notes |
|--------|-------|-------|
| Products | 85 | Matches static page merge target |
| Missing alt text | **0** | Fixed — `npm run alt:sync:apply` (85 rows) |
| Missing primary image | **0** | Fixed — `npm run supabase:backfill:images` (83/85; 2 unresolved) |
| Missing subcategory slug/id | 85 | Metadata backfill backlog (`supabase:backfill:canonical`) |
| Duplicate name keys | 1 | `oando-storage` / `prelam` (pedestal, prelam-storage) |

Unresolved image paths (no local catalog match): `oando-storage/Metal`, `oando-storage/Wooden` — see `results/audits/missing-product-images-backfill-report.json`.

### Backfill commands

```bash
npm.cmd run alt:sync:dry          # preview alt text patches
npm.cmd run alt:sync:apply        # persist (OpenAI optional; name+category fallback)
npm.cmd run supabase:backfill:images
```

---

## Drizzle planner tables

Defined in `platform/drizzle/schema.ts`:

| Table | Purpose |
|-------|---------|
| `profiles` | Planner user row (email, name, role) |
| `plans` | Serialized canvas / Zustand payload per user |
| `teams` | Collaboration groups |
| `team_members` | Team membership |
| `invites` | Pending team invites |
| `audit_events` | Planner action audit trail |

`npm.cmd run db:ensure-plans` creates only `plans` if missing. Prefer `db:sync-drizzle` for the full set.

---

## Admin tables (CRM + legacy)

Key table for the marketing site:

| Table | API | Purpose |
|-------|-----|---------|
| `customer_queries` | `POST /api/customer-queries` | Contact / quote submissions |

Ops staff list/update via `/api/customer-queries/manage` (token-gated).

Other admin tables (`clients`, `projects`, `quotes`, `teams`, …) support legacy ops flows; planner teams on Drizzle are separate until unified.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `customer_queries` missing on products audit | Expected after split — table is on **admin** | Run `audit:supabase:admin`, use `auth-admin` client in API |
| PostgREST “schema cache” error | Table dropped but API URL still points at old project | Confirm `NEXT_ADMIN_SUPABASE_URL` vs `NEXT_PUBLIC_SUPABASE_URL` |
| `db:test` missing tables | Partial Drizzle apply | `npm.cmd run db:sync-drizzle` |
| `db:apply` “No migrations directory” | Wrong path (fixed 2026-06-16) | Migrations live under `platform/supabase/` |
| Catalog pages empty | No Supabase env | Set products URL/key or rely on local fallback |

---

## Related

[`backend.md`](backend.md) · [`operations.md`](operations.md) · [`site.md`](site.md) · [`planner.md`](planner.md) · [`docs/SCRIPTS.md`](../SCRIPTS.md) · [`README.md`](README.md)