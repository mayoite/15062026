1. High-signal differences
16062026 replaced the old editor contract with a Fabric shell plus ad-hoc bridges. In 15062026, [PlannerWorkspace.tsx (line 15)](E:/Goodsites/15062026/features/planner/editor/PlannerWorkspace.tsx:15) mounted SharedTldrawEngine, listened to document/session/camera changes via store.listen at [460 (line 460)](E:/Goodsites/15062026/features/planner/editor/PlannerWorkspace.tsx:460), and rendered Planner3DViewer document={viewerDocument} at [626 (line 626)](E:/Goodsites/15062026/features/planner/editor/PlannerWorkspace.tsx:626). In 16062026, [PlannerWorkspace.tsx (line 98)](E:/16062026/features/planner/editor/PlannerWorkspace.tsx:98) mounts FloorplanProvider, polls Fabric state with setInterval at [188 (line 188)](E:/16062026/features/planner/editor/PlannerWorkspace.tsx:188) and [568 (line 568)](E:/16062026/features/planner/editor/PlannerWorkspace.tsx:568), exposes window.__fabricPlaceCatalog / window.__fabricExportDraft at [224 (line 224)](E:/16062026/features/planner/editor/PlannerWorkspace.tsx:224) and [235 (line 235)](E:/16062026/features/planner/editor/PlannerWorkspace.tsx:235), and drives 3D with raw shapes via PlannerViewer at [745 (line 745)](E:/16062026/features/planner/editor/PlannerWorkspace.tsx:745).

Export behavior regressed from real engine export to placeholders. 15062026 used editor.getSvgString, finalizePlannerExportSvg, and editor.toImage in [exportActions.ts (line 250)](E:/Goodsites/15062026/features/planner/editor/exportActions.ts:250). 16062026 hard-disables SVG/PNG export in [exportActions.ts (line 208)](E:/16062026/features/planner/editor/exportActions.ts:208) and [212 (line 212)](E:/16062026/features/planner/editor/exportActions.ts:212), and replaces room derivation with a fixed 5000 x 4000 fallback at [102 (line 102)](E:/16062026/features/planner/editor/exportActions.ts:102).

The semantic editor bridges were replaced by stubs. In 16062026, [shapeInspectorBridge.ts (line 3)](E:/16062026/features/planner/editor/shapeInspectorBridge.ts:3) returns null / no-ops, [PropertiesInspector.tsx (line 53)](E:/16062026/features/planner/editor/inspector/PropertiesInspector.tsx:53) always shows “Nothing selected”, [planMetrics.ts (line 25)](E:/16062026/features/planner/editor/planMetrics.ts:25) always returns EMPTY_METRICS, and [LayerManagerPanel.tsx (line 14)](E:/16062026/features/planner/editor/LayerManagerPanel.tsx:14) says layer management is unavailable. Those were live, selection-driven surfaces in 15062026.

The canonical document path got thinner and lossier. 15062026’s [plannerDocumentBridge.ts (line 18)](E:/Goodsites/15062026/features/planner/document/plannerDocumentBridge.ts:18) built from live shapes, real metrics, and stored tldrawSnapshot at [45 (line 45)](E:/Goodsites/15062026/features/planner/document/plannerDocumentBridge.ts:45). 16062026’s version uses getPageMetrics(null) at [25 (line 25)](E:/16062026/features/planner/document/plannerDocumentBridge.ts:25) and stores workspace + fabricSnapshot at [53 (line 53)](E:/16062026/features/planner/document/plannerDocumentBridge.ts:53) and [54 (line 54)](E:/16062026/features/planner/document/plannerDocumentBridge.ts:54), which is weaker than the old semantic scene contract.

The test surface is badly out of sync with the replacement. 15062026 still had 28 planner-tldraw-* tests; 16062026 has 0 files, but tests/planner-editor-mockEditor.ts still imports missing [`planner-tldraw-mockEditor` (line 8)](E:/16062026/tests/planner-editor-mockEditor.ts:8), and [planner-editor-PlannerWorkspace.test.tsx (line 12)](E:/16062026/tests/planner-editor-PlannerWorkspace.test.tsx:12) still mocks SharedTldrawEngine, expects tldraw-engine at [20 (line 20)](E:/16062026/tests/planner-editor-PlannerWorkspace.test.tsx:20), and expects mockEditor.createShape at [181 (line 181)](E:/16062026/tests/planner-editor-PlannerWorkspace.test.tsx:181).

2. Likely regression causes
The migration preserved the shell but removed the old behavioral contracts before Fabric replacements were ready. That shows up as explicit stubs/no-ops rather than subtle bugs.

2D, 3D, persistence, and export no longer share one canonical live model. 15062026 flowed through editor state; 16062026 now mixes raw Fabric JSON, window globals, polling loops, and a simplified document builder. That makes drift very likely.

Export regressions are mostly intentional gaps, not mysteries: SVG/PNG are literally disabled in code, and room/furniture export metadata now comes from coarse Fabric-object guesses instead of real planner shapes.

The review/inspector regressions come from disabled bridges: no selection bridge, no layer bridge, no metrics bridge, so the UI cannot reflect canvas state even if the Fabric canvas itself is working.

The current tests no longer protect the migrated surface. Some still target tldraw-only behavior, and some do not run at all because the old mock harness was removed.

3. Stable patterns from 15062026 to restore or adapt
Restore the contract, not tldraw itself: keep Fabric as the engine, but reintroduce a single adapter boundary equivalent to the old editor contract so autosave, export, inspector, metrics, and 3D all read from one source.

Restore event-driven sync/autosave. The 15062026 pattern in [usePlannerAutosave.ts (line 79)](E:/Goodsites/15062026/features/planner/hooks/usePlannerAutosave.ts:79) and [PlannerWorkspace.tsx (line 460)](E:/Goodsites/15062026/features/planner/editor/PlannerWorkspace.tsx:460) is much stabler than the setInterval polling now used in [usePlannerFabricAutosave.ts (line 78)](E:/16062026/features/planner/hooks/usePlannerFabricAutosave.ts:78) and [PlannerWorkspace.tsx (line 188)](E:/16062026/features/planner/editor/PlannerWorkspace.tsx:188).

Restore a rich canonical document bridge. The 15062026 plannerDocumentBridge pattern of “semantic document + raw snapshot + workspace” should be adapted for Fabric, instead of storing mostly fabricSnapshot and empty metrics.

Restore export adapters behind the existing export surface. exportActions.ts in 15062026 is the stable pattern: real room derivation, real vector export, color finalization, raster fallback. Reimplement that for Fabric rather than keeping disabled placeholders.

Restore bridge-backed review UI. shapeInspectorBridge, metrics, layer visibility/manager, and selection status should become Fabric adapters, not permanent stubs.

Restore the test contract around the new engine. Replace the missing tldraw harness with a Fabric/canvas adapter mock, update workspace tests to assert the Fabric host, and keep the old export/inspector behavior assertions where the user-facing contract should stay the same.

Verification
npm.cmd run typecheck in E:\16062026: passed.
npm.cmd run test -- tests/planner-svg-qa.test.ts: passed, but it only covers catalog block SVG, not planner canvas export.
npm.cmd run test -- tests/planner-editor-exportActions.test.ts and tests/planner-editor-PropertiesInspector.test.tsx: fail before collection because tests/planner-editor-mockEditor.ts imports missing planner-tldraw-mockEditor.