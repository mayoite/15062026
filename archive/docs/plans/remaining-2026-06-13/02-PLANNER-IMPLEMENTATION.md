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

- Live: `features/planner/` (unified)
- Shared: `features/planner-shared/`
- Legacy (redirect only): `features/buddy-planner/`, `features/oando-planner/` until archived

## Routes

| Route | Purpose | Index |
|---|---|---|
| `/planner` | Marketing landing | yes |
| `/planner/help` | Help center | yes |
| `/planner/canvas` | Member editor | no |
| `/planner/guest` | Guest editor | no |

Legacy `/oando-planner/*` and `/buddy-planner/*` → 301 to `/planner/*`.

## Milestones

### M0 — Foundation (in progress)
- [x] Plan + quality ledger (`03-PLANNER-QUALITY-LEDGER.md`)
- [ ] `/planner` landing (site FOCSS + motion)
- [ ] `UnifiedPlannerPage` + redirects
- [ ] SEO: metadata, sitemap, noindex canvas
- [ ] Tldraw v5 spike + license key

### M1 — Editor shell
- [ ] Merge shapes/tools into `features/planner/tldraw/`
- [ ] `planner-workspace` chrome (site ocean blue, not legacy blue override)
- [ ] Unified AI (`PlannerAdvisorChat`)
- [ ] Help routed; `OnboardingCoach` with spotlight

### M2 — Catalog & blocks
- [ ] CSV → Zustand catalog
- [ ] Drag-drop ghost preview → `buildBlock2D`
- [ ] Infrastructure placement icons
- [ ] SVG visual QA gate

### M3 — RoomSketcher mechanics
- [ ] Blueprint underlay + scale
- [ ] Measurements + area totals
- [ ] Layer visibility

### M4 — Export & persistence
- [ ] Branded PDF + BOQ
- [ ] Single `PlannerDocument` persistence
- [ ] Improved 3D meshes

### M5 — Launch
- [ ] Polish sprint (empty states, dead-click audit)
- [ ] Visual regression suite
- [ ] `release:gate` + ledger ≥ 4.0 avg

## Quality bar

See `03-PLANNER-QUALITY-LEDGER.md`. Non-negotiable: instant canvas, obvious UX, beautiful blocks/PDF, trustworthy save state, delightful micro-interactions.

## Cut list

Real-time collab, DWG import, photo-to-floorplan CV, AR/WebXR, team tenancy, IT network config, audit log.
