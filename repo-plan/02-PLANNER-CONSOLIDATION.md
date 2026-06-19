# 02 Planner Consolidation

## Goal

Deliver one Fabric/R3F planner with one runtime state layer, one persistence layer, and one PlannerDocument contract.

## A. Restore Type and Lint Health

Priority files:

```text
app/(site)/portal/page.tsx
features/planner/admin/AdminPlansPageView.tsx
features/planner/canvas-fabric/hooks/fabricDrawTools.ts
features/planner/editor/ExportModal.tsx
features/planner/editor/PlannerSubTopBar.tsx
features/planner/hooks/usePlannerWorkspace.ts
features/planner/lib/documentBridge.ts
features/planner/lib/editorTools.ts
features/planner/lib/measurements.ts
features/planner/ui/LayersPanel.tsx
features/planner/viewer/ShadowConfig.tsx
```

- [ ] Fix the portal persistence import against the current exported contract.
- [ ] Remove `@ts-nocheck` by correcting types.
- [ ] Fix hook and immutability errors without rule suppression.
- [ ] Pass `npm.cmd run typecheck` and `npm.cmd run lint`.

## B. Separate State and Persistence

Runtime state remains Zustand-owned:

```text
plannerStore.ts
plannerUIStore.ts
plannerFurnitureStore.ts
plannerGeometryStore.ts
plannerHistoryStore.ts
workspaceStore.ts
notificationStore.ts
toastStore.ts
favoritesStore.ts
```

Persistence remains under `features/planner/persistence/`:

```text
plannerDraft.ts
plannerImport.ts
plannerSaves.ts
plannerSession.ts
plannerCloudApi.ts
cloudPlanHydration.ts
persistence.ts
```

Duplicate candidates to migrate and remove:

```text
features/planner/store/plannerDraft.ts
features/planner/store/plannerImport.ts
features/planner/store/plannerSaves.ts
features/planner/store/plannerPersistence.ts
features/planner/store/plannerProjectStorage.ts
features/planner/store/offlineStorage.ts
features/planner/store/syncQueueProcessor.ts
```

- [ ] Write characterization tests for save, list, load, rename, delete, import, and hydration.
- [ ] Export persistence only through `features/planner/persistence/index.ts`.
- [ ] Migrate one caller group at a time.
- [ ] Convert old files to temporary re-exports only when necessary.
- [ ] Delete compatibility files after `rg` reports zero callers.

## C. One PlannerDocument

Reconcile:

```text
features/planner/document/plannerDocumentBridge.ts
features/planner/lib/documentBridge.ts
features/planner/lib/fabricDocumentBridge.ts
features/planner/shared/document/documentBridge.ts
features/planner/shared/document/types.ts
features/planner/model/plannerDocument.ts
features/planner/model/plannerEnvelope.ts
features/planner/model/planner3dScene.ts
```

- [ ] Define one versioned Zod schema covering IDs, units, room, walls, openings, items, materials, metadata, and timestamps.
- [ ] Implement one Fabric-to-document adapter.
- [ ] Make persistence, portal, admin, BOQ, export, AI, and 3D consume it.
- [ ] Add Fabric -> document -> JSON -> normalize -> Fabric round-trip tests.
- [ ] Remove obsolete bridge implementations.

## D. Finish Fabric

Primary files:

```text
features/planner/editor/PlannerWorkspace.tsx
features/planner/canvas-fabric/FabricCanvasWorkspace.tsx
features/planner/canvas-fabric/FloorplanCanvas.tsx
features/planner/canvas-fabric/hooks/floorplanCanvas.ts
features/planner/canvas-fabric/hooks/fabricDrawTools.ts
features/planner/canvas-fabric/context/FloorplanContext.tsx
features/planner/editor/templates/TemplatePickerModal.tsx
features/planner/editor/BlueprintPanel.tsx
features/planner/editor/CalibrationCapture.tsx
features/planner/editor/BlueprintMoveCapture.tsx
features/planner/ai/applySuggestedLayout.ts
features/planner/ai/extractCanvasPlacements.ts
```

- [ ] Wire templates, blueprint calibration, AI placement, layers, undo/redo, import, export, and autosave.
- [ ] Ensure every mutation increments the autosave revision.
- [ ] Add focused Fabric behavior tests before removing stubs.

## E. Merge 3D Packages

Merge retained implementation from `features/planner/viewer/*` and `features/planner/3d/*` into one `features/planner/scene/` package.

- [ ] Record which renderer is mounted by workspace, portal, admin, and tests.
- [ ] Choose one camera, controls, environment, materials, and scene adapter.
- [ ] Add nonblank canvas, framing, item-count, and WebGL fallback tests.
- [ ] Delete the unused renderer after import scans show zero callers.

## F. Remove tldraw Residue

- [ ] Classify every result from the planner tldraw/legacy scan.
- [ ] Remove stale references from planner `CONTENTS.md` files and Fabric index comments.
- [ ] Remove active tldraw engines and flags after saved-plan compatibility is checked.
- [ ] Keep old-format support only at the import boundary when real saved plans require it.

## Acceptance Gate

A user can create, edit, template, calibrate, save, reload, import, export, and inspect the same plan in synchronized 2D and 3D views.
