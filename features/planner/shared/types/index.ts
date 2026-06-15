import type { MeshFamily } from "../mesh-contract";

export type { MeshFamily as PlannerMeshFamily };

export type UnitSystem = "metric" | "imperial";

export type PlannerRoomConfig = {
  widthMm: number;
  depthMm: number;
  wallHeightMm?: number;
};

export type PlannerItemPlacement = {
  id: string;
  catalogId: string;
  catalogMeshType?: MeshFamily;
  name: string;
  category: string;
  x: number;
  y: number;
  rotationDeg: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  color?: string;
  label?: string;
};

export type PlannerExportMeta = {
  projectName: string;
  clientName?: string | null;
  preparedBy?: string | null;
  roomWidthMm: number;
  roomDepthMm: number;
  generatedAt: string;
};

export type PlannerSaveState = "idle" | "saving" | "saved" | "error";

export type {
  BoqItem,
  CatalogProduct,
  PlannerDrawingTool,
  PlannerShapeMeta,
  PlannerStep,
  ProductSpecs,
  RoomPreset,
} from "./planner";
