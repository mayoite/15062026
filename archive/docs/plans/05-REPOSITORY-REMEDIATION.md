# 05 - Repository Remediation Plan

*Revised: 2026-06-11 - reflects current reality: 3 databases, broken Drizzle config, missing planner_saves schema, hybrid persistence split.*

---

## Objective

Turn the repository into one understandable, testable Next.js product with:

- one planner
- one canonical planner document
- thin routes
- explicit module ownership
- reliable validation
- no active code hidden behind legacy roots or suppressed TypeScript errors

---

## Current Reality: Three Databases

This codebase talks to three separate databases. Each has a different client, different env vars, and different owner. The split is intentional but currently underdocumented and partially broken.

### 1. DigitalOcean Postgres via Drizzle ORM

- **Env var**: DATABASE_URL
- **Client**: platform/drizzle/db.ts exported as db
- **Schema file**: platform/drizzle/schema.ts
- **Migrations**: platform/drizzle/migrations/ (one file: 0000_daffy_longshot.sql)
- **Tables defined**: profiles, plans, teams, team_members, invites, audit_events
- **Active consumers**: features/buddy-planner/lib/teams/teamRepository.ts, features/buddy-planner/lib/auditRepository.ts
- **Intended role**: Server-owned app data - user profiles (mapped to Appwrite user IDs), saved plans, team collaboration, audit trail

**Broken config**: platform/drizzle/drizzle.config.ts calls dotenv.config with path ../../.env.local. This resolves two directories above the repo root when drizzle-kit runs from the repo root. DATABASE_URL is never loaded. All drizzle-kit commands (generate, push, migrate, studio) silently fail to connect.

**Fix required**: Change path to .env.local

### 2. Supabase Catalog DB

- **Env vars**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- **Clients**: platform/supabase/client.ts, platform/supabase/server.ts, platform/supabase/safe.ts
- **Also exported from**: platform/drizzle/db.ts as supabase (legacy shim - keeps public catalog reads working during migration; must not be used for planner saves or user data)
- **Migrations**: platform/supabase/migrations/ (26 files)
- **Tables**: catalog_products, catalog_categories, catalog_product_specs, catalog_product_images, catalog_product_slug_aliases, catalog_items, series, configurator_products, block_themes, business_stats_current
- **Active consumers**: lib/catalog/sources.ts, lib/catalog/catalogTree.ts, lib/productDataTables.ts, lib/productSlugResolver.ts, features/crm/businessStats.ts, app/api/tracking/route.ts
- **Intended role**: Public product catalog - read-mostly, publicly accessible via RLS anon policies

### 3. Supabase Admin DB

- **Env vars**: NEXT_ADMIN_SUPABASE_URL, SUPABASE_ADMIN_SERVICE_ROLE_KEY
- **Client**: platform/supabase/auth-admin.ts - createSupabaseAuthAdminClient()
- **Migrations**: platform/supabase/migrations.admin/ (3 files)
- **Tables with tracked migrations**: user_history, customer_queries, profiles, teams, team_members, invites, offices
- **Tables claimed by code comments but with no migration**: plans, plan_versions, plan_comments, plan_shares, planner_settings, clients, quotes, templates
- **Active consumers**: app/api/tracking/route.ts, app/api/plans/route.ts, app/api/admin/plans/route.ts, app/api/admin/analytics/route.ts, features/planner/store/plannerPersistence.ts, features/planner/store/plannerSaves.ts
- **Intended role**: User-scoped data, CRM, planner saves, auth extension

---

## Critical Missing Schema: planner_saves

planner_saves is the active persistence table for the space planner. It is written to by multiple live code paths:

- features/planner/store/plannerPersistence.ts - CRUD (save, load, list, delete)
- app/api/plans/route.ts - upsert
- app/api/admin/plans/route.ts - admin read/update/delete
- app/api/admin/analytics/route.ts - analytics read (item_count, room_width_mm, room_depth_mm)

**The problem**: No SQL migration in any of the three migration directories (platform/drizzle/migrations/, platform/supabase/migrations/, platform/supabase/migrations.admin/) defines planner_saves. The table either exists in the database without a tracked migration, or it does not exist at all and all save operations silently fail.

The Drizzle schema defines a plans table with different columns (engine, payload, thumbnail_url, status) from what plannerPersistence.ts inserts into planner_saves (item_count, room_width_mm, room_depth_mm). These are two different tables, not the same one.

**Fix required**: Read features/planner/store/plannerPersistence.ts to derive the exact column contract, then write and apply a migration to platform/supabase/migrations.admin/. Confirm the table exists in the admin DB before touching any other persistence code.

---

## Hybrid Persistence Decision (Confirmed)

This is the approved database split. Do not consolidate unless a reviewed decision record authorizes it.

| Data domain | Database | Client |
|---|---|---|
| Product catalog (public read) | Supabase catalog DB | platform/supabase/client.ts or server.ts |
| Planner saves, user history, CRM, offices | Supabase admin DB | platform/supabase/auth-admin.ts |
| Profiles, teams, collaboration, audit trail | DigitalOcean Postgres | platform/drizzle/db.ts (db) |

The supabase export in platform/drizzle/db.ts is a legacy shim pointing at the catalog DB. It must not be used for planner saves or user data.

---

## Proven Problems

1. **Drizzle config broken**: platform/drizzle/drizzle.config.ts uses ../../.env.local - resolves wrong from repo root. All drizzle-kit commands fail silently.

2. **planner_saves has no tracked migration**: Active code reads and writes it. No SQL file defines it. Unknown if the table exists in production.

3. **Planner code split across 714 files**:
   - features/planner/ - 220 files (canonical target)
   - features/oando-planner/ - 307 files (legacy; 176 active imports remain)
   - features/buddy-planner/ - 187 files (legacy; auth cycle, active API consumers)

4. **Two conflicting PlannerDocument types**:
   - features/planner/model/plannerDocument.ts
   - features/planner/shared/document/types.ts
   Both imported by live code. Cascades into ~294 TypeScript errors.

5. **typescript.ignoreBuildErrors: true** in config/build/next.config.js - all build-time type failures are suppressed. Must stay until the active build is clean, then must be removed.

6. **Jest configuration broken**: References removed apps/site and packages/features paths. Advertised setup files do not exist. Planner tests do not execute.

7. **features/ops-portal/** contains a separate Vite app with its own node_modules, lockfile, and build output. The root dev:ops script points elsewhere.

8. **features/shared -> features/buddy-planner dependency cycle**: features/shared/auth/ imports from buddy-planner. Shared modules must not import any feature.

9. **Shared entry code imports from app/**: Reverses the intended dependency direction.

10. **@/components/draw/* alias**: Stale alias used by live code but mapped to removed monorepo paths in Jest.

11. **Quote handoff lives in browser-only localStorage**: No server record. A browser crash loses the quote.

12. **Navigation and accessibility test suites** reference missing entrypoints.

13. **Deployment configuration** mixes Next.js, Vercel, OpenNext, and Cloudflare assumptions with no documented single deployment owner.

---

## Target Structure

Keep one deployable Next.js application. No monorepo unless an independently deployed app is proven necessary.

```
src/
  app/                         # Next.js routes and route handlers only
  modules/
    planner/
      domain/                  # document, geometry, units, catalog contracts
      application/             # commands and use cases
      infrastructure/          # tldraw, R3F, persistence, external adapters
      ui/                      # workspace, inspector, catalog, marketing
      index.ts                 # deliberate public API
    catalog/
    auth/
    crm/
    ops/
    site-assistant/
  shared/
    ui/
    lib/
    config/
  server/
    database/
    auth/
    integrations/
tests/
  e2e/
  integration/
platform/                      # migrations and provider-owned artifacts only
tools/                         # maintenance and generation scripts
public/
archive/
```

Root configuration stays at root: package.json, next.config.js, tsconfig.json, env files, tool config.

---

## Dependency Direction

```
app -> modules/*/ui or modules/*/application
ui -> application + domain
application -> domain + declared ports
infrastructure -> domain + external libraries
server -> application + infrastructure
shared -> no feature imports
domain -> no React, Next.js, Supabase, Tldraw, or R3F imports
```

Forbidden:

- shared importing a feature
- one feature importing another feature's internals
- route handlers containing business logic
- domain types importing database or UI types
- compatibility roots owning active behavior

---

## Migration Phases

### Phase 0 - Restore Trust

Immediate, unblocking fixes. Do these before anything else.

**Database fixes (do first):**

- [ ] Fix platform/drizzle/drizzle.config.ts: change ../../.env.local to .env.local
- [ ] Verify npx drizzle-kit studio connects successfully from repo root
- [ ] Read features/planner/store/plannerPersistence.ts to derive the exact column contract for planner_saves
- [ ] Write the planner_saves migration and add it to platform/supabase/migrations.admin/
- [ ] Apply the migration and confirm the table exists in the admin DB
- [ ] Confirm which Supabase URL app/api/plans/route.ts connects to and verify it is the admin DB

**Tooling fixes:**

- [ ] Repair Jest roots, aliases, and setup file references - remove apps/site and packages/features paths
- [ ] Recreate or deliberately delete every missing test entrypoint referenced in package.json
- [ ] Write all test output under results/
- [ ] Remove or migrate @/components/draw/* alias consumers
- [ ] Add a scoped active-planner tsconfig for targeted type checking
- [ ] Inventory TypeScript failures by category: active code vs compatibility shims vs dead code
- [ ] Add import-boundary checks

**Code fixes:**

- [ ] Break features/shared -> features/buddy-planner cycle: move the 6 auth files to @/lib/auth/
- [ ] Remove shared -> app/ imports

Gate - Phase 0 complete when:

- npx drizzle-kit generate runs from repo root without error
- planner_saves has a tracked migration and exists in the admin DB
- Planner tests execute (logic failures acceptable)
- Active planner lint and typecheck run (errors visible, not suppressed)
- Build failures are visible, not hidden behind ignoreBuildErrors

---

### Phase 1 - Canonical Contracts

- Pick one PlannerDocument - features/planner/model/plannerDocument.ts is the canonical target; deprecate features/planner/shared/document/types.ts
- Define schema versioning and migration strategy for saved documents
- Define catalog item, placed item, BOQ, quote, and 3D asset contracts
- Add round-trip tests: canvas -> document -> persistence -> document -> canvas
- Make unit conversion explicit and tested
- Clarify which Supabase client owns planner_saves - it must be exactly one

Gate:

- One exported PlannerDocument
- Persistence and export both consume it
- Legacy formats migrate through tested adapters

---

### Phase 2 - Remove Legacy Dependencies

Migrate what can migrate now (from MIGRATION-STATUS.md):

- ~40 files in features/oando-planner/ui/editor/ and lib/ where canonical equivalents already exist in features/planner/store/
- 6 files in features/shared/auth/ that import from buddy-planner

Then:

- Move active API dependencies out of buddy-planner roots
- Make all /planner/** routes import only the canonical planner
- Reduce /buddy-planner/** and /oando-planner/** to redirects or adapters
- Add a forbidden-import lint rule for new legacy imports

Gate:

- No active route imports legacy planner implementation
- No shared module imports a planner feature
- Compatibility imports are measurable and decreasing

---

### Phase 3 - Consolidate Planner Runtime

- Organize active planner code into domain, application, infrastructure, and UI layers
- Choose one state authority for persisted planner data
- Treat Tldraw as an editor adapter, not the domain model
- Treat R3F as a viewer adapter consuming the canonical document
- Split hand-written files over 700 lines; review files over 500

Missing modules to migrate to canonical before this phase can close:

- lib/aiService, lib/export/boqGenerator, lib/export/exportPDF, lib/export/exportSVG, lib/export/exportBOQ, lib/export/exportPNG
- lib/quoteSubmission, lib/quoteEngine, lib/quoteConfig, lib/shareProject, lib/featureFlags
- buddy-planner/lib/auditRepository, lib/smartWizard, lib/schema/projectSchema

Gate:

- One placement flow
- One history strategy
- One catalog source
- One persistence flow
- One 2D-to-3D bridge

---

### Phase 4 - Backend Alignment

- Make route handlers thin
- Move planner persistence into server-owned repositories using the correct DB client per the hybrid split
- Validate all API input and output at boundaries
- Align planner_saves, admin review, local drafts, and sync queue to the canonical document and one Supabase client
- Move commercial quote handoff from localStorage to a server-owned request record
- Prevent anonymous or null-user sync writes unless the RLS policy explicitly supports them
- Confirm the Drizzle plans table has a clear documented purpose distinct from planner_saves - or consolidate them with a reviewed migration

Gate:

- API contract tests pass
- Authorization is tested
- No browser module imports server credentials
- No route duplicates persistence logic

---

### Phase 5 - Archive Legacy Trees

- Prove each legacy file is unused or replaced via import graph analysis
- Move superseded code to mirrored paths under archive/
- Keep only required route redirects and temporary import adapters
- Remove adapters after all consumers migrate

Stop and confirm before moving or archiving any file.

Gate:

- Import graph proves no active consumer
- Route smoke tests pass
- Planner document round-trip tests pass

---

### Phase 6 - Move Application Source to src/

- Move modules and shared code first
- Update aliases and tooling
- Move root app/ to src/app/ as one controlled batch
- Keep public/, configuration, platform assets, tools, and docs at root

Gate:

- Lint, typecheck, unit, integration, build, navigation, and accessibility checks pass
- No root app/, components/, features/, lib/, state/, or data/ source remains

---

### Phase 7 - Resolve Ops Portal

Choose one:

1. Integrate ops into the main Next.js app under modules/ops
2. If independent deployment is proven necessary, promote to apps/ops-portal with a real workspace - no nested node_modules under features/

---

## First Task Batch

Priority order. Each task must complete: implement, verify, critique, revise, retest.

1. Fix platform/drizzle/drizzle.config.ts dotenv path
2. Derive exact planner_saves column contract from plannerPersistence.ts; write and apply the admin DB migration
3. Confirm which Supabase URL app/api/plans/route.ts uses - verify it matches where planner_saves lives
4. Repair Jest configuration - roots, aliases, setup files, output directory
5. Add scoped active-planner TypeScript config
6. Resolve duplicate PlannerDocument - pick one, deprecate the other
7. Break features/shared -> features/buddy-planner auth cycle
8. Add legacy-import inventory and guard lint rule
9. Write auth, persistence, and deployment provider decision records

---

## Standards

- No architecture claim without import, test, or runtime evidence
- TypeScript boundaries must be explicit and buildable
- Each database connection must be verified before any schema migration is proposed
- React state must avoid duplication and contradictory sources
- Commercial dependency licenses must be verified before adoption

References:

- https://nextjs.org/docs/app/getting-started/project-structure
- https://orm.drizzle.team/docs/drizzle-config-file
- https://react.dev/learn/choosing-the-state-structure
- https://www.typescriptlang.org/docs/handbook/project-references.html
