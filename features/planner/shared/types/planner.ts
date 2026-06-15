import type { ProductSpecs } from "@/features/planner/shared/catalog/types";

export interface CatalogProduct {
  id?: string;
  slug?: string;
  name: string;
  category: string;
  description?: string;
  price?: number;
  flagship_image?: string;
  images?: string[];
  altText?: string;
  variants?: unknown[];
  specs?: ProductSpecs;
  detailedInfo?: {
    overview?: string;
    features?: string[];
    dimensions?: string;
    materials?: string[];
  };
  sceneImages?: string[];
  technicalDrawings?: unknown[];
  documents?: unknown[];
  metadata?: Record<string, unknown>;
  plannerSourceSlug?: string;
  [key: string]: unknown;
}

export type PlannerStep = "room" | "catalog" | "measure" | "review";

export type PlannerDrawingTool =
  | "select"
  | "hand"
  | "draw"
  | "line"
  | "geo"
  | "arrow"
  | "text"
  | "eraser";

export interface RoomPreset {
  id: string;
  name: string;
  summary?: string;
  widthMm: number;
  heightMm: number;
  zones?: Array<{
    label: string;
    widthMm: number;
  }>;
}

export interface BoqItem {
  id?: string;
  name: string;
  category: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  totalPrice?: number;
  dimensions?: string;
  sku?: string;
  imageUrl?: string;
  productId?: string;
  productSlug?: string;
  plannerSourceSlug?: string;
  metadata?: Record<string, unknown>;
}

export interface PlannerShapeMeta {
  isPlannerItem?: boolean;
  isRoomDimension?: boolean;
  productId?: string;
  productSlug?: string;
  plannerSourceSlug?: string;
  text?: string;
  category?: string;
  imageUrl?: string;
  dimensions?: string;
  itemName?: string;
  itemCategory?: string;
  itemSku?: string;
  [key: string]: unknown;
}

export type { ProductSpecs };
