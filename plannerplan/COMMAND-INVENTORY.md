# Command Inventory

> Created by Phase 1. Update this table as the UI evolves.
> For each command: map it to its handler, the store mutation it triggers, the user-visible feedback, and the nearest existing test.

## How to use

- `covered` = passing test exists and exercises this command end-to-end.
- `partial` = a test exists but does not cover the full state transition.
- `missing` = no test.
- Link `partial`/`missing` rows to the Phase task that will add coverage.

---

## Toolbar — PlannerTopBar

| Command | Handler | Store mutation | User feedback | Test coverage |
|---|---|---|---|---|
| Save | `handleSaveDraft` | `savePlannerDraftDocument` + `setLocalDraftVersion` | Status message "Saved …" | missing → P5-04 |
| Save as new | `handleSaveAsNewSession` | new UUID session in localStorage | Status message "New session created …" | missing → P5-04 |
| Open sessions | `setIsSessionOpen(true)` | none | Session dialog opens | missing → P5-05 |
| Import JSON | `importInputRef.current.click()` | `applyPlannerDocument` | Canvas replaced | missing → P5-08 |
| Export | `setIsExportOpen(true)` | none | Export modal opens | missing → P6-11 |
| Plan name edit | `setPlanNameOverride` | none | Name shown in header | missing |
| View: 2D | `setViewMode('2d')` | none | Canvas visible, 3D hidden | partial |
| View: Split | `setViewMode('split')` | none | Both visible | partial |
| View: 3D | `setViewMode('3d')` | none | 3D visible, canvas hidden | partial |
| Ctrl+Tab | `setViewMode` toggle | none | View mode cycles | missing |
| Reset chrome layout | `resetPlannerChromeLayout()` | localStorage chrome keys cleared | Layout resets | missing |

## Toolbar — PlannerStepBar

| Step | Handler | Left tab set to | Tool set to | Test coverage |
|---|---|---|---|---|
| Draw | `handlePlannerStepChange('draw')` | `rooms` | `wall` / `room` | missing → P3-11 |
| Place | `handlePlannerStepChange('place')` | `library` | `select` | missing |
| Review | `handlePlannerStepChange('review')` | `review` | `select` | missing |

## PlannerToolRail (Fabric tool bindings)

| Tool | Keyboard shortcut | Handler | Fabric mode | Test coverage |
|---|---|---|---|---|
| Select | S | `applyToolBinding({plannerTool:'select'})` | `drawTool = 'select'` | missing → P3-02 |
| Wall/Room | W | `editRoom()` | room-edit mode enters | partial |
| Line | L | `applyToolBinding` | `drawTool = 'line'` | missing → P3-03 |
| Rectangle | R | `applyToolBinding` | `drawTool = 'rect'` | missing → P3-04 |
| Measure | M | `applyToolBinding` | `drawTool = 'measure'` | missing → P3-05 |
| Eraser | E | `applyToolBinding` | `drawTool = 'eraser'` | missing → P3-06 |
| Zoom in | + | `setZoom(zoom + 10)` | `view.setZoom` | missing → P3-11 |
| Zoom out | - | `setZoom(zoom - 10)` | `view.setZoom` | missing → P3-11 |
| Grid toggle | G | `toggleGrid()` via FabricGridBridge | `view.backgroundColor` | missing → P3-15 |

## PlannerSubTopBar (secondary tool options)

| Command | Context | Handler | Test coverage |
|---|---|---|---|
| Stroke color | Draw tool active | `applyStrokeToSelection` | missing |
| Fill color | Draw tool active | `applyFillToSelection` | missing |
| Clone | Object selected | via context menu / inspector | missing → P3-07 |
| Rotate CW 15° | Object selected | `rotate(true)` | missing → P3-07 |
| Rotate CW 90° | Object selected, Ctrl held | `rotate(true)` | missing |
| Delete | Object selected | `deleteOp()` | missing → P3-06 |
| Group | ≥2 objects selected | `group()` | missing → P3-08 |
| Ungroup | Group selected | `ungroup()` | missing → P3-08 |

## Context menu (right-click on object)

| Command | Condition | Handler | Test coverage |
|---|---|---|---|
| Align Left | ≥2 selected | `arrange('left')` | missing → P3-09 |
| Align Right | ≥2 selected | `arrange('right')` | missing → P3-09 |
| Align Top | ≥2 selected | `arrange('top')` — BUG-01 | missing → P3-09 |
| Align Bottom | ≥2 selected | `arrange('bottom')` — BUG-01 | missing → P3-09 |
| Center H | object selected | `placeInCenter('HORIZONTAL')` | missing |
| Center V | object selected | `placeInCenter('VERTICAL')` | missing |

## History controls (PlannerHistoryControls)

| Command | Keyboard | Handler | Group aria-label | Test coverage |
|---|---|---|---|---|
| Undo | Ctrl+Z | `undo()` | needs `aria-label="Canvas history"` | missing → P1-07 |
| Redo | Ctrl+Shift+Z | `redo()` | needs `aria-label="Canvas history"` | missing → P1-07 |

## Left panel tabs

| Tab | `leftTab` value | Content | Test coverage |
|---|---|---|---|
| Library | `library` | Catalog + search | partial |
| Rooms | `rooms` | Room presets | missing |
| Blueprint | `blueprint` | BlueprintPanel | missing → P4-11 |
| Layers | `layers` | LayerVisibilityPanel | missing → P3-13 |
| History | `history` | (if exposed) | missing |

## Right panel (PropertiesInspector)

| Command | Condition | Action | Test coverage |
|---|---|---|---|
| Resize (W×D fields) | Object selected | `resizeObject(shapeId, w, h)` | missing |
| Name edit | Object selected | updates object `name` prop | missing |
| Delete object | Object selected | `deleteOp()` | missing |

## Layer panel (LayerVisibilityPanel)

| Layer | Toggle action | Fabric effect | Test coverage |
|---|---|---|---|
| Walls | `setLayerVisible('walls', v)` | WALL/CORNER/DOOR/WINDOW visible | missing → P3-13 |
| Furniture | `setLayerVisible('furniture', v)` | GENERIC/TABLE/CHAIR visible | missing → P3-13 |
| Zones | `setLayerVisible('zones', v)` | DRAW: visible | missing → P3-13 |
| Measurements | `setLayerVisible('measurements', v)` | DRAW:measure visible | missing → P3-13 |
| Blueprint underlay | `setLayerVisible('underlay', v)` | blueprint opacity | missing → P3-13 |

## Export modal (ExportModal)

| Format | Handler | Content | Test coverage |
|---|---|---|---|
| PNG | `exportPngBlob()` + download | Fabric canvas rasterized | missing → P6-11 |
| SVG | `exportSvg()` + download | Fabric canvas vector | missing → P6-11 |
| JSON | `createPlannerExportPayload()` | Full plan document | missing → P5-07 |
| BOQ CSV | (shared/boq export) | Item quantities | missing → P6-12 |
| BOQ JSON | (shared/boq export) | Item quantities structured | missing → P6-12 |

---

*Fill in handler column after Phase 1 command audit. Link each `missing` row to the Phase task that adds coverage.*
