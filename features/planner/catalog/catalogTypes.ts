/**
 * Shared catalog types for unified planner catalog UI.
 */

/** Layer 1 — purpose tabs shown in the catalog panel. */
export type CatalogPurposeTab =
  | "workstations"
  | "seating"
  | "meeting"
  | "storage"
  | "cabins"
  | "accessories";

/** Layer 2 — sub-category chip id (scoped per purpose tab). */
export type CatalogSubCategoryId = string;

export interface CatalogPurposeTabDef {
  id: CatalogPurposeTab;
  label: string;
}

export interface CatalogSubCategoryDef {
  id: CatalogSubCategoryId;
  label: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: CatalogCategory;
  shapeType: string;
  /** Plan footprint width in catalog cm units (see `normalizeCatalogMm`). */
  widthMm: number;
  /** Plan footprint depth in catalog cm units. */
  heightMm: number;
  depthMm: number;
  seatCount?: number;
  description: string;
  tags: string[];
  /** Merchant / planner SKU shown on cards. */
  sku?: string;
  /** Card title, max ~30 characters. */
  shortName?: string;
  /** Product thumbnail for catalog cards (120×80). */
  imageUrl?: string;
  /** Primary finish, e.g. pre-laminate particle board. */
  material?: string;
  /** Deep link to the marketing catalog. */
  catalogUrl?: string;
  /** Layer 1 tab — inferred when omitted. */
  purposeTab?: CatalogPurposeTab;
  /** Layer 2 chip — inferred when omitted. */
  subCategory?: CatalogSubCategoryId;
}

export type CatalogCategory =
  | "desks"
  | "rooms"
  | "equipment"
  | "storage"
  | "zones"
  | "infrastructure";

export const CATALOG_PURPOSE_TABS: CatalogPurposeTabDef[] = [
  { id: "workstations", label: "Workstations" },
  { id: "seating", label: "Seating" },
  { id: "meeting", label: "Meeting" },
  { id: "storage", label: "Storage" },
  { id: "cabins", label: "Cabins" },
  { id: "accessories", label: "Accessories" },
];

/** @deprecated Use `CATALOG_PURPOSE_TABS` in the catalog panel. */
export const CATALOG_CATEGORIES: Array<{ id: CatalogCategory; label: string; icon: string }> = [
  { id: "desks", label: "Desks & Seating", icon: "💻" },
  { id: "rooms", label: "Rooms & Pods", icon: "🚪" },
  { id: "equipment", label: "Equipment", icon: "🖨️" },
  { id: "storage", label: "Storage", icon: "🗄️" },
  { id: "zones", label: "Zones", icon: "📐" },
  { id: "infrastructure", label: "Infrastructure", icon: "📡" },
];