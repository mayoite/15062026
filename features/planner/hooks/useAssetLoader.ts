"use client";

import { useEffect, useMemo, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three-stdlib";
import { Matrix4, Mesh, type BufferGeometry, type Material } from "three";
import { loadPlannerCatalog } from "@/features/planner/shared/catalog/catalogAdapter";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";

export interface PlannerAssetRecord {
  catalogId: string;
  modelUrl: string | null;
  svgUrl: string | null;
  tint: string | null;
  dimensionsMm: {
    width: number;
    depth: number;
    height: number;
  };
}

export interface LoadedAssetPrimitive {
  key: string;
  geometry: BufferGeometry;
  material: Material;
  localMatrix: Matrix4;
  castShadow: boolean;
  receiveShadow: boolean;
}

export interface LoadedPlannerAsset extends PlannerAssetRecord {
  primitives: LoadedAssetPrimitive[];
}

export interface UseAssetLoaderOptions {
  catalogIds: readonly string[];
  catalogItems?: readonly CatalogItem[] | null;
  loadCatalog?: () => Promise<CatalogItem[]>;
}

interface UseAssetLoaderResult {
  assetsByCatalogId: Map<string, LoadedPlannerAsset>;
  catalogById: Map<string, PlannerAssetRecord>;
  isLoadingCatalog: boolean;
  missingCatalogIds: string[];
}

function toAssetRecord(item: CatalogItem): PlannerAssetRecord {
  return {
    catalogId: item.id,
    modelUrl: item.modelUrl ?? null,
    svgUrl: item.thumbnail ?? item.imageUrl ?? null,
    tint: item.color ?? null,
    dimensionsMm: {
      width: item.dimensions.widthMm,
      depth: item.dimensions.depthMm,
      height: item.dimensions.heightMm,
    },
  };
}

function buildCatalogIndex(items: readonly CatalogItem[]): Map<string, PlannerAssetRecord> {
  return new Map(items.map((item) => [item.id, toAssetRecord(item)]));
}

function extractAssetPrimitives(gltf: GLTF): LoadedAssetPrimitive[] {
  gltf.scene.updateMatrixWorld(true);
  const rootInverse = new Matrix4().copy(gltf.scene.matrixWorld).invert();
  const primitives: LoadedAssetPrimitive[] = [];

  gltf.scene.traverse((node) => {
    if (!(node instanceof Mesh) || !node.geometry) {
      return;
    }

    const material = Array.isArray(node.material) ? node.material[0] : node.material;
    if (!material) {
      return;
    }

    primitives.push({
      key: `${node.name || "mesh"}-${primitives.length}`,
      geometry: node.geometry,
      material,
      localMatrix: new Matrix4().multiplyMatrices(rootInverse, node.matrixWorld),
      castShadow: node.castShadow,
      receiveShadow: node.receiveShadow,
    });
  });

  return primitives;
}

export function useAssetLoader({
  catalogIds,
  catalogItems = null,
  loadCatalog = loadPlannerCatalog,
}: UseAssetLoaderOptions): UseAssetLoaderResult {
  const [loadedCatalog, setLoadedCatalog] = useState<readonly CatalogItem[] | null>(null);

  useEffect(() => {
    if (catalogItems) {
      return;
    }

    let cancelled = false;

    void loadCatalog()
      .then((items) => {
        if (!cancelled) {
          setLoadedCatalog(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedCatalog([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogItems, loadCatalog]);

  const runtimeCatalog = useMemo(
    () => catalogItems ?? loadedCatalog ?? [],
    [catalogItems, loadedCatalog],
  );
  const isLoadingCatalog = !catalogItems && loadedCatalog === null;

  const catalogById = useMemo(
    () => buildCatalogIndex(runtimeCatalog),
    [runtimeCatalog],
  );

  const requestedCatalogIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];

    for (const catalogId of catalogIds) {
      if (!catalogId || seen.has(catalogId)) {
        continue;
      }
      seen.add(catalogId);
      ids.push(catalogId);
    }

    return ids;
  }, [catalogIds]);

  const requestedModelUrls = useMemo(() => {
    const seen = new Set<string>();
    const urls: string[] = [];

    for (const catalogId of requestedCatalogIds) {
      const modelUrl = catalogById.get(catalogId)?.modelUrl;
      if (!modelUrl || seen.has(modelUrl)) {
        continue;
      }
      seen.add(modelUrl);
      urls.push(modelUrl);
    }

    return urls;
  }, [catalogById, requestedCatalogIds]);

  useEffect(() => {
    requestedModelUrls.forEach((modelUrl) => {
      useGLTF.preload(modelUrl);
    });
  }, [requestedModelUrls]);

  const gltfList = useLoader(GLTFLoader, requestedModelUrls) as unknown as GLTF[];

  const assetsByCatalogId = useMemo(() => {
    const primitivesByUrl = new Map<string, LoadedAssetPrimitive[]>();

    requestedModelUrls.forEach((modelUrl, index) => {
      const gltf = gltfList[index];
      if (!gltf) {
        return;
      }
      primitivesByUrl.set(modelUrl, extractAssetPrimitives(gltf));
    });

    const resolvedAssets = new Map<string, LoadedPlannerAsset>();
    requestedCatalogIds.forEach((catalogId) => {
      const asset = catalogById.get(catalogId);
      if (!asset?.modelUrl) {
        return;
      }

      resolvedAssets.set(catalogId, {
        ...asset,
        primitives: primitivesByUrl.get(asset.modelUrl) ?? [],
      });
    });

    return resolvedAssets;
  }, [catalogById, gltfList, requestedCatalogIds, requestedModelUrls]);

  const missingCatalogIds = useMemo(
    () => requestedCatalogIds.filter((catalogId) => !catalogById.has(catalogId)),
    [catalogById, requestedCatalogIds],
  );

  return {
    assetsByCatalogId,
    catalogById,
    isLoadingCatalog,
    missingCatalogIds,
  };
}
