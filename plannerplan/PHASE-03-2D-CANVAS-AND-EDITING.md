# Phase 3 — 2D Canvas and Editing

## Goal

Prove every Fabric editing tool, geometry mutation, selection path, and history operation. Fix confirmed bugs BUG-01, BUG-03, BUG-06, BUG-08, BUG-09, and BUG-10 in this phase.

---

## Bugs to fix in this phase

### BUG-01 — `getBoundingRect` copy-paste error
**File:** `features/planner/canvas-fabric/hooks/floorplanCanvas.ts` line 1002
```ts
// CURRENT (wrong):
if (obj.left < top) { top = obj.top; }

// CORRECT:
if (obj.top < top) { top = obj.top; }
```
This breaks "Align Top" and "Align Bottom" in the Arrange toolbar for multi-selection. Fix is one character; add a unit test covering `getBoundingRect` with 3+ objects at different positions.

### BUG-03 — `FabricGridBridge` fires in 3D mode
**File:** `features/planner/editor/PlannerWorkspace.tsx` ~line 180
```tsx
// CURRENT — renders unconditionally:
<FabricGridBridge />

// CORRECT — guard against 3D-only mode:
{viewMode !== '3d' && <FabricGridBridge />}
```
The `window` keydown listener inside `FabricGridBridge` fires when the Fabric canvas is inactive/disposed in 3D mode. Add an E2E or integration test that switches to 3D mode and verifies the Grid (`G`) key does not produce a console error.

### BUG-06 — `@ts-nocheck` in `floorplanCanvas.ts`
Remove `// @ts-nocheck` and the 4 eslint-disable comments from the top of `floorplanCanvas.ts`. Fix all resulting TypeScript errors incrementally:
1. Add `FabricCanvas` type annotation to `view`.
2. Type the geometry helpers (`getBoundingRect`, `locateDW`, `isDW`, `filterObjects`) with explicit param types.
3. Replace `any` in event handlers with `fabric.TEvent` or the appropriate Fabric v6 event type.
4. Run `npm.cmd run typecheck` to confirm zero errors on the file after each step.
Do not rewrite the logic — only add types. Preserve all existing comments.

### BUG-08 — Drawing tools workflow does not complete user actions
**Reported:** 2026-06-21. The drawing toolbar is visible, but selecting a tool does not provide a reliable end-to-end workflow or visible result.

Audit Select, Line, Measure, Curved line, Rectangle, Pen/Free draw, and Eraser independently. Verify selected state, cursor/mode change, pointer gesture, object creation/deletion, completion behavior, history, metrics, autosave, and reload. Add visible guidance for tools requiring multiple clicks or completion keys. `aria-pressed` alone is not proof that a tool works.

### BUG-09 — Blank canvas, missing background, and invisible elements
**Reported:** 2026-06-21 and reproduced at 390x844. Controls and metrics render while the 2D canvas appears blank, even though the canvas exists and metrics report objects.

Inspect CSS size, backing-store dimensions, viewport transform, fit-to-stage timing, mobile panel measurements, stacking/opacity, grid background, restored object coordinates, and restore-before-layout races. The canvas needs a visible background/floor boundary. Existing objects must fit in view after load, resize, orientation change, panel collapse, and mobile Canvas-tab activation.

### BUG-10 — Mouse-wheel/trackpad zoom does not work
**Reported:** 2026-06-21. Zoom buttons are visible, but mouse-wheel scrolling over the canvas does not zoom.

Wheel over the canvas must zoom around the pointer. Trackpad pinch/`ctrlKey` must zoom without scrolling the page. Clamp the supported range, synchronize the percentage, preserve the pointer anchor, prevent passive-listener errors, and remove listeners on dispose.

---

## Functional matrix

- **Select:** single selection, deselection, move, resize, rotate, inspector sync, locked/hidden objects.
- **Pan/zoom:** mouse, trackpad, buttons, boundaries, retained viewport.
- **Wall/room:** all drag directions, short drags, snapping, connected geometry, dimensions.
- **Door/window:** valid wall placement, invalid placement, move along wall, delete with parent wall.
- **Furniture/zone/measure:** click and drag creation, bounds, labels, counts, serialization.
- **Erase/delete:** toolbar, keyboard, protected objects, multi-selection.
- **History:** undo/redo after every mutation class; redo invalidation after a new mutation.
- **Grid/snap:** toggle, visible alignment, scale correctness, snapping at different zooms.
- **Workflow steps:** Draw, Place, Review defaults and disabled-transition rules.
- **Empty state, reset, templates, existing-document state.**

---

## Task checklist

- [ ] **P3-01 Canvas lifecycle:** initialize once, fit stage, resize, unmount, remount, dispose all listeners. Assert zero orphaned `window` event listeners after dispose using `getEventListeners` (devtools) or a spy. *(needs E2E/integration)*
- [ ] **P3-02 Select:** select/deselect, drag, resize, rotate, multi-select, inspector synchronization, locked objects, hidden objects (layer visibility off). *(needs E2E)*
- [ ] **P3-03 Line/curve/pen:** create in all directions, minimum gesture (< 5 px), color, stroke width, undo and serialization round-trip. *(needs E2E)*
- [ ] **P3-04 Rectangle/room:** reverse drag, fill/no-fill, dimensions, room edit mode enter/exit, corners, bounds, undo. *(needs E2E)*
- [ ] **P3-05 Measure:** units match workspace unit system, label text, scale independence from zoom, delete, export inclusion, and reload. *(needs E2E)*
- [ ] **P3-06 Eraser/delete:** hover target, erase gesture, keyboard `Delete`/`Backspace`, multi-delete, protected relationships (wall corners cannot be independently deleted), undo. *(needs E2E)*
- [ ] **P3-07 Clone/rotate:** cloned objects get new IDs, correct offset (`RL_AISLEGAP`), rotation precision (15° and 90°), repeated clone chain, history count. *(needs E2E)*
- [ ] **P3-08 Group/ungroup:** eligibility check (walls/corners cannot be grouped), nested prevention, transform preservation after ungroup, serialization round-trip, history. *(needs E2E)*
- [x] **P3-09 Arrange/center — BUG-01:** Fixed `getBoundingRect` copy-paste: `obj.left < top` → `obj.top < top` at `floorplanCanvas.ts:1002`. Alignment tests (`planner-projectSetup.test.ts`) cover bounding rect invariants.
- [ ] **P3-10 Wall/opening geometry:** joins, splits, reverse drawing direction, door placement on wall vs. off-wall, window placement, movement along wall, deletion cascade (wall removes its doors/windows). *(needs E2E)*
- [ ] **P3-11 Grid/snap/zoom:** `G` key toggles grid (assert `gridEnabled` in `FloorplanContext`), visible grid pattern changes, zoom buttons, trackpad pinch (E2E mock), `fitToStage()`, zoom range clamping ([20, 150]). *(needs E2E)*
- [ ] **P3-12 Context menu/shortcuts:** right-click opens menu, menu closes on Escape, enabled commands match selection state, keyboard shortcuts do not fire when focus is inside an `<input>` or `<textarea>`. *(needs E2E)*
- [ ] **P3-13 Layers:** toggle each layer category; assert objects in that category become `visible: false` on canvas; assert hidden objects are excluded from export; assert layer state restores after reload. *(needs E2E)*
- [ ] **P3-14 Stress:** 100 objects placed via `handleInsert` in a loop; assert canvas renders without error. Rapid 20× undo/redo cycle; assert final state matches initial state. 500 objects is a stretch goal. *(needs E2E)*
- [x] **P3-15 BUG-03 fix + test:** `FabricGridBridge` keydown handler now reads `[data-view-mode]` from the DOM and skips grid toggle when `activeViewMode === '3d'`. Fabric canvas is inactive in 3D-only mode.
- [ ] **P3-16 BUG-06 lift:** remove `@ts-nocheck`. Confirm `npm.cmd run typecheck` passes. Confirm `npm.cmd run lint` passes on the file. *(requires careful incremental TS typing — deferred, needs type-safe pass)*
- [ ] **P3-17 BUG-08 drawing workflow:** test every active Fabric tool. Record gesture, completion action, created object type, status/history/autosave change, and reload result. Fix silent tools and missing guidance.
- [ ] **P3-18 BUG-09 canvas visibility:** reproduce desktop/mobile blank states; assert host and backing canvas dimensions are nonzero; restore a known fixture; fit after layout settles; verify background/grid and every fixture object is visible.
- [ ] **P3-19 BUG-10 wheel zoom:** repair canvas wheel handling. Assert pointer-anchored zoom, displayed percentage, min/max clamp, no unwanted page scroll, trackpad pinch, and listener cleanup.
- [ ] **P3-20 Responsive canvas activation:** switch Library → Canvas → Properties → Canvas at 390x844 and after orientation change; each return recalculates dimensions and displays the same objects.

---

## State assertions required per mutation

Every mutation test must verify: visible canvas object count, canonical serialized geometry (JSON round-trip), status bar metrics, history stack length, autosave revision increment (if applicable), and 3D bridge document impact where the mutation is room/furniture.

---

## `resolveLayerCategory` regression

The layer-name resolver at `floorplanCanvas.ts:883–899` uses string prefix matching. Add unit tests asserting each prefix maps to the correct `PlannerLayerCategory`:
- `CORNER` → `walls`
- `WALL:0` → `walls`
- `DOOR` → `walls`
- `WINDOW` → `walls`
- `DRAW:measure` → `measurements`
- `DRAW:line` → `zones`
- `GENERIC:Sofa` → `furniture`
- `TABLE` → `furniture`
- `unknown-name` → `null`

---

## Primary files

- `features/planner/canvas-fabric/hooks/floorplanCanvas.ts` ← BUG-01, BUG-06
- `features/planner/editor/PlannerWorkspace.tsx` ← BUG-03
- `features/planner/canvas-fabric/FabricCanvasWorkspace.tsx`
- `features/planner/canvas-fabric/hooks/fabricDrawTools.ts`
- `features/planner/canvas-fabric/hooks/fabricWalls.ts`
- `features/planner/editor/inspector/PropertiesInspector.tsx`
- `tests/e2e/planner-custom-tools.spec.ts`
- `tests/unit/floorplanCanvas.test.ts` ← create if absent
- `app/css/core/planner/fabric-canvas-workspace.css` — canvas sizing/background/visibility
- `app/css/core/planner/planner-responsive.css` — mobile canvas layout

---

## Required tests

- Unit: `getBoundingRect` with 3+ objects at known positions (BUG-01).
- Unit: `resolveLayerCategory` for all name patterns.
- Unit: `dispose()` does not throw on already-disposed canvas.
- Integration: listener count before and after mount/unmount cycle is equal.
- E2E: one test per tool type and one combined real-user draw flow.
- E2E: 3D-mode `G` key does not error (BUG-03).
- E2E: Arrange toolbar alignment after BUG-01 fix.
- E2E: active drawing-tool workflow matrix with visible created/deleted results.
- E2E: restored fixture visible on desktop and 390x844 mobile Canvas tab.
- E2E: mouse wheel and trackpad-style zoom update scale around the pointer and survive remount.

---

## Exit gate

All editing operations produce correct geometry, history, metrics, persistence revisions, and keyboard-visible state without listener leaks or silent no-ops. `getBoundingRect` bug resolved. `FabricGridBridge` guarded. `@ts-nocheck` removed and typecheck passes.
