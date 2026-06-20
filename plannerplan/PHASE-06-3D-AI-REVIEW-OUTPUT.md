# Phase 6 - 3D, AI, Review, and Output

## Goal

Prove downstream representations and deliverables match the canonical 2D plan and fail safely.

## 3D audit

- 2D, Split, and 3D transitions with empty, small, and large plans.
- Walls, openings, rooms, furniture dimensions, position, rotation, finish, and visibility parity.
- Orbit and walk controls, camera memory, resize, theme, and return to 2D.
- WebGL unavailable, context loss, slow initialization, unsupported assets, and render cleanup.
- Render evidence must show nonblank scene data, not only a canvas element.

## AI audit

- Drawer opening, prompt validation, loading, cancellation, timeout, API/network failure, malformed response, and retry.
- Proposed layout preview, catalog matching, bounds/collision checks, accept, reject, undo, and autosave.
- No silent mutation before user acceptance; clear disclosure of generated changes.
- Guest limits and unavailable-service behavior must be explicit.

## Review and output audit

- Workflow findings and compliance counts after each geometry class.
- Export blocking rules and explanations.
- SVG, PNG, JSON, branded PDF, BOQ CSV/JSON, and quote-cart paths where exposed.
- File names, MIME types, dimensions, colors, scale, metadata, empty-plan behavior, and failure recovery.
- Exported artifact must be opened and inspected, not only downloaded.

## Task checklist

- [ ] **P6-01 Scene parity:** room, walls, openings, furniture, position, rotation, dimensions, finish and visibility.
- [ ] **P6-02 View transition:** 2D -> 3D -> 2D and Split if supported, preserving editor/chrome/camera state.
- [ ] **P6-03 Camera:** orbit, walk, keyboard/pointer controls, bounds, reset, resize and mode memory.
- [ ] **P6-04 Render proof:** WebGL-ready plus reliable nonblank render evidence in browser automation.
- [ ] **P6-05 3D failures:** unavailable WebGL, context loss, slow mount, invalid scene and cleanup/recovery.
- [ ] **P6-06 AI input:** empty/long prompt, project context, loading, cancel, retry and rate/service limits.
- [ ] **P6-07 AI response:** malformed data, unknown catalog IDs, out-of-bounds/colliding layout and partial match.
- [ ] **P6-08 AI decision:** preview before mutation, accept, reject, undo/redo, autosave and disclosure.
- [ ] **P6-09 Review findings:** fixture plans for each compliance rule, severity, focus/navigation and live updates.
- [ ] **P6-10 Export blockers:** reason shown, focusable remediation and reevaluation after fix.
- [ ] **P6-11 Visual exports:** SVG/PNG dimensions, scale, colors, layers, blueprint policy and empty state.
- [ ] **P6-12 Document exports:** JSON/PDF/BOQ fields, totals, metadata, filenames, MIME and content validation.
- [ ] **P6-13 Quote bridge:** correct selected items/quantities and no accidental external submission.
- [ ] **P6-14 Resource cleanup:** renderer, context, geometries, materials, timers and AI requests disposed/canceled.

## Output proof requirements

Every enabled export must be downloaded, parsed or rendered, compared with a known fixture, and retained only as temporary QA evidence. A download event alone is not a pass.

## Primary files

- `features/planner/3d/`
- `features/planner/ai/`
- `features/planner/editor/PlannerWorkflowPanel.tsx`
- `features/planner/editor/ExportModal.tsx`
- `features/planner/editor/exportActions.ts`
- `features/planner/shared/export/`
- `features/planner/shared/boq/`

## Required tests

- 3D data parity assertions plus WebGL fallback E2E.
- AI service contract tests with success, malformed, timeout, and failure responses.
- Accepted AI layout undo/redo and persistence E2E.
- Artifact validation for every enabled export type.
- Review finding tests against known valid and invalid fixture plans.

## Exit gate

3D, AI, review findings, and exported files are derived from the same canonical plan, remain reversible where applicable, and provide specific recovery states on failure.
