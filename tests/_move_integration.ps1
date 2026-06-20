$files = @(
  'planner-lib-blueprintPdf.test.ts',
  'site-catalog-imageMetadata.test.ts',
  'planner-store-plannerSaves.test.ts',
  'catalog-sources.test.ts',
  'planner-store-smallStores.test.ts',
  'site-catalog-specSchema.test.ts',
  'planner-editor-exportActions.test.ts',
  'planner-shared-export-exportBoq.test.ts',
  'planner-store-plannerStore.test.ts',
  'planner-lib-vectorPdfExport.test.ts',
  'planner-store-plannerCatalog.test.ts',
  'planner-store-plannerGeometryStore.test.ts',
  'planner-catalog-managedProducts.test.ts',
  'planner-catalog-exports.test.ts',
  'catalog-productStaticParams.test.ts',
  'planner-store-syncQueueProcessor.test.ts',
  'planner-store-plannerProjectStore.test.ts',
  'planner-store-plannerPersistence.test.ts',
  'catalog-catalogTree.test.ts',
  'planner-store-utils.test.ts',
  'plannerPersistence.test.ts',
  'site-catalog-getProducts.test.ts',
  'planner-store-plannerManagedProducts.server.test.ts',
  'shared-auth-lib-session.test.ts',
  'planner-store-plannerFurnitureStore.test.ts'
)
foreach ($f in $files) {
  Move-Item -Path "E:\16062026\tests\$f" -Destination 'E:\16062026\tests\integration\'
}
Write-Host "Moved $($files.Count) integration .test.ts files"
