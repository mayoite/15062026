"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import type { ThreeEvent} from "@react-three/fiber";
import { useThree, useFrame } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { resolveMesh } from "./meshes/resolveMesh";
import { DEFAULT_PALETTE } from "./meshes/types";
import { usePlannerR3FStore, type PlacedItem } from "./usePlannerR3FStore";
import { calculateMagneticSnap, type SnapResult } from "./lib/r3fSnapEngine";

type TransformControlsRef = {
  addEventListener(type: string, listener: (event: { value: boolean }) => void): void;
  removeEventListener(type: string, listener: (event: { value: boolean }) => void): void;
};

function snapValue(val: number, gridM: number, enabled: boolean): number {
  if (!enabled || gridM <= 0) return val;
  return Math.round(val / gridM) * gridM;
}

function snapAngle(radians: number, angleDeg: number, enabled: boolean): number {
  if (!enabled || angleDeg <= 0) return radians;
  const step = (angleDeg * Math.PI) / 180;
  return Math.round(radians / step) * step;
}

function wallSnap(
  pos: number,
  itemHalf: number,
  roomSize: number,
  threshold: number,
): number {
  if (pos - itemHalf < threshold) return itemHalf;
  if (pos + itemHalf > roomSize - threshold) return roomSize - itemHalf;
  return pos;
}

function FurnitureItem({ item }: { item: PlacedItem }) {
  const groupRef = useRef<THREE.Group>(null);
  const transformRef = useRef<TransformControlsRef | null>(null);
  const selectedId = usePlannerR3FStore((s) => s.selectedId);
  const selectedIds = usePlannerR3FStore((s) => s.selectedIds);
  const items = usePlannerR3FStore((s) => s.items);
  const transformMode = usePlannerR3FStore((s) => s.transformMode);
  const snapEnabled = usePlannerR3FStore((s) => s.snapEnabled);
  const snapGridMm = usePlannerR3FStore((s) => s.snapGridMm);
  const snapAngleDeg = usePlannerR3FStore((s) => s.snapAngleDeg);
  const magneticSnapEnabled = usePlannerR3FStore((s) => s.magneticSnapEnabled);
  const magneticSnapThresholdMm = usePlannerR3FStore((s) => s.magneticSnapThresholdMm);
  const wallRotationSnapEnabled = usePlannerR3FStore((s) => s.wallRotationSnapEnabled);
  const room = usePlannerR3FStore((s) => s.room);
  const updateItem = usePlannerR3FStore((s) => s.updateItem);
  const setSelectedId = usePlannerR3FStore((s) => s.setSelectedId);
  const toggleSelectId = usePlannerR3FStore((s) => s.toggleSelectId);
  const cameraMode = usePlannerR3FStore((s) => s.cameraMode);
  
  const [isDragging, setDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [snapPreview, setSnapPreview] = useState<SnapResult | null>(null);
  const dragStartPos = useRef<[number, number, number] | null>(null);

  const isSelected = selectedId === item.id || selectedIds.includes(item.id);
  const isPrimary = selectedId === item.id;
  const gridM = snapGridMm / 1000;
  const roomW = room.widthMm / 1000;
  const roomD = room.depthMm / 1000;
  const WALL_SNAP_THRESHOLD = 0.15;

  const dims = {
    width: item.widthMm / 1000,
    depth: item.depthMm / 1000,
    height: item.heightMm / 1000,
  };

  const palette = item.color
    ? { ...DEFAULT_PALETTE, primary: item.color }
    : DEFAULT_PALETTE;

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.nativeEvent.shiftKey) {
        toggleSelectId(item.id);
      } else {
        setSelectedId(item.id);
      }
    },
    [item.id, setSelectedId, toggleSelectId],
  );

  useEffect(() => {
    const ctrl = transformRef.current;
    if (!ctrl) return;

    const onDragStart = () => {
      setDragging(true);
      isDraggingRef.current = true;
      dragStartPos.current = [...item.position];
    };
    
    const onDragEnd = () => {
      setDragging(false);
      isDraggingRef.current = false;
      setSnapPreview(null);
      const group = groupRef.current;
      if (!group) return;

      const pos = group.position;
      let snappedX = pos.x;
      let snappedZ = pos.z;
      let snappedRy = group.rotation.y;

      // Magnetic Snapping takes precedence if enabled and found
      let usedMagnetic = false;
      if (magneticSnapEnabled) {
        const snap = calculateMagneticSnap(
          pos.x, pos.z, dims.width * 1000, dims.depth * 1000, group.rotation.y,
          item.id, items, room, magneticSnapThresholdMm, wallRotationSnapEnabled
        );
        if (snap.snapType) {
          snappedX = snap.snappedX;
          snappedZ = snap.snappedZ;
          if (snap.snappedRotation !== null) {
            snappedRy = snap.snappedRotation;
          }
          usedMagnetic = true;
        }
      }

      if (!usedMagnetic) {
        snappedX = snapValue(pos.x, gridM, snapEnabled);
        snappedZ = snapValue(pos.z, gridM, snapEnabled);
        snappedRy = snapAngle(group.rotation.y, snapAngleDeg, snapEnabled);
      }

      snappedX = wallSnap(snappedX, dims.width / 2, roomW, WALL_SNAP_THRESHOLD);
      snappedZ = wallSnap(snappedZ, dims.depth / 2, roomD, WALL_SNAP_THRESHOLD);

      snappedX = Math.max(dims.width / 2, Math.min(roomW - dims.width / 2, snappedX));
      snappedZ = Math.max(dims.depth / 2, Math.min(roomD - dims.depth / 2, snappedZ));

      const deltaX = dragStartPos.current ? snappedX - dragStartPos.current[0] : 0;
      const deltaZ = dragStartPos.current ? snappedZ - dragStartPos.current[2] : 0;

      updateItem(item.id, {
        position: [snappedX, 0, snappedZ],
        rotation: snappedRy,
      });

      if (selectedIds.length > 1 && (deltaX !== 0 || deltaZ !== 0)) {
        const otherIds = selectedIds.filter((sid) => sid !== item.id);
        for (const otherId of otherIds) {
          const other = items.find((i) => i.id === otherId);
          if (other) {
            const halfW = (other.widthMm / 1000) / 2;
            const halfD = (other.depthMm / 1000) / 2;
            let newX = other.position[0] + deltaX;
            let newZ = other.position[2] + deltaZ;
            newX = wallSnap(newX, halfW, roomW, WALL_SNAP_THRESHOLD);
            newZ = wallSnap(newZ, halfD, roomD, WALL_SNAP_THRESHOLD);
            newX = Math.max(halfW, Math.min(roomW - halfW, newX));
            newZ = Math.max(halfD, Math.min(roomD - halfD, newZ));
            updateItem(otherId, { position: [newX, 0, newZ] });
          }
        }
      }

      group.position.set(snappedX, 0, snappedZ);
      group.rotation.y = snappedRy;
      dragStartPos.current = null;
    };

    const onChange = () => {
      if (!isDraggingRef.current) return;
      if (!magneticSnapEnabled) return;
      const group = groupRef.current;
      if (!group) return;

      const snap = calculateMagneticSnap(
        group.position.x, group.position.z, dims.width * 1000, dims.depth * 1000, group.rotation.y,
        item.id, items, room, magneticSnapThresholdMm, wallRotationSnapEnabled
      );
      setSnapPreview(snap.snapType ? snap : null);
    };

    const onDraggingChanged = (event: { value: boolean }) => {
      if (event.value) onDragStart();
      else onDragEnd();
    };

    ctrl.addEventListener("dragging-changed", onDraggingChanged);
    ctrl.addEventListener("change", onChange);

    return () => {
      ctrl.removeEventListener("dragging-changed", onDraggingChanged);
      ctrl.removeEventListener("change", onChange);
    };
  }, [item.id, item.position, gridM, snapEnabled, snapAngleDeg, updateItem, dims.width, dims.depth, room, roomW, roomD, WALL_SNAP_THRESHOLD, selectedIds, items, magneticSnapEnabled, magneticSnapThresholdMm, wallRotationSnapEnabled]);

  const selectionColor = isPrimary ? "#3b82f6" : "#94a3b8";

  return (
    <>
      <group
        ref={groupRef}
        position={item.position}
        rotation={[0, item.rotation, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        {resolveMesh(item.meshType, dims, palette)}
        {isSelected && (
          <mesh position={[0, dims.height / 2, 0]}>
            <boxGeometry args={[dims.width + 0.02, dims.height + 0.02, dims.depth + 0.02]} />
            <meshBasicMaterial color={selectionColor} wireframe transparent opacity={0.4} />
          </mesh>
        )}
      </group>

      {/* Magnetic Snap Preview Ghost Mesh */}
      {isDragging && snapPreview && (
        <group
          position={[snapPreview.snappedX, 0, snapPreview.snappedZ]}
          rotation={[0, snapPreview.snappedRotation ?? item.rotation, 0]}
        >
          <mesh position={[0, dims.height / 2, 0]}>
            <boxGeometry args={[dims.width + 0.02, dims.height + 0.02, dims.depth + 0.02]} />
            <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {isPrimary && cameraMode !== "walk" && (
        <TransformControls
          ref={transformRef as React.RefObject<never>}
          object={groupRef as React.RefObject<THREE.Object3D>}
          mode={transformMode}
          translationSnap={snapEnabled ? gridM : undefined}
          rotationSnap={snapEnabled ? (snapAngleDeg * Math.PI) / 180 : undefined}
          showY={false}
          showX={transformMode === "translate"}
          showZ={transformMode === "translate" || transformMode === "rotate"}
          size={0.8}
        />
      )}
    </>
  );
}

function GhostPreview() {
  const ghostItem = usePlannerR3FStore((s) => s.ghostItem);
  const addItem = usePlannerR3FStore((s) => s.addItem);
  const setGhostItem = usePlannerR3FStore((s) => s.setGhostItem);
  const room = usePlannerR3FStore((s) => s.room);
  const items = usePlannerR3FStore((s) => s.items);
  const magneticSnapEnabled = usePlannerR3FStore((s) => s.magneticSnapEnabled);
  const magneticSnapThresholdMm = usePlannerR3FStore((s) => s.magneticSnapThresholdMm);
  const wallRotationSnapEnabled = usePlannerR3FStore((s) => s.wallRotationSnapEnabled);

  const groupRef = useRef<THREE.Group>(null);
  const { raycaster, camera, pointer } = useThree();
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersection = useRef(new THREE.Vector3());
  const [snapPreview, setSnapPreview] = useState<SnapResult | null>(null);

  useFrame(() => {
    if (!ghostItem || !groupRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(floorPlane.current, intersection.current);
    if (hit) {
      const roomW = room.widthMm / 1000;
      const roomD = room.depthMm / 1000;
      const halfW = (ghostItem.widthMm / 1000) / 2;
      const halfD = (ghostItem.depthMm / 1000) / 2;
      let x = Math.max(halfW, Math.min(roomW - halfW, hit.x));
      let z = Math.max(halfD, Math.min(roomD - halfD, hit.z));
      let r = 0;

      if (magneticSnapEnabled) {
        const snap = calculateMagneticSnap(
          x, z, ghostItem.widthMm, ghostItem.depthMm, 0,
          null, items, room, magneticSnapThresholdMm, wallRotationSnapEnabled
        );
        if (snap.snapType) {
          x = snap.snappedX;
          z = snap.snappedZ;
          if (snap.snappedRotation !== null) {
             r = snap.snappedRotation;
          }
          setSnapPreview(snap);
        } else {
          setSnapPreview(null);
        }
      } else {
         setSnapPreview(null);
      }

      groupRef.current.position.set(x, 0, z);
      groupRef.current.rotation.set(0, r, 0);
    }
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (!ghostItem || !groupRef.current) return;
      const pos = groupRef.current.position;
      const roomW = room.widthMm / 1000;
      const roomD = room.depthMm / 1000;
      const halfW = (ghostItem.widthMm / 1000) / 2;
      const halfD = (ghostItem.depthMm / 1000) / 2;
      const px = Math.max(halfW, Math.min(roomW - halfW, pos.x));
      const pz = Math.max(halfD, Math.min(roomD - halfD, pos.z));
      const r = groupRef.current.rotation.y;
      
      addItem({
        catalogId: ghostItem.catalogId,
        name: ghostItem.name,
        category: ghostItem.category,
        meshType: ghostItem.meshType,
        widthMm: ghostItem.widthMm,
        depthMm: ghostItem.depthMm,
        heightMm: ghostItem.heightMm,
        position: [px, 0, pz],
        rotation: r,
        color: ghostItem.color,
      });
    },
    [ghostItem, addItem, room],
  );

  const handleRightClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      e.nativeEvent.preventDefault();
      setGhostItem(null);
    },
    [setGhostItem],
  );

  if (!ghostItem) return null;

  const dims = {
    width: ghostItem.widthMm / 1000,
    depth: ghostItem.depthMm / 1000,
    height: ghostItem.heightMm / 1000,
  };

  const palette = ghostItem.color
    ? { ...DEFAULT_PALETTE, primary: ghostItem.color }
    : DEFAULT_PALETTE;

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      <group scale={[1, 1, 1]}>
        {resolveMesh(ghostItem.meshType, dims, palette)}
        <mesh position={[0, dims.height / 2, 0]}>
          <boxGeometry args={[dims.width + 0.01, dims.height + 0.01, dims.depth + 0.01]} />
          <meshBasicMaterial color={snapPreview ? "#10b981" : "#3b82f6"} transparent opacity={snapPreview ? 0.4 : 0.2} />
        </mesh>
      </group>
    </group>
  );
}

export function FurnitureLayer() {
  const items = usePlannerR3FStore((s) => s.items);
  const clearSelection = usePlannerR3FStore((s) => s.clearSelection);
  const setGhostItem = usePlannerR3FStore((s) => s.setGhostItem);
  const ghostItem = usePlannerR3FStore((s) => s.ghostItem);

  const handleBgClick = useCallback(() => {
    if (ghostItem) {
      setGhostItem(null);
    } else {
      clearSelection();
    }
  }, [clearSelection, setGhostItem, ghostItem]);

  return (
    <group onPointerMissed={handleBgClick}>
      {items.map((item) => (
        <FurnitureItem key={item.id} item={item} />
      ))}
      <GhostPreview />
    </group>
  );
}
