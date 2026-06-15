/**
 * elementsToProductScene.ts
 *
 * Converts buddy canvas elements (Konva / Fabric element records)
 * into a typed ProductSceneNode tree for rendering in the product 3D preview.
 *
 * Architecture rule: This mapper is product-oriented, NOT planner wall-oriented.
 * It must never reference planner-specific element types (walls, rooms, zones).
 * For planner-to-3D mapping, see features/oando-planner/3d/usePlannerSync.ts.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductSceneNodeType =
  | "furniture"
  | "lighting"
  | "partition"
  | "surface"
  | "accessory"
  | "unknown";

export interface ProductSceneNodeMaterial {
  finish?: string;
  colorHex?: string;
  texture?: string;
}

export interface ProductSceneNode {
  id: string;
  nodeType: ProductSceneNodeType;
  /** SKU from the catalog, if the element has one */
  sku?: string;
  productId?: string;
  label: string;
  /** Canvas 2D position in pixels */
  position: { x: number; y: number };
  /** Canvas 2D size in pixels */
  size: { width: number; height: number };
  /** Rotation in radians */
  rotationRad: number;
  /** Physical dimensions derived from product metadata (mm) */
  physicalMm?: { width: number; depth: number; height: number };
  material?: ProductSceneNodeMaterial;
  visible: boolean;
  locked: boolean;
  children?: ProductSceneNode[];
  /** Raw element data for fallback use */
  _raw: Record<string, unknown>;
}

export interface ProductScene {
  nodes: ProductSceneNode[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  nodeCount: number;
  generatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Canvas element types that map to buddy product nodes */
const FURNITURE_TYPES = new Set([
  "desk",
  "hot-desk",
  "workstation",
  "table-rect",
  "table-round",
  "sofa",
  "lounge-chair",
  "coffee-table",
  "cabinet",
  "storage-cabinet",
  "file-cabinet",
  "locker",
  "credenza",
  "acoustic-pod",
  "vending-machine",
  "water-cooler",
  "coat-rack",
  "printer",
  "whiteboard",
]);

const LIGHTING_TYPES = new Set(["ceiling-light", "floor-lamp", "pendant-light", "spotlight"]);
const PARTITION_TYPES = new Set(["partition", "glass-partition", "acoustic-panel", "screen"]);
const SURFACE_TYPES = new Set(["floor-mat", "rug", "carpet-tile", "raised-floor"]);

function classifyNodeType(elementType: string): ProductSceneNodeType {
  if (FURNITURE_TYPES.has(elementType)) return "furniture";
  if (LIGHTING_TYPES.has(elementType)) return "lighting";
  if (PARTITION_TYPES.has(elementType)) return "partition";
  if (SURFACE_TYPES.has(elementType)) return "surface";
  if (elementType.endsWith("-accessory") || elementType.startsWith("accessory")) return "accessory";
  return "unknown";
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

/**
 * Maps a single raw canvas element record to a ProductSceneNode.
 * Skips invisible nodes but preserves them as visible=false for completeness.
 */
function mapElementToNode(el: Record<string, unknown>): ProductSceneNode {
  const id = String(el.id ?? "");
  const type = String(el.type ?? "unknown");
  const x = typeof el.x === "number" ? el.x : 0;
  const y = typeof el.y === "number" ? el.y : 0;
  const width = typeof el.width === "number" ? el.width : 100;
  const height = typeof el.height === "number" ? el.height : 100;
  const rotation = typeof el.rotation === "number" ? el.rotation : 0;
  const label = String(el.label ?? el.name ?? type);
  const sku = typeof el.sku === "string" ? el.sku : undefined;
  const productId = typeof el.productId === "string" ? el.productId : undefined;
  const visible = el.visible !== false;
  const locked = el.locked === true;

  // Physical dimensions from product metadata (mm), if available
  let physicalMm: ProductSceneNode["physicalMm"] | undefined;
  if (el.dimensions && typeof el.dimensions === "object") {
    const d = el.dimensions as Record<string, unknown>;
    physicalMm = {
      width: typeof d.widthMm === "number" ? d.widthMm : width * 10,
      depth: typeof d.depthMm === "number" ? d.depthMm : height * 10,
      height: typeof d.heightMm === "number" ? d.heightMm : 750,
    };
  }

  // Material / finish information
  let material: ProductSceneNodeMaterial | undefined;
  const style = el.style as Record<string, unknown> | undefined;
  if (style || el.finish) {
    material = {
      finish: typeof el.finish === "string" ? el.finish : undefined,
      colorHex: typeof style?.fill === "string" ? style.fill : undefined,
    };
  }

  return {
    id,
    nodeType: classifyNodeType(type),
    sku,
    productId,
    label,
    position: { x, y },
    size: { width, height },
    rotationRad: rotation * (Math.PI / 180),
    physicalMm,
    material,
    visible,
    locked,
    _raw: el,
  };
}

/**
 * Main mapper: converts a record map (or array) of canvas elements into
 * a typed ProductScene suitable for Three.js / R3F product preview rendering.
 *
 * @param elements - Either a Record<id, element> or an element array
 */
export function mapElementsToProductScene(
  elements: Record<string, unknown> | unknown[],
): ProductScene {
  const items: Record<string, unknown>[] = Array.isArray(elements)
    ? (elements as Record<string, unknown>[])
    : (Object.values(elements) as Record<string, unknown>[]);

  // Filter out wall / room elements — those are planner-only geometry
  const productItems = items.filter((el) => {
    const type = String(el.type ?? "");
    return type !== "wall" && type !== "room" && type !== "zone" && type !== "door" && type !== "window";
  });

  const nodes = productItems.map(mapElementToNode);

  // Compute bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    if (!node.visible) continue;
    const { x, y } = node.position;
    const { width, height } = node.size;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + width > maxX) maxX = x + width;
    if (y + height > maxY) maxY = y + height;
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 800; maxY = 600; }

  return {
    nodes,
    bounds: { minX, minY, maxX, maxY },
    nodeCount: nodes.length,
    generatedAt: new Date().toISOString(),
  };
}
