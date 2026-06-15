import React from "react";
import type { FurnitureItem } from "../data/plannerStore";
import { resolveFurniturePrimitive } from "./furniturePrimitive";
import { getMaterialPreset } from "./presets";

interface FurnitureMeshProps {
  item: FurnitureItem;
  isSelected?: boolean;
}

export function FurnitureMesh({ item, isSelected }: FurnitureMeshProps) {
  const SCALE = 0.01; // 1px = 1cm = 0.01m

  const w = item.width * SCALE;
  const d = item.height * SCALE; // 2D height corresponds to 3D depth (Z-axis)
  
  const primitive = resolveFurniturePrimitive(item);
  const category = primitive.kind;
  const h = primitive.heightM;

  const x = item.x * SCALE;
  const z = item.y * SCALE;
  const y = h / 2; // base on floor

  const angle = -(item.rotation * Math.PI) / 180; // negative due to Z-Y direction swap

  // Get material preset configuration
  const materialConfig = getMaterialPreset(item.materialPreset);
  
  // Use preset color or item color, with selection highlight
  const baseColor = materialConfig.color;
  const colorToUse = isSelected ? "var(--border-soft)" : (primitive.color || baseColor);
  
  // Get material properties from preset
  const { roughness, metalness, accentColor, accentRoughness, accentMetalness } = materialConfig;

  // Procedural models for a premium look
  const renderProceduralModel = () => {
    switch (category) {
      case "workstation":
      case "table": {
        // Render a Desk: top board + 4 legs
        const topThickness = 0.04;
        const legRadius = 0.03;
        const legHeight = h - topThickness;

        return (
          <group>
            {/* Table Top */}
            <mesh position={[0, h - topThickness / 2 - y, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, topThickness, d]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* 4 Legs */}
            <mesh position={[-w / 2 + legRadius, legHeight / 2 - y, -d / 2 + legRadius]} castShadow>
              <cylinderGeometry args={[legRadius, legRadius, legHeight, 8]} />
              <meshStandardMaterial color={accentColor || "var(--border-soft)"} metalness={accentMetalness ?? 0.8} roughness={accentRoughness ?? 0.2} />
            </mesh>
            <mesh position={[w / 2 - legRadius, legHeight / 2 - y, -d / 2 + legRadius]} castShadow>
              <cylinderGeometry args={[legRadius, legRadius, legHeight, 8]} />
              <meshStandardMaterial color={accentColor || "var(--border-soft)"} metalness={accentMetalness ?? 0.8} roughness={accentRoughness ?? 0.2} />
            </mesh>
            <mesh position={[-w / 2 + legRadius, legHeight / 2 - y, d / 2 - legRadius]} castShadow>
              <cylinderGeometry args={[legRadius, legRadius, legHeight, 8]} />
              <meshStandardMaterial color={accentColor || "var(--border-soft)"} metalness={accentMetalness ?? 0.8} roughness={accentRoughness ?? 0.2} />
            </mesh>
            <mesh position={[w / 2 - legRadius, legHeight / 2 - y, d / 2 - legRadius]} castShadow>
              <cylinderGeometry args={[legRadius, legRadius, legHeight, 8]} />
              <meshStandardMaterial color={accentColor || "var(--border-soft)"} metalness={accentMetalness ?? 0.8} roughness={accentRoughness ?? 0.2} />
            </mesh>
          </group>
        );
      }
      case "seating": {
        // Render a Chair: seat, backrest, legs
        const seatHeight = 0.45;
        const seatThickness = 0.05;

        return (
          <group>
            {/* Seat Cushion */}
            <mesh position={[0, seatHeight - y, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, seatThickness, d]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, h - (h - seatHeight) / 2 - y, -d / 2 + 0.02]} castShadow>
              <boxGeometry args={[w, h - seatHeight, 0.04]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* Legs (simplified central post + base) */}
            <mesh position={[0, seatHeight / 2 - y, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, seatHeight, 8]} />
              <meshStandardMaterial color={accentColor || "var(--text-body)"} metalness={accentMetalness ?? 0.9} roughness={accentRoughness ?? 0.1} />
            </mesh>
            <mesh position={[0, 0.01 - y, 0]} receiveShadow>
              <cylinderGeometry args={[w / 2, w / 2, 0.02, 12]} />
              <meshStandardMaterial color={accentColor || "var(--text-body)"} metalness={accentMetalness ?? 0.9} roughness={accentRoughness ?? 0.1} />
            </mesh>
          </group>
        );
      }
      case "storage": {
        // Render a Cabinet: shell + drawer dividers
        return (
          <group>
            {/* Main Cabinet Box */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* Handles/Detail on Front (positive Z) */}
            <mesh position={[0, 0.2, d / 2 + 0.01]}>
              <boxGeometry args={[w * 0.4, 0.02, 0.02]} />
              <meshStandardMaterial color={accentColor || "var(--surface-panel)"} metalness={accentMetalness ?? 0.9} roughness={accentRoughness ?? 0.1} />
            </mesh>
            <mesh position={[0, -0.2, d / 2 + 0.01]}>
              <boxGeometry args={[w * 0.4, 0.02, 0.02]} />
              <meshStandardMaterial color={accentColor || "var(--surface-panel)"} metalness={accentMetalness ?? 0.9} roughness={accentRoughness ?? 0.1} />
            </mesh>
          </group>
        );
      }
      case "softseating": {
        // Render a Sofa
        const cushionH = 0.4;
        const armrestW = 0.08;

        return (
          <group>
            {/* Main Base */}
            <mesh position={[0, cushionH / 2 - y, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, cushionH, d]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, h / 2 + cushionH / 2 - y, -d / 2 + 0.05]} castShadow>
              <boxGeometry args={[w, h - cushionH, 0.1]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* Left Armrest */}
            <mesh position={[-w / 2 + armrestW / 2, h / 2.5 - y, 0]} castShadow>
              <boxGeometry args={[armrestW, h * 0.7, d]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* Right Armrest */}
            <mesh position={[w / 2 - armrestW / 2, h / 2.5 - y, 0]} castShadow>
              <boxGeometry args={[armrestW, h * 0.7, d]} />
              <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
            </mesh>
          </group>
        );
      }
      default:
        // Standard placeholder box for other categories
        return (
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={colorToUse} roughness={roughness} metalness={metalness} />
          </mesh>
        );
    }
  };

  return (
    <group position={[x, y, z]} rotation={[0, angle, 0]}>
      {renderProceduralModel()}
    </group>
  );
}
