# Oando — unified planner + marketing site

Flat-root Next.js app. Furniture company site at `oando.co.in` with one workspace planner at `/planner`.

**Canonical repo:** `E:\Goodsites\13062026` (commit/push here). Cursor worktree is the same git repo. If docs feel missing, read `docs/Handover.md` § *If you're lost*.

## Root markdown

| File | Role |
|------|------|
| `Readme.md` | Orientation (this file) |
| `AGENTS.md` | Agent rules |
| `CONTENTS.md` | Generated repo map (`npm run docs:sync:all`) |

Ops state lives in `docs/Handover.md` and `docs/Failures.md` — not at root.

## Read next

`docs/DOC-MAP.md` → `docs/TESTING.md`, `docs/SCRIPTS.md`, `docs/CSS-ARCHITECTURE.md`, **`docs/workflow/`** · **`plans/MASTER-PLAN.md`** (start here) · `plans/TESTING-PLAN.md`, `plans/COVERAGE-PLAN.md`

## Layout

`app/` · `features/planner/` · `components/` · `lib/` · `tests/` · `scripts/` · `docs/` · `plans/` · `platform/` · `config/` · `results/` · `archive/`

Target tree: `plans/REPO-STRUCTURE-PLAN.md`. Subfolder blurbs: `<dir>/CONTENTS.md` (`npm run docs:sync:all`).

## CSS

- **Base:** `app/css/base/` — global primitives (e.g. `animations.css`); not under `core/`.
- **Tokens:** `app/css/core/tokens/theme.css` — single source; no hex in components.
- **Entry:** `globals.css` → `app/css/index.css` (base + foundation + `core/chrome` shell).
- **Site:** `app/css/core/site/bundles/*` — per layout. Homepage bundle chains `routes/home/base.css` first, then section/showcase/projects/extras.
- **Planner:** `app/css/core/planner/bundles/*` — workspace bundle imports `planner-shell.css`, `planner-workflow.css`, `planner-typography.css` (last), then canvas rules.

See `docs/CSS-ARCHITECTURE.md` for the full import map.

## Assets & CDN

| Layer | Location | Deployed? |
|-------|----------|-----------|
| App SDKs (tldraw, model-viewer, Draco) | `public/cdn/` | Yes (small, in git) |
| Catalog images + 3D | R2 bucket **`oando-asset-cdn`** | Cloud only |
| Local mirror + upload source | `asset-cdn/` | No (gitignored) |
| Path strings | Supabase | DB only |

```bash
npm.cmd run assets:cdn:upload          # local → oando-asset-cdn
node scripts/count-r2-objects.mjs oando-asset-cdn
```

Asset & CDN workflow: **`docs/workflow/README.md`** (site · planner · backend · folders · operations).

## Planner delivery loop

1. Define acceptance evidence
2. Smallest complete increment
3. Test → critique → revise → retest

No feature is done without verification.

## Commands (PowerShell)

```bash
npm.cmd run dev              # or: npx next dev --webpack
npm.cmd run typecheck        # tsc -p tsconfig.json (TypeScript 6)
npm.cmd run lint
npm.cmd run test             # vitest — see docs/TESTING.md for counts
npm.cmd run test:planner
npm.cmd run test:e2e:nav
npm.cmd run release:gate
```

**TypeScript:** stay on **6.x** (`^6.0.3`). Root `tsconfig.json` extends `config/build/tsconfig.json` and owns path aliases — no `baseUrl` (TS 6 deprecates it).

**Build:** production build generates **~341 static pages** when typecheck passes (Supabase + `localCatalogIndex.json` merge via `lib/catalog/productStaticParams.ts`).

## Docs

**Reference:** `docs/` (`docs/DOC-MAP.md`). **Plans:** `plans/` (`plans/CONTENTS.md`).

After test changes: `npm run docs:sync`.

Everything else is code or `archive/`.