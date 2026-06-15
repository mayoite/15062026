export type { CatalogItem, CatalogItemDimensions, CatalogSource } from "./types";
export {
  loadPlannerCatalog,
  normalizeCatalogItem,
  normalizeCatalogBatch,
  filterByCategory,
  searchCatalog,
} from "./catalogAdapter";
export {
  catalogToBuddyLibrary,
  catalogToOandoFurniture,
  filterCatalog,
  type BuddyLibraryEntry,
  type OandoCatalogEntry,
  type CatalogFilter,
} from "./catalogBridge";
export { useCatalogBrowser, type CatalogBrowserState } from "./useCatalogBrowser";
