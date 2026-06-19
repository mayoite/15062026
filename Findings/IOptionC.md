Option C: Full Reconciliation — Single Document, Single Viewer, Single Bridge


Problem Statement

The planner codebase has accumulated architectural debt during the tldraw→Fabric migration. Active code contains dual 3D rendering stacks, four document bridge implementations, duplicate persistence layers, missing CSS utilities, and tldraw residue across 12+ files. The user directive mandates: tldraw OUT, Fabric IN, 3D combined, finish today. Option C delivers the full architectural vision: one canonical PlannerDocument, one 3D renderer, one persistence barrel, zero legacy references, and completed features (templates, blueprint calibration, AI wiring).

Current State (Audit Evidence)

Quality Gates
TypeScript: Passes (tsc exits 0)
ESLint: Passes (--max-warnings=0)
Tests: 903/906 pass; 3 failed files + 1 worker error (case-sensitive imports, mock mismatches)
Build: Unverified (next build not executed)

Critical Runtime Defects
Missing CSS utilities: typ-caption, typ-caption-lg, planner-viewer-chip, planner-viewer-surface, planner-viewer-chip-active are referenced in active components but have no @utility declarations. 3D viewer overlays render unstyled.
Case-sensitive import failures: tests/planner-onboarding-onboardingcoach.test.tsx imports onboardingcoach (actual file: OnboardingCoach.tsx). tests/planner-shared-document-documentbridge.test.ts imports documentbridge (actual file: documentBridge.ts). Both fail on Linux/CI.
Export actions test mock mismatch: buildPlannerDocumentFromEditor mock returns { version: 1, shapes: [] } but buildExportMeta expects Fabric snapshot furniture dimensions.

Architecture Contamination
Dual 3D stacks:
features/planner/viewer/PlannerViewer.tsx — old, PlannerViewerShape-based, wired into workspace
features/planner/3d/Planner3DViewer.tsx — new, PlannerDocument-based, has WebGL fallback, walk mode, camera memory, scene metrics — not wired
Four document bridges:
lib/documentBridge.ts — tldraw-era envelope, keeps tldrawSnapshot field
lib/fabricDocumentBridge.ts — Fabric-to-document adapter (active)
document/plannerDocumentBridge.ts — calls buildPlannerDocumentFromFabric + merges workspace metadata
shared/document/documentBridge.ts — legacy bridge, imported only by tests
Duplicate persistence:
persistence/plannerDraft.ts / persistence/plannerSession.ts / persistence/persistence.ts — active persistence layer
store/plannerDraft.ts / store/plannerSaves.ts / store/plannerPersistence.ts / store/plannerProjectStorage.ts / store/offlineStorage.ts / store/syncQueueProcessor.ts — duplicate store-layer persistence
tldraw residue (12+ active files): usePlannerWorkspace.ts, documentBridge.ts, featureFlags.ts, plannerIdentity.ts, portal/PortalPlanPageView.tsx, prompts.ts, plannerSvgExportColors.ts, openingCollision.ts, wallOpenings.ts, store/plannerTypes.ts, catalog/placementCatalogDefaults.ts, lib/geometry/types.ts
Unfinished features: handleApplyTemplate shows toast "not yet available"; BlueprintPanel calibration not wired to Fabric canvas scale; Planner3DViewer not reachable by users.

Theme Consistency
Dark mode token overrides are complete and correct
Planner-scoped typography missing typ-caption / typ-caption-lg
3D viewer overlay classes (planner-viewer-*) have no active CSS definitions

Proposed Changes

Phase 1: CSS & Foundation (2–3 hours)
Add @utility typ-caption and @utility typ-caption-lg to app/css/core/typography/type.css
Add .planner-viewer-chip, .planner-viewer-chip-active, .planner-viewer-surface to app/css/core/planner/planner-overlays.css
Fix case-sensitive test imports (OnboardingCoach, documentBridge)
Verify npm run typecheck and npm run lint pass after changes

Phase 2: 3D Viewer Swap (4–6 hours)
Create shapesToPlannerDocument() adapter in features/planner/lib/fabricDocumentBridge.ts that converts PlannerViewerShape[] → PlannerDocument with minimal scene envelope
Update PlannerWorkspace.tsx canvas3D to render <Planner3DViewer document={...} /> instead of <PlannerViewer viewMode="3d" shapes={...} />
Update Planner3DViewer to accept an optional shapes prop as an alternative to document (or keep the adapter in workspace)
Verify SplitViewLayout still works correctly with the new viewer in split mode
Delete or archive features/planner/viewer/ directory: PlannerViewer.tsx, FixtureMeshes.tsx, InstancedFurnitureRenderer.tsx, SceneEnvironment.tsx, ShadowConfig.tsx, viewerFraming.ts, viewerMaterials.ts
Update features/planner/3d/index.ts to export the new viewer as the canonical 3D surface
Manual QA: orbit camera, walk mode, WebGL fallback, empty-scene warning, item labels, dark mode

Phase 3: Document Bridge Unification (6–8 hours)
Consolidate types: Move PlannerSceneEnvelope, PlannerSceneRoom, PlannerSceneItem from lib/documentBridge.ts into model/plannerDocument.ts as a single plannerSceneEnvelopeSchema (Zod) and export TypeScript types from there
Make lib/fabricDocumentBridge.ts the canonical builder: Remove tldrawSnapshot field from PlannerSceneEnvelope across all files
Deprecate and remove lib/documentBridge.ts: Move getPlannerSceneEnvelope() helper into model/plannerDocument.ts or lib/fabricDocumentBridge.ts
Redirect document/plannerDocumentBridge.ts: Convert to a thin re-export that calls buildPlannerDocumentFromFabric with workspace metadata merged. Add deprecation comment. All production callers should eventually import from lib/fabricDocumentBridge.ts directly
Archive shared/document/documentBridge.ts and shared/document/types.ts: Move to archive/ or delete after confirming zero production callers (only tests import them)
Update all consumers:
exportActions.ts — replace buildPlannerDocumentFromEditor with buildPlannerDocumentFromFabric
Planner3DViewer / buildPlanner3DSceneDocument — use unified envelope types
plannerSceneSync.ts — use unified types
persistence/* — use unified types
ai/* — use unified types
Verify: npm run typecheck, npm run lint, npm run test:planner pass

Phase 4: Persistence Cleanup (4–6 hours)
Create features/planner/persistence/index.ts barrel: Export plannerDraft, plannerSession, plannerImport, cloudPlanHydration, persistence (IndexedDB) as the single public API
Migrate callers one group at a time:
PlannerWorkspace.tsx imports from barrel
exportActions.ts imports from barrel
AdminPlansPageView.tsx imports from barrel
PortalPlanPageView.tsx imports from barrel
Convert duplicate store-layer files to thin re-exports:
store/plannerDraft.ts → re-export from persistence/plannerDraft.ts
store/plannerSaves.ts → re-export from persistence/index.ts (or persistence/plannerSaves.ts if it exists)
store/plannerPersistence.ts → re-export from persistence/persistence.ts
store/plannerProjectStorage.ts → re-export
store/offlineStorage.ts → re-export or delete if unused
store/syncQueueProcessor.ts → re-export or delete if unused
Run rg to confirm zero direct imports of the old store-layer persistence paths from production code
Delete the thin re-exports after confirmation
Verify: all tests pass, no import errors

Phase 5: tldraw Purge (3–4 hours)
Delete features/planner/hooks/usePlannerWorkspace.ts: Entire file is tldraw-based. Confirm zero callers with rg (it is imported by nothing in active workspace code)
Remove engine: "tldraw" from plannerIdentity.ts
Remove tldraw imports from portal/PortalPlanPageView.tsx — replace with Fabric equivalents or stubs
Clean comments: openingCollision.ts, wallOpenings.ts, prompts.ts, plannerSvgExportColors.ts, featureFlags.ts, lib/geometry/types.ts, catalog/placementCatalogDefaults.ts, store/plannerTypes.ts
Remove tldrawSnapshot field from any remaining type definitions
Run rg "tldraw" features/planner and confirm zero matches in .ts / .tsx files (excluding archive/ and test files that will be handled in Phase 7)
Verify: npm run lint, npm run typecheck pass

Phase 6: Feature Completion (4–6 hours)
Wire TemplatePickerModal:
Implement handleApplyTemplate in PlannerWorkspace.tsx
Connect to floorplanCanvas.ts preset loading API (or Fabric canvas equivalent)
Add room preset objects (walls / corners) to Fabric canvas when a template is selected
Wire BlueprintPanel calibration:
Connect CalibrationCapture to Fabric canvas scale/dpi state
Store calibration factor in usePlannerWorkspaceStore or FloorplanContext
Apply scale to all new furniture placements
Wire AI placement:
applySuggestedLayout.ts already has Fabric bridges (completed by Kuhn agent)
Verify extractCanvasPlacements.ts reads from Fabric runtime correctly
Ensure AI suggestions insert objects via insertObject API
Verify PlannerSessionDialog cloud save integration:
The dialog currently disables cloud save with a message. If Supabase/Drizzle integration is ready, wire it; otherwise keep the intentional disable with a clearer message
Manual QA: template selection, blueprint upload, AI assistant drawer

Phase 7: Test Reorganization (4–6 hours)
Fix existing test failures:
navigation-data.test.ts — update SITE_FOOTER_NAV assertions or navigation data
planner-editor-exportActions.test.ts — update mock to match Fabric document shape
planner-editor-PlannerLeftPanel.test.tsx — update Blueprint tab assertion
planner-onboarding-onboardingcoach.test.tsx — fix case-sensitive import (already done in Phase 1)
planner-shared-document-documentbridge.test.ts — fix case-sensitive import (already done in Phase 1), then update to test unified bridge
Delete all planner-tldraw-* test files (listed in tests/INVENTORY.md: ~30 files)
Move remaining tests into subfolders:
tests/planner/unit/ — pure logic tests (document, geometry, measurements, catalog)
tests/planner/integration/ — component tests (workspace, panels, 3D viewer)
tests/planner/e2e/ — Playwright specs (existing *.spec.ts files)
Update Vitest config (vitest.config.ts or config/build/vitest.config.ts) to include new test paths
Verify coverage: Run npm run test -- --coverage. Ensure coverage does not drop below the 903/906 baseline (adjusted for deleted tldraw tests, target: ~850+ passing tests with no module errors)
Update Playwright paths if necessary (check playwright.config.ts)

Phase 8: Final Validation (2–3 hours)
npm run typecheck — must exit 0
npm run lint — must exit 0
npm run test — must pass with 0 module resolution errors and 0 failed tests
npm run test:planner — must pass
npm run build — must complete successfully (this is the critical final gate)
Manual smoke test of /planner/canvas:
2D canvas loads, grid visible, can draw walls
Catalog drag-and-drop places furniture
3D view switch works, orbit camera rotates, walk mode works
Split view shows both 2D and 3D
Save/load local draft works
Export JSON/PNG/SVG works
Dark mode toggle works
Mobile dock works (resize to <768px)

Orchestration

Decision: Use child agents for parallel execution within phases. The full plan is 32–48 hours of sequential work, but 16–24 hours wall-clock with parallelization.

Dependencies and ordering:
Phase 1 (CSS/Foundation) can run standalone and must finish before Phase 2 (3D viewer uses new CSS classes)
Phase 2 (3D Swap) and Phase 5 (tldraw Purge) can run in parallel after Phase 1, but Phase 5 must not delete files that Phase 2 needs (e.g., viewerMaterials.ts is used by new Planner3DViewer — so Phase 2 must coordinate the move of viewerMaterials.ts to 3d/ or keep it)
Phase 3 (Bridge Unification) depends on Phase 2 (new 3D viewer uses unified document types)
Phase 4 (Persistence) depends on Phase 3 (unified document flows through persistence)
Phase 6 (Feature Completion) depends on Phase 3 and 4
Phase 7 (Tests) depends on all prior phases
Phase 8 (Validation) is sequential final gate

Child agents:
agent-css — Phase 1 + Phase 5 comment cleanup (parallel with 3D work)
agent-3d — Phase 2 (3D viewer swap, old viewer deletion)
agent-bridge — Phase 3 (document bridge unification, type consolidation)
agent-persistence — Phase 4 (persistence barrel, duplicate removal)
agent-features — Phase 6 (templates, blueprint, AI wiring) — starts after bridge and persistence
agent-tests — Phase 7 (test fixes, reorganization, tldraw test deletion) — starts after all implementation phases
agent-validate — Phase 8 (final typecheck, lint, test, build, smoke test) — sequential final gate

Merge strategy:
Each agent works in its own git branch off main
agent-css and agent-3d can merge first (independent)
agent-bridge merges after css + 3d
agent-persistence merges after bridge
agent-features merges after persistence
agent-tests merges after all implementation
agent-validate runs on the final merged branch
Single combined PR at the end

Artifact exchange:
Each agent reports changed files, branch name, and validation results via messages
agent-validate receives the final merged branch and runs the full gate

flowchart LR
  Start([Plan approved]) --> A1[agent-css — Phase 1+5]
  Start --> A2[agent-3d — Phase 2]
  A1 --> A3[agent-bridge — Phase 3]
  A2 --> A3
  A3 --> A4[agent-persistence — Phase 4]
  A4 --> A5[agent-features — Phase 6]
  A5 --> A6[agent-tests — Phase 7]
  A6 --> A7[agent-validate — Phase 8]
  A7 --> PR([Single PR to main])

Acceptance Criteria

Functional
/planner/canvas loads with Fabric 2D canvas and new 3D viewer
3D viewer has orbit mode (drag to rotate), walk mode (WASD + mouse look), WebGL fallback
No tldraw imports or active references in features/planner/ production code
Templates apply room presets to Fabric canvas
Blueprint calibration sets canvas scale
AI assistant suggestions place furniture on Fabric canvas
Save/load local drafts work
Export JSON/PNG/SVG/BOQ PDF work

Build Quality
npm run typecheck exits 0
npm run lint exits 0
npm run test passes with 0 module resolution errors and 0 failed tests
npm run build completes successfully
npm run test -- --coverage meets or exceeds baseline coverage (adjusted for deleted tldraw tests)

Architecture
Single canonical PlannerDocument type with Zod schema
Single 3D viewer: features/planner/3d/Planner3DViewer.tsx
Single persistence barrel: features/planner/persistence/index.ts
Zero duplicate document bridge implementations in production code
Zero tldraw references in features/planner/ (excluding archived tests)

Risks and Mitigations

Risk	Mitigation
3D viewer swap breaks split view	Keep SplitViewLayout unchanged; only swap children3D. Test split mode manually.
Planner3DViewer uses viewerMaterials.ts which lives in old viewer/ directory	Move viewerMaterials.ts to 3d/ or lib/ before deleting viewer/. Update all imports.
Bridge unification breaks export/BOQ	Do not change fabricDocumentBridge.ts core logic; only consolidate types and redirect callers. Run export tests after each redirect.
Deleting store-layer persistence breaks Zustand stores	Convert to thin re-exports first, verify with rg, then delete.
tldraw test deletion drops coverage below threshold	Run coverage report before deletion, set target at 85% of current line coverage, add focused tests for new Fabric bridges if needed.
Template/Blueprint wiring is incomplete within time budget	Flag as "Phase 6a: Minimum viable" (template applies basic room shape) and "Phase 6b: Full calibration" (deferred if time runs out).
Production build fails due to Next.js dynamic imports or R3F SSR issues	Use ssr: false on dynamic imports (already in place). Run next build in Phase 8 before any merge.
Multiple agents conflict on shared files (e.g., PlannerWorkspace.tsx)	Assign file ownership: agent-3d owns the canvas3D section; agent-bridge owns the buildCurrentPlannerDocument helper; agent-features owns handleApplyTemplate. Use isolated branches and resolve conflicts during merge.
	Notes

TypeScript version: Stay on 6.x (^6.0.3) per AGENTS.md
No commits/pushes without explicit user request: Per AGENTS.md rules, work in local branches. The user will decide when to push/merge.
Stop and confirm: Do not touch proxy.ts, app/api/, config/build/, platform/, project/ without explicit approval.
Theme maintenance: All new CSS must use var() tokens from theme.css; no hex literals in component CSS.
World-class UI/UX: Ensure all new overlays have backdrop-filter, glassmorphism tokens, proper focus rings, and responsive behavior. Test dark mode on every new surface.

***
Plan version: 1.0
Based on audit conducted: 2026-06-19
Option C: Full Reconciliation