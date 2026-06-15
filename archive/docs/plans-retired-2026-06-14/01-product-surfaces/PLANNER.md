# 02 — Planner Implementation Plan

*Created: 2026-06-11 — Single unified workspace planner, flagship bar.*
*Updated: 2026-06-14 — Shared FOCSS at `app/css/`; project setup gate; e2e guest helper.*

## Goal

One workspace planner at `/planner` that outperforms SmartDraw and RoomSketcher on first impression, symbol quality, and export. Furniture + symbolic IT placement only — no network config.

## Architecture

| Layer | Technology | Location |
|---|---|---|
| 2D edit | Tldraw 5 (`SharedTldrawEngine`) | `features/planner/tldraw/` |
| 3D preview | R3F 9 (`UnifiedViewer`) | `features/planner/viewer/` |
| State | Zustand + `PlannerDocument` | `features/planner/store/` |
| Blocks | `buildBlock2D` + catalog styles | `features/planner/tldraw/shapes/` |
| AI | `/api/planner/ai-advisor` | `features/planner/ai/` |
| Persistence | IndexedDB autosave + Drizzle server | `features/planner/data/persistence/` |
| Styling | Shared FOCSS + planner chrome | `app/css/` (tokens) + `features/planner/css/` (editor layout) |

**Retired surfaces (archived 2026-06-12 — not in live tree):**
- `features/buddy-planner/`, `features/oando-planner/`, `features/planner-shared/` → `archive/features/*`
- Orphan modules → `archive/features/planner/retired-2026-06-12/`
- Legacy app routes → `archive/app/buddy-planner/`, `archive/app/oando-planner/` (301s in `config/build/next.config.js`)
- `SharedThree2DEngine` — archived

**Canonical code:** `features/planner/` + `app/planner/` only.

**CSS layering:**
- Shared tokens/utilities: `app/css/` via `app/(site)/globals.css` (same bundle as marketing site).
- Editor chrome only: `features/planner/css/index.css` (shell, controls, overlays, catalog panel, responsive rules).
- Tech debt: `features/planner/workspace.css` still declares a duplicate `@theme` block — consolidate in REPO-CLEANUP Step 6.

**0504 reference rule:** `E:\Goodsites\Final_oando_0504` is a donor snapshot for selective parity only. Keep the current flat-root app and `features/planner/` ownership. Do not bulk-copy donor route/layout/store assumptions because that already reintroduced missing legacy imports and planner contract drift.

---

## Routes

| Route | Purpose | Indexed |
|---|---|---|
| `/planner` | Marketing landing | yes |
| `/planner/help` | Help center | yes |
| `/planner/features` | Capability hub | yes |
| `/planner/features/[slug]` | Feature detail pages | yes |
| `/planner/canvas` | Member editor | no |
| `/planner/guest` | Guest editor | no |

`/buddy-planner/*` and `/oando-planner/*` → 301 to `/planner/*`.

---

## Component Hierarchy

```
PlannerWorkspaceRoute            (ui/PlannerWorkspaceRoute.tsx)
  └─ UnifiedPlannerPage          (ui/UnifiedPlannerPage.tsx)
       ├─ ProjectSetupGate        (onboarding/ProjectSetupGate.tsx) ← blocks canvas until project name + start
       │    └─ ProjectSetupStep
       ├─ PlannerWorkspace        (editor/PlannerWorkspace.tsx)   ← main shell (.pw-shell)
       │    ├─ PlannerTopBar      (.pw-topbar)
       │    ├─ PlannerToolRail    (.pw-tool-rail)
       │    ├─ CatalogSidebar     (.pw-panel-left)
       │    ├─ TldrawCanvas       (.pw-canvas)
       │    ├─ PlannerInspector   (.pw-panel-right)
       │    └─ PlannerStatusBar   (.pw-status)
       └─ PlannerCanvasEnhancements
            └─ OnboardingCoach
```

---

## Milestones

### M0 — Foundation ✓
- [x] Plan + quality ledger
- [x] `/planner` landing (site FOCSS + motion)
- [x] `UnifiedPlannerPage` + 301 redirects
- [x] SEO: metadata, sitemap, noindex canvas
- [x] Tldraw v5 license key wired (`NEXT_PUBLIC_TLDRAW_LICENSE_KEY`)

### M1 — Editor Shell ✓
- [x] `planner-workspace` chrome on `/planner/canvas`
- [x] `ProjectSetupGate` — guest/member must name project before canvas unlocks
- [x] Unified AI path (`PlannerAdvisorChat`)
- [x] Help routed; `OnboardingCoach` with spotlight cutout
- [x] Empty canvas designed state
- [x] Save indicator + IndexedDB autosave
- [x] Catalog drag-drop ghost preview via `buildBlock2D`
- [x] Physical shape/tool migration to `features/planner/tldraw/`
- [ ] Archive dead `buddy-planner/` + `oando-planner/` editor trees

### M2 — Catalog & Blocks ✓
- [x] `usePlannerCatalogStore` wired to `CatalogSidebar`
- [x] CSV → structured catalog ingest (105+ items)
- [x] Drag-drop ghost preview → `buildBlock2D`
- [x] Infrastructure placement icons in catalog
- [x] Privacy screen CSV ingest
- [x] **SVG visual QA gate** — `tests/planner/svg-qa.test.ts` + `npm run catalog:qa:sheet` (121 items, 0 failures)

### M3 — RoomSketcher Mechanics ✓
- [x] Blueprint underlay import + opacity + pan/zoom sync
- [x] Two-point scale calibration (known distance mm)
- [x] Status bar area totals (rooms, zones, floor)
- [x] Layer visibility toggles by category
- [x] Persist blueprint + scale in session autosave
- [x] 0504 parity increment: PDF blueprint underlay import, multi-page PDF session, blueprint nudge/center/reset/scale controls, canvas-side move mode, trace guide quick actions

### M4 — Export & Persistence (in progress)
- [x] JSON session export
- [x] Branded BOQ PDF from canvas
- [x] Session envelope autosave (tldraw + workspace UI)
- [x] 0504 draft/session import repaired enough to compile with canonical planner contracts
- [x] `buildPlannerDocumentFromEditor` — tldraw snapshot + workspace in `sceneJson` (`plannerDocumentBridge.ts`)
- [x] Drizzle `plans` table verified — `npm run db:test` (2026-06-12; bootstrapped via `npm run db:ensure-plans`)
- [x] User `/api/plans` → `savePlannerDocumentToStore` → Drizzle only
- [x] Improved 3D meshes — category materials + `FurnitureMesh3D` extruded meeting/SH desks
- [ ] Normalize imported 0504 draft/session lint issues before `release:gate`
- [ ] Admin `/api/admin/plans/*` still reads Supabase `planner_saves` (no tracked migration)
- [ ] Server round-trip test: save → load → compare `PlannerDocument` against live DB

### M5 — Site Alignment (in progress)
- [x] Typography foundation — `font-synthesis-weight: none`, medium 500 weight
- [x] Key route migration to `typ-*` + `text-strong`/`text-muted`
- [x] Homepage recovery (`homepage-v2`) — hero glass panel, sections, footer trim; tests 29/29 pass
- [x] Portfolio page uses `typ-*` utilities
- [ ] Typography sweep — catalog filters, downloads (partial elsewhere)
- [x] Token single source — planner chrome uses shared FOCSS (`app/css/`) + `features/planner/css/`; finish swatches mapped to palette tokens (2026-06-12)
- [ ] Step 6 — remove duplicate `@theme` from `workspace.css` (see `REPO-CLEANUP.md`)
- [x] Right rail — single `PropertiesInspector` (merged lock, seating, zone controls; removed duplicate `ElementInspector`)
- [x] 0504-inspired layer manager added to right rail with group filters, search, multi-select, lock, fit, align/distribute, and reorder actions
- [x] Planner marketing SSG fix — feature pages pass `slug` not icon functions (build unblocked 2026-06-12)
- [ ] Chrome UX direction — shared nav/footer on planner marketing confirmed in browser

### M6 — Launch (in progress)
- [ ] Polish sprint: empty states, dead-click audit
- [ ] Visual regression suite
- [x] `npm run build` passes (2026-06-12; not re-run after 0504 parity repairs)
- [x] `npm.cmd run typecheck` + `npm.cmd run test:planner` (181/181) pass on 2026-06-13
- [x] Playwright guest setup helper — `tests/playwright/guestProjectSetup.ts`; smoke specs pass without Supabase (2026-06-14)
- [ ] `npm.cmd run lint` — 25 current errors block full `release:gate`
- [ ] Ledger average ≥ 4.0 with complete evidence checklist → ship

---

## Acceptance Criteria (per feature)

### Editor Canvas
- Canvas renders in < 2 s TTI (lazy Tldraw bundle)
- Drag from catalog → ghost preview → drop places block at cursor
- Block placed with correct mm dimensions (2-point calibration applied)
- Undo/redo works across at least 50 operations
- Autosave fires within 2 s of last edit; indicator shows "Saved"
- Session survives page reload (IndexedDB)

### Catalog Sidebar
- All 105 items visible and searchable
- Filter by category updates list < 100 ms
- Drag initiates ghost preview immediately
- Each item shows name, category, and footprint dimensions

### SVG Blocks
- Every symbol renders as inline SVG — no PNG/JPEG fallback
- Walls: correct line weight, junction treatment
- Furniture: top-down orthographic view, correct proportions
- IT icons: symbolic (not photographic); readable at 32 px

### 3D Viewer
- Split view opens in < 1 s
- Orbit controls work on touch and mouse
- Top catalog items have basic material (not untextured grey)
- Sync: moving a block in 2D updates 3D within 500 ms

### AI Advisor
- Chat input accepts freeform text
- `/furnish` intent places blocks on canvas
- `/wizard` mode steps through room type → size → style → place
- Response appears within 3 s on standard connection

### Export
- BOQ PDF: Oando branding, itemised list, total area, date
- JSON export: complete `PlannerDocument` — reloadable
- PDF renders at 300 DPI equivalent; no pixelated text

### 0504 Parity Acceptance
- Donor features must be adapted behind current `features/planner/` contracts, not imported as a second planner.
- Each retained 0504 feature needs a focused test in `tests/planner/` or `tests/unit/`.
- `npm.cmd run typecheck`, `npm.cmd run test:planner`, and `npm.cmd run lint` must pass after the lint remediation pass.
- Compliance, product substitution, templates, minimap, ruler, and 3D walk/orbit improvements remain candidates; direct donor code reuse requires license/provenance and contract review.

---

## Quality Bar

See `03-QUALITY-LEDGER.md`. Non-negotiable: instant canvas, obvious UX, beautiful blocks/PDF, trustworthy save state, delightful micro-interactions.

## Cut List (not in scope)

Real-time collab, DWG import, photo-to-floorplan CV, AR/WebXR, team tenancy, IT network config, audit log.

---

## Brainstorming Ideas (2026-06-11)

High-value product ideas from expert review — not yet implemented, but strong candidates for future milestones.

### Vastu Compliance Overlay (P1)
Toggleable canvas overlay dividing room into 8 Vastu directional zones, flagging furniture in non-compliant positions (e.g., bed head facing south). User marks which wall faces north; items in non-compliant zones get amber indicator with suggested alternatives. **Why:** Genuine India-market differentiator; builds trust with residential customers; no competitor offers this; minimal engineering (rotatable sector SVG overlay).

### Family Planning Mode — "Sabha View" (P2)
Shared session where multiple people on same Wi-Fi view canvas and drop reaction pins (👍❤️❌) on furniture without editing. **Why:** Indian families decide together; gives everyone a voice without full collaboration complexity; drives group consensus before quote.

### Room Photo Reference Import (P2)
User uploads photo of actual room; canvas shows as faded underlay; trace walls over photo then remove. **Why:** Reduces "will this fit?" anxiety; faster than manual measurement; builds confidence in accuracy.

### Hindi + Regional Language Support (P1)
UI strings, catalog search, BOQ labels, PDF export all support Hindi, Tamil, Telugu, Marathi. **Why:** Tier-2/3 cities are growth markets; English-only limits addressable audience; sales teams need PDFs for non-English customers.
