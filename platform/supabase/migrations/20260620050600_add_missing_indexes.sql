-- ============================================================
-- Migration: Add missing indexes on FK columns, common query
-- fields, and composite indexes for common query patterns.
--
-- Supabase advisor lints flagged unindexed FKs and common
-- filtering fields. Postgres does NOT auto-index FK columns.
-- Statements use IF NOT EXISTS so the migration is idempotent.
--
-- Scope: products catalog DB (PRODUCTS_DATABASE_URL).
-- The admin/planner DB (Drizzle) is indexed separately via
-- platform/drizzle/migrations/0001_add_missing_indexes.sql.
-- ============================================================

-- ----------------------------------------------------------------
-- 1) catalog_products — common query patterns
-- ----------------------------------------------------------------
-- category_id is already indexed (idx_catalog_products_category_id).
-- slug is covered by the unique constraint.
-- normalized_name_key, canonical_* columns are already indexed.

-- created_at: admin "recently added" lists, ordering, pagination.
create index if not exists idx_catalog_products_created_at
  on public.catalog_products (created_at desc);

-- series_id / series_name: series grouping & lookups.
create index if not exists idx_catalog_products_series_id
  on public.catalog_products (series_id);
create index if not exists idx_catalog_products_series_name
  on public.catalog_products (series_name);

-- status-like filtering via performance_tier (low cardinality; partial
-- index only helps if we query non-null, so a plain btree is fine here).
create index if not exists idx_catalog_products_performance_tier
  on public.catalog_products (performance_tier)
  where performance_tier is not null;

-- Composite: category + created_at powers "newest in category" pages.
create index if not exists idx_catalog_products_category_created_at
  on public.catalog_products (category_id, created_at desc);

-- Composite: category + canonical_subcategory_id for subcategory browse.
create index if not exists idx_catalog_products_category_subcategory
  on public.catalog_products (category_id, canonical_subcategory_id);

-- Composite: series_id + created_at for series page ordering.
create index if not exists idx_catalog_products_series_created_at
  on public.catalog_products (series_id, created_at desc);

-- ----------------------------------------------------------------
-- 2) catalog_product_images — already have lookup + unique indexes,
--    add created_at for admin audit/ordering.
-- ----------------------------------------------------------------
create index if not exists idx_catalog_product_images_created_at
  on public.catalog_product_images (created_at desc);

-- ----------------------------------------------------------------
-- 3) catalog_product_specs — drop the redundant product_id index.
-- product_id is the PRIMARY KEY (1:1 table), so the separate btree
-- index is a pure duplicate flagged by the duplicate_index advisor.
-- ----------------------------------------------------------------
drop index if exists public.catalog_product_specs_product_id_idx;

-- ----------------------------------------------------------------
-- 4) catalog_product_slug_aliases — already have active-alias and
--    active-canonical partial indexes plus canonical_slug from tier3.
--    Add created_at for audit ordering.
-- ----------------------------------------------------------------
create index if not exists idx_catalog_product_slug_aliases_created_at
  on public.catalog_product_slug_aliases (created_at desc);

-- ----------------------------------------------------------------
-- 5) configurator_products — parametric catalog lookups.
--    category & active already indexed. Add family + created_at +
--    composite (category, active) for admin filtered lists.
-- ----------------------------------------------------------------
create index if not exists idx_configurator_products_family
  on public.configurator_products (family);
create index if not exists idx_configurator_products_created_at
  on public.configurator_products (created_at desc);
create index if not exists idx_configurator_products_category_active
  on public.configurator_products (category, active);

-- ----------------------------------------------------------------
-- 6) business_stats_history — FK + time-series audit ordering.
--    business_stats_id is an FK-like column (no constraint, but used
--    for joins to business_stats_current.id). changed_at for history.
-- ----------------------------------------------------------------
create index if not exists idx_business_stats_history_business_stats_id
  on public.business_stats_history (business_stats_id);
create index if not exists idx_business_stats_history_changed_at
  on public.business_stats_history (changed_at desc);

-- ----------------------------------------------------------------
-- 7) customer_queries — CRM dashboard filters.
--    status, created_at, email, phone already indexed. Add source +
--    composite (status, created_at) for the admin inbox query.
-- ----------------------------------------------------------------
create index if not exists customer_queries_source_idx
  on public.customer_queries (source);
create index if not exists customer_queries_status_created_at_idx
  on public.customer_queries (status, created_at desc);

-- ----------------------------------------------------------------
-- 8) block_themes — single-active lookup support.
--    only_one_active_theme partial unique already exists. Add name
--    (admin search) + created_at (admin ordering).
-- ----------------------------------------------------------------
create index if not exists idx_block_themes_name
  on public.block_themes (name);
create index if not exists idx_block_themes_created_at
  on public.block_themes (created_at desc);

-- ----------------------------------------------------------------
-- 9) image_assets — created_by (auth.uid() owner filter in RLS) +
--    product_id already indexed. Add created_by to speed owner-scoped
--    queries (the RLS USING clause filters on created_by).
-- ----------------------------------------------------------------
create index if not exists idx_image_assets_created_by
  on public.image_assets (created_by);
