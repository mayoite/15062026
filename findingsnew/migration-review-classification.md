# Migration-review classification

Generated: 2026-06-19T13:07:25.032Z

Candidates: 168

| Classification | Count |
|---|---:|
| canonical | 10 |
| compatibility | 34 |
| false-positive | 68 |
| generated | 2 |
| protected | 8 |
| stale | 46 |

Classification is an audit decision, not deletion approval. Import references are in `migration-review-imports.csv`.

## canonical

- `features/planner/ai/applySuggestedLayout.ts` — Active implementation; marker does not identify a competing owner; incoming: 3
- `features/planner/ai/extractCanvasPlacements.ts` — Active implementation; marker does not identify a competing owner; incoming: 3
- `features/planner/canvas-fabric/hooks/fabricDrawTools.ts` — Fabric is the canonical 2D runtime; marker records migration/type debt; incoming: 1
- `features/planner/canvas-fabric/hooks/floorplanCanvas.ts` — Fabric is the canonical 2D runtime; marker records migration/type debt; incoming: 2
- `features/planner/canvas-fabric/index.ts` — Fabric is the canonical 2D runtime; marker records migration/type debt; incoming: 18
- `features/planner/canvas-fabric/lib/helpers.ts` — Fabric is the canonical 2D runtime; marker records migration/type debt; incoming: 4
- `features/planner/catalog/furnitureBlocks2d.ts` — Active implementation; marker does not identify a competing owner; incoming: 1
- `features/planner/lib/geometry/types.ts` — Active implementation; marker does not identify a competing owner; incoming: 5
- `features/planner/ui/PlannerSkeleton.tsx` — Active implementation; marker does not identify a competing owner; incoming: 2
- `Readme.md` — Active implementation; marker does not identify a competing owner; incoming: 0

## compatibility

- `features/catalog/slugResolver.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 2
- `features/planner/catalog/catalogTypes.ts` — Deprecated forwarding surface retained for import compatibility; incoming: 28
- `features/planner/catalog/placementCatalogResolver.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 3
- `features/planner/catalog/plannerCatalogCore.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 3
- `features/planner/catalog/plannerManagedProductsShared.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 3
- `features/planner/catalog/shapeTypeRegistry.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 10
- `features/planner/editor/chrome/plannerChromeStorage.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 5
- `features/planner/lib/documentBridge.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 7
- `features/planner/model/plannerDocumentLogging.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 3
- `features/planner/model/plannerManagedProduct.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 3
- `features/planner/persistence/cloudPlanHydration.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 1
- `features/planner/persistence/persistence.ts` — Deprecated forwarding surface retained for import compatibility; incoming: 4
- `features/planner/portal/PortalPlanPageView.tsx` — Active read/migration adapter preserves legacy data compatibility; incoming: 1
- `features/planner/store/plannerCatalog.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 3
- `features/planner/store/plannerCatalogCore.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 4
- `features/planner/store/plannerManagedProductsShared.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 5
- `features/planner/store/plannerStoreGeometry.ts` — Deprecated forwarding surface retained for import compatibility; incoming: 3
- `features/planner/store/templates.ts` — Deprecated forwarding surface retained for import compatibility; incoming: 1
- `features/planner/templates/index.ts` — Deprecated forwarding surface retained for import compatibility; incoming: 0
- `features/planner/ui/PlannerSessionDialog.tsx` — Active read/migration adapter preserves legacy data compatibility; incoming: 3
- `features/planner/viewer/PlannerViewer.tsx` — Deprecated forwarding surface retained for import compatibility; incoming: 9
- `REPOSITORY-CONSOLIDATION-PLAN.md` — Deprecated forwarding surface retained for import compatibility; incoming: 0
- `lib/assetPaths.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 11
- `tests/planner-catalog-managedProducts.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-catalog-placementCatalogResolver.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-catalog-plannerCatalogCore.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-model-plannerDocument.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-model-plannerDocumentLogging.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-model-plannerJsonSafe.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-shapeTypeRegistry.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-store-plannerCatalog.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/planner-store-plannerManagedProducts.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/site-catalog-filters.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0
- `tests/site-catalog-slugResolver.test.ts` — Active read/migration adapter preserves legacy data compatibility; incoming: 0

## false-positive

- `features/catalog/specSchema.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `components/backend-architecture/BackendArchitecturePageView.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `features/planner/ai/AiAdvisorChat.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `features/planner/catalog/catalogBlockBridge.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 16
- `features/planner/editor/chrome/plannerChromeTypes.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 4
- `features/planner/editor/plannerChromeDock.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `features/planner/lib/lightingPresets.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 3
- `features/planner/lib/measurements.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 12
- `features/planner/shared/document/types.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 2
- `features/planner/store/catalogData.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 15
- `features/planner/store/plannerPersistence.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 11
- `features/planner/store/plannerStore.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 18
- `features/planner/viewer/ShadowConfig.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `public/cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.js` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `public/cdn/vendor/draco/1.5.6/draco_decoder.js` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `public/cdn/vendor/draco/1.5.6/draco_wasm_wrapper.js` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `public/cdn/vendor/model-viewer@4.3.1/model-viewer.min.js` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `app/(site)/portal/[id]/page.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `app/(site)/products/category/[slug]/page.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `features/shared/auth/components/SignupPage.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `features/shared/catalog/types.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 2
- `lib/auth/plannerSession.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `lib/catalog/blocks2d.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 9
- `lib/catalog/geometry.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 3
- `lib/configurator/smartWizardConstants.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 2
- `lib/productSlugResolver.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 1
- `lib/tracking/anonymousUserId.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 4
- `data/site/productSuite.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 3
- `tests/catalog-geometry.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/catalog-productStaticParams.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/catalog-sources.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/lib-ui-selfHostedAssetUrls.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/plannerAutosaveIdentity.test.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-catalogBlockBridge.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-catalog-shapeTypeRegistry.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-chrome.spec.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-chrome-layout.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-editor-BlueprintPanel.test.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-editor-ExportModal.test.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-editor-plannerChromeDock.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-editor-PlannerHistoryControls.test.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-editor-pure.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-hooks-usePlannerUiState.test.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-layerVisibility.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-lib-editorTools.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-lib-measurements.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-lib-vectorPdfExport.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-store-offlineStorage.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-store-plannerProjectData.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-store-plannerProjectStorage.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-store-plannerProjectStore-migration.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-store-plannerStore.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/planner-store-reexports.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/shared-auth-components-SignupPage.test.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/shared-shell-GlobalNavHeader.test.tsx` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/site-catalog-categories.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/site-catalog-imageMetadata.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `tests/site-catalog-specSchema.test.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/arrange_supabase_catalog_assets.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/audit_slug_id_integrity.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/audit_supabase_admin.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/auditCdnAssetFailures.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/backfill_canonical_catalog_metadata.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/clean-3105.mjs` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/db_backup_dropped_tables.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/db_ensure_plans_table.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/generate-route-classification.mjs` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 0
- `scripts/lib/cdnAssetResolver.ts` — Marker is descriptive terminology, API annotation, or unrelated compatibility note; incoming: 3

## generated

- `config/database/types/database.admin.types.ts` — Generated schema/type artifact; marker is generator output; incoming: 0
- `config/database/types/database.types.ts` — Generated schema/type artifact; marker is generator output; incoming: 0

## protected

- `config/build/eslint.config.mjs` — Repository rules require approval before modification; incoming: 0
- `config/build/next.config.js` — Repository rules require approval before modification; incoming: 1
- `platform/appwrite/CONTENTS.md` — Repository rules require approval before modification; incoming: 0
- `platform/CONTENTS.md` — Repository rules require approval before modification; incoming: 0
- `platform/drizzle/db.ts` — Repository rules require approval before modification; incoming: 11
- `platform/drizzle/schema.ts` — Repository rules require approval before modification; incoming: 2
- `platform/supabase/functions/assistant-chat/index.ts` — Repository rules require approval before modification; incoming: 0
- `proxy.ts` — Repository rules require approval before modification; incoming: 0

## stale

- `components/repo-store/RepoStorePageView.tsx` — tldraw-era contract/comment remains in a referenced module; incoming: 1
- `features/planner/admin/AdminAnalyticsPageView.tsx` — Stub/disabled behavior remains wired; incoming: 1
- `features/planner/admin/AdminCatalogPageView.tsx` — Stub/disabled behavior remains wired; incoming: 1
- `features/planner/admin/AdminDashboardPageView.tsx` — Stub/disabled behavior remains wired; incoming: 1
- `features/planner/admin/AdminFeatureFlagsPageView.tsx` — Stub/disabled behavior remains wired; incoming: 1
- `features/planner/admin/AdminLayoutShell.tsx` — Stub/disabled behavior remains wired; incoming: 1
- `features/planner/admin/BuddyCatalogPageView.tsx` — Stub/disabled behavior remains wired; incoming: 1
- `features/planner/admin/ConfiguratorCatalogPageView.tsx` — Stub/disabled behavior remains wired; incoming: 1
- `features/planner/ai/prompts.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 3
- `features/planner/catalog/placementCatalogDefaults.ts` — tldraw-era contract/comment is unreferenced; incoming: 0
- `features/planner/CONTENTS.md` — tldraw-era contract/comment is unreferenced; incoming: 0
- `features/planner/editor/BlueprintMoveCapture.tsx` — Legacy/stub implementation has no resolved active-source importer; incoming: 0
- `features/planner/editor/CalibrationCapture.tsx` — Legacy/stub implementation has no resolved active-source importer; incoming: 0
- `features/planner/editor/CONTENTS.md` — Legacy/stub implementation has no resolved active-source importer; incoming: 0
- `features/planner/editor/plannerShapeFactories.ts` — Legacy/stub implementation is still referenced and requires migration; incoming: 1
- `features/planner/editor/PlannerWorkspace.tsx` — Stub/disabled behavior remains wired; incoming: 4
- `features/planner/editor/resetPlannerCanvas.ts` — Legacy/stub implementation is still referenced and requires migration; incoming: 2
- `features/planner/hooks/usePlannerWorkspace.ts` — Type-check suppression on unreferenced migration-era module; incoming: 0
- `features/planner/lib/editorTools.ts` — Legacy/stub implementation is still referenced and requires migration; incoming: 5
- `features/planner/lib/featureFlags.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 4
- `features/planner/lib/geometry/openingCollision.ts` — Legacy/stub implementation is still referenced and requires migration; incoming: 1
- `features/planner/lib/geometry/wallOpenings.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 4
- `features/planner/lib/plannerSvgExportColors.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 1
- `features/planner/model/plannerIdentity.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 6
- `features/planner/model/plannerJsonSafe.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 4
- `features/planner/shared/types/legacyEditorStub.ts` — Legacy/stub implementation is still referenced and requires migration; incoming: 6
- `features/planner/store/plannerTypes.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 17
- `features/planner/ui/LayersPanel.tsx` — Legacy/stub implementation is still referenced and requires migration; incoming: 2
- `public/CONTENTS.md` — tldraw-era contract/comment is unreferenced; incoming: 0
- `AGENTS.md` — tldraw-era contract/comment is unreferenced; incoming: 0
- `repo-audit-detailed.md` — Legacy/stub implementation has no resolved active-source importer; incoming: 0
- `tests/INVENTORY.md` — tldraw-era contract/comment is unreferenced; incoming: 0
- `tests/plannerCanvasHelpers.ts` — tldraw-era contract/comment remains in a referenced module; incoming: 2
- `tests/planner-lib-documentBridge.test.ts` — tldraw-era contract/comment is unreferenced; incoming: 0
- `tests/planner-model-plannerIdentity.test.ts` — tldraw-era contract/comment is unreferenced; incoming: 0
- `tests/planner-toolRailGroups.test.ts` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/analyze-coverage-gap.mjs` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/analyze-coverage-report.mjs` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/generate-contents-md.mjs` — Legacy/stub implementation has no resolved active-source importer; incoming: 0
- `scripts/generate-test-inventory.mjs` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/render-catalog-qa-sheet.ts` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/render-three-blocks.ts` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/shoot-routes.mjs` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/syncVendorCdnAssets.mjs` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/tldraw-coverage-report.mjs` — tldraw-era contract/comment is unreferenced; incoming: 0
- `scripts/uploadCdnAssets.ts` — tldraw-era contract/comment is unreferenced; incoming: 0
