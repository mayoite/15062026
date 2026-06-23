# Startup Performance

## Objective

Make `/planner` show a usable shell faster by moving heavy runtime, 3D, panel, catalog, modal, and preference work off the first critical path without redefining state or catalog contracts.

## Files

- `E:\16062026\features\planner\ui\PlannerWorkspaceRoute.tsx`
- `E:\16062026\features\planner\ui\UnifiedPlannerPage.tsx`
- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\editor\PlannerWorkspaceLayout.tsx`
- `E:\16062026\features\planner\editor\PlannerTopBar.tsx`
- `E:\16062026\features\planner\editor\PlannerLeftPanel.tsx`
- `E:\16062026\features\planner\editor\PlannerDesktopPanels.tsx`
- `E:\16062026\features\planner\editor\PlannerMobilePanels.tsx`
- `E:\16062026\features\planner\editor\PlannerSessionDialog.tsx`
- `E:\16062026\features\planner\editor\ExportModal.tsx`
- `E:\16062026\features\planner\editor\templates\TemplatePickerModal.tsx`
- `E:\16062026\features\planner\ai\AIAssistDrawer.tsx`
- `E:\16062026\features\planner\editor\inspector\PropertiesInspector.tsx`
- `E:\16062026\features\planner\editor\LayerManagerPanel.tsx`
- `E:\16062026\features\planner\editor\LayerVisibilityPanel.tsx`
- `E:\16062026\features\planner\editor\planMetrics.ts`
- `E:\16062026\features\planner\hooks\useAssetLoader.ts`
- `E:\16062026\features\planner\catalog\usePlannerCatalogHydration.ts`
- `E:\16062026\features\planner\hooks\usePlannerFabricAutosave.ts`
- `E:\16062026\features\planner\hooks\usePlannerSession.ts`
- `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`
- `E:\16062026\features\planner\editor\usePlannerPanels.ts`
- `E:\16062026\features\planner\editor\plannerWorkspacePreferences.ts`

## Required Outcomes

- shell is visible before heavy editor features load
- shell-visible, Fabric-ready, and 3D-ready are measured as separate milestones
- 3D stays strictly on-demand
- catalog/model preload does not compete with first paint
- preferences, autosave bootstrap, and deep panels do not land on the first client path unless needed
- lazy boundaries preserve current behavior once the user opens those surfaces

## Measurement Contract

Baseline and after-change proof must include all of these:
- at least one bundle metric
  - example: planner route chunk size, number of eager modules, or a route-level build output diff
- at least one timing metric
  - example: shell-visible, Fabric-ready, or 3D-ready timing from `planMetrics.ts` or equivalent instrumentation
- chunk-graph or equivalent import proof
  - example: route import trace, build chunk graph, or explicit before/after synchronous import inventory
- throttled shell-first validation
  - example: a local browser run under CPU/network throttling showing the shell before heavy surfaces complete
- cold-start network comparison
  - example: request waterfall, request count, or model/catalog preload diff before and after the change

## Implementation Steps

1. Baseline the initial planner route with at least one bundle metric and one timing metric.
2. Identify synchronous imports still landing on the initial route and name the current shell boundary.
3. Keep the route layer and shell thin, then move heavy mode-specific features behind explicit lazy boundaries.
4. Keep 3D, modal, drawer, inspector, and layer surfaces out of the first client path unless opened.
5. Defer catalog hydration, asset preloading, preference hydration, and non-urgent persistence bootstrap until shell visibility or user intent.
6. Re-measure after the boundary changes instead of assuming improvement.
7. Re-check deferred surfaces once opened so the optimization does not become a hidden behavior regression.

## Truth / Evidence

- primary bundle hotspot: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- likely deferred surfaces: 3D viewer, session dialog, export modal, template picker, AI drawer, inspector, layer panels
- eager startup risk surfaces: `useAssetLoader.ts`, `usePlannerCatalogHydration.ts`, `usePlannerFabricAutosave.ts`, `usePlannerSession.ts`, `plannerWorkspacePreferences.ts`

## Do Not Break

- route-level planner availability
- current adapter surfaces for catalog, persistence, and planner modes
- lazy-loaded surfaces once opened
- existing user-facing planner modes

## Proof Target

Proof for this file is strong only if a reviewer can show:
- what moved off the initial path
- at least one before/after bundle metric
- at least one before/after timing metric
- chunk-graph or equivalent import proof
- throttled shell-first validation
- cold-start network comparison
- why deferred surfaces still load correctly on demand

## Completion Checklist

- [ ] Baseline startup path is measured with at least one bundle metric and one timing metric. <!-- partial: source-only lazy boundaries and telemetry marks exist, but bundle/timing proof is missing -->
- [x] Synchronous import ownership on the initial route is named.
- [x] Heavy surfaces are behind explicit load boundaries.
- [ ] Cold-start network activity is lighter or the exact reason it is not is logged. <!-- partial: exact gap is logged, but no cold-start network comparison exists -->
- [ ] Throttled shell-first validation exists or the exact gap is logged. <!-- partial: exact gap is logged, but no throttled browser run exists -->
- [ ] Before/after evidence exists or the exact gap is logged. <!-- partial: exact gap is logged, but no before/after capture exists -->
