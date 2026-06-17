# Test inventory

Auto-generated file list and counts. Folder rules: `tests/CONTENTS.md`.

*Updated: 2026-06-16 — run `npm run docs:sync` to refresh.*

## Counts

| Kind | Count |
|------|-------|
| Vitest (active) | 238 |
| Vitest (excluded in config) | 0 |
| Playwright | 10 |
| Helpers | 2 |
| **Total files** | **250** |

JSON: `results/test-inventory.json` · Migration: `results/test-migration-map.json` · Coverage: `results/coverage-summary.json` (`npm run docs:sync:coverage`)

## Files by category

### planner (173)

- `planner-3d-types.test.ts`
- `planner-blueprintCanvasFrame.test.ts`
- `planner-blueprintCanvasTransform.test.ts`
- `planner-blueprintImport.test.ts`
- `planner-blueprintPdfSession.test.ts`
- `planner-blueprintTraceGuide.test.ts`
- `planner-blueprintTransform.test.ts`
- `planner-buildBlock2D.test.ts`
- `planner-catalog-catalogHierarchy.test.ts`
- `planner-catalog-catalogStore-init.test.ts`
- `planner-catalog-catalogStore.test.ts`
- `planner-catalog-components.test.tsx`
- `planner-catalog-drop.test.ts`
- `planner-catalog-exports.test.ts`
- `planner-catalog-ingest-csvCatalogIngest.test.ts`
- `planner-catalog-managedProducts.test.ts`
- `planner-catalog-placementCatalogResolver.test.ts`
- `planner-catalog-plannerCatalogCore.test.ts`
- `planner-catalog-shapeTypeRegistry.test.ts`
- `planner-catalog-workspaceCatalog.test.ts`
- `planner-catalog.test.ts`
- `planner-catalogBlockBridge.test.ts`
- `planner-chrome-layout.test.ts`
- `planner-editor-BlueprintPanel.test.tsx`
- `planner-editor-BlueprintTraceGuideOverlay.test.tsx`
- `planner-editor-BlueprintUnderlay.test.tsx`
- `planner-editor-ExportModal.test.tsx`
- `planner-editor-LayerManagerPanel.test.tsx`
- `planner-editor-LayerVisibilityPanel.test.tsx`
- `planner-editor-OnboardingTooltips.test.tsx`
- `planner-editor-PlannerHistoryControls.test.tsx`
- `planner-editor-PlannerLeftPanel.test.tsx`
- `planner-editor-PlannerMobileDock.test.tsx`
- `planner-editor-PlannerStatusBar.test.tsx`
- `planner-editor-PlannerStepBar.test.tsx`
- `planner-editor-PlannerToolRail.test.tsx`
- `planner-editor-PlannerTopBar.test.tsx`
- `planner-editor-PlannerWorkflowPanel.test.tsx`
- `planner-editor-PlannerWorkspace-branches.test.tsx`
- `planner-editor-PlannerWorkspace.test.tsx`
- `planner-editor-PropertiesInspector-branches.test.tsx`
- `planner-editor-PropertiesInspector.test.tsx`
- `planner-editor-TemplatePickerModal.test.tsx`
- `planner-editor-exportActions.test.ts`
- `planner-editor-layerManagerEntries.test.ts`
- `planner-editor-overlays.test.tsx`
- `planner-editor-plannerChromeDock.test.ts`
- `planner-editor-plannerShapeFactories.test.ts`
- `planner-editor-plannerToolVisibility.test.ts`
- `planner-editor-pure.test.ts`
- `planner-editor-repairPlannerShapeUnits.test.ts`
- `planner-editor-shapeInspectorBridge.test.ts`
- `planner-editor-usePlannerPanels.test.ts`
- `planner-editorSelectionStatus.test.ts`
- `planner-fitCanvasLabel.test.ts`
- `planner-furnitureWallSnap.test.ts`
- `planner-geometry.test.ts`
- `planner-guestToAuthMigration.test.ts`
- `planner-hooks-useAssetLoader.test.tsx`
- `planner-hooks-usePlannerAutosave.test.tsx`
- `planner-hooks-usePlannerSession.test.tsx`
- `planner-hooks-usePlannerUiState.test.tsx`
- `planner-hooks-usePlannerWorkspace.test.tsx`
- `planner-landing-data.test.ts`
- `planner-landing-plannerfeaturedemo.test.tsx`
- `planner-layerCounts.test.ts`
- `planner-layerManagerEntries.test.ts`
- `planner-layerManagerUiState.test.ts`
- `planner-layerVisibility.test.ts`
- `planner-lib-aiService.test.ts`
- `planner-lib-applyRoomPreset.test.ts`
- `planner-lib-assetPipeline.test.ts`
- `planner-lib-blockTldrawLicensePing.test.ts`
- `planner-lib-blueprintPdf.test.ts`
- `planner-lib-branches.test.ts`
- `planner-lib-calibrationScale.test.ts`
- `planner-lib-compliance.test.ts`
- `planner-lib-documentBridge.test.ts`
- `planner-lib-editorTools.test.ts`
- `planner-lib-featureFlags.test.ts`
- `planner-lib-geometry.test.ts`
- `planner-lib-layoutAdvisor.test.ts`
- `planner-lib-measurements.test.ts`
- `planner-lib-presets.test.ts`
- `planner-lib-projectIndex.test.ts`
- `planner-lib-quoteBridge.test.ts`
- `planner-lib-sessionState.test.ts`
- `planner-lib-snapManager.test.ts`
- `planner-lib-vectorPdfExport.test.ts`
- `planner-lib-versioning.test.ts`
- `planner-lib-wallOpenings.test.ts`
- `planner-model-planner3dScene.test.ts`
- `planner-model-plannerDocument.extra.test.ts`
- `planner-model-plannerDocument.test.ts`
- `planner-model-plannerDocumentLogging.test.ts`
- `planner-model-plannerEnvelope.test.ts`
- `planner-model-plannerIdentity.test.ts`
- `planner-model-plannerJsonSafe.test.ts`
- `planner-model-plannerPermissions.test.ts`
- `planner-model-plannerPlacement.test.ts`
- `planner-onboarding-onboardingcoach.test.tsx`
- `planner-openingCollision.test.ts`
- `planner-openingWallSnap.test.ts`
- `planner-persistence-plannerDraft.test.ts`
- `planner-shapeTypeRegistry.test.ts`
- `planner-shared-boq-quoteCartBridge.test.ts`
- `planner-shared-catalog-catalogAdapter.test.ts`
- `planner-shared-document-documentbridge.test.ts`
- `planner-shared-export-exportBoq.test.ts`
- `planner-shared-plannerShared.test.tsx`
- `planner-state.test.ts`
- `planner-store-catalogData.test.ts`
- `planner-store-offlineStorage.test.ts`
- `planner-store-plannerCatalog.test.ts`
- `planner-store-plannerDraft.test.ts`
- `planner-store-plannerFurnitureStore.test.ts`
- `planner-store-plannerGeometryStore.test.ts`
- `planner-store-plannerImport.test.ts`
- `planner-store-plannerManagedProducts.server.test.ts`
- `planner-store-plannerManagedProducts.test.ts`
- `planner-store-plannerPersistence.test.ts`
- `planner-store-plannerProjectData.test.ts`
- `planner-store-plannerProjectStorage.test.ts`
- `planner-store-plannerProjectStore-migration.test.ts`
- `planner-store-plannerProjectStore.test.ts`
- `planner-store-plannerSaves.test.ts`
- `planner-store-plannerStore.test.ts`
- `planner-store-plannerUIStore.test.ts`
- `planner-store-reexports.test.ts`
- `planner-store-smallStores.test.ts`
- `planner-store-syncQueueProcessor.test.ts`
- `planner-store-unifiedCatalog.test.ts`
- `planner-store-utils.test.ts`
- `planner-svg-export-colors.test.ts`
- `planner-svg-qa.test.ts`
- `planner-templatePreview.test.ts`
- `planner-tldraw-DoorWindowShape.test.ts`
- `planner-tldraw-MeasurementShape.test.ts`
- `planner-tldraw-WallShape.test.ts`
- `planner-tldraw-catalogBlockBridge-extra.test.ts`
- `planner-tldraw-exports.test.ts`
- `planner-tldraw-furnitureBlocks2d.test.ts`
- `planner-tldraw-plannerTldrawEditorBridge.test.ts`
- `planner-tldraw-plannerTldrawRegistration.test.ts`
- `planner-tldraw-rectDrag.test.ts`
- `planner-tldraw-renderBlockPrims.test.tsx`
- `planner-tldraw-shapeUtils-branches.test.tsx`
- `planner-tldraw-shapeUtils-labelEdit.test.tsx`
- `planner-tldraw-shapeUtils.test.tsx`
- `planner-tldraw-shapeValidation.test.ts`
- `planner-tldraw-shapes-defaults.test.ts`
- `planner-tldraw-sideEffects.test.ts`
- `planner-tldraw-tldrawShapeRegistry.test.ts`
- `planner-tldraw-tldrawSnap.test.ts`
- `planner-tldraw-tools-ClearanceChecker.test.ts`
- `planner-tldraw-tools-DoorWindowPlacement.test.ts`
- `planner-tldraw-tools-FurniturePlacement.test.ts`
- `planner-tldraw-tools-Measurement.test.ts`
- `planner-tldraw-tools-RoomDetection.test.ts`
- `planner-tldraw-tools-ShapeRegistrationSystem.test.ts`
- `planner-tldraw-tools-StateNodes.test.ts`
- `planner-tldraw-tools-WallTool.test.ts`
- `planner-tldraw-tools-ZoneOverlay.test.ts`
- `planner-tldraw-tools-branches.test.ts`
- `planner-tldraw-tools-index.test.ts`
- `planner-toolRailGroups.test.ts`
- `planner-ui-InspectorPanel.test.tsx`
- `planner-viewerMaterials.test.ts`
- `planner-wallOpenings.test.ts`
- `plannerAutosaveIdentity.test.tsx`
- `plannerCloudSaves.test.ts`
- `plannerPersistence.test.ts`
- `plannerPublish.test.ts`

### shared (21)

- `shared-auth-components-AuthControls.test.tsx`
- `shared-auth-components-AuthShell.test.tsx`
- `shared-auth-components-LoginPage.test.tsx`
- `shared-auth-components-ResendVerificationButton.test.tsx`
- `shared-auth-components-SignupPage.test.tsx`
- `shared-auth-components-SuspendedPage.test.tsx`
- `shared-auth-lib-AuthProvider.test.tsx`
- `shared-auth-lib-humanizeAuthError.test.ts`
- `shared-auth-lib-session.test.ts`
- `shared-auth-lib-useDocumentTitle.test.tsx`
- `shared-components-GuestBadge.test.tsx`
- `shared-components-RestrictedActionButton.test.tsx`
- `shared-dashboard-DashboardClient.test.tsx`
- `shared-entry-AccessPage.test.tsx`
- `shared-entry-ChooseProductPage.test.tsx`
- `shared-entry-OpenAssistantButton.test.tsx`
- `shared-entry-ProductEntryPage.test.tsx`
- `shared-entry-SuiteLoginPage.test.tsx`
- `shared-index-exports.test.ts`
- `shared-providerChain.test.ts`
- `shared-shell-GlobalNavHeader.test.tsx`

### site-assistant (3)

- `site-assistant-AdvancedBot.test.tsx`
- `site-assistant-DynamicBotWrapper.test.tsx`
- `site-assistant-UnifiedAssistant.test.tsx`

### ops (1)

- `ops-CustomerQueriesOpsPageView.test.tsx`

### site-unit (40)

- `aiAdvisorConfig.test.ts`
- `applySuggestedLayout.test.ts`
- `catalog-adapters.test.ts`
- `catalog-blocks2d.test.ts`
- `catalog-catalogTree.test.ts`
- `catalog-configuratorCatalog.test.ts`
- `catalog-configuratorCatalogPayload.test.ts`
- `catalog-fallback-branches.test.ts`
- `catalog-fallback.test.ts`
- `catalog-geometry.test.ts`
- `catalog-productStaticParams.test.ts`
- `catalog-resolveBlockColors.test.ts`
- `catalog-seed.test.ts`
- `catalog-sources.test.ts`
- `catalog-surface2d5.test.ts`
- `catalogHierarchy.test.ts`
- `catalogMatch.test.ts`
- `homepage-data.test.ts`
- `layoutPreviewBounds.test.ts`
- `lib-ui-selfHostedAssetUrls.test.ts`
- `navigation-data.test.ts`
- `projectSetup.test.ts`
- `seo-helpers.test.ts`
- `site-ai-aiAdvisor.test.ts`
- `site-catalog-categories.test.ts`
- `site-catalog-filters.test.ts`
- `site-catalog-getProducts.test.ts`
- `site-catalog-imageMetadata.test.ts`
- `site-catalog-slugResolver.test.ts`
- `site-catalog-specSchema.test.ts`
- `site-catalog-traits.test.ts`
- `site-configurator-barrel.test.ts`
- `site-configurator-catalog.test.ts`
- `site-configurator-constants.test.ts`
- `site-configurator-smartWizard.test.ts`
- `site-data-assistant.test.ts`
- `site-data-contact.test.ts`
- `site-data-misc.test.ts`
- `site-data-routeCopy.test.ts`
- `spaceSuggest.test.ts`

### playwright (10)

- `accessibility.spec.ts`
- `navigation-smoke.spec.ts`
- `planner-catalog.spec.ts`
- `planner-chrome.spec.ts`
- `planner-custom-tools.spec.ts`
- `planner-guest-workspace.spec.ts`
- `planner-landing-screenshots.spec.ts`
- `planner-marketing-a11y.spec.ts`
- `site-navigation-screenshots.spec.ts`
- `site-navigation-smoke.spec.ts`

## See also

- `tests/CONTENTS.md`
- `docs/TESTING.md`

---
*Generated by `scripts/generate-docs.mjs` — do not hand-edit; re-run `npm run docs:sync`.*
