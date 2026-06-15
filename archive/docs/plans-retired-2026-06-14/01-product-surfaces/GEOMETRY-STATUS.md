# 08 — P0 Geometry Implementation Status

*Assessment: 2026-06-11 — Detailed inventory of wall, door, window, room, and snapping features.*
*Updated: 2026-06-13 — Live verification after 0504 blueprint/layer parity; cross-ref `06-TESTING.md`, `07-CAPABILITY-MATRIX.md`.*

## Overview

This document tracks the exact state of planner geometry editing — what works, what is tested, and what blocks RoomSketcher parity. Status claims must match code **and** automated tests (`06-TESTING.md`).

---

## Live Verification (2026-06-13)

| Check | Result | Notes |
|---|---|---|
| `npm.cmd run typecheck` | **pass** | Tldraw geometry compiles clean |
| `npm.cmd run test:planner` | **181/181 pass** | Includes geometry, blueprint, layer manager, SVG, and planner parity tests |
| `SnapIndicatorOverlay` wired | **yes** | `PlannerWorkspace.tsx` — wall, room, door-window, zone tools |
| Opening collision | **no** | P1 gap — see §3 |
| Co-located bridge tests | **re-check needed** | Planner suite expanded; verify no high-value co-located tests remain orphaned before launch |

**RoomSketcher P0 bar:** typed walls + snap + dimensions + blueprint trace = **mostly met**. Opening collision + axis guides = **not met**.

---

## 1. WallTool — Wall Drawing and Editing

### WORKING ✓
- **Typed wall lengths**: Walls store `lengthMm` from pixel distance (min 100 mm)
- **Connected wall edits**: `moveWallEndpoint()` propagates shared vertices; `splitWallAtPoint()` splits wall
- **Junction detection**: L/T/cross via `getJunction()` on wall complete
- **Wall snapping**: `snapEditorPointOrGrid()` — grid, endpoints, midpoints, edge points, segments
- **Material + thickness**: drywall 100, brick 200, glass 12, concrete 200, wood 150 (mm)
- **Dimension display**: `showDimensions:true` — mm/m label at midpoint, rotated to angle
- **Editable dimensions**: Double-click label → length in metres → proportional rescale
- **Shift angle constraint**: 45° increments via `constrainToAngle()`
- **snapWallEndpoint()**: Shift first, then grid + geometry snap

### MISSING / FUTURE
- Typed wall length input **during** draw (only after placement)
- Chain wall click-click mode (press-drag-release only)

**Key files:** `features/planner/tldraw/tools/WallTool.ts`, `PlannerWallShapeUtil.tsx`

---

## 2. Snapping System

### WORKING ✓
- Grid snap (`gridSpacing` default 20 px)
- Wall endpoints, midpoints, edge points (5 per wall), segment closest point
- Room/zone polygon vertices and edge midpoints
- Threshold: `snapDistance` 10, `snapThreshold` min 12
- Self-exclude during draw
- `constrainToAngle()` — N° increments (default 45°)
- `snapWallEndpoint()` — Shift-aware composite
- `EditorSnapResult` includes angle-constraint kind

### WORKING ✓ (2026-06-12)
- **Snap visual feedback**: `SnapIndicatorOverlay` — dot/line when `snapEditorPoint()` returns `snapped: true`
- Tools: `planner-wall`, `planner-room`, `planner-door-window`, `planner-zone`

### MISSING / FUTURE
- Axis-aligned H/V guide lines when aligned with other walls
- Automated E2E: snap indicator visible on canvas (Playwright not run this batch)

**Tests:** `tests/planner/geometry.test.ts` — primitives only; no integration test for `SnapIndicatorOverlay`.

**Key files:** `tldrawSnap.ts`, `snapManager.ts`, `SnapIndicatorOverlay.tsx`

---

## 3. Door/Window Placement

### WORKING ✓
- Wall snap via `snapOpeningToWall()`; auto-rotation to wall direction
- Presets: doors 800/900/1200 mm; windows 600/1200/1800 mm
- Drag ghost preview
- Metadata: `wallId`, `wallPosition`, `isAttached`
- Swing: left/right/both; variants single/double/sliding/folding doors; single/double/sliding/fixed/awning windows

### MISSING / FUTURE — **P1 launch gap**
- Typed offset from wall start
- **Opening collision** — no overlap check on same wall segment
- Auto wall-cut notch at opening

**Key files:** `DoorWindowPlacementTool.ts`

---

## 4. Dimension Display

### WORKING ✓
- Live SVG labels at wall midpoint; mm below 1000, metres above
- Double-click edit rescales wall
- Offset above wall body (half-thickness + 4 px)
- Toggle `showDimensions`; updates during draw

### MISSING / FUTURE
- Live unit switch (`wallDimensionUnit` in store; ShapeUtil hardcodes mm/m)
- Cumulative chain dimensions (total run length)

**Key files:** `PlannerWallShapeUtil.tsx`, `planMetrics.ts`

---

## 5. Room Tool

### WORKING ✓
- Auto detection: DFS cycles in wall graph → room shapes
- Manual rectangle drag-to-draw; default 120×90 on click
- Shoelace area; auto-naming by area band
- Snap via `snapEditorPointOrGrid`

### MISSING / FUTURE
- Multi-click polygon rooms
- Room-to-wall binding after wall edits

**Key files:** `PlannerRoomTool.ts`, `RoomDetectionTool.ts`

---

## 6. Blueprint & Layers (M3 — geometry-adjacent)

### WORKING ✓
- Blueprint underlay import + opacity (`BlueprintPanel`, `BlueprintUnderlay`)
- PDF blueprint import and first-page rendering
- Multi-page PDF session navigation
- Blueprint nudge, center, reset, and render scale controls
- Canvas-side blueprint move mode with visible frame/center/scale affordances
- Trace guide quick-action HUD for wall/room workflows
- Two-point calibration (`CalibrationCapture`)
- Calibration scale in area metrics (`planMetrics.ts`)
- Layer hide locks shapes + excludes from export/3D (`layerVisibility.ts`, `exportActions.ts`)

### MISSING / FUTURE
- PDF crop / rotate QA
- Playwright proof of calibration accuracy

---

## 7. Summary Table

| Feature | Status | Completeness | Test evidence |
|---|---|---|---|
| Wall draw with snap | Working | 90% | Manual; no E2E |
| Shift-key angle constraint | Working | 100% | `constrainToAngle` in code |
| Grid / endpoint / segment snap | Working | 100% | `geometry.test.ts` |
| Connected wall edits | Working | 85% | — |
| Wall split + junction detection | Working | 100% | — |
| Dimension labels + edit | Working | 100% | — |
| Door/window wall-snap | Working | 90% | — |
| Room auto-detection | Working | 80% | — |
| Blueprint + calibration | Working | 90% | M3 checklist + 0504 parity tests in `02-PLANNER.md` |
| Layer hide → export/3D exclude | Working | 90% | `layerVisibility.ts` |
| Layer manager | Working | 75% | `LayerManagerPanel`, `layerManagerEntries.test.ts`; lint/browser audit open |
| Visual snap indicators | Working | 85% | Shipped; no automated UI test |
| Axis-aligned guide lines | Missing | 0% | — |
| Opening collision detection | Missing | 0% | **P1** — `07-CAPABILITY-MATRIX.md` |
| Chain wall drawing mode | Missing | 0% | — |

---

## P0 / P1 Next Steps (geometry)

| Priority | Item | Suggested approach |
|---|---|---|
| **P1** | Opening collision on wall | Segment interval overlap check before place; reject + toast |
| **P1** | Axis-aligned guides | Render faint H/V lines when snap aligns to peer wall |
| **P1** | Move `catalogBlockBridge.test.ts` → `tests/planner/` | SH chair counts then run in `test:planner` |
| **P2** | Polygon room tool | Multi-click + close path |
| **P2** | E2E snap indicator | Playwright canvas interaction |

---

## Key Files (index)

| Area | Path |
|---|---|
| Walls | `features/planner/tldraw/tools/WallTool.ts` |
| Snap core | `features/planner/tldraw/tools/tldrawSnap.ts`, `snapManager.ts` |
| Snap UI | `features/planner/editor/SnapIndicatorOverlay.tsx` |
| Openings | `features/planner/tldraw/tools/DoorWindowPlacementTool.ts` |
| Rooms | `features/planner/tldraw/tools/PlannerRoomTool.ts`, `RoomDetectionTool.ts` |
| Metrics | `features/planner/editor/planMetrics.ts` |
| Layers | `features/planner/editor/layerVisibility.ts` |
| Blueprint | `features/planner/editor/BlueprintPanel.tsx`, `CalibrationCapture.tsx` |
| Geometry tests | `tests/planner/geometry.test.ts` |

---

## Cross-References

| Topic | Doc |
|---|---|
| Competitive priority | `07-CAPABILITY-MATRIX.md` |
| Test gate | `06-TESTING.md` |
| Milestones M3 | `02-PLANNER.md` |
| Phase 0 DB/tooling | `10-MIGRATION-PHASES.md` |

---

## Future Enhancement Ideas (non-P0)

### Monsoon Analyzer (P2)
Seasonal material/ventilation recommendations for Indian climates. See prior draft in repo history.

### Gateway/Parking Fit Checker (P1)
Vehicle footprint vs entrance width (IS 2750, IRC 66, NBC 2016). New `VehicleFitTool` candidate.

### Vastu Compliance Mode
Cross-reference: `02-PLANNER.md` brainstorming section.
