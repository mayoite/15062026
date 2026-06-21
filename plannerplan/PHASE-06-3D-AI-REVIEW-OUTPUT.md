# Phase 6 — 3D, AI, Review, and Output

## Goal

Prove downstream representations and deliverables match the canonical 2D plan and fail safely. Fix BUG-02, BUG-05, BUG-07, and BUG-11 in this phase.

---

## Bugs to fix in this phase

### BUG-02 — WebGL dispose uses stale DOM query
**File:** `features/planner/3d/Planner3DViewer.tsx` lines 596–608

Current code queries `container.querySelector('[data-testid="planner-3d-canvas"]')` in a cleanup function, which runs after the DOM may already be torn down by React.

**Fix — use R3F `onCreated` to capture the renderer:**
```tsx
// Add to component:
const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

// On the <Canvas> element:
<Canvas
  onCreated={({ gl }) => { rendererRef.current = gl; }}
  ...
>

// In cleanup effect:
useEffect(() => {
  return () => {
    rendererRef.current?.dispose();
    rendererRef.current = null;
  };
}, []);
```
Add an integration test: mount then unmount `Planner3DViewer`; assert `renderer.dispose()` was called exactly once.

### BUG-05 — `plannerRuntime.ts` module-level singleton
**File:** `features/planner/canvas-fabric/plannerRuntime.ts` lines 37–42

`currentRuntime` and `currentState` are module-level mutable variables. Under React strict-mode double-mount, the first cleanup (`setPlannerFabricRuntime(null)`) wipes state set by the second mount.

**Fix — move state to context:**
1. Add a `useRef<PlannerFabricRuntime | null>(null)` inside `FloorplanProvider`.
2. Expose it via the existing `FloorplanContext` value (or a new dedicated context).
3. Update all consumers of `getPlannerFabricRuntime()` to read from context.
4. Keep `plannerRuntime.ts` as a thin type-export file; remove the mutable singletons.

**Alternative** (smaller change): replace the module-level variables with a single `Map<symbol, ...>` keyed by a per-component stable `Symbol`, so each mounted instance has isolated state. Choose one approach and document it.

Add a test: double-mount `FloorplanProvider` in strict mode; assert the second mount's runtime survives the first mount's cleanup.

### BUG-07 — `THREE.Clock` deprecation warning
**File:** `features/planner/3d/Planner3DViewer.tsx`

Search for `THREE.Clock` usage. Replace with `THREE.Timer` (introduced in Three.js r163). If the Clock is used inside `useFrame`, remove it — `useFrame` already provides `delta` as the second argument and does not need a manual clock.

### BUG-11 — 3D is WebGL-ready but functionally broken
**Reported with screenshots:** 2026-06-21.

Observed failures:
- Orbit view places furniture outside or through the room instead of matching 2D.
- Product labels are oversized, overlap objects, and dominate the scene.
- Default orbit framing wastes space and does not consistently fit the plan.
- Walk mode starts or moves near/inside walls and furniture; objects clip at screen edges.
- Walk mode lacks a clear safe reset/recovery action.
- `data-webgl-status="ready"` and a nonblank frame are not sufficient acceptance evidence.

Audit canvas units → millimetres → world axes, center versus top-left origin, room origin, rotation sign, width/depth mapping, floor elevation, and wall/opening placement. Derive orbit/walk poses from scene bounds. Keep walk positions inside a safe room envelope. Scale, cap, fade, or hide labels based on distance so they do not obscure the scene.

---

## 3D audit

- 2D, Split, and 3D transitions with empty, small, and large plans.
- Walls, openings, rooms, furniture dimensions, position, rotation, finish, and visibility parity.
- Orbit and walk controls, camera memory after 2D→3D→2D round-trip, resize, theme.
- WebGL unavailable (`webglProbe.ok === false`): fallback message shown, editor remains usable in 2D.
- Context loss (`WEBGL_lose_context`): handled gracefully.
- Render evidence: `data-render-evidence="ready"` set after the first nonblank frame.

**Why `data-render-evidence` is not being set (investigation required):**
In `Planner3DRenderEvidence`, the `addAfterEffect` callback reads pixels from `context.readPixels`. If the center pixel is all zeros (black background before first render), the callback returns early. The fix is likely to: (a) wait until after the first non-trivial render, or (b) check more pixels, or (c) set the attribute after `onCreated` completes. Investigate and fix.

---

## AI audit

The AI uses `POST /api/planner/ai-advisor` with `mode: "space-suggest"`. The client code is in `features/planner/ai/`:
- `spaceSuggest.ts` — `suggestLayout(input)` calls the API; falls back to `suggestLayoutGridPack()` on failure.
- `applySuggestedLayout.ts` — applies `SuggestedLayoutJson` to canvas.
- `catalogMatch.ts` — resolves `catalogItemId` from layout JSON to actual catalog items.
- `AIAssistDrawer.tsx` — UI drawer with prompt input, loading, preview, accept/reject.
- `LayoutPreviewSvg.tsx` — SVG preview of proposed layout before applying.

- Drawer opens, prompt field accepts text, submit sends request.
- Loading state shown during request; cancel aborts the in-flight request.
- Timeout: request > 30 s shows timeout error with retry (but currently **no AbortController** is used in `spaceSuggest.ts` — verify and add).
- API/network failure: `suggestLayout()` catches and falls back to `suggestLayoutGridPack()` silently — **this may hide real errors from the user**. Verify the UI shows whether fallback was used (`usedFallback` is returned but may not be surfaced).
- Malformed LLM response: `parseSuggestedLayoutJson()` does strict validation (version=1, furniture array, room object). Invalid → returns `null` → grid-pack fallback.
- Preview: proposed layout shown via `LayoutPreviewSvg` before mutating canvas.
- Accept: `applySuggestedLayout()` mutates canvas; autosave triggered; undo entry added.
- Reject: canvas unchanged; no history entry.
- Undo after accept: canvas reverts to pre-AI state.
- Guest limits: if AI has a guest usage limit, the limit state must be shown clearly.

---

## Review and output audit

- Workflow findings: each compliance rule produces the correct severity and message.
- Export blockers: shown with specific reason; each blocker is focusable and explains the fix.
- For every enabled export type:

| Export | Assert |
|---|---|
| SVG | Valid XML, room dimensions present, no blueprint data URL |
| PNG | Non-empty blob, dimensions ≥ 1×1, not all-black |
| JSON | See Phase 5 assertions |
| BOQ CSV | One row per placed item, correct quantities and SKUs |
| BOQ JSON | Structured items array with canonical fields |

Every download must be opened and content-verified, not just triggered.

---

## Task checklist

- [ ] **P6-01 Scene parity:** place 3 items with known dimensions; switch to 3D; assert `sceneDocument.items` has 3 entries with matching `widthMm`, `depthMm`, `heightMm`, `centerMm`, `rotationDeg`. Assert room dimensions match.
- [ ] **P6-02 View transition:** 2D → Split → 3D → 2D; at each step assert: canvas/viewer visible, no console error, Fabric canvas not disposed.
- [ ] **P6-03 Camera memory:** switch to 3D, orbit to a known position, switch to 2D, switch back to 3D; assert camera position within ε of the saved pose. Walk mode: similar memory test.
- [ ] **P6-04 Render proof fix:** investigate and fix `Planner3DRenderEvidence`. After fix, assert `data-render-evidence="ready"` is set within 3 s of the 3D view mounting with a non-empty scene.
- [ ] **P6-05 3D failures:** (a) simulate `probeWebGL` returning `{ ok: false }`; assert fallback message shown and 2D remains usable; (b) simulate context loss via `WEBGL_lose_context.loseContext()`; assert error boundary or graceful message; (c) simulate slow mount (> 2 s) by delaying `onCreated`; assert loading fallback shown.
- [x] **P6-06 AI input:** empty prompt → submit disabled; very long prompt → truncated or rejected with message; `buildSpaceSuggestUserPrompt(input)` includes `seatCount`, `purpose`, `floorAreaSqFt` from project context; cancel while loading → `AbortController` now wired in `AIAssistDrawer.tsx` — button becomes "Cancel" during loading, `AbortError` caught and shown as "Cancelled." Grid-pack fallback surfaced to user via `layoutError`.
- [ ] **P6-07 AI response validation:** mock `/api/planner/ai-advisor` to return: (a) `{ layout: validLayout }` → used directly; (b) `{ content: "some LLM text with JSON" }` → `parseSuggestedLayoutJson` extracts and validates; (c) `{ content: "garbage" }` → parse returns `null` → grid-pack fallback used; (d) unknown catalog IDs in `furniture[].catalogItemId` → `catalogMatch.ts` must handle gracefully.
- [ ] **P6-08 AI decision:** `LayoutPreviewSvg` preview appears before canvas mutation. Accept → `applySuggestedLayout()` called, history entry added, autosave triggered. Reject → no canvas change. Undo → canvas reverts. Test: assert `result.usedFallback` is surfaced to user when grid-pack was used.
- [ ] **P6-09 Review findings:** create fixture plans for each compliance rule (min seat count, area per seat, etc.). Assert finding text, severity class, and count match expected values. Assert findings update live when canvas changes.
- [ ] **P6-10 Export blockers:** seed a plan that violates one export rule; assert blocker shown with specific text; fix the issue in canvas; assert blocker disappears.
- [ ] **P6-11 Visual exports:** SVG → parse with DOMParser → assert `<svg>` root, room rect present. PNG → check blob size > 1000 bytes, not solid black. Assert blueprint `dataUrl` does NOT appear in SVG string.
- [ ] **P6-12 Document exports:** JSON (see Phase 5). BOQ CSV → parse → assert header row, item count matches canvas. BOQ JSON → parse → assert `items.length` matches canvas.
- [x] **P6-13 BUG-02 fix + test:** `rendererRef` captured via `Canvas onCreated`. Cleanup `useEffect` calls `rendererRef.current?.dispose()` instead of re-querying the DOM. Integration test needed: mount then unmount `Planner3DViewer`; assert `renderer.dispose()` called once. *(test needs dev-server or jsdom with three.js mock)*
- [x] **P6-14 BUG-05 fix + test:** added `createPlannerFabricRuntimeCleanup()` to `plannerRuntime.ts`. Generation counter incremented on each `setPlannerFabricRuntime(runtime)` call. `PlannerWorkspace.tsx` now returns `createPlannerFabricRuntimeCleanup()` from its useEffect instead of a bare `() => setPlannerFabricRuntime(null)`. Strict-mode double-mount safe. *(unit test still needed)*
- [x] **P6-15 BUG-07 fix:** source search confirms `THREE.Clock` is NOT present in `Planner3DViewer.tsx` or any planner 3D file. No fix needed. Re-check after any `three` dependency bump in case the R3F internal usage changes.
- [ ] **P6-16 Resource cleanup:** after unmounting `Planner3DViewer`, assert: no R3F frame loop running (check `raf` handles), no `pointerlockchange` listener remaining, no keyboard listeners remaining. Measure GPU memory before and after repeated mount/unmount cycles (stretch goal: `performance.memory.usedJSHeapSize` does not grow monotonically).
- [ ] **P6-17 BUG-11 coordinate parity:** use a room fixture with five uniquely placed items. Compare every 2D center/rotation/dimension with 3D scene data and screenshot quadrants. No item may appear outside room bounds unless it is outside in 2D.
- [ ] **P6-18 Orbit framing:** derive target, distance, near/far planes, fog, and shadows from full scene bounds. Verify empty, small, wide, tall, and 100-item plans fit without clipping.
- [ ] **P6-19 Walk safety:** choose a free-floor start pose, enforce room bounds, prevent initial wall/object intersection, add Reset view, and verify Escape releases pointer lock.
- [ ] **P6-20 Label usability:** cap label size, scale by distance, avoid near-plane clipping, fade/hide at unsuitable distances, and prevent labels obscuring most of the scene.
- [ ] **P6-21 Visual acceptance:** capture orbit and walk screenshots for the same fixture. Pass only when geometry, count, placement, camera, labels, and controls are visibly usable.

---

## Primary files

- `features/planner/3d/Planner3DViewer.tsx` ← BUG-02, BUG-07
- `features/planner/canvas-fabric/plannerRuntime.ts` ← BUG-05
- `features/planner/canvas-fabric/context/FloorplanContext.tsx` ← BUG-05 context migration
- `features/planner/ai/spaceSuggest.ts` — AI API call + grid-pack fallback
- `features/planner/ai/AIAssistDrawer.tsx` — AI drawer UI
- `features/planner/ai/applySuggestedLayout.ts` — applies suggested layout to canvas
- `features/planner/ai/catalogMatch.ts` — resolves catalog IDs from AI response
- `features/planner/ai/LayoutPreviewSvg.tsx` — SVG preview before accept
- `features/planner/ai/prompts.ts` — system/user prompt builders
- `features/planner/ai/types.ts` — `SpaceSuggestInput`, `SuggestedLayoutJson`
- `features/planner/editor/PlannerWorkflowPanel.tsx`
- `features/planner/editor/ExportModal.tsx`
- `features/planner/editor/exportActions.ts`
- `features/planner/shared/export/`
- `features/planner/shared/boq/`
- `features/planner/portal/PortalPageView.tsx` — member portal plan list
- `features/planner/portal/PortalPlanPageView.tsx` — member portal plan detail
- `features/planner/admin/AdminPlansPageView.tsx` — admin plan management
- `features/planner/admin/AdminPlanDetailPageView.tsx` — admin plan detail
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/lib/documentBridge.ts`

---

## Required tests

- Unit: `buildPlanner3DSceneDocument` maps known Fabric JSON to correct `Planner3DItem` fields.
- Unit: `Planner3DRenderEvidence` pixel probe sets attribute on non-black frame.
- Integration: `Planner3DViewer` unmount calls `renderer.dispose()` (BUG-02).
- Integration: `FloorplanProvider` strict-mode double-mount preserves runtime (BUG-05).
- E2E: 3D scene parity (3 known items, assert dimensions). WebGL fallback. Render evidence attribute set.
- E2E: AI accept/reject/undo cycle.
- E2E: SVG export parsed and room rect present. BOQ CSV row count matches canvas.
- E2E: known 2D fixture maps inside room bounds with matching positions/rotations in 3D.
- E2E: orbit frames the full scene; walk starts safely, moves, resets, and exits pointer lock without clipping.

---

## Exit gate

3D, AI, review findings, and exported files are derived from the same canonical plan. All three bugs resolved. Render evidence attribute set reliably. Every enabled export content-verified, not just downloaded. No GPU resource leak after repeated mount/unmount.
