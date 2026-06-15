# 02 — Planner Implementation Plan

*Revised: 2026-06-10 — Single unified workspace planner (flagship bar).*

## Goal

One workspace planner at `/planner` that outperforms SmartDraw and RoomSketcher on first impression, symbol quality, and export — furniture + symbolic IT placement only (no network config).

## Architecture

| Layer | Technology | Role |
|---|---|---|
| 2D edit | **Tldraw 5** (`SharedTldrawEngine`) | Walls, furniture, zones, measure, infra icons |
| 3D preview | **R3F 9** (`BuddyViewer` → `UnifiedViewer`) | Orbit view only |
| State | **Zustand** + `PlannerDocument` | Single document schema |
| Blocks | `buildBlock2D` + `lib/catalog/styles/` | Procedural SVG symbols |
| AI | `/api/planner/ai-advisor` | chat / furnish / wizard / analyze |
| Styling | Shared FOCSS (`app/css/`) | Landing + help match homepage |

**Retired:** dual planner apps, `SharedThree2DEngine`, Konva editor path, `itLayerStore` technical layer.

## Feature root

- Live: `features/planner/` (unified — editor, catalog, shared, data, tldraw)
- Compat shims: `features/planner-shared/` → re-exports `features/planner/shared/`
- Compat shims: `features/buddy-planner/`, `features/oando-planner/` → re-export `features/planner/` (dead editor code not mounted)

## Routes

| Route | Purpose | Index |
|---|---|---|
| `/planner` | Marketing landing | yes |
| `/planner/help` | Help center | yes |
| `/planner/features` | Capability hub | yes |
| `/planner/features/[slug]` | Feature detail (blueprint, 3d, AI, export, …) | yes |
| `/planner/features` | Capability hub | yes |
| `/planner/features/[slug]` | Feature detail pages | yes |
| `/planner/canvas` | Member editor | no |
| `/planner/guest` | Guest editor | no |

Legacy `/oando-planner/*` and `/buddy-planner/*` → 301 to `/planner/*`.

## Milestones

### M0 — Foundation (done)
- [x] Plan + quality ledger (`03-PLANNER-QUALITY-LEDGER.md`)
- [x] `/planner` landing (site FOCSS + motion)
- [x] `UnifiedPlannerPage` + redirects
- [x] SEO: metadata, sitemap, noindex canvas
- [x] Tldraw v5 license key wiring (`NEXT_PUBLIC_TLDRAW_LICENSE_KEY` / `TLDRAW_LICENSE_KEY`)

### M1 — Editor shell (mostly done)
- [x] Canonical `features/planner/tldraw/` registration (re-export; shapes migrate next)
- [x] `planner-workspace` chrome on `/planner/canvas`
- [x] Unified AI path (`PlannerAdvisorChat` + provider chain fallback)
- [x] Help routed; `OnboardingCoach` on canvas with `data-coach` targets + spotlight cutout
- [x] `SharedThree2DEngine` archived
- [x] Empty canvas designed state (no forced starter template)
- [x] Save indicator + IndexedDB autosave on canvas edits
- [x] Catalog drag-drop ghost preview (`buildBlock2D` via `CatalogBlockPreview`)
- [x] `features/planner/tldraw/shapes` + `tools` — physical migration complete
- [x] `features/planner/editor/` — workspace, inspector, templates, shape bridge
- [x] `features/planner/viewer/`, `data/persistence`, `data/templates`, `ai/`
- [x] Canonical `features/planner/store`, `model`, `admin`, `portal`, `lib` — editor imports planner only
- [ ] Archive dead `buddy-planner/` + `oando-planner/` editor trees to `archive/` when safe

### M2 — Catalog & blocks (in progress)
- [x] Zustand `usePlannerCatalogStore` wired to `CatalogSidebar`
- [x] CSV → structured catalog ingest (`npm run catalog:ingest` → 105 items)
- [x] Drag-drop ghost preview → `buildBlock2D`
- [x] Infrastructure placement icons in catalog
- [x] Privacy screen CSV ingest (website5–7)
- [ ] SVG visual QA gate

### M3 — RoomSketcher mechanics (started)
- [x] Blueprint underlay import + opacity + pan/zoom sync
- [x] Two-point scale calibration (known distance mm)
- [x] Status bar area totals (rooms, zones, floor)
- [x] Layer visibility toggles by category
- [x] Persist blueprint + scale in session autosave (`plannerSession` v2)

### M4 — Export & persistence (started)
- [x] JSON session export + branded BOQ PDF from canvas
- [x] Session envelope autosave (tldraw + workspace UI)
- [ ] Full `PlannerDocument` schema bridge from tldraw shapes
- [ ] Improved 3D meshes

### M0.5 — Site & planner alignment (before polish)
*Do this before catalog finesse and micro-interaction polish.*

- [x] **Typography foundation** — semibold → loaded medium (500); `font-synthesis-weight: none`; FOCSS `font-weight: 600` → token
- [x] **Key route migration** — PDP (`ProductViewer`), compare, quote-cart, planner landing/help → `typ-*` + `text-strong`/`text-muted` tokens
- [x] **Utilities** — `typ-page-title`, `typ-subsection-title`, `typ-proof-value`, `text-soft` alias
- [ ] **Typography sweep** — remaining public routes (catalog filters, downloads, portfolio, etc.)
- [ ] **Token single source** — retire buddy `nemotron` token drift in editor chrome
- [ ] **Chrome & UX direction** — shared nav/footer on planner marketing or deliberate isolated shell with same rhythm
- [ ] **Landing** — replace scaffold copy/visuals once alignment tokens are locked (intentionally deferred)

### M5 — Launch
- [ ] Polish sprint (empty states, dead-click audit)
- [ ] Visual regression suite
- [ ] `release:gate` + ledger ≥ 4.0 avg

## Quality bar

See `03-PLANNER-QUALITY-LEDGER.md`. Non-negotiable: instant canvas, obvious UX, beautiful blocks/PDF, trustworthy save state, delightful micro-interactions.

## Cut list

Real-time collab, DWG import, photo-to-floorplan CV, AR/WebXR, team tenancy, IT network config, audit log.
