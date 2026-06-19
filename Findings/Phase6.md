# Phase 6: Feature Completion

## Goal

Wire the unfinished features so users can actually use them: templates apply room presets to the Fabric canvas, blueprint calibration sets the canvas scale, and AI suggestions place furniture. This is the user-facing payoff phase.

## Estimated Time

4–6 hours

## Prerequisites

Phase 3 (Bridge Unification) and Phase 4 (Persistence Cleanup) must be complete. The document type is canonical and persistence is unified.

## Tasks

### 6.1 Wire `TemplatePickerModal`

File: `features/planner/editor/PlannerWorkspace.tsx`

The current `handleApplyTemplate` callback shows a toast: "Templates are not yet available on the fabric canvas." Replace this with an actual implementation.

**Step A:** Find the `handleApplyTemplate` function (around line 440):

```typescript
const handleApplyTemplate = useCallback((_template: LayoutTemplate) => {
  setIsTemplateOpen(false);
  setSessionStatusMessage("Templates are not yet available on the fabric canvas.");
}, []);
```

Replace with:

```typescript
const handleApplyTemplate = useCallback((template: LayoutTemplate) => {
  setIsTemplateOpen(false);
  
  // Convert template to Fabric objects and insert them
  const templateObjects = templateToFabricObjects(template);
  if (templateObjects.length === 0) {
    setSessionStatusMessage("This template has no placeable elements.");
    return;
  }
  
  // Insert via the Fabric API
  templateObjects.forEach((obj) => {
    insertObject({ type: obj.type, object: obj });
  });
  
  setSessionStatusMessage(`Applied template: ${template.name}`);
  
  // Move to catalog step so user can place furniture
  syncPlannerStep("catalog");
}, [insertObject, syncPlannerStep]);
```

**Step B:** Implement `templateToFabricObjects` in `features/planner/lib/fabricDocumentBridge.ts` or a new file `features/planner/templates/templateToFabric.ts`:

```typescript
import type { LayoutTemplate } from "./layoutTemplates";

export interface FabricTemplateObject {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  name: string;
}

export function templateToFabricObjects(template: LayoutTemplate): FabricTemplateObject[] {
  // Example: a simple room template creates 4 wall segments
  if (template.id === "cabin") {
    return [
      { type: "wall", left: 0, top: 0, width: 300, height: 4, name: "WALL:Top" },
      { type: "wall", left: 0, top: 300, width: 300, height: 4, name: "WALL:Bottom" },
      { type: "wall", left: 0, top: 0, width: 4, height: 300, name: "WALL:Left" },
      { type: "wall", left: 300, top: 0, width: 4, height: 300, name: "WALL:Right" },
    ];
  }
  
  // Add more templates as needed
  // For now, return empty so we can test the wiring
  return [];
}
```

**Note:** The actual template definitions are in `features/planner/templates/layoutTemplates.ts`. Read that file and map each template to the correct wall / corner / room geometry. The `widthMm` and `heightMm` from the template need to be converted to canvas units (cm or pixels depending on the Fabric scale).

### 6.2 Wire `BlueprintPanel` calibration

File: `features/planner/editor/BlueprintPanel.tsx` and `features/planner/editor/CalibrationCapture.tsx`

The blueprint panel lets users upload a floor plan image and calibrate it against real-world dimensions. The calibration factor needs to be stored and applied to the Fabric canvas.

**Step A:** Add a `canvasScale` field to the workspace store (or `FloorplanContext`):

File: `features/planner/store/workspaceStore.ts`

```typescript
// Add to the store state
export interface PlannerWorkspaceState {
  // ... existing fields
  canvasScale: number; // pixels per mm, or pixels per cm
  setCanvasScale: (scale: number) => void;
}
```

Initialize `canvasScale: 1` (or whatever the default is).

**Step B:** Connect `CalibrationCapture` to set the scale:

In `CalibrationCapture.tsx`, when the user completes calibration:

```typescript
const scale = calculateScale(calibrationDistancePixels, realWorldDistanceMm);
usePlannerWorkspaceStore.getState().setCanvasScale(scale);
```

**Step C:** Apply the scale to new furniture placements:

In `PlannerWorkspace.tsx`, when `placeCatalogIntoFabric` is called, factor in the canvas scale:

```typescript
const placeCatalogIntoFabric = useCallback((item: CatalogItem) => {
  const scale = usePlannerWorkspaceStore.getState().canvasScale;
  const { widthCm, depthCm } = shapePropsToCanvasCm(item.widthMm, item.heightMm);
  insertObject({
    type: "GENERIC",
    object: {
      title: item.shortName || item.name || "Catalog Item",
      width: widthCm * scale,
      height: depthCm * scale,
    },
  });
}, [insertObject]);
```

### 6.3 Verify AI placement wiring

File: `features/planner/ai/applySuggestedLayout.ts`

This file was already updated by the Kuhn agent to use Fabric bridges. Verify it:

- Reads the current Fabric canvas state via `getPlannerFabricRuntime()`
- Converts AI suggestions to `insertObject` calls
- Handles the case where no canvas is active

If the file is missing or incomplete, implement the bridge:

```typescript
import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";

export function applySuggestedLayout(suggestions: Array<{
  catalogId: string;
  x: number;
  y: number;
  rotation: number;
}>) {
  const runtime = getPlannerFabricRuntime();
  if (!runtime) return;
  
  suggestions.forEach((s) => {
    runtime.placeCatalogItem?.({
      id: s.catalogId,
      // ... construct CatalogItem shape
    });
  });
}
```

### 6.4 Verify `PlannerSessionDialog` cloud save

File: `features/planner/ui/PlannerSessionDialog.tsx`

The dialog currently shows "Cloud save is intentionally disabled in this local-first planner session." If the Supabase/Drizzle integration is ready, wire it. If not, keep the message but make it clearer:

```typescript
<button
  disabled
  title="Cloud save requires server connection. Local drafts are saved automatically."
>
  Cloud Save (Coming Soon)
</button>
```

Do not spend more than 30 minutes on this. The priority is template and blueprint wiring.

### 6.5 Manual QA Checklist

- [ ] Open template picker, select a template, click Apply — walls/room appear on canvas
- [ ] Upload a blueprint image, draw calibration line, enter real dimension — canvas scale updates
- [ ] Place furniture after calibration — items appear at correct real-world size
- [ ] Open AI drawer, ask for layout suggestions, click Apply — furniture appears on canvas
- [ ] Save local draft after template/blueprint/AI changes — draft persists on reload

### 6.6 Verify

```bash
npm run typecheck
npm run lint
```

## Verification Checklist

- [ ] `handleApplyTemplate` in `PlannerWorkspace.tsx` inserts objects instead of showing a toast
- [ ] `templateToFabricObjects` function exists and maps at least one template to Fabric objects
- [ ] `canvasScale` field exists in `workspaceStore.ts` (or `FloorplanContext`)
- [ ] `CalibrationCapture.tsx` calls `setCanvasScale` when calibration completes
- [ ] `placeCatalogIntoFabric` uses `canvasScale` when placing items
- [ ] `applySuggestedLayout.ts` uses `getPlannerFabricRuntime()` and `insertObject`
- [ ] Manual QA passed (template, blueprint, AI)
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0

## What This Unblocks

The planner is now a complete, user-facing product. All major features are functional. Phase 7 (Tests) can add focused tests for templates, blueprint, and AI placement. Phase 8 (Final Validation) can run the full smoke test.