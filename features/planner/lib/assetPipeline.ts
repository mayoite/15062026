import { NodeIO } from "@gltf-transform/core";
import type { Document } from "@gltf-transform/core";

// ---------------------------------------------------------------------------
// FurnitureAsset type & registry
// ---------------------------------------------------------------------------

export interface FurnitureAsset {
  catalogId: string;
  glbUrl: string;
  thumbnailUrl?: string;
  boundingBox: { width: number; depth: number; height: number };
}

/**
 * Registry mapping catalogId -> FurnitureAsset metadata.
 * GLB/thumbnail files are served from the R2 asset CDN in production; local
 * `/models/chairs/` paths are bounding-box metadata for the dev catalog subset.
 */
export const FURNITURE_ASSET_REGISTRY: Map<string, FurnitureAsset> = new Map([
  [
    "chair-arvo",
    {
      catalogId: "chair-arvo",
      glbUrl: "/models/chairs/arvo/arvo.glb",
      thumbnailUrl: "/models/chairs/arvo/arvo-thumb.webp",
      boundingBox: { width: 0.55, depth: 0.55, height: 0.82 },
    },
  ],
  [
    "chair-canaret",
    {
      catalogId: "chair-canaret",
      glbUrl: "/models/chairs/canaret/canaret.glb",
      thumbnailUrl: "/models/chairs/canaret/canaret-thumb.webp",
      boundingBox: { width: 0.58, depth: 0.56, height: 0.80 },
    },
  ],
  [
    "chair-caneva",
    {
      catalogId: "chair-caneva",
      glbUrl: "/models/chairs/caneva/caneva.glb",
      thumbnailUrl: "/models/chairs/caneva/caneva-thumb.webp",
      boundingBox: { width: 0.52, depth: 0.54, height: 0.78 },
    },
  ],
  [
    "chair-dive",
    {
      catalogId: "chair-dive",
      glbUrl: "/models/chairs/dive/dive.glb",
      thumbnailUrl: "/models/chairs/dive/dive-thumb.webp",
      boundingBox: { width: 0.60, depth: 0.58, height: 0.76 },
    },
  ],
  [
    "chair-ember",
    {
      catalogId: "chair-ember",
      glbUrl: "/models/chairs/ember/ember.glb",
      thumbnailUrl: "/models/chairs/ember/ember-thumb.webp",
      boundingBox: { width: 0.54, depth: 0.52, height: 0.84 },
    },
  ],
]);

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

export function getAssetForCatalogId(catalogId: string): FurnitureAsset | null {
  return FURNITURE_ASSET_REGISTRY.get(catalogId) ?? null;
}

// ---------------------------------------------------------------------------
// GLB validation using @gltf-transform/core
// ---------------------------------------------------------------------------

export interface GlbValidationResult {
  valid: boolean;
  errors: string[];
  nodeCount: number;
  triangleCount: number;
}

/**
 * Loads a GLB binary buffer and inspects its structure.
 * Returns validation info including node and triangle counts.
 */
export async function validateGlbAsset(
  buffer: ArrayBuffer,
): Promise<GlbValidationResult> {
  const errors: string[] = [];
  let nodeCount = 0;
  let triangleCount = 0;

  try {
    const io = new NodeIO();
    const document: Document = await io.readBinary(new Uint8Array(buffer));
    const root = document.getRoot();

    const nodes = root.listNodes();
    nodeCount = nodes.length;

    for (const mesh of root.listMeshes()) {
      for (const primitive of mesh.listPrimitives()) {
        const indices = primitive.getIndices();
        if (indices) {
          triangleCount += indices.getCount() / 3;
        }
      }
    }

    if (nodeCount === 0) {
      errors.push("GLB contains no nodes");
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    errors.push("Failed to parse GLB: " + message);
  }

  return {
    valid: errors.length === 0,
    errors,
    nodeCount,
    triangleCount,
  };
}
