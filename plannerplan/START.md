# Planner Guest Recovery Plan

## Target

`http://localhost:3000/planner/guest/`

This plan audits and hardens the complete guest planner journey without reviving legacy planner surfaces. Active ownership remains `app/planner/` and `features/planner/`; Fabric is the 2D editor and React Three Fiber is the 3D viewer.

## Confirmed baseline

- Route composition: `app/planner/(workspace)/guest/page.tsx` -> `PlannerWorkspaceRoute` -> `ProjectSetupGate` -> `PlannerWorkspace` + `PlannerCanvasEnhancements`.
- Guest setup writes project metadata, grid scale, purpose filtering, and a scoped completion flag.
- Workspace exposes Draw, Place, Review, 2D, Split, 3D, catalog, templates, blueprint import, local sessions, JSON import/export, visual export, AI assist, inspector, layers, autosave, and mobile controls.
- Browser runtime could not attach to the user's existing tab, so a separate background audit tab was opened at the same URL. Runtime DOM, console, screenshot, setup submission, catalog, autosave, and 3D checks were completed at 1280x720.
- Setup rendered meaningful content with no console warnings/errors and submitted successfully using the default guest values.
- Workspace loaded with restored guest data (`8 objects`, `4 walls`), the left panel open on Blueprint, and autosave reaching `Saved just now`.
- Current UI exposes an integrated `Canvas tools` toolbar containing a `Drawing tools` group; old E2E locators target a different chrome contract.
- Catalog rendered 104 symbols, but multiple articles expose duplicate same-name `Add ... to canvas` buttons.
- 3D rendered a visibly nonblank scene and reported WebGL ready, but did not set `data-render-evidence` or `data-render-luma` after waiting.
- Console warning after workspace load: `THREE.Clock` is deprecated; use `THREE.Timer`.
- E2E run on 2026-06-20: 34 discovered, 3 failed, 31 did not run.
- Failure 1: `planner-chrome.spec.ts` expects the left panel closed, but it starts open.
- Failure 2: `planner-custom-tools.spec.ts` expects `Drawing tools` as navigation; runtime exposes it as a group inside `Canvas tools`.
- Failure 3: `planner-guest-workspace.spec.ts` expects a `Canvas history` group; runtime exposes Undo/Redo inside `Canvas tools` without that group name.
- `npm.cmd run test:planner` exceeded 120 seconds; no pass claim is permitted.

## Execution order

1. [Phase 1 - Baseline and contract](./PHASE-01-BASELINE-AND-CONTRACT.md)
2. [Phase 2 - Entry and project setup](./PHASE-02-ENTRY-AND-PROJECT-SETUP.md)
3. [Phase 3 - 2D canvas and editing](./PHASE-03-2D-CANVAS-AND-EDITING.md)
4. [Phase 4 - Catalog, templates, and blueprint](./PHASE-04-CATALOG-TEMPLATES-BLUEPRINT.md)
5. [Phase 5 - Persistence and file lifecycle](./PHASE-05-PERSISTENCE-AND-FILE-LIFECYCLE.md)
6. [Phase 6 - 3D, AI, review, and output](./PHASE-06-3D-AI-REVIEW-OUTPUT.md)
7. [Phase 7 - Cross-cutting quality](./PHASE-07-CROSS-CUTTING-QUALITY.md)
8. [Phase 8 - Release proof](./PHASE-08-RELEASE-PROOF.md)

Use [CHECKLIST-HANDOVER.md](./CHECKLIST-HANDOVER.md) as the single completion ledger.

## Complete functionality inventory

| Area | User-visible functions | Primary owner | Planned phase |
|---|---|---|---|
| Entry | Guest route, setup gate, returning draft, loading and error states | `app/planner/(workspace)/guest/`, `features/planner/onboarding/` | 1-2 |
| Workspace shell | Header, workflow, themes, panels, collapse/reset, mobile dock | `features/planner/editor/`, `features/planner/ui/` | 1, 7 |
| Fabric canvas | Selection, line, measure, curve, rectangle, pen, eraser, zoom, grid | `features/planner/canvas-fabric/` | 3 |
| Object editing | Clone, delete, rotate, group, ungroup, arrange, room edit, context menu | `features/planner/canvas-fabric/`, inspector | 3 |
| Floor planning | Walls, rooms, doors, windows, zones, dimensions and collision rules | planner model/store/geometry bridges | 3 |
| Catalog | Purpose/category filters, search, previews, recents, click and drag placement | `features/planner/catalog/` | 4 |
| Templates | Preview, apply, cancel, replacement/merge behavior and undo | `features/planner/templates/`, editor modal | 4 |
| Blueprint | Image/PDF input, calibration, trace, transform, opacity and removal | `features/planner/editor/`, `features/planner/lib/` | 4 |
| Persistence | Autosave, IndexedDB, local sessions, restore and storage failures | `features/planner/persistence/`, hooks/store | 5 |
| File lifecycle | Import validation, JSON/SVG/PNG/PDF/BOQ export and filenames | persistence/editor/shared export | 5-6 |
| 3D | Scene conversion, orbit/walk, Split/3D, camera memory and fallback | `features/planner/3d/` | 6 |
| AI | Prompt, response, preview, catalog match, apply, reject, undo and failure | `features/planner/ai/` | 6 |
| Review | Metrics, workflow findings, compliance, export blockers | editor/model/lib | 6 |
| Guest transition | Guest-to-member claim, conflict handling and idempotency | persistence/auth boundary | 5 |
| Quality | Accessibility, mobile, performance, memory, offline, errors and i18n | all active planner owners | 7 |
| Release | Targeted gates, final journeys, evidence and handover | tests/build/release | 8 |

## Severity and decision rules

- **P0:** data loss, security exposure, unrecoverable corruption, route unusable. Stop the phase immediately.
- **P1:** primary workflow broken, export materially wrong, guest restoration fails, critical accessibility blocker. Blocks phase exit.
- **P2:** important secondary function broken or confusing with workaround. Requires owner before release.
- **P3:** cosmetic, low-frequency, or improvement. May be deferred with evidence and owner.
- A failing assertion is not automatically a product bug. First classify it as product regression, obsolete test, unstable test setup, or environment failure.
- Every resolved defect must include the original reproduction, changed behavior, regression test, and browser proof.

## Required evidence format

For each task record: task ID, status, finding, reproduction, expected result, actual result, severity, owner, files changed, tests added/updated, commands and exit codes, screenshot/artifact path, remaining risk, and next task.

## Approval boundaries

The plan does not authorize changes to `proxy.ts`, `app/api/`, `config/build/`, `platform/`, `project/`, authentication/session behavior, database migrations, generated schema, or top-level structure. Stop and request approval if a verified fix requires any of these.

## Rules

- Do not start a phase until the previous phase exit gate passes.
- Fix product behavior when the product is wrong; update tests only when the intended contract changed.
- Every defect needs reproduction, owner, fix, regression test, and proof.
- Preserve guest data across refresh, failure, and sign-in migration.
- Do not change auth, API routes, database schema, proxy, build config, or top-level structure without explicit approval.
- Run PowerShell scripts with `npm.cmd`.

## Definition of done

The guest flow completes from a fresh browser through setup, drawing, furnishing, review, save/reload, export, 3D, and recovery on desktop and mobile. Relevant unit, integration, E2E, accessibility, typecheck, and lint gates pass with captured evidence and no unexplained console errors.
