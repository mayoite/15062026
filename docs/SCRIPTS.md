# Scripts

*Updated: 2026-06-15 — all CLI scripts live in `scripts/` at repo root.*

## What this folder is

`scripts/` holds every one-off CLI tool for the repo: database ops, catalog ingest, audits, launch checks, recovery helpers, and repo documentation. These are **not** part of the Next.js app — they run via `npm run …` or directly with `node` / `npx tsx` / `python`.

**Do not** add new scripts under `tools/` or scattered at repo root. Put them here and wire an `npm` script when the task is recurring.

## Quick commands

| npm script | What it does |
|---|---|
| `npm run tree:csv` | Walk repo → `results/project-tree.csv` |
| `npm run docs:routes` | Regenerate `docs/ops/context/route-classification.md` |
| `npm run tree:xlsx` | CSV + formatted Excel → `results/repo-dir-tree.xlsx` |
| `npm run docs:sync` | Test `INVENTORY.md` + `results/test-*.json` (fast) |
| `npm run docs:sync:all` | Above + all `CONTENTS.md` |
| `npm run docs:sync:coverage` | Sync + Vitest coverage → `results/coverage-summary.json` |
| `npm run docs:check` | Sync + fail if inventory stale (one pass, CI) |
| `npm run docs:check:coverage` | Sync coverage + fail if stale |
| `npm run db:test` | Test Postgres connection |
| `npm run db:apply` | Apply Supabase migrations |
| `npm run catalog:ingest` | Regenerate planner catalog from source data |
| `npm run launch:env` | Validate env vars before deploy |
| `npm run launch:smoke` | Post-deploy smoke checks |
| `npm run scan:secrets` | Scan repo for leaked secrets |

Full `package.json` script list below, grouped by job.

---

## Directory tree & docs

| File | npm script | Purpose |
|---|---|---|
| `generate-tree.js` | `tree:csv` | Recursively scan repo; output `results/project-tree.csv` with 8-level columns + narration |
| `generate-route-classification.mjs` | `docs:routes` | Scan `app/` pages + API routes → `docs/ops/context/route-classification.md` |
| `format-dir-tree-xlsx.mjs` | `tree:xlsx` (2nd step) | Convert CSV → `results/repo-dir-tree.xlsx` with Summary + Directory Tree sheets |
| `generate-docs.mjs` | `docs:sync*` / `docs:check*` | **Single entry** — generate + optional `--check` in one pass |
| `generate-contents-md.mjs` | `docs:sync:all` | `CONTENTS.md` in every major folder |
| `generate-test-inventory.mjs` | `docs:sync` | `tests/INVENTORY.md`, inventory + migration JSON |
| `generate-coverage-summary.mjs` | `docs:sync:coverage` | `results/coverage-summary.json` + `results/coverage/` |
| `analyze-coverage-report.mjs` | `docs:sync:coverage` (after summary) | `results/COVERAGE-REPORT.md` |
| `coverage-metrics.mjs` | used by summary + report | lines from `l` or `statementMap` + `s` |
| `refresh-coverage-summary-from-json.mjs` | manual | refresh `coverage-summary.json` from on-disk JSON (no Vitest) |
| `lib/vitest-excludes.mjs` | — | Parses `vitest.config.ts` test excludes |

Excludes: `node_modules`, `.git`, `.next`, `archive`, `results`, `test-results`, `.vscode`, `public`.

---

## Database & Supabase

| File | npm script | Purpose |
|---|---|---|
| `db_test_connection.ts` | `db:test` | Direct Postgres connection test (bypasses `server-only`) |
| `db_apply_migrations.ts` | `db:apply`, `db:apply:admin` | Apply migration files to linked Supabase |
| `db_ensure_plans_table.ts` | `db:ensure-plans` | Ensure Drizzle `plans` table exists |
| `db_advisors.ts` | `db:advisors`, `db:advisors:security`, `db:advisors:performance` | Run Supabase security/performance advisors |
| `db_advisors_admin.ts` | `db:advisors:admin` | Admin-schema advisor pass |
| `db_gen_admin_types.ts` | `db:types:admin` | Generate admin DB TypeScript types |
| `db_backup_dropped_tables.ts` | `db:backup-dropped` | Backup tables before drop migrations |
| `db_backup_pre_split.ts` | — | Pre-split schema backup (one-off migration aid) |
| `backup_supabase.ts` | `supabase:backup` | Full Supabase backup export |
| `seed.ts` | `seed:direct` | Seed database (direct path) |
| `seed_direct.ts` | — | Alternate direct seed entry |
| `seed_data.sql` | — | Raw SQL seed data |
| `create-bucket.ts` | — | Create Supabase storage bucket |

---

## Catalog & assets

| File | npm script | Purpose |
|---|---|---|
| `ingest-planner-catalog.ts` | `catalog:ingest` | Ingest CSV/catalog → `features/planner/catalog/generatedCatalogItems.ts` |
| `generate_blocks.ts` | `catalog:blocks:qa` | Generate 2D block definitions for QA |
| `render-catalog-qa-sheet.ts` | `catalog:qa:sheet` | Render catalog QA spreadsheet / sheet output |
| `render-three-blocks.ts` | — | Render three sample blocks (dev visual check) |
| `organize-catalog-images.ts` | `catalog:organize:dry`, `:apply`, `:sync` | Organize catalog image files + optional DB sync |
| `arrange_supabase_catalog_assets.ts` | `supabase:assets:arrange` | Arrange assets in Supabase storage |
| `backfill_canonical_catalog_metadata.ts` | `supabase:backfill:canonical` | Backfill canonical catalog metadata |
| `backfill_missing_product_images.ts` | `supabase:backfill:images` | Backfill missing product images |
| `sync_catalog_images.ts` | — | Sync catalog images to storage |
| `sync-missing-alt-text.ts` | `alt:sync:dry`, `alt:sync:apply` | Sync missing image alt text |
| `audit_supabase_catalog.ts` | `audit:supabase:catalog` | Audit Supabase catalog consistency |
| `audit-product-quality.ts` | `audit:products:quality` | Product data quality audit |
| `audit_slug_id_integrity.ts` | `audit:slug-id` | Slug ↔ ID integrity check |
| `migrate-chairs-to-catalog.ts` | — | Migrate chair data into catalog |
| `scrapeAfcChairs.ts` | — | Scrape AFC chair data (ingest source) |
| `fix-chairs-supabase-paths.ts` | — | Fix chair image paths in Supabase |
| `seed_configurator_catalog.ts` | — | Seed configurator catalog (`--verify-only` supported) |
| `seed-catalog-preview.ts` | — | Seed catalog preview data |
| `catalog-preview.ts` | — | Preview catalog ingest output |
| `catalog-seating.json` | — | Seating catalog fixture data |
| `blockRenderUtils.ts` | — | Shared helpers for block rendering scripts |
| `downloadCdnAssets.ts` | — | Download CDN assets locally |

---

## Testing & auth

| File | npm script | Purpose |
|---|---|---|
| `ensureAuthTestUsers.ts` | `test:auth:seed-users` | Create auth test users in Supabase |
| `checkAuthEnv.ts` | `test:auth:env` | Verify auth-related env vars |
| `fix-test-imports.mjs` | — | Bulk-fix test import paths after moves |
| `capture-home.mjs` | — | Capture homepage screenshot (evidence) |
| `capture-responsive.mjs` | — | Capture responsive breakpoint screenshots |
| `screenshot_all_pages.py` | — | Screenshot all site routes |
| `shoot-routes.mjs` | — | Compare route screenshots across two base URLs |
| `tmp-run-features.mjs` | — | Temporary features test runner (dev) |

---

## Launch, audits & quality gate

| File | npm script | Purpose |
|---|---|---|
| `validate-launch-env.mjs` | `launch:env` | Pre-launch environment validation |
| `launch-smoke.mjs` | `launch:smoke` | Post-deploy smoke test |
| `audit-quality-gate.mjs` | — | CI quality gate (lint/test/build checks) |
| `audit-hosted-runtime.mjs` | `audit:hosted:runtime` | Audit hosted runtime asset references |
| `audit_external_asset_hosts.py` | `assets:audit:thirdparty` | Fail if third-party asset hosts are referenced |
| `scan_secrets.mjs` | `scan:secrets` | Scan codebase for secret patterns |
| `runtime-evidence-probe.mjs` | — | Collect runtime evidence for debugging |
| `route_inventory.mjs` | — | List all app routes |

---

## Recovery & session handover

| File | npm script | Purpose |
|---|---|---|
| `recovery-state.mjs` | `recovery:snapshot`, `recovery:watch` | Snapshot repo state; optional watch mode |
| `chat-snapshot.mjs` | `recovery:chat-snapshot` | Snapshot chat/session context |
| `recovery-handover.mjs` | `recovery:handover` | Generate handover summary for next agent |
| `recover-from-transcript.mjs` | — | Recover context from session transcript |
| `read-transcript.mjs` | — | Read and parse session transcript file |

---

## Docs & repo maintenance

| File | npm script | Purpose |
|---|---|---|
| `render_project_docs.mjs` | `project:render`, `planner:render` | Render markdown plan pack → HTML under `results/docs-rendered/` |
| `prepare-review-folders.js` | — | Prepare folder structure for code review |
| `compare-trees.ps1` | — | Compare two directory tree outputs (Windows) |
| `compare-meta.ps1` | — | Compare file metadata between trees |
| `clean-3105.mjs` | — | Clean build artifacts (`--dry-run` supported) |
| `check-header.mjs` | — | Check site header consistency across routes |
| `check-mega.mjs` | — | Check mega-menu behaviour |

---

## CDN & catalog assets

Canonical R2 bucket: **`oando-asset-cdn`**. See `docs/workflow/operations.md`.

| npm script | Script file | Purpose |
|---|---|---|
| `assets:cdn:sync` | `syncVendorCdnAssets.mjs` | Download vendor SDKs into `public/cdn/vendor/` |
| `assets:cdn:catalog` | `downloadCdnAssets.ts` | Pull catalog paths from cloud → local (`asset-cdn/` or `public/`) |
| `assets:cdn:upload` | `uploadCdnAssets.ts` | Push `asset-cdn/` / `public/images` / `public/models` → R2 |
| `assets:cdn:audit` | `auditCdnAssetFailures.ts` | Report missing local/cloud catalog assets |
| `assets:cdn:fix` | `auditCdnAssetFailures.ts --apply` | Apply catalog path fixes |
| `assets:cdn:replacements` | `auditUnresolvedCdnPaths.ts` | Suggest replacements for unresolved paths |
| `assets:r2:create-bucket` | `create-bucket.ts` | Create R2 bucket (default `oando-asset-cdn`) |
| `assets:r2:delete-bucket` | `deleteR2Bucket.ts` | Delete bucket(s); refuses `oando-asset-cdn` |

| Helper (no npm script) | Purpose |
|---|---|
| `count-r2-objects.mjs` | `node scripts/count-r2-objects.mjs [bucket]` |
| `list-r2-buckets.mjs` | `node scripts/list-r2-buckets.mjs` |

Upload flags: `--dry-run`, `--limit=N`, `--only=images|models`, `--force` (overwrite existing keys).

---

## Deploy

| File | npm script | Purpose |
|---|---|---|
| `do-deploy.sh` | — | Generate DigitalOcean `app.generated.yaml` (`--apply` to deploy) |
| `deploy.ps1` | — | Windows wrapper: runs `do-deploy.sh` via Git Bash |

---

## Dev / one-off refactors

| File | Purpose |
|---|---|
| `fast-refactor.js` | Bulk refactor helper |
| `refactor.ts` | ts-morph based refactor |
| `test-morph.ts` | Test ts-morph transforms |
| `fix_and_reseed.ts` | Fix data issues and re-seed |
| `test-r2-upload.ts` | Test Cloudflare R2 upload |

---

## Conventions

1. **TypeScript scripts** — run with `npx tsx scripts/<name>.ts`
2. **Node scripts** — run with `node scripts/<name>.mjs`
3. **Python scripts** — run with `python scripts/<name>.py`
4. **Shell** — `bash scripts/do-deploy.sh` or `pwsh scripts/deploy.ps1`
5. **Outputs** — write evidence to `results/` (audits, screenshots, rendered docs, xlsx trees)
6. **Secrets** — read from `.env.local`; never commit credentials

## Adding a new script

1. Add `scripts/my-task.ts` (or `.mjs` / `.py`)
2. Add a one-line header comment: what it does and how to run it
3. If recurring, add `"my:task": "tsx scripts/my-task.ts"` to `package.json`
4. Document the row in this file under the right section