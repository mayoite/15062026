# Workspace Audit Checklist

Visible evidence only. Statuses reflect files/tests in the repo right now, not hoped-for work. Updated with Meitner, Kuhn, and Raman agent outputs.

| Section | Task | Status | Note |
|---|---|---|---|
| A | Fix the portal persistence import against the current exported contract | Partial | Typecheck blocker was fixed by importing `listPlannerDocumentsFromStore` from `features/planner/store/plannerSaves`, but the final target `features/planner/persistence/index.ts` barrel is still missing. |
| A | Remove `@ts-nocheck` by correcting types | Partial | The lint slice cleaned the touched files, but some legacy `@ts-nocheck` files still remain elsewhere. |
| A | Fix hook and immutability errors without rule suppression | Done | Meitner fixed lint blockers in `AdminPlansPageView.tsx`, `fabricDrawTools.ts`, `ExportModal.tsx`, `PlannerSubTopBar.tsx`, and `ShadowConfig.tsx`; focused eslint passed. |
| A | Pass `npm.cmd run typecheck` and `npm.cmd run lint` | Partial | Fresh 2026-06-19 baseline: typecheck exits 0; full lint exits 1 with four `@typescript-eslint/ban-ts-comment` errors in planner files. |
| B | Write characterization tests for save, list, load, rename, delete, import, and hydration | Partial | Coverage exists across `tests/plannerPersistence.test.ts`, `tests/plannerCloudSaves.test.ts`, `tests/planner-store-plannerDraft.test.ts`, `tests/planner-store-plannerImport.test.ts`, and `tests/planner-store-plannerSaves.test.ts`. |
| B | Export persistence only through `features/planner/persistence/index.ts` | Not done | That barrel does not exist yet; callers still import store-layer persistence modules directly. |
| B | Migrate one caller group at a time | Partial | Some code now uses `features/planner/persistence/*`, but store-layer persistence is still live and widely referenced. |
| B | Convert old files to temporary re-exports only when necessary | Not done | The legacy persistence files remain full implementations, not thin compatibility exports. |
| B | Delete compatibility files after `rg` reports zero callers | Not done | `rg` still finds many direct callers, so no compatibility cleanup is complete. |
| C | Define one versioned Zod schema | Done | `features/planner/model/plannerDocument.ts` has `plannerDocumentSchema` with `schemaVersion: 1` and normalized IDs, units, room dims, scene JSON, counts, and timestamps. |
| C | Implement one Fabric-to-document adapter | Done | `features/planner/lib/fabricDocumentBridge.ts` builds canonical planner documents from Fabric snapshots, and `PlannerWorkspace.tsx` uses it. |
| C | Make persistence, portal, admin, BOQ, export, AI, and 3D consume it | Partial | Fabric bridge usage exists. Raman aligned top-level document room dimensions with the Fabric-derived scene and filtered structural/annotation Fabric objects from canonical item counts, but not every consumer is unified yet. |
| C | Add Fabric -> document -> JSON -> normalize -> Fabric round-trip tests | Partial | Bridge tests exist (`tests/planner-document-plannerDocumentBridge.test.ts`, `tests/planner-lib-fabricDocumentBridge.test.ts`) and Raman added Fabric -> document -> 3D sync coverage; full normalize -> Fabric round-trip remains incomplete. |
| C | Remove obsolete bridge implementations | Not done | `features/planner/document/plannerDocumentBridge.ts` and `features/planner/shared/document/types.ts` still exist as legacy bridge/type surfaces. |
| D | Wire templates, blueprint calibration, AI placement, layers, undo/redo, import, export, and autosave | Partial | `PlannerWorkspace.tsx` wires import/export/autosave/layers. Kuhn replaced AI extraction/application stubs with Fabric runtime parsing and insertion bridges. Templates and blueprint calibration still need completion. |
| D | Ensure every mutation increments the autosave revision | Partial | Autosave tracks `fabricRevisionKey`, but it is derived from state lengths rather than a visible per-mutation counter. |
| D | Add focused Fabric behavior tests before removing stubs | Partial | New Fabric-facing tests are present (`tests/planner-lib-fabricDocumentBridge.test.ts`, `tests/planner-fabricToViewerShapes.test.ts`, `tests/planner-ui-PlannerWorkspaceRoute.test.tsx`, `tests/planner-ai-fabric-bridges.test.ts`), but stubs/legacy paths remain. |
| E | Record which renderer is mounted by workspace, portal, admin, and tests | Partial | Workspace and tests still mount `features/planner/viewer/PlannerViewer`; portal/admin are not unified on the new scene package. |
| E | Choose one camera, controls, environment, materials, and scene adapter | Partial | `features/planner/viewer/*` and `features/planner/3d/*` both provide their own scene/rendering stacks. |
| E | Add nonblank canvas, framing, item-count, and WebGL fallback tests | Done | Existing 3D tests cover types/materials, and Raman added `tests/planner-3d-Viewer.test.tsx` for framing expansion and fallback UI. |
| E | Delete the unused renderer after import scans show zero callers | Not done | The old renderer is still imported by `PlannerWorkspace.tsx`, so there are active callers. |
| F | Classify every result from the planner tldraw/legacy scan | Partial | `tests/INVENTORY.md` lists many `planner-tldraw-*` cases, and live code still contains `tldraw` references. |
| F | Remove stale references from planner `CONTENTS.md` files and Fabric index comments | Not done | Planner `CONTENTS.md` files and several code comments still mention tldraw. |
| F | Remove active tldraw engines and flags after saved-plan compatibility is checked | Not done | `features/planner/model/plannerIdentity.ts` still includes `engine: "tldraw"`, and feature-flag text still names tldraw. |
| F | Keep old-format support only at the import boundary when real saved plans require it | Partial | Legacy compatibility still flows through document and persistence code, not just a narrow import edge. |
| 05 | Classify all tests by domain and runner before moving them | Partial | `tests/INVENTORY.md` exists, but tests remain in a flat root layout. |
| 05 | Remove tests that assert retired tldraw implementation details | Not done | `tests/INVENTORY.md` still lists many `planner-tldraw-*` entries, and legacy assertions remain in the tree. |
| 05 | Preserve behavior coverage for routes, planner documents, persistence, Fabric, catalog identity, BOQ, 3D, accessibility, and navigation | Partial | Coverage exists across those areas, but it is still mixed with legacy checks and not fully reorganized. |
| 05 | Update Vitest patterns only after destination folders exist | Not done | No `tests/unit`, `tests/integration`, or `tests/e2e` destination tree is visible. |
| 05 | Update Playwright paths and reporters so evidence stays under `results/` | Not done | Playwright specs still live under `tests/*.spec.ts`, with no visible `results/playwright-report` migration evidence. |
| 05 | Verify coverage does not drop because of file moves | Not done | No coverage artifact or migration-run evidence is visible in the workspace. |

## Agent Implementation Notes

- Meitner: completed planner lint blocker slice for `AdminPlansPageView.tsx`, `fabricDrawTools.ts`, `ExportModal.tsx`, `PlannerSubTopBar.tsx`, and `ShadowConfig.tsx`; focused eslint and typecheck passed.
- Kuhn: implemented Fabric AI bridges in `applySuggestedLayout.ts` and `extractCanvasPlacements.ts`; added `tests/planner-ai-fabric-bridges.test.ts`; tests and typecheck passed. Limitation: Fabric runtime still does sequential auto-placement, so absolute AI x/y placement needs a deeper runtime contract change.
- Raman: improved Fabric document -> 3D sync in `plannerDocumentBridge.ts`, `fabricDocumentBridge.ts`, and `Planner3DViewer.tsx`; added/updated document and 3D viewer tests; focused tests, typecheck, and focused eslint passed.

Visible work in progress is strongest around the Fabric workspace, the Fabric-to-document bridge, AI-to-Fabric bridging, and newer 3D tests; the legacy tldraw and old bridge surfaces are still present beside them.

## Fresh Baseline Evidence — 2026-06-19

| Command | Exit | Evidence | Result |
|---|---:|---|---|
| `npm.cmd run typecheck` | 0 | `results/repo-audit/baseline-typecheck.txt` | Passed. |
| `npm.cmd run lint` | 1 | `results/repo-audit/baseline-lint.txt` | 4 errors, all banned `@ts-nocheck`. |
| `npm.cmd run test` | 1 | `results/repo-audit/baseline-test.txt` | 3 failed files, 3 failed tests, 1 worker error. |
| `npm.cmd run test:planner` | 1 | `results/repo-audit/baseline-planner.txt` | 3 failed files, 3 failed tests, 1 worker error. |

Failure details are recorded in `results/repo-audit/baseline-failures.md`.

### Sequential failure confirmation

The three failed files from the full test baseline were rerun individually with one worker. All three exited 1 and reproduced their original failures without the suite-level worker/OOM error:

- `navigation-data.test.ts`: 1 failed, 24 passed.
- `planner-editor-exportActions.test.ts`: 1 failed, 3 passed.
- `planner-editor-PlannerLeftPanel.test.tsx`: 1 failed, 1 passed.

The `planner-catalog-exports.test.ts` timeout seen only in the concurrent planner suite remains unconfirmed in isolation.
