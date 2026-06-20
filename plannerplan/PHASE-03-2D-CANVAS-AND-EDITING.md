# Phase 3 - 2D Canvas and Editing

## Goal

Prove every Fabric editing tool, geometry mutation, selection path, and history operation.

## Functional matrix

- Select: single selection, deselection, move, resize, rotate, inspector sync.
- Pan/zoom: mouse, trackpad, buttons, boundaries, retained viewport.
- Wall/room: all drag directions, short drags, snapping, connected geometry, dimensions.
- Door/window: valid wall placement, invalid placement, move along wall, delete with parent wall.
- Furniture/zone/measure: click and drag creation, bounds, labels, counts, serialization.
- Erase/delete: toolbar, keyboard, protected objects, multi-selection.
- History: undo/redo after every mutation class; redo invalidation after a new mutation.
- Grid/snap: toggle, visible alignment, scale correctness, snapping at different zooms.
- Workflow steps: Draw, Place, Review defaults and disabled-transition rules.
- Empty state, reset, templates, and existing-document state.

## Task checklist

- [ ] **P3-01 Canvas lifecycle:** initialize once, fit stage, resize, unmount, remount and dispose all listeners.
- [ ] **P3-02 Select:** select/deselect, drag, resize, rotate, multi-select, inspector synchronization and locked/hidden objects.
- [ ] **P3-03 Line/curve/pen:** create in all directions, minimum gesture, color, stroke, undo and serialization.
- [ ] **P3-04 Rectangle/room:** reverse drag, fill/no-fill, dimensions, room edit, corners and bounds.
- [ ] **P3-05 Measure:** units, label, scale, zoom independence, delete, export and reload.
- [ ] **P3-06 Eraser/delete:** hover target, erase, keyboard delete, multi-delete, protected relationships and undo.
- [ ] **P3-07 Clone/rotate:** cloned IDs, offset, rotation precision, repeated action and history.
- [ ] **P3-08 Group/ungroup:** eligibility, nested prevention, transform preservation, serialization and history.
- [ ] **P3-09 Arrange/center:** every alignment action, disabled state, canvas center and multi-selection.
- [ ] **P3-10 Wall/opening geometry:** joins, splits, reverse drawing, door/window placement, movement and deletion cascade.
- [ ] **P3-11 Grid/snap/zoom:** toggle, visible state, zoom buttons/trackpad, fit and documented Snap availability.
- [ ] **P3-12 Context menu/shortcuts:** open/close, enabled commands, Escape and conflict with text inputs.
- [ ] **P3-13 Layers:** visibility, counts, hidden selection, export rules and restore.
- [ ] **P3-14 Stress:** 100/500 objects, rapid tool switching and repeated undo/redo without corruption.

## State assertions required per mutation

Every mutation test must verify visible canvas state, canonical serialized object, status metrics, history state, autosave revision and 3D bridge impact where applicable.

## Work

1. Test runtime registration and cleanup so Fabric listeners do not duplicate after remount or view switching.
2. Assert object counts and serialized geometry, not only visual presence.
3. Verify layer visibility does not mutate or delete hidden objects.
4. Verify inspector edits update canvas, document, history, autosave, and 3D projection.
5. Exercise drag/drop cancellation, drop outside canvas, rapid tool switching, Escape, and keyboard shortcuts.
6. Add regression coverage for wall/opening relationships and reverse-direction drawing.
7. Validate reset behavior with dirty state and ensure destructive actions require clear confirmation.
8. Test large plans for interaction latency and memory growth.

## Primary files

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/canvas-fabric/FabricCanvasWorkspace.tsx`
- `features/planner/canvas-fabric/hooks/floorplanCanvas.ts`
- `features/planner/canvas-fabric/hooks/fabricDrawTools.ts`
- `features/planner/canvas-fabric/hooks/fabricWalls.ts`
- `features/planner/editor/inspector/PropertiesInspector.tsx`
- `features/planner/store/plannerHistoryStore.ts`
- `tests/e2e/planner-custom-tools.spec.ts`

## Required tests

- One E2E test per tool and one combined real-user flow.
- Unit geometry tests for boundaries, snapping, openings, and serialization.
- Integration tests for history and inspector synchronization.
- Repeated mount/unmount listener test and a 100-object smoke test.

## Exit gate

All editing operations produce correct geometry, history, metrics, persistence revisions, and keyboard-visible state without listener leaks or silent no-ops.

## Deliverables

- Active Fabric E2E suite replacing obsolete custom-rail assumptions.
- Geometry/history integration fixtures.
- Canvas lifecycle leak test.
- Documented unavailable controls; no control may silently claim functionality.
