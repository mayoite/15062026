# Planner retired — 2026-06-12

Orphan or superseded modules removed from live `features/planner/` during consolidation.

| Archived file | Replaced by |
|---|---|
| `viewer/BuddyViewer.tsx` | `features/planner/viewer/PlannerViewer.tsx` |
| `editor/EmptyCanvasState.tsx` | `features/planner/ui/PlannerEmptyCanvas.tsx` |
| `editor/inspector/ElementInspector.tsx` | Inspector wired via `editor/inspector/inspectorTypes.ts` + shape bridge |
| `ai/PlannerAdvisorChat.tsx` | `features/planner/ai/AiAdvisorChat.tsx` |
| `shared/components/AiAdvisorChat.tsx` | `features/planner/ai/AiAdvisorChat.tsx` |
| `ui/CatalogDropGhost.tsx` | `features/planner/catalog/CatalogDropGhost.tsx` |
| `tldraw/shapes/shapeUtils/catalogBlockBridge.test.ts` | `tests/planner/catalogBlockBridge.test.ts` |

Not imported by the live app.
