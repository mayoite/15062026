# Planner Guest Recovery Plan

## Target

`http://localhost:3000/planner/guest/`

This plan audits and hardens the complete guest planner journey without reviving legacy planner surfaces.
Active ownership: `app/planner/` and `features/planner/`. Fabric is the 2D editor, React Three Fiber is the 3D viewer.

---

## Confirmed baseline (2026-06-20)

- Route composition: `app/planner/(workspace)/guest/page.tsx` → `PlannerWorkspaceRoute` → `ProjectSetupGate` → `PlannerWorkspace` + `PlannerCanvasEnhancements`.
- Guest setup writes project metadata, grid scale, purpose filtering, and a scoped completion flag.
- Workspace exposes: Draw, Place, Review, 2D, Split, 3D, catalog, templates, blueprint import, local sessions, JSON import/export, visual export, AI assist, inspector, layers, autosave, mobile controls.
- Runtime audit at 1280×720: workspace loaded with 8 objects / 4 walls, left panel open on Blueprint, autosave reached `Saved just now`.
- Catalog rendered 104 symbols; duplicate same-name `Add … to canvas` buttons on multiple articles.
- 3D: visibly nonblank, WebGL-ready; `data-render-evidence` / `data-render-luma` never set after wait.
- Console warning on load: `THREE.Clock` is deprecated; use `THREE.Timer`.
- E2E run 2026-06-20: 34 discovered, 3 failed, 31 skipped due to serial cascade.

---

## Known confirmed bugs in source (fix in-phase)

| ID | File | Line(s) | Bug | Severity |
|---|---|---|---|---|
| BUG-01 | `canvas-fabric/hooks/floorplanCanvas.ts` | 1002 | `getBoundingRect`: `if (obj.left < top)` should be `if (obj.top < top)` — copy-paste. Breaks Arrange vertical alignment. | P1 |
| BUG-02 | `3d/Planner3DViewer.tsx` | 596–608 | WebGL dispose queries canvas by `data-testid` from a stale ref after DOM teardown; should use `onCreated` to capture the renderer and call `renderer.dispose()`. GPU memory leaks on unmount. | P1 |
| BUG-03 | `editor/PlannerWorkspace.tsx` | 123–142 | `FabricGridBridge` registers a `window` keydown listener even when `viewMode === '3d'`, where Fabric is inactive/disposed. Should be conditional on `viewMode !== '3d'`. | P2 |
| BUG-04 | `editor/PlannerWorkspace.tsx` | 753–754, 776–777 | `handleSaveDraft` and `handleSaveAsNewSession` call `buildCurrentPlannerDocument()` fresh instead of consuming the memoised `currentPlannerDocument` on line 690. Double serialisation per save. | P3 |
| BUG-05 | `canvas-fabric/plannerRuntime.ts` | 37–42 | Module-level mutable singleton (`currentRuntime`, `currentState`). Under React strict mode double-mount, the first mount's cleanup wipes state set by the second mount. | P2 |
| BUG-06 | `canvas-fabric/hooks/floorplanCanvas.ts` | 1–7 | `@ts-nocheck` + 4 eslint-disable suppressions blanket the 1 175-line core hook. Zero TypeScript safety in the most critical stateful path. Must be lifted incrementally during Phase 3. | P2 |
| BUG-07 | `3d/Planner3DViewer.tsx` | ~20 | `THREE.Clock` usage triggers a deprecation warning. Replace with `THREE.Timer` or remove the direct clock use. | P3 |
| BUG-08 | Fabric drawing workflow | active toolbar | Drawing tools are visible but do not reliably complete visible, persisted user actions. | P1 |
| BUG-09 | Fabric canvas/layout/runtime | desktop/mobile | Canvas background and restored elements can be blank or invisible despite nonzero metrics. | P1 |
| BUG-10 | Fabric wheel/zoom handling | canvas interaction | Mouse-wheel and trackpad zoom do not work over the canvas. | P1 |
| BUG-11 | 3D viewer and 2D→3D bridge | scene/cameras/labels | Furniture placement does not match 2D; labels overwhelm scene; orbit framing and walk camera clip or start unsafely. | P1 |

---

## Confirmed baseline blockers (E2E contract conflicts)

| Blocker | Root cause | Decision required |
|---|---|---|
| `planner-chrome.spec.ts`: left panel expected closed, starts open | Default `leftOpen` state in `usePlannerPanels` | Select one intended default; update source or test |
| `planner-custom-tools.spec.ts`: expects `Drawing tools` nav; runtime has group inside `Canvas tools` | Chrome restructure after tldraw removal | Active Fabric contract wins; update test locator |
| `planner-guest-workspace.spec.ts`: expects `Canvas history` group; Undo/Redo exist without group | Accessibility/aria-label gap | Add group semantics or update locator — not both |
| Catalog: duplicate same-name `Add … to canvas` buttons | Missing aria distinguishers on catalog cards | Fix catalog card accessible names (Phase 4) |
| 3D render evidence: `data-render-evidence` never set | `Planner3DRenderEvidence` pixel check not triggering | Fix proof hook (Phase 6, BUG-02 area) |
| `THREE.Clock` deprecation warning | Direct `THREE.Clock` use in `Planner3DViewer` | Replace with `THREE.Timer` (Phase 6) |
| 31 E2E skipped after 3 serial failures | Serial suite cascade — no test isolation | Fix in Phase 1 |
| `test:planner` exceeds 120 s | Timeout or hanging test worker | Investigate in Phase 1 |
| Drawing tools visible but workflow/result unreliable | Missing or broken Fabric gesture/completion behavior | Per-tool workflow audit and repair in Phase 3 |
| Blank canvas/background and invisible restored elements | Sizing, fit, viewport transform, layering, or restore race | Repair and desktop/mobile fixture proof in Phase 3 |
| Mouse-wheel zoom has no effect | Missing/broken Fabric wheel contract | Pointer-anchored wheel/pinch zoom in Phase 3 |
| 3D nonblank but unusable | Coordinate parity, camera framing, walk bounds, and label scale defects | Fixture-based visual acceptance in Phase 6 |

---

## Execution order

1. [Phase 1 — Baseline and contract](./PHASE-01-BASELINE-AND-CONTRACT.md)
2. [Phase 2 — Entry and project setup](./PHASE-02-ENTRY-AND-PROJECT-SETUP.md)
3. [Phase 3 — 2D canvas and editing](./PHASE-03-2D-CANVAS-AND-EDITING.md)
4. [Phase 4 — Catalog, templates, and blueprint](./PHASE-04-CATALOG-TEMPLATES-BLUEPRINT.md)
5. [Phase 5 — Persistence and file lifecycle](./PHASE-05-PERSISTENCE-AND-FILE-LIFECYCLE.md)
6. [Phase 6 — 3D, AI, review, and output](./PHASE-06-3D-AI-REVIEW-OUTPUT.md)
7. [Phase 7 — Cross-cutting quality](./PHASE-07-CROSS-CUTTING-QUALITY.md)
8. [Phase 8 — Release proof](./PHASE-08-RELEASE-PROOF.md)

Use [CHECKLIST-HANDOVER.md](./CHECKLIST-HANDOVER.md) as the single completion ledger.

---

## Complete functionality inventory

| Area | User-visible functions | Primary owner | Phase |
|---|---|---|---|
| Entry | Guest route, setup gate, returning draft, loading and error states | `app/planner/(workspace)/guest/`, `app/planner/(workspace)/canvas/`, `features/planner/onboarding/` | 1–2 |
| Workspace shell | Header, workflow, themes, panels, collapse/reset, mobile dock | `features/planner/editor/`, `features/planner/ui/` | 1, 7 |
| Fabric canvas | Selection, line, measure, curve, rectangle, pen, eraser, zoom, grid | `features/planner/canvas-fabric/` | 3 |
| Object editing | Clone, delete, rotate, group, ungroup, arrange, room edit, context menu | `features/planner/canvas-fabric/`, inspector | 3 |
| Floor planning | Walls, rooms, doors, windows, zones, dimensions and collision rules | planner model/store/geometry bridges | 3 |
| Catalog | Purpose/category filters, search, previews, recents, click and drag placement | `features/planner/catalog/` | 4 |
| Templates | Preview, apply, cancel, replacement/merge behavior and undo | `features/planner/templates/`, editor modal | 4 |
| Blueprint | Image/PDF input, calibration, trace, transform, opacity and removal | `features/planner/editor/`, `features/planner/lib/` | 4 |
| Autosave | IndexedDB persistence, debounced save, session envelope, history entries | `features/planner/persistence/persistence.ts`, `hooks/usePlannerFabricAutosave.ts` | 5 |
| Named drafts | localStorage drafts with TTL, scope keys, expiry cleanup | `features/planner/persistence/plannerDraft.ts` | 5 |
| Cloud sessions | Supabase save/load/list/delete, admin mode, API routes | `features/planner/persistence/plannerSaves.ts`, `plannerCloudApi.ts`, `hooks/usePlannerSession.ts` | 5 |
| File lifecycle | Import validation, JSON/SVG/PNG/PDF/BOQ export and filenames | persistence/editor/shared export | 5–6 |
| 3D | Scene conversion, orbit/walk, Split/3D, camera memory and fallback | `features/planner/3d/` | 6 |
| AI | Prompt, space-suggest API, grid-pack fallback, catalog match, apply, reject, undo | `features/planner/ai/` | 6 |
| Review | Metrics, workflow findings, compliance, export blockers | editor/model/lib | 6 |
| Portal | Member portal plan list, plan detail, “Open in planner” links | `features/planner/portal/`, `app/portal/` | 5–6 |
| Admin | Admin plan list, plan detail, managed products CRUD | `features/planner/admin/`, `app/api/admin/plans` | 5–6 |
| Guest transition | Guest-to-member IndexedDB migration, claimed flag, idempotency | `persistence/persistence.ts`, `hooks/usePlannerFabricAutosave.ts` | 5 |
| Quality | Accessibility, mobile, performance, memory, offline, errors and i18n | all active planner owners | 7 |
| Release | Targeted gates, final journeys, evidence and handover | tests/build/release | 8 |

---

## Severity and decision rules

- **P0:** data loss, security exposure, unrecoverable corruption, route unusable. Stop phase immediately.
- **P1:** primary workflow broken, export materially wrong, guest restoration fails, critical accessibility blocker. Blocks phase exit.
- **P2:** important secondary function broken or confusing with workaround. Requires owner before release.
- **P3:** cosmetic, low-frequency, or improvement. May be deferred with evidence and owner.
- A failing assertion is not automatically a product bug. Classify as: product regression / obsolete test / unstable setup / environment failure.
- Every resolved defect must include: reproduction, changed behavior, regression test, and browser proof.

---

## Required evidence format

For each task record: task ID, status, finding, reproduction, expected result, actual result, severity, owner, files changed, tests added/updated, commands and exit codes, screenshot/artifact path, remaining risk, and next task.

---

## Approval boundaries

No changes to `proxy.ts`, `app/api/`, `config/build/`, `platform/`, `project/`, auth/session behavior, database migrations, generated schema, or top-level structure without explicit approval.

---

## Rules

- Do not start a phase until the previous phase exit gate passes.
- Fix product behavior when the product is wrong; update tests only when the intended contract changed.
- Every defect needs reproduction, owner, fix, regression test, and proof.
- Preserve guest data across refresh, failure, and sign-in migration.
- Run PowerShell scripts with `npm.cmd`.

---

## Definition of done

The guest flow completes from a fresh browser through setup, drawing, furnishing, review, save/reload, export, 3D, and recovery on desktop and mobile. Relevant unit, integration, E2E, accessibility, typecheck, and lint gates pass with captured evidence and no unexplained console errors.
