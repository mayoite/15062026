import {
  BLOCK_STYLE,
  buildBlock2D,
  buildGenericBlock2D,
  buildMeetingRoomBlock,
  type Block2D,
} from "@/lib/catalog/blocks2d";
import type { Product } from "@/lib/catalog/types";
import type { CatalogItem as OandoCatalogItem } from "@/features/planner/store/catalogData";
import {
  PLANNER_CATALOG_ITEMS as BUDDY_CATALOG_ITEMS,
} from "@/features/planner/catalog/workspaceCatalog";
import type { CatalogItem as BuddyCatalogItem } from "@/features/planner/catalog/catalogTypes";
import {
  isCatalogShapeType,
  isRoomCatalogShapeType,
  PlannerCatalogShapeType,
  catalogShapeTypeToFurnitureType,
} from "@/features/planner/catalog/shapeTypeRegistry";
import { millimetersToCanvasUnits, PLANNER_MIN_CANVAS_UNIT } from "@/features/planner/lib/canvasBounds";
import {
  isLShapedDesk,
  resolveFurnitureBlockKind,
  type FurnitureBlockKind,
  type FurnitureCategory,
  type FurnitureShapeProps,
} from "./furnitureBlocks2d";

/** Minimal furniture shape input for catalog block resolution. */
export interface FurnitureShapeInput {
  props: FurnitureShapeProps;
}

/**
 * Planner canvas coordinates are centimetres (see room editor prompts: m × 100).
 * Shape props `widthMm` / `heightMm` store catalog cm (misnamed); autosave briefly
 * stored cm × 10 — values ≥ 1000 (or a paired leg ≥ 1000) are repaired on read.
 */
export function plannerCanvasUnits(value: number, pairedValue?: number): number {
  if (value <= 0) return 1;
  if (value >= 1000 || (pairedValue ?? 0) >= 1000) return value / 10;
  return value;
}

/** Read planner-furniture / room / zone shape props as canvas cm. */
export function shapePropsToCanvasCm(
  widthProp: number,
  depthProp: number,
): { widthCm: number; depthCm: number } {
  return {
    widthCm: Math.max(1, plannerCanvasUnits(widthProp, depthProp)),
    depthCm: Math.max(1, plannerCanvasUnits(depthProp, widthProp)),
  };
}

/** Convert canvas/catalog cm to millimetres for lib/catalog/blocks2d primitives. */
export function normalizeCatalogMm(value: number, pairedValue?: number): number {
  return plannerCanvasUnits(value, pairedValue) * 10;
}

/** Real-world millimetres (catalog CSV, legacy store data) → canvas cm. */
export function catalogMmToCanvasCm(mm: number, pairedMm?: number): number {
  return plannerCanvasUnits(mm / 10, pairedMm !== undefined ? pairedMm / 10 : undefined);
}

function findBuddyCatalogItem(catalogId: string): BuddyCatalogItem | undefined {
  return BUDDY_CATALOG_ITEMS.find((item) => item.id === catalogId);
}

function isSharingCatalogItem(item?: BuddyCatalogItem): boolean {
  return item?.tags.includes("sharing") ?? false;
}

function isPartitionSystemItem(item?: BuddyCatalogItem): boolean {
  return item?.tags.some((tag) => tag.includes("partition")) ?? false;
}

/** Per-seat module length from catalog name, e.g. "(1200mm)". */
export function moduleLengthMmFromItem(item: BuddyCatalogItem): number {
  const fromName = item.name.match(/\((\d{3,4})mm\)/i);
  if (fromName) return parseInt(fromName[1], 10);
  const seaters = Math.max(1, item.seatCount ?? 1);
  return Math.round(normalizeCatalogMm(item.widthMm) / seaters);
}

/**
 * Straight run footprint: bays × module length (catalog seatCount = bays).
 * NS 4800×600 = 4 people; SH 4800×1200 = 8 people (sharing doubles occupancy).
 */
export function straightWorkstationFootprintMm(item: BuddyCatalogItem): { L: number; D: number } {
  const seaters = Math.max(1, item.seatCount ?? 1);
  const moduleL = moduleLengthMmFromItem(item);
  const sharing = isSharingCatalogItem(item);
  const depthMm = sharing ? 1200 : 600;
  return { L: seaters * moduleL, D: depthMm };
}

/**
 * Real-world placement footprint in millimetres (seat bays × module length for desks).
 * Single source of truth for catalog labels, placement, and AI layout.
 */
export function resolveCatalogPlacementFootprintMm(
  item: BuddyCatalogItem,
): { widthMm: number; depthMm: number } {
  const straightFootprint =
    item.category === "desks" && !isCatalogShapeType(item.shapeType, PlannerCatalogShapeType.desk)
      ? straightWorkstationFootprintMm(item)
      : null;
  return {
    widthMm: straightFootprint?.L ?? normalizeCatalogMm(item.widthMm, item.heightMm),
    depthMm: straightFootprint?.D ?? normalizeCatalogMm(item.heightMm, item.widthMm),
  };
}

/** Convert a catalog footprint in mm to planner canvas units (10 mm per unit). */
export function catalogFootprintToCanvasUnits(footprint: {
  widthMm: number;
  depthMm: number;
}): { width: number; depth: number } {
  return {
    width: Math.max(PLANNER_MIN_CANVAS_UNIT, millimetersToCanvasUnits(footprint.widthMm)),
    depth: Math.max(PLANNER_MIN_CANVAS_UNIT, millimetersToCanvasUnits(footprint.depthMm)),
  };
}

function syntheticProduct(
  name: string,
  categoryId: string,
  footprintL: number,
  footprintD: number,
  seaters: number,
  shape: "straight" | "l-shape",
  sharing: "non-sharing" | "sharing" = "non-sharing",
  system: "leg" | "partition" = "leg",
  moduleLengthMm?: number,
): Product {
  const lengthPerSeat = moduleLengthMm ?? Math.max(600, Math.round(footprintL / Math.max(1, seaters)));
  return {
    id: "buddy-catalog-synthetic",
    category_id: categoryId,
    series: "buddy",
    name,
    slug: "buddy-catalog-item",
    images: [],
    specs: { dimensions: `${footprintL}×${footprintD}mm`, materials: [], features: [] },
    series_id: "buddy",
    series_name: "Buddy",
    created_at: "",
    sizingType: "parametric",
    brandName: name,
    workstation: {
      shape,
      system,
      wireManagement: [],
      sharing,
      seaterOptions: [seaters],
      lengthOptions: [lengthPerSeat],
      depthOptions: [footprintD],
      heightMm: 750,
    },
  };
}

function buildZoneBlock(footprintL: number, footprintD: number, label: string): Block2D {
  return {
    footprint: { L: footprintL, D: footprintD, H: 0 },
    label,
    prims: [
      {
        kind: "rect",
        x: 0,
        y: 0,
        w: footprintL,
        h: footprintD,
        fill: "none",
        stroke: BLOCK_STYLE.panel,
        strokeWidth: 2,
        radius: 8,
      },
      {
        kind: "line",
        points: [12, footprintD / 2, footprintL - 12, footprintD / 2],
        stroke: BLOCK_STYLE.panel,
        strokeWidth: 1,
        dash: [8, 8],
      },
    ],
  };
}

function paxFromRoomItem(item: BuddyCatalogItem | undefined, label: string): number {
  const solo =
    item?.tags.some((tag) => /booth|pod|phone|focus/i.test(tag))
    ?? /phone booth|focus pod/i.test(label);
  if (solo) return 1;

  const match = label.match(/\((\d+)\s*p\)/i);
  return match ? parseInt(match[1], 10) : 4;
}

function buildRoomBlock(
  footprintL: number,
  footprintD: number,
  label: string,
  item?: BuddyCatalogItem,
): Block2D {
  return buildMeetingRoomBlock(
    { L: footprintL, D: footprintD, H: 0 },
    paxFromRoomItem(item, label),
    label,
  );
}

function buildInfrastructureBlock(
  item: BuddyCatalogItem,
  footprintL: number,
  footprintD: number,
): Block2D {
  const label = item.name;
  const previewD = Math.max(footprintD, 240);

  if (item.id === "infra-display" || item.tags.includes("display")) {
    const wallY = Math.round(previewD * 0.18);
    const screenX = Math.round(footprintL * 0.12);
    const screenW = Math.round(footprintL * 0.76);
    const screenH = Math.round(previewD * 0.42);
    return {
      footprint: { L: footprintL, D: previewD, H: 0 },
      label,
      prims: [
        {
          kind: "line",
          points: [0, wallY, footprintL, wallY],
          stroke: BLOCK_STYLE.surfaceStroke,
          strokeWidth: 4,
        },
        {
          kind: "rect",
          x: screenX,
          y: wallY + 8,
          w: screenW,
          h: screenH,
          fill: BLOCK_STYLE.glyphDark,
          stroke: BLOCK_STYLE.surfaceStroke,
          strokeWidth: 2,
          radius: 6,
        },
        {
          kind: "rect",
          x: Math.round(footprintL * 0.47),
          y: wallY + screenH + 8,
          w: Math.round(footprintL * 0.06),
          h: Math.round(previewD * 0.22),
          fill: BLOCK_STYLE.glyph,
          radius: 2,
        },
      ],
    };
  }

  if (item.id === "infra-ap" || item.tags.includes("wifi")) {
    const cx = Math.round(footprintL / 2);
    const cy = Math.round(previewD / 2);
    const r = Math.min(footprintL, previewD) * 0.28;
    return {
      footprint: { L: footprintL, D: previewD, H: 0 },
      label,
      prims: [
        {
          kind: "circle",
          cx,
          cy,
          r,
          fill: "none",
          stroke: BLOCK_STYLE.panel,
          strokeWidth: 2,
        },
        {
          kind: "circle",
          cx,
          cy,
          r: r * 0.55,
          fill: BLOCK_STYLE.glyph,
          stroke: BLOCK_STYLE.surfaceStroke,
          strokeWidth: 2,
        },
      ],
    };
  }

  const outletW = Math.max(footprintL, 120);
  const outletH = Math.max(previewD, 120);
  return {
    footprint: { L: outletW, D: outletH, H: 0 },
    label,
    prims: [
      {
        kind: "rect",
        x: outletW * 0.2,
        y: outletH * 0.2,
        w: outletW * 0.6,
        h: outletH * 0.6,
        fill: BLOCK_STYLE.surface,
        stroke: BLOCK_STYLE.surfaceStroke,
        strokeWidth: 2,
        radius: 4,
      },
      {
        kind: "circle",
        cx: outletW * 0.38,
        cy: outletH * 0.5,
        r: outletH * 0.08,
        fill: BLOCK_STYLE.glyphDark,
      },
      {
        kind: "circle",
        cx: outletW * 0.62,
        cy: outletH * 0.5,
        r: outletH * 0.08,
        fill: BLOCK_STYLE.glyphDark,
      },
    ],
  };
}

function buildFromKind(
  kind: FurnitureBlockKind,
  footprintL: number,
  footprintD: number,
  buddyItem: BuddyCatalogItem | undefined,
  oandoItem: OandoCatalogItem | undefined,
  props: FurnitureShapeProps,
): Block2D | null {
  const label = buddyItem?.name ?? props.productName ?? "Furniture";

  if (buddyItem?.category === "infrastructure") {
    return buildInfrastructureBlock(buddyItem, footprintL, footprintD);
  }

  if (kind === "partition-accessory" && buddyItem?.category === "zones") {
    return buildZoneBlock(footprintL, footprintD, label);
  }

  if (kind === "partition-accessory" && buddyItem?.category === "rooms") {
    return buildRoomBlock(footprintL, footprintD, label, buddyItem);
  }

  if (kind === "storage-cabinet") {
    const product: Product = {
      id: "buddy-storage",
      category_id: "storage",
      series: "buddy",
      name: label,
      slug: "buddy-storage",
      images: [],
      specs: { dimensions: `${footprintL}×${footprintD}mm`, materials: [], features: [] },
      series_id: "buddy",
      series_name: "Buddy",
      created_at: "",
      sizingType: "fixed",
      defaultFootprint: { L: footprintL, D: footprintD, H: 750 },
      metadata: { category: "storage" },
    };
    return buildBlock2D(product);
  }

  if (kind === "table") {
    const product: Product = {
      id: "buddy-table",
      category_id: "tables",
      series: "buddy",
      name: label,
      slug: "buddy-table",
      images: [],
      specs: { dimensions: `${footprintL}×${footprintD}mm`, materials: [], features: [] },
      series_id: "buddy",
      series_name: "Buddy",
      created_at: "",
      sizingType: "fixed",
      defaultFootprint: { L: footprintL, D: footprintD, H: 750 },
      metadata: { category: "tables" },
    };
    return buildBlock2D(product);
  }

  if (kind === "soft-seating-sofa") {
    return buildGenericBlock2D("sofa", footprintL, footprintD);
  }

  if (kind === "seating-chair") {
    const product: Product = {
      id: "buddy-chair",
      category_id: "seating",
      series: "buddy",
      name: label,
      slug: "buddy-chair",
      images: [],
      specs: { dimensions: `${footprintL}×${footprintD}mm`, materials: [], features: [] },
      series_id: "buddy",
      series_name: "Buddy",
      created_at: "",
      sizingType: "fixed",
      defaultFootprint: { L: footprintL, D: footprintD, H: 750 },
      metadata: { category: "seating" },
    };
    return buildBlock2D(product);
  }

  if (props.furnitureType.includes("printer") || buddyItem?.tags.includes("printer")) {
    return buildGenericBlock2D("printer", footprintL, footprintD);
  }

  if (kind === "desk-workstation") {
    const seaters = buddyItem?.seatCount ?? 1;
    const lShape = isLShapedDesk(oandoItem?.shape ?? props.furnitureType);
    const sharing = isSharingCatalogItem(buddyItem) ? "sharing" : "non-sharing";
    const straightFootprint =
      !lShape && buddyItem ? straightWorkstationFootprintMm(buddyItem) : null;
    const moduleLength = buddyItem ? moduleLengthMmFromItem(buddyItem) : undefined;
    const product = syntheticProduct(
      label,
      "desks",
      straightFootprint?.L ?? footprintL,
      straightFootprint?.D ?? footprintD,
      seaters,
      lShape ? "l-shape" : "straight",
      sharing,
      isPartitionSystemItem(buddyItem) ? "partition" : "leg",
      moduleLength,
    );
    return buildBlock2D(product, {
      selection: {
        seaters,
        length: moduleLength ?? Math.max(600, Math.round(footprintL / Math.max(1, seaters))),
        depth: straightFootprint?.D ?? footprintD,
        armLength: lShape ? Math.min(650, footprintD) : undefined,
      },
    });
  }

  return buildGenericBlock2D("desk", footprintL, footprintD);
}

export function resolveBuddyBlock2D(
  shape: FurnitureShapeInput,
  oandoCatalogItem?: OandoCatalogItem,
): Block2D | null {
  const footprintL = normalizeCatalogMm(shape.props.widthMm, shape.props.heightMm);
  const footprintD = normalizeCatalogMm(shape.props.heightMm, shape.props.widthMm);
  const buddyItem = shape.props.catalogId ? findBuddyCatalogItem(shape.props.catalogId) : undefined;
  const kind = resolveFurnitureBlockKind(shape.props, oandoCatalogItem);

  return buildFromKind(kind, footprintL, footprintD, buddyItem, oandoCatalogItem, shape.props);
}

function catalogFurnitureCategory(
  category: BuddyCatalogItem["category"],
): FurnitureCategory {
  if (category === "storage") return "storage";
  if (category === "equipment") return "accessory";
  return "workstation";
}

/** Build a 2D block preview for catalog sidebar tiles and thumbnails. */
export function resolveCatalogItemBlock2D(item: BuddyCatalogItem): Block2D | null {
  const straightFootprint =
    item.category === "desks" && !isCatalogShapeType(item.shapeType, PlannerCatalogShapeType.desk)
      ? straightWorkstationFootprintMm(item)
      : null;
  const footprintL = straightFootprint?.L ?? normalizeCatalogMm(item.widthMm);
  const footprintD = straightFootprint?.D ?? normalizeCatalogMm(item.heightMm);

  if (item.category === "zones" || isCatalogShapeType(item.shapeType, PlannerCatalogShapeType.zone)) {
    return buildZoneBlock(footprintL, footprintD, item.name);
  }

  if (item.category === "rooms" || isRoomCatalogShapeType(item.shapeType)) {
    return buildRoomBlock(footprintL, footprintD, item.name);
  }

  if (item.category === "infrastructure") {
    return buildInfrastructureBlock(item, footprintL, footprintD);
  }

  const previewShape: FurnitureShapeInput = {
    props: {
      furnitureCategory: catalogFurnitureCategory(item.category),
      furnitureType: catalogShapeTypeToFurnitureType(item.shapeType),
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      depthMm: item.depthMm,
      height3dMm: 750,
      catalogId: item.id,
      productSlug: item.id,
      sku: item.id,
      productName: item.name,
      manufacturer: "Buddy",
      imageUrl: "",
      isAgainstWall: false,
      snapDistance: 0,
      showDimensions: false,
      showLabel: false,
      renderStyle: "filled",
      color: BLOCK_STYLE.surfaceStroke,
      fillColor: BLOCK_STYLE.surface,
      strokeColor: BLOCK_STYLE.surfaceStroke,
      strokeWidth: BLOCK_STYLE.surfaceStrokeWidth,
    },
  };

  return resolveBuddyBlock2D(previewShape);
}