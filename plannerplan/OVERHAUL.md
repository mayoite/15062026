# Planner workspace overhaul

**Scope:** Overhaul the live planner at `/planner/guest/` and `/planner/canvas/` — not the marketing pages, not admin, and with blueprint removed from product scope.

**Outcome:** A facilities admin opens the guest planner, completes setup, sees a usable room shell within 60 seconds, places real catalog furniture, switches to 3D with matching positions, and exports a PDF — without console errors.

---

## 1. Architecture (as shipped)

```
app/planner/(workspace)/guest/page.tsx
  └─ PlannerWorkspaceRoute          features/planner/ui/PlannerWorkspaceRoute.tsx
       └─ ProjectSetupGate          onboarding: metadata → StartingPointStep
            └─ PlannerWorkspace     features/planner/editor/PlannerWorkspace.tsx
                 ├─ PlannerWorkspaceLayout / PlannerCanvasStage   (shell)
                 ├─ FabricCanvasWorkspace                        (2D engine)
                 │    └─ createFloorplanCanvasApi()              canvas-fabric/hooks/floorplanCanvas.ts
                 ├─ Planner3DViewer (dynamic)                     3d/Planner3DViewer.tsx
                 └─ buildPlannerDocumentFromEditor()            document/plannerDocumentBridge.ts
                      └─ buildPlannerDocumentFromFabric()       lib/fabricDocumentBridge.ts
```

**Data flow:** Fabric JSON → `getPlannerFabricRuntime().exportDraft()` → `PlannerDocument.sceneJson` → `buildPlanner3DSceneDocument()` → R3F meshes.

**Persistence:** Guest autosave via `usePlannerFabricAutosave` → IndexedDB (`persistence/persistence.ts`). `supabaseSync` flag is **off** — member cloud save is out of scope for this overhaul unless explicitly added in WS5.

---

## 2. North-star journeys (acceptance)

Each journey needs a **screenshot or Playwright assertion** — no “looks fine in dev” claims.

### J1 — Fresh guest (the 3-minute CTA)

1. `/planner/guest/` → project setup (name, city, sq ft, seats, purpose)
2. Starting point → **room shell visible** (walls or room rect sized from sq ft)
3. Click one catalog desk → item appears at cursor, draggable
4. Autosave shows saved within 10 s
5. Export modal opens

### J2 — Draw workflow

1. Wall tool (W) → drag wall segment → persists after reload
2. Room tool → drag rect → area label visible
3. Door on wall → snaps to wall
4. Measure tool → dimension label in mm (not inches-only)
5. Undo/redo reverses last action

### J3 — Template

1. Empty canvas → “Use template” → pick layout → objects on canvas
2. Second apply with existing shapes → confirmation dialog

### J4 — 2D ↔ 3D parity

1. Place 3 known catalog items at fixed coordinates (fixture JSON)
2. 2D positions match 3D mesh centers within **≤ 150 mm**
3. Orbit frames all furniture; walk camera does not start inside geometry
4. Product labels capped (distance fade or max 8 visible)

### J5 — AI assist

1. AI drawer → suggest layout for seat target
2. Preview SVG shows furniture positions
3. Apply → furniture lands at preview coordinates (not stack at origin)

### J6 — Member restore

1. `/planner/canvas/?id=<uuid>` loads saved IndexedDB/session doc
2. Canvas not blank; object count matches status bar

---

## 3. Workstreams

### WS1 — Trust the canvas (P0)

**Problem:** Users report drawing tools that do nothing, blank backgrounds, and wheel zoom that does not work (BUG-08/09/10). Without this, every other feature is untestable.

**Files**

| File | Action |
|---|---|
| `canvas-fabric/hooks/floorplanCanvas.ts` | Verify `mouse:wheel` → `zoomToPointer` fires; ensure `refitCanvas` runs after `importDraft`, tab return, and `SplitViewLayout` pane resize |
| `canvas-fabric/hooks/fabricDrawTools.ts` | Audit each tool (`line`, `measure`, `rect`, `pen`, `eraser`); fix `formatMeasureLabel` — currently inch-based while canvas uses mm (`FABRIC_TO_MM = 10`) |
| `editor/PlannerToolRail.tsx` + `plannerStepBindings.ts` | Wall/room/door tools route through `applyToolBinding` → Fabric room-edit mode; add matrix test |
| `editor/PlannerCanvasStage.tsx` | Empty-canvas overlay already mounted when `shapeCount === 0`; confirm `allowCanvasDragThrough` does not block wall drag |
| `app/css/core/planner/fabric-canvas-workspace.css` | Canvas host `width:100%` — verify mobile 390×844 |

**Deliverables**

1. `tests/fixtures/planner-guest-wall.json` — minimal wall + reload proof
2. `tests/e2e/planner-canvas-trust.spec.ts` — wall create, wheel zoom changes `data-zoom`, reload restores count
3. Per-tool table in CHECKLIST (pass/fail per tool)

**Exit:** J2 steps 1–5 green in Chromium; no blank canvas on desktop + mobile fixture.

---

### WS2 — Honest onboarding + layout apply (P0)

**Problem:** The starter-shell bootstrap path now exists, but it still depends on incomplete layout application. `RoomPresetsOnOpen` is `return null`. Meanwhile `suggestLayoutGridPack()` in `ai/spaceSuggest.ts` already computes `walls`, `room`, and `furniture` from setup metadata — but `applySuggestedLayout()` still **drops the walls array** and calls `placeCatalogItem()` **without coordinates**.

```156:209:features/planner/ai/applySuggestedLayout.ts
export function applySuggestedLayout(_editor?: null, layout?: SuggestedLayoutJson): void {
  // inserts ROOM rect, zones, furniture
  // layout.walls is NEVER consumed
  // placeCatalogItem(workspaceItem) ignores item.x / item.y
}
```

**Files**

| File | Action |
|---|---|
| `onboarding/StartingPointStep.tsx` | Keep bootstrap path minimal and make it seed the canvas only when no draft exists |
| `onboarding/projectSetup.ts` | Export `metadataToSpaceSuggestInput()` |
| `ai/spaceSuggest.ts` | Keep `buildShellOnlyLayout(metadata)` as the canonical starter-shell generator |
| `ai/applySuggestedLayout.ts` | **Fix:** insert walls via `runtime.insertObject({ type: 'WALL', ... })`; place furniture at `item.x/item.y` via `insertObject` or positioned `placeCatalogItem` |
| `canvas-fabric/context/FloorplanContext.tsx` | Confirm `InsertPayload` supports wall segments from suggest JSON |

**Starting-point UX (keep simple)**

| Option | Behavior |
|---|---|
| Start from scratch | Shell only (walls + room label) from sq ft |
| Use template | Open `TemplatePickerModal` (already wired from empty canvas) |
| AI layout (stretch) | Open left tab `ai-assist` with seat count pre-filled |

Do **not** add blueprint import back. Remove any remaining `floorPlanImport` or blueprint wording when it implies a live feature.

**Deliverables**

1. Unit test: `applySuggestedLayout` with grid-pack fixture → Fabric export contains ≥4 wall objects
2. Integration test: `ProjectSetupGate` completion → workspace `shapeCount > 0`
3. J1 green end-to-end

**Exit:** Guest never lands on a lie — shell or explicit empty canvas with honest copy.

---

### WS3 — Single 2D↔3D coordinate contract (P1)

**Problem:** 3D items drift because the bridge misreads Fabric geometry.

```43:66:features/planner/lib/fabricDocumentBridge.ts
const cx = (Number(o.left) || 0) * FABRIC_TO_MM;
const cy = (Number(o.top) || 0) * FABRIC_TO_MM;
// Fabric origin is top-left; 3D uses centerMm — no origin offset
```

Room size falls back to `DEFAULT_ROOM` (5000×4000 mm) when walls exist but no room rect — causing orbit framing to clip or float furniture outside the visible floor.

**Files**

| File | Action |
|---|---|
| `lib/fabricDocumentBridge.ts` | Compute `centerMm` from `left/top/width/height/scale/angle/originX/originY`; derive room bounds from wall extents when no room shape |
| `canvas-fabric/fabricSceneUtils.ts` | Shared `fabricObjectToSceneItem()` used by bridge + tests |
| `3d/types.ts` | `buildPlanner3DSceneDocument` — room from wall AABB, not document fallback alone |
| `3d/Planner3DViewer.tsx` | `SceneMetrics` from item bounds; label `Html` distance scaling; walk spawn outside geometry |

**Deliverables**

1. `tests/fixtures/planner-3d-parity.json` + `tests/unit/planner-3d-parity.test.ts` — assert item `centerMm` for 3 placed desks
2. `data-render-evidence="ready"` set after first rendered frame (already at line ~507 — add E2E wait)
3. J4 green

**Exit:** Known fixture passes ±150 mm; screenshots from 2026-06-21 parity failures do not recur.

---

### WS4 — One inspector, real Review gates (P1)

**Problem:** Right panel mounts two inspectors:

```831:832:features/planner/editor/PlannerWorkspace.tsx
<PropertiesInspector step={plannerStep} />
<FabricPropertiesInspector />
```

`PropertiesInspector` subscribes to `shapeInspectorBridge` with `editor={null}` — always empty state. `FabricPropertiesInspector` lists selection but cannot edit rotation, seats, or delete.

`countMeasurementShapes()` in `plannerStep.ts` returns hard-coded `0`, so `canOpenExport` ignores measurements.

**Files**

| File | Action |
|---|---|
| `canvas-fabric/components/FabricPropertiesInspector.tsx` | Expand: rotation, lock, delete, seat count (catalog items), dimension inputs |
| `editor/inspector/PropertiesInspector.tsx` | Delete or reduce to thin wrapper — one panel |
| `editor/shapeInspectorBridge.ts` | Deprecate; route through `FloorplanContext` |
| `editor/plannerStep.ts` | `countMeasurementShapes()` → read Fabric runtime / `name.startsWith('DRAW:measure')` |
| `editor/planMetrics.ts` | Align `furnitureCount`, `wallCount` with Fabric export parser |

**Deliverables**

1. Selecting a desk in Review shows editable width + rotation in one panel
2. Export gate requires `hasSpaceShell && hasFurniture` (keep) + optional measurement hint
3. `planner-chrome.spec.ts` inspector test updated for unified panel

**Exit:** J1 step 5 + J2 measure tool update inspector; no duplicate empty panels.

---

### WS5 — Maintainability + proof loop (P2)

**Problem:** `PlannerWorkspace.tsx` is 967 lines — session handlers split out but canvas/view/panel wiring remains a god component. `COMMAND-INVENTORY.md` references removed UI (Rooms tab, blueprint). `test:planner` timeout uninvestigated.

**Files**

| File | Action |
|---|---|
| `editor/PlannerWorkspace.tsx` | Extract: `usePlannerViewMode`, `usePlannerCatalogDrop`, `usePlannerDocument` hooks (mirror existing `usePlannerSessionHandlers` split) |
| `plannerplan/COMMAND-INVENTORY.md` | Rewrite toolbar table against live DOM (Library + AI tabs only) |
| `tests/e2e/planner-custom-tools.spec.ts` | Already covers wall/room/door — make serial-isolated (`clearPlannerStorage` in `beforeEach`) |
| `features/planner/editor/CONTENTS.md` | Regenerate via `npm run docs:sync:all` after moves |

**Out of scope unless product asks:** `supabaseSync`, `offlineMode`, i18n extraction, panorama export, and any blueprint-style import workflow.

**Deliverables**

1. `PlannerWorkspace.tsx` ≤ 600 lines
2. `test:planner` completes < 120 s (profile and fix hang)
3. CHECKLIST handover row per session

**Exit:** Next engineer can run WS1 task without reading 967-line file.

---

## 4. Sprint schedule

| Sprint | Workstream | Ship criterion |
|---|---|---|
| **S1** (week 1) | WS1 + WS2 | J1 + J2 core |
| **S2** (week 2) | WS3 | J4 fixture green |
| **S3** (week 3) | WS4 + WS5 | J3, J5, J6 + test suite stable |

Parallel safe: WS5 inventory/doc updates during S1.

---

## 5. Test map (minimum)

| Journey | Primary test | Owner file |
|---|---|---|
| J1 | `planner-guest-workspace.spec.ts` (extend) | e2e |
| J2 | `planner-custom-tools.spec.ts` | e2e |
| J3 | `planner-editor-PlannerWorkspace.test.tsx` template guard | integration |
| J4 | `planner-3d-parity.test.ts` (new) | unit |
| J5 | `applySuggestedLayout` unit + AI drawer integration | unit/integration |
| J6 | `planner-hooks-usePlannerFabricAutosave.test.tsx` | integration |

**Gate before merge:** `npm run typecheck` + `npm run test:planner` + manual J1 in browser.

---

## 6. Explicit non-goals

- Reintroduce blueprint / PDF underlay / calibration capture
- Replace Fabric with another canvas engine
- New backend tables or auth flows
- Marketing page redesign (`/planner/` hero stays)
- Full Hindi i18n pass

---

## 7. Handover template

```markdown
- Date:
- Branch:
- Workstream:
- Journeys verified: J?
- Files:
- Commands + result:
- Screenshot path:
- Blocker:
- Next: (exact file + function)
```
