import type { MeshFamily } from "../mesh-contract"; 
 
export type CatalogItemDimensions = { 
  widthMm: number; 
  depthMm: number; 
  heightMm: number; 
}; 
 
export type CatalogItem = { 
  id: string; 
  name: string; 
  sku?: string; 
  category: string; 
  subcategory?: string; 
  series?: string; 
  dimensions: CatalogItemDimensions; 
  priceInr?: number; 
  imageUrl?: string; 
  thumbnail?: string; 
  modelUrl?: string; 
  meshType?: MeshFamily; 
  color?: string; 
  seatCount?: number; 
}; 
 
export type CatalogSource = "supabase" | "managed" | "json" | "custom"; 
 
export interface ProductSpecs { 
  dimensions?: string; 
  features?: string[]; 
  materials?: string[]; 
  [key: string]: unknown; 
} 
 
export interface CatalogProduct { 
  id?: string; 
  slug?: string; 
  name: string; 
  category?: string; 
  flagship_image?: string; 
  images?: string[]; 
  specs?: ProductSpecs; 
  metadata?: Record<string, unknown>; 
  [k: string]: unknown; 
} 
 
export interface PlannerShapeMeta { 
  text?: string; 
  productId?: string; 
  productSlug?: string; 
  plannerSourceSlug?: string; 
  category?: string; 
  imageUrl?: string; 
  dimensions?: string; 
  presetId?: string; 
  isPlannerItem?: boolean; 
  isRoomShell?: boolean; 
  isRoomDimension?: boolean; 
  structureType?: "wall" | "wall-segment" | "door-opening" | "room-shell"; 
}
