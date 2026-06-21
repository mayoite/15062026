# Planner overhaul — start here

**Target:** `http://localhost:3000/planner/` (marketing) → `/planner/guest/` (workspace) → `/planner/canvas/` (member)

**Date:** 2026-06-21  
**Authority:** [`OVERHAUL.md`](./OVERHAUL.md) — read this first. Everything else in this folder is superseded unless linked from there.

---

## What changed

The old 8-phase guest-recovery plan assumed **blueprint import**, a **Rooms left tab**, and a **tldraw-era inspector bridge**. None of that exists in code anymore:

| Removed / dead | Live owner |
|---|---|
| `BlueprintPanel`, calibration, PDF trace | Deleted — do not revive |
| `RoomPresetsOnOpen` auto-modal | Returns `null` |
| `PropertiesInspector` + `shapeInspectorBridge` | `editor` is always `null` |
| Phase 4 blueprint tasks | Obsolete |

Active stack: `app/planner/` routes → `PlannerWorkspaceRoute` → `ProjectSetupGate` → `PlannerWorkspace` (967 lines) → Fabric (`floorplanCanvas.ts`) + lazy `Planner3DViewer`.

---

## Current blockers (code-proven)

| ID | Symptom | Root cause (file) | Workstream |
|---|---|---|---|
| B1 | Setup promises a room shell; canvas is empty | `StartingPointStep` only calls `onComplete()`; `applySuggestedLayout` ignores `layout.walls` | WS2 |
| B2 | AI “Apply layout” furniture lands wrong | `applySuggestedLayout` calls `placeCatalogItem()` without x/y | WS2 |
| B3 | 3D furniture offset / outside room | `fabricDocumentBridge` treats Fabric `left/top` as `centerMm` | WS3 |
| B4 | Drawing tools unreliable (BUG-08) | `fabricDrawTools.ts` + wall/room path separate from `PlannerToolRail` | WS1 |
| B5 | Blank canvas / invisible restore (BUG-09) | Refit fixes landed; browser proof still open | WS1 |
| B6 | Wheel zoom dead (BUG-10) | `mouse:wheel` handler exists; needs proof + split-view pane focus | WS1 |
| B7 | Review step / export gates wrong | `countMeasurementShapes()` hard-coded `0` | WS4 |
| B8 | Two inspectors, neither complete | `PropertiesInspector` + `FabricPropertiesInspector` both mounted | WS4 |

---

## Execution order

1. **WS1** — Canvas trust (must work before anything else)
2. **WS2** — Setup shell + layout apply fix
3. **WS3** — 2D↔3D coordinate contract
4. **WS4** — Inspector merge + Review gates
5. **WS5** — Workspace decomposition + doc/test hygiene

Track progress in [`CHECKLIST-HANDOVER.md`](./CHECKLIST-HANDOVER.md).

---

## Commands

```bash
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run test:planner
# E2E only with explicit permission:
npm.cmd run test:e2e:nav
```

---

## Superseded files

`PHASE-01` … `PHASE-08`, old bug table rows referencing blueprint — historical only. Do not execute phase tasks that mention blueprint or Rooms tab.
