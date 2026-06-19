# Repo Audit

Date: 2026-06-19  
Repo: `E:\16062026`

## Scope

This audit focuses on the active Fabric planner replacement and the important surfaces around it:

- planner editor
- Fabric canvas
- 3D viewer
- catalog/export/session flows
- admin
- ops
- portal
- dashboard
- landing and shared site shell

This is a read-only audit. No product code changes were made as part of this report.

## Executive Summary

The repo has a real Fabric migration in place, but the planner is still in a transition state. The biggest problem is not that the shell is missing. The biggest problem is that the planner contract is incomplete across 2D, 3D, persistence, export, inspector, layers, metrics, and portal/admin consumption.

The adjacent product surfaces are more stable than the planner core. Admin, portal, dashboard, and entry flows mostly still exist as route surfaces, but several of the actual planner-facing pages behind them are stubs or partial implementations.

There is also visible product-quality drift:

- placeholder admin and portal screens
- icon inconsistency
- mojibake icon strings
- raw arrow glyphs and emoji in active UI
- local-first/session-only behavior where cloud/admin/member expectations still exist in the surrounding product

## Highest-Priority Findings

## 1. Planner contract is split across incomplete Fabric bridges

### Why this matters

The planner now renders with Fabric, but the old richer editor contract has not been fully replaced. That leaves multiple downstream features working from reduced or partial state.

### Key files

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/document/plannerDocumentBridge.ts`
- `features/planner/hooks/usePlannerFabricAutosave.ts`
- `features/planner/lib/documentBridge.ts`

### Evidence

- `features/planner/lib/fabricDocumentBridge.ts` falls back to a default room:
  - width `5000`
  - depth `4000`
- `features/planner/lib/fabricDocumentBridge.ts` only reliably reloads when `fabricSnapshot` exists.
- `features/planner/document/plannerDocumentBridge.ts` builds the document from Fabric plus workspace metadata, but still derives room shape indirectly and stores a simplified scene payload.
- `features/planner/lib/documentBridge.ts` explicitly contains a deprecated Fabric path that returns `false`.
- `features/planner/hooks/usePlannerFabricAutosave.ts` persists serialized session envelopes, but the richer editor-driven document semantics are thinner than before.

### Risk

- export/load/reload mismatch
- room dimensions drifting from visible canvas state
- downstream portal/admin/member surfaces consuming planner documents with reduced fidelity

## 2. Planner review/editing tools are visibly incomplete

### Why this matters

The planner shell is present, but the deeper editing experience is not yet feature-complete. That makes the product feel unstable even if the main route loads.

### Key files

- `features/planner/editor/shapeInspectorBridge.ts`
- `features/planner/editor/LayerManagerPanel.tsx`
- `features/planner/editor/planMetrics.ts`
- `features/planner/editor/PlannerStatusBar.tsx`
- `features/planner/editor/CalibrationCapture.tsx`
- `features/planner/lib/applyRoomPreset.ts`
- `features/planner/editor/PlannerWorkspace.tsx`

### Evidence

- `shapeInspectorBridge.ts`
  - edit action not wired
  - delete action not wired
  - duplicate action not wired
- `LayerManagerPanel.tsx`
  - reduced to a simple Fabric object list
  - lacks the richer selection/group/order control path from the earlier implementation
- `PlannerStatusBar.tsx`
  - default snap label is `"Pending"`
- `CalibrationCapture.tsx`
  - marked as Fabric-era stub
- `applyRoomPreset.ts`
  - applies a generic room object instead of a richer room workflow
- `PlannerWorkspace.tsx`
  - template flow shows: `"Templates are not yet available on the fabric canvas."`

### Risk

- users see a polished shell with broken expectations behind it
- review step cannot be trusted as a true final QA surface
- core workspace actions feel incomplete

## 3. Portal and admin planner surfaces are still stubbed

### Why this matters

The route structure exists, but user-facing plan review and oversight surfaces are not production-ready.

### Key files

- `features/planner/portal/PortalPageView.tsx`
- `features/planner/portal/PortalPlanPageView.tsx`
- `features/planner/admin/AdminDashboardPageView.tsx`
- `features/planner/admin/AdminCatalogPageView.tsx`
- `features/planner/admin/AdminAnalyticsPageView.tsx`
- `features/planner/admin/AdminFeatureFlagsPageView.tsx`
- `features/planner/admin/BuddyCatalogPageView.tsx`
- `features/planner/admin/ConfiguratorCatalogPageView.tsx`

### Evidence

- `PortalPageView.tsx`: `"Portal coming soon."`
- `PortalPlanPageView.tsx`: `"Plan portal coming soon."`
- `AdminDashboardPageView.tsx`: `"Admin Dashboard — coming soon."`
- `AdminCatalogPageView.tsx`: `"Catalog — coming soon."`
- `AdminAnalyticsPageView.tsx`: `"Analytics — coming soon."`
- `AdminFeatureFlagsPageView.tsx`: `"Feature Flags — coming soon."`
- `BuddyCatalogPageView.tsx`: `"Buddy Catalog — coming soon."`
- `ConfiguratorCatalogPageView.tsx`: `"Configurator Catalog — coming soon."`

### Risk

- footer/header/access links can lead to weak surfaces
- admin/member product story looks broader than what is actually implemented
- stakeholders may think the planner is integrated into admin/portal when it still is not

## 4. Cloud/member/admin session story is mixed with local-first fallback behavior

### Why this matters

The surrounding app still signals cloud/member/admin continuity, but the planner workspace itself currently leans local-first and disables some cloud behavior.

### Key files

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/hooks/usePlannerSession.ts`
- `features/planner/persistence/cloudPlanHydration.ts`
- `features/planner/persistence/plannerCloudApi.ts`
- `features/shared/dashboard/DashboardClient.tsx`
- `app/(site)/dashboard/page.tsx`
- `app/(site)/portal/page.tsx`

### Evidence

- `PlannerWorkspace.tsx`:
  - `"Cloud save is intentionally disabled in this local-first planner session."`
- `usePlannerSession.ts`
  - contains multiple fallback messages for cloud unavailability and local draft mode
- `cloudPlanHydration.ts`
  - returns `false` on multiple missing-response paths
- dashboard and portal routes still present member-centric flow expectations

### Risk

- guest/member/admin expectations diverge
- user thinks plans are cloud-backed when they are really local draft backed
- portal/admin review cannot safely rely on the current planner save story

## 5. Product-quality issues are visible in icons and symbolic UI

### Why this matters

Even before deeper planner fixes, the interface shows low-quality signals that make the migration feel unfinished.

### Key files

- `features/planner/store/floorTemplates.ts`
- `features/planner/catalog/catalogTypes.ts`
- `features/planner/canvas-fabric/FabricCanvasWorkspace.tsx`
- `components/site/Footer.tsx`
- planner and site components using mixed `lucide-react` and `@phosphor-icons/react`

### Evidence

- `floorTemplates.ts` contains mojibake values like:
  - `≡ƒôä`
  - `Γ¼£`
  - `≡ƒÅó`
- `catalogTypes.ts` still uses emoji category icons:
  - `💻`
  - `🚪`
  - `🖨️`
  - `🗄️`
  - `📐`
  - `📡`
- `FabricCanvasWorkspace.tsx` uses raw glyph buttons:
  - `←`
  - `↔`
  - `→`
  - `↑`

### Risk

- active planner feels prototype-grade
- symbolic language is inconsistent
- polished shell work is undermined by obvious low-quality artifacts

## Secondary Findings

## 6. AI and geometry support still have Fabric-era stubs

### Key files

- `features/planner/ai/applySuggestedLayout.ts`
- `features/planner/ai/extractCanvasPlacements.ts`
- `features/planner/lib/geometry/openingCollision.ts`
- `features/planner/editor/plannerShapeFactories.ts`
- `features/planner/editor/resetPlannerCanvas.ts`

### Evidence

- multiple files are marked as Fabric-era stubs
- AI layout apply is disabled until Fabric bridge is wired
- old tldraw-based geometry assumptions were removed, but not fully replaced

### Risk

- AI and layout-assist features look present but are not fully operational
- edge geometry behavior may be underpowered during real usage

## 7. 3D exists, but trust depends on upstream Fabric mapping quality

### Key files

- `features/planner/viewer/PlannerViewer.tsx`
- `features/planner/3d/Planner3DViewer.tsx`
- `features/planner/editor/PlannerWorkspace.tsx`
- Fabric-to-viewer bridge files under `features/planner/canvas-fabric/`

### Evidence

- 3D route and viewer are active
- `PlannerWorkspace.tsx` feeds 3D from Fabric-derived shapes
- if Fabric document and object mapping are shallow, 3D can be visually present while semantically incomplete

### Risk

- 3D may look more finished than the document it represents
- any mismatch between canvas, export, and viewer erodes trust quickly

## 8. Repo is currently dirty, and touched surfaces extend beyond planner

### Evidence

`git status --short` shows many existing changes across:

- site shell
- homepage
- product pages
- planner landing
- footer/styles
- tests

### Risk

- any new work needs to be careful around user changes already in progress
- planner fixes can collide with site-surface churn if done carelessly

## Important Surface-by-Surface Assessment

## Planner

Status: partially functional, not contract-complete

Most important files:

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/document/plannerDocumentBridge.ts`
- `features/planner/editor/shapeInspectorBridge.ts`
- `features/planner/editor/LayerManagerPanel.tsx`
- `features/planner/editor/planMetrics.ts`
- `features/planner/editor/exportActions.ts`
- `features/planner/hooks/usePlannerFabricAutosave.ts`

Main issue:

- the shell is ahead of the deeper workflow contract

## Admin

Status: route shell exists, several planner-admin pages are placeholders

Most important files:

- `app/admin/page.tsx`
- `app/admin/plans/page.tsx`
- `app/admin/plans/[id]/page.tsx`
- `features/planner/admin/*`

Main issue:

- admin plan management exists in parts, but core dashboard/catalog/analytics surfaces are still placeholders

## Ops

Status: more concrete than admin placeholders

Most important file:

- `features/ops/CustomerQueriesOpsPageView.tsx`

Main issue:

- narrower and more real than some admin surfaces, but not central to the planner migration

## Portal

Status: route exists, actual views are still stubs

Most important files:

- `app/(site)/portal/page.tsx`
- `app/(site)/portal/[id]/page.tsx`
- `features/planner/portal/PortalPageView.tsx`
- `features/planner/portal/PortalPlanPageView.tsx`

Main issue:

- member-facing planner review is not actually implemented

## Dashboard

Status: live route and client exist

Most important files:

- `app/(site)/dashboard/page.tsx`
- `features/shared/dashboard/DashboardClient.tsx`

Main issue:

- depends on planner identity and persistence stability more than on its own UI

## Shared shell / footer / access flows

Status: structurally healthy

Most important files:

- `components/site/Footer.tsx`
- `data/site/navigation.ts`
- `app/(site)/access/page.tsx`
- `app/(site)/login/page.tsx`
- `features/shared/entry/*`

Main issue:

- shell may expose destinations whose underlying product surfaces are still stubbed

## Priority Order

## P1. Finish the planner contract

Work here first:

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/document/plannerDocumentBridge.ts`
- `features/planner/hooks/usePlannerFabricAutosave.ts`
- `features/planner/lib/documentBridge.ts`

Goal:

- make 2D, 3D, export, save/load, and downstream consumers agree on one trustworthy document/session shape

## P2. Restore planner editing parity

Work here next:

- `features/planner/editor/shapeInspectorBridge.ts`
- `features/planner/editor/LayerManagerPanel.tsx`
- `features/planner/editor/planMetrics.ts`
- `features/planner/editor/PlannerStatusBar.tsx`
- `features/planner/lib/applyRoomPreset.ts`
- `features/planner/editor/CalibrationCapture.tsx`

Goal:

- make the planner feel complete in day-to-day use

## P3. Stabilize export and document fidelity

Work here next:

- `features/planner/editor/exportActions.ts`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/document/plannerDocumentBridge.ts`

Goal:

- ensure exported and reloaded plans match the canvas and 3D view

## P4. Replace portal/admin stubs that directly touch planner value

Work here next:

- `features/planner/portal/PortalPageView.tsx`
- `features/planner/portal/PortalPlanPageView.tsx`
- `features/planner/admin/AdminDashboardPageView.tsx`
- `features/planner/admin/AdminAnalyticsPageView.tsx`
- `features/planner/admin/AdminCatalogPageView.tsx`

Goal:

- stop routing users into “coming soon” surfaces for core planner-adjacent paths

## P5. Clean up icon and symbolic quality

Work here next:

- `features/planner/store/floorTemplates.ts`
- `features/planner/catalog/catalogTypes.ts`
- `features/planner/canvas-fabric/FabricCanvasWorkspace.tsx`

Goal:

- replace mojibake, emoji, and raw arrows with the repo’s preferred icon system

## P6. Reconcile member/admin/cloud messaging with actual planner behavior

Work here next:

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/hooks/usePlannerSession.ts`
- `features/planner/persistence/cloudPlanHydration.ts`
- `features/shared/dashboard/DashboardClient.tsx`

Goal:

- make the product promise match the current storage and sharing behavior

## Recommended Reference Files

These are the best local references already known from repo work:

- `E:\Goodsites\15062026\features\planner\shared\engine\SharedTldrawEngine.tsx`
- `E:\Goodsites\15062026\features\planner\document\plannerDocumentBridge.ts`
- `E:\Goodsites\15062026\features\planner\editor\shapeInspectorBridge.ts`
- `E:\Goodsites\15062026\features\planner\editor\LayerManagerPanel.tsx`
- `E:\Goodsites\15062026\features\planner\editor\planMetrics.ts`
- `E:\Goodsites\15062026\features\planner\hooks\usePlannerAutosave.ts`
- `E:\16062026\archive\features\planner-shared\engine\SharedTldrawEngine.tsx`

Use them for contract and UX patterns, not to revive tldraw itself.

## Risks

- The planner can look more complete than it really is.
- Footer/navigation can successfully route users into incomplete surfaces.
- Local-first behavior can conflict with cloud/member/admin expectations.
- Dirty existing worktree means implementation work must avoid trampling ongoing site changes.

## Bottom Line

The repo is not failing because the planner route is missing. It is failing because the Fabric migration has outpaced the replacement of the old planner contract. The fastest path forward is to stop spreading effort across more shell surfaces and finish the planner core contract first, then replace the planner-adjacent stubs, then clean the product-quality issues that make the whole thing feel unfinished.
