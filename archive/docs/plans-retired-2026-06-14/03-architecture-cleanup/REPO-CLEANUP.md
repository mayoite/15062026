# 13 — Repository Cleanup and Organisation

*Created: 2026-06-11 — Canonical folder map, archive plan, migration sequence.*
*Updated: 2026-06-14 — Shared FOCSS at `app/css/`; planner `@theme` consolidation still open.*

## Principle

One application, one architecture. No hidden sub-applications, no pseudo-monorepo structures, no standalone frontend runtimes inside feature folders. Every file has a clear owner and a reason to exist.

---

## Live Status (2026-06-14)

| Area | State | Evidence |
|---|---|---|
| Shared FOCSS | **`app/css/`** (moved from `app/(site)/css/`) | `app/(site)/globals.css` → `@import "../css/index.css"` |
| Canonical planner | `features/planner/` | `/planner/canvas` live |
| `oando-planner` editor | **Archived** | `archive/features/oando-planner/ui/editor/` |
| Active legacy imports | **3 files** | `12-MIGRATION-STATUS.md` |
| `buddy-planner` shapes shim | Still live | `features/planner/tldraw/shapes.ts` |
| Root `state/` | **1 file** | `state/useQuoteCartStore.ts` (+ duplicate in `archive/state/`) |
| ESLint `state/` path | Removed from lint script | `package.json` 2026-06-12 |
| Redirect routes | Kept intentionally | `proxy.ts`, `app/buddy-planner/`, `app/oando-planner/` |

---

## 1. Canonical Folder Map

```
oando-consolidated/
├── app/                        ← Next.js App Router routes only
│   ├── css/                    ← Shared FOCSS (tokens, utilities, route CSS) — app-wide
│   ├── (site)/                 ← Public marketing site (layout + globals.css entry)
│   ├── admin/                  ← Admin portal routes
│   ├── api/                    ← API route handlers
│   ├── crm/                    ← CRM routes
│   ├── ops/                    ← Ops portal routes
│   └── planner/                ← Planner routes (marketing + workspace)
│       ├── (marketing)/        ← Landing, help, features pages
│       └── (workspace)/        ← Canvas and guest editor
│
├── components/                 ← Shared UI components (no business logic)
│   ├── home/                   ← Homepage section components
│   ├── site/                   ← SiteNav, SiteFooter, chrome
│   ├── ui/                     ← Primitive UI components (Button, Modal, etc.)
│   ├── shared/                 ← Cross-feature shared components
│   └── [domain]/               ← Domain-specific components (products, career, etc.)
│
├── features/                   ← Feature modules (business logic + UI for one domain)
│   ├── planner/                ← CANONICAL planner (editor, catalog, AI, blocks, store)
│   ├── admin/                  ← Admin feature logic
│   ├── ai/                     ← AI utilities shared across features
│   ├── catalog/                ← Catalog feature logic
│   ├── crm/                    ← CRM feature logic
│   ├── ops/                    ← Ops portal feature logic
│   └── shared/                 ← Shared feature utilities
│
├── lib/                        ← Pure utilities, hooks, types (no UI, no route logic)
│   ├── analytics/              ← SEO, GA, JSON-LD
│   ├── auth/                   ← Auth utilities (protected — stop and confirm)
│   ├── catalog/                ← Catalog data helpers
│   ├── helpers/                ← Motion, formatting, misc utils
│   ├── hooks/                  ← React hooks
│   ├── store/                  ← Cross-feature Zustand stores
│   ├── supabase/               ← Supabase client (browser + server)
│   ├── theme/                  ← Theme helpers
│   ├── types/                  ← Shared TypeScript types
│   └── ui/                     ← UI utility functions
│
├── platform/                   ← Infrastructure integrations (protected)
│   ├── appwrite/               ← Appwrite SDK wrappers
│   ├── drizzle/                ← Drizzle ORM schema + migrations (protected)
│   └── supabase/               ← Supabase schema + migrations (protected)
│
├── data/                       ← Static data files (JSON, CSV, content)
│   ├── planner/                ← Catalog CSVs, template data
│   └── site/                   ← Homepage content, navigation data
│
├── config/                     ← Build, lint, TypeScript, deployment configs
│   ├── build/                  ← tsconfig, eslint, playwright (protected)
│   ├── database/               ← DB connection config
│   ├── deployment/             ← Vercel, Docker configs
│   └── environment/            ← Env schema
│
├── public/                     ← Static assets (images, fonts, models, icons)
├── tests/                      ← All test files
│   ├── e2e/                    ← Playwright tests
│   ├── planner/                ← Planner-specific Vitest tests
│   ├── unit/                   ← General unit tests
│   └── __mocks__/              ← Shared mocks
│
├── docs/                       ← Documentation
│   └── new/                    ← ACTIVE plan pack (this directory)
│
├── archive/                    ← Dead code moved here instead of deleted
├── tools/                      ← Dev scripts, screenshot tools, scrapers
├── state/                      ← Legacy (1 store left: useQuoteCartStore — migrate to lib/store/)
└── results/                    ← Build artefacts, audit outputs, test results
```

---

## 2. What Is Dead Code

These paths contain dead or redundant code that should be archived, not kept:

### High priority — archive now

| Path | Reason | Action |
|---|---|---|
| `features/oando-planner/` editor code | **Archived** | `archive/features/oando-planner/ui/editor/` — verify zero active imports |
| `features/buddy-planner/` shape shim | **3 live imports** | Migrate `shapes/shapeUtils` → planner; then archive buddy tree |
| `features/buddy-planner/` editor code | Retired | Archive after shape migration; keep redirect compat only |
| `app/buddy-planner/` | All routes 301 to `/planner/*` | Confirm redirects work, then move to `archive/app/buddy-planner/` |
| `app/oando-planner/` | All routes 301 to `/planner/*` | Confirm redirects work, then move to `archive/app/oando-planner/` |
| `features/material-studio/` | No active route or import found | Audit imports; if zero, move to `archive/features/material-studio/` |

### Lower priority — audit before acting

| Path | Reason | Action |
|---|---|---|
| `features/site-assistant/` | May overlap with `features/ai/` | Audit imports; consolidate or archive |
| `state/` root | **Nearly empty** | Migrate `useQuoteCartStore.ts` → `lib/store/`; archive folder |
| `apps/` root folder | Contains only proxy.ts mirror? | Audit and clean |
| `temp.tsx` root | Scratch file | Delete after confirming it has no live imports |
| `_write_tracking.js` root | Dev tooling script | Move to `tools/scripts/` |
| `{``n` root file | Appears to be a corrupted filename | Investigate and delete if safe |

---

## 3. CSS Consolidation

Shared FOCSS now lives at **`app/css/`** (moved 2026-06-14 from `app/(site)/css/`). The folder map is correct and well-organised. Remaining risks:

| Issue | File(s) | Action |
|---|---|---|
| Legacy route CSS files under `routes/legacy/` | `app/css/routes/legacy/*.css` | Audit which routes still use these; move to archive if the routes are gone |
| `features/planner/workspace.css` duplicate `@theme` | Planner workspace aliases may drift from shared tokens | Merge planner-specific tokens into `app/css/tokens/theme.css` under `/* Planner */`; remove `@theme` from `workspace.css` |
| `features/planner/planner.css` | Legacy re-export of shell modules | Prefer `features/planner/css/index.css` as the import surface; retire `planner.css` when imports are migrated |
| `features/buddy-planner/` overrides | Dark-mode `nemotron` token drift | Remove after buddy-planner editor is archived |
| Hardcoded 3D / dialog colors | `Planner3DViewer.tsx`, planner overlays | Map to `FOCSS_3D_COLORS` / shared tokens; no new inline rgba in chrome |

**Import contract:** `app/(site)/globals.css` imports `../css/index.css`. Site, planner, CRM, and ops layouts all use `globals.css`. Planner workspace adds `features/planner/css/index.css` for editor chrome only.

---

## 4. Protected Paths — Do Not Move Without Explicit Approval

These files affect routing, auth, database schema, or build config. Moving or renaming them breaks things that are hard to debug.

| Path | Risk |
|---|---|
| `proxy.ts` (root) | Middleware — routing and auth depend on this |
| `project/route-contract.json` | Route registry — used by redirect logic |
| `platform/supabase/` | Supabase migrations |
| `platform/drizzle/` | Drizzle migrations |
| `config/build/` | TypeScript and ESLint config |
| `packages/lib/auth/` | Auth utilities |
| `packages/lib/ai/` | AI provider chain |
| `app/api/auth/` | Auth API routes |

---

## 5. Archive Convention

- Mirror the original repo path inside `archive/`. Example: `features/buddy-planner/editor/` → `archive/features/buddy-planner/editor/`
- Add a `ARCHIVED.md` in each archived folder with: date, reason, and what replaces it
- Do not delete — archive first, delete only if explicitly requested

---

## 6. Migration Sequence

Perform in this order. Each step has a verification gate before the next begins.

### Step 1 — Audit dead imports
```bash
# Find anything still importing from buddy-planner or oando-planner editor code
grep -r "features/buddy-planner" app/ features/ lib/ components/ --include="*.ts" --include="*.tsx"
grep -r "features/oando-planner" app/ features/ lib/ components/ --include="*.ts" --include="*.tsx"
```
**Gate:** Zero live imports pointing to the editor trees (shim re-exports are fine).

### Step 2 — Verify redirects
Confirm all `/buddy-planner/*` and `/oando-planner/*` routes return 301 to `/planner/*` with a browser test or curl.

**Gate:** `curl -I https://[domain]/buddy-planner/` returns `301` with `Location: /planner/`.

### Step 3 — Archive buddy-planner and oando-planner editor code
Move only the dead editor code to `archive/`. Keep the shim entry point (`index.ts` re-export) in place.

**Gate:** `npm run typecheck` passes; `npm run build` passes; all tests pass.

### Step 4 — Archive legacy route apps
Move `app/buddy-planner/` and `app/oando-planner/` to `archive/app/`.

**Gate:** Same as Step 3. Confirm 301 redirects still work (the redirect is now implemented in `proxy.ts` or `next.config.js`, not the route file).

### Step 5 — Audit and archive material-studio
Grep for imports. If zero live imports, move to `archive/`.

**Gate:** Typecheck + build pass.

### Step 6 — Consolidate planner CSS tokens
Merge planner-specific `@theme` tokens from `features/planner/workspace.css` into `app/css/tokens/theme.css` under a `/* Planner */` comment section. Remove the duplicate `@import "tailwindcss"` + `@theme` block from `workspace.css`; keep layout/chrome rules only.

**Gate:** Canvas renders correctly; no visual regression on `/planner/canvas` or `/planner/guest`.

### Step 7 — Migrate `state/` to `lib/store/`
Move remaining Zustand stores from `state/` to `lib/store/`. Update all imports.

**Gate:** Typecheck + build pass; no test regressions.

### Step 8 — Clean root artefacts
- Move `_write_tracking.js` to `tools/scripts/`
- Delete `temp.tsx` after confirming zero imports
- Investigate and delete `{``n` file

**Gate:** `npm run build` passes; no new lint errors.

---

## 7. File Size Enforcement

| File type | Target | Max |
|---|---|---|
| `.tsx` | < 500 lines | 700 lines |
| `.ts` | < 500 lines | 700 lines |
| `.css` | < 400 lines | 600 lines |

Files above max require a split plan before the next edit. Report the filename and line count in `Failures.md`.

---

## 8. Reporting After Each Step

After completing any cleanup step, write to `Handover.md`:

```
## Cleanup batch [date]
- Done: [what was moved/deleted]
- Verified: [typecheck ✓, build ✓, tests ✓]
- Skipped: [anything deferred and why]
- Next: [next step]
```

And update `Failures.md` for anything that failed or was blocked.

---

## Cross-References

| Topic | Doc |
|---|---|
| Import tracker (3 active) | `12-MIGRATION-STATUS.md` |
| Phase gates | `10-MIGRATION-PHASES.md` |
| Phase 0 tooling | `10-MIGRATION-PHASES.md` |

