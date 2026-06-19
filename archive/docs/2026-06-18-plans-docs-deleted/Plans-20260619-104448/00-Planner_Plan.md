# Fabric-First Recovery Plan for `E:\16062026`

## Summary

Use `E:\Goodsites\15062026` as the **workflow and contract reference** and `E:\floorplan-react` as the **Fabric interaction reference**. Do **not** restore tldraw as the live planner engine. The goal is to finish the migration by rebuilding the planner around Fabric while preserving the stable user-facing behavior that existed before the swap.

The current repo is a hybrid:
- Fabric canvas exists and is partially integrated
- old planner shell/workflow assumptions still exist
- exports, autosave, compliance, inspector, and tests are split between old and new assumptions
- admin/member/dashboard are mostly stable by diff, but depend on planner document and persistence quality

This plan is written as Markdown-ready content for a `.md` artifact, but in Plan Mode I am only providing the content, not writing files.

## Phase Plan

### Phase 1 — Canvas Runtime Stabilization
- Make Fabric the only live 2D engine contract.
- Remove planner runtime dependence on `window.__fabric*` globals.
- Replace render-time ref mutation and polling-heavy bridges with explicit context/runtime APIs.
- Restore stable shell behavior from `15062026`:
  - left/right panel defaults
  - workspace step flow
  - tool activation behavior
  - canvas-first layout behavior
- Keep `FloorplanProvider` and current Fabric canvas core, but formalize the runtime boundary so the rest of the planner stops treating it as a prototype.

### Phase 2 — Canvas Semantic Reconstruction
- Rebuild the missing semantic bridges on top of Fabric:
  - selection status
  - plan metrics
  - layer visibility and lock behavior
  - workflow gating
  - compliance findings
  - room preset behavior
- Replace placeholder/stub planner behavior with Fabric adapters instead of tldraw no-ops.
- Replace interval-driven 2D→3D sync with semantic scene updates from Fabric state changes.
- Restore a canonical planner runtime contract so 2D, 3D, save/load, and review all consume the same scene model.

### Phase 3 — Admin Review Surface
- Keep admin APIs, auth, and DB contracts unchanged unless explicitly approved later.
- First admin deliverable is **review/triage**, not a second editor.
- Admin should be able to:
  - list plans
  - open plan detail
  - inspect canonical Fabric-derived planner data
  - review room/item/export readiness
  - apply status/review actions already supported by current persistence
- Update admin plan detail surfaces to consume canonical planner documents rather than tldraw-era assumptions.

### Phase 4 — SVG / Export Rebuild
- Replace the current placeholder SVG/PNG export behavior with real Fabric-backed export adapters.
- Rebuild export around canonical planner scene data, not deleted tldraw shape ids.
- Support:
  - SVG floor plan export
  - PNG snapshot export
  - JSON session export
  - BOQ/PDF export using canonical planner document data
- Ensure export includes:
  - room shell
  - walls/openings
  - furniture footprints
  - labels/measurements where applicable
  - correct units and document metadata

### Phase 5 — Member Portal
- First member portal deliverable is **read-only review**.
- Replace current portal stubs with:
  - plan summary
  - plan metadata
  - BOQ/export visibility
  - read-only 3D / plan review from canonical planner documents
- Do not create a second full editing surface in the portal during this pass.
- Keep auth and portal routing stable.

### Phase 6 — Landing / Marketing Continuity
- Keep the current `16062026` visual direction, but restore stable planner marketing continuity from `15062026`.
- Reintroduce planner-specific marketing shell behavior that helps handoff into the Fabric workspace.
- Audit all planner CTAs so they point to the right guest/member/Fabric entry path.
- Align copy with the actual shipped product:
  - Fabric 2D canvas
  - 3D review
  - export
  - member/admin downstream flows

### Phase 7 — Dashboard / Entry Flow
- Keep dashboard as the neutral authenticated launcher.
- Ensure planner draft/session summaries still reflect real planner persistence after the Fabric migration.
- Keep login/access/dashboard shells unchanged in contract, but verify handoff into `/planner` works correctly.
- Do not broaden this phase into auth rewrites.

### Phase 8 — Upgrade / Hardening
- Remove remaining active-path tldraw dependencies from the planner runtime.
- Replace or retire tests that still import deleted tldraw files.
- Remove live-path planner `@ts-nocheck` usage where it blocks confidence.
- Finish with a hardening pass:
  - typecheck green
  - lint green
  - planner tests green
  - targeted browser verification for planner, admin, portal, landing, and dashboard

## Key Implementation Changes

- Introduce a **Fabric planner adapter contract** that replaces the old editor contract at the boundary used by:
  - autosave
  - exports
  - inspector/review UI
  - 3D sync
  - member/admin review surfaces
- Make `PlannerDocument.sceneJson` the canonical cross-surface payload for:
  - workspace restore
  - admin review
  - member review
  - BOQ/export
  - 3D rendering
- Keep raw Fabric snapshot data only as a restore/debug payload, not as the main downstream data source.
- Preserve old planner behavior where it matters to users, but reimplement it using Fabric semantics.
- Treat `15062026` as the source of truth for:
  - panel behavior
  - workflow/compliance contract
  - autosave lifecycle expectations
  - export completeness expectations
- Treat `floorplan-react` as the source of truth for:
  - Fabric interaction patterns
  - room editing mechanics
  - object placement behavior
  - Fabric UI idioms worth keeping

## Test Plan

- Canvas runtime:
  - panel open/close defaults by step
  - grid/tool/room-edit behavior
  - catalog placement and selection updates
- Canvas semantics:
  - metrics
  - selection status
  - layer visibility/locking
  - workflow/compliance findings
  - room presets
- Persistence:
  - local draft save/load
  - guest/member continuity
  - dashboard draft summary integrity
- Export:
  - SVG
  - PNG
  - JSON
  - PDF/BOQ
- Downstream surfaces:
  - admin review opens and reads planner documents correctly
  - member portal read-only review renders correctly
  - landing CTAs route correctly
  - dashboard/auth handoff into planner remains stable
- Final verification:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run test:planner`
  - targeted browser verification for `/planner`, `/planner/canvas`, `/portal`, `/admin`, and dashboard handoff

## Assumptions

- Fabric remains the only destination engine.
- `15062026` is a behavioral/workflow reference only, not an engine rollback candidate.
- Member phase ships as **read-only review** first.
- Admin phase ships as **review/triage** first.
- No changes to `app/api/`, `platform/`, `project/`, auth behavior, or database migrations unless later explicitly approved.
