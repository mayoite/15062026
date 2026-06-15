"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Color,
  DynamicDrawUsage,
  Matrix4,
  Object3D,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
} from "three";
import type { CatalogCategory } from "../catalog/catalogTypes";
import { useAssetLoader, type LoadedPlannerAsset, type LoadedAssetPrimitive } from "../hooks/useAssetLoader";
import { FurnitureMesh } from "./FurnitureMesh3D";
import type { PlannerViewerShape } from "./PlannerViewer";
import { CANVAS_UNITS_TO_M } from "./viewerFraming";
import { resolveFurnitureKind } from "./viewerMaterials";

interface FurnitureRenderRecord {
  id: string;
  catalogId: string;
  widthM: number;
  depthM: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
  label?: string;
  category?: CatalogCategory;
}

interface PrimitiveGroup {
  key: string;
  asset: LoadedPlannerAsset;
  primitive: LoadedAssetPrimitive;
  items: FurnitureRenderRecord[];
}

const MODEL_OBJECT = new Object3D();
const COMPOSED_MATRIX = new Matrix4();
const INSTANCE_COLOR = new Color();

function toFurnitureRecord(shape: PlannerViewerShape): FurnitureRenderRecord | null {
  if (!shape.catalogId) {
    return null;
  }

  const widthM = Math.max(shape.width * CANVAS_UNITS_TO_M, 0.1);
  const depthM = Math.max(shape.height * CANVAS_UNITS_TO_M, 0.1);

  return {
    id: shape.id,
    catalogId: shape.catalogId,
    widthM,
    depthM,
    position: [
      (shape.x + shape.width / 2) * CANVAS_UNITS_TO_M,
      0,
      (shape.y + shape.height / 2) * CANVAS_UNITS_TO_M,
    ],
    rotation: [0, (-(shape.rotation || 0) * Math.PI) / 180, 0],
    color: shape.color,
    label: shape.label,
    category: shape.category,
  };
}

function buildPrimitiveGroups(
  items: readonly FurnitureRenderRecord[],
  assetsByCatalogId: Map<string, LoadedPlannerAsset>,
): PrimitiveGroup[] {
  const groups = new Map<string, PrimitiveGroup>();

  items.forEach((item) => {
    const asset = assetsByCatalogId.get(item.catalogId);
    if (!asset || asset.primitives.length === 0) {
      return;
    }

    asset.primitives.forEach((primitive) => {
      const key = `${item.catalogId}:${primitive.key}`;
      const current = groups.get(key);
      if (current) {
        current.items.push(item);
        return;
      }

      groups.set(key, {
        key,
        asset,
        primitive,
        items: [item],
      });
    });
  });

  return Array.from(groups.values());
}

function FurnitureFallback({ shape }: { shape: PlannerViewerShape }) {
  const cx = (shape.x + shape.width / 2) * CANVAS_UNITS_TO_M;
  const cz = (shape.y + shape.height / 2) * CANVAS_UNITS_TO_M;
  const w = Math.max(shape.width * CANVAS_UNITS_TO_M, 0.1);
  const d = Math.max(shape.height * CANVAS_UNITS_TO_M, 0.1);
  const rad = (-(shape.rotation || 0) * Math.PI) / 180;
  const kind = resolveFurnitureKind(shape.label, shape.category, w, d);

  return (
    <group position={[cx, 0, cz]} rotation={[0, rad, 0]}>
      <FurnitureMesh width={w} depth={d} label={shape.label} color={shape.color} kind={kind} />
    </group>
  );
}

function InstancedPrimitiveGroup({ group }: { group: PrimitiveGroup }) {
  const meshRef = useRef<InstancedMesh<BufferGeometry, Material | Material[]>>(null);
  const hasTint = useMemo(
    () => group.items.some((item) => Boolean(item.color)),
    [group.items],
  );
  const material = useMemo(() => {
    const nextMaterial = group.primitive.material.clone();
    if ("vertexColors" in nextMaterial) {
      nextMaterial.vertexColors = hasTint;
    }
    return nextMaterial;
  }, [group.primitive.material, hasTint]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    mesh.instanceMatrix.setUsage(DynamicDrawUsage);

    group.items.forEach((item, index) => {
      const assetWidthM = Math.max(group.asset.dimensionsMm.width / 1000, 0.001);
      const assetDepthM = Math.max(group.asset.dimensionsMm.depth / 1000, 0.001);
      const scaleX = item.widthM / assetWidthM;
      const scaleZ = item.depthM / assetDepthM;
      const scaleY = (scaleX + scaleZ) / 2;

      MODEL_OBJECT.position.set(...item.position);
      MODEL_OBJECT.rotation.set(...item.rotation);
      MODEL_OBJECT.scale.set(scaleX, scaleY, scaleZ);
      MODEL_OBJECT.updateMatrix();

      COMPOSED_MATRIX.multiplyMatrices(MODEL_OBJECT.matrix, group.primitive.localMatrix);
      mesh.setMatrixAt(index, COMPOSED_MATRIX);

      if (hasTint) {
        INSTANCE_COLOR.set(item.color ?? "#ffffff");
        mesh.setColorAt(index, INSTANCE_COLOR);
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (hasTint && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [group, hasTint]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[group.primitive.geometry, material, group.items.length]}
      castShadow={group.primitive.castShadow}
      receiveShadow={group.primitive.receiveShadow}
    />
  );
}

export function InstancedFurnitureRenderer({ shapes }: { shapes: PlannerViewerShape[] }) {
  const instanceCandidates = useMemo(
    () => shapes.map(toFurnitureRecord).filter((item): item is FurnitureRenderRecord => item !== null),
    [shapes],
  );
  const { assetsByCatalogId } = useAssetLoader({
    catalogIds: instanceCandidates.map((item) => item.catalogId),
  });

  const groupedInstances = useMemo(
    () => buildPrimitiveGroups(instanceCandidates, assetsByCatalogId),
    [assetsByCatalogId, instanceCandidates],
  );

  const renderedCatalogIds = useMemo(
    () => new Set(groupedInstances.map((group) => group.asset.catalogId)),
    [groupedInstances],
  );

  const fallbackShapes = useMemo(
    () =>
      shapes.filter(
        (shape) => shape.type === "planner-furniture" && (!shape.catalogId || !renderedCatalogIds.has(shape.catalogId)),
      ),
    [renderedCatalogIds, shapes],
  );

  return (
    <group>
      {groupedInstances.map((group) => (
        <InstancedPrimitiveGroup key={group.key} group={group} />
      ))}
      {fallbackShapes.map((shape) => (
        <FurnitureFallback key={shape.id} shape={shape} />
      ))}
    </group>
  );
}
