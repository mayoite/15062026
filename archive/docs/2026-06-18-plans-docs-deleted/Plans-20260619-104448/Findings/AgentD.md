Findings
The Fabric autosave replacement does not match the old autosave contract, and it is actively breaking planner tests. In [usePlannerFabricAutosave.ts (line 23)](/E:/16062026/features/planner/hooks/usePlannerFabricAutosave.ts:23), the hook now autosaves from a Fabric exporter function instead of waiting for an editor/store, but the surrounding planner tests and expectations still target the old editor-driven behavior. That shows up as direct failures like exportDraftRef.current is not a function and status never reaching "saving". This is a real integration break, not just lint noise.

The planner test surface is still heavily coupled to removed tldraw files, so the repo is currently in a partially-removed state. npm.cmd run test:planner fails with missing imports such as [tests/planner-editor-mockEditor.ts (line 2)](/E:/16062026/tests/planner-editor-mockEditor.ts:2) importing ./planner-tldraw-mockEditor, [tests/planner-editor-overlays.test.tsx (line 21)](/E:/16062026/tests/planner-editor-overlays.test.tsx:21) importing deleted overlay files, and [tests/planner-editor-pure.test.ts (line 13)](/E:/16062026/tests/planner-editor-pure.test.ts:13) importing deleted [plannerCamera.ts](/E:/16062026/features/planner/editor/plannerCamera.ts). That means the tldraw removal is incomplete from a test and compatibility standpoint.

The new workflow/compliance surface is functionally hollow right now. [PlannerWorkflowPanel.tsx (line 18)](/E:/16062026/features/planner/editor/PlannerWorkflowPanel.tsx:18) imports runPlannerComplianceCheck, but never uses it; the panel forcibly clears findings on mount at line 68 and then always renders “No overlap or clearance issues detected.” This lines up with failing compliance tests that now return [] instead of warnings/critical issues.

The Fabric workspace bridge is relying on render-time ref mutation and window globals, which is why lint is flagging it and why the integration is brittle. In [PlannerWorkspace.tsx (line 175)](/E:/16062026/features/planner/editor/PlannerWorkspace.tsx:175), exportDraftRef.current = exportDraft and onUpdate3DShapesRef.current = onUpdate3DShapes happen during render. The same file also exposes __fabricPlaceCatalog, __fabricEditRoom, __fabricExportDraft, and __fabricImportDraft on window. This is workable as a temporary bridge, but it is exactly the kind of replacement scaffolding that tends to drift out of sync.

The document/export bridge for Fabric is still approximate rather than canonical. In [fabricDocumentBridge.ts (line 41)](/E:/16062026/features/planner/lib/fabricDocumentBridge.ts:41), every Fabric object is flattened into generic PlannerSceneItems, while room data stays at a default constant in line 19 and line 66. In [plannerDocumentBridge.ts (line 54)](/E:/16062026/features/planner/document/plannerDocumentBridge.ts:54), the Fabric snapshot is reparsed through a double readFabricExportDraft() call with a non-null assertion. This likely preserves snapshots, but it does not yet give you a reliable semantic planner document.

Several compatibility helpers now return stubbed or missing behavior, and the tests are catching it. Failures show:
selection status now returns null instead of formatted labels
layer visibility helpers are missing or no longer exported as expected
room preset application helpers are missing expected functions
store tests still expect tldraw tool bridging that no longer happens

These are not one isolated bug; they indicate multiple replacement seams are only partially adapted.
Lint is failing in 32 places, and some of those are meaningful quality issues rather than cosmetic cleanup. The notable ones are:[PlannerWorkspace.tsx (line 175)](/E:/16062026/features/planner/editor/PlannerWorkspace.tsx:175) and [usePlannerFabricAutosave.ts (line 34)](/E:/16062026/features/planner/hooks/usePlannerFabricAutosave.ts:34): render-time ref writes
[PlannerWorkflowPanel.tsx (line 68)](/E:/16062026/features/planner/editor/PlannerWorkflowPanel.tsx:68): state set inside mount effect just to clear findings
[ShadowConfig.tsx (line 15)](/E:/16062026/features/planner/viewer/ShadowConfig.tsx:15): mutating gl from useThree()
multiple @ts-nocheck files like [usePlannerWorkspace.ts (line 1)](/E:/16062026/features/planner/hooks/usePlannerWorkspace.ts:1), [editorTools.ts (line 1)](/E:/16062026/features/planner/lib/editorTools.ts:1), [measurements.ts (line 1)](/E:/16062026/features/planner/lib/measurements.ts:1), and [LayersPanel.tsx (line 1)](/E:/16062026/features/planner/ui/LayersPanel.tsx:1)

Verified
npm.cmd run typecheck: passes
npm.cmd run lint: fails with 32 errors
npm.cmd run test:planner: fails
Current planner refactor has a very dirty worktree with many deletions and new Fabric files; I did not change anything
Skipped
I did not edit files
I did not run full Playwright/browser checks
I did not run npm.cmd run test successfully with custom flags; vitest rejected --runInBand
Risks
The repo is not “broken at TypeScript level,” but it is broken at the planner integration level. The biggest risk is false confidence: the code compiles, yet the planner replacement is still split across Fabric runtime code, old tldraw-era tests, and compatibility shims that no longer satisfy either side cleanly.
Next
The clearest diagnosis is:
decide whether the test surface should be migrated to Fabric now or stubbed temporarily,
restore functional compliance/selection/layer helpers,
replace the window-global/ref-mutation bridge with a proper Fabric context path,
then re-run lint and planner tests.
If you want, I can turn this diagnosis into a ranked fix list next without editing yet.