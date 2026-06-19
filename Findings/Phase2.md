# Phase 2: 3D Viewer Swap

## Goal

Replace the old `PlannerViewer` (legacy, `PlannerViewerShape`-based, no WebGL fallback) with the new `Planner3DViewer` (Fabric-aware, WebGL probe, orbit + walk mode, camera memory, scene metrics). Delete the old `features/planner/viewer/` directory. Move shared materials to the new location.

## Estimated Time

4–6 hours

## Prerequisites

Phase 1 (CSS & Foundation) must be complete. The new CSS classes (`planner-viewer-chip`, `planner-viewer-surface`, `typ-caption`, `typ-caption-lg`) must exist.

## Tasks

### 2.1 Move shared materials before deleting old viewer

The new `Planner3DViewer.tsx` imports `FOCSS_3D_COLORS` from `@/features/planner/viewer/viewerMaterials`. That file must survive the deletion.

**Option A (recommended):** Move `viewerMaterials.ts` into `features/planner/3d/`

```bash
mv features/planner/viewer/viewerMaterials.ts features/planner/3d/viewerMaterials.ts
```

Then update the import in `features/planner/3d/Planner3DViewer.tsx`:

```diff
- import { FOCSS_3D_COLORS } from "@/features/planner/viewer/viewerMaterials";
+ import { FOCSS_3D_COLORS } from "./viewerMaterials";
```

**Option B:** Keep `viewerMaterials.ts` in `viewer/` and do not delete that directory until Phase 3. But this leaves zombie code. Prefer Option A.

### 2.2 Create shapes-to-document adapter

File: `features/planner/lib/fabricDocumentBridge.ts`

Append this function at the end of the file (after `loadPlannerDocumentIntoFabric`):

```typescript
/**
 * Convert a flat array of PlannerViewerShape (used by the old 3D viewer)
 * into a minimal PlannerDocument that the new Planner3DViewer accepts.
 * This is a thin bridge for the swap phase; it will be removed after
 * the workspace stops producing PlannerViewerShape arrays.
 */
export function shapesToPlannerDocument(shapes: Array<{
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
  catalogId?: string;
}>): PlannerDocument {
  const items: PlannerSceneItem[] = shapes
    .filter((s) => s.type === "planner-furniture" || s.type === "planner-wall" || s.type === "planner-room")
    .map((s, index) => ({
      id: s.id || `shape-${index}`,
      name: s.label || s.type,
      category: s.type === "planner-furniture" ? "Furniture" : s.type === "planner-wall" ? "Wall" : "Room",
      centerMm: {
        xMm: Math.round((s.x + s.width / 2) * 10),
        yMm: Math.round((s.y + s.height / 2) * 10),
      },
      sizeMm: {
        widthMm: Math.round(s.width * 10),
        depthMm: Math.round(s.height * 10),
        heightMm: 900,
      },
      rotationDeg: s.rotation || 0,
      color: s.color,
    }));

  const roomShape = shapes.find((s) => s.type === "planner-room");
  const wallShapes = shapes.filter((s) => s.type === "planner-wall");

  let widthMm = 5000;
  let depthMm = 4000;

  if (roomShape) {
    widthMm = Math.round(roomShape.width * 10);
    depthMm = Math.round(roomShape.height * 10);
  } else if (wallShapes.length > 0) {
    const xs = wallShapes.flatMap((w) => [w.x, w.x + w.width]);
    const ys = wallShapes.flatMap((w) => [w.y, w.y + w.height]);
    widthMm = Math.round((Math.max(...xs) - Math.min(...xs)) * 10);
    depthMm = Math.round((Math.max(...ys) - Math.min(...ys)) * 10);
  }

  const sceneJson: PlannerSceneEnvelope = {
    type: "cad-suite-planner-scene",
    version: 1,
    measurement: {
      canonicalUnit: "mm",
      displayUnit: "mm",
      sourceUnit: "mm",
    },
    room: {
      widthMm,
      depthMm,
      wallHeightMm: 2400,
      wallThicknessMm: 120,
      floorThicknessMm: 40,
      originMm: { xMm: 0, yMm: 0 },
    },
    items,
  };

  return createPlannerDocument({
    id: crypto.randomUUID(),
    name: "Workspace Plan",
    sceneJson: toPlannerJsonSafe(sceneJson),
    roomWidthMm: widthMm,
    roomDepthMm: depthMm,
    itemCount: items.length,
    unitSystem: "metric",
  });
}
```

You will need to import `PlannerSceneEnvelope`, `PlannerSceneItem`, `createPlannerDocument`, and `toPlannerJsonSafe` at the top of `fabricDocumentBridge.ts` if they are not already imported.

### 2.3 Swap the 3D viewer in PlannerWorkspace

File: `features/planner/editor/PlannerWorkspace.tsx`

**Step A:** Change the import (around line 16):

```diff
- import { PlannerViewer } from "@/features/planner/viewer/PlannerViewer";
+ import { Planner3DViewer } from "@/features/planner/3d/Planner3DViewer";
```

Also remove the `PlannerViewerShape` type import if it is only used for the old viewer:

```diff
- import type { PlannerViewerShape } from "@/features/planner/viewer/PlannerViewer";
```

**Step B:** Replace the `canvas3D` definition (around line 653):

```diff
  const canvas3D = (
    <Suspense fallback={<PlannerSkeleton />}>
      <div className="pw-viewer-host h-full min-h-0 w-full">
-       <PlannerViewer viewMode="3d" shapes={fabric3DShapes} />
+       <Planner3DViewer document={shapesToPlannerDocument(fabric3DShapes)} />
      </div>
    </Suspense>
  );
```

Make sure `shapesToPlannerDocument` is imported from `@/features/planner/lib/fabricDocumentBridge`.

### 2.4 Verify SplitViewLayout still works

The `SplitViewLayout` component (in `features/planner/shared/components/SplitViewLayout.tsx`) renders `children3D` inside a `pw-split-pane--3d` div. It does not care what the child is. Confirm that the `Planner3DViewer` root `div` has `className="h-full min-h-0 w-full"` behavior — it does, because it already uses `className="surface-inverse relative overflow-hidden rounded-[2rem] ... h-full min-h-[420px] w-full"`.

If the layout looks wrong in split mode, add `h-full w-full` to the `Planner3DViewer` root or wrap it in an extra div in `PlannerWorkspace.tsx`.

### 2.5 Delete old viewer directory

After the swap is verified, delete these files:

```bash
rm features/planner/viewer/PlannerViewer.tsx
rm features/planner/viewer/FixtureMeshes.tsx
rm features/planner/viewer/InstancedFurnitureRenderer.tsx
rm features/planner/viewer/SceneEnvironment.tsx
rm features/planner/viewer/ShadowConfig.tsx
rm features/planner/viewer/viewerFraming.ts
# viewerMaterials.ts was already moved in Task 2.1
```

If any other file imports from `features/planner/viewer/`, update the import to `features/planner/3d/viewerMaterials` or remove the import.

### 2.6 Update 3D index barrel

File: `features/planner/3d/index.ts`

Ensure it exports the viewer as the canonical 3D surface:

```typescript
export { Planner3DViewer } from "./Planner3DViewer";
export { FOCSS_3D_COLORS } from "./viewerMaterials";
// ... existing exports
```

### 2.7 Manual QA Checklist

Open `/planner/canvas` in the browser and verify:

- [ ] Switch to 3D view — the 3D scene loads (no blank canvas)
- [ ] Orbit camera — drag to rotate around the room
- [ ] Walk mode — click the "Walk" button, click into the canvas, WASD moves the camera
- [ ] Empty scene warning — with no items placed, the "Empty mapped scene" warning appears
- [ ] Item labels — furniture items show labels above them (check `planner-viewer-chip` styling)
- [ ] WebGL fallback — if you disable WebGL in devtools, the fallback message shows
- [ ] Dark mode — toggle dark mode, the overlay panels and background adapt
- [ ] Split view — switch to "Split" view, both 2D canvas and 3D viewer are visible side-by-side

### 2.8 Verify

```bash
npm run typecheck
npm run lint
```

## Verification Checklist

- [ ] `viewerMaterials.ts` moved to `features/planner/3d/viewerMaterials.ts`
- [ ] `Planner3DViewer.tsx` imports `viewerMaterials` from `./viewerMaterials`
- [ ] `shapesToPlannerDocument()` exists in `fabricDocumentBridge.ts`
- [ ] `PlannerWorkspace.tsx` imports `Planner3DViewer` from `features/planner/3d/Planner3DViewer`
- [ ] `PlannerWorkspace.tsx` `canvas3D` uses `<Planner3DViewer document={...} />`
- [ ] Old `features/planner/viewer/` files deleted (except `viewerMaterials.ts` which was moved)
- [ ] No production code imports from `features/planner/viewer/`
- [ ] `features/planner/3d/index.ts` exports `Planner3DViewer`
- [ ] Manual QA passed (orbit, walk, split, empty warning, dark mode)
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0

## What This Unblocks

Phase 3 (Bridge Unification) can now assume the 3D viewer is the canonical renderer and does not need to support `PlannerViewerShape`.