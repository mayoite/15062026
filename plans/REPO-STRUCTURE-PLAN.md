# Repository structure — step plan (00–06)

*Execution · **Complete** · Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · Reference: [`docs/DOC-MAP.md`](../docs/DOC-MAP.md)*

## Goal

One clear folder layout: flat `tests/`, root `scripts/`, live code in `app/` + `features/` + `components/` + `lib/` + `data/`, output in `results/`, dead code in `archive/`.

**Prerequisite before catalog/lib merges:** `plans/COVERAGE-PLAN.md` — planner coverage toward 75%.

---

## Step overview

| Step | Name | Status | Depends on |
|------|------|--------|------------|
| **00** | Target tree & baseline | **Done** | — |
| **01** | Root cruft | **Done** (`a8d44a5`) | 00 |
| **02** | Folder quarantine | **Done** (`a8d44a5`) | 01 |
| **03** | Boundary `CONTENTS.md` | **Done** (2026-06-15) | 02 |
| **04** | Script path repair | **Done** (`397150d` + batch) | 02 |
| **05** | Proxy & layout guards | **Done** (2026-06-15) | 02 |
| **06** | Verify & close | **Done** (2026-06-15) | 03–05 |

```
00 ──► 01 ──► 02 ──► 03 ──┐
              │      04 ──┼──► 06 ✓
              └────► 05 ──┘
```

**Program complete.** Ongoing work: **coverage** (`plans/COVERAGE-PLAN.md`), **hardcoding** (`plans/HARDCODING-PLAN.md`).

---

## Policy

| Topic | Rule |
|-------|------|
| Live code | `app/`, `features/`, `components/`, `lib/`, `data/` only |
| Tests | Flat `tests/` — `npm run test:layout:check` |
| Retired code | `archive/` — **never import** |
| Folder blurbs | `<dir>/CONTENTS.md` via `npm run docs:sync:all` |
| Catalog merge | Blocked until planner coverage T3 sufficient |

---

# Step 00 — Target tree & baseline

**Done (2026-06-15)**

```
app/              routes + css
components/       marketing UI
features/         planner (canonical), shared, catalog, site-assistant, ops, crm, admin, ai
data/site/        copy, nav, SEO, localCatalogIndex.json
lib/              utils, auth, catalog blocks
platform/         supabase, drizzle, appwrite
tests/            → docs/TESTING.md
scripts/          → docs/SCRIPTS.md
config/build/     eslint, tsconfig, playwright, next
results/          coverage/, inventories, optional reviews/
plans/            roadmaps (this file, COVERAGE-PLAN, TESTING-PLAN, …)
docs/             → docs/DOC-MAP.md
archive/          retired — never import
```

---

# Step 01 — Root cruft

**Done (`a8d44a5`)** — empty `quoteCartBridge.ts` removed; root `playwright.config.ts` removed; `project-tree.csv` → `results/`.

---

# Step 02 — Folder quarantine

**Done (`a8d44a5`)** — `data/planner/` removed; `features/site/` stub deleted; `tools/` archived; zero live `buddy-planner` imports.

Compat only: `plannerIdentity.ts` paths, IndexedDB `buddy-planner-db`.

---

# Step 03 — Boundary `CONTENTS.md`

**Done (2026-06-15)**

| File | Boundaries |
|------|------------|
| `features/CONTENTS.md` | catalog vs `lib/catalog` vs `data/site`; auth split |
| `components/CONTENTS.md` | marketing vs planner vs shared auth UI |
| `lib/CONTENTS.md` | auth vs `features/shared/auth`; catalog pipeline |
| `features/planner/CONTENTS.md` | editor/store/model vs routes; catalog bridge |

Regenerate: `npm run docs:sync:all`.

---

# Step 04 — Script path repair

**Done** — `rg 'apps/site|packages/' scripts/` → no matches.

| Script | Status |
|--------|--------|
| `audit-quality-gate.mjs`, `catalog-preview.ts`, `generate-tree.js` | Fixed |
| `prepare-review-folders.js` | Flat-root rewrite |
| `generate-route-classification.mjs` | Windows matchers fixed |

---

# Step 05 — Proxy & layout guards

**Done (2026-06-15)**

- **`proxy.ts`:** guest paths canonical; legacy URLs via `next.config.js` 301s
- **`scripts/check-test-layout.mjs`:** `npm run test:layout:check`

---

# Step 06 — Verify & close

**Done (2026-06-15)**

```bash
npm run lint && npm run typecheck && npm run test && npm run test:layout:check
npm run docs:check
```

`release:gate` needs `.env.local` / `DATABASE_URL` for full Playwright plan routes.

---

## PR stack (complete)

| PR | Step | Status |
|----|------|--------|
| R-PR01–02 | 01–02 | Done (`a8d44a5`) |
| R-PR03 | 03 | Done |
| R-PR04 | 04 | Done |
| R-PR05 | 05 | Done |
| R-PR06 | 06 | Done |

---

## See also

- `plans/COVERAGE-PLAN.md` — active test/coverage work
- `plans/HARDCODING-PLAN.md` — P0–P4 literals (steps 03–04 overlap done here)
- `plans/ARCHIVE-MAP.md` — archive crosswalk

*Daily orientation: `Readme.md`.*